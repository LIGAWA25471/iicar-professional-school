-- ============================================================
-- IICAR MVP – Full Database Schema
-- ============================================================

-- ─── profiles (extends auth.users) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  country       TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE  USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own"  ON public.profiles FOR DELETE  USING (auth.uid() = id);

-- trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NULL))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── programs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.programs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  price_cents     INTEGER NOT NULL DEFAULT 0,
  duration_weeks  INTEGER,
  level           TEXT CHECK (level IN ('beginner','intermediate','advanced')) DEFAULT 'intermediate',
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  passing_score   INTEGER NOT NULL DEFAULT 70,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programs_public_select"   ON public.programs FOR SELECT  USING (is_published = TRUE OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));
CREATE POLICY "programs_admin_all"       ON public.programs FOR ALL     USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));

-- ─── modules ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_enrolled_select" ON public.modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.programs pr WHERE pr.id = program_id AND pr.is_published = TRUE)
);
CREATE POLICY "modules_admin_all" ON public.modules FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));

-- ─── lessons ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  objectives   TEXT,
  content      TEXT,
  ai_draft     TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_enrolled_select" ON public.lessons FOR SELECT USING (
  is_published = TRUE OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
);
CREATE POLICY "lessons_admin_all" ON public.lessons FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));

-- ─── enrollments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id    UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  status        TEXT CHECK (status IN ('pending','active','completed','suspended')) NOT NULL DEFAULT 'pending',
  enrolled_at   TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, program_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_own"        ON public.enrollments FOR SELECT  USING (auth.uid() = student_id);
CREATE POLICY "enrollments_insert_own" ON public.enrollments FOR INSERT  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "enrollments_update_own" ON public.enrollments FOR UPDATE  USING (auth.uid() = student_id);
CREATE POLICY "enrollments_admin_all"  ON public.enrollments FOR ALL     USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));

-- ─── lesson_progress ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_own"        ON public.lesson_progress FOR SELECT  USING (auth.uid() = student_id);
CREATE POLICY "progress_insert_own" ON public.lesson_progress FOR INSERT  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "progress_update_own" ON public.lesson_progress FOR UPDATE  USING (auth.uid() = student_id);
CREATE POLICY "progress_admin"      ON public.lesson_progress FOR ALL     USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));

-- ─── questions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  module_id     UUID REFERENCES public.modules(id)  ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a      TEXT NOT NULL,
  option_b      TEXT NOT NULL,
  option_c      TEXT NOT NULL,
  option_d      TEXT NOT NULL,
  correct_answer TEXT CHECK (correct_answer IN ('a','b','c','d')) NOT NULL,
  question_type TEXT CHECK (question_type IN ('module_quiz','final_exam')) NOT NULL DEFAULT 'module_quiz',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_admin_all" ON public.questions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));
CREATE POLICY "questions_student_select" ON public.questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = auth.uid() AND e.program_id = questions.program_id AND e.status = 'active')
);

-- ─── exam_attempts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id   UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  module_id    UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  attempt_type TEXT CHECK (attempt_type IN ('module_quiz','final_exam')) NOT NULL,
  score        INTEGER,
  passed       BOOLEAN,
  answers      JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_own"        ON public.exam_attempts FOR SELECT  USING (auth.uid() = student_id);
CREATE POLICY "attempts_insert_own" ON public.exam_attempts FOR INSERT  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "attempts_admin_all"  ON public.exam_attempts FOR ALL     USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));

-- ─── payments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id           UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  stripe_session_id    TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount_cents         INTEGER NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'KES',
  status               TEXT CHECK (status IN ('pending','paid','failed','refunded')) NOT NULL DEFAULT 'pending',
  phone_number         TEXT,
  kopokopo_location    TEXT,
  kopokopo_reference   TEXT,
  paid_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add KopoKopo columns if this is run against an existing DB
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS phone_number       TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS kopokopo_location  TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS kopokopo_reference TEXT;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_own"        ON public.payments FOR SELECT  USING (auth.uid() = student_id);
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "payments_admin_all"  ON public.payments FOR ALL     USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));

-- ─── certificates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  cert_id         TEXT UNIQUE NOT NULL,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked         BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at      TIMESTAMPTZ,
  final_score     INTEGER,
  UNIQUE(student_id, program_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certs_own"           ON public.certificates FOR SELECT  USING (auth.uid() = student_id);
CREATE POLICY "certs_public_verify" ON public.certificates FOR SELECT  USING (TRUE);
CREATE POLICY "certs_admin_all"     ON public.certificates FOR ALL     USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE));

-- unique cert id generator
CREATE OR REPLACE FUNCTION public.generate_cert_id()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_id TEXT;
BEGIN
  v_id := 'IICAR-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
  RETURN v_id;
END;
$$;
