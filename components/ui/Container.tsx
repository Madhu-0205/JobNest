import React from "react";
import { cn } from "@/utils/cn";

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  clean?: boolean;
}

/**
 * Enterprise Page Container Wrapper.
 * Restricts maximum view width and enforces standard margins and padding across device sizes.
 */
export function Container({
  as: Component = "div",
  clean = false,
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        !clean && "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
