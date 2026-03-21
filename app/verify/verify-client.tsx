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
  certificate_level?: number
  profiles: { full_name: string; country: string }
  programs: { title: string }
}

export default function VerifyClient() {
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
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="text-center mb-8">
            <Award className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary-foreground mb-2">Verify Certificate</h1>
            <p className="text-primary-foreground/70">Enter a certificate ID to verify its authenticity</p>
          </div>

          <form onSubmit={handleVerify} className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <Label className="block text-sm font-medium text-gray-700 mb-2">Certificate ID</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., IICAR-2024-ABC123"
                value={certId}
                onChange={e => setCertId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="gap-2">
                <Search className="h-4 w-4" />
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </form>

          {result === 'not-found' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <XCircle className="h-10 w-10 text-red-600 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-red-900 mb-1">Certificate Not Found</h2>
              <p className="text-red-700">The certificate ID you entered could not be verified. Please check and try again.</p>
            </div>
          )}

          {result && result !== 'not-found' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-green-900 mb-1">Certificate Verified</h2>
                  <p className="text-green-700 text-sm">This is a valid IICAR certificate</p>
                </div>
              </div>

              <div className="space-y-4 mt-6 bg-white rounded p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Certificate ID</p>
                    <p className="text-sm font-mono text-gray-900">{result.cert_id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Issued Date</p>
                    <p className="text-sm text-gray-900">{new Date(result.issued_at).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Student</p>
                    <p className="text-sm font-medium text-gray-900">{result.profiles?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Country</p>
                    <p className="text-sm text-gray-900">{result.profiles?.country || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Program</p>
                  <p className="text-sm font-medium text-gray-900">{result.programs?.title || 'N/A'}</p>
                </div>

                {result.certificate_level && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Certificate Level</p>
                    <p className="text-sm font-medium text-gray-900">
                      Level {result.certificate_level}: {['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert'][result.certificate_level - 1]}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Final Score</p>
                  <p className="text-2xl font-bold text-green-600">{result.final_score}%</p>
                </div>

                {result.revoked && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
                    <p className="text-sm font-medium text-red-900">⚠ This certificate has been revoked</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
