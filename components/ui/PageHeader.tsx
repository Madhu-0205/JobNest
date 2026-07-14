import React from "react";
import { cn } from "@/utils/cn";
import { Typography } from "./Typography";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Enterprise PageHeader Primitive.
 * Used at the top of landing pages and dashboard segments.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border/50 mb-8",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <Typography variant="h1" className="text-3xl font-bold tracking-tight">
          {title}
        </Typography>
        {description && (
          <Typography variant="muted" className="text-base text-muted-foreground/80">
            {description}
          </Typography>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
