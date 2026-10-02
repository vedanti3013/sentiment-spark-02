import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[3px_3px_0_var(--ink)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)] active:translate-y-0 active:shadow-[1px_1px_0_var(--ink)]",
  secondary:
    "border-2 border-foreground bg-secondary text-secondary-foreground hover:bg-accent",
  ghost: "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}