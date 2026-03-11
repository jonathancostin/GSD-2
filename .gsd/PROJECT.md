# Project

## What This Is

GSD (Get Stuff Done) is an extension for `pi-coding-agent` that adds structured planning and execution methodology — milestones, slices, tasks, auto-mode, and artifact management.

The `/worktree` command was recently added to support parallel workspaces via git worktrees under `.gsd/worktrees/<name>/`. Core functionality (create, list, switch, return, merge, remove) is implemented and working. The dynamic bash tool and system prompt injection ensure the session operates correctly inside worktrees.

## Core Value

Agent-driven parallel workspaces that let users spin up isolated branches without leaving their session, with LLM-guided merge to reconcile GSD artifacts back to any target branch.

## Current State

The `/worktree` command is functional with:
- Create/switch/return/list/remove operations
- Dynamic bash tool (spawnHook overrides cwd)
- System prompt injection for worktree context
- LLM-guided merge with configurable target branch
- 26-assertion test suite

Missing:
- Dashboard does not indicate when session is in a worktree
- Switching worktrees does not auto-commit dirty files (risk of losing work)
- Merge dispatches directly to LLM without previewing what will be merged

## Architecture / Key Patterns

- **Extension structure:** `src/resources/extensions/gsd/` — commands, state, files, prompts, dashboard
- **Worktree files:** `worktree-manager.ts` (git operations), `worktree-command.ts` (command routing + session switching)
- **Existing auto-commit:** `worktree.ts` has `autoCommitCurrentBranch()` used by slice branch switching — reusable
- **Dashboard:** `dashboard-overlay.ts` — `GSDDashboardOverlay` class with `render()` / `buildContentLines()` methods
- **Prompt dispatch:** `loadPrompt()` + `pi.sendMessage()` with `triggerTurn: true` for LLM-guided flows
- **State accessors:** `getActiveWorktreeName()` and `getWorktreeOriginalCwd()` exported from `worktree-command.ts`

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Worktree polish — dashboard indicator, auto-commit on switch, pre-merge preview
