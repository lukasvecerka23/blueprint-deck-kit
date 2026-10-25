#!/usr/bin/env bash
# Renders the ReadmeGif composition as lossless PNG frames (every 2nd frame = 15 fps)
# and encodes out/readme.gif with a tuned palette (keeps it small and clean).
# Usage: scripts/make-gif.sh [width=960] [colours=96] [dither=none] [output=out/readme.gif]
# dither can be: none | bayer:bayer_scale=4 | sierra2_4a
set -euo pipefail
WIDTH=${1:-960}; COLORS=${2:-96}; DITHER=${3:-none}; OUT=${4:-out/readme.gif}
FRAMES=$(mktemp -d "${TMPDIR:-/tmp}/gifframes-XXXXXX")
if [ "${SKIP_RENDER:-}" != "1" ]; then
  trap 'rm -rf "$FRAMES"' EXIT
  npx remotion render ReadmeGif "$FRAMES" --sequence --image-format=png --every-nth-frame=2 >/dev/null
else
  FRAMES=${FRAMES_DIR:?set FRAMES_DIR when SKIP_RENDER=1}
fi
npx remotion ffmpeg -y -loglevel error -framerate 15 -i "$FRAMES/element-%03d.png" \
  -vf "scale=${WIDTH}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${COLORS}:stats_mode=diff[p];[b][p]paletteuse=dither=${DITHER}:diff_mode=rectangle" \
  -loop 0 "$OUT"
ls -la "$OUT"
