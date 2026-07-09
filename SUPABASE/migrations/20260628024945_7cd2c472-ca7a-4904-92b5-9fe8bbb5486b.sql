
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.interview_result AS ENUM ('selected', 'rejected', 'waitlisted', 'in_process');
CREATE TYPE public.interview_mode AS ENUM ('campus', 'off_campus', 'referral', 'internship_conversion');
CREATE TYPE public.difficulty AS ENUM ('easy', 'medium', 'hard');

-- Updated-at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================
-- profiles
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  college TEXT,
  batch TEXT,
  branch TEXT,
  bio TEXT,
  reputation INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- user_roles
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Admins can manage roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- companies
-- =========================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  headquarters TEXT,
  description TEXT,
  hiring_frequency TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  avg_package NUMERIC,
  internship_stipend NUMERIC,
  eligibility JSONB NOT NULL DEFAULT '{}'::jsonb,
  process_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved companies visible to all" ON public.companies FOR SELECT USING (status = 'approved');
CREATE POLICY "Authors see own companies" ON public.companies FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins see all companies" ON public.companies FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can submit companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND status = 'pending');
CREATE POLICY "Authors can edit own pending" ON public.companies FOR UPDATE TO authenticated USING (created_by = auth.uid() AND status = 'pending');
CREATE POLICY "Admins can update any company" ON public.companies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete companies" ON public.companies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX companies_status_idx ON public.companies(status);

-- =========================
-- interview_experiences
-- =========================
CREATE TABLE public.interview_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  profile TEXT,
  package_lpa NUMERIC,
  stipend NUMERIC,
  interview_date DATE,
  mode interview_mode,
  college TEXT,
  batch TEXT,
  eligibility TEXT,
  rounds JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_weeks INT,
  difficulty difficulty,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  result interview_result,
  tips TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  dsa_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  cs_subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  hr_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  resume_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status approval_status NOT NULL DEFAULT 'pending',
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_experiences TO authenticated;
GRANT SELECT ON public.interview_experiences TO anon;
GRANT ALL ON public.interview_experiences TO service_role;
ALTER TABLE public.interview_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved experiences visible to all" ON public.interview_experiences FOR SELECT USING (status = 'approved');
CREATE POLICY "Authors see own experiences" ON public.interview_experiences FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Admins see all experiences" ON public.interview_experiences FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can submit experiences" ON public.interview_experiences FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND status = 'pending');
CREATE POLICY "Authors can edit own pending experiences" ON public.interview_experiences FOR UPDATE TO authenticated USING (author_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins can update any experience" ON public.interview_experiences FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors can delete own pending" ON public.interview_experiences FOR DELETE TO authenticated USING (author_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins can delete experiences" ON public.interview_experiences FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER experiences_updated_at BEFORE UPDATE ON public.interview_experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX experiences_status_idx ON public.interview_experiences(status);
CREATE INDEX experiences_company_idx ON public.interview_experiences(company_id);
CREATE INDEX experiences_author_idx ON public.interview_experiences(author_id);

-- =========================
-- experience_likes
-- =========================
CREATE TABLE public.experience_likes (
  experience_id UUID NOT NULL REFERENCES public.interview_experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (experience_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.experience_likes TO authenticated;
GRANT SELECT ON public.experience_likes TO anon;
GRANT ALL ON public.experience_likes TO service_role;
ALTER TABLE public.experience_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are public" ON public.experience_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.experience_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike own" ON public.experience_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =========================
-- experience_saves
-- =========================
CREATE TABLE public.experience_saves (
  experience_id UUID NOT NULL REFERENCES public.interview_experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (experience_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.experience_saves TO authenticated;
GRANT ALL ON public.experience_saves TO service_role;
ALTER TABLE public.experience_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own saves" ON public.experience_saves FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can save" ON public.experience_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unsave own" ON public.experience_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =========================
-- experience_comments
-- =========================
CREATE TABLE public.experience_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.interview_experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.experience_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experience_comments TO authenticated;
GRANT SELECT ON public.experience_comments TO anon;
GRANT ALL ON public.experience_comments TO service_role;
ALTER TABLE public.experience_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments public" ON public.experience_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.experience_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can edit own comments" ON public.experience_comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.experience_comments FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can delete any comment" ON public.experience_comments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON public.experience_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- experience_reports
-- =========================
CREATE TABLE public.experience_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.interview_experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.experience_reports TO authenticated;
GRANT ALL ON public.experience_reports TO service_role;
ALTER TABLE public.experience_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own reports" ON public.experience_reports FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins see all reports" ON public.experience_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can report" ON public.experience_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- =========================
-- Seed companies
-- =========================
INSERT INTO public.companies (slug, name, logo_url, website, headquarters, description, hiring_frequency, tags, avg_package, internship_stipend, status) VALUES
('google', 'Google', 'https://logo.clearbit.com/google.com', 'https://careers.google.com', 'Mountain View, CA', 'Global leader in search, cloud, and AI products.', 'Annual', ARRAY['Product','SDE','Research'], 51.0, 100000, 'approved'),
('amazon', 'Amazon', 'https://logo.clearbit.com/amazon.com', 'https://amazon.jobs', 'Seattle, WA', 'World''s largest e-commerce and cloud provider (AWS).', 'Annual', ARRAY['SDE','Cloud','Operations'], 44.0, 90000, 'approved'),
('microsoft', 'Microsoft', 'https://logo.clearbit.com/microsoft.com', 'https://careers.microsoft.com', 'Redmond, WA', 'Cloud (Azure), productivity, and developer tools leader.', 'Annual', ARRAY['SDE','Cloud','AI'], 46.0, 95000, 'approved'),
('meta', 'Meta', 'https://logo.clearbit.com/meta.com', 'https://metacareers.com', 'Menlo Park, CA', 'Social platforms (Facebook, Instagram, WhatsApp) and AR/VR.', 'Annual', ARRAY['SDE','ML','Infra'], 55.0, 110000, 'approved'),
('adobe', 'Adobe', 'https://logo.clearbit.com/adobe.com', 'https://careers.adobe.com', 'San Jose, CA', 'Creative, document, and experience cloud software.', 'Annual', ARRAY['SDE','Product'], 43.0, 75000, 'approved'),
('flipkart', 'Flipkart', 'https://logo.clearbit.com/flipkart.com', 'https://flipkartcareers.com', 'Bengaluru, India', 'India''s largest e-commerce platform.', 'Annual', ARRAY['SDE','Product','Data'], 32.0, 80000, 'approved');
