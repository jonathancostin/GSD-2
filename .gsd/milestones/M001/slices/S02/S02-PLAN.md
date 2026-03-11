# S02: Transform Parsed Data to GSD Structure

**Goal:** A pure `transformToGSD(parsed: PlanningProject): GSDProject` function converts any parsed old-format project into typed GSD-2 output — with correct milestone detection, decimal phase float-sorting, sequential slice/task renumbering, completion state mapping, field defaulting, and research consolidation.
**Demo:** Transformer tests against synthetic `PlanningProject` fixtures covering flat roadmaps, multi-milestone roadmaps, decimal phases, done/not-done states, and edge cases all pass.

## Must-Haves

- GSD output types (`GSDProject`, `GSDMilestone`, `GSDSlice`, `GSDTask`, etc.) defined in `migrate/types.ts` with all fields S03's writer needs
- Single-milestone mode: flat roadmap phases → M001 with float-sorted, sequentially numbered slices
- Multi-milestone mode: roadmap milestone sections → separate GSD milestones with independent slice numbering
- Decimal phases (1, 2, 2.1, 2.2, 3) sort correctly and renumber to S01–S05
- Completion state: roadmap `[x]` → `slice.done: true`; summary existence → `task.done: true`
- Field defaulting: risk → `'medium'`, demo → derived from first plan objective, estimate → from summary duration or `''`
- Research files consolidated per milestone in defined order
- Requirements mapped with generated IDs when missing
- Barrel export updated with `transformToGSD` and all GSD output types

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — all assertions pass with 0 failures
- Test scenarios cover: flat→M001, multi-milestone→M001+M002, decimal phase ordering, done phases/tasks, research consolidation, requirements classification, empty phases, orphan summaries skipped, demo derivation, field defaulting

## Observability / Diagnostics

- Runtime signals: none — pure synchronous function, no I/O or side effects
- Inspection surfaces: test output with pass/fail counts and labeled assertion messages
- Failure visibility: each assertion names its scenario and field, `FAIL:` prefix on stderr for easy grep
- Redaction constraints: none — no secrets in migration data

## Integration Closure

- Upstream surfaces consumed: `PlanningProject` and all 18 input types from `migrate/types.ts` (S01), parser helpers from `migrate/parsers.ts` (S01)
- New wiring introduced in this slice: `transformToGSD()` entry point exported from `migrate/index.ts`; GSD output types added to `migrate/types.ts`
- What remains before the milestone is truly usable end-to-end: S03 (writer to serialize `GSDProject` → `.gsd/` files), S04 (CLI command)

## Tasks

- [x] **T01: Merge S01, define GSD output types, and scaffold test file** `est:45m`
  - Why: S01's migrate files aren't on this branch yet, and the output type contract must be defined before transformer logic. The test file (initially failing) establishes the verification target.
  - Files: `src/resources/extensions/gsd/migrate/types.ts`, `src/resources/extensions/gsd/migrate/index.ts`, `src/resources/extensions/gsd/tests/migrate-transformer.test.ts`
  - Do: (1) `git merge gsd/M001/S01` to bring in S01 files. (2) Extend `types.ts` with GSD output types: `GSDProject`, `GSDMilestone`, `GSDSlice`, `GSDTask`, `GSDRequirement`, `GSDSliceSummaryData`, `GSDTaskSummaryData`, `GSDBoundaryEntry`. Mirror GSD-2 runtime type shapes (`RoadmapSliceEntry`, `TaskPlanEntry`, `SummaryFrontmatter`) so S03's writer is mechanical. (3) Create test file with fixture helpers that build synthetic `PlanningProject` objects in-memory (no filesystem), import `transformToGSD` (will fail until T02), and define test scenarios: flat single-milestone, multi-milestone, decimal phase ordering, completion state, research consolidation, requirements, empty phase, demo derivation. (4) Update barrel export in `index.ts` with new types and `transformToGSD`.
  - Verify: `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts` runs and reports failures (expected — transformer not yet implemented)
  - Done when: types compile, test file runs without import errors, all test assertions report FAIL (not crash)

- [ ] **T02: Implement core transformer — milestone detection, phase-to-slice mapping, task mapping** `est:1h`
  - Why: This is the main transformation logic covering single/multi-milestone detection, float-sorted phase→slice mapping with sequential renumbering, plan→task mapping, and completion state passthrough.
  - Files: `src/resources/extensions/gsd/migrate/transformer.ts`
  - Do: (1) Create `transformer.ts` with `transformToGSD(parsed: PlanningProject): GSDProject`. (2) Detect mode: if `parsed.roadmap.milestones` non-empty → multi-milestone; else → single-milestone. (3) Single-milestone: collect all `Object.values(parsed.phases)`, sort by `phase.number` (float), assign S01/S02/... IDs, create one `GSDMilestone` with id `M001`. (4) Multi-milestone: for each roadmap milestone section, match `PlanningRoadmapEntry.number` to `PlanningPhase.number`, sort matched phases, assign sequential slice IDs starting S01 per milestone, create `GSDMilestone` with id M001/M002/... (5) For each phase→slice: title from slug (kebab-to-title-case), done from roadmap entry, risk `'medium'`, depends `[prev]` or `[]`, goal from slug, demo from first plan objective (first sentence) or default. (6) For each plan→task: sort by planNumber, assign T01/T02..., done if summary exists, title from frontmatter or slug+number, description from objective, estimate from summary duration or `''`, files from frontmatter `files_modified`, mustHaves from `must_haves.truths`. (7) Handle edge cases: fallback when `parsed.roadmap` is null (use filesystem phases, all not-done), orphan summaries without plans are skipped (only create task if plan exists), empty phases produce slices with zero tasks. (8) Build slice summary data from plan summaries when slice is done. Build task summary data from individual plan summaries.
  - Verify: `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — flat roadmap, multi-milestone, decimal ordering, completion state, and empty phase tests pass
  - Done when: core mapping tests pass — phases→slices with correct IDs and ordering, plans→tasks with correct done state, multi-milestone splitting works

- [ ] **T03: Implement research consolidation, requirements mapping, field defaulting, and pass all tests** `est:45m`
  - Why: Completes the transformer with research consolidation, requirements transformation, project-level field derivation (vision, successCriteria, projectContent, decisionsContent), and ensures every remaining test assertion passes.
  - Files: `src/resources/extensions/gsd/migrate/transformer.ts`, `src/resources/extensions/gsd/tests/migrate-transformer.test.ts`
  - Do: (1) Research consolidation: merge `PlanningProject.research` + per-phase `research` into milestone-level research blob. Order: SUMMARY.md first, then ARCHITECTURE.md, STACK.md, FEATURES.md, PITFALLS.md, then others alphabetically. (2) Requirements: map `PlanningRequirement[]` → `GSDRequirement[]`, normalize status to `'active'|'validated'|'deferred'`, generate sequential R001/R002... IDs for entries with empty IDs, default class to `'core-capability'`, source to `'inferred'`. (3) Project-level: `projectContent` from `parsed.project` or empty default, `decisionsContent` from old key decisions or empty, vision from project description or roadmap title, successCriteria from roadmap or `[]`. (4) Boundary map: produce empty `[]` (old format has no equivalent; valid for `deriveState()`). (5) Fix any remaining test failures, add edge case assertions if gaps found during implementation. (6) Verify every GSD output type field is populated or explicitly defaulted — no `undefined` values where S03 expects strings.
  - Verify: `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — all assertions pass, 0 failures
  - Done when: all test scenarios pass including research consolidation order, requirements ID generation, field defaulting, and full `GSDProject` shape validation

## Files Likely Touched

- `src/resources/extensions/gsd/migrate/types.ts`
- `src/resources/extensions/gsd/migrate/transformer.ts`
- `src/resources/extensions/gsd/migrate/index.ts`
- `src/resources/extensions/gsd/tests/migrate-transformer.test.ts`
