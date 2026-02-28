import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const programs = [
      {
        title: 'Cloud Architecture Fundamentals',
        description:
          'Master the principles of designing scalable, secure, and cost-effective cloud solutions on AWS, Azure, and Google Cloud.',
        price_cents: 9999,
        duration_weeks: 6,
        level: 'beginner',
        passing_score: 70,
        max_attempts: 3,
        is_published: true,
      },
      {
        title: 'Advanced Data Analytics',
        description:
          'Learn to extract actionable insights from large datasets using Python, SQL, and machine learning techniques used by Fortune 500 companies.',
        price_cents: 14999,
        duration_weeks: 8,
        level: 'intermediate',
        passing_score: 75,
        max_attempts: 3,
        is_published: true,
      },
      {
        title: 'Cybersecurity Essentials',
        description:
          'Develop expertise in network security, threat detection, and compliance frameworks to protect organizational assets from evolving cyber threats.',
        price_cents: 12999,
        duration_weeks: 7,
        level: 'intermediate',
        passing_score: 80,
        max_attempts: 2,
        is_published: true,
      },
      {
        title: 'Digital Marketing Strategy',
        description:
          'Build a comprehensive understanding of SEO, content marketing, social media strategy, and analytics to drive business growth in the digital age.',
        price_cents: 7999,
        duration_weeks: 5,
        level: 'beginner',
        passing_score: 70,
        max_attempts: 3,
        is_published: true,
      },
      {
        title: 'Full-Stack Web Development',
        description:
          'Become a proficient full-stack developer mastering React, Node.js, databases, and deployment strategies for modern web applications.',
        price_cents: 15999,
        duration_weeks: 10,
        level: 'advanced',
        passing_score: 75,
        max_attempts: 3,
        is_published: true,
      },
      {
        title: 'Project Management Professional',
        description:
          'Learn Agile and Waterfall methodologies, risk management, and leadership skills to successfully deliver projects on time and within budget.',
        price_cents: 11999,
        duration_weeks: 6,
        level: 'intermediate',
        passing_score: 72,
        max_attempts: 3,
        is_published: true,
      },
    ]

    // Check if programs already exist
    const { data: existingPrograms } = await supabase
      .from('programs')
      .select('id')
      .limit(1)

    if (existingPrograms && existingPrograms.length > 0) {
      return NextResponse.json({ message: 'Programs already exist', count: existingPrograms.length })
    }

    const { data, error } = await supabase.from('programs').insert(programs).select()

    if (error) {
      console.error('[v0] Seed error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully seeded ${data?.length ?? 0} programs`,
      programs: data,
    })
  } catch (err) {
    console.error('[v0] Seed failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
