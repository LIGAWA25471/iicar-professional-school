import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LayoutDashboard, BookOpen, Users, Award, Settings, LogOut, ChevronRight, FileText } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { href: '/admin/programs', icon: BookOpen, label: 'Programs' },
    { href: '/admin/students', icon: Users, label: 'Students' },
    { href: '/admin/certificates', icon: Award, label: 'Certificates' },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
          <Image src="/logo.jpg" alt="IICAR" width={40} height={40} className="rounded-lg" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sidebar-primary">IICAR Admin</p>
            <p className="text-[10px] text-sidebar-foreground/40 leading-tight">Management Portal</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <div className="mt-4 border-t border-sidebar-border pt-4">
            <Link href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent transition-colors">
              <ChevronRight className="h-4 w-4" />
              Student Portal
            </Link>
          </div>
        </nav>
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="mb-3 px-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{profile?.full_name ?? user.email}</p>
            <p className="text-[11px] text-sidebar-primary">Administrator</p>
          </div>
          <form action="/auth/logout" method="post">
            <button type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </form>
        </div>
      </aside>
      <div className="ml-64 flex flex-1 flex-col">
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
