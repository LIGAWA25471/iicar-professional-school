# Exam Creation Guide - AI & Manual Modes

## Overview

The Special Exams feature now supports two ways to create exams:
1. **AI Generation** - Grok automatically generates 50-100 questions
2. **Manual Creation** - Admins manually add each question

## Database Setup (Required First)

Run the SQL migration from `scripts/db/01_create_exams_tables.sql` in your Supabase SQL Editor.

## Creating an Exam - AI Mode

### Best For:
- Quick exam creation
- Large question banks (50-100 questions)
- Consistent question quality
- Time-saving approach

### Steps:

1. Go to **Admin → Special Exams**
2. Click **Create New Exam**
3. Select **AI Generation** tab
4. Fill in exam details:
   - **Title**: e.g., "Python Fundamentals Exam"
   - **Subject**: e.g., "Python Programming"
   - **Difficulty**: Beginner, Intermediate, or Advanced
   - **Questions**: Slider for 50-100 questions
   - **Duration**: Exam time in minutes (default: 60)
   - **Passing Score**: Required percentage to pass (default: 70%)
   - **Description** (optional): Help Grok understand scope/focus areas
   - **Schedule Date** (optional): When exam becomes available

5. Click **Create Exam with AI Questions**
6. Wait for Grok to generate questions (30-60 seconds)
7. Success! Share the exam link

### AI Generation Details:

- **Model**: Grok 2 (via XAI_API_KEY)
- **Question Types**: Multiple choice, True/False, Short answer
- **Fallback**: If structured generation fails, text generation with JSON parsing
- **Quality**: Professional, well-explained answers with reasoning

## Creating an Exam - Manual Mode

### Best For:
- Custom questions with specific requirements
- Precise control over question content
- Specialized domains
- Question review/approval workflow

### Steps:

1. Go to **Admin → Special Exams**
2. Click **Create New Exam**
3. Select **Manual Questions** tab
4. Fill in exam details (same as AI mode)
5. **Add Questions** section:
   - Enter question text
   - Select question type:
     - **Multiple Choice**: Select 4 options (A, B, C, D)
     - **True/False**: Predefined options
     - **Short Answer**: Free text answer
   - Select difficulty (Easy, Medium, Hard)
   - Enter correct answer
   - Enter explanation
   - Click **Add Question**

6. Repeat until you have 50-100 questions
7. View added questions in the list below
8. Click **Create Exam with Manual Questions**

### Question Type Details:

**Multiple Choice**
```
Question: "What is the capital of France?"
Options: A, B, C, D
Correct Answer: A (Paris)
Explanation: "Paris is the capital and largest city of France..."
```

**True/False**
```
Question: "Python is dynamically typed?"
Correct Answer: True
Explanation: "Python uses dynamic typing, allowing variables..."
```

**Short Answer**
```
Question: "Name the three primary colors?"
Correct Answer: "Red, Yellow, Blue"
Explanation: "The three primary colors in traditional color theory..."
```

## Best Practices

### AI Mode:
- Be specific in the description field to guide question generation
- Adjust difficulty level to match your audience
- Use 50 questions for quicker exams, 100 for comprehensive assessments
- Test with a sample before sharing widely

### Manual Mode:
- Maintain consistency in question style and complexity
- Include detailed explanations for all answers
- Mix question types for better engagement
- Have at least one person review questions before publishing
- Follow your organization's standards for question formatting

### Both Modes:
- Set realistic passing scores (60-75% typical)
- Allow adequate time (1 minute per question minimum)
- Test the exam yourself before sharing
- Keep exams focused on specific learning outcomes
- Update exams regularly based on feedback

## Sharing Exams

Once created, exams get a unique shareable link:
```
https://yoursite.com/exam/[unique-token]
```

### Share with:
- Email: Send link directly to students
- QR Code: Print QR codes linking to exam
- Learning Platform: Embed or link in LMS
- Social Media: Share on professional networks
- Certificate Programs: Add as required assessment

## Exam Statistics

After exam creation, admins can see:
- Total questions
- Difficulty distribution
- Question types used
- Average completion time
- Pass rate across all takers
- Individual submission details

## Troubleshooting

### AI Generation Fails:
1. Check browser console (F12) for errors
2. Verify XAI_API_KEY is set in environment
3. Try with fewer questions (start at 50)
4. Simplify the subject/description

### Manual Questions Won't Add:
1. Ensure question text and explanation are filled
2. Check all required fields are complete
3. For multiple choice, verify all 4 options are entered
4. Select a correct answer from the provided options

### Exam Won't Publish:
1. Must have 50-100 questions
2. All required fields must be filled
3. Check browser console for detailed error
4. Ensure database tables are created (run SQL migration)

## Files & APIs

### Frontend
- `/app/admin/exams/create/page.tsx` - Create exam page
- `/components/admin/exam-create-form.tsx` - Create form with both modes

### Backend APIs
- `/api/admin/exams/create` - AI question generation endpoint
- `/api/admin/exams/manual` - Manual exam creation endpoint
- `/api/exam/submit` - Exam submission and scoring

### Database
- `exams` - Exam metadata
- `exam_questions` - Questions and answers
- `exam_attempts` - Submissions and scores
- `exam_question_responses` - Individual answers

## Support

For issues:
1. Check this guide first
2. See EXAMS_SETUP.md for database setup
3. Check SPECIAL_EXAMS_FEATURE.md for full feature overview
4. Review browser console (F12) for error messages
