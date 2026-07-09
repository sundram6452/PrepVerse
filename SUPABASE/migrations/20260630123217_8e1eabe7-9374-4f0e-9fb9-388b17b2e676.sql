
CREATE TYPE public.event_type AS ENUM ('oa','hackathon','contest','internship','placement_drive','interview');

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type public.event_type NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text,
  role text,
  event_date timestamptz NOT NULL,
  deadline timestamptz,
  eligibility text,
  registration_url text,
  location text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.approval_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.calendar_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved events public" ON public.calendar_events
  FOR SELECT USING (status = 'approved' OR auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Auth users insert events" ON public.calendar_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authors update own pending" ON public.calendar_events
  FOR UPDATE TO authenticated USING (auth.uid() = created_by AND status = 'pending');
CREATE POLICY "Admins manage events" ON public.calendar_events
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authors delete own pending" ON public.calendar_events
  FOR DELETE TO authenticated USING (auth.uid() = created_by AND status = 'pending');

CREATE TRIGGER calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX calendar_events_date_idx ON public.calendar_events(event_date);
CREATE INDEX calendar_events_status_idx ON public.calendar_events(status);
