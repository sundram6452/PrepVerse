import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["dsa","resume","interview","oa","company","referrals","mock_interviews","internships","placements","general"] as const;

const ForumNew = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!title.trim() || !body.trim()) return toast.error("Title and body are required");
    setSaving(true);
    const { data, error } = await supabase.from("forum_threads").insert({
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      category: category as any,
      tags: tags.split(",").map(s => s.trim()).filter(Boolean),
    }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Thread posted");
    nav(`/app/forum/${data!.id}`);
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Start a thread" description="Share a question, insight, or resource." />
      <div className="glass rounded-2xl p-6 space-y-5">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Best DP roadmap for FAANG OAs?" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("_"," ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="dp, graph, faang" />
          </div>
        </div>
        <div>
          <Label>Body</Label>
          <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Markdown-friendly. Use ``` for code blocks." />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => nav(-1)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Posting…" : "Post thread"}</Button>
        </div>
      </div>
    </div>
  );
};

export default ForumNew;