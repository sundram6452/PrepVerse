import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, MapPin, Calendar, IndianRupee, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DifficultyBadge } from "@/components/DifficultyBadge";

type Company = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  headquarters: string | null;
  description: string | null;
  hiring_frequency: string | null;
  tags: string[];
  avg_package: number | null;
  internship_stipend: number | null;
};

type Exp = {
  id: string;
  role: string;
  package_lpa: number | null;
  rating: number | null;
  difficulty: string | null;
  result: string | null;
  created_at: string;
};

const CompanyDetail = () => {
  const { slug } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [experiences, setExperiences] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: c } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      setCompany(c as Company | null);
      if (c?.id) {
        const { data: exps } = await supabase
          .from("interview_experiences")
          .select("id,role,package_lpa,rating,difficulty,result,created_at")
          .eq("company_id", c.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(20);
        setExperiences((exps ?? []) as Exp[]);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!company) return <p className="text-muted-foreground">Company not found.</p>;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
        <Link to="/app/companies"><ArrowLeft className="h-4 w-4 mr-1" /> All companies</Link>
      </Button>

      <div className="glass rounded-2xl p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <CompanyLogo name={company.name} logoUrl={company.logo_url} size="lg" />
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{company.name}</h1>
            {company.headquarters && (
              <p className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
                <MapPin className="h-3.5 w-3.5" /> {company.headquarters}
              </p>
            )}
            {company.description && <p className="text-foreground/80 mb-4">{company.description}</p>}
            <div className="flex flex-wrap gap-2">
              {company.tags.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          </div>
          {company.website && (
            <Button asChild variant="outline" size="sm">
              <a href={company.website} target="_blank" rel="noreferrer">
                Visit <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          <Stat icon={IndianRupee} label="Avg Package" value={company.avg_package ? `${company.avg_package} LPA` : "—"} />
          <Stat icon={Briefcase} label="Internship" value={company.internship_stipend ? `₹${company.internship_stipend.toLocaleString()}/mo` : "—"} />
          <Stat icon={Calendar} label="Hiring" value={company.hiring_frequency ?? "—"} />
          <Stat icon={Briefcase} label="Experiences" value={String(experiences.length)} />
        </div>
      </div>

      <Tabs defaultValue="interviews">
        <TabsList>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        <TabsContent value="interviews" className="mt-6">
          {experiences.length === 0 ? (
            <p className="text-muted-foreground text-sm">No interview experiences shared yet.</p>
          ) : (
            <div className="space-y-3">
              {experiences.map((e) => (
                <Link
                  key={e.id}
                  to={`/app/experiences/${e.id}`}
                  className="glass rounded-xl p-4 flex items-center justify-between hover:border-primary/40 transition-all"
                >
                  <div>
                    <p className="font-medium">{e.role}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {e.result ?? "—"} · {e.package_lpa ? `${e.package_lpa} LPA` : "package n/a"}
                    </p>
                  </div>
                  <DifficultyBadge value={e.difficulty} />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="process" className="mt-6 text-muted-foreground text-sm">
          Process timeline content will be available once admins add it for this company.
        </TabsContent>
        <TabsContent value="resources" className="mt-6 text-muted-foreground text-sm">
          Curated preparation resources coming soon.
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
      <Icon className="h-3 w-3" /> {label}
    </p>
    <p className="font-display text-lg font-semibold mt-1">{value}</p>
  </div>
);

export default CompanyDetail;
