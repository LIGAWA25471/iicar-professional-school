'use client'

import { useState } from 'react'
import { Menu, X, LogOut, ChevronRight, LayoutDashboard, BookOpen, Users, Award } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/programs', icon: BookOpen, label: 'Programs' },
  { href: '/admin/students', icon: Users, label: 'Students' },
  { href: '/admin/certificates', icon: Award, label: 'Certificates' },
]

interface Props {
  profile: { full_name: string | null; is_admin: boolean | null } | null
  user: { email?: string }
}

export function AdminMobileNav({ profile, user }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden sticky top-0 z-40 border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="IICAR" width={32} height={32} className="rounded-lg" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">IICAR Admin</p>
            <p className="text-[9px] text-muted-foreground">Management</p>
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
              <div className="mt-4 border-t border-sidebar-border pt-4">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent transition-colors"
                >
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
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </form>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
