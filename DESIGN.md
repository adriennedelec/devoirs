---
version: alpha
name: Devoirs Enfants Magical Learning App
description: Child-first homework and learning app. Soft magical educational adventure, API-ready, parent-assisted, playful but serious.
colors:
  background: "#F3EFFF"
  backgroundSoft: "#EEF6FF"
  pageProfile: "#F8F9FF"
  surface: "#FFFFFF"
  surfaceTint: "#FFF8EF"
  primary: "#6D5DFC"
  primaryAccessible: "#4B3BC4"
  primaryDark: "#332A7C"
  secondary: "#4E7DFF"
  sky: "#4CC9F0"
  star: "#FFC83D"
  success: "#22A05A"
  successSoft: "#E6FBEF"
  warning: "#D97706"
  warningSoft: "#FFF4CF"
  error: "#D63D24"
  errorSoft: "#FFF0EC"
  text: "#1F2A44"
  muted: "#667085"
  border: "#E4DEF8"
typography:
  h1:
    fontFamily: Nunito, Quicksand, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 2.25rem
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  h2:
    fontFamily: Nunito, Quicksand, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1.5rem
    fontWeight: 780
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  body:
    fontFamily: Nunito, Quicksand, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.45
  child-large:
    fontFamily: Nunito, Quicksand, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1.125rem
    fontWeight: 760
    lineHeight: 1.25
  helper:
    fontFamily: Nunito, Quicksand, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 0.9rem
    fontWeight: 600
    lineHeight: 1.35
rounded:
  sm: 14px
  md: 18px
  lg: 24px
  xl: 30px
  pill: 999px
spacing:
  xs: 6px
  sm: 10px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primaryAccessible}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 14px
  button-primary-hover:
    backgroundColor: "{colors.primaryDark}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 14px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primaryDark}"
    rounded: "{rounded.md}"
    padding: 12px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: 24px
  exercise-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: 28px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 14px
  badge-star:
    backgroundColor: "{colors.warningSoft}"
    textColor: "{colors.primaryDark}"
    rounded: "{rounded.pill}"
    padding: 8px
  badge-success:
    backgroundColor: "{colors.successSoft}"
    textColor: "#147348"
    rounded: "{rounded.pill}"
    padding: 8px
  badge-error:
    backgroundColor: "{colors.errorSoft}"
    textColor: "#B6321D"
    rounded: "{rounded.pill}"
    padding: 8px
---

## Overview

Devoirs est une application d’aide aux devoirs pour enfants du primaire. Sa direction visuelle est **magical learning adventure** : un univers doux, rassurant, pastel, ludique et guidant, qui transforme les devoirs en petites missions éducatives.

**North star:** “Je pars en mission, je progresse, je gagne des étoiles, et je comprends mes devoirs.”

Le produit doit rester pédagogiquement sérieux, mais ne doit jamais ressembler à un dashboard SaaS adulte. L’enfant doit se sentir encouragé, guidé et en sécurité. Les parents gardent le contrôle sur la préparation, les profils, les prompts, les imports et la validation.

### Inheritance from the global charter

This local charter inherits from `/Users/nedelecadrien/.hermes/design/GLOBAL_DESIGN.md`.

Local Devoirs overrides:

- The visual identity is child-first, pastel and magical, not adult SaaS cockpit.
- Density is lower on child screens; parent/admin screens may be denser but must remain soft.
- Typography uses rounded friendly fonts: Nunito/Quicksand/system fallback.
- Purple/lavender is the main child action color, not the global blue fallback.
- Rewards, stars, avatars, mascots and encouraging copy are core UI primitives.

Global rules that still apply:

- Preserve existing UI/flows unless Adrien explicitly asks for redesign.
- Prefer CSS-only or minimal changes when possible.
- No broad redesign without explicit request.
- Tables require search, filters and useful column sorting when tables exist.
- Verification is proportional to risk.
- Do not invent dependencies or replace the stack without approval.

### Site-specific decisions validated for Devoirs

- **Urgency:** this project is a priority; keep changes small, useful and directly applicable.
- **Child-first:** child screens must be playful, soft and one-action-at-a-time.
- **Parent-assisted:** parent/admin preparation can be more structured, but should not become cold or enterprise-like.
- **Magical but functional:** gradients, stars, mascots and avatars are welcome only when they preserve clarity and learning flow.
- **Sidebar stays:** the app uses a fixed left child navigation on desktop/tablet. Do not revert to a bottom nav unless explicitly requested.
- **Fixed full-height sidebar:** the left menu must descend visually to the bottom of the viewport and remain fixed/sticky on desktop/tablet.
- **Connected user pinned bottom-left:** when authentication exists, the connected user name/logout area is fixed at the bottom-left of the sidebar, never floating in the middle of the menu.
- **Active profile selector:** the active child/user selector is a global control available on every page, currently top-right. It should show the child character/photo immediately before the child's name — not initials when a photo/personnage exists, not the school level, not “profil actif”. Do not hide profile switching inside the Profile page only.
- **Less bold typography:** Devoirs should feel friendly and readable, not visually shouted. Reserve very heavy weights for short key labels/badges; body text, helper text, cards and tables use medium weights.
- **Moderate exercise scale:** exercise questions must be prominent but not oversized; multiplication questions like `7 × 8` should usually stay around `2.6–3.2rem` desktop instead of huge hero typography.
- **Local-first data:** many features use `localStorage` and mock/API-ready service layers. Design must support persistence, export/import and future backend migration.
- **No punitive UX:** errors are treated as “almost there” learning moments, not failures.

## Colors

### Palette roles

- **Background `#F3EFFF`:** main magical pastel lavender canvas.
- **Background Soft `#EEF6FF`:** soft blue secondary background.
- **Profile Page `#F8F9FF`:** calm family/profile area.
- **Surface `#FFFFFF`:** cards, exercises, modals, panels.
- **Surface Tint `#FFF8EF`:** warm reward/mission surfaces.
- **Primary `#6D5DFC`:** magical purple accent and child action color.
- **Primary Accessible `#4B3BC4`:** primary button color when white text is used.
- **Primary Dark `#332A7C`:** headings, strong labels, deep contrast.
- **Secondary `#4E7DFF`:** blue action/learning highlight.
- **Sky `#4CC9F0`:** playful info/audio/reading accent.
- **Star `#FFC83D`:** stars, rewards and positive energy.
- **Success `#22A05A`:** correct, mastered, completed.
- **Warning `#D97706`:** attention, retry, almost-there state.
- **Error `#D63D24`:** correction/error, but never punitive full-screen red.
- **Text `#1F2A44`:** primary readable text.
- **Muted `#667085`:** helper text and metadata.

### Color rules

- Purple is the main child action language.
- Yellow/star is for rewards, points, progress and celebration.
- Green means mastered/correct/completed.
- Orange means “try again / pay attention” without shame.
- Red/error must be limited and softened; never use harsh failure screens for children.
- Parent/admin technical areas may use more white/blue/lavender surfaces, but should remain friendly.
- Do not overuse rainbow colors. Every color must map to learning, progress, profile identity, or state.

### Profile colors

Family/profile colors are stable per profile ID/user. Reuse the same color for:

- profile cards;
- active user/profile chip;
- activity overview dots;
- histogram bars;
- profile list indicators.

A profile color follows the profile, not chart order.

## Typography

### Font direction

Use rounded, friendly, highly readable typography:

```css
font-family: Nunito, Quicksand, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Rules

- Texts are short, direct and in French.
- Child labels must be understandable without adult interpretation.
- Avoid thin weights; use confident rounded weights.
- Minimum comfortable font size for child actions.
- Use strong size hierarchy for the current task/question.
- Parent technical details can be smaller but must remain readable.
- Do not use dense adult dashboard typography on child screens.
- Avoid making most text bold. Default copy is medium; use bold for short labels, active nav, primary CTA and key results only.
- Exercise numbers/questions should be large enough to focus the child, but never so large that they dominate the whole screen or reduce calmness.

### Copy tone

Use:

- “Bravo, tu avances !”
- “Presque ! Regarde encore ce détail.”
- “Super, on continue !”
- “Tu as gagné des étoiles.”

Avoid:

- “Faux.”
- “Erreur.”
- “Raté.”
- shame, pressure, or ranking language.

## Layout

### Shell and navigation

The app uses a left child sidebar on desktop/tablet.

- Sidebar width target: `250px`.
- The sidebar remains visible for core modules, including multiplication, unless Adrien explicitly asks for a fullscreen exception.
- On desktop/tablet the sidebar must extend top-to-bottom (`height: 100vh`) and remain fixed/sticky while page content scrolls.
- The right shell should use the full remaining viewport width when the page needs space: `calc(100vw - 250px)`.
- Do not re-center major child flows in a narrow desktop container if Adrien asked for full-width use.
- On small screens, compact the sidebar/rail while preserving accessible navigation names.

### Active user/profile controls

- The active profile selector is a global top-right control across pages.
- The top-right profile selector displays only the child character/photo immediately followed by the child name. Do not add the school level, role, status, or “profil actif” in that top chip.
- It must allow switching users from non-profile pages without navigating away.
- Avoid decorative online/status dots unless explicitly requested.
- If provisional authentication is active, show connected username and dynamic role label (`Administrateur` or `Utilisateur`) at the bottom of the left sidebar.
- Show logout when authentication exists.
- Show light/dark toggle only if the mode exists; no fake toggle.

### Child screen density

- One main activity per screen or section.
- Large, obvious primary action.
- Few choices visible at once for children.
- Parent preparation sections may be denser but must be grouped into calm cards.
- Do not overload child screens with adult KPIs.

### Width rules

- No global horizontal overflow.
- Full-width modules such as `Dictée` and `Tables` must fill the right shell when appropriate.
- Nested wrappers must not reintroduce narrow max-width constraints when the page is meant to be full-width.
- Long names, prompts, URLs and generated text must wrap inside cards.

## Elevation & Depth

Use soft, friendly depth:

- White cards over pastel background.
- Rounded surfaces with soft shadows.
- Exercise cards feel tactile and safe.
- Avoid harsh black shadows.
- Avoid glassmorphism that reduces readability.

Recommended shadow:

```css
box-shadow: 0 12px 32px rgba(31, 42, 68, 0.08);
```

Interactive cards may lift by 1–2px maximum. Animations must be soft and optional/reduced-motion compatible.

## Shapes

- Main cards: 24–30px radius.
- Exercise cards: 30px radius.
- Inputs/buttons: 18px radius.
- Pills/badges: 999px.
- Avatars/photos: circular or rounded according to profile-photo picker context.
- Avoid sharp corporate corners on child screens.

## Components

### Child app shell

Core shell components:

- `ChildAppShell`
- left child navigation / side nav
- global active profile selector
- optional authenticated sidebar footer
- page-specific main content

Rules:

- Preserve route labels and accessible navigation names.
- Do not remove sidebar during visual redesign unless explicitly asked.
- Screenshots used as visual reference must not rename existing app content/profiles/routes.

### Buttons

- Primary child actions: purple accessible button with white text.
- Secondary actions: white/lavender button with purple text.
- Audio/speech actions may use sky/blue accent.
- Reward actions may use star/yellow accent with dark text.
- Destructive parent/admin actions use softened error styling and confirmation.
- Buttons must be large enough for touch.

### Cards

Card types:

- Mission card.
- Exercise card.
- Reward card.
- Profile/family card.
- Parent preparation card.
- Result/feedback card.
- Activity history card/table wrapper.

Rules:

- Child cards use large radius, soft shadow, clear title, short copy.
- Parent cards can be denser, but must keep the same friendly visual language.
- Cards must not contain too many competing CTAs.

### Forms

Forms differ by audience.

Child forms:

- Very large fields.
- Clear label and hint.
- Minimal simultaneous fields.
- Immediate feedback.

Parent/admin forms:

- Labels above fields.
- Placeholders/examples in gray.
- Comfortable spacing.
- Visible validation.
- Long prompt textareas and generated previews use readable monospace only when useful.
- Prompt editors must make the distinction between template and real interpolated prompt explicit.

### Tables and history lists

Tables are allowed mainly for parent/admin/history views, not as the default child experience.

When a table exists, it inherits the global rule:

- global search when useful;
- filters when the dataset can grow;
- sorting on useful columns;
- readable empty state;
- no horizontal overflow;
- mobile fallback or horizontal-safe card rows.

Specific Devoirs tables:

- Multiplication history: child/profile, table, date/time, correct, wrong, score, elapsed time, per-fact chips.
- Activity history: normal-weight cells and headers when Adrien asks to remove bold; no hidden bold via sort buttons or result pills.
- Database/export pages: clear raw-row table, search/filter/sort, upsert/delete indicators.

### Badges, stars and rewards

- Stars are positive reward currency, shown with real star icons where requested.
- Child profile cards show collected-star totals from activity records, not static profile fixture values.
- Keep lifetime collected stars distinct from future spendable balance.
- Badges must be short and celebratory.
- Locked rewards should feel motivating, not frustrating.

### Feedback components

Feedback must be immediate, kind and specific.

- Correct: green/celebratory with stars.
- Retry: orange/warm “almost” message.
- Error/correction: red only for the specific correction marker, never a punitive screen.
- Completion: summary + reward + next step.

### Modals and drawers

- Use modals for parent edit/create flows, family profile editing, imports and confirmations.
- Use drawers only if the interaction benefits from keeping context visible.
- Modals must fit viewport with internal scrolling.
- Child-critical flows should avoid complex modal stacks.

### Profile and family page

The profile/family page is a product area, not just settings.

Rules:

- Keep existing user names and data; screenshots are visual references only.
- Family banner and profile cards may be rich and visual.
- Profile cards show avatar/photo, name, role, child progress, stars, mission summary and edit action.
- Parents do not require age/school level.
- Children require age and school level.
- Profile display order is explicit and persisted, not inferred from name or insertion order.
- Profile colors must remain consistent across dots and charts.
- Avatar/photo selection is visual and accessible.

### Activity charts

- Charts must be driven by real `ActivityRecord` data when available.
- Demo fallback is acceptable only when database is empty.
- Zeros are true zeros: no fake minimum bar for zero values.
- Y axis and bar scale must match.
- Use profile colors consistently across histogram bars and legends/dots.
- Avoid decorative charts that do not reflect real data.

### Multiplication module

The multiplication screen is a magical exercise, but its functional contract is strict.

Must preserve:

- sidebar visible by default;
- table selector from 2 to 10;
- 9-question session covering factors 2→10;
- QCM with 4 large answers;
- varied/randomized correct-answer position;
- correct intermediate answer auto-advances;
- wrong answer stays on same question with gentle help;
- score based on first-try success;
- final summary and full table review;
- missed facts in red/soft correction style;
- side chronometer starting only on first answer click;
- persisted completed-table history filtered to active profile;
- guard against duplicate history rows after completion.

Visual direction:

- magical violet→pastel-blue gradient;
- white rounded exercise card;
- stars/sparkles/mascot/treasure when useful;
- compact enough to reduce scroll;
- full remaining viewport width beside sidebar.

### Dictée module

Dictation is parent-prepared, child-delivered.

Modes:

- `Dictée de mots` first.
- `Dictée normale` preserved.

Rules:

- Word input splits on common separators: spaces, lines, commas, periods, semicolons, slashes, dashes, apostrophes and punctuation.
- Unknown words show a parent confirmation card.
- OpenAI server-side generation is mandatory for word-dictation text generation when that flow is used; no deterministic “local secours” copy.
- Generated text must be a natural, age-appropriate mini-story, not mechanical “le mot…” sentences.
- Prompt editor remains a reusable template with `{{mots}}`, `{{verbes}}`, `{{temps}}` visible.
- Real prompt preview shows the interpolated prompt sent to the server-side model.
- Do not auto-regenerate when options change; generation is deliberate.
- Show generated text to the parent when requested by current UX, but child delivery remains controlled through reading/audio controls.
- Child text can be masked with bullets while preserving state.
- Reading controls: read text, stop, previous segment, slow child tempo, repeat each phrase twice.
- Always show validation checks (`bons ✅` / `mauvais ⚠️`) even when generated output is imperfect.

### Lecture module

Reading can be AI-generated and recorded.

Pattern:

1. Generate story: `Personnage`, `Animal`, `Objet`, `Lieu`, size `XS/S/M/L/XL/XXL`.
2. Prompt editor: stable placeholders and real prompt preview.
3. Text to read: story card, audio button, start/stop recording, timer.
4. Analysis: transcript, colored word errors, stats table.

Size contract:

- XS = 60–90 words.
- S = 90–150 words.
- M = 150–250 words.
- L = 300–500 words.
- XL = 600–800 words.
- XXL = 1200–1800 words.

If the UI says recording starts, it must attempt real browser SpeechRecognition or provide a clear fallback/manual transcript path.

### Poésie module

Poetry is staged and gentle.

Rules:

- Parent can choose a poem or paste/import text.
- Full poem source remains editable.
- `Écouter` uses browser speech synthesis when supported.
- Child workbench repeats lines line-by-line.
- Line labels can toggle visibility.
- Top/bottom mask controls use a single vertical timeline with non-crossing handles.
- Per-line manual overrides remain possible.
- Recital recording reuses the Lecture recording/analyse pattern.

### Import, OCR and local data

- OCR/import flows must be API-ready services, not hardcoded UI-only logic.
- Show detected content and let parent correct before use.
- Data stored in `localStorage` must be exportable/importable when used as persistent product data.
- Vercel/GitHub does not synchronize local browser storage; design must expose migration/export/import flows when data matters.

### AI and automation

- AI is parent/operator-assisted, not magic replacing the parent.
- Always show prompt/preview/source/confidence/checks when useful.
- Failed AI output should not block the workflow if a reviewable result exists; show checks and allow correction.
- Avoid making child-facing AI feel unpredictable or scary.

## Do's and Don'ts

### Do

- Keep the child experience soft, magical and encouraging.
- Preserve existing functional contracts during visual redesign.
- Use typed/mock/API-ready service boundaries.
- Keep child flows one-action-at-a-time.
- Use real data for charts/history when available.
- Keep profile switching global and accessible.
- Use full-width shells for modules that need space.
- Verify no horizontal overflow after layout changes.
- Update README/DESIGN/CADRAGE when product behavior changes.

### Don't

- Do not make child screens look like adult SaaS dashboards.
- Do not remove the sidebar, QCM flow, table selector, history, profile persistence or final summaries during redesign.
- Do not use punitive language.
- Do not use fake decorative stats when activity data exists.
- Do not rely only on prompt wording for LLM correctness; keep software checks.
- Do not hide data persistence behind browser-local assumptions.
- Do not create tables without search/filter/sort when they are operational parent/history tables.
- Do not add broad libraries or redesign systems without approval.

## Functional Block Inventory

This local charter covers current and future blocks:

- Child shell/sidebar/global profile switcher.
- Dashboard/home missions.
- Learning path/worlds.
- Rewards/shop/stars/badges.
- Multiplication tables and history.
- Dictation normal and word-dictation.
- Reading generation/recording/analysis.
- Poetry selection/memorization/recital.
- Profile/family management.
- Avatar photo picker and source assets.
- Activity database and raw data page.
- Settings/reward rules.
- Export/import local data.
- Parent/admin preparation areas.
- OCR/import panels.
- AI prompt editors and generated previews.
- Empty/loading/error/success states.
- Responsive/full-width shell rules.

## Agent Instructions

Before editing UI in this repo, agents must:

1. Read `/Users/nedelecadrien/.hermes/design/GLOBAL_DESIGN.md`.
2. Read this local `DESIGN.md`.
3. Apply `child-learning-webapp-development` project rules.
4. Inspect existing CSS in `src/styles/tokens.css`, `src/styles/base.css`, and `src/styles/child-app.css`.
5. Preserve current feature contracts unless Adrien explicitly asks for a behavior change.
6. If a screenshot is used as reference, copy visual style only; do not rename routes, profiles, or product data.

Verification is proportional:

- Charter-only edits: run `npx -y @google/design.md lint DESIGN.md`.
- Micro visual edits: targeted tests/source review when relevant.
- Medium/significant UI edits: `npm test`, `npm run build`, and browser smoke on `5175` if route accessible.
- Child-critical flows: browser smoke the exact interaction and check console errors.

## Visual QA Checklist

Before declaring Devoirs UI work done:

- Does the screen still feel child-first, not adult dashboard?
- Is copy supportive and in French?
- Is the sidebar/navigation preserved where expected?
- Is the global profile selector still available?
- Is there no horizontal overflow?
- Are long names/prompts/texts wrapped inside cards?
- Are buttons large enough for touch?
- Are errors gentle and actionable?
- Are tables/history views searchable/filterable/sortable when operational?
- Are profile colors/stars/charts consistent with real data?
- Did the change preserve localStorage/API-ready service contracts?
- Did verification match the risk of the change?
