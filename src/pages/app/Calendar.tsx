import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, ExternalLink, CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EventType = "oa" | "hackathon" | "contest" | "internship" | "placement_drive" | "interview";
type Ev = {
  id: string; title: string; description: string | null; event_type: EventType;
  company_name: string | null; role: string | null;
  event_date: string; deadline: string | null; eligibility: string | null;
  registration_url: string | null; location: string | null;
};

const TYPE_COLORS: Record<EventType, string> = {
  oa: "bg-primary/20 text-primary border-primary/30",
  hackathon: "bg-accent/20 text-accent border-accent/30",
  contest: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  internship: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  placement_drive: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  interview: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const Calendar = () => {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [selected, setSelected] = useState<Ev | null>(null);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("status", "approved")
      .gte("event_date", monthStart.toISOString())
      .lte("event_date", new Date(monthEnd.getTime() + 86400000).toISOString())
      .order("event_date");
    setEvents((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cursor]);

  const grid = useMemo(() => {
    const firstDay = monthStart.getDay();
    const days = monthEnd.getDate();
    const cells: { date: Date | null; evs: Ev[] }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, evs: [] });
    for (let d = 1; d <= days; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      const evs = events.filter((e) => {
        const ed = new Date(e.event_date);
        return ed.getFullYear() === date.getFullYear() && ed.getMonth() === date.getMonth() && ed.getDate() === d;
      });
      cells.push({ date, evs });
    }
    return cells;
  }, [cursor, events, monthStart, monthEnd]);

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="OA Calendar"
        description="OAs, hackathons, contests, internships, drives — all in one place."
        action={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button disabled={!user}><Plus className="h-4 w-4 mr-2" /> Add event</Button>
            </DialogTrigger>
            <NewEventDialog onSaved={() => { setOpenNew(false); load(); }} />
          </Dialog>
        }
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold w-44 text-center">{monthLabel}</h2>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>Today</Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(TYPE_COLORS) as EventType[]).map((t) => (
            <Badge key={t} variant="outline" className={cn("capitalize", TYPE_COLORS[t])}>{t.replace("_"," ")}</Badge>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="px-2 py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            const isToday = cell.date &&
              cell.date.getDate() === today.getDate() &&
              cell.date.getMonth() === today.getMonth() &&
              cell.date.getFullYear() === today.getFullYear();
            return (
              <div key={i} className={cn(
                "min-h-24 rounded-lg border border-border/50 p-1.5 text-xs",
                cell.date ? "bg-card/40" : "bg-transparent border-transparent",
                isToday && "ring-1 ring-primary"
              )}>
                {cell.date && (
                  <>
                    <div className={cn("text-[11px] mb-1 font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                      {cell.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {cell.evs.slice(0, 3).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className={cn("w-full text-left truncate rounded px-1.5 py-0.5 border", TYPE_COLORS[e.event_type])}
                          title={e.title}
                        >
                          {e.title}
                        </button>
                      ))}
                      {cell.evs.length > 3 && <p className="text-[10px] text-muted-foreground">+{cell.evs.length - 3} more</p>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {!loading && events.length === 0 && (
          <div className="mt-6">
            <EmptyState icon={CalendarDays} title="No events this month" description="Be the first to share an upcoming OA or drive." />
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <Badge variant="outline" className={cn("capitalize", TYPE_COLORS[selected.event_type])}>{selected.event_type.replace("_"," ")}</Badge>
                {selected.company_name && <p><span className="text-muted-foreground">Company: </span>{selected.company_name}</p>}
                {selected.role && <p><span className="text-muted-foreground">Role: </span>{selected.role}</p>}
                <p><span className="text-muted-foreground">Date: </span>{new Date(selected.event_date).toLocaleString()}</p>
                {selected.deadline && <p><span className="text-muted-foreground">Deadline: </span>{new Date(selected.deadline).toLocaleString()}</p>}
                {selected.eligibility && <p><span className="text-muted-foreground">Eligibility: </span>{selected.eligibility}</p>}
                {selected.location && <p><span className="text-muted-foreground">Location: </span>{selected.location}</p>}
                {selected.description && <p className="pt-2">{selected.description}</p>}
                {selected.registration_url && (
                  <a href={selected.registration_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline pt-2">
                    Registration link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const NewEventDialog = ({ onSaved }: { onSaved: () => void }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "", description: "", event_type: "oa" as EventType,
    company_name: "", role: "", event_date: "", deadline: "",
    eligibility: "", registration_url: "", location: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Sign in required");
    if (!form.title || !form.event_date) return toast.error("Title and date required");
    setSaving(true);
    const { error } = await supabase.from("calendar_events").insert({
      title: form.title,
      description: form.description || null,
      event_type: form.event_type,
      company_name: form.company_name || null,
      role: form.role || null,
      event_date: new Date(form.event_date).toISOString(),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      eligibility: form.eligibility || null,
      registration_url: form.registration_url || null,
      location: form.location || null,
      created_by: user.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted for approval");
    onSaved();
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Add event</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v as EventType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["oa","hackathon","contest","internship","placement_drive","interview"] as EventType[]).map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t.replace("_"," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Company</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
        </div>
        <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Event date *</Label><Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
          <div><Label>Deadline</Label><Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
        </div>
        <div><Label>Eligibility</Label><Input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} /></div>
        <div><Label>Registration URL</Label><Input value={form.registration_url} onChange={(e) => setForm({ ...form, registration_url: e.target.value })} /></div>
        <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Online / city" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit for approval"}</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default Calendar;