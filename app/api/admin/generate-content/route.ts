import { streamText } from 'ai'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { title, description, level, duration_weeks, type, module_title, module_topics } = await request.json()

  if (!title) return new Response(JSON.stringify({ error: 'title is required' }), { status: 400 })

  const systemPrompt = `You are an expert curriculum designer for professional certification programs.
You create structured, practical, and comprehensive course content tailored for working professionals in Africa and globally.
Always respond with valid JSON only — no markdown fences, no preamble, no explanation. Just the raw JSON.`

  let userPrompt = ''

  if (type === 'modules') {
    const count = Math.min(Math.max(Math.ceil((duration_weeks ?? 8) / 2), 4), 12)
    userPrompt = `Generate a complete module breakdown for this professional certification program:

Title: ${title}
Description: ${description ?? ''}
Level: ${level ?? 'intermediate'}
Duration: ${duration_weeks ?? 8} weeks

Return a JSON array of exactly ${count} modules. Each module object must have these exact keys:
- "module_number": integer starting at 1
- "title": concise module title string
- "description": 2-3 sentence overview of the module
- "learning_outcomes": array of 3-5 outcome strings
- "duration_hours": integer study hours for this module
- "topics": array of 4-8 topic title strings

Return ONLY the JSON array. No other text.`

  } else if (type === 'description') {
    userPrompt = `Write a compelling course description for this professional certification program:

Title: ${title}
Level: ${level ?? 'intermediate'}
Duration: ${duration_weeks ?? 8} weeks

Return a JSON object with one key: { "description": "your text here" }
The description must be 3-4 professional sentences highlighting career benefits and key skills gained.
Return ONLY the JSON object. No other text.`

  } else if (type === 'topic_content') {
    userPrompt = `Generate detailed study content for this course module:

Course Title: ${title}
Module Title: ${module_title ?? ''}
Level: ${level ?? 'intermediate'}
Topics in this module: ${(module_topics ?? []).join(', ')}

Return a JSON object with this exact structure:
{
  "introduction": "2-3 paragraph introduction to this module",
  "topics": [
    {
      "title": "topic title",
      "content": "3-5 paragraphs of detailed explanation, examples, and practical insights",
      "key_points": ["point 1", "point 2", "point 3"],
      "practical_activity": "a short hands-on activity or reflection exercise for learners"
    }
  ],
  "summary": "1-2 paragraph module summary tying everything together",
  "further_reading": ["resource or book title 1", "resource or book title 2", "resource or book title 3"]
}

Generate content for ALL ${(module_topics ?? []).length || 'the listed'} topics.
Return ONLY the JSON object. No other text.`

  } else if (type === 'quiz') {
    userPrompt = `Generate 10 multiple-choice assessment questions for this module:

Course: ${title}
Module: ${module_title ?? description ?? ''}
Level: ${level ?? 'intermediate'}

Return a JSON array of 10 question objects, each with:
- "question": question text string
- "options": array of exactly 4 strings (the answer choices)
- "correct_answer": index integer (0, 1, 2, or 3) of the correct option
- "explanation": brief explanation string of why the answer is correct

Return ONLY the JSON array. No other text.`
  }

  try {
    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 6000,
    })
    return result.toTextStreamResponse()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
