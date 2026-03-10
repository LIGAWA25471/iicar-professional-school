import { createAdminClient } from '@/lib/supabase/server'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const adminDb = createAdminClient()
  
  // Fetch all programs
  const { data: programs } = await adminDb
    .from('programs')
    .select('id, updated_at')
    .eq('status', 'published')
  
  // Fetch all modules
  const { data: modules } = await adminDb
    .from('modules')
    .select('id, program_id, updated_at')
  
  // Fetch all lessons
  const { data: lessons } = await adminDb
    .from('lessons')
    .select('id, module_id, updated_at')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://iicar.org'
  
  const programEntries = (programs || []).map((program: any) => ({
    url: `${baseUrl}/dashboard/programs/${program.id}`,
    lastModified: new Date(program.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const lessonEntries = (lessons || []).map((lesson: any) => {
    const module = (modules || []).find((m: any) => m.id === lesson.module_id)
    const program = (programs || []).find((p: any) => p.id === module?.program_id)
    
    return {
      url: `${baseUrl}/dashboard/programs/${program?.id}/lessons/${lesson.id}`,
      lastModified: new Date(lesson.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  const quizEntries = (modules || []).map((module: any) => {
    const program = (programs || []).find((p: any) => p.id === module.program_id)
    
    return {
      url: `${baseUrl}/dashboard/programs/${program?.id}/quiz/${module.id}`,
      lastModified: new Date(module.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  const examEntries = (programs || []).map((program: any) => ({
    url: `${baseUrl}/dashboard/programs/${program.id}/exam`,
    lastModified: new Date(program.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    // Static routes
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/verify`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard/programs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard/certificates`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Dynamic routes
    ...programEntries,
    ...lessonEntries,
    ...quizEntries,
    ...examEntries,
  ]
}
