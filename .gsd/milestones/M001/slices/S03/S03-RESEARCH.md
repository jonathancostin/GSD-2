# S03: .gsd Directory Writer — Research

**Date:** 2026-03-11

## Summary

S03 produces two files: `migrate/writer.ts` (`writeGSDDirectory`) and `migrate/preview.ts` (`generatePreview`). The writer is purely mechanical serialization — it receives a fully-typed `GSDProject` from the transformer and writes the complete `.gsd` tree. No business logic belongs here. The preview generator computes stats from `GSDProject` before any files are written.

The writer's primary constraint is that its output must be parseable by `parseRoadmap()`, `parsePlan()`, and `parseSummary()` in `files.ts`, and the resulting directory must yield a coherent state when `deriveState()` runs against it. These parsers are the acceptance oracle. The writer must reverse-engineer the exact markdown format those parsers expect — which means reading their source before implementing anything.

The integration test follows the `derive-state.test.ts` pattern: write to a `mkdtempSync` temp dir, call `deriveState()`, assert `phase: 'executing'` (for an incomplete project) or `phase: 'complete'` (all slices done). File-level assertions also verify that required files exist and have parseable content.

## Recommendation

Implement the writer as a set of pure format functions, one per file type, then a single orchestrator `writeGSDDirectory()` that calls them and invokes `saveFile()`. Keep format logic separate from I/O. This makes each serializer unit-testable without touching the filesystem.

File type priority order (most to least risky): ROADMAP.md first (most format constraints, drives `deriveState()`), then PLAN.md (drives task execution), then SUMMARY.md (YAML frontmatter must match `parseSummary()` fields exactly), then the simpler passthrough files (RESEARCH.md, PROJECT.md, DECISIONS.md, REQUIREMENTS.md, STATE.md, CONTEXT.md).

Write a unit test first that verifies `parseRoadmap(formatRoadmap(...))` roundtrips correctly before writing the file to disk. This catches format bugs before the integration test.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| File I/O with parent dir creation | `saveFile(path, content)` from `files.ts` | Creates parent dirs automatically; atomic write via temp+rename; consistent with the rest of the codebase |
| Output path construction | `join(targetPath, '.gsd', 'milestones', mid, ...)` with Node `path.join` | Don't use `paths.ts` resolvers for writing — those are for reading existing dirs with legacy prefix matching. Build paths directly from bare IDs. |
| Verifying output | `parseRoadmap()`, `parsePlan()`, `parseSummary()` from `files.ts` | Import and call directly in integration test to assert the files round-trip correctly |
| Integration test setup | `mkdtempSync` + `rmSync` pattern from `derive-state.test.ts` | Established pattern; creates isolated temp dir per test group |

## Existing Code and Patterns

- `src/resources/extensions/gsd/files.ts` → `saveFile(path, content)` — async, creates parent dirs, atomic. The writer calls this for every output file. Also `parseRoadmap()`, `parsePlan()`, `parseSummary()` — import these in the integration test to verify written files parse correctly.
- `src/resources/extensions/gsd/files.ts` → `formatFrontmatter()` — **this function is private (not exported)**. The writer must implement its own YAML frontmatter serializer. It's ~30 lines — straightforward to inline. Follow the same logic: scalar `key: value`, arrays `key:\n  - item`, nested objects `key:\n  - field: value\n    field2: value2`.
- `src/resources/extensions/gsd/state.ts` → `deriveState(basePath)` — import directly in the integration test. The writer's acceptance criterion is `deriveState()` returning non-null `activeMilestone` and coherent `phase`.
- `src/resources/extensions/gsd/migrate/types.ts` (on `gsd/M001/S02`) — `GSDProject`, `GSDMilestone`, `GSDSlice`, `GSDTask`, `GSDRequirement`, `GSDSliceSummaryData`, `GSDTaskSummaryData`. These are the exact input types the writer receives. No further transformation needed.
- `src/resources/extensions/gsd/tests/derive-state.test.ts` — the integration test's model. Use the same `mkdtempSync`, `assert`/`assertEq` helper pattern. The S03 integration test writes a full migrated `.gsd` tree then calls `deriveState()`.
- `src/resources/extensions/gsd/templates/` — read before implementing each format function. Templates for: `roadmap.md`, `plan.md` (slice-level PLAN.md), `task-plan.md` (T01-PLAN.md), `slice-summary.md`, `task-summary.md`, `project.md`, `decisions.md`, `state.md`, `context.md`, `requirements.md`.

## Format Contracts (what parsers actually require)

### ROADMAP.md — `parseRoadmap(content)` reads:

```
# M001: Title
**Vision:** one sentence
## Success Criteria
- criterion
## Slices
- [ ] **S01: Title** `risk:medium` `depends:[]`
  > After this: demo sentence
- [x] **S02: Title** `risk:low` `depends:[S01]`
  > After this: demo sentence
## Boundary Map
(omit if empty — parser handles missing section gracefully)
```

Key: `cbMatch` regex in `parseRoadmap()` is `/^-\s+\[([ xX])\]\s+\*\*(\w+):\s+(.+?)\*\*\s*(.*)/`. The `demo` line regex is `line.trim().startsWith('>')`. The `> After this:` prefix is stripped by the parser. An empty `## Boundary Map` section is valid — `extractAllSections` returns nothing and the array stays empty.

### PLAN.md (slice) — `parsePlan(content)` reads:

```
# S01: SliceTitle
**Goal:** goal sentence
**Demo:** demo sentence
## Must-Haves
- mustHave
## Tasks
- [ ] **T01: TaskTitle** `est:30m`
  - description text
- [x] **T02: TaskTitle** `est:15m`
  - description text
## Files Likely Touched
- `path/to/file.ts`
```

Key: `parsePlan()` checks `line.match(/^\s*-\s+Files:\s*(.*)/)` — but for the migration writer, `files` and `verify` sub-bullets are optional. The task checkbox format is the critical part. `done: cbMatch[1].toLowerCase() === 'x'` drives task completion.

### SUMMARY.md (slice) — `parseSummary(content)` reads YAML frontmatter with these exact keys:

```yaml
---
id: S01
parent: M001
milestone: M001
provides:
  - item
requires:
  - slice: S00
    provides: what
affects:
  - S02
key_files:
  - path
key_decisions:
  - decision
patterns_established:
  - pattern
observability_surfaces:
  - none
drill_down_paths:
  - path
duration: 30m
verification_result: passed
completed_at: 2026-03-11
blocker_discovered: false
---
# S01: SliceTitle
**one-liner bold text**
## What Happened
narrative
```

Critical: `parseSummary()` reads `key_files` (underscored), not `key-files` (hyphenated). The `GSDSliceSummaryData` fields map: `keyFiles → key_files`, `keyDecisions → key_decisions`, `patternsEstablished → patterns_established`. The `parseFrontmatterMap()` regex `\w[\w_]*` accepts underscored keys — use underscores in the written frontmatter. `requires` is an array of objects with `slice:` and `provides:` sub-keys.

### T01-PLAN.md (task) — `state.ts` does NOT parse task plans for task structure. It only checks for the file's existence via `resolveTaskFile()`. The slice PLAN.md drives task done/total. So T01-PLAN.md only needs to be a valid markdown file. Keep it minimal: H1 + description.

### TASK SUMMARY.md — `parseSummary()` reads it with the same parser as slice summaries. Frontmatter must include `id`, `parent`, `milestone`, `duration`, `completed_at`, `verification_result`. The `blocker_discovered: false` field is required by the type but can be emitted as `false`.

### REQUIREMENTS.md — `parseRequirementCounts(content)` only counts `### R\d+` headings by section (`## Active`, `## Validated`, `## Deferred`, `## Out of Scope`). The writer needs to group requirements by status and produce those exact section headers.

### CONTEXT.md — `deriveState()` calls `parseContextDependsOn(content)` which scans for `depends_on:` key in frontmatter or `**Depends On:**` bold field. For a migrated milestone, context has no depends — write a minimal context file or skip it. `deriveState()` handles null context content gracefully.

### STATE.md — `deriveState()` does not read STATE.md at all. It recomputes from scratch. Write a minimal stub or skip it entirely; it will be regenerated on first `/gsd status`.

## Constraints

- **TypeScript ESM throughout** — import with `.ts` extensions.
- **`saveFile` is async** — `writeGSDDirectory()` must be `async` and `await` each `saveFile()` call.
- **`formatFrontmatter` is not exported** — implement a local `serializeFrontmatter(data: Record<string, unknown>): string` in writer.ts.
- **Empty `boundaryMap: []`** — skip the `## Boundary Map` section entirely in the ROADMAP.md output. `parseRoadmap()` returns `boundaryMap: []` when the section is absent — that's the correct behavior.
- **Empty `decisionsContent`** — write the decisions file with just the header row and the append-only comment block. An empty decisions table is valid.
- **Empty `projectContent`** — write a minimal PROJECT.md with the project description section. Don't write a blank file.
- **`slice.research === null`** — skip writing `S01-RESEARCH.md`. Don't write empty files.
- **`milestone.research === null`** — skip writing `M001-RESEARCH.md`.
- **Always write `M001-ROADMAP.md`** — `deriveState()` requires it. Even for empty milestones (no slices), write a roadmap with an empty slices section.
- **Directory structure** — `saveFile()` creates parent dirs, but the writer must build correct paths: `.gsd/milestones/M001/slices/S01/tasks/T01-PLAN.md`.
- **`S01-UAT.md`** — not required by `deriveState()`. Omit from migration output — UATs are written during slice planning, not migration.

## Common Pitfalls

- **`key-files` vs `key_files` in frontmatter** — `GSDSliceSummaryData.keyFiles` maps to YAML key `key_files` (underscored). `parseSummary()` reads `fm.key_files`. If the writer emits `key-files:`, `parseFrontmatterMap()` won't parse it (regex `\w[\w_]*` rejects hyphens). Always use underscored keys in written frontmatter.
- **`requires` array in slice summary frontmatter** — `parseSummary()` expects `requires` as an array of objects `{slice: string, provides: string}`. The `GSDSliceSummaryData` doesn't include `requires` (only `provides`). Write `requires: []` for migrated summaries.
- **`affects` array in slice summary frontmatter** — similarly not in `GSDSliceSummaryData`. Write `affects: []`.
- **`drill_down_paths` and `observability_surfaces`** — required by `SummaryFrontmatter` type but not in `GSDSliceSummaryData`. Write empty arrays `[]`.
- **Roadmap demo line indentation** — `parseRoadmap()` checks `line.trim().startsWith('>')`. The demo line can have leading spaces or not. Write `  > After this: ${slice.demo}` (2-space indent) for readability — the parser handles it correctly.
- **Roadmap slice checkbox whitespace** — the regex is `/^-\s+\[([ xX])\]/` — exactly one space after `-`, then `[`. Write `- [ ] **S01:` not `-  [ ]` or `- [x] **`.
- **`vision` empty string** — `GSDMilestone.vision` may be `''` for edge cases. `parseRoadmap()` uses `extractBoldField(content, 'Vision')` which returns `''` for missing — that's fine. Write `**Vision:** (migrated project)` as a fallback when vision is empty.
- **`successCriteria: []`** — all migrated milestones have empty success criteria. Write an empty `## Success Criteria` section (no bullets) — `parseRoadmap()` returns `[]` for empty sections.
- **Task plan format for `parsePlan()` task detection** — the slice PLAN.md's `## Tasks` section drives task completion via `parsePlan()`. The task `done` state comes from the checkbox `[x]` in the PLAN.md, not from T01-PLAN.md. Write `- [x]` for done tasks.
- **`deriveState()` slice completion vs task completion** — a slice is complete when its roadmap checkbox is `[x]`. A task is complete when its checkbox in PLAN.md is `[x]`. These are independent. The PLAN.md tasks section must have exactly the right checkboxes or `deriveState()` will report wrong task progress.
- **Multi-milestone output** — when `project.milestones.length > 1`, each milestone gets its own directory with independent S01/S02 numbering. `deriveState()` sorts milestones alphabetically (M001, M002) and returns the first incomplete one as `activeMilestone`.

## Open Risks

- **`parseSummary()` schema coverage** — `GSDSliceSummaryData` is missing several fields that `SummaryFrontmatter` reads: `requires`, `affects`, `drill_down_paths`, `observability_surfaces`. The writer must write these as empty arrays. If any required-by-type field is absent from written frontmatter, `parseSummary()` will return empty arrays/strings for those fields — acceptable for migration but confirmed by integration test.
- **Task title format in PLAN.md** — `GSDTask.title` is derived from plan frontmatter as `"phase plan"` (e.g. `"29 01"`). This may produce ugly task titles in migrated output. The writer can trim/titlecase but must not break the checkbox regex `\*\*T01:\s+(.+?)\*\*`.
- **Empty project content** — if `GSDProject.projectContent` is `''` (no PROJECT.md in old project), the writer must produce a valid `PROJECT.md`. An empty file would technically work (there's no parser that blocks on it), but a minimal stub with correct section headings is cleaner.
- **`deriveState()` integration test with complete projects** — a fully-complete project (all slices `done: true`, all tasks `done: true`) should produce `phase: 'completing-milestone'` (all slices done, no milestone summary written yet) not `phase: 'executing'`. The integration test needs at least one scenario with an incomplete slice/task to test `phase: 'executing'`.
- **Large projects with many slices** — sequential `await saveFile()` calls for 60+ slices × 3 files each ≈ 180 file writes. Acceptable for a one-shot migration, but `Promise.all()` parallelization is straightforward if needed.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| TypeScript ESM | none needed | n/a — standard Node patterns |
| Node.js `--test` runner | none relevant | n/a — using existing custom assert pattern |
| Markdown serialization | none relevant | n/a — string template functions sufficient |

No external skills needed.

## Sources

- `src/resources/extensions/gsd/files.ts` — `parseRoadmap()`, `parsePlan()`, `parseSummary()`, `saveFile()` — acceptance oracle parsers and I/O utility
- `src/resources/extensions/gsd/state.ts` — `deriveState()` — the integration acceptance oracle for migration output
- `src/resources/extensions/gsd/templates/` — `roadmap.md`, `plan.md`, `task-plan.md`, `slice-summary.md`, `task-summary.md`, `project.md`, `decisions.md`, `state.md`, `context.md`, `requirements.md` — format templates for each written file type
- `src/resources/extensions/gsd/tests/derive-state.test.ts` — test pattern reference (mkdtempSync, assert helpers, fixture structure)
- `src/resources/extensions/gsd/migrate/types.ts` (gsd/M001/S02) — `GSDProject`, `GSDMilestone`, `GSDSlice`, `GSDTask`, `GSDSliceSummaryData`, `GSDTaskSummaryData`, `GSDRequirement` — writer input types
- `src/resources/extensions/gsd/migrate/transformer.ts` (gsd/M001/S02) — confirms transformer output shape and what fields are always populated vs nullable
- `.gsd/milestones/M001/slices/S02/S02-SUMMARY.md` — Forward Intelligence section confirming `boundaryMap: []`, `researchContent` pre-concatenated, `tasks: []` for empty phases
