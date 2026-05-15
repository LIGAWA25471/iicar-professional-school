# Arabic Certificate Generation Feature

## Overview

Certificates can now be generated in Arabic (العربية) with full Arabic translations and proper professional formatting. This matches the same functionality available for Recommendations and Endorsements.

## Implementation Details

### Files Modified

1. **lib/certificate-translations.ts**
   - Added 'ar' to CertificateLanguage type
   - Added complete Arabic translations for all certificate text:
     - Certificate title, subtitle, body text
     - Achievement levels (أساسي, متوسط, متقدم, احترافي, خبير)
     - Labels (Level, Issued, etc.)
   - Added ar-SA locale for proper Arabic date formatting

2. **app/api/certificate/download/[cert_id]/route.ts**
   - Added Arabic locale mapping (ar-SA)
   - Updated score label to support Arabic
   - Certificates automatically generate with Arabic text when lang=ar is passed

3. **components/admin/certificate-table-row.tsx**
   - Arabic (العربية) already included in LANGUAGES dropdown
   - Users can select Arabic from Download/Print menus

## How to Use

### From the Admin Certificates Page

1. Navigate to Admin → Certificates
2. Find the certificate you want to download
3. Hover over the **Download** icon
4. Select **العربية** (Arabic) from the dropdown menu
5. Certificate downloads as Arabic PDF

### Generating Arabic Certificates Programmatically

```bash
# Get certificate in Arabic
curl https://iicar.org/api/certificate/download/CERT123?lang=ar
```

## Certificate Content in Arabic

The certificate includes these elements translated to Arabic:

- **Title**: شهادة الإنجاز (Certificate of Achievement)
- **Subtitle**: شهادة مهنية (Professional Certification)
- **Award Text**: تُمنح هذه الشهادة المرموقة إلى... (This prestigious certificate is awarded to...)
- **Completion Text**: لاستكمال برنامج الشهادة المهنية بنجاح في (for successfully completing the professional certification in)
- **Levels**: أساسي (Foundation), متوسط (Intermediate), متقدم (Advanced), احترافي (Professional), خبير (Expert)
- **Recognition**: تعترف هذه الشهادة بالتميز والكفاءة المهنية المثبتة في التطوير المهني
- **Date Format**: Arabic Saudi Arabia locale (e.g., ١٥ مايو ٢٠٢٦)

## Supported Languages

The certificate system now supports:
- **English** (English)
- **العربية** (Arabic)
- **Français** (French)
- **Português** (Portuguese)

## Design Features

- Professional navy blue and gold color scheme (language-independent)
- RTL-compatible text layout
- Proper date localization for each language
- Signature blocks with translated labels
- Verification QR code and certificate ID

## Integration with Recommendations/Endorsements

Just like recommendations and endorsements, certificates:
- Support multiple languages
- Can be generated on-demand from admin interface
- Generate with proper translated labels and localized dates
- Maintain consistent professional branding

## Date Formatting Examples

- **English**: 15 May 2026
- **Arabic**: ١٥ مايو ٢٠٢٦
- **French**: 15 mai 2026
- **Portuguese**: 15 de maio de 2026
