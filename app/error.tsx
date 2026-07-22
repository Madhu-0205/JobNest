"use client";

import { useEffect } from "react";import { useI18n } from "@/lib/i18n/context";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { logger } from "@/services/logger";

interface ErrorProps {
  error: Error & {digest?: string;};
  reset: () => void;
}

/**
 * Custom Error Boundary page.
 * Catches client-side errors and logs them to the central logger.
 */
export default function Error({ error, reset }: ErrorProps) {const { t: i18nT } = useI18n();
  useEffect(() => {
    logger.error("Root error boundary caught render exception", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-24 text-center">
      <div className="max-w-md w-full glass-card p-8 rounded-md border border-border">
        <Typography variant="muted" className="text-sm font-semibold tracking-wider uppercase text-rose-400 mb-2">{i18nT("System Error")}

        </Typography>
        <Typography variant="h1" className="text-3xl font-extrabold tracking-tight mb-4">{i18nT("An error occurred")}

        </Typography>
        <Typography variant="muted" className="text-base text-muted-foreground/80 mb-8">{i18nT("An unexpected error occurred during execution. This event has been logged for security audit.")}

        </Typography>
        
        {error.message &&
        <pre className="mb-6 p-3 bg-red-950/20 border border-red-500/15 rounded text-xs text-rose-300 max-w-sm overflow-x-auto w-full text-left font-mono">
            <code>{error.message}</code>
          </pre>
        }
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" onClick={reset} className="w-full sm:w-auto">{i18nT("Try Again")}

          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"} className="w-full sm:w-auto">{i18nT("Go Home")}

          </Button>
        </div>
      </div>
    </div>);

}