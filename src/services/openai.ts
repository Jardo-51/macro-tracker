import type { Macros } from '@/types'

export async function estimateMacros(foodName: string, apiKey: string): Promise<Macros> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
