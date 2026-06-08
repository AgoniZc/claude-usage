#!/usr/bin/env bash
# claude-usage skill installer — Claude Code / Codex / Cursor / generic agents
set -euo pipefail

SKILL_NAME="claude-usage"
DEFAULT_REPO="https://github.com/AgoniZc/claude-usage.git"
BRANCH="${CLAUDE_USAGE_BRANCH:-main}"
INSTALL_CLAUDE=false
INSTALL_CODEX=false
INSTALL_CURSOR=false
INSTALL_ALL=false
CUSTOM_DIR=""
USE_LOCAL=false

usage() {
  cat <<EOF
Usage: install.sh [OPTIONS]

Install claude-usage Agent Skill to your local skills directories.

Options:
  --all       Install to Claude Code, Codex, and Cursor (default if none specified)
  --claude    Install to ~/.claude/skills/$SKILL_NAME
  --codex     Install to ~/.codex/skills/$SKILL_NAME
  --cursor    Install to ~/.cursor/skills/$SKILL_NAME
  --dir PATH  Install to a custom skills subdirectory (e.g. Hermes: ~/.hermes/skills)
  --local     Copy from this script's directory instead of cloning from GitHub
  --repo URL  Git repo URL (default: $DEFAULT_REPO)
  -h, --help  Show this help

Examples:
  curl -fsSL https://raw.githubusercontent.com/AgoniZc/claude-usage/main/install.sh | bash
  ./install.sh --all --local
  ./install.sh --dir ~/.hermes/skills
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all) INSTALL_ALL=true; shift ;;
    --claude) INSTALL_CLAUDE=true; shift ;;
    --codex) INSTALL_CODEX=true; shift ;;
    --cursor) INSTALL_CURSOR=true; shift ;;
    --dir) CUSTOM_DIR="$2"; shift 2 ;;
    --local) USE_LOCAL=true; shift ;;
    --repo) DEFAULT_REPO="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if ! $INSTALL_CLAUDE && ! $INSTALL_CODEX && ! $INSTALL_CURSOR && [[ -z "$CUSTOM_DIR" ]]; then
  INSTALL_ALL=true
fi

if $INSTALL_ALL; then
  INSTALL_CLAUDE=true
  INSTALL_CODEX=true
  INSTALL_CURSOR=true
fi

# Node.js check
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

install_one() {
  local parent="$1"
  local dest="$parent/$SKILL_NAME"
  mkdir -p "$parent"
  rm -rf "$dest"
  mkdir -p "$dest"
  cp -R "$SRC_DIR"/. "$dest/"
  # Remove installer artifacts not needed in skill dir
  rm -f "$dest/install.sh" "$dest/install.ps1" "$dest/.git" 2>/dev/null || true
  echo "✓ Installed to $dest"
}

if $INSTALL_CLAUDE; then
  install_one "$HOME/.claude/skills"
fi
if $INSTALL_CODEX; then
  install_one "$HOME/.codex/skills"
fi
if $INSTALL_CURSOR; then
  install_one "$HOME/.cursor/skills"
fi
if [[ -n "$CUSTOM_DIR" ]]; then
  install_one "$CUSTOM_DIR"
fi

echo ""
echo "Done. Restart your agent (or start a new session) to load the skill."
echo "Test: cd ~/.claude/skills/$SKILL_NAME && node bin/cli.js --today"
