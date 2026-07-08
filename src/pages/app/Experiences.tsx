import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareText, Search, Plus, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { CompanyLogo } from "@/components/CompanyLogo";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = {
  id: string;
  role: string;
  package_lpa: number | null;
  difficulty: string | null;
  result: string | null;
  rating: number | null;
  tips: string | null;
  mode: string | null;
  created_at: string;
  companies: { name: string; slug: string; logo_url: string | null } | null;
};

const Experiences = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<string>("all");
  const [sort, setSort] = useState<"recent" | "rating" | "package">("recent");

  useEffect(() => {
    supabase
      .from("interview_experiences")
      .select("id,role,package_lpa,difficulty,result,rating,tips,mode,created_at,companies(name,slug,logo_url)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as unknown as Row[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let r = rows.filter((x) => {
      const matchQ = !q || x.role.toLowerCase().includes(q.toLowerCase()) || x.companies?.name.toLowerCase().includes(q.toLowerCase());
      const matchD = diff === "all" || x.difficulty === diff;
      return matchQ && matchD;
    });
    if (sort === "rating") r = [...r].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "package") r = [...r].sort((a, b) => (b.package_lpa ?? 0) - (a.package_lpa ?? 0));
    return r;
  }, [rows, q, diff, sort]);

  return (
    <div>
      <PageHeader
        title="Interview Experiences"
        description="Real interview stories — rounds, questions, packages, and tips from peers who've been there."
        action={
          <Button asChild>
            <Link to="/app/experiences/new"><Plus className="h-4 w-4 mr-1.5" /> Share yours</Link>
          </Button>
        }
      />

      <div className="glass rounded-2xl p-4 mb-6 grid md:grid-cols-[1fr_auto_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search role or company…" className="pl-9 bg-background/50" />
        </div>
        <Select value={diff} onValueChange={setDiff}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulty</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
            <SelectItem value="package">Highest package</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No experiences yet"
          description="Be the first to share an interview experience for your dream company."
          action={<Button asChild><Link to="/app/experiences/new">Share an experience</Link></Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              to={`/app/experiences/${r.id}`}
              className="glass rounded-2xl p-5 flex items-start gap-4 hover:border-primary/40 hover:shadow-glow transition-all"
            >
              <CompanyLogo name={r.companies?.name ?? "?"} logoUrl={r.companies?.logo_url} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <h3 className="font-display text-base font-semibold">{r.role}</h3>
                    <p className="text-xs text-muted-foreground">{r.companies?.name} · {r.mode?.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DifficultyBadge value={r.difficulty} />
                    {r.rating && (
                      <span className="flex items-center gap-1 text-xs text-amber-300">
                        <Star className="h-3 w-3 fill-current" /> {r.rating}
                      </span>
                    )}
                  </div>
                </div>
                {r.tips && <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{r.tips}</p>}
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  {r.package_lpa && <span className="text-neon-cyan">{r.package_lpa} LPA</span>}
                  {r.result && <span className="capitalize">{r.result.replace("_", " ")}</span>}
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Experiences;
