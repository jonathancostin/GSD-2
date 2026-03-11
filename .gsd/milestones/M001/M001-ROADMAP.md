# M001: Worktree Polish

**Vision:** Complete the `/worktree` UX with dashboard visibility, safe switching, and merge preview — making worktrees a first-class, trust-worthy workflow.

## Success Criteria

- Dashboard header shows the active worktree name when in a worktree
- Switching worktrees auto-commits all dirty files on the current branch
- `/worktree merge` shows a diff summary preview and requires confirmation before dispatching the LLM merge flow

## Key Risks / Unknowns

- Potential circular import between `dashboard-overlay.ts` and `worktree-command.ts` — mitigated by importing only the pure accessor functions

## Proof Strategy

- Circular import risk → retire in S01 by successfully importing and rendering the indicator

## Verification Classes

- Contract verification: TypeScript compiles, unit tests pass
- Integration verification: live pi session exercising all three features
- Operational verification: none
- UAT / human verification: dashboard visual check, switch + merge flow in real session

## Milestone Definition of Done

This milestone is complete only when all are true:

- All three slices are complete with passing tests
- Dashboard renders worktree indicator correctly (shown when in worktree, hidden when not)
- Auto-commit fires on every switch path (create, switch, return)
- Merge preview shows and blocks dispatch until confirmed
- TypeScript compiles cleanly
- Existing tests still pass

## Requirement Coverage

- Covers: R001, R002, R003
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [ ] **S01: Dashboard worktree indicator** `risk:low` `depends:[]`
  > After this: when in a worktree, the GSD dashboard header shows the worktree name next to the status.

- [ ] **S02: Auto-commit on worktree switch** `risk:low` `depends:[]`
  > After this: switching worktrees or returning to main auto-commits all dirty files on the current branch first.

- [ ] **S03: Pre-merge preview confirmation** `risk:low` `depends:[]`
  > After this: `/worktree merge` shows a summary of changes and asks for confirmation before dispatching the LLM merge flow.

## Boundary Map

### S01 (standalone)

Produces:
- Dashboard header line includes worktree name via `getActiveWorktreeName()` import

Consumes:
- `getActiveWorktreeName()` from `worktree-command.ts` (already exists)

### S02 (standalone)

Produces:
- `handleCreate`, `handleSwitch`, `handleReturn` call `autoCommitCurrentBranch()` before chdir

Consumes:
- `autoCommitCurrentBranch()` from `worktree.ts` (already exists)

### S03 (standalone)

Produces:
- `handleMerge` shows preview via `confirmFlow()` before dispatching LLM merge prompt

Consumes:
- `diffWorktreeGSD()` from `worktree-manager.ts` (already exists)
- `confirmFlow()` from `shared/confirm-ui.ts` (already exists)
