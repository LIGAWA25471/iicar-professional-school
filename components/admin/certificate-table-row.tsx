'use client'

import { Download, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import RevokeCertButton from '@/components/admin/revoke-cert-button'

interface CertificateTableRowProps {
  cert: any
  profile: any
  program: any
}

const LEVEL_NAMES = ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert']

export default function CertificateTableRow({ cert, profile, program }: CertificateTableRowProps) {
  const levelName = LEVEL_NAMES[(cert.certificate_level || 1) - 1]

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `/api/certificate/download/${cert.cert_id}`
    link.download = `${cert.cert_id}_certificate.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
        {cert.issued_at && !cert.revoked && (
          <>
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleDownload}>
              <Download className="h-3 w-3" />
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
