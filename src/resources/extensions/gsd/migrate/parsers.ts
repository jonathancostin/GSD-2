// Old .planning format per-file parsers
// Pure functions that take file content (string) and return typed data.
// Zero Pi dependencies — uses only exported helpers from files.ts.

import { splitFrontmatter, parseFrontmatterMap, extractBoldField } from '../files.ts';

import type {
  PlanningRoadmap,
  PlanningRoadmapMilestone,
  PlanningRoadmapEntry,
  PlanningPlan,
  PlanningPlanFrontmatter,
  PlanningPlanMustHaves,
  PlanningSummary,
  PlanningSummaryFrontmatter,
  PlanningSummaryRequires,
  PlanningRequirement,
  PlanningState,
  PlanningConfig,
} from './types.ts';

// Re-export PlanningProjectMeta — not in types.ts yet, use string for project field
// Actually PlanningProjectMeta isn't in types.ts — project is stored as string | null.
// We'll keep parseOldProject returning a simple shape.

// ─── XML-in-Markdown Extraction ────────────────────────────────────────────

/**
 * Extract content between XML-like tags in markdown.
 * NOT a real XML parser — handles `<tag>content</tag>` with markdown inside.
 */
function extractXmlTag(content: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = regex.exec(content);
  return match ? match[1].trim() : '';
}

/**
 * Extract all nested `<task>` entries from within a `<tasks>` block.
 */
function extractTasks(content: string): string[] {
  const tasksBlock = extractXmlTag(content, 'tasks');
  if (!tasksBlock) return [];

  const tasks: string[] = [];
  const regex = /<task>([\s\S]*?)<\/task>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(tasksBlock)) !== null) {
    const trimmed = match[1].trim();
    if (trimmed) tasks.push(trimmed);
  }
  return tasks;
}

// ─── Roadmap Parser ────────────────────────────────────────────────────────

/** Parse a checkbox phase entry line: `- [x] 29 — Auth System` */
function parsePhaseEntry(line: string): PlanningRoadmapEntry | null {
  // Match: - [x] or - [ ] followed by number — title (or number — title)
  const match = line.match(/^-\s+\[([ xX])\]\s+(\d+)\s*[—–-]\s*(.+)$/);
  if (!match) return null;
  return {
    number: parseInt(match[2], 10),
    title: match[3].trim(),
    done: match[1].toLowerCase() === 'x',
    raw: line,
  };
}

/**
 * Parse old-format ROADMAP.md.
 * Handles two formats:
 * 1. Flat phase lists — checkbox lines under a single Phases heading
 * 2. Milestone-sectioned — `## v2.0 — Title` headings with optional `<details>` blocks
 */
export function parseOldRoadmap(content: string): PlanningRoadmap {
  const result: PlanningRoadmap = {
    raw: content,
    milestones: [],
    phases: [],
  };

  const lines = content.split('\n');

  // Detect milestone-sectioned format: has ## headings with version-like IDs
  const milestoneHeadingRegex = /^##\s+(.+)$/;
  const milestoneHeadings: { index: number; id: string; title: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(milestoneHeadingRegex);
    if (match) {
      const heading = match[1].trim();
      // Skip generic headings like "## Phases"
      if (/^phases$/i.test(heading)) continue;
      // Extract milestone ID (e.g. "v2.0" from "v2.0 — Foundation")
      const idMatch = heading.match(/^(v[\d.]+|[\w.-]+)\s*[—–-]\s*(.+)$/);
      if (idMatch) {
        milestoneHeadings.push({ index: i, id: idMatch[1], title: idMatch[2].trim() });
      }
    }
  }

  if (milestoneHeadings.length > 0) {
    // Milestone-sectioned format
    for (let m = 0; m < milestoneHeadings.length; m++) {
      const startIdx = milestoneHeadings[m].index + 1;
      const endIdx = m + 1 < milestoneHeadings.length ? milestoneHeadings[m + 1].index : lines.length;
      const sectionLines = lines.slice(startIdx, endIdx);

      const milestone: PlanningRoadmapMilestone = {
        id: milestoneHeadings[m].id,
        title: milestoneHeadings[m].title,
        collapsed: false,
        phases: [],
      };

      // Check for <details> block
      const sectionText = sectionLines.join('\n');
      if (sectionText.includes('<details>')) {
        milestone.collapsed = true;
      }

      // Extract phase entries from the section (including inside <details>)
      for (const line of sectionLines) {
        const entry = parsePhaseEntry(line.trim());
        if (entry) {
          milestone.phases.push(entry);
        }
      }

      result.milestones.push(milestone);
    }
  } else {
    // Flat format — just extract all phase checkbox lines
    for (const line of lines) {
      const entry = parsePhaseEntry(line.trim());
      if (entry) {
        result.phases.push(entry);
      }
    }
  }

  return result;
}

// ─── Plan Parser (XML-in-Markdown) ─────────────────────────────────────────

/** Strip surrounding quotes from YAML string values */
function unquote(val: unknown): string {
  const s = String(val ?? '');
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Parse the must_haves nested structure from frontmatter lines directly.
 * parseFrontmatterMap doesn't handle 3-level nesting well, so we re-parse.
 */
function parseMustHavesFromLines(fmLines: string[]): PlanningPlanMustHaves | null {
  const start = fmLines.findIndex(l => /^must_haves\s*:/.test(l));
  if (start === -1) return null;

  const truths: string[] = [];
  const artifacts: string[] = [];
  const keyLinks: string[] = [];
  let currentList: string[] | null = null;

  for (let i = start + 1; i < fmLines.length; i++) {
    const line = fmLines[i];
    // New top-level key — stop
    if (/^\w/.test(line)) break;
    // Sub-key at 2-space indent
    const subKey = line.match(/^  (\w[\w_]*):/);
    if (subKey) {
      const key = subKey[1];
      if (key === 'truths') currentList = truths;
      else if (key === 'artifacts') currentList = artifacts;
      else if (key === 'key_links') currentList = keyLinks;
      else currentList = null;
      // Check for inline empty array
      if (/:\s*\[\]/.test(line)) currentList = null;
      continue;
    }
    // Array item at 4-space indent
    const item = line.match(/^    - (.+)$/);
    if (item && currentList) {
      currentList.push(item[1].trim());
    }
  }

  if (truths.length === 0 && artifacts.length === 0 && keyLinks.length === 0) return null;
  return { truths, artifacts, key_links: keyLinks };
}

function parsePlanFrontmatter(fm: Record<string, unknown>, fmLines: string[] | null): PlanningPlanFrontmatter {
  const mustHaves = fmLines ? parseMustHavesFromLines(fmLines) : null;

  return {
    phase: unquote(fm.phase),
    plan: unquote(fm.plan),
    type: unquote(fm.type),
    wave: fm.wave !== undefined ? Number(fm.wave) : null,
    depends_on: Array.isArray(fm.depends_on) ? fm.depends_on.map(s => unquote(s)) : [],
    files_modified: Array.isArray(fm.files_modified) ? fm.files_modified.map(s => unquote(s)) : [],
    autonomous: fm.autonomous === 'true' || fm.autonomous === true,
    must_haves: mustHaves,
  };
}

/**
 * Parse old-format plan file with YAML frontmatter and XML-in-markdown sections.
 * Falls back to plain markdown for quick-task plans that lack XML tags.
 */
export function parseOldPlan(content: string, fileName: string = '', planNumber: string = ''): PlanningPlan {
  const [fmLines, body] = splitFrontmatter(content);
  const fm = fmLines ? parseFrontmatterMap(fmLines) : {};
  const frontmatter = parsePlanFrontmatter(fm, fmLines);

  // Extract XML-in-markdown sections
  const objective = extractXmlTag(content, 'objective');
  const tasks = extractTasks(content);
  const context = extractXmlTag(content, 'context');
  const verification = extractXmlTag(content, 'verification');
  const successCriteria = extractXmlTag(content, 'success_criteria');

  return {
    fileName,
    planNumber: planNumber || String(fm.plan ?? ''),
    frontmatter,
    objective,
    tasks,
    context,
    verification,
    successCriteria,
    raw: content,
  };
}

// ─── Summary Parser (YAML Frontmatter) ─────────────────────────────────────

function parseRequiresArray(raw: unknown): PlanningSummaryRequires[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(item => {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, string>;
      return { phase: obj.phase ?? '', provides: obj.provides ?? '' };
    }
    return { phase: '', provides: String(item) };
  });
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  return [];
}

/**
 * Parse YAML-like frontmatter lines into a flat key-value map.
 * Like parseFrontmatterMap but supports hyphenated keys (e.g. `tech-stack:`).
 */
function parseFrontmatterMapHyphen(lines: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let currentArray: unknown[] | null = null;
  let currentObj: Record<string, string> | null = null;

  for (const line of lines) {
    // Nested object property (4-space indent with key: value)
    const nestedMatch = line.match(/^    ([\w][\w_-]*)\s*:\s*(.*)$/);
    if (nestedMatch && currentArray && currentObj) {
      currentObj[nestedMatch[1]] = nestedMatch[2].trim();
      continue;
    }

    // Array item (2-space indent)
    const arrayMatch = line.match(/^  - (.*)$/);
    if (arrayMatch && currentKey) {
      if (currentObj && Object.keys(currentObj).length > 0) {
        currentArray!.push(currentObj);
      }
      currentObj = null;

      const val = arrayMatch[1].trim();
      if (!currentArray) currentArray = [];

      const nestedStart = val.match(/^([\w][\w_-]*)\s*:\s*(.*)$/);
      if (nestedStart) {
        currentObj = { [nestedStart[1]]: nestedStart[2].trim() };
      } else {
        currentArray.push(val);
      }
      continue;
    }

    // Flush previous key
    if (currentKey) {
      if (currentObj && Object.keys(currentObj).length > 0 && currentArray) {
        currentArray.push(currentObj);
        currentObj = null;
      }
      if (currentArray) {
        result[currentKey] = currentArray;
      }
      currentArray = null;
    }

    // Top-level key: value (supports hyphens in key names)
    const kvMatch = line.match(/^([\w][\w_-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();

      if (val === '' || val === '[]') {
        currentArray = [];
      } else if (val.startsWith('[') && val.endsWith(']')) {
        const inner = val.slice(1, -1).trim();
        result[currentKey] = inner ? inner.split(',').map(s => s.trim()) : [];
        currentKey = null;
      } else {
        result[currentKey] = val;
        currentKey = null;
      }
    }
  }

  // Flush final key
  if (currentKey) {
    if (currentObj && Object.keys(currentObj).length > 0 && currentArray) {
      currentArray.push(currentObj);
      currentObj = null;
    }
    if (currentArray) {
      result[currentKey] = currentArray;
    }
  }

  return result;
}

function parseSummaryFrontmatter(fm: Record<string, unknown>): PlanningSummaryFrontmatter {
  return {
    phase: unquote(fm.phase),
    plan: unquote(fm.plan),
    subsystem: unquote(fm.subsystem),
    tags: toStringArray(fm.tags),
    requires: parseRequiresArray(fm.requires),
    provides: toStringArray(fm.provides),
    affects: toStringArray(fm.affects),
    'tech-stack': toStringArray(fm['tech-stack']),
    'key-files': toStringArray(fm['key-files']),
    'key-decisions': toStringArray(fm['key-decisions']),
    'patterns-established': toStringArray(fm['patterns-established']),
    duration: unquote(fm.duration),
    completed: unquote(fm.completed),
  };
}

/**
 * Parse old-format summary file with YAML frontmatter.
 */
export function parseOldSummary(content: string, fileName: string = '', planNumber: string = ''): PlanningSummary {
  const [fmLines, body] = splitFrontmatter(content);
  const fm = fmLines ? parseFrontmatterMapHyphen(fmLines) : {};

  return {
    fileName,
    planNumber: planNumber || String(fm.plan ?? ''),
    frontmatter: parseSummaryFrontmatter(fm),
    body,
    raw: content,
  };
}

// ─── Requirements Parser ───────────────────────────────────────────────────

/**
 * Parse old-format REQUIREMENTS.md.
 * Extracts requirement entries from markdown with status sections and requirement headings.
 */
export function parseOldRequirements(content: string): PlanningRequirement[] {
  const requirements: PlanningRequirement[] = [];
  const lines = content.split('\n');

  let currentStatus = '';
  let currentReq: Partial<PlanningRequirement> | null = null;
  let currentRaw: string[] = [];

  function flushReq() {
    if (currentReq?.id && currentReq?.title) {
      requirements.push({
        id: currentReq.id,
        title: currentReq.title,
        status: currentReq.status || currentStatus || 'unknown',
        description: currentReq.description || '',
        raw: currentRaw.join('\n').trim(),
      });
    }
    currentReq = null;
    currentRaw = [];
  }

  for (const line of lines) {
    // Status section heading (## Active, ## Validated, ## Deferred)
    const statusMatch = line.match(/^##\s+(\w+)\s*$/);
    if (statusMatch) {
      flushReq();
      currentStatus = statusMatch[1].toLowerCase();
      continue;
    }

    // Requirement heading (### R001 — Title)
    const reqMatch = line.match(/^###\s+(R\d+)\s*[—–-]\s*(.+)$/);
    if (reqMatch) {
      flushReq();
      currentReq = { id: reqMatch[1], title: reqMatch[2].trim(), status: currentStatus, description: '' };
      currentRaw.push(line);
      continue;
    }

    // Description or metadata within a requirement
    if (currentReq) {
      currentRaw.push(line);
      const descMatch = line.match(/^-\s+Description:\s*(.+)$/);
      if (descMatch) {
        currentReq.description = descMatch[1].trim();
        continue;
      }
      const statMatch = line.match(/^-\s+Status:\s*(.+)$/);
      if (statMatch) {
        currentReq.status = statMatch[1].trim();
      }
    }
  }

  flushReq();
  return requirements;
}

// ─── Project Parser ────────────────────────────────────────────────────────

// PlanningProjectMeta isn't in types.ts — project field on PlanningProject is `string | null`.
// This parser returns the raw content as a string. The top-level parser stores it directly.

/**
 * Parse old-format PROJECT.md.
 * Returns the raw content as a string (stored as project field on PlanningProject).
 */
export function parseOldProject(content: string): string {
  return content;
}

// ─── State Parser ──────────────────────────────────────────────────────────

/**
 * Parse old-format STATE.md.
 * Extracts current phase and status from bold-field patterns.
 */
export function parseOldState(content: string): PlanningState {
  const currentPhase = extractBoldField(content, 'Current Phase');
  const status = extractBoldField(content, 'Status');

  return {
    raw: content,
    currentPhase,
    status,
  };
}

// ─── Config Parser ─────────────────────────────────────────────────────────

/**
 * Parse old-format config.json.
 * Returns null on invalid JSON (graceful error handling).
 */
export function parseOldConfig(content: string): PlanningConfig | null {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as PlanningConfig;
  } catch {
    return null;
  }
}
