# Arabic HTML Preview - User Guide

## Overview

Instead of directly generating PDFs, you can now get printable HTML versions of recommendation letters and endorsement certificates in Arabic. These HTML documents can be viewed in a browser and printed to PDF using the browser's print functionality.

## Why HTML Preview?

✅ **Advantages:**
- Works reliably without server-side PDF generation dependencies
- Full support for Arabic text with proper RTL (right-to-left) rendering
- Beautiful professional styling with navy/gold branding
- Print directly from browser to PDF
- No Puppeteer or Chromium installation required
- Instant generation with zero latency

## API Endpoints

### 1. Single Certification Preview
**Endpoint:** `GET /api/admin/recommendation/preview`

**Parameters:**
- `studentId` (required): UUID of the student
- `programId` (required): UUID of the program
- `type` (optional): `recommendation` or `endorsement` (default: `recommendation`)
- `language` (optional): `ar`, `en`, `fr`, or `pt` (default: `ar`)

**Example:**
```
https://yourdomain.com/api/admin/recommendation/preview?studentId=abc-123&programId=xyz-789&type=recommendation&language=ar
```

**Response:** HTML document ready for viewing/printing

---

### 2. Multiple Certifications Preview
**Endpoint:** `GET /api/admin/recommendation/preview-all`

**Parameters:**
- `studentId` (required): UUID of the student
- `type` (optional): `recommendation` or `endorsement` (default: `recommendation`)
- `language` (optional): `ar`, `en`, `fr`, or `pt` (default: `ar`)

**Description:** Generates a single document showing all completed certifications for a student

**Example:**
```
https://yourdomain.com/api/admin/recommendation/preview-all?studentId=abc-123&type=recommendation&language=ar
```

**Response:** HTML document with all certifications listed

---

## How to Use

### From Browser
1. Simply paste the endpoint URL into your browser address bar
2. The HTML document will load and display professionally formatted
3. Click **Print** (Ctrl+P or Cmd+P) to open the print dialog
4. Select "Save as PDF" as your print destination
5. Click Print to generate the PDF

### From Admin Dashboard
Add a button that opens the preview URL in a new window:

```javascript
// Example implementation
const openPreview = (studentId, programId, language = 'ar') => {
  const url = `/api/admin/recommendation/preview?studentId=${studentId}&programId=${programId}&language=${language}`
  window.open(url, '_blank')
}
```

### Downloading as PDF
The document is designed for optimal printing. Most browsers will offer PDF download options in the print dialog.

---

## Document Features

✨ **Professional Design:**
- Navy blue header with gold accents
- Proper Arabic typography using Google Fonts (Noto Naskh Arabic)
- Right-to-left text direction
- Justified text alignment
- Print-optimized styling

✏️ **Content:**
- Student name
- Program title
- Completion date
- Professional recommendation or endorsement text
- Registrar signature area
- Document footer with date and ID

📄 **Print Features:**
- A4 page format
- 20mm margins on all sides
- Page numbers in Arabic
- Professional header and footer
- Break handling for multi-page documents

---

## Supported Languages

| Code | Language | Direction |
|------|----------|-----------|
| `ar` | العربية (Arabic) | RTL |
| `en` | English | LTR |
| `fr` | Français (French) | LTR |
| `pt` | Português (Portuguese) | LTR |

---

## Document Types

### Recommendation Letter
Professional recommendation for a student's skills and achievements

### Endorsement Certificate
Professional endorsement confirming completion and competency

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Arabic text appears jumbled | Ensure your browser supports Unicode. Use Chrome, Firefox, Safari, or Edge. |
| Text appears left-to-right instead of right-to-left | Clear browser cache and refresh the page |
| PDF looks different from HTML | Print settings matter - use "Landscape" if content seems cut off |
| Document not loading | Check that studentId/programId are valid UUIDs in the database |

---

## API Error Responses

```json
// Missing parameters
{"error":"Missing required parameters: studentId and programId"}

// Invalid type
{"error":"Invalid type - must be \"recommendation\" or \"endorsement\""}

// Student not found
{"error":"Student not found"}

// Program not found
{"error":"Program not found"}

// Not enrolled
{"error":"Student is not enrolled in this program"}

// No completed enrollments (for preview-all)
{"error":"No completed enrollments found for this student"}
```

---

## Integration with Frontend

Example React component:

```jsx
import { useState } from 'react'

export function PreviewButton({ studentId, programId, language = 'ar' }) {
  const [loading, setLoading] = useState(false)

  const handlePreview = () => {
    setLoading(true)
    const url = `/api/admin/recommendation/preview?studentId=${studentId}&programId=${programId}&language=${language}`
    window.open(url, '_blank')
    setLoading(false)
  }

  return (
    <button onClick={handlePreview} disabled={loading}>
      {loading ? 'Loading...' : 'Preview Document'}
    </button>
  )
}
```

---

## Performance Notes

- ⚡ Instant generation (no server PDF rendering)
- 📊 Minimal server resources used
- 🔄 No queuing or processing delays
- 💾 No file storage needed

---

## Future Enhancements

Possible additions:
- Direct PDF download endpoint (using browser automation or external service)
- Email delivery of documents
- Document archive/history
- Custom branding/logo support
- Digital signatures
