import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, Code2, MessageSquareText, CalendarDays, Flag, ShieldCheck, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#ef4444", "#22c55e", "#a855f7"];

const AdminDashboard = () => {
  const { isAdmin, loading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [signups, setSignups] = useState<any[]>([]);
  const [topCompanies, setTopCompanies] = useState<any[]>([]);
  const [topOAs, setTopOAs] = useState<any[]>([]);
  const [pendingBreakdown, setPendingBreakdown] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const c = (t: string, filter?: Record<string, string>) => {
        let q = supabase.from(t as any).select("*", { count: "exact", head: true });
        if (filter) Object.entries(filter).forEach(([k, v]) => (q = q.eq(k, v)));
        return q;
      };
      const [
        u, comp, oa, exp, ev, rep,
        pExp, pComp, pOa, pEv,
        prof, oaList, expList,
      ] = await Promise.all([
        c("profiles"),
        c("companies", { status: "approved" }),
        c("oa_questions", { status: "approved" }),
        c("interview_experiences", { status: "approved" }),
        c("calendar_events", { status: "approved" }),
        c("experience_reports"),
        c("interview_experiences", { status: "pending" }),
        c("companies", { status: "pending" }),
        c("oa_questions", { status: "pending" }),
        c("calendar_events", { status: "pending" }),
        supabase.from("profiles").select("created_at").order("created_at", { ascending: false }).limit(1000),
        supabase.from("oa_questions").select("id,title,slug,views").eq("status","approved").order("views",{ascending:false}).limit(5),
        supabase.from("interview_experiences").select("id,role,views,companies(name)").eq("status","approved").order("views",{ascending:false}).limit(5),
      ]);

      setStats({
        users: u.count ?? 0,
        companies: comp.count ?? 0,
        oa: oa.count ?? 0,
        experiences: exp.count ?? 0,
        events: ev.count ?? 0,
        reports: rep.count ?? 0,
      });

      // signups over last 14 days
      const days = Array.from({ length: 14 }).map((_, i) => {
        const d = subDays(new Date(), 13 - i);
        const key = format(d, "yyyy-MM-dd");
        return { date: format(d, "MMM d"), key, count: 0 };
      });
      (prof.data ?? []).forEach((p: any) => {
        const k = p.created_at.slice(0, 10);
        const b = days.find((x) => x.key === k);
        if (b) b.count += 1;
      });
      setSignups(days);

      setTopOAs(oaList.data ?? []);
      setTopCompanies(expList.data ?? []);

      setPendingBreakdown([
        { name: "Experiences", value: pExp.count ?? 0 },
        { name: "Companies", value: pComp.count ?? 0 },
        { name: "OA Questions", value: pOa.count ?? 0 },
        { name: "Events", value: pEv.count ?? 0 },
      ]);

      setLoading(false);
    })();
  }, [isAdmin]);

  if (roleLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  const kpis = stats ? [
    { icon: Users, label: "Users", value: stats.users },
    { icon: Building2, label: "Companies", value: stats.companies },
    { icon: Code2, label: "OA Questions", value: stats.oa },
    { icon: MessageSquareText, label: "Experiences", value: stats.experiences },
    { icon: CalendarDays, label: "Events", value: stats.events },
    { icon: Flag, label: "Reports", value: stats.reports },
  ] : [];

  return (
    <div>
      <PageHeader title="Admin overview" description="Platform health, growth and content pipeline." action={
        <div className="flex gap-2">
          <Link to="/app/admin/approvals" className="glass px-4 py-2 rounded-lg text-sm hover:text-primary flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Approvals</Link>
          <Link to="/app/admin/users" className="glass px-4 py-2 rounded-lg text-sm hover:text-primary flex items-center gap-2"><Users className="h-4 w-4"/> Users</Link>
          <Link to="/app/admin/reports" className="glass px-4 py-2 rounded-lg text-sm hover:text-primary flex items-center gap-2"><Flag className="h-4 w-4"/> Reports</Link>
        </div>
      } />

      {loading ? <Skeleton className="h-96 rounded-2xl" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {kpis.map((k) => (
              <div key={k.label} className="glass rounded-2xl p-4">
                <k.icon className="h-5 w-5 text-accent mb-2" />
                <div className="font-display text-2xl font-bold">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="glass rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Signups · last 14 days</h3>
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={signups}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-semibold mb-4">Pending queue</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pendingBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={4}>
                      {pendingBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                {pendingBreakdown.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground flex-1">{p.name}</span>
                    <span className="font-medium">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-semibold mb-4">Most viewed OAs</h3>
              <div className="space-y-2">
                {topOAs.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
                {topOAs.map((o: any) => (
                  <Link key={o.id} to={`/app/oa/${o.slug}`} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary/50">
                    <span className="text-sm truncate">{o.title}</span>
                    <span className="text-xs text-muted-foreground">{o.views ?? 0} views</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-semibold mb-4">Most viewed experiences</h3>
              <div className="space-y-2">
                {topCompanies.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
                {topCompanies.map((e: any) => (
                  <Link key={e.id} to={`/app/experiences/${e.id}`} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary/50">
                    <span className="text-sm truncate">{e.companies?.name} · {e.role}</span>
                    <span className="text-xs text-muted-foreground">{e.views ?? 0} views</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;