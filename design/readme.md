# ActiveKit Design System

The design language for **ActiveKit**, a growth-campaign platform for AI apps. Teams wire referral, streak, and win-back loops against their own credit ledger, and ActiveKit handles enrolment, payout, and measurement.

Two visual tracks share one token set:

1. **Marketing surfaces.** White canvas, a subtle gradient wash across the upper third of every hero, one filled teal pill per band, and composited product-UI mockups doing the arguing.
2. **Dashboard and product track.** The same tokens with polarity flipped: deep-slate (`--brand-dark-900`) app chrome, tabular figures everywhere a number appears.

## Sources

| Source | Access | Notes |
|---|---|---|
| `uploads/DESIGN.md` | in this project | **The single source of truth.** Frontmatter carries every colour, type role, radius, spacing, and component spec. Nothing here invents a value outside it. |
| `uploads/voice-principles.md` | in this project | **House voice rules.** Applied across all copy in this system and summarised in `guidelines/voice.md`. |
| `activekit-light.html` | **not supplied** | DESIGN.md cites it as the extraction source for the hero, `#outcomes`, `#campaigns`, `#developers`, and `#pricing`. No codebase, Figma file, repo, or screenshots were attached. |

No codebase or Figma file was provided, so this system is a faithful build of the written spec rather than a recreation of a running product. Anything DESIGN.md leaves open is listed under **Gaps filled** below instead of being quietly invented.

## Fonts

Both families are SIL OFL and load from Google Fonts using the exact request DESIGN.md specifies, in `tokens/fonts.css`:

- **Space Grotesk 700** for the four `display-*` tiers only.
- **Inter 400 and 600** for headings (600) and everything else (400).

No font binaries were supplied, so nothing self-hosts yet. **Send the `.woff2` files if you want ActiveKit serving its own webfonts** and I'll add `@font-face` rules and drop the CDN import.

## Components

Every component family DESIGN.md defines is built. Nothing beyond it was invented.

| Component | Directory | Spec entries covered |
|---|---|---|
| `Button` | `components/actions/` | `button-primary-pill`, `button-primary-pill-pressed`, `button-secondary`, `button-on-dark` |
| `Card` | `components/surfaces/` | `card-feature-light`, `card-cream-band`, `card-dashboard-mockup` |
| `PricingCard` | `components/surfaces/` | `card-pricing`, `card-pricing-featured` |
| `Input` | `components/forms/` | `text-input`, `text-input-focused` |
| `Pill` | `components/tags/` | `pill-tag-soft` |
| `Link` | `components/navigation/` | `link-on-light` |
| `NavBar` | `components/navigation/` | `nav-bar-on-mesh` |
| `Footer` | `components/navigation/` | `footer-light` |
| `GradientWash` | `components/brand/` | Subtle Gradient Backdrop (signature component) |
| `Logo` | `components/brand/` | Intentional addition, see below |
| `Icon` | `components/icons/` | Intentional addition, see below |
| `Spinner` | `components/feedback/` | Intentional addition, see below |
| `Skeleton` | `components/feedback/` | Intentional addition, see below |
| `ProgressBar` | `components/feedback/` | Intentional addition, see below |
| `EmptyState` | `components/empty/` | Intentional addition, see below |
| `Modal` | `components/overlays/` | Intentional addition, see below |
| `AppSidebar` | `components/app-shell/` | Intentional addition, see below |
| `AppTopBar` | `components/app-shell/` | Intentional addition, see below |

### Intentional additions

DESIGN.md defines no app-chrome family, but the six product templates all need the same sidebar and page header, and a shared component means one edit propagates instead of six.

- **`AppSidebar`** owns the slate nav column: gradient logo tile, workspace switcher, icon nav with grouped sections and an active item, an optional credit meter, an optional user row. Edit this file and every product template follows on reload.
- **`AppTopBar`** owns the white page header: eyebrow, title, right-hand actions, optional tab row. Used by the dashboard, campaigns list, and credits pages. Campaign detail and Settings keep bespoke headers, since one carries a breadcrumb with status controls and the other a tab row.
- **`Icon`** is the house glyph set, 30 geometric line icons on a 24 grid. See **Iconography** below for why this exists now.
- **`Logo`** is the lockup: gradient tile carrying the four-point mark, plus the two-tone wordmark, in an on-light and an on-slate tone. The mark is Icon's `campaigns` star filled rather than stroked, so the brand and the icon set stay one drawing, and `assets/logo.svg` is the standalone tile for favicons and anything outside the bundle. `NavBar`, `Footer`, `AppSidebar`, the auth suite, and the wizard header all render it, so the lockup has exactly one definition. The `brand` prop still accepts any other value and falls back to plain type.
- **`Spinner`, `Skeleton`, `ProgressBar`** cover the three loading shapes: an action in flight, a first load, and measurable progress. DESIGN.md specs no loading system, and every product screen has waits, so leaving it unspecified meant six templates inventing six spinners.
- **`EmptyState`** is the empty page, empty table, no-results, and failed-fetch state. Same reasoning: a list that can be empty always is, on day one.
- **`Modal`** is one dialog shell covering modals, confirms, and prompts, with four tones. DESIGN.md defines no overlay family, and the wizard, delete, and rename flows all need one.

All are built only from documented tokens plus the gradient and motion tokens listed under **Gaps filled**. None appear in DESIGN.md, so treat them as ActiveKit-specific product surface rather than part of the published spec.

## Templates

Twelve page templates in `templates/<slug>/`, each composing the primitives above. Six marketing surfaces on the light track, six product surfaces on the slate app shell.

| Template | Folder | What it covers |
|---|---|---|
| Landing page | `landing-page/` | Wash hero, product mockup, logo strip, outcome metrics, feature cards, violet interlude, developer panel, 3-up pricing, dark CTA band, footer |
| Pricing page | `pricing-page/` | 4-up tiers with a working monthly and annual toggle, comparison table, FAQ |
| Feature page | `feature-page/` | Campaign deep dive: loop anatomy, campaign-builder mockup, pull quote, before and after table |
| Developers page | `developers-page/` | Terminal hero, four-step quickstart, endpoint table, webhook payload panel |
| Customer story | `customer-story/` | Result metrics, pull quote, prose with a sticky fact sidebar, related stories |
| Auth suite | `auth-page/` | Sign in, create account, forgot password, code verification, and set new password on one split wash layout, mapped to Clerk's sign-in steps |
| App dashboard | `app-dashboard/` | Metric row, stacked credits-paid chart with 7/14/30 day range, payout feed, live campaign table |
| Campaigns list | `app-campaigns-list/` | Status tabs, live search, row metrics, pagination, empty state |
| Campaign detail | `app-campaign-detail/` | Logic row, metrics, funnel bars, payout ledger, campaign JSON, version history |
| Create campaign | `app-create-campaign/` | Four-step wizard with live summary panel and a generated API call on review |
| Credits and billing | `app-credits-billing/` | Credit meter, top-up packs, usage by campaign, payment method, invoice table |
| Settings | `app-settings/` | Section tabs for workspace, API keys, webhooks, and team |

Each folder carries a `ds-base.js` that loads `styles.css` and the compiled bundle, so a consuming project only edits its `base` path. It links `styles.css` alone, never the individual token files, so adding a token file to `styles.css` reaches every template with no further edit.

### The product templates are a working click-through

The six app surfaces are wired to each other with plain relative links, so you can walk the whole product without a separate demo file. Open `app-dashboard/AppDashboard.dc.html` and click through:

- **Sidebar** nav moves between Overview, Campaigns, Credits, and Settings on every product screen, with the active item already marked per template.
- **Overview → campaign detail** through any campaign name in the live-campaign table, and **→ the wizard** through "New campaign".
- **Campaigns list → campaign detail** through any row name, **→ the wizard** through "New campaign".
- **Campaign detail → campaigns list** through the breadcrumb.
- **Wizard → campaigns list** through "Cancel", and **→ campaign detail** when "Launch campaign" is pressed on the review step.

**Ledger and Developers stay inert,** because no template stands behind them. Point them somewhere real when those screens exist rather than linking them to the nearest page.

Links are relative between sibling folders, so a consuming project that copies `templates/` whole keeps the flow, and one that copies a single folder gets a screen with dead nav rather than a broken build. Retarget the `href` values in each template's `sidebarItems` to your own routes.

### Auth is designed for Clerk

The auth suite is one template with five states, not five files, because that is the shape Clerk actually has: **password reset is not a separate page, it is a step inside `<SignIn />`.** Clerk's sign-in flow runs `start`, `verifications`, `choose-strategy`, `forgot-password`, and `reset-password`, so a standalone `/reset-password` route would either duplicate state Clerk already owns or force a fully custom flow. Each state in the template names the Clerk step it stands for in a caption under the card, switchable off with the `showClerkMap` tweak.

| Template state | Clerk surface |
|---|---|
| Sign in | `<SignIn />`, step `start` |
| Create account | `<SignUp />`, step `start` |
| Forgot password | `<SignIn />`, step `forgot-password` |
| Check your email | `<SignIn />`, step `verifications` |
| Set a new password | `<SignIn />`, step `reset-password` |

**How to use it.** Keep the left wash panel, the card shell, and the `Logo` as your own markup, and mount Clerk inside the card rather than rebuilding these forms. `templates/auth-page/clerk-appearance.js` maps ActiveKit tokens onto Clerk's `appearance` prop: pass it to `<ClerkProvider appearance={activekitClerkAppearance}>` and every Clerk surface, including `<UserButton />` and `<UserProfile />`, inherits the system.

Three things worth knowing before you wire it up:

1. **Clerk's `variables` take literal colours, not custom properties.** Clerk generates shades from your base colours with `color-mix()` and relative colour syntax, so `var(--primary)` there costs you browser support. `clerk-appearance.js` therefore repeats the hex values from `tokens/colors.css`, and that duplication is the one place in this system where a token is written twice. Change a brand colour and change it in both files.
2. **`borderRadius` is a single variable, and ActiveKit is not uniformly rounded.** Buttons are pills, inputs are 6px, cards are 12px. The variable is set to the input radius and the pill is applied per element in `elements.formButtonPrimary` and `elements.socialButtonsBlockButton`.
3. **Clerk's card chrome is switched off,** because the template already draws the card, the heading, and the hairline. `elements.card` and `cardBox` drop their border, shadow, and padding so Clerk renders as form content inside your surface instead of a card inside a card.

If you outgrow the prebuilt components, Clerk Elements exposes the same steps as unstyled primitives, and the token mapping in `clerk-appearance.js` is the reference for what each part should look like.

## Content fundamentals

Copy follows `uploads/voice-principles.md`. The full working version, with before-and-after examples, lives in `guidelines/voice.md`; the rules that most often change a draft:

- **Key point first, then context.** A claim, then the mechanism. "Growth loops that pay out. Launch referral, streak, and win-back campaigns against your own credit ledger, no growth engineer required."
- **No em dashes anywhere,** including UI strings and table labels. Use a comma, a colon, or a full stop.
- **Banned words:** dive into, game-changing, straightforward, leverage, synergize, circle back, touch base.
- **Write like a thoughtful colleague talking to a smart friend.** Professional, not stiff. If a line reads like a corporate memo or like an AI wrote it, rewrite it.
- **Vary sentence length** and join clauses with "so" or "because" rather than stacking short fragments. Paragraphs run one to three sentences.
- **Second person.** The reader is *you*, the product is *ActiveKit*, never *we* in body copy.
- **Sentence case** in headlines, buttons, and nav. All caps only at `micro-cap` (10px) for eyebrows and table headers.
- **Buttons are verbs, one to three words:** "Start free", "Launch campaign", "Talk to sales", "Read the docs". Short and decisive, matching the tight pill.
- **Section labels are single nouns:** Outcomes. Campaigns. Developers. Pricing.
- **Numbers carry the argument,** so write them precisely: `10,480`, `61.0%`, `1,009,200`, never "10k+". That precision is the reason numeric cells run `tnum` and `zero`.
- **Bold the key point** in long-form, one idea per paragraph, bullets for lists and prose for explanation.
- **No emoji.** DESIGN.md defines no emoji role, and the slate and teal palette gives them nowhere to sit.

Section names and product nouns come from DESIGN.md. The sample marketing copy in the cards is mine, written to these rules, so **replace it with real copy when you have it.**

## Visual foundations

**Colour.** One CTA colour: teal `#00a7a0`, used sparingly at one filled pill per band. Deep slate `--ink` `#102033` is the universal body colour, never pure black, with `--ink-secondary`, `--ink-mute`, and `--ink-mute-2` stepping down for secondary text, helpers, and fine labels. Pink `--ruby`, purple `--purple`, and amber `--amber` live inside the gradient wash and in chart accents, and they are never flat button fills. Teal is never a body-text colour.

**Teal is also not a ground for white text, and the ladder says where the line is.** White on `--primary` is 2.99:1 and on `--primary-soft` 2.14:1, so the applied CTA fills run on the three rungs at and below `--primary-deep`: `--primary-deep` 4.85:1, `--primary-deeper` `#04605c` 7.41:1, `--primary-deepest` `#024744` 10.57:1. The brand hue keeps its value and its jobs, the focus ring, the wash orb, the lockup ramp, the outline button's border; it just does not sit under a label. Teal as text is `--primary-deep` on white (4.85:1) and `--primary-deeper` on the pale teal tint (6.73:1, against 4.40:1 for `--primary-deep` there). The ink ramp's last rung, `--ink-mute-2` `#687484`, is 4.75:1 on `--canvas` and 4.57:1 on `--canvas-soft`, and it sits close to `--ink-mute` because `--ink-mute` is 4.85:1 on `--canvas-soft` and the floor is 4.5:1, so the band a fourth text rung can occupy is 2.1 L\* wide. There is no quieter text colour on a near-white canvas; a fine label goes quieter by getting smaller, not lighter.

**Surfaces.** Cards sit on `--canvas` white, the page sits on `--canvas-soft` `#f7fbff`, a barely-tinted cool off-white. `--canvas-violet` `#f2efff` is the chromatic interlude, a violet band that breaks up the teal and white rhythm without leaving the palette. The dark track uses `--brand-dark-900` `#0b1220`.

**Type.** Space Grotesk 700 runs the four display tiers (56 / 48 / 32 / 26px) with hard negative tracking, from −3.08px down to −0.52px. Inter 600 runs headings (22 / 20 / 18px) and Inter 400 runs everything below. The family boundary sits at 26px, because below it Space Grotesk's quirks read as noise. Tracking is coupled to size, so never change one without the other. Numeric roles (`body-tabular`, `caption`) declare `font-feature-settings: "tnum","zero"`, no font feature is ever set globally, and stylistic sets (`ss01` to `ss20`) are never specced.

**Backgrounds and applied gradient.** No photography-led backgrounds. The hero background is the gradient wash: large organic orbs of aqua, teal, blue, purple, and lavender, heavily blurred (`--wash-blur` 90px) at low opacity (`--wash-opacity` 0.42), occupying the upper third (`--wash-height` 33%) and bleeding edge to edge off the top. It is a wash, not a saturated mesh, so if the stops read as distinct bands the blur is too tight or the opacity too high. Below the wash the page returns to white, and feature bands use `--canvas-soft` or the violet band.

The wash is atmospheric; `tokens/gradients.css` holds the gradients that get **applied to surfaces**, and they follow one rule: teal-only ramps are the default, the full teal → blue → purple ramp is rationed. `--cta-gradient` (deep teal → deeper teal, 135°) fills every primary button, so a CTA reads as one colour with depth rather than a flat chip; hover runs the ramp a rung lower and press flattens onto the bottom rung, which is the structure it has always had, now inside the half of the ladder white can be read on. `--cta-gradient-bold` is the full ramp and is capped at **one per view**, for a hero CTA or a modal's top rule; its stops are `--primary-deep`, `--gradient-blue-deep`, `--purple` (4.85 / 5.45 / 5.26 under white) rather than the brand ramp's teal and `--gradient-blue`, which are 2.99:1 and 4.16:1. Its hover and press each take the teal end one rung lower, `--cta-gradient-bold-hover` then `--cta-gradient-bold-press`, so the bold CTA moves under the pointer the way the plain one does; only the teal end moves, because hover already spends the purple end on `--purple-deep` and the blue stop holds across all three as the only blue in the set that carries white text. Press had been the hover ramp again until E28's second pass, which left the fill still and the shadow doing the whole job. The logo tile takes `--brand-gradient-button` directly, because the lockup carries no text and should not follow a label's constraint away from the landing page's own mark. `--sidebar-gradient` plus `--sidebar-glow` brand the slate column, `--nav-active-bar` runs teal into purple on the active nav item, and `--progress-gradient` fills progress tracks. Everything else stays flat. Filled CTAs also carry `--elevation-cta`, a teal-tinted shadow, which is the one shadow in the system that is not neutral blue.

**Depth.** Two literal shadows, both blue-tinted from `--shadow-blue` `#1f3f5e`: level 1 `0 1px 3px` for card lift, level 2 `0 8px 24px` plus `0 2px 6px` for floating panels and mockup chrome. Level 3 is the wash itself, because the brand's primary depth medium is atmospheric colour rather than shadow. Literal shadows stay subtle and belong to product-UI mockups.

**Borders and radii.** 1px hairlines: `--hairline` `#dbe6ef` on cards and tables, `--hairline-input` `#d1dee9` slightly deeper on form fields. Radii run 4px for tags and table chrome, 6px inputs, 8px compact cards, 12px feature and pricing cards, 16px dashboard mockup chrome, and 9999px on every button and tag pill. Buttons are never rounded rectangles.

**Cards.** White fill, 1px hairline, 12px radius, 32px internal padding, optional level-1 shadow. Dashboard-mockup cards drop to 24px padding, gain level-2 shadow, and turn on tabular figures for everything inside. Violet-band cards are flat, with no border and no shadow.

**Layout.** A ~1200px centred container with the wash extending edge to edge above it. Section padding runs 64 to 96px on marketing and 32 to 48px on product surfaces, section gaps tend to 96px, and content tightens to 32px on pricing and dashboard views where users compare and act. Pricing goes 4-up to 2-up to 1-up at 1024 and 768. Display tiers stair-step 56 → 48 → 32 → 26 → 22px down the breakpoints, and the wash re-tiles on mobile rather than disappearing. Nothing is specced as fixed or sticky except the nav, which floats over the wash and may go transparent on scroll.

**Transparency and blur.** Blur appears in exactly one place, the wash orbs. Semi-transparency appears only in the white-on-slate text tiers inside the inverted pricing card. No frosted-glass panels and no scrim capsules, because the wash is low-opacity to begin with, so text sits directly on it without a protection gradient.

**Imagery.** Product-UI mockups over photography: faux IDE, terminal, and dashboard composites, with an IDE panel left, a dashboard table centre, and a chart card right, rendered small inside 12px containers with level-2 shadows. Real photography is limited to customer logo strips and the occasional case-study card, inset 4:3 with no shadow. Imagery runs cool, in slate, teal, and violet, with no grain and no warm filters.

**Motion, hover, and press.** DESIGN.md specs no animation system, so motion is limited to two jobs: state changes and waiting. State changes run the specced 120ms ease on fills, borders, and shadow (`--transition-interactive`); hover darkens, press flattens the gradient to solid `--primary-press` with no scale change. Waiting has its own vocabulary in `tokens/motion.css`: a 720ms linear spinner, a 1500ms shimmer on skeletons, a 1400ms indeterminate progress sweep, and a 320ms rise on dialogs. Nothing else animates, so no entrance animations, no bounces, no parallax on the wash. Decorative motion (shimmer, pulse) stops under `prefers-reduced-motion`; spinners and progress bars keep moving, because a frozen progress indicator reads as a hung interface.

**Loading, empty, and dialog states.** Three shapes of waiting, and one shell for interruption. An action in flight keeps its button and its label and swaps the left icon for a spinner (`Button loading`). A first load draws `Skeleton` inside the real container, so nothing jumps when data lands, and a refresh of content already on screen never does, because replacing loaded content with grey bars reads as failure. Measurable work draws `ProgressBar`, determinate when a count exists and indeterminate when it does not. Every list, table, and page that can be empty carries an `EmptyState`: a gradient medallion, a plain statement of what is missing, one or two sentences ending in what to do, and the button that does it. Interruptions use `Modal` for all three cases, confirm, prompt, and destructive, changing only tone and size.

## Iconography

**DESIGN.md defines no icon system and no icon assets were supplied, so the system now ships its own: `Icon`, 30 geometric line glyphs on a 24 grid, 1.75 stroke, round caps and joins, drawn in `currentColor`.** It exists because product surfaces need it: a sidebar without icons is a list of links, and every empty state, dialog, and toolbar was reaching for a glyph that did not exist.

- **The set is deliberately small.** Only glyphs the product actually names: nav (overview, campaigns, ledger, credits, developers, settings, team, chart), actions (plus, search, filter, refresh, download, trash, play, external), state (check, alert, bell, inbox, clock), and chrome (close, menu, chevrons, arrowRight). Add one by adding an entry to `GLYPHS` in `Icon.jsx`, keeping to strokes on the 24 grid with no fills.
- **Sizes are fixed:** 16 beside `body-sm` and `button-sm`, 20 for nav and `button-md`, 24 for page headers, 28 in empty-state medallions. Line weight stays 1.75 at every size, because raising it small makes the glyphs read as filled shapes.
- **Icons inherit colour.** Set the parent's text colour rather than passing `color`, so an icon inside a button or a nav item tracks state automatically.
- **Where a logo goes,** render `Logo`. The wordmark is Space Grotesk 700 with "Active" in `--ink` (or white on slate) and "Kit" in `--purple` or `--primary-soft`, following the spec's note that purple is the "wordmark second half". `assets/logo.svg` is the standalone tile.
- **No emoji, no illustrations.** Empty states are a medallion and words.

**Send a real icon set or a logo file and I'll swap them in.** `Icon` is one file with one map, so replacing the glyphs is a single edit.

## Gaps filled

Places DESIGN.md is silent or contradicts itself, and the call made. Every one of these resolves to an existing token, so no new values were introduced.

1. **Display weight contradiction, now resolved in the spec.** Two lines in DESIGN.md said weight 300 while the frontmatter, Don'ts, and Key Characteristics all said 700. On your call, **700 is correct**, and the three contradicting sentences in `uploads/DESIGN.md` (the Do's line, the font-fallback note, and the "thin type" phrasing in Principles) have been corrected. No token changed, since the system was already built at 700.
2. **Hover states are unspecified.** The primary pill hovers a rung down the teal ladder and presses onto its bottom rung, `--primary-deepest`; it used to hover to `--primary-deep` and press to `--primary-press`, both of which are now above the ramp rather than below it, so a press would have lightened the control. Secondary hovers to `--primary-bg-subdued-hover`, literally the token's name. On-dark hovers to `--ink`.
3. **Disabled states are unspecified.** 40% opacity, `not-allowed` cursor, no colour change.
4. **`sm` button padding.** The spec's `8px 16px` floor applies to `button-md`, so `button-sm` uses `8px 12px` to keep the 14px label in proportion. Say the word and I'll hold sm at 16px horizontal too.
5. **Minimum hit target.** Buttons carry `min-height: 40px` at all sizes, following the responsive section's 40px floor.
6. **Untokenised gradient stops.** `#7ce8e2`, `#087fd9`, and `#c8b8ff` appear in prose only, so they are tokenised here as `--gradient-aqua`, `--gradient-blue`, and `--gradient-lavender`.
7. **No mono typeface, decided: keep the system stack.** DESIGN.md specs no mono face but describes faux IDE, terminal, and code panels, so `--font-mono` is a system stack (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`). I considered adding an open-source mono such as JetBrains Mono, and decided against it: the spec states the system carries no licensed typeface and depends on exactly three weights across two families, so a third webfont would contradict it and add load cost for panels that are decoration rather than reading surfaces. The system stack renders natively everywhere and stays swappable if ActiveKit adopts a code face.
8. **App shell polarity.** The spec says the dashboard track flips to a dark-app shell and also that cards live on near-white surfaces, so the templates put chrome (sidebar, wizard header) on `--brand-dark-900` and content on `--canvas-soft` with white cards. Code and ledger panels stay slate. Tell me if you want the content area dark too.
9. **App chrome became a component, reversing an earlier call.** Sidebars and topbars were first written inline in each template, on the reasoning that a component consumers cannot find in DESIGN.md is a liability. Six product screens later that reasoning had inverted: the same column was maintained in six places. `AppSidebar` and `AppTopBar` are now primitives, and the liability is handled by labelling them intentional additions here rather than by keeping the duplication. Section tabs stay inline, since Campaign detail and Settings need different ones.
10. **Failed and error states.** A ruby-tinted surface for a failed payout chip, and `--ruby` itself on `Input`'s error border. The spec says semantic states live in dashboard product UI without giving values, so this is the closest documented colour. Three components carry it now, in **two treatments that must not be merged**. `Modal tone="danger"` and `EmptyState tone="danger"` share one medallion, `--surface-danger` behind `--text-danger` inside `--border-danger`, so ruby reads there as a tint and a glyph rather than a fill; `EmptyState`'s is the failed-fetch state the empty family already owned but had no skin for. `Input error` is deliberately louder and stays louder: full-strength `--ruby` on the field border, and no tinted surface anywhere. **Do not soften the border to `--border-danger` or `--surface-danger`.** A field in error has to be findable among fields that are not.

    **The message itself is not ruby, and that half changed.** It used to be, and `Input.d.ts` used to say so. Ruby on the input's white ground is 3.33:1: enough for the border, which is a UI boundary answering to a 3:1 floor, and under the 4.5:1 a sentence answers to, as well as quieter than the `--ink-mute` hint it replaces at 5.04:1. So the border carries the state and the words are `--text-body`, 16.45:1 on the same ground, which is a visible step up in weight at the same size, so the slot still changes when the state does. The error is still not resting on colour: the border moves and the note says what is wrong in words. Ruby stays a tint and a glyph everywhere in the system, and it is not a text colour anywhere in either app. The tinted medallion measures 2.90:1, just under the 3:1 non-text floor, and is accepted on the medallion alone, where the glyph is `aria-hidden` and the state is carried by the title beside it. It is not a license to reuse the tinted pair where the colour has to do the telling.
11. **Gradients are applied, not just documented.** DESIGN.md tokenises 135° button and 145° panel gradients and then says the flat teal pill is the default CTA. Built flat, buttons read as plain chips and the brand disappeared from every product screen. Resolved by ramping the *default* gently (`--cta-gradient`, one teal to a deeper teal, same hue) and reserving the full teal → blue → purple ramp for one element per view (`--cta-gradient-bold`). Eight derived stops carry it: `--brand-dark-700`, `--brand-dark-950`, `--purple-deep`, `--gradient-blue-deep`, `--ruby-soft`, `--amber-soft`, and, added by gap 17 below, `--primary-deeper` and `--primary-deepest`. Each is a darker or tinted step of an existing brand colour, and none replaces one.
12. **Motion tokens.** The spec gives one duration (120ms) and no easing. `tokens/motion.css` adds four durations for loading states, two easings, and the keyframes they need. Nothing animates that is not reporting state or progress, and the file carries no keyframe that no component uses, so there is nothing in it to reach for by accident: `ak-spin` (Button, Spinner), `ak-shimmer` (Skeleton), `ak-indeterminate` (ProgressBar), `ak-scrim-in` and `ak-modal-in` (Modal). Only `Skeleton` is decorative, and it is the one element carrying `data-ak-decorative-motion`, which is what `prefers-reduced-motion` switches off.
13. **Loading, empty, and dialog families.** Unspecified, and unavoidable in a product with credit ledgers and async payouts. Built as `Spinner`, `Skeleton`, `ProgressBar`, `EmptyState`, and `Modal`, all from existing tokens.
14. **Every tier CTA carries a gradient, on request.** `PricingCard` used to draw one filled pill (the featured tier) and three outlined ones, which honours "one filled pill per band" but leaves a pricing row reading as unbranded. `ctaVariant` now overrides that skin, and the pricing template sets `primary` on the three standard tiers and `brand` on Growth. The reasoning: in a tier row every card is its own decision, so each CTA is that card's one filled pill, and the single bold ramp still lands on exactly one tier. The rule is unchanged everywhere else, and the default without `ctaVariant` is still one filled pill per row.
15. **Segmented toggles ramp like buttons.** The pricing period toggle and the wizard's step pills were flat `--cta-fill` while every other primary control ran `--cta-gradient`. The selected state now uses the gradient plus `--elevation-cta`, so a selected segment and a primary button read as the same material.
16. **Dark app chrome is gradient, not flat.** The wizard header and the feature page's mockup chrome were flat `--brand-dark-900` next to a sidebar running `--sidebar-gradient` and its corner glow. Both now use `--surface-dark-gradient` with the same glow, so every slate surface in the system is lit the same way.

17. **Text on this token set clears 4.5:1, and the applied surfaces moved rather than the brand colours.** DESIGN.md gives colours and no contrast floor, and five pairs it declares or implies fell under one: white on `--cta-gradient` (2.14:1 at its old opening stop, 2.99:1 at `--primary`), white on the bold ramp's teal stop (2.99:1) and its blue stop (4.16:1), `--primary-deep` on the pale teal tint (4.40:1), `--text-link` as `--primary` on white (2.99:1), and `--text-mute-2` at 11px (3.56:1). Every fix is a token, and the rule they share is that the **applied** value moved and the **brand** value did not. The CTA fill family walked down the teal ladder onto two new rungs (`--primary-deeper`, `--primary-deepest`), `--text-link` and `--text-tag` were repointed, `--cta-on-subdued` was added to name the pair the outline and ghost buttons had been guessing at, and `--ink-mute-2` was darkened because it is itself a text colour and had nowhere else to go. `--primary`, `--primary-soft`, `--primary-deep`, `--primary-press` and `--primary-bg-subdued-hover` all keep their published values: the brand hue is configured by hand in vendor consoles and drawn into a reviewed landing design, and a contrast fix is not a reason to reach into either.

    **Three measurements are recorded rather than acted on, and they are all the same 2.9850:1.** Teal on white sits a hair under 3:1, and three things answer to 3:1 rather than 4.5:1: the outline button's border and the focus ring, because a UI boundary carries no words, and the developers template's step numerals, because 26px at weight 700 is large text. This pass fixed the 4.5:1 floor, so the 3:1 one is filed here and pinned in `test/token-contrast.test.ts` rather than quietly changed. It wants its own decision, because the only way to clear it is to move `--primary` itself, which is the one value this pass was built to leave alone.

    Ruby's last two running-text uses went with it. The failed-payout chip and the webhook retry chip were `--ruby` on `--canvas-soft`, 3.21:1, and they now take the pair `EmptyState` and `Modal` already use for the same meaning: `--surface-danger` behind `--text-body`, 14.30:1. So gap 10's claim that ruby is never a text colour is now true of the templates as well as the apps.

    The danger medallion stays at 2.90:1, as gap 10 describes: it is `aria-hidden` and the title beside it carries the state.

    The one component rule that came with it: `Button` renders an `<a>` when it is given an `href`, and `tokens/base.css` declares `a:hover` colour at specificity (0,1,1), which outranks a variant class at (0,1,0). The export is immune because it styles its root inline, but any port that uses classes is not, and in the dashboard the primary label measured **1.00:1 on hover** before this was found, the label the same colour as the ramp under it. A class port has to restate each variant's own colour at `:hover` and `:active`. That is written where it is needed rather than here, because it is a delivery rule, not a design one.

    **The same pass then shipped that defect in the one place it had not looked.** Repointing `--text-link` to `--primary-deep` left `.ak-link--primary:hover` in the dashboard class port still naming `--primary-deep`, so rest and hover became the same colour, 0.00 L* apart, on the sign-in card and on invitation acceptance. `tokens/base.css`, `Link.jsx` and `_ds_bundle.js` all had the fix; the class port was the fourth place and was missed, and the specificity rule above is what stopped the corrected `a:hover` from healing it. The token pairs in `test/token-contrast.test.ts` could not see it, because they assert the token the rule was meant to use. The test now also reads the class port and measures what a state actually moves, over every channel that resolves, with a floor of 2 L*.

    **A second instance of that shape is filed rather than fixed, and it sits on the landing track.** `src/app/legal/legal.css` hovers its body and related links from `--primary-deep` to `--primary-press`, 1.79 L* apart, which is a link hovering to very nearly its own rest colour. Neither state fails the text floor, at 5.18:1, so this is legibility of state rather than of text, and the file is on the lenient track, where a reviewed design's own values stand. Neither endpoint moved in this pass. Changing it is a visual change to a reviewed page and wants its own decision. The state guard reads the dashboard class port only; extending it over the landing stylesheets is the other half of that proposal.

    **A third instance, and it is a focus state rather than a hover one.** `.ak-input--error .ak-input__field:focus-within` pins `border-color` to `--text-danger`, the same value the field carries at rest, while `.ak-input__control` sets `outline: none`. So a field that is already showing an error has no visible focus indicator: a keyboard user tabbing through a failed form cannot see where they are, WCAG 2.2 SC 2.4.7. It arrived with the invitation story and neither E28 commit touched it, so it is filed on the same boundary as the `legal.css` instance above. Two things follow for the proposal. The guard should cover `:focus`, `:focus-visible` and `:focus-within`, not only hover and press, because a focus ring is the one state a user cannot compensate for by moving the pointer. And it should read `outline` alongside the three color channels, since a rule can satisfy a border check and still have removed the indicator that was doing the work.

    **What the guard still cannot see, written down as a gap rather than left as a silence.** `moved()` skips any channel that does not resolve to a literal, which is the fail-safe direction, but a state whose every channel is `transparent`, a white-alpha overlay or a `color-mix()` measures 0.00 and has to be left out of the list entirely. `.ak-link--onDark:hover` and `.ak-nav-item:hover` are both out on those grounds, and both do move on screen. The fix is to resolve alpha over the ground the element is actually drawn on, which the sheet knows and the test does not; until then, absence from that list means unmeasured, not passing.

    **`_ds_manifest.json`'s token catalogue was corrected where this pass had made it false.** Eleven entries published the pre-E28 value of a token this pass moved, `--ink-mute-2` at `#7b899b` and `--cta-gradient` in its old three-stop form among them. That is not the staleness the catalogue is already known for, which is that it is *missing* tokens and can only be completed by an upstream re-export: a value that is present and wrong is a different thing, and this pass is what made these eleven wrong. The thirty-three tokens it omitted before this pass are unchanged, and `--primary-deeper`, `--primary-deepest`, `--cta-on-subdued` and `--cta-gradient-bold-press` join that list, taking it to thirty-seven against 188 catalogued entries. The count is written as before-and-after rather than as one number because the first draft of this line gave the post-pass total as the pre-existing one and then added three more to it, which is the same defect the paragraph is about.

## Index

```
styles.css                    global entry, @import list only
tokens/
  fonts.css                   Google Fonts request (Space Grotesk 700, Inter 400/600)
  colors.css                  brand, ink, surface, gradient stops, semantic aliases
  gradients.css               applied CTA / chrome / feedback gradients, brand-tinted shadows
  typography.css              per-role size / weight / line-height / tracking
  type-roles.css              .ak-display-xxl to .ak-micro-cap role classes, .ak-tnum
  spacing.css                 8px scale plus semantic padding composites
  shape.css                   radius scale plus semantic radii
  elevation.css               levels 0 to 2, wash orb tokens, brand gradients
  motion.css                  durations, easings, loading keyframes
  base.css                    body defaults, link colours, selection
components/
  actions/Button.{jsx,d.ts,prompt.md} + buttons.card.html
  icons/Icon.{jsx,d.ts,prompt.md} + icons.card.html
  surfaces/Card.{jsx,d.ts,prompt.md}, PricingCard.{jsx,d.ts,prompt.md} + cards.card.html
  forms/Input.{jsx,d.ts,prompt.md} + inputs.card.html
  tags/Pill.{jsx,d.ts,prompt.md} + pills.card.html
  navigation/Link, NavBar, Footer {jsx,d.ts,prompt.md} + navigation.card.html
  brand/GradientWash.{jsx,d.ts,prompt.md} + gradient-wash.card.html
  brand/Logo.{jsx,d.ts,prompt.md} + logo.card.html
  app-shell/AppSidebar, AppTopBar {jsx,d.ts,prompt.md} + app-shell.card.html
  feedback/Spinner, Skeleton, ProgressBar {jsx,d.ts,prompt.md} + loading.card.html
  empty/EmptyState.{jsx,d.ts,prompt.md} + empty-state.card.html
  overlays/Modal.{jsx,d.ts,prompt.md} + modals.card.html
templates/                    12 page templates, see the Templates table above
assets/logo.svg               standalone logo tile
guidelines/
  voice.md                    house voice applied to ActiveKit copy
  foundations/                17 specimen cards (Colors, Type, Spacing, Shape, Brand)
SKILL.md                      Agent Skills entry point
thumbnail.html                homepage tile
uploads/DESIGN.md             the source spec
uploads/voice-principles.md   the source voice rules
```
