// align.js：对齐与补点（基线：直接相加、不补点）
import { offsetAt } from "./zone.js";

export function align(points, rules, interval, policy) {
  return { utc: points.map((point) => point + offsetAt(rules, point)),
           gaps: [], overlaps: [], monotonic: true, duplicates: 0 };
}
