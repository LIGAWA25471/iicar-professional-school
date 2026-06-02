# Exam Admin Quick Reference Guide

## For Students Having Submission Issues

### Quick Fixes:
1. **Check internet connection** - WiFi or mobile data must be active
2. **Refresh the page** - Close and reopen the exam link
3. **Use different browser** - Try Chrome, Firefox, or Safari
4. **Clear browser cache** - Ctrl+Shift+Del (Windows) or Cmd+Shift+Delete (Mac)
5. **Wait and retry** - System automatically retries 3 times

### What to Tell Students:
- "Your answers are being saved as you go"
- "If you see an error, the system will automatically retry"
- "Make sure to click 'Submit Exam' when done"
- "You have [X] minutes - don't wait until the last second"

## How to Monitor Exams in Real-Time

### Step-by-Step:
1. Go to **Admin → Special Exams**
2. Find your exam in the list
3. Click the **chart icon** (📊) to open monitoring
4. Watch submissions arrive in real-time

### What to Look For:
| Metric | What It Means |
|--------|--------------|
| Total Submissions | How many students took the exam |
| Average Score | Overall difficulty - aim for 70-80% |
| Passed Count | Number of students who passed |
| Pass Rate | Percentage who passed - should be 60-80% |

### What to Do If:
- **Pass rate < 50%** → Exam is too hard, consider adjusting
- **Pass rate > 90%** → Exam is too easy, make harder next time
- **No submissions after 1 hour** → Check if link was shared
- **One student struggling** → Offer extra time or support

## Responding to Student Issues

### "My submission won't go through"
1. Ask them to refresh the page and try again
2. Have them check internet connection
3. If still failing after 3 attempts, clear browser cache
4. If still failing after that, contact support with error message

### "I see an error message"
1. Have them take a screenshot
2. Note the exact error message
3. Check if internet is connected
4. Tell them to refresh and retry
5. If persists, escalate to technical support

### "My exam auto-submitted when time ran out"
1. This is normal behavior - check monitoring dashboard
2. If they're in the table, it submitted successfully
3. Show them their score in the results

### "I didn't finish in time"
1. Show them in the monitoring dashboard
2. Confirm their score is recorded
3. Offer retake if available
4. Extend time for future exams if needed

## Reading the Monitoring Dashboard

### The Stats Section:
```
┌─────────────────┐
│ Total Subm.: 25 │  = Total students who took the exam
└─────────────────┘

┌────────────────┐
│ Avg Score: 78% │  = Mean score across all attempts
└────────────────┘

┌──────────┐
│ Passed:20│  = Students who scored >= passing score
└──────────┘

┌───────────────┐
│ Pass Rate:80% │  = (Passed/Total) × 100
└───────────────┘
```

### The Submissions Table:
| Column | Means | Action |
|--------|-------|--------|
| Name | Student's name | Reference for follow-up |
| Email | Contact info | Reach out if needed |
| Score | 0-100% | Higher = better |
| Status | Pass/Fail | Green = pass, Red = fail |
| Time Taken | Minutes:Seconds | Normal = 1 min per question |
| Submitted | Date & time | When they completed |

## Common Admin Tasks

### Task: Help a Student Resubmit
1. Have student go back to exam link
2. System allows multiple attempts by default
3. They can retake to improve score
4. All attempts appear in monitoring

### Task: Check Specific Student
1. Open monitoring dashboard
2. Search (Ctrl+F or Cmd+F) for student name
3. See their score and status
4. Note their email for follow-up

### Task: Download Submission Data
1. Open monitoring dashboard
2. Select all rows (Ctrl+A)
3. Copy and paste to Excel/Sheets
4. Create reports as needed

### Task: Extend Time for Struggling Student
1. Create new exam with extended duration
2. Share link with student
3. They can retake without time pressure
4. Original attempt still recorded

## Real-Time Monitoring Tips

### Best Practices:
- ✅ Monitor first 30 min after exam opens
- ✅ Refresh manually if auto-refresh off
- ✅ Note any unusual patterns
- ✅ Be available for support during exam
- ✅ Review stats after exam closes

### Auto-Refresh Tips:
- **On** = Dashboard updates every 5 seconds (uses more data)
- **Off** = Click "Refresh now" button manually (saves data)
- Turn off if monitoring on mobile/limited data

## Troubleshooting Dashboard

| Problem | Solution |
|---------|----------|
| No submissions appearing | Check if exam is published/active |
| | Verify students have the link |
| | Wait 5+ minutes for first submission |
| Dashboard won't load | Check internet connection |
| | Refresh the page |
| | Try different browser |
| Stats look wrong | Auto-refresh every 5 seconds |
| | Click "Refresh now" for latest data |

## Emergency Contacts for Students

### Share this if students need help:
- **Technical Issue?** Check internet, refresh, clear cache, try again
- **Time Ran Out?** Your submission was auto-saved, contact instructor
- **Score Too Low?** Ask instructor about retakes
- **Can't Open Link?** Ask instructor to resend link

## Key Metrics Reference

### Healthy Exam:
- Average Score: 60-80%
- Pass Rate: 60-80%
- Avg Time: 1-2 min per question
- No major errors

### Exam Needs Adjustment:
- Average Score: >90% (too easy)
- Average Score: <50% (too hard)
- Pass Rate: <40% (students struggling)
- Pass Rate: >95% (not challenging)

## Quick Commands

### Monitor Exam:
1. Admin → Special Exams
2. Click chart icon on exam row
3. Watch submissions in real-time

### Share Exam:
1. Find exam in list
2. Click copy icon next to token
3. Send link to students
4. Link format: yoursite.com/exam/[token]

### See Results:
1. Open monitoring dashboard
2. Scroll down to see all submissions
3. Check individual scores
4. Look for patterns (cheating, struggling, etc)

## Remember:

- 📊 Students can retake by default
- ⏱️ Timer auto-submits when expires
- 🔄 Auto-refresh updates every 5 seconds
- 📧 Email is key contact for students
- 💡 Average score tells if exam is right difficulty
