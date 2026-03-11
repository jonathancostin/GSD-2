---
estimated_steps: 5
estimated_files: 3
---

# T01: Merge S02, implement format functions and round-trip unit tests

**Slice:** S03 — Directory Writer with deriveState Integration
**Milestone:** M001

## Description

The format functions are the writer's core — each one serializes a GSD type into the exact markdown format that GSD-2's parsers expect. This task merges S02 (bringing in types and transformer), implements all format functions as pure string-returning functions, and writes round-trip unit tests that feed GSD types through the format functions and parse the output back through `parseRoadmap()`, `parsePlan()`, `parseSummary()`, and `parseRequirementCounts()`.

The most critical format is ROADMAP.md — it drives `deriveState()` and has the most parser constraints (checkbox regex, risk/depends backtick format, demo `>` prefix). PLAN.md is second (task checkbox regex, `## Tasks` section structure). SUMMARY.md is third (YAML frontmatter with underscored keys). The simpler passthrough files (PROJECT.md, DECISIONS.md, CONTEXT.md, STATE.md, REQUIREMENTS.md, task plans, task summaries) are straightforward.

## Steps

1. Merge `gsd/M001/S02` branch into `gsd/M001/S03` to bring in `migrate/types.ts`, `migrate/transformer.ts`, `migrate/index.ts`, and the transformer test.
2. Create `migrate/writer.ts` with `serializeFrontmatter()` (local, not exported — implements YAML frontmatter serialization matching `parseFrontmatterMap()` expectations), then implement format functions: `formatRoadmap(milestone: GSDMilestone)`, `formatPlan(slice: GSDSlice)`, `formatSliceSummary(slice: GSDSlice, milestoneId: string)`, `formatTaskSummary(task: GSDTask, sliceId: string, milestoneId: string)`, `formatTaskPlan(task: GSDTask, sliceId: string, milestoneId: string)`, `formatRequirements(requirements: GSDRequirement[])`. Each returns a string. Key constraints from research: checkbox format `- [ ] **S01: Title** \`risk:medium\` \`depends:[]\``, demo line `  > After this: ...`, YAML keys use underscores (`key_files` not `key-files`), empty arrays as `[]`, `requires: []` and `affects: []` for slice summaries, skip `## Boundary Map` section entirely (D004).
3. Implement passthrough format helpers: `formatProject(content: string)`, `formatDecisions(content: string)`, `formatContext(milestoneId: string)`, `formatState(milestones: GSDMilestone[])`. These are thin wrappers that ensure valid markdown structure for content that's passed through from the transformer.
4. Create test file `tests/migrate-writer.test.ts` using the same `assert`/`assertEq` pattern from S01/S02 tests. Write round-trip scenarios: (a) roadmap with 2 slices (1 done, 1 not) — format then parse, verify title/vision/slices/done/risk/depends/demo match; (b) plan with 3 tasks (mixed done) — format then parse, verify goal/demo/tasks/done/estimate match; (c) slice summary with full data — format then parse, verify all frontmatter fields including `key_files`, `provides`, `patterns_established`; (d) task summary — format then parse; (e) requirements with mixed statuses — format then parseRequirementCounts, verify counts; (f) edge cases: empty vision → fallback text, empty successCriteria → empty array, empty tasks → `[]`, null summary → no summary file content, done=true checkbox.
5. Run tests, fix any format issues until all assertions pass.

## Must-Haves

- [ ] S02 branch merged — types.ts, transformer.ts, index.ts available on S03
- [ ] `serializeFrontmatter()` produces YAML that `parseFrontmatterMap()` reads back correctly (underscored keys, arrays, nested objects)
- [ ] `formatRoadmap()` output parses correctly through `parseRoadmap()` — checkbox state, risk, depends, demo all survive round-trip
- [ ] `formatPlan()` output parses correctly through `parsePlan()` — task checkboxes, estimates, goal, demo all survive round-trip
- [ ] `formatSliceSummary()` output parses correctly through `parseSummary()` — all frontmatter fields including `key_files`, `key_decisions`, `patterns_established` survive round-trip
- [ ] `formatTaskSummary()` output parses correctly through `parseSummary()`
- [ ] `formatRequirements()` output parses correctly through `parseRequirementCounts()` — counts match per status
- [ ] Edge cases: empty vision/criteria/tasks, null summary, done checkboxes

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-writer.test.ts` — all assertions pass, 0 failures
- Grep for `FAIL:` in stderr to confirm no regressions

## Observability Impact

- Signals added/changed: None — pure functions, no runtime state
- How a future agent inspects this: Read test output; each assertion labeled `scenario: field` for localization
- Failure state exposed: `FAIL:` lines on stderr with expected vs actual values

## Inputs

- `src/resources/extensions/gsd/migrate/types.ts` — GSD output types (GSDProject, GSDMilestone, GSDSlice, GSDTask, etc.)
- `src/resources/extensions/gsd/files.ts` — `parseRoadmap()`, `parsePlan()`, `parseSummary()`, `parseRequirementCounts()` as round-trip verification oracles
- S03-RESEARCH.md Format Contracts section — exact regex patterns and field names the parsers expect

## Expected Output

- `src/resources/extensions/gsd/migrate/writer.ts` — all format functions implemented, `serializeFrontmatter()` local helper
- `src/resources/extensions/gsd/tests/migrate-writer.test.ts` — round-trip test suite with all assertions passing
