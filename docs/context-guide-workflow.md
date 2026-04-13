# Per-Build Context Guide Workflow

This system auto-generates a compact, standardized context guide artifact for each build/feature/task.

## Execution Path

- Template: `docs/context-guide.template.md`
- Generator: `scripts/generate-context-guide.mjs`
- Artifact directory: `docs/context-guides/`
- Sample artifact: `docs/context-guides/context-guide-system__sample.context.md`

## Inputs

Primary CLI flags:
- `--feature` feature identifier (used in filename + metadata)
- `--task` task/bead/change identifier
- `--objective` build objective
- `--scope` scope boundary for this build
- `--base` git ref for touched-file diff (`main` default)
- `--output` explicit artifact path for refresh-in-place

Structured list flags (`|` delimited):
- `--files`, `--boundaries`, `--constraints`, `--nonGoals`
- `--contracts`, `--verification`, `--risks`, `--nextSteps`

Environment variable equivalents (for default workflow wiring):
- `CONTEXT_GUIDE_TEMPLATE`, `CONTEXT_GUIDE_OUTPUT_DIR`, `CONTEXT_GUIDE_OUTPUT`
- `CONTEXT_GUIDE_FEATURE`, `CONTEXT_GUIDE_TASK`, `CONTEXT_GUIDE_BRANCH`
- `CONTEXT_GUIDE_OBJECTIVE`, `CONTEXT_GUIDE_SCOPE`, `CONTEXT_GUIDE_BASE`

## Outputs

Generated artifact format is compact YAML-like markdown with fixed sections:
- objective and scope
- touched modules/files
- architecture boundaries
- constraints and non-goals
- data contracts/interfaces
- test/verification status
- open risks and next steps

Metadata includes:
- `schema_version`
- feature/task identity
- branch
- generation timestamp
- source git revision
- `refresh_count`

## One-Pass Generation

```bash
node scripts/generate-context-guide.mjs \
  --feature context-guide-system \
  --task 5e801b82 \
  --objective "Auto-generate compact context artifacts per build" \
  --scope "Scripts/templates/workflow/docs for context guide generation" \
  --boundaries "CLI script boundary|No runtime app behavior changes" \
  --constraints "Compact format|Machine-readable sections|Low manual overhead" \
  --nonGoals "No external persistence|No CI hard fail on missing guide" \
  --contracts "CLI flags contract|Template placeholder contract" \
  --verification "Script execution succeeds|Artifact refresh succeeds" \
  --risks "Guide quality depends on disciplined input updates" \
  --nextSteps "Run refresh after major milestones|Publish artifact in CI" \
  --base main
```

## Refresh Mechanism

Refresh in place to keep the same artifact current as implementation evolves:

```bash
node scripts/generate-context-guide.mjs \
  --feature context-guide-system \
  --output docs/context-guides/context-guide-system__sample.context.md \
  --objective "Updated objective" \
  --scope "Updated scope"
```

`refresh_count` increments automatically when reusing the same `--output` file.

## Default Build Workflow Integration

Use task-runner scripts so context capture is easy and repeatable:
1. Run `context:guide:new` at build/change start.
2. Run `context:guide:refresh` after implementation and after verification.
3. Store the produced `docs/context-guides/*.context.md` artifact with build outputs.
