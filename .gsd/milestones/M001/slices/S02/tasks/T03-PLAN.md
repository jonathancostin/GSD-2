---
estimated_steps: 5
estimated_files: 2
---

# T03: Implement research consolidation, requirements mapping, field defaulting, and pass all tests

**Slice:** S02 — Transform Parsed Data to GSD Structure
**Milestone:** M001

## Description

Complete the transformer with research consolidation logic, requirements transformation, project-level field derivation (vision, projectContent, decisionsContent, successCriteria), and ensure every test assertion passes. This closes the S02 contract.

## Steps

1. Implement research consolidation in `transformer.ts`: merge `PlanningProject.research` (top-level) + per-phase `PlanningPhase.research` into a single string per milestone. Order files: SUMMARY.md first, then ARCHITECTURE.md, STACK.md, FEATURES.md, PITFALLS.md, then remaining alphabetically. Separate each file with a markdown heading (`## filename`). Return `null` if no research files exist.
2. Implement requirements mapping: transform `PlanningProject.requirements[]` → `GSDRequirement[]`. Normalize status strings to `'active'|'validated'|'deferred'` (map unknown statuses to `'active'`). Generate sequential `R001, R002, ...` IDs for entries with empty `id` fields. Default `class` to `'core-capability'`, `source` to `'inferred'`, `primarySlice` to `'none yet'`.
3. Implement project-level field derivation: (a) `projectContent`: pass through `parsed.project ?? ''`. (b) `decisionsContent`: extract key decisions from summaries or default to `''`. (c) `vision`: derive from first line of `parsed.project` (trimmed to one sentence) or roadmap title, or default. (d) `successCriteria`: `[]` (old format has no structured equivalent). (e) `boundaryMap`: `[]` (valid for `deriveState()`).
4. Verify every GSD output type field is populated or explicitly defaulted — audit each type for potential `undefined` values where S03 expects strings/arrays. Add explicit defaults for any gaps found.
5. Run full test suite. Fix any remaining failures. Add additional edge-case assertions if gaps were found during implementation (e.g. research with no files, requirements with no ID, vision from project with no description).

## Must-Haves

- [ ] Research consolidation: files merged in defined order, per-milestone
- [ ] Requirements: status normalized, IDs generated when missing, defaults applied
- [ ] Project-level fields: projectContent, decisionsContent, vision, successCriteria all populated
- [ ] No `undefined` values in output where S03 expects strings or arrays
- [ ] All test assertions pass with 0 failures

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — 0 failures, all scenarios pass
- Spot-check: output `GSDProject` from a complex fixture has no undefined fields in milestone/slice/task trees

## Observability Impact

- Signals added/changed: None — pure function remains pure
- How a future agent inspects this: run test file, expect exit code 0 and `All tests passed` message
- Failure state exposed: any remaining `FAIL:` lines in test output pinpoint exact field and scenario

## Inputs

- `src/resources/extensions/gsd/migrate/transformer.ts` — core logic from T02 (milestone detection, phase→slice, plan→task)
- `src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — test fixtures with research, requirements, and field-defaulting scenarios (from T01)
- S02-RESEARCH.md — research consolidation order, requirements pitfalls, field defaulting strategy

## Expected Output

- `src/resources/extensions/gsd/migrate/transformer.ts` — complete transformer with all features, ~200–300 lines total
- `src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — possibly updated with additional edge-case assertions
- All tests pass: `npx tsx` exits 0
