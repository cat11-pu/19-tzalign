// zone.js：偏移规则表（基线：全表一个固定偏移，不看时段）
export function offsetAt(rules, localMillis) {
  return rules.length ? rules[0].offset : 0;
}
