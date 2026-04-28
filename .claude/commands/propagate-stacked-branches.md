---
description: Rebase or merge updates from a parent branch into its dependents in the @lit-labs/virtualizer stacked-branch tree
argument-hint: 'Optional: parent branch name to propagate from; defaults to current branch'
---

# Propagate Stacked Branches

You are propagating changes from a parent branch to its dependent branches in the `@lit-labs/virtualizer` stacked-branch tree. A new commit landed on the parent; every descendant branch is now behind and needs to pick up the parent's new tip.

This is a write operation that can rewrite history across multiple remotes. Plan before acting; confirm before pushing.

## Core Principles

- **Discovery first, actions second.** Build the full descendant subtree before touching anything.
- **Plan before acting, confirm before pushing.** Show the user what you intend to do and wait for explicit approval.
- **Root-to-leaves order.** A parent must be fully updated before any of its children are updated.
- **Stop on conflicts.** Never auto-resolve merge or rebase conflicts in stacked branches; they require human judgment.
- **Force-push safety.** Always `--force-with-lease`, never `--force`. Ask before every force-push.
- **Build and test after each update.** A silent rebase break is worse than a loud one.

---

## Phase 1: Identify the parent branch

**Goal**: Determine which branch's updates are being propagated.

**Actions**:

1. If `$ARGUMENTS` specifies a branch name, use it as the parent.
2. Otherwise, use the current branch: `git branch --show-current`
3. Verify the parent branch matches the virtualizer naming convention documented in `triage-virtualizer-issues.md` (the `Branch stacks` section). If it doesn't, warn the user — this skill is scoped to the virtualizer stacked-branch tree, and propagating changes through a non-conforming branch may not be the right workflow.
4. Confirm with the user: "Propagating updates from `<parent-branch>` to its dependents. Proceed?"

---

## Phase 2: Discover dependent branches

**Goal**: Build the full descendant subtree rooted at the parent branch.

**Actions**:

1. Fetch open virtualizer PRs with their base and head refs:

   ```
   gh pr list --repo lit/lit --state open --search "virtualizer in:title" --json number,title,headRefName,baseRefName,isDraft --limit 50
   ```

2. Find all direct children: PRs whose `baseRefName` equals the parent branch. If there are no direct children, stop — there is nothing to propagate. Report the no-op and exit.

3. For each direct child, recursively find its own children (PRs whose `baseRefName` matches the child's `headRefName`), and continue until you've reached the leaves.

4. Build an ordered propagation list in root-to-leaves order (direct children first, then grandchildren, etc.). Siblings can be ordered arbitrarily — they're independent.

See also: the branch/PR discovery procedure in `triage-virtualizer-issues.md` Phase 1b, which documents the naming convention and the base-ref-over-name rule.

---

## Phase 3: Present the propagation plan

**Goal**: Show the user the full plan and get explicit confirmation before any write operations.

**Actions**:

1. For each dependent branch in the propagation list, present:
   - Branch name
   - PR number and title
   - Draft vs open status
   - Proposed operation: **rebase** (default) or **merge**
   - Whether the branch has a remote (has been pushed previously)

2. Explain the defaults: rebase keeps stacked history clean but requires a force-push; merge preserves history and needs only a regular push, at the cost of merge commits in the child branches.

3. Offer the user these choices:
   - Approve all as rebase (default)
   - Override individual branches to use merge instead
   - Skip specific branches (e.g., ones the user wants to update manually later)
   - Cancel the operation entirely

4. Wait for explicit user confirmation. Do not proceed without it.

---

## Phase 4: Propagate, root-to-leaves

**Goal**: Apply the parent's updates to each dependent in order.

For each dependent in the propagation list, in order:

1. Check out the branch:

   ```
   git checkout <branch>
   ```

2. Apply the parent's changes using the chosen strategy:
   - Rebase: `git rebase <parent-branch>`
   - Merge: `git merge <parent-branch>`

3. **If conflicts arise, stop.** Do not attempt automatic resolution. Report the conflicting files to the user and ask how to proceed. Stacked-branch conflicts often depend on which side represents the newer intent, and that's not a call the agent should make.

4. Rebuild the virtualizer package:

   ```
   cd packages/labs/virtualizer && npm run build
   ```

5. Run the test suite:

   ```
   npm run test
   ```

6. **If the build or tests fail, stop.** Report the failure and ask the user whether to debug in place, revert the propagation on this branch, or roll back the whole operation.

7. If the branch was previously pushed to its remote, push the update:
   - **Rebase**: `git push --force-with-lease` — never plain `--force`. `--force-with-lease` refuses to overwrite if the remote advanced since your last fetch, which catches the case where someone else pushed in the interim.
   - **Merge**: `git push` (no force needed)

8. **Ask for explicit confirmation before every force-push**, even though the maintainer is typically the sole writer of the stacked branches. The cost of pausing is low; the cost of clobbering upstream work is high.

9. Proceed to the next dependent in the propagation list.

---

## Phase 5: Verify

**Goal**: Confirm the propagation produced the intended state.

**Actions**:

1. For each updated PR, check the commit tree on GitHub:

   ```
   gh pr view <N> --repo lit/lit
   ```

2. Look for signs of a bad rebase:
   - Duplicate commits (same subject appearing twice)
   - Missing commits that should have carried forward
   - A base ref that unexpectedly changed

3. If anything looks wrong, stop and report. A bad rebase is usually recoverable from the reflog, but only if you catch it before new commits pile on top.

4. Run the test suite one more time from the current branch to confirm a clean state:

   ```
   cd packages/labs/virtualizer && npm run test
   ```

---

## Phase 6: Update TRIAGE.md if the tree shape changed

**Goal**: Reconcile `packages/labs/virtualizer/TRIAGE.md` with the post-propagation tree.

Most propagations do NOT change the tree shape — a child rebased onto its parent's new tip is still a child of the same parent. In that case, TRIAGE.md needs no update here; any TRIAGE.md changes from the underlying fix were already handled in the fix workflow.

Update the Branch Stack and/or Open PRs sections only if one of these happened:

- A branch was abandoned during propagation (the user decided to drop it rather than fix conflicts)
- A branch was re-parented onto a different base during propagation
- A branch was collapsed (e.g., merged into its parent instead of rebased)

Bump the "Last updated" date at the top of TRIAGE.md if you make any changes.

---

## Phase 7: Report

**Goal**: Summarize what happened for the user.

Report:

1. Which branches were updated and with which strategy (rebase or merge)
2. Any conflicts encountered and how they were resolved
3. Any pushes performed (and which were force-pushes)
4. Any branches that were skipped, abandoned, or rolled back
5. Next steps: draft PRs may need conversion to ready-for-review; the user may want to recheck the PRs on GitHub; any pending CI runs
