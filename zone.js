// zone.js：偏移规则表，按 [from, until) 分段返回本地时间对应的偏移（分钟）
export function findRule(rules, localMillis) {
  for (const rule of rules) {
    if (localMillis >= rule.from && localMillis < rule.until) return rule;
  }
  return null;
}

export function offsetAt(rules, localMillis) {
  const rule = findRule(rules, localMillis);
  return rule ? rule.offset : 0;
}
