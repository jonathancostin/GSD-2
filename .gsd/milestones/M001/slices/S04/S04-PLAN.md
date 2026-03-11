# S04: /gsd migrate Command

**Goal:** Users can run `/gsd migrate /path/to/project` from any pi session and get a complete, valid `.gsd` directory in the current working directory — with a preview and confirmation step before writing.
**Demo:** Run `/gsd migrate` against a real `.planning` directory, see a preview with milestone/slice/task counts and completion %, confirm, and verify the output directory passes `deriveState()`.

## Must-Haves

- `/gsd migrate <path>` command is registered, tab-completable, and dispatches correctly
- Missing or invalid path argument shows a clear usage error
- Validation fatals block migration with visible error messages; warnings are also displayed
- Preview shows milestone/slice/task counts, completion %, and warns if `.gsd/` already exists at target
- User must confirm before writing (D005)
- On confirm: writes `.gsd/` directory and shows success with file counts
- On cancel: exits cleanly with no filesystem changes
- Source directory is never modified (D001)
- Pipeline integration test proves the full validate → parse → transform → preview → write flow works end-to-end

## Proof Level

- This slice proves: final-assembly
- Real runtime required: no (pipeline tested without TUI; TUI interaction verified by manual smoke test)
- Human/UAT required: yes (manual smoke test of `/gsd migrate` against a real `.planning` directory)

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-command.test.ts` — pipeline integration test proving validate → parse → transform → preview → write produces correct output; ~15–25 assertions
- All prior test suites still pass: parser (120), transformer (92), writer (79), writer-integration (77)
- Manual: `/gsd migrate` in a pi session against a real `.planning` directory (UAT gate)

## Observability / Diagnostics

- Runtime signals: `ctx.ui.notify()` messages at each stage — validation errors, preview display, write confirmation, success/failure
- Inspection surfaces: none (one-shot migration, no persistent runtime)
- Failure visibility: validation fatal/warning messages displayed to user; pipeline errors surface as uncaught exceptions in the TUI
- Redaction constraints: none (no secrets involved)

## Integration Closure

- Upstream surfaces consumed: `validatePlanningDirectory`, `parsePlanningDirectory`, `transformToGSD`, `generatePreview`, `writeGSDDirectory` from `migrate/index.ts`; `showNextAction` from `shared/next-action-ui.ts`; command dispatch in `commands.ts`
- New wiring introduced in this slice: `/gsd migrate` command registration in `commands.ts`; `handleMigrate()` in `migrate/command.ts` orchestrating the full pipeline behind TUI confirmation
- What remains before the milestone is truly usable end-to-end: nothing — this is the final slice

## Tasks

- [ ] **T01: Merge S03, implement handleMigrate command, and wire into commands.ts** `est:35m`
  - Why: This is the only production code task — creates the command handler, registers it, and wires the full pipeline. S03 must be merged first to make the `migrate/` module available.
  - Files: `src/resources/extensions/gsd/migrate/command.ts` (new), `src/resources/extensions/gsd/commands.ts`, `src/resources/extensions/gsd/migrate/index.ts`
  - Do: Merge `gsd/M001/S03` into `gsd/M001/S04`. Create `migrate/command.ts` with `handleMigrate(args, ctx)` implementing: path validation, `.planning` resolution, `validatePlanningDirectory` with fatal/warning display, pipeline execution, preview display via `ctx.ui.notify`, `.gsd/` exists warning, `showNextAction` confirmation, `writeGSDDirectory` on confirm, success message with file counts. In `commands.ts`: add `'migrate'` to `subcommands` array, add `if (trimmed === 'migrate' || trimmed.startsWith('migrate '))` dispatch block, update the unknown-command fallback message. Update `migrate/index.ts` barrel to export `handleMigrate`.
  - Verify: `npx tsx src/resources/extensions/gsd/tests/migrate-writer.test.ts` (79 pass), `npx tsx src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts` (77 pass) — confirms S03 merge didn't break anything. TypeScript compiles without errors.
  - Done when: `handleMigrate` exists, `commands.ts` dispatches to it, tab-completion includes `migrate`, all prior tests pass

- [ ] **T02: Pipeline integration test and full verification** `est:25m`
  - Why: Proves the assembled pipeline works end-to-end without the TUI — the command handler's logic (path resolution, validation gating, pipeline orchestration, preview generation, writing) is tested with real fixture data through a temp directory round-trip.
  - Files: `src/resources/extensions/gsd/tests/migrate-command.test.ts` (new)
  - Do: Create `migrate-command.test.ts` that tests: (1) path resolution — `.planning` appended when missing, used as-is when present; (2) validation gating — invalid directory returns fatal issues and blocks pipeline; (3) full pipeline round-trip — parse a fixture `.planning` dir, transform, generate preview, write to temp dir, verify preview stats match expected counts, verify written files exist, verify `deriveState()` on written output returns coherent state; (4) `.gsd/` exists detection. Run all 5 test suites to confirm zero regressions.
  - Verify: `npx tsx src/resources/extensions/gsd/tests/migrate-command.test.ts` passes all assertions. All prior suites still pass.
  - Done when: Pipeline integration test passes with 15+ assertions, all 5 test files pass (parser 120 + transformer 92 + writer 79 + writer-integration 77 + command 15+)

## Files Likely Touched

- `src/resources/extensions/gsd/migrate/command.ts` (new)
- `src/resources/extensions/gsd/commands.ts`
- `src/resources/extensions/gsd/migrate/index.ts`
- `src/resources/extensions/gsd/tests/migrate-command.test.ts` (new)
