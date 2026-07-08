import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Play, Send, Maximize2, Minimize2, Save, Loader2, Heart, Bookmark, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { LANGUAGES, DEFAULT_STARTERS, runTests, RunResult } from "@/lib/oa/runner";

const OADetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: q } = await supabase
        .from("oa_questions")
        .select("*, companies(name,slug,logo_url)")
        .eq("slug", slug)
        .maybeSingle();
      if (!q) { setLoading(false); return; }
      setQuestion(q);
      const allowed = (q.allowed_languages ?? ["javascript"]) as string[];
      const lang = allowed.includes("javascript") ? "javascript" : allowed[0];
      setLanguage(lang);
      const { data: c } = await supabase.from("oa_comments").select("id,body,created_at,user_id,profiles:profiles!oa_comments_user_id_fkey(full_name,avatar_url)").eq("question_id", q.id).order("created_at");
      // profiles join might fail without explicit FK alias, fallback simple
      if (!c) {
        const { data: c2 } = await supabase.from("oa_comments").select("id,body,created_at,user_id").eq("question_id", q.id).order("created_at");
        setComments(c2 ?? []);
      } else setComments(c);
      const { count } = await supabase.from("oa_likes").select("*", { count: "exact", head: true }).eq("question_id", q.id);
      setLikeCount(count ?? 0);
      if (user) {
        const { data: lk } = await supabase.from("oa_likes").select("user_id").eq("question_id", q.id).eq("user_id", user.id).maybeSingle();
        setLiked(!!lk);
        const { data: sv } = await supabase.from("oa_saves").select("user_id").eq("question_id", q.id).eq("user_id", user.id).maybeSingle();
        setSaved(!!sv);
        const { data: d } = await supabase.from("oa_drafts").select("code").eq("question_id", q.id).eq("user_id", user.id).eq("language", lang as any).maybeSingle();
        if (d?.code) setCode(d.code);
        else setCode((q.starter_code as any)?.[lang] ?? DEFAULT_STARTERS[lang] ?? "");
      } else {
        setCode((q.starter_code as any)?.[lang] ?? DEFAULT_STARTERS[lang] ?? "");
      }
      setLoading(false);
    })();
  }, [slug, user]);

  // Switch language: load draft or starter
  useEffect(() => {
    if (!question) return;
    (async () => {
      if (user) {
        const { data: d } = await supabase.from("oa_drafts").select("code").eq("question_id", question.id).eq("user_id", user.id).eq("language", language as any).maybeSingle();
        setCode(d?.code ?? (question.starter_code?.[language] ?? DEFAULT_STARTERS[language] ?? ""));
      } else {
        setCode(question.starter_code?.[language] ?? DEFAULT_STARTERS[language] ?? "");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Autosave drafts (debounced)
  useEffect(() => {
    if (!user || !question || !code) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = window.setTimeout(async () => {
      await supabase.from("oa_drafts").upsert(
        { user_id: user.id, question_id: question.id, language: language as any, code },
        { onConflict: "user_id,question_id,language" },
      );
      setSaving(false);
    }, 1200);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [code, language, question, user]);

  const langInfo = useMemo(() => LANGUAGES.find((l) => l.value === language)!, [language]);

  const handleRun = async () => {
    if (!question) return;
    setRunning(true);
    setResult(null);
    try {
      const tests = customInput
        ? [{ input: customInput, expected_output: "" }]
        : (question.sample_tests ?? []);
      if (tests.length === 0) { toast.info("No sample tests; provide custom input."); return; }
      const r = await runTests(language, code, tests, question.time_limit_ms);
      setResult(r);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!question) return;
    setSubmitting(true);
    try {
      const all = [...(question.sample_tests ?? []), ...(question.hidden_tests ?? [])];
      const r = await runTests(language, code, all, question.time_limit_ms);
      setResult(r);
      const passed = r.results.filter((x) => x.passed).length;
      const total = r.results.length;
      const { error } = await supabase.from("oa_submissions").insert({
        question_id: question.id,
        user_id: user.id,
        language: language as any,
        code,
        status: r.status,
        runtime_ms: r.runtimeMs,
        passed_count: passed,
        total_count: total,
        test_results: r.results as any,
        stderr: r.stderr,
      });
      if (error) toast.error(error.message);
      else if (r.status === "accepted") toast.success(`Accepted — ${passed}/${total} passed`);
      else toast.error(`${r.status.replace(/_/g, " ")} — ${passed}/${total} passed`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async () => {
    if (!user) return navigate("/auth");
    if (liked) {
      await supabase.from("oa_likes").delete().eq("question_id", question.id).eq("user_id", user.id);
      setLiked(false); setLikeCount((c) => c - 1);
    } else {
      await supabase.from("oa_likes").insert({ question_id: question.id, user_id: user.id });
      setLiked(true); setLikeCount((c) => c + 1);
    }
  };
  const toggleSave = async () => {
    if (!user) return navigate("/auth");
    if (saved) {
      await supabase.from("oa_saves").delete().eq("question_id", question.id).eq("user_id", user.id);
      setSaved(false);
    } else {
      await supabase.from("oa_saves").insert({ question_id: question.id, user_id: user.id });
      setSaved(true);
    }
  };

  const postComment = async () => {
    if (!user) return navigate("/auth");
    if (!newComment.trim()) return;
    const { data, error } = await supabase.from("oa_comments").insert({ question_id: question.id, user_id: user.id, body: newComment.trim() }).select().single();
    if (error) return toast.error(error.message);
    setComments((c) => [...c, data]);
    setNewComment("");
  };

  if (loading) return <Skeleton className="h-[80vh] rounded-2xl" />;
  if (!question) return <div className="text-muted-foreground">Question not found.</div>;

  const allowed = (question.allowed_languages ?? ["javascript"]) as string[];
  const langOptions = LANGUAGES.filter((l) => allowed.includes(l.value));

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-background overflow-auto p-6" : ""}>
      {!fullscreen && (
        <PageHeader
          title={question.title}
          description={question.companies?.name ? `${question.companies.name}${question.platform ? " · " + question.platform : ""}` : question.platform}
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleLike} className="gap-1">
                <Heart className={`h-4 w-4 ${liked ? "fill-rose-400 text-rose-400" : ""}`} /> {likeCount}
              </Button>
              <Button variant="outline" size="sm" onClick={toggleSave} className="gap-1">
                <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} /> {saved ? "Saved" : "Save"}
              </Button>
            </div>
          }
        />
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Statement */}
        <div className="glass rounded-2xl p-6 max-h-[calc(100vh-200px)] overflow-auto">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <DifficultyBadge value={question.difficulty} />
            {(question.topics ?? []).map((t: string) => (
              <Badge key={t} variant="outline">{t}</Badge>
            ))}
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1"><Clock className="h-3 w-3" /> {question.time_limit_ms} ms</span>
          </div>
          <Tabs defaultValue="problem">
            <TabsList>
              <TabsTrigger value="problem">Problem</TabsTrigger>
              <TabsTrigger value="samples">Samples</TabsTrigger>
              <TabsTrigger value="discuss">Discussion ({comments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="problem" className="mt-4 space-y-4 text-sm">
              <p className="whitespace-pre-wrap leading-relaxed">{question.statement}</p>
              {question.input_format && <div><h4 className="font-semibold mb-1">Input</h4><p className="whitespace-pre-wrap text-muted-foreground">{question.input_format}</p></div>}
              {question.output_format && <div><h4 className="font-semibold mb-1">Output</h4><p className="whitespace-pre-wrap text-muted-foreground">{question.output_format}</p></div>}
              {question.constraints && <div><h4 className="font-semibold mb-1">Constraints</h4><pre className="text-xs bg-secondary/40 rounded-lg p-3 whitespace-pre-wrap">{question.constraints}</pre></div>}
              {(question.hints ?? []).length > 0 && (
                <div><h4 className="font-semibold mb-1">Hints</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">{question.hints.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
                </div>
              )}
              {(question.estimated_time_complexity || question.estimated_space_complexity) && (
                <div className="text-xs text-muted-foreground">
                  Expected: <span className="font-mono">{question.estimated_time_complexity ?? "?"}</span> time · <span className="font-mono">{question.estimated_space_complexity ?? "?"}</span> space
                </div>
              )}
            </TabsContent>
            <TabsContent value="samples" className="mt-4 space-y-3">
              {(question.sample_tests ?? []).map((t: any, i: number) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Sample {i + 1}</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div><p className="text-xs font-semibold mb-1">Input</p><pre className="text-xs bg-secondary/40 rounded p-2 whitespace-pre-wrap">{t.input}</pre></div>
                    <div><p className="text-xs font-semibold mb-1">Output</p><pre className="text-xs bg-secondary/40 rounded p-2 whitespace-pre-wrap">{t.expected_output ?? t.output}</pre></div>
                  </div>
                  {t.explanation && <p className="text-xs text-muted-foreground mt-2">{t.explanation}</p>}
                </div>
              ))}
            </TabsContent>
            <TabsContent value="discuss" className="mt-4 space-y-3">
              <div className="space-y-2">
                {comments.map((c: any) => (
                  <div key={c.id} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">{new Date(c.created_at).toLocaleString()}</p>
                    <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea placeholder="Share your approach…" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <Button onClick={postComment}>Post</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Editor */}
        <div className="glass rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {langOptions.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> : <><Save className="h-3 w-3" /> Saved</>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleRun} disabled={running} className="gap-1">
                {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Run
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1">
                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Submit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setFullscreen((f) => !f)}>
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex-1" style={{ minHeight: 380 }}>
            <Editor
              height={fullscreen ? "calc(100vh - 360px)" : "380px"}
              theme="vs-dark"
              language={langInfo.monaco}
              value={code}
              onChange={(v) => setCode(v ?? "")}
              options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2 }}
            />
          </div>

          <Tabs defaultValue="output" className="border-t border-border">
            <TabsList className="m-2">
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="input">Custom Input</TabsTrigger>
            </TabsList>
            <TabsContent value="output" className="p-3 max-h-64 overflow-auto">
              {!result ? <p className="text-xs text-muted-foreground">Run your code to see test results.</p> : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`flex items-center gap-1 font-medium ${result.status === "accepted" ? "text-emerald-400" : "text-rose-400"}`}>
                      {result.status === "accepted" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {result.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground">{result.runtimeMs} ms · {result.results.filter(r=>r.passed).length}/{result.results.length} passed</span>
                  </div>
                  {result.stderr && <pre className="text-xs text-rose-400 bg-rose-500/10 rounded p-2 whitespace-pre-wrap">{result.stderr}</pre>}
                  {result.results.map((r, i) => (
                    <div key={i} className={`text-xs rounded p-2 border ${r.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                      <p className="font-semibold mb-1">Test {i + 1} · {r.passed ? "Pass" : "Fail"} · {Math.round(r.runtimeMs)} ms</p>
                      <div className="grid md:grid-cols-3 gap-2">
                        <div><p className="opacity-70">Input</p><pre className="whitespace-pre-wrap">{r.input}</pre></div>
                        <div><p className="opacity-70">Expected</p><pre className="whitespace-pre-wrap">{r.expected}</pre></div>
                        <div><p className="opacity-70">Got</p><pre className="whitespace-pre-wrap">{r.actual}</pre></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="input" className="p-3">
              <Textarea
                rows={5}
                placeholder="Provide custom stdin to test against (used only by Run)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="font-mono text-xs"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default OADetail;