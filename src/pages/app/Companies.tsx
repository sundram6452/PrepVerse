import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Search, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type Company = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  headquarters: string | null;
  hiring_frequency: string | null;
  tags: string[];
  avg_package: number | null;
  description: string | null;
};

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("companies")
      .select("id,slug,name,logo_url,headquarters,hiring_frequency,tags,avg_package,description")
      .eq("status", "approved")
      .order("name")
      .then(({ data }) => {
        setCompanies((data ?? []) as Company[]);
        setLoading(false);
      });
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchQ = !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.headquarters?.toLowerCase().includes(q.toLowerCase());
      const matchTag = !activeTag || c.tags.includes(activeTag);
      return matchQ && matchTag;
    });
  }, [companies, q, activeTag]);

  return (
    <div>
      <PageHeader
        title="Company Hub"
        description="Deep-dive profiles for every recruiter — hiring patterns, packages, OA history, and interview playbooks."
      />

      <div className="glass rounded-2xl p-4 mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search companies, locations…"
            className="pl-9 bg-background/50"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeTag === null ? "default" : "outline"}
              onClick={() => setActiveTag(null)}
              className="h-7"
            >
              All
            </Button>
            {allTags.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={activeTag === t ? "default" : "outline"}
                onClick={() => setActiveTag(t)}
                className="h-7"
              >
                {t}
              </Button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies match"
          description="Try clearing filters or another keyword."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/app/companies/${c.slug}`}
              className="glass rounded-2xl p-5 hover:border-primary/40 hover:shadow-glow transition-all group"
            >
              <div className="flex items-start gap-4 mb-4">
                <CompanyLogo name={c.name} logoUrl={c.logo_url} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold truncate group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{c.headquarters}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {c.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{c.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {c.tags.slice(0, 3).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3">
                <span>{c.hiring_frequency ?? "—"}</span>
                {c.avg_package != null && (
                  <span className="text-neon-cyan font-medium">{c.avg_package} LPA</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Companies;
