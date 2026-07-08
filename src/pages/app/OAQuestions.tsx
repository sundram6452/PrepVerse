import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { Code2, Plus, Search, Building2, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OAQuestions = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("oa_questions")
      .select("id,slug,title,difficulty,topics,platform,time_limit_ms,created_at,companies(name,slug,logo_url)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((i) => {
      if (diff !== "all" && i.difficulty !== diff) return false;
      if (!s) return true;
      return (
        i.title.toLowerCase().includes(s) ||
        i.companies?.name?.toLowerCase().includes(s) ||
        (i.topics ?? []).some((t: string) => t.toLowerCase().includes(s))
      );
    });
  }, [items, q, diff]);

  return (
    <div>
      <PageHeader
        title="OA Questions"
        description="Practice real online assessment problems with a live editor and test runner."
        action={
          <Link to="/app/oa/new">
            <Button className="gap-2"><Plus className="h-4 w-4" /> Submit Question</Button>
          </Link>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by title, company, topic…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={diff} onValueChange={setDiff}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulty</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Code2}
          title="No questions yet"
          description="Be the first to share one — your submission goes live after admin approval."
          action={<Link to="/app/oa/new"><Button>Submit Question</Button></Link>}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((i) => (
            <Link
              key={i.id}
              to={`/app/oa/${i.slug}`}
              className="glass rounded-xl p-4 hover:bg-secondary/40 transition-colors flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{i.title}</h3>
                  <DifficultyBadge value={i.difficulty} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  {i.companies?.name && (<span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{i.companies.name}</span>)}
                  {i.platform && <span>· {i.platform}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.round(i.time_limit_ms / 1000)}s</span>
                  {(i.topics ?? []).slice(0, 3).map((t: string) => (
                    <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
              <Code2 className="h-5 w-5 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OAQuestions;