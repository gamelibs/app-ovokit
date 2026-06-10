"use client";

import { useRef, useEffect } from "react";
import rough from "roughjs";

interface SketchDividerProps {
  className?: string;
  color?: string;
}

export function SketchDivider({
  className = "",
  color = "#202020",
}: SketchDividerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    svg.innerHTML = "";

    const rc = rough.svg(svg);
    const node = rc.line(0, 10, 200, 10, {
      roughness: 2,
      bowing: 1,
      stroke: color,
      strokeWidth: 2,
    });
    svg.appendChild(node);
  }, [color]);

  return (
    <div className={`w-full overflow-hidden py-2 ${className}`}>
      <svg
        ref={svgRef}
        width="100%"
        height="20"
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
      />
    </div>
  );
}
