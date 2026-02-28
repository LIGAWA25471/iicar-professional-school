import { streamText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { title, description, level, duration_weeks, type } = await request.json()

  if (!title) return new Response('title is required', { status: 400 })

  const systemPrompt = `You are an expert curriculum designer for professional certification programs. 
You generate structured, practical, and comprehensive course content tailored for working professionals in Africa and globally.
Always respond with valid JSON only — no markdown fences, no extra text.`

  let userPrompt = ''

  if (type === 'modules') {
    userPrompt = `Generate a complete module breakdown for this professional certification program:

Title: ${title}
Description: ${description}
Level: ${level}
Duration: ${duration_weeks} weeks

Return a JSON array of modules. Each module should have:
- module_number (integer, starting at 1)
- title (string — concise module title)
- description (string — 2-3 sentences explaining what learners will cover)
- learning_outcomes (array of 3-5 strings — specific skills/knowledge gained)
- duration_hours (integer — realistic study hours for this module)
- topics (array of 4-8 strings — specific topics covered)

Generate exactly ${Math.min(Math.max(Math.ceil(duration_weeks / 2), 4), 12)} modules.
Return only the JSON array, nothing else.`
  } else if (type === 'description') {
    userPrompt = `Write a compelling course description for this professional certification program:

Title: ${title}
Level: ${level}
Duration: ${duration_weeks} weeks

Return JSON with a single field: { "description": "..." }
The description should be 3-4 sentences, professional, and highlight career benefits.
Return only the JSON object, nothing else.`
  } else if (type === 'quiz') {
    userPrompt = `Generate 10 multiple-choice quiz questions for this module:

Course: ${title}
Module Topic: ${description}
Level: ${level}

Return a JSON array where each item has:
- question (string)
- options (array of 4 strings labeled A, B, C, D)
- correct_answer (string — the correct option letter: "A", "B", "C", or "D")
- explanation (string — brief explanation of why the answer is correct)

Return only the JSON array, nothing else.`
  }

  try {
    const result = streamText({
      model: xai('grok-2-latest'),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 4000,
    })

    return result.toTextStreamResponse()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
