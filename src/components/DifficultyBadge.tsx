import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const DifficultyBadge = ({ value }: { value?: string | null }) => {
  if (!value) return null;
  const map: Record<string, string> = {
    easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    hard: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return (
    <Badge variant="outline" className={cn("capitalize border", map[value])}>
      {value}
    </Badge>
  );
};
