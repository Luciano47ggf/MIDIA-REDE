import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dark";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:brightness-110 active:brightness-95 shadow-[0_1px_0_rgb(0_0_0/0.08)]",
  secondary: "bg-surface text-ink border border-line hover:border-ink/25 hover:bg-white",
  ghost: "text-ink hover:bg-ink/[0.06]",
  danger: "bg-surface text-danger border border-danger/25 hover:bg-danger hover:text-white hover:border-danger",
  dark: "bg-white/10 text-white hover:bg-white/20 backdrop-blur",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-[15px] gap-2 rounded-xl",
  lg: "h-12 px-5 text-base gap-2 rounded-xl",
  icon: "h-11 w-11 rounded-xl",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium transition select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    extra,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />;
});
