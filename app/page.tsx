import Image from 'next/image'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen, Award, Globe, Shield, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  // Use service-role client to bypass RLS — programs are public content
  const adminDb = createAdminClient()
  const { data: programs } = await adminDb
    .from('programs')
    .select('id, title, description, price_cents, duration_weeks, level')
    .eq('is_published', true)
    .order('created_at', { ascending: true })
    .limit(6)

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="IICAR logo" width={44} height={44} className="rounded-lg" />
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">IICAR Global College</p>
              <p className="text-[10px] text-primary-foreground/50 leading-tight">Institute of International Career Advancement</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#programs" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Programs</Link>
            <Link href="#how-it-works" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">How It Works</Link>
            <Link href="/verify" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Verify Certificate</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-primary-foreground hover:text-accent hover:bg-white/10 text-sm">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold">
              <Link href="/auth/register">Enroll Now</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/hero-certification.jpg" alt="" fill className="object-cover" priority />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance md:text-5xl lg:text-6xl">
              Advance Your Career with Globally Recognised Certifications
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-primary-foreground/90 text-pretty">
              IICAR Global College delivers structured, self-paced professional certification programs powered by AI-assisted academic content. Learn at your pace — earn credentials that open doors.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-10">
                <Link href="/auth/register">Get Started</Link>
              </Button>
              <Button asChild size="lg" className="border border-white/50 bg-transparent text-primary-foreground hover:bg-white/10">
                <Link href="#programs">Browse Programs <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Programs Offered', value: '20+' },
              { label: 'Students Enrolled', value: '5,000+' },
              { label: 'Countries Reached', value: '40+' },
              { label: 'Certificates Issued', value: '3,200+' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center border-r border-white/10 last:border-r-0 py-8 text-center">
                <span className="text-3xl font-bold text-accent">{stat.value}</span>
                <span className="mt-1 text-xs text-primary-foreground/50 uppercase tracking-wide">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY IICAR */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-primary">Why Choose IICAR?</h2>
            <p className="mt-3 text-muted-foreground">Everything you need for a recognised professional qualification</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Feature Cards */}
            <div className="grid gap-8 md:grid-cols-2">
              {[
                { icon: BookOpen, title: 'AI-Assisted Content', desc: 'Structured curriculum generated and refined with AI, reviewed by domain experts for accuracy.' },
                { icon: Award, title: 'Verifiable Certificates', desc: 'Every certificate carries a unique ID instantly verifiable on our public portal.' },
                { icon: Globe, title: 'Learn Anywhere', desc: 'Fully self-paced and accessible on any device from any country, 24/7.' },
                { icon: Shield, title: 'Rigorous Standards', desc: 'Built on transparent academic standards with proctored assessments and structured grading.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            {/* Visual */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border">
              <Image src="/ai-learning.jpg" alt="AI-powered learning platform" width={500} height={500} className="w-full h-full object-cover" priority />
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="programs" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-primary">Professional Programs</h2>
            <p className="mt-3 text-muted-foreground">Industry-aligned certifications built for working professionals</p>
          </div>
          {programs && programs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <div key={program.id} className="flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between bg-primary/5 px-6 py-3 border-b border-border">
                    <Badge variant="secondary" className="text-xs capitalize">{program.level}</Badge>
                    {program.duration_weeks && (
                      <span className="text-xs text-muted-foreground">{program.duration_weeks} weeks</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <h3 className="font-semibold text-foreground leading-snug">{program.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{program.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-lg font-bold text-primary">
                        {program.price_cents === 0 ? 'Free' : `KES ${(program.price_cents / 100).toLocaleString()}`}
                      </span>
                      <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link href={`/auth/register?program=${program.id}`}>Enroll</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground">
              <BookOpen className="h-14 w-14 opacity-20" />
              <p className="text-sm">Programs are being prepared. Check back shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-primary">How It Works</h2>
            <p className="mt-3 text-muted-foreground">From registration to certified professional in four steps</p>
          </div>
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Steps */}
            <div className="grid gap-10 md:grid-cols-2">
              {[
                { step: '01', title: 'Register & Enroll', desc: 'Create your account and enroll in your chosen certification program.' },
                { step: '02', title: 'Learn at Your Pace', desc: 'Access AI-assisted lessons organised by module. Study on any device, anytime.' },
                { step: '03', title: 'Pass Assessments', desc: 'Complete module quizzes and a final exam to demonstrate your mastery.' },
                { step: '04', title: 'Get Certified', desc: 'Receive a verifiable digital certificate with a unique IICAR ID upon completion.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex flex-col items-start text-left gap-4 p-6 rounded-xl bg-background border border-border">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent bg-primary text-accent font-bold text-lg">
                    {step}
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            {/* Visual */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border h-96">
              <Image src="/global-recognition.jpg" alt="Global recognition and verification" width={500} height={500} className="w-full h-full object-cover" priority />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative bg-primary py-20 text-primary-foreground overflow-hidden">
        <div className="mx-auto max-w-5xl px-6 relative z-10">
          <h2 className="mb-14 text-center text-3xl font-bold">What Our Students Say</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { name: 'Amara N.', country: 'Nigeria', quote: 'IICAR gave me a credential that opened doors I never thought possible. The AI-powered content is genuinely excellent.' },
              { name: 'Raj P.', country: 'India', quote: 'I completed my certification while working full time. The self-paced structure is exactly what busy professionals need.' },
              { name: 'Sofia M.', country: 'Brazil', quote: 'The verification feature is fantastic — my employer confirmed my certificate within minutes. Highly professional.' },
            ].map(({ name, country, quote }) => (
              <div key={name} className="rounded-xl bg-white/10 backdrop-blur-sm p-6 flex flex-col gap-4 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-primary-foreground/90 leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
                <div className="mt-auto border-t border-white/10 pt-4">
                  <p className="font-semibold text-sm">{name}</p>
                  <p className="text-xs text-primary-foreground/60">{country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary via-primary/95 to-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Badge className="mb-6 mx-auto bg-accent/20 text-accent border-accent/30 text-xs tracking-widest uppercase px-4 py-1 w-fit">
            Limited Time Offer
          </Badge>
          <h2 className="text-4xl font-bold leading-tight md:text-5xl">Ready to Advance Your Career?</h2>
          <p className="mt-6 text-lg text-primary-foreground/80 leading-relaxed">Join thousands of professionals who have earned globally recognised IICAR certifications. Start your journey today with a free account.</p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-10">
              <Link href="/auth/register">Create Free Account</Link>
            </Button>
            <Button asChild size="lg" className="border border-white/50 bg-transparent text-primary-foreground hover:bg-white/10">
              <Link href="/verify">Verify a Certificate</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-4 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.jpg" alt="IICAR" width={40} height={40} className="rounded-md" />
                <div>
                  <p className="text-sm font-bold text-accent">IICAR</p>
                  <p className="text-xs text-primary-foreground/50">Global College</p>
                </div>
              </div>
              <p className="text-xs text-primary-foreground/60 leading-relaxed">Professional certification platform powering careers globally.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Learn</h4>
              <ul className="space-y-2 text-xs text-primary-foreground/70">
                <li><Link href="#programs" className="hover:text-accent transition-colors">Programs</Link></li>
                <li><Link href="#how-it-works" className="hover:text-accent transition-colors">How It Works</Link></li>
                <li><Link href="/verify" className="hover:text-accent transition-colors">Verify Certificate</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Account</h4>
              <ul className="space-y-2 text-xs text-primary-foreground/70">
                <li><Link href="/auth/login" className="hover:text-accent transition-colors">Sign In</Link></li>
                <li><Link href="/auth/register" className="hover:text-accent transition-colors">Register</Link></li>
                <li><Link href="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Admin</h4>
              <ul className="space-y-2 text-xs text-primary-foreground/70">
                <li><Link href="/admin" className="hover:text-accent transition-colors">Admin Portal</Link></li>
                <li><Link href="/admin/programs" className="hover:text-accent transition-colors">Manage Programs</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-primary-foreground/40">&copy; {new Date().getFullYear()} IICAR Global College. All rights reserved.</p>
              <div className="flex gap-6 text-xs text-primary-foreground/60">
                <span>Institute of International Career Advancement and Recognition</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
