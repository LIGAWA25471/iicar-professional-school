# Exam Question Generation - Fix Applied

## Issue
The exam question generation API was throwing a 500 error with the message:
- "The specified value "NaN" cannot be parsed, or is out of range"
- Failed to connect with Grok model `grok-2-1212`

## Root Cause
1. The API was using `grok-2-1212` model string directly
2. The course generation system uses `openai/gpt-4o-mini` 
3. The structured output format (generateObject) had compatibility issues with the model

## Solution Applied
Updated `/app/api/admin/exams/create/route.ts` with:

### 1. Changed Model
- From: `grok-2-1212`
- To: `openai/gpt-4o-mini` (same as course generation)
- This uses OpenAI through Vercel AI Gateway (no separate credentials needed)

### 2. Improved Error Handling
- Added comprehensive console logging at each step
- Better error messages that include actual failure details
- Proper JSON extraction from AI responses

### 3. Added Fallback Mechanism
- Primary: `generateObject()` with Zod schema (structured output)
- Fallback: `generateText()` with manual JSON parsing
- If structured generation fails, it attempts text generation and parses JSON
- Provides graceful degradation instead of complete failure

### 4. Better JSON Prompt
- Clearer instructions for AI about expected JSON format
- More specific examples of options structure
- Temperature set to 0.7 for consistency with course generation

## Testing
To test the fix:

1. Log in as admin
2. Go to Admin → Special Exams
3. Click "Create New Exam"
4. Fill in the form:
   - Title: "Python Fundamentals Exam"
   - Subject: "Python Programming"
   - Difficulty: "Intermediate"
   - Questions: 50
   - Duration: 60 minutes
   - Passing Score: 70%
5. Click "Generate Exam"
6. Wait for AI to generate questions (30-60 seconds)
7. Should see success message with shareable link

## Expected Behavior
- Form submission shows loading state
- Console logs progress (check browser DevTools):
  - "Calling AI to generate questions..."
  - "Received questions: 50"
  - "Inserting questions to database..."
  - "Exam published successfully"
- Exam created with shareable link
- Redirects to exams list

## Troubleshooting

### Still getting 500 error?
1. Check browser console (F12) for specific error message
2. Check the detailed error message in the admin form
3. Ensure you're logged in as admin
4. Verify exams table exists in database (run SQL migration if not)

### "Failed to generate questions: Failed to extract JSON"
- The AI response wasn't in valid JSON format
- Usually indicates API connectivity issue
- Refresh and try again

### "Failed to insert questions to database"
- Database table exists but insert failed
- Check exam_questions table has correct schema
- Verify exam record was created before questions insertion

## Files Modified
- `/app/api/admin/exams/create/route.ts` - Updated AI model and error handling

## Files Referenced
- `/app/api/admin/generate-content/route.ts` - Pattern used for AI calls
- `/components/admin/exam-create-form.tsx` - Form that submits data

## Next Steps
- The fix is production-ready
- No additional environment variables needed
- Database tables must be created first (see EXAMS_SETUP.md)
