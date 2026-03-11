# S01: Old .planning Parser

**Goal:** A tested parser that reads any representative `.planning` directory into typed data structures, handling format variations, missing files, and edge cases.
**Demo:** `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` passes — proving the parser correctly reads PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, phase directories, plan files (XML-in-markdown), summary files (YAML frontmatter), research files, quick tasks, and config — including detection of missing/corrupt files.

## Must-Haves

- Typed interfaces for the entire old `.planning` structure (`PlanningProject`, `PlanningPhase`, `PlanningPlan`, `PlanningRequirement`, `PlanningResearch`, `PlanningConfig`, `ValidationResult`)
- `parsePlanningDirectory(path): PlanningProject` reads a complete `.planning` directory tree
- `validatePlanningDirectory(path): ValidationResult` pre-flight check reports missing/corrupt files with severity levels (fatal vs warning)
- XML-in-markdown plan parser extracts `<objective>`, `<tasks>`, `<task>`, `<context>`, `<verification>`, `<success_criteria>` sections
- YAML frontmatter parsing for old summary and plan formats using exported helpers from `files.ts`
- Roadmap parser handles both flat phase lists and milestone-sectioned roadmaps with `<details>` blocks
- Handles duplicate phase numbers (uses full directory name as key, not just number)
- Handles orphan summaries (summaries without corresponding plan files)
- Handles missing optional files (PROJECT.md, REQUIREMENTS.md, STATE.md) without crashing
- Collects non-standard files in phase directories as "extra files"
- Detects and skips `.archive/` directories by default
- Parses quick tasks from `quick/` directory
- Zero Pi dependencies — pure functions using only Node built-ins
- R001 (Parse old .planning directory structure) fully satisfied
- R008 (Validate source before migration) fully satisfied for parser-side validation

## Proof Level

- This slice proves: contract
- Real runtime required: no — fixture-based tests with synthetic `.planning` directories
- Human/UAT required: no

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` — all assertions pass, exit code 0
- Test coverage includes:
  - Complete `.planning` directory with all file types → parsed `PlanningProject` with correct field values
  - Minimal `.planning` directory (only ROADMAP.md) → parses without error, empty collections for missing files
  - Missing directory → validation returns fatal error
  - Phase directory with duplicate numbers → both preserved with full directory name keys
  - Plan file with XML-in-markdown → objective, tasks, context extracted correctly
  - Summary file with YAML frontmatter → all frontmatter fields parsed
  - Orphan summaries (no matching plan) → included in phase data
  - `.archive/` directory → skipped by default
  - Quick tasks → parsed into separate collection
  - Roadmap with milestone sections and `<details>` blocks → phases extracted with completion state
  - Non-standard phase files → collected as extra files
  - Validation: missing ROADMAP.md → fatal; missing PROJECT.md → warning

## Observability / Diagnostics

- Runtime signals: Parser returns structured `ValidationResult` with typed issues (`{file, severity, message}`) — not thrown errors
- Inspection surfaces: `ValidationResult.issues` array is machine-readable; test output uses pass/fail counts with descriptive messages
- Failure visibility: Each validation issue includes the file path, severity level (fatal/warning), and a human-readable description
- Redaction constraints: none — no secrets in `.planning` files

## Integration Closure

- Upstream surfaces consumed: `files.ts` helpers (`loadFile`, `splitFrontmatter`, `parseFrontmatterMap`, `extractSection`, `extractAllSections`, `parseBullets`) — some need to be exported
- New wiring introduced in this slice: none — parser is consumed by S02, not wired into any runtime path yet
- What remains before the milestone is truly usable end-to-end: S02 (transformer), S03 (writer), S04 (CLI command integration)

## Tasks

- [x] **T01: Export helpers from files.ts and create types + test scaffold** `est:45m`
  - Why: The parser needs `splitFrontmatter`, `parseFrontmatterMap`, `extractSection`, `extractAllSections`, `parseBullets`, `extractBoldField` from `files.ts`. The types define the contract for the entire parser module. The test file establishes the verification target for the slice.
  - Files: `src/resources/extensions/gsd/files.ts`, `src/resources/extensions/gsd/migrate/types.ts`, `src/resources/extensions/gsd/tests/migrate-parser.test.ts`
  - Do: (1) Add `export` to the 6 helper functions in `files.ts`. (2) Create `migrate/types.ts` with all old-format interfaces. (3) Create `migrate-parser.test.ts` with fixture helpers and all test cases (assertions will fail since parser doesn't exist yet). (4) Verify existing tests still pass after the export change.
  - Verify: `npx tsx src/resources/extensions/gsd/tests/parsers.test.ts` still passes (no regression from exports). Test file exists and runs (expected: all assertions fail).
  - Done when: Types compile, helpers are exported, test file runs without syntax errors, existing tests pass.

- [x] **T02: Implement validator and per-file parsers** `est:1h`
  - Why: The individual file parsers (roadmap, plan XML-in-markdown, summary frontmatter, requirements, PROJECT.md, STATE.md, config.json) are the building blocks the main parser orchestrator calls. The validator is the pre-flight check that reports issues before parsing.
  - Files: `src/resources/extensions/gsd/migrate/validator.ts`, `src/resources/extensions/gsd/migrate/parsers.ts`
  - Do: (1) Implement `validatePlanningDirectory(path): ValidationResult` — checks for directory existence, ROADMAP.md (fatal if missing), PROJECT.md/REQUIREMENTS.md/STATE.md (warning if missing). (2) Implement per-file parsers: `parseOldRoadmap(content)` handles flat and milestone-sectioned formats with `<details>` blocks; `parseOldPlan(content)` extracts XML-in-markdown tags and YAML frontmatter; `parseOldSummary(content)` extracts YAML frontmatter with old schema; `parseOldRequirements(content)` extracts requirement entries; `parseOldProject(content)` extracts project metadata; `parseOldState(content)` extracts state info; `parseOldConfig(json)` parses config.json. All use exported helpers from `files.ts`.
  - Verify: Individual parser functions can be imported and called in test file. Validator tests pass.
  - Done when: Validator correctly categorizes missing files. Each per-file parser returns correct typed output for representative input strings.

- [x] **T03: Implement main parser orchestrator and pass all tests** `est:1h`
  - Why: The orchestrator is the public API — `parsePlanningDirectory(path)` walks the directory tree, delegates to per-file parsers, handles edge cases (duplicate phase numbers, orphan summaries, `.archive/` skipping, quick tasks, extra files), and assembles the complete `PlanningProject`.
  - Files: `src/resources/extensions/gsd/migrate/parser.ts`, `src/resources/extensions/gsd/tests/migrate-parser.test.ts`
  - Do: (1) Implement `parsePlanningDirectory(path): PlanningProject` — scan phases directory with `readdirSync`, use full directory name as key (not just number), detect and skip `.archive/`, scan each phase for plan/summary/research/verification/extra files, handle orphan summaries, scan `quick/` directory, scan `research/` directory, parse `milestones/` directory for per-milestone files. (2) Wire all per-file parsers from T02. (3) Ensure all test assertions pass. (4) Add barrel export `migrate/index.ts`.
  - Verify: `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` — all assertions pass, exit code 0.
  - Done when: All tests pass. `parsePlanningDirectory` returns correct `PlanningProject` for complete, minimal, and edge-case fixtures.

## Files Likely Touched

- `src/resources/extensions/gsd/files.ts` (export existing helpers)
- `src/resources/extensions/gsd/migrate/types.ts` (new)
- `src/resources/extensions/gsd/migrate/validator.ts` (new)
- `src/resources/extensions/gsd/migrate/parsers.ts` (new)
- `src/resources/extensions/gsd/migrate/parser.ts` (new)
- `src/resources/extensions/gsd/migrate/index.ts` (new)
- `src/resources/extensions/gsd/tests/migrate-parser.test.ts` (new)
