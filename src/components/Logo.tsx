import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className, showText = true }: LogoProps) => (
  <div className={cn("flex items-center gap-2", className)}>
    <img
      src={logo}
      alt="PrepArena logo"
      width={32}
      height={32}
      className="h-8 w-8 drop-shadow-[0_0_12px_hsl(var(--neon-cyan)/0.6)]"
    />
    {showText && (
      <span className="font-display text-lg font-bold tracking-tight">
        Prep<span className="gradient-text">Arena</span>
      </span>
    )}
  </div>
);