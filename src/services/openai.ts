import type { Macros, MenuRecommendation, SnackSuggestion } from '@/types'
import { addMacros } from '@/utils/macros'

type TextPart = { type: 'text'; text: string }
type ImagePart = { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }
type MessageContent = string | Array<TextPart | ImagePart>

interface ChatMessage {
  role: 'system' | 'user'
  content: MessageContent
}

export interface LabelExtractResult {
  macros: Macros
  servingSize?: number
  servingUnit?: string
}

const MACRO_FIELDS = ['calories', 'protein', 'carbsTotal', 'carbsFiber', 'carbsSugar', 'fat'] as const

async function chatCompletion(messages: ChatMessage[], apiKey: string): Promise<any> {
  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages,
      }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch (e: any) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      throw new Error('The request timed out. Check your internet connection and try again.')
    }
    throw new Error(`Network error: ${e.message}. Check your internet connection or try a different network.`)
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key. Check your OpenAI key in Settings.')
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Check your OpenAI billing/quota and try again later.')
    }
    throw new Error(`OpenAI request failed (${response.status})`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Unexpected response from OpenAI')
  }

  return JSON.parse(content)
}

function validateMacros(obj: any, label: string): void {
  for (const field of MACRO_FIELDS) {
    if (typeof obj[field] !== 'number') {
      throw new Error(`Invalid response: missing or non-numeric "${field}" in ${label}`)
    }
  }
}

function roundMacros(obj: any): Macros {
  return {
    calories: Math.round(obj.calories),
    protein: Math.round(obj.protein),
    carbsTotal: Math.round(obj.carbsTotal),
    carbsFiber: Math.round(obj.carbsFiber),
    carbsSugar: Math.round(obj.carbsSugar),
    fat: Math.round(obj.fat),
  }
}

export async function estimateMacros(foodName: string, apiKey: string): Promise<Macros> {
  const parsed = await chatCompletion([
    {
      role: 'system',
      content:
        'You are a nutrition expert. The user will give you a food name. ' +
        'Return a JSON object with estimated macronutrients for a typical single serving. ' +
        'The object must have exactly these numeric fields: ' +
        '"calories" (kcal), "protein" (g), "carbsTotal" (g), "carbsFiber" (g), "carbsSugar" (g), "fat" (g). ' +
        'Return only the JSON object, no extra text.',
    },
    { role: 'user', content: foodName },
  ], apiKey)

  validateMacros(parsed, 'response')
  return roundMacros(parsed)
}

export async function recommendFromMenu(
  menuText: string,
  remainingMacros: { calories: number; protein: number; carbsTotal: number; fat: number },
  apiKey: string,
): Promise<MenuRecommendation> {
  const parsed = await chatCompletion([
    {
      role: 'system',
      content:
        'You are a nutrition expert. The user will give you a restaurant menu and their remaining daily macro budget. ' +
        'The menu may contain soups (optional) and main courses. It may be in any language or format. ' +
        'Recommend the best soup (if soups are available) and main course that contribute the most towards filling the remaining macro budget. ' +
        'Prefer meals that are high in calories and protein to maximize progress towards the daily goal, while still being reasonably healthy. ' +
        'Only recommend lighter options if the remaining budget is very low or negative. ' +
        'Return a JSON object with this exact shape: ' +
        '{ "soup": { "name": string, "reasoning": string (1-2 sentences), "macros": { "calories": number, "protein": number, "carbsTotal": number, "carbsFiber": number, "carbsSugar": number, "fat": number } } | null, ' +
        '"mainCourse": { "name": string, "reasoning": string (1-2 sentences), "macros": { "calories": number, "protein": number, "carbsTotal": number, "carbsFiber": number, "carbsSugar": number, "fat": number } } }. ' +
        'Set "soup" to null if no soups are on the menu. ' +
        'All macro values should be estimated numbers for a typical restaurant serving.',
    },
    {
      role: 'user',
      content:
        `Remaining daily macros: ${remainingMacros.calories} kcal, ${remainingMacros.protein}g protein, ${remainingMacros.carbsTotal}g carbs, ${remainingMacros.fat}g fat.\n\n` +
        `Restaurant menu:\n${menuText}`,
    },
  ], apiKey)

  if (!parsed.mainCourse || typeof parsed.mainCourse.name !== 'string') {
    throw new Error('Invalid response: missing mainCourse')
  }
  validateMacros(parsed.mainCourse.macros, 'mainCourse')

  let soup = null
  if (parsed.soup) {
    if (typeof parsed.soup.name !== 'string') {
      throw new Error('Invalid response: soup missing name')
    }
    validateMacros(parsed.soup.macros, 'soup')
    soup = {
      name: parsed.soup.name,
      reasoning: parsed.soup.reasoning || '',
      macros: roundMacros(parsed.soup.macros),
    }
  }

  const mainCourse = {
    name: parsed.mainCourse.name,
    reasoning: parsed.mainCourse.reasoning || '',
    macros: roundMacros(parsed.mainCourse.macros),
  }

  const combinedMacros: Macros = soup
    ? addMacros(mainCourse.macros, soup.macros)
    : { ...mainCourse.macros }

  return {
    soup,
    mainCourse,
    combinedMacros,
  }
}

export async function suggestSnacks(
  remainingMacros: { calories: number; protein: number; carbsTotal: number; fat: number },
  apiKey: string,
): Promise<SnackSuggestion[]> {
  const parsed = await chatCompletion([
    {
      role: 'system',
      content:
        'You are a nutrition expert. The user will give you their remaining daily macro budget. ' +
        'Suggest 3 to 5 healthy snacks that would help them reach their goals for the day. ' +
        'Prefer snacks that are high in protein and fill the remaining calorie budget without going too far over. ' +
        'Return a JSON object with a single key "snacks" whose value is an array. ' +
        'Each element must have: "name" (string), "reasoning" (string, 1-2 sentences that MUST start with the specific portion size the macros are estimated for), and "macros" ({ "calories": number, "protein": number, "carbsTotal": number, "carbsFiber": number, "carbsSugar": number, "fat": number }). ' +
        'All macro values should be realistic estimates for the stated portion size.',
    },
    {
      role: 'user',
      content: `Remaining daily macros: ${remainingMacros.calories} kcal, ${remainingMacros.protein}g protein, ${remainingMacros.carbsTotal}g carbs, ${remainingMacros.fat}g fat.`,
    },
  ], apiKey)

  if (!Array.isArray(parsed.snacks) || parsed.snacks.length === 0) {
    throw new Error('Invalid response: missing snacks array')
  }

  return parsed.snacks.map((s: any, i: number) => {
    if (typeof s.name !== 'string') {
      throw new Error(`Invalid response: snack ${i} missing name`)
    }
    validateMacros(s.macros, `snack "${s.name}"`)
    return {
      name: s.name,
      reasoning: s.reasoning || '',
      macros: roundMacros(s.macros),
    } satisfies SnackSuggestion
  })
}

export async function extractMacrosFromLabelImage(
  imageDataUrl: string,
  apiKey: string,
): Promise<LabelExtractResult> {
  const parsed = await chatCompletion([
    {
      role: 'system',
      content:
        'You are a nutrition-label OCR assistant. The user will send a photo of a food product\'s nutrition label (any language, any region). ' +
        'Extract the macronutrients per single serving as listed on the label. ' +
        'Rules: ' +
        '(1) If the label shows both "per 100g" and "per serving" columns, use the per-serving column. ' +
        '(2) If only "per 100g" (or per 100ml) is shown, return those values and set servingSize=100 with servingUnit="g" (or "ml"). ' +
        '(3) Convert kJ to kcal (kcal = kJ / 4.184) when calories are only given in kJ. ' +
        '(4) Treat "<1g", "trace", "—", "-", or missing entries as 0. ' +
        '(5) If fiber or sugar is not listed at all, return 0 for that field; do not guess. ' +
        '(6) Round all macro values to the nearest integer. ' +
        '(7) Extract serving size as a number plus unit if visible (e.g., "30 g" → servingSize: 30, servingUnit: "g"); omit those fields if unclear. ' +
        '(8) If the image is not a nutrition label, is unreadable, or is missing calories AND protein AND fat, respond with {"error": "<short reason>"} instead. ' +
        'Return ONLY a JSON object with this shape: ' +
        '{ "calories": number, "protein": number, "carbsTotal": number, "carbsFiber": number, "carbsSugar": number, "fat": number, "servingSize"?: number, "servingUnit"?: string }.',
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Extract macros from this nutrition label.' },
        { type: 'image_url', image_url: { url: imageDataUrl, detail: 'low' } },
      ],
    },
  ], apiKey)

  if (typeof parsed?.error === 'string') {
    throw new Error(`Couldn't read label: ${parsed.error}. Try better lighting or a closer shot.`)
  }

  for (const field of MACRO_FIELDS) {
    if (typeof parsed[field] !== 'number') parsed[field] = 0
  }
  const result: LabelExtractResult = { macros: roundMacros(parsed) }
  if (typeof parsed.servingSize === 'number' && parsed.servingSize > 0) {
    result.servingSize = Math.round(parsed.servingSize)
  }
  if (typeof parsed.servingUnit === 'string' && parsed.servingUnit.trim()) {
    result.servingUnit = parsed.servingUnit.trim()
  }
  return result
}
