import { makeRng } from "./seed";
import { SCENES, DEFAULT_SCENE } from "./scenes";

/**
 * 合成完整封面 SVG：纸底 + 排线/点刻定义 + 场景（种子变体）+ 细双线画框。
 * 规则：图内不放任何文字——封面是图，不是海报。
 * 变体：seed = hash(slug) + variant，用户可「换一张」直到满意。
 */

const PAPER = "#faf7ef";
const INK = "#2b2b2b";

export const ARCHETYPE_NAME: Record<string, string> = {
  "turn-duel": "回合博弈",
  "match-clear": "消除",
  "merge-unit": "合成",
  puzzle: "解谜",
  runner: "行进 / 跑酷",
  "dodge-avoid": "躲避",
  "shoot-aim": "射击",
  combat: "战斗对抗",
  "choice-strategy": "策略决策",
  placement: "建造布局",
  physics: "物理",
  timing: "时机 / 反应",
  progression: "成长 / 数值",
  simulation: "模拟",
};

export function composeCoverSvg(slug: string, archetype: string, variant = 0): string {
  const rng = makeRng(`${slug}::${variant}`);
  const sceneFn = SCENES[archetype] ?? DEFAULT_SCENE;
  const scene = sceneFn(rng);
  // 变体之一：约半数场景做水平镜像，构图立刻不同
  const mirror = rng() > 0.5;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <defs>
    <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="0.8" opacity="0.38"/>
    </pattern>
    <pattern id="stipple" width="7" height="7" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.9" fill="${INK}" opacity="0.4"/>
      <circle cx="5.5" cy="5.5" r="0.7" fill="${INK}" opacity="0.28"/>
    </pattern>
  </defs>
  <rect width="480" height="360" fill="${PAPER}"/>
  <g${mirror ? ` transform="translate(480,0) scale(-1,1)"` : ""}>${scene}</g>
  <!-- 细双线画框（老报纸插图框） -->
  <rect x="7" y="7" width="466" height="346" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <rect x="12" y="12" width="456" height="336" fill="none" stroke="${INK}" stroke-width="0.75"/>
</svg>`;
}
