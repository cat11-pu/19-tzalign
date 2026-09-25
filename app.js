// app.js：渲染结果
import { offsetAt } from "./zone.js";
import { align } from "./align.js";

export function render(spec) {
  const result = align(spec.points, spec.rules, spec.interval, spec.policy);
  return { utc: result.utc, gaps: result.gaps, overlaps: result.overlaps,
           monotonic: result.monotonic, duplicates: result.duplicates,
           offset_sample: offsetAt(spec.rules, spec.probe) };
}
