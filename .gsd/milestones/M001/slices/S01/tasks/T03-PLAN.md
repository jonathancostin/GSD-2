---
estimated_steps: 5
estimated_files: 3
---

# T03: Implement main parser orchestrator and pass all tests

**Slice:** S01 — Old .planning Parser
**Milestone:** M001

## Description

Build `parsePlanningDirectory(path): PlanningProject` — the main orchestrator that walks a `.planning` directory tree, delegates to per-file parsers from T02, handles all edge cases (duplicate phase numbers, orphan summaries, `.archive/` skipping, quick tasks, extra files), and assembles the complete typed `PlanningProject`. This is the public API consumed by S02's transformer.

## Steps

1. Create `src/resources/extensions/gsd/migrate/parser.ts` with `parsePlanningDirectory(path): Promise<PlanningProject>`:
   - Load and parse top-level files: `PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `STATE.md`, `config.json` using per-file parsers from T02
   - Scan `phases/` directory with `readdirSync`, filter to directories matching phase naming pattern (`NN-slug` or `NN.N-slug`)
   - Use full directory name (number + slug) as the unique key — not just the phase number — to handle duplicates
   - Detect and skip `.archive/` directory
   - For each phase directory: scan for plan files (`NN-NN-PLAN.md`), summary files (`NN-NN-SUMMARY.md`), research files, verification files (`*VERIFICATION*`), and collect all other files as extras
   - Handle orphan summaries: summaries without matching plan files are included in the phase
   - Scan `quick/` directory for quick tasks: `NNN-slug/NNN-PLAN.md` and `NNN-SUMMARY.md`
   - Scan `research/` directory for research files
   - Scan `milestones/` directory for per-milestone files (REQUIREMENTS, ROADMAP, summary docs)
   - Scan `codebase/` directory and include as metadata
   - Scan `todos/` directory and include completed todos
2. Wire phase completion state: cross-reference `phases/` directory contents with roadmap checkbox state. A phase is complete if its roadmap entry is `[x]`.
3. Create `src/resources/extensions/gsd/migrate/index.ts` barrel export: re-export `parsePlanningDirectory` from `parser.ts`, `validatePlanningDirectory` from `validator.ts`, and all types from `types.ts`.
4. Run full test suite: `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts`. Debug and fix any failing assertions.
5. Run existing GSD tests to confirm no regressions: `npx tsx src/resources/extensions/gsd/tests/parsers.test.ts` and `npx tsx src/resources/extensions/gsd/tests/derive-state.test.ts`.

## Must-Haves

- [ ] `parsePlanningDirectory` returns complete `PlanningProject` for a fully-populated fixture
- [ ] Duplicate phase numbers preserved with full directory name keys
- [ ] `.archive/` directory detected and skipped
- [ ] Orphan summaries included (summaries without matching plan files)
- [ ] Quick tasks parsed from `quick/` directory
- [ ] Non-standard files collected as extras
- [ ] Minimal directory (only ROADMAP.md) parses without error
- [ ] All test assertions pass
- [ ] No regressions in existing tests

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` — all assertions pass, exit code 0
- `npx tsx src/resources/extensions/gsd/tests/parsers.test.ts` — no regression
- `npx tsx src/resources/extensions/gsd/tests/derive-state.test.ts` — no regression

## Observability Impact

- Signals added/changed: `PlanningProject` structure is fully inspectable — every parsed file is represented in typed fields. Missing files result in `null` values, not thrown errors.
- How a future agent inspects this: Import `parsePlanningDirectory`, call it, inspect the returned object. All fields are typed and documented in `types.ts`.
- Failure state exposed: Parse failures for individual files don't crash the whole parse — they produce `null` values or empty collections. The validator (T02) catches structural issues pre-flight.

## Inputs

- `src/resources/extensions/gsd/migrate/types.ts` — type definitions from T01
- `src/resources/extensions/gsd/migrate/parsers.ts` — per-file parsers from T02
- `src/resources/extensions/gsd/migrate/validator.ts` — validator from T02
- `src/resources/extensions/gsd/tests/migrate-parser.test.ts` — test cases from T01

## Expected Output

- `src/resources/extensions/gsd/migrate/parser.ts` — main orchestrator, the public API for the slice
- `src/resources/extensions/gsd/migrate/index.ts` — barrel export for clean imports
- All tests green: `migrate-parser.test.ts` passes with exit code 0
