"use client";

import { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { useTheme } from "@/providers/ThemeProvider";

/**
 * JobNest V2 - Enterprise Foundation Landing Page.
 * Showcases design primitives, tokens, accessibility, dark mode, and extension hooks.
 */
export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const [demoLoading, setDemoLoading] = useState(false);
  const [showErrorDemo, setShowErrorDemo] = useState(false);

  const triggerLoader = () => {
    setDemoLoading(true);
    setTimeout(() => setDemoLoading(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-amber-600 flex items-center justify-center text-background font-extrabold text-lg">
              J
            </span>
            <Typography variant="h3" as="span" className="font-bold tracking-tight text-xl">
              JobNest
            </Typography>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Typography variant="muted" className="hover:text-primary transition-colors cursor-pointer">
              Find Work
            </Typography>
            <Typography variant="muted" className="hover:text-primary transition-colors cursor-pointer">
              Post a Gig
            </Typography>
            <Typography variant="muted" className="hover:text-primary transition-colors cursor-pointer">
              About
            </Typography>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground"
              aria-label="Toggle visual theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Access JobNest</DialogTitle>
                  <DialogDescription>
                    Auth and third-party integrations are scheduled for Phase 2. This dialog serves as a design system extension point.
                  </DialogDescription>
                </DialogHeader>
                <div className="pt-4 flex flex-col gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Button variant="primary" disabled className="w-full mt-2">
                    Proceed (Phase 2)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="primary" size="sm" onClick={triggerLoader} isLoading={demoLoading}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12">
        
        {/* Hero Section */}
        <section className="text-center py-16 md:py-24 flex flex-col items-center gap-6">
          <Badge variant="primary" className="mb-2">
            JobNest V2 Foundation Active
          </Badge>
          <Typography variant="h1" className="max-w-3xl leading-tight">
            Connecting Skilled Locals with Nearby Opportunities
          </Typography>
          <Typography variant="lead" className="max-w-2xl">
            An enterprise-grade, hyperlocal job marketplace built on clean architecture, 
            Next.js 15 App Router, and React 19.
          </Typography>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button variant="primary" size="lg" onClick={triggerLoader}>
              Explore Opportunities
            </Button>
            <Button variant="outline" size="lg" onClick={() => setShowErrorDemo(!showErrorDemo)}>
              Toggle Error State View
            </Button>
          </div>
        </section>

        {/* Primitive Showcase Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Card & Details Primitive */}
          <Card className="flex flex-col gap-4">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="gold-gradient-text">Design Primitives</CardTitle>
                <Badge variant="success">WCAG AA Compliant</Badge>
              </div>
              <CardDescription>
                A selection of reusable cards, avatars, and badge tokens.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <Typography variant="h4" className="text-sm font-semibold">
                    John Doe
                  </Typography>
                  <Typography variant="muted" className="text-xs">
                    Experienced Carpenter • 1.2 miles away
                  </Typography>
                </div>
              </div>
              <Typography variant="p">
                This template is optimized for screen readers and high contrast. 
                Fonts load dynamically using Next.js font optimization.
              </Typography>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Typography variant="muted" className="text-xs">
                Performance: Standalone Output
              </Typography>
              <Button variant="ghost" size="sm">
                Learn More
              </Button>
            </CardFooter>
          </Card>

          {/* Dynamic Component State Showcase */}
          <div className="flex flex-col gap-6">
            <Typography variant="h2" className="text-2xl font-bold">
              Dynamic Primitives
            </Typography>
            
            {showErrorDemo ? (
              <ErrorState
                title="Simulated API Exception"
                description="This boundary displays fallback code blocks for error states."
                error="Error: Code 502 Bad Gateway at Integration (Ollama API offline)"
                onRetry={() => setShowErrorDemo(false)}
              />
            ) : (
              <EmptyState
                title="No Nearby Jobs Available"
                description="We couldn't find any listings matching your area. Try posting a job to get started!"
                actionLabel="Post a Job"
                onAction={triggerLoader}
              />
            )}
          </div>
        </section>

        {/* Global Loading overlay */}
        {demoLoading && <Loading fullPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Typography variant="muted" className="text-sm">
            © 2026 JobNest. All rights reserved. Rebuilt V2.
          </Typography>
          <div className="flex gap-4">
            <Typography variant="muted" className="text-xs hover:text-foreground cursor-pointer">
              Privacy Policy
            </Typography>
            <Typography variant="muted" className="text-xs hover:text-foreground cursor-pointer">
              Terms of Service
            </Typography>
          </div>
        </div>
      </footer>
    </div>
  );
}
