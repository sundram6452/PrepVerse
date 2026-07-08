import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Award } from "lucide-react";

const tierColor: Record<string,string> = {
  bronze: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  silver: "bg-slate-400/20 text-slate-200 border-slate-400/40",
  gold: "bg-yellow-400/20 text-yellow-200 border-yellow-400/40",
  platinum: "bg-cyan-400/20 text-cyan-200 border-cyan-400/40",
};

const Leaderboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: u }, { data: b }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,avatar_url,reputation,streak").order("reputation",{ascending:false}).limit(50),
        supabase.from("badges").select("*").order("points",{ascending:false}),
      ]);
      setUsers(u ?? []);
      setBadges(b ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Leaderboard & Badges" description="Top contributors and how to earn recognition." />
      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-2" />Leaderboard</TabsTrigger>
          <TabsTrigger value="badges"><Award className="h-4 w-4 mr-2" />Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          {loading ? <Skeleton className="h-96 rounded-2xl" /> : (
            <div className="glass rounded-2xl divide-y divide-border">
              {users.map((u, i) => (
                <div key={u.id} className="flex items-center gap-4 p-4">
                  <div className={`w-8 text-center font-display font-bold ${i < 3 ? "text-accent" : "text-muted-foreground"}`}>#{i+1}</div>
                  <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {(u.full_name?.[0] ?? "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{u.full_name ?? "Anonymous"}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <Flame className="h-3 w-3" /> {u.streak ?? 0} day streak
                    </div>
                  </div>
                  <div className="font-display font-semibold">{u.reputation ?? 0} <span className="text-[10px] text-muted-foreground">pts</span></div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map(b => (
            <div key={b.id} className="glass rounded-2xl p-5">
              <Badge className={tierColor[b.tier] ?? ""} variant="outline">{b.tier}</Badge>
              <h3 className="font-display text-lg font-semibold mt-3">{b.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{b.description}</p>
              <div className="text-[11px] text-accent mt-3">+{b.points} pts</div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;