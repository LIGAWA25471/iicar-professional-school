import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, LayoutDashboard, BookOpen, Award, User } from 'lucide-react'
import { DashboardMobileNav } from '@/components/dashboard-mobile-nav'
import { ThemeSelector } from '@/components/theme-selector'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_admin')
    .eq('id', user.id)
    .single()

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/programs', icon: BookOpen, label: 'My Programs' },
    { href: '/dashboard/certificates', icon: Award, label: 'Certificates' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
          <Image src="/logo.jpg" alt="IICAR" width={40} height={40} className="rounded-lg" priority />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sidebar-primary">IICAR</p>
            <p className="text-[10px] text-sidebar-foreground/40 leading-tight">Student Portal</p>
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
          {profile?.is_admin && (
            <Link href="/admin"
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-primary hover:bg-sidebar-accent transition-colors">
              <LayoutDashboard className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="mb-3 px-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{profile?.full_name ?? user.email}</p>
            <p className="text-[11px] text-sidebar-foreground/40 truncate">{user.email}</p>
          </div>
          <div className="flex gap-2 mb-2">
            <form action="/auth/logout" method="post" className="flex-1">
              <button type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </form>
            <ThemeSelector />
          </div>
        </div>
      </aside>

      {/* MOBILE NAV */}
      <DashboardMobileNav profile={profile} user={user} />

      {/* MAIN */}
      <div className="w-full md:ml-64 flex flex-1 flex-col">
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
