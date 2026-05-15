'use client'

import { useState } from 'react'
import { Download, Printer, Share2, CheckCircle, XCircle, ChevronDown, Eye, FileText } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import RevokeCertButton from '@/components/admin/revoke-cert-button'
import { CertificateLanguage } from '@/lib/certificate-translations'

interface CertificateTableRowProps {
  cert: any
  profile: any
  program: any
}

const LEVEL_NAMES = ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert']
const LANGUAGES: { code: CertificateLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
]

export default function CertificateTableRow({ cert, profile, program }: CertificateTableRowProps) {
  const levelName = LEVEL_NAMES[(cert.certificate_level || 1) - 1]
  const [copied, setCopied] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showDocMenu, setShowDocMenu] = useState(false)

  const handleDownload = (lang: CertificateLanguage = 'en') => {
    const link = document.createElement('a')
    link.href = `/api/certificate/download/${cert.cert_id}?lang=${lang}`
    link.download = `${cert.cert_id}_certificate_${lang}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowLanguageMenu(false)
  }

  const handlePrint = (lang: CertificateLanguage = 'en') => {
    const link = document.createElement('a')
    link.href = `/api/certificate/download/${cert.cert_id}?lang=${lang}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowLanguageMenu(false)
  }

  const handleShare = () => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://iicar.org'}/verify?id=${cert.cert_id}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewRecommendation = (lang: 'ar' | 'en' = 'ar') => {
    const previewUrl = `/api/admin/recommendation/preview?studentId=${cert.student_id}&programId=${cert.program_id}&type=recommendation&language=${lang}`
    window.open(previewUrl, '_blank')
    setShowDocMenu(false)
  }

  const handleViewEndorsement = (lang: 'ar' | 'en' = 'ar') => {
    const previewUrl = `/api/admin/recommendation/preview?studentId=${cert.student_id}&programId=${cert.program_id}&type=endorsement&language=${lang}`
    window.open(previewUrl, '_blank')
    setShowDocMenu(false)
  }

  return (
    <tr className={`hover:bg-muted/30 transition-colors ${cert.revoked ? 'opacity-60' : ''}`}>
      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{cert.cert_id}</td>
      <td className="px-5 py-3 text-foreground">{profile?.full_name ?? '—'}</td>
      <td className="px-5 py-3 text-foreground truncate max-w-[180px]">{program?.title}</td>
      <td className="px-5 py-3 text-foreground">
        <Badge variant="outline" className="text-xs">
          Level {cert.certificate_level || 1}: {levelName}
        </Badge>
      </td>
      <td className="px-5 py-3 text-foreground">{cert.final_score ?? '—'}%</td>
      <td className="px-5 py-3">
        {cert.revoked ? (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="h-3 w-3 mr-1" /> Revoked
          </Badge>
        ) : cert.issued_at ? (
          <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Issued
          </Badge>
        ) : null}
      </td>
      <td className="px-5 py-3 text-right flex items-center justify-end gap-2 relative">
        {cert.issued_at && !cert.revoked && (
          <>
            <div className="relative group">
              <Button variant="ghost" size="sm" className="text-xs" title="Download PDF">
                <Download className="h-3 w-3" />
              </Button>
              <div className="absolute right-0 mt-1 hidden group-hover:flex flex-col bg-background border border-border rounded shadow-md z-10">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleDownload(lang.code)}
                    className="px-3 py-2 text-xs hover:bg-muted text-left whitespace-nowrap"
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative group">
              <Button variant="ghost" size="sm" className="text-xs" title="Print Certificate">
                <Printer className="h-3 w-3" />
              </Button>
              <div className="absolute right-0 mt-1 hidden group-hover:flex flex-col bg-background border border-border rounded shadow-md z-10">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handlePrint(lang.code)}
                    className="px-3 py-2 text-xs hover:bg-muted text-left whitespace-nowrap"
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs" 
                title="Generate Documents"
                onClick={() => setShowDocMenu(!showDocMenu)}
              >
                <FileText className="h-3 w-3" />
              </Button>
              {showDocMenu && (
                <div className="absolute right-0 mt-1 flex flex-col bg-background border border-border rounded shadow-md z-10 min-w-[150px]">
                  <button
                    onClick={() => handleViewRecommendation('ar')}
                    className="px-3 py-2 text-xs hover:bg-muted text-left hover:text-foreground flex items-center gap-2"
                  >
                    <Eye className="h-3 w-3" /> Arabic Recommendation
                  </button>
                  <button
                    onClick={() => handleViewEndorsement('ar')}
                    className="px-3 py-2 text-xs hover:bg-muted text-left hover:text-foreground flex items-center gap-2"
                  >
                    <Eye className="h-3 w-3" /> Arabic Endorsement
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button
                    onClick={() => handleViewRecommendation('en')}
                    className="px-3 py-2 text-xs hover:bg-muted text-left hover:text-foreground flex items-center gap-2"
                  >
                    <Eye className="h-3 w-3" /> English Recommendation
                  </button>
                  <button
                    onClick={() => handleViewEndorsement('en')}
                    className="px-3 py-2 text-xs hover:bg-muted text-left hover:text-foreground flex items-center gap-2"
                  >
                    <Eye className="h-3 w-3" /> English Endorsement
                  </button>
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" className="text-xs" onClick={handleShare} title={copied ? "Copied!" : "Share Certificate"}>
              <Share2 className="h-3 w-3" />
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href={`/verify?id=${cert.cert_id}`} target="_blank">Verify</Link>
            </Button>
            <RevokeCertButton certId={cert.id} />
          </>
        )}
      </td>
    </tr>
  )
}
