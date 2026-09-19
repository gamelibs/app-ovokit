import rough from "roughjs";

export type SketchSvgType =
  // 基础图形
  | "rectangle"
  | "circle"
  | "ellipse"
  | "line"
  | "arrow"
  | "star"
  | "cross"
  | "diamond"
  // 流程图
  | "flow-start"
  | "flow-process"
  | "flow-decision"
  | "flow-end"
  // 游戏元素（按概念图 + imgs 参考）
  | "gamepad"
  | "card"
  | "gem"
  | "puzzle"
  | "tower"
  | "runner"
  | "skull"
  | "blocks"
  | "flipped-cards"
  // 场景/交互元素
  | "grid"
  | "dice"
  | "clock"
  | "tap"
  // 装饰元素（概念图 Hero 区）
  | "note"
  | "lightbulb"
  | "sun"
  | "question-mark"
  | "sparkle";

export interface SketchSvgOptions {
  type: SketchSvgType;
  width?: number;
  height?: number;
  roughness?: number;
  bowing?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  fillStyle?:
    | "hachure"
    | "solid"
    | "zigzag"
    | "cross-hatch"
    | "dots"
    | "sunburst"
    | "dashed"
    | "zigzag-line";
  padding?: number;
}

interface Op {
  op: "move" | "bcurveTo" | "lineTo";
  data: number[];
}

interface DrawableSet {
  type: string;
  ops: Op[];
}

interface Drawable {
  shape: string;
  sets: DrawableSet[];
  options: Record<string, unknown>;
}

function opsToPath(ops: Op[]): string {
  let path = "";
  for (const op of ops) {
    switch (op.op) {
      case "move":
        path += `M${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)} `;
        break;
      case "bcurveTo":
        path += `C${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)}, ${op.data[2].toFixed(2)} ${op.data[3].toFixed(2)}, ${op.data[4].toFixed(2)} ${op.data[5].toFixed(2)} `;
        break;
      case "lineTo":
        path += `L${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)} `;
        break;
    }
  }
  return path.trim();
}

function drawableToSvg(
  drawable: Drawable,
  width: number,
  height: number,
  padding: number,
): string {
  const w = width + padding * 2;
  const h = height + padding * 2;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;

  for (const set of drawable.sets) {
    const d = opsToPath(set.ops);
    if (!d) continue;

    if (set.type === "path") {
      svg += `<path d="${d}" fill="none" stroke="${drawable.options.stroke}" stroke-width="${drawable.options.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else if (set.type === "fillSketch" || set.type === "fillPath") {
      const fill = String(drawable.options.fill ?? "none");
      svg += `<path d="${d}" fill="${fill}" stroke="none"/>`;
    }
  }

  svg += "</svg>";
  return svg;
}

function getDefaultSize(type: SketchSvgType): { width: number; height: number } {
  switch (type) {
    case "rectangle":
    case "flow-process":
      return { width: 200, height: 100 };
    case "circle":
      return { width: 100, height: 100 };
    case "ellipse":
      return { width: 160, height: 100 };
    case "line":
    case "arrow":
      return { width: 120, height: 40 };
    case "star":
    case "sparkle":
      return { width: 100, height: 100 };
    case "cross":
      return { width: 80, height: 80 };
    case "diamond":
    case "flow-decision":
      return { width: 120, height: 100 };
    case "gamepad":
      return { width: 160, height: 100 };
    case "card":
      return { width: 80, height: 110 };
    case "gem":
      return { width: 100, height: 120 };
    case "puzzle":
      return { width: 120, height: 120 };
    case "tower":
      return { width: 100, height: 140 };
    case "runner":
      return { width: 100, height: 130 };
    case "skull":
      return { width: 100, height: 120 };
    case "blocks":
      return { width: 140, height: 120 };
    case "flipped-cards":
      return { width: 140, height: 120 };
    case "grid":
      return { width: 120, height: 120 };
    case "dice":
      return { width: 100, height: 100 };
    case "clock":
      return { width: 120, height: 120 };
    case "tap":
      return { width: 100, height: 120 };
    case "note":
      return { width: 120, height: 100 };
    case "lightbulb":
      return { width: 100, height: 130 };
    case "sun":
      return { width: 120, height: 120 };
    case "question-mark":
      return { width: 80, height: 120 };
    case "flow-start":
    case "flow-end":
      return { width: 140, height: 80 };
    default:
      return { width: 200, height: 100 };
  }
}

function createDrawable(
  type: SketchSvgType,
  width: number,
  height: number,
  opts: Omit<SketchSvgOptions, "type" | "width" | "height">,
): Drawable {
  const gen = rough.generator();
  const roughness = opts.roughness ?? 2;
  const bowing = opts.bowing ?? 1;
  const stroke = opts.stroke ?? "#202020";
  const strokeWidth = opts.strokeWidth ?? 2;
  const fill = opts.fill ?? "none";
  const fillStyle = opts.fillStyle ?? "hachure";

  const common = { roughness, bowing, stroke, strokeWidth, fill, fillStyle };
  const solid = (c: string) => ({ ...common, fill: c, fillStyle: "solid" as const });

  switch (type) {
    case "rectangle":
      return gen.rectangle(0, 0, width, height, common) as unknown as Drawable;
    case "flow-process": {
      // 流程图处理框：外框 + 内部文本横线，避免大面积填充导致小尺寸糊成一团
      const sets: DrawableSet[] = [];
      const padding = 14;
      const left = padding;
      const top = padding;
      const right = width - padding;
      const bottom = height - padding;
      // 用线性路径画外框，避免 rectangle 自动填充
      const frame = gen.linearPath(
        [
          [left, top],
          [right, top],
          [right, bottom],
          [left, bottom],
          [left, top],
        ],
        { ...common, fill: "none" },
      );
      sets.push(...(frame as unknown as Drawable).sets);
      const lineCount = 4;
      const lineYStart = top + 18;
      const lineYEnd = bottom - 18;
      const lineGap = (lineYEnd - lineYStart) / (lineCount - 1);
      for (let i = 0; i < lineCount; i++) {
        const y = lineYStart + i * lineGap;
        const line = gen.line(left + 14, y, right - 14, y, { ...common, strokeWidth: Math.max(1, (strokeWidth ?? 2) - 1) });
        sets.push(...(line as unknown as Drawable).sets);
      }
      return { shape: "flow-process", sets, options: common };
    }
    case "circle":
      return gen.circle(width / 2, height / 2, Math.min(width, height), common) as unknown as Drawable;
    case "ellipse":
      return gen.ellipse(width / 2, height / 2, width, height, common) as unknown as Drawable;
    case "line":
      return gen.line(0, height / 2, width, height / 2, common) as unknown as Drawable;
    case "arrow": {
      const line = gen.line(0, height / 2, width - 15, height / 2, common);
      const arrowHead = gen.linearPath(
        [
          [width - 20, height / 2 - 10],
          [width, height / 2],
          [width - 20, height / 2 + 10],
        ],
        { ...common, fill: stroke },
      );
      return {
        shape: "arrow",
        sets: [
          ...(line as unknown as Drawable).sets,
          ...(arrowHead as unknown as Drawable).sets,
        ],
        options: common,
      };
    }
    case "star": {
      const cx = width / 2;
      const cy = height / 2;
      const outer = Math.min(width, height) / 2 - 5;
      const inner = outer * 0.4;
      const points: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
      }
      return gen.polygon(points, common) as unknown as Drawable;
    }
    case "cross": {
      const t = Math.min(width, height) * 0.15;
      const cx = width / 2;
      const cy = height / 2;
      const w2 = width / 2 - 5;
      const h2 = height / 2 - 5;
      const path = gen.linearPath(
        [
          [cx - t, 5],
          [cx + t, 5],
          [cx + t, cy - h2 + t],
          [width - 5, cy - h2 + t],
          [width - 5, cy + h2 - t],
          [cx + t, cy + h2 - t],
          [cx + t, height - 5],
          [cx - t, height - 5],
          [cx - t, cy + h2 - t],
          [5, cy + h2 - t],
          [5, cy - h2 + t],
          [cx - t, cy - h2 + t],
        ],
        { ...common, fill },
      );
      return path as unknown as Drawable;
    }
    case "diamond": {
      const cx = width / 2;
      const cy = height / 2;
      return gen.polygon(
        [
          [cx, 5],
          [width - 5, cy],
          [cx, height - 5],
          [5, cy],
        ],
        common,
      ) as unknown as Drawable;
    }
    case "flow-decision": {
      // 流程图判断框：空心菱形 + 左右两个分支箭头，避免小尺寸填充糊掉
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const cy = height / 2;
      const inset = 16;
      const points: [number, number][] = [
        [cx, inset],
        [width - inset, cy],
        [cx, height - inset],
        [inset, cy],
        [cx, inset],
      ];
      const frame = gen.linearPath(points, { ...common, fill: "none" });
      sets.push(...(frame as unknown as Drawable).sets);
      // 左右分支箭头
      const arrowY = cy;
      const leftArrow = gen.line(inset + 10, arrowY, inset + 35, arrowY, { ...common, strokeWidth: Math.max(1, (strokeWidth ?? 2) - 1) });
      const rightArrow = gen.line(width - inset - 35, arrowY, width - inset - 10, arrowY, { ...common, strokeWidth: Math.max(1, (strokeWidth ?? 2) - 1) });
      sets.push(...(leftArrow as unknown as Drawable).sets);
      sets.push(...(rightArrow as unknown as Drawable).sets);
      // 箭头头部
      const leftHead = gen.linearPath(
        [[inset + 28, arrowY - 5], [inset + 35, arrowY], [inset + 28, arrowY + 5]],
        { ...common, fill: stroke },
      );
      const rightHead = gen.linearPath(
        [[width - inset - 28, arrowY - 5], [width - inset - 35, arrowY], [width - inset - 28, arrowY + 5]],
        { ...common, fill: stroke },
      );
      sets.push(...(leftHead as unknown as Drawable).sets);
      sets.push(...(rightHead as unknown as Drawable).sets);
      return { shape: "flow-decision", sets, options: common };
    }
    // ===== 游戏元素 =====
    case "gamepad": {
      const sets: DrawableSet[] = [];
      const body = gen.rectangle(20, 20, width - 40, height - 40, solid("#faf7ef"));
      sets.push(...(body as unknown as Drawable).sets);
      const dpadH = gen.line(35, height / 2, 55, height / 2, common);
      const dpadV = gen.line(45, height / 2 - 10, 45, height / 2 + 10, common);
      sets.push(...(dpadH as unknown as Drawable).sets);
      sets.push(...(dpadV as unknown as Drawable).sets);
      const btnA = gen.circle(width - 45, height / 2 - 8, 10, common);
      const btnB = gen.circle(width - 35, height / 2 + 8, 10, common);
      sets.push(...(btnA as unknown as Drawable).sets);
      sets.push(...(btnB as unknown as Drawable).sets);
      return { shape: "gamepad", sets, options: common };
    }
    case "card": {
      const sets: DrawableSet[] = [];
      const rect = gen.rectangle(5, 5, width - 10, height - 10, solid("#ffda6a"));
      sets.push(...(rect as unknown as Drawable).sets);
      const cx = width / 2;
      const cy = height / 2;
      const suit = gen.polygon(
        [
          [cx, cy - 15],
          [cx + 12, cy],
          [cx, cy + 15],
          [cx - 12, cy],
        ],
        solid("#ff8b8b"),
      );
      sets.push(...(suit as unknown as Drawable).sets);
      return { shape: "card", sets, options: common };
    }
    case "gem": {
      // 参考 imgs 中的多面体宝石
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const topY = 10;
      const midY = height * 0.35;
      const botY = height - 10;
      const w2 = width / 2 - 10;
      // 上半部分（多边形）
      const top = gen.polygon(
        [
          [cx, topY],
          [cx + w2 * 0.6, midY],
          [cx - w2 * 0.6, midY],
        ],
        solid("#7dcfff"),
      );
      sets.push(...(top as unknown as Drawable).sets);
      // 下半部分（多边形）
      const bot = gen.polygon(
        [
          [cx + w2 * 0.6, midY],
          [cx + w2, botY - 20],
          [cx, botY],
          [cx - w2, botY - 20],
          [cx - w2 * 0.6, midY],
        ],
        solid("#ffda6a"),
      );
      sets.push(...(bot as unknown as Drawable).sets);
      // 内部线条
      const line1 = gen.line(cx, topY, cx, botY, { ...common, strokeWidth: 1 });
      const line2 = gen.line(cx + w2 * 0.6, midY, cx - w2, botY - 20, { ...common, strokeWidth: 1 });
      const line3 = gen.line(cx - w2 * 0.6, midY, cx + w2, botY - 20, { ...common, strokeWidth: 1 });
      sets.push(...(line1 as unknown as Drawable).sets);
      sets.push(...(line2 as unknown as Drawable).sets);
      sets.push(...(line3 as unknown as Drawable).sets);
      return { shape: "gem", sets, options: common };
    }
    case "puzzle": {
      // 参考 imgs 中的拼图块
      const sets: DrawableSet[] = [];
      const tab = height * 0.15;
      const blank = height * 0.15;
      const points: [number, number][] = [
        [blank, 0],
        [width * 0.35, 0],
        [width * 0.35, -tab],
        [width * 0.55, -tab],
        [width * 0.55, 0],
        [width - blank, 0],
        [width - blank, height * 0.3],
        [width, height * 0.3],
        [width, height * 0.5],
        [width - blank, height * 0.5],
        [width - blank, height],
        [width * 0.55, height],
        [width * 0.55, height + tab],
        [width * 0.35, height + tab],
        [width * 0.35, height],
        [blank, height],
        [blank, height * 0.5],
        [0, height * 0.5],
        [0, height * 0.3],
        [blank, height * 0.3],
      ];
      const piece = gen.polygon(points, solid("#7dd87d"));
      sets.push(...(piece as unknown as Drawable).sets);
      return { shape: "puzzle", sets, options: common };
    }
    case "tower": {
      // 塔楼（塔防）
      const sets: DrawableSet[] = [];
      const tw = width * 0.5;
      const th = height * 0.7;
      const tx = (width - tw) / 2;
      const ty = height - th - 10;
      // 塔身
      const body = gen.rectangle(tx, ty, tw, th, solid("#faf7ef"));
      sets.push(...(body as unknown as Drawable).sets);
      // 塔顶（三角形）
      const roof = gen.polygon(
        [
          [tx - 10, ty],
          [tx + tw / 2, ty - 35],
          [tx + tw + 10, ty],
        ],
        solid("#ff8b8b"),
      );
      sets.push(...(roof as unknown as Drawable).sets);
      // 窗户
      const win = gen.rectangle(tx + tw * 0.3, ty + th * 0.25, tw * 0.4, tw * 0.3, solid("#7dcfff"));
      sets.push(...(win as unknown as Drawable).sets);
      // 门
      const door = gen.rectangle(tx + tw * 0.25, ty + th * 0.65, tw * 0.5, th * 0.35, solid("#555"));
      sets.push(...(door as unknown as Drawable).sets);
      return { shape: "tower", sets, options: common };
    }
    case "runner": {
      // 跑步小人（跑酷）
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const headY = 20;
      const headR = 14;
      // 头
      const head = gen.circle(cx, headY, headR * 2, solid("#faf7ef"));
      sets.push(...(head as unknown as Drawable).sets);
      // 身体线
      const body = gen.line(cx, headY + headR, cx + 10, headY + headR + 35, common);
      sets.push(...(body as unknown as Drawable).sets);
      // 手臂（摆动）
      const arm = gen.line(cx, headY + headR + 12, cx + 22, headY + headR - 5, common);
      sets.push(...(arm as unknown as Drawable).sets);
      // 腿（跑步姿态）
      const leg1 = gen.line(cx + 5, headY + headR + 35, cx - 10, headY + headR + 60, common);
      const leg2 = gen.line(cx + 5, headY + headR + 35, cx + 20, headY + headR + 55, common);
      sets.push(...(leg1 as unknown as Drawable).sets);
      sets.push(...(leg2 as unknown as Drawable).sets);
      // 速度线
      const speed1 = gen.line(5, headY + headR + 45, 25, headY + headR + 45, { ...common, strokeWidth: 1 });
      const speed2 = gen.line(10, headY + headR + 52, 22, headY + headR + 52, { ...common, strokeWidth: 1 });
      sets.push(...(speed1 as unknown as Drawable).sets);
      sets.push(...(speed2 as unknown as Drawable).sets);
      return { shape: "runner", sets, options: common };
    }
    case "skull": {
      // 骷髅（地牢）
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const cy = height / 2 - 10;
      const rw = width * 0.4;
      const rh = height * 0.35;
      // 头骨（圆角矩形近似）
      const head = gen.ellipse(cx, cy, rw * 2, rh * 2, solid("#faf7ef"));
      sets.push(...(head as unknown as Drawable).sets);
      // 眼窝
      const eyeL = gen.circle(cx - rw * 0.4, cy - 5, 10, solid("#202020"));
      const eyeR = gen.circle(cx + rw * 0.4, cy - 5, 10, solid("#202020"));
      sets.push(...(eyeL as unknown as Drawable).sets);
      sets.push(...(eyeR as unknown as Drawable).sets);
      // 鼻孔
      const nose = gen.rectangle(cx - 3, cy + 12, 6, 6, solid("#202020"));
      sets.push(...(nose as unknown as Drawable).sets);
      // 牙齿
      for (let i = 0; i < 4; i++) {
        const tooth = gen.line(cx - 12 + i * 8, cy + 25, cx - 12 + i * 8, cy + 35, common);
        sets.push(...(tooth as unknown as Drawable).sets);
      }
      // 交叉骨头
      const bone1 = gen.line(cx - 25, cy + rh + 10, cx + 25, cy + rh + 35, common);
      const bone2 = gen.line(cx + 25, cy + rh + 10, cx - 25, cy + rh + 35, common);
      sets.push(...(bone1 as unknown as Drawable).sets);
      sets.push(...(bone2 as unknown as Drawable).sets);
      return { shape: "skull", sets, options: common };
    }
    case "blocks": {
      // 堆叠方块（物理）
      const sets: DrawableSet[] = [];
      const bw = 35;
      const bh = 30;
      const colors = ["#ffda6a", "#7dcfff", "#ff8b8b", "#7dd87d"];
      const positions = [
        [20, height - bh - 10],
        [60, height - bh - 10],
        [100, height - bh - 10],
        [40, height - bh * 2 - 15],
        [80, height - bh * 2 - 15],
        [60, height - bh * 3 - 20],
      ];
      positions.forEach((pos, i) => {
        const block = gen.rectangle(pos[0], pos[1], bw, bh, solid(colors[i % colors.length]));
        sets.push(...(block as unknown as Drawable).sets);
      });
      // 一个掉落的方块（倾斜）
      const falling = gen.rectangle(width - 50, 20, bw, bh, solid("#ffb366"));
      sets.push(...(falling as unknown as Drawable).sets);
      // 掉落轨迹虚线
      const trail = gen.line(width - 32, 55, width - 32, height - bh * 3 - 30, { ...common, strokeWidth: 1 });
      sets.push(...(trail as unknown as Drawable).sets);
      return { shape: "blocks", sets, options: common };
    }
    case "flipped-cards": {
      // 翻牌（记忆匹配）
      const sets: DrawableSet[] = [];
      const cw = 45;
      const ch = 60;
      // 左侧卡片（背面）
      const cardBack = gen.rectangle(10, 20, cw, ch, solid("#7dcfff"));
      sets.push(...(cardBack as unknown as Drawable).sets);
      // 背面花纹
      const pattern = gen.circle(10 + cw / 2, 20 + ch / 2, 15, { ...common, strokeWidth: 1 });
      sets.push(...(pattern as unknown as Drawable).sets);
      // 右侧卡片（翻开，显示星星）
      const cardFront = gen.rectangle(70, 20, cw, ch, solid("#ffda6a"));
      sets.push(...(cardFront as unknown as Drawable).sets);
      const star = gen.polygon(
        [
          [70 + cw / 2, 35],
          [75 + cw / 2, 50],
          [92 + cw / 2, 50],
          [79 + cw / 2, 60],
          [84 + cw / 2, 75],
          [70 + cw / 2, 65],
          [56 + cw / 2, 75],
          [61 + cw / 2, 60],
          [48 + cw / 2, 50],
          [65 + cw / 2, 50],
        ],
        solid("#ff8b8b"),
      );
      sets.push(...(star as unknown as Drawable).sets);
      return { shape: "flipped-cards", sets, options: common };
    }
    case "grid": {
      // 网格 + 移动方块
      const sets: DrawableSet[] = [];
      const cols = 5;
      const rows = 4;
      const padX = 20;
      const padY = 15;
      const cellW = (width - padX * 2) / cols;
      const cellH = (height - padY * 2) / rows;
      // 网格线
      for (let i = 0; i <= cols; i++) {
        const x = padX + i * cellW;
        const line = gen.line(x, padY, x, height - padY, { ...common, strokeWidth: 1 });
        sets.push(...(line as unknown as Drawable).sets);
      }
      for (let i = 0; i <= rows; i++) {
        const y = padY + i * cellH;
        const line = gen.line(padX, y, width - padX, y, { ...common, strokeWidth: 1 });
        sets.push(...(line as unknown as Drawable).sets);
      }
      // 高亮方块
      const block = gen.rectangle(padX + cellW * 1.5, padY + cellH * 1.5, cellW, cellH, solid("#7dcfff"));
      sets.push(...(block as unknown as Drawable).sets);
      // 移动箭头
      const arrow = gen.line(padX + cellW * 2.2, padY + cellH * 2, padX + cellW * 3.3, padY + cellH * 2, common);
      sets.push(...(arrow as unknown as Drawable).sets);
      const head = gen.linearPath(
        [[padX + cellW * 3.1, padY + cellH * 1.8], [padX + cellW * 3.4, padY + cellH * 2], [padX + cellW * 3.1, padY + cellH * 2.2]],
        { ...common, fill: stroke },
      );
      sets.push(...(head as unknown as Drawable).sets);
      return { shape: "grid", sets, options: common };
    }
    case "dice": {
      // 骰子（随机）
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const cy = height / 2;
      const size = Math.min(width, height) * 0.7;
      const x = cx - size / 2;
      const y = cy - size / 2;
      const body = gen.rectangle(x, y, size, size, solid("#faf7ef"));
      sets.push(...(body as unknown as Drawable).sets);
      // 点数
      const dotR = size * 0.1;
      const positions = [
        [cx - size * 0.25, cy - size * 0.25],
        [cx + size * 0.25, cy + size * 0.25],
        [cx, cy],
      ];
      for (const [px, py] of positions) {
        const dot = gen.circle(px, py, dotR * 2, solid("#202020"));
        sets.push(...(dot as unknown as Drawable).sets);
      }
      return { shape: "dice", sets, options: common };
    }
    case "clock": {
      // 时钟（倒计时/时间压力）
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.35;
      const body = gen.circle(cx, cy, r * 2, solid("#faf7ef"));
      sets.push(...(body as unknown as Drawable).sets);
      // 刻度
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
        const innerR = r - 6;
        const outerR = r - 2;
        const tick = gen.line(
          cx + innerR * Math.cos(angle),
          cy + innerR * Math.sin(angle),
          cx + outerR * Math.cos(angle),
          cy + outerR * Math.sin(angle),
          { ...common, strokeWidth: 1 },
        );
        sets.push(...(tick as unknown as Drawable).sets);
      }
      // 指针（指向快结束）
      const hand = gen.line(cx, cy, cx + r * 0.6 * Math.cos(Math.PI * 0.3), cy + r * 0.6 * Math.sin(Math.PI * 0.3), common);
      sets.push(...(hand as unknown as Drawable).sets);
      return { shape: "clock", sets, options: common };
    }
    case "tap": {
      // 点击/触摸手势
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const cy = height * 0.55;
      const r = width * 0.18;
      // 波纹
      const ripple1 = gen.circle(cx, cy, r * 2, { ...common, strokeWidth: 1 });
      const ripple2 = gen.circle(cx, cy, r * 2.8, { ...common, strokeWidth: 1 });
      sets.push(...(ripple1 as unknown as Drawable).sets);
      sets.push(...(ripple2 as unknown as Drawable).sets);
      // 指尖（圆）
      const finger = gen.circle(cx, cy, r * 1.3, solid("#ffda6a"));
      sets.push(...(finger as unknown as Drawable).sets);
      // 射线
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i - Math.PI / 4;
        const innerR = r * 1.8;
        const outerR = r * 2.5;
        const ray = gen.line(
          cx + innerR * Math.cos(angle),
          cy + innerR * Math.sin(angle),
          cx + outerR * Math.cos(angle),
          cy + outerR * Math.sin(angle),
          common,
        );
        sets.push(...(ray as unknown as Drawable).sets);
      }
      return { shape: "tap", sets, options: common };
    }
    // ===== 装饰元素 =====
    case "note": {
      // 便签
      const sets: DrawableSet[] = [];
      const paper = gen.rectangle(10, 5, width - 20, height - 15, solid("#ffda6a"));
      sets.push(...(paper as unknown as Drawable).sets);
      // 便签上的横线
      for (let i = 0; i < 4; i++) {
        const line = gen.line(18, 20 + i * 18, width - 18, 20 + i * 18, { ...common, strokeWidth: 1 });
        sets.push(...(line as unknown as Drawable).sets);
      }
      // 左上角钉子
      const pin = gen.circle(20, 12, 6, solid("#ff8b8b"));
      sets.push(...(pin as unknown as Drawable).sets);
      return { shape: "note", sets, options: common };
    }
    case "lightbulb": {
      // 灯泡
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const bulbR = width * 0.3;
      const bulb = gen.circle(cx, height * 0.35, bulbR * 2, solid("#ffda6a"));
      sets.push(...(bulb as unknown as Drawable).sets);
      // 灯泡底座
      const base = gen.rectangle(cx - bulbR * 0.5, height * 0.55, bulbR, height * 0.2, solid("#555"));
      sets.push(...(base as unknown as Drawable).sets);
      // 螺纹
      const thread1 = gen.line(cx - bulbR * 0.5, height * 0.6, cx + bulbR * 0.5, height * 0.6, common);
      const thread2 = gen.line(cx - bulbR * 0.5, height * 0.68, cx + bulbR * 0.5, height * 0.68, common);
      sets.push(...(thread1 as unknown as Drawable).sets);
      sets.push(...(thread2 as unknown as Drawable).sets);
      // 光芒线
      const rays = [
        [cx, 5, cx, 15],
        [cx - bulbR - 10, height * 0.2, cx - bulbR - 2, height * 0.25],
        [cx + bulbR + 10, height * 0.2, cx + bulbR + 2, height * 0.25],
        [cx - bulbR - 5, height * 0.45, cx - bulbR + 3, height * 0.42],
        [cx + bulbR + 5, height * 0.45, cx + bulbR - 3, height * 0.42],
      ];
      rays.forEach((r) => {
        const ray = gen.line(r[0], r[1], r[2], r[3], common);
        sets.push(...(ray as unknown as Drawable).sets);
      });
      return { shape: "lightbulb", sets, options: common };
    }
    case "sun": {
      // 太阳
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.25;
      // 中心圆
      const core = gen.circle(cx, cy, r * 2, solid("#ffda6a"));
      sets.push(...(core as unknown as Drawable).sets);
      // 光芒
      const rayCount = 8;
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 2 * i) / rayCount - Math.PI / 2;
        const innerR = r + 5;
        const outerR = r + 22;
        const ray = gen.line(
          cx + innerR * Math.cos(angle),
          cy + innerR * Math.sin(angle),
          cx + outerR * Math.cos(angle),
          cy + outerR * Math.sin(angle),
          common,
        );
        sets.push(...(ray as unknown as Drawable).sets);
      }
      return { shape: "sun", sets, options: common };
    }
    case "question-mark": {
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      // 问号上半部分弧线
      const curve = gen.arc(cx, height * 0.35, 30, 30, Math.PI * 1.1, Math.PI * 1.9, false, common);
      sets.push(...(curve as unknown as Drawable).sets);
      // 竖线
      const stem = gen.line(cx, height * 0.45, cx, height * 0.65, common);
      sets.push(...(stem as unknown as Drawable).sets);
      // 点
      const dot = gen.circle(cx, height * 0.8, 6, solid("#202020"));
      sets.push(...(dot as unknown as Drawable).sets);
      return { shape: "question-mark", sets, options: common };
    }
    case "sparkle": {
      const sets: DrawableSet[] = [];
      const cx = width / 2;
      const cy = height / 2;
      // 大四角星
      const outer = Math.min(width, height) / 2 - 5;
      const inner = outer * 0.25;
      const points: [number, number][] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
      }
      const main = gen.polygon(points, solid("#ffda6a"));
      sets.push(...(main as unknown as Drawable).sets);
      // 小星星装饰
      const small1 = gen.circle(cx - outer * 0.6, cy - outer * 0.5, 4, solid("#ff8b8b"));
      const small2 = gen.circle(cx + outer * 0.5, cy + outer * 0.6, 3, solid("#7dcfff"));
      sets.push(...(small1 as unknown as Drawable).sets);
      sets.push(...(small2 as unknown as Drawable).sets);
      return { shape: "sparkle", sets, options: common };
    }
    case "flow-start":
    case "flow-end":
      return gen.ellipse(width / 2, height / 2, width - 10, height - 10, common) as unknown as Drawable;
    default:
      return gen.rectangle(0, 0, width, height, common) as unknown as Drawable;
  }
}

export function generateSketchSvg(options: SketchSvgOptions): string {
  const { type, width: w, height: h, padding = 8 } = options;
  const size = getDefaultSize(type);
  const width = w ?? size.width;
  const height = h ?? size.height;

  const drawable = createDrawable(type, width, height, options);
  return drawableToSvg(drawable, width, height, padding);
}

export function generateSketchSvgDataUrl(options: SketchSvgOptions): string {
  const svg = generateSketchSvg(options);
  const encoded = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

export const sketchSvgPresets: { key: SketchSvgType; label: string; category: string }[] = [
  // 基础图形
  { key: "rectangle", label: "手绘方框", category: "基础" },
  { key: "circle", label: "手绘圆圈", category: "基础" },
  { key: "ellipse", label: "手绘椭圆", category: "基础" },
  { key: "line", label: "手绘直线", category: "基础" },
  { key: "arrow", label: "手绘箭头", category: "基础" },
  { key: "star", label: "手绘星星", category: "基础" },
  { key: "cross", label: "手绘十字", category: "基础" },
  { key: "diamond", label: "手绘菱形", category: "基础" },
  // 流程图
  { key: "flow-start", label: "流程图-开始", category: "流程图" },
  { key: "flow-process", label: "流程图-处理", category: "流程图" },
  { key: "flow-decision", label: "流程图-判断", category: "流程图" },
  { key: "flow-end", label: "流程图-结束", category: "流程图" },
  // 游戏元素
  { key: "gamepad", label: "游戏手柄", category: "游戏" },
  { key: "card", label: "扑克卡片", category: "游戏" },
  { key: "gem", label: "宝石", category: "游戏" },
  { key: "puzzle", label: "拼图块", category: "游戏" },
  { key: "tower", label: "塔楼", category: "游戏" },
  { key: "runner", label: "跑步小人", category: "游戏" },
  { key: "skull", label: "骷髅", category: "游戏" },
  { key: "blocks", label: "堆叠方块", category: "游戏" },
  { key: "flipped-cards", label: "翻牌", category: "游戏" },
  { key: "grid", label: "网格移动", category: "游戏" },
  { key: "dice", label: "骰子", category: "游戏" },
  { key: "clock", label: "时钟", category: "游戏" },
  { key: "tap", label: "点击", category: "游戏" },
  // 装饰元素
  { key: "note", label: "便签", category: "装饰" },
  { key: "lightbulb", label: "灯泡", category: "装饰" },
  { key: "sun", label: "太阳", category: "装饰" },
  { key: "question-mark", label: "问号", category: "装饰" },
  { key: "sparkle", label: "闪光", category: "装饰" },
];

/* ========================================================================
 * 实体配图场景系统（母型 / 核心循环 / 玩法特征详情页配图）
 *
 * 硬性规则（与 scripts/generate-entity-assets.ts 配套）：
 * - 画布默认 480×360（4:3），内容四边安全边距 ≥ 8%
 * - 图内不绘制边框 / 画框（边框由站点容器负责）
 * - 图内不绘制任何文字（标题与图例由 HTML 层负责）
 * - 背景固定站点纸色 #faf7ef
 * ===================================================================== */

export const ENTITY_SCENE_WIDTH = 480;
export const ENTITY_SCENE_HEIGHT = 360;

const SCENE_PAPER = "#faf7ef";
const SCENE_INK = "#202020";
const SCENE_SOFT = "#9a927f";
const SCENE_YELLOW = "#ffda6a";
const SCENE_BLUE = "#7dcfff";
const SCENE_RED = "#ff8b8b";
const SCENE_GREEN = "#7dd87d";
const SCENE_HATCH = "#ddd6c4";

type ScenePt = [number, number];

interface ScenePathItem {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
  dash?: string;
}

interface SceneCtx {
  gen: ReturnType<typeof rough.generator>;
  paths: ScenePathItem[];
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

interface SceneStroke {
  stroke?: string;
  sw?: number;
  dash?: string;
}

interface SceneShape extends SceneStroke {
  fill?: string;
  fillStyle?: "solid" | "hachure";
}

/** 把 roughjs Drawable 展开成带独立样式的路径片段（避免旧 drawableToSvg 合并 sets 后丢失子形状颜色） */
function scenePush(
  ctx: SceneCtx,
  drawable: unknown,
  style: { stroke?: string; sw?: number; fill?: string; dash?: string },
): void {
  for (const set of (drawable as Drawable).sets) {
    const d = opsToPath(set.ops);
    if (!d) continue;
    if (set.type === "path") {
      ctx.paths.push({
        d,
        stroke: style.stroke ?? SCENE_INK,
        strokeWidth: style.sw ?? 2,
        fill: "none",
        dash: style.dash,
      });
    } else {
      ctx.paths.push({ d, stroke: "none", strokeWidth: 0, fill: style.fill ?? "none" });
    }
  }
}

function sLine(ctx: SceneCtx, x1: number, y1: number, x2: number, y2: number, o: SceneStroke = {}): void {
  scenePush(ctx, ctx.gen.line(x1, y1, x2, y2, { stroke: o.stroke ?? SCENE_INK, strokeWidth: o.sw ?? 2 }), o);
}

function sRect(ctx: SceneCtx, x: number, y: number, w: number, h: number, o: SceneShape = {}): void {
  scenePush(
    ctx,
    ctx.gen.rectangle(x, y, w, h, {
      stroke: o.stroke ?? SCENE_INK,
      strokeWidth: o.sw ?? 2,
      fill: o.fill ?? "none",
      fillStyle: o.fillStyle ?? "solid",
    }),
    o,
  );
}

function sCircle(ctx: SceneCtx, cx: number, cy: number, r: number, o: SceneShape = {}): void {
  scenePush(
    ctx,
    ctx.gen.circle(cx, cy, r * 2, {
      stroke: o.stroke ?? SCENE_INK,
      strokeWidth: o.sw ?? 2,
      fill: o.fill ?? "none",
      fillStyle: o.fillStyle ?? "solid",
    }),
    o,
  );
}

function sEllipse(ctx: SceneCtx, cx: number, cy: number, w: number, h: number, o: SceneShape = {}): void {
  scenePush(
    ctx,
    ctx.gen.ellipse(cx, cy, w, h, {
      stroke: o.stroke ?? SCENE_INK,
      strokeWidth: o.sw ?? 2,
      fill: o.fill ?? "none",
      fillStyle: o.fillStyle ?? "solid",
    }),
    o,
  );
}

function sPoly(ctx: SceneCtx, pts: ScenePt[], o: SceneShape = {}): void {
  scenePush(
    ctx,
    ctx.gen.polygon(pts, {
      stroke: o.stroke ?? SCENE_INK,
      strokeWidth: o.sw ?? 2,
      fill: o.fill ?? "none",
      fillStyle: o.fillStyle ?? "solid",
    }),
    o,
  );
}

function sOpenPath(ctx: SceneCtx, pts: ScenePt[], o: SceneStroke = {}): void {
  scenePush(ctx, ctx.gen.linearPath(pts, { stroke: o.stroke ?? SCENE_INK, strokeWidth: o.sw ?? 2 }), o);
}

function sCurve(ctx: SceneCtx, pts: ScenePt[], o: SceneStroke = {}): void {
  scenePush(ctx, ctx.gen.curve(pts, { stroke: o.stroke ?? SCENE_INK, strokeWidth: o.sw ?? 2 }), o);
}

/** 曲线箭头（样条 + 末端箭头） */
function sCurveArrow(ctx: SceneCtx, pts: ScenePt[], o: SceneStroke & { head?: number } = {}): void {
  sCurve(ctx, pts, o);
  const n = pts.length;
  const [px, py] = pts[n - 2];
  const [tx, ty] = pts[n - 1];
  arrowHead(ctx, tx, ty, Math.atan2(ty - py, tx - px), o.head ?? 11, o);
}

/** 箭头头部（两条短线） */
function arrowHead(ctx: SceneCtx, tipX: number, tipY: number, angle: number, size: number, o: SceneStroke = {}): void {
  const a1 = angle + Math.PI * 0.82;
  const a2 = angle - Math.PI * 0.82;
  sLine(ctx, tipX, tipY, tipX + size * Math.cos(a1), tipY + size * Math.sin(a1), o);
  sLine(ctx, tipX, tipY, tipX + size * Math.cos(a2), tipY + size * Math.sin(a2), o);
}

/** 直线箭头 */
function sArrow(ctx: SceneCtx, x1: number, y1: number, x2: number, y2: number, o: SceneStroke & { head?: number } = {}): void {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = o.head ?? 12;
  const ex = x2 - Math.cos(ang) * head * 0.5;
  const ey = y2 - Math.sin(ang) * head * 0.5;
  sLine(ctx, x1, y1, ex, ey, o);
  arrowHead(ctx, x2, y2, ang, head, o);
}

/** 弧形箭头（y 轴向下，角度顺时针为正，箭头在 a1 端；roughjs 要求 stop > start，内部自动归一化） */
function sArcArrow(ctx: SceneCtx, cx: number, cy: number, r: number, a0: number, a1: number, o: SceneStroke & { head?: number } = {}): void {
  let end = a1;
  while (end <= a0) end += Math.PI * 2;
  scenePush(ctx, ctx.gen.arc(cx, cy, r * 2, r * 2, a0, end, false, { stroke: o.stroke ?? SCENE_INK, strokeWidth: o.sw ?? 2 }), o);
  const tipX = cx + r * Math.cos(end);
  const tipY = cy + r * Math.sin(end);
  arrowHead(ctx, tipX, tipY, end + Math.PI / 2, o.head ?? 11, o);
}

/** 沿折线撒点（虚线轨迹） */
function sDots(ctx: SceneCtx, pts: ScenePt[], spacing = 14, r = 2.2, color = SCENE_INK): void {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.floor(len / spacing));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      sCircle(ctx, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r, { fill: color, stroke: color, sw: 0.5 });
    }
  }
}

/** 沿二次贝塞尔撒点（抛物线轨迹） */
function sDotsQuad(ctx: SceneCtx, p0: ScenePt, p1: ScenePt, p2: ScenePt, count = 14, r = 2.2, color = SCENE_INK): void {
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
    const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
    sCircle(ctx, x, y, r, { fill: color, stroke: color, sw: 0.5 });
  }
}

/** 运动线（速度感） */
function sMotion(ctx: SceneCtx, x: number, y: number, len: number, dir: -1 | 1 = -1, color = SCENE_SOFT): void {
  sLine(ctx, x, y, x + len * dir, y, { stroke: color, sw: 1.4 });
}

/** 绕中心旋转点集 */
function rotPts(cx: number, cy: number, pts: ScenePt[], deg: number): ScenePt[] {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
}

/* ------------------------------ 图元（glyphs） ------------------------------ */

/** 菱形宝石（带内刻面） */
function gGem(ctx: SceneCtx, cx: number, cy: number, s: number, color: string): void {
  sPoly(ctx, [[cx, cy - s], [cx + s * 0.8, cy], [cx, cy + s], [cx - s * 0.8, cy]], { fill: color });
  sOpenPath(ctx, [[cx - s * 0.34, cy - s * 0.4], [cx, cy - s * 0.1], [cx + s * 0.34, cy - s * 0.4]], { sw: 1 });
}

/** 五角星 */
function gStar(ctx: SceneCtx, cx: number, cy: number, r: number, color = SCENE_YELLOW): void {
  const pts: ScenePt[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]);
  }
  sPoly(ctx, pts, { fill: color });
}

/** 四角闪光 */
function gSparkle(ctx: SceneCtx, cx: number, cy: number, r: number, color = SCENE_YELLOW): void {
  const pts: ScenePt[] = [];
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.26;
    pts.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]);
  }
  sPoly(ctx, pts, { fill: color });
}

/** 放射爆裂线（命中/消除反馈），轻笔触避免压住主体 */
function gBurst(ctx: SceneCtx, cx: number, cy: number, r: number, color = SCENE_INK): void {
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i + Math.PI / 8;
    sLine(
      ctx,
      cx + r * 0.48 * Math.cos(ang),
      cy + r * 0.48 * Math.sin(ang),
      cx + r * Math.cos(ang),
      cy + r * Math.sin(ang),
      { stroke: color, sw: 1.7 },
    );
  }
}

/** 金币 */
function gCoin(ctx: SceneCtx, cx: number, cy: number, r: number): void {
  sCircle(ctx, cx, cy, r, { fill: SCENE_YELLOW });
  sCircle(ctx, cx, cy, r * 0.6, { sw: 1.2 });
}

/** 对勾 */
function gCheck(ctx: SceneCtx, cx: number, cy: number, s: number, color = SCENE_GREEN): void {
  sOpenPath(ctx, [[cx - s * 0.5, cy + s * 0.02], [cx - s * 0.1, cy + s * 0.42], [cx + s * 0.55, cy - s * 0.4]], {
    stroke: color,
    sw: 3,
  });
}

/** 叉 */
function gCross(ctx: SceneCtx, cx: number, cy: number, s: number, color = SCENE_RED): void {
  sLine(ctx, cx - s, cy - s, cx + s, cy + s, { stroke: color, sw: 3 });
  sLine(ctx, cx - s, cy + s, cx + s, cy - s, { stroke: color, sw: 3 });
}

/** 圆形棋子 */
function gPiece(ctx: SceneCtx, cx: number, cy: number, r: number, color: string): void {
  sCircle(ctx, cx, cy, r, { fill: color });
  sCircle(ctx, cx - r * 0.2, cy - r * 0.2, r * 0.42, { sw: 1.1 });
}

/** 方形棋子 */
function gPieceSquare(ctx: SceneCtx, cx: number, cy: number, s: number, color: string): void {
  sRect(ctx, cx - s / 2, cy - s / 2, s, s, { fill: color });
  sRect(ctx, cx - s * 0.22, cy - s * 0.22, s * 0.44, s * 0.44, { sw: 1.1 });
}

/** 锯齿危险物 */
function gSpike(ctx: SceneCtx, cx: number, cy: number, r: number, color = SCENE_RED): void {
  const pts: ScenePt[] = [];
  const n = 10;
  for (let i = 0; i < n * 2; i++) {
    const ang = (Math.PI / n) * i;
    const rr = i % 2 === 0 ? r : r * 0.6;
    pts.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]);
  }
  sPoly(ctx, pts, { fill: color });
}

/** 塔（放置/塔防） */
function gTower(ctx: SceneCtx, cx: number, baseY: number, w: number, h: number, o: SceneStroke & { body?: string; roof?: string } = {}): void {
  sRect(ctx, cx - w / 2, baseY - h, w, h, { fill: o.body ?? SCENE_PAPER, dash: o.dash, stroke: o.stroke, sw: o.sw });
  sPoly(ctx, [[cx - w / 2 - 6, baseY - h], [cx, baseY - h - w * 0.5], [cx + w / 2 + 6, baseY - h]], {
    fill: o.roof ?? SCENE_RED,
    dash: o.dash,
    stroke: o.stroke,
    sw: o.sw,
  });
  sRect(ctx, cx - w * 0.14, baseY - h * 0.34, w * 0.28, h * 0.34, { fill: o.dash ? "none" : SCENE_INK, dash: o.dash, stroke: o.dash ? o.stroke : undefined });
}

/** 房屋 */
function gHouse(ctx: SceneCtx, cx: number, baseY: number, w: number, h: number, roof = SCENE_RED): void {
  sRect(ctx, cx - w / 2, baseY - h, w, h, { fill: SCENE_PAPER });
  sPoly(ctx, [[cx - w / 2 - 7, baseY - h], [cx, baseY - h - w * 0.46], [cx + w / 2 + 7, baseY - h]], { fill: roof });
  sRect(ctx, cx - w * 0.11, baseY - h * 0.4, w * 0.22, h * 0.4, { fill: SCENE_INK });
}

/** 树 */
function gTree(ctx: SceneCtx, cx: number, baseY: number, s: number): void {
  sPoly(ctx, [[cx, baseY - s], [cx + s * 0.5, baseY - s * 0.22], [cx - s * 0.5, baseY - s * 0.22]], { fill: SCENE_GREEN });
  sLine(ctx, cx, baseY - s * 0.22, cx, baseY, { sw: 2.5 });
}

/** 山 */
function gMountain(ctx: SceneCtx, cx: number, baseY: number, s: number): void {
  sPoly(ctx, [[cx - s * 0.62, baseY], [cx, baseY - s], [cx + s * 0.62, baseY]], { fill: SCENE_HATCH });
  sPoly(ctx, [[cx - s * 0.2, baseY - s * 0.68], [cx, baseY - s], [cx + s * 0.2, baseY - s * 0.68]], { fill: SCENE_PAPER, sw: 1 });
}

/** 火柴人战士（可持剑/盾；剑锋指向面对方向，lunge 时前倾加长剑距） */
function gFighter(
  ctx: SceneCtx,
  x: number,
  baseY: number,
  s: number,
  o: { flip?: boolean; weapon?: "sword" | "shield"; lunge?: boolean } = {},
): void {
  const f = o.flip ? -1 : 1;
  const headR = s * 0.14;
  const lean = o.lunge ? s * 0.14 * f : 0;
  const headX = x + lean;
  const headCy = baseY - s * 0.86;
  const neckY = headCy + headR;
  const hipX = x - s * 0.02 * f;
  const hipY = baseY - s * 0.38;
  sCircle(ctx, headX, headCy, headR, { fill: SCENE_PAPER });
  sLine(ctx, headX, neckY, hipX, hipY, {});
  sLine(ctx, hipX, hipY, x + s * 0.2 * f, baseY, {});
  sLine(ctx, hipX, hipY, x - s * 0.17 * f, baseY, {});
  const shX = headX - s * 0.01 * f;
  const shY = neckY + s * 0.08;
  if (o.weapon === "sword") {
    const handX = shX + s * 0.3 * f;
    const handY = shY + s * 0.04;
    const reach = o.lunge ? 0.52 : 0.42;
    sLine(ctx, shX, shY, handX, handY, {});
    sLine(ctx, handX, handY, handX + s * reach * f, handY - s * 0.34, { sw: 3 });
    sLine(ctx, handX + s * 0.02 * f - s * 0.05, handY + s * 0.03, handX + s * 0.06 * f + s * 0.05, handY - s * 0.05, { sw: 2 });
    sLine(ctx, shX, shY, shX - s * 0.2 * f, shY + s * 0.18, {});
  } else if (o.weapon === "shield") {
    const handX = shX + s * 0.24 * f;
    const handY = shY + s * 0.1;
    sLine(ctx, shX, shY, handX, handY, {});
    const w = s * 0.26;
    const h = s * 0.38;
    const sx = f > 0 ? handX - 2 : handX - w + 2;
    sRect(ctx, sx, handY - h * 0.4, w, h, { fill: SCENE_BLUE });
    sLine(ctx, shX, shY, shX - s * 0.18 * f, shY + s * 0.16, {});
  } else {
    sLine(ctx, shX, shY, shX + s * 0.24 * f, shY + s * 0.16, {});
    sLine(ctx, shX, shY, shX - s * 0.18 * f, shY + s * 0.14, {});
  }
}

/** 跑步小人（头身相连、前腿跨步、后腿蹬地、双臂摆动） */
function gRunner(ctx: SceneCtx, x: number, baseY: number, s: number, o: { flip?: boolean } = {}): void {
  const f = o.flip ? -1 : 1;
  const headR = s * 0.14;
  const headX = x + s * 0.1 * f;
  const headCy = baseY - s * 0.84;
  const hipX = x - s * 0.04 * f;
  const hipY = baseY - s * 0.4;
  sCircle(ctx, headX, headCy, headR, { fill: SCENE_PAPER });
  sLine(ctx, headX - s * 0.02 * f, headCy + headR, hipX, hipY, {});
  sOpenPath(ctx, [[hipX, hipY], [x + s * 0.24 * f, baseY - s * 0.2], [x + s * 0.3 * f, baseY]], {});
  sOpenPath(ctx, [[hipX, hipY], [x - s * 0.22 * f, baseY - s * 0.16], [x - s * 0.34 * f, baseY - s * 0.04]], {});
  const shX = headX - s * 0.03 * f;
  const shY = headCy + headR + s * 0.1;
  sLine(ctx, shX, shY, shX + s * 0.26 * f, shY + s * 0.12, {});
  sLine(ctx, shX, shY, shX - s * 0.22 * f, shY + s * 0.1, {});
}

/** 时钟 */
function gClock(ctx: SceneCtx, cx: number, cy: number, r: number, handAngle = -Math.PI / 2 + 0.6): void {
  sCircle(ctx, cx, cy, r, { fill: SCENE_PAPER });
  for (let i = 0; i < 4; i++) {
    const ang = (Math.PI / 2) * i - Math.PI / 2;
    sLine(ctx, cx + (r - 6) * Math.cos(ang), cy + (r - 6) * Math.sin(ang), cx + (r - 2) * Math.cos(ang), cy + (r - 2) * Math.sin(ang), {
      sw: 1.4,
    });
  }
  sLine(ctx, cx, cy, cx + r * 0.55 * Math.cos(handAngle), cy + r * 0.55 * Math.sin(handAngle), { sw: 2.5 });
  sLine(ctx, cx, cy, cx + r * 0.38 * Math.cos(handAngle - 1.6), cy + r * 0.38 * Math.sin(handAngle - 1.6), { sw: 2 });
}

/** 卡牌（可旋转） */
function gCard(ctx: SceneCtx, cx: number, cy: number, w: number, h: number, deg: number, fill: string): void {
  const pts = rotPts(cx, cy, [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], deg);
  sPoly(ctx, pts, { fill });
  const inner = rotPts(cx, cy, [[cx, cy - h * 0.18], [cx + w * 0.16, cy], [cx, cy + h * 0.18], [cx - w * 0.16, cy]], deg);
  sPoly(ctx, inner, { sw: 1.2 });
}

/** 骷髅 */
function gSkull(ctx: SceneCtx, cx: number, cy: number, s: number): void {
  sEllipse(ctx, cx, cy - s * 0.08, s * 1.05, s * 0.92, { fill: SCENE_PAPER });
  sCircle(ctx, cx - s * 0.22, cy - s * 0.14, s * 0.11, { fill: SCENE_INK, stroke: SCENE_INK });
  sCircle(ctx, cx + s * 0.22, cy - s * 0.14, s * 0.11, { fill: SCENE_INK, stroke: SCENE_INK });
  sLine(ctx, cx - s * 0.18, cy + s * 0.34, cx + s * 0.18, cy + s * 0.34, { sw: 2 });
  sLine(ctx, cx - s * 0.06, cy + s * 0.24, cx - s * 0.06, cy + s * 0.34, { sw: 1.2 });
  sLine(ctx, cx + s * 0.06, cy + s * 0.24, cx + s * 0.06, cy + s * 0.34, { sw: 1.2 });
}

/** 骰子 */
function gDice(ctx: SceneCtx, cx: number, cy: number, s: number, deg = 0): void {
  const pts = rotPts(cx, cy, [[cx - s / 2, cy - s / 2], [cx + s / 2, cy - s / 2], [cx + s / 2, cy + s / 2], [cx - s / 2, cy + s / 2]], deg);
  sPoly(ctx, pts, { fill: SCENE_PAPER });
  const pips: ScenePt[] = [[-0.22, -0.22], [0.22, 0.22], [0.22, -0.22], [-0.22, 0.22], [0, 0]];
  for (const [px, py] of pips) {
    const [[rx, ry]] = rotPts(0, 0, [[px * s, py * s]], deg);
    sCircle(ctx, cx + rx, cy + ry, s * 0.07, { fill: SCENE_INK, stroke: SCENE_INK });
  }
}

/** 旗帜 */
function gFlag(ctx: SceneCtx, x: number, baseY: number, s: number, color = SCENE_RED): void {
  sLine(ctx, x, baseY, x, baseY - s, { sw: 2.5 });
  sPoly(ctx, [[x, baseY - s], [x + s * 0.62, baseY - s * 0.8], [x, baseY - s * 0.6]], { fill: color });
}

/** 锁 */
function gLock(ctx: SceneCtx, cx: number, cy: number, s: number): void {
  scenePush(
    ctx,
    ctx.gen.arc(cx, cy - s * 0.02, s * 0.56, s * 0.62, Math.PI, Math.PI * 2, false, { stroke: SCENE_INK, strokeWidth: 2.5 }),
    {},
  );
  sRect(ctx, cx - s * 0.42, cy - s * 0.02, s * 0.84, s * 0.6, { fill: SCENE_YELLOW });
  sCircle(ctx, cx, cy + s * 0.26, s * 0.08, { fill: SCENE_INK, stroke: SCENE_INK });
}

/** 锤子（建造） */
function gHammer(ctx: SceneCtx, cx: number, cy: number, s: number, deg = -32): void {
  const head = rotPts(cx, cy, [[cx - s * 0.3, cy - s * 0.34], [cx + s * 0.3, cy - s * 0.34], [cx + s * 0.3, cy - s * 0.02], [cx - s * 0.3, cy - s * 0.02]], deg);
  sPoly(ctx, head, { fill: SCENE_BLUE });
  const [[hx1, hy1], [hx2, hy2]] = rotPts(cx, cy, [[cx, cy - s * 0.04], [cx + s * 0.1, cy + s * 0.52]], deg);
  sLine(ctx, hx1, hy1, hx2, hy2, { sw: 3.5 });
}

/** 闪电（事件/输入） */
function gBolt(ctx: SceneCtx, cx: number, cy: number, s: number, color = SCENE_YELLOW): void {
  sPoly(
    ctx,
    [
      [cx + s * 0.14, cy - s * 0.52],
      [cx - s * 0.3, cy + s * 0.06],
      [cx - s * 0.04, cy + s * 0.06],
      [cx - s * 0.14, cy + s * 0.52],
      [cx + s * 0.3, cy - s * 0.06],
      [cx + s * 0.04, cy - s * 0.06],
    ],
    { fill: color },
  );
}

/** 货箱（产出/库存） */
function gBox(ctx: SceneCtx, cx: number, cy: number, s: number): void {
  sRect(ctx, cx - s / 2, cy - s / 2, s, s, { fill: "#e8dfc8" });
  sLine(ctx, cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2, { sw: 1.2 });
  sLine(ctx, cx - s / 2, cy + s / 2, cx + s / 2, cy - s / 2, { sw: 1.2 });
}

/** 柱状图 */
function gBars(ctx: SceneCtx, x: number, baseY: number, bw: number, gap: number, heights: number[]): void {
  const colors = [SCENE_BLUE, SCENE_YELLOW, SCENE_GREEN, SCENE_RED];
  heights.forEach((h, i) => {
    sRect(ctx, x + i * (bw + gap), baseY - h, bw, h, { fill: colors[i % colors.length] });
  });
}

/** 进度条 */
function gMeter(ctx: SceneCtx, x: number, y: number, w: number, h: number, ratio: number, color = SCENE_YELLOW): void {
  sRect(ctx, x, y, w, h, { fill: SCENE_PAPER });
  if (ratio > 0.02) {
    sRect(ctx, x + 4, y + 4, (w - 8) * Math.min(1, ratio), h - 8, { fill: color, sw: 1.2 });
  }
}

/** 月亮（离线/夜间） */
function gMoon(ctx: SceneCtx, cx: number, cy: number, r: number): void {
  sCircle(ctx, cx, cy, r, { fill: SCENE_YELLOW });
  sCircle(ctx, cx + r * 0.42, cy - r * 0.22, r * 0.78, { fill: SCENE_PAPER, stroke: SCENE_PAPER, sw: 1 });
}

/** 网格线 */
function gGrid(ctx: SceneCtx, x: number, y: number, cols: number, rows: number, cell: number, o: SceneStroke = {}): void {
  for (let i = 0; i <= cols; i++) {
    sLine(ctx, x + i * cell, y, x + i * cell, y + rows * cell, { sw: o.sw ?? 1.4, stroke: o.stroke ?? SCENE_INK });
  }
  for (let j = 0; j <= rows; j++) {
    sLine(ctx, x, y + j * cell, x + cols * cell, y + j * cell, { sw: o.sw ?? 1.4, stroke: o.stroke ?? SCENE_INK });
  }
}

/** 拼图块轮廓点集（顶凸 / 右凹 / 底凸 / 左平，经典拼图剪影；bbox 略超出 [x, x+s]） */
function puzzlePiecePts(x: number, y: number, s: number): ScenePt[] {
  const t = s * 0.16;
  return [
    [x, y],
    [x + s * 0.34, y],
    [x + s * 0.34, y - t],
    [x + s * 0.66, y - t],
    [x + s * 0.66, y],
    [x + s, y],
    [x + s, y + s * 0.34],
    [x + s - t, y + s * 0.34],
    [x + s - t, y + s * 0.66],
    [x + s, y + s * 0.66],
    [x + s, y + s],
    [x + s * 0.66, y + s],
    [x + s * 0.66, y + s + t],
    [x + s * 0.34, y + s + t],
    [x + s * 0.34, y + s],
    [x, y + s],
  ];
}

/** 合并单位（带等级点数） */
function gUnit(ctx: SceneCtx, cx: number, cy: number, s: number, tier: number, color = SCENE_BLUE): void {
  sRect(ctx, cx - s / 2, cy - s / 2, s, s, { fill: color });
  const pipR = Math.max(2.2, s * 0.07);
  const offs: ScenePt[] =
    tier <= 1 ? [[0, 0]] : tier === 2 ? [[-0.18, 0], [0.18, 0]] : [[-0.2, 0.14], [0.2, 0.14], [0, -0.2]];
  for (const [ox, oy] of offs) {
    sCircle(ctx, cx + ox * s, cy + oy * s, pipR, { fill: SCENE_INK, stroke: SCENE_INK });
  }
}

/** 合并图元（unit = 方块单位 / gem = 宝石） */
function gMergeGlyph(ctx: SceneCtx, cx: number, cy: number, s: number, tier: number, kind: "unit" | "gem"): void {
  if (kind === "gem") {
    const colors = [SCENE_BLUE, SCENE_GREEN, SCENE_RED, SCENE_YELLOW];
    gGem(ctx, cx, cy, s * 0.62, colors[Math.min(tier - 1, colors.length - 1)]);
  } else {
    const colors = [SCENE_BLUE, SCENE_GREEN, SCENE_YELLOW, SCENE_RED];
    gUnit(ctx, cx, cy, s, tier, colors[Math.min(tier - 1, colors.length - 1)]);
  }
}

/* ------------------------------ 场景实现 ------------------------------ */

/* ===== match-clear（三消） ===== */

const GEM_COLORS = [SCENE_BLUE, SCENE_YELLOW, SCENE_GREEN, SCENE_RED];

function scMatchRow(ctx: SceneCtx): void {
  // 4×3 宝石阵，中间一行 3 个同色宝石连成消除线
  const cell = 62;
  const gx = ctx.cx - cell * 2;
  const gy = ctx.cy - cell * 1.5;
  const layout = [0, 1, 2, 0, 1, 3, 3, 3, 0, 2, 0, 1];
  layout.forEach((c, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = gx + col * cell + cell / 2;
    const y = gy + row * cell + cell / 2;
    if (row === 1 && col >= 1) {
      sCircle(ctx, x, y, 26, { fill: "#ffe9a8", stroke: "#ffe9a8", sw: 1 });
    }
    gGem(ctx, x, y, 17, GEM_COLORS[c]);
  });
  // 消除线高亮：一圈柔和椭圆圈住三连宝石
  sEllipse(ctx, gx + 2.5 * cell, gy + 1.5 * cell, cell * 3.1, cell * 0.94, { stroke: SCENE_YELLOW, sw: 3 });
  gSparkle(ctx, gx + 1.5 * cell - 18, gy + 1.5 * cell - 30, 10);
  gSparkle(ctx, gx + 3.5 * cell + 18, gy + 1.5 * cell + 26, 8);
}

function scGemSwap(ctx: SceneCtx): void {
  // 相邻两格虚线底框 + 两枚宝石互换（上下两条弧线箭头）
  const y = ctx.cy + 10;
  sRect(ctx, ctx.cx - 92, y - 44, 84, 84, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.4 });
  sRect(ctx, ctx.cx + 8, y - 44, 84, 84, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.4 });
  gGem(ctx, ctx.cx - 50, y, 26, SCENE_RED);
  gGem(ctx, ctx.cx + 50, y, 26, SCENE_BLUE);
  sArcArrow(ctx, ctx.cx, y - 6, 52, Math.PI * 1.22, Math.PI * 1.78, { sw: 2.5 });
  sArcArrow(ctx, ctx.cx, y + 6, 52, Math.PI * 0.22, Math.PI * 0.78, { sw: 2.5 });
}

function scClearDrop(ctx: SceneCtx): void {
  // 底行 3 格已消除（虚线空位 + 爆裂），上方宝石带下落箭头补位
  const cell = 66;
  const gx = ctx.cx - cell * 1.5;
  const gy = ctx.cy - cell * 1.2;
  for (let col = 0; col < 3; col++) {
    const x = gx + col * cell + cell / 2;
    const topY = gy + cell / 2;
    const botY = gy + cell * 1.5;
    gGem(ctx, x, topY, 16, SCENE_RED);
    sArrow(ctx, x, topY + 24, x, botY - 26, { sw: 2 });
    sRect(ctx, x - 24, botY - 24, 48, 48, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.4 });
    gSparkle(ctx, x, botY, 9);
  }
}

function scCascadeChain(ctx: SceneCtx): void {
  // 连锁：左组正在消除（高亮 + 爆裂）→ 右组落下后形成新消除，中间星星升级
  const cell = 46;
  const g1x = ctx.cx - 158;
  const g2x = ctx.cx + 24;
  const gy = ctx.cy - cell;
  [0, 1, 2].forEach((col) => {
    const x = g1x + col * cell + cell / 2;
    sCircle(ctx, x, gy + cell * 1.5, 21, { fill: "#ffe9a8", stroke: "#ffe9a8", sw: 1 });
    gGem(ctx, x, gy + cell * 1.5, 13, SCENE_GREEN);
  });
  gBurst(ctx, g1x + cell * 1.5, gy + cell * 1.5, 40);
  sArrow(ctx, ctx.cx - 30, ctx.cy, ctx.cx + 8, ctx.cy, { sw: 2.5 });
  [0, 1, 2].forEach((col) => {
    gGem(ctx, g2x + col * cell + cell / 2, gy + cell / 2, 13, SCENE_YELLOW);
    sCircle(ctx, g2x + col * cell + cell / 2, gy + cell * 1.5, 21, { fill: "#ffe9a8", stroke: "#ffe9a8", sw: 1 });
    gGem(ctx, g2x + col * cell + cell / 2, gy + cell * 1.5, 13, SCENE_YELLOW);
  });
  gStar(ctx, ctx.cx - 8, ctx.cy - 72, 16);
  gStar(ctx, ctx.cx + 92, ctx.cy - 88, 24);
}

/* ===== merge（合成升级） ===== */

function scMergeBasic(ctx: SceneCtx, kind: "unit" | "gem"): void {
  const y = ctx.cy + 6;
  gMergeGlyph(ctx, ctx.cx - 108, y, 46, 1, kind);
  gMergeGlyph(ctx, ctx.cx - 52, y, 46, 1, kind);
  sArrow(ctx, ctx.cx - 8, y, ctx.cx + 44, y, { sw: 2.5 });
  gMergeGlyph(ctx, ctx.cx + 104, y, 62, 2, kind);
  gStar(ctx, ctx.cx + 104, y - 62, 15);
}

function scMergeDrag(ctx: SceneCtx, kind: "unit" | "gem"): void {
  const y = ctx.cy + 8;
  gMergeGlyph(ctx, ctx.cx - 110, y, 48, 1, kind);
  sCircle(ctx, ctx.cx + 96, y, 40, { fill: "#ffe9a8", stroke: "#ffe9a8", sw: 1 });
  gMergeGlyph(ctx, ctx.cx + 96, y, 48, 1, kind);
  sCurve(ctx, [[ctx.cx - 78, y], [ctx.cx - 10, y - 64], [ctx.cx + 62, y - 8]], { sw: 2, dash: "7 5" });
  arrowHead(ctx, ctx.cx + 62, y - 8, Math.atan2(y - (y - 8), ctx.cx + 96 - (ctx.cx + 62)) , 12, { sw: 2 });
  sCircle(ctx, ctx.cx + 96, y, 54, { sw: 1.2, stroke: SCENE_SOFT });
}

function scMergeChain(ctx: SceneCtx, kind: "unit" | "gem"): void {
  const y1 = ctx.cy - 66;
  const y2 = ctx.cy + 66;
  gMergeGlyph(ctx, ctx.cx - 132, y1, 40, 1, kind);
  gMergeGlyph(ctx, ctx.cx - 84, y1, 40, 1, kind);
  sArrow(ctx, ctx.cx - 52, y1, ctx.cx - 6, y1, { sw: 2.2 });
  gMergeGlyph(ctx, ctx.cx + 42, y1, 50, 2, kind);
  gMergeGlyph(ctx, ctx.cx - 132, y2, 50, 2, kind);
  gMergeGlyph(ctx, ctx.cx - 74, y2, 50, 2, kind);
  sArrow(ctx, ctx.cx - 36, y2, ctx.cx + 10, y2, { sw: 2.2 });
  gMergeGlyph(ctx, ctx.cx + 66, y2, 62, 3, kind);
  gStar(ctx, ctx.cx + 66, y2 - 58, 16);
}

function scMergeTiers(ctx: SceneCtx, kind: "unit" | "gem"): void {
  // 四级阶梯：单位逐级变大，最高级带星
  const base = ctx.y1 - 16;
  for (let i = 0; i < 4; i++) {
    const px = ctx.x0 + 52 + i * 92;
    const ph = 30 + i * 34;
    sRect(ctx, px - 34, base - ph, 68, ph, { fill: i === 3 ? "#efe9d8" : SCENE_PAPER });
    gMergeGlyph(ctx, px, base - ph - 26 - i * 4, 34 + i * 8, Math.min(i + 1, 3), kind);
  }
  gStar(ctx, ctx.x0 + 52 + 3 * 92, base - (30 + 3 * 34) - 26 - 12 - 34, 18);
}

function scMergeCycle(ctx: SceneCtx): void {
  // 合成循环：小单位 → 大单位 → 产出金币 → 回到小单位
  const cx = ctx.cx;
  const cy = ctx.cy;
  gMergeGlyph(ctx, cx - 118, cy + 44, 40, 1, "unit");
  gMergeGlyph(ctx, cx - 74, cy + 64, 40, 1, "unit");
  gMergeGlyph(ctx, cx + 86, cy - 58, 58, 2, "unit");
  gStar(ctx, cx + 86, cy - 106, 13);
  gCoin(ctx, cx + 108, cy + 58, 16);
  gCoin(ctx, cx + 136, cy + 40, 12);
  sArcArrow(ctx, cx, cy, 108, Math.PI * 0.72, Math.PI * 1.32, { sw: 2.2 });
  sArcArrow(ctx, cx, cy, 108, -Math.PI * 0.28, Math.PI * 0.22, { sw: 2.2 });
  sArcArrow(ctx, cx, cy, 108, Math.PI * 0.3, Math.PI * 0.62, { sw: 2.2 });
}

function scMergeIncome(ctx: SceneCtx): void {
  // 高级单位持续产出金币
  const y = ctx.cy + 34;
  gMergeGlyph(ctx, ctx.cx, y, 76, 3, "unit");
  gStar(ctx, ctx.cx + 44, y - 44, 15);
  for (const [dx, dy, r] of [[-56, -88, 14], [0, -110, 17], [58, -84, 13]] as const) {
    sMotion(ctx, ctx.cx + dx - 10, y + dy + 24, 14, -1);
    gCoin(ctx, ctx.cx + dx, y + dy, r);
  }
  gSparkle(ctx, ctx.cx - 74, y - 30, 9);
}

/* ===== dodge-avoid（躲避） ===== */

function scDodgeField(ctx: SceneCtx): void {
  // 上方危险物下落，玩家在底部空隙中穿行
  const hazards: [number, number][] = [[110, 92], [200, 66], [292, 96], [368, 70], [156, 150], [330, 158]];
  for (const [hx, hy] of hazards) {
    gSpike(ctx, hx, hy, 15);
    sLine(ctx, hx, hy - 26, hx, hy - 18, { stroke: SCENE_SOFT, sw: 1.2 });
  }
  sDots(ctx, [[ctx.cx, 300], [238, 250], [246, 206]], 13, 2.2, SCENE_SOFT);
  sCircle(ctx, ctx.cx, 300, 15, { fill: SCENE_YELLOW });
}

function scDodgeMove(ctx: SceneCtx): void {
  // 左右夹击，玩家横向闪避
  gSpike(ctx, ctx.cx - 118, ctx.cy - 20, 20);
  gSpike(ctx, ctx.cx + 118, ctx.cy - 20, 20);
  sArrow(ctx, ctx.cx - 92, ctx.cy - 20, ctx.cx - 58, ctx.cy - 20, { sw: 2 });
  sArrow(ctx, ctx.cx + 92, ctx.cy - 20, ctx.cx + 58, ctx.cy - 20, { sw: 2 });
  sCircle(ctx, ctx.cx, ctx.cy + 44, 17, { fill: SCENE_YELLOW });
  sArrow(ctx, ctx.cx - 16, ctx.cy + 44, ctx.cx - 62, ctx.cy + 44, { sw: 2.5 });
  sArrow(ctx, ctx.cx + 16, ctx.cy + 44, ctx.cx + 62, ctx.cy + 44, { sw: 2.5 });
}

function scDodgeGap(ctx: SceneCtx): void {
  // 五条纵向通道，只有中间通道是安全空隙
  const lanes = 5;
  const lw = 68;
  const gx = ctx.cx - (lanes * lw) / 2;
  for (let i = 1; i < lanes; i++) {
    sLine(ctx, gx + i * lw, ctx.y0 + 12, gx + i * lw, ctx.y1 - 12, { dash: "5 6", stroke: SCENE_SOFT, sw: 1.2 });
  }
  const blocks: [number, number][] = [[0, 96], [1, 150], [3, 118], [4, 84], [0, 220], [3, 226], [4, 190], [1, 246]];
  for (const [lane, by] of blocks) {
    sRect(ctx, gx + lane * lw + 10, by, lw - 20, 34, { fill: SCENE_RED });
  }
  sRect(ctx, gx + 2 * lw + 6, ctx.y0 + 16, lw - 12, ctx.h - 32, { fill: "#e2f3d8", sw: 1.2, stroke: SCENE_GREEN });
  sCircle(ctx, gx + 2 * lw + lw / 2, ctx.y1 - 46, 14, { fill: SCENE_YELLOW });
  sMotion(ctx, gx + 2 * lw + lw / 2, ctx.y1 - 78, 18, -1, SCENE_INK);
  sLine(ctx, gx + 2 * lw + lw / 2, ctx.y1 - 66, gx + 2 * lw + lw / 2, ctx.y1 - 62, { sw: 2 });
}

function scDodgeDensity(ctx: SceneCtx): void {
  // 交错双波弹幕 + 蛇形走位
  for (const [hx, hy] of [[92, 96], [172, 96], [252, 96], [332, 96], [388, 96]] as const) {
    gSpike(ctx, hx, hy, 14);
  }
  for (const [hx, hy] of [[132, 176], [212, 176], [292, 176], [372, 176]] as const) {
    gSpike(ctx, hx, hy, 14);
  }
  sCurve(ctx, [[110, 296], [150, 236], [200, 260], [252, 216], [300, 244], [352, 210]], { sw: 2.2, dash: "7 5" });
  sCircle(ctx, 110, 296, 14, { fill: SCENE_YELLOW });
  gStar(ctx, 366, 196, 13);
}

/* ===== runner（跑酷） ===== */

function scRunnerLane(ctx: SceneCtx): void {
  const gy = ctx.y1 - 34;
  sLine(ctx, ctx.x0 + 8, gy, ctx.x1 - 8, gy, { sw: 2.5 });
  gRunner(ctx, ctx.cx - 96, gy, 92);
  sRect(ctx, ctx.cx + 30, gy - 34, 26, 34, { fill: SCENE_HATCH });
  sLine(ctx, ctx.cx + 118, gy, ctx.cx + 156, gy, { stroke: SCENE_PAPER, sw: 5 });
  sRect(ctx, ctx.cx + 116, gy - 6, 42, 8, { fill: SCENE_INK });
  sMotion(ctx, ctx.cx - 148, gy - 58, 30, -1);
  sMotion(ctx, ctx.cx - 156, gy - 40, 38, -1);
  sMotion(ctx, ctx.cx - 146, gy - 22, 28, -1);
}

function scRunnerJump(ctx: SceneCtx): void {
  const gy = ctx.y1 - 34;
  sLine(ctx, ctx.x0 + 8, gy, ctx.x1 - 8, gy, { sw: 2.5 });
  sRect(ctx, ctx.cx - 13, gy - 36, 26, 36, { fill: SCENE_HATCH });
  sDotsQuad(ctx, [ctx.cx - 118, gy - 6], [ctx.cx - 10, 84], [ctx.cx + 116, gy - 6], 15, 2.4, SCENE_SOFT);
  // 跳跃者落在弧线顶点（二次贝塞尔 t=0.5 处 ≈ (234, 188)）
  gRunner(ctx, ctx.cx - 6, 192, 80);
  sArrow(ctx, ctx.cx + 66, gy - 60, ctx.cx + 100, gy - 14, { sw: 1.6, stroke: SCENE_SOFT, head: 9 });
}

function scRunnerLanes(ctx: SceneCtx): void {
  // 三车道：上下有障碍，中间通畅，玩家在中道
  const ys = [ctx.cy - 78, ctx.cy, ctx.cy + 78];
  for (const y of ys) {
    sLine(ctx, ctx.x0 + 10, y, ctx.x1 - 10, y, { sw: 2 });
  }
  sRect(ctx, ctx.cx + 52, ys[0] - 30, 30, 30, { fill: SCENE_RED });
  sRect(ctx, ctx.cx - 8, ys[2] - 30, 30, 30, { fill: SCENE_RED });
  gRunner(ctx, ctx.cx - 88, ys[1], 66);
  sArcArrow(ctx, ctx.cx + 30, ys[1] - 39, 26, Math.PI * 0.15, Math.PI * 0.85, { sw: 1.8, stroke: SCENE_SOFT, head: 8 });
  sMotion(ctx, ctx.cx - 128, ys[1] - 26, 22, -1);
  sMotion(ctx, ctx.cx - 134, ys[1] - 12, 26, -1);
}

function scRunnerSpeed(ctx: SceneCtx): void {
  const gy = ctx.y1 - 34;
  sLine(ctx, ctx.x0 + 8, gy, ctx.x1 - 8, gy, { sw: 2.5 });
  gRunner(ctx, ctx.cx - 128, gy, 88);
  sRect(ctx, ctx.cx - 8, gy - 32, 24, 32, { fill: SCENE_HATCH });
  sRect(ctx, ctx.cx + 56, gy - 32, 24, 32, { fill: SCENE_HATCH });
  sRect(ctx, ctx.cx + 112, gy - 32, 24, 32, { fill: SCENE_HATCH });
  for (let i = 0; i < 5; i++) {
    sMotion(ctx, ctx.cx - 176 - i * 4, gy - 64 + i * 13, 34 + i * 7, -1);
  }
  gBolt(ctx, ctx.cx + 160, gy - 88, 34);
}

/* ===== shoot-aim（瞄准射击） ===== */

function gTarget(ctx: SceneCtx, cx: number, cy: number, r: number): void {
  sCircle(ctx, cx, cy, r, { fill: SCENE_PAPER });
  sCircle(ctx, cx, cy, r * 0.62, { fill: SCENE_BLUE });
  sCircle(ctx, cx, cy, r * 0.3, { fill: SCENE_RED });
}

function scAimTarget(ctx: SceneCtx): void {
  const tx = ctx.cx + 108;
  const ty = ctx.cy - 42;
  gTarget(ctx, tx, ty, 46);
  sCircle(ctx, tx, ty, 62, { sw: 1.6 });
  sLine(ctx, tx - 76, ty, tx - 58, ty, { sw: 1.6 });
  sLine(ctx, tx + 58, ty, tx + 76, ty, { sw: 1.6 });
  sLine(ctx, tx, ty - 76, tx, ty - 58, { sw: 1.6 });
  sLine(ctx, tx, ty + 58, tx, ty + 76, { sw: 1.6 });
  sDots(ctx, [[ctx.cx - 128, ctx.cy + 78], [tx - 56, ty + 34]], 15, 2.2, SCENE_SOFT);
  gBolt(ctx, ctx.cx - 132, ctx.cy + 82, 26);
}

function scAimTrajectory(ctx: SceneCtx): void {
  const lx = ctx.x0 + 72;
  const ly = ctx.y1 - 42;
  sPoly(ctx, [[lx - 26, ly], [lx + 26, ly], [lx, ly - 34]], { fill: SCENE_HATCH });
  const tx = ctx.x1 - 84;
  const ty = ctx.y0 + 62;
  gTarget(ctx, tx, ty, 34);
  sDotsQuad(ctx, [lx + 6, ly - 38], [ctx.cx - 10, ctx.y0 + 18], [tx - 30, ty + 10], 16, 2.4, SCENE_INK);
  scenePush(ctx, ctx.gen.arc(lx, ly, 76, 76, -Math.PI / 2.6, -Math.PI / 4.2, false, { stroke: SCENE_SOFT, strokeWidth: 1.4 }), {
    stroke: SCENE_SOFT,
    sw: 1.4,
  });
}

function scAimHit(ctx: SceneCtx): void {
  const tx = ctx.cx + 20;
  const ty = ctx.cy - 10;
  gTarget(ctx, tx, ty, 52);
  gBurst(ctx, tx, ty, 84);
  sLine(ctx, tx - 96, ty + 66, tx - 14, ty + 8, { sw: 3 });
  arrowHead(ctx, tx - 12, ty + 6, Math.atan2(ty - (ty + 8) + 8, 1) - Math.PI, 12, {});
  gCoin(ctx, tx - 8, ty - 96, 15);
  sMotion(ctx, tx - 14, ty - 78, 14, -1);
  gSparkle(ctx, tx + 44, ty - 76, 11);
}

function scAimLead(ctx: SceneCtx): void {
  // 移动靶提前量：目标右移，瞄准点在前方
  const ty = ctx.cy - 30;
  gTarget(ctx, ctx.cx - 30, ty, 36);
  sArrow(ctx, ctx.cx + 14, ty, ctx.cx + 74, ty, { sw: 2, stroke: SCENE_SOFT });
  sCircle(ctx, ctx.cx + 116, ty, 10, { sw: 2, dash: "4 3" });
  sLine(ctx, ctx.cx + 116, ty - 22, ctx.cx + 116, ty - 12, { sw: 1.4 });
  sLine(ctx, ctx.cx + 116, ty + 12, ctx.cx + 116, ty + 22, { sw: 1.4 });
  sLine(ctx, ctx.cx + 94, ty, ctx.cx + 104, ty, { sw: 1.4 });
  sLine(ctx, ctx.cx + 128, ty, ctx.cx + 138, ty, { sw: 1.4 });
  sDots(ctx, [[ctx.cx - 118, ctx.cy + 88], [ctx.cx + 100, ty + 16]], 15, 2.2, SCENE_INK);
  gBolt(ctx, ctx.cx - 124, ctx.cy + 92, 24);
}

/* ===== combat（战斗） ===== */

function scCombatClash(ctx: SceneCtx): void {
  // 双方持剑交锋：剑刃在中央相抵 + 爆裂火花 + 地面线
  const gy = ctx.y1 - 42;
  sLine(ctx, ctx.cx - 170, gy, ctx.cx + 170, gy, { sw: 2 });
  gFighter(ctx, ctx.cx - 84, gy, 118, { weapon: "sword", lunge: true });
  gFighter(ctx, ctx.cx + 84, gy, 118, { flip: true, weapon: "sword", lunge: true });
  gBurst(ctx, ctx.cx, gy - 96, 30);
  gSparkle(ctx, ctx.cx, gy - 100, 13);
}

function scCombatStrike(ctx: SceneCtx): void {
  const gy = ctx.y1 - 42;
  sLine(ctx, ctx.cx - 170, gy, ctx.cx + 170, gy, { sw: 2 });
  gFighter(ctx, ctx.cx - 86, gy, 124, { weapon: "sword", lunge: true });
  gFighter(ctx, ctx.cx + 96, gy, 124, { flip: true, weapon: "shield" });
  sArcArrow(ctx, ctx.cx - 30, gy - 96, 52, -Math.PI * 0.75, -Math.PI * 0.05, { sw: 1.8, stroke: SCENE_SOFT, head: 9 });
  sMotion(ctx, ctx.cx - 150, gy - 40, 26, -1);
  sMotion(ctx, ctx.cx - 158, gy - 24, 32, -1);
}

function scCombatTrade(ctx: SceneCtx): void {
  // 双方血条交替削减（分段表示，无文字）
  const gy = ctx.y1 - 46;
  sLine(ctx, ctx.cx - 190, gy, ctx.cx + 190, gy, { sw: 2 });
  gFighter(ctx, ctx.cx - 118, gy, 108, { weapon: "sword" });
  gFighter(ctx, ctx.cx + 118, gy, 108, { flip: true, weapon: "sword" });
  const segs = 5;
  const bw = 30;
  const gap = 6;
  const barW = segs * bw + (segs - 1) * gap;
  const y = ctx.y0 + 34;
  for (let i = 0; i < segs; i++) {
    sRect(ctx, ctx.cx - 118 - barW / 2 + i * (bw + gap), y, bw, 16, { fill: i < 3 ? SCENE_GREEN : "none" });
    sRect(ctx, ctx.cx + 118 - barW / 2 + i * (bw + gap), y, bw, 16, { fill: i < 2 ? SCENE_GREEN : "none" });
  }
  gBurst(ctx, ctx.cx - 34, gy - 118, 20);
  gBurst(ctx, ctx.cx + 34, gy - 88, 20);
}

function scCombatCooldown(ctx: SceneCtx): void {
  // 技能栏：剑 / 盾（冷却中，带扇形扫描） / 星
  const y = ctx.cy;
  const s = 78;
  const xs = [ctx.cx - 100, ctx.cx, ctx.cx + 100];
  sRect(ctx, xs[0] - s / 2, y - s / 2, s, s, { fill: SCENE_PAPER });
  sLine(ctx, xs[0] - 20, y + 20, xs[0] + 20, y - 20, { sw: 3.5 });
  sLine(ctx, xs[0] - 26, y + 8, xs[0] - 8, y + 26, { sw: 2.5 });
  sRect(ctx, xs[1] - s / 2, y - s / 2, s, s, { fill: SCENE_HATCH });
  scenePush(ctx, ctx.gen.arc(xs[1], y, s * 0.72, s * 0.72, -Math.PI / 2, Math.PI * 0.5, true, { stroke: SCENE_INK, strokeWidth: 1.6, fill: "none" }), {
    sw: 1.6,
  });
  sLine(ctx, xs[1], y, xs[1], y - s * 0.36, { sw: 2 });
  sRect(ctx, xs[2] - s / 2, y - s / 2, s, s, { fill: SCENE_PAPER });
  gStar(ctx, xs[2], y, 24);
  sCircle(ctx, xs[1] + 30, y - 30, 12, { fill: SCENE_PAPER });
  sLine(ctx, xs[1] + 30, y - 30, xs[1] + 30, y - 38, { sw: 1.6 });
  sLine(ctx, xs[1] + 30, y - 30, xs[1] + 36, y - 27, { sw: 1.6 });
}

/* ===== turn-duel（回合博弈） ===== */

function gBoard(ctx: SceneCtx, x: number, y: number, cell: number, n: number): void {
  sRect(ctx, x, y, cell * n, cell * n, { fill: SCENE_PAPER, sw: 2.5 });
  for (let i = 1; i < n; i++) {
    sLine(ctx, x + i * cell, y, x + i * cell, y + cell * n, { sw: 1.4 });
    sLine(ctx, x, y + i * cell, x + cell * n, y + i * cell, { sw: 1.4 });
  }
}

function gOPiece(ctx: SceneCtx, cx: number, cy: number, r: number, color = SCENE_BLUE): void {
  sCircle(ctx, cx, cy, r, { fill: color });
  sCircle(ctx, cx, cy, r * 0.5, { fill: SCENE_PAPER, sw: 1.4 });
}

function gXPiece(ctx: SceneCtx, cx: number, cy: number, r: number, color = SCENE_RED): void {
  const k = r * 0.72;
  sLine(ctx, cx - k, cy - k, cx + k, cy + k, { stroke: color, sw: 4 });
  sLine(ctx, cx - k, cy + k, cx + k, cy - k, { stroke: color, sw: 4 });
  sCircle(ctx, cx, cy, r, { sw: 1.2, stroke: color });
}

function scTurnBoard(ctx: SceneCtx): void {
  const cell = 64;
  const bx = ctx.cx - cell * 1.5;
  const by = ctx.cy - cell * 1.5 + 12;
  gBoard(ctx, bx, by, cell, 3);
  gOPiece(ctx, bx + cell * 0.5, by + cell * 0.5, 17);
  gXPiece(ctx, bx + cell * 1.5, by + cell * 1.5, 17);
  gOPiece(ctx, bx + cell * 2.5, by + cell * 1.5, 17);
  gXPiece(ctx, bx + cell * 0.5, by + cell * 2.5, 17);
  gOPiece(ctx, bx - 42, by - 30, 13);
  gXPiece(ctx, bx + cell * 3 + 42, by - 30, 13);
  // 回合切换：双方棋子上方一条扁平的换手弧线箭头
  sCurveArrow(ctx, [[bx - 24, by - 34], [ctx.cx, by - 66], [bx + cell * 3 + 24, by - 34]], { sw: 2.2 });
}

function scTurnPlace(ctx: SceneCtx): void {
  const cell = 64;
  const bx = ctx.cx - cell * 1.5;
  const by = ctx.cy - cell * 1.5 + 12;
  gBoard(ctx, bx, by, cell, 3);
  gOPiece(ctx, bx + cell * 0.5, by + cell * 0.5, 17);
  gXPiece(ctx, bx + cell * 1.5, by + cell * 1.5, 17);
  // 合法落子点
  for (const [c, r] of [[2, 0], [0, 1], [1, 2]] as const) {
    sCircle(ctx, bx + c * cell + cell / 2, by + r * cell + cell / 2, 4, { fill: SCENE_SOFT, stroke: SCENE_SOFT, sw: 1 });
  }
  // 高亮目标格 + 落子
  sRect(ctx, bx + 2 * cell + 6, by + 2 * cell + 6, cell - 12, cell - 12, { fill: "#ffe9a8", sw: 1.4 });
  gXPiece(ctx, bx + cell * 2.5, by - 34, 17);
  sArrow(ctx, bx + cell * 2.5, by - 12, bx + cell * 2.5, by + cell * 2.5 - 24, { sw: 2.5 });
}

function scTurnCycle(ctx: SceneCtx): void {
  // 你一手我一手：双方棋子 + 双向回合箭头
  gOPiece(ctx, ctx.cx - 92, ctx.cy + 6, 36);
  gXPiece(ctx, ctx.cx + 92, ctx.cy + 6, 36);
  sArcArrow(ctx, ctx.cx, ctx.cy + 6, 118, Math.PI + 0.5, -0.5, { sw: 2.5 });
  sArcArrow(ctx, ctx.cx, ctx.cy + 6, 118, 0.5, Math.PI - 0.5, { sw: 2.5 });
}

function scTurnWin(ctx: SceneCtx): void {
  const cell = 64;
  const bx = ctx.cx - cell * 1.5;
  const by = ctx.cy - cell * 1.5 + 12;
  gBoard(ctx, bx, by, cell, 3);
  gXPiece(ctx, bx + cell * 0.5, by + cell * 0.5, 17);
  gXPiece(ctx, bx + cell * 1.5, by + cell * 1.5, 17);
  gXPiece(ctx, bx + cell * 2.5, by + cell * 2.5, 17);
  gOPiece(ctx, bx + cell * 1.5, by + cell * 0.5, 17, "#c9c2b2");
  gOPiece(ctx, bx + cell * 0.5, by + cell * 2.5, 17, "#c9c2b2");
  sLine(ctx, bx + cell * 0.5 - 18, by + cell * 0.5 - 18, bx + cell * 2.5 + 18, by + cell * 2.5 + 18, { stroke: SCENE_GREEN, sw: 5 });
  gStar(ctx, bx + cell * 3 + 30, by - 16, 18);
  gSparkle(ctx, bx - 26, by + cell * 3 + 6, 11);
}

/* ===== placement（放置/塔防） ===== */

function scPlaceTower(ctx: SceneCtx): void {
  const cell = 54;
  const gx = ctx.cx - cell * 2.5;
  const gy = ctx.cy - cell * 2;
  // 路径带（中间一行，排线填充）
  sRect(ctx, gx, gy + cell * 2, cell * 5, cell, { fill: SCENE_HATCH, fillStyle: "hachure", sw: 1 });
  gGrid(ctx, gx, gy, 5, 4, cell, { sw: 1.3 });
  const tx = gx + cell * 2.5;
  const ty = gy + cell * 1.5;
  sCircle(ctx, tx, ty, 74, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.4 });
  gTower(ctx, tx, gy + cell * 2 - 8, 36, 46);
  for (const ex of [gx + cell * 0.6, gx + cell * 1.4]) {
    sPoly(ctx, [[ex, gy + cell * 2.5 - 9], [ex + 16, gy + cell * 2.5], [ex, gy + cell * 2.5 + 9]], { fill: SCENE_RED });
    sMotion(ctx, ex - 12, gy + cell * 2.5, 10, -1);
  }
}

function scPlaceGhost(ctx: SceneCtx): void {
  const cell = 66;
  const gx = ctx.cx - cell * 1.5;
  const gy = ctx.cy - cell * 1.5 + 16;
  gGrid(ctx, gx, gy, 3, 3, cell, { sw: 1.3 });
  sRect(ctx, gx + cell + 5, gy + cell + 5, cell - 10, cell - 10, { fill: "#ffe9a8", sw: 1.4 });
  gTower(ctx, gx + cell * 1.5, gy - 26, 34, 42, { dash: "5 4", stroke: SCENE_SOFT, sw: 1.6 });
  sArrow(ctx, gx + cell * 1.5, gy + 2, gx + cell * 1.5, gy + cell - 22, { sw: 2.5 });
  sCircle(ctx, gx + cell * 1.5, gy + cell * 1.5, 16, { sw: 1.2, stroke: SCENE_SOFT });
  sCircle(ctx, gx + cell * 1.5, gy + cell * 1.5, 24, { sw: 1, stroke: SCENE_SOFT });
}

function scPlaceWave(ctx: SceneCtx): void {
  const pathY = ctx.cy + 20;
  sRect(ctx, ctx.x0 + 10, pathY - 26, ctx.w - 20, 56, { fill: SCENE_HATCH, fillStyle: "hachure", sw: 1 });
  const tx = ctx.cx + 66;
  const ty = pathY - 96;
  sCircle(ctx, tx, ty, 92, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.4 });
  gTower(ctx, tx, ty + 40, 40, 52);
  for (const [ex, hit] of [[ctx.x0 + 56, false], [ctx.x0 + 128, false], [ctx.cx + 6, true]] as const) {
    sPoly(ctx, [[ex, pathY - 11], [ex + 20, pathY], [ex, pathY + 11]], { fill: SCENE_RED });
    if (!hit) sMotion(ctx, ex - 14, pathY, 12, -1);
  }
  gBurst(ctx, ctx.cx + 16, pathY, 26);
}

function scPlaceCover(ctx: SceneCtx): void {
  const pathY = ctx.cy + 46;
  sRect(ctx, ctx.x0 + 10, pathY - 26, ctx.w - 20, 56, { fill: SCENE_HATCH, fillStyle: "hachure", sw: 1 });
  const t1 = ctx.cx - 92;
  const t2 = ctx.cx + 92;
  const ty = pathY - 110;
  sCircle(ctx, t1, ty, 96, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.4 });
  sCircle(ctx, t2, ty, 96, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.4 });
  gTower(ctx, t1, ty + 42, 38, 50);
  gTower(ctx, t2, ty + 42, 38, 50);
  for (const ex of [ctx.cx - 34, ctx.cx + 30]) {
    sPoly(ctx, [[ex, pathY - 10], [ex + 18, pathY], [ex, pathY + 10]], { fill: SCENE_RED });
    gBurst(ctx, ex + 8, pathY, 20);
  }
}

/* ===== choice-strategy（选择/策略） ===== */

function scChoiceCards(ctx: SceneCtx): void {
  gCard(ctx, ctx.cx - 64, ctx.cy + 6, 62, 88, -14, SCENE_PAPER);
  gCard(ctx, ctx.cx + 64, ctx.cy + 6, 62, 88, 14, SCENE_PAPER);
  gCard(ctx, ctx.cx, ctx.cy - 14, 66, 94, 0, SCENE_YELLOW);
  gSparkle(ctx, ctx.cx + 52, ctx.cy - 76, 10);
}

function scChoicePick(ctx: SceneCtx): void {
  const y = ctx.cy + 42;
  gCard(ctx, ctx.cx - 92, y, 62, 88, 0, SCENE_PAPER);
  gCard(ctx, ctx.cx + 92, y, 62, 88, 0, SCENE_PAPER);
  sArrow(ctx, ctx.cx + 34, y - 30, ctx.cx + 34, y - 96, { sw: 2, stroke: SCENE_SOFT });
  gCard(ctx, ctx.cx, y - 88, 66, 94, 0, SCENE_YELLOW);
}

function scChoiceBranch(ctx: SceneCtx): void {
  const nx = ctx.x0 + 78;
  sCircle(ctx, nx, ctx.cy, 17, { fill: SCENE_PAPER });
  sCircle(ctx, nx, ctx.cy, 5, { fill: SCENE_INK, stroke: SCENE_INK });
  const t1x = ctx.x1 - 108;
  sArrow(ctx, nx + 24, ctx.cy - 8, t1x - 34, ctx.cy - 84, { sw: 2.2 });
  sArrow(ctx, nx + 24, ctx.cy + 8, t1x - 34, ctx.cy + 84, { sw: 2.2 });
  sCircle(ctx, t1x, ctx.cy - 92, 30, { fill: SCENE_PAPER });
  gCoin(ctx, t1x, ctx.cy - 92, 15);
  sCircle(ctx, t1x, ctx.cy + 92, 30, { fill: SCENE_PAPER });
  gStar(ctx, t1x, ctx.cy + 92, 17);
}

function scChoiceScale(ctx: SceneCtx): void {
  const bx = ctx.cx;
  const by = ctx.cy - 30;
  sPoly(ctx, [[bx - 22, ctx.y1 - 46], [bx + 22, ctx.y1 - 46], [bx, by + 6]], { fill: SCENE_HATCH });
  sLine(ctx, bx - 108, by - 4, bx + 108, by + 10, { sw: 3 });
  // 左盘（金币）
  sLine(ctx, bx - 108, by - 4, bx - 108, by + 34, { sw: 1.6 });
  scenePush(ctx, ctx.gen.arc(bx - 108, by + 22, 76, 44, 0, Math.PI, false, { stroke: SCENE_INK, strokeWidth: 2 }), {});
  gCoin(ctx, bx - 122, by + 26, 11);
  gCoin(ctx, bx - 96, by + 28, 11);
  // 右盘（星星）
  sLine(ctx, bx + 108, by + 10, bx + 108, by + 48, { sw: 1.6 });
  scenePush(ctx, ctx.gen.arc(bx + 108, by + 36, 76, 44, 0, Math.PI, false, { stroke: SCENE_INK, strokeWidth: 2 }), {});
  gStar(ctx, bx + 108, by + 40, 15);
}

/* ===== physics（物理） ===== */

function scPhysicsStack(ctx: SceneCtx): void {
  const gy = ctx.y1 - 30;
  sLine(ctx, ctx.x0 + 30, gy, ctx.x1 - 30, gy, { sw: 2.5 });
  const bw = 62;
  const bh = 42;
  const baseX = ctx.cx - bw * 1.5;
  const colors = [SCENE_BLUE, SCENE_YELLOW, SCENE_GREEN];
  for (let i = 0; i < 3; i++) {
    sRect(ctx, baseX + i * bw, gy - bh, bw - 4, bh, { fill: colors[i] });
  }
  sRect(ctx, baseX + bw * 0.5 + 8, gy - bh * 2 - 4, bw - 4, bh, { fill: SCENE_YELLOW });
  sRect(ctx, baseX + bw * 1.5 + 8, gy - bh * 2 - 4, bw - 4, bh, { fill: SCENE_BLUE });
  const tx = ctx.cx + 6;
  const ty = gy - bh * 2 - 4 - bh / 2 - 2;
  const pts = rotPts(tx, ty, [[tx - bw / 2 + 2, ty - bh / 2], [tx + bw / 2 - 2, ty - bh / 2], [tx + bw / 2 - 2, ty + bh / 2], [tx - bw / 2 + 2, ty + bh / 2]], 9);
  sPoly(ctx, pts, { fill: SCENE_RED });
}

function scPhysicsDrop(ctx: SceneCtx): void {
  const gy = ctx.y1 - 30;
  sLine(ctx, ctx.x0 + 30, gy, ctx.x1 - 30, gy, { sw: 2.5 });
  const bw = 62;
  const bh = 42;
  sRect(ctx, ctx.cx - bw / 2, gy - bh, bw, bh, { fill: SCENE_BLUE });
  sRect(ctx, ctx.cx - bw / 2 + 6, gy - bh * 2, bw, bh, { fill: SCENE_YELLOW });
  const fx = ctx.cx + 10;
  const fy = ctx.y0 + 46;
  const pts = rotPts(fx, fy, [[fx - bw / 2, fy - bh / 2], [fx + bw / 2, fy - bh / 2], [fx + bw / 2, fy + bh / 2], [fx - bw / 2, fy + bh / 2]], -14);
  sPoly(ctx, pts, { fill: SCENE_RED });
  sDots(ctx, [[fx - 2, fy + 34], [ctx.cx + 6, gy - bh * 2 - 10]], 13, 2.2, SCENE_SOFT);
  gBurst(ctx, ctx.cx + 6, gy - bh * 2 - 4, 22);
}

function scPhysicsSeesaw(ctx: SceneCtx): void {
  const fy = ctx.y1 - 40;
  sPoly(ctx, [[ctx.cx - 24, fy], [ctx.cx + 24, fy], [ctx.cx, fy - 40]], { fill: SCENE_HATCH });
  sLine(ctx, ctx.cx - 130, fy - 22, ctx.cx + 130, fy - 62, { sw: 3.5 });
  sRect(ctx, ctx.cx - 138, fy - 78, 52, 52, { fill: SCENE_BLUE });
  sRect(ctx, ctx.cx + 92, fy - 100, 32, 32, { fill: SCENE_YELLOW });
  gStar(ctx, ctx.cx + 108, fy - 122, 13);
}

function scPhysicsDomino(ctx: SceneCtx): void {
  const gy = ctx.y1 - 30;
  sLine(ctx, ctx.x0 + 30, gy, ctx.x1 - 20, gy, { sw: 2.5 });
  const dw = 16;
  const dh = 68;
  const dominoes: [number, number][] = [[ctx.cx - 122, 62], [ctx.cx - 56, 36], [ctx.cx + 6, 12], [ctx.cx + 66, 0]];
  for (const [dx, deg] of dominoes) {
    const bx = dx;
    const by = gy;
    const pts = rotPts(bx, by, [[bx - dw / 2, by - dh], [bx + dw / 2, by - dh], [bx + dw / 2, by], [bx - dw / 2, by]], deg);
    sPoly(ctx, pts, { fill: deg > 0 ? SCENE_YELLOW : SCENE_BLUE });
  }
  sCircle(ctx, ctx.cx + 128, gy - 14, 14, { fill: SCENE_RED });
  sArcArrow(ctx, ctx.cx - 122, gy - dh, 52, -Math.PI / 2, -Math.PI / 6, { sw: 1.6, stroke: SCENE_SOFT, head: 8 });
}

/* ===== puzzle（解谜） ===== */

function scPuzzleFit(ctx: SceneCtx): void {
  const s = 92;
  sPoly(ctx, puzzlePiecePts(ctx.cx - 128, ctx.cy - s / 2, s), { fill: SCENE_GREEN });
  sPoly(ctx, puzzlePiecePts(ctx.cx + 44, ctx.cy - s / 2, s), { dash: "6 5", stroke: SCENE_SOFT, sw: 1.8 });
  sArrow(ctx, ctx.cx - 16, ctx.cy, ctx.cx + 22, ctx.cy, { sw: 2.5 });
}

function scPuzzleTry(ctx: SceneCtx): void {
  const cell = 60;
  const gx = ctx.cx - cell * 1.5;
  const gy = ctx.cy - cell * 1.5 + 18;
  gGrid(ctx, gx, gy, 3, 3, cell, { sw: 1.3 });
  const fills: [number, number, string][] = [[0, 0, SCENE_BLUE], [2, 0, SCENE_YELLOW], [0, 2, SCENE_GREEN], [1, 2, SCENE_BLUE], [2, 1, SCENE_GREEN]];
  for (const [c, r, color] of fills) {
    gGem(ctx, gx + c * cell + cell / 2, gy + r * cell + cell / 2, 15, color);
  }
  sRect(ctx, gx + cell + 5, gy + cell + 5, cell - 10, cell - 10, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.6 });
  gGem(ctx, gx + cell * 1.5, gy - 40, 17, SCENE_RED);
  sArrow(ctx, gx + cell * 1.5, gy - 16, gx + cell * 1.5, gy + cell - 24, { sw: 2.5 });
}

function scPuzzleReveal(ctx: SceneCtx): void {
  // 信息隐藏→揭示：三个遮盖格 + 中间翻开露出宝石
  const s = 74;
  const y = ctx.cy - s / 2;
  const xs = [ctx.cx - s * 2 - 24, ctx.cx - s / 2, ctx.cx + s + 24];
  sRect(ctx, xs[0], y, s, s, { fill: SCENE_HATCH, fillStyle: "hachure" });
  sRect(ctx, xs[2], y, s, s, { fill: SCENE_HATCH, fillStyle: "hachure" });
  sRect(ctx, xs[1], y, s, s, { fill: SCENE_PAPER });
  gGem(ctx, xs[1] + s / 2, y + s / 2, 20, SCENE_BLUE);
  gSparkle(ctx, xs[1] + s + 14, y - 12, 11);
  sArcArrow(ctx, xs[1] + s / 2, y + s / 2, s * 0.85, Math.PI * 1.15, Math.PI * 1.55, { sw: 1.6, stroke: SCENE_SOFT, head: 8 });
}

function scPuzzlePath(ctx: SceneCtx): void {
  const cell = 52;
  const gx = ctx.cx - cell * 2;
  const gy = ctx.cy - cell * 2;
  gGrid(ctx, gx, gy, 4, 4, cell, { sw: 1.3 });
  const pts: ScenePt[] = [
    [gx + cell * 0.5, gy + cell * 3.5],
    [gx + cell * 1.5, gy + cell * 3.5],
    [gx + cell * 1.5, gy + cell * 2.5],
    [gx + cell * 2.5, gy + cell * 2.5],
    [gx + cell * 2.5, gy + cell * 1.5],
    [gx + cell * 3.5, gy + cell * 1.5],
    [gx + cell * 3.5, gy + cell * 0.5],
  ];
  sCurve(ctx, pts, { sw: 3, stroke: SCENE_BLUE });
  sCircle(ctx, gx + cell * 0.5, gy + cell * 3.5, 10, { fill: SCENE_GREEN });
  gStar(ctx, gx + cell * 3.5, gy + cell * 0.5, 17);
}

/* ===== progression（成长线） ===== */

function scProgStairs(ctx: SceneCtx): void {
  const base = ctx.y1 - 24;
  for (let i = 0; i < 4; i++) {
    const px = ctx.x0 + 52 + i * 88;
    const ph = 34 + i * 40;
    sRect(ctx, px - 34, base - ph, 68, ph, { fill: i === 3 ? "#efe9d8" : SCENE_PAPER });
  }
  gCoin(ctx, ctx.x0 + 52 + 88, base - 74 - 12, 11);
  gCoin(ctx, ctx.x0 + 52 + 176, base - 114 - 12, 11);
  gFlag(ctx, ctx.x0 + 52 + 264 + 10, base - 154, 52);
  gRunner(ctx, ctx.x0 + 44, base - 34, 56);
}

function scProgCollect(ctx: SceneCtx): void {
  gMeter(ctx, ctx.cx - 132, ctx.cy + 62, 264, 30, 0.62);
  const items: [number, number, "gem" | "coin"][] = [[ctx.cx - 92, ctx.cy - 52, "gem"], [ctx.cx - 10, ctx.cy - 84, "coin"], [ctx.cx + 84, ctx.cy - 40, "gem"]];
  for (const [ix, iy, kind] of items) {
    sDots(ctx, [[ix, iy + 26], [ix, ctx.cy + 52]], 12, 2, SCENE_SOFT);
    if (kind === "gem") gGem(ctx, ix, iy, 16, SCENE_BLUE);
    else gCoin(ctx, ix, iy, 15);
  }
}

function scProgCurve(ctx: SceneCtx): void {
  const base = ctx.y1 - 28;
  gBars(ctx, ctx.x0 + 46, base, 42, 26, [46, 72, 104, 142, 184]);
  sCurve(ctx, [[ctx.x0 + 60, base - 70], [ctx.cx - 20, base - 120], [ctx.x1 - 80, base - 200]], { sw: 2.5 });
  arrowHead(ctx, ctx.x1 - 78, base - 202, Math.atan2(-80, 120), 12, {});
  gStar(ctx, ctx.x0 + 46 + 2 * 68 + 21, base - 104 - 20, 12);
  gStar(ctx, ctx.x0 + 46 + 4 * 68 + 21, base - 184 - 22, 16);
}

function scProgPrestige(ctx: SceneCtx): void {
  // 小阶梯登顶后回旋重置为更高阶梯（转生）
  const base = ctx.y1 - 24;
  for (let i = 0; i < 2; i++) {
    const px = ctx.x0 + 56 + i * 56;
    sRect(ctx, px - 26, base - 30 - i * 30, 52, 30 + i * 30, { fill: SCENE_PAPER });
  }
  gStar(ctx, ctx.x0 + 56 + 56, base - 60 - 26, 12);
  for (let i = 0; i < 3; i++) {
    const px = ctx.cx + 58 + i * 56;
    sRect(ctx, px - 26, base - 44 - i * 44, 52, 44 + i * 44, { fill: i === 2 ? "#efe9d8" : SCENE_PAPER });
  }
  gStar(ctx, ctx.cx + 58 + 112, base - 132 - 30, 19);
  sArcArrow(ctx, ctx.cx - 10, ctx.cy + 10, 120, Math.PI * 1.05, Math.PI * 1.85, { sw: 2.2 });
}

/* ===== simulation（模拟经营） ===== */

function scSimTown(ctx: SceneCtx): void {
  const base = ctx.y1 - 30;
  sLine(ctx, ctx.x0 + 16, base, ctx.x1 - 16, base, { sw: 2 });
  gHouse(ctx, ctx.cx - 120, base, 64, 52);
  // 工厂
  sRect(ctx, ctx.cx - 30, base - 44, 84, 44, { fill: SCENE_PAPER });
  sPoly(ctx, [[ctx.cx - 30, base - 44], [ctx.cx - 9, base - 64], [ctx.cx + 12, base - 44], [ctx.cx + 33, base - 64], [ctx.cx + 54, base - 44]], { fill: SCENE_RED });
  sRect(ctx, ctx.cx + 36, base - 86, 14, 30, { fill: SCENE_HATCH });
  sCircle(ctx, ctx.cx + 43, base - 96, 4, { fill: SCENE_SOFT, stroke: SCENE_SOFT });
  sCircle(ctx, ctx.cx + 50, base - 106, 5, { fill: SCENE_SOFT, stroke: SCENE_SOFT });
  // 农田
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      sLine(ctx, ctx.cx + 96 + c * 20, base - 10 - r * 14, ctx.cx + 104 + c * 20, base - 16 - r * 14, { stroke: SCENE_GREEN, sw: 2 });
    }
  }
  gCoin(ctx, ctx.cx + 12, base - 110, 13);
  sMotion(ctx, ctx.cx + 6, base - 92, 12, -1);
}

function scSimHarvest(ctx: SceneCtx): void {
  const base = ctx.y1 - 40;
  gHouse(ctx, ctx.cx, base, 96, 74);
  for (const [dx, dy] of [[-34, -142], [10, -160], [52, -138]] as const) {
    gCoin(ctx, ctx.cx + dx, base + dy, 13);
    sMotion(ctx, ctx.cx + dx - 8, base + dy + 20, 12, -1);
  }
  sCircle(ctx, ctx.cx + 40, base - 30, 14, { sw: 1.2, stroke: SCENE_SOFT });
  sCircle(ctx, ctx.cx + 40, base - 30, 23, { sw: 1, stroke: SCENE_SOFT });
}

function scSimNetwork(ctx: SceneCtx): void {
  const nodes: [number, number, "house" | "tree" | "box" | "coin"][] = [
    [ctx.cx, ctx.y0 + 52, "house"],
    [ctx.x0 + 74, ctx.cy + 20, "tree"],
    [ctx.x1 - 74, ctx.cy + 20, "box"],
    [ctx.cx, ctx.y1 - 46, "coin"],
  ];
  sArrow(ctx, ctx.x0 + 96, ctx.cy - 2, ctx.cx - 26, ctx.y0 + 78, { sw: 1.8 });
  sArrow(ctx, ctx.x1 - 96, ctx.cy - 2, ctx.cx + 26, ctx.y0 + 78, { sw: 1.8 });
  sArrow(ctx, ctx.x0 + 88, ctx.cy + 44, ctx.cx - 30, ctx.y1 - 56, { sw: 1.8 });
  sArrow(ctx, ctx.x1 - 88, ctx.cy + 44, ctx.cx + 30, ctx.y1 - 56, { sw: 1.8 });
  for (const [nx, ny, kind] of nodes) {
    sCircle(ctx, nx, ny, 34, { fill: SCENE_PAPER });
    if (kind === "house") gHouse(ctx, nx, ny + 18, 34, 24);
    if (kind === "tree") gTree(ctx, nx, ny + 16, 30);
    if (kind === "box") gBox(ctx, nx, ny, 26);
    if (kind === "coin") gCoin(ctx, nx, ny, 15);
  }
}

/* ===== timing（时机判定） ===== */

function gGauge(ctx: SceneCtx, x: number, y: number, w: number, h: number, zoneX: number, zoneW: number, needleX: number): void {
  sRect(ctx, x, y, w, h, { fill: SCENE_PAPER });
  sRect(ctx, zoneX, y + 4, zoneW, h - 8, { fill: SCENE_GREEN, sw: 1.2 });
  sLine(ctx, needleX, y - 16, needleX, y + h + 16, { sw: 3 });
}

function scTimingGauge(ctx: SceneCtx): void {
  gGauge(ctx, ctx.x0 + 40, ctx.cy - 18, ctx.w - 80, 36, ctx.cx + 10, 64, ctx.cx + 40);
  gSparkle(ctx, ctx.cx + 40, ctx.cy - 52, 11);
}

function scTimingTap(ctx: SceneCtx): void {
  gGauge(ctx, ctx.x0 + 40, ctx.cy - 46, ctx.w - 80, 34, ctx.cx + 6, 62, ctx.cx + 34);
  gBurst(ctx, ctx.cx + 34, ctx.cy - 62, 24);
  sCircle(ctx, ctx.cx + 34, ctx.cy + 66, 22, { fill: SCENE_YELLOW });
  sCircle(ctx, ctx.cx + 34, ctx.cy + 66, 36, { sw: 1.2, stroke: SCENE_SOFT });
  sCircle(ctx, ctx.cx + 34, ctx.cy + 66, 50, { sw: 1, stroke: SCENE_SOFT });
  sArrow(ctx, ctx.cx + 34, ctx.cy + 30, ctx.cx + 34, ctx.cy - 4, { sw: 2, stroke: SCENE_SOFT, head: 9 });
}

function scTimingWindow(ctx: SceneCtx): void {
  // 时间轴上重复出现的判定窗口
  const y = ctx.cy - 14;
  sRect(ctx, ctx.x0 + 30, y, ctx.w - 60, 30, { fill: SCENE_PAPER });
  sRect(ctx, ctx.x0 + 108, y + 4, 52, 22, { fill: SCENE_GREEN, sw: 1.2 });
  sRect(ctx, ctx.x0 + 248, y + 4, 52, 22, { fill: SCENE_GREEN, sw: 1.2 });
  for (const [nx, hit] of [[ctx.x0 + 70, false], [ctx.x0 + 132, true], [ctx.x0 + 210, false], [ctx.x0 + 274, true]] as const) {
    sCircle(ctx, nx, y + 15, 6, { fill: hit ? SCENE_INK : SCENE_SOFT, stroke: hit ? SCENE_INK : SCENE_SOFT, sw: 1 });
  }
  sArrow(ctx, ctx.x0 + 30, y + 62, ctx.x1 - 30, y + 62, { sw: 1.6, stroke: SCENE_SOFT, head: 9 });
}

function scTimingCombo(ctx: SceneCtx): void {
  // 连续命中：三条判定条针都在区内 + 星星连击
  const w = 210;
  const x = ctx.x0 + 40;
  for (let i = 0; i < 3; i++) {
    const y = ctx.y0 + 40 + i * 92;
    gGauge(ctx, x, y, w, 26, x + 118, 48, x + 140);
    gStar(ctx, x + w + 34, y + 13, 13 + i * 3);
    if (i < 2) sLine(ctx, x + w + 34, y + 32, x + w + 34, y + 92 - 16, { stroke: SCENE_SOFT, sw: 1.2, dash: "4 4" });
  }
}

/* ===== pattern（核心循环） ===== */

function scActReflex(ctx: SceneCtx): void {
  // 感知危险 → 快速闪避 → 即时反馈
  gSpike(ctx, ctx.x0 + 78, ctx.cy - 50, 22);
  sMotion(ctx, ctx.x0 + 106, ctx.cy - 50, 22, 1, SCENE_INK);
  sMotion(ctx, ctx.x0 + 110, ctx.cy - 38, 18, 1, SCENE_INK);
  sCircle(ctx, ctx.cx - 6, ctx.cy + 48, 17, { fill: SCENE_YELLOW });
  sArcArrow(ctx, ctx.cx - 6, ctx.cy + 48, 42, Math.PI * 1.1, Math.PI * 1.75, { sw: 2.2 });
  gBurst(ctx, ctx.x1 - 88, ctx.cy - 50, 26);
  gStar(ctx, ctx.x1 - 88, ctx.cy - 50, 14);
}

function scTapFast(ctx: SceneCtx): void {
  sCircle(ctx, ctx.cx, ctx.cy, 42, { fill: SCENE_YELLOW });
  sCircle(ctx, ctx.cx, ctx.cy, 62, { sw: 1.4, stroke: SCENE_SOFT });
  sCircle(ctx, ctx.cx, ctx.cy, 80, { sw: 1.1, stroke: SCENE_SOFT });
  sCircle(ctx, ctx.cx, ctx.cy, 98, { sw: 1, stroke: SCENE_SOFT });
  for (let i = 0; i < 4; i++) {
    const ang = (Math.PI / 2) * i + Math.PI / 4;
    sLine(ctx, ctx.cx + 108 * Math.cos(ang), ctx.cy + 108 * Math.sin(ang), ctx.cx + 122 * Math.cos(ang), ctx.cy + 122 * Math.sin(ang), {
      sw: 2,
    });
  }
}

function scLoopAct(ctx: SceneCtx): void {
  // 动作循环：危险 → 操作 → 反馈
  const r = 96;
  const top: ScenePt = [ctx.cx, ctx.cy - r];
  const right: ScenePt = [ctx.cx + r, ctx.cy + r * 0.62];
  const left: ScenePt = [ctx.cx - r, ctx.cy + r * 0.62];
  sArcArrow(ctx, ctx.cx, ctx.cy, r, -Math.PI / 2 + 0.5, 0.45, { sw: 2.2 });
  sArcArrow(ctx, ctx.cx, ctx.cy, r, 0.6, Math.PI - 0.7, { sw: 2.2 });
  sArcArrow(ctx, ctx.cx, ctx.cy, r, Math.PI - 0.45, Math.PI * 1.5 - 0.55, { sw: 2.2 });
  sCircle(ctx, top[0], top[1], 30, { fill: SCENE_PAPER });
  gSpike(ctx, top[0], top[1], 15);
  sCircle(ctx, right[0], right[1], 30, { fill: SCENE_PAPER });
  gBolt(ctx, right[0], right[1], 26);
  sCircle(ctx, left[0], left[1], 30, { fill: SCENE_PAPER });
  gStar(ctx, left[0], left[1], 15);
}

function scActChain(ctx: SceneCtx): void {
  // 连续反应链：刺激→反应→刺激→反应，逐级升级
  const y1 = ctx.cy - 58;
  const y2 = ctx.cy + 58;
  gSpike(ctx, ctx.x0 + 66, y1, 18);
  sArrow(ctx, ctx.x0 + 96, y1, ctx.cx - 42, y1, { sw: 2 });
  gBurst(ctx, ctx.cx - 12, y1, 24);
  sArrow(ctx, ctx.cx + 16, y1 + 14, ctx.cx + 66, y2 - 16, { sw: 2 });
  gSpike(ctx, ctx.cx + 96, y2, 18);
  sArrow(ctx, ctx.cx + 126, y2, ctx.x1 - 92, y2, { sw: 2 });
  gStar(ctx, ctx.x1 - 62, y2, 20);
}

function scSpBoard(ctx: SceneCtx): void {
  const cell = 54;
  const gx = ctx.cx - cell * 2;
  const gy = ctx.cy - cell * 2;
  gGrid(ctx, gx, gy, 4, 4, cell, { sw: 1.3 });
  gPiece(ctx, gx + cell * 0.5, gy + cell * 2.5, 15, SCENE_BLUE);
  gPieceSquare(ctx, gx + cell * 2.5, gy + cell * 1.5, 26, SCENE_RED);
  sRect(ctx, gx + 3 * cell + 5, gy + 2 * cell + 5, cell - 10, cell - 10, { fill: "#ffe9a8", sw: 1.4 });
}

function scSpPlace(ctx: SceneCtx): void {
  const cell = 64;
  const gx = ctx.cx - cell * 1.5;
  const gy = ctx.cy - cell * 1.5 + 16;
  gGrid(ctx, gx, gy, 3, 3, cell, { sw: 1.3 });
  sRect(ctx, gx + cell + 5, gy + cell + 5, cell - 10, cell - 10, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.6 });
  gPiece(ctx, gx + cell * 1.5, gy - 38, 18, SCENE_BLUE);
  sArrow(ctx, gx + cell * 1.5, gy - 14, gx + cell * 1.5, gy + cell - 24, { sw: 2.5 });
}

function scSpValidate(ctx: SceneCtx): void {
  const cell = 64;
  const gx = ctx.cx - cell * 1.5;
  const gy = ctx.cy - cell * 1.5;
  gGrid(ctx, gx, gy, 3, 3, cell, { sw: 1.3 });
  sRect(ctx, gx + cell + 5, gy + cell + 5, cell - 10, cell - 10, { fill: "#e2f3d8", sw: 1.4 });
  gPiece(ctx, gx + cell * 1.5, gy + cell * 1.5, 18, SCENE_BLUE);
  gCheck(ctx, gx + cell * 1.5 + 24, gy + cell - 14, 20);
  sRect(ctx, gx + 5, gy + 5, cell - 10, cell - 10, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.4 });
  gCross(ctx, gx + cell * 0.5, gy + cell * 0.5, 13);
}

function scSpFill(ctx: SceneCtx): void {
  const cell = 52;
  const gx = ctx.cx - cell * 2;
  const gy = ctx.cy - cell * 2;
  gGrid(ctx, gx, gy, 4, 4, cell, { sw: 1.3 });
  const filled: [number, number, "b" | "r"][] = [
    [0, 0, "b"], [1, 0, "r"], [3, 0, "b"],
    [0, 1, "r"], [2, 1, "b"], [3, 1, "r"],
    [1, 2, "b"], [2, 2, "r"], [3, 2, "b"],
    [0, 3, "b"], [1, 3, "r"], [3, 3, "b"],
  ];
  for (const [c, r, k] of filled) {
    const px = gx + c * cell + cell / 2;
    const py = gy + r * cell + cell / 2;
    if (k === "b") gPiece(ctx, px, py, 13, SCENE_BLUE);
    else gPieceSquare(ctx, px, py, 22, SCENE_RED);
  }
  sRect(ctx, gx + 2 * cell + 5, gy + 5, cell - 10, cell - 10, { fill: "#ffe9a8", sw: 1.4 });
  gSparkle(ctx, gx + 2 * cell + cell / 2, gy + cell / 2, 12);
}

function scMgmtBase(ctx: SceneCtx): void {
  const base = ctx.y1 - 34;
  sLine(ctx, ctx.x0 + 20, base, ctx.x1 - 20, base, { sw: 2 });
  gHouse(ctx, ctx.cx - 100, base, 72, 56);
  gBox(ctx, ctx.cx + 92, base - 18, 30);
  gBox(ctx, ctx.cx + 126, base - 16, 26);
  gBox(ctx, ctx.cx + 108, base - 46, 24);
  sArrow(ctx, ctx.cx - 50, base - 30, ctx.cx + 52, base - 30, { sw: 2, dash: "7 5" });
  sCircle(ctx, ctx.cx, base - 30, 8, { fill: SCENE_YELLOW });
}

function scMgmtBuild(ctx: SceneCtx): void {
  const base = ctx.y1 - 36;
  sLine(ctx, ctx.x0 + 40, base, ctx.x1 - 40, base, { sw: 2 });
  // 虚线建筑轮廓（在建）
  sRect(ctx, ctx.cx - 52, base - 64, 104, 64, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.8 });
  sOpenPath(ctx, [[ctx.cx - 60, base - 64], [ctx.cx, base - 108], [ctx.cx + 60, base - 64]], { dash: "6 5", stroke: SCENE_SOFT, sw: 1.8 });
  gHammer(ctx, ctx.cx + 84, base - 96, 64);
  sRect(ctx, ctx.cx - 78, base - 22, 30, 20, { fill: SCENE_HATCH });
  sRect(ctx, ctx.cx - 46, base - 20, 26, 18, { fill: SCENE_HATCH });
}

function scMgmtFlow(ctx: SceneCtx): void {
  const y = ctx.cy;
  const x1 = ctx.x0 + 88;
  const x2 = ctx.cx;
  const x3 = ctx.x1 - 88;
  sArrow(ctx, x1 + 44, y, x2 - 48, y, { sw: 2.2 });
  sArrow(ctx, x2 + 48, y, x3 - 44, y, { sw: 2.2 });
  sCircle(ctx, x1, y, 32, { fill: SCENE_PAPER });
  gTree(ctx, x1, y + 18, 32);
  sCircle(ctx, x2, y, 32, { fill: SCENE_PAPER });
  gHouse(ctx, x2, y + 16, 34, 24);
  sCircle(ctx, x3, y, 32, { fill: SCENE_PAPER });
  gBox(ctx, x3, y, 26);
  sCircle(ctx, (x1 + x2) / 2, y - 4, 6, { fill: SCENE_YELLOW });
  sCircle(ctx, (x2 + x3) / 2, y - 4, 6, { fill: SCENE_YELLOW });
}

function scMgmtExpand(ctx: SceneCtx): void {
  const base = ctx.y1 - 34;
  sLine(ctx, ctx.x0 + 16, base, ctx.x1 - 16, base, { sw: 2 });
  gHouse(ctx, ctx.x0 + 92, base, 52, 40);
  gTree(ctx, ctx.x0 + 148, base, 30);
  sArrow(ctx, ctx.cx - 34, base - 60, ctx.cx + 30, base - 60, { sw: 2.5 });
  gHouse(ctx, ctx.x1 - 128, base, 62, 50);
  gTower(ctx, ctx.x1 - 60, base, 30, 44);
  gFlag(ctx, ctx.x1 - 44, base - 44 - 24, 34);
  gSparkle(ctx, ctx.x1 - 96, base - 108, 10);
}

function scStratFormation(ctx: SceneCtx): void {
  const ys = [ctx.cy - 72, ctx.cy, ctx.cy + 72];
  for (const y of ys) {
    gPiece(ctx, ctx.cx - 128, y, 18, SCENE_BLUE);
    gPieceSquare(ctx, ctx.cx + 128, y, 30, SCENE_RED);
  }
  gBurst(ctx, ctx.cx, ctx.cy, 30);
  sArrow(ctx, ctx.cx - 102, ctx.cy, ctx.cx - 44, ctx.cy, { sw: 2 });
  sArrow(ctx, ctx.cx + 102, ctx.cy, ctx.cx + 44, ctx.cy, { sw: 2 });
}

function scStratArrange(ctx: SceneCtx): void {
  const y = ctx.cy + 42;
  gPiece(ctx, ctx.cx - 96, y, 18, SCENE_BLUE);
  gPiece(ctx, ctx.cx - 24, y, 18, SCENE_BLUE);
  gPiece(ctx, ctx.cx + 48, y, 18, SCENE_BLUE);
  // 侧翼机动：末尾棋子绕到上方虚线位
  sCircle(ctx, ctx.cx + 116, y - 88, 18, { dash: "5 4", stroke: SCENE_SOFT, sw: 1.6 });
  sCurve(ctx, [[ctx.cx + 48, y - 22], [ctx.cx + 96, y - 40], [ctx.cx + 116, y - 62]], { sw: 2, dash: "7 5" });
  arrowHead(ctx, ctx.cx + 116, y - 64, -Math.PI / 2, 11, {});
  gPieceSquare(ctx, ctx.cx + 132, y, 30, SCENE_RED);
}

function scStratResolve(ctx: SceneCtx): void {
  sArrow(ctx, ctx.x0 + 66, ctx.cy - 10, ctx.cx - 46, ctx.cy - 10, { sw: 2.5 });
  sArrow(ctx, ctx.x1 - 66, ctx.cy - 10, ctx.cx + 46, ctx.cy - 10, { sw: 2.5 });
  gBurst(ctx, ctx.cx, ctx.cy - 10, 34);
  // 一方倒地（旋转方块）
  const bx = ctx.cx + 108;
  const by = ctx.cy + 74;
  const pts = rotPts(bx, by, [[bx - 15, by - 15], [bx + 15, by - 15], [bx + 15, by + 15], [bx - 15, by + 15]], 42);
  sPoly(ctx, pts, { fill: SCENE_RED });
  sMotion(ctx, bx - 40, by - 20, 18, -1);
  gStar(ctx, ctx.cx - 104, ctx.cy + 62, 16);
}

function scStratTree(ctx: SceneCtx): void {
  // 升级树：基础单位 → 剑/盾分支 → 星
  gPiece(ctx, ctx.cx, ctx.y1 - 46, 20, SCENE_BLUE);
  sArrow(ctx, ctx.cx - 16, ctx.y1 - 74, ctx.cx - 74, ctx.cy - 6, { sw: 2 });
  sArrow(ctx, ctx.cx + 16, ctx.y1 - 74, ctx.cx + 74, ctx.cy - 6, { sw: 2 });
  sCircle(ctx, ctx.cx - 92, ctx.cy - 22, 28, { fill: SCENE_PAPER });
  sLine(ctx, ctx.cx - 104, ctx.cy - 10, ctx.cx - 80, ctx.cy - 34, { sw: 3 });
  sLine(ctx, ctx.cx - 108, ctx.cy - 20, ctx.cx - 96, ctx.cy - 8, { sw: 2 });
  sCircle(ctx, ctx.cx + 92, ctx.cy - 22, 28, { fill: SCENE_PAPER });
  sRect(ctx, ctx.cx + 80, ctx.cy - 36, 24, 28, { fill: SCENE_BLUE });
  sArrow(ctx, ctx.cx - 80, ctx.cy - 52, ctx.cx - 24, ctx.y0 + 66, { sw: 2 });
  sArrow(ctx, ctx.cx + 80, ctx.cy - 52, ctx.cx + 24, ctx.y0 + 66, { sw: 2 });
  gStar(ctx, ctx.cx, ctx.y0 + 52, 22);
}

function scNarTree(ctx: SceneCtx): void {
  const rx = ctx.x0 + 66;
  sCircle(ctx, rx, ctx.cy, 15, { fill: SCENE_PAPER });
  const m1: ScenePt = [ctx.cx - 8, ctx.cy - 74];
  const m2: ScenePt = [ctx.cx - 8, ctx.cy + 74];
  sArrow(ctx, rx + 20, ctx.cy - 8, m1[0] - 22, m1[1] + 8, { sw: 2 });
  sArrow(ctx, rx + 20, ctx.cy + 8, m2[0] - 22, m2[1] - 8, { sw: 2 });
  sCircle(ctx, m1[0], m1[1], 15, { fill: SCENE_PAPER });
  sCircle(ctx, m2[0], m2[1], 15, { fill: SCENE_PAPER });
  const ex = ctx.x1 - 78;
  sArrow(ctx, m1[0] + 18, m1[1] - 6, ex - 28, ctx.y0 + 58, { sw: 1.8 });
  sArrow(ctx, m1[0] + 18, m1[1] + 6, ex - 28, ctx.cy - 18, { sw: 1.8 });
  sArrow(ctx, m2[0] + 18, m2[1], ex - 28, ctx.y1 - 56, { sw: 1.8 });
  gStar(ctx, ex, ctx.y0 + 50, 16);
  gSkull(ctx, ex, ctx.cy - 16, 30);
  gCoin(ctx, ex, ctx.y1 - 52, 15);
}

function scNarChoice(ctx: SceneCtx): void {
  gCard(ctx, ctx.cx - 86, ctx.cy - 6, 92, 118, -4, SCENE_YELLOW);
  gCard(ctx, ctx.cx + 86, ctx.cy + 10, 92, 118, 3, SCENE_PAPER);
  sCircle(ctx, ctx.cx - 86, ctx.cy - 6, 58, { sw: 1.2, stroke: SCENE_SOFT });
  gSparkle(ctx, ctx.cx - 40, ctx.cy - 84, 10);
}

function scNarConsequence(ctx: SceneCtx): void {
  const y = ctx.cy;
  const s = 34;
  sPoly(ctx, [[ctx.x0 + 78, y - s], [ctx.x0 + 78 + s, y], [ctx.x0 + 78, y + s], [ctx.x0 + 78 - s, y]], { fill: SCENE_YELLOW });
  sArrow(ctx, ctx.x0 + 78 + s + 14, y, ctx.cx - 36, y, { sw: 2.2 });
  gBurst(ctx, ctx.cx, y, 26);
  sArrow(ctx, ctx.cx + 36, y, ctx.x1 - 110, y, { sw: 2.2 });
  gSkull(ctx, ctx.x1 - 72, y, 36);
}

function scNarEndings(ctx: SceneCtx): void {
  const rx = ctx.x0 + 58;
  sCircle(ctx, rx, ctx.cy, 13, { fill: SCENE_PAPER });
  const m1: ScenePt = [ctx.cx - 32, ctx.cy - 88];
  const m2: ScenePt = [ctx.cx - 32, ctx.cy + 88];
  sArrow(ctx, rx + 18, ctx.cy - 6, m1[0] - 20, m1[1] + 6, { sw: 1.8 });
  sArrow(ctx, rx + 18, ctx.cy + 6, m2[0] - 20, m2[1] - 6, { sw: 1.8 });
  sCircle(ctx, m1[0], m1[1], 13, { fill: SCENE_PAPER });
  sCircle(ctx, m2[0], m2[1], 13, { fill: SCENE_PAPER });
  const ex = ctx.x1 - 64;
  const ends: [number, "star" | "coin" | "skull" | "flag"][] = [[ctx.y0 + 44, "star"], [ctx.cy - 26, "coin"], [ctx.cy + 30, "skull"], [ctx.y1 - 40, "flag"]];
  sArrow(ctx, m1[0] + 16, m1[1] - 6, ex - 24, ends[0][0], { sw: 1.6 });
  sArrow(ctx, m1[0] + 16, m1[1] + 6, ex - 24, ends[1][0], { sw: 1.6 });
  sArrow(ctx, m2[0] + 16, m2[1] - 6, ex - 24, ends[2][0], { sw: 1.6 });
  sArrow(ctx, m2[0] + 16, m2[1] + 6, ex - 24, ends[3][0], { sw: 1.6 });
  for (const [ey, kind] of ends) {
    if (kind === "star") gStar(ctx, ex, ey, 15);
    if (kind === "coin") gCoin(ctx, ex, ey, 13);
    if (kind === "skull") gSkull(ctx, ex, ey, 26);
    if (kind === "flag") gFlag(ctx, ex - 6, ey + 14, 30);
  }
}

/* ===== feature（玩法特征） ===== */

function gCoinStack(ctx: SceneCtx, cx: number, baseY: number, count: number, r = 14): void {
  for (let i = 0; i < count; i++) {
    gCoin(ctx, cx, baseY - i * r * 1.1, r);
  }
}

function scIdleCoins(ctx: SceneCtx): void {
  gClock(ctx, ctx.cx - 92, ctx.cy - 10, 46);
  gCoinStack(ctx, ctx.cx + 62, ctx.y1 - 48, 3);
  gCoinStack(ctx, ctx.cx + 124, ctx.y1 - 48, 5);
  sArrow(ctx, ctx.cx - 20, ctx.cy + 4, ctx.cx + 22, ctx.cy + 4, { sw: 2, stroke: SCENE_SOFT, head: 9 });
}

function scIdleCollect(ctx: SceneCtx): void {
  gCoinStack(ctx, ctx.cx, ctx.y1 - 44, 4, 16);
  gCoin(ctx, ctx.cx - 40, ctx.y1 - 52, 13);
  gCoin(ctx, ctx.cx + 42, ctx.y1 - 58, 13);
  sCircle(ctx, ctx.cx, ctx.cy - 38, 18, { fill: SCENE_YELLOW });
  sCircle(ctx, ctx.cx, ctx.cy - 38, 30, { sw: 1.2, stroke: SCENE_SOFT });
  sCircle(ctx, ctx.cx, ctx.cy - 38, 42, { sw: 1, stroke: SCENE_SOFT });
  sArrow(ctx, ctx.cx, ctx.cy - 12, ctx.cx, ctx.y1 - 108, { sw: 2, stroke: SCENE_SOFT, head: 9 });
}

function scIdleOffline(ctx: SceneCtx): void {
  gMoon(ctx, ctx.x0 + 92, ctx.y0 + 68, 34);
  gCoinStack(ctx, ctx.cx - 30, ctx.y1 - 42, 2);
  gCoinStack(ctx, ctx.cx + 42, ctx.y1 - 42, 4);
  gCoinStack(ctx, ctx.cx + 116, ctx.y1 - 42, 6);
  sArrow(ctx, ctx.x1 - 66, ctx.y1 - 96, ctx.x1 - 66, ctx.y1 - 150, { sw: 2.2, stroke: SCENE_GREEN });
}

function scIdleMulti(ctx: SceneCtx): void {
  const base = ctx.y1 - 44;
  for (const gx of [ctx.x0 + 92, ctx.cx, ctx.x1 - 92]) {
    gHouse(ctx, gx, ctx.y0 + 96, 52, 38);
    gCoin(ctx, gx, ctx.y0 + 34, 11);
    sArrow(ctx, gx, ctx.y0 + 104, ctx.cx + (gx > ctx.cx ? 30 : gx < ctx.cx ? -30 : 0), base - 44, { sw: 1.6, stroke: SCENE_SOFT, head: 8 });
  }
  gCoinStack(ctx, ctx.cx, base, 4, 17);
  gSparkle(ctx, ctx.cx + 52, base - 60, 11);
}

function scClickTarget(ctx: SceneCtx): void {
  sCircle(ctx, ctx.cx, ctx.cy, 46, { fill: SCENE_YELLOW });
  sCircle(ctx, ctx.cx, ctx.cy, 32, { sw: 1.5 });
  sCircle(ctx, ctx.cx, ctx.cy, 66, { sw: 1.2, stroke: SCENE_SOFT });
  sCircle(ctx, ctx.cx, ctx.cy, 84, { sw: 1, stroke: SCENE_SOFT });
}

function scClickTap(ctx: SceneCtx): void {
  sCircle(ctx, ctx.cx, ctx.cy + 34, 44, { fill: SCENE_YELLOW });
  sArrow(ctx, ctx.cx, ctx.cy - 66, ctx.cx, ctx.cy - 22, { sw: 2.5 });
  sCircle(ctx, ctx.cx, ctx.cy - 84, 16, { fill: SCENE_PAPER });
  gBurst(ctx, ctx.cx, ctx.cy - 6, 20);
}

function scClickReward(ctx: SceneCtx): void {
  sCircle(ctx, ctx.cx, ctx.cy + 52, 44, { fill: SCENE_YELLOW });
  sCircle(ctx, ctx.cx, ctx.cy + 52, 31, { sw: 1.5 });
  gCoin(ctx, ctx.cx, ctx.cy - 66, 17);
  sMotion(ctx, ctx.cx - 8, ctx.cy - 42, 14, -1);
  sMotion(ctx, ctx.cx + 8, ctx.cy - 36, 12, -1);
  gSparkle(ctx, ctx.cx + 44, ctx.cy - 88, 11);
}

function scClickFrenzy(ctx: SceneCtx): void {
  sCircle(ctx, ctx.cx - 66, ctx.cy + 40, 42, { fill: SCENE_YELLOW });
  sCircle(ctx, ctx.cx - 66, ctx.cy + 40, 62, { sw: 1.2, stroke: SCENE_SOFT });
  const coins: [number, number][] = [[ctx.cx + 40, ctx.cy - 70], [ctx.cx + 96, ctx.cy - 30], [ctx.cx + 66, ctx.cy + 22], [ctx.cx + 128, ctx.cy - 84], [ctx.cx + 20, ctx.cy - 16]];
  for (const [px, py] of coins) {
    gCoin(ctx, px, py, 13);
    sMotion(ctx, px - 16, py + 12, 12, -1);
  }
  gStar(ctx, ctx.cx + 140, ctx.cy + 34, 15);
}

function scGridBoard(ctx: SceneCtx): void {
  const cell = 56;
  const gx = ctx.cx - cell * 2;
  const gy = ctx.cy - cell * 2;
  gGrid(ctx, gx, gy, 4, 4, cell, { sw: 1.3 });
  gPiece(ctx, gx + cell * 1.5, gy + cell * 1.5, 15, SCENE_BLUE);
  gPieceSquare(ctx, gx + cell * 2.5, gy + cell * 2.5, 24, SCENE_RED);
  sRect(ctx, gx + 5, gy + 3 * cell + 5, cell - 10, cell - 10, { fill: "#ffe9a8", sw: 1.4 });
}

function scGridMove(ctx: SceneCtx): void {
  const cell = 56;
  const gx = ctx.cx - cell * 2;
  const gy = ctx.cy - cell * 2;
  gGrid(ctx, gx, gy, 4, 4, cell, { sw: 1.3 });
  gPiece(ctx, gx + cell * 1.5, gy + cell * 2.5, 15, SCENE_BLUE);
  sRect(ctx, gx + 2 * cell + 5, gy + 2 * cell + 5, cell - 10, cell - 10, { fill: "#ffe9a8", sw: 1.4 });
  sArrow(ctx, gx + cell * 1.5 + 20, gy + cell * 2.5, gx + cell * 2.5 - 20, gy + cell * 2.5, { sw: 2.5 });
}

function scGridValid(ctx: SceneCtx): void {
  const cell = 64;
  const gx = ctx.cx - cell * 1.5;
  const gy = ctx.cy - cell * 1.5;
  gGrid(ctx, gx, gy, 3, 3, cell, { sw: 1.3 });
  gPiece(ctx, gx + cell * 1.5, gy + cell * 1.5, 17, SCENE_BLUE);
  sCircle(ctx, gx + cell * 1.5, gy + cell * 1.5, 24, { sw: 2, stroke: SCENE_INK });
  // 上下左右可走格（点状高亮）
  for (const [c, r] of [[1, 0], [0, 1], [2, 1], [1, 2]] as const) {
    sRect(ctx, gx + c * cell + 6, gy + r * cell + 6, cell - 12, cell - 12, { dash: "5 4", stroke: SCENE_GREEN, sw: 1.6 });
    sCircle(ctx, gx + c * cell + cell / 2, gy + r * cell + cell / 2, 5, { fill: SCENE_GREEN, stroke: SCENE_GREEN, sw: 1 });
  }
}

function scGridPath(ctx: SceneCtx): void {
  const cell = 50;
  const gx = ctx.cx - cell * 2.5;
  const gy = ctx.cy - cell * 2;
  gGrid(ctx, gx, gy, 5, 4, cell, { sw: 1.3 });
  const pts: ScenePt[] = [
    [gx + cell * 0.5, gy + cell * 3.5],
    [gx + cell * 0.5, gy + cell * 2.5],
    [gx + cell * 1.5, gy + cell * 2.5],
    [gx + cell * 1.5, gy + cell * 1.5],
    [gx + cell * 3.5, gy + cell * 1.5],
    [gx + cell * 3.5, gy + cell * 0.5],
    [gx + cell * 4.5, gy + cell * 0.5],
  ];
  sDots(ctx, pts, 13, 2.6, SCENE_INK);
  sCircle(ctx, gx + cell * 0.5, gy + cell * 3.5, 10, { fill: SCENE_GREEN });
  gStar(ctx, gx + cell * 4.5, gy + cell * 0.5, 16);
}

function scLevelsPath(ctx: SceneCtx): void {
  const nodes: ScenePt[] = [[ctx.x0 + 72, ctx.y1 - 52], [ctx.cx - 52, ctx.cy + 10], [ctx.cx + 52, ctx.cy + 44], [ctx.x1 - 92, ctx.y0 + 72]];
  sCurve(ctx, nodes, { sw: 2, stroke: SCENE_SOFT, dash: "7 5" });
  nodes.forEach(([nx, ny], i) => {
    if (i === nodes.length - 1) {
      sCircle(ctx, nx, ny, 20, { fill: SCENE_PAPER });
      gFlag(ctx, nx + 4, ny - 12, 30);
    } else {
      sCircle(ctx, nx, ny, 20, { fill: i === 0 ? SCENE_GREEN : SCENE_PAPER });
      if (i === 0) gCheck(ctx, nx, ny, 18);
      else sCircle(ctx, nx, ny, 6, { fill: SCENE_INK, stroke: SCENE_INK });
    }
  });
}

function scLevelsEnter(ctx: SceneCtx): void {
  const y = ctx.cy;
  const xs = [ctx.cx - 100, ctx.cx, ctx.cx + 100];
  sCurve(ctx, [[xs[0] + 22, y], [xs[1] - 22, y]], { sw: 1.8, stroke: SCENE_SOFT });
  sCurve(ctx, [[xs[1] + 22, y], [xs[2] - 22, y]], { sw: 1.8, stroke: SCENE_SOFT });
  sArrow(ctx, xs[0] - 78, y, xs[0] - 26, y, { sw: 2.5 });
  xs.forEach((nx, i) => {
    sCircle(ctx, nx, y, 20, { fill: i === 0 ? SCENE_YELLOW : SCENE_PAPER });
    if (i > 0) sCircle(ctx, nx, y, 6, { fill: SCENE_INK, stroke: SCENE_INK });
  });
  gSparkle(ctx, xs[0], y - 34, 10);
}

function scLevelsGate(ctx: SceneCtx): void {
  const y = ctx.cy;
  const xs = [ctx.cx - 110, ctx.cx, ctx.cx + 110];
  sCurve(ctx, [[xs[0] + 22, y], [xs[1] - 22, y]], { sw: 1.8, stroke: SCENE_SOFT });
  sCurve(ctx, [[xs[1] + 22, y], [xs[2] - 22, y]], { sw: 1.8, stroke: SCENE_SOFT });
  sCircle(ctx, xs[0], y, 21, { fill: SCENE_GREEN });
  gCheck(ctx, xs[0], y, 19);
  sCircle(ctx, xs[1], y, 21, { fill: SCENE_YELLOW });
  sCircle(ctx, xs[1], y, 6, { fill: SCENE_INK, stroke: SCENE_INK });
  sCircle(ctx, xs[2], y, 21, { fill: SCENE_PAPER });
  gLock(ctx, xs[2], y, 24);
}

function scLevelsBranch(ctx: SceneCtx): void {
  const sx = ctx.x0 + 70;
  const ex = ctx.x1 - 96;
  sCircle(ctx, sx, ctx.cy, 18, { fill: SCENE_PAPER });
  sCurve(ctx, [[sx + 20, ctx.cy - 4], [ctx.cx - 40, ctx.cy - 30], [ctx.cx - 6, ctx.cy - 78]], { sw: 1.8 });
  sCurve(ctx, [[sx + 20, ctx.cy + 4], [ctx.cx - 40, ctx.cy + 30], [ctx.cx - 6, ctx.cy + 78]], { sw: 1.8 });
  sCircle(ctx, ctx.cx, ctx.cy - 82, 17, { fill: SCENE_YELLOW });
  sCircle(ctx, ctx.cx, ctx.cy + 82, 17, { fill: SCENE_PAPER });
  sCurve(ctx, [[ctx.cx + 18, ctx.cy - 78], [ctx.cx + 46, ctx.cy - 30], [ex - 22, ctx.cy - 4]], { sw: 1.8 });
  sCurve(ctx, [[ctx.cx + 18, ctx.cy + 78], [ctx.cx + 46, ctx.cy + 30], [ex - 22, ctx.cy + 4]], { sw: 1.8 });
  sCircle(ctx, ex, ctx.cy, 18, { fill: SCENE_PAPER });
  gFlag(ctx, ex + 4, ctx.cy - 10, 28);
}

function scNumBars(ctx: SceneCtx): void {
  const base = ctx.y1 - 32;
  gBars(ctx, ctx.cx - 116, base, 52, 34, [70, 122, 180]);
  sCurve(ctx, [[ctx.cx - 104, base - 92], [ctx.cx - 20, base - 130], [ctx.cx + 118, base - 196]], { sw: 2.5 });
  arrowHead(ctx, ctx.cx + 120, base - 198, Math.atan2(-64, 128), 13, {});
}

function scNumUpgrade(ctx: SceneCtx): void {
  const base = ctx.y1 - 36;
  sRect(ctx, ctx.cx - 118, base - 76, 56, 76, { fill: SCENE_BLUE });
  sRect(ctx, ctx.cx + 62, base - 132, 56, 132, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.8 });
  sRect(ctx, ctx.cx + 62, base - 76, 56, 76, { fill: SCENE_BLUE });
  sArrow(ctx, ctx.cx - 48, base - 60, ctx.cx + 48, base - 112, { sw: 2.5 });
  gCoin(ctx, ctx.cx + 4, base + 2, 13);
  sArrow(ctx, ctx.cx + 4, base - 16, ctx.cx + 4, base - 52, { sw: 1.8, stroke: SCENE_SOFT, head: 8 });
}

function scNumCurve(ctx: SceneCtx): void {
  const base = ctx.y1 - 30;
  gBars(ctx, ctx.x0 + 48, base, 40, 24, [42, 62, 92, 130, 176]);
  sCurve(ctx, [[ctx.x0 + 62, base - 56], [ctx.cx - 10, base - 96], [ctx.x1 - 84, base - 192]], { sw: 2.5 });
  arrowHead(ctx, ctx.x1 - 82, base - 194, Math.atan2(-92, 120), 12, {});
  gStar(ctx, ctx.x0 + 48 + 4 * 64 + 20, base - 176 - 20, 15);
}

function scNumPrestige(ctx: SceneCtx): void {
  const base = ctx.y1 - 30;
  gBars(ctx, ctx.x0 + 44, base, 36, 20, [96, 142, 188]);
  gBars(ctx, ctx.x1 - 176, base, 36, 20, [40, 62]);
  gStar(ctx, ctx.x1 - 118, base - 96, 19);
  sArcArrow(ctx, ctx.cx + 10, ctx.cy + 16, 108, Math.PI * 1.08, Math.PI * 1.86, { sw: 2.2 });
}

function scGenDice(ctx: SceneCtx): void {
  gDice(ctx, ctx.x0 + 88, ctx.cy, 58);
  sArrow(ctx, ctx.x0 + 136, ctx.cy, ctx.cx - 12, ctx.cy, { sw: 2.5 });
  const mx = ctx.cx + 14;
  const my = ctx.cy - 88;
  const mw = ctx.x1 - mx - 8;
  const mh = 176;
  sRect(ctx, mx, my, mw, mh, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.6 });
  gTree(ctx, mx + 40, my + 66, 30);
  gMountain(ctx, mx + mw - 48, my + 82, 34);
  for (const [wx, wy] of [[mx + 52, my + mh - 34], [mx + 84, my + mh - 26], [mx + mw - 60, my + mh - 38]] as const) {
    sCircle(ctx, wx, wy, 5, { fill: SCENE_BLUE, stroke: SCENE_BLUE, sw: 1 });
  }
  gTree(ctx, mx + mw - 96, my + mh - 40, 24);
}

function scGenRoll(ctx: SceneCtx): void {
  gDice(ctx, ctx.cx, ctx.cy, 72, 10);
  sArcArrow(ctx, ctx.cx, ctx.cy, 66, Math.PI * 0.75, Math.PI * 1.35, { sw: 2, stroke: SCENE_SOFT });
  sArcArrow(ctx, ctx.cx, ctx.cy, 66, -Math.PI * 0.25, Math.PI * 0.32, { sw: 2, stroke: SCENE_SOFT });
  gSparkle(ctx, ctx.cx - 96, ctx.cy - 62, 12);
  gSparkle(ctx, ctx.cx + 98, ctx.cy + 56, 10);
}

function scGenVariety(ctx: SceneCtx): void {
  // 同一骰子，两种地图产出
  const mw = 138;
  const mh = 128;
  const y = ctx.cy - 30;
  const x1 = ctx.cx - mw - 34;
  const x2 = ctx.cx + 34;
  sRect(ctx, x1, y, mw, mh, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.5 });
  sRect(ctx, x2, y, mw, mh, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.5 });
  gTree(ctx, x1 + 36, y + 56, 26);
  gMountain(ctx, x1 + mw - 40, y + 66, 28);
  sCircle(ctx, x1 + 52, y + mh - 26, 5, { fill: SCENE_BLUE, stroke: SCENE_BLUE, sw: 1 });
  gMountain(ctx, x2 + 40, y + 62, 28);
  gTree(ctx, x2 + mw - 38, y + 52, 26);
  gTree(ctx, x2 + 66, y + mh - 30, 22);
  gDice(ctx, ctx.cx, ctx.y0 + 40, 34);
  sArrow(ctx, ctx.cx - 12, ctx.y0 + 58, x1 + mw / 2, y - 8, { sw: 1.8, head: 9 });
  sArrow(ctx, ctx.cx + 12, ctx.y0 + 58, x2 + mw / 2, y - 8, { sw: 1.8, head: 9 });
}

function scGenBiome(ctx: SceneCtx): void {
  const mx = ctx.x0 + 30;
  const my = ctx.cy - 82;
  const mw = ctx.w - 60;
  const mh = 164;
  sRect(ctx, mx, my, mw, mh, { dash: "6 5", stroke: SCENE_SOFT, sw: 1.6 });
  sLine(ctx, mx + mw / 3, my, mx + mw / 3, my + mh, { dash: "5 6", stroke: SCENE_SOFT, sw: 1.2 });
  sLine(ctx, mx + (mw * 2) / 3, my, mx + (mw * 2) / 3, my + mh, { dash: "5 6", stroke: SCENE_SOFT, sw: 1.2 });
  // 水域 / 森林 / 山地
  for (const [wx, wy] of [[mx + 34, my + 50], [mx + 66, my + 84], [mx + 30, my + 116], [mx + 70, my + 132]] as const) {
    sCircle(ctx, wx, wy, 6, { fill: SCENE_BLUE, stroke: SCENE_BLUE, sw: 1 });
  }
  gTree(ctx, mx + mw / 3 + 40, my + 78, 30);
  gTree(ctx, mx + mw / 3 + 84, my + 118, 24);
  gMountain(ctx, mx + (mw * 2) / 3 + 44, my + 96, 34);
  gMountain(ctx, mx + (mw * 2) / 3 + 92, my + 108, 26);
}

function scRogueMap(ctx: SceneCtx): void {
  // 地牢房间网络：入口 → 岔路 → 骷髅房
  const rooms: [number, number][] = [[ctx.x0 + 70, ctx.y1 - 70], [ctx.cx - 62, ctx.cy + 10], [ctx.cx + 30, ctx.cy + 74], [ctx.cx + 44, ctx.cy - 62], [ctx.x1 - 82, ctx.y0 + 84]];
  sCurve(ctx, [rooms[0], rooms[1]], { sw: 1.8, stroke: SCENE_SOFT });
  sCurve(ctx, [rooms[1], rooms[2]], { sw: 1.8, stroke: SCENE_SOFT });
  sCurve(ctx, [rooms[1], rooms[3]], { sw: 1.8, stroke: SCENE_SOFT });
  sCurve(ctx, [rooms[3], rooms[4]], { sw: 1.8, stroke: SCENE_SOFT });
  sCurve(ctx, [rooms[2], rooms[4]], { sw: 1.8, stroke: SCENE_SOFT, dash: "5 5" });
  rooms.forEach(([rx, ry], i) => {
    if (i === rooms.length - 1) {
      sRect(ctx, rx - 26, ry - 26, 52, 52, { fill: SCENE_PAPER, sw: 2.2 });
      gSkull(ctx, rx, ry, 26);
    } else {
      sRect(ctx, rx - 20, ry - 20, 40, 40, { fill: i === 0 ? SCENE_YELLOW : SCENE_PAPER });
    }
  });
  sCircle(ctx, rooms[0][0], rooms[0][1], 6, { fill: SCENE_INK, stroke: SCENE_INK });
}

function scRogueDoor(ctx: SceneCtx): void {
  const base = ctx.y1 - 44;
  for (const [dx, hot] of [[ctx.cx - 92, true], [ctx.cx + 92, false]] as const) {
    const w = 74;
    const h = 108;
    sLine(ctx, dx - w / 2, base, dx - w / 2, base - h * 0.6, { sw: 2.2 });
    sLine(ctx, dx + w / 2, base, dx + w / 2, base - h * 0.6, { sw: 2.2 });
    scenePush(ctx, ctx.gen.arc(dx, base - h * 0.6, w, h * 0.8, Math.PI, Math.PI * 2, false, { stroke: SCENE_INK, strokeWidth: 2.2 }), {});
    if (hot) {
      sRect(ctx, dx - w / 2 + 8, base - h * 0.52, w - 16, h * 0.52, { fill: "#ffe9a8", sw: 1 });
      sArrow(ctx, dx - 84, base - 40, dx - 50, base - 40, { sw: 2.5 });
    } else {
      sRect(ctx, dx - w / 2 + 8, base - h * 0.52, w - 16, h * 0.52, { fill: SCENE_HATCH, fillStyle: "hachure", sw: 1 });
      gSkull(ctx, dx, base - h - 6, 22);
    }
  }
}

function scRogueDeath(ctx: SceneCtx): void {
  gFlag(ctx, ctx.x0 + 84, ctx.y1 - 60, 40, SCENE_GREEN);
  sArrow(ctx, ctx.x0 + 108, ctx.y1 - 66, ctx.cx - 30, ctx.cy + 40, { sw: 2 });
  gSkull(ctx, ctx.x1 - 92, ctx.y0 + 84, 40);
  sCurve(ctx, [[ctx.cx - 20, ctx.cy + 30], [ctx.cx + 40, ctx.cy - 20], [ctx.x1 - 112, ctx.y0 + 96]], { sw: 2 });
  arrowHead(ctx, ctx.x1 - 110, ctx.y0 + 97, Math.atan2(-(ctx.cy - 20 - (ctx.y0 + 96)), ctx.x1 - 112 - (ctx.cx + 40)), 11, {});
  // 死亡回到起点的大回环
  sArcArrow(ctx, ctx.cx, ctx.cy, 128, -0.4, Math.PI * 0.88, { sw: 2.2, stroke: SCENE_SOFT });
}

function scRogueMeta(ctx: SceneCtx): void {
  gSkull(ctx, ctx.x0 + 88, ctx.cy, 40);
  sArrow(ctx, ctx.x0 + 128, ctx.cy, ctx.cx + 20, ctx.cy, { sw: 2.5 });
  gStar(ctx, ctx.x1 - 96, ctx.cy - 8, 26);
  sArrow(ctx, ctx.x1 - 96, ctx.cy + 40, ctx.x1 - 96, ctx.cy + 78, { sw: 2, stroke: SCENE_GREEN, head: 9 });
  gSparkle(ctx, ctx.x1 - 52, ctx.cy - 44, 11);
}

function scSmStates(ctx: SceneCtx): void {
  const r = 96;
  const top: ScenePt = [ctx.cx, ctx.cy - r + 10];
  const left: ScenePt = [ctx.cx - r - 12, ctx.cy + r * 0.62];
  const right: ScenePt = [ctx.cx + r + 12, ctx.cy + r * 0.62];
  sArcArrow(ctx, ctx.cx, ctx.cy, r, -Math.PI / 2 + 0.52, -0.62, { sw: 2.2 });
  sArcArrow(ctx, ctx.cx, ctx.cy, r, 0.72, Math.PI - 0.72, { sw: 2.2 });
  sArcArrow(ctx, ctx.cx, ctx.cy, r, Math.PI + 0.62, Math.PI * 1.5 - 0.52, { sw: 2.2 });
  sCircle(ctx, top[0], top[1], 26, { fill: SCENE_YELLOW });
  sCircle(ctx, left[0], left[1], 26, { fill: SCENE_PAPER });
  sCircle(ctx, right[0], right[1], 26, { fill: SCENE_PAPER });
  sCircle(ctx, top[0], top[1], 8, { fill: SCENE_INK, stroke: SCENE_INK });
  sCircle(ctx, left[0], left[1], 8, { fill: SCENE_INK, stroke: SCENE_INK });
  sCircle(ctx, right[0], right[1], 8, { fill: SCENE_INK, stroke: SCENE_INK });
}

function scSmEvent(ctx: SceneCtx): void {
  sCircle(ctx, ctx.x0 + 88, ctx.cy, 28, { fill: SCENE_PAPER });
  sCircle(ctx, ctx.x0 + 88, ctx.cy, 9, { fill: SCENE_INK, stroke: SCENE_INK });
  sCircle(ctx, ctx.x1 - 88, ctx.cy, 28, { fill: SCENE_YELLOW });
  sCircle(ctx, ctx.x1 - 88, ctx.cy, 9, { fill: SCENE_INK, stroke: SCENE_INK });
  sArrow(ctx, ctx.x0 + 122, ctx.cy, ctx.x1 - 122, ctx.cy, { sw: 2.5 });
  gBolt(ctx, ctx.cx, ctx.cy - 34, 34);
  gBurst(ctx, ctx.cx, ctx.cy, 18);
}

function scSmGuard(ctx: SceneCtx): void {
  sCircle(ctx, ctx.x0 + 82, ctx.cy, 26, { fill: SCENE_PAPER });
  sCircle(ctx, ctx.x0 + 82, ctx.cy, 8, { fill: SCENE_INK, stroke: SCENE_INK });
  sCircle(ctx, ctx.x1 - 82, ctx.cy, 26, { fill: SCENE_YELLOW });
  sCircle(ctx, ctx.x1 - 82, ctx.cy, 8, { fill: SCENE_INK, stroke: SCENE_INK });
  // 迁移中经过条件菱形闸门
  sArrow(ctx, ctx.x0 + 112, ctx.cy, ctx.cx - 52, ctx.cy, { sw: 2.2 });
  sPoly(ctx, [[ctx.cx, ctx.cy - 38], [ctx.cx + 44, ctx.cy], [ctx.cx, ctx.cy + 38], [ctx.cx - 44, ctx.cy]], { fill: SCENE_PAPER });
  gCheck(ctx, ctx.cx, ctx.cy, 22);
  sArrow(ctx, ctx.cx + 52, ctx.cy, ctx.x1 - 112, ctx.cy, { sw: 2.2 });
}

function scSmNested(ctx: SceneCtx): void {
  const bx = ctx.cx - 20;
  const by = ctx.cy;
  sRect(ctx, bx - 118, by - 92, 236, 184, { fill: SCENE_PAPER, sw: 2.2 });
  sCircle(ctx, bx - 52, by - 10, 22, { fill: SCENE_YELLOW });
  sCircle(ctx, bx + 52, by - 10, 22, { fill: SCENE_PAPER });
  sCircle(ctx, bx - 52, by - 10, 7, { fill: SCENE_INK, stroke: SCENE_INK });
  sCircle(ctx, bx + 52, by - 10, 7, { fill: SCENE_INK, stroke: SCENE_INK });
  sArcArrow(ctx, bx, by - 10, 52, Math.PI + 0.45, -0.45, { sw: 1.8 });
  sArcArrow(ctx, bx, by - 10, 52, 0.45, Math.PI - 0.45, { sw: 1.8 });
  sArrow(ctx, ctx.x0 + 30, by + 56, bx - 122, by + 40, { sw: 2.2 });
  sArrow(ctx, bx + 122, by + 56, ctx.x1 - 40, by + 66, { sw: 2.2 });
  sCircle(ctx, ctx.x1 - 30, by + 68, 10, { fill: SCENE_PAPER });
}

/* ===== 循环图（核心循环页 loop.webp：图标节点环，无文字） ===== */

type MiniGlyphName =
  | "bolt" | "runner" | "burst" | "star" | "grid" | "cell" | "diamond" | "check"
  | "gem" | "merge2" | "up" | "coin" | "hammer" | "box" | "flag" | "piece" | "bars"
  | "branch" | "skull" | "tree" | "house" | "clock" | "dice" | "spike" | "tower";

function miniGlyph(ctx: SceneCtx, name: MiniGlyphName, cx: number, cy: number, s: number): void {
  switch (name) {
    case "bolt": gBolt(ctx, cx, cy, s); break;
    case "runner": gRunner(ctx, cx - s * 0.1, cy + s * 0.55, s * 1.1); break;
    case "burst": gBurst(ctx, cx, cy, s * 0.55); break;
    case "star": gStar(ctx, cx, cy, s * 0.5); break;
    case "grid": gGrid(ctx, cx - s * 0.42, cy - s * 0.42, 3, 3, s * 0.28, { sw: 1.2 }); break;
    case "cell": sRect(ctx, cx - s * 0.36, cy - s * 0.36, s * 0.72, s * 0.72, { fill: SCENE_YELLOW }); break;
    case "diamond": sPoly(ctx, [[cx, cy - s * 0.5], [cx + s * 0.42, cy], [cx, cy + s * 0.5], [cx - s * 0.42, cy]], { fill: SCENE_YELLOW }); break;
    case "check": gCheck(ctx, cx, cy, s * 0.66); break;
    case "gem": gGem(ctx, cx, cy, s * 0.5, SCENE_BLUE); break;
    case "merge2": {
      sRect(ctx, cx - s * 0.46, cy + s * 0.02, s * 0.4, s * 0.4, { fill: SCENE_BLUE });
      sRect(ctx, cx + s * 0.06, cy + s * 0.02, s * 0.4, s * 0.4, { fill: SCENE_BLUE });
      sRect(ctx, cx - s * 0.26, cy - s * 0.52, s * 0.52, s * 0.52, { fill: SCENE_GREEN });
      break;
    }
    case "up": sArrow(ctx, cx, cy + s * 0.45, cx, cy - s * 0.45, { sw: 2.5, head: 10 }); break;
    case "coin": gCoin(ctx, cx, cy, s * 0.44); break;
    case "hammer": gHammer(ctx, cx, cy, s * 0.9); break;
    case "box": gBox(ctx, cx, cy, s * 0.72); break;
    case "flag": gFlag(ctx, cx - s * 0.1, cy + s * 0.45, s * 0.9); break;
    case "piece": gPiece(ctx, cx, cy, s * 0.42, SCENE_BLUE); break;
    case "bars": gBars(ctx, cx - s * 0.44, cy + s * 0.4, s * 0.22, s * 0.12, [s * 0.3, s * 0.52, s * 0.78]); break;
    case "branch": {
      sLine(ctx, cx, cy + s * 0.45, cx, cy, { sw: 2.2 });
      sArrow(ctx, cx, cy, cx - s * 0.34, cy - s * 0.42, { sw: 2.2, head: 8 });
      sArrow(ctx, cx, cy, cx + s * 0.34, cy - s * 0.42, { sw: 2.2, head: 8 });
      break;
    }
    case "skull": gSkull(ctx, cx, cy, s * 0.66); break;
    case "tree": gTree(ctx, cx, cy + s * 0.42, s * 0.8); break;
    case "house": gHouse(ctx, cx, cy + s * 0.4, s * 0.8, s * 0.55); break;
    case "clock": gClock(ctx, cx, cy, s * 0.45); break;
    case "dice": gDice(ctx, cx, cy, s * 0.72); break;
    case "spike": gSpike(ctx, cx, cy, s * 0.45); break;
    case "tower": gTower(ctx, cx, cy + s * 0.45, s * 0.5, s * 0.6); break;
  }
}

/** 循环图：4 个图标节点围成闭环（上右下左 + 顺时针弧箭头） */
function scCycle(ctx: SceneCtx, glyphs: MiniGlyphName[]): void {
  const r = 102;
  const badgeR = 37;
  const positions: ScenePt[] = [
    [ctx.cx, ctx.cy - r],
    [ctx.cx + r, ctx.cy],
    [ctx.cx, ctx.cy + r],
    [ctx.cx - r, ctx.cy],
  ];
  for (let i = 0; i < 4; i++) {
    const a0 = -Math.PI / 2 + (Math.PI / 2) * i + 0.48;
    const a1 = -Math.PI / 2 + (Math.PI / 2) * (i + 1) - 0.48;
    sArcArrow(ctx, ctx.cx, ctx.cy, r, a0, a1, { sw: 2.2 });
  }
  positions.forEach(([px, py], i) => {
    sCircle(ctx, px, py, badgeR, { fill: i === 0 ? "#ffe9a8" : SCENE_PAPER, sw: 2.2 });
    miniGlyph(ctx, glyphs[i % glyphs.length], px, py, 44);
  });
}

/* ------------------------------ 场景注册表 + 输出 API ------------------------------ */

const ENTITY_SCENES = {
  // match-clear
  "match-row": scMatchRow,
  "gem-swap": scGemSwap,
  "clear-drop": scClearDrop,
  "cascade-chain": scCascadeChain,
  // merge（unit / gem 双形态）
  "merge-basic": (ctx: SceneCtx) => scMergeBasic(ctx, "unit"),
  "merge-drag": (ctx: SceneCtx) => scMergeDrag(ctx, "unit"),
  "merge-chain": (ctx: SceneCtx) => scMergeChain(ctx, "unit"),
  "merge-tiers": (ctx: SceneCtx) => scMergeTiers(ctx, "unit"),
  "merge-basic-gem": (ctx: SceneCtx) => scMergeBasic(ctx, "gem"),
  "merge-drag-gem": (ctx: SceneCtx) => scMergeDrag(ctx, "gem"),
  "merge-chain-gem": (ctx: SceneCtx) => scMergeChain(ctx, "gem"),
  "merge-tiers-gem": (ctx: SceneCtx) => scMergeTiers(ctx, "gem"),
  "merge-cycle": scMergeCycle,
  "merge-income": scMergeIncome,
  // dodge-avoid
  "dodge-field": scDodgeField,
  "dodge-move": scDodgeMove,
  "dodge-gap": scDodgeGap,
  "dodge-density": scDodgeDensity,
  // runner
  "runner-lane": scRunnerLane,
  "runner-jump": scRunnerJump,
  "runner-lanes": scRunnerLanes,
  "runner-speed": scRunnerSpeed,
  // shoot-aim
  "aim-target": scAimTarget,
  "aim-trajectory": scAimTrajectory,
  "aim-hit": scAimHit,
  "aim-lead": scAimLead,
  // combat
  "combat-clash": scCombatClash,
  "combat-strike": scCombatStrike,
  "combat-trade": scCombatTrade,
  "combat-cooldown": scCombatCooldown,
  // turn-duel
  "turn-board": scTurnBoard,
  "turn-place": scTurnPlace,
  "turn-cycle": scTurnCycle,
  "turn-win": scTurnWin,
  // placement
  "place-tower": scPlaceTower,
  "place-ghost": scPlaceGhost,
  "place-wave": scPlaceWave,
  "place-cover": scPlaceCover,
  // choice-strategy
  "choice-cards": scChoiceCards,
  "choice-pick": scChoicePick,
  "choice-branch": scChoiceBranch,
  "choice-scale": scChoiceScale,
  // physics
  "physics-stack": scPhysicsStack,
  "physics-drop": scPhysicsDrop,
  "physics-seesaw": scPhysicsSeesaw,
  "physics-domino": scPhysicsDomino,
  // puzzle
  "puzzle-fit": scPuzzleFit,
  "puzzle-try": scPuzzleTry,
  "puzzle-reveal": scPuzzleReveal,
  "puzzle-path": scPuzzlePath,
  // progression
  "prog-stairs": scProgStairs,
  "prog-collect": scProgCollect,
  "prog-curve": scProgCurve,
  "prog-prestige": scProgPrestige,
  // simulation
  "sim-town": scSimTown,
  "sim-harvest": scSimHarvest,
  "sim-cycle": (ctx: SceneCtx) => scCycle(ctx, ["tree", "box", "coin", "house"]),
  "sim-network": scSimNetwork,
  // timing
  "timing-gauge": scTimingGauge,
  "timing-tap": scTimingTap,
  "timing-window": scTimingWindow,
  "timing-combo": scTimingCombo,
  // patterns
  "act-reflex": scActReflex,
  "tap-fast": scTapFast,
  "loop-act": scLoopAct,
  "act-chain": scActChain,
  "sp-board": scSpBoard,
  "sp-place": scSpPlace,
  "sp-validate": scSpValidate,
  "sp-fill": scSpFill,
  "mgmt-base": scMgmtBase,
  "mgmt-build": scMgmtBuild,
  "mgmt-flow": scMgmtFlow,
  "mgmt-expand": scMgmtExpand,
  "strat-formation": scStratFormation,
  "strat-arrange": scStratArrange,
  "strat-resolve": scStratResolve,
  "strat-tree": scStratTree,
  "nar-tree": scNarTree,
  "nar-choice": scNarChoice,
  "nar-consequence": scNarConsequence,
  "nar-endings": scNarEndings,
  // features
  "idle-coins": scIdleCoins,
  "idle-collect": scIdleCollect,
  "idle-offline": scIdleOffline,
  "idle-multi": scIdleMulti,
  "click-target": scClickTarget,
  "click-tap": scClickTap,
  "click-reward": scClickReward,
  "click-frenzy": scClickFrenzy,
  "grid-board": scGridBoard,
  "grid-move": scGridMove,
  "grid-valid": scGridValid,
  "grid-path": scGridPath,
  "levels-path": scLevelsPath,
  "levels-enter": scLevelsEnter,
  "levels-gate": scLevelsGate,
  "levels-branch": scLevelsBranch,
  "num-bars": scNumBars,
  "num-upgrade": scNumUpgrade,
  "num-curve": scNumCurve,
  "num-prestige": scNumPrestige,
  "gen-dice": scGenDice,
  "gen-roll": scGenRoll,
  "gen-variety": scGenVariety,
  "gen-biome": scGenBiome,
  "rogue-map": scRogueMap,
  "rogue-door": scRogueDoor,
  "rogue-death": scRogueDeath,
  "rogue-meta": scRogueMeta,
  "sm-states": scSmStates,
  "sm-event": scSmEvent,
  "sm-guard": scSmGuard,
  "sm-nested": scSmNested,
  // 核心循环图（patterns/{key}/loop.webp）
  "loop-action": (ctx: SceneCtx) => scCycle(ctx, ["bolt", "runner", "burst", "star"]),
  "loop-spatial": (ctx: SceneCtx) => scCycle(ctx, ["grid", "cell", "diamond", "check"]),
  "loop-merge": (ctx: SceneCtx) => scCycle(ctx, ["gem", "merge2", "up", "coin"]),
  "loop-management": (ctx: SceneCtx) => scCycle(ctx, ["hammer", "box", "coin", "flag"]),
  "loop-strategy": (ctx: SceneCtx) => scCycle(ctx, ["piece", "bars", "burst", "star"]),
  "loop-narrative": (ctx: SceneCtx) => scCycle(ctx, ["diamond", "burst", "branch", "star"]),
} as const;

export type EntitySceneType = keyof typeof ENTITY_SCENES;

export const entitySceneTypes = Object.keys(ENTITY_SCENES) as EntitySceneType[];

export function isEntitySceneType(v: string): v is EntitySceneType {
  return Object.prototype.hasOwnProperty.call(ENTITY_SCENES, v);
}

function sceneSeed(scene: string): number {
  let h = 2166136261;
  for (let i = 0; i < scene.length; i++) {
    h ^= scene.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 生成实体配图 SVG（480×360 / 8% 安全边距 / 无边框 / 无文字 / 纸色底）。
 * 输出为纯 SVG 字符串，由调用方（scripts/generate-entity-assets.ts）转 webp 落盘。
 */
export function generateEntitySceneSvg(
  scene: EntitySceneType,
  width = ENTITY_SCENE_WIDTH,
  height = ENTITY_SCENE_HEIGHT,
): string {
  const draw = ENTITY_SCENES[scene];
  if (!draw) throw new Error(`未知实体配图场景: ${scene}`);
  const mx = Math.max(8, Math.round(width * 0.08));
  const my = Math.max(8, Math.round(height * 0.08));
  const ctx: SceneCtx = {
    gen: rough.generator({ options: { roughness: 1.5, bowing: 0.8, seed: sceneSeed(scene) } }),
    paths: [],
    x0: mx,
    y0: my,
    x1: width - mx,
    y1: height - my,
    cx: width / 2,
    cy: height / 2,
    w: width - mx * 2,
    h: height - my * 2,
  };
  draw(ctx);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="${SCENE_PAPER}"/>`;
  for (const p of ctx.paths) {
    if (p.fill !== "none") {
      svg += `<path d="${p.d}" fill="${p.fill}" stroke="none"/>`;
    } else {
      const dash = p.dash ? ` stroke-dasharray="${p.dash}"` : "";
      svg += `<path d="${p.d}" fill="none" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
    }
  }
  svg += "</svg>";
  return svg;
}
