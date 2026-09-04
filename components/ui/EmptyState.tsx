import { FileSearch } from "lucide-react";
import { cn } from "@/utils/cn";
import { Typography } from "@/components/ui/Typography";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border bg-card/20 animate-fade-in",
        className
      )}
    >
      <div className="bg-secondary/30 p-4 rounded-full mb-4 text-muted-foreground">
        {icon || <FileSearch className="w-8 h-8" />}
      </div>
      <Typography variant="h4" className="mb-2">
        {title}
      </Typography>
      <Typography variant="muted" className="mb-6 max-w-sm text-balance">
        {description}
      </Typography>
      {action && <div>{action}</div>}
    </div>
  );
}
