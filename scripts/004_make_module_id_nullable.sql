-- Make module_id nullable for final_exam questions
-- Final exams are program-wide, not module-specific

ALTER TABLE public.questions 
  DROP CONSTRAINT questions_module_id_fkey;

ALTER TABLE public.questions 
  ALTER COLUMN module_id DROP NOT NULL;

ALTER TABLE public.questions 
  ADD CONSTRAINT questions_module_id_fkey 
  FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
