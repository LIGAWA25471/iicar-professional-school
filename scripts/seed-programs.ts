import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedPrograms() {
  console.log('[v0] Starting to seed sample programs...')

  const programs = [
    {
      title: 'Cloud Architecture Fundamentals',
      description:
        'Master the principles of designing scalable, secure, and cost-effective cloud solutions on AWS, Azure, and Google Cloud.',
      price_cents: 9999, // $99.99
      duration_weeks: 6,
      level: 'beginner',
      passing_score: 70,
      max_attempts: 3,
    },
    {
      title: 'Advanced Data Analytics',
      description:
        'Learn to extract actionable insights from large datasets using Python, SQL, and machine learning techniques used by Fortune 500 companies.',
      price_cents: 14999, // $149.99
      duration_weeks: 8,
      level: 'intermediate',
      passing_score: 75,
      max_attempts: 3,
    },
    {
      title: 'Cybersecurity Essentials',
      description:
        'Develop expertise in network security, threat detection, and compliance frameworks to protect organizational assets from evolving cyber threats.',
      price_cents: 12999, // $129.99
      duration_weeks: 7,
      level: 'intermediate',
      passing_score: 80,
      max_attempts: 2,
    },
    {
      title: 'Digital Marketing Strategy',
      description:
        'Build a comprehensive understanding of SEO, content marketing, social media strategy, and analytics to drive business growth in the digital age.',
      price_cents: 7999, // $79.99
      duration_weeks: 5,
      level: 'beginner',
      passing_score: 70,
      max_attempts: 3,
    },
    {
      title: 'Full-Stack Web Development',
      description:
        'Become a proficient full-stack developer mastering React, Node.js, databases, and deployment strategies for modern web applications.',
      price_cents: 15999, // $159.99
      duration_weeks: 10,
      level: 'advanced',
      passing_score: 75,
      max_attempts: 3,
    },
    {
      title: 'Project Management Professional',
      description:
        'Learn Agile and Waterfall methodologies, risk management, and leadership skills to successfully deliver projects on time and within budget.',
      price_cents: 11999, // $119.99
      duration_weeks: 6,
      level: 'intermediate',
      passing_score: 72,
      max_attempts: 3,
    },
  ]

  try {
    const { data, error } = await supabase.from('programs').insert(programs).select()

    if (error) {
      console.error('[v0] Error inserting programs:', error)
      process.exit(1)
    }

    console.log(`[v0] Successfully seeded ${data?.length ?? 0} programs`)
    console.log('[v0] Programs:', data)
  } catch (err) {
    console.error('[v0] Seed failed:', err)
    process.exit(1)
  }
}

seedPrograms()
