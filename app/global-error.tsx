"use client";

import { useEffect } from "react";
import { logger } from "@/services/logger";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Enterprise Global Error Boundary.
 * Replaces root HTML and body to handle critical failures within the root layout.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logger.error("Global layout error boundary caught critical exception", error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#060608] text-[#f5f5f7] flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="max-w-md w-full border border-zinc-850 bg-[#0c0c0e] p-8 rounded shadow-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-rose-400 mb-2">
            Critical Failure
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            A fatal initialization error occurred. The incident has been recorded.
          </p>
          
          {error.message && (
            <pre className="mb-6 p-3 bg-red-950/20 border border-red-500/15 rounded text-xs text-rose-300 max-w-sm overflow-x-auto w-full text-left font-mono">
              <code>{error.message}</code>
            </pre>
          )}
          
          <button
            type="button"
            onClick={reset}
            className="w-full inline-flex items-center justify-center font-medium rounded-md h-11 px-5 text-base bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:opacity-95 transition-all"
          >
            Reset Application
          </button>
        </div>
      </body>
    </html>
  );
}
