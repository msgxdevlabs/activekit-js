---
version: alpha
name: ActiveKit-Subtle-Gradient-Design-System
description: The ActiveKit design language — a growth-campaign platform for AI apps built on a deep slate ink, a teal primary, and a recurring subtle gradient wash that occupies the upper third of nearly every marketing page. The system pairs Space Grotesk at bold (700) weights with tight negative letter-spacing for dense, high-impact display headlines, carries heading, UI, and body roles in Inter, and uses tabular-figure body type where credits and campaign metrics matter. Buttons are tight-radius pills, cards live on near-white surfaces, and the dashboard track flips polarity to a familiar dark-app shell.

colors:
  primary: "#00a7a0"
  primary-deep: "#087f7a"
  primary-press: "#087a76"
  primary-soft: "#15c6bc"
  primary-deeper: "#04605c"
  primary-deepest: "#024744"
  primary-bg-subdued-hover: "#e4f8f6"
  brand-dark-900: "#0b1220"
  ink: "#102033"
  ink-secondary: "#294056"
  ink-mute: "#607087"
  ink-mute-2: "#687484"
  on-primary: "#ffffff"
  canvas: "#ffffff"
  canvas-soft: "#f7fbff"
  canvas-violet: "#f2efff"
  hairline: "#dbe6ef"
  hairline-input: "#d1dee9"
  ruby: "#ef4da8"
  purple: "#6b4cf6"
  amber: "#f59e0b"
  shadow-blue: "#1f3f5e"

typography:
  display-xxl:
    fontFamily: "'Space Grotesk', Inter, system-ui, -apple-system, sans-serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: -3.08px
  display-xl:
    fontFamily: "'Space Grotesk', Inter, system-ui, -apple-system, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -2.16px
  display-lg:
    fontFamily: "'Space Grotesk', Inter, system-ui, -apple-system, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.8px
  display-md:
    fontFamily: "'Space Grotesk', Inter, system-ui, -apple-system, sans-serif"
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: -0.52px
  heading-lg:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.22px
  heading-md:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
  heading-sm:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-lg:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-tabular:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: -0.42px
    fontFeature: "tnum, zero"
  button-md:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: 0
  button-sm:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: 0
  caption:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: -0.39px
    fontFeature: "tnum, zero"
  micro:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  micro-cap:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: 10px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: 0.1px

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  huge: 64px

components:
  button-primary-pill:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 8px 16px
  button-primary-pill-pressed:
    backgroundColor: "{colors.primary-deepest}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 8px 16px
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary-deeper}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 8px 16px
  button-on-dark:
    backgroundColor: "{colors.brand-dark-900}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 8px 16px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
  card-feature-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-pricing:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-pricing-featured:
    backgroundColor: "{colors.brand-dark-900}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-cream-band:
    backgroundColor: "{colors.canvas-violet}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-dashboard-mockup:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-tabular}"
    rounded: "{rounded.lg}"
    padding: 24px
  pill-tag-soft:
    backgroundColor: "{colors.primary-bg-subdued-hover}"
    textColor: "{colors.primary-deeper}"
    typography: "{typography.micro-cap}"
    rounded: "{rounded.pill}"
    padding: 4px 8px
  nav-bar-on-mesh:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    padding: 16px 24px
  link-on-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary-deep}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    padding: 0px
  footer-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-mute}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 64px 24px
---

## Overview

ActiveKit's design language opens with the subtle gradient wash. A wide horizontal band of blurred aqua, cyan, blue, purple, and lavender orbs occupies the upper third of nearly every marketing page — the brand's instantly-recognizable atmospheric backdrop. Type and product UI mockups float above it on `{colors.canvas}` (white), with the gradient acting as both decoration and visual anchor. The lower portion of the page returns to white, with feature explanations on `{colors.canvas-soft}` (a barely-tinted cool off-white) and dashboard product mockups composited as faux IDE/console panels in deep slate.

The color system has two primary roles. **Teal** (`{colors.primary}` — `#00a7a0`) is the brand's signature CTA color, used sparingly: one filled pill per band, filled from the teal rungs at and below `{colors.primary-deep}` where its white label can be read. **Deep slate** (`{colors.ink}` — `#102033`) is the universal body text color and the fill of dashboard mockups, the featured pricing tier, and the dark-app surfaces on the dashboard track. Pink (`{colors.ruby}`) and purple (`{colors.purple}`) appear inside the gradient wash and as accent dots in product UI mockups; they are not used as flat button fills.

Typography is built around **Space Grotesk** at weight 700 with tight negative letter-spacing — the brand's display signature — with **Inter** carrying every heading, UI, and body role. Display sizes (32–56px) use -3.08px to -0.8px tracking; body sizes use 0; tabular caption sizes (where credits and campaign metrics matter) use the OpenType `tnum` feature plus a tightening -0.36 to -0.42px tracking. Numeric roles pair `tnum` with `zero`, so a slashed zero keeps `0` distinct from `O` at table sizes.

**Key Characteristics:**
- Subtle-gradient backdrop on every marketing hero — aqua/cyan/blue/purple/lavender horizontally washed across the upper third of the page.
- Single-teal CTA hierarchy: filled `{colors.primary}` pill is the only filled button on marketing surfaces.
- Space Grotesk bold (weight 700) on the four display tiers only, with tight negative tracking from -3.08px to -0.52px; Inter carries headings at 600 and everything below at 400.
- Tabular-figure body type (`tnum`) for any cell containing credits, counts, or campaign metrics — the brand's quiet product-data signal.
- Dark-app dashboard track: deep slate product UI mockups sit composited above the white canvas, frequently with rendered code or dashboard tables inside.
- Pill-shaped buttons (`{rounded.pill}` 9999px) with tight `8px 16px` padding — short, decisive, transactional.
- Violet-band feature cards (`{colors.canvas-violet}`) introduce a cool interlude between teal/white sections without breaking the brand's chromatic logic.

## Colors

> **Source:** `activekit-light.html` — hero (`#top`), `#outcomes`, `#campaigns`, `#developers`, `#pricing`.

### Brand & Accent
- **Teal** (`{colors.primary}` — `#00a7a0`): The brand's signature CTA color. Filled-pill button, link emphasis, gradient anchor. White on it is 2.99:1, so it is the color a CTA is recognized by rather than the color a CTA is filled with: focus rings, wash orbs, the lockup ramp and the brand's own uses keep it, and `{colors.primary-deep}` and the two rungs below carry the fills and the labels.
- **Teal Deep** (`{colors.primary-deep}` — `#087f7a`): A deeper teal used on soft-tag labels and as the press-state warmer alternative. It is the first rung white can be read on, 4.85:1, so it is also the rest fill of a primary button and the color of a link.
- **Teal Deeper** (`#04605c`) and **Teal Deepest** (`#024744`): teal-deep scaled in linear light to 55% and 30%, so chromaticity is invariant and only luminance moves, hue holding at 177.4 degrees. HSL saturation is not that invariant and rises 88.1 to 92.0 to 94.5 percent down the rungs, because HSL reads the gamma-encoded value rather than the light. They are the applied CTA ramp's lower rungs, at 7.41:1 and 10.57:1 under white, and they exist because white clears 4.5:1 only from teal-deep down and teal-deep to teal-press is 1.8 L\*, which is not a gradient.
- **Teal Press** (`{colors.primary-press}` — `#087a76`): Pressed-state lift of the primary.
- **Teal Soft** (`{colors.primary-soft}` — `#15c6bc`): A lighter teal used in product-UI accents and chart highlights.
- **Teal Subdued** (`{colors.primary-bg-subdued-hover}` — `#e4f8f6`): Pale teal fill used as soft tag background. Teal text on it reads from **Teal Deeper** (6.73:1), not from Teal Deep (4.40:1). The fill keeps this value rather than lightening toward white, and what rules the lightening out is a floor on lightness rather than any one tint: everything that carries Teal Deep at 4.5:1 sits at L\* 96.97 or lighter, white among them at 4.85:1, so the least the fill can move is onto that floor. `#ecf9f8` is on it, at 4.5001:1, and from there the chip's separation falls from 3.89 L\* to 3.03 off a white card and from 2.31 to 1.46 off canvas-soft, which is under the point at which two adjacent fields read as different colors at all.
- **Brand Dark 900** (`{colors.brand-dark-900}` — `#0b1220`): The deep slate used on the featured pricing tier and dashboard chrome.
- **Pink** (`{colors.ruby}` — `#ef4da8`): Gradient accent and chart highlight; never a button.
- **Purple** (`{colors.purple}` — `#6b4cf6`): The co-primary violet — gradient end-stop, wordmark second half, chart line B.
- **Amber** (`{colors.amber}` — `#f59e0b`): Warm accent stop, used sparingly against the cool palette.
- **Gradient Blue** (`#087fd9`): Untokenised mid-stop that sits between teal and purple in every brand gradient.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): Default panel and card background.
- **Canvas Soft** (`{colors.canvas-soft}` — `#f7fbff`): Cool-tinted off-white used as the page background and on feature bands beneath the gradient hero.
- **Canvas Violet** (`{colors.canvas-violet}` — `#f2efff`): Pale violet used as a feature-band fill — the brand's chromatic interlude.
- **Hairline** (`{colors.hairline}` — `#dbe6ef`): 1px borders on cards and tables.
- **Hairline Input** (`{colors.hairline-input}` — `#d1dee9`): Slightly deeper hairline used on form inputs.

### Text
- **Ink** (`{colors.ink}` — `#102033`): Default body text color across the brand. Deep slate, never pure black.
- **Ink Secondary** (`{colors.ink-secondary}` — `#294056`): Secondary text on white.
- **Ink Mute** (`{colors.ink-mute}` — `#607087`): Helper text, captions, table labels.
- **Ink Mute 2** (`{colors.ink-mute-2}` — `#687484`): Lighter companion to ink-mute used in nav and fine labels. It was `#7b899b`, which measures 3.56:1 on `{colors.canvas}` and 3.43:1 on `{colors.canvas-soft}`, and it carries 11px copy in four components; this value is the same hue darkened until both grounds clear 4.5:1, at 4.75:1 and 4.57:1. It sits close to ink-mute on purpose: ink-mute is 4.85:1 on canvas-soft, so the whole band a fourth text rung can occupy is 2.1 L\* wide and this is the top of it. A fine label goes quieter by getting smaller or shorter, not lighter.
- **On Primary** (`{colors.on-primary}` — `#ffffff`): Text on teal / dark-slate surfaces. It reads at 4.5:1 only from `{colors.primary-deep}` down, so the applied CTA fills sit at or below that stop; teal itself is a brand color rather than a ground for white text.

### Semantic
The brand does not use a separate semantic color palette in the marketing system — error / success states live in dashboard-product UI specifically.

## Typography

### Font Family

**Space Grotesk** at weight 700 is reserved for the four display tiers and nothing else. Everything below — heading, body, button, caption, and micro tiers — is **Inter**, at 600 on the heading tiers and 400 everywhere else. The boundary sits at `{typography.display-md}` (26px): above it Space Grotesk's letterforms read as character, below it they read as noise and cost legibility. Both are open-source under the SIL Open Font License and load from Google Fonts — the system carries no licensed or proprietary typeface. No global stylistic set is applied. The OpenType `ss01`–`ss20` slots carry no standard meaning — every foundry fills them differently — so a bare set number means nothing once the typeface changes. Features are declared per-role instead: `tnum` and `zero` on the numeric tiers, none elsewhere.

When either family is unavailable, fall back to system-ui / -apple-system, then a generic sans. Avoid dropping to Helvetica or Arial defaults — their letterforms flatten the tight negative tracking the 700-weight display tier depends on.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xxl}` | 56px | 700 | 1.03 | -3.08px | Hero headline |
| `{typography.display-xl}` | 48px | 700 | 1.15 | -2.16px | Section opener |
| `{typography.display-lg}` | 32px | 700 | 1.1 | -0.8px | Card title / sub-section |
| `{typography.display-md}` | 26px | 700 | 1.12 | -0.52px | Compact card title |
| `{typography.heading-lg}` | 22px | 600 | 1.1 | -0.22px | Pricing tier name |
| `{typography.heading-md}` | 20px | 600 | 1.4 | -0.2px | Section sub-heading |
| `{typography.heading-sm}` | 18px | 600 | 1.4 | 0 | Mini-section label |
| `{typography.body-lg}` | 16px | 400 | 1.4 | 0 | Marketing body lead |
| `{typography.body-md}` | 15px | 400 | 1.4 | 0 | Default UI body |
| `{typography.body-tabular}` | 14px | 400 | 1.4 | -0.42px | Metric / numeric tables (uses `tnum`) |
| `{typography.button-md}` | 16px | 400 | 1.0 | 0 | Pill button label |
| `{typography.button-sm}` | 14px | 400 | 1.0 | 0 | Compact pill label |
| `{typography.caption}` | 13px | 400 | 1.4 | -0.39px | Helper, table labels |
| `{typography.micro}` | 11px | 400 | 1.4 | 0 | Fine print |
| `{typography.micro-cap}` | 10px | 400 | 1.15 | 0.1px | All-caps eyebrow |

### Principles
- **Bold display is the brand.** The four display tiers render Space Grotesk at 700; heading tiers step down to Inter at 600. Space Grotesk's character lives in its letterform details, which need both weight and size to register.
- **Tracking is coupled to weight.** -3.08px at 56px (-0.055em), easing to -0.2px at 20px. Heavy display type needs roughly double the negative tracking a light weight would take; changing one without the other breaks the fit.
- **Tabular figures for metrics.** Any cell rendering credit balances, enrolment counts, completion rates, or currency uses `font-feature-settings: "tnum", "zero"` plus a tightening tracking. The brand quietly signals its product-data DNA through this micro-detail.
- **Font features are per-role, never global.** Numeric tiers declare `font-feature-settings: "tnum", "zero"`; every other role declares none. Never spec a stylistic set (`ss01`–`ss20`) at the body level — the numbering is foundry-specific and silently becomes meaningless after a font swap.

### Note on Font Loading
No change needed. The system uses Space Grotesk 700 and Inter 400 / 600, all three of which the landing page's existing request already loads:

`https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap`

If the scale is ever trimmed, the three weights above are the only ones the system depends on.

## Layout

### Spacing System
- **Base unit**: 8px (with 2 / 4 / 12 sub-tokens for fine work).
- **Tokens**: `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 24px · `{spacing.xxl}` 32px · `{spacing.huge}` 64px.
- **Section padding**: 64–96px on marketing surfaces; 32–48px on dashboard / product surfaces.
- **Card internal padding**: 32px on feature cards; 24px on dashboard mockups.

### Grid & Container
- Marketing pages center in a ~1200px container with the gradient wash extending edge-to-edge above.
- Pricing collapses 4-up → 2-up → 1-up at 1024 / 768 breakpoints.
- Dashboard product mockups use their own internal grids (12-col tables, 3-col card grids) rendered as static composites.

### Whitespace Philosophy
The gradient wash occupies the upper third of the page; the white canvas below is generously padded. Section gaps tend toward 96px, with content tightening to 32px on dashboard / pricing pages where users compare and act.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat | Default surface |
| 1 | `box-shadow: rgba(31,63,94,0.08) 0 1px 3px` | Card lift on white |
| 2 | `box-shadow: rgba(31,63,94,0.08) 0 8px 24px, rgba(31,63,94,0.04) 0 2px 6px` | Floating panels, dashboard mockup chrome |
| 3 | Subtle gradient backdrop | The brand's primary depth medium — atmospheric color rather than literal shadow |

### Decorative Depth
The gradient wash IS the depth system. Implemented as large blurred radial orbs (or a layered SVG) rather than a flat linear gradient — the shapes are organic blobs, heavily blurred and held at low opacity. The wash provides the brand's signature lift; literal shadows are reserved for product-UI mockups and stay subtle.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Hairline tags, table chrome |
| `{rounded.sm}` | 6px | Form inputs |
| `{rounded.md}` | 8px | Compact cards, alerts |
| `{rounded.lg}` | 12px | Pricing cards, feature cards |
| `{rounded.xl}` | 16px | Dashboard product mockup chrome |
| `{rounded.pill}` | 9999px | All buttons, tag pills |

### Photography Geometry
The brand uses **product UI mockups** more than photography. Dashboard composites render as faux IDE/terminal/dashboard chrome inside `{rounded.lg}` 12px containers with a subtle `box-shadow`. Real photography appears in customer logo strips and the rare case-study card; treated as inset 4:3 with no shadow.

## Components

### Buttons

**`button-primary-pill`** — the dominant CTA system-wide.
- Background `{colors.primary-deep}`, text `{colors.on-primary}`, type `{typography.button-md}`, padding `{spacing.sm} {spacing.lg}` (8px 16px), rounded `{rounded.pill}` 9999px.
- Pressed state `button-primary-pill-pressed` shifts background to `{colors.primary-deepest}`.
- The fill was `{colors.primary}` and the pressed fill `{colors.primary-press}`. White on teal is 2.99:1, so every rung this control names is now one white can be read on: 4.85:1 at rest, 10.57:1 pressed, and the ramp between them in `--cta-gradient`. Teal is what the button is recognized by, not what it is filled with.

**`button-secondary`** — outline-style alternative.
- Background `{colors.canvas}`, text `{colors.primary-deeper}`, 1px solid `{colors.primary}` border, same pill geometry.
- The label was `{colors.primary}`, 2.99:1 on white. The border stays teal: it carries no words, so it answers to the 3:1 non-text floor rather than 4.5:1, and at 2.9850:1 it sits just under that one. That gap is real and is not this pass's, which fixed text; it is filed rather than fixed here.

**`button-on-dark`** — used on dashboard / dark surfaces.
- Background `{colors.brand-dark-900}`, text `{colors.on-primary}`, same pill geometry.

### Cards & Containers

**`card-feature-light`** — feature explanation card on white.
- Background `{colors.canvas}`, padding `{spacing.xxl}`, rounded `{rounded.lg}` 12px, 1px `{colors.hairline}` border, optional Level 1 shadow.

**`card-pricing`** — standard pricing tier.
- Background `{colors.canvas}`, padding `{spacing.xxl}`, rounded `{rounded.lg}`, 1px `{colors.hairline}` border. Title `{typography.heading-lg}`, price `{typography.display-md}`, body `{typography.body-md}`, CTA pinned bottom as `button-primary-pill`.

**`card-pricing-featured`** — the inverted dark featured tier.
- Background `{colors.brand-dark-900}`, text `{colors.on-primary}`, otherwise identical structure to `card-pricing`. The deep-slate fill is the brand's distinctive featured-tier choice.

**`card-cream-band`** — violet interlude card.
- Background `{colors.canvas-violet}`, text `{colors.ink}`, padding `{spacing.xxl}`, rounded `{rounded.lg}`. Used to break up the teal / white rhythm with a cool violet shift.

**`card-dashboard-mockup`** — composited dashboard / product UI screenshot.
- Background `{colors.canvas}`, type `{typography.body-tabular}` (with `tnum`), padding `{spacing.xl}` 24px, rounded `{rounded.lg}` 12px, Level 2 shadow. Often contains nested mini-mockups: campaign-logic row + metric grid + chart card.

### Inputs & Forms

**`text-input`** — standard form field.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, padding `{spacing.sm} {spacing.md}` (8px 12px), rounded `{rounded.sm}` 6px, 1px `{colors.hairline-input}` border.
- Focus state `text-input-focused`: border swaps to `{colors.primary}`.

### Navigation

**`nav-bar-on-mesh`** — top nav floating over the gradient hero.
- Background `{colors.canvas}` (or transparent depending on scroll), text `{colors.ink}`, padding `{spacing.lg} {spacing.xl}`. Logo wordmark on the left, primary nav center, sign-in + filled `button-primary-pill` on the right.

### Pills, Tags, and Chips

**`pill-tag-soft`** — subdued teal tag.
- Background `{colors.primary-bg-subdued-hover}`, text `{colors.primary-deep}`, type `{typography.micro-cap}`, padding `4px 8px`, rounded `{rounded.pill}`.

### Signature Components

**Subtle Gradient Backdrop** — pale aqua `#7ce8e2` → teal `{colors.primary}` → blue `#087fd9` → purple `{colors.purple}` → lavender `#c8b8ff` stops blurred horizontally across the upper third of the page. Implemented as large blurred radial orbs or an SVG — not a flat CSS gradient (the real wash has organic blob shapes). Brand gradients run `135deg` on buttons and `145deg` on panels, with blue holding the mid-stop at ~60%.

**Composited Dashboard Mockup** — multi-layer faux-product-UI compositions: an IDE panel on the left, a dashboard table center, a chart card on the right, all rendered at small scale inside `{rounded.lg}` containers with subtle Level 2 shadows. The composite is the brand's most-photographed feature.

**Tabular-Figure Metric Type** — every number rendering credits, enrolment counts, completion rates, or currency uses `font-feature-settings: "tnum", "zero"`. The brand's quiet signal that it's a measurement-driven growth platform.

**`link-on-light`** — inline links on light surfaces.
- Text `{colors.primary}` rendered in `{typography.body-md}`, no underline by default.

**`footer-light`** — site-wide footer.
- Background `{colors.canvas}`, text `{colors.ink-mute}`, type `{typography.caption}`, padding `{spacing.huge} {spacing.xl}` (64px 24px). Holds 4–6 columns of link groups, social icons, and a small legal row.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` for filled CTAs and inline link emphasis — it should appear sparingly, one filled button per band.
- Apply the gradient wash to every marketing hero; bare-canvas heroes feel off-brand.
- Render display tiers at weight 700 with negative letter-spacing — the bold face plus tight tracking is the typographic signature.
- Use `font-feature-settings: "tnum"` on every metric / numeric cell.
- Pair `zero` with `tnum` on numeric roles so a credit balance never reads `O` for `0`.
- Pair every feature explanation with a composited product UI mockup; the brand's argument is "look at the actual product."

### Don't
- Don't drop display weight below 700, and don't push Space Grotesk below `{typography.display-md}` (26px) — the face goes spindly and its quirks read as noise at small sizes.
- Don't add new accent colors outside the documented gradient stops (aqua / teal / blue / purple / lavender / pink).
- Don't use the teal `{colors.primary}` as a body-text color — it's a CTA and link color, not a type color at body size.
- Don't shrink button padding below `8px 16px` — the tight pill is part of the brand's transactional feel.
- Don't render metric cells without `tnum` — it breaks the quiet product-data signature.
- Don't replace the pill shape with rounded-rectangles for buttons.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Wide | ≥ 1440px | Full gradient wash edge-to-edge; dashboard composite at full scale |
| Desktop | 1024–1440px | Default content max-width; pricing 4-up |
| Tablet | 768–1023px | Pricing 2-up; dashboard composite simplifies to 2 panels |
| Mobile | < 768px | Pricing 1-up; hamburger nav; display drops 56 → 36px |

### Touch Targets
- Pill buttons hit ≥ 40×40px on mobile via padding scaling. On smaller screens, buttons size up to 44×44px to maintain WCAG AAA.
- Form fields stay at 40px minimum height.

### Collapsing Strategy
- Display tiers stair-step 56 → 48 → 32 → 26 → 22px through the breakpoints.
- Gradient wash re-tiles on mobile to preserve the atmosphere without disappearing.
- Dashboard composites simplify to single-panel mockups on mobile; the multi-layer composition only renders at desktop+.
- Pricing tiers stair-step 4-up → 2-up → 1-up.

### Image Behavior
Product UI composites use `srcset` with art-direction crops at major breakpoints. Mobile crops focus on the most actionable inner panel; desktop crops show the full multi-layer composition.

## Iteration Guide

1. Focus on ONE component at a time.
2. Reference component names and tokens directly (`{colors.primary}`, `{button-primary-pill}-pressed`, `{rounded.pill}`).
3. Run `npx @google/design.md lint DESIGN.md` after edits.
4. Add new variants as separate entries.
5. Default body to `{typography.body-md}` (15px); use `{typography.body-tabular}` for any metric / numeric cell.
6. Apply `tnum` and `zero` per-element on numeric content; apply no font features globally.
7. The gradient wash is non-negotiable on marketing heroes — bare-canvas heroes break the brand.
