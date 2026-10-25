#!/bin/sh
# Blueprint Deck Kit installer: puts the blueprint-deck skill into your coding agents' skills folders.
#
#   curl -fsSL https://raw.githubusercontent.com/lukasvecerka23/blueprint-deck-kit/main/install.sh | sh
#   … | sh -s -- --agent codex
#   … | sh -s -- --version 2.1.0      (a specific release; the list: https://github.com/lukasvecerka23/blueprint-deck-kit/releases)
#   (the website's short URL https://blueprint-deck.lukasvecerka.dev/install.sh serves this same script)
#   ./install.sh                      (from a clone of the repository: installs that copy)
#
# Options:
#   --agent claude|codex|gemini|agents|all   where to install (default: the agents found on this computer; with more
#                                     than one it asks which, Enter = all)
#   --dir <path>                      install into this skills folder instead
#   --project                         install into the current project (./.claude/skills, ./.codex/skills, …)
#   --version <x.y.z>                 install that release (default: the latest published release)
#   --ref <branch or tag>             install the skill as it is on a branch or tag (e.g. main: unreleased work)
#   --uninstall                       remove the skill again
#   --yes                             don't ask, install for every agent found
#
# It only copies files (about 1 MB): no Node, no Python, nothing else is installed.
set -eu

REPO="lukasvecerka23/blueprint-deck-kit"
NAME="blueprint-deck"
REF="${BLUEPRINT_DECK_REF:-}"
VERSION=""
GITHUB="https://github.com/$REPO"
AGENT=""
DIR=""
PROJECT=0
UNINSTALL=0
YES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --dir) DIR="$2"; shift 2 ;;
    --project) PROJECT=1; shift ;;
    --ref) REF="$2"; shift 2 ;;
    --version) VERSION="${2#v}"; shift 2 ;;
    --uninstall) UNINSTALL=1; shift ;;
    -y|--yes) YES=1; shift ;;
    -h|--help) sed -n '2,19p' "$0" 2>/dev/null || echo "see https://github.com/$REPO"; exit 0 ;;
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
    gemini) add "$B/.gemini/skills" ;;
    agents) add "$B/.agents/skills" ;;
    all) add "$B/.claude/skills"; add "$B/.codex/skills"; add "$B/.gemini/skills"; add "$B/.agents/skills" ;;
    "")
      # every agent found on this computer
      FOUND=""
      { [ -d "$B/.claude" ] || command -v claude >/dev/null 2>&1; } && FOUND="$FOUND claude"
      { [ -d "$B/.codex" ] || command -v codex >/dev/null 2>&1; } && FOUND="$FOUND codex"
      { [ -d "$B/.gemini" ] || command -v gemini >/dev/null 2>&1; } && FOUND="$FOUND gemini"
      [ -d "$B/.agents" ] && FOUND="$FOUND agents"
      [ -z "$FOUND" ] && FOUND="agents"
      label() { case "$1" in claude) printf 'Claude Code' ;; codex) printf 'Codex' ;; gemini) printf 'Gemini CLI' ;; agents) printf 'other agents (~/.agents)' ;; esac; }
      set -- $FOUND
      # more than one: ask which (Enter = all). Only with a terminal; never in CI, with --yes or when uninstalling.
      # The answer is read from /dev/tty, so this also works with curl … | sh.
      if [ $# -gt 1 ] && [ "$YES" = 0 ] && [ "$UNINSTALL" = 0 ] && [ -z "${CI:-}" ] && { : </dev/tty; } 2>/dev/null; then
        names=""; for a in "$@"; do names="${names:+$names, }$(label "$a")"; done
        {
          say "Found: $names. Install for:"
          say "  [1] all of them (default)"
          i=2; for a in "$@"; do say "  [$i] $(label "$a")"; i=$((i + 1)); done
          printf 'Choice [1]: '
        } >/dev/tty
        read -r CHOICE </dev/tty || CHOICE=""
        case "$CHOICE" in
          ""|1) ;;
          *[!0-9]*) say "unknown choice '$CHOICE'" >&2; exit 2 ;;
          *)
            if [ "$CHOICE" -ge 2 ] && [ "$CHOICE" -le $(($# + 1)) ]; then
              shift $((CHOICE - 2)); set -- "$1"
            else say "unknown choice '$CHOICE'" >&2; exit 2; fi ;;
        esac
      fi
      for a in "$@"; do add "$B/.$a/skills"; done
      ;;
    *) say "unknown agent '$AGENT' (claude, codex, gemini, agents or all)" >&2; exit 2 ;;
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
if [ -n "$HERE" ] && [ -f "$HERE/plugins/$NAME/skills/$NAME/SKILL.md" ]; then
  SRC="$HERE/plugins/$NAME/skills/$NAME"
else
  TMP="$(mktemp -d)"
  fetch() { if command -v curl >/dev/null 2>&1; then curl -fsSL "$1" -o "$2"; elif command -v wget >/dev/null 2>&1; then wget -qO "$2" "$1"; else say "needs curl or wget" >&2; exit 1; fi; }
  # the skill comes from GitHub: the latest published release, a given --version, or a branch/tag with --ref
  if [ -n "$REF" ]; then
    say "Downloading $REPO ($REF)…"
    fetch "https://codeload.github.com/$REPO/tar.gz/$REF" "$TMP/kit.tgz"
  elif [ -n "$VERSION" ]; then
    fetch "$GITHUB/releases/download/v$VERSION/blueprint-deck-skill.tar.gz" "$TMP/kit.tgz" 2>/dev/null \
      || { say "There is no release $VERSION. Versions: $GITHUB/releases" >&2; exit 1; }
  else
    fetch "$GITHUB/releases/latest/download/blueprint-deck-skill.tar.gz" "$TMP/kit.tgz" 2>/dev/null \
      || { say "Could not download the latest release from $GITHUB/releases" >&2; exit 1; }
  fi
  tar -xzf "$TMP/kit.tgz" -C "$TMP"
  SRC="$(find "$TMP" -maxdepth 6 -type d -name "$NAME" -exec test -f "{}/SKILL.md" \; -print | head -n 1)"
  [ -n "$SRC" ] && [ -f "$SRC/SKILL.md" ] || { say "download did not contain the $NAME skill" >&2; exit 1; }
fi

NEW="$(cat "$SRC/VERSION" 2>/dev/null || echo "?")"
for t in $TARGETS; do
  OLD="$(cat "$t/$NAME/VERSION" 2>/dev/null || true)"
  mkdir -p "$t"
  rm -rf "${t:?}/$NAME"
  cp -R "$SRC" "$t/$NAME"
  rm -rf "${t:?}/$NAME/.claude-plugin"   # the Claude Code plugin manifest only matters for the marketplace
  if [ -z "$OLD" ]; then say "installed Blueprint Deck Kit $NEW in $t/$NAME"
  elif [ "$OLD" = "$NEW" ]; then say "Blueprint Deck Kit $NEW is up to date in $t/$NAME (reinstalled)"
  else say "updated Blueprint Deck Kit $OLD -> $NEW in $t/$NAME"; UPDATED=1; fi
done
if [ "${UPDATED:-0}" = 1 ]; then
  say "What's new: $GITHUB/releases"
  say "Existing diagrams keep their engine; to give one the new features, ask your agent to upgrade it."
fi

say ""
say "Done. Start a new agent session in your project folder (code or docs), then:"
say "  1. Describe your diagram: https://blueprint-deck.lukasvecerka.dev/configurator/"
say "  2. Paste the prompt it gives you (or ask: \"Use the blueprint-deck skill to make a diagram of this repo\")."
say "  In Claude Code you can also type /$NAME."
