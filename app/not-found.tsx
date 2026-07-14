"use client";

import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";

/**
 * Custom 404 Not Found Page.
 * Built with the enterprise design system.
 */
export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-24 text-center">
      <div className="max-w-md w-full glass-card p-8 rounded-md border border-border">
        <Typography variant="muted" className="text-sm font-semibold tracking-wider uppercase text-primary mb-2">
          404 Error
        </Typography>
        <Typography variant="h1" className="text-5xl font-extrabold tracking-tight mb-4">
          Page Not Found
        </Typography>
        <Typography variant="muted" className="text-base text-muted-foreground/80 mb-8">
          The page you are looking for does not exist or has been moved.
        </Typography>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" passHref className="inline-flex">
            <Button variant="primary" className="w-full sm:w-auto">
              Return Home
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
