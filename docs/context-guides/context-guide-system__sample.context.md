# Context Guide

meta:
  feature_id: "context-guide-system"
  task_id: "5e801b82"
  branch: "convoy/ai-native-kilo-skills-context-guide-syst/12c2c01b/gt/maple/5e801b82"
  generated_at_utc: "2026-04-13T07:44:52.267Z"
  source_revision: "2ec2869"
  refresh_count: 1

## Objective And Scope
objective: Auto-generate compact context artifacts per build
scope: Scripts/templates/workflow/docs for context guide generation

## Touched Modules Files
- none

## Architecture Boundaries
- CLI script boundary
- No runtime app behavior changes

## Constraints And Non Goals
constraints:
- Compact sections
- Machine-scannable headings
- Low manual overhead
non_goals:
- No external persistence
- No CI hard fail on missing guide

## Data Contracts Interfaces
- CLI flags contract
- Markdown placeholders

## Test Verification Status
- Script execution passes
- Sample artifact generated

## Open Risks Next Steps
risks:
- Guide quality depends on input discipline
next_steps:
- Add npm script wrapper
- Integrate into CI
