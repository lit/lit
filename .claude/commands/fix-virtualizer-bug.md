---
description: Guided workflow for diagnosing and fixing @lit-labs/virtualizer bugs
argument-hint: 'GitHub issue number (e.g. 4693)'
---

# Virtualizer Bug Fix Workflow

You are helping fix a bug in `@lit-labs/virtualizer`. Follow this systematic workflow to diagnose, reproduce, test, and fix the issue.

## Core Principles

- **Reproduce first**: Always create a local repro case before attempting a fix.
- **Test before fix**: Write a regression test in a separate commit before the fix commit.
- **Build correctly**: Always use `npm run build` from the virtualizer package directory. Never call `tsc` directly. Wireit caches by file content, so switching branches and rebuilding will produce the correct output without needing to clean.
- **No Co-Authored-By**: This project has a CLA that prevents Co-Authored-By lines in commits.

---

## Phase 1: Issue Triage

**Goal**: Understand the bug report

Issue number: $ARGUMENTS

**Actions**:

1. Look up the issue: `gh issue view $ARGUMENTS --repo lit/lit`
2. Identify:
   - What is the expected behavior?
   - What is the actual behavior?
   - Is there a reproduction link (Lit Playground, CodePen, etc.)?
   - Which virtualizer subsystem is likely involved? (layout, scroll, rendering, measurement)
3. Summarize the bug and confirm understanding with the user.

---

## Phase 2: Playground Repro Case

**Goal**: Create a local, runnable reproduction of the bug

Repro cases live in `playground/p/scratch/issues/<issue-number>/`.

**Actions**:

1. If the issue links to a Lit Playground gist, import it:

   ```
   cd playground && npm run import -- p/scratch/issues/<number> <gist-id>
   ```

   If the link uses an inline `#project=` data URL (not a gist), create the files manually.

2. Every playground app needs at minimum:
   - `package.json` with `{"type": "module"}`
   - `index.html` that loads the component
   - A `.ts` source file (the playground Vite config resolves `.js` imports to `.ts`)

3. Launch the dev server:

   ```
   cd playground && npm run start -- p/scratch/issues/<number>
   ```

   The port is auto-assigned; read the output to find it. Do NOT use `npx vite` directly.

4. Use Chrome browser tools to verify the repro case runs and the bug is visible.

---

## Phase 3: Diagnosis

**Goal**: Understand the root cause

**Actions**:

1. Read the relevant virtualizer source. Key files:
   - `packages/labs/virtualizer/src/layouts/flow.ts` — flow layout, position estimation, scroll size
   - `packages/labs/virtualizer/src/Virtualizer.ts` — core virtualizer logic, scroll handling, child measurement
   - `packages/labs/virtualizer/src/ScrollerController.ts` — scroller mode handling
   - `packages/labs/virtualizer/src/layouts/shared/Layout.ts` — base layout class

2. Use the playground repro and Chrome tools to observe behavior, check console errors, and inspect DOM state.

3. If helpful, test against `main` to confirm the bug exists there:
   - `git checkout main && npm run build` (from the virtualizer package dir)
   - Refresh the playground page and verify
   - Switch back: `git checkout <branch> && npm run build`

4. Present your diagnosis to the user before proceeding to the fix.

---

## Phase 4: Regression Test

**Goal**: Write a test that fails before the fix and passes after

**Actions**:

1. Tests live in `packages/labs/virtualizer/src/test/`.
2. Study existing tests for patterns — especially recent regression tests added for issues like #4789 and #4827.
3. Write a focused test that captures the specific bug behavior.
4. Commit the test separately with the message format:
   ```
   [labs/virtualizer] Add regression test for <brief description> (#<issue>)
   ```

---

## Phase 5: Fix

**Goal**: Implement the minimal fix

**Actions**:

1. Make the smallest change that fixes the bug.
2. Verify the regression test now passes.
3. Verify the playground repro case no longer exhibits the bug (use Chrome tools).
4. Commit the fix separately with the message format:
   ```
   [labs/virtualizer] <Brief description of fix> (#<issue>)
   ```

---

## Phase 6: Changeset

**Goal**: Add a changeset for the release

**Actions**:

1. Create a changeset file in `.changeset/` with a descriptive filename:

   ```markdown
   ---
   '@lit-labs/virtualizer': patch
   ---

   - <User-facing description of what was fixed>
   ```

2. Include the changeset in the fix commit (not the test commit).

---

## Phase 7: Verification

**Goal**: Confirm everything is clean

**Actions**:

1. Run the full virtualizer test suite: `npm run test` from the virtualizer package dir.
2. Verify the playground repro works correctly with the fix.
3. Summarize what was done: root cause, fix approach, files changed.
