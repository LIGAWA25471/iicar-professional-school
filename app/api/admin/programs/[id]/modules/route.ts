import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface TopicContent {
  title: string
  content: string
  key_points: string[]
  practical_activity: string
}

interface ModuleContent {
  introduction: string
  topics: TopicContent[]
  summary: string
  further_reading: string[]
}

interface ModuleInput {
  module_number: number
  title: string
  description: string
  learning_outcomes: string[]
  duration_hours: number
  topics: string[]
  content?: ModuleContent | null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    const { data: profile } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { modules } = await request.json()
    if (!Array.isArray(modules)) return NextResponse.json({ error: 'modules must be an array' }, { status: 400 })

    // Delete existing modules (cascades to lessons via FK)
    await adminDb.from('modules').delete().eq('program_id', programId)

    // Insert modules
    const moduleRows = modules.map((m: ModuleInput) => ({
      program_id: programId,
      title: m.title,
      description: JSON.stringify({
        summary: m.description,
        topics: m.topics ?? [],
        learning_outcomes: m.learning_outcomes ?? [],
        duration_hours: m.duration_hours ?? 0,
      }),
      sort_order: m.module_number,
    }))

    const { data: savedModules, error: modError } = await adminDb
      .from('modules')
      .insert(moduleRows)
      .select('id, sort_order')
    if (modError) throw modError

    // For each module, insert lessons from topic content
    let totalLessons = 0
    for (const savedModule of savedModules ?? []) {
      const sourceModule = modules.find((m: ModuleInput) => m.module_number === savedModule.sort_order) as ModuleInput | undefined
      if (!sourceModule?.content) continue

      const { introduction, topics: topicContents, summary, further_reading } = sourceModule.content

      const lessonRows = []

      // Lesson 0: Module Introduction
      if (introduction) {
        lessonRows.push({
          module_id: savedModule.id,
          title: `${sourceModule.title} — Introduction`,
          objectives: sourceModule.learning_outcomes?.join('\n') ?? null,
          content: introduction,
          ai_draft: introduction,
          is_published: true,
          sort_order: 0,
        })
      }

      // One lesson per topic
      topicContents?.forEach((topic: TopicContent, tIdx: number) => {
        const contentText = [
          topic.content,
          topic.key_points?.length
            ? `\n\nKey Points:\n${topic.key_points.map((kp: string) => `• ${kp}`).join('\n')}`
            : '',
          topic.practical_activity
            ? `\n\nPractical Activity:\n${topic.practical_activity}`
            : '',
        ].join('')

        lessonRows.push({
          module_id: savedModule.id,
          title: topic.title,
          objectives: topic.key_points?.join('\n') ?? null,
          content: contentText,
          ai_draft: contentText,
          is_published: true,
          sort_order: tIdx + 1,
        })
      })

      // Final lesson: Module Summary & Further Reading
      if (summary) {
        const summaryContent = [
          summary,
          further_reading?.length
            ? `\n\nFurther Reading:\n${further_reading.map((r: string) => `• ${r}`).join('\n')}`
            : '',
        ].join('')

        lessonRows.push({
          module_id: savedModule.id,
          title: `${sourceModule.title} — Summary`,
          objectives: null,
          content: summaryContent,
          ai_draft: summaryContent,
          is_published: true,
          sort_order: (topicContents?.length ?? 0) + 1,
        })
      }

      if (lessonRows.length > 0) {
        const { error: lessonError } = await adminDb.from('lessons').insert(lessonRows)
        if (lessonError) throw lessonError
        totalLessons += lessonRows.length
      }
    }

    return NextResponse.json({ saved: savedModules?.length ?? 0, lessons: totalLessons })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

