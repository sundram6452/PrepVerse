import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const StatusBadge = ({ value }: { value: string }) => {
  const map: Record<string, string> = {
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return (
    <Badge variant="outline" className={cn("capitalize border", map[value])}>
      {value}
    </Badge>
  );
};
