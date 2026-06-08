#!/usr/bin/env bash
# claude-usage skill installer for Claude Code
set -euo pipefail

SKILL_NAME="claude-usage"
DEFAULT_REPO="https://github.com/AgoniZc/claude-usage.git"
BRANCH="${CLAUDE_USAGE_BRANCH:-main}"
INSTALL_DIR="${CLAUDE_USAGE_DIR:-$HOME/.claude/skills}"
USE_LOCAL=false

usage() {
  cat <<EOF
Usage: install.sh [OPTIONS]

Install claude-usage Skill to Claude Code (~/.claude/skills/$SKILL_NAME).

Options:
  --local     Copy from this script's directory instead of cloning from GitHub
  --repo URL  Git repo URL (default: $DEFAULT_REPO)
  -h, --help  Show this help

Examples:
  curl -fsSL https://raw.githubusercontent.com/AgoniZc/claude-usage/main/install.sh | bash
  ./install.sh --local
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --local) USE_LOCAL=true; shift ;;
    --repo) DEFAULT_REPO="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js not found. Please install Node.js >= 18." >&2
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.version.match(/^v(\d+)/)[1])")
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "Error: Node.js >= 18 required (found $(node --version))." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR=""

cleanup() {
  if [[ -n "$WORK_DIR" && "$WORK_DIR" != "$SCRIPT_DIR" && -d "$WORK_DIR" ]]; then
    rm -rf "$WORK_DIR"
  fi
}
trap cleanup EXIT

if ($USE_LOCAL || [[ -f "$SCRIPT_DIR/bin/cli.js" && -f "$SCRIPT_DIR/SKILL.md" ]]) && [[ -f "$SCRIPT_DIR/bin/cli.js" ]]; then
  SRC_DIR="$SCRIPT_DIR"
else
  WORK_DIR=$(mktemp -d)
  echo "Cloning $DEFAULT_REPO ..."
  git clone --depth 1 --branch "$BRANCH" "$DEFAULT_REPO" "$WORK_DIR/$SKILL_NAME" 2>/dev/null || {
    git clone --depth 1 "$DEFAULT_REPO" "$WORK_DIR/$SKILL_NAME"
  }
  SRC_DIR="$WORK_DIR/$SKILL_NAME"
fi

DEST="$INSTALL_DIR/$SKILL_NAME"
mkdir -p "$INSTALL_DIR"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC_DIR"/. "$DEST/"
rm -rf "$DEST/.git" 2>/dev/null || true
rm -f "$DEST/install.sh" "$DEST/install.ps1" 2>/dev/null || true

echo "✓ Installed to $DEST"
echo ""
echo "Done. Restart Claude Code (or start a new session) to load the skill."
echo "Test: cd $DEST && node bin/cli.js --today"
