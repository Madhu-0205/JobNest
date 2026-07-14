import React from "react";
import { cn } from "@/utils/cn";
import { Typography } from "./Typography";
import { Button } from "./Button";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Enterprise Empty State Component.
 * Implements a clean, centered interface with a call to action.
 */
export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-lg glass-card border border-dashed border-border max-w-lg mx-auto my-8 animate-fade-in",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 text-primary w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full border border-primary/20">
          {icon}
        </div>
      )}
      <Typography variant="h3" className="text-lg font-semibold mb-2">
        {title}
      </Typography>
      <Typography variant="muted" className="mb-6 max-w-sm">
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
