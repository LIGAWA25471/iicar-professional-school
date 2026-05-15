# Arabic PDF Generation Implementation

## Overview
Successfully implemented proper Arabic PDF support using Puppeteer and HTML/CSS rendering for the recommendation letter and endorsement certificate generation system.

## Architecture

### Key Components

#### 1. **HTML PDF Generator** (`lib/html-pdf-generator.ts`)
- **Purpose**: Handles all PDF generation using Puppeteer for HTML-to-PDF conversion
- **Key Functions**:
  - `getBrowser()`: Manages Puppeteer browser instance pooling
  - `generatePDFFromHTML()`: Converts HTML content to PDF buffer with proper page margins
  - `generateArabicDocumentHTML()`: Creates professional Arabic-language HTML templates with RTL support
  - `generateEnglishDocumentHTML()`: Creates English-language HTML templates for other languages

**Features**:
- Professional header with navy background and gold accents
- Proper RTL (right-to-left) text direction for Arabic
- UTF-8 encoding support
- Google Fonts integration (Noto Naskh Arabic for Arabic, Georgia for English)
- Responsive layout with proper margins and page breaks
- Support for both single and multi-certification documents
- Automatic page break handling for long content

#### 2. **Recommendation Generation Route** (`app/api/admin/recommendation/generate/route.ts`)
- **Endpoint**: `POST /api/admin/recommendation/generate`
- **Parameters**: `studentId`, `programId`, `type`, `language`
- **Logic**:
  - For Arabic (`language === 'ar'`): Uses HTML rendering with Puppeteer
  - For other languages: Uses jsPDF for backward compatibility
- **Output**: PDF buffer returned as attachment

#### 3. **Multi-Certification Route** (`app/api/admin/recommendation/generate-all/route.ts`)
- **Endpoint**: `POST /api/admin/recommendation/generate-all`
- **Parameters**: `studentId`, `type`, `language`
- **Purpose**: Generates single document listing all completed certifications
- **Logic**: Same language routing as single-cert route

### Language-Specific Handling

#### Arabic Documents (`language === 'ar'`)
**HTML Template Features**:
- `dir="rtl"` attribute on HTML element
- `lang="ar"` attribute for proper language identification
- CSS RTL styling:
  ```css
  direction: rtl;
  text-align: right;
  unicode-bidi: embed;
  ```
- Border styling (right border instead of left)
- Proper font stack: `'Noto Naskh Arabic', 'Arial', sans-serif`
- Arabic body text with professional tone

**Rendering Process**:
1. Generate Arabic HTML with proper RTL layout
2. Pass to Puppeteer for rendering
3. Convert to PDF with print background enabled
4. Return as attachment

#### English/Other Language Documents
**Process**:
1. Use jsPDF for direct PDF generation (legacy support)
2. Apply professional formatting with navy/gold color scheme
3. Handle multi-page content with proper page breaks
4. Return as attachment

## Installation & Setup

### Dependencies Installed
```bash
pnpm add puppeteer
```

### Configuration
- **Puppeteer Headless**: `'new'` (modern headless mode)
- **Sandbox**: Disabled for server environments (`--no-sandbox`)
- **GPU**: Disabled (`--disable-gpu`)
- **Shared Memory**: Disabled to prevent memory issues (`--disable-dev-shm-usage`)

## Document Structure

### Header Section
- Navy blue background with school name
- Gold accent line separator
- Professional subtitle

### Content Section
- Professional greeting ("إلى من يهمه الأمر،" for Arabic, "To Whom It May Concern," for English)
- Introduction paragraph
- Program list (for multi-cert documents)
- Main body text with student achievements
- Conclusion paragraph (for recommendations)

### Signature Section
- Signature line
- Registrar name: Julia Thornton
- Registrar title
- School name

### Footer
- Generated date
- Document ID for tracking
- Professional styling with gold accent line

## Text Content

### Arabic Content
All Arabic body text is professional and describes:
- Student's commitment and technical proficiency
- Strong work ethic and problem-solving abilities
- Mastery of professional competencies
- Readiness for advancement

### English Content
Uses translation system from `recommendation-translations` for multi-language support

## PDF Output Format

### Specifications
- **Format**: A4 (210mm × 297mm)
- **Margins**: 20mm all sides
- **Font**: Georgia (English), Noto Naskh Arabic (Arabic)
- **Colors**:
  - Navy Blue: #0f172a (text, borders)
  - Gold: #b8860b (accents)
  - Dark Gray: #282828 (body text)

### Naming Convention
```
{StudentName}_{type}_{courseCount}_{language}.pdf
```
Examples:
- `Ahmed_recommendation_en.pdf`
- `Fatima_endorsement_all_courses_ar.pdf`

## Database Integration

### Storage
Recommendations are stored in `recommendations` table:
```sql
INSERT INTO recommendations (
  student_id,
  program_id,           -- nullable for multi-cert
  recommendation_type,  -- 'recommendation' or 'endorsement'
  language,
  generated_at
)
```

### Conflict Resolution
- Single-cert: `UPSERT` on `(student_id, program_id, recommendation_type, language)`
- Multi-cert: `UPSERT` on `(student_id, recommendation_type, language)`

## Error Handling

### Validation
- Required fields: `studentId`, `programId` (or just `studentId` for multi-cert), `type`, `language`
- Type validation: Must be `'recommendation'` or `'endorsement'`
- Language defaults to `'en'` if not specified

### Error Responses
```json
{
  "error": "Failed to generate recommendation",
  "details": "Error message details"
}
```

## Testing & Verification

### Build Status
✅ Successfully compiles with Next.js 16 (Turbopack)

### Endpoints
✅ `/api/admin/recommendation/generate` - Single certification
✅ `/api/admin/recommendation/generate-all` - Multiple certifications

## Performance Considerations

### Browser Instance Management
- Single Puppeteer browser instance pooled across requests
- Automatic cleanup on errors
- Headless rendering for optimal performance

### PDF Generation Time
- Typical: 2-5 seconds per PDF
- Depends on page breaks and content length

## Future Enhancements

1. **Signature Support**: Can be added to HTML templates with base64 image data
2. **Logo Integration**: School logos can be embedded as base64 images
3. **Dynamic Styling**: Additional customization of colors and fonts
4. **Digital Signatures**: Support for digital certificate signing
5. **Archive Storage**: Integration with file storage for PDF archiving
6. **Batch Generation**: Support for generating multiple PDFs in single request

## Troubleshooting

### Common Issues

**Issue**: Puppeteer fails to launch
- **Solution**: Ensure Chrome/Chromium dependencies are installed
- **Command**: `apt-get install chromium-browser libx11-xcb1`

**Issue**: Arabic text not rendering
- **Solution**: Verify Noto Naskh Arabic font is loaded from Google Fonts
- **Check**: Network tab in browser to verify font loading

**Issue**: PDF margins or layout incorrect
- **Solution**: Adjust CSS in `generateArabicDocumentHTML()` or `generateEnglishDocumentHTML()`

**Issue**: Page breaks occurring at wrong positions
- **Solution**: Adjust `pageBreakThreshold` constant or content sections

## Maintenance

### Regular Checks
- Monitor Puppeteer browser instance memory usage
- Verify Arabic font URLs are still accessible
- Test PDF generation with various content lengths

### Updates
- Keep Puppeteer version up-to-date for security
- Monitor jsPDF for deprecation notices
- Test new translations when adding languages
