import type { Rng } from "./seed";
import { rr } from "./seed";

/**
 * 蚀刻报纸风 · 14 母型场景模板。
 * 画布约定：viewBox 480×360，内容区约 x∈[40,440] y∈[24,300]（底部留给图注条）。
 * 风格：细墨线（1.2/0.8）+ 排线阴影（url(#hatch)）+ 点刻（url(#stipple)），至多一处淡黄点缀。
 */

const INK = "#2b2b2b";
const YELLOW = "#ffda6a";

function line(x1: number, y1: number, x2: number, y2: number, w = 1.2, dash = ""): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
}
function rect(x: number, y: number, w: number, h: number, fill: string, sw = 1.2, rx = 2, dash = ""): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}
function circle(cx: number, cy: number, r: number, fill: string, sw = 1.2, dash = ""): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}
function path(d: string, fill: string, sw = 1.2, dash = ""): string {
  return `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round" stroke-linejoin="round"/>`;
}
const HATCH = "url(#hatch)";
const STIPPLE = "url(#stipple)";
const NONE = "none";

type SceneFn = (rng: Rng) => string;

/** 回合并绘制：3×3 棋盘特写，一子正落下 */
const turnDuel: SceneFn = (rng) => {
  const gx = rr(rng, 150, 170), gy = rr(rng, 46, 60), c = 64;
  const ox = rr(rng, 0, 1) > 0.5 ? 0 : 2;
  let s = "";
  for (let i = 1; i < 3; i++) {
    s += line(gx + c * i, gy, gx + c * i, gy + c * 3, 1.4);
    s += line(gx, gy + c * i, gx + c * 3, gy + c * i, 1.4);
  }
  s += rect(gx, gy, c * 3, c * 3, NONE, 1.6);
  // X 与 O
  const cx1 = gx + c * 0.5, cy1 = gy + c * 0.5;
  s += path(`M${cx1 - 14} ${cy1 - 14} L${cx1 + 14} ${cy1 + 14} M${cx1 + 14} ${cy1 - 14} L${cx1 - 14} ${cy1 + 14}`, NONE, 3);
  const cx2 = gx + c * (1.5 + (ox === 0 ? 0 : 0)), cy2 = gy + c * 1.5;
  s += circle(cx2, cy2, 13, NONE, 3);
  // 正落下的棋子 + 轨迹
  const fx = gx + c * (ox + 0.5), fy = gy + c * 2.5;
  s += circle(fx, fy - 46, 12, YELLOW, 2.4);
  s += path(`M${fx} ${fy - 30} L${fx} ${fy - 8}`, NONE, 1.4, "4 4");
  s += path(`M${fx - 8} ${fy - 16} L${fx} ${fy - 6} L${fx + 8} ${fy - 16}`, NONE, 1.4);
  // 排线底纹
  s += rect(gx - 20, gy + c * 3 + 14, c * 3 + 40, 8, HATCH, 0);
  return s;
};

/** 消除：三连块消除瞬间，碎裂 + 补充箭头 */
const matchClear: SceneFn = (rng) => {
  const y = rr(rng, 150, 170), x0 = 118;
  const fills = [HATCH, YELLOW, HATCH];
  let s = "";
  fills.forEach((f, i) => {
    s += rect(x0 + i * 62, y, 48, 48, f, 1.6, 4);
  });
  // 碎裂纹
  s += path(`M${x0 + 86} ${y + 8} L${x0 + 100} ${y + 22} L${x0 + 92} ${y + 38}`, NONE, 1);
  // 爆发线
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + rr(rng, -0.1, 0.1);
    const cx0 = x0 + 117, cy0 = y + 24;
    s += line(cx0 + Math.cos(a) * 66, cy0 + Math.sin(a) * 66, cx0 + Math.cos(a) * 86, cy0 + Math.sin(a) * 86, 1.4);
  }
  // 补充箭头（上方落下）
  s += path(`M${x0 + 117} ${y - 58} L${x0 + 117} ${y - 20}`, NONE, 2, "6 4");
  s += path(`M${x0 + 105} ${y - 32} L${x0 + 117} ${y - 18} L${x0 + 129} ${y - 32}`, NONE, 2);
  // 下方补充队列
  s += rect(x0 + 8, y + 76, 34, 34, STIPPLE, 1.2, 4);
  s += rect(x0 + 100, y + 76, 34, 34, STIPPLE, 1.2, 4);
  s += rect(x0 + 192, y + 76, 34, 34, STIPPLE, 1.2, 4);
  return s;
};

/** 合成：两个单位合并升级 */
const mergeUnit: SceneFn = (rng) => {
  let s = "";
  s += rect(96, 168, 52, 52, HATCH, 1.6, 5);
  s += rect(176, 168, 52, 52, HATCH, 1.6, 5);
  // 合并箭头
  s += path(`M240 194 L296 194`, NONE, 2.2);
  s += path(`M284 184 L298 194 L284 204`, NONE, 2.2);
  // 大一级单位
  s += rect(316, 128, 92, 92, YELLOW, 2, 6);
  s += `<text x="362" y="186" font-family="Kalam, cursive" font-size="44" font-weight="700" fill="${INK}" text-anchor="middle">2</text>`;
  // 链条虚线
  s += path(`M96 250 Q200 286 408 240`, NONE, 1, "3 5");
  return s;
};

/** 解谜：迷宫路径与钥匙孔 */
const puzzle: SceneFn = (rng) => {
  let s = "";
  s += rect(96, 56, 220, 220, NONE, 1.6, 6);
  s += path(`M120 250 L190 250 L190 180 L140 180 L140 120 L230 120 L230 90`, NONE, 2);
  s += path(`M250 250 L250 210 L280 210`, NONE, 1.2, "4 4");
  // 钥匙孔
  const kx = 360, ky = 160;
  s += circle(kx, ky - 14, 20, HATCH, 1.6);
  s += path(`M${kx - 10} ${ky} L${kx + 10} ${ky} L${kx + 16} ${ky + 40} L${kx - 16} ${ky + 40} Z`, HATCH, 1.6);
  s += circle(kx, ky - 14, 8, YELLOW, 1.4);
  return s;
};

/** 跑酷：三车道透视 + 奔跑小人 */
const runner: SceneFn = (rng) => {
  let s = "";
  // 透视车道
  s += path(`M120 300 L200 40 M240 300 L240 40 M360 300 L280 40`, NONE, 1.2, "8 6");
  // 障碍
  s += rect(196, 96, 40, 40, HATCH, 1.6, 4);
  // 奔跑小人（火柴人 + 速度线）
  const px = 250, py = 210;
  s += circle(px, py - 42, 11, YELLOW, 1.6);
  s += path(`M${px} ${py - 30} L${px} ${py} M${px} ${py - 24} L${px - 18} ${py - 12} M${px} ${py - 24} L${px + 18} ${py - 18} M${px} ${py} L${px - 16} ${py + 30} M${px} ${py} L${px + 16} ${py + 28}`, NONE, 2);
  for (let i = 0; i < 3; i++) s += line(px - 58 - i * 16, py - 20 + i * 12, px - 30 - i * 16, py - 20 + i * 12, 1.4);
  return s;
};

/** 躲避：判定圈与弹幕 */
const dodgeAvoid: SceneFn = (rng) => {
  const px = 240, py = 180;
  let s = circle(px, py, 16, YELLOW, 2);
  s += circle(px, py, 34, NONE, 1.2, "4 5");
  s += circle(px, py, 52, NONE, 0.8, "2 6");
  // 子弹 + 弹道
  const angles = [0.3, 1.2, 2.1, 3.4, 4.5, 5.4];
  angles.forEach((a, i) => {
    const bx = px + Math.cos(a) * rr(rng, 110, 150);
    const by = py + Math.sin(a) * rr(rng, 80, 120);
    s += circle(bx, by, 8, HATCH, 1.4);
    const tx = px + Math.cos(a) * 58, ty = py + Math.sin(a) * 58;
    s += line(bx - Math.cos(a) * 14, by - Math.sin(a) * 14, tx, ty, 1, "3 4");
    void i;
  });
  return s;
};

/** 射击：准星与弹道 */
const shootAim: SceneFn = (rng) => {
  const tx = 320, ty = 150;
  let s = circle(tx, ty, 44, NONE, 1.6);
  s += circle(tx, ty, 26, HATCH, 1.2);
  s += circle(tx, ty, 9, YELLOW, 1.6);
  s += line(tx, ty - 58, tx, ty - 46, 1.6) + line(tx, ty + 46, tx, ty + 58, 1.6);
  s += line(tx - 58, ty, tx - 46, ty, 1.6) + line(tx + 46, ty, tx + 58, ty, 1.6);
  // 弹道
  s += path(`M110 260 Q190 200 ${tx - 12} ${ty + 10}`, NONE, 1.6, "7 5");
  s += circle(116, 256, 10, HATCH, 1.4);
  return s;
};

/** 战斗：交锋与冲击 */
const combat: SceneFn = (rng) => {
  let s = "";
  // 交叉剑
  s += path(`M150 250 L290 110 L306 126 L166 266 Z`, HATCH, 1.6);
  s += path(`M330 250 L190 110 L174 126 L314 266 Z`, NONE, 1.6);
  // 冲击星
  const ix = 240, iy = 120;
  let d = "";
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    const r = i % 2 === 0 ? 34 : 14;
    d += `${i === 0 ? "M" : "L"}${ix + Math.cos(a) * r} ${iy + Math.sin(a) * r} `;
  }
  s += path(d + "Z", YELLOW, 1.4);
  // 速度线
  s += line(120, 220, 100, 240, 1.4) + line(360, 220, 380, 240, 1.4);
  return s;
};

/** 策略决策：分支抉择 */
const choiceStrategy: SceneFn = (rng) => {
  let s = circle(240, 84, 22, YELLOW, 1.6);
  s += path(`M228 100 L150 190 M252 100 L330 190`, NONE, 2);
  s += rect(108, 190, 84, 52, HATCH, 1.6, 5);
  s += rect(288, 190, 84, 52, NONE, 1.6, 5);
  s += path(`M240 262 L240 246 M150 262 L150 246 M330 262 L330 246`, NONE, 1, "3 3");
  return s;
};

/** 建造布局：网格与高亮放置 */
const placement: SceneFn = (rng) => {
  const gx = 140, gy = 60, c = 50;
  let s = rect(gx, gy, c * 4, c * 4, NONE, 1.6);
  for (let i = 1; i < 4; i++) {
    s += line(gx + c * i, gy, gx + c * i, gy + c * 4, 0.8);
    s += line(gx, gy + c * i, gx + c * 4, gy + c * i, 0.8);
  }
  // 已放置块
  s += rect(gx + c * 2 + 4, gy + c + 4, c - 8, c - 8, HATCH, 1.4, 3);
  // 正放置的块（高亮 + 吸附虚线）
  s += rect(gx + c + 4, gy + c * 2 + 4, c - 8, c - 8, YELLOW, 1.6, 3);
  s += rect(gx + c, gy + c * 2, c, c, NONE, 1, 2, "4 3");
  return s;
};

/** 物理：抛物线与撞击 */
const physics: SceneFn = (rng) => {
  let s = path(`M90 250 Q200 90 330 210`, NONE, 1.6, "8 5");
  s += circle(96, 242, 16, YELLOW, 1.8);
  // 重力箭头
  s += path(`M150 90 L150 150`, NONE, 1.6);
  s += path(`M140 136 L150 152 L160 136`, NONE, 1.6);
  // 被撞的积木塔
  s += rect(320, 224, 34, 20, HATCH, 1.4, 2);
  s += rect(326, 202, 34, 20, HATCH, 1.4, 2);
  s += rect(332, 180, 34, 20, HATCH, 1.4, 2);
  // 撞击星
  s += path(`M316 196 L304 188 M318 210 L304 212`, NONE, 1.4);
  return s;
};

/** 时机：节拍窗口 */
const timing: SceneFn = (rng) => {
  const cx0 = 240, cy0 = 170;
  let s = circle(cx0, cy0, 82, NONE, 1, "5 6");
  s += circle(cx0, cy0, 52, NONE, 1.6);
  s += circle(cx0, cy0, 22, YELLOW, 1.8);
  // 收缩的节拍环
  s += circle(cx0, cy0, 38, NONE, 1, "2 4");
  // 刻度
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI / 6) * i;
    s += line(cx0 + Math.cos(a) * 90, cy0 + Math.sin(a) * 90, cx0 + Math.cos(a) * 98, cy0 + Math.sin(a) * 98, 1.2);
  }
  return s;
};

/** 成长：上升曲线 */
const progression: SceneFn = (rng) => {
  let s = "";
  s += rect(110, 220, 34, 50, HATCH, 1.4, 3);
  s += rect(170, 190, 34, 80, HATCH, 1.4, 3);
  s += rect(230, 150, 34, 120, HATCH, 1.4, 3);
  s += rect(290, 100, 34, 170, YELLOW, 1.8, 3);
  s += path(`M110 90 Q200 70 330 40`, NONE, 2);
  s += path(`M318 36 L334 38 L328 52`, NONE, 2);
  // 金币
  s += circle(380, 240, 18, STIPPLE, 1.4);
  s += circle(392, 224, 18, STIPPLE, 1.4);
  return s;
};

/** 模拟：系统变量网络 */
const simulation: SceneFn = (rng) => {
  const nodes = [
    [150, 110, 20, HATCH], [330, 90, 16, STIPPLE], [240, 190, 26, YELLOW],
    [140, 240, 14, STIPPLE], [350, 230, 18, HATCH],
  ] as const;
  let s = "";
  const links: [number, number][] = [[0, 2], [1, 2], [2, 3], [2, 4], [0, 3], [1, 4]];
  links.forEach(([a, b]) => {
    s += line(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], 1);
  });
  nodes.forEach(([x, y, r, f]) => {
    s += circle(x, y, r, f, 1.5);
  });
  // 仪表盘
  s += path(`M380 150 A30 30 0 0 1 410 180`, NONE, 1.6);
  s += line(395, 165, 405, 175, 1.6);
  return s;
};

export const SCENES: Record<string, SceneFn> = {
  "turn-duel": turnDuel,
  "match-clear": matchClear,
  "merge-unit": mergeUnit,
  puzzle,
  runner,
  "dodge-avoid": dodgeAvoid,
  "shoot-aim": shootAim,
  combat,
  "choice-strategy": choiceStrategy,
  placement,
  physics,
  timing,
  progression,
  simulation,
};

export const DEFAULT_SCENE: SceneFn = puzzle;
