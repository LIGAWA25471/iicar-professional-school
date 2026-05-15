import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { certificateTranslations, levelNames, type CertificateLanguage } from '@/lib/certificate-translations'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cert_id: string }> }
) {
  const { cert_id } = await params
  if (!cert_id) return NextResponse.json({ error: 'No certificate ID provided' }, { status: 400 })

  // Get language from query params, default to English
  const url = new URL(request.url)
  const lang = (url.searchParams.get('lang') || 'en') as CertificateLanguage
  const translations = certificateTranslations[lang] || certificateTranslations.en
  const langLevelNames = levelNames[lang] || levelNames.en
  const isRTL = lang === 'ar'

  try {
    const adminDb = createAdminClient()
    
    // Query certificates table
    const { data: certs, error } = await adminDb
      .from('certificates')
      .select('*')
      .eq('cert_id', cert_id.toUpperCase())

    if (error || !certs || certs.length === 0) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    const cert = certs[0]

    // Only allow preview of issued certificates
    if (!cert.issued_at) {
      return NextResponse.json({ error: 'Certificate not yet issued' }, { status: 403 })
    }

    // Fetch profile data separately
    let profile = null
    if (cert.student_id) {
      const { data: profiles } = await adminDb
        .from('profiles')
        .select('full_name')
        .eq('id', cert.student_id)
      
      profile = profiles && profiles.length > 0 ? profiles[0] : null
    }

    // Fetch program data separately
    let program = null
    if (cert.program_id) {
      const { data: programs } = await adminDb
        .from('programs')
        .select('title')
        .eq('id', cert.program_id)
      
      program = programs && programs.length > 0 ? programs[0] : null
    }

    const studentName = profile?.full_name || 'Student'
    const programTitle = program?.title || 'Professional Certification'
    const levelName = langLevelNames[(cert.certificate_level || 1) - 1] || 'Professional'
    const issuedDate = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : lang === 'pt' ? 'pt-BR' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) : 'N/A'

    const html = `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${isRTL ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${translations.certificateTitle} - ${studentName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          width: 100%;
          height: 100%;
          font-family: 'Times New Roman', Times, serif;
          background: #f5f5f5;
        }

        body {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .certificate-container {
          width: 100%;
          max-width: 1200px;
          aspect-ratio: 16 / 10;
          background: white;
          position: relative;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px;
          border: 3px solid #b8860b;
          margin: 20px auto;
        }

        /* Top accent bar */
        .certificate-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 15px;
          background: #0f172a;
        }

        /* Left border accent */
        .certificate-container::after {
          content: '';
          position: absolute;
          top: 15px;
          left: 0;
          width: 4px;
          bottom: 0;
          background: #b8860b;
        }

        .certificate-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .institution-name {
          font-size: 32px;
          font-weight: bold;
          color: #0f172a;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }

        .institution-tagline {
          font-size: 11px;
          color: #666;
          font-style: italic;
          margin-bottom: 15px;
        }

        .header-divider {
          width: 50%;
          height: 2px;
          background: #b8860b;
          margin: 20px auto;
        }

        .certificate-title {
          font-size: 48px;
          font-weight: bold;
          color: #b8860b;
          margin-bottom: 10px;
        }

        .certificate-subtitle {
          font-size: 16px;
          color: #666;
          font-style: italic;
          margin-bottom: 30px;
        }

        .divider {
          width: 60%;
          height: 1px;
          background: #b8860b;
          margin: 30px auto;
        }

        .certificate-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          gap: 20px;
        }

        .body-text {
          font-size: 14px;
          line-height: 1.8;
          color: #333;
        }

        .student-name {
          font-size: 28px;
          font-weight: bold;
          color: #0f172a;
          margin: 20px 0;
          letter-spacing: 0.5px;
        }

        .program-info {
          font-size: 16px;
          color: #555;
          margin: 15px 0;
        }

        .level-badge {
          display: inline-block;
          background: #b8860b;
          color: white;
          padding: 8px 20px;
          border-radius: 4px;
          font-size: 13px;
          margin: 15px 0;
          font-weight: bold;
          letter-spacing: 0.5px;
        }

        .recognition-statement {
          font-size: 12px;
          color: #666;
          font-style: italic;
          margin-top: 20px;
          line-height: 1.6;
        }

        .certificate-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #b8860b;
          gap: 40px;
        }

        .signature-block {
          flex: 1;
          text-align: center;
        }

        .signature-line {
          width: 100%;
          height: 2px;
          background: #b8860b;
          margin-bottom: 8px;
        }

        .signature-title {
          font-size: 11px;
          color: #333;
          font-weight: bold;
        }

        .signature-subtitle {
          font-size: 10px;
          color: #666;
          margin-top: 4px;
        }

        .metadata {
          flex: 1;
          font-size: 11px;
          color: #666;
        }

        .metadata-item {
          margin: 8px 0;
        }

        .metadata-label {
          font-weight: bold;
          color: #333;
        }

        .cert-id {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          margin-top: 10px;
          color: #999;
        }

        @media print {
          html, body {
            background: white;
            margin: 0;
            padding: 0;
          }

          .certificate-container {
            box-shadow: none;
            margin: 0;
            width: 297mm;
            height: 210mm;
            aspect-ratio: auto;
            max-width: 100%;
          }

          body {
            padding: 0;
            justify-content: flex-start;
          }
        }

        .no-print {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          font-size: 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .btn-print {
          background: #b8860b;
          color: white;
        }

        .btn-print:hover {
          background: #9a7109;
        }

        .btn-close {
          background: #6b7280;
          color: white;
        }

        .btn-close:hover {
          background: #4b5563;
        }

        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div style="width: 100%; max-width: 1200px;">
        <div class="no-print">
          <button class="btn btn-print" onclick="window.print()">
            🖨️ ${lang === 'ar' ? 'طباعة' : lang === 'fr' ? 'Imprimer' : lang === 'pt' ? 'Imprimir' : 'Print'}
          </button>
          <button class="btn btn-close" onclick="window.close()">
            ✕ ${lang === 'ar' ? 'إغلاق' : lang === 'fr' ? 'Fermer' : lang === 'pt' ? 'Fechar' : 'Close'}
          </button>
        </div>

        <div class="certificate-container">
          <div class="certificate-header">
            <div class="institution-name">IICAR GLOBAL COLLEGE</div>
            <div class="institution-tagline">${lang === 'ar' ? 'معهد التطوير المهني الدولي والاعتراف' : lang === 'fr' ? 'Institut International d\'Avancement et de Reconnaissance de Carrière' : lang === 'pt' ? 'Instituto Internacional de Desenvolvimento de Carreira e Reconhecimento' : 'Institute of International Career Advancement and Recognition'}</div>
            <div class="header-divider"></div>
            <div class="certificate-title">${translations.certificateTitle}</div>
            <div class="certificate-subtitle">${translations.certificateSubtitle}</div>
            <div class="divider"></div>
          </div>

          <div class="certificate-body">
            <div class="body-text">${translations.awardedTo}</div>
            <div class="student-name">${studentName}</div>
            <div class="body-text">${translations.forSuccessfullyCompleting}</div>
            <div class="program-info"><strong>${programTitle}</strong></div>
            <div class="level-badge">${translations.levelLabel}: ${levelName}</div>
            ${cert.final_score ? `<div class="program-info">${lang === 'ar' ? 'الدرجة النهائية' : lang === 'fr' ? 'Note Finale' : lang === 'pt' ? 'Pontuação Final' : 'Final Score'}: ${cert.final_score}%</div>` : ''}
            <div class="recognition-statement">${translations.recognitionStatement}</div>
          </div>

          <div class="certificate-footer">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-title">${translations.directorPrograms}</div>
              <div class="signature-subtitle">IICAR Global College</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-title">${translations.principal}</div>
            </div>
            <div class="metadata">
              <div class="metadata-item"><span class="metadata-label">${translations.issuedLabel}:</span> ${issuedDate}</div>
              <div class="metadata-item"><span class="metadata-label">ID:</span> ${cert.cert_id}</div>
              <div class="cert-id">Certificate # ${cert.cert_id}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('[v0] Error generating certificate preview:', error)
    return NextResponse.json({ error: 'Failed to generate certificate preview' }, { status: 500 })
  }
}
