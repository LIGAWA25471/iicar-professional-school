# Arabic Certificate Preview Feature

## Overview
When users select Arabic (العربية) language for viewing certificates, instead of downloading a PDF, the system opens a beautiful HTML preview page with a print-to-PDF option. This avoids Puppeteer/PDF generation issues while providing a superior user experience.

## How It Works

### Certificate Preview Endpoint
**Route:** `/api/certificate/preview/[cert_id]?lang=ar`

Returns a fully styled HTML certificate with:
- Professional navy/gold design matching the PDF version
- Arabic text and right-to-left (RTL) layout
- Arabic date formatting (ar-SA locale)
- All certificate details (student name, program, level, score, signatures)

### User Workflow

1. **Admin navigates to Certificates page**
2. **Clicks "Download" icon on a certificate**
3. **Hovers to see language options**
4. **Selects "العربية" (Arabic)**
   - Opens new tab with HTML preview
   - Shows professional certificate with Print button
5. **Users can:**
   - View the certificate in browser
   - Print to PDF using Ctrl+P / Cmd+P
   - Print directly to printer
   - Share the verification link

### Available Languages

| Language | Behavior |
|----------|----------|
| English (en) | Downloads PDF |
| Arabic (ar) | Opens HTML preview with print button |
| French (fr) | Downloads PDF |
| Portuguese (pt) | Downloads PDF |

## Certificate Preview Features

**Interactive Elements:**
- Print Button - Opens browser print dialog
- Close Button - Closes the preview tab
- All buttons hidden when printing

**Print-Optimized:**
- Landscape orientation (A4)
- Professional formatting maintained
- Decorative elements scale properly
- Page breaks handled correctly

## Implementation Details

### Files Modified
- `app/api/certificate/preview/[cert_id]/route.ts` - New HTML preview endpoint
- `components/admin/certificate-table-row.tsx` - Updated download handlers

### Certificate Data Included
- Institution name and tagline (Arabic translated)
- Certificate title and subtitle (Arabic translated)
- Student name
- Program title
- Proficiency level with Arabic translation
- Final score (if available)
- Issue date (formatted in Arabic)
- Certificate ID
- Signature blocks for Director and Principal
- Recognition statement (Arabic translated)

### Styling
- Navy/Gold color scheme (#0f172a, #b8860b)
- Times New Roman font for professional appearance
- RTL text direction for Arabic
- Responsive design for all screen sizes
- Print-specific CSS hides buttons and optimizes spacing

## Technical Notes

- Fetches data from Supabase (profiles, programs, certificates tables)
- Uses certificate translations library for all text
- Automatic date localization based on language
- HTML returned as `text/html; charset=utf-8`
- No Puppeteer dependency - pure HTML/CSS rendering
- Accessible via browser print functionality

## Benefits

✅ No PDF generation errors
✅ Perfect Arabic support with RTL layout
✅ Professional appearance maintained
✅ Users have full browser print options
✅ Instantly loads without server-side processing
✅ Reduced server resource usage
