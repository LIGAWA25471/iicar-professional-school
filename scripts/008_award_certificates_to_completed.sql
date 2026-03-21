-- Award certificates to students who completed programs but don't have certificates
INSERT INTO certificates (student_id, program_id, cert_id, final_score, certificate_level, issued_at, revoked)
SELECT 
  e.student_id,
  e.program_id,
  CONCAT('IICAR-', EXTRACT(YEAR FROM NOW()), '-', UPPER(SUBSTR(gen_random_uuid()::text, 1, 8))),
  75,
  1,
  NOW(),
  FALSE
FROM enrollments e
WHERE e.status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM certificates c 
    WHERE c.student_id = e.student_id 
    AND c.program_id = e.program_id
    AND c.revoked = FALSE
  );
