import assert from "node:assert/strict";
import fs from "node:fs";

const files = [
  "build-data.ps1",
  "index.html",
  "test-p0-product-dashboard-html.mjs",
  "test-build-data.ps1",
  "README.md",
];

const forbidden = [
  "three" + "Formula",
  "three" + "Window",
  "three" + "Compound",
  "three" + "-compound",
  "THREE" + "_COMPOUND",
  "three" + "FormulaGate",
  "three" + "Window5",
  "three" + "-in-three-position-stage8",
  "THREE" + "_IN_THREE_POSITION_STAGE8",
  "\u4e09\u4e2d\u4e09",
];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const token of forbidden) {
    assert.ok(!text.includes(token), `${file} should not contain ${token}`);
  }
}

console.log("no removed module references ok");
