import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";

const base =
  "inline-flex items-center justify-center rounded-full px-6 py-3 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  // Primary CTA (docs/08_UI_DESIGN_GUIDE.md)
  primary:
    "bg-gradient-to-r from-plane-primary to-sky text-white shadow-plane hover:-translate-y-0.5 hover:shadow-xl",
  secondary:
    "border border-plane-light bg-white text-plane-dark hover:bg-sky-pale",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

type LinkButtonProps = {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: LinkButtonProps) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
