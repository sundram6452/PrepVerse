import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ExperienceNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    company_id: "",
    role: "",
    profile: "",
    package_lpa: "",
    stipend: "",
    interview_date: "",
    mode: "campus",
    college: "",
    batch: "",
    eligibility: "",
    difficulty: "medium",
    rating: "4",
    result: "selected",
    tips: "",
    technologies: "",
    rounds: "",
    dsa_questions: "",
    cs_subjects: "",
    hr_questions: "",
    resume_questions: "",
    duration_weeks: "",
  });

  useEffect(() => {
    supabase.from("companies").select("id,name").eq("status", "approved").order("name").then(({ data }) => {
      setCompanies(data ?? []);
    });
  }, []);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const linesToList = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean).map((q) => ({ question: q }));

  const submit = async () => {
    if (!user) return toast.error("Please sign in");
    if (!form.company_id || !form.role) return toast.error("Company and role are required");
    setSubmitting(true);
    const { error } = await supabase.from("interview_experiences").insert({
      author_id: user.id,
      company_id: form.company_id,
      role: form.role,
      profile: form.profile || null,
      package_lpa: form.package_lpa ? Number(form.package_lpa) : null,
      stipend: form.stipend ? Number(form.stipend) : null,
      interview_date: form.interview_date || null,
      mode: form.mode as any,
      college: form.college || null,
      batch: form.batch || null,
      eligibility: form.eligibility || null,
      difficulty: form.difficulty as any,
      rating: form.rating ? Number(form.rating) : null,
      result: form.result as any,
      tips: form.tips || null,
      technologies: form.technologies ? form.technologies.split(",").map((t) => t.trim()).filter(Boolean) : [],
      duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
      rounds: form.rounds ? form.rounds.split("\n").filter(Boolean).map((line) => {
        const [name, ...desc] = line.split("|");
        return { name: name.trim(), description: desc.join("|").trim() };
      }) : [],
      dsa_questions: linesToList(form.dsa_questions),
      cs_subjects: linesToList(form.cs_subjects),
      hr_questions: linesToList(form.hr_questions),
      resume_questions: linesToList(form.resume_questions),
      status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted! An admin will review it shortly.");
    navigate("/app/experiences");
  };

  return (
    <div>
      <PageHeader title="Share an Interview Experience" description="Help peers — write what you wish you had read before your interview." />

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Company *">
            <Select value={form.company_id} onValueChange={(v) => update("company_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Role *"><Input value={form.role} onChange={(e) => update("role", e.target.value)} placeholder="SDE Intern" /></Field>
          <Field label="Profile"><Input value={form.profile} onChange={(e) => update("profile", e.target.value)} placeholder="Backend / Frontend / SRE" /></Field>
          <Field label="Mode">
            <Select value={form.mode} onValueChange={(v) => update("mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="campus">Campus</SelectItem>
                <SelectItem value="off_campus">Off campus</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="internship_conversion">Intern conversion</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Package (LPA)"><Input type="number" value={form.package_lpa} onChange={(e) => update("package_lpa", e.target.value)} /></Field>
          <Field label="Stipend (₹/mo)"><Input type="number" value={form.stipend} onChange={(e) => update("stipend", e.target.value)} /></Field>
          <Field label="Interview date"><Input type="date" value={form.interview_date} onChange={(e) => update("interview_date", e.target.value)} /></Field>
          <Field label="Duration (weeks)"><Input type="number" value={form.duration_weeks} onChange={(e) => update("duration_weeks", e.target.value)} /></Field>
          <Field label="College"><Input value={form.college} onChange={(e) => update("college", e.target.value)} /></Field>
          <Field label="Batch"><Input value={form.batch} onChange={(e) => update("batch", e.target.value)} placeholder="2026" /></Field>
          <Field label="Difficulty">
            <Select value={form.difficulty} onValueChange={(v) => update("difficulty", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Result">
            <Select value={form.result} onValueChange={(v) => update("result", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="in_process">In process</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Rating (1-5)"><Input type="number" min={1} max={5} value={form.rating} onChange={(e) => update("rating", e.target.value)} /></Field>
          <Field label="Eligibility"><Input value={form.eligibility} onChange={(e) => update("eligibility", e.target.value)} placeholder="CGPA ≥ 7, no backlogs" /></Field>
        </div>

        <Field label="Technologies (comma-separated)"><Input value={form.technologies} onChange={(e) => update("technologies", e.target.value)} placeholder="Java, Spring, AWS" /></Field>
        <Field label="Rounds (one per line — format: name | description)">
          <Textarea rows={4} value={form.rounds} onChange={(e) => update("rounds", e.target.value)} placeholder="Online Assessment | 2 coding + 10 MCQs&#10;Technical 1 | DSA + project deep dive" />
        </Field>
        <Field label="DSA Questions (one per line)"><Textarea rows={3} value={form.dsa_questions} onChange={(e) => update("dsa_questions", e.target.value)} /></Field>
        <Field label="CS Subject Questions (one per line)"><Textarea rows={3} value={form.cs_subjects} onChange={(e) => update("cs_subjects", e.target.value)} /></Field>
        <Field label="HR Questions (one per line)"><Textarea rows={3} value={form.hr_questions} onChange={(e) => update("hr_questions", e.target.value)} /></Field>
        <Field label="Resume Questions (one per line)"><Textarea rows={3} value={form.resume_questions} onChange={(e) => update("resume_questions", e.target.value)} /></Field>
        <Field label="Tips"><Textarea rows={4} value={form.tips} onChange={(e) => update("tips", e.target.value)} placeholder="What you wish you knew…" /></Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit for review"}</Button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default ExperienceNew;
