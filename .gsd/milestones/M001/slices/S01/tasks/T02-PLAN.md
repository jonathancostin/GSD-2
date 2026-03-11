---
estimated_steps: 4
estimated_files: 2
---

# T02: Implement validator and per-file parsers

**Slice:** S01 — Old .planning Parser
**Milestone:** M001

## Description

Build the validator (`validatePlanningDirectory`) and all individual file parsers for the old `.planning` format. These are the building blocks the main parser orchestrator will call in T03. Each parser is a pure function that takes file content (string) and returns typed data.

## Steps

1. Create `src/resources/extensions/gsd/migrate/validator.ts` with `validatePlanningDirectory(path): Promise<ValidationResult>`. Check: directory exists (fatal if not), `ROADMAP.md` exists (fatal if not), `PROJECT.md` exists (warning if not), `REQUIREMENTS.md` exists (warning if not), `STATE.md` exists (warning if not), `phases/` directory exists (warning if not). Use `loadFile()` for existence checks and `readdirSync` for directory checks.
2. Create `src/resources/extensions/gsd/migrate/parsers.ts` with per-file parsers:
   - `parseOldRoadmap(content: string): PlanningRoadmapResult` — handles flat phase lists (checkbox lines with phase numbers and titles) AND milestone-sectioned roadmaps with `<details>` blocks. Extracts phase entries with completion state (`[x]` vs `[ ]`), milestone groupings, and phase metadata (goal, depends, requirements, success criteria, plan checkboxes).
   - `parseOldPlan(content: string): PlanningPlan` — splits YAML frontmatter (using exported `splitFrontmatter`/`parseFrontmatterMap`), then extracts XML-in-markdown sections using regex: `<tag>content</tag>` for `objective`, `tasks`/`task`, `context`, `verification`, `success_criteria`. Falls back to plain markdown parsing for quick-task plans that lack XML tags.
   - `parseOldSummary(content: string): PlanningSummary` — parses YAML frontmatter with old schema fields, returns typed summary with body content.
   - `parseOldRequirements(content: string): PlanningRequirement[]` — extracts requirement entries with status indicators (checkboxes, section headers).
   - `parseOldProject(content: string): PlanningProjectMeta` — extracts project name, description, and any structured sections.
   - `parseOldState(content: string): PlanningState` — extracts state information (current phase, status).
   - `parseOldConfig(content: string): PlanningConfig | null` — JSON.parse with graceful error handling.
3. For the XML-in-markdown parser: use regex `/<tagName>([\s\S]*?)<\/tagName>/` to extract content between tags. Handle nested `<task>` tags within `<tasks>`. Trim extracted content. Do NOT use a real XML parser — these are markdown with XML delimiters.
4. Run the validator and per-file parser test cases from the test file. Fix any failures in these specific tests.

## Must-Haves

- [ ] `validatePlanningDirectory` returns fatal for missing directory and missing ROADMAP.md
- [ ] `validatePlanningDirectory` returns warning (not fatal) for missing PROJECT.md, REQUIREMENTS.md, STATE.md
- [ ] `parseOldRoadmap` handles flat checkbox lists and milestone-sectioned roadmaps
- [ ] `parseOldPlan` extracts XML-in-markdown sections and YAML frontmatter
- [ ] `parseOldSummary` parses all old frontmatter fields correctly
- [ ] `parseOldConfig` handles invalid JSON gracefully (returns null)
- [ ] All parsers are pure functions with zero Pi dependencies

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` — validator tests and per-file parser tests pass
- Each parser tested with representative input strings from research findings

## Observability Impact

- Signals added/changed: `ValidationResult.issues` array provides structured, machine-readable validation output with severity levels
- How a future agent inspects this: Call `validatePlanningDirectory(path)` and inspect `.issues` — each has `{file, severity, message}`
- Failure state exposed: Fatal issues prevent migration; warnings are informational. The severity field distinguishes actionable from informational.

## Inputs

- `src/resources/extensions/gsd/migrate/types.ts` — type definitions from T01
- `src/resources/extensions/gsd/files.ts` — exported helpers (`splitFrontmatter`, `parseFrontmatterMap`, `extractSection`, `parseBullets`)
- S01-RESEARCH.md — old format field names, XML-in-markdown structure, roadmap variations
- `src/resources/extensions/gsd/tests/migrate-parser.test.ts` — test cases from T01

## Expected Output

- `src/resources/extensions/gsd/migrate/validator.ts` — working validator with severity-classified issue reporting
- `src/resources/extensions/gsd/migrate/parsers.ts` — all per-file parsers producing typed output from old format content
