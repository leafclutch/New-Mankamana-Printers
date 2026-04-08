import { cn } from "@/lib/utils";
import React from "react";

export interface BadgeProps extends React.ComponentProps<"div"> {
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300",
        {
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80":
            variant === "default",
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80":
            variant === "secondary",
          "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/80":
            variant === "destructive",
          "text-slate-950 dark:text-slate-50": variant === "outline",
          "border-transparent bg-emerald-100 text-emerald-600 hover:bg-emerald-100/80":
            variant === "success",
          "border-transparent bg-amber-100 text-amber-600 hover:bg-amber-100/80":
            variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
