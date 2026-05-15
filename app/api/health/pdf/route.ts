import { NextResponse } from 'next/server'
import { generatePDFFromHTML } from '@/lib/html-pdf-generator'

export async function GET() {
  try {
    console.log('[v0] PDF health check: Starting Puppeteer test...')
    
    // Test simple HTML rendering
    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0f172a; }
        </style>
      </head>
      <body>
        <h1>PDF Generation Health Check</h1>
        <p>If you see this PDF, Puppeteer is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </body>
      </html>
    `

    console.log('[v0] Attempting to generate test PDF...')
    const pdfBuffer = await generatePDFFromHTML(testHTML)
    
    console.log('[v0] PDF generation successful, size:', pdfBuffer.length, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="health-check.pdf"',
      },
    })
  } catch (error) {
    console.error('[v0] PDF health check failed:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      status: 'error',
      message: 'PDF generation service health check failed',
      error: errorMessage,
      details: String(error)
    }, { status: 500 })
  }
}
