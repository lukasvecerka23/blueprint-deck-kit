#!/bin/sh
# Blueprint Deck Kit installer: puts the blueprint-deck skill into your coding agents' skills folders.
#
#   curl -fsSL https://blueprint-deck.lukasvecerka.dev/install.sh | sh
#   curl -fsSL https://blueprint-deck.lukasvecerka.dev/install.sh | sh -s -- --agent codex
#   ./install.sh                      (from a clone of the repository: installs that copy)
#
# Options:
#   --agent claude|codex|agents|all   where to install (default: every agent found on this computer)
#   --dir <path>                      install into this skills folder instead
#   --project                         install into the current project (./.claude/skills, ./.codex/skills, ./.agents/skills)
#   --ref <branch or tag>             version to download (default: main)
#   --uninstall                       remove the skill again
#
# It only copies files (about 1 MB): no Node, no Python, nothing else is installed.
set -eu

REPO="lukasvecerka23/blueprint-deck-kit"
NAME="blueprint-deck"
REF="${BLUEPRINT_DECK_REF:-main}"
SITE="${BLUEPRINT_DECK_SITE:-https://blueprint-deck.lukasvecerka.dev}"
AGENT=""
DIR=""
PROJECT=0
UNINSTALL=0

while [ $# -gt 0 ]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --dir) DIR="$2"; shift 2 ;;
    --project) PROJECT=1; shift ;;
    --ref) REF="$2"; shift 2 ;;
    --uninstall) UNINSTALL=1; shift ;;
    -h|--help) sed -n '2,17p' "$0" 2>/dev/null || echo "see https://github.com/$REPO"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

say() { printf '%s\n' "$*"; }
base() { if [ "$PROJECT" = 1 ]; then printf '%s' "$PWD"; else printf '%s' "$HOME"; fi; }

# where to install
TARGETS=""
add() { TARGETS="$TARGETS $1"; }
if [ -n "$DIR" ]; then
  add "$DIR"
else
  B="$(base)"
  case "$AGENT" in
    claude) add "$B/.claude/skills" ;;
    codex) add "$B/.codex/skills" ;;
    agents) add "$B/.agents/skills" ;;
    all) add "$B/.claude/skills"; add "$B/.codex/skills"; add "$B/.agents/skills" ;;
    "")
      { [ -d "$B/.claude" ] || command -v claude >/dev/null 2>&1; } && add "$B/.claude/skills"
      { [ -d "$B/.codex" ] || command -v codex >/dev/null 2>&1; } && add "$B/.codex/skills"
      [ -d "$B/.agents" ] && add "$B/.agents/skills"
      [ -z "$TARGETS" ] && add "$B/.agents/skills"
      ;;
    *) say "unknown agent '$AGENT' (claude, codex, agents or all)" >&2; exit 2 ;;
  esac
fi

if [ "$UNINSTALL" = 1 ]; then
  for t in $TARGETS; do
    if [ -d "$t/$NAME" ]; then rm -rf "${t:?}/$NAME"; say "removed $t/$NAME"; fi
  done
  exit 0
fi

# the skill files: from this clone, or downloaded
HERE="$(cd "$(dirname "$0")" 2>/dev/null && pwd || true)"
TMP=""
cleanup() { if [ -n "$TMP" ]; then rm -rf "$TMP"; fi; }
trap cleanup EXIT
if [ -n "$HERE" ] && [ -f "$HERE/skill/$NAME/SKILL.md" ]; then
  SRC="$HERE/skill/$NAME"
else
  TMP="$(mktemp -d)"
  fetch() { if command -v curl >/dev/null 2>&1; then curl -fsSL "$1" -o "$2"; elif command -v wget >/dev/null 2>&1; then wget -qO "$2" "$1"; else say "needs curl or wget" >&2; exit 1; fi; }
  # the website's copy of the skill first (the latest release); GitHub as the fallback, or for a specific --ref
  if [ "$REF" = "main" ] && fetch "$SITE/blueprint-deck-skill.tar.gz" "$TMP/kit.tgz" 2>/dev/null; then
    say "Downloaded the skill from $SITE"
  else
    say "Downloading $REPO ($REF) from GitHub…"
    fetch "https://codeload.github.com/$REPO/tar.gz/$REF" "$TMP/kit.tgz"
  fi
  tar -xzf "$TMP/kit.tgz" -C "$TMP"
  SRC="$(find "$TMP" -maxdepth 3 -type d -name "$NAME" -exec test -f "{}/SKILL.md" \; -print | head -n 1)"
  [ -n "$SRC" ] && [ -f "$SRC/SKILL.md" ] || { say "download did not contain skill/$NAME" >&2; exit 1; }
fi

NEW="$(cat "$SRC/VERSION" 2>/dev/null || echo "?")"
for t in $TARGETS; do
  OLD="$(cat "$t/$NAME/VERSION" 2>/dev/null || true)"
  mkdir -p "$t"
  rm -rf "${t:?}/$NAME"
  cp -R "$SRC" "$t/$NAME"
  if [ -z "$OLD" ]; then say "installed Blueprint Deck Kit $NEW in $t/$NAME"
  elif [ "$OLD" = "$NEW" ]; then say "Blueprint Deck Kit $NEW is up to date in $t/$NAME (reinstalled)"
  else say "updated Blueprint Deck Kit $OLD -> $NEW in $t/$NAME"; UPDATED=1; fi
done
if [ "${UPDATED:-0}" = 1 ]; then
  say "What's new: $SITE/changelog/"
  say "Existing diagrams keep their engine; to give one the new features, ask your agent to upgrade it."
fi

say ""
say "Done. Start a new agent session in the folder with your docs, then:"
say "  1. Describe your diagram: https://blueprint-deck.lukasvecerka.dev/configurator/"
say "  2. Paste the prompt it gives you (or ask: \"Use the blueprint-deck skill to make a diagram of this repo\")."
say "  In Claude Code you can also type /$NAME."
