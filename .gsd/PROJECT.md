# GSD-2: .planning → .gsd Migration Tool

## What This Is

A `/gsd migrate` command that reads an old get-shit-done `.planning` directory from any project, transforms its contents into the GSD-2 `.gsd` format, and writes the complete new directory structure — preserving completion state, research, and project knowledge.

## Core Value

Enable users of the original get-shit-done system to upgrade to GSD-2 without losing accumulated planning artifacts, research, decisions, or progress tracking.

## Current State

Milestone M001 complete and summarized. All 4 slices shipped and all 9 requirements validated:

- **S01** — `parsePlanningDirectory()` reads any `.planning` dir into a typed `PlanningProject` (193 tests: 120 + 73)
- **S02** — `transformToGSD()` converts `PlanningProject` to `GSDProject` with structural mapping, content transformation, and completion state preservation (92 tests)
- **S03** — `writeGSDDirectory()` serializes `GSDProject` to a `.gsd/` tree that `deriveState()` reads back correctly (156 tests: 79 + 77)
- **S04** — `/gsd migrate <path>` command registered in `commands.ts` with tab completion, path resolution, validation gating, preview display, `showNextAction` confirmation, and directory write (37 tests)

478 automated assertions across 6 test suites, all passing. M001-SUMMARY.md written. Pending: squash-merge to main.

## Constraints

- TypeScript ESM, consistent with the rest of the gsd extension
- Uses existing file I/O patterns (loadFile/saveFile from files.ts)
- Command integrates into existing /gsd command routing in commands.ts
- Output parseable by deriveState() and works with auto-mode
- Tests use the existing node --test runner infrastructure

---
*Last updated: 2026-03-11*
