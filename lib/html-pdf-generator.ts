import puppeteer, { Browser } from 'puppeteer'

let browserInstance: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (browserInstance) {
    return browserInstance
  }

  try {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })
    return browserInstance
  } catch (error) {
    console.error('[v0] Failed to launch Puppeteer:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to launch browser: ${errorMessage}`)
  }
}

export async function generatePDFFromHTML(
  htmlContent: string,
  options: {
    format?: 'a4' | 'letter'
    margin?: { top: string; right: string; bottom: string; left: string }
  } = {}
): Promise<Buffer> {
  const browser = await getBrowser()

  try {
    const page = await browser.createPage()

    // Set viewport for proper rendering
    await page.setViewport({ width: 1200, height: 1600 })

    // Load HTML content with relaxed wait condition
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'a4',
      margin: options.margin || {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      printBackground: true,
      preferCSSPageBreak: true,
    })

    await page.close()

    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error('[v0] PDF generation failed:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`PDF generation failed: ${errorMessage}`)
  }
}

export function generateArabicDocumentHTML(params: {
  type: 'recommendation' | 'endorsement'
  studentName: string
  programTitle?: string
  programsList?: Array<{ title: string; completedDate: string }>
  bodyText: string
  conclusionText: string
  registrarName: string
  registrarTitle: string
  schoolName: string
  generatedDate: string
}): string {
  const isEndorsement = params.type === 'endorsement'
  const title = isEndorsement ? 'شهادة تصديق مهنية' : 'خطاب توصية'

  const programsListHTML = params.programsList
    ? `
      <div class="programs-list">
        ${params.programsList
          .map(
            (prog, idx) =>
              `<div class="program-item">${idx + 1}. ${prog.title} (${prog.completedDate})</div>`
          )
          .join('')}
      </div>
    `
    : ''

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            direction: rtl;
            unicode-bidi: embed;
            font-family: 'Noto Naskh Arabic', 'Arial', sans-serif;
        }

        body {
            background-color: #ffffff;
            color: #282828;
            line-height: 1.6;
        }

        @page {
            size: A4;
            margin: 20mm 20mm 20mm 20mm;
            @bottom-center {
                content: "صفحة " counter(page) " من " counter(pages);
                font-family: 'Noto Naskh Arabic', Arial, sans-serif;
                font-size: 10pt;
                color: #999;
            }
        }

        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
        }

        .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 25px;
            text-align: center;
            border-bottom: 3px solid #b8860b;
            margin-bottom: 30px;
            border-radius: 4px;
        }

        .header-school {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .header-subtitle {
            font-size: 12px;
            color: #b8860b;
            letter-spacing: 0.5px;
        }

        .title {
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            margin: 30px 0 20px 0;
            border-bottom: 2px solid #b8860b;
            padding-bottom: 15px;
        }

        .greeting {
            font-size: 14px;
            margin-bottom: 20px;
            font-weight: 500;
        }

        .content {
            font-size: 13px;
            line-height: 1.8;
            text-align: justify;
            unicode-bidi: plaintext;
            margin-bottom: 20px;
        }

        .intro-text {
            margin-bottom: 15px;
        }

        .programs-list {
            background-color: #f8f8f8;
            padding: 15px 20px;
            border-right: 3px solid #b8860b;
            margin: 20px 0;
            border-radius: 4px;
        }

        .program-item {
            margin: 10px 0;
            font-size: 13px;
            line-height: 1.6;
        }

        .body-text {
            margin: 20px 0;
            font-size: 13px;
            line-height: 1.8;
            text-align: justify;
            unicode-bidi: plaintext;
        }

        .conclusion {
            margin: 20px 0;
            font-size: 13px;
            line-height: 1.8;
            text-align: justify;
            unicode-bidi: plaintext;
        }

        .closing {
            margin: 30px 0 10px 0;
            font-size: 13px;
            font-weight: 500;
        }

        .signature-section {
            margin-top: 40px;
            padding-top: 20px;
        }

        .signature-line {
            border-top: 1px solid #0f172a;
            width: 150px;
            margin: 40px 0 10px 0;
        }

        .registrar-info {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 3px;
        }

        .registrar-title {
            font-size: 12px;
            color: #555;
            margin-bottom: 3px;
        }

        .school-name {
            font-size: 12px;
            color: #555;
        }

        .footer {
            border-top: 1px solid #b8860b;
            margin-top: 40px;
            padding-top: 15px;
            text-align: center;
            font-size: 11px;
            color: #666;
        }

        .footer-date {
            margin-bottom: 5px;
        }

        .document-id {
            font-size: 9px;
            color: #999;
        }

        @media print {
            body {
                background-color: white;
            }
            .container {
                padding: 0;
                max-width: 100%;
            }
            .header {
                page-break-after: avoid;
            }
        }

        /* RTL specific adjustments */
        .program-item:before {
            content: "• ";
            margin-left: 10px;
        }

        /* Ensure proper text direction for mixed content */
        p {
            direction: rtl;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-school">مدرسة IICAR المهنية</div>
            <div class="header-subtitle">قسم البرامج المهنية</div>
        </div>

        <!-- Title -->
        <div class="title">${title}</div>

        <!-- Greeting -->
        <div class="greeting">إلى من يهمه الأمر،</div>

        <!-- Content -->
        <div class="content">
            <div class="intro-text">
                ${
                  params.programTitle
                    ? `يتم تقديم هذا الخطاب لـ <strong>${params.studentName}</strong> الذي أكمل بنجاح برنامج الشهادة المهنية في مجال <strong>${params.programTitle}</strong>.`
                    : `يتم تقديم ${isEndorsement ? 'شهادة التصديق المهنية' : 'خطاب التوصية'} هذه لـ <strong>${params.studentName}</strong> الذي أكمل بنجاح البرامج المهنية التالية:`
                }
            </div>

            ${programsListHTML}

            <div class="body-text">${params.bodyText.replace(/\n/g, '<br>')}</div>

            <div class="conclusion">${params.conclusionText.replace(/\n/g, '<br>')}</div>
        </div>

        <!-- Closing -->
        <div class="closing">مع أطيب التحيات،</div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-line"></div>
            <div class="registrar-info">${params.registrarName}</div>
            <div class="registrar-title">${params.registrarTitle}</div>
            <div class="school-name">${params.schoolName}</div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-date">تاريخ الإنشاء: ${params.generatedDate}</div>
            <div class="document-id">معرّف الوثيقة: ${params.type.substring(0, 3)}-${new Date().getTime()}</div>
        </div>
    </div>
</body>
</html>
  `
}

export function generateEnglishDocumentHTML(params: {
  type: 'recommendation' | 'endorsement'
  language: string
  studentName: string
  programTitle?: string
  programsList?: Array<{ title: string; completedDate: string }>
  bodyText: string
  conclusionText: string
  registrarName: string
  registrarTitle: string
  schoolName: string
  generatedDate: string
}): string {
  const isEndorsement = params.type === 'endorsement'
  const title = isEndorsement ? 'Professional Endorsement' : 'Letter of Recommendation'

  const programsListHTML = params.programsList
    ? `
      <div class="programs-list">
        ${params.programsList
          .map(
            (prog, idx) =>
              `<div class="program-item">${idx + 1}. ${prog.title} (Completed: ${prog.completedDate})</div>`
          )
          .join('')}
      </div>
    `
    : ''

  return `
<!DOCTYPE html>
<html lang="${params.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Georgia:wght@400;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', serif;
            color: #282828;
            line-height: 1.6;
            background-color: #ffffff;
        }

        @page {
            size: A4;
            margin: 20mm;
        }

        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
        }

        .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 25px;
            text-align: center;
            border-bottom: 3px solid #b8860b;
            margin-bottom: 30px;
            border-radius: 4px;
        }

        .header-school {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .header-subtitle {
            font-size: 12px;
            color: #b8860b;
            letter-spacing: 0.5px;
        }

        .title {
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            margin: 30px 0 20px 0;
            border-bottom: 2px solid #b8860b;
            padding-bottom: 15px;
        }

        .greeting {
            font-size: 14px;
            margin-bottom: 20px;
            font-weight: 500;
        }

        .content {
            font-size: 13px;
            line-height: 1.8;
            text-align: justify;
            margin-bottom: 20px;
        }

        .intro-text {
            margin-bottom: 15px;
        }

        .programs-list {
            background-color: #f8f8f8;
            padding: 15px 20px;
            border-left: 3px solid #b8860b;
            margin: 20px 0;
            border-radius: 4px;
        }

        .program-item {
            margin: 10px 0;
            font-size: 13px;
            line-height: 1.6;
        }

        .body-text {
            margin: 20px 0;
            font-size: 13px;
            line-height: 1.8;
            text-align: justify;
        }

        .conclusion {
            margin: 20px 0;
            font-size: 13px;
            line-height: 1.8;
            text-align: justify;
        }

        .closing {
            margin: 30px 0 10px 0;
            font-size: 13px;
            font-weight: 500;
        }

        .signature-section {
            margin-top: 40px;
            padding-top: 20px;
        }

        .signature-line {
            border-top: 1px solid #0f172a;
            width: 150px;
            margin: 40px 0 10px 0;
        }

        .registrar-info {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 3px;
        }

        .registrar-title {
            font-size: 12px;
            color: #555;
            margin-bottom: 3px;
        }

        .school-name {
            font-size: 12px;
            color: #555;
        }

        .footer {
            border-top: 1px solid #b8860b;
            margin-top: 40px;
            padding-top: 15px;
            text-align: center;
            font-size: 11px;
            color: #666;
        }

        .footer-date {
            margin-bottom: 5px;
        }

        .document-id {
            font-size: 9px;
            color: #999;
        }

        @media print {
            body {
                background-color: white;
            }
            .container {
                padding: 0;
                max-width: 100%;
            }
            .header {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-school">IICAR GLOBAL COLLEGE</div>
            <div class="header-subtitle">Professional School Division</div>
        </div>

        <!-- Title -->
        <div class="title">${title}</div>

        <!-- Greeting -->
        <div class="greeting">To Whom It May Concern,</div>

        <!-- Content -->
        <div class="content">
            <div class="intro-text">
                ${
                  params.programTitle
                    ? `This letter is provided for <strong>${params.studentName}</strong> who has successfully completed the professional certification in <strong>${params.programTitle}</strong> at IICAR Professional School.`
                    : `This ${isEndorsement ? 'professional endorsement' : 'letter of recommendation'} is provided for <strong>${params.studentName}</strong> who has successfully completed the following professional certification programs:`
                }
            </div>

            ${programsListHTML}

            <div class="body-text">${params.bodyText.replace(/\n/g, '<br>')}</div>

            <div class="conclusion">${params.conclusionText.replace(/\n/g, '<br>')}</div>
        </div>

        <!-- Closing -->
        <div class="closing">Sincerely,</div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-line"></div>
            <div class="registrar-info">${params.registrarName}</div>
            <div class="registrar-title">${params.registrarTitle}</div>
            <div class="school-name">${params.schoolName}</div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-date">Date: ${params.generatedDate}</div>
            <div class="document-id">Document ID: ${params.type.substring(0, 3)}-${new Date().getTime()}</div>
        </div>
    </div>
</body>
</html>
  `
}
