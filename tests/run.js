import assert from "node:assert";
import { offsetAt } from "../zone.js";
import { align } from "../align.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok   " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const rules = [{ from: 0, until: 1000, offset: 0 }, { from: 1000, until: 2000, offset: 60 }];

check("offsetAt returns number", () => {
  assert.strictEqual(typeof offsetAt(rules, 500), "number");
});

check("offsetAt falls back to zero", () => {
  assert.strictEqual(offsetAt([], 500), 0);
});

check("align returns utc list", () => {
  assert.ok(Array.isArray(align([0, 100], rules, 100, "earlier").utc));
});

check("align reports gaps", () => {
  assert.ok(Array.isArray(align([0, 100], rules, 100, "earlier").gaps));
});

check("render exposes duplicates", () => {
  assert.strictEqual(typeof render({ points: [0], rules: rules, interval: 100, policy: "earlier", probe: 0 }).duplicates, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
