# Promo video

The Blueprint Deck Kit promo, made with [Remotion](https://www.remotion.dev) (React). Not part of the skill or the
website build.

The rendered videos aren't kept in git (they're large and can be made again). What the project publishes lives
elsewhere: the landing page's video is `site/public/video/blueprint-deck.mp4` (with `poster.jpg`), the README's GIF is
`docs/images/demo.gif`.

```sh
cd video
npm install
# 1. record the real clip the video ends with (public/real/acme-clip.mp4); serve the repository first:
python3 -m http.server 8765 --directory ..      # in another terminal
npm run record
# 2. preview, then render
npx remotion studio          # preview and edit in the browser
npm run render:all           # promo (16:9, 1:1), the short cuts, the GIF, the poster and stills into out/
npm run render:web           # the lighter landing-page version (CRF 30); copy it to site/public/video/blueprint-deck.mp4
                             # (and out/poster.jpg to site/public/video/poster.jpg, out/readme.gif to docs/images/demo.gif)
```

- Texts, subtitles and timings: `src/content.ts`
- The map shown in the video: `src/map/data.ts`; its themes: `src/map/theme.tsx`
- Scenes: `src/scenes/`; the README GIF: `src/ReadmeGif.tsx`
- Optional music: put a track at `public/music.mp3` (it fades in and out); check its licence first.

Rendering fetches the Inter font, so it needs a network connection.
