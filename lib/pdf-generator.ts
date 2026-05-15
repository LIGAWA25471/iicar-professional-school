import puppeteer, { Browser, Page } from 'puppeteer'

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    })
  }
  return browser
}

export async function closeBrowser() {
  if (browser) {
    await browser.close()
    browser = null
  }
}

interface PDFOptions {
  language?: 'en' | 'fr' | 'pt' | 'ar'
  filename?: string
}

/**
 * Generate PDF from HTML content with proper support for Arabic and RTL languages.
 * Uses Puppeteer to render HTML to PDF, ensuring proper font rendering, RTL support,
 * and glyph shaping for Arabic text.
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const { language = 'en' } = options

  const br = await getBrowser()
  const page = await br.newPage()

  try {
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 1600 })

    // Set content with proper language and encoding
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Configure for Arabic/RTL if needed
    if (language === 'ar') {
      await page.evaluate(() => {
        document.documentElement.setAttribute('dir', 'rtl')
        document.documentElement.setAttribute('lang', 'ar')
      })
    }

    // Generate PDF with proper settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 30000,
    })

    return pdfBuffer
  } finally {
    await page.close()
  }
}

/**
 * Generate HTML for recommendation/endorsement letter with proper Arabic support.
 * Returns HTML string ready to be converted to PDF.
 */
export function generateRecommendationHTML(params: {
  type: 'recommendation' | 'endorsement'
  language: 'en' | 'fr' | 'pt' | 'ar'
  studentName: string
  programTitle?: string
  bodyText: string
  conclusionText?: string
  registrarName?: string
  registrarTitle?: string
  schoolName?: string
  generatedDate?: string
  programsList?: Array<{ title: string; completedDate: string }>
}): string {
  const {
    type,
    language,
    studentName,
    programTitle,
    bodyText,
    conclusionText,
    registrarName = 'Julia Thornton',
    registrarTitle = 'Office of the Registrar',
    schoolName = 'IICAR Professional School',
    generatedDate,
    programsList,
  } = params

  const isArabic = language === 'ar'
  const isRTL = isArabic

  // Determine direction and text alignment
  const direction = isRTL ? 'rtl' : 'ltr'
  const textAlign = isRTL ? 'right' : 'left'
  const marginLeft = isRTL ? '0' : '25mm'
  const marginRight = isRTL ? '25mm' : '0'

  const titleText =
    type === 'recommendation' ? 'Letter of Recommendation' : 'Professional Endorsement'

  const programsListHTML = programsList
    ? programsList
        .map(
          (prog, idx) =>
            `<li style="margin: 8px 0; direction: ${direction}; text-align: ${textAlign};">
           ${idx + 1}. ${prog.title} (Completed: ${prog.completedDate})
         </li>`
        )
        .join('')
    : ''

  return `
<!DOCTYPE html>
<html dir="${direction}" lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleText}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Georgia&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      direction: ${direction};
    }
    
    body {
      font-family: 'Georgia', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #2f2f2f;
      direction: ${direction};
      unicode-bidi: embed;
      padding: 20mm;
    }
    
    ${isArabic ? `body { font-family: 'Noto Naskh Arabic', 'Georgia', serif; }` : ''}
    
    .header {
      text-align: center;
      margin-bottom: 20mm;
      padding-bottom: 10mm;
      border-bottom: 2px solid #0f172a;
    }
    
    .header-title {
      font-size: 14pt;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 5mm;
      direction: ${direction};
    }
    
    .document-title {
      font-size: 16pt;
      font-weight: bold;
      color: #0f172a;
      text-align: center;
      margin: 15mm 0;
      direction: ${direction};
    }
    
    .greeting {
      margin: 10mm 0;
      text-align: ${textAlign};
      direction: ${direction};
    }
    
    .body-text {
      margin: 10mm 0;
      text-align: justify;
      direction: ${direction};
      unicode-bidi: embed;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.8;
    }
    
    .conclusion {
      margin: 10mm 0;
      text-align: justify;
      direction: ${direction};
      unicode-bidi: embed;
    }
    
    .programs-list {
      margin: 10mm 0;
      direction: ${direction};
      padding-${isRTL ? 'right' : 'left'}: 20mm;
    }
    
    .programs-list li {
      margin: 8px 0;
      direction: ${direction};
      text-align: ${textAlign};
    }
    
    .signature-section {
      margin-top: 20mm;
      padding-top: 10mm;
      direction: ${direction};
    }
    
    .signature-line {
      display: inline-block;
      width: 50mm;
      border-bottom: 1px solid #0f172a;
      margin: 15mm 0 5mm 0;
      direction: ${direction};
    }
    
    .registrar-name {
      font-weight: bold;
      margin: 10mm 0 0 0;
      direction: ${direction};
    }
    
    .registrar-title {
      font-size: 10pt;
      color: #505050;
      margin: 2mm 0;
      direction: ${direction};
    }
    
    .footer {
      margin-top: 15mm;
      padding-top: 10mm;
      border-top: 1px solid #e0e0e0;
      font-size: 9pt;
      color: #808080;
      text-align: ${textAlign};
      direction: ${direction};
    }
    
    @page {
      margin: 20mm;
      size: A4;
    }
    
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">${schoolName}</div>
  </div>
  
  <div class="document-title">${titleText}</div>
  
  <div class="greeting">To Whom It May Concern,</div>
  
  ${
    programsList && programsList.length > 0
      ? `
    <div class="body-text" style="margin-bottom: 8mm;">
      This letter of recommendation is provided for ${studentName}, who has successfully completed the following professional certification program(s):
    </div>
    <div class="programs-list">
      <ul>${programsListHTML}</ul>
    </div>
    `
      : ''
  }
  
  <div class="body-text">${bodyText}</div>
  
  ${conclusionText ? `<div class="conclusion">${conclusionText}</div>` : ''}
  
  <div class="signature-section">
    <div style="direction: ${direction};">Sincerely,</div>
    <div class="signature-line"></div>
    <div class="registrar-name" style="direction: ${direction};">${registrarName}</div>
    <div class="registrar-title" style="direction: ${direction};">${registrarTitle}</div>
    <div class="registrar-title" style="direction: ${direction}; margin-top: 2mm;">${schoolName}</div>
  </div>
  
  ${
    generatedDate
      ? `<div class="footer" style="direction: ${direction};">Generated: ${generatedDate}</div>`
      : ''
  }
</body>
</html>
  `.trim()
}
