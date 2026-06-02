# Exam Submission Troubleshooting Guide

## Quick Fix Checklist

If your exam submission is failing, try these steps in order:

- [ ] Check your internet connection (WiFi or mobile data)
- [ ] Refresh the exam page (F5 or Cmd+R)
- [ ] Try a different web browser (Chrome, Firefox, Safari, Edge)
- [ ] Clear browser cache (Ctrl+Shift+Del or Cmd+Shift+Delete)
- [ ] Check that all answers are filled in
- [ ] Wait 30 seconds and try submitting again
- [ ] If still failing, see detailed solutions below

---

## For Students: Error Solutions

### "No internet connection. Please check your network and try again."

**What it means**: Your device cannot reach the exam server.

**Quick fixes**:
1. Check if WiFi is working:
   - Try opening Google.com in a new tab
   - If Google doesn't load, WiFi is down
2. Check mobile data:
   - Turn WiFi off and retry with mobile data
   - Ask to borrow a hotspot if available
3. Move closer to WiFi router (if too far away)
4. Restart your WiFi router (wait 30 seconds, turn back on)
5. Restart your device

**If still not working**:
- Contact your instructor immediately
- Take the exam on a different device
- Use a different internet connection (mobile hotspot, different WiFi)

---

### "Invalid or expired exam link"

**What it means**: The exam link you're using is no longer valid.

**Solutions**:
1. Ask your instructor to resend the exam link
2. Check your email for a new link
3. Copy and paste the link exactly (don't type it)
4. Make sure the link starts with `https://` or `http://`

**If the link looks correct**:
- The exam may have been closed by your instructor
- Contact instructor to request access again

---

### "Invalid email format"

**What it means**: The email address you entered isn't valid.

**Correct format**:
- ✓ name@domain.com
- ✓ firstname.lastname@domain.co.uk
- ✗ @domain.com (missing name)
- ✗ name@domain (missing .com)
- ✗ name @domain.com (space before @)

**Fix**:
1. Check for typos in your email
2. Make sure you have @ symbol
3. Make sure domain ends with .com, .org, .edu, etc.
4. No spaces before or after email address

---

### "Please answer at least one question before submitting"

**What it means**: You haven't answered any questions yet.

**Solutions**:
1. Scroll through all questions
2. Select an answer for at least one question:
   - Multiple choice: Click one of the A, B, C, D options
   - True/False: Click True or False
   - Short answer: Type in the text box
3. Make sure the answer is selected (there should be a mark next to it)
4. Try submitting again

---

### "Server error processing your submission. Please try again."

**What it means**: The exam server had a temporary problem.

**What to do**:
1. **Automatic retries**: The system will try 3 times automatically
2. **Wait 1-2 minutes**: Server might be temporarily busy
3. **Try again**: Click Submit Exam button again
4. **Try different browser**: Switch to Chrome, Firefox, or Safari
5. **Contact instructor**: If it keeps failing after 5 attempts

**System will:**
- Automatically retry up to 3 times
- Wait between retries to give server time to recover
- Show you the progress ("Submitting attempt 1/3", etc.)

---

### "Exam submitted but some response details may not have been saved"

**What it means**: Your answers were recorded, but some details are missing.

**What happens**:
- ✓ Your exam is submitted
- ✓ Your score is recorded
- ✓ You passed or failed result is saved
- ? Some question details might be incomplete

**What to do**:
- Your submission is successful - score already recorded
- Contact instructor if you want details reviewed
- No need to resubmit

---

### Time Ran Out / Auto-Submission

**What happens when timer reaches 00:00**:
- Exam automatically submits your current answers
- Timer shows "Time's up!"
- System sends answers to server automatically
- You'll see results screen

**To avoid this**:
- Watch the timer at top right of screen
- Answer all questions before timer expires
- Click "Submit Exam" with plenty of time remaining (at least 1 minute)
- Don't wait until last second

**If auto-submit fails**:
- Refresh the page
- Your answers may still be saved locally
- Try submitting again

---

## For Admins: Helping Students Submit

### When a Student Says "Submission Failed"

**Step 1: Check the monitoring dashboard**
1. Go to Admin → Special Exams
2. Click the chart icon (📊) next to the exam
3. Look for the student's name in the submissions table
4. If they appear = submission was successful!
5. If they don't appear after 5 minutes = submission truly failed

**Step 2: Troubleshoot with the student**

**Ask them**:
- "What error message do you see exactly?"
- "Are you connected to internet?"
- "Can you open Google.com in a new tab?"
- "Which browser are you using?"
- "Which device (computer, phone, tablet)?"

**Common issues and quick fixes**:

| Issue | What to Tell Student |
|-------|---------------------|
| No internet | "Check WiFi/mobile data. Try Google.com. Restart WiFi router." |
| Invalid exam link | "I'm resending you a new link. Check your email." |
| Invalid email | "Make sure your email is correct: name@domain.com with no spaces." |
| Answers not being recorded | "Make sure you're clicking/selecting answers clearly." |
| Browser freeze | "Close the browser completely, reopen, and try different browser." |
| Still doesn't work after retries | "Wait 10 minutes, then try again. This might be a server issue." |

**Step 3: Allow re-submission**

If student wants to try again:
1. Exam can be retaken by default (if allow_retakes = true)
2. They can use the same exam link
3. New attempt will be recorded with new score
4. Ask them to try:
   - Different browser
   - Different device
   - Different internet connection

### Checking Why Submissions Are Failing

**Browser Console (for technical issues)**:
1. Ask student to press F12 to open Developer Tools
2. Go to Console tab
3. Look for red error messages
4. Take a screenshot and send to support

**Server logs**:
1. Check Supabase dashboard
2. Go to Logs → Edge Function
3. Look for recent "exam/submit" requests
4. Check for error messages and status codes

**Common reasons for failures**:
- Database connection timeout
- Invalid share token
- Exam not found in database
- Missing required columns in database
- Row Level Security (RLS) policy blocking write
- Network timeout during submission

### What NOT to Tell Students

❌ "The system is broken"
❌ "Just give up and try later"
❌ "It's your internet's fault" (without checking)
❌ "No one can fix this"

### What TO Tell Students

✓ "Let's figure this out together"
✓ "Try [specific steps]"
✓ "I'll monitor the system while you try"
✓ "If it keeps failing, I'll escalate to technical support"

---

## Database Checks (For Technical Support)

### Verify Exam Tables Exist

Run in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'exam%';

-- Should show: exams, exam_questions, exam_attempts, exam_question_responses
```

### Verify Exam Exists

```sql
SELECT id, title, share_token, status FROM exams 
WHERE id = '[EXAM_ID]' OR share_token = '[EXAM_TOKEN]';
```

### Check Recent Submission Attempt

```sql
SELECT * FROM exam_attempts 
ORDER BY created_at DESC LIMIT 5;
```

### Check for Errors in Question Responses

```sql
SELECT attempt_id, COUNT(*) as response_count 
FROM exam_question_responses 
GROUP BY attempt_id 
ORDER BY created_at DESC LIMIT 10;
```

---

## Common Reasons for Bulk Failures

### All students failing to submit:
- **Database tables don't exist** → Run SQL migration
- **RLS policies blocking writes** → Check Supabase RLS settings
- **Server is down** → Check Vercel status page
- **Network issue** → Check firewall/VPN settings

### Specific students failing:
- **Email validation issue** → Check email format
- **Exam no longer published** → Check exam status
- **Token expired** → Regenerate exam link
- **User account issues** → Create new exam with new link

---

## Escalation Path

**Student can't fix it after these steps:**
1. Try all troubleshooting steps above
2. Try on different device/browser
3. Wait 15 minutes and try again
4. If still failing: Contact IT Support

**Include in support ticket**:
- Student name and email
- Exam name and date
- Exact error message (screenshot)
- Browser and device type
- Steps already tried
- Whether they can access internet otherwise

---

## Prevention Tips

### For Instructors:
- Test exam link before sharing with students
- Send backup/alternative link options
- Allow extra time for submission
- Have alt submission method (email form) as backup
- Monitor dashboard during exam time
- Be available for live support during exam

### For Students:
- Test internet before starting exam
- Use reliable browser (Chrome recommended)
- Don't wait until last minute to submit
- Have backup device ready
- Save answers/note them down (for manual submission if needed)
- Read all instructions before starting

---

## Emergency Procedures

### If Exam Submission System is Completely Down:

**For Instructors**:
1. Stop all exams immediately
2. Save student progress if possible
3. Contact technical support with error details
4. Create manual submission form (Google Form backup)
5. Notify students of alternative submission method

**For Students**:
1. Stop taking exam
2. Save your answers by taking screenshots or writing them down
3. Wait for instructor's alternative submission instructions
4. Be ready to resubmit when system is fixed

---

## Support Contact

**For Students**:
- Contact your instructor first
- They can check monitoring dashboard
- They can request extension or re-submission

**For Instructors**:
- Check monitoring dashboard at /admin/exams/[id]
- Review troubleshooting guide above
- Contact technical support if system issue

**Technical Support**:
- Include error messages and logs
- Include timestamp of failed submission
- Include student/exam IDs
- Describe what was already tried
