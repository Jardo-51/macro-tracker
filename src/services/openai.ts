import type { Macros, MenuRecommendation } from '@/types'

export async function estimateMacros(foodName: string, apiKey: string): Promise<Macros> {
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
      messages: [
        {
          role: 'system',
          content:
            'You are a nutrition expert. The user will give you a food name. ' +
            'Return a JSON object with estimated macronutrients for a typical single serving. ' +
            'The object must have exactly these numeric fields: ' +
            '"calories" (kcal), "protein" (g), "carbsTotal" (g), "carbsFiber" (g), "carbsSugar" (g), "fat" (g). ' +
            'Return only the JSON object, no extra text.',
        },
        {
          role: 'user',
          content: foodName,
        },
      ],
    }),
    })
  } catch (e: any) {
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

  const parsed = JSON.parse(content)
  const fields = ['calories', 'protein', 'carbsTotal', 'carbsFiber', 'carbsSugar', 'fat'] as const
  for (const field of fields) {
    if (typeof parsed[field] !== 'number') {
      throw new Error(`Invalid response: missing or non-numeric "${field}"`)
    }
  }

  return {
    calories: Math.round(parsed.calories),
    protein: Math.round(parsed.protein),
    carbsTotal: Math.round(parsed.carbsTotal),
    carbsFiber: Math.round(parsed.carbsFiber),
    carbsSugar: Math.round(parsed.carbsSugar),
    fat: Math.round(parsed.fat),
  }
}

export async function recommendFromMenu(
  menuText: string,
  remainingMacros: { calories: number; protein: number; carbsTotal: number; fat: number },
  apiKey: string,
): Promise<MenuRecommendation> {
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
        messages: [
          {
            role: 'system',
            content:
              'You are a nutrition expert. The user will give you a restaurant menu and their remaining daily macro budget. ' +
              'The menu may contain soups (optional) and main courses. It may be in any language or format. ' +
              'Recommend the best soup (if soups are available) and main course to help the user meet their remaining macro goals in a healthy, balanced way. ' +
              'If the remaining budget is very low or negative, recommend the lightest options. ' +
              'Return a JSON object with this exact shape: ' +
              '{ "soup": { "name": string, "reasoning": string (1-2 sentences), "macros": { "calories": number, "protein": number, "carbsTotal": number, "carbsFiber": number, "carbsSugar": number, "fat": number } } | null, ' +
              '"mainCourse": { "name": string, "reasoning": string (1-2 sentences), "macros": { "calories": number, "protein": number, "carbsTotal": number, "carbsFiber": number, "carbsSugar": number, "fat": number } }, ' +
              '"combinedMacros": { "calories": number, "protein": number, "carbsTotal": number, "carbsFiber": number, "carbsSugar": number, "fat": number } }. ' +
              'Set "soup" to null if no soups are on the menu. "combinedMacros" should sum the macros of both items (or just mainCourse if soup is null). ' +
              'All macro values should be estimated numbers for a typical restaurant serving.',
          },
          {
            role: 'user',
            content:
              `Remaining daily macros: ${remainingMacros.calories} kcal, ${remainingMacros.protein}g protein, ${remainingMacros.carbsTotal}g carbs, ${remainingMacros.fat}g fat.\n\n` +
              `Restaurant menu:\n${menuText}`,
          },
        ],
      }),
    })
  } catch (e: any) {
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

  const parsed = JSON.parse(content)

  const macroFields = ['calories', 'protein', 'carbsTotal', 'carbsFiber', 'carbsSugar', 'fat'] as const

  function validateMacros(obj: any, label: string): void {
    for (const field of macroFields) {
      if (typeof obj[field] !== 'number') {
        throw new Error(`Invalid response: missing or non-numeric "${field}" in ${label}`)
      }
    }
  }

  function roundMacros(obj: any): { calories: number; protein: number; carbsTotal: number; carbsFiber: number; carbsSugar: number; fat: number } {
    return {
      calories: Math.round(obj.calories),
      protein: Math.round(obj.protein),
      carbsTotal: Math.round(obj.carbsTotal),
      carbsFiber: Math.round(obj.carbsFiber),
      carbsSugar: Math.round(obj.carbsSugar),
      fat: Math.round(obj.fat),
    }
  }

  if (!parsed.mainCourse || typeof parsed.mainCourse.name !== 'string') {
    throw new Error('Invalid response: missing mainCourse')
  }
  validateMacros(parsed.mainCourse.macros, 'mainCourse')
  validateMacros(parsed.combinedMacros, 'combinedMacros')

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

  return {
    soup,
    mainCourse: {
      name: parsed.mainCourse.name,
      reasoning: parsed.mainCourse.reasoning || '',
      macros: roundMacros(parsed.mainCourse.macros),
    },
    combinedMacros: roundMacros(parsed.combinedMacros),
  }
}
