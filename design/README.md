# Palettes

The kit uses the **classic** palette (navy with blue and violet). The **Blueprint** palette (navy, blueprint blue `#1f6feb`,
cyan `#22b8e6`, a little amber) was tried and is kept here to switch to later.

| Where | Classic (in use) | Blueprint (saved) |
|---|---|---|
| Diagrams | theme preset `midnight` (the default) | theme preset `blueprint` (pick it in the configurator or the editor, or `"theme": { "preset": "blueprint" }`) |
| Website colours | `site/src/styles/palette-classic.css` (imported in `global.css`) | `site/src/styles/palette-blueprint.css` |
| Logo, favicon, social image | `design/classic/` (= what is in `site/`) | `design/blueprint/` |

To switch the website to Blueprint: import `palette-blueprint.css` in `site/src/styles/global.css`, copy
`design/blueprint/Logo.astro` to `site/src/components/` and the other three files to `site/public/`. To make it the
default for diagrams too, change the default preset in `engine/src/core.js` (`resolveTheme`), the configurator's
default theme, and the template config, then rebuild (`node dev/assemble.mjs`).
