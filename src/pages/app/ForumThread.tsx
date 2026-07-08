import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, MessageSquare, Pin, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ForumThread = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, "up"|"down">>({});
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from("forum_threads").select("*").eq("id", id).maybeSingle(),
      supabase.from("forum_posts").select("*").eq("thread_id", id).order("created_at"),
    ]);
    setThread(t);
    setPosts(p ?? []);
    if (user) {
      const { data: v } = await supabase.from("forum_votes").select("thread_id,post_id,vote").eq("user_id", user.id);
      const map: Record<string, "up"|"down"> = {};
      (v ?? []).forEach((row: any) => {
        const key = row.thread_id ?? row.post_id;
        if (key) map[key] = row.vote;
      });
      setMyVotes(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user?.id]);

  const vote = async (target: { thread_id?: string; post_id?: string }, v: "up"|"down") => {
    if (!user) return toast.error("Sign in to vote");
    const key = (target.thread_id ?? target.post_id)!;
    const existing = myVotes[key];
    if (existing === v) {
      await supabase.from("forum_votes").delete().eq("user_id", user.id).match(target as any);
      const next = { ...myVotes }; delete next[key]; setMyVotes(next);
    } else {
      await supabase.from("forum_votes").upsert({ user_id: user.id, vote: v, ...target }, {
        onConflict: target.thread_id ? "user_id,thread_id" : "user_id,post_id",
      });
      setMyVotes({ ...myVotes, [key]: v });
    }
    load();
  };

  const submitReply = async () => {
    if (!user || !thread || !reply.trim()) return;
    const { error } = await supabase.from("forum_posts").insert({
      thread_id: thread.id, author_id: user.id, body: reply.trim(),
    });
    if (error) return toast.error(error.message);
    if (thread.author_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: thread.author_id, type: "reply",
        title: "New reply on your thread",
        body: thread.title,
        link: `/app/forum/${thread.id}`,
      });
    }
    setReply("");
    load();
  };

  if (loading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!thread) return <div className="text-muted-foreground">Thread not found.</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/app/forum" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Forum
      </Link>

      <article className="glass-strong rounded-2xl p-6 flex gap-5">
        <div className="flex flex-col items-center min-w-12">
          <button onClick={() => vote({ thread_id: thread.id }, "up")}>
            <ArrowUp className={`h-5 w-5 ${myVotes[thread.id] === "up" ? "text-accent" : "text-muted-foreground"}`} />
          </button>
          <div className="font-display font-semibold my-1">{thread.score}</div>
          <button onClick={() => vote({ thread_id: thread.id }, "down")}>
            <ArrowDown className={`h-5 w-5 ${myVotes[thread.id] === "down" ? "text-destructive" : "text-muted-foreground"}`} />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {thread.pinned && <Pin className="h-4 w-4 text-accent" />}
            {thread.locked && <Lock className="h-4 w-4 text-muted-foreground" />}
            <Badge variant="outline" className="capitalize">{thread.category.replace("_"," ")}</Badge>
            {thread.tags?.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-3">{thread.title}</h1>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.body}</ReactMarkdown>
          </div>
          <p className="text-xs text-muted-foreground mt-4">{new Date(thread.created_at).toLocaleString()}</p>
        </div>
      </article>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> {posts.length} {posts.length === 1 ? "reply" : "replies"}
        </h2>
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="glass rounded-xl p-4 flex gap-4">
              <div className="flex flex-col items-center min-w-10">
                <button onClick={() => vote({ post_id: p.id }, "up")}>
                  <ArrowUp className={`h-4 w-4 ${myVotes[p.id] === "up" ? "text-accent" : "text-muted-foreground"}`} />
                </button>
                <div className="text-sm font-semibold">{p.score}</div>
                <button onClick={() => vote({ post_id: p.id }, "down")}>
                  <ArrowDown className={`h-4 w-4 ${myVotes[p.id] === "down" ? "text-destructive" : "text-muted-foreground"}`} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.body}</ReactMarkdown>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(p.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {user && !thread.locked && (
          <div className="glass rounded-xl p-4 mt-4">
            <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply… (markdown supported)" />
            <div className="flex justify-end mt-3">
              <Button onClick={submitReply} disabled={!reply.trim()}>Reply</Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ForumThread;