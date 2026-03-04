'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Award, CheckCircle, XCircle, Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface CertResult {
  cert_id: string
  issued_at: string
  final_score: number
  revoked: boolean
  profiles: { full_name: string; country: string }
  programs: { title: string; level: string }
}

export default function VerifyPageClient() {
  const searchParams = useSearchParams()
  const [certId, setCertId] = useState(searchParams.get('id') ?? '')
  const [result, setResult] = useState<CertResult | null | 'not-found'>(null)
  const [loading, setLoading] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!certId.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/verify-certificate?id=${certId.trim().toUpperCase()}`)
      const data = await res.json()
      setResult(res.ok ? data : 'not-found')
    } catch {
      setResult('not-found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-primary">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="IICAR" width={40} height={40} className="rounded-lg" />
            <span className="text-sm font-bold text-primary-foreground uppercase tracking-widest">IICAR Global College</span>
          </Link>
          <Button asChild variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground text-sm">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
    );
};

export default VerifyClient;