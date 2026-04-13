# Per-Build Context Guide Workflow

This workflow generates a compact, standardized context guide artifact per build/feature/task.

## Inputs

Required for meaningful output:
- feature identifier (`--feature`)
- objective (`--objective`)
- scope (`--scope`)

Optional:
- task id (`--task`)
- branch (`--branch`, defaults to current git branch)
- base ref for touched file detection (`--base`, defaults to `main`)
- explicit touched files (`--files`, `|`-delimited)
- boundaries (`--boundaries`, `|`-delimited)
- constraints (`--constraints`, `|`-delimited)
- non-goals (`--nonGoals`, `|`-delimited)
- data contracts (`--contracts`, `|`-delimited)
- verification status (`--verification`, `|`-delimited)
- risks (`--risks`, `|`-delimited)
- next steps (`--nextSteps`, `|`-delimited)
- template path (`--template`, default `docs/context-guide.template.md`)
- output directory (`--outputDir`, default `docs/context-guides`)
- output file (`--output`, for refresh/update in place)

## Command

```bash
node scripts/generate-context-guide.mjs \
  --feature context-guide-system \
  --task 5e801b82 \
  --objective "Auto-generate compact context artifacts per build" \
  --scope "Scripts/templates/workflow/docs for context guide generation" \
  --boundaries "CLI script only|No runtime app behavior changes" \
  --constraints "Compact format|Machine-readable sections|Low manual overhead" \
  --nonGoals "No external storage system|No CI enforcement yet" \
  --contracts "CLI args contract|Markdown template placeholders" \
  --verification "Script execution succeeds|Output artifact renders" \
  --risks "Manual inputs can drift without process discipline" \
  --nextSteps "Integrate command in default build/checklist" \
  --base main
```

## Outputs

- Writes one context guide artifact to `docs/context-guides/<feature>__<timestamp>.context.md`.
- Artifact metadata includes:
  - feature/task identity
  - branch
  - generation timestamp
  - source git revision
  - `refresh_count`

## Refresh / Update Mechanism

Use `--output <existing-file>` to refresh a guide in place as work evolves:

```bash
node scripts/generate-context-guide.mjs \
  --feature context-guide-system \
  --output docs/context-guides/context-guide-system__sample.context.md \
  --objective "Updated objective" \
  --scope "Updated scope"
```

When refreshing in place, `refresh_count` is incremented automatically.

## Default Workflow Integration

To make this default in a build workflow, add a wrapper command in your task runner (npm/bun/make/CI) that:
1. Runs this script at build start.
2. Re-runs with `--output` at key milestones (post-implementation, post-test).
3. Stores the generated guide as a build artifact.
