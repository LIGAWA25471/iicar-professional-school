# Special Exams Feature Documentation

## Overview

The Special Exams feature allows administrators to create AI-generated exams with 50-100 questions that can be shared via a unique link. Anyone with the link can take the exam without being an existing student.

## Key Features

- **AI-Generated Questions**: Uses Grok AI to automatically generate exam questions
- **Flexible Question Formats**: Multiple choice, true/false, and short answer questions
- **Question Count**: Exams can have between 50-100 questions
- **Shareable Links**: Each exam gets a unique token-based URL for easy sharing
- **Public Access**: Anyone with the link can take the exam (no registration needed)
- **Score Tracking**: Automatic scoring and results display
- **Result Storage**: All exam attempts and responses are stored for admin review
- **Customizable Settings**: Duration, passing score, difficulty level, and more

## Database Schema

### Tables Created

1. **exams** - Stores exam metadata
   - Title, description, subject, difficulty level
   - Duration, passing score, total questions
   - Status (draft, published, scheduled, active, closed)
   - Share token for public access

2. **exam_questions** - Stores individual questions
   - Question text, type, difficulty
   - Options (for multiple choice)
   - Correct answer and explanation
   - Order position

3. **exam_attempts** - Tracks exam submissions
   - Respondent info (name, email)
   - Score percentage and pass/fail status
   - Time taken
   - IP address and user agent

4. **exam_question_responses** - Stores individual answers
   - User's answer for each question
   - Correctness and marks obtained
   - Time spent on question

## Admin Pages

### Exams Management (/admin/exams)

Lists all exams created by the admin with:
- Exam title, subject, difficulty
- Number of questions
- Current status
- Share link (copy to clipboard)
- Quick actions to view responses or preview

### Create Exam (/admin/exams/create)

Form to create a new exam with:
- **Title**: Name of the exam
- **Subject**: Topic for AI question generation
- **Description**: Additional context for questions (optional)
- **Difficulty Level**: Beginner, Intermediate, or Advanced
- **Total Questions**: Slider between 50-100
- **Duration**: Time limit in minutes
- **Passing Score**: Percentage needed to pass
- **Scheduled Date**: Optional scheduling for future availability

AI automatically generates questions based on these inputs.

## Public Pages

### Exam Taking (/exam/[token])

Public page where test takers:
1. Enter their name and email
2. Start the exam
3. Navigate through questions with timer
4. Submit answers
5. View results with score and pass/fail status

## API Endpoints

### POST /api/admin/exams/create

Creates a new exam and generates questions with AI.

**Request Body:**
```json
{
  "title": "AWS Solutions Architect",
  "subject": "Cloud Computing",
  "description": "Focus on EC2, S3, RDS, Lambda",
  "difficulty_level": "intermediate",
  "total_questions": 75,
  "duration_minutes": 90,
  "passing_score": 75,
  "scheduled_date": "2026-06-01T14:00:00Z"
}
```

**Response:**
```json
{
  "exam": {
    "id": "uuid",
    "title": "AWS Solutions Architect",
    "share_token": "hex_string",
    "status": "published",
    "question_count": 75
  }
}
```

### POST /api/exam/submit

Submits exam answers and returns score.

**Request Body:**
```json
{
  "exam_id": "uuid",
  "token": "share_token",
  "respondent_name": "John Doe",
  "respondent_email": "john@example.com",
  "answers": {
    "question_id_1": "A",
    "question_id_2": "true",
    "question_id_3": "Some answer text"
  },
  "time_taken_seconds": 3600
}
```

**Response:**
```json
{
  "success": true,
  "score": 85.5,
  "passed": true,
  "attempt_id": "uuid"
}
```

## How to Use

### For Admins

1. Go to Admin > Special Exams
2. Click "Create New Exam"
3. Fill in the exam details
4. Click "Create Exam with AI Questions" (AI generates questions)
5. Copy the share link to distribute to test takers

### For Test Takers

1. Receive the exam link
2. Visit the link in a browser
3. Enter name and email
4. Click "Start Exam"
5. Answer questions (navigate with Previous/Next)
6. Submit exam when ready
7. View results immediately

## Navigation

Added to Admin sidebar under "Special Exams" with icon for easy access.

## Technical Details

- **AI Model**: Grok 2 via Vercel AI Gateway
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Share token-based (public access)
- **Scoring**: Server-side calculation for accuracy
- **Storage**: Full response tracking for admin review

## Security

- RLS policies prevent unauthorized access
- Admin-only for creating/managing exams
- Public read-only access to published exams
- Share tokens are cryptographically secure
- Responses tied to IP and user agent

## Future Enhancements

- Exam analytics dashboard
- Question bank management
- Bulk email results
- Certificates upon passing
- Proctoring features
- API for third-party integration
