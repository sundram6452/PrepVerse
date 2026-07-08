import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Code2, MessageSquareText,
  CalendarDays, Users, User as UserIcon, LogOut, ShieldCheck, Flag, Gauge, Bot
} from "lucide-react";
import { AIChatbot } from "@/components/AIChatbot";
import { Logo } from "@/components/Logo";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/companies", icon: Building2, label: "Companies" },
  { to: "/app/oa", icon: Code2, label: "OA Questions" },
  { to: "/app/experiences", icon: MessageSquareText, label: "Experiences" },
  { to: "/app/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/app/forum", icon: Users, label: "Forum" },
  { to: "/app/mock-interview", icon: Bot, label: "Mock Interview" },
  { to: "/app/profile", icon: UserIcon, label: "Profile" },
];

export const AppLayout = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar/60 backdrop-blur-xl">
        <div className="p-6 border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            ...navItems,
            ...(isAdmin ? [
              { to: "/app/admin", icon: Gauge, label: "Admin", end: true },
              { to: "/app/admin/approvals", icon: ShieldCheck, label: "Approvals" },
              { to: "/app/admin/users", icon: Users, label: "Manage users" },
              { to: "/app/admin/reports", icon: Flag, label: "Reports" },
            ] : []),
          ].map(({ to, icon: Icon, label, end }: any) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border space-y-3">
          <div className="glass rounded-xl p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {(user?.email?.[0] ?? "U").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">Member</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-sidebar/60 backdrop-blur-xl">
          <div className="md:hidden"><Logo /></div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="md:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>

        <AIChatbot />
      </main>
    </div>
  );
};