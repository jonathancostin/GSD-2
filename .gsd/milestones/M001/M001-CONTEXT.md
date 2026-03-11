# M001: Worktree Polish — Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

## Project Description

Three polish features for the existing `/worktree` command in the GSD extension: dashboard indicator, auto-commit on switch, and pre-merge preview confirmation.

## Why This Milestone

The `/worktree` command works but has gaps that can cause confusion (no visual indicator), data loss (no auto-commit on switch), and surprise (merge dispatches without preview). These are table-stakes UX for a feature that manipulates branches and working directories.

## User-Visible Outcome

### When this milestone is complete, the user can:

- See which worktree they're in at a glance on the GSD dashboard
- Switch worktrees without worrying about losing uncommitted work
- Review what will be merged before the LLM merge flow starts

### Entry point / environment

- Entry point: `/worktree` command + `Ctrl+Alt+G` dashboard
- Environment: local dev (pi terminal)
- Live dependencies involved: none

## Completion Class

- Contract complete means: tests pass, TypeScript compiles, dashboard renders indicator, auto-commit fires on switch, preview shows before merge
- Integration complete means: all three features work in a live pi session
- Operational complete means: none (no services)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Dashboard shows worktree name when in a worktree, hides it when not
- Switching worktrees auto-commits dirty files on the source branch
- `/worktree merge` shows a preview and waits for confirmation before dispatching

## Risks and Unknowns

- Low risk overall — all three features build on existing infrastructure
- Dashboard rendering: need to confirm `getActiveWorktreeName()` is callable from the overlay context without circular imports

## Existing Codebase / Prior Art

- `worktree-command.ts` — exports `getActiveWorktreeName()` and `getWorktreeOriginalCwd()`
- `worktree-manager.ts` — `diffWorktreeGSD()`, `getWorktreeGSDDiff()`, `getWorktreeLog()` for merge context
- `dashboard-overlay.ts` — `GSDDashboardOverlay` class, `buildContentLines()` renders all dashboard sections
- `worktree.ts` — `autoCommitCurrentBranch(basePath, unitType, unitId)` — existing auto-commit for slice branches
- `shared/confirm-ui.ts` — `confirmFlow()` for user confirmation UI

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- R001 — Dashboard indicator (primary: S01)
- R002 — Auto-commit on switch (primary: S02)
- R003 — Pre-merge preview (primary: S03)

## Scope

### In Scope

- Dashboard header worktree indicator
- Auto-commit all dirty files before worktree switch/return
- Preview confirmation before merge dispatch

### Out of Scope / Non-Goals

- Per-file merge selection wizard (R004)
- Worktree-aware auto-mode (worktrees are manual workspace management)
- Changes to the merge prompt template or LLM merge logic

## Technical Constraints

- Must not introduce circular imports between `worktree-command.ts` and `dashboard-overlay.ts`
- Auto-commit must use the worktree's git directory, not the main tree's
- Preview must work from both inside and outside the worktree (merge resolves to main tree)

## Integration Points

- `dashboard-overlay.ts` ← imports from `worktree-command.ts`
- `worktree-command.ts` ← imports `autoCommitCurrentBranch` from `worktree.ts`
- `worktree-command.ts` ← imports `confirmFlow` from `shared/confirm-ui.ts`

## Open Questions

- (none — scope is clear)
