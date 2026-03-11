---
id: S01
parent: M001
milestone: M001
provides:
  - planning-parser-orchestrator
  - planning-validator
  - per-file-parsers
  - planning-type-definitions
requires: []
affects:
  - S02
key_files:
  - src/resources/extensions/gsd/files.ts
  - src/resources/extensions/gsd/migrate/types.ts
  - src/resources/extensions/gsd/migrate/validator.ts
  - src/resources/extensions/gsd/migrate/parsers.ts
  - src/resources/extensions/gsd/migrate/parser.ts
  - src/resources/extensions/gsd/migrate/index.ts
  - src/resources/extensions/gsd/tests/migrate-parser.test.ts
  - src/resources/extensions/gsd/tests/migrate-validator-parsers.test.ts
key_decisions:
  - D009 — Export 6 helpers from files.ts rather than re-implementing in migrate module
  - D010 — Fixture-based parser tests using mkdtempSync synthetic .planning dirs
  - D011 — Phase key = full directory name (not just number) for duplicate-number safety
  - D012 — Local parseFrontmatterMapHyphen in parsers.ts for hyphenated YAML keys
patterns_established:
  - Per-file parsers are pure functions taking content string, returning typed data
  - Orchestrator composes directory scanners; each scanner is a pure function
  - Graceful null returns for missing files — individual parse failures don't crash the whole parse
  - Barrel export from migrate/index.ts for clean public API
observability_surfaces:
  - PlanningProject.validation contains structured ValidationResult with severity-classified issues
  - ValidationResult.issues array has {file, severity, message} per issue — machine-readable
  - Missing files produce null values in returned object, not thrown errors
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md
duration: 50m
verification_result: passed
completed_at: 2026-03-11
---

# S01: Old .planning Parser

**Complete tested parser for old `.planning` directories — 120 assertions pass covering all file types, edge cases, and validation scenarios.**

## What Happened

Three tasks built a complete parser module for the old get-shit-done `.planning` format:

**T01** established the foundation: exported 6 utility helpers from `files.ts` (`splitFrontmatter`, `parseFrontmatterMap`, `extractSection`, `extractAllSections`, `parseBullets`, `extractBoldField`), defined 18 typed interfaces for the entire old format in `migrate/types.ts`, and created the test scaffold with 13 test groups covering all S01 verification criteria. Stub `parser.ts` and `validator.ts` allowed the test file to compile and surface failures at runtime rather than import time.

**T02** built the validator and all 7 per-file parsers: `validatePlanningDirectory` with severity-classified issue reporting (fatal vs warning), `parseOldRoadmap` handling both flat and milestone-sectioned formats with `<details>` blocks, `parseOldPlan` extracting XML-in-markdown sections and nested YAML frontmatter, `parseOldSummary` with a local `parseFrontmatterMapHyphen` for hyphenated keys (since the shared helper uses `\w` regex), `parseOldRequirements` extracting section-based entries, `parseOldProject`, `parseOldState`, and `parseOldConfig`. A dedicated 73-assertion test file verified all parsers independently before the orchestrator existed.

**T03** implemented the main `parsePlanningDirectory` orchestrator that walks the directory tree, delegates to per-file parsers, and handles all edge cases: `.archive/` skipping, duplicate phase numbers via full directory name keys, orphan summaries without matching plans, `quick/` task scanning, `research/` file collection, and `milestones/` grouping. Added `migrate/index.ts` barrel export. All 120 slice-level assertions passed.

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` → **120 passed, 0 failed** ✓
  - Complete .planning directory with all file types → correct PlanningProject
  - Minimal .planning directory (only ROADMAP.md) → parses without error
  - Missing directory → validation returns fatal error
  - Duplicate phase numbers → both preserved with full directory name keys
  - XML-in-markdown plan → objective, tasks, context extracted correctly
  - YAML frontmatter summary → all fields including hyphenated keys parsed
  - Orphan summaries → included in phase data
  - .archive/ directory → skipped
  - Quick tasks → parsed into separate collection
  - Milestone-sectioned roadmap with `<details>` blocks → phases with completion state
  - Extra files → collected
  - Missing ROADMAP.md → fatal validation issue
  - Missing PROJECT.md → warning validation issue
- `npx tsx src/resources/extensions/gsd/tests/parsers.test.ts` → **249 passed, 0 failed** ✓ (no regression from exports)
- `npx tsx src/resources/extensions/gsd/tests/derive-state.test.ts` → **93 passed, 0 failed** ✓ (no regression)

## Requirements Advanced

- R001 (Parse old .planning directory structure) — fully satisfied: parser reads PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, config.json, phase directories with plans/summaries/research, quick tasks, milestones directory
- R008 (Validate source before migration) — parser-side validation fully satisfied: fatal/warning severity, missing directory detection, missing ROADMAP.md is fatal, missing optional files are warnings
- R009 (Handle edge cases gracefully) — parser-side edge cases covered: orphan summaries, duplicate phase numbers, .archive/ skipping, quick tasks, missing optional files

## Requirements Validated

- R001 — Validated by fixture-based tests: 120 assertions covering all file types, formats, and edge cases prove the parser handles the full old format including variations
- R008 — Validated by validator tests: missing directory → fatal, missing ROADMAP.md → fatal, missing optional files → warning, complete directory → valid

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- T01: Created stub `parser.ts` and `validator.ts` so the test file resolves imports and runs at runtime rather than crashing at import time. Plan said import errors were acceptable; stubs provided a cleaner developer experience for T02/T03.
- T02: Created a separate `migrate-validator-parsers.test.ts` file (73 tests) for independent T02 verification, since the main `migrate-parser.test.ts` was blocked by the T03 stub.
- T02: Built `parseFrontmatterMapHyphen()` locally in `parsers.ts` — not in the original plan but necessary due to the shared `parseFrontmatterMap` using `\w` regex that excludes hyphens in old .planning summary keys.

## Known Limitations

- `parseFrontmatterMapHyphen` in `parsers.ts` is a local copy of the shared helper with a minor regex change. If the shared helper ever gains hyphenated-key support (see D012), this local copy should be removed.
- The roadmap parser detects format (flat vs milestone-sectioned) by presence of version-like `##` headings — this heuristic works for observed patterns but may misclassify unusual roadmaps.
- Config parsing returns null for invalid JSON rather than reporting a structured issue in ValidationResult — acceptable since config is low-priority for migration.

## Follow-ups

- S02 can import cleanly from `migrate/index.ts` — `parsePlanningDirectory`, `validatePlanningDirectory`, and all types are re-exported
- If `parseFrontmatterMap` in `files.ts` is ever extended to support hyphenated keys, `parseFrontmatterMapHyphen` in `parsers.ts` should be removed (D012 is revisable)

## Files Created/Modified

- `src/resources/extensions/gsd/files.ts` — 6 helper functions now exported (no other changes)
- `src/resources/extensions/gsd/migrate/types.ts` — 18 interfaces/types for old .planning format
- `src/resources/extensions/gsd/migrate/validator.ts` — `validatePlanningDirectory` with structured issue reporting
- `src/resources/extensions/gsd/migrate/parsers.ts` — 7 per-file parsers + utilities (XML extraction, quote stripping, hyphenated-key frontmatter parser)
- `src/resources/extensions/gsd/migrate/parser.ts` — Main orchestrator: directory scanning, per-file delegation, edge case handling
- `src/resources/extensions/gsd/migrate/index.ts` — Barrel export for public API
- `src/resources/extensions/gsd/tests/migrate-parser.test.ts` — 120 assertions covering all S01 verification criteria
- `src/resources/extensions/gsd/tests/migrate-validator-parsers.test.ts` — 73 assertions for T02 deliverables

## Forward Intelligence

### What the next slice should know
- Import from `migrate/index.ts` — `parsePlanningDirectory(path)` returns `PlanningProject`, `validatePlanningDirectory(path)` returns `ValidationResult`
- `PlanningProject.phases` is a `Map<string, PlanningPhase>` keyed by full directory name (e.g. `"01-initial-setup"`, not `"01"`)
- `PlanningRoadmap.entries` are in original file order — preserve this for slice ordering in S02
- `PlanningPhase.plans` is a `Map<string, PlanningPlan>` keyed by plan number string (e.g. `"01-01"`)
- `PlanningProject.validation` gives pre-flight issues — S04 should surface these to the user before running the transformer

### What's fragile
- Roadmap format detection (flat vs milestone-sectioned) uses a heuristic — if a flat roadmap has a `##` heading that looks like a version, it may be misclassified. Test your transformer against both formats.
- XML-in-markdown extraction uses regex, not a real XML parser — malformed tags (unclosed, nested) will silently produce empty strings rather than errors.
- `parseFrontmatterMap` (and the local hyphenated variant) returns values with surrounding quotes preserved for some inputs — the `unquote()` helper in `parsers.ts` strips them. If S02 adds more frontmatter parsing, remember to call `unquote()` on string values.

### Authoritative diagnostics
- `PlanningProject.validation.issues` — first place to check for structural problems; each issue has `{file, severity, message}`
- `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` — run this to verify the parser against all fixture cases
- `npx tsx src/resources/extensions/gsd/tests/migrate-validator-parsers.test.ts` — run this to verify per-file parsers in isolation

### What assumptions changed
- Old .planning summary files use hyphenated YAML keys (`tech-stack`, `key-files`) — the shared `parseFrontmatterMap` couldn't handle these. A local copy with `[\w-]` instead of `\w` was necessary.
- Phase numbers are not unique across milestones — full directory name is the safe key.
