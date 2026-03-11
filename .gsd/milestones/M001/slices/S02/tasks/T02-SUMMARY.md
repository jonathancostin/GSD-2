---
id: T02
parent: S02
milestone: M001
provides:
  - transformToGSD() core function — milestone detection, phase-to-slice mapping, task mapping
  - research consolidation and requirements mapping (ahead of T03 scope)
key_files:
  - src/resources/extensions/gsd/migrate/transformer.ts
key_decisions:
  - Milestone IDs use 3-digit padding (M001) vs 2-digit for slices/tasks (S01, T01) — matches GSD runtime convention
  - Research consolidation and requirements mapping implemented in T02 rather than deferring to T03 — they were straightforward and already tested
patterns_established:
  - Pure helper functions (padId, kebabToTitle, firstSentence) at module top, business logic builders in middle, single entry point at bottom
  - Phase lookup by number via Object.values scan rather than building an index (sufficient for migration scale)
observability_surfaces:
  - none — pure function, test assertions are the diagnostic surface
duration: 15m
verification_result: passed
completed_at: 2026-03-11
blocker_discovered: false
---

# T02: Implement core transformer — milestone detection, phase-to-slice mapping, task mapping

**Built `transformToGSD()` with full milestone detection, float-sorted phase→slice mapping, plan→task mapping, research consolidation, and requirements transformation — all 81 test assertions pass.**

## What Happened

Created `migrate/transformer.ts` (~190 lines) implementing the complete `transformToGSD(parsed: PlanningProject): GSDProject` function. The implementation covers:

1. **Milestone detection**: Multi-milestone mode when `roadmap.milestones` is non-empty (each section → separate GSDMilestone with independent S01-based numbering); single-milestone mode for flat roadmaps; null roadmap fallback using filesystem phases with all `done: false`.

2. **Phase-to-slice mapping**: Float-sorts roadmap entries by phase number, assigns sequential S01/S02/... IDs, derives title via kebab-to-title-case, sets `done` from roadmap checkbox, defaults risk to `'medium'`, builds sequential depends chain.

3. **Plan-to-task mapping**: Sorts plans numerically within each phase, assigns T01/T02/..., sets `done` from summary existence, pulls description from objective, estimate from summary duration, files from frontmatter, mustHaves from frontmatter truths. Orphan summaries without plans are skipped.

4. **Research consolidation**: Sorts research files in preferred order (SUMMARY → ARCHITECTURE → STACK → FEATURES → PITFALLS → others), concatenates into milestone-level and slice-level research blobs.

5. **Requirements mapping**: Maps PlanningRequirement → GSDRequirement with defaults for class, source, primarySlice.

6. **Demo/goal derivation**: First sentence of first plan's objective, or fallback to `"unit tests prove ${slug} works"`.

## Verification

```
npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts
→ 81 assertions: 81 passed, 0 failed
```

All 10 scenarios pass: flat single-milestone, multi-milestone, decimal phase ordering, completion state, research consolidation, requirements classification, empty phase, demo derivation, field defaults, sequential depends.

## Diagnostics

Run test file and grep for failures:
- `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts`
- `npx tsx src/resources/extensions/gsd/tests/migrate-transformer.test.ts 2>&1 | grep FAIL:`

Each assertion has a descriptive label identifying scenario and field.

## Deviations

Research consolidation and requirements mapping were implemented here (T02) rather than deferred to T03 as the slice plan specified. These were straightforward, already covered by T01's test fixtures, and completing them here means T03 only needs to handle project-level field derivation (vision, successCriteria) and any remaining edge cases.

## Known Issues

- `vision` field on GSDMilestone is stubbed as empty string — T03 scope to derive from PROJECT.md
- `successCriteria` is `[]` — T03 scope
- Multi-milestone mode assigns project-level research only to the first milestone — acceptable for migration

## Files Created/Modified

- `src/resources/extensions/gsd/migrate/transformer.ts` — new file, complete core transformer (~190 lines)
