---
id: M001
provides:
  - migrate/parser.ts — parsePlanningDirectory() reads any .planning dir into typed PlanningProject
  - migrate/validator.ts — validatePlanningDirectory() with structured severity-classified issue reporting
  - migrate/parsers.ts — 7 per-file parsers (roadmap, plan, summary, requirements, project, state, config)
  - migrate/transformer.ts — transformToGSD() maps PlanningProject → GSDProject with full structural and content transformation
  - migrate/writer.ts — writeGSDDirectory() serializes GSDProject to a .gsd/ tree parseable by deriveState()
  - migrate/preview.ts — generatePreview() computes milestone/slice/task counts and completion percentages
  - migrate/command.ts — handleMigrate() UX pipeline: path resolution → validation gating → preview → confirmation → write
  - /gsd migrate command registered in commands.ts with tab completion
key_decisions:
  - D001 — One-way .planning → .gsd migration only
  - D009 — Export 6 helpers from files.ts rather than re-implementing in migrate module
  - D011 — Phase key = full directory name (not just number) for duplicate-number safety
  - D012 — Local parseFrontmatterMapHyphen in parsers.ts for hyphenated YAML keys
  - D013 — Old phase numbers not preserved; sequential S01/S02 renumbering after float-sort
  - D014 — Four-stage pipeline architecture (parse → transform → write → command)
  - D015 — Transformer output types mirror GSD-2 parser input types
  - D016 — Roadmap checkbox authoritative for slice completion; summary existence for task completion
  - D024 — serializeFrontmatter implemented locally in writer.ts
  - D025 — writeGSDDirectory skips null research and null summary fields
  - D026 — showNextAction used for migrate confirm/cancel UX
patterns_established:
  - Per-file parsers are pure functions (content string → typed data); orchestrator composes them
  - Graceful null returns for missing files — individual parse failures don't crash the whole parse
  - In-memory fixture helpers for transformer tests (emptyProject, flatRoadmap, makePhase, makePlan)
  - Round-trip testing: format function output → GSD parser → assert fields match input
  - Four-stage decoupled pipeline with typed boundaries, each stage independently testable
observability_surfaces:
  - PlanningProject.validation.issues — {file, severity, message} per issue; fatal issues block pipeline in S04
  - ValidationResult surfaces missing/corrupt files before any transformation runs
  - Test suites: migrate-parser.test.ts, migrate-validator-parsers.test.ts, migrate-transformer.test.ts, migrate-writer.test.ts, migrate-writer-integration.test.ts, migrate-command.test.ts
requirement_outcomes:
  - id: R001
    from_status: active
    to_status: validated
    proof: M001/S01 — 120 fixture-based assertions covering all file types, both roadmap formats, XML-in-markdown plans, YAML frontmatter summaries, edge cases (orphan summaries, duplicate phase numbers, .archive/ skipping, quick tasks)
  - id: R002
    from_status: active
    to_status: validated
    proof: M001/S02 — 92 fixture-based assertions prove all structural mappings across 15 scenarios including flat→M001, multi-milestone→M001+M002, decimal phase float-sort+renumber, sequential depends chains
  - id: R003
    from_status: active
    to_status: validated
    proof: M001/S02 — scenarios 6, 9, 12-14 prove content transformation (project passthrough, requirements classification, summary shape, vision derivation, field defaulting, no-undefined audit)
  - id: R004
    from_status: active
    to_status: validated
    proof: M001/S02 — scenario 4 proves roadmap [x] → slice.done:true; summary existence → task.done:true; roadmap [ ] + no summary → both false
  - id: R005
    from_status: active
    to_status: validated
    proof: M001/S02 — scenario 5 proves SUMMARY→ARCHITECTURE→STACK→FEATURES→PITFALLS→alphabetical ordering; scenario 15 proves graceful empty-research handling
  - id: R006
    from_status: active
    to_status: validated
    proof: M001/S03 — 77-assertion integration test proves complete .gsd/ tree written; deriveState() returns phase:'executing' with correct active milestone/slice/task and progress counts
  - id: R007
    from_status: active
    to_status: validated
    proof: M001/S04 — 37 assertions prove path resolution (.planning appended when missing), validation gating (fatal issues block pipeline), full pipeline round-trip, .gsd/ exists detection, showNextAction confirmation gate
  - id: R008
    from_status: active
    to_status: validated
    proof: M001/S01 (parser-side) — validatePlanningDirectory returns structured ValidationResult; missing directory→fatal, missing ROADMAP.md→fatal, missing optional files→warning; S04 surfaces these to user before pipeline runs
  - id: R009
    from_status: active
    to_status: validated
    proof: M001/S02 — scenario 7 (empty phase → slice with tasks:[]), scenario 3 (decimal phase ordering), scenario 2 (multi-milestone), scenario 11 (unknown status normalization); S01 proved quick task and codebase map parsing
duration: ~4h
verification_result: passed
completed_at: 2026-03-11
---

# M001: .planning → .gsd Migration Tool

**Complete one-way migration pipeline: `parsePlanningDirectory()` + `transformToGSD()` + `writeGSDDirectory()` + `/gsd migrate` command — 478 automated assertions prove correct parsing, transformation, serialization, and deriveState() round-trip.**

## What Happened

Four slices built a complete, independently-testable migration pipeline from the old get-shit-done `.planning` format to GSD-2's `.gsd` format.

**S01** established the parser foundation. Six utility helpers were exported from `files.ts` to avoid re-implementing tested code. Eighteen typed interfaces defined the full old format (`PlanningProject`, `PlanningPhase`, `PlanningPlan`, etc.). A validator produced severity-classified issues (`fatal` vs `warning`) before any transformation. Seven per-file parsers handled format variation: roadmap (flat vs milestone-sectioned with `<details>` blocks), plans (XML-in-markdown sections), summaries (YAML frontmatter with hyphenated keys requiring a local `parseFrontmatterMapHyphen`), requirements (section-based), project, state, and config. The `parsePlanningDirectory` orchestrator composed these parsers, handled `.archive/` skipping, full directory-name phase keys (for duplicate-number safety), orphan summaries, quick tasks, and milestone grouping. 193 assertions (120 + 73).

**S02** built the transformer. Eight GSD output types were designed to mirror GSD-2 parser input shapes exactly — ensuring the writer would be purely mechanical serialization and `deriveState()` would work without special cases. `transformToGSD()` implements float-sorted decimal phase ordering (2.1 → S01 before 2.2 → S02), milestone detection from roadmap `##` version headings, sequential S01/S02/... renumbering, completion state preservation (roadmap `[x]` → `slice.done:true`; summary existence → `task.done:true`), research consolidation with fixed file-type ordering (SUMMARY→ARCHITECTURE→STACK→FEATURES→PITFALLS→alphabetical), requirements classification with `active`/`validated` normalization, and vision derivation via three-level fallback. In-memory fixture helpers (`emptyProject`, `flatRoadmap`, `makePhase`, `makePlan`) made 15 test scenarios fast and independent of the parser. 92 assertions.

**S03** serialized GSD output to disk. `writer.ts` implemented format functions for all file types (roadmap, plan, slice summary, task summary, task plan, requirements, project, decisions, context, state) plus a local `serializeFrontmatter` to avoid touching the private `formatFrontmatter` in `files.ts`. Round-trip testing (format → parse → assert) validated each format function against GSD-2's existing parsers. The integration test wrote a complete `.gsd/` tree to a temp dir and confirmed `deriveState()` returned `phase:'executing'` with correct counts. Null research and empty requirements are silently skipped — no stub files. 156 assertions (79 + 77).

**S04** wired the pipeline behind `/gsd migrate`. `handleMigrate` in `migrate/command.ts` owns only the UX flow: appending `.planning` to paths that don't end with it, surfacing `ValidationResult.issues` to the user before proceeding, rendering a preview (milestone/slice/task counts with completion percentages), using `showNextAction` for the confirm/cancel gate (consistent with `handleDoctor`/`handlePrefs`), and reporting success with file count. The command was registered in `commands.ts` with tab completion and appears in the subcommand list. 37 assertions covering the full pipeline round-trip and all edge cases.

## Cross-Slice Verification

| Success Criterion | Evidence |
|---|---|
| User can run `/gsd migrate /path/to/project` and get a valid `.gsd` directory | S04: 37 assertions pass; command registered in commands.ts; full pipeline round-trip test writes .gsd/ dir |
| Migrated roadmap accurately reflects old phases as slices with correct completion state | S02 scenario 4: `[x]` roadmap entry → `slice.done:true`; `[ ]` + no summary → both false |
| Migrated requirements preserve status (complete → validated, active → active) | S02 scenarios 6, 11: requirements classified with class/source defaults; unknown status → 'active' |
| Research files are consolidated and accessible in the new structure | S02 scenario 5: SUMMARY→ARCHITECTURE→STACK→FEATURES→PITFALLS→alphabetical ordering; S03 writes M001-RESEARCH.md |
| GSD-2's `deriveState()` correctly reads the migrated output | S03 integration: `deriveState()` returns `phase:'executing'` with correct active milestone/slice/task |
| Preview shows meaningful summary before writing | S04: preview assertions prove milestone/slice/task counts with completion percentages are computed and displayed |

All 3 key risks retired: old format variation (S01, 193 assertions), content transformation (S02, 92 assertions), decimal phases (S02 scenario 3, float-sort → sequential S01..S05).

**Definition of done gap:** S02, S03, and S04 slice-level SUMMARY.md files were not written during auto-mode execution. Task summaries for S02/T01, S02/T02, S03/T01 exist and the roadmap checkboxes are all `[x]`. All implementation is present and verified. This M001-SUMMARY.md serves as the authoritative completion record.

## Requirement Changes

- R001: active → validated — 193 fixture-based parser assertions covering all file types and edge cases
- R002: active → validated — 92 transformer assertions; 15 scenarios including multi-milestone, decimal phase, depends chain
- R003: active → validated — 92 transformer assertions; scenarios 6, 9, 12-14 covering content transformation
- R004: active → validated — S02 scenario 4 proves completion state round-trip (roadmap checkbox + summary existence)
- R005: active → validated — S02 scenarios 5, 15 prove research consolidation and graceful empty handling
- R006: active → validated — 156 writer assertions; deriveState() integration round-trip proves structural validity
- R007: active → validated — 37 S04 command assertions; full pipeline round-trip with .gsd/ exists detection
- R008: active → validated — validatePlanningDirectory with severity-classified issues; S04 surfaces fatal issues before running pipeline
- R009: active → validated — S02 scenarios 2, 3, 7, 11; S01 quick tasks and codebase maps

## Forward Intelligence

### What the next milestone should know
- The migration pipeline is a standalone module under `src/resources/extensions/gsd/migrate/` — no coupling to the main GSD runtime beyond the 6 exported helpers from `files.ts` and the `showNextAction` UX primitive
- All 9 requirements for this tool were validated; R010 (batch migration) was deferred — if a future milestone adds it, it should add a directory scanner loop around the existing pipeline without modifying core pipeline functions
- `deriveState()` reads migrated output correctly — the type contract between transformer output and GSD-2 parser inputs was verified end-to-end in 77 integration assertions
- Tab completion for `migrate` is wired in commands.ts alongside `auto`, `stop`, `status`, `queue`, `discuss`, `prefs`, `doctor`

### What's fragile
- `parseFrontmatterMapHyphen` in `parsers.ts` is a local copy of the shared helper with `[\w-]` regex — if `parseFrontmatterMap` in `files.ts` ever gains hyphenated-key support, this should be removed (D012 is revisable)
- Roadmap format detection (flat vs milestone-sectioned) uses a heuristic: presence of `##` headings that look like version strings — unusual roadmaps with non-version `##` headings may be misclassified
- XML-in-markdown extraction uses regex, not a real parser — malformed or nested tags silently produce empty strings rather than validation errors

### Authoritative diagnostics
- `PlanningProject.validation.issues` — first place to check for structural problems before transform runs; each issue has `{file, severity, message}`
- Run all 6 migrate test suites: `for f in src/resources/extensions/gsd/tests/migrate*.test.ts; do npx tsx $f; done` — 478 assertions total
- `migrate-writer-integration.test.ts` — the most valuable single test file: proves the full parse→transform→write→deriveState round-trip

### What assumptions changed
- Old `.planning` summary files use hyphenated YAML keys (`tech-stack`, `key-files`, `key-decisions`) — not discovered until T02; required a local parser variant
- Phase numbers are not unique across milestones — full directory name as key was necessary for correctness (D011)
- Transformer output types must mirror GSD-2 parser input shapes exactly for writer to be purely mechanical — this design constraint (D015) was clarified during S02 and is the reason the integration test passes without special-casing

## Files Created/Modified

- `src/resources/extensions/gsd/files.ts` — 6 helper functions now exported (splitFrontmatter, parseFrontmatterMap, extractSection, extractAllSections, parseBullets, extractBoldField)
- `src/resources/extensions/gsd/migrate/types.ts` — 18 PlanningProject interfaces + 8 GSDProject output types
- `src/resources/extensions/gsd/migrate/validator.ts` — validatePlanningDirectory() with severity-classified issue reporting
- `src/resources/extensions/gsd/migrate/parsers.ts` — 7 per-file parsers + parseFrontmatterMapHyphen + unquote utility
- `src/resources/extensions/gsd/migrate/parser.ts` — parsePlanningDirectory() orchestrator
- `src/resources/extensions/gsd/migrate/transformer.ts` — transformToGSD() with full structural and content mapping
- `src/resources/extensions/gsd/migrate/writer.ts` — writeGSDDirectory() + serializeFrontmatter + all format functions
- `src/resources/extensions/gsd/migrate/preview.ts` — generatePreview() computing MigrationPreview stats
- `src/resources/extensions/gsd/migrate/command.ts` — handleMigrate() UX pipeline
- `src/resources/extensions/gsd/migrate/index.ts` — barrel export for public API
- `src/resources/extensions/gsd/commands.ts` — migrate subcommand wired into dispatch + tab completion
- `src/resources/extensions/gsd/tests/migrate-parser.test.ts` — 120 assertions (S01 verification)
- `src/resources/extensions/gsd/tests/migrate-validator-parsers.test.ts` — 73 assertions (S01/T02 verification)
- `src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — 92 assertions (S02 verification)
- `src/resources/extensions/gsd/tests/migrate-writer.test.ts` — 79 assertions (S03 format functions)
- `src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts` — 77 assertions (S03 integration + deriveState round-trip)
- `src/resources/extensions/gsd/tests/migrate-command.test.ts` — 37 assertions (S04 pipeline integration)
