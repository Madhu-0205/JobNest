'use client';
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'luxury';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden";

        const variants = {
            primary: "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/25",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
            outline: "border-2 border-primary/20 bg-transparent hover:bg-primary/5 text-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            luxury: "bg-gradient-to-r from-primary via-purple-500 to-secondary text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 border border-white/10"
        };

        const sizes = {
            sm: "h-9 px-4 text-sm",
            md: "h-12 px-6 text-base",
            lg: "h-14 px-8 text-lg",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </motion.button>
        );
    }
);
Button.displayName = "Button";
