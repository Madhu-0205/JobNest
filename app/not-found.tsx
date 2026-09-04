"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Home, ArrowLeft } from "lucide-react";

/**
 * Custom 404 Not Found Page.
 * JobNest 2.0 Branded, accessible, and responsive.
 */
export default function NotFound() {
  const { t: i18nT } = useI18n();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 sm:px-6 py-16 text-center selection:bg-primary/20 selection:text-primary">
      <div className="max-w-md w-full glass-card p-6 sm:p-8 rounded-2xl border border-border/60 shadow-luxury flex flex-col items-center">
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-linear-to-r from-primary to-amber-600 flex items-center justify-center text-background font-extrabold text-2xl shadow-lg shadow-primary/20 mb-6">
          J
        </div>

        <span className="text-xs font-mono font-bold tracking-widest uppercase text-primary mb-2">
          {i18nT("app.404Error") || "404 Error"}
        </span>

        <Typography variant="h1" className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-foreground">
          {i18nT("app.pageNotFound") || "Page not found"}
        </Typography>

        <Typography variant="muted" className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-sm">
          {i18nT("app.thePageYouAreLookingForDoesNot") || "The page you're looking for doesn't exist or may have moved."}
        </Typography>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto gap-2 text-xs font-bold py-2.5">
              <Home className="w-4 h-4" />
              <span>{i18nT("app.returnHome") || "Go to JobNest Home"}</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto gap-2 text-xs font-semibold py-2.5 border-border hover:bg-secondary/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{i18nT("app.goBack") || "Go Back"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}