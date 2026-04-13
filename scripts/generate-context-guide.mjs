#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    args[key] = value;
  }
  return args;
}

function run(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

function normalizeList(value, fallback = ["- none"]) {
  if (!value) {
    return fallback;
  }
  return value
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (entry.startsWith("-") ? entry : `- ${entry}`));
}

function deriveTouchedFiles(baseRef) {
  const diffAgainstBase = baseRef ? run(`git diff --name-only ${baseRef}...HEAD`) : "";
  const diffAgainstHead = run("git diff --name-only HEAD");
  const untracked = run("git ls-files --others --exclude-standard");

  const merged = [diffAgainstBase, diffAgainstHead, untracked]
    .filter(Boolean)
    .join("\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(merged));
  if (unique.length === 0) {
    return ["- none"];
  }

  return unique.map((line) => `- ${line}`);
}

function fillTemplate(template, replacements) {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.replaceAll(`{${key}}`, value);
  }
  return output;
}

function toIndentedBlock(lines, indentSize) {
  const indent = " ".repeat(indentSize);
  return lines.map((line) => `${indent}${line}`).join("\n");
}

function readRefreshCount(filePath) {
  if (!fs.existsSync(filePath)) {
    return 0;
  }

  const existing = fs.readFileSync(filePath, "utf8");
  const match = existing.match(/refresh_count:\s*(\d+)/);
  if (!match) {
    return 0;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const args = parseArgs(process.argv);
const cwd = process.cwd();

const templatePath = path.resolve(
  cwd,
  args.template || process.env.CONTEXT_GUIDE_TEMPLATE || "docs/context-guide.template.md"
);

const outputDir = path.resolve(
  cwd,
  args.outputDir || process.env.CONTEXT_GUIDE_OUTPUT_DIR || "docs/context-guides"
);

const timestamp = new Date().toISOString().replace(/[:]/g, "-");
const featureId = args.feature || process.env.CONTEXT_GUIDE_FEATURE || "unscoped";
const taskId = args.task || process.env.CONTEXT_GUIDE_TASK || "n/a";
const branch =
  args.branch || process.env.CONTEXT_GUIDE_BRANCH || run("git rev-parse --abbrev-ref HEAD") || "unknown";
const outputFile =
  args.output || process.env.CONTEXT_GUIDE_OUTPUT || path.join(outputDir, `${featureId}__${timestamp}.context.md`);

const refreshCount = readRefreshCount(outputFile) + 1;
const touchedFiles = args.files
  ? normalizeList(args.files)
  : deriveTouchedFiles(args.base || process.env.CONTEXT_GUIDE_BASE || "main");

const replacements = {
  feature_id: featureId,
  task_id: taskId,
  branch,
  generated_at_utc: new Date().toISOString(),
  source_revision: run("git rev-parse --short HEAD") || "unknown",
  refresh_count: String(refreshCount),
  objective: args.objective || process.env.CONTEXT_GUIDE_OBJECTIVE || "Define objective",
  scope: args.scope || process.env.CONTEXT_GUIDE_SCOPE || "Define scope boundaries",
  touched_files: toIndentedBlock(touchedFiles, 4),
  architecture_boundaries: toIndentedBlock(
    normalizeList(args.boundaries, ["- list service/module boundaries"]),
    4
  ),
  constraints: toIndentedBlock(normalizeList(args.constraints, ["- list constraints"]), 6),
  non_goals: toIndentedBlock(normalizeList(args.nonGoals, ["- list non-goals"]), 6),
  data_contracts: toIndentedBlock(
    normalizeList(args.contracts, ["- describe interfaces and payload shapes"]),
    4
  ),
  verification_status: toIndentedBlock(
    normalizeList(args.verification, ["- pending verification"]),
    4
  ),
  open_risks: toIndentedBlock(normalizeList(args.risks, ["- no known risks logged"]), 6),
  next_steps: toIndentedBlock(normalizeList(args.nextSteps, ["- no next steps logged"]), 6)
};

const template = fs.readFileSync(templatePath, "utf8");
const output = fillTemplate(template, replacements);

ensureDirectory(path.dirname(outputFile));
fs.writeFileSync(outputFile, output, "utf8");

process.stdout.write(`${outputFile}\n`);
