'use client'

import Link from 'next/link'
import { Download, Printer, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

export default function CertificateCard({ cert }: CertificateCardProps) {
  const handlePrint = () => {
    const link = document.createElement('a')
    link.href = `/api/certificate/download/${cert.cert_id}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `/api/certificate/download/${cert.cert_id}`
    link.download = `${cert.cert_id}_certificate.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <Button variant="outline" size="sm" className="text-xs flex-1 bg-green-600 text-white border-green-600 hover:bg-green-700" onClick={handleDownload}>
          <Download className="mr-1.5 h-3 w-3" /> Download
        </Button>
        <Button variant="outline" size="sm" className="text-xs flex-1 bg-blue-600 text-white border-blue-600 hover:bg-blue-700" onClick={handlePrint}>
          <Printer className="mr-1.5 h-3 w-3" /> Print
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
