# M001: .planning → .gsd Migration Tool

**Vision:** Give users of the original get-shit-done system a single command to migrate their `.planning` directories into GSD-2's `.gsd` format, preserving project knowledge, completion state, and research — so they can continue working without starting over.

## Success Criteria

- User can run `/gsd migrate /path/to/project` and get a valid `.gsd` directory
- Migrated roadmap accurately reflects old phases as slices with correct completion state
- Migrated requirements preserve status (complete → validated, active → active)
- Research files are consolidated and accessible in the new structure
- GSD-2's `deriveState()` correctly reads the migrated output
- Preview shows meaningful summary before writing

## Key Risks / Unknowns

- Old format variation → retire in S01 by proving the parser handles a representative `.planning` directory with various file states (complete, incomplete, missing)
- Content transformation → retire in S02 by proving transformed output matches GSD-2 template structure and passes deriveState()
- Decimal phases → retire in S02 by proving decimal phases map to sequential slice numbers with correct ordering

## Slices

- [x] **S01: Old .planning Parser** `risk:high` `depends:[]`
  > After this: unit tests prove the parser correctly reads PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, phase directories, plan files, summary files, research files, and config from a representative .planning directory — including detection of missing/corrupt files.

- [x] **S02: Structure Mapper and Content Transformer** `risk:high` `depends:[S01]`
  > After this: unit tests prove that parsed old-format data transforms into valid GSD-2 structures — phases become slices, plans become tasks, completion state is preserved, research is consolidated, requirements are classified, and the output matches GSD-2 template shapes.

- [x] **S03: .gsd Directory Writer** `risk:medium` `depends:[S02]`
  > After this: given transformed data, the writer produces a complete .gsd directory tree that deriveState() can read — with correct naming conventions, file formats, and directory structure.

- [x] **S04: /gsd migrate Command** `risk:low` `depends:[S03]`
  > After this: user can run `/gsd migrate /path/to/project`, see a preview of what will be migrated (file counts, milestone/slice/task summary, completion state), confirm, and get a valid .gsd directory written — the full pipeline from parse → transform → write integrated behind a single command.

## Boundary Map

### S01 → S02

Produces:
- `migrate/parser.ts` → `parsePlanningDirectory(path): PlanningProject` — complete parsed representation of old .planning dir
- `migrate/types.ts` → `PlanningProject`, `PlanningPhase`, `PlanningPlan`, `PlanningRequirement`, `PlanningResearch` — typed interfaces for old format
- `migrate/validator.ts` → `validatePlanningDirectory(path): ValidationResult` — reports missing/corrupt files with severity levels

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- `migrate/transformer.ts` → `transformToGSD(parsed: PlanningProject): GSDProject` — complete GSD-2 structure ready for writing
- `migrate/types.ts` (extended) → `GSDProject`, `GSDMilestone`, `GSDSlice`, `GSDTask` — typed interfaces for new format output

Consumes from S01:
- `parser.ts` → `parsePlanningDirectory()` for input data
- `types.ts` → `PlanningProject` and related types

### S03 → S04

Produces:
- `migrate/writer.ts` → `writeGSDDirectory(project: GSDProject, targetPath: string): WriteResult` — writes complete .gsd tree
- `migrate/preview.ts` → `generatePreview(project: GSDProject): MigrationPreview` — summary stats for user confirmation

Consumes from S02:
- `transformer.ts` → `transformToGSD()` for transformed data
- `types.ts` → `GSDProject` and related types

### S04 (terminal)

Produces:
- `/gsd migrate` command registered in commands.ts
- Full pipeline integration: parse → validate → transform → preview → confirm → write

Consumes from S01, S02, S03:
- `validator.ts` → `validatePlanningDirectory()`
- `parser.ts` → `parsePlanningDirectory()`
- `transformer.ts` → `transformToGSD()`
- `preview.ts` → `generatePreview()`
- `writer.ts` → `writeGSDDirectory()`
