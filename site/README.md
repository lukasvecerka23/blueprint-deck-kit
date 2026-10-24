# blueprint-deck.lukasvecerka.dev

The landing page and docs of Blueprint Deck Kit. Astro (static output), Tailwind CSS v4 and Basecoat UI; no client
framework. Production: https://blueprint-deck.lukasvecerka.dev (Cloudflare Pages).

## Run it

Needs Node 20.3+ (22 recommended).

```sh
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in site/dist/
npm run preview  # serve dist/ locally
```

## How it is put together

```
site/
  scripts/sync.mjs        prebuild: copies the kit's files into public/ (runs before dev and build)
  src/pages/              index (landing), gallery (/gallery/), docs/*, 404
  src/layouts/            Base (head, SEO, header, footer, theme), Docs (sidebar, on-this-page, prev/next)
  src/components/         Icon (Lucide, read from the skill), Logo, Command (copy button), InstallTabs, FaqList, ExamplePreview
  src/data/               site constants and docs nav, the example list, the FAQ
  src/content.config.ts   a content collection that loads ../skill/blueprint-deck/reference/{spec,style-guide}.md
  public/                 favicon.svg, og.png (+ og.svg, its source), robots.txt; the rest is generated
```

**Docs stay in sync with the skill.** *Diagram format* and *Style guide* render `skill/blueprint-deck/reference/spec.md`
and `style-guide.md` at build time (content collection with a `glob` loader pointing outside `src/`), and
*Configuring* renders `skill/blueprint-deck/templates/diagram.config.yaml` section by section with Shiki. Edit those
files, rebuild, done.

**The sync step** (`npm run sync`, also run automatically by `npm run dev` and `npm run build`) copies:

| from (repository) | to (site) |
|---|---|
| `configurator/` | `/configurator/` |
| `examples/` | `/examples/` (each deck at `/examples/<name>/index.html`) |
| `skill/blueprint-deck/blueprint-deck.html` | `/engine/blueprint-deck.html` |
| `install.sh`, `install.ps1` | `/install.sh`, `/install.ps1` |
| `skill/blueprint-deck/` | `/blueprint-deck-skill.zip` (one folder, `blueprint-deck/`, inside) |

Missing sources are skipped with a warning. The zip is written by a small built-in zip writer (no `zip` CLI needed).
These copies are build artifacts and are git-ignored (`site/.gitignore`); `favicon.svg`, `og.png`, `og.svg` and
`robots.txt` are hand-made and committed.

The gallery list lives in `src/data/examples.ts`. A card whose `public/examples/<slug>/index.html` doesn't exist at
build time shows as "Coming soon" instead of a dead link.

## Deploy to Cloudflare Pages

The site is static, so Pages serves `dist/` directly; the build needs the whole repository (it reads `../skill`,
`../examples`, `../configurator`), which Pages' Git integration provides.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, pick
   `lukasvecerka23/blueprint-deck-kit`.
2. Build settings:
   - Framework preset: **Astro** (or None)
   - **Root directory:** `site`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Environment variable: **`NODE_VERSION` = `22`**
3. **Save and Deploy.** Every push to `main` deploys production; other branches and pull requests get preview URLs.
4. **Custom domain:** in the Pages project → **Custom domains** → **Set up a custom domain** →
   `blueprint-deck.lukasvecerka.dev`. If `lukasvecerka.dev` is on Cloudflare DNS, the CNAME is created for you;
   otherwise add a `CNAME blueprint-deck → <project>.pages.dev` at your DNS provider and wait for verification.
   The `.dev` TLD is on the HSTS preload list, so browsers only connect over HTTPS; Pages issues and renews the
   certificate automatically, so nothing else is needed (the domain will not load until the certificate is active,
   usually a few minutes).

The install one-liners (`/install.sh`, `/install.ps1`) and the skill zip are served from the same deployment, so they
always match the commit that was deployed.

Optional: Pages serves `404.html` for unknown paths automatically. `/configurator/` and `/examples/<name>/` resolve to
their `index.html`.

### Alternative: GitHub Pages

Add `.github/workflows/pages.yml` in the repository:

```yaml
name: Deploy site
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: site/package-lock.json }
      - run: npm ci && npm run build
        working-directory: site
      - uses: actions/upload-pages-artifact@v3
        with: { path: site/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```

Then Settings → Pages → Source: **GitHub Actions**, and set the custom domain there (CNAME
`blueprint-deck → lukasvecerka23.github.io`, tick *Enforce HTTPS*). Without a custom domain the site lives under
`/<repo>/`; set `base: "/blueprint-deck-kit"` in `astro.config.mjs` in that case (the site uses root-relative links,
so a custom domain is the simpler route).
