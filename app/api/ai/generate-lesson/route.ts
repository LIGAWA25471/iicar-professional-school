import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { xai } from '@ai-sdk/xai'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonTitle } = await request.json()
  if (!lessonTitle) return NextResponse.json({ error: 'Missing lessonTitle' }, { status: 400 })

  const prompt = `You are an academic content writer for IICAR Global College, a professional certification institute.

Write a comprehensive, well-structured lesson on the topic: "${lessonTitle}"

The lesson should include:
1. A brief introduction explaining why this topic matters for professionals
2. Key concepts explained clearly with real-world examples
3. Practical applications and best practices
4. A summary of key takeaways

Write in a clear, professional academic tone suitable for working professionals. Length: approximately 600-900 words. Use clear paragraphs — do not use markdown headers or bullet points.`

  try {
    const { text } = await generateText({
      model: xai('grok-4', {
        apiKey: process.env.XAI_API_KEY,
      }),
      prompt,
      maxTokens: 1200,
      temperature: 0.7,
    })

    return NextResponse.json({ content: text || 'No content generated.' })
  } catch (err) {
    console.error('[v0] AI generation error:', err)
    return NextResponse.json({
      content: `AI generation unavailable. Please add your lesson content manually.\n\nLesson: ${lessonTitle}`,
    })
  }
}
