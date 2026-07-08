import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { ShieldCheck, Check, X } from "lucide-react";
import { toast } from "sonner";

const AdminApprovals = () => {
  const { isAdmin, loading: roleLoading } = useRole();
  const [exps, setExps] = useState<any[]>([]);
  const [comps, setComps] = useState<any[]>([]);
  const [oas, setOas] = useState<any[]>([]);
  const [evs, setEvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: e }, { data: c }, { data: o }, { data: ev }] = await Promise.all([
      supabase.from("interview_experiences").select("id,role,created_at,companies(name)").eq("status", "pending").order("created_at"),
      supabase.from("companies").select("id,name,slug,created_at").eq("status", "pending").order("created_at"),
      supabase.from("oa_questions").select("id,title,slug,created_at,companies(name)").eq("status", "pending").order("created_at"),
      supabase.from("calendar_events").select("id,title,event_type,event_date,created_at").eq("status", "pending").order("created_at"),
    ]);
    setExps(e ?? []);
    setComps(c ?? []);
    setOas(o ?? []);
    setEvs(ev ?? []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const update = async (table: "interview_experiences" | "companies" | "oa_questions" | "calendar_events", id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    load();
  };

  if (roleLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  return (
    <div>
      <PageHeader title="Approvals" description="Review user-submitted experiences and companies." />
      <Tabs defaultValue="experiences">
        <TabsList>
          <TabsTrigger value="experiences">Experiences ({exps.length})</TabsTrigger>
          <TabsTrigger value="companies">Companies ({comps.length})</TabsTrigger>
          <TabsTrigger value="oa">OA Questions ({oas.length})</TabsTrigger>
          <TabsTrigger value="events">Events ({evs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="experiences" className="mt-6 space-y-3">
          {loading ? <Skeleton className="h-24 rounded-xl" /> :
           exps.length === 0 ? <EmptyState icon={ShieldCheck} title="Inbox zero" description="No pending experiences." /> :
           exps.map((e) => (
             <div key={e.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
               <div>
                 <Link to={`/app/experiences/${e.id}`} className="font-medium hover:text-primary">{e.role}</Link>
                 <p className="text-xs text-muted-foreground">{e.companies?.name} · {new Date(e.created_at).toLocaleString()}</p>
               </div>
               <div className="flex gap-2">
                 <Button size="sm" variant="outline" onClick={() => update("interview_experiences", e.id, "rejected")}><X className="h-4 w-4 mr-1" /> Reject</Button>
                 <Button size="sm" onClick={() => update("interview_experiences", e.id, "approved")}><Check className="h-4 w-4 mr-1" /> Approve</Button>
               </div>
             </div>
           ))}
        </TabsContent>

        <TabsContent value="companies" className="mt-6 space-y-3">
          {loading ? <Skeleton className="h-24 rounded-xl" /> :
           comps.length === 0 ? <EmptyState icon={ShieldCheck} title="Inbox zero" description="No pending companies." /> :
           comps.map((c) => (
             <div key={c.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
               <div>
                 <p className="font-medium">{c.name}</p>
                 <p className="text-xs text-muted-foreground">{c.slug} · {new Date(c.created_at).toLocaleString()}</p>
               </div>
               <div className="flex gap-2">
                 <Button size="sm" variant="outline" onClick={() => update("companies", c.id, "rejected")}><X className="h-4 w-4 mr-1" /> Reject</Button>
                 <Button size="sm" onClick={() => update("companies", c.id, "approved")}><Check className="h-4 w-4 mr-1" /> Approve</Button>
               </div>
             </div>
           ))}
        </TabsContent>

        <TabsContent value="oa" className="mt-6 space-y-3">
          {loading ? <Skeleton className="h-24 rounded-xl" /> :
           oas.length === 0 ? <EmptyState icon={ShieldCheck} title="Inbox zero" description="No pending OA questions." /> :
           oas.map((o) => (
             <div key={o.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
               <div>
                 <Link to={`/app/oa/${o.slug}`} className="font-medium hover:text-primary">{o.title}</Link>
                 <p className="text-xs text-muted-foreground">{o.companies?.name ?? "—"} · {new Date(o.created_at).toLocaleString()}</p>
               </div>
               <div className="flex gap-2">
                 <Button size="sm" variant="outline" onClick={() => update("oa_questions", o.id, "rejected")}><X className="h-4 w-4 mr-1" /> Reject</Button>
                 <Button size="sm" onClick={() => update("oa_questions", o.id, "approved")}><Check className="h-4 w-4 mr-1" /> Approve</Button>
               </div>
             </div>
           ))}
        </TabsContent>

        <TabsContent value="events" className="mt-6 space-y-3">
          {loading ? <Skeleton className="h-24 rounded-xl" /> :
           evs.length === 0 ? <EmptyState icon={ShieldCheck} title="Inbox zero" description="No pending events." /> :
           evs.map((e) => (
             <div key={e.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
               <div>
                 <p className="font-medium">{e.title}</p>
                 <p className="text-xs text-muted-foreground capitalize">{e.event_type.replace("_"," ")} · {new Date(e.event_date).toLocaleString()}</p>
               </div>
               <div className="flex gap-2">
                 <Button size="sm" variant="outline" onClick={() => update("calendar_events", e.id, "rejected")}><X className="h-4 w-4 mr-1" /> Reject</Button>
                 <Button size="sm" onClick={() => update("calendar_events", e.id, "approved")}><Check className="h-4 w-4 mr-1" /> Approve</Button>
               </div>
             </div>
           ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminApprovals;
