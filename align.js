// align.js：本地时间 -> 统一时间轴的对齐、空洞补点与重叠消歧
import { findRule } from "./zone.js";

// 规则偏移以分钟计，统一时间轴与本地时间同单位（秒）
const OFFSET_SCALE = 60;

function noRuleError(local) {
  const error = new Error("E_NO_RULE: 本地时间 " + local + " 未被任何规则覆盖");
  error.code = "E_NO_RULE";
  return error;
}

// 相邻规则过渡处的空洞段：新偏移 > 旧偏移时，本地时间 [from, from+delta) 缺失，
// 范围不越过新规则段自身结束（后续规则重新覆盖的本地时间仍然存在）
export function gapRanges(rules) {
  const ranges = [];
  for (let i = 1; i < rules.length; i += 1) {
    if (rules[i].from !== rules[i - 1].until) continue;
    const delta = (rules[i].offset - rules[i - 1].offset) * OFFSET_SCALE;
    if (delta > 0) {
      ranges.push({ from: rules[i].from,
                    until: Math.min(rules[i].from + delta, rules[i].until),
                    offset: rules[i].offset });
    }
  }
  return ranges;
}

export function align(points, rules, interval, policy) {
  const utc = [];
  const gaps = [];
  const overlaps = [];
  const seen = new Set();
  const repeated = new Set();
  let prevUtc = -Infinity;
  let usedOffset = 0; // 上一个已发射点实际使用的偏移

  // 空洞段按 interval 补点，补点位置用新偏移映射到统一时间轴
  if (interval > 0) {
    for (const range of gapRanges(rules)) {
      for (let local = range.from; local < range.until; local += interval) {
        gaps.push({ local: local, utc: local + range.offset * OFFSET_SCALE });
      }
    }
  }

  // 单次线性推进：每个点常数时间处理，最多向前修正一次
  for (const local of points) {
    const rule = findRule(rules, local);
    if (!rule) throw noRuleError(local);
    let t = local + rule.offset * OFFSET_SCALE;

    const isRepeat = seen.has(local);
    seen.add(local);
    if (isRepeat) repeated.add(local);

    if (t <= prevUtc) {
      // 重叠段（新偏移 < 旧偏移，本地时间重复出现）：按 policy 取较早/较晚那次，
      // “later” 沿用旧偏移取较晚那次；兜底钳制到 prevUtc+1 保证严格递增
      if (policy === "later") t = local + usedOffset * OFFSET_SCALE;
      if (t <= prevUtc) t = prevUtc + 1;
    }
    if (isRepeat) overlaps.push({ local: local, utc: t, policy: policy });

    prevUtc = t;
    usedOffset = (t - local) / OFFSET_SCALE;
    utc.push(t);
  }

  let monotonic = true;
  for (let i = 1; i < utc.length; i += 1) {
    if (utc[i] <= utc[i - 1]) { monotonic = false; break; }
  }

  return { utc: utc, gaps: gaps, overlaps: overlaps,
           monotonic: monotonic, duplicates: repeated.size };
}
