"use client";

import { ReactNode } from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "whatsapp";
  href?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  target?: string;
  rel?: string;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-green text-white shadow-lg shadow-green/25 hover:bg-green-deep hover:-translate-y-1 hover:shadow-xl hover:shadow-green/30",
  secondary:
    "bg-transparent text-white border-2 border-white/25 hover:border-gold hover:text-gold hover:bg-gold/10 hover:-translate-y-1",
  whatsapp:
    "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25 hover:bg-[#20BD5A] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#25D366]/35",
};

export default function Button({
  variant = "primary",
  href,
  icon,
  children,
  className = "",
  onClick,
  target,
  rel,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full text-base font-bold transition-all duration-300 cursor-pointer active:scale-[0.98] hover:scale-[1.02]";

  const classes = `${baseClasses} ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        target={target}
        rel={rel}
      >
        {icon && <span className="w-5 h-5 shrink-0">{icon}</span>}
        {children}
      </a>
    );
  }

  return (
    <button className={classes} onClick={onClick}>
      {icon && <span className="w-5 h-5 shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
