"use client";

import { useMemo } from "react";
import { SketchBorder } from "./SketchBorder";

interface SketchCardProps {
  children: React.ReactNode;
  className?: string;
  rotate?: "random" | number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function SketchCard({
  children,
  className = "",
  rotate = "random",
  fill = "rgba(250, 247, 239, 0.5)",
  stroke = "rgba(32, 32, 32, 0.55)",
  strokeWidth = 1.5,
}: SketchCardProps) {
  const angle = useMemo(() => {
    if (typeof rotate === "number") {
      return Math.max(-1, Math.min(1, rotate));
    }
    const angles = [-0.6, -0.3, 0, 0.3, 0.6];
    const idx = hashString(
      typeof children === "string" ? children : ""
    ) % angles.length;
    return angles[idx];
  }, [rotate, children]);

  return (
    <div
      className={`transition-transform duration-200 hover:scale-[1.01] ${className}`}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <SketchBorder fill={fill} stroke={stroke} strokeWidth={strokeWidth}>
        <div className="p-4">{children}</div>
      </SketchBorder>
    </div>
  );
}
