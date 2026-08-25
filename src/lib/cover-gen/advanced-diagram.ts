/**
 * 高级设计与算法图解（⑤ 区配图）：每循环一张概念图，与 advancedWarnings/advancedAlgoRefs 直接对应。
 * 图解可以有少量标注文字（它是图，不是封面）。
 */

const INK = "#2b2b2b";
const PAPER = "#faf7ef";
const YELLOW = "#ffda6a";
const RED = "#ff8b8b";
const BLUE = "#7cc4ff";

type Fn = () => string;

function frame(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <defs>
    <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="0.8" opacity="0.35"/>
    </pattern>
  </defs>
  <rect width="480" height="360" fill="${PAPER}"/>
  ${body}
  <rect x="7" y="7" width="466" height="346" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <rect x="12" y="12" width="456" height="336" fill="none" stroke="${INK}" stroke-width="0.75"/>
</svg>`;
}

function txt(x: number, y: number, s: string, size = 12, anchor = "middle", color = INK): string {
  return `<text x="${x}" y="${y}" font-family="Kalam, cursive" font-size="${size}" fill="${color}" text-anchor="${anchor}">${s}</text>`;
}
function line(x1: number, y1: number, x2: number, y2: number, w = 1.2, dash = ""): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
}
function poly(pts: [number, number][], w = 1.8, color = INK): string {
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function axes(x: number, y: number, w: number, h: number, xl: string, yl: string): string {
  return (
    line(x, y, x, y - h, 1.4) + line(x, y, x + w, y, 1.4) +
    `<path d="M${x - 4} ${y - h + 8} L${x} ${y - h} L${x + 4} ${y - h + 8}" fill="none" stroke="${INK}" stroke-width="1.4"/>` +
    `<path d="M${x + w - 8} ${y - 4} L${x + w} ${y} L${x + w - 8} ${y + 4}" fill="none" stroke="${INK}" stroke-width="1.4"/>` +
    txt(x + w - 6, y + 18, xl, 11, "end") + txt(x + 4, y - h + 14, yl, 11, "start")
  );
}
function rect(x: number, y: number, w: number, h: number, fill: string, sw = 1.2): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
}
function node(x: number, y: number, r: number, fill: string, label?: string): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="1.3"/>` +
    (label ? txt(x, y + 4, label, 11) : "");
}
function arrow(x1: number, y1: number, x2: number, y2: number, dash = "5 3"): string {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="1.3"${dash ? ` stroke-dasharray="${dash}"` : ""}/>` +
    `<path d="M${mx - 4} ${my - 5} L${mx + 3} ${my} L${mx - 4} ${my + 5}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
}

/** 动作反应：难度曲线（速度阶梯 + 密度斜坡，对应压力递进算法） */
const action: Fn = () => {
  let s = axes(60, 300, 360, 230, "时间 t", "强度");
  // 速度：阶梯式
  s += poly([[60, 260], [150, 260], [150, 210], [240, 210], [240, 170], [330, 170], [330, 130], [420, 130]], 2.2);
  // 密度：持续斜坡
  s += poly([[60, 285], [420, 95]], 1.6, "#b8860b");
  s += txt(105, 245, "爬坡", 11) + txt(215, 195, "平台", 11) + txt(360, 115, "冲刺", 11);
  s += txt(430, 90, "密度", 11, "middle", "#b8860b") + txt(430, 125, "速度", 11);
  s += txt(240, 335, "难度 = 速度阶梯 × 密度斜坡（可控生成，非纯随机）", 13);
  return s;
};

/** 空间规划：状态空间搜索树 */
const spatial: Fn = () => {
  let s = "";
  s += node(240, 70, 14, YELLOW, "S");
  const l1 = [150, 240, 330];
  l1.forEach((x) => { s += arrow(240, 84, x, 130); s += node(x, 140, 12, "url(#hatch)"); });
  s += arrow(150, 152, 110, 210) + node(110, 220, 12, "url(#hatch)");
  s += arrow(150, 152, 190, 210) + node(190, 220, 12, "url(#hatch)");
  s += arrow(240, 152, 240, 210) + node(240, 220, 12, "url(#hatch)");
  s += arrow(330, 152, 330, 210) + node(330, 220, 12, BLUE);
  s += txt(345, 224, "解", 12);
  s += line(60, 268, 420, 268, 0.8, "3 4");
  s += txt(240, 292, "深度优先剪枝：无解分支早停", 12);
  s += txt(240, 330, "状态空间搜索：初始局面 S → 逐层展开 → 找到解", 13);
  return s;
};

/** 合成进化：成本/产出指数曲线 */
const merge: Fn = () => {
  let s = axes(60, 300, 360, 230, "等级 n", "数值");
  // 成本：陡指数
  s += poly([[60, 290], [140, 282], [220, 265], [300, 220], [380, 130], [430, 70]], 2.2, "#c0392b");
  // 产出：缓指数
  s += poly([[60, 295], [160, 288], [260, 272], [360, 235], [430, 185]], 2.2, "#2e8b57");
  s += txt(415, 65, "成本", 11, "middle", "#c0392b") + txt(420, 180, "产出", 11, "middle", "#2e8b57");
  s += txt(245, 250, "剪刀差", 12) + line(250, 240, 300, 222, 1, "3 3") + line(250, 262, 262, 268, 1, "3 3");
  s += txt(240, 335, "成本增速 > 产出增速 = 「前期爽后期肝」的根因", 13);
  return s;
};

/** 经营模拟：经济循环流 */
const management: Fn = () => {
  let s = "";
  s += rect(60, 140, 90, 56, "url(#hatch)") + txt(105, 172, "建造", 14);
  s += rect(195, 140, 90, 56, YELLOW) + txt(240, 172, "生产", 14);
  s += rect(330, 140, 90, 56, "url(#hatch)") + txt(375, 172, "经济", 14);
  s += arrow(150, 168, 195, 168) + arrow(285, 168, 330, 168);
  s += `<path d="M375 196 Q375 260 240 262 Q105 260 105 196" fill="none" stroke="${INK}" stroke-width="1.3" stroke-dasharray="5 3"/>`;
  s += `<path d="M111 202 L105 196 L99 202" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
  s += txt(240, 250, "再投资", 12);
  s += txt(240, 60, "正反馈环：赚到 → 投入 → 赚更多", 14);
  s += txt(240, 330, "关键算法：产出速率 / 成本递增 / 库存上限（经济引擎三参数）", 13);
  return s;
};

/** 策略对抗：克制三角 + 伤害公式 */
const strategy: Fn = () => {
  let s = "";
  s += node(240, 90, 20, YELLOW, "A");
  s += node(140, 230, 20, BLUE, "B");
  s += node(340, 230, 20, "url(#hatch)", "C");
  s += arrow(218, 106, 162, 214) + txt(168, 150, "克", 11);
  s += arrow(162, 230, 318, 230) + txt(240, 222, "克", 11);
  s += arrow(318, 214, 262, 106) + txt(312, 150, "克", 11);
  s += line(70, 300, 420, 300, 1);
  s += txt(240, 322, "伤害 = 攻击 × 克制系数(1.5/1.0/0.5) − 防御", 13);
  return s;
};

/** 交互叙事：分支汇合树 */
const narrative: Fn = () => {
  let s = "";
  s += node(240, 66, 13, YELLOW);
  s += arrow(240, 80, 150, 130) + node(150, 140, 12, "url(#hatch)");
  s += arrow(240, 80, 330, 130) + node(330, 140, 12, "url(#hatch)");
  s += arrow(150, 152, 130, 210) + node(130, 220, 11, "url(#hatch)");
  s += arrow(150, 152, 200, 205);
  s += arrow(330, 152, 350, 210) + node(350, 220, 11, "url(#hatch)");
  s += arrow(330, 152, 280, 205);
  // 汇合点
  s += node(240, 250, 15, BLUE, "合");
  s += arrow(130, 231, 226, 244, "") + arrow(350, 231, 254, 244, "");
  s += arrow(240, 265, 240, 305) + node(240, 316, 12, YELLOW, "终");
  s += txt(330, 290, "汇合点收束分支爆炸", 12);
  return s;
};

export const ADVANCED_DIAGRAMS: Record<string, Fn> = {
  action,
  spatial,
  merge,
  management,
  strategy,
  narrative,
};

export function composeAdvancedDiagramSvg(patternKey: string): string {
  const fn = ADVANCED_DIAGRAMS[patternKey] ?? action;
  return frame(fn());
}
