import { cn } from "@/utils/cn";

/**
 * Enterprise Skeleton Component.
 * Used for building accessible skeleton layouts during incremental/lazy-loading page states.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-secondary/80 border border-border/10", className)}
      {...props}
    />
  );
}
