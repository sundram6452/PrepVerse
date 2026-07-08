import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Building2, Code2, MessageSquareText, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const quickLinks = [
  { icon: Building2, label: "Browse Companies", desc: "Explore hiring patterns", to: "/app/companies" },
  { icon: Code2, label: "Practice OAs", desc: "Live Monaco editor", to: "/app/oa" },
  { icon: MessageSquareText, label: "Read Experiences", desc: "Real interview rounds", to: "/app/experiences" },
  { icon: CalendarDays, label: "Upcoming Drives", desc: "Don't miss a deadline", to: "/app/calendar" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "there";
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ns = await supabase.from("notifications").select("id, title, body, created_at, read").eq("user_id", user.id).order("created_at",{ascending:false}).limit(8);
      setActivity(ns.data ?? []);
    })();
  }, [user]);

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">
          Hey {name}, <span className="gradient-text">let's prep.</span>
        </h1>
      </motion.div>

      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Jump back in</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {quickLinks.map((q, i) => (
            <motion.a
              key={q.label}
              href={q.to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
              className="glass rounded-2xl p-6 flex items-center gap-4 hover:shadow-glow transition-all group"
            >
              <div className="h-12 w-12 rounded-xl gradient-glow flex items-center justify-center group-hover:scale-110 transition-transform">
                <q.icon className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{q.label}</div>
                <div className="text-sm text-muted-foreground">{q.desc}</div>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((n) => (
                <li key={n.id} className="text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
};

export default Dashboard;