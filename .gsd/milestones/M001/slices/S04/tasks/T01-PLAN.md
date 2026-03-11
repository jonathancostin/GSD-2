---
estimated_steps: 5
estimated_files: 4
---

# T01: Merge S03, implement handleMigrate command, and wire into commands.ts

**Slice:** S04 — /gsd migrate Command
**Milestone:** M001

## Description

This task creates the `/gsd migrate` command — the only user-facing surface for the migration tool. It merges the S03 branch to make the pipeline available, creates `migrate/command.ts` as a thin orchestration layer over the proven pipeline, and wires it into the existing command dispatch in `commands.ts`.

The command handler owns only the UX flow: path resolution, validation display, preview rendering, confirmation prompt, and success/failure messaging. All business logic lives in the existing pipeline modules from S01–S03.

## Steps

1. **Merge S03 into S04** — Run `git merge gsd/M001/S03` to bring the `migrate/` module onto this branch. Verify the merge is clean and prior tests pass.

2. **Create `migrate/command.ts`** — Implement `handleMigrate(args: string, ctx: ExtensionCommandContext): Promise<void>` with:
   - Guard: if `args` is empty, notify usage error and return
   - Resolve source path: `resolve(process.cwd(), args)`, append `/.planning` if not already ending in `.planning`, check `existsSync`
   - Call `validatePlanningDirectory()` — display warnings via `ctx.ui.notify(..., 'warning')`, display fatals via `ctx.ui.notify(..., 'error')`, return if `!result.valid`
   - Call `parsePlanningDirectory()` → `transformToGSD()` → `generatePreview()`
   - Build preview text: milestone/slice/task counts, completion %, add warning if `existsSync(join(process.cwd(), '.gsd'))`
   - Display preview via `ctx.ui.notify()`
   - Call `showNextAction()` with confirm/cancel actions
   - If confirmed: notify "Writing...", call `writeGSDDirectory(project, process.cwd())`, notify success with total file count
   - If not confirmed: notify cancellation and return

3. **Wire into `commands.ts`** — Add `'migrate'` to the `subcommands` array in `getArgumentCompletions`. Add dispatch block: `if (trimmed === 'migrate' || trimmed.startsWith('migrate '))` calling `handleMigrate(trimmed.replace(/^migrate\s*/, '').trim(), ctx)`. Update the unknown-command fallback message to include `migrate`. Import `handleMigrate` from `./migrate/command.js`.

4. **Update barrel exports** — Add `export { handleMigrate } from './command.js'` to `migrate/index.ts`.

5. **Verify** — Run all prior test suites to confirm the merge and new code don't break anything. Verify TypeScript compiles cleanly.

## Must-Haves

- [ ] `handleMigrate` handles empty args with usage error
- [ ] Source path resolution normalizes relative paths and appends `.planning` when needed
- [ ] Non-existent `.planning` directory produces a clear error
- [ ] Validation fatals block the pipeline; both fatals and warnings are displayed
- [ ] Preview shows milestone/slice/task counts and completion %
- [ ] `.gsd/` exists at target triggers a warning in preview
- [ ] `showNextAction` confirmation gates writing (D005)
- [ ] Cancel exits cleanly with no filesystem changes
- [ ] `commands.ts` dispatches `/gsd migrate` correctly
- [ ] Tab completion includes `migrate`
- [ ] Unknown-command fallback message includes `migrate`

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-writer.test.ts` — 79 passed
- `npx tsx src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts` — 77 passed
- `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — 92 passed
- `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` — 120 passed
- TypeScript compiles without errors (`npx tsc --noEmit` or equivalent)

## Observability Impact

- Signals added/changed: `ctx.ui.notify()` messages at each pipeline stage — user sees validation errors, preview, write progress, and success/failure
- How a future agent inspects this: read `command.ts` for the UX flow; run `/gsd migrate` in a pi session; TUI displays all pipeline status
- Failure state exposed: validation issues displayed with severity level; missing path and missing `.planning` directory produce distinct error messages

## Inputs

- `migrate/index.ts` barrel on `gsd/M001/S03` — `validatePlanningDirectory`, `parsePlanningDirectory`, `transformToGSD`, `generatePreview`, `writeGSDDirectory`
- `commands.ts` dispatch pattern — `handleDoctor`/`handlePrefs` shape
- `shared/next-action-ui.ts` — `showNextAction` API
- S03 summary forward intelligence — `generatePreview()` returns `{ milestones, slices, tasks, completionPct, requirementsByStatus }`, `writeGSDDirectory()` returns `WrittenFiles` with `{ paths, byCategory }`

## Expected Output

- `src/resources/extensions/gsd/migrate/command.ts` — new file, ~80–120 lines, thin UX orchestrator
- `src/resources/extensions/gsd/commands.ts` — modified with migrate dispatch, tab completion, and fallback message
- `src/resources/extensions/gsd/migrate/index.ts` — updated barrel with `handleMigrate` export
- All 4 prior test suites pass without regressions
