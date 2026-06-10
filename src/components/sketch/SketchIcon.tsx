import { icons, type LucideIcon } from "lucide-react";

interface SketchIconProps {
  name: keyof typeof icons;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function SketchIcon({
  name,
  size = 20,
  className = "",
  strokeWidth = 2,
}: SketchIconProps) {
  const Icon = icons[name] as LucideIcon | undefined;
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={`text-ink ${className}`}
    />
  );
}
