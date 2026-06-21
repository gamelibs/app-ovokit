"use client";

/**
 * OVO 图形 Logo。
 *
 * 使用 SVG 绘制两个空心圆（O）+ 中间手绘风格 V，
 * 整体呈现 "oVo" 字样，与品牌 Logo 视觉稿一致。
 */
export function OvoLogo({
  className = "",
  width = 56,
  height = 34,
  purple = "var(--logo-purple)",
  inner = "#ffffff",
}: {
  className?: string;
  width?: number;
  height?: number;
  purple?: string;
  inner?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 120"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="OVO"
    >
      {/* 左侧 O：紫色外圈 + 白色内圈 */}
      <circle cx="50" cy="60" r="40" fill={purple} />
      <circle cx="50" cy="60" r="19" fill={inner} />

      {/* 右侧 O：紫色外圈 + 白色内圈 */}
      <circle cx="150" cy="60" r="40" fill={purple} />
      <circle cx="150" cy="60" r="19" fill={inner} />

      {/* 中间 V：手绘风格，顶部平齐、底部带锯齿 */}
      <path
        d="M 68 8 L 84 8 L 93 78 L 96 74 L 100 84 L 104 74 L 107 78 L 116 8 L 132 8 L 110 88 L 104 80 L 100 90 L 96 80 L 90 88 Z"
        fill={purple}
      />
    </svg>
  );
}
