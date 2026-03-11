# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001 | ui | Dashboard worktree indicator placement | Header status line (next to AUTO/PAUSED/idle) | Minimal, always visible, matches existing status pattern | No |
| D002 | M001 | scope | Auto-commit scope on worktree switch | All dirty files (not just .gsd/) | Matches existing autoCommitCurrentBranch behavior used in slice switching | No |
| D003 | M001 | ui | Pre-merge interaction model | Preview confirmation (confirm/cancel) | Simpler than per-file selection wizard, sufficient for merge flow | Yes — if users need granular control |
