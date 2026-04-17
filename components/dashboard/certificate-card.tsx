'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Printer, Share2, ExternalLink, CheckCircle2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CertificateLanguage } from '@/lib/certificate-translations'

interface Certificate {
  id: string
  cert_id: string
  issued_at: string | null
  final_score: number
  revoked: boolean
  programs: { title: string } | null
}

interface CertificateCardProps {
  cert: Certificate
}

const LANGUAGES: { code: CertificateLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
]

export default function CertificateCard({ cert }: CertificateCardProps) {
  const [copied, setCopied] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [showPrintMenu, setShowPrintMenu] = useState(false)

  const handlePrint = (lang: CertificateLanguage = 'en') => {
    const link = document.createElement('a')
    link.href = `/api/certificate/download/${cert.cert_id}?lang=${lang}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowPrintMenu(false)
  }

  const handleDownload = (lang: CertificateLanguage = 'en') => {
    const link = document.createElement('a')
    link.href = `/api/certificate/download/${cert.cert_id}?lang=${lang}`
    link.download = `${cert.cert_id}_certificate_${lang}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowDownloadMenu(false)
  }

  const handleShare = () => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://iicar.org'}/verify?id=${cert.cert_id}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex flex-col gap-4 rounded-xl border p-6 ${cert.revoked ? 'border-destructive/30 bg-destructive/5 opacity-60' : 'border-green-200 bg-green-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        {cert.revoked ? (
          <Badge className="bg-destructive/20 text-destructive">Revoked</Badge>
        ) : (
          <Badge className="bg-green-600 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{cert.programs?.title}</h3>
        <p className="mt-1 text-xs font-mono text-muted-foreground">{cert.cert_id}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t border-border pt-3">
        <span>Issued: {new Date(cert.issued_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        {cert.final_score && <span>Final Score: <strong className="text-foreground">{cert.final_score}%</strong></span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 group">
          <Button variant="outline" size="sm" className="text-xs w-full bg-green-600 text-white border-green-600 hover:bg-green-700">
            <Download className="mr-1.5 h-3 w-3" /> Download
          </Button>
          <div className="absolute left-0 top-full mt-1 w-full hidden group-hover:flex flex-col bg-background border border-border rounded shadow-md z-10">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleDownload(lang.code)}
                className="px-3 py-2 text-xs hover:bg-green-50 text-left whitespace-nowrap font-medium"
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex-1 group">
          <Button variant="outline" size="sm" className="text-xs w-full bg-blue-600 text-white border-blue-600 hover:bg-blue-700">
            <Printer className="mr-1.5 h-3 w-3" /> Print
          </Button>
          <div className="absolute left-0 top-full mt-1 w-full hidden group-hover:flex flex-col bg-background border border-border rounded shadow-md z-10">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handlePrint(lang.code)}
                className="px-3 py-2 text-xs hover:bg-blue-50 text-left whitespace-nowrap font-medium"
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <Button variant="outline" size="sm" className="text-xs flex-1" onClick={handleShare} title={copied ? "Copied!" : "Share Certificate"}>
          <Share2 className="mr-1.5 h-3 w-3" /> {copied ? "Copied!" : "Share"}
        </Button>
        {!cert.revoked && (
          <Button asChild variant="outline" size="sm" className="text-xs flex-1">
            <Link href={`/verify?id=${cert.cert_id}`} target="_blank">
              Verify <ExternalLink className="ml-1.5 h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
