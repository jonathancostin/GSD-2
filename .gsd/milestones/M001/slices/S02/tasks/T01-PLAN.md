---
estimated_steps: 4
estimated_files: 3
---

# T01: Merge S01, define GSD output types, and scaffold test file

**Slice:** S02 — Transform Parsed Data to GSD Structure
**Milestone:** M001

## Description

Bring S01's migrate files onto this branch, define the GSD output type contract in `types.ts`, scaffold the test file with synthetic `PlanningProject` fixtures and assertions that will initially all fail, and update the barrel export.

## Steps

1. Run `git merge gsd/M001/S01` to bring S01's migrate files (types.ts, parser.ts, parsers.ts, validator.ts, index.ts, test file) onto the S02 branch. Resolve any conflicts if they arise.
2. Extend `migrate/types.ts` with GSD output types: `GSDProject`, `GSDMilestone`, `GSDSlice`, `GSDTask`, `GSDRequirement`, `GSDSliceSummaryData`, `GSDTaskSummaryData`, `GSDBoundaryEntry`. Design these to mirror GSD-2 runtime shapes (`RoadmapSliceEntry`, `TaskPlanEntry`, `SummaryFrontmatter`) so S03's writer is purely mechanical serialization. Include all fields documented in S02-RESEARCH.md's "GSD Output Type Design" section.
3. Create `tests/migrate-transformer.test.ts` with: (a) fixture helpers that build synthetic `PlanningProject` objects in-memory (no filesystem), (b) import of `transformToGSD` from `../migrate/transformer.ts`, (c) test scenarios covering: flat single-milestone (3 phases → M001 with S01/S02/S03), multi-milestone (2 milestones with independent slice numbering), decimal phase ordering (1, 2, 2.1, 2.2, 3 → S01–S05), completion state (done roadmap entry → done slice, summary existence → done task), research consolidation (3 files → single blob), requirements classification, empty phase (no plans → slice with 0 tasks), demo derivation from plan objective.
4. Update `migrate/index.ts` barrel export to include `transformToGSD` and all new GSD output type exports.

## Must-Haves

- [ ] S01 files present on branch after merge
- [ ] GSD output types defined with all fields S03 needs — no undefined where strings expected
- [ ] Test file runs without import/compile errors (assertions fail, not crash)
- [ ] Barrel export includes `transformToGSD` and all GSD output types

## Verification

- `git log --oneline -3` shows merge commit from S01
- `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts` runs to completion (reports FAIL assertions, exit code 1, but no import errors or crashes)

## Observability Impact

- Signals added/changed: None — types are compile-time only, test file produces pass/fail counts
- How a future agent inspects this: run the test file, grep for `FAIL:` in output
- Failure state exposed: each assertion has a descriptive label identifying scenario and field

## Inputs

- `gsd/M001/S01` branch — contains `migrate/types.ts`, `migrate/parser.ts`, `migrate/parsers.ts`, `migrate/validator.ts`, `migrate/index.ts`
- S02-RESEARCH.md "GSD Output Type Design" section — exact type shapes
- `src/resources/extensions/gsd/types.ts` — GSD-2 runtime types to mirror (`RoadmapSliceEntry`, `TaskPlanEntry`, `SummaryFrontmatter`)
- S01 test file pattern — `assert`/`assertEq` helpers, pass/fail counter, exit code on failure

## Expected Output

- `src/resources/extensions/gsd/migrate/types.ts` — extended with 8 GSD output types
- `src/resources/extensions/gsd/migrate/index.ts` — updated barrel export
- `src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — complete test file with ~40+ assertions across 8 scenarios, all currently failing
