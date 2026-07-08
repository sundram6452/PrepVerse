import { cn } from "@/lib/utils";

interface Props {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
};

export const CompanyLogo = ({ name, logoUrl, size = "md", className }: Props) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "rounded-xl bg-secondary/60 border border-border flex items-center justify-center overflow-hidden font-display font-bold text-foreground/80 shrink-0",
        sizes[size],
        className,
      )}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-1.5 bg-white"
          onError={(e) => ((e.currentTarget.style.display = "none"))}
        />
      ) : (
        initials
      )}
    </div>
  );
};
