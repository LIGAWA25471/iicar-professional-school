'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Loader2, Save, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface Module {
  module_number: number
  title: string
  description: string
  learning_outcomes: string[]
  duration_hours: number
  topics: string[]
}

export default function NewProgramPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [expandedModule, setExpandedModule] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [modules, setModules] = useState<Module[]>([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    level: 'intermediate',
    duration_weeks: 10,
    price_cents: 150000,
    passing_score: 70,
    is_published: true,
  })

  function set(field: string, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function streamRequest(type: string) {
    if (!form.title) { setError('Enter a program title first'); return null }
    setError('')
    setGenerating(type)
    try {
      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type }),
      })
      if (!res.ok) throw new Error('Request failed')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let raw = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          raw += decoder.decode(value, { stream: true })
        }
      }
      return raw.trim()
    } catch {
      setError(`Failed to generate ${type}. Check your API key.`)
      return null
    } finally {
      setGenerating(null)
    }
  }

  async function generateDescription() {
    const raw = await streamRequest('description')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      set('description', parsed.description ?? raw)
    } catch { set('description', raw) }
  }

  async function generateModules() {
    const raw = await streamRequest('modules')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      setModules(Array.isArray(parsed) ? parsed : [])
      setExpandedModule(0)
    } catch { setError('Failed to parse generated modules. Try again.') }
  }

  async function handleSave() {
    if (!form.title || !form.description) { setError('Title and description are required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, modules }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      router.push(`/admin/programs/${data.id}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/admin/programs"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">New Program</h1>
            <p className="text-sm text-muted-foreground">Create a certification with AI-generated curriculum</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save Program</>}
        </Button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">{error}</div>}

      {/* PROGRAM DETAILS */}
      <section className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-foreground">Program Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label>Program Title</Label>
            <Input placeholder="e.g. Diploma in Human Resource Management" value={form.title}
              onChange={e => set('title', e.target.value)} />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <Button type="button" variant="outline" size="sm" onClick={generateDescription}
                disabled={generating === 'description'}
                className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/5">
                {generating === 'description'
                  ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating…</>
                  : <><Sparkles className="h-3 w-3 mr-1" />AI Write</>}
              </Button>
            </div>
            <textarea
              rows={4}
              placeholder="Describe what learners will gain…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Level</Label>
            <select value={form.level} onChange={e => set('level', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Duration (weeks)</Label>
            <Input type="number" min={1} max={52} value={form.duration_weeks}
              onChange={e => set('duration_weeks', parseInt(e.target.value) || 8)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Price (KES)</Label>
            <Input type="number" min={0} step={500} value={form.price_cents / 100}
              onChange={e => set('price_cents', Math.round((parseFloat(e.target.value) || 0) * 100))} />
            <p className="text-xs text-muted-foreground">Enter 0 for a free program</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Passing Score (%)</Label>
            <Input type="number" min={50} max={100} value={form.passing_score}
              onChange={e => set('passing_score', parseInt(e.target.value) || 70)} />
          </div>

          <div className="flex items-center gap-3 sm:col-span-2 pt-1">
            <input type="checkbox" id="published" checked={form.is_published}
              onChange={e => set('is_published', e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary" />
            <Label htmlFor="published" className="cursor-pointer font-normal">Publish immediately — visible to students</Label>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">Course Modules</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {modules.length > 0 ? `${modules.length} modules ready` : 'AI will design a full curriculum based on your program details'}
            </p>
          </div>
          <Button type="button" onClick={generateModules} disabled={generating === 'modules'}
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
            {generating === 'modules'
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
              : <><Sparkles className="h-4 w-4 mr-2" />{modules.length > 0 ? 'Regenerate' : 'Generate with AI'}</>}
          </Button>
        </div>

        {generating === 'modules' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Grok AI is designing your curriculum…</p>
            <p className="text-xs text-muted-foreground/60">This may take up to 30 seconds</p>
          </div>
        )}

        {modules.length > 0 && generating !== 'modules' && (
          <div className="flex flex-col gap-2">
            {modules.map((mod, idx) => (
              <div key={idx} className="rounded-lg border border-border overflow-hidden">
                <button type="button"
                  onClick={() => setExpandedModule(expandedModule === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/60 transition-colors text-left gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {mod.module_number}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{mod.title}</p>
                      <p className="text-xs text-muted-foreground">{mod.duration_hours}h study · {mod.topics?.length ?? 0} topics</p>
                    </div>
                  </div>
                  {expandedModule === idx ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
                {expandedModule === idx && (
                  <div className="px-4 py-4 flex flex-col gap-4 border-t border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Topics Covered</p>
                        <ul className="flex flex-col gap-1.5">
                          {mod.topics?.map((t, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Learning Outcomes</p>
                        <ul className="flex flex-col gap-1.5">
                          {mod.learning_outcomes?.map((o, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {modules.length === 0 && generating !== 'modules' && (
          <div className="flex flex-col items-center gap-3 py-14 border-2 border-dashed border-border rounded-xl">
            <Sparkles className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Click &quot;Generate with AI&quot; to have Grok automatically create a full module breakdown, topics, and learning outcomes for this program.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
