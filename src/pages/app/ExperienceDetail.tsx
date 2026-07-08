import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Bookmark, Share2, Flag, Star, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CompanyLogo } from "@/components/CompanyLogo";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

type Exp = any;
type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

const ExperienceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [exp, setExp] = useState<Exp | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("interview_experiences")
      .select("*, companies(name,slug,logo_url)")
      .eq("id", id)
      .maybeSingle();
    setExp(data);
    setLoading(false);

    const { count } = await supabase
      .from("experience_likes")
      .select("*", { count: "exact", head: true })
      .eq("experience_id", id);
    setLikes(count ?? 0);

    if (user) {
      const { data: lk } = await supabase
        .from("experience_likes")
        .select("user_id")
        .eq("experience_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setLiked(!!lk);
      const { data: sv } = await supabase
        .from("experience_saves")
        .select("user_id")
        .eq("experience_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setSaved(!!sv);
    }

    const { data: cm } = await supabase
      .from("experience_comments")
      .select("id,body,created_at,user_id, profiles(full_name,avatar_url)")
      .eq("experience_id", id)
      .order("created_at", { ascending: true });
    setComments((cm ?? []) as unknown as Comment[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user]);

  const toggleLike = async () => {
    if (!user || !id) return toast.error("Sign in to like");
    if (liked) {
      await supabase.from("experience_likes").delete().eq("experience_id", id).eq("user_id", user.id);
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("experience_likes").insert({ experience_id: id, user_id: user.id });
      setLiked(true); setLikes((n) => n + 1);
    }
  };

  const toggleSave = async () => {
    if (!user || !id) return toast.error("Sign in to save");
    if (saved) {
      await supabase.from("experience_saves").delete().eq("experience_id", id).eq("user_id", user.id);
      setSaved(false); toast.success("Removed from saved");
    } else {
      await supabase.from("experience_saves").insert({ experience_id: id, user_id: user.id });
      setSaved(true); toast.success("Saved");
    }
  };

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  };

  const report = async () => {
    if (!user || !id) return toast.error("Sign in to report");
    const reason = window.prompt("Briefly describe the issue:");
    if (!reason) return;
    await supabase.from("experience_reports").insert({ experience_id: id, user_id: user.id, reason });
    toast.success("Report submitted");
  };

  const postComment = async () => {
    if (!user || !id || !newComment.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("experience_comments").insert({
      experience_id: id, user_id: user.id, body: newComment.trim(),
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setNewComment("");
    load();
  };

  if (loading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!exp) return <p className="text-muted-foreground">Experience not found or pending approval.</p>;

  const rounds: any[] = Array.isArray(exp.rounds) ? exp.rounds : [];
  const dsa: any[] = Array.isArray(exp.dsa_questions) ? exp.dsa_questions : [];
  const cs: any[] = Array.isArray(exp.cs_subjects) ? exp.cs_subjects : [];
  const hr: any[] = Array.isArray(exp.hr_questions) ? exp.hr_questions : [];
  const res: any[] = Array.isArray(exp.resume_questions) ? exp.resume_questions : [];

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
        <Link to="/app/experiences"><ArrowLeft className="h-4 w-4 mr-1" /> All experiences</Link>
      </Button>

      <div className="glass rounded-2xl p-6 md:p-8 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <CompanyLogo name={exp.companies?.name ?? "?"} logoUrl={exp.companies?.logo_url} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-bold">{exp.role}</h1>
            <p className="text-muted-foreground">
              {exp.companies?.name} · {exp.profile ?? "—"} · {exp.mode?.replace("_", " ")}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <DifficultyBadge value={exp.difficulty} />
              {exp.result && <Badge variant="secondary" className="capitalize">{exp.result.replace("_", " ")}</Badge>}
              {exp.rating && (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> {exp.rating}
                </Badge>
              )}
              {exp.package_lpa && <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30">{exp.package_lpa} LPA</Badge>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          <Button size="sm" variant={liked ? "default" : "outline"} onClick={toggleLike}>
            <Heart className={`h-4 w-4 mr-1.5 ${liked ? "fill-current" : ""}`} /> {likes}
          </Button>
          <Button size="sm" variant={saved ? "default" : "outline"} onClick={toggleSave}>
            <Bookmark className={`h-4 w-4 mr-1.5 ${saved ? "fill-current" : ""}`} /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={share}><Share2 className="h-4 w-4 mr-1.5" /> Share</Button>
          <Button size="sm" variant="ghost" onClick={report}><Flag className="h-4 w-4 mr-1.5" /> Report</Button>
        </div>
      </div>

      {(exp.college || exp.batch || exp.eligibility) && (
        <div className="glass rounded-2xl p-5 mb-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {exp.college && <Info label="College" value={exp.college} />}
          {exp.batch && <Info label="Batch" value={exp.batch} />}
          {exp.interview_date && <Info label="Interview date" value={new Date(exp.interview_date).toLocaleDateString()} />}
          {exp.duration_weeks && <Info label="Duration" value={`${exp.duration_weeks} weeks`} />}
          {exp.eligibility && <Info label="Eligibility" value={exp.eligibility} />}
        </div>
      )}

      {rounds.length > 0 && (
        <Section title="Rounds">
          <Accordion type="multiple" className="space-y-2">
            {rounds.map((r, i) => (
              <AccordionItem key={i} value={`r${i}`} className="glass rounded-xl border-0 px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left">
                    <span className="font-medium">Round {i + 1}: {r.name ?? r.title ?? "—"}</span>
                    {r.duration && <span className="text-xs text-muted-foreground ml-2">· {r.duration}</span>}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {r.description ?? r.questions ?? "—"}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>
      )}

      {dsa.length > 0 && <QuestionList title="DSA Questions" items={dsa} />}
      {cs.length > 0 && <QuestionList title="CS Subjects" items={cs} />}
      {hr.length > 0 && <QuestionList title="HR Questions" items={hr} />}
      {res.length > 0 && <QuestionList title="Resume Questions" items={res} />}

      {exp.tips && (
        <Section title="Tips">
          <p className="text-foreground/80 whitespace-pre-wrap">{exp.tips}</p>
        </Section>
      )}

      {exp.technologies?.length > 0 && (
        <Section title="Technologies">
          <div className="flex flex-wrap gap-2">
            {exp.technologies.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        </Section>
      )}

      <Section title={`Comments (${comments.length})`}>
        {user ? (
          <div className="flex gap-2 mb-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts…"
              className="bg-background/50 min-h-[80px]"
            />
            <Button onClick={postComment} disabled={posting || !newComment.trim()}>Post</Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">Sign in to comment.</p>
        )}
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><MessageCircle className="h-4 w-4" /> No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="glass rounded-xl p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-sm font-medium">{c.profiles?.full_name ?? "Anonymous"}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="font-medium mt-0.5">{value}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="glass rounded-2xl p-5 mb-6">
    <h2 className="font-display text-lg font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

const QuestionList = ({ title, items }: { title: string; items: any[] }) => (
  <Section title={title}>
    <ul className="space-y-2">
      {items.map((q, i) => (
        <li key={i} className="text-sm flex gap-2">
          <span className="text-primary font-mono text-xs mt-0.5">{i + 1}.</span>
          <span className="text-foreground/80">{typeof q === "string" ? q : q.question ?? q.title ?? JSON.stringify(q)}</span>
        </li>
      ))}
    </ul>
  </Section>
);

export default ExperienceDetail;
