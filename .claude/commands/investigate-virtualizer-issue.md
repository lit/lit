---
description: Deep investigation of a specific @lit-labs/virtualizer issue — reproduce, analyze, estimate
argument-hint: 'GitHub issue number (e.g. 4693)'
---

# Virtualizer Issue Investigation

You are performing a deep investigation of `@lit-labs/virtualizer` issue #$ARGUMENTS. Your goal is to reproduce the bug, identify the root cause, estimate fix complexity, and document findings.

## Core Principles

- **Reproduce first**: Create a runnable repro before analyzing source code.
- **Build correctly**: Always use `npm run build` from the virtualizer package directory. Never call `tsc` directly. Wireit caches by file content, so switching branches and rebuilding will produce the correct output without needing to clean.
- **Be systematic**: Follow the phases in order. Don't jump to conclusions.
- **Document everything**: Update TRIAGE.md with your findings so the next step (fix) has full context.
- **No Co-Authored-By**: This project has a CLA that prevents Co-Authored-By lines in commits.

---

## Phase 1: Context Gathering

**Goal**: Understand what's already known about this issue.

Issue number: $ARGUMENTS

**Actions**:

1. Read the triage document: `packages/labs/virtualizer/TRIAGE.md`
   - What subsystem, type, and priority were assigned?
   - Are there any existing notes or related issues?

2. Fetch the full issue: `gh issue view $ARGUMENTS --repo lit/lit`
3. Fetch comments: `gh issue view $ARGUMENTS --repo lit/lit --comments`

4. Check for existing work:

   ```
   git log --all --oneline --grep="#$ARGUMENTS" -- packages/labs/virtualizer/
   ```

5. Check for existing playground repro:

   ```
   ls playground/p/scratch/issues/$ARGUMENTS/ 2>/dev/null
   ls playground/p/issues/$ARGUMENTS/ 2>/dev/null
   ```

6. Summarize what you know and confirm with the user before proceeding.

---

## Phase 2: Reproduction

**Goal**: Create a local, runnable reproduction of the bug.

Repro cases live in `playground/p/scratch/issues/$ARGUMENTS/`.

**Actions**:

1. If the issue links to a Lit Playground gist, import it:

   ```
   cd playground && npm run import -- p/scratch/issues/$ARGUMENTS <gist-id>
   ```

   If the link uses an inline `#project=` data URL (not a gist), create the files manually.

2. If no external repro is provided, create one based on the issue description.

3. Every playground app needs at minimum:
   - `package.json` with `{"type": "module"}`
   - `index.html` that loads the component
   - A `.ts` source file (the playground Vite config resolves `.js` imports to `.ts`)

4. Launch the dev server:

   ```
   cd playground && npm run start -- p/scratch/issues/$ARGUMENTS
   ```

   The port is auto-assigned; read the output to find it. Do NOT use `npx vite` directly.

5. Use Chrome browser tools to verify the repro case runs and the bug is visible.

6. If the bug cannot be reproduced, document what you tried and why it may not reproduce. Check if the issue has been fixed on the current branch.

---

## Phase 3: Root Cause Analysis

**Goal**: Identify exactly what code is causing the bug.

**Key source files** (read the relevant ones based on the subsystem):

- `packages/labs/virtualizer/src/layouts/flow.ts` — flow layout, position estimation, scroll size
- `packages/labs/virtualizer/src/Virtualizer.ts` — core virtualizer logic, scroll handling, child measurement
- `packages/labs/virtualizer/src/ScrollerController.ts` — scroller mode handling
- `packages/labs/virtualizer/src/layouts/shared/Layout.ts` — base layout class
- `packages/labs/virtualizer/src/layouts/shared/SizeCache.ts` — metrics cache
- `packages/labs/virtualizer/src/layouts/shared/SizeGapPaddingBaseLayout.ts` — size/gap/padding base

**Actions**:

1. Based on the reproduction, identify which code path is involved.
2. Read the relevant source files.
3. Use the playground repro and Chrome tools to observe:
   - DOM state (element positions, styles, attributes)
   - Console errors or warnings
   - Scroll positions and layout metrics
4. If helpful, test against `main` to confirm the bug exists there:
   - `git stash` (if needed), `git checkout main`, `npm run build` (from virtualizer dir)
   - Refresh playground and verify
   - Switch back: `git checkout <branch>`, `git stash pop` (if needed), `npm run build`
5. Form a root-cause hypothesis and verify it.

---

## Phase 4: Fix Complexity Estimate

**Goal**: Assess how hard the fix will be.

Classify as one of:

- **Trivial**: Single-line or few-line change, obvious fix (e.g., null guard, off-by-one)
- **Moderate**: Localized change in one subsystem, clear approach, < 50 lines
- **Complex**: Touches multiple subsystems, requires careful design, potential side effects
- **Architectural**: Requires fundamental changes to the virtualizer's approach

For each, note:

- Which files would need to change
- Whether existing tests cover the affected code paths
- Risk of regressions
- Whether the fix might address other open issues

---

## Phase 5: Document Findings

**Goal**: Record everything for the fix phase.

**Actions**:

1. Update the issue's entry in `packages/labs/virtualizer/TRIAGE.md`:
   - Update status (e.g., `confirmed`, `needs-repro` → `confirmed`)
   - Add investigation notes to the Notes column
   - Record fix complexity estimate

2. Summarize findings for the user:
   - Root cause (1-2 sentences)
   - Fix approach (what would change)
   - Complexity estimate
   - Risk assessment
   - Related issues that might be affected

---

## Phase 6: Handoff

**Goal**: Decide next steps with the user.

Ask the user:

1. Should we proceed to fix this issue now? (i.e., run `/fix-virtualizer-bug $ARGUMENTS`)
2. Should we investigate another issue first?
3. Are there any concerns about the proposed fix approach?
