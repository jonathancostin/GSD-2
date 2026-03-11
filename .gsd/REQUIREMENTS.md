# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R002 — Map old concepts to new GSD-2 structure
- Class: core-capability
- Status: active
- Description: Map old phases to slices (Phase 1 → S01), old plans to tasks (01-01 → T01), and old milestones (v1.0, v1.1) to M001, M002. Produce the correct directory hierarchy and file naming.
- Why it matters: The structural mapping is the core logic — wrong mapping means the migrated project is unusable.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S01
- Validation: unmapped
- Notes: Decimal phases (2.1, 2.2) need special handling — they may map to additional slices or be merged.

### R003 — Transform content from old formats to new GSD-2 formats
- Class: core-capability
- Status: active
- Description: Convert old PROJECT.md content into new PROJECT.md template shape. Convert old ROADMAP.md phases into new roadmap slice entries with risk, depends, demo sentences, and boundary map. Convert old requirements into new REQUIREMENTS.md with classes, ownership, and traceability. Convert old summaries into new summary format with YAML frontmatter.
- Why it matters: The migrated files must actually work with GSD-2's parsers, templates, and auto-mode — not just look similar.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S03
- Validation: unmapped
- Notes: Some fields in new format (risk levels, boundary maps) don't exist in old format — these need reasonable inference or defaults.

### R004 — Preserve completion state
- Class: primary-user-loop
- Status: active
- Description: Phases marked complete in old roadmap should produce `[x]` slice entries in new roadmap. Plans marked complete should produce `[x]` task entries. Requirements checked off should be moved to Validated section.
- Why it matters: Users migrating active projects need to continue from where they left off, not re-verify completed work.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Completion status comes from roadmap checkboxes and summary file existence.

### R005 — Migrate research files
- Class: continuity
- Status: active
- Description: Consolidate `.planning/research/` files (STACK.md, ARCHITECTURE.md, FEATURES.md, PITFALLS.md, SUMMARY.md) into a single M001-RESEARCH.md in the new milestone directory. Per-phase research files should become slice-level research.
- Why it matters: Research represents significant agent effort — losing it means repeating expensive work.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Codebase maps (.planning/codebase/) could go into milestone context or research.

### R006 — Write complete .gsd directory structure
- Class: core-capability
- Status: active
- Description: Generate the full `.gsd/` tree: PROJECT.md, REQUIREMENTS.md, DECISIONS.md, STATE.md, and milestone directories with roadmap, context, research, slice directories with plans, summaries, UATs, and task directories with task plans and summaries.
- Why it matters: The output must be structurally valid for GSD-2 to pick up and continue working.
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Must match the exact naming convention (bare ID dirs, ID-SUFFIX files).

### R007 — /gsd migrate command with preview
- Class: primary-user-loop
- Status: active
- Description: Add `/gsd migrate` subcommand that accepts a path to a project with a `.planning` directory, shows a preview of what will be created (file count, milestone/slice/task counts, completion state), and asks for confirmation before writing.
- Why it matters: Users need to see what will happen before committing to an irreversible directory write. The command should be discoverable within the existing /gsd surface.
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Preview should show enough to build confidence without overwhelming.

### R009 — Handle edge cases gracefully
- Class: quality-attribute
- Status: active
- Description: Handle incomplete phases (planned but never executed), missing summaries, quick tasks (.planning/quick/), codebase map files (.planning/codebase/), decimal phases (2.1, 2.2 insertions), and multi-milestone roadmaps.
- Why it matters: Real .planning directories are messy — the tool must not crash or produce garbage when encountering variations.
- Source: inferred
- Primary owning slice: M001/S02
- Supporting slices: M001/S01
- Validation: unmapped
- Notes: Quick tasks could become a separate slice or be noted in context. Codebase maps could go into milestone context.

## Validated

### R001 — Parse old .planning directory structure
- Class: core-capability
- Status: validated
- Description: Read and parse all files from an old get-shit-done `.planning` directory: PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, config.json, phase directories with plans and summaries, research files, context files, and codebase maps.
- Why it matters: Without reliable parsing, no migration is possible. The old format has variations (milestoned vs flat roadmaps, decimal phases, varying summary formats).
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: M001/S01 — 120 fixture-based assertions covering all file types, both roadmap formats (flat and milestone-sectioned), XML-in-markdown plans, YAML frontmatter summaries, edge cases (orphan summaries, duplicate phase numbers, .archive/ skipping, quick tasks)
- Notes: Must handle both YAML frontmatter and plain markdown. Old plans use XML-in-markdown structure.

### R008 — Validate source before migration
- Class: failure-visibility
- Status: validated
- Description: Before migration, validate that the source `.planning` directory has the minimum required files (at least ROADMAP.md or PROJECT.md), detect missing or corrupt files, and report issues clearly rather than silently producing broken output.
- Why it matters: Garbage in → garbage out. Users need to know if their source is incomplete before migration runs.
- Source: inferred
- Primary owning slice: M001/S01
- Supporting slices: M001/S04
- Validation: M001/S01 (parser-side) — `validatePlanningDirectory` returns structured ValidationResult with {file, severity, message} per issue; missing directory → fatal, missing ROADMAP.md → fatal, missing optional files → warning. CLI-surface validation (user-visible error display) remains for M001/S04.
- Notes: Should distinguish fatal issues (no roadmap) from warnings (missing optional files).

## Deferred

### R010 — Batch migration across multiple projects
- Class: operability
- Status: deferred
- Description: Scan a root directory for all projects containing `.planning` dirs and migrate them in sequence.
- Why it matters: Power users with many old projects would benefit, but single-project migration covers the primary use case.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred per user decision — single directory migration first.

## Out of Scope

### R011 — Migrate .planning config.json workflow settings
- Class: constraint
- Status: out-of-scope
- Description: The old config.json (mode, granularity, model_profile, workflow toggles, git branching) has no equivalent in GSD-2 which uses different configuration patterns.
- Why it matters: Prevents scope creep into configuration compatibility that doesn't map cleanly.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Config settings are fundamentally different between systems.

### R012 — Two-way sync between .planning and .gsd
- Class: anti-feature
- Status: out-of-scope
- Description: Keep both directories in sync or allow reverse migration from .gsd back to .planning.
- Why it matters: Migration is a one-way upgrade path — maintaining two formats is complexity without value.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: One-way migration only.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M001/S01 | none | M001/S01 |
| R002 | core-capability | active | M001/S02 | M001/S01 | unmapped |
| R003 | core-capability | active | M001/S02 | M001/S03 | unmapped |
| R004 | primary-user-loop | active | M001/S02 | none | unmapped |
| R005 | continuity | active | M001/S02 | none | unmapped |
| R006 | core-capability | active | M001/S03 | none | unmapped |
| R007 | primary-user-loop | active | M001/S04 | none | unmapped |
| R008 | failure-visibility | validated | M001/S01 | M001/S04 | M001/S01 (parser-side) |
| R009 | quality-attribute | active | M001/S02 | M001/S01 | unmapped |
| R010 | operability | deferred | none | none | unmapped |
| R011 | constraint | out-of-scope | none | none | n/a |
| R012 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 7
- Mapped to slices: 7
- Validated: 2 (R001, R008)
- Unmapped active requirements: 0
