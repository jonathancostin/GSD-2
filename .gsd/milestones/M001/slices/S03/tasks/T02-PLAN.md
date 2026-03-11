---
estimated_steps: 5
estimated_files: 4
---

# T02: Implement writeGSDDirectory, generatePreview, and deriveState integration test

**Slice:** S03 — Directory Writer with deriveState Integration
**Milestone:** M001

## Description

With format functions proven correct by round-trip tests (T01), this task adds the orchestrator `writeGSDDirectory()` that assembles the full `.gsd` directory tree, the `generatePreview()` function for pre-write stats, and the integration test that proves `deriveState()` accepts writer output. The integration test is the slice's primary acceptance criterion — it writes a complete `.gsd` tree to a temp directory, verifies file existence, parses key files, and asserts `deriveState()` returns coherent state.

## Steps

1. Add `writeGSDDirectory(project: GSDProject, targetPath: string): Promise<WrittenFiles>` to `migrate/writer.ts`. It iterates `project.milestones`, builds paths using `path.join(targetPath, '.gsd', 'milestones', mid, ...)`, calls format functions, and writes each file via `saveFile()`. Returns a `WrittenFiles` object listing paths written. Handles: skip research when `milestone.research === null` or `slice.research === null`, skip slice summary when `slice.summary === null`, skip task summary when `task.summary === null`, always write roadmap even for empty milestones, write PROJECT.md/DECISIONS.md/STATE.md at `.gsd/` root level. Define and export `WrittenFiles` type and `MigrationPreview` type.
2. Create `migrate/preview.ts` with `generatePreview(project: GSDProject): MigrationPreview`. Computes: milestone count, total slices, total tasks, done slices, done tasks, slice completion %, task completion %, requirement counts by status. Pure function, no I/O.
3. Update `migrate/index.ts` barrel to export `writeGSDDirectory`, `generatePreview`, `WrittenFiles`, `MigrationPreview`.
4. Create `tests/migrate-writer-integration.test.ts`. Build a synthetic `GSDProject` with: 1 milestone (M001), 2 slices (S01 done with summary + 2 done tasks, S02 not done with 1 task not done), research on milestone, requirements with mixed statuses. Write to `mkdtempSync` temp dir. Assert: (a) key files exist (`M001-ROADMAP.md`, `S01-PLAN.md`, `S02-PLAN.md`, `S01-SUMMARY.md`, `M001-RESEARCH.md`, `REQUIREMENTS.md`, `PROJECT.md`); (b) `parseRoadmap()` on written roadmap returns 2 slices with correct done state; (c) `parsePlan()` on S01 plan returns 2 done tasks; (d) `parseSummary()` on S01 summary returns correct `key_files` and `provides`; (e) `deriveState(tempDir)` returns `phase: 'executing'`, `activeMilestone.id === 'M001'`, correct task counts; (f) `generatePreview()` returns expected counts. Add a second scenario with a fully-complete project and verify `deriveState()` returns appropriate phase. Clean up temp dirs in finally blocks.
5. Run integration test, fix any issues until all assertions pass.

## Must-Haves

- [ ] `writeGSDDirectory()` writes complete tree with correct paths (`.gsd/milestones/M001/slices/S01/tasks/T01-PLAN.md`)
- [ ] Null research/summary files are skipped (not written as empty files)
- [ ] `deriveState()` returns `phase: 'executing'` for incomplete project and correct `activeMilestone`
- [ ] `generatePreview()` returns correct milestone/slice/task/requirement counts
- [ ] Barrel exports updated in `migrate/index.ts`
- [ ] Temp dirs cleaned up in test teardown

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts` — all assertions pass, 0 failures
- `npx tsx src/resources/extensions/gsd/tests/migrate-writer.test.ts` — still passes (no regressions)

## Observability Impact

- Signals added/changed: None — migration is a one-shot operation
- How a future agent inspects this: Read integration test output; assertion labels include file paths being verified and `deriveState()` field names
- Failure state exposed: `FAIL:` lines show expected vs actual for each `deriveState()` field; written temp dir preserved on failure for manual inspection

## Inputs

- `src/resources/extensions/gsd/migrate/writer.ts` — format functions from T01
- `src/resources/extensions/gsd/files.ts` — `saveFile()`, `parseRoadmap()`, `parsePlan()`, `parseSummary()`, `parseRequirementCounts()`
- `src/resources/extensions/gsd/state.ts` — `deriveState()`
- `src/resources/extensions/gsd/tests/derive-state.test.ts` — pattern reference for `mkdtempSync` + cleanup

## Expected Output

- `src/resources/extensions/gsd/migrate/writer.ts` — `writeGSDDirectory()` orchestrator added, `WrittenFiles` type exported
- `src/resources/extensions/gsd/migrate/preview.ts` — `generatePreview()` with `MigrationPreview` type
- `src/resources/extensions/gsd/migrate/index.ts` — barrel updated with new exports
- `src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts` — integration test with `deriveState()` acceptance assertions passing
