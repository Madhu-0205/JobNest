import React from "react";
import { cn } from "@/utils/cn";
import { Typography } from "./Typography";
import { Button } from "./Button";

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  error?: Error | string;
  onRetry?: () => void;
}

/**
 * Enterprise Error State Component.
 * Standardizes the display of errors across APIs and routing failures.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this section. Please try again.",
  error,
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  const errorMessage = typeof error === "string" ? error : error?.message;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-lg glass-card border border-rose-500/20 max-w-lg mx-auto my-8 animate-fade-in",
        className
      )}
      {...props}
      role="alert"
    >
      <div className="mb-4 text-rose-400 w-12 h-12 flex items-center justify-center bg-rose-500/10 rounded-full border border-rose-500/25">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <Typography variant="h3" className="text-lg font-semibold mb-2">
        {title}
      </Typography>
      <Typography variant="muted" className="mb-4 max-w-sm">
        {description}
      </Typography>
      
      {errorMessage && (
        <pre className="mb-6 p-3 bg-red-950/20 border border-red-500/15 rounded text-xs text-rose-300 max-w-sm overflow-x-auto w-full text-left font-mono">
          <code>{errorMessage}</code>
        </pre>
      )}
      
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
