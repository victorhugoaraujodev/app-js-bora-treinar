# Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate accidental horizontal overflow and make the app usable at mobile widths of 360px and above without changing application behavior.

**Architecture:** Keep the current HTML and JavaScript structure. Apply responsive fixes in the existing CSS layers: base layout constraints in `reset.css`/`layout.css`, component-specific mobile adaptations in `responsive.css`, and a small static regression test that protects the mobile CSS contract. Validate with the existing Node test suite plus browser viewport inspection.

**Tech Stack:** Vanilla HTML, CSS, JavaScript ES modules, Node's built-in test runner.

## Global Constraints

- Target mobile widths are 360px, 375px, 390px, and 430px.
- Do not change routes, state, persistence, data, PWA contract, or training behavior.
- Preserve the mobile sidebar drawer behavior.
- Do not introduce dependencies or a framework.
- Do not use horizontal clipping as a substitute for fixing oversized children.
- Keep desktop layout behavior unchanged unless a rule is required to remove a mobile conflict.

---

## File Map

- Modify `css/reset.css`: establish safe global sizing and prevent intrinsic child widths from expanding the document.
- Modify `css/layout.css`: make the app shell, topbar, workspace, sidebar, and main content shrink correctly in flex layouts.
- Modify `css/responsive.css`: add mobile rules for header, cards, lists, exercise rows, forms, modals, editor rows, and toast spacing.
- Create `tests/responsive.test.js`: assert the source CSS contains the non-regression constraints required for mobile layout.
- No JavaScript files or HTML structure changes are expected.

## Task 1: Add a failing responsive regression test

**Files:**
- Create: `tests/responsive.test.js`

**Interfaces:**
- Consumes: CSS source files from `css/`.
- Produces: deterministic Node tests that fail before the CSS contract is added and pass after implementation.

- [x] **Step 1: Write the failing tests**

Create a Node test file that reads the CSS files and checks the required mobile contract:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = async (name) => readFile(new URL(`../css/${name}`, import.meta.url), "utf8");

test("mobile layout allows flex and grid children to shrink", async () => {
  const [layout, responsive] = await Promise.all([css("layout.css"), css("responsive.css")]);
  const source = `${layout}\n${responsive}`;

  assert.match(source, /\.main-content[\s\S]*?min-width:\s*0/);
  assert.match(source, /\.topbar-search[\s\S]*?min-width:\s*0/);
  assert.match(source, /\.exercise-row-copy[\s\S]*?min-width:\s*0/);
});

test("mobile controls replace rigid minimum widths", async () => {
  const responsive = await css("responsive.css");

  assert.match(responsive, /\.workout-switcher select[\s\S]*?min-width:\s*0/);
  assert.match(responsive, /\.set-editor-row[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(responsive, /\.modal-card[\s\S]*?width:\s*100%/);
});
```

- [x] **Step 2: Run the new test and verify it fails**

Run:

```text
npm test -- tests/responsive.test.js
```

Expected: the existing suite runs, and the new responsive assertions fail because the required shrink rules are not present yet.

## Task 2: Fix global and structural sizing

**Files:**
- Modify: `css/reset.css`
- Modify: `css/layout.css`

**Interfaces:**
- Consumes: existing app shell, topbar, workspace, sidebar, and main-content classes.
- Produces: containers that can shrink to the viewport without changing their visual desktop structure.

- [x] **Step 1: Add safe intrinsic sizing to the base layout**

In `css/reset.css`, keep the 320px document floor for unsupported smaller screens, but add `min-width: 0` to the app shell and use document-level overflow protection only as a guard. The primary correction remains child sizing.

In `css/layout.css`, update these existing rules:

```css
.app-shell {
  min-width: 0;
  min-height: 100vh;
}

.topbar-search {
  position: relative;
  display: flex;
  flex: 1 1 520px;
  min-width: 0;
  width: min(100%, 520px);
  /* preserve the remaining existing declarations */
}

.workspace {
  display: flex;
  min-width: 0;
  min-height: 100vh;
  padding-top: var(--topbar-height);
}

.main-content {
  width: calc(100% - var(--sidebar-width));
  min-width: 0;
  min-height: calc(100vh - var(--topbar-height));
  margin-left: var(--sidebar-width);
  padding: 38px clamp(22px, 4vw, 62px) 64px;
  overflow-x: hidden;
}
```

Ensure `.topbar-actions` and `.brand` retain their desktop sizing, while mobile overrides can set them to shrink or fixed-content sizing.

- [x] **Step 2: Run the responsive test**

Run:

```text
npm test -- tests/responsive.test.js
```

Expected: the first test passes; the mobile component assertions still fail.

## Task 3: Make mobile components fit at 360px

**Files:**
- Modify: `css/responsive.css`

**Interfaces:**
- Consumes: classes rendered by `index.html` and `js/app.js`.
- Produces: mobile-only layout behavior for all components named in the approved spec.

- [x] **Step 1: Add mobile sizing and stacking rules**

Within the existing `@media (max-width: 820px)` block, add or update rules so the mobile header and main content can shrink:

```css
.topbar {
  min-width: 0;
}

.brand,
.topbar-actions {
  min-width: 0;
}

.topbar-search {
  flex: 1 1 auto;
  min-width: 0;
}

.topbar-search input {
  min-width: 0;
}

.main-content,
.content-container,
.page-header,
.page-title-group,
.page-actions,
.dashboard-grid,
.settings-grid,
.workout-list-card,
.exercise-list,
.modal-card {
  min-width: 0;
  max-width: 100%;
}

.page-actions,
.workout-header-actions,
.form-actions {
  width: 100%;
}

.page-actions .btn,
.workout-header-actions .btn,
.form-actions .btn {
  max-width: 100%;
}
```

Within the existing `@media (max-width: 600px)` block, add rules for rigid controls and rows:

```css
.workout-switcher select {
  min-width: 0;
}

.exercise-row-header,
.exercise-detail,
.set-row,
.set-list-header,
.set-editor-row,
.history-row {
  min-width: 0;
  max-width: 100%;
}

.exercise-row-copy,
.exercise-name,
.exercise-meta,
.set-summary,
.set-summary-meta,
.history-row-main {
  min-width: 0;
}

.set-editor-row {
  grid-template-columns: 40px repeat(3, minmax(0, 1fr)) 32px;
}

.modal-backdrop {
  padding: 10px;
}

.modal-card {
  width: 100%;
}

.modal-header,
.modal-body {
  padding-right: 14px;
  padding-left: 14px;
}

.toast-root {
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  width: calc(100vw - 24px);
}
```

If the exercise action group or set action labels still exceed 360px during viewport inspection, keep their existing semantic controls but allow the action group to wrap and allow button text to wrap rather than forcing a horizontal row.

- [x] **Step 2: Run the responsive regression test**

Run:

```text
npm test -- tests/responsive.test.js
```

Expected: all responsive assertions pass.

## Task 4: Verify behavior and visual widths

**Files:**
- Verify: `css/reset.css`, `css/layout.css`, `css/responsive.css`, `tests/responsive.test.js`

**Interfaces:**
- Consumes: completed CSS changes and the existing app routes.
- Produces: evidence that the document and main content do not exceed the viewport at 360px, 375px, 390px, and 430px.

- [x] **Step 1: Run the complete automated test suite**

Run:

```text
npm test
```

Expected: all tests pass with zero failures.

- [x] **Step 2: Start the static app for browser inspection**

Run a local static server from the repository root using an available local server command, then inspect these routes at 360px, 375px, 390px, and 430px:

```text
python -m http.server 4173
```

Check the home screen, workout list, workout detail, settings, new-workout modal, and expanded exercise/set editor. In the browser console, verify:

```js
({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth, main: document.querySelector("main")?.scrollWidth })
```

Expected: `document` and `main` scroll widths do not exceed the viewport width, except for browser rounding of at most 1px.

- [x] **Step 3: Review the final diff and working tree**

Run:

```text
git diff --check
git status --short
```

Expected: no whitespace errors and only the intended CSS/test files are modified.

- [x] **Step 4: Commit the implementation**

```text
git add css/reset.css css/layout.css css/responsive.css tests/responsive.test.js
git commit -m "fix: corrigir responsividade mobile"
```
