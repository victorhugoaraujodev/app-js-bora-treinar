import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = async (name) => readFile(new URL(`../css/${name}`, import.meta.url), "utf8");

test("mobile layout allows flex and grid children to shrink", async () => {
  const [layout, responsive, components] = await Promise.all([
    css("layout.css"),
    css("responsive.css"),
    css("components.css"),
  ]);
  const source = `${layout}\n${responsive}\n${components}`;

  assert.match(source, /\.main-content[\s\S]*?min-width:\s*0/);
  assert.match(source, /\.topbar-search[\s\S]*?min-width:\s*0/);
  assert.match(source, /\.exercise-row-copy[\s\S]*?min-width:\s*0/);
});

test("mobile controls replace rigid minimum widths", async () => {
  const responsive = await css("responsive.css");

  assert.match(responsive, /\.workout-switcher select[\s\S]*?min-width:\s*0/);
  assert.match(responsive, /\.set-editor-row[\s\S]*?grid-template-columns:\s*40px\s+repeat\(3,\s*minmax\(0,\s*1fr\)\)\s+32px/);
  assert.match(responsive, /\.modal-card[\s\S]*?width:\s*100%/);
});

test("mobile exercise actions remain available for editing", async () => {
  const responsive = await css("responsive.css");

  assert.doesNotMatch(
    responsive,
    /\.exercise-actions \.btn-quiet\s*\{\s*display:\s*none/,
  );
});

test("mobile exercise modal prevents iOS input zoom and row overflow", async () => {
  const responsive = await css("responsive.css");

  assert.match(
    responsive,
    /\.form-field input,\s*\n\s*\.form-field select,\s*\n\s*\.form-field textarea,\s*\n\s*\.set-editor-row input[\s\S]*?font-size:\s*16px/,
  );
  assert.match(responsive, /\.set-editor-row[\s\S]*?width:\s*100%[\s\S]*?min-width:\s*0/);
});
