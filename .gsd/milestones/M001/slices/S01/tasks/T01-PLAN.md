---
estimated_steps: 4
estimated_files: 3
---

# T01: Export helpers from files.ts and create types + test scaffold

**Slice:** S01 — Old .planning Parser
**Milestone:** M001

## Description

Three foundational pieces: (1) export the private helper functions from `files.ts` that the parser needs, (2) define all typed interfaces for the old `.planning` format, and (3) create the test file with all assertions (initially failing) that defines the slice's verification target.

## Steps

1. In `files.ts`, add `export` keyword to `splitFrontmatter`, `parseFrontmatterMap`, `extractSection`, `extractAllSections`, `parseBullets`, `extractBoldField`. Do not change function signatures or behavior.
2. Run `npx tsx src/resources/extensions/gsd/tests/parsers.test.ts` and `npx tsx src/resources/extensions/gsd/tests/derive-state.test.ts` to confirm no regressions from export changes.
3. Create `src/resources/extensions/gsd/migrate/types.ts` with interfaces: `PlanningProject` (top-level container), `PlanningPhase` (phase directory contents), `PlanningPlan` (parsed plan file — frontmatter + XML sections), `PlanningPlanFrontmatter` (old plan frontmatter schema), `PlanningRequirement` (single requirement entry), `PlanningResearch` (research file content), `PlanningConfig` (config.json shape), `PlanningQuickTask` (quick task), `PlanningMilestone` (milestone-level data from `milestones/` dir), `PlanningRoadmapEntry` (single phase entry from roadmap with completion state), `PlanningRoadmapMilestone` (milestone section in roadmap), `PlanningPhaseFile` (generic extra file reference), `PlanningState` (parsed STATE.md), `ValidationResult` (issues array with severity), `ValidationIssue` (file, severity, message). Cover all fields discovered in research: summary frontmatter fields (`phase`, `plan`, `subsystem`, `tags`, `requires`, `provides`, `affects`, `tech-stack`, `key-files`, `key-decisions`, `patterns-established`, `duration`, `completed`), plan frontmatter fields (`phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`).
4. Create `src/resources/extensions/gsd/tests/migrate-parser.test.ts` with: (a) fixture helpers that create synthetic `.planning` directories using `mkdtempSync`/`writeFileSync`/`mkdirSync`, (b) test cases for all verification criteria in S01-PLAN.md (complete dir, minimal dir, missing dir, duplicate phase numbers, XML-in-markdown plan, summary frontmatter, orphan summaries, `.archive/` skipping, quick tasks, milestone-sectioned roadmap, extra files, validation fatal/warning), (c) cleanup with `rmSync`. Tests import from `../migrate/parser.ts` and `../migrate/validator.ts` — they will fail since those files don't exist yet.

## Must-Haves

- [ ] 6 helpers exported from `files.ts` without changing signatures
- [ ] No regressions in existing parser/state tests
- [ ] `PlanningProject` and all related interfaces defined with correct field types
- [ ] `ValidationResult` and `ValidationIssue` types defined
- [ ] Test file has assertions covering all S01 verification criteria
- [ ] Test file compiles and runs (import errors are acceptable; syntax errors are not)

## Verification

- `npx tsx src/resources/extensions/gsd/tests/parsers.test.ts` passes (no regression)
- `npx tsx src/resources/extensions/gsd/tests/derive-state.test.ts` passes (no regression)
- `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` runs (expected: failures from missing parser, but no syntax/compile errors in the test file itself)

## Observability Impact

- Signals added/changed: None — types and test scaffold only
- How a future agent inspects this: Read `types.ts` for the contract; run the test file to see which assertions fail
- Failure state exposed: Test output shows pass/fail count with descriptive messages per assertion

## Inputs

- `src/resources/extensions/gsd/files.ts` — helpers to export
- S01-RESEARCH.md — old format field names and structures
- `src/resources/extensions/gsd/tests/derive-state.test.ts` — test pattern to follow

## Expected Output

- `src/resources/extensions/gsd/files.ts` — 6 functions now exported (no other changes)
- `src/resources/extensions/gsd/migrate/types.ts` — complete type definitions for old format
- `src/resources/extensions/gsd/tests/migrate-parser.test.ts` — test scaffold with all assertions
