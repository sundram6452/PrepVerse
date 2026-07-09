
-- Enums
CREATE TYPE public.oa_submission_status AS ENUM ('accepted','wrong_answer','runtime_error','time_limit_exceeded','compile_error','pending');
CREATE TYPE public.oa_language AS ENUM ('javascript','typescript','python','java','cpp','c','go','rust');

-- Questions
CREATE TABLE public.oa_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  platform text,
  role text,
  asked_on date,
  difficulty public.difficulty NOT NULL DEFAULT 'medium',
  topics text[] NOT NULL DEFAULT '{}',
  statement text NOT NULL,
  input_format text,
  output_format text,
  constraints text,
  sample_tests jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden_tests jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_limit_ms integer NOT NULL DEFAULT 2000,
  memory_limit_kb integer NOT NULL DEFAULT 262144,
  allowed_languages public.oa_language[] NOT NULL DEFAULT ARRAY['javascript','python','cpp','java']::public.oa_language[],
  starter_code jsonb NOT NULL DEFAULT '{}'::jsonb,
  hints text[] NOT NULL DEFAULT '{}',
  editorial text,
  estimated_time_complexity text,
  estimated_space_complexity text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.oa_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oa_questions TO authenticated;
GRANT ALL ON public.oa_questions TO service_role;
ALTER TABLE public.oa_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved questions are public" ON public.oa_questions FOR SELECT USING (status = 'approved');
CREATE POLICY "Authors can view own questions" ON public.oa_questions FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Admins can view all questions" ON public.oa_questions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated can create questions" ON public.oa_questions FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND status = 'pending');
CREATE POLICY "Authors can update own pending" ON public.oa_questions FOR UPDATE TO authenticated USING (author_id = auth.uid() AND status = 'pending') WITH CHECK (author_id = auth.uid());
CREATE POLICY "Admins can update any question" ON public.oa_questions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authors can delete own pending" ON public.oa_questions FOR DELETE TO authenticated USING (author_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins can delete any question" ON public.oa_questions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_oa_questions_updated BEFORE UPDATE ON public.oa_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Submissions
CREATE TABLE public.oa_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.oa_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language public.oa_language NOT NULL,
  code text NOT NULL,
  status public.oa_submission_status NOT NULL DEFAULT 'pending',
  runtime_ms integer,
  memory_kb integer,
  passed_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  test_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  stderr text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.oa_submissions TO authenticated;
GRANT ALL ON public.oa_submissions TO service_role;
ALTER TABLE public.oa_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own submissions" ON public.oa_submissions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all submissions" ON public.oa_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own submissions" ON public.oa_submissions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own submissions" ON public.oa_submissions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_oa_submissions_user_q ON public.oa_submissions(user_id, question_id);

-- Drafts (autosave)
CREATE TABLE public.oa_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.oa_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language public.oa_language NOT NULL,
  code text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id, language)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oa_drafts TO authenticated;
GRANT ALL ON public.oa_drafts TO service_role;
ALTER TABLE public.oa_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own drafts" ON public.oa_drafts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_oa_drafts_updated BEFORE UPDATE ON public.oa_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Likes
CREATE TABLE public.oa_likes (
  question_id uuid NOT NULL REFERENCES public.oa_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, user_id)
);
GRANT SELECT ON public.oa_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.oa_likes TO authenticated;
GRANT ALL ON public.oa_likes TO service_role;
ALTER TABLE public.oa_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes public read" ON public.oa_likes FOR SELECT USING (true);
CREATE POLICY "Users like" ON public.oa_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users unlike" ON public.oa_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Saves
CREATE TABLE public.oa_saves (
  question_id uuid NOT NULL REFERENCES public.oa_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.oa_saves TO authenticated;
GRANT ALL ON public.oa_saves TO service_role;
ALTER TABLE public.oa_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own saves" ON public.oa_saves FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users save" ON public.oa_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users unsave" ON public.oa_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Comments
CREATE TABLE public.oa_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.oa_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.oa_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.oa_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oa_comments TO authenticated;
GRANT ALL ON public.oa_comments TO service_role;
ALTER TABLE public.oa_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments public read" ON public.oa_comments FOR SELECT USING (true);
CREATE POLICY "Users comment" ON public.oa_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own comment" ON public.oa_comments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own comment" ON public.oa_comments FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins delete any comment" ON public.oa_comments FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_oa_comments_updated BEFORE UPDATE ON public.oa_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
