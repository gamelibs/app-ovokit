/**
 * SVG → 位图导出工具
 * 使用 Canvas API 将 SVG 渲染为 PNG/JPG/WebP
 */

export type BitmapFormat = "png" | "jpg" | "webp";

export interface SvgToBitmapOptions {
  svg: string;
  format?: BitmapFormat;
  width?: number;
  height?: number;
  quality?: number; // 0-1，仅 jpg/webp 有效
  backgroundColor?: string; // jpg 需要背景色
}

export async function svgToBitmap(
  options: SvgToBitmapOptions,
): Promise<Blob> {
  const {
    svg,
    format = "png",
    width = 720,
    height = 960,
    quality = 0.92,
    backgroundColor = "#faf7ef",
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("无法获取 canvas context"));
        return;
      }

      ctx.scale(dpr, dpr);

      // JPG 需要填充背景
      if (format === "jpg") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType =
        format === "jpg"
          ? "image/jpeg"
          : format === "webp"
            ? "image/webp"
            : "image/png";

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob 返回 null"));
          }
        },
        mimeType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG 图片加载失败"));
    };

    img.src = url;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportSvgToFile(
  svg: string,
  format: BitmapFormat,
  filename?: string,
) {
  const blob = await svgToBitmap({ svg, format });
  const ext = format === "jpg" ? "jpg" : format;
  const name = filename || `export.${ext}`;
  downloadBlob(blob, name);
  return blob;
}
