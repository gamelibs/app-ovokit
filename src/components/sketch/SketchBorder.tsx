"use client";

import { useRef, useEffect } from "react";
import rough from "roughjs";

interface SketchBorderProps {
  children: React.ReactNode;
  className?: string;
  roughness?: number;
  bowing?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  radius?: number;
}

export function SketchBorder({
  children,
  className = "",
  roughness = 2,
  bowing = 1,
  stroke = "#202020",
  strokeWidth = 2,
  fill = "none",
}: SketchBorderProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const svg = svgRef.current;
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.innerHTML = "";

    const rc = rough.svg(svg);
    const node = rc.rectangle(
      strokeWidth / 2,
      strokeWidth / 2,
      width - strokeWidth,
      height - strokeWidth,
      {
        roughness,
        bowing,
        stroke,
        strokeWidth,
        fill,
        fillStyle: "hachure",
      }
    );
    svg.appendChild(node);
  }, [roughness, bowing, stroke, strokeWidth, fill]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <svg
        ref={svgRef}
        className="pointer-events-none absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
