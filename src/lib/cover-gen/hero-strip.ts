/**
 * 循环连环画（头图）：三格一幕，把一个循环瞬间讲清楚。
 * 不用文字（符号/图形表达），与 demo 不重复，不是装饰。
 */

const INK = "#2b2b2b";
const PAPER = "#faf7ef";
const YELLOW = "#ffda6a";
const RED = "#ff8b8b";
const BLUE = "#7cc4ff";
const GREEN = "#9be29b";

type Fn = () => string;

function frame(panels: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <defs>
    <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="0.8" opacity="0.35"/>
    </pattern>
  </defs>
  <rect width="480" height="360" fill="${PAPER}"/>
  ${panels}
  <rect x="7" y="7" width="466" height="346" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <rect x="12" y="12" width="456" height="336" fill="none" stroke="${INK}" stroke-width="0.75"/>
</svg>`;
}

function panel(x: number, body: string): string {
  return `<rect x="${x}" y="80" width="120" height="180" rx="4" fill="none" stroke="${INK}" stroke-width="1.2"/>${body}`;
}
function arrowH(x: number): string {
  return `<line x1="${x}" y1="170" x2="${x + 18}" y2="170" stroke="${INK}" stroke-width="1.6" stroke-dasharray="4 3"/>
  <path d="M${x + 14} 165 L${x + 20} 170 L${x + 14} 175" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
}
function line(x1: number, y1: number, x2: number, y2: number, w = 1.2, dash = ""): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
}
function circle(cx: number, cy: number, r: number, fill: string, sw = 1.2, dash = ""): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}
function rect(x: number, y: number, w: number, h: number, fill: string, sw = 1.2, rx = 2): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
}
function path(d: string, fill: string, sw = 1.2, dash = ""): string {
  return `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round" stroke-linejoin="round"/>`;
}
function txt(x: number, y: number, s: string, size = 13, color = INK): string {
  return `<text x="${x}" y="${y}" font-family="Kalam, cursive" font-size="${size}" fill="${color}" text-anchor="middle">${s}</text>`;
}
const NONE = "none";
const HATCH = "url(#hatch)";

const X1 = 42, X2 = 180, X3 = 318, A1 = 164, A2 = 302;

/** 动作反应：障碍逼近 → 起跳闪开 → 越过得分 */
const action: Fn = () => {
  let s = panel(X1, "");
  s += circle(X1 + 60, 200, 12, YELLOW, 1.6);
  s += rect(X1 + 88, 120, 18, 18, RED, 1.5);
  s += line(X1 + 84, 129, X1 + 74, 145, 1.2, "3 3");
  s += line(X1 + 20, 235, X1 + 100, 235, 1.2);
  s += panel(X2, "");
  s += circle(X2 + 60, 150, 12, YELLOW, 1.6);
  s += path(`M${X2 + 40} 200 Q${X2 + 60} 130 ${X2 + 82} 190`, NONE, 1.6, "5 3");
  s += rect(X2 + 88, 190, 18, 18, RED, 1.5);
  s += line(X2 + 20, 235, X2 + 100, 235, 1.2);
  s += panel(X3, "");
  s += circle(X3 + 55, 205, 12, YELLOW, 1.6);
  s += rect(X3 + 40, 190, 18, 18, RED, 1.5);
  s += txt(X3 + 92, 140, "+1", 20, "#d97706");
  s += line(X3 + 20, 235, X3 + 100, 235, 1.2);
  return frame(s + arrowH(A1) + arrowH(A2));
};

/** 空间规划：观察局面 → 落子 → 连线得分 */
const spatial: Fn = () => {
  const grid = (x: number, y0: number, extra: string) => {
    let g = "";
    for (let i = 1; i < 3; i++) {
      g += line(x + 24 * i, y0, x + 24 * i, y0 + 72, 1);
      g += line(x, y0 + 24 * i, x + 72, y0 + 24 * i, 1);
    }
    g += rect(x, y0, 72, 72, NONE, 1.4);
    g += path(`M${x + 18} ${y0 + 18} L${x + 30} ${y0 + 30} M${x + 30} ${y0 + 18} L${x + 18} ${y0 + 30}`, NONE, 1.8);
    g += circle(x + 48, y0 + 48, 7, NONE, 1.8);
    return g + extra;
  };
  let s = panel(X1, "") + grid(X1 + 24, 105, txt(X1 + 60, 215, "?", 18, "#888"));
  s += panel(X2, "") + grid(X2 + 24, 105, circle(X2 + 96, 177, 9, YELLOW, 1.8));
  s += panel(X3, "") + grid(X3 + 24, 105, circle(X3 + 96, 177, 9, YELLOW, 1.8) + line(X3 + 36, 129, X3 + 84, 177, 2) + txt(X3 + 92, 140, "+3", 18, "#d97706"));
  return frame(s + arrowH(A1) + arrowH(A2));
};

/** 合成进化：两块 → 合并 → 升级产出 */
const merge: Fn = () => {
  let s = panel(X1, "");
  s += rect(X1 + 25, 150, 34, 34, BLUE, 1.6, 4);
  s += rect(X1 + 65, 150, 34, 34, BLUE, 1.6, 4);
  s += txt(X1 + 60, 215, "1 + 1", 15);
  s += panel(X2, "");
  s += path(`M${X2 + 30} 170 Q${X2 + 60} 150 ${X2 + 88} 168`, NONE, 1.6, "5 3");
  s += txt(X2 + 60, 130, "合", 18);
  s += panel(X3, "");
  s += rect(X3 + 35, 145, 50, 50, GREEN, 1.8, 5);
  s += txt(X3 + 60, 175, "2", 22);
  s += txt(X3 + 88, 135, "+产", 14, "#d97706");
  return frame(s + arrowH(A1) + arrowH(A2));
};

/** 经营模拟：建造 → 生产 → 金币再投资 */
const management: Fn = () => {
  let s = panel(X1, "");
  s += rect(X1 + 35, 150, 50, 40, HATCH, 1.5, 3);
  s += path(`M${X1 + 30} 150 L${X1 + 60} 128 L${X1 + 90} 150`, NONE, 1.5);
  s += txt(X1 + 60, 215, "建", 15);
  s += panel(X2, "");
  s += rect(X2 + 35, 150, 50, 40, HATCH, 1.5, 3);
  s += path(`M${X2 + 60} 132 L${X2 + 60} 118 M${X2 + 52} 124 L${X2 + 68} 124`, NONE, 1.4);
  s += circle(X2 + 82, 140, 8, YELLOW, 1.4);
  s += circle(X2 + 92, 148, 8, YELLOW, 1.4);
  s += panel(X3, "");
  s += circle(X3 + 50, 160, 14, YELLOW, 1.6);
  s += circle(X3 + 68, 152, 14, YELLOW, 1.6);
  s += path(`M${X3 + 40} 200 Q${X3 + 62} 218 ${X3 + 84} 198`, NONE, 1.6, "4 3");
  s += txt(X3 + 62, 196, "投", 14);
  return frame(s + arrowH(A1) + arrowH(A2));
};

/** 策略对抗：配置 → 交锋 → 奖励 */
const strategy: Fn = () => {
  let s = panel(X1, "");
  s += circle(X1 + 42, 160, 12, BLUE, 1.5);
  s += circle(X1 + 70, 160, 12, BLUE, 1.5);
  s += rect(X1 + 30, 190, 56, 10, HATCH, 1.2, 2);
  s += txt(X1 + 60, 222, "配置", 13);
  s += panel(X2, "");
  s += path(`M${X2 + 35} 190 L${X2 + 75} 150 L${X2 + 83} 158 L${X2 + 43} 198 Z`, HATCH, 1.5);
  s += path(`M${X2 + 85} 190 L${X2 + 45} 150`, NONE, 1.5);
  const ix = X2 + 60, iy = 138;
  let d = "";
  for (let i = 0; i < 8; i++) { const a = (Math.PI / 4) * i; const r = i % 2 ? 7 : 16; d += `${i === 0 ? "M" : "L"}${ix + Math.cos(a) * r} ${iy + Math.sin(a) * r} `; }
  s += path(d + "Z", YELLOW, 1.2);
  s += panel(X3, "");
  s += circle(X3 + 52, 155, 14, YELLOW, 1.6);
  s += txt(X3 + 52, 160, "★", 12);
  s += rect(X3 + 36, 190, 48, 12, HATCH, 1.2, 2);
  s += txt(X3 + 60, 222, "奖励", 13);
  return frame(s + arrowH(A1) + arrowH(A2));
};

/** 交互叙事：两个选项 → 选其一 → 不同结局 */
const narrative: Fn = () => {
  let s = panel(X1, "");
  s += rect(X1 + 18, 130, 84, 26, NONE, 1.4, 4);
  s += rect(X1 + 18, 168, 84, 26, NONE, 1.4, 4);
  s += txt(X1 + 60, 147, "选 A", 13);
  s += txt(X1 + 60, 185, "选 B", 13);
  s += panel(X2, "");
  s += rect(X2 + 18, 130, 84, 26, NONE, 1.2, 4);
  s += rect(X2 + 18, 168, 84, 26, YELLOW, 1.6, 4);
  s += txt(X2 + 60, 185, "选 B", 13);
  s += path(`M${X2 + 24} 116 L${X2 + 32} 124 L${X2 + 46} 106`, NONE, 1.8);
  s += panel(X3, "");
  s += circle(X3 + 60, 158, 16, BLUE, 1.6);
  s += txt(X3 + 60, 163, "终", 13);
  s += line(X3 + 30, 200, X3 + 90, 200, 1.2, "4 3");
  s += txt(X3 + 60, 222, "结局 B", 12, "#888");
  return frame(s + arrowH(A1) + arrowH(A2));
};

export const HERO_STRIPS: Record<string, Fn> = {
  action, spatial, merge, management, strategy, narrative,
};

export function composeHeroStripSvg(patternKey: string): string {
  const fn = HERO_STRIPS[patternKey] ?? action;
  return fn();
}
