// Old .planning format type definitions
// Defines the contract for parsing legacy .planning directories into typed structures.
// Zero Pi dependencies — pure type definitions only.

// ─── Validation ────────────────────────────────────────────────────────────

export type ValidationSeverity = 'fatal' | 'warning';

export interface ValidationIssue {
  file: string;
  severity: ValidationSeverity;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// ─── Top-Level Container ───────────────────────────────────────────────────

export interface PlanningProject {
  /** Absolute path to the .planning directory */
  path: string;
  /** Parsed PROJECT.md content, null if missing */
  project: string | null;
  /** Parsed ROADMAP.md */
  roadmap: PlanningRoadmap | null;
  /** Parsed REQUIREMENTS.md entries */
  requirements: PlanningRequirement[];
  /** Parsed STATE.md */
  state: PlanningState | null;
  /** Parsed config.json */
  config: PlanningConfig | null;
  /** Phase directories keyed by full directory name (e.g. "29-auth-system") */
  phases: Record<string, PlanningPhase>;
  /** Quick tasks from quick/ directory */
  quickTasks: PlanningQuickTask[];
  /** Milestone-level data from milestones/ directory */
  milestones: PlanningMilestone[];
  /** Research files from top-level research/ directory */
  research: PlanningResearch[];
  /** Validation result from pre-flight checks */
  validation: ValidationResult;
}

// ─── Roadmap ───────────────────────────────────────────────────────────────

export interface PlanningRoadmap {
  /** Raw content for reference */
  raw: string;
  /** Milestone sections (for milestone-sectioned roadmaps) */
  milestones: PlanningRoadmapMilestone[];
  /** Flat phase entries (for simple flat roadmaps) */
  phases: PlanningRoadmapEntry[];
}

export interface PlanningRoadmapMilestone {
  /** Milestone identifier (e.g. "v2.5") */
  id: string;
  /** Milestone title */
  title: string;
  /** Whether the milestone section is collapsed (inside <details>) */
  collapsed: boolean;
  /** Phase entries within this milestone */
  phases: PlanningRoadmapEntry[];
}

export interface PlanningRoadmapEntry {
  /** Phase number */
  number: number;
  /** Phase title/slug */
  title: string;
  /** Whether the phase checkbox is checked */
  done: boolean;
  /** Raw line text for reference */
  raw: string;
}

// ─── Phase ─────────────────────────────────────────────────────────────────

export interface PlanningPhase {
  /** Full directory name (e.g. "29-auth-system") */
  dirName: string;
  /** Extracted phase number */
  number: number;
  /** Extracted phase slug */
  slug: string;
  /** Plan files keyed by plan number (e.g. "01") */
  plans: Record<string, PlanningPlan>;
  /** Summary files keyed by plan number (e.g. "01"), includes orphans */
  summaries: Record<string, PlanningSummary>;
  /** Research files in phase directory */
  research: PlanningResearch[];
  /** Verification files */
  verifications: PlanningPhaseFile[];
  /** Non-standard extra files */
  extraFiles: PlanningPhaseFile[];
}

// ─── Plan (XML-in-Markdown) ────────────────────────────────────────────────

export interface PlanningPlan {
  /** File name (e.g. "29-01-PLAN.md") */
  fileName: string;
  /** Plan number within phase (e.g. "01") */
  planNumber: string;
  /** Parsed YAML frontmatter */
  frontmatter: PlanningPlanFrontmatter;
  /** Extracted <objective> content */
  objective: string;
  /** Extracted <tasks> with individual <task> entries */
  tasks: string[];
  /** Extracted <context> content */
  context: string;
  /** Extracted <verification> content */
  verification: string;
  /** Extracted <success_criteria> content */
  successCriteria: string;
  /** Raw content for reference */
  raw: string;
}

export interface PlanningPlanFrontmatter {
  phase: string;
  plan: string;
  type: string;
  wave: number | null;
  depends_on: string[];
  files_modified: string[];
  autonomous: boolean;
  must_haves: PlanningPlanMustHaves | null;
}

export interface PlanningPlanMustHaves {
  truths: string[];
  artifacts: string[];
  key_links: string[];
}

// ─── Summary (YAML Frontmatter) ────────────────────────────────────────────

export interface PlanningSummary {
  /** File name (e.g. "29-01-SUMMARY.md") */
  fileName: string;
  /** Plan number within phase (e.g. "01") */
  planNumber: string;
  /** Parsed YAML frontmatter */
  frontmatter: PlanningSummaryFrontmatter;
  /** Body content (after frontmatter) */
  body: string;
  /** Raw content for reference */
  raw: string;
}

export interface PlanningSummaryFrontmatter {
  phase: string;
  plan: string;
  subsystem: string;
  tags: string[];
  requires: PlanningSummaryRequires[];
  provides: string[];
  affects: string[];
  'tech-stack': string[];
  'key-files': string[];
  'key-decisions': string[];
  'patterns-established': string[];
  duration: string;
  completed: string;
}

export interface PlanningSummaryRequires {
  phase: string;
  provides: string;
}

// ─── Requirements ──────────────────────────────────────────────────────────

export interface PlanningRequirement {
  /** Requirement ID (e.g. "R001") */
  id: string;
  /** Requirement title */
  title: string;
  /** Status (active, validated, deferred, etc.) */
  status: string;
  /** Description text */
  description: string;
  /** Raw section content */
  raw: string;
}

// ─── Research ──────────────────────────────────────────────────────────────

export interface PlanningResearch {
  /** File name */
  fileName: string;
  /** Raw content */
  content: string;
}

// ─── Config ────────────────────────────────────────────────────────────────

export interface PlanningConfig {
  /** Project name from config */
  projectName: string;
  /** Any other config fields */
  [key: string]: unknown;
}

// ─── Quick Tasks ───────────────────────────────────────────────────────────

export interface PlanningQuickTask {
  /** Directory name (e.g. "001-fix-login") */
  dirName: string;
  /** Task number */
  number: number;
  /** Task slug */
  slug: string;
  /** Plan file content, null if missing */
  plan: string | null;
  /** Summary file content, null if missing */
  summary: string | null;
}

// ─── Milestones ────────────────────────────────────────────────────────────

export interface PlanningMilestone {
  /** Directory or file identifier (e.g. "v2.2") */
  id: string;
  /** Requirements file content, null if missing */
  requirements: string | null;
  /** Roadmap file content, null if missing */
  roadmap: string | null;
  /** Any other files */
  extraFiles: PlanningPhaseFile[];
}

// ─── State ─────────────────────────────────────────────────────────────────

export interface PlanningState {
  /** Raw content */
  raw: string;
  /** Extracted current phase */
  currentPhase: string | null;
  /** Extracted status */
  status: string | null;
}

// ─── Generic File Reference ────────────────────────────────────────────────

export interface PlanningPhaseFile {
  /** File name */
  fileName: string;
  /** Raw content */
  content: string;
}
