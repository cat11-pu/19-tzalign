// align.js：把本地时间按规则表映射到统一时间轴，处理空洞补点与重叠消歧
import { findRule } from "./zone.js";

const MINUTE = 60; // 偏移单位为分钟，统一时间轴单位为秒

export function align(points, rules, interval, policy) {
  const utc = [];
  const gaps = [];
  const overlaps = [];
  let previousUtc = null;
  let previousOffset = null;
  let overlapUntil = null;   // 重叠段的本地时间右边界（不含）
  let overlapOffset = null;  // 重叠段内“较晚那次”对应的旧偏移

  const counts = new Map();
  for (const point of points) counts.set(point, (counts.get(point) || 0) + 1);
  let duplicates = 0;
  for (const count of counts.values()) if (count > 1) duplicates += count - 1;

  const emitted = new Map(); // 本地时间 -> 已产生的 utc 列表（重复本地时间消歧用）

  for (const point of points) {
    const rule = findRule(rules, point);
    if (!rule) {
      const error = new Error("E_NO_RULE: 本地时间 " + point + " 无规则覆盖");
      error.code = "E_NO_RULE";
      throw error;
    }
    const offset = rule.offset;

    if (previousOffset !== null && offset > previousOffset) {
      // 偏移跳升：本地时间缺失（空洞段），按 interval 在统一时间轴上补点
      const step = interval * MINUTE;
      const end = point + offset * MINUTE;
      for (let fill = previousUtc + step; fill < end; fill += step) gaps.push(fill);
      overlapUntil = null;
    } else if (previousOffset !== null && offset < previousOffset) {
      // 偏移回落：本地时间重复出现（重叠段）
      overlapUntil = point + (previousOffset - offset) * MINUTE;
      overlapOffset = previousOffset;
    }

    let mapped = point + offset * MINUTE;
    if (policy === "later" && overlapUntil !== null && point < overlapUntil) {
      mapped = point + overlapOffset * MINUTE; // 重叠段内取较晚那次（沿用旧偏移）
    }
    if (previousUtc !== null && mapped <= previousUtc) {
      mapped = previousUtc + interval; // 每个点最多向前修正一次，保证严格递增
    }

    if (emitted.has(point)) {
      const list = emitted.get(point);
      list.push(mapped);
      const chosen = policy === "earlier" ? list[0] : list[list.length - 1];
      overlaps.push({ local: point, utc: chosen, occurrences: list.length });
    } else {
      emitted.set(point, [mapped]);
    }

    utc.push(mapped);
    previousUtc = mapped;
    previousOffset = offset;
  }

  let monotonic = true;
  for (let index = 1; index < utc.length; index += 1) {
    if (utc[index] <= utc[index - 1]) { monotonic = false; break; }
  }

  return { utc, gaps, overlaps, monotonic, duplicates };
}
