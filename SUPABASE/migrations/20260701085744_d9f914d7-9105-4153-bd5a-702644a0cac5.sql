
-- Enums
CREATE TYPE public.forum_category AS ENUM ('dsa','resume','interview','oa','company','referrals','mock_interviews','internships','placements','general');
CREATE TYPE public.vote_type AS ENUM ('up','down');
CREATE TYPE public.notification_type AS ENUM ('like','comment','reply','mention','approval','rejection','new_oa','new_experience','new_event','badge');

-- Forum threads
CREATE TABLE public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category forum_category NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  pinned boolean NOT NULL DEFAULT false,
  locked boolean NOT NULL DEFAULT false,
  views int NOT NULL DEFAULT 0,
  score int NOT NULL DEFAULT 0,
  reply_count int NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_threads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_threads TO authenticated;
GRANT ALL ON public.forum_threads TO service_role;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_read_all" ON public.forum_threads FOR SELECT USING (true);
CREATE POLICY "threads_insert_own" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "threads_update_own" ON public.forum_threads FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "threads_admin_update" ON public.forum_threads FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "threads_delete_own_or_admin" ON public.forum_threads FOR DELETE TO authenticated USING (auth.uid() = author_id OR has_role(auth.uid(),'admin'));
CREATE INDEX forum_threads_category_idx ON public.forum_threads(category, created_at DESC);
CREATE TRIGGER trg_threads_updated BEFORE UPDATE ON public.forum_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Forum posts (replies)
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  body text NOT NULL,
  score int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read_all" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_delete_own_or_admin" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = author_id OR has_role(auth.uid(),'admin'));
CREATE INDEX forum_posts_thread_idx ON public.forum_posts(thread_id, created_at);
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Votes (polymorphic by nullable columns)
CREATE TABLE public.forum_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  vote vote_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((thread_id IS NOT NULL) <> (post_id IS NOT NULL))
);
CREATE UNIQUE INDEX forum_votes_unique_thread ON public.forum_votes(user_id, thread_id) WHERE thread_id IS NOT NULL;
CREATE UNIQUE INDEX forum_votes_unique_post ON public.forum_votes(user_id, post_id) WHERE post_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_votes TO authenticated;
GRANT ALL ON public.forum_votes TO service_role;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_read_all" ON public.forum_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "votes_manage_own" ON public.forum_votes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_read_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_delete_own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX notif_user_idx ON public.notifications(user_id, created_at DESC);

-- Badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  tier text NOT NULL DEFAULT 'bronze',
  points int NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_read_all" ON public.badges FOR SELECT USING (true);
CREATE POLICY "badges_admin_manage" ON public.badges FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT INSERT, DELETE ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ub_read_all" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "ub_admin_insert" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "ub_admin_delete" ON public.user_badges FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- Vote score triggers
CREATE OR REPLACE FUNCTION public.recompute_forum_score()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE tid uuid; pid uuid;
BEGIN
  tid := COALESCE(NEW.thread_id, OLD.thread_id);
  pid := COALESCE(NEW.post_id, OLD.post_id);
  IF tid IS NOT NULL THEN
    UPDATE public.forum_threads SET score = COALESCE((
      SELECT SUM(CASE WHEN vote='up' THEN 1 ELSE -1 END) FROM public.forum_votes WHERE thread_id = tid
    ),0) WHERE id = tid;
  END IF;
  IF pid IS NOT NULL THEN
    UPDATE public.forum_posts SET score = COALESCE((
      SELECT SUM(CASE WHEN vote='up' THEN 1 ELSE -1 END) FROM public.forum_votes WHERE post_id = pid
    ),0) WHERE id = pid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_votes_score AFTER INSERT OR UPDATE OR DELETE ON public.forum_votes
FOR EACH ROW EXECUTE FUNCTION public.recompute_forum_score();

CREATE OR REPLACE FUNCTION public.bump_reply_count()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_threads SET reply_count = reply_count + 1 WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_posts_count AFTER INSERT OR DELETE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.bump_reply_count();

-- Seed badges
INSERT INTO public.badges (slug, name, description, icon, tier, points) VALUES
  ('first_post','First Post','Started your first thread','MessageSquare','bronze',10),
  ('helpful','Helpful','Received 10 upvotes','ThumbsUp','silver',50),
  ('contributor','Contributor','Shared an approved interview experience','FileText','silver',75),
  ('problem_solver','Problem Solver','Solved 10 OA questions','Code2','gold',150),
  ('streak_7','Week Streak','Active for 7 days in a row','Flame','gold',100),
  ('mentor','Mentor','Received 50 upvotes total','GraduationCap','platinum',250)
ON CONFLICT (slug) DO NOTHING;
