'use client';
import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full"
            >
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full rounded-xl border border-input bg-white/50 dark:bg-slate-900/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </motion.div>
        )
    }
)
Input.displayName = "Input"

export { Input }
