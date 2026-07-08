import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export const EmptyState = ({ icon: Icon, title, description, action }: Props) => (
  <div className="glass rounded-2xl p-12 text-center flex flex-col items-center gap-4">
    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
      <Icon className="h-7 w-7 text-primary" />
    </div>
    <div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
    </div>
    {action}
  </div>
);
