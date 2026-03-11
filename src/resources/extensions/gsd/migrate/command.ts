/**
 * /gsd migrate — one-shot migration from .planning to .gsd
 *
 * Thin UX orchestrator: resolves paths, runs the validate → parse → transform →
 * preview → write pipeline, and shows confirmation UI via showNextAction.
 * All business logic lives in the pipeline modules (S01–S03).
 */

import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { join } from "node:path";
import { showNextAction } from "../../shared/next-action-ui.js";
import {
  validatePlanningDirectory,
  parsePlanningDirectory,
  transformToGSD,
  generatePreview,
  writeGSDDirectory,
} from "./index.js";

export async function handleMigrate(
  args: string,
  ctx: ExtensionCommandContext,
): Promise<void> {
  // ── Guard: empty args ──────────────────────────────────────────────────────
  if (!args) {
    ctx.ui.notify(
      "Usage: /gsd migrate <path-to-project>\n\nPath should point to a project root or its .planning directory.",
      "warning",
    );
    return;
  }

  // ── Resolve source path ────────────────────────────────────────────────────
  let sourcePath = resolve(process.cwd(), args);
  if (!sourcePath.endsWith(".planning")) {
    sourcePath = join(sourcePath, ".planning");
  }

  if (!existsSync(sourcePath)) {
    ctx.ui.notify(
      `Directory not found: ${sourcePath}\n\nMake sure the path points to a project root with a .planning directory.`,
      "error",
    );
    return;
  }

  // ── Validate ───────────────────────────────────────────────────────────────
  const validation = await validatePlanningDirectory(sourcePath);

  const warnings = validation.issues.filter((i) => i.severity === "warning");
  const fatals = validation.issues.filter((i) => i.severity === "fatal");

  for (const w of warnings) {
    ctx.ui.notify(`⚠ ${w.message} (${w.file})`, "warning");
  }
  for (const f of fatals) {
    ctx.ui.notify(`✖ ${f.message} (${f.file})`, "error");
  }

  if (!validation.valid) {
    ctx.ui.notify(
      "Migration blocked — fix the fatal issues above before retrying.",
      "error",
    );
    return;
  }

  // ── Parse → Transform → Preview ───────────────────────────────────────────
  const parsed = await parsePlanningDirectory(sourcePath);
  const project = transformToGSD(parsed);
  const preview = generatePreview(project);

  // ── Build preview text ─────────────────────────────────────────────────────
  const lines: string[] = [
    `Milestones: ${preview.milestoneCount}`,
    `Slices: ${preview.totalSlices} (${preview.doneSlices} done — ${preview.sliceCompletionPct}%)`,
    `Tasks: ${preview.totalTasks} (${preview.doneTasks} done — ${preview.taskCompletionPct}%)`,
  ];

  if (preview.requirements.total > 0) {
    lines.push(
      `Requirements: ${preview.requirements.total} (${preview.requirements.validated} validated, ${preview.requirements.active} active, ${preview.requirements.deferred} deferred)`,
    );
  }

  const targetGsdExists = existsSync(join(process.cwd(), ".gsd"));
  if (targetGsdExists) {
    lines.push("");
    lines.push("⚠ A .gsd directory already exists in the current working directory — it will be overwritten.");
  }

  // ── Confirmation via showNextAction ────────────────────────────────────────
  const choice = await showNextAction(ctx as any, {
    title: "Migration preview",
    summary: lines,
    actions: [
      {
        id: "confirm",
        label: "Write .gsd directory",
        description: `Migrate ${preview.milestoneCount} milestone(s) to ${process.cwd()}/.gsd`,
        recommended: true,
      },
      {
        id: "cancel",
        label: "Cancel",
        description: "Exit without writing anything",
      },
    ],
    notYetMessage: "Run /gsd migrate again when ready.",
  });

  if (choice !== "confirm") {
    ctx.ui.notify("Migration cancelled — no files were written.", "info");
    return;
  }

  // ── Write ──────────────────────────────────────────────────────────────────
  ctx.ui.notify("Writing .gsd directory…", "info");

  const result = await writeGSDDirectory(project, process.cwd());

  ctx.ui.notify(
    `✓ Migration complete — ${result.paths.length} file(s) written to .gsd/`,
    "info",
  );
}
