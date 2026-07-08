import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) + "-" + Math.random().toString(36).slice(2, 6);

type TC = { input: string; expected_output: string; explanation?: string };

const OANew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ path: string; url: string }[]>([]);

  const [form, setForm] = useState({
    title: "", company_id: "", platform: "", role: "",
    difficulty: "medium", topics: "", statement: "",
    input_format: "", output_format: "", constraints: "",
    time_limit_ms: 2000, memory_limit_kb: 262144,
    estimated_time_complexity: "", estimated_space_complexity: "",
    hints: "",
  });
  const [samples, setSamples] = useState<TC[]>([{ input: "", expected_output: "" }]);
  const [hidden, setHidden] = useState<TC[]>([{ input: "", expected_output: "" }]);

  useEffect(() => {
    supabase.from("companies").select("id,name").eq("status", "approved").order("name").then(({ data }) => setCompanies(data ?? []));
  }, []);

  const updateTC = (arr: TC[], setArr: (v: TC[]) => void, i: number, key: keyof TC, value: string) => {
    const next = [...arr]; next[i] = { ...next[i], [key]: value }; setArr(next);
  };

  const uploadImage = async (file: File) => {
    if (!user) return navigate("/auth");
    if (!file.type.startsWith("image/")) return toast.error("Only image files allowed");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("oa-images").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage.from("oa-images").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr || !signed) throw sErr;
      setImages((prev) => [...prev, { path, url: signed.signedUrl }]);
      setForm((f) => ({ ...f, statement: (f.statement ? f.statement + "\n\n" : "") + `![screenshot](${signed.signedUrl})` }));
      toast.success("Image added to statement");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (i: number) => {
    const img = images[i];
    setImages((prev) => prev.filter((_, j) => j !== i));
    setForm((f) => ({ ...f, statement: f.statement.replace(new RegExp(`!\\[[^\\]]*\\]\\(${img.url.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\)\\n*`, "g"), "") }));
    await supabase.storage.from("oa-images").remove([img.path]);
  };

  const submit = async () => {
    if (!user) return navigate("/auth");
    if (!form.title || !form.statement) return toast.error("Title and statement are required");
    setSubmitting(true);
    const { error } = await supabase.from("oa_questions").insert({
      author_id: user.id,
      title: form.title,
      slug: slugify(form.title),
      company_id: form.company_id || null,
      platform: form.platform || null,
      role: form.role || null,
      difficulty: form.difficulty as any,
      topics: form.topics.split(",").map(s => s.trim()).filter(Boolean),
      statement: form.statement,
      input_format: form.input_format || null,
      output_format: form.output_format || null,
      constraints: form.constraints || null,
      time_limit_ms: Number(form.time_limit_ms) || 2000,
      memory_limit_kb: Number(form.memory_limit_kb) || 262144,
      sample_tests: samples.filter(t => t.input || t.expected_output) as any,
      hidden_tests: hidden.filter(t => t.input || t.expected_output) as any,
      hints: form.hints.split("\n").map(s => s.trim()).filter(Boolean),
      estimated_time_complexity: form.estimated_time_complexity || null,
      estimated_space_complexity: form.estimated_space_complexity || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted for review");
    navigate("/app/oa");
  };

  return (
    <div>
      <PageHeader title="Submit OA Question" description="Share an OA you encountered. It goes live after admin approval." />
      <div className="grid gap-6 max-w-3xl">
        <div className="glass rounded-2xl p-6 grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Company</Label>
              <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Platform</Label><Input placeholder="HackerRank, CodeSignal…" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} /></div>
            <div><Label>Role</Label><Input placeholder="SDE Intern" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
            <div>
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Topics (comma-separated)</Label><Input placeholder="arrays, dp" value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} /></div>
          </div>
          <div><Label>Statement *</Label><Textarea rows={6} value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} /></div>
          <div>
            <Label>Screenshots (optional)</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative h-24 w-24 rounded-lg overflow-hidden border border-border">
                  <img src={img.url} alt="upload" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition text-xs text-muted-foreground gap-1">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
                />
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Images are embedded into the statement as markdown.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Input Format</Label><Textarea rows={3} value={form.input_format} onChange={(e) => setForm({ ...form, input_format: e.target.value })} /></div>
            <div><Label>Output Format</Label><Textarea rows={3} value={form.output_format} onChange={(e) => setForm({ ...form, output_format: e.target.value })} /></div>
          </div>
          <div><Label>Constraints</Label><Textarea rows={3} value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} /></div>
          <div className="grid md:grid-cols-4 gap-4">
            <div><Label>Time (ms)</Label><Input type="number" value={form.time_limit_ms} onChange={(e) => setForm({ ...form, time_limit_ms: Number(e.target.value) })} /></div>
            <div><Label>Memory (KB)</Label><Input type="number" value={form.memory_limit_kb} onChange={(e) => setForm({ ...form, memory_limit_kb: Number(e.target.value) })} /></div>
            <div><Label>Time Complexity</Label><Input placeholder="O(n log n)" value={form.estimated_time_complexity} onChange={(e) => setForm({ ...form, estimated_time_complexity: e.target.value })} /></div>
            <div><Label>Space Complexity</Label><Input placeholder="O(n)" value={form.estimated_space_complexity} onChange={(e) => setForm({ ...form, estimated_space_complexity: e.target.value })} /></div>
          </div>
          <div><Label>Hints (one per line)</Label><Textarea rows={3} value={form.hints} onChange={(e) => setForm({ ...form, hints: e.target.value })} /></div>
        </div>

        {[
          { label: "Sample Tests (visible)", arr: samples, setArr: setSamples },
          { label: "Hidden Tests (for judge)", arr: hidden, setArr: setHidden },
        ].map(({ label, arr, setArr }) => (
          <div key={label} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">{label}</h3>
              <Button size="sm" variant="outline" onClick={() => setArr([...arr, { input: "", expected_output: "" }])} className="gap-1">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="space-y-3">
              {arr.map((t, i) => (
                <div key={i} className="border border-border rounded-lg p-3 grid md:grid-cols-2 gap-3 relative">
                  <div><Label className="text-xs">Input</Label><Textarea rows={3} className="font-mono text-xs" value={t.input} onChange={(e) => updateTC(arr, setArr, i, "input", e.target.value)} /></div>
                  <div><Label className="text-xs">Expected Output</Label><Textarea rows={3} className="font-mono text-xs" value={t.expected_output} onChange={(e) => updateTC(arr, setArr, i, "expected_output", e.target.value)} /></div>
                  {arr.length > 1 && (
                    <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7" onClick={() => setArr(arr.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/app/oa")}>Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="gap-1">
            {submitting && <Loader2 className="h-3 w-3 animate-spin" />}Submit for Review
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OANew;