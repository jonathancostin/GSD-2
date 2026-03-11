# GSD-2: .planning → .gsd Migration Tool

## What This Is

A `/gsd migrate` command that reads an old get-shit-done `.planning` directory from any project, transforms its contents into the GSD-2 `.gsd` format, and writes the complete new directory structure — preserving completion state, research, and project knowledge.

## Core Value

Enable users of the original get-shit-done system to upgrade to GSD-2 without losing accumulated planning artifacts, research, decisions, or progress tracking.

## Current State

Milestone M001 in progress. S01 complete — parser module ships in `migrate/` with full type definitions, validator, 7 per-file parsers, and main orchestrator. 120 parser tests + 462 total tests passing. S02 (Structure Mapper and Content Transformer) is next.

## Constraints

- Must be TypeScript ESM, consistent with the rest of the gsd extension
- Must use existing file I/O patterns (loadFile/saveFile from files.ts)
- Command must integrate into existing /gsd command routing in commands.ts
- Output must be parseable by deriveState() and work with auto-mode
- Tests must use the existing node --test runner infrastructure

---
*Last updated: 2026-03-11*
