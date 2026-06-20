'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { BookOpen, Clock, BarChart3, Search, ChevronRight } from 'lucide-react'

interface Program {
  id: string
  title: string
  description: string
  level: string
  price_cents: number
  duration_weeks: number
}

export default function PublicProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null)

  // Fetch programs on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('programs')
          .select('id, title, description, level, price_cents, duration_weeks')
          .eq('is_published', true)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('[v0] Error fetching programs:', error)
          setPrograms([])
        } else {
          setPrograms(data || [])
        }
      } catch (err) {
        console.error('[v0] Unexpected error:', err)
        setPrograms([])
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  // Get unique levels and price ranges for filters
  const levels = useMemo(() => {
    return Array.from(new Set(programs.map(p => p.level)))
  }, [programs])

  // Filter and search programs
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        program.title.toLowerCase().includes(searchLower) ||
        program.description.toLowerCase().includes(searchLower)

      // Level filter
      const matchesLevel = !selectedLevel || program.level === selectedLevel

      // Price filter
      let matchesPrice = true
      if (selectedPrice) {
        const priceInUSD = program.price_cents === 0 ? 0 : Math.round((program.price_cents / 100) / 134)
        if (selectedPrice === 'free') {
          matchesPrice = program.price_cents === 0
        } else if (selectedPrice === '0-50') {
          matchesPrice = priceInUSD >= 0 && priceInUSD <= 50
        } else if (selectedPrice === '50-100') {
          matchesPrice = priceInUSD > 50 && priceInUSD <= 100
        } else if (selectedPrice === '100+') {
          matchesPrice = priceInUSD > 100
        }
      }

      return matchesSearch && matchesLevel && matchesPrice
    })
  }, [programs, searchQuery, selectedLevel, selectedPrice])

  const programCount = filteredPrograms.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/" className="flex items-center gap-3 mb-4">
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

        {/* Search and Filters */}
        <div className="grid gap-6 mb-10 lg:grid-cols-4">
          {/* Search Bar */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card border-border"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Level</label>
            <select
              value={selectedLevel || ''}
              onChange={(e) => setSelectedLevel(e.target.value || null)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-card text-foreground text-sm"
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level} className="capitalize">
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Price Range</label>
            <select
              value={selectedPrice || ''}
              onChange={(e) => setSelectedPrice(e.target.value || null)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-card text-foreground text-sm"
            >
              <option value="">All Prices</option>
              <option value="free">Free</option>
              <option value="0-50">USD $0 - $50</option>
              <option value="50-100">USD $50 - $100</option>
              <option value="100+">USD $100+</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {programCount} program{programCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-6 animate-pulse"
              >
                <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-5/6 mb-6"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredPrograms.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map(program => {
              const priceInUSD = program.price_cents === 0 ? 0 : Math.round((program.price_cents / 100) / 134)
              return (
                <Link
                  key={program.id}
                  href={`/dashboard/programs/${program.id}/enroll`}
                  className="group rounded-lg border border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-3">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {program.level}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {program.description}
                    </p>

                    {/* Program Details */}
                    <div className="space-y-2 mb-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{program.duration_weeks} weeks</span>
                      </div>
                    </div>

                    {/* Price and Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {program.price_cents === 0 ? 'Free' : `USD ${priceInUSD}`}
                        </p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 group-hover:translate-x-1 transition-transform"
                      >
                        <span className="flex items-center">
                          Enroll
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </span>
                      </Button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No programs found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedLevel(null)
                setSelectedPrice(null)
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
