/**
 * 中文 tag ↔ taxonomy key 映射（站点侧唯一消费入口）
 *
 * 来源：ovo_system `taxonomy/mappings/site-tags.v1.json`（ovo-taxonomy-mapping v1.0.0），
 * 该文件是 taxonomy 分类协议的一部分，description 明确"替代站点 plays.ts 的
 * inferPatternFromTags 启发式"。
 *
 * 同步口径：映射内容只允许在 ovo_system 侧修改（变更需 bump version 并记录决策）；
 * 本模块是它在站点内的代码化拷贝，禁止在站点侧直接增删条目。
 * 如需调整，先改 ovo_system taxonomy 映射文件，再同步更新本模块。
 *
 * 注意：`plays.ts` 的 inferPatternFromTags（pattern 层推断）暂未收编，仍走原启发式；
 * 本模块当前服务 play 详情页的母型推断与 cluster→pillar 回链。
 */
import { isPlayArchetypeKey, type PlayArchetypeKey } from "./archetypes";

export type SiteTagTaxonomy = {
  archetype?: string;
  feature?: string;
  pattern?: string;
  implementationTrait?: string;
  /** 组合玩法的解析结果（如"塔防"不是独立母型，解析为 placement + combat） */
  resolve?: { archetype: string; secondary?: string; pattern?: string };
  note?: string;
};

export const siteTagToTaxonomy: Record<string, SiteTagTaxonomy> = {
  消除: { archetype: "match-clear" },
  解谜: { archetype: "puzzle" },
  合成: { feature: "merge-mechanic", note: "若为主循环则 archetype=merge-unit + pattern=merge" },
  放置: { feature: "idle" },
  建造: { archetype: "placement" },
  点击: { feature: "click" },
  数值: { feature: "numbers", note: "不再单独决定 pattern" },
  动作: { pattern: "action" },
  躲避: { archetype: "dodge-avoid" },
  "行进 / 跑酷": { archetype: "runner" },
  射击: { archetype: "shoot-aim" },
  物理: { archetype: "physics" },
  战斗: { archetype: "combat" },
  战斗对抗: { archetype: "combat" },
  策略决策: { archetype: "choice-strategy" },
  模拟: { archetype: "simulation" },
  "时机 / 反应": { archetype: "timing" },
  "成长 / 数值": { archetype: "progression" },
  回合: { archetype: "turn-duel" },
  棋盘: { archetype: "turn-duel" },
  网格: { feature: "grid" },
  关卡: { feature: "levels" },
  Roguelike: { feature: "roguelike" },
  塔防: {
    resolve: { archetype: "placement", secondary: "combat", pattern: "strategy" },
    note: "组合玩法，非独立母型",
  },
  限时: { feature: "timed" },
  状态机: { implementationTrait: "state-machine" },
  生成: { implementationTrait: "generation" },
  推荐: { note: "运营标签，非分类" },
  热门: { note: "运营标签，非分类" },
};

/**
 * 由玩法帖的 tag 列表推断其归属的行为母型。
 * 只采纳映射表中显式给出 archetype（或 resolve.archetype）的 tag；
 * feature / implementationTrait / 运营标签不参与母型推断（taxonomy 的保守口径）。
 * 按 tag 在内容中的书写顺序取第一个命中，保证结果可解释。
 */
export function inferArchetypeFromTags(
  tags: readonly string[],
): PlayArchetypeKey | null {
  for (const tag of tags) {
    const mapping = siteTagToTaxonomy[tag];
    if (!mapping) continue;
    const key = mapping.archetype ?? mapping.resolve?.archetype;
    if (key && isPlayArchetypeKey(key)) return key;
  }
  return null;
}
