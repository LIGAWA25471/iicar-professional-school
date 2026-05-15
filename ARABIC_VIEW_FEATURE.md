# Arabic View Feature Documentation

## Overview

The Arabic documents now feature a "View" option instead of "Download PDF". This allows users to view beautifully formatted Arabic HTML documents in the browser with full print-to-PDF capability.

## How It Works

### For Individual Documents
1. Navigate to the Certificates or Student Details page
2. Select **العربية (Arabic)** from the language options
3. Click **View Recommendation** or **View Endorsement**
4. A new browser tab opens showing the formatted Arabic document
5. Press **Ctrl+P** (or **Cmd+P** on Mac) to print/save as PDF

### For Combined Documents
1. Select **العربية (Arabic)** language
2. Click **View Combined Recommendation** or **View Combined Endorsement**
3. Document opens showing all certifications in one page
4. Print to PDF using browser print function

### For All Separate Documents
1. Select **العربية (Arabic)** language
2. Click **View All Recommendations Separately** or **View All Endorsements Separately**
3. Multiple browser tabs open, one for each certification
4. Print each tab to PDF as needed

## UI Changes

### Button Labels
- **Arabic**: Shows "View" with an eye icon
- **Other Languages**: Shows "Download" with a download icon

### Button Colors
- **Combined Recommendation**: Cyan (Arabic) / Indigo (Others)
- **Combined Endorsement**: Orange (Arabic) / Amber (Others)
- **Individual**: Eye icon for Arabic, Download icon for others

### Loading States
- **Arabic**: "Opening..." message
- **Other Languages**: "Generating..." message

## Endpoints

### Preview Endpoints
All preview endpoints are GET requests that return HTML:

**Single Certificate Preview:**
```
/api/admin/recommendation/preview?studentId={id}&programId={id}&type=recommendation&language=ar
```

**Multi-Certificate Preview:**
```
/api/admin/recommendation/preview-all?studentId={id}&type=recommendation&language=ar
```

Parameters:
- `studentId`: Student's unique ID
- `programId`: Program ID (not needed for preview-all)
- `type`: "recommendation" or "endorsement"
- `language`: "ar" (and other supported languages)

## Features

### Print-Optimized Design
- Professional header with navy background and gold accent
- RTL (right-to-left) text support
- Proper margins and page breaks
- Signature section with registrar information
- Footer with document ID and generation date

### Arabic Typography
- Uses Noto Naskh Arabic font for authentic Arabic text
- Proper glyph shaping and character connections
- Direction: rtl for proper text flow
- Text alignment: right-aligned

### Print to PDF
Users can save HTML documents as PDF using browser's print function:

**Chrome/Edge:**
1. Ctrl+P (or Cmd+P on Mac)
2. Set destination to "Save as PDF"
3. Click Save

**Firefox:**
1. Ctrl+P (or Cmd+P on Mac)
2. Select "Print to File" 
3. Save as PDF

## Advantages Over PDF Generation

✅ **Instant Loading** - No server-side processing required
✅ **No Dependencies** - No Puppeteer or Chromium issues
✅ **User Control** - Users choose their PDF settings (orientation, margins, etc.)
✅ **Reliable** - HTML rendering is stable across all browsers
✅ **Professional Output** - Print output matches browser rendering exactly
✅ **Accessible** - Full Arabic text support with proper RTL formatting

## Supported Languages

- Arabic (العربية) - Opens HTML preview with View option
- English - Downloads PDF
- French (Français) - Downloads PDF
- Portuguese (Português) - Downloads PDF

## Integration Points

- `/components/admin/recommendation-generator.tsx` - UI component
- `/app/api/admin/recommendation/preview/route.ts` - Single cert preview
- `/app/api/admin/recommendation/preview-all/route.ts` - Multi-cert preview
- `/lib/html-pdf-generator.ts` - HTML generation utilities

## Future Enhancements

- Direct PDF download for Arabic if Puppeteer issues are resolved
- Email sending with HTML attachment
- Document signing functionality
- Batch operations for multiple students
