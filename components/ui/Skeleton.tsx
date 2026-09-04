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

export function JobCardSkeleton() {
  return (
    <div className="p-4 rounded-xl glass-card flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mt-2" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function WalletTransactionSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/30">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function WorkerCardSkeleton() {
  return (
    <div className="p-4 rounded-xl glass-card flex flex-col gap-3 items-center text-center">
      <Skeleton className="w-16 h-16 rounded-full" />
      <Skeleton className="h-5 w-24 mt-1" />
      <Skeleton className="h-3 w-20" />
      <div className="flex gap-2 w-full mt-2">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>
    </div>
  );
}
