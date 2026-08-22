---
name: activekit-design
description: Use this skill to generate well-branded interfaces and assets for ActiveKit, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- `readme.md` is the design guide: sources, fonts, components, content fundamentals, visual foundations, iconography, and the list of decisions made where the spec was silent.
- `uploads/DESIGN.md` is the source of truth for every value. If this skill and DESIGN.md disagree, DESIGN.md wins.
- `guidelines/voice.md` carries the copy rules. No em dashes, no hype words, numbers written precisely.
- `styles.css` is the only stylesheet to link. It imports the fonts and every token file, so never link the individual `tokens/*.css` files alongside it.
- `templates/<slug>/` holds twelve full page templates, six marketing and six product. Start from one rather than from a blank page.
- `components/` holds eighteen components. Reference them through the compiled bundle, never by importing the `.jsx` directly into an inline script.

## Reusing this system in another project

Do not rebuild anything here. Copy and point at it.

1. **Start from a template, not a blank file.** Copy the whole `templates/<slug>/` folder. Its `ds-base.js` is the only file to edit: change the single `base` line to the bound design-system folder relative to that page (`_ds/<folder>` at the project root, `../_ds/<folder>` one level down). It loads `styles.css` and the compiled bundle, nothing else.
2. **Copy `templates/` whole if you want the click-through.** The six product screens link to each other with relative sibling paths. Copy one folder and you get a working screen with dead nav, which is the intended failure mode.
3. **Mount components off the global namespace, never off the `.jsx`.** In a Design Component: `<x-import component-from-global-scope="<Namespace>.Button" hint-size="140px,40px">Start free</x-import>`. In a plain HTML card: `const { Button } = window.<Namespace>` after loading `_ds_bundle.js`. Ask the compiler for the current `<Namespace>` rather than typing it from memory.
4. **Style with tokens only.** Every colour, size, radius, shadow, and duration is a custom property in `tokens/`. If a value is not a `var(--token)`, it is a bug, with one allowed exception: white-alpha overlays (`rgba(255,255,255,…)`) on slate surfaces, which the token set does not express.
5. **Do not fork a component to change one thing.** Each has props for its documented variants; `.d.ts` is the contract and every component spreads `...rest` onto its root, so `className`, `style`, `id`, and event handlers pass through.
6. **`assets/logo.svg` is the only standalone asset.** Copy it for favicons; everywhere else render the `Logo` component so the lockup has one definition.

## Three rules that are easy to get wrong

1. **Space Grotesk 700 is for the four display tiers only** (56 / 48 / 32 / 26px). Everything at 22px and below is Inter, 600 for headings and 400 for the rest.
2. **The hero gradient is a subtle wash of large blurred orbs,** not a saturated mesh. Low opacity, wide blur, upper third of the page only.
3. **One filled teal pill per section.** It is the only filled button on marketing surfaces; everything else is the outline `secondary`.

Plus one detail that gives the brand away when it is missing: every credit, count, rate, and currency figure uses `font-feature-settings: "tnum","zero"`.
