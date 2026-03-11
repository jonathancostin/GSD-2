# S01: Old .planning Parser — UAT

**Milestone:** M001
**Written:** 2026-03-11

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 is a pure parsing library with no runtime UI, no server, and no user-facing output. All behavior is captured as typed return values from pure functions. The 120-assertion fixture-based test suite exercises every code path against synthetic `.planning` directories covering all file types and edge cases. No live runtime or human experience is needed to prove correctness.

## Preconditions

- Node.js and `tsx` available (`npx tsx` works)
- Working directory is the GSD-2 project root
- All dependencies installed (`node_modules` present)

## Smoke Test

```
npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts
```

Expected output: `Results: 120 passed, 0 failed` and `All tests passed ✓`

## Test Cases

### 1. Complete .planning directory parses fully

1. Run `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts`
2. Observe the "Complete .planning directory" test group passes
3. **Expected:** PlanningProject returned with project content, roadmap with phases, phase with plan and summary, requirements entries, research files, state and config parsed

### 2. Minimal directory (ROADMAP.md only) parses without crash

1. Run the test suite
2. Observe the "Minimal .planning directory" test group passes
3. **Expected:** Parser returns valid PlanningProject with null values for missing files, no thrown error

### 3. Missing directory returns fatal validation error

1. Run the test suite
2. Observe the "Missing .planning directory" test group passes
3. **Expected:** `validatePlanningDirectory` returns `{valid: false, issues: [{severity: 'fatal', ...}]}`; `parsePlanningDirectory` throws or returns with fatal validation issues

### 4. Duplicate phase numbers preserved

1. Run the test suite
2. Observe the "Duplicate phase numbers" test group passes
3. **Expected:** Both `"01-first-phase"` and `"01-second-phase"` appear as separate keys in `PlanningProject.phases` Map

### 5. XML-in-markdown plan parsed

1. Run the test suite
2. Observe the "XML-in-markdown plan" test group passes
3. **Expected:** `PlanningPlan.objective`, `.tasks`, `.context` populated from `<objective>`, `<task>`, `<context>` tags in plan file content

### 6. Summary YAML frontmatter parsed

1. Run the test suite
2. Observe the "Summary YAML frontmatter" test group passes
3. **Expected:** `PlanningSummary` has correct `id`, `technicalDecisions`, `keyFiles`, `patternsEstablished` values — including hyphenated-key fields

### 7. Orphan summaries included

1. Run the test suite
2. Observe the "Orphan summaries" test group passes
3. **Expected:** Summary file with no matching plan file appears in `PlanningPhase.summaries` with `plan: null`

### 8. .archive/ directory skipped

1. Run the test suite
2. Observe the ".archive/ directory skipped" test group passes
3. **Expected:** Phase directories inside `.archive/` are not included in `PlanningProject.phases`

### 9. Quick tasks parsed

1. Run the test suite
2. Observe the "Quick tasks parsed" test group passes
3. **Expected:** Tasks from `quick/` subdirectories appear in `PlanningProject.quickTasks`

### 10. Milestone-sectioned roadmap with `<details>` blocks

1. Run the test suite
2. Observe the "Roadmap with milestone sections and details blocks" test group passes
3. **Expected:** `PlanningRoadmap.milestones` contains entries; each milestone has `phases` with correct `title` and `complete` state

### 11. Extra files collected

1. Run the test suite
2. Observe the "Non-standard phase files" test group passes
3. **Expected:** Files not matching plan/summary/research/verification patterns appear in `PlanningPhase.extraFiles`

## Edge Cases

### Missing ROADMAP.md is fatal

1. Run the test suite
2. Observe the "Validation: missing ROADMAP.md → fatal" test group passes
3. **Expected:** `ValidationResult.valid === false`, issue with `severity: 'fatal'` referencing ROADMAP.md

### Missing PROJECT.md is a warning (not fatal)

1. Run the test suite
2. Observe the "Validation: missing PROJECT.md → warning" test group passes
3. **Expected:** `ValidationResult.valid === true` (still valid), issue with `severity: 'warning'` referencing PROJECT.md

## Failure Signals

- Any test group showing `FAIL` in output with non-zero failed count
- Import errors at test startup (indicates type or module resolution problem)
- `parsePlanningDirectory` throwing instead of returning null values for missing files
- `validatePlanningDirectory` returning `valid: true` for a missing directory

## Requirements Proved By This UAT

- R001 — Proved: parser reads all old .planning file types (PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, config.json, phase plans, summaries, research, quick tasks) into typed structures, handling both flat and milestone-sectioned roadmap formats and XML-in-markdown plan content
- R008 — Proved: validator returns structured ValidationResult with severity-classified issues; missing directory and missing ROADMAP.md are fatal; missing optional files are warnings; structured `{file, severity, message}` format is machine-readable

## Not Proven By This UAT

- R002, R003, R004, R005 (transformation, mapping, content conversion) — S02 scope
- R006 (write .gsd directory) — S03 scope
- R007 (/gsd migrate command, preview, confirmation) — S04 scope
- R008 partial — validation surfaces in the CLI (user-visible error messages in the migrate command) are S04 scope
- R009 partial — edge cases in transformation (decimal phases, quick task mapping) are S02 scope
- Live runtime behavior of the parser against a real (non-synthetic) `.planning` directory — synthetic fixtures cover the format comprehensively, but a real-world smoke test could catch undocumented format variations

## Notes for Tester

The test suite creates and destroys temporary directories using `mkdtempSync` — no cleanup needed. All test cases are self-contained. If a test group fails unexpectedly, the most informative next step is to inspect the fixture creation for that group in `migrate-parser.test.ts` and compare against the parser logic in `parser.ts` or the relevant per-file parser in `parsers.ts`.
