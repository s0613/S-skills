# S-skills

Custom Claude Code skills.

## Installation

```bash
git clone https://github.com/s0613/S-skills.git ~/S-skills

# Link each skill into Claude
ln -sf ~/S-skills/docs-organize ~/.claude/skills/docs-organize
```

## Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| docs-organize | `/docs-organize` | Analyzes a project, interviews for context, generates docs/ structure, runs tests, and scores the project 0-100 |
