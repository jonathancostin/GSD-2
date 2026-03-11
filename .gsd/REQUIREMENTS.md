# Requirements

## Active

### R001 — Worktree-aware dashboard indicator
- Class: failure-visibility
- Status: active
- Description: When the session is inside a worktree, the GSD dashboard header must show the worktree name so the user always knows which workspace they're in.
- Why it matters: Without this, users can lose track of which worktree they're operating in, especially after compaction or long sessions.
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Show in the header status line next to AUTO/PAUSED/idle. Use `getActiveWorktreeName()` from worktree-command.ts.

### R002 — Auto-commit before worktree switch
- Class: continuity
- Status: active
- Description: When switching between worktrees (or returning to main), all dirty files must be auto-committed on the current branch before the chdir happens.
- Why it matters: Without this, uncommitted work is silently lost when switching worktrees because the working directory changes.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Reuse existing `autoCommitCurrentBranch()` from worktree.ts. Commit all dirty files, not just .gsd/ artifacts.

### R003 — Pre-merge artifact preview
- Class: primary-user-loop
- Status: active
- Description: Before dispatching the LLM merge flow, show a preview of what will be merged (file counts, diff summary) and require user confirmation to proceed.
- Why it matters: Merge is a significant action — users should see what's about to happen and have the chance to cancel.
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Preview confirmation (show summary, confirm/cancel), not a per-file selection wizard.

## Validated

(none yet)

## Deferred

(none)

## Out of Scope

### R004 — Per-file merge selection wizard
- Class: primary-user-loop
- Status: out-of-scope
- Description: A wizard UI that lets users check/uncheck individual files to include in the merge.
- Why it matters: Prevents scope creep — the preview confirmation is sufficient for now.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: User explicitly chose preview confirmation over selection wizard.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | failure-visibility | active | M001/S01 | none | unmapped |
| R002 | continuity | active | M001/S02 | none | unmapped |
| R003 | primary-user-loop | active | M001/S03 | none | unmapped |
| R004 | primary-user-loop | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 3
- Mapped to slices: 3
- Validated: 0
- Unmapped active requirements: 0
