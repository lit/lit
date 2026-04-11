---
description: Triage open @lit-labs/virtualizer issues — categorize, prioritize, and update TRIAGE.md
argument-hint: 'Optional: specific issue number to re-triage, or leave blank for all'
---

# Virtualizer Issue Triage

You are triaging open issues for `@lit-labs/virtualizer` in the `lit/lit` GitHub repo. Your goal is to produce or update a structured triage document at `packages/labs/virtualizer/TRIAGE.md`.

## Core Principles

- **Be thorough**: Read every issue fully, including comments.
- **Cross-reference**: Check git history and PRs for existing work on each issue.
- **Preserve context**: When updating TRIAGE.md, preserve existing manual notes and only update what has changed.
- **No Co-Authored-By**: This project has a CLA that prevents Co-Authored-By lines in commits.

---

## Branch stacks

Active virtualizer development often spans multiple stacked PRs rather than a single branch off `main`. The stacked branches form a tree, not necessarily a linear sequence — multiple children can be stacked on the same parent in parallel.

### Naming convention

Branches created by the project maintainer follow the pattern:

```
virtualizer/<root-name>[--<child-suffix>[--<grandchild-suffix>...]]
```

- The `virtualizer/` prefix marks the branch as part of the virtualizer development tree.
- Each additional `--<suffix>` segment indicates a branch stacked one level deeper on top of its parent.
- Branches that share a prefix and differ only in the final `--<suffix>` segment are siblings: stacked on the same parent in parallel, not dependent on each other.

Example tree:

```
virtualizer/css-direction                                    (root, based on main)
└── virtualizer/css-direction--bug-fixes
    ├── virtualizer/css-direction--bug-fixes--implement-4839
    └── virtualizer/css-direction--bug-fixes--managed-viewport
```

Branches that do NOT follow this pattern are typically one-offs and not part of any stack:

- `gnorton/<topic>` — topic branches for exploratory or isolated work by the maintainer
- `fixes/<issue-number>` — single-issue fix branches
- `virtualizer/<single-segment>` with no `--` separator — often external contributor branches (e.g., `virtualizer/docs`, `virtualizer/types`)

### The naming convention is a hint, not a contract

The authoritative source of the stack shape is each PR's `baseRefName` on GitHub. Branch names can lie: a branch may be renamed, rebased onto a different parent, or a non-conforming name may slip in. Always verify the tree by cross-referencing PR base refs against head refs — see Phase 1b for the discovery procedure.

---

## Phase 1: Gather Open Issues

**Goal**: Build the complete list of open virtualizer issues.

**Actions**:

1. Fetch all open issues mentioning virtualizer:

   ```
   gh issue list --repo lit/lit --state open --search "virtualizer" --limit 50 --json number,title,labels,createdAt,updatedAt,author
   ```

2. Also check the known issue numbers list at the bottom of `packages/labs/virtualizer/TRIAGE.md`. Not all issues mention "virtualizer" in searchable text, so the known list is the authoritative set.

3. If triaging a single issue ($ARGUMENTS), skip to Phase 2 for just that issue.

4. Identify any NEW issues not in the known list — these need full triage.

---

## Phase 1b: Discover Active Branches and PRs

**Goal**: Reconstruct the current branch tree and the set of open PRs so you know which issues are already addressed and which PRs need tracking in TRIAGE.md.

Do not rely on the Branch Stack section of TRIAGE.md as your source of truth here — it may be stale. Rebuild the tree from git and GitHub state and then reconcile against TRIAGE.md in Phase 5.

**Actions**:

1. List local branches matching the virtualizer naming convention:

   ```
   git branch --list 'virtualizer/*'
   ```

   This finds branches the maintainer has checked out locally. Note that a branch can exist as a PR on GitHub without being checked out locally, so this is only the first signal.

2. Fetch all open virtualizer-related PRs with their base and head refs and draft state:

   ```
   gh pr list --repo lit/lit --state open --search "virtualizer in:title" --json number,title,headRefName,baseRefName,isDraft,state --limit 50
   ```

   Searching `in:title` avoids picking up PRs that only mention virtualizer in passing. If that misses any known PRs (cross-check against TRIAGE.md's Open PRs table), widen the search.

3. Build the tree from `baseRefName` → `headRefName` relationships:
   - A PR whose `baseRefName` is `main` is a root of a tree.
   - A PR whose `baseRefName` matches another PR's `headRefName` is a child of that PR.
   - PRs sharing the same non-`main` `baseRefName` are siblings: stacked on the same parent in parallel.
   - The naming convention should hint at the same shape, but **trust the base refs over the names**. If a name suggests one parent and the base ref says another, flag the anomaly in your report.

4. For each PR in the tree, capture:
   - Whether it's a draft (`isDraft`)
   - Which issues it closes — fetch the body with `gh pr view <N> --json body` and parse for `Closes #` / `Fixes #` / `Resolves #` keywords. Markdown-link references do not count as closers.
   - Whether it was previously tracked in TRIAGE.md (check the Open PRs table and the per-issue tables)

5. **Audit previously-tracked PRs for closure.** The fetch in step 2 only returns open PRs, so a PR that was merged or closed since the last triage is silently absent from the results. Catching this requires an explicit check against TRIAGE.md:

   a. Build the list of PRs currently listed in TRIAGE.md's Open PRs table.

   b. For each tracked PR that does NOT appear in the step 2 results, verify its current state:

   ```
   gh pr view <N> --repo lit/lit --json state,mergedAt,closedAt
   ```

   c. Classify each closed PR as one of:
   - **Merged** (`state: MERGED`, non-null `mergedAt`) — the fix has landed on main. The issues it closed should have been auto-closed by GitHub via the closing keywords. Proceed to Phase 5's "Handling merged PRs" procedure.
   - **Closed without merging** (`state: CLOSED`, null `mergedAt`, non-null `closedAt`) — the PR was abandoned. Any issues it was addressing are back in play. Proceed to Phase 5's "Handling closed-without-merging PRs" procedure.

   d. For merged PRs, also verify on GitHub that each issue referenced by a closing keyword was actually closed (`gh issue view <N> --json state`). If an issue is still open, flag a missing-or-ineffective-keyword anomaly for the Phase 6 report — the PR body may have been edited, or the keyword may not have been recognized.

6. Flag any of these anomalies for the Phase 6 report:
   - A new branch / PR not previously in TRIAGE.md
   - A previously-tracked PR that is no longer open (merged or closed) — see step 5
   - A PR whose draft state changed
   - A PR whose `baseRefName` differs from what the branch name implies
   - An addressed issue whose PR no longer has a closing keyword (the PR body was edited)
   - An issue that a merged PR was supposed to close but which is still open on GitHub

---

## Phase 2: Fetch Details Per Issue

**Goal**: Understand each issue deeply.

For each issue (or just `$ARGUMENTS` if a specific issue was given):

1. Read the full issue: `gh issue view <N> --repo lit/lit`
2. Read comments if any: `gh issue view <N> --repo lit/lit --comments`
3. Check for existing branch work:
   ```
   git log --all --oneline --grep="#<N>" -- packages/labs/virtualizer/
   ```
4. Check for related PRs:
   ```
   gh pr list --repo lit/lit --search "<N>" --state all --json number,title,state,headRefName
   ```
5. Check for an existing playground repro:
   ```
   ls playground/p/scratch/issues/<N>/ 2>/dev/null
   ls playground/p/issues/<N>/ 2>/dev/null
   ```

---

## Phase 3: Classify

**Goal**: Assign structured metadata to each issue.

### Subsystem

Map to source files:

- `layout` — `layouts/flow.ts`, `layouts/shared/BaseLayout.ts`, `layouts/shared/SizeGapPaddingBaseLayout.ts`
- `scroll` — `ScrollerController.ts`, scroll handling in `Virtualizer.ts`
- `measurement` — `layouts/shared/SizeCache.ts`, ResizeObserver integration
- `rendering` — `Virtualizer.ts` core render loop, child management
- `api` — public API surface, events, types
- `infra` — polyfills, element registration, build/tooling

### Type

`bug` | `regression` | `performance` | `feature` | `docs` | `cleanup`

### Priority

- **P0**: Complete render failure, data loss, no workaround
- **P1**: Major functionality broken, workaround exists
- **P2**: Significant issue, workaround exists, or important feature request
- **P3**: Minor issue, nice-to-have, edge case

### Status

An issue is either **addressed** (there is at least one open PR — draft or not — that will close it when merged) or **unaddressed**.

Addressed issues don't carry a further sub-status; the PR state (draft vs open) is tracked per-PR in the Open PRs table and annotated inline in per-issue tables.

Unaddressed issues carry one of these sub-statuses:

- `needs investigation` — new or under-investigated; root cause not yet identified
- `needs repro` — waiting on a reproduction from the reporter or from us
- `needs reinvestigation` — prior fix attempt exists but its correctness is in doubt
- `confirmed` — investigation complete and root cause understood, but no PR yet

`wontfix` and `duplicate` issues should be closed on GitHub rather than tracked in TRIAGE.md.

---

## Phase 4: Detect Relationships

**Goal**: Identify duplicates, related issues, and clusters.

Look for:

- Issues that describe the same underlying bug from different angles
- Issues in the same subsystem that may share a root cause
- Feature requests that would be addressed by the same architectural change
- Issues that are already fixed by existing work on branches

---

## Phase 5: Update TRIAGE.md

**Goal**: Write or update `packages/labs/virtualizer/TRIAGE.md`.

The document is organized around the addressed/unaddressed split. Top-level structure:

1. **Summary** — counts of addressed (PR open), addressed (PR draft), and unaddressed
2. **Addressed Issues** — issues with an open PR, split into:
   - **Bugs** — P1, P2, P3 tables with columns: #, Title, Subsystem, PR, Test, Fix, Notes
   - **Feature Requests** — by priority, columns: #, Title, Subsystem, PR, Notes
   - **Documentation** — flat table, columns: #, Title, PR, Notes
   - **Other** — by priority (may be empty)
3. **Unaddressed Issues** — issues without an open PR, split the same four ways. Per-issue tables use a `Status` column instead of PR/Test/Fix columns, holding one of the sub-statuses from Phase 3.
4. **Related Issue Clusters** — bullet list of related groups that cut across categories
5. **Open PRs** — table with PR, Title, Branch, Closes, Status
6. **Branch Stack** — current development branch hierarchy (may be a tree, not a linear stack)
7. **Known Issue Numbers** — flat list for monitoring

**Important conventions**:

- **No PR-only items.** Every addressed entry must correspond to a GitHub issue. If a PR exists without a tracking issue (e.g., an internal refactor), file one retroactively and update the PR with a `Fixes #NNNN` keyword so it auto-closes on merge.
- **Inline PR annotations.** In the per-issue tables, the PR column shows `#NNNN (draft)` for draft PRs, so each table is self-sufficient. Non-draft PRs are unannotated. The Open PRs table uses its own Status column and does not duplicate the annotation.
- **PR descriptions should auto-close their issues.** Use `Closes #NNNN, closes #MMMM, ...` (or `Fixes` / `Resolves`) in PR bodies so GitHub closes the issues when the PR merges to main. Bare URL references also work — e.g., `Closes https://github.com/lit/lit/issues/4839` is equivalent to `Closes #4839`. What does NOT work is a markdown link like `[#4839](https://github.com/lit/lit/issues/4839)`: it renders as a clickable hyperlink but doesn't trigger GitHub's auto-close machinery. The distinction matters because several of the current PRs in this repo have mixed conventions.
- **Commit SHAs** go directly in the Addressed → Bugs tables (Test and Fix columns), not in a separate appendix. Use 7-char short SHAs.
- **Feature requests and bugs are distinct.** If an issue can be framed either way, use the framing that matches the fix approach: if the answer is "this is a known limitation requiring architectural work," it's a feature request. If it's "this is broken and needs a fix," it's a bug.

**When updating**:

- Update the "Last updated" date
- Preserve existing notes unless they're now incorrect
- Move issues between sections as they become addressed or unaddressed (or as their priority / category changes)
- Add new issues to appropriate sections
- Add new issue numbers to the Known Issue Numbers list
- Update the Summary counts
- Keep the Branch Stack description accurate — describe it as a "tree" if PRs branch off at the same level

### Handling merged PRs

When Phase 1b's audit reveals that a previously-tracked PR was merged since the last triage:

1. **Verify each issue the PR closed is now closed on GitHub.** Phase 1b step 5d already flags any issue that's still open despite having a closing keyword; handle those as a separate anomaly before proceeding.
2. **Remove closed issues from TRIAGE.md entirely.** An issue that has been closed on GitHub is no longer a tracked issue. Remove its row from whichever Addressed → [category] → [priority] subsection it was living in.
3. **Remove the PR's row from the Open PRs table.** The PR is no longer open.
4. **Update the Branch Stack section.** If the merged PR's branch is no longer part of the tree (because the stack has collapsed by one level), re-describe the tree shape accordingly.
5. **Remove the merged issues from the Known Issue Numbers list.** The list is for issues we're actively monitoring; done is done.
6. **Mention the merge in the Phase 6 report** — the user may want to know which fixes landed without them actively doing it.

### Handling closed-without-merging PRs

When Phase 1b's audit reveals that a previously-tracked PR was closed without merging:

1. **Move the issues it was addressing from `Addressed Issues` back to `Unaddressed Issues`** in the matching category and priority.
2. **Assign each moved issue the `needs reinvestigation` sub-status**, since there was a prior fix attempt that didn't make it in.
3. **Add a note to each moved issue** explaining that a previous PR attempt (`PR #NNNN`) was closed without merging, and briefly why if that's known from the PR's close comment or conversation. This preserves context for whoever picks the issue up next.
4. **Remove the PR's row from the Open PRs table.**
5. **Update the Branch Stack section** if the closed PR removed a node from the tree.
6. **Do NOT remove the issues from the Known Issue Numbers list** — they're still active issues, just back to unaddressed status.
7. **Mention the closure in the Phase 6 report** with enough context that the user can decide whether to file a follow-up or rescue the work.

---

## Phase 6: Report

**Goal**: Summarize changes for the user.

Report:

1. How many issues were triaged (new vs. re-triaged)
2. Any status changes since last triage
3. Any new issues discovered
4. Any issues that appear to have been fixed or closed
5. Recommended next actions (which issues to investigate, which PRs to review)
