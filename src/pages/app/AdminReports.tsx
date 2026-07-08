import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Flag, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const AdminReports = () => {
  const { isAdmin, loading: roleLoading } = useRole();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("experience_reports")
      .select("id, reason, created_at, experience_id, interview_experiences(id, role, status, companies(name))")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const dismiss = async (id: string) => {
    const { error } = await supabase.from("experience_reports").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Report dismissed");
    load();
  };

  const rejectExp = async (expId: string) => {
    const { error } = await supabase.from("interview_experiences").update({ status: "rejected" }).eq("id", expId);
    if (error) return toast.error(error.message);
    toast.success("Experience removed from public listings");
    load();
  };

  if (roleLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  return (
    <div>
      <PageHeader title="Reports" description="Community-flagged content awaiting review." />
      {loading ? <Skeleton className="h-64 rounded-2xl" /> :
       rows.length === 0 ? <EmptyState icon={Flag} title="Nothing flagged" description="No open reports right now." /> :
       (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Flag className="h-4 w-4 text-destructive" />
                    <p className="font-medium truncate">
                      {r.interview_experiences?.companies?.name} · {r.interview_experiences?.role}
                    </p>
                    <span className="text-[10px] uppercase text-muted-foreground">{r.interview_experiences?.status}</span>
                  </div>
                  <p className="text-sm mt-2">{r.reason || <em className="text-muted-foreground">No reason provided.</em>}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link to={`/app/experiences/${r.experience_id}`}>
                    <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => dismiss(r.id)}>Dismiss</Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectExp(r.experience_id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;