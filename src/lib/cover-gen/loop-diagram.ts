/**
 * 核心循环流程图：每个循环一张「节点 → 节点 → 节点」的流程图。
 * 说明：循环图是图解而非装饰封面，节点标签文字是内容本体，必须保留。
 * 风格与封面一致：细墨线、纸底、双线画框、排线填充。
 */

const INK = "#2b2b2b";
const PAPER = "#faf7ef";
const YELLOW = "#ffda6a";

export const PATTERN_LOOPS: Record<string, string[]> = {
  action: ["输入\nInput", "角色\nAvatar", "物理\nPhysics", "分数\nScore"],
  spatial: ["棋盘\nBoard", "格子\nCell", "规则\nRule", "状态变化\nState"],
  merge: ["资源\nResource", "合并\nMerge", "升级\nLevel Up", "产出\nProduction"],
  management: ["建造\nBuilding", "生产\nProduction", "经济\nEconomy", "扩张\nGrowth"],
  strategy: ["单位\nUnit", "属性\nStats", "战斗\nCombat", "奖励\nReward"],
  narrative: ["选择\nChoice", "后果\nConsequence", "分支\nBranch", "结局\nEnding"],
};

function node(x: number, y: number, w: number, h: number, lines: string[], highlight: boolean): string {
  const fill = highlight ? YELLOW : "url(#hatch)";
  const text = lines
    .map((t, i) => `<text x="${x + w / 2}" y="${y + h / 2 + (i - (lines.length - 1) / 2) * 15}" font-family="Kalam, cursive" font-size="13" fill="${INK}" text-anchor="middle" dominant-baseline="middle">${t}</text>`)
    .join("");
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${INK}" stroke-width="1.4"/>${text}`;
}

function arrow(x1: number, y: number, x2: number): string {
  return `<line x1="${x1}" y1="${y}" x2="${x2 - 8}" y2="${y}" stroke="${INK}" stroke-width="1.6" stroke-dasharray="5 3"/>
  <path d="M${x2 - 10} ${y - 5} L${x2} ${y} L${x2 - 10} ${y + 5}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
}

export function composeLoopDiagramSvg(patternKey: string): string {
  const nodes = PATTERN_LOOPS[patternKey] ?? ["输入", "处理", "输出"];
  const W = 480, H = 360;
  const nw = 86, nh = 56, y = 140;
  const totalW = nodes.length * nw + (nodes.length - 1) * 34;
  const startX = (W - totalW) / 2;

  let body = "";
  nodes.forEach((lines, i) => {
    const x = startX + i * (nw + 34);
    body += node(x, y, nw, nh, lines.split("\n"), i === 1);
    if (i < nodes.length - 1) body += arrow(x + nw, y + nh / 2, x + nw + 34);
  });
  // 回环虚线（循环感）
  const lastX = startX + (nodes.length - 1) * (nw + 34) + nw / 2;
  const firstX = startX + nw / 2;
  body += `<path d="M${lastX} ${y + nh + 14} Q${(firstX + lastX) / 2} ${y + nh + 58} ${firstX} ${y + nh + 14}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="4 4"/>`;
  body += `<path d="M${firstX - 6} ${y + nh + 8} L${firstX} ${y + nh + 14} L${firstX + 6} ${y + nh + 8}" fill="none" stroke="${INK}" stroke-width="1.2"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="0.8" opacity="0.35"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  ${body}
  <rect x="7" y="7" width="466" height="346" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <rect x="12" y="12" width="456" height="336" fill="none" stroke="${INK}" stroke-width="0.75"/>
</svg>`;
}
