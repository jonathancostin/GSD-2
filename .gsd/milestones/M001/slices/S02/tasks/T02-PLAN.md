---
estimated_steps: 5
estimated_files: 1
---

# T02: Implement core transformer — milestone detection, phase-to-slice mapping, task mapping

**Slice:** S02 — Transform Parsed Data to GSD Structure
**Milestone:** M001

## Description

Implement `migrate/transformer.ts` with the core `transformToGSD()` function covering milestone detection (flat vs multi-milestone), phase-to-slice mapping with float-sorted renumbering, plan-to-task mapping, completion state passthrough, and edge case handling. This is the main business logic of S02.

## Steps

1. Create `migrate/transformer.ts`. Import `PlanningProject` and related input types from `./types.ts`. Export `transformToGSD(parsed: PlanningProject): GSDProject`.
2. Implement milestone detection: if `parsed.roadmap?.milestones` is non-empty → multi-milestone mode (each roadmap milestone section → one `GSDMilestone`); otherwise → single-milestone mode (all phases → `M001`). Handle null roadmap: use filesystem phases, all `done: false`.
3. Implement phase-to-slice mapping: (a) Collect phases from roadmap entries matched to `parsed.phases` by phase number. (b) Sort by `phase.number` (float sort). (c) Assign sequential `S01, S02, ...` IDs. (d) Title: kebab-to-title-case from `phase.slug`. (e) `done`: from `PlanningRoadmapEntry.done`. (f) `risk`: `'medium'`. (g) `depends`: `[prevSliceId]` or `[]` for first. (h) `demo`: first sentence of first plan's `objective`, fallback `"unit tests prove ${slug} works"`. (i) `goal`: same derivation as demo. (j) Handle roadmap entry with no corresponding filesystem phase — create slice with zero tasks.
4. Implement plan-to-task mapping within each phase: (a) Iterate `Object.entries(phase.plans)` sorted by planNumber numerically. (b) Assign `T01, T02, ...`. (c) `done`: `phase.summaries[planNumber] !== undefined`. (d) `title`: from plan frontmatter `phase` + `plan` fields, or `slug + planNumber`. (e) `description`: from `plan.objective`. (f) `estimate`: from corresponding summary's `duration` if exists, else `''`. (g) `files`: from `plan.frontmatter.files_modified`. (h) `mustHaves`: from `plan.frontmatter.must_haves?.truths ?? []`. (i) Skip orphan summaries without matching plans. (j) Build `GSDTaskSummaryData` from summary when task is done. Build `GSDSliceSummaryData` from aggregated plan summaries when slice is done.
5. Wire milestone-level fields: `title` from roadmap milestone title or `"Migration"` default, `vision` stubbed (T03 fills from project), `successCriteria` as `[]`, `research` as `null` (T03 fills), `boundaryMap` as `[]`.

## Must-Haves

- [ ] Single-milestone mode: flat roadmap phases → M001 with correct sequential slice IDs
- [ ] Multi-milestone mode: roadmap milestone sections → separate GSD milestones with independent S01-based numbering
- [ ] Decimal phases float-sort correctly (1, 2, 2.1, 2.2, 3 → S01–S05)
- [ ] Completion state: `PlanningRoadmapEntry.done` → `GSDSlice.done`, summary existence → `GSDTask.done`
- [ ] Plans sorted by planNumber, tasks assigned T01/T02/... sequentially
- [ ] Demo derived from first plan objective or defaulted
- [ ] Orphan summaries without plans do not become tasks
- [ ] Empty phases (no plans) produce slices with zero tasks
- [ ] Null roadmap fallback: filesystem phases used, all not-done

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — flat roadmap, multi-milestone, decimal ordering, completion state, empty phase, and orphan summary tests pass
- Core mapping tests (flat, multi-milestone, decimal, completion, empty phase) should pass; research/requirements tests may still fail

## Observability Impact

- Signals added/changed: None — pure function with no side effects
- How a future agent inspects this: run test file, check pass/fail counts, grep for specific `FAIL:` lines
- Failure state exposed: assertion labels identify which mapping (milestone, slice, task) and which field failed

## Inputs

- `src/resources/extensions/gsd/migrate/types.ts` — all input types (`PlanningProject`, etc.) and output types (from T01)
- `src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — test fixtures defining expected behavior (from T01)
- S02-RESEARCH.md — transformation strategy, pitfalls (roadmap milestones vs project milestones, phase number uniqueness, demo derivation)

## Expected Output

- `src/resources/extensions/gsd/migrate/transformer.ts` — complete core transformer logic, ~150–250 lines
- Majority of test assertions passing (core mapping scenarios); research/requirements scenarios may still fail pending T03
