# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001 | arch | Migration direction | One-way .planning → .gsd only | Two-way sync adds complexity without value; migration is a one-time upgrade | No |
| D002 | M001 | arch | Structural mapping | Phases → Slices, Plans → Tasks | Natural hierarchy mapping; phase = demoable unit = slice, plan = atomic work = task | No |
| D003 | M001 | convention | CLI surface | /gsd migrate subcommand | Consistent with existing /gsd command routing; discoverable within the tool | No |
| D004 | M001 | scope | Migration target | Single .planning directory per invocation | Simpler, safer, more predictable than batch scanning; batch deferred to R010 | Yes — if users request batch |
| D005 | M001 | convention | Preview before write | Required confirmation step | Irreversible directory write needs user confidence; show file counts and structure | No |
| D006 | M001 | arch | Completion state | Preserve from source | Users migrating active projects need continuity; completed phases → [x] slices | No |
| D007 | M001 | arch | Research migration | Consolidate into milestone research | Preserves expensive agent work; project-level research → M001-RESEARCH.md, per-phase → slice research | No |
| D008 | M001 | convention | Module location | src/resources/extensions/gsd/migrate/ | Keeps migration code isolated from core GSD logic; easy to find and maintain | Yes — if it should be a separate extension |
| D009 | M001/S01 | arch | Export files.ts helpers | Add export to 6 private helpers in files.ts | Parser needs identical markdown utilities; re-implementing would duplicate tested code. Export-only change, no signature changes. | No |
| D010 | M001/S01 | arch | Fixture-based parser tests | Synthetic .planning dirs via mkdtempSync, not real project dirs | Reproducible, fast, no external dependency; covers all edge cases from research. Matches derive-state.test.ts pattern. | No |
| D011 | M001/S01 | convention | Phase key = full directory name | Use "45-logging-config-standardization" not just "45" | Handles duplicate phase numbers across milestones (discovered in nexus). Number alone is not unique. | No |
