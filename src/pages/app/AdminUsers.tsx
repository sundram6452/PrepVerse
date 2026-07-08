import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, ShieldOff, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  college: string | null;
  batch: string | null;
  branch: string | null;
  reputation: number | null;
  streak: number | null;
  created_at: string;
  isAdmin: boolean;
};

const AdminUsers = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: adminRoles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    const adminSet = new Set((adminRoles ?? []).map((r) => r.user_id));
    setRows((profs ?? []).map((p: any) => ({ ...p, isAdmin: adminSet.has(p.id) })));
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const toggleAdmin = async (row: Row) => {
    if (row.id === user?.id && row.isAdmin) {
      return toast.error("You can't remove your own admin role.");
    }
    if (row.isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", row.id).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin removed");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: row.id, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Admin granted");
    }
    load();
  };

  if (roleLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  const filtered = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (r.full_name ?? "").toLowerCase().includes(s) || (r.college ?? "").toLowerCase().includes(s) || r.id.includes(s);
  });

  return (
    <div>
      <PageHeader title="Users" description="Manage members and role assignments." />
      <div className="glass rounded-2xl p-4 mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, college, id" value={q} onChange={(e) => setQ(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0" />
      </div>
      {loading ? <Skeleton className="h-96 rounded-2xl" /> : (
        <div className="glass rounded-2xl divide-y divide-border overflow-hidden">
          {filtered.map((r) => (
            <div key={r.id} className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                {(r.full_name?.[0] ?? "U").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{r.full_name ?? "Unnamed"}</p>
                  {r.isAdmin && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {r.college ?? "—"} {r.batch ? `· ${r.batch}` : ""} {r.branch ? `· ${r.branch}` : ""}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {r.reputation ?? 0}</span>
                <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {r.streak ?? 0}</span>
              </div>
              <Button size="sm" variant={r.isAdmin ? "outline" : "default"} onClick={() => toggleAdmin(r)}>
                {r.isAdmin ? <><ShieldOff className="h-4 w-4 mr-1" /> Revoke</> : <><ShieldCheck className="h-4 w-4 mr-1" /> Make admin</>}
              </Button>
            </div>
          ))}
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No users match.</div>}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;