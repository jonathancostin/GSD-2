// GSD Directory Writer — Format Functions
// Pure string-returning functions that serialize GSD types into the exact markdown
// format that GSD-2's parsers expect (parseRoadmap, parsePlan, parseSummary, parseRequirementCounts).
// No I/O — each function takes typed data and returns a string.

import type {
  GSDMilestone,
  GSDSlice,
  GSDTask,
  GSDRequirement,
  GSDProject,
} from './types.ts';

// ─── Local Helpers ─────────────────────────────────────────────────────────

/**
 * Serialize a flat key-value map into YAML frontmatter block.
 * Matches parseFrontmatterMap() expectations:
 * - Scalars: `key: value`
 * - Arrays of strings: `key:\n  - item`
 * - Empty arrays: `key: []`
 * - Arrays of objects: `key:\n  - field1: val\n    field2: val`
 * - Boolean: `key: true/false`
 */
function serializeFrontmatter(data: Record<string, unknown>): string {
  const lines: string[] = ['---'];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'string' || typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        // Array of objects
        lines.push(`${key}:`);
        for (const obj of value) {
          const entries = Object.entries(obj as Record<string, string>);
          if (entries.length > 0) {
            lines.push(`  - ${entries[0][0]}: ${entries[0][1]}`);
            for (let i = 1; i < entries.length; i++) {
              lines.push(`    ${entries[i][0]}: ${entries[i][1]}`);
            }
          }
        }
      } else {
        // Array of scalars
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${item}`);
        }
      }
    }
  }

  lines.push('---');
  return lines.join('\n');
}

// ─── Format Functions ──────────────────────────────────────────────────────

/**
 * Format a milestone's ROADMAP.md content.
 * Output must parse correctly through parseRoadmap().
 */
export function formatRoadmap(milestone: GSDMilestone): string {
  const lines: string[] = [];

  lines.push(`# ${milestone.id}: ${milestone.title}`);
  lines.push('');
  lines.push(`**Vision:** ${milestone.vision || '(migrated project)'}`);
  lines.push('');

  lines.push('## Success Criteria');
  lines.push('');
  if (milestone.successCriteria.length > 0) {
    for (const criterion of milestone.successCriteria) {
      lines.push(`- ${criterion}`);
    }
  }
  lines.push('');

  lines.push('## Slices');
  lines.push('');
  for (const slice of milestone.slices) {
    const check = slice.done ? 'x' : ' ';
    const depsStr = slice.depends.length > 0 ? slice.depends.join(', ') : '';
    lines.push(`- [${check}] **${slice.id}: ${slice.title}** \`risk:${slice.risk}\` \`depends:[${depsStr}]\``);
    if (slice.demo) {
      lines.push(`  > After this: ${slice.demo}`);
    }
  }

  // Skip Boundary Map section entirely per D004

  return lines.join('\n') + '\n';
}

/**
 * Format a slice's PLAN.md (S01-PLAN.md).
 * Output must parse correctly through parsePlan().
 */
export function formatPlan(slice: GSDSlice): string {
  const lines: string[] = [];

  lines.push(`# ${slice.id}: ${slice.title}`);
  lines.push('');
  lines.push(`**Goal:** ${slice.goal || slice.title}`);
  lines.push(`**Demo:** ${slice.demo || slice.title}`);
  lines.push('');

  lines.push('## Must-Haves');
  lines.push('');
  // No must-haves in migrated data — empty section
  lines.push('');

  lines.push('## Tasks');
  lines.push('');
  for (const task of slice.tasks) {
    const check = task.done ? 'x' : ' ';
    const estPart = task.estimate ? ` \`est:${task.estimate}\`` : '';
    lines.push(`- [${check}] **${task.id}: ${task.title}**${estPart}`);
    if (task.description) {
      lines.push(`  - ${task.description}`);
    }
  }
  lines.push('');

  lines.push('## Files Likely Touched');
  lines.push('');
  for (const task of slice.tasks) {
    for (const file of task.files) {
      lines.push(`- \`${file}\``);
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Format a slice summary (S01-SUMMARY.md).
 * Output must parse correctly through parseSummary().
 */
export function formatSliceSummary(slice: GSDSlice, milestoneId: string): string {
  if (!slice.summary) return '';

  const s = slice.summary;
  const fm = serializeFrontmatter({
    id: slice.id,
    parent: milestoneId,
    milestone: milestoneId,
    provides: s.provides,
    requires: [],
    affects: [],
    key_files: s.keyFiles,
    key_decisions: s.keyDecisions,
    patterns_established: s.patternsEstablished,
    observability_surfaces: [],
    drill_down_paths: [],
    duration: s.duration || '',
    verification_result: 'passed',
    completed_at: s.completedAt || '',
    blocker_discovered: false,
  });

  const body = [
    '',
    `# ${slice.id}: ${slice.title}`,
    '',
    `**${s.whatHappened ? s.whatHappened.split('\n')[0] : 'Migrated from legacy format'}**`,
    '',
    '## What Happened',
    '',
    s.whatHappened || 'Migrated from legacy planning format.',
  ];

  return fm + body.join('\n') + '\n';
}

/**
 * Format a task summary (T01-SUMMARY.md).
 * Output must parse correctly through parseSummary().
 */
export function formatTaskSummary(task: GSDTask, sliceId: string, milestoneId: string): string {
  if (!task.summary) return '';

  const s = task.summary;
  const fm = serializeFrontmatter({
    id: task.id,
    parent: sliceId,
    milestone: milestoneId,
    provides: s.provides,
    requires: [],
    affects: [],
    key_files: s.keyFiles,
    key_decisions: [],
    patterns_established: [],
    observability_surfaces: [],
    drill_down_paths: [],
    duration: s.duration || '',
    verification_result: 'passed',
    completed_at: s.completedAt || '',
    blocker_discovered: false,
  });

  const body = [
    '',
    `# ${task.id}: ${task.title}`,
    '',
    `**${s.whatHappened ? s.whatHappened.split('\n')[0] : 'Migrated from legacy format'}**`,
    '',
    '## What Happened',
    '',
    s.whatHappened || 'Migrated from legacy planning format.',
  ];

  return fm + body.join('\n') + '\n';
}

/**
 * Format a task plan (T01-PLAN.md).
 * deriveState() only checks for file existence, not content.
 * Keep it minimal but valid markdown.
 */
export function formatTaskPlan(task: GSDTask, sliceId: string, milestoneId: string): string {
  const lines: string[] = [];
  lines.push(`# ${task.id}: ${task.title}`);
  lines.push('');
  lines.push(`**Slice:** ${sliceId} — **Milestone:** ${milestoneId}`);
  lines.push('');
  lines.push('## Description');
  lines.push('');
  lines.push(task.description || 'Migrated from legacy planning format.');
  lines.push('');

  if (task.mustHaves.length > 0) {
    lines.push('## Must-Haves');
    lines.push('');
    for (const mh of task.mustHaves) {
      lines.push(`- [ ] ${mh}`);
    }
    lines.push('');
  }

  if (task.files.length > 0) {
    lines.push('## Files');
    lines.push('');
    for (const f of task.files) {
      lines.push(`- \`${f}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format REQUIREMENTS.md grouped by status.
 * Output must parse correctly through parseRequirementCounts().
 * parseRequirementCounts expects: ## Active/## Validated/## Deferred/## Out of Scope sections
 * with ### R001 — Title headings under each section.
 */
export function formatRequirements(requirements: GSDRequirement[]): string {
  const lines: string[] = [];
  lines.push('# Requirements');
  lines.push('');

  const groups: Record<string, GSDRequirement[]> = {
    active: [],
    validated: [],
    deferred: [],
    'out-of-scope': [],
  };

  for (const req of requirements) {
    const status = req.status.toLowerCase();
    if (status in groups) {
      groups[status].push(req);
    } else {
      groups.active.push(req);
    }
  }

  const sectionMap: [string, string][] = [
    ['active', 'Active'],
    ['validated', 'Validated'],
    ['deferred', 'Deferred'],
    ['out-of-scope', 'Out of Scope'],
  ];

  for (const [key, heading] of sectionMap) {
    lines.push(`## ${heading}`);
    lines.push('');
    for (const req of groups[key]) {
      lines.push(`### ${req.id} — ${req.title}`);
      lines.push('');
      lines.push(`- Status: ${req.status}`);
      lines.push(`- Class: ${req.class}`);
      lines.push(`- Source: ${req.source}`);
      lines.push(`- Primary Slice: ${req.primarySlice}`);
      lines.push('');
      if (req.description) {
        lines.push(req.description);
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

// ─── Passthrough Format Helpers ────────────────────────────────────────────

/**
 * Format PROJECT.md content.
 * If content is empty, produce a minimal valid stub.
 */
export function formatProject(content: string): string {
  if (!content || !content.trim()) {
    return '# Project\n\n(Migrated project — no description available.)\n';
  }
  return content.endsWith('\n') ? content : content + '\n';
}

/**
 * Format DECISIONS.md content.
 * If content is empty, produce the standard header.
 */
export function formatDecisions(content: string): string {
  if (!content || !content.trim()) {
    return '# Decisions\n\n<!-- Append-only register of architectural and pattern decisions -->\n\n| ID | Decision | Rationale | Date |\n|----|----------|-----------|------|\n';
  }
  return content.endsWith('\n') ? content : content + '\n';
}

/**
 * Format a milestone CONTEXT.md.
 * Minimal context with no depends — migrated milestones have no upstream dependencies.
 */
export function formatContext(milestoneId: string): string {
  return `# ${milestoneId} Context\n\nMigrated milestone — no upstream dependencies.\n`;
}

/**
 * Format STATE.md.
 * deriveState() does not read STATE.md — it recomputes from scratch.
 * Write a minimal stub that will be overwritten on first /gsd status.
 */
export function formatState(milestones: GSDMilestone[]): string {
  const lines: string[] = [];
  lines.push('# GSD State');
  lines.push('');
  lines.push('<!-- Auto-generated. Updated by deriveState(). -->');
  lines.push('');
  for (const m of milestones) {
    const doneSlices = m.slices.filter(s => s.done).length;
    const totalSlices = m.slices.length;
    lines.push(`## ${m.id}: ${m.title}`);
    lines.push('');
    lines.push(`- Slices: ${doneSlices}/${totalSlices}`);
    lines.push('');
  }
  return lines.join('\n');
}
