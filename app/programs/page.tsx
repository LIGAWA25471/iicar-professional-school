import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { BookOpen, Clock, Search, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProgramsClient } from '@/components/programs-client'

interface Program {
  id: string
  title: string
  description: string
  level: string
  price_cents: number
  duration_weeks: number
}

// Mark page as dynamic to fetch programs at runtime
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Professional Programs | IICAR Global College',
  description: 'Browse all professional certification programs offered by IICAR Global College.',
}

export default async function ProgramsPage() {
  // Use service-role client to bypass RLS — programs are public content
  const adminDb = createAdminClient()
  const { data: programs = [], error } = await adminDb
    .from('programs')
    .select('id, title, description, price_cents, duration_weeks, level')
    .eq('is_published', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching programs:', error)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/" className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
            <Image src="/logo.jpg" alt="IICAR logo" width={40} height={40} className="rounded-lg" />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest">IICAR Global College</p>
              <p className="text-xs text-primary-foreground/70">Professional Programs</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Title Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-primary mb-3">Professional Programs</h1>
          <p className="text-lg text-muted-foreground">Industry-aligned certifications built for working professionals</p>
        </div>

        {/* Programs List with Client-side Filtering */}
        {programs && programs.length > 0 ? (
          <ProgramsClient initialPrograms={programs as Program[]} />
        ) : (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No programs available</h3>
            <p className="text-muted-foreground mb-6">Check back soon for new professional certification programs</p>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
