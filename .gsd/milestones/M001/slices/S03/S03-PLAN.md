# S03: Directory Writer with deriveState Integration

**Goal:** `writeGSDDirectory(project, targetPath)` serializes a `GSDProject` into a complete `.gsd` directory tree that `deriveState()` reads back correctly
**Demo:** Round-trip test: transformer output → writer → parseRoadmap/parsePlan/parseSummary all parse correctly, and `deriveState()` returns coherent state from the written directory

## Must-Haves

- Pure format functions for each file type (roadmap, plan, summary, task plan, task summary, requirements, project, decisions, context, state) — individually testable without filesystem
- `serializeFrontmatter()` local implementation matching `parseFrontmatterMap()` expectations (underscored keys, array-of-objects for `requires`)
- `writeGSDDirectory()` async orchestrator using `saveFile()` for all I/O
- `generatePreview()` computing stats from GSDProject without writing files
- Format round-trip tests: `parseRoadmap(formatRoadmap(...))` recovers original data, same for plan and summary
- `deriveState()` integration test against a written temp directory returns `phase: 'executing'` for incomplete project
- Null/empty handling: skip research when null, skip summaries when null, handle empty vision/decisions/requirements

## Proof Level

- This slice proves: integration
- Real runtime required: yes (filesystem writes + `deriveState()` reading them back)
- Human/UAT required: no

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-writer.test.ts` — format round-trip unit tests (formatRoadmap, formatPlan, formatSummary parse back correctly) plus null/empty edge cases
- `npx tsx src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts` — writes full `.gsd` tree to temp dir, verifies file existence, parses key files, calls `deriveState()` and asserts coherent state

## Observability / Diagnostics

- Runtime signals: none — one-shot migration tool, no persistent runtime
- Inspection surfaces: test output with pass/fail counts and `FAIL:` prefix on stderr; written `.gsd` directory is fully inspectable with standard file tools
- Failure visibility: each test assertion labeled with `scenario: field description` format matching S01/S02 pattern; integration test labels include file path being verified
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `transformToGSD()` and all GSD output types from `migrate/types.ts` (S02); `saveFile()`, `parseRoadmap()`, `parsePlan()`, `parseSummary()`, `parseRequirementCounts()` from `files.ts`; `deriveState()` from `state.ts`
- New wiring introduced in this slice: `writeGSDDirectory()` and `generatePreview()` exported from `migrate/writer.ts` and `migrate/preview.ts`, added to `migrate/index.ts` barrel
- What remains before the milestone is truly usable end-to-end: S04 wires `writeGSDDirectory` + `generatePreview` into the `/gsd migrate` command with user confirmation flow

## Tasks

- [ ] **T01: Merge S02, implement format functions and round-trip unit tests** `est:45m`
  - Why: Format functions are the core of the writer — they must produce output that parses back correctly through GSD-2's parsers. Merging S02 first brings in the types and transformer. Tests are written alongside implementation so round-trip correctness is proven immediately.
  - Files: `src/resources/extensions/gsd/migrate/writer.ts`, `src/resources/extensions/gsd/tests/migrate-writer.test.ts`
  - Do: Merge S02 branch into S03. Implement `serializeFrontmatter()`, `formatRoadmap()`, `formatPlan()`, `formatSliceSummary()`, `formatTaskSummary()`, `formatTaskPlan()`, `formatRequirements()` as pure string→string functions. Write round-trip tests: feed GSD types through format functions, parse output with `parseRoadmap()`/`parsePlan()`/`parseSummary()`/`parseRequirementCounts()`, assert fields match input. Cover edge cases: empty vision, empty successCriteria, empty tasks, null summary, done/not-done checkboxes.
  - Verify: `npx tsx src/resources/extensions/gsd/tests/migrate-writer.test.ts` passes all assertions with 0 failures
  - Done when: all format functions round-trip correctly through their respective parsers

- [ ] **T02: Implement writeGSDDirectory, generatePreview, and deriveState integration test** `est:35m`
  - Why: The orchestrator writes the full directory tree, the preview computes stats, and the integration test proves `deriveState()` accepts the output — this is the slice's primary acceptance criterion.
  - Files: `src/resources/extensions/gsd/migrate/writer.ts`, `src/resources/extensions/gsd/migrate/preview.ts`, `src/resources/extensions/gsd/migrate/index.ts`, `src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts`
  - Do: Add `writeGSDDirectory(project, targetPath)` async orchestrator that calls format functions and `saveFile()` for each file in the tree. Add `generatePreview(project)` that counts milestones, slices, tasks, completion percentages. Write integration test: build a synthetic `GSDProject` with 1 milestone, 2 slices (1 done, 1 not), tasks with mixed completion, write to `mkdtempSync` dir, verify files exist, parse key files, call `deriveState()` and assert `phase: 'executing'`, `activeMilestone` present, correct slice/task counts.
  - Verify: `npx tsx src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts` passes all assertions with 0 failures
  - Done when: `deriveState()` returns coherent state from a writer-produced `.gsd` directory, preview returns correct counts, barrel exports updated

## Files Likely Touched

- `src/resources/extensions/gsd/migrate/writer.ts`
- `src/resources/extensions/gsd/migrate/preview.ts`
- `src/resources/extensions/gsd/migrate/index.ts`
- `src/resources/extensions/gsd/tests/migrate-writer.test.ts`
- `src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts`
