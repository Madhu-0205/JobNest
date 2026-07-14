import { HTMLAttributes, ElementType } from "react";
import { cn } from "@/utils/cn";

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: "h1" | "h2" | "h3" | "h4" | "p" | "muted" | "lead";
  as?: ElementType;
}

/**
 * Enterprise Typography Primitive.
 * Standardizes fonts, line heights, sizes, and colors for accessibility (WCAG AA).
 */
export function Typography({
  children,
  variant = "p",
  className,
  as,
  ...props
}: TypographyProps) {
  // Cast to "div" dynamically to satisfy React 19 JSX compiler typings
  const Component = (as ||
    (["h1", "h2", "h3", "h4"].includes(variant)
      ? variant
      : "p")) as "div";

  const styles = {
    h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl gold-gradient-text",
    h2: "scroll-m-20 border-b border-border pb-2 text-3xl font-semibold tracking-tight first:mt-0 text-foreground",
    h3: "scroll-m-20 text-2xl font-semibold tracking-tight text-foreground/90",
    h4: "scroll-m-20 text-xl font-semibold tracking-tight text-foreground/80",
    p: "leading-7 text-foreground/80 text-base",
    muted: "text-sm text-muted-foreground",
    lead: "text-xl text-foreground/60 leading-relaxed font-light",
  };

  return (
    <Component className={cn(styles[variant], className)} {...props}>
      {children}
    </Component>
  );
}
