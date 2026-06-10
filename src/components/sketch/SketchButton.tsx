"use client";

import { SketchBorder } from "./SketchBorder";

interface SketchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit" | "reset";
}

export function SketchButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
}: SketchButtonProps) {
  const fillMap: Record<string, string> = {
    primary: "#ffda6a",
    secondary: "#faf7ef",
    ghost: "none",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`cursor-pointer bg-transparent p-0 ${className}`}
    >
      <SketchBorder fill={fillMap[variant]}>
        <span className="font-kalam block px-4 py-2 text-sm">{children}</span>
      </SketchBorder>
    </button>
  );
}
