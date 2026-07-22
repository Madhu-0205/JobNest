import { useI18n } from "@/lib/i18n/context";import { cn } from "@/utils/cn";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

/**
 * Enterprise Loading Indicator.
 * Supports inline spinner and full-screen overlay states with proper backdrop blur filters.
 */
export function Loading({ className, size = "md", fullPage = false }: LoadingProps) {const { t: i18nT } = useI18n();
  const sizeStyles = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16"
  };

  const spinner =
  <svg
    className={cn("animate-spin text-primary", sizeStyles[size], className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-label={i18nT("Loading content")}
    role="progressbar">
    
      <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
      className="opacity-80"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    
    </svg>;


  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <span className="text-sm font-medium text-muted-foreground/80">{i18nT("Loading JobNest...")}</span>
        </div>
      </div>);

  }

  return <div className="flex justify-center items-center p-4">{spinner}</div>;
}