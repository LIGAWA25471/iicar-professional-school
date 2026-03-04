'use client'

import { useState } from 'react'
import { Menu, X, LogOut, LayoutDashboard, BookOpen, Award, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeSelector } from '@/components/theme-selector'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/programs', icon: BookOpen, label: 'My Programs' },
  { href: '/dashboard/certificates', icon: Award, label: 'Certificates' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
]

interface Props {
  profile: { full_name: string | null; is_admin: boolean | null } | null
  user: { email?: string }
}

export function DashboardMobileNav({ profile, user }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden sticky top-0 z-40 border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="IICAR" width={32} height={32} className="rounded-lg" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">IICAR</p>
            <p className="text-[9px] text-muted-foreground">Student</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-muted rounded-lg transition-colors">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* MOBILE SIDEBAR */}
      {isOpen && (
        <>
          <div className="md:hidden fixed inset-0 top-14 bg-black/50 z-30" onClick={() => setIsOpen(false)} />
          <aside className="md:hidden fixed inset-y-14 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col overflow-y-auto">
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-primary hover:bg-sidebar-accent transition-colors"
                >
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
              <div className="flex gap-2">
                <form action="/auth/logout" method="post" className="flex-1">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </form>
                <ThemeSelector />
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
