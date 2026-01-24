"use client";
import Link from "next/link";
import { ReactNode } from "react";

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

export const LinkButton = ({
  href,
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: LinkButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 relative font-medium rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-[color:var(--surface-0)]";

  const variants = {
    primary: "bg-accent text-white hover:bg-[color:var(--accent-strong)]",
    secondary: "bg-surface-2 text-strong hover:bg-surface-3",
    ghost: "bg-transparent text-muted hover:bg-surface-2",
    danger: "bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger-strong)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <Link
      href={href}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </Link>
  );
};
