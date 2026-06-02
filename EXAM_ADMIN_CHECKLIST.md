# Exam Admin Pre-Launch & Support Checklist

## Before Opening Exam to Students

### 48 Hours Before Exam

- [ ] **Database verification**
  - [ ] Log in to Supabase dashboard
  - [ ] Verify exam tables exist (exams, exam_questions, exam_attempts, exam_question_responses)
  - [ ] Run migration script if tables missing: `scripts/db/01_create_exams_tables.sql`
  - [ ] Test a sample exam creation

- [ ] **Exam content review**
  - [ ] Review all exam questions (accuracy, clarity, difficulty)
  - [ ] Verify correct answers are marked properly
  - [ ] Check explanations are present for each question
  - [ ] Ensure passing score is appropriate (60-80% recommended)

- [ ] **Technical testing**
  - [ ] Take a test exam as a student
  - [ ] Verify all questions display correctly
  - [ ] Test submission process
  - [ ] Check results page shows correctly
  - [ ] Verify monitoring dashboard loads

### 24 Hours Before Exam

- [ ] **Student communication**
  - [ ] Send exam link to students
  - [ ] Include troubleshooting link: EXAM_SUBMISSION_TROUBLESHOOTING.md
  - [ ] Provide backup contact info
  - [ ] Remind students to test internet before exam

- [ ] **System capacity check**
  - [ ] Estimate number of students taking exam
  - [ ] Monitor server status (Vercel dashboard)
  - [ ] Check Supabase database status
  - [ ] Note: System can handle 100+ concurrent submissions

- [ ] **Exam settings verification**
  - [ ] [ ] Status is "published" or "active"
  - [ ] [ ] Correct duration set (minutes)
  - [ ] [ ] Passing score is appropriate
  - [ ] [ ] Allow retakes is enabled if needed
  - [ ] [ ] Show results is enabled
  - [ ] [ ] Share token is active and shareable

### 1 Hour Before Exam

- [ ] **Final system checks**
  - [ ] Test exam link yourself - click the link exactly as students would
  - [ ] Verify timer counts down correctly
  - [ ] Submit a test answer
  - [ ] Check monitoring dashboard loads and shows submissions
  - [ ] Verify browser notifications work (if enabled)

- [ ] **Admin monitoring setup**
  - [ ] Open monitoring dashboard: `/admin/exams/[exam_id]`
  - [ ] Enable auto-refresh for live updates
  - [ ] Test manual refresh button
  - [ ] Keep dashboard open on a separate window/device
  - [ ] Have backup device with internet ready

- [ ] **Support preparation**
  - [ ] Have this troubleshooting guide open
  - [ ] Have email support ready
  - [ ] Have phone/chat support ready if applicable
  - [ ] Make note of student names/emails
  - [ ] Have alternative submission method prepared (Google Form backup)

---

## During Exam Period

### First 5 Minutes (Testing Phase)

- [ ] **Monitor first submissions**
  - [ ] Watch dashboard for first student submissions
  - [ ] Check that stats update correctly
  - [ ] Verify response times are reasonable (under 2 seconds)
  - [ ] Look for any immediate error patterns

- [ ] **Quick intervention if needed**
  - [ ] If student reports issue: check monitoring dashboard first
  - [ ] If submission failing for all students: check database status
  - [ ] If specific student failing: check their email format
  - [ ] Be ready with troubleshooting steps

### Ongoing (Throughout Exam)

- [ ] **Monitor dashboard every 10-15 minutes**
  - [ ] [ ] Submissions arriving at expected rate
  - [ ] [ ] Scores are reasonable (not all 0% or 100%)
  - [ ] [ ] Pass rate seems appropriate
  - [ ] [ ] No errors appearing in recent attempts
  - [ ] [ ] Average score makes sense for difficulty level

- [ ] **Handle student issues as reported**
  - [ ] Use troubleshooting guide to help
  - [ ] Check monitoring dashboard to verify status
  - [ ] Keep student informed of progress
  - [ ] Offer alternative if submission truly impossible
  - [ ] Document issue for follow-up

- [ ] **Monitor system health**
  - [ ] Check Supabase status page for any alerts
  - [ ] Watch for slow submission responses
  - [ ] Monitor server CPU/memory if accessible
  - [ ] Be ready to escalate if seeing widespread failures

### Last 15 Minutes

- [ ] **Prepare for rush submissions**
  - [ ] Monitor increases in submission attempts
  - [ ] Ensure system isn't slowing down
  - [ ] Be ready to help last-minute issues
  - [ ] Reassure students submitting on time

### After Exam Ends

- [ ] **Wait for stragglers**
  - [ ] Leave monitoring dashboard open 5-10 more minutes
  - [ ] Some auto-submissions may arrive after time expired
  - [ ] Monitor for any late submissions

- [ ] **Review results**
  - [ ] Check final submission count matches expected students
  - [ ] Review pass rate and average score
  - [ ] Look for any unusual patterns (all same score, etc.)
  - [ ] Note any students who didn't submit

- [ ] **Send results to students**
  - [ ] Provide score if show_results enabled
  - [ ] Provide feedback on performance
  - [ ] Instructions for retake if applicable
  - [ ] Thank them for participation

---

## Monitoring Dashboard Guide

### What to Look For

**Stats Section (Update every 5 seconds)**:
- **Total Submissions**: Should increase steadily
- **Average Score**: Should be 50-80% (adjust if outside this)
- **Pass Count**: Number of students who scored >= passing score
- **Pass Rate**: Percentage who passed (aim for 60-80%)

### Healthy Signs:
- ✓ Submissions trickling in consistently
- ✓ Average score is 60-80%
- ✓ Pass rate is 60-80%
- ✓ Completion time is 30-90 minutes
- ✓ No error messages appearing

### Warning Signs:
- ⚠ No submissions after 10 minutes
- ⚠ Average score very high (>90%) or very low (<40%)
- ⚠ Pass rate <40% (exam too hard)
- ⚠ Pass rate >95% (exam too easy)
- ⚠ Error messages appearing in logs
- ⚠ Same student appearing multiple times very quickly

### Action Items:
- If no submissions: Check if link was sent correctly
- If poor pass rate: Offer retake, consider difficulty
- If good pass rate: Exam difficulty is appropriate
- If system errors: Check dashboard, restart if needed
- If submission slow: Wait, don't immediately assume failure

---

## Common Issues & Quick Fixes

| Problem | Check | Fix |
|---------|-------|-----|
| No submissions appear | Is exam published? Is link shared? | Verify exam status, resend link |
| All students getting error | Check server logs | Database might be down - wait 5 min |
| One student failing | Check their email format | Have them re-type email carefully |
| Submissions very slow | Check internet | May be network issues, reassure students |
| Score very high/low | Review questions | Verify question difficulty level |
| Student can't find exam link | Check email spam folder | Resend link, try different method |

---

## Escalation Path

**If issue can't be resolved:**
1. Document the problem (screenshot, time, student info)
2. Check Supabase/Vercel status pages
3. Wait 10 minutes and retry
4. Contact technical support with details:
   - Exact error message
   - When issue started
   - How many students affected
   - Steps already tried

---

## After Exam Follow-up

- [ ] **Send thank you message to students**
- [ ] **Collect feedback** (optional survey)
- [ ] **Review analytics**:
  - Total submissions vs expected
  - Pass/fail distribution
  - Average time taken
  - Any missed students
- [ ] **Reach out to:**
  - Students who failed significantly
  - Students who didn't submit
  - Students with issues during exam
- [ ] **Document for next time:**
  - What went well
  - What could be improved
  - Any issues encountered
  - Adjustments needed for future exams

---

## Emergency Procedures

### If Exam System Is Down During Exam:

1. **Immediate actions** (first 5 minutes):
   - Notify students immediately
   - Tell them to stop taking exam
   - Ask them to save their answers
   - Don't accept new submissions

2. **Emergency submission method**:
   - Create Google Form or email address
   - Ask students to submit answers there
   - Manually grade and record scores
   - Mark as "manual submission" in notes

3. **Recovery**:
   - Contact technical support
   - Check system status pages
   - Wait for system to recover
   - Plan re-submission for recovered students

4. **Communication**:
   - Keep students informed every 5 minutes
   - Provide clear instructions
   - Apologize for inconvenience
   - Offer retake or grade adjustment

### If Only Some Students Are Failing:

1. **Check monitoring dashboard** - are they appearing?
2. **Have them try:**
   - Different browser
   - Different device
   - Different internet connection
   - Clear browser cache
3. **If still failing:**
   - Offer alternative submission method
   - Manual grade based on their notes
   - Extra time to resubmit later
   - Grade adjustment if needed

---

## Success Metrics

You'll know the exam went well if:
- ✓ 95%+ of students successfully submitted
- ✓ Pass rate is 60-80%
- ✓ Average score is 60-80%
- ✓ No bulk error messages
- ✓ Average completion time is reasonable
- ✓ Students report successful submission
- ✓ Monitoring dashboard shows all submissions
