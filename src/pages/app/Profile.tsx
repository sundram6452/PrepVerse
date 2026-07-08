import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Mail, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <p className="text-sm text-muted-foreground">Your account</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Profile</h1>
      </div>

      <div className="glass-strong rounded-2xl p-6 flex items-center gap-5">
        <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
          {(user?.email?.[0] ?? "U").toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold">
            {(user?.user_metadata?.full_name as string | undefined) ?? "Anonymous prepper"}
          </h2>
          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Mail className="h-3.5 w-3.5" /> {user?.email}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            <Shield className="h-3.5 w-3.5" /> Member
          </div>
        </div>
      </div>

      <Button variant="outline" className="glass gap-2" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
};

export default Profile;