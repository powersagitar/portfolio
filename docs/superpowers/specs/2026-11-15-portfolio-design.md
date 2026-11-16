# Portfolio rebuild — design

Date: 2026-11-15 · Status: approved

## Intent

Replace the live www.mohandong.com (today: the `portfolio` branch of
`powersagitar/mssg`, a generic docs-style mSSG site) with a bespoke portfolio
built from the "Mohan Dong — Portfolio" canvas design. The new site is a black,
type-led index of six rows (About, Hack the Badge, how-to, mssg, Writing,
Contact) with a three.js dot cloud behind it that morphs into a shape for
whichever row is hovered or open. Blog posts get their own pages.

The dot clouds are the signature of the site and will keep growing (one per
future project), so how to make one is documented from first principles and
adding one is a small, self-contained change.

## Sources

- **Design** (canonical look and behaviour), copied into this repo:
  `docs/superpowers/specs/2026-11-15-portfolio-design-source/Main.dc.html`
  (home; the phone artboard is the same file at 390px with Hack the Badge open)
  and `Post.dc.html` (post template). They are self-contained HTML + a
  `Component` class with the Canvas 2D renderer — port its numbers, not its
  rendering method. `{{…}}` holes and `DCLogic` are the design tool's runtime,
  not something to reproduce.
- **Posts**: `content/blog/**.mdx` on the `portfolio` branch of
  `powersagitar/mssg` (`gh api` or `gh repo clone powersagitar/mssg -- --branch
  portfolio`). Three posts:
  - `2025/03/09/we-dream-high.mdx`
  - `2025/01/16/mastermind.mdx`
  - `2024/02/01/decoding-conditionals.mdx`

## Goals

1. Home page matching `Main.dc.html` at desktop and phone widths: hero, the six
   accordion rows and their panels, footer, and the dot cloud with all seven
   shapes (home dust, about/neural net, badge/lanyard, how-to/prompt,
   mssg/stacked pages, writing/quill writing "hello world", contact/Earth + constellation)
   including the two animated overlays (network forward pass; satellite laser
   links with a routed message).
2. A post page per MDX post matching `Post.dc.html`, with the quill cloud
   top-right.
3. Post bodies moved over **unchanged** in text.
4. Old URLs keep working: `/blog/YYYY/MM/DD/slug` stays the post URL; `/rss.xml`
   keeps existing.
5. `docs/dot-clouds.md`: first principles for designing a cloud plus the exact
   steps to add one.

## Non-goals

- Light mode or a theme toggle (the design is dark only).
- The mssg chrome: sidebar, table of contents, drawer, directory listings,
  tags, the decorative 404 trace.
- A CMS or any runtime data fetching; everything is pre-rendered.
- Deployment: pushing, Vercel configuration, the domain switch.
- Per-post social share images.

## Anti-goals (would be a failure even if it "works")

- Any edit to post prose.
- Breaking an existing post URL or the feed URL.
- A cloud that stutters, or that blocks reading the page: the canvas is
  decoration (`aria-hidden`, `pointer-events: none`) and the page is fully
  usable if WebGL is unavailable or the cloud fails.
- Looking templated: shadcn defaults leaking through (rounded grey cards, zinc
  borders, default focus rings) instead of the design's own styling.

## Constraints

- **Stack**: Next.js (App Router, latest 16.x), Next's own MDX support
  (`@next/mdx`), shadcn/ui, three.js, Tailwind CSS v4, TypeScript.
- **Bun only** as package manager, script runner and runtime: `bun install`,
  `bunx`, scripts run as `bun --bun next dev|build|start`; no npm/pnpm/yarn
  lockfiles, no Node invocations. Turbopack does the bundling (Next.js has no
  Bun bundler option; the user accepted this).
- **All code under `src/`** (`create-next-app --src-dir`); `@/` → `src/`.
- **Content decoupled from code**: posts live in a top-level `content/`
  directory, a sibling of `src/` (data, not logic). Code reaches it through an
  alias (e.g. `@content/*` → `content/*` in `tsconfig.json`) or a path
  resolved from the project root in `src/lib/posts.ts`; nothing under
  `content/` imports code from `src/` (MDX components are supplied by
  `src/mdx-components.tsx`).
- Conventions carried from mssg: kebab-case frontmatter keys, `type` over
  `interface`, Prettier with sorted imports (React/Next → third-party → `@/` →
  relative) and Tailwind class sorting, ESLint (`eslint-config-next`), keep
  filesystem access in `server-only` modules under `src/lib/`.
- `prefers-reduced-motion: reduce` honoured exactly as the design does.

## Approaches considered

1. **New app in this repo with `@next/mdx`** — *chosen.* Fresh
   `bun create next-app --src-dir`; posts live in a top-level `content/blog/` and are
   imported by one dynamic route; home is a TSX page. Fits "Next's MDX support"
   and "everything under `src/`", keeps the URLs, carries no unused chrome.
   Cost: Turbopack requires remark/rehype plugins to be referenced by name
   (serialisable options).
2. **Fork mssg `portfolio` and restyle** — rejected: inherits routing, RSS and
   sitemap, but most of its UI (sidebar, TOC, drawer, listings, theme toggle)
   would be ripped out, and it compiles MDX itself with `@mdx-js/mdx` rather
   than through Next.
3. **Option 1 with each post as its own `page.mdx` under `src/app/blog/…`** —
   rejected: simplest routing, but the home Writing list and the post-page
   "n of 3 / Next" navigation need a post index, which would become
   hand-maintained.

## What the user decided

- Option 1, `@next/mdx`, Bun-only (Turbopack bundling accepted), sources in
  `src/`.
- The site replaces www.mohandong.com; it need not be a single-page app — posts
  open on their own pages.
- shadcn style need not match mssg's; use whatever fits this design best.
- Implementation via subagent-driven development.
- Callouts are `<Callout>` JSX in the posts, not directives.
- Content lives in top-level `content/`, decoupled from `src/`.
- Scope ends at a site that builds, lints, tests and runs locally with
  `bun`; deployment and the domain switch are the user's and out of scope
  (no remote, no Vercel changes).
- The design is otherwise as drawn.

## The design, as the build must deliver it

### Routes

| Route | Source | Notes |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Home index. |
| `/blog/[yyyy]/[mm]/[dd]/[slug]` | `src/app/blog/[yyyy]/[mm]/[dd]/[slug]/page.tsx` | `generateStaticParams` from the post index; `dynamicParams = false`. |
| `/blog` | redirect | *Builder's call (minor):* permanent redirect to `/#writing`; home opens the Writing row when the hash is `#writing`. |
| `/rss.xml` | route handler, `force-static` | Full-content feed of all posts (mssg used the `feed` package; any equivalent is fine). Item `id`/`guid` and `link` stay exactly as mssg emitted them (absolute `https://www.mohandong.com/blog/YYYY/MM/DD/slug`) so readers don't re-surface old posts. |
| `/icon` | `app/icon.tsx` or a static file | Favicon in the design's language (white dots on black). Text-only OpenGraph/Twitter metadata site-wide; no generated share images. |
| `/sitemap.xml`, `/robots.txt` | `app/sitemap.ts`, `app/robots.ts` | |

Post files: `content/blog/YYYY/MM/DD/<slug>.mdx` (repo root, beside `src/`), the URL derived from the
path. Frontmatter as in mssg (`title`, `description`, `publish-date`,
`last-edited`). A `server-only` module (`src/lib/posts.ts`) globs them, reads
frontmatter, and returns posts sorted newest first; it is the single source for
the home list, post navigation, feed, sitemap and metadata.

### Visual language (both pages)

Taken from the design's CSS; treat its values as the spec.

- Background `#000`; text `#f5f5f7`; secondary `#d1d1d6`; muted `#86868b`;
  dim-on-hover `#6e6e73`; rules `#2c2c2e` (row borders) and `#1d1d1f` (inner
  rules); link underline `#48484a` → `#f5f5f7` on hover, 1px, offset 5px.
- Sans: `-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui`.
  Mono: `"SF Mono", ui-monospace, "Geist Mono", Menlo`. Inter and Geist Mono
  load via `next/font` as the non-Apple fallbacks. The Hack the Badge card
  additionally uses Space Grotesk and JetBrains Mono (its own sub-brand).
- Type scale, spacing, clamp() sizes, borders, radii, transitions and the
  `max-width: 700px` phone breakpoint exactly as in the design's `<style>`.
- **shadcn/ui**: initialise with base colour `neutral`, CSS variables on,
  dark-only tokens mapped to the palette above (`--background: #000`,
  `--foreground: #f5f5f7`, `--muted-foreground: #86868b`, `--border: #2c2c2e`,
  `--ring: #f5f5f7`, …). Pick the CLI style with the least built-in decoration
  (builder's call). Use primitives where they carry behaviour: **Accordion**
  (Radix, `type="single" collapsible`) for the index rows; **Button** with
  `asChild` for the pill links (`.btn`, `.htb-pill` variants via `cva`). Style
  them to the design, not the other way round.

### Home (`Main.dc.html`)

- **Hero**: full-viewport section; top meta row (mono, uppercase, muted)
  "Index — 06" / "mohandong.com"; name "Mohan / Dong" at
  `clamp(76px,15.5vw,248px)`; below it "Software Engineering, University of
  Waterloo." and "Design. Develop. Deliver." (mono).
- **Index**: an ordered list of six accordion rows. Each row header is a real
  button: number (mono), title at `clamp(44px,7.4vw,116px)`, meta (mono
  uppercase), and a plus icon that rotates 45° when open. Hovering any row
  dims the other titles to `#6e6e73`. Panels open with the design's
  `grid-template-rows 0fr → 1fr` transition (0.6s, `cubic-bezier(.2,.8,.2,1)`)
  and are `visibility: hidden` while closed. One open at a time, all may be
  closed. Panel contents exactly as drawn:
  - 01 About — spec list (Studying, Experience, This term, Writes, Setup).
  - 02 Hack the Badge — the dotted-grid card with its own fonts and purple
    accents; "Open emulator ↗" (filled) and "Source ↗" pills.
  - 03 how-to — lede, mono tags, Source / Homebrew tap buttons, install code
    block.
  - 04 mssg — lede, tag, Source button.
  - 05 Writing — superscript post count; one row per post (date, title, →)
    linking to its page; generated from the post index, newest first.
  - 06 Contact — spec list: email, résumé, GitHub, LinkedIn.
- **Footer**: "© 2026 Mohan Dong · Share with attribution" (mono, muted). The
  year is the build year.
- **Phone** (`≤700px`): layout per the design's media query; cloud at 0.6
  opacity and positioned top-centre.

### Post page (`Post.dc.html`)

- Top bar: "← Index" link to `/`, and "05 Writing · n of N" where n is the
  post's 1-based position in the newest-first list.
- Header: date (mono), headline, subhead. *Builder's call (minor):* headline =
  `title` up to the first `": "`; subhead = the rest of the title if there is
  one, else `description`. (The home list shows the full title.)
- Body: the MDX rendered in a 680px column with the design's `.body` styles
  for `p`, `h2`, `pre`, `blockquote`, inline `code` and links; plus sensible
  styles in the same language for elements the design doesn't draw but posts
  use (`h3`, lists, `hr`/`* * *`, emphasis, images, tables).
- "Next" block: the next post in the list (wrapping to the first), shown as
  "n/N" + title + →.
- Footer as home.
- Cloud: the writing (quill) shape, 900 points, writing "hello world" once
  from page load (timed from mount, not selection), own canvas top-right
  (46vw × 620px; phone: full width × 420px at 0.5 opacity), rocking with
  `ry = sin(t·0.3)·0.5`.
- `generateMetadata` from frontmatter (title, description, canonical URL,
  `article` OpenGraph with published time).

### MDX

- `@next/mdx` with `pageExtensions` including `mdx`, configured for Turbopack.
  Plugins: `remark-frontmatter` + a frontmatter export (e.g.
  `remark-mdx-frontmatter`), `remark-gfm`,
  `rehype-slug`, `rehype-autolink-headings`, `rehype-pretty-code` (a dark Shiki
  theme whose background is overridden to the design's `#0d0d0d`/`#1d1d1f`
  code block), `rehype-external-links`. Drop math (no post uses it).
- Two posts use `:::callout{type=note}` blocks. Convert them to
  `<Callout type="note">…</Callout>` JSX (user's decision, for flexibility) —
  the only permitted change to the post files; the prose inside stays
  byte-identical. `Callout` is styled in the design's language. No
  `remark-directive` and no directive plugin.
- `src/mdx-components.tsx` maps HTML elements and `Callout`.

### Dot cloud engine (three.js)

One small engine in `src/components/dot-cloud/` (client-only, dynamically
imported with `ssr: false`) behaviour-matching the design's `frame()`:

- **Scene**: a fixed full-viewport canvas behind the home content (sticky
  stage, `z-index: 0`, `pointer-events: none`, `aria-hidden`); its own canvas
  on post pages. `devicePixelRatio` capped at 2. Rendering pauses when the tab
  is hidden.
- **Points**: one `THREE.Points` of N = 1200 (home) with a custom
  `ShaderMaterial`: square, unlit `#f5f5f7` dots; size `(0.9 + f)·dpr` device
  px where `f = 3/(3+z)` is the design's perspective factor; alpha
  `clamp((1.2 − z)/2, 0.12, 1)`, ×0.6 while on home. The design's own
  projection (rotate Y then X, `f = 3/(3+z)`, separate x/y scale) is
  reproduced exactly — in the vertex shader or by matching a camera to it;
  builder's call, but on-screen size and placement must match.
- **Morphing**: each point eases toward its index in the target shape with a
  per-point rate in [0.035, 0.095] per 60 Hz frame (make it frame-rate
  independent: `1 − (1 − k)^(dt·60)`). Home adds per-axis sine drift
  (amplitude 0.18, frequencies 0.12–0.42, random phases).
- **View**: spin rate per shape (home 0.02 rad/s, contact 0.06, others 0.2;
  about and writing ease to a fixed angle with a gentle sway), base tilt per shape (about
  −0.08, contact −0.38, others −0.2), pointer parallax (±0.3 ry, ±0.15 rx).
  Layout: shapes centred at 71% width / 50% height (phone: 50% / 36%) at scale
  `min(W·0.58, H)·0.34` (phone `min(W, H·0.72)·0.34`); home dust blends to
  fill the viewport. All blends ease as in the design (0.05–0.06 per frame).
- **Overlays** (`LineSegments` + small point sprites), faded in/out with their
  shape: the network's edges (alpha 0.14) and forward-pass pulses; the
  constellation's 6×10 satellites, in-plane and cross-plane laser links
  (alpha 0.16), the routed ground→hops→ground path (alpha 0.7) and the moving
  message dot — with Earth occlusion (anything behind the globe's disc is
  hidden) as in the design.
- **Animated target (writing / quill)**: the target itself changes over time.
  Points split by index (`i % 20`): 0–1 the quill's curved shaft, 2–8 its
  tapered vanes, 9–19 ink on a cursive "hello world" path (Catmull-Rom
  through the design's control points, two strokes, arc-length LUT; ink
  points never sample the pen lift between the words). Each ink point keeps
  its arc-length parameter `u`. On selection, progress
  `p = easeInOutQuad(clamp(t/5.5))` from the moment the key became
  `writing`; ink point sits at `pen(min(u, p))` (bunched at the nib until
  written), the quill is translated so its nib rides `pen(p)`. It writes once
  and stays finished; re-selecting restarts it. Reduced motion: `p = 1`.
  Port `buildPen`, `penAt` and `inkFrame` exactly.
- **Selection**: home passes the active key from the accordion: hover/focus of
  a row sets it; leaving the list reverts to the open row, else `home`.
  Clicking toggles open and sets the key.
- **Reduced motion**: no drift, no spin (fixed ry 0.6), instant morphs, no
  pulses or message dot.
- **Cloud modules**: each shape is one file in `src/components/dot-cloud/shapes/`
  exporting a definition with: `id`; `build(n, rng) → Float32Array` (xyz per
  point, deterministic given the seeded `rng`); optional `view` overrides
  (spin, tilt, sway); optional `animate(base, out, tSinceSelected, reduce)`
  for shapes whose target moves (writing), with any per-point data it needs
  (e.g. ink `u`) produced by `build`; optional `overlay` (a factory returning
  three.js objects and a per-frame `update`). A registry maps row ids to shapes; adding
  a cloud = one shape file + one registry line + one row. Shape builders are
  pure and have `bun test` unit tests (length, bounds, determinism).

### `docs/dot-clouds.md` — first principles

Written for someone adding the next project's cloud. Covers:

1. **Unit space**: the coordinate box shapes live in (≈ x ±1.5, y ±1.05,
   z ±1), why shapes should stay within ±0.9 to survive rotation and
   parallax, and the projection that maps it to the screen.
2. **Point budget**: every shape gets exactly N points; points are identities,
   so index i travels from shape to shape — allocate contiguous index ranges
   to parts (e.g. 82% board, 18% lanyard) and distribute by area/length so
   density reads as even.
3. **Sampling recipes** with the design's examples: uniform volume (home
   dust, badge board), surface (Fibonacci sphere for Earth), ball clusters
   (`cbrt` radius for neural-net nodes), line segments with jitter (prompt,
   lanyard, edges), layered planes (mssg pages), parametric curves (orbits),
   splines with an arc-length table (the quill's ink path).
4. **Silhouette first**: a cloud must read as its subject at a glance, mostly
   from its 2D outline; thin depth (z jitter) adds volume without blurring the
   silhouette; test it rotating, at phone size and with reduced motion
   (ry 0.6).
5. **Depth and density**: how perspective size and depth alpha work, and why
   near-uniform density matters more than point count.
6. **Motion and meaning**: when to add an overlay (structure that points
   can't show: edges, links, signals), keeping overlays sparse and faint, and
   making them respect reduced motion and occlusion; and animated targets
   (the quill writing), where points carry a parameter along a path and the
   target is recomputed per frame from time-since-selected.
7. **Determinism and performance**: seeded rng, build once, no per-frame
   allocation.
8. **Checklist** to add a cloud: shape file, registry entry, row, test,
   doc entry with a one-line description of the subject.

### Tooling

- `package.json` scripts: `dev`, `build`, `start` (`bun --bun next …`),
  `lint`, `prettier`, `prettier:check`, `test` (`bun test`).
- Husky + lint-staged running Prettier, as in mssg.
- `@vercel/analytics` as on the live site (deploy target stays Vercel).
- A `CLAUDE.md` for this repo describing the above.

## Left to the builder

- Exact shadcn CLI style and how far to wrap primitives.
- Whether the projection lives in the vertex shader or a matched camera,
  provided output matches the design.
- File/component breakdown below the module boundaries named here.
- The feed library, Shiki theme, and the styles for post elements the design
  doesn't draw (in the design's language).
- Calls marked *builder's call (minor)* above.
