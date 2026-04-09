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

`fixed-pending-merge` | `in-progress` | `needs-investigation` | `needs-repro` | `confirmed` | `wontfix` | `duplicate`

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

The document structure:

1. **Summary** — counts by status
2. **Bugs by Priority** — P1, P2, P3 tables with columns: #, Title, Subsystem, Status, Branch/PR, Notes
3. **Feature Requests** — table
4. **Documentation** — table
5. **Fixed Pending Merge** — tables grouped by PR/branch, with test and fix commit hashes
6. **Related Issue Clusters** — bullet list of related groups
7. **Open PRs** — table with PR, Title, Branch, Issues, Status
8. **Branch Stack** — current development branch hierarchy
9. **Known Issue Numbers** — flat list for monitoring

**When updating**:

- Update the "Last updated" date
- Preserve existing notes unless they're now incorrect
- Move issues between sections as their status changes
- Add new issues to appropriate sections
- Add new issue numbers to the Known Issue Numbers list
- Update the Summary counts

---

## Phase 6: Report

**Goal**: Summarize changes for the user.

Report:

1. How many issues were triaged (new vs. re-triaged)
2. Any status changes since last triage
3. Any new issues discovered
4. Any issues that appear to have been fixed or closed
5. Recommended next actions (which issues to investigate, which PRs to review)
