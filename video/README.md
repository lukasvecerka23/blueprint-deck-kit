# Promo video

The Blueprint Deck Kit promo, made with [Remotion](https://www.remotion.dev) (React). Not part of the skill or the
website build.

`assets/` holds the published renders: `promo.mp4` (16:9, ~60 s), `promo-square.mp4` (1:1), `promo-short.mp4` and
`promo-short-wide.mp4` (~26 s, for social feeds), `readme.gif` (the README's GIF, also in `docs/images/demo.gif`) and
`poster.jpg`. The landing page uses a lighter render, `site/public/video/blueprint-deck.mp4`.

```sh
cd video
npm install
npx remotion studio          # preview and edit in the browser
npm run render:all           # everything into out/ (then copy what you publish into assets/)
npm run render:web           # the lighter landing-page version (CRF 30) -> site/public/video/blueprint-deck.mp4
npm run record               # re-record the real clip (public/real/acme-clip.mp4); serve the repo first:
                             #   python3 -m http.server 8765 --directory ..
```

- Texts, subtitles and timings: `src/content.ts`
- The map shown in the video: `src/map/data.ts`; its themes: `src/map/theme.tsx`
- Scenes: `src/scenes/`; the README GIF: `src/ReadmeGif.tsx`
- Optional music: put a track at `public/music.mp3` (it fades in and out); check its licence first.

Rendering fetches the Inter font, so it needs a network connection.
