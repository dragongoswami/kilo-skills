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
  const diff = baseRef
    ? run(`git diff --name-only ${baseRef}...HEAD`)
    : run("git diff --name-only HEAD");

  if (!diff) {
    return ["- none"];}

  return diff
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `- ${line}`);
}

function fillTemplate(template, replacements) {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.replaceAll(`{${key}}`, value);
  }
  return output;
}

function toBlock(lines) {
  return lines.join("\n");
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
  args.template || "docs/context-guide.template.md"
);

const outputDir = path.resolve(
  cwd,
  args.outputDir || "docs/context-guides"
);

const timestamp = new Date().toISOString().replace(/[:]/g, "-");
const featureId = args.feature || "unscoped";
const taskId = args.task || "n/a";
const branch = args.branch || run("git rev-parse --abbrev-ref HEAD") || "unknown";
const outputFile =
  args.output || path.join(outputDir, `${featureId}__${timestamp}.context.md`);

const refreshCount = readRefreshCount(outputFile) + 1;
const touchedFiles = args.files
  ? normalizeList(args.files)
  : deriveTouchedFiles(args.base || "main");

const replacements = {
  feature_id: featureId,
  task_id: taskId,
  branch,
  generated_at_utc: new Date().toISOString(),
  source_revision: run("git rev-parse --short HEAD") || "unknown",
  refresh_count: String(refreshCount),
  objective: args.objective || "Define objective",
  scope: args.scope || "Define scope boundaries",
  touched_files: toBlock(touchedFiles),
  architecture_boundaries: toBlock(
    normalizeList(args.boundaries, ["- list service/module boundaries"]) 
  ),
  constraints: toBlock(normalizeList(args.constraints, ["- list constraints"])) ,
  non_goals: toBlock(normalizeList(args.nonGoals, ["- list non-goals"])) ,
  data_contracts: toBlock(
    normalizeList(args.contracts, ["- describe interfaces and payload shapes"]) 
  ),
  verification_status: toBlock(
    normalizeList(args.verification, ["- pending verification"]) 
  ),
  open_risks: toBlock(normalizeList(args.risks, ["- no known risks logged"])) ,
  next_steps: toBlock(normalizeList(args.nextSteps, ["- no next steps logged"])) 
};

const template = fs.readFileSync(templatePath, "utf8");
const output = fillTemplate(template, replacements);

ensureDirectory(path.dirname(outputFile));
fs.writeFileSync(outputFile, output, "utf8");

process.stdout.write(`${outputFile}\n`);
