'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { BookOpen, Clock, Search, ChevronRight } from 'lucide-react'

interface Program {
  id: string
  title: string
  description: string
  level: string
  price_cents: number
  duration_weeks: number
}

interface ProgramsClientProps {
  initialPrograms: Program[]
}

export function ProgramsClient({ initialPrograms }: ProgramsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null)

  // Get unique levels for filter
  const levels = useMemo(() => {
    return Array.from(new Set(initialPrograms.map(p => p.level))).sort()
  }, [initialPrograms])

  // Filter and search programs
  const filteredPrograms = useMemo(() => {
    return initialPrograms.filter(program => {
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
  }, [initialPrograms, searchQuery, selectedLevel, selectedPrice])

  const programCount = filteredPrograms.length

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="grid gap-6 lg:grid-cols-4">
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
              aria-label="Search programs"
            />
          </div>
        </div>

        {/* Level Filter */}
        <div>
          <label htmlFor="level-filter" className="text-sm font-medium text-foreground mb-2 block">
            Level
          </label>
          <select
            id="level-filter"
            value={selectedLevel || ''}
            onChange={(e) => setSelectedLevel(e.target.value || null)}
            className="w-full h-11 px-3 rounded-lg border border-border bg-card text-foreground text-sm"
          >
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Price Filter */}
        <div>
          <label htmlFor="price-filter" className="text-sm font-medium text-foreground mb-2 block">
            Price Range
          </label>
          <select
            id="price-filter"
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {programCount} program{programCount !== 1 ? 's' : ''}
        </p>
        {(searchQuery || selectedLevel || selectedPrice) && (
          <Button
            onClick={() => {
              setSearchQuery('')
              setSelectedLevel(null)
              setSelectedPrice(null)
            }}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length > 0 ? (
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
                      <Clock className="h-4 w-4 flex-shrink-0" />
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
    </div>
  )
}
