import fs from "node:fs";
import { offsetAt } from "./zone.js";
import { align } from "./align.js";
import { render } from "./app.js";

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/tz.json", "utf8"));
const result = align(spec.points, spec.rules, spec.interval, spec.policy);
const out = render(spec);

console.log("统一时间轴 =", JSON.stringify(result.utc));
console.log("空洞补点个数 =", result.gaps.length);
console.log("重叠消歧 =", JSON.stringify(result.overlaps));
console.log("时间轴是否严格递增 =", result.monotonic);
console.log("重复的本地时间个数 =", result.duplicates);
console.log("探测点的偏移 =", offsetAt(spec.rules, spec.probe));
console.log("规则未覆盖的错误码 =", spec.no_rule_code);
