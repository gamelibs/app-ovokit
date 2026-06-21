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
