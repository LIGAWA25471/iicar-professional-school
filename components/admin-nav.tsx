'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, LogOut, ChevronRight } from 'lucide-react'

export function AdminNav({ navItems, profile, user }: any) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between border-b border-border bg-sidebar text-sidebar-foreground px-4 py-3">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="IICAR" width={32} height={32} className="rounded-lg" />
          <p className="text-xs font-bold uppercase tracking-widest text-sidebar-primary">IICAR Admin</p>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <nav className="md:hidden fixed inset-0 top-16 z-40 flex flex-col bg-sidebar text-sidebar-foreground border-b border-sidebar-border overflow-y-auto">
          <div className="flex flex-1 flex-col gap-1 px-3 py-4">
            {navItems.map(({ href, icon: Icon, label }: any) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <div className="mt-4 border-t border-sidebar-border pt-4">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
                Student Portal
              </Link>
            </div>
          </div>
          <div className="border-t border-sidebar-border px-4 py-4">
            <div className="mb-3 px-2">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{profile?.full_name ?? user?.email}</p>
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
        </nav>
      )}
    </>
  )
}
