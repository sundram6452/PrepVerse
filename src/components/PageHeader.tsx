interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export const PageHeader = ({ title, description, action }: Props) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>}
    </div>
    {action}
  </div>
);
