---
estimated_steps: 4
estimated_files: 2
---

# T02: Pipeline integration test and full verification

**Slice:** S04 — /gsd migrate Command
**Milestone:** M001

## Description

This task proves the assembled pipeline works end-to-end by testing the command handler's logic without the TUI. The test exercises path resolution, validation gating, the full pipeline round-trip (parse → transform → preview → write), and verifies the output with `deriveState()`. This is the final automated verification gate before the manual UAT smoke test.

## Steps

1. **Create `migrate-command.test.ts`** — Write an integration test file that imports the pipeline functions directly (not `handleMigrate`, which depends on TUI context). Test scenarios:
   - **Path resolution logic**: verify `.planning` is appended when source path doesn't end with it; verify it's used as-is when it does
   - **Validation gating**: call `validatePlanningDirectory()` on a non-existent path, assert `valid === false` with fatal issues
   - **Full pipeline round-trip**: use the existing test fixtures from `tests/fixtures/planning-*` directories; run `parsePlanningDirectory()` → `transformToGSD()` → `generatePreview()` → verify preview counts are correct; run `writeGSDDirectory()` to a `mkdtempSync` temp dir → verify key files exist → call `deriveState()` → assert coherent state
   - **`.gsd/` exists detection**: create a temp dir with `.gsd/` already present, verify `existsSync(join(targetPath, '.gsd'))` returns true (testing the detection logic the command uses)

2. **Run the new test** — Execute `npx tsx src/resources/extensions/gsd/tests/migrate-command.test.ts` and verify all assertions pass.

3. **Run all 5 test suites** — Confirm zero regressions across parser (120), transformer (92), writer (79), writer-integration (77), and the new command test.

4. **Verify total assertion count** — Sum assertions across all suites to confirm the milestone's test target is met (120 + 92 + 79 + 77 + command assertions ≥ 383).

## Must-Haves

- [ ] Path resolution tested: `.planning` appended vs used as-is
- [ ] Validation gating tested: invalid path returns `valid === false`
- [ ] Full pipeline round-trip tested: fixtures → parse → transform → preview → write → deriveState
- [ ] Preview stats verified: milestone/slice/task counts and completion % match expected values
- [ ] Written directory verified: key files exist at expected paths
- [ ] `deriveState()` returns coherent state from written output
- [ ] All 5 test suites pass with zero failures

## Verification

- `npx tsx src/resources/extensions/gsd/tests/migrate-command.test.ts` — all assertions pass (15+)
- `npx tsx src/resources/extensions/gsd/tests/migrate-parser.test.ts` — 120 passed
- `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts` — 92 passed
- `npx tsx src/resources/extensions/gsd/tests/migrate-writer.test.ts` — 79 passed
- `npx tsx src/resources/extensions/gsd/tests/migrate-writer-integration.test.ts` — 77 passed

## Observability Impact

- Signals added/changed: None — test file only
- How a future agent inspects this: run the test command; labeled assertions show `FAIL: scenario: description` on failure with expected/actual values
- Failure state exposed: assertion labels identify exact pipeline stage and field that failed

## Inputs

- `src/resources/extensions/gsd/migrate/command.ts` — T01 output, the command handler to exercise
- `src/resources/extensions/gsd/tests/fixtures/` — existing `.planning` fixture directories from S01
- `src/resources/extensions/gsd/migrate/index.ts` — barrel exports for all pipeline functions
- S03 integration test patterns — `mkdtempSync` temp dirs, `deriveState()` round-trip assertions

## Expected Output

- `src/resources/extensions/gsd/tests/migrate-command.test.ts` — new file, 15–25 assertions proving the full pipeline works end-to-end
- All 5 test suites green, total assertions ≥ 383
