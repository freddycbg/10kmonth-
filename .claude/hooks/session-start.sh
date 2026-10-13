#!/bin/bash
set -euo pipefail

# Solo en sesiones remotas de Claude Code
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# graphify: grafo de conocimiento del código (skill /graphify)
if ! command -v graphify >/dev/null 2>&1; then
  pip install --quiet --root-user-action=ignore graphifyy
fi

if [ ! -f "$HOME/.claude/skills/graphify/SKILL.md" ]; then
  graphify install --platform claude >/dev/null
fi
