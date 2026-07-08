import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, MessageSquare, ArrowUp, Pin, Search } from "lucide-react";

const CATEGORIES = [
  "all","dsa","resume","interview","oa","company","referrals","mock_interviews","internships","placements","general",
] as const;

const Forum = () => {
  const nav = useNavigate();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("forum_threads").select("*").order("pinned",{ascending:false}).order("created_at",{ascending:false}).limit(50);
      if (cat !== "all") query = query.eq("category", cat as any);
      const { data } = await query;
      setThreads(data ?? []);
      setLoading(false);
    })();
  }, [cat]);

  const filtered = threads.filter(t =>
    !q || t.title.toLowerCase().includes(q.toLowerCase()) || (t.tags ?? []).some((x: string) => x.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <PageHeader
        title="Discussion Forum"
        description="Ask, share, and learn with the community."
        action={<Button onClick={() => nav("/app/forum/new")}><Plus className="h-4 w-4 mr-2" />New thread</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search threads or tags…" className="pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No threads yet" description="Be the first to start a conversation." />
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <Link key={t.id} to={`/app/forum/${t.id}`} className="glass rounded-xl p-5 flex gap-4 items-start hover:shadow-glow transition-all block">
              <div className="flex flex-col items-center min-w-14 text-center">
                <ArrowUp className="h-4 w-4 text-accent" />
                <div className="font-display font-semibold">{t.score}</div>
                <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1"><MessageSquare className="h-3 w-3" />{t.reply_count}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {t.pinned && <Pin className="h-3.5 w-3.5 text-accent" />}
                  <h3 className="font-semibold truncate">{t.title}</h3>
                  <Badge variant="outline" className="capitalize">{t.category.replace("_"," ")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.body}</p>
                {t.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.tags.map((tag: string) => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(t.created_at).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Forum;