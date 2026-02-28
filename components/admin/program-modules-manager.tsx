'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, ChevronDown, ChevronUp, Save, RefreshCw, BookOpen, ClipboardList, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

interface Module {
  id?: string
  module_number: number
  title: string
  description: string
  learning_outcomes: string[]
  duration_hours: number
  topics: string[]
  content?: ModuleContent | null
  quiz?: QuizQuestion[] | null
  quizSaved?: boolean
}

function parseDbModules(raw: { id: string; title: string; description: string | null; sort_order: number }[]): Module[] {
  return raw.map((m, idx) => {
    let parsed: { summary?: string; topics?: string[]; learning_outcomes?: string[]; duration_hours?: number; content?: ModuleContent } = {}
    try { parsed = JSON.parse(m.description ?? '{}') } catch { /* plain text */ }
    return {
      id: m.id,
      module_number: m.sort_order || idx + 1,
      title: m.title,
      description: parsed.summary ?? m.description ?? '',
      topics: parsed.topics ?? [],
      learning_outcomes: parsed.learning_outcomes ?? [],
      duration_hours: parsed.duration_hours ?? 0,
      content: parsed.content ?? null,
    }
  })
}

interface Props {
  programId: string
  programTitle: string
  programDescription: string
  programLevel: string
  durationWeeks: number
  initialModules: { id: string; title: string; description: string | null; sort_order: number }[]
}

export default function ProgramModulesManager({
  programId,
  programTitle,
  programDescription,
  programLevel,
  durationWeeks,
  initialModules,
}: Props) {
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>(() => parseDbModules(initialModules))
  const [generating, setGenerating] = useState(false)
  const [generatingContentFor, setGeneratingContentFor] = useState<number | null>(null)
  const [generatingQuizFor, setGeneratingQuizFor] = useState<number | null>(null)
  const [savingQuizFor, setSavingQuizFor] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(modules.length > 0 ? 0 : null)
  const [expandedTopicIdx, setExpandedTopicIdx] = useState<Record<number, number | null>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function streamJSON(body: object): Promise<string> {
    const res = await fetch('/api/admin/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? `Request failed (${res.status})`)
    }
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
  }

  async function generateModules() {
    setGenerating(true)
    setError('')
    setSuccess('')
    try {
      const raw = await streamJSON({
        title: programTitle,
        description: programDescription,
        level: programLevel,
        duration_weeks: durationWeeks,
        type: 'modules',
      })
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('Unexpected response format')
      setModules(parsed.map((m: Module) => ({ ...m, content: null })))
      setExpandedIdx(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate modules. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function generateTopicContent(idx: number) {
    const mod = modules[idx]
    if (!mod.topics?.length) {
      setError('This module has no topics listed. Generate modules first.')
      return
    }
    setGeneratingContentFor(idx)
    setError('')
    try {
      const raw = await streamJSON({
        title: programTitle,
        level: programLevel,
        type: 'topic_content',
        module_title: mod.title,
        module_topics: mod.topics,
      })
      const content: ModuleContent = JSON.parse(raw)
      setModules(prev => prev.map((m, i) => i === idx ? { ...m, content } : m))
      setExpandedTopicIdx(prev => ({ ...prev, [idx]: 0 }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate content. Try again.')
    } finally {
      setGeneratingContentFor(null)
    }
  }

  async function generateQuiz(idx: number) {
    const mod = modules[idx]
    if (!mod.topics?.length) {
      setError('Generate module topics first before creating an assessment.')
      return
    }
    setGeneratingQuizFor(idx)
    setError('')
    setSuccess('')
    try {
      const raw = await streamJSON({
        title: programTitle,
        level: programLevel,
        type: 'quiz',
        module_title: mod.title,
        module_topics: mod.topics,
      })
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('Unexpected response format from AI')
      setModules(prev => prev.map((m, i) => i === idx ? { ...m, quiz: parsed, quizSaved: false } : m))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate assessment. Try again.')
    } finally {
      setGeneratingQuizFor(null)
    }
  }

  async function saveQuiz(idx: number) {
    const mod = modules[idx]
    if (!mod.quiz?.length) return
    if (!mod.id) {
      setError('Save the modules first before publishing the assessment.')
      return
    }
    setSavingQuizFor(idx)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/admin/programs/${programId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: mod.id, questions: mod.quiz, type: 'module_quiz' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save assessment')
      setModules(prev => prev.map((m, i) => i === idx ? { ...m, quizSaved: true } : m))
      setSuccess(`Assessment published — ${data.saved} questions are now available to enrolled students.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save assessment')
    } finally {
      setSavingQuizFor(null)
    }
  }

  async function saveModules() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/admin/programs/${programId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      const lessonNote = data.lessons > 0 ? ` and ${data.lessons} lessons` : ''
      setSuccess(`${modules.length} modules${lessonNote} saved — students can now access the content.`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-foreground">Course Modules</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {modules.length > 0
              ? `${modules.length} modules · ${modules.reduce((s, m) => s + (m.duration_hours ?? 0), 0)}h total study time`
              : 'No modules yet — generate them with AI'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {modules.length > 0 && (
            <Button onClick={saveModules} disabled={saving} size="sm" variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/5">
              {saving
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
                : <><Save className="h-3.5 w-3.5 mr-1.5" />Save</>}
            </Button>
          )}
          <Button onClick={generateModules} disabled={generating || generatingContentFor !== null} size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90">
            {generating
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating…</>
              : modules.length > 0
                ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Regenerate Modules</>
                : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate Modules</>}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 border border-emerald-200">
          {success}
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center gap-3 py-14">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">AI is designing the curriculum…</p>
          <p className="text-xs text-muted-foreground/60">This may take up to 30 seconds</p>
        </div>
      )}

      {!generating && modules.length > 0 && (
        <div className="flex flex-col gap-2">
          {modules.map((mod, idx) => (
            <div key={idx} className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {mod.module_number}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{mod.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {mod.duration_hours}h · {mod.topics?.length ?? 0} topics
                      {mod.content ? ' · content ready' : ''}
                    </p>
                  </div>
                </div>
                {expandedIdx === idx
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>

              {expandedIdx === idx && (
                <div className="px-4 py-5 border-t border-border flex flex-col gap-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Topics Covered</p>
                      <ul className="flex flex-col gap-1.5">
                        {mod.topics?.map((t, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Learning Outcomes</p>
                      <ul className="flex flex-col gap-1.5">
                        {mod.learning_outcomes?.map((o, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />{o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Topic content section */}
                  <div className="border-t border-border pt-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Topic Content</p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => generateTopicContent(idx)}
                        disabled={generatingContentFor !== null}
                        className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                        {generatingContentFor === idx
                          ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating…</>
                          : mod.content
                            ? <><RefreshCw className="h-3 w-3 mr-1" />Regenerate Content</>
                            : <><BookOpen className="h-3 w-3 mr-1" />Generate Content</>}
                      </Button>
                    </div>

                    {generatingContentFor === idx && (
                      <div className="flex items-center gap-2 py-6 justify-center">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Writing topic content…</p>
                      </div>
                    )}

                    {mod.content && generatingContentFor !== idx && (
                      <div className="flex flex-col gap-4">
                        <div className="rounded-lg bg-muted/30 px-4 py-3">
                          <p className="text-xs font-semibold text-foreground mb-1.5">Introduction</p>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{mod.content.introduction}</p>
                        </div>

                        {mod.content.topics?.map((topic, tIdx) => (
                          <div key={tIdx} className="rounded-lg border border-border overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedTopicIdx(prev => ({
                                ...prev,
                                [idx]: prev[idx] === tIdx ? null : tIdx,
                              }))}
                              className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors text-left">
                              <p className="text-sm font-medium text-foreground">{topic.title}</p>
                              {expandedTopicIdx[idx] === tIdx
                                ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                            </button>
                            {expandedTopicIdx[idx] === tIdx && (
                              <div className="px-4 py-4 border-t border-border flex flex-col gap-3">
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{topic.content}</p>
                                {topic.key_points?.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-foreground mb-1.5">Key Points</p>
                                    <ul className="flex flex-col gap-1">
                                      {topic.key_points.map((kp, ki) => (
                                        <li key={ki} className="text-xs text-muted-foreground flex items-start gap-2">
                                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{kp}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {topic.practical_activity && (
                                  <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2.5">
                                    <p className="text-xs font-semibold text-primary mb-1">Practical Activity</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{topic.practical_activity}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 px-4 py-3">
                          <p className="text-xs font-semibold text-emerald-700 mb-1.5">Module Summary</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{mod.content.summary}</p>
                        </div>

                        {mod.content.further_reading?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Further Reading</p>
                            <ul className="flex flex-col gap-1">
                              {mod.content.further_reading.map((r, ri) => (
                                <li key={ri} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />{r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {!mod.content && generatingContentFor !== idx && (
                      <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                        Click &quot;Generate Content&quot; to create detailed study material for all topics in this module.
                      </p>
                    )}
                  </div>

                  {/* ── Assessment section ── */}
                  <div className="border-t border-border pt-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Module Assessment</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {mod.quiz
                            ? mod.quizSaved
                              ? `${mod.quiz.length} questions published`
                              : `${mod.quiz.length} questions generated — not yet saved`
                            : 'No assessment yet'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {mod.quiz && mod.quiz.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => saveQuiz(idx)}
                            disabled={savingQuizFor === idx || !mod.id}
                            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                            {savingQuizFor === idx
                              ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Saving…</>
                              : mod.quizSaved
                                ? <><RefreshCw className="h-3 w-3 mr-1" />Re-publish</>
                                : <><CheckCircle2 className="h-3 w-3 mr-1" />Publish Assessment</>}
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => generateQuiz(idx)}
                          disabled={generatingQuizFor !== null || generatingContentFor !== null}
                          className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                          {generatingQuizFor === idx
                            ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating…</>
                            : mod.quiz
                              ? <><RefreshCw className="h-3 w-3 mr-1" />Regenerate</>
                              : <><ClipboardList className="h-3 w-3 mr-1" />Generate Assessment</>}
                        </Button>
                      </div>
                    </div>

                    {generatingQuizFor === idx && (
                      <div className="flex items-center gap-2 py-6 justify-center">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">AI is writing assessment questions…</p>
                      </div>
                    )}

                    {mod.quiz && mod.quiz.length > 0 && generatingQuizFor !== idx && (
                      <div className="flex flex-col gap-2">
                        {mod.quizSaved && (
                          <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <p className="text-xs text-emerald-700">Assessment published — visible to enrolled students</p>
                          </div>
                        )}
                        {!mod.id && (
                          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                            <p className="text-xs text-amber-700">Save modules first, then click &quot;Publish Assessment&quot; to make questions available.</p>
                          </div>
                        )}
                        {mod.quiz.map((q, qi) => (
                          <div key={qi} className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                            <div className="flex items-start gap-2 mb-2">
                              <Badge variant="outline" className="text-xs shrink-0 mt-0.5">Q{qi + 1}</Badge>
                              <p className="text-sm text-foreground">{q.question}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 ml-7">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={`text-xs px-2.5 py-1.5 rounded-md border ${oi === q.correct_answer ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium' : 'text-muted-foreground border-transparent'}`}>
                                  {String.fromCharCode(65 + oi)}. {opt}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <p className="mt-2 ml-7 text-xs text-muted-foreground italic">{q.explanation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {!mod.quiz && generatingQuizFor !== idx && (
                      <p className="text-xs text-muted-foreground text-center py-5 border border-dashed border-border rounded-lg">
                        Click &quot;Generate Assessment&quot; to create 10 multiple-choice questions for this module.
                      </p>
                    )}
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!generating && modules.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 border-2 border-dashed border-border rounded-xl">
          <Sparkles className="h-10 w-10 text-muted-foreground/20" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No modules yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Click &quot;Generate Modules&quot; to have AI create a full curriculum with topics and learning outcomes.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
