# Portfolio Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild www.mohandong.com as a Next.js site that matches the
"Mohan Dong — Portfolio" design: a black index page with six accordion rows
over a morphing three.js dot cloud, plus one page per MDX blog post.

**Architecture:** Next.js 16 App Router, statically pre-rendered. Posts are
MDX in a top-level `content/` (data), compiled by `@next/mdx`. The code lives in
`src/`. The dot cloud is split into a pure simulation (shapes, morphing, view,
overlays and projection to screen pixels, all unit-tested with `bun test`) and
a thin three.js renderer that draws the simulation's screen-space dot and line
batches.

**Tech Stack:** Bun 1.4 (package manager + runtime), Next.js 16.4, React 19,
`@next/mdx`, Tailwind CSS v4, shadcn/ui (Radix), three.js 0.187, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-15-portfolio-design.md` (approved).
Design sources: `docs/superpowers/specs/2026-11-15-portfolio-design-source/Main.dc.html`
and `Post.dc.html`. Line references below (`Main:265`) point into these files.

## Global Constraints

- Bun only: `bun install`, `bunx`, `bun --bun …` for every script. No
  `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, and no `node`/`npx` calls.
  Turbopack bundles (accepted).
- All code under `src/`; posts under top-level `content/`. Aliases:
  `@/*` → `src/*`, `@content/*` → `content/*`. Nothing in `content/` imports
  from `src/`.
- Frontmatter keys are kebab-case: `title`, `description`, `publish-date`,
  `last-edited`.
- `type` instead of `interface`. Prettier: `singleQuote`, `semi`,
  `trailingComma: 'all'`, import order React → Next → third-party → `@/` →
  `@content/` → relative, Tailwind class sorting. Filesystem access only in
  `server-only` modules under `src/lib/`.
- Palette: bg `#000`, text `#f5f5f7`, secondary `#d1d1d6`, muted `#86868b`,
  hover-dim `#6e6e73`, row rule `#2c2c2e`, inner rule `#1d1d1f`, link
  underline `#48484a`, code bg `#0d0d0d`. Phone breakpoint `max-width: 700px`.
  Dark only.
- Post prose is never edited. The only change to post files: each
  `:::callout{type=note}` … `:::` block becomes `<Callout type="note">` …
  `</Callout>`, with a blank line after the opening tag and before the closing
  tag, and the two trailing spaces removed from the lines inside.
- Post URLs: `/blog/YYYY/MM/DD/slug`. Feed at `/rss.xml`. Item `id` and `link`
  = `https://www.mohandong.com/blog/YYYY/MM/DD/slug`.
- The cloud canvas is `aria-hidden`, `pointer-events: none`, and the page works
  without it (no WebGL, or an error).
- `prefers-reduced-motion: reduce`: no drift, fixed `ry = 0.6`, instant morphs,
  no pulses, no message dot, writing already finished.
- Out of scope: deployment, git remotes, Vercel settings, share images.

## Review Focus

1. **YAML dates.** `gray-matter` parses an unquoted `publish-date: 2024-02-01`
   into a JS `Date`. The post index must turn it back into the string
   `'2024-02-01'` and never shift the day (UTC). Test in Task 2.
2. **Closed panels must not be tabbable.** Keyboard users tabbing through the
   index must not land on links inside closed panels. The design hides them
   with `visibility: hidden`. Radix Accordion with `forceMount` keeps them in
   the DOM, so check it in Task 5.
3. **Re-selecting Writing restarts the quill.** Hover Writing, wait, hover
   About, then hover Writing again: it must write again from the start. A
   restart while it is morphing must not jump. Test in Task 9.
4. **Crossing the 700px breakpoint and changing DPR.** Resizing the window, or
   moving it to another monitor, must re-layout the cloud: the phone layout at
   ≤700 CSS px, a sharp canvas at the new DPR (capped at 2), and no stretching.
   Test the layout boundary in Task 6 and check resizing in Task 11.
5. **No WebGL.** If `WebGLRenderer` creation throws, or the context is lost,
   the page must render normally with no console error spam. Check in Task 11.

---

## File Structure

```
package.json, bun.lock, bunfig.toml, next.config.ts, tsconfig.json,
eslint.config.mjs, prettier.config.js, .prettierignore, postcss.config.mjs,
components.json, .husky/pre-commit, CLAUDE.md
content/blog/2025/03/09/we-dream-high.mdx
content/blog/2025/01/16/mastermind.mdx
content/blog/2024/02/01/decoding-conditionals.mdx
docs/dot-clouds.md
src/
  mdx-components.tsx                    element + Callout map for @next/mdx
  app/
    layout.tsx                          fonts, metadata base, <body>, Analytics
    globals.css                         Tailwind v4, shadcn tokens, component classes
    page.tsx                            home (server): posts → <IndexList>
    blog/[yyyy]/[mm]/[dd]/[slug]/page.tsx  post page
    rss.xml/route.tsx                   feed
    sitemap.ts, robots.ts, icon.tsx
  lib/
    utils.ts                            shadcn cn()
    post-meta.ts (+ .test.ts)           pure post helpers
    posts.ts (+ .test.ts)               server-only fs index of content/blog
    feed.ts (+ .test.ts)                pure feed builder
    render-static.ts                    server-only react-dom/server shim
  components/
    ui/accordion.tsx, ui/button.tsx     shadcn primitives (restyled)
    mdx/Callout.tsx
    site/Footer.tsx, site/MetaRow.tsx
    home/Hero.tsx, home/IndexList.tsx (client), home/panels/*.tsx
    post/PostHeader.tsx, post/NextPost.tsx
    dot-cloud/
      types.ts                          shared types (Task 6)
      rng.ts, math.ts (+ tests)         seeded rng, easing, projection, layout, dot style
      shapes/home.ts about.ts badge.ts howto.ts mssg.ts contact.ts (+ shapes.test.ts)
      shapes/pen.ts, shapes/writing.ts (+ writing.test.ts)
      overlays/network.ts, overlays/constellation.ts (+ overlays.test.ts)
      registry.ts                       CloudKey → ShapeDef
      simulation.ts (+ .test.ts)        home + post simulations
      renderer.ts                       three.js batch renderer
      DotCloud.tsx                      client component (loop, input, resize)
      index.tsx                         next/dynamic ssr:false wrapper
```

---

### Task 1: Scaffold the Bun + Next.js project

**Files:**
- Create: everything create-next-app emits, plus `bunfig.toml`, `prettier.config.js`, `.prettierignore`, `.husky/pre-commit`, `CLAUDE.md`
- Modify: `package.json`, `tsconfig.json`, `.gitignore`

**Interfaces:**
- Produces: `bun run dev|build|start|lint|prettier|prettier:check|test`; aliases `@/*`, `@content/*`.

- [ ] **Step 1: Scaffold in a scratch folder.** create-next-app refuses a
  folder that already has `docs/`, so run
  `bun create next-app@16.4.6 "$TMPDIR/portfolio-app" --ts --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*" --use-bun --yes --skip-install`
  and copy it in with `rsync -a --exclude .git "$TMPDIR/portfolio-app/" ./`.
  Keep `docs/` and `.claude/` untouched.
- [ ] **Step 2: Set scripts in `package.json`.**
  `dev: "bun --bun next dev"`, `build: "bun --bun next build"`,
  `start: "bun --bun next start"`, `lint: "bun --bun eslint ."`,
  `prettier: "bun --bun prettier --write --ignore-unknown ."`,
  `prettier:check: "bun --bun prettier --check --ignore-unknown ."`,
  `test: "bun test"`, `prepare: "husky"`. Add `"packageManager": "bun@1.4.4"`
  and a `lint-staged` entry `{ "*": "bun --bun prettier --write --ignore-unknown" }`.
- [ ] **Step 3: Add the `@content/*` alias** (`"./content/*"`) to
  `tsconfig.json` `paths`, and add `content/**/*.mdx` to `include`.
- [ ] **Step 4: Tooling.** Create `bunfig.toml` with `[test] root = "./src"`.
  `prettier.config.js`: the Global Constraints options, with
  `@trivago/prettier-plugin-sort-imports` (importOrder
  `['^(react|react-dom)(/.*)?$','^(next)(/.*)?$','<THIRD_PARTY_MODULES>','^@/','^@content/','^[./]']`,
  separation and sorted specifiers on), `prettier-plugin-tailwindcss` last,
  and `*.md`/`*.mdx` overrides with `printWidth: 80, proseWrap: 'always'`.
  `.prettierignore`: `docs/superpowers/specs/*-design-source/`, `.next/`,
  `bun.lock`. Then `bun add -d prettier @trivago/prettier-plugin-sort-imports prettier-plugin-tailwindcss husky lint-staged @types/bun`,
  `bunx husky init`, and set `.husky/pre-commit` to `bunx lint-staged`.
- [ ] **Step 5: Write `CLAUDE.md`.** Cover commands, the `src/` vs `content/`
  split, Bun-only, and the conventions from Global Constraints. Task 12
  extends it.
- [ ] **Step 6: Verify.** Run `bun install && bun run build && bun run lint && bun run prettier:check`.
  Expected: all exit 0. `ls` shows only `bun.lock` as a lockfile.
- [ ] **Step 7: Commit.** `git add -A && git commit -m "chore: scaffold Next.js app on Bun"`

---

### Task 2: Posts as content, and the post index

**Files:**
- Create: `content/blog/**` (3 posts), `src/lib/post-meta.ts`, `src/lib/post-meta.test.ts`, `src/lib/posts.ts`, `src/lib/posts.test.ts`

**Interfaces:**
- Produces (`src/lib/post-meta.ts`, pure, client-safe):
  ```ts
  export type PostParams = { yyyy: string; mm: string; dd: string; slug: string };
  export type Post = PostParams & {
    path: string;            // '/blog/2024/02/01/decoding-conditionals'
    title: string; description: string;
    publishDate: string;     // 'YYYY-MM-DD'
    lastEdited?: string;     // 'YYYY-MM-DD'
  };
  export function postPath(p: PostParams): string;
  export function toIsoDate(v: unknown): string;   // Date | 'YYYY-MM-DD' → 'YYYY-MM-DD' (UTC); throws otherwise
  export function splitTitle(title: string, description: string): { headline: string; subhead: string };
  export function sortNewestFirst(posts: Post[]): Post[];  // publishDate desc, then slug asc
  export function postPosition(posts: Post[], path: string): { index: number; total: number; next: Post };  // index 1-based in newest-first; next wraps
  ```
- Produces (`src/lib/posts.ts`, `import 'server-only'`):
  `export function getPosts(dir?: string): Post[]` (defaults to `path.join(process.cwd(), 'content/blog')`, newest first, cached per process) and
  `export function getPost(p: PostParams): Post | undefined`.

- [ ] **Step 1: Copy the posts.** Run
  `gh api repos/powersagitar/mssg/contents/content/blog/<y>/<m>/<d>/<slug>.mdx?ref=portfolio -H 'Accept: application/vnd.github.raw'`
  for each of the three posts into `content/blog/<y>/<m>/<d>/<slug>.mdx`.
  Convert the two callout blocks as described in Global Constraints (one is in
  `mastermind.mdx`, one in `decoding-conditionals.mdx`). Check with
  `git diff --no-index` against the fetched originals: the only differences
  are the callout open and close lines, the blank lines and the trailing
  spaces.
- [ ] **Step 2: Write the failing tests.** In `post-meta.test.ts`:
  - `postPath({yyyy:'2024',mm:'02',dd:'01',slug:'decoding-conditionals'})` → `'/blog/2024/02/01/decoding-conditionals'`.
  - `toIsoDate(new Date('2024-02-01T00:00:00Z'))` → `'2024-02-01'`, `toIsoDate('2025-03-09')` → `'2025-03-09'`, `toIsoDate(42)` throws.
  - `splitTitle('Decoding Conditionals: A Dive into if-else, switch-case, Lookup Tables, and Interfaces', 'd')` → `{ headline: 'Decoding Conditionals', subhead: 'A Dive into if-else, switch-case, Lookup Tables, and Interfaces' }`.
  - `splitTitle('Mastermind—The ICS4U Culminating Project', 'We finished…')` → `{ headline: 'Mastermind—The ICS4U Culminating Project', subhead: 'We finished…' }`.
  - `splitTitle('A: B: C', 'd')` → `{ headline: 'A', subhead: 'B: C' }`.
  - With three posts dated 2025-03-09, 2025-01-16 and 2024-02-01: `postPosition(sorted, oldest.path)` → `{ index: 3, total: 3, next: newest }`, and `postPosition(sorted, newest.path).next` is the 2025-01-16 post.

  In `posts.test.ts`, run against the real `content/blog`:
  - `getPosts()` has 3 entries, in the order we-dream-high, mastermind, decoding-conditionals.
  - Each `publishDate` is a `'YYYY-MM-DD'` string that equals its path's `yyyy-mm-dd`.
  - `getPost({yyyy:'2024',mm:'02',dd:'01',slug:'nope'})` → `undefined`.
  - A temporary directory with a post that is missing `title` → `getPosts(tmp)` throws an error that names the file.
- [ ] **Step 3: Run to verify they fail.** `bun test src/lib` → FAIL (modules missing).
- [ ] **Step 4: Implement `post-meta.ts` and `posts.ts`.** `posts.ts` walks
  `dir` as `YYYY/MM/DD/<slug>.mdx` with `fs.readdirSync`, skipping names that
  start with `_`. It parses frontmatter with `gray-matter` (`bun add gray-matter server-only`)
  and validates that `title`, `description` and `publish-date` are present.
- [ ] **Step 5: Run to verify they pass.** `bun test src/lib` → PASS.
- [ ] **Step 6: Commit.** `git commit -am "feat: posts content and index"` (stage `content/` too).

---

### Task 3: MDX pipeline, design tokens and the post page (no cloud yet)

**Files:**
- Create: `src/mdx-components.tsx`, `src/components/mdx/Callout.tsx`, `src/components/site/Footer.tsx`, `src/components/site/MetaRow.tsx`, `src/components/post/PostHeader.tsx`, `src/components/post/NextPost.tsx`, `src/app/blog/[yyyy]/[mm]/[dd]/[slug]/page.tsx`, `components.json`, `src/lib/utils.ts`
- Modify: `next.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: `getPosts`, `getPost`, `splitTitle`, `postPosition` (Task 2).
- Produces: `<Footer />` (renders `© {buildYear} Mohan Dong · Share with attribution`), `<MetaRow left right />` (the mono, uppercase, muted row), and CSS tokens and classes in `globals.css`: `.mono`, `.post-body`. `@/lib/utils` `cn`. The post page leaves a `{/* cloud: Task 11 */}` slot as the first child of its root.

- [ ] **Step 1: Configure MDX.** Run `bun add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx remark-frontmatter remark-gfm rehype-slug rehype-autolink-headings rehype-pretty-code shiki rehype-external-links`.
  In `next.config.ts`, wrap the config with `createMDX`, with
  `pageExtensions: ['ts','tsx','md','mdx']`. Under Turbopack, plugins must be
  given by name:
  `remarkPlugins: ['remark-frontmatter', 'remark-gfm']`,
  `rehypePlugins: ['rehype-slug', ['rehype-autolink-headings', { behavior: 'wrap' }], ['rehype-pretty-code', { theme: 'github-dark-default', keepBackground: false }], ['rehype-external-links', { target: '_blank', rel: ['noopener', 'noreferrer'] }]]`.
- [ ] **Step 2: shadcn + tokens.** Run `bunx shadcn@latest init` (base colour
  neutral, CSS variables; choose the style with the least decoration the CLI
  offers). Then make `globals.css` dark-only: map `--background #000`,
  `--foreground #f5f5f7`, `--muted-foreground #86868b`, `--border #2c2c2e`,
  `--ring #f5f5f7`, and set `--radius` so pills come out at 999px and code
  blocks at 14px. Remove the `.dark` variant and any light values. Add the
  design's link styling to `a` (Main:16–17), `.mono` (Main:18), and
  `.post-body` with the rules from Post:20–25 plus inline code (Post:59 inline
  style) and `pre` with background `#0d0d0d`. Add design-language styles for
  `h3` (22px/600, `#f5f5f7`, margin 40px 0 12px), `ul`/`ol` (padding-left
  1.25em, `li` margin 0 0 8px), `hr` (1px `#2c2c2e`, margin 48px 0) and `em`.
- [ ] **Step 3: Fonts and layout.** In `layout.tsx`, load `Inter`,
  `Geist_Mono`, `Space_Grotesk` (500, 600) and `JetBrains_Mono` (500, 600)
  from `next/font/google` as CSS variables. Set
  `--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", var(--font-inter), system-ui, sans-serif`
  and `--font-mono: "SF Mono", ui-monospace, var(--font-geist-mono), Menlo, monospace`.
  The body gets background `#000` and `-webkit-font-smoothing: antialiased`.
  Metadata: `metadataBase: new URL('https://www.mohandong.com')`, title
  template `'%s — Mohan Dong'` with default `'Mohan Dong'`, description
  `'Software Engineering, University of Waterloo.'`, and text-only
  `openGraph`/`twitter`. Add `<Analytics />` from `@vercel/analytics/next` (`bun add @vercel/analytics`).
- [ ] **Step 4: `Callout`.** Props
  `{ type?: 'note' | 'tip' | 'important' | 'warning' | 'caution'; children }`.
  Render an `<aside>`: 1px `#2c2c2e` border, 14px radius, padding 20px 22px,
  background `#0d0d0d`. It starts with a mono, uppercase, 12px, `#86868b`
  label of the type (default `note`), followed by the children. In
  `mdx-components.tsx`, export `useMDXComponents()`, which returns
  `{ Callout }` merged with the components passed in.
- [ ] **Step 5: Post page.** Use `generateStaticParams` from `getPosts()` and
  set `dynamicParams = false`. Load the body with
  `await import(`@content/blog/${yyyy}/${mm}/${dd}/${slug}.mdx`)`. If Turbopack
  can't resolve the alias in a dynamic import, use the equivalent relative
  path. Lay the page out exactly as Post:41–72:
  - the `.wrap` padding, and `<MetaRow>` with an `← Index` link to `/` and
    `05 Writing · {index} of {total}`;
  - `<PostHeader date headline subhead>`, using `splitTitle`;
  - `<article className="post-body">` with the border-top and padding of
    Post:57;
  - `<NextPost>` (Post:65–68): `"{index}/{total}"`, the full title of `next`,
    and an arrow, linking to `next.path`;
  - `<Footer>`;
  - the phone rules from Post:28–34.

  `generateMetadata` returns the title (full title), the description,
  `alternates.canonical: post.path`, and `openGraph` with
  `type: 'article', publishedTime`.
- [ ] **Step 6: Verify.** `bun run build` must list the 3
  `/blog/…` routes as SSG. Start the site with `bun run start` and run
  `curl -s localhost:3000/blog/2025/01/16/mastermind | grep -c 'Minimal control does not mean no control at all'`
  → 1. The same page contains `<aside` exactly once. `curl -s -o /dev/null -w '%{http_code}' localhost:3000/blog/2025/01/16/nope` → 404.
- [ ] **Step 7: Commit.** `git commit -am "feat: MDX post pages"`

---

### Task 4: Feed, sitemap, robots, icon and the /blog redirect

**Files:**
- Create: `src/lib/feed.ts`, `src/lib/feed.test.ts`, `src/lib/render-static.ts`, `src/app/rss.xml/route.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/icon.tsx`
- Modify: `next.config.ts` (redirects)

**Interfaces:**
- Consumes: `getPosts` (Task 2), `Callout` (Task 3).
- Produces: `export function buildFeed(posts: Post[], html: Record<string, string>, baseUrl: string): string` (RSS 2.0 XML, built with `feed`, `bun add feed`). `export const SITE_URL = 'https://www.mohandong.com'` lives in `src/lib/post-meta.ts`.

- [ ] **Step 1: Write the failing test** `feed.test.ts`. For two posts, the
  `buildFeed(…)` XML must:
  - contain `<guid isPermaLink="false">https://www.mohandong.com/blog/2024/02/01/decoding-conditionals</guid>`
    (or whatever guid form `feed` emits: assert on the URL inside `<guid`);
  - contain `<link>https://www.mohandong.com/blog/2024/02/01/decoding-conditionals</link>`;
  - put the newest item first;
  - include each post's html in `content:encoded`;
  - set the channel title to `Mohan Dong` and the feed link to `…/rss.xml`.
- [ ] **Step 2: Run.** `bun test src/lib/feed.test.ts` → FAIL.
- [ ] **Step 3: Implement `buildFeed`.** The item `id` and `link` are both
  `${baseUrl}${post.path}`, `date` is `publishDate`, and the feed description
  is `"Mohan's portfolio"`.
- [ ] **Step 4: Run.** → PASS.
- [ ] **Step 5: Route, shim, metadata files.**
  - `render-static.ts`: `server-only`, re-exports `renderToStaticMarkup` via
    `require('react-dom/server')`. Copy mssg's `src/lib/rss-render.ts`, whose
    comment explains why the shim is needed.
  - `rss.xml/route.tsx`: `dynamic = 'force-static'`. Import each post module
    and render it with
    `components={{ Callout: ({children}) => <blockquote>{children}</blockquote> }}`,
    then return `buildFeed` output with `application/rss+xml; charset=utf-8`.
  - `sitemap.ts`: `/` plus each post (`lastModified = lastEdited ?? publishDate`).
  - `robots.ts`: allow all, pointing to the sitemap.
  - `icon.tsx`: a 32×32 `ImageResponse`, black background with a 3×3 grid of
    `#f5f5f7` 4px squares at varying opacity (0.35–1).
  - `next.config.ts` `redirects()`:
    `{ source: '/blog', destination: '/#writing', permanent: true }`.
- [ ] **Step 6: Verify.** After `bun run build && bun run start`:
  - `curl -s localhost:3000/rss.xml | grep -c '<item>'` → 3;
  - `curl -sI localhost:3000/blog | grep -i '^location'` → `/#writing` (308);
  - `/sitemap.xml` lists 4 URLs;
  - `/icon` returns `image/png`.
- [ ] **Step 7: Commit.** `git commit -am "feat: rss, sitemap, robots, icon, /blog redirect"`

---

### Task 5: Home page markup and accordion (no cloud yet)

**Files:**
- Create: `src/components/dot-cloud/types.ts` (CloudKey only), `src/components/ui/accordion.tsx`, `src/components/ui/button.tsx` (via `bunx shadcn@latest add accordion button`, then restyled), `src/components/home/Hero.tsx`, `src/components/home/IndexList.tsx`, `src/components/home/panels/{About,Badge,HowTo,Mssg,Writing,Contact}.tsx`
- Modify: `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: `getPosts`, `Post` (Task 2), `Footer`, `MetaRow` (Task 3).
- Produces: `src/components/dot-cloud/types.ts` containing only the `CloudKey` union below (Task 6 extends this file). `IndexList` (client): `{ posts: Pick<Post,'path'|'title'|'publishDate'>[]; onCloudKey?: (key: CloudKey) => void }`. `page.tsx` leaves the cloud slot `{/* cloud: Task 11 */}` and passes `onCloudKey` from a small client wrapper, `src/components/home/HomeClient.tsx`, which holds `key` in state for Task 11.
  ```ts
  export type CloudKey = 'home' | 'about' | 'badge' | 'howto' | 'mssg' | 'writing' | 'contact';
  ```

- [ ] **Step 1: Hero.** Copy Main:81–93 exactly: `<MetaRow left="Index — 06" right="mohandong.com" />`,
  the name `Mohan<br/>Dong` with `.name` styles (Main:23), the tagline and
  `Design. Develop. Deliver.`, and the hero padding and min-height (Main:22,
  phone Main:61).
- [ ] **Step 2: Accordion.** Use Radix `Accordion type="single" collapsible`
  in controlled mode (`value`, `onValueChange`). Render as an `<ol>` (Radix
  `asChild` on Root) with `AccordionItem` as an `<li>`. Restyle the shadcn
  files to the design and remove their defaults:
  - The trigger is the `.row` grid (Main:27–35): number, title, meta, and a
    28px plus SVG that rotates 45° when open. Replace the shadcn chevron.
    Focus ring as in Main:28.
  - Content uses `forceMount`. The design's `.panel` grid-rows transition
    and `visibility` trick (Main:37–41) is driven by `data-state`, so closed
    content is hidden from the tab order.
  - Sibling dimming via `.idx:has(.row:hover) .row:not(:hover) .t` (Main:36).
  - Reduced-motion rule from Main:74.
  - Phone rules from Main:62–66.

  Rows, ids and meta in order: `about` 01 About "Person"; `badge` 02 Hack the
  Badge "Project · Rust"; `howto` 03 how-to "Project · Shell"; `mssg` 04 mssg
  "Project · TypeScript"; `writing` 05 Writing + `<sup>` post count "Posts";
  `contact` 06 Contact "Elsewhere".
- [ ] **Step 3: Panels.** Copy the contents of Main:107–219 exactly, using
  Tailwind utilities, plus component classes in `globals.css` for `.spec`,
  `.lede`, `.code`, `.htb`, `.htb-pill` and `.post` (Main:42–56 with their
  phone rules). `Button` gets two `cva` variants:
  - `pill` (Main:47–48);
  - `htb`, with an `on` modifier (Main:56–58).

  Use it with `asChild` around `<a>`. The Writing panel maps `posts` to the
  `.post` rows (date, full title, →), each linking to `post.path`.
- [ ] **Step 4: Cloud key logic** (port of Main:239–248 and 464–475), in
  `IndexList`:
  - pointer enter or focus on a row sets `key = id`;
  - mouse leave on the `<ol>` sets `key = open ?? 'home'`;
  - toggling sets `open = open === id ? null : id` and `key = next ?? id`.

  Call `onCloudKey` whenever `key` changes. When `location.hash === '#writing'`,
  on mount and on `hashchange`, open `writing` and scroll it into view.
- [ ] **Step 5: Verify** with `bun run build && bun run start`, using the
  chrome-devtools MCP at 1440×900 and 390×844:
  - The hero, rows and footer match Main.dc.html.
  - Clicking opens one row at a time, and clicking again closes it.
  - With every row closed, Tab moves only between the six row buttons and
    never into panel links (Review Focus 2).
  - `/#writing` loads with Writing open.
  - Posts in the Writing panel link to their pages.
  - No console errors.
- [ ] **Step 6: Commit.** `git commit -am "feat: home index with accordion panels"`

---

### Task 6: Dot cloud types and core math

**Files:**
- Create: `src/components/dot-cloud/rng.ts`, `math.ts`, `math.test.ts`
- Modify: `src/components/dot-cloud/types.ts` (add everything below; keep `CloudKey` as is)

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export type CloudKey = 'home' | 'about' | 'badge' | 'howto' | 'mssg' | 'writing' | 'contact';
  export type Rng = () => number;                      // [0,1)
  export type Network = { nodes: [number, number, number][]; edges: [number, number, number][]; depth: number }; // edge = [a, b, layer]
  export type ShapeBuild = { points: Float32Array; inkU?: Float32Array; net?: Network };
  export type ViewMode = { kind: 'spin'; rate: number } | { kind: 'settle' };   // settle = Main:399
  export type Projected = { x: number; y: number; f: number; z: number; vx: number; vy: number }; // px, px, persp, depth z2, view x1, y1
  export type Projector = (x: number, y: number, z: number) => Projected;
  export type Layout = { ox: number; oy: number; sx: number; sy: number };
  export type DotBatch = { xy: Float32Array; size: Float32Array; alpha: Float32Array; count: number };
  export type LineBatch = { segments: Float32Array; count: number; alpha: number; width: number }; // x0,y0,x1,y1 per segment, px
  export type OverlayFrame = { lines: LineBatch[]; dots: DotBatch };
  export type OverlayCtx = { project: Projector; t: number; alpha: number; reduce: boolean; dpr: number };
  export type Overlay = { frame: (ctx: OverlayCtx) => OverlayFrame };
  export type ShapeDef = {
    id: CloudKey;
    build: (n: number, rng: Rng) => ShapeBuild;
    view: ViewMode;
    tilt: number;                                      // base rx
    animate?: (b: ShapeBuild, out: Float32Array, tSinceSelected: number, reduce: boolean) => Float32Array;
    overlay?: (b: ShapeBuild) => Overlay;
  };
  ```
- Produces (`rng.ts`): `export function mulberry32(seed: number): Rng`.
- Produces (`math.ts`):
  `export const TAU`;
  `export function easeRate(k: number, dt: number): number` (= `1 - (1-k)^(dt*60)`);
  `export function homeLayout(W: number, H: number, phone: boolean, homeBlend: number): Layout`;
  `export function postLayout(W: number, H: number): Layout`;
  `export function makeProjector(ry: number, rx: number, l: Layout): Projector`;
  `export function dotSize(f: number, dpr: number): number`;
  `export function dotAlpha(z: number, onHome: boolean): number`;
  `export function isPhone(cssWidth: number): boolean` (≤ 700).

  All screen values are device pixels, `W = cssW·dpr`, and **+y points down**.
  This is the design's convention: shapes put "up" at negative y.

- [ ] **Step 1: Write the failing tests** (`math.test.ts`, `toBeCloseTo` at 6 digits):
  - `homeLayout(1000, 800, false, 0)` → `{ ox: 710, oy: 400, sx: 197.2, sy: 197.2 }`.
  - `homeLayout(1000, 800, false, 1)` → `{ ox: 500, oy: 400, sx: 500/1.3, sy: 400/0.92 }`.
  - `homeLayout(390, 844, true, 0)` → `{ ox: 195, oy: 303.84, sx: 132.6, sy: 132.6 }`.
  - `postLayout(800, 600)` → `{ ox: 400, oy: 300, sx: 216, sy: 216 }`.
  - `isPhone(700)` → true, `isPhone(701)` → false (Review Focus 4).
  - With `p = makeProjector(0, 0, { ox: 0, oy: 0, sx: 100, sy: 100 })`:
    `p(0,0,0)` → `{ x:0, y:0, f:1, z:0 }`; `p(1,0,0).x` → 100;
    `p(0,0,1)` → `{ f: 0.75, z: 1 }`; `p(0,0,-1).f` → 1.5.
  - `makeProjector(Math.PI/2, 0, …)(1,0,0)` has `vx ≈ 0` and `z ≈ -1`
    (formulas Main:417: `x1 = x·cy + z·sy`, `z1 = −x·sy + z·cy`,
    `y1 = y·cx − z1·sx`, `z2 = y·sx + z1·cx`, `f = 3/(3+z2)`,
    `x = ox + x1·f·sx`, `y = oy + y1·f·sy`).
  - `dotSize(1, 2)` → 3.8. `dotAlpha(0, false)` → 0.6, `dotAlpha(5, false)`
    → 0.12, `dotAlpha(-2, false)` → 1, `dotAlpha(0, true)` → 0.36.
  - `easeRate(0.05, 1/60)` → 0.05; `easeRate(0.05, 1/30)` → 0.0975.
  - `mulberry32(1)` gives the same first 5 values twice; all values are in [0,1).
- [ ] **Step 2: Run.** `bun test src/components/dot-cloud/math.test.ts` → FAIL.
- [ ] **Step 3: Implement.** Layout formulas are Main:412–415. Post layout
  is Post:169 (`S = min(W,H)·0.36`, centred).
- [ ] **Step 4: Run.** → PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(dot-cloud): types and core math"`

---

### Task 7: Static shapes and the registry

**Files:**
- Create: `src/components/dot-cloud/shapes/{home,about,badge,howto,mssg,contact}.ts`, `shapes/shapes.test.ts`, `registry.ts`

**Interfaces:**
- Consumes: Task 6 types and `mulberry32`.
- Produces: one `ShapeDef` export per file, named after the shape (`home`,
  `about`, `badge`, `howto`, `mssg`, `contact`). Also
  `export const ORBIT = { PL: 6, KS: 10, INC: 53°, RO: 0.9, RE: 0.55 }` and
  `export function orbit(plane: number, u: number): [number, number, number]`
  from `contact.ts`. `registry.ts`:
  `export const SHAPES: Record<CloudKey, ShapeDef>`. Task 8 adds `writing`,
  so register a temporary `writing: home` that Task 8 replaces.

Port each `build` from the design, replacing `Math.random` with `rng`.
Index-based part allocation stays exactly as written: Main:265 home,
Main:268–285 about (also returns `net`), Main:286–291 badge, Main:292–296
howto, Main:297–301 mssg, Main:314–325 contact. Views and tilts (Main:397–411):
- home: `spin 0.02`, tilt −0.2;
- about: `settle`, tilt −0.08;
- contact: `spin 0.06`, tilt −0.38;
- badge, howto, mssg: `spin 0.2`, tilt −0.2.

`overlay` fields are left unset here; Task 10 adds them.

- [ ] **Step 1: Write the failing tests** (`shapes.test.ts`, n = 1200, seed 7):
  - For every shape: `points.length === 3600`, all finite; the same seed
    gives identical arrays; seed 8 gives a different array.
  - home: |x| ≤ 1.5, |y| ≤ 1.05, |z| ≤ 1.
  - about: `net.nodes.length === 21`, `net.edges.length === 98`, `net.depth === 3`; the first 21·22 points are each within 0.055 + 1e-6 of their node `nodes[floor(i/22)]`.
  - badge: for `i < 984` (`1200·0.82`): |x| ≤ 0.5, −0.48 ≤ y ≤ 1.08, |z| ≤ 0.025; for the rest, z = 0 and −1.3 ≤ y ≤ −0.48.
  - howto: |z| ≤ 0.16.
  - mssg: z ∈ {−0.51, −0.17, 0.17, 0.51} (to 1e-6).
  - contact: the first 744 (`floor(1200·0.62)`) points have radius 0.55 (to 1e-5); the rest have radius 0.9 (to 1e-5). `orbit(0, 0)` → `[0.9, 0, 0]`.
  - `Object.keys(SHAPES)` equals the 7 `CloudKey`s.
- [ ] **Step 2: Run.** `bun test src/components/dot-cloud/shapes` → FAIL.
- [ ] **Step 3: Implement** the six files and the registry.
- [ ] **Step 4: Run.** → PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(dot-cloud): static shapes and registry"`

---

### Task 8: The quill (writing) shape

**Files:**
- Create: `src/components/dot-cloud/shapes/pen.ts`, `shapes/writing.ts`, `shapes/writing.test.ts`
- Modify: `registry.ts` (replace the temporary `writing`)

**Interfaces:**
- Produces (`pen.ts`):
  `export type PenLut = { P: [number, number][]; L: number[]; T: number; lift: [number, number] }`,
  `export function buildPen(): PenLut` (memoised),
  `export function penAt(u: number): [number, number]`.
  Port Main:331–368 exactly: control points, Catmull-Rom with `per = 12`, the
  `0.55 + (x − 8.75)·0.2`, `0.53 − y·0.2` mapping, and the arc-length binary
  search.
- Produces (`writing.ts`): `export const writing: ShapeDef` with
  `view: { kind: 'settle' }` and tilt −0.2.
  - `build` is a port of Main:302–313: `i % 20` < 2 is the shaft, < 9 the
    vanes, the rest ink. Ink points reject `u` inside `lift`. `inkU[i] = u`
    for ink points and −1 otherwise.
  - `animate` is a port of `inkFrame` (Main:369–382):
    `p = reduce ? 1 : easeInOutQuad(clamp(t/5.5, 0, 1))`. Ink points go to
    `pen(min(u,p))` with their base z. Quill points are their base plus
    `pen(p) − pen(1)`.

- [ ] **Step 1: Write the failing tests:**
  - `penAt(0)` ≈ `[-1.2, 0.51]`; `penAt(1)` ≈ `[0.55, 0.5]` (the nib).
  - `0 < lift[0] < lift[1] < 1`.
  - `penAt(-1)` equals `penAt(0)` and `penAt(2)` equals `penAt(1)` (clamped).
  - For u in steps of 0.01, `|penAt(u+0.01) − penAt(u)| ≤ 0.01·T + 1e-6`.
  - `build(1200, mulberry32(7))`: `inkU` is −1 exactly when `i % 20 < 9`;
    every other `inkU` is in [0,1] and outside `(lift[0], lift[1])`.
  - `animate(b, out, 0, false)`: every ink point equals `penAt(0)` in x and y,
    and the shaft point with i = 0 equals base + `(penAt(0) − penAt(1))`.
  - `animate(b, out, 6, false)` and `animate(b, out, 0, true)` both equal the
    finished frame: quill points equal base, and ink points equal `penAt(u)`.
  - `animate(b, out, 2.75, false)`: ink points with `u ≤ 0.5` sit at
    `penAt(u)`, and points with `u > 0.5` sit at `penAt(0.5)`.
- [ ] **Step 2: Run.** `bun test src/components/dot-cloud/shapes/writing.test.ts` → FAIL.
- [ ] **Step 3: Implement** `pen.ts` and `writing.ts`, then register `writing`.
- [ ] **Step 4: Run.** `bun test src/components/dot-cloud` → PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(dot-cloud): quill writing shape"`

---

### Task 9: Simulation (home and post)

**Files:**
- Create: `src/components/dot-cloud/simulation.ts`, `simulation.test.ts`

**Interfaces:**
- Consumes: Tasks 6–8 (`SHAPES`, math, rng). Uses `ShapeDef.overlay` when
  present (Task 10 fills it in; it is absent until then).
- Produces:
  ```ts
  export type HomeInput = { key: CloudKey; now: number; mx: number; my: number; W: number; H: number; dpr: number; phone: boolean };
  export type PostInput = { now: number; mx: number; my: number; W: number; H: number; dpr: number };
  export type SimFrame = { dots: DotBatch; overlays: OverlayFrame[] };
  export type HomeSim = { step(i: HomeInput): SimFrame; state(): { cur: Float32Array; target: Float32Array; ry: number; homeBlend: number; overlayAlpha: Partial<Record<CloudKey, number>>; selectedAt: number } };
  export function createHomeSim(o: { reduce: boolean; n?: number; seed?: number; shapes?: Record<CloudKey, ShapeDef> }): HomeSim;   // n 1200
  export function createPostSim(o: { reduce: boolean; n?: number; seed?: number }): { step(i: PostInput): SimFrame };              // n 900
  ```
  `mx` and `my` are pointer position / viewport − 0.5. `now` is in ms. Buffers
  are allocated once and reused across frames.

Behaviour, ported from Main:383–423:
- Time: `dt = min(0.05, Δnow/1000)`.
- Selection: `selectedAt` resets whenever `key` changes.
- Target: `shape.animate` when the shape has one, else the built points.
- Home drift: amplitude 0.18 while on home and not reduced; per-coordinate
  frequency `0.12 + rng·0.3` and phase `rng·TAU`.
- Morph: per-point rate `0.035 + rng·0.06`, through `easeRate`. With reduce,
  the rate is 1.
- View, for `spin`: `ry += dt·rate`. For `settle`:
  `goal = round((ry − 0.35)/TAU)·TAU + 0.35 + 0.18·sin(0.5t)` and
  `ry += (goal − ry)·easeRate(0.04, dt)`. With reduce, `ry = 0.6`.
- Final angles: `ry + mx·0.6`, and `rx = tilt + my·0.3`.
- Blends: `homeBlend` eases at 0.05 (instant when reduced). Each overlay's
  alpha eases at 0.06 toward 1 while its shape is active, else toward 0, and
  is only emitted above 0.01.
- Dots: size from `dotSize`, alpha from `dotAlpha(z, key === 'home')`.
- Post sim: positions = `writing.animate(build, buf, t, reduce)` with no
  morphing; `ry = (reduce ? 0.6 : sin(0.3t)·0.5) + mx·0.6`,
  `rx = −0.25 + my·0.3`, `postLayout`, and alpha `dotAlpha(z, false)`.

- [ ] **Step 1: Write the failing tests** (`simulation.test.ts`; step at
  16.667 ms, W 1440, H 900, dpr 1):
  - reduce + `badge`: after 1 step, `state().cur` equals the badge points exactly.
  - not reduced + `badge`: after 600 steps, max |cur − badge| < 1e-3.
  - `home`, not reduced: `cur` keeps changing between step 600 and 700 (drift).
  - `about` for 900 steps: `((ry mod TAU) + TAU) mod TAU` is within 0.2 of 0.35.
  - `writing` restart (Review Focus 3): step `writing` 400 frames, `about` 30
    frames, then `writing` once. `state().selectedAt` equals that last `now`;
    the target's ink points sit at `penAt(0)` (restarted), and every point's
    move in that step is ≤ 0.1·|target − previous cur| + 1e-6 (eased, no jump).
  - dt clamp: on `badge` (rate 0.2), one step with `now` jumping 10 s moves `ry` by at most 0.01.
  - `about` for 120 steps: `overlayAlpha.about` > 0.9. Then `home` for 120
    steps: `overlayAlpha.about` < 0.01, and `step().overlays` is empty.
  - `dots.count === 1200`; every alpha is in [0.072, 1].
  - Post sim at `now = 0` with reduce: dot positions equal the projected
    finished quill.
- [ ] **Step 2: Run.** `bun test src/components/dot-cloud/simulation.test.ts` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** → PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(dot-cloud): home and post simulations"`

---

### Task 10: Overlays (network and constellation)

**Files:**
- Create: `src/components/dot-cloud/overlays/network.ts`, `overlays/constellation.ts`, `overlays/overlays.test.ts`
- Modify: `shapes/about.ts`, `shapes/contact.ts` (set `overlay`)

**Interfaces:**
- Consumes: `Overlay`, `OverlayCtx`, `Network`, `orbit`, `ORBIT` (Tasks 6–7).
- Produces:
  `export function networkOverlay(b: ShapeBuild): Overlay`,
  `export function constellationOverlay(): Overlay`, and
  `export function occluded(p: Projected, re: number): boolean`
  (= `p.z > 0 && hypot(p.vx, p.vy) < re`).

Port Main:425–462:
- **Network:**
  - one line batch: every edge, alpha `0.14·α`, width `0.6·dpr`;
  - dots: forward-pass pulses with `g = (0.7t) mod (depth+1.5)`,
    `cyc = floor(0.7t/(depth+1.5))`, the hash skip `< 0.45`, size `2.6·dpr`
    and alpha `α·sin(πs)`;
  - no dots when reduced.
- **Constellation:**
  - 6×10 satellites at `orbit(p, mv + k·TAU/KS + p·π/KS)`, with
    `mv = reduce ? 0 : 0.12t`;
  - links in-plane (k → k+1 mod KS) and cross-plane (p → p+1, same k), skipped
    when either end is occluded; alpha `0.16·α`, width `0.6·dpr`;
  - satellite dots with size `2.4·f·dpr` and alpha
    `α·clamp((1.2−z)/2, 0.3, 1)`, skipped when occluded;
  - routed path through hops `[[0,1],[0,2],[1,2],[1,3],[2,3],[2,4]]`, framed
    by ground points (the first and last hops projected onto the radius-RE
    sphere; ground occlusion uses `RE·0.98`); alpha `0.7·α`, width `1.1·dpr`;
  - a message dot of size `4·dpr` moving at `(0.45t mod 1)·segments`, not
    drawn when reduced.

- [ ] **Step 1: Write the failing tests:**
  - `occluded({ z: 0.1, vx: 0.1, vy: 0 } as Projected, 0.55)` → true;
    `z: −0.1` → false; `vx: 0.6` → false.
  - Network with `alpha 1, dpr 2, t 1`: one line batch, `count === 98`,
    `alpha === 0.14`, `width === 1.2`. With `reduce` the dots count is 0.
  - Constellation with an identity-ish projector (`makeProjector(0, -0.38, {ox:0, oy:0, sx:1, sy:1})`):
    - the satellite dot count is ≤ 60 and > 0;
    - the link batch count is ≤ 110;
    - the path batch has `alpha 0.7·α`;
    - the message dot is absent with `reduce`;
    - no emitted satellite position is occluded.
  - `SHAPES.about.overlay` and `SHAPES.contact.overlay` are defined.
- [ ] **Step 2: Run.** `bun test src/components/dot-cloud/overlays` → FAIL.
- [ ] **Step 3: Implement** both overlays and wire them into the shapes.
- [ ] **Step 4: Run.** `bun test` (the whole suite) → PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(dot-cloud): network and constellation overlays"`

---

### Task 11: three.js renderer, `DotCloud` component, and wiring

**Files:**
- Create: `src/components/dot-cloud/renderer.ts`, `DotCloud.tsx`, `index.tsx`
- Modify: `src/components/home/HomeClient.tsx`, `src/app/page.tsx`, `src/app/blog/[yyyy]/[mm]/[dd]/[slug]/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: `createHomeSim`, `createPostSim`, `SimFrame`, `isPhone` (Tasks 6, 9).
- Produces:
  - `renderer.ts`: `export function createRenderer(canvas: HTMLCanvasElement): { resize(W: number, H: number): void; draw(f: SimFrame): void; dispose(): void } | null`.
    It returns `null` when WebGL is unavailable or the constructor throws.
  - `DotCloud.tsx` (`'use client'`, default export): `type DotCloudProps = { variant: 'home'; cloudKey: CloudKey } | { variant: 'post' }`.
  - `index.tsx` (`'use client'`): `export const DotCloud = dynamic(() => import('./DotCloud'), { ssr: false })`.

- [ ] **Step 1: Renderer.** Use `bun add three` and `bun add -d @types/three`.
  - `WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: false })`
    with a clear alpha of 0.
  - `OrthographicCamera(0, W, 0, H, -1, 1)`: pixel space, y down.
  - Dots: one `Points` with a `BufferGeometry` (attributes `position` vec3
    with z = 0, `size`, `alpha`). Preallocate for the maximum count and set
    `setDrawRange` each frame.
  - Dot shader: a `ShaderMaterial` with `gl_PointSize = size` and square
    points (no discard), colour `#f5f5f7`, `transparent`,
    `depthTest: false`, normal blending.
  - Overlay dots go through a second `Points` with the same material.
  - Lines use `LineSegments2` + `LineSegmentsGeometry` + `LineMaterial`
    (`three/examples/jsm/lines`), with `worldUnits: false`, `linewidth` in
    px, colour `#f5f5f7` and per-batch opacity. Keep a small pool, one per
    batch slot.
  - `resize` sets `setSize(W, H, false)` (device px; the canvas CSS size
    comes from CSS) and `LineMaterial.resolution`.
  - Listen for `webglcontextlost`, stop drawing, and call
    `preventDefault()`.
  - `dispose` frees every geometry, material and the renderer.
- [ ] **Step 2: `DotCloud`.** On mount:
  - read `matchMedia('(prefers-reduced-motion: reduce)')`;
  - create the sim (home or post) and the renderer, and if the renderer is
    `null` return without a loop;
  - run a `requestAnimationFrame` loop;
  - attach a `ResizeObserver` on the canvas: `dpr = min(devicePixelRatio, 2)`,
    `W = round(clientWidth·dpr)`, then `resize` (Review Focus 4);
  - add a window `pointermove` listener for `mx`/`my`;
  - add a `visibilitychange` listener that cancels and resumes the loop.

  The latest `cloudKey` is kept in a ref, so prop changes never re-create the
  sim, and `phone` is `isPhone(canvas.clientWidth)`. On unmount, tear
  everything down. The canvas has `aria-hidden` and `pointer-events: none`.
  Classes:
  - home: the `.stage` and `.obj` styles from Main:20–21, with 0.6 opacity
    on phones (Main:60);
  - post: `.obj` from Post:19, with the phone rule from Post:29.
- [ ] **Step 3: Wire.** `HomeClient` renders
  `<DotCloud variant="home" cloudKey={key} />` as the first child of the root
  `relative min-h-screen overflow-x-clip` container (Main:77–79), with the
  hero, index and footer at `z-index: 1`. The post page renders
  `<DotCloud variant="post" />` in its slot.
- [ ] **Step 4: Verify in the browser** with `bun run build && bun run start`
  and the chrome-devtools MCP, at 1440×900 and 390×844:
  - The home dust fills the viewport and drifts.
  - Hovering each row morphs to its shape on the right (top on phone):
    network with edges and pulses, badge, prompt, pages, quill writing
    "hello world" over about 5.5 s, Earth with links and a moving message.
  - Leaving the list returns to the open row's shape, or the dust.
  - Re-hovering Writing rewrites it.
  - Pointer movement tilts the cloud.
  - Emulate `prefers-reduced-motion: reduce`: it is static, the writing is
    already done, and there is no message dot.
  - Resize from 1440 to 600 to 1440: no stretching, and the layout switches
    at 700.
  - Disable WebGL (`evaluate_script` overriding
    `HTMLCanvasElement.prototype.getContext` to return null, then reload): the
    page renders with no errors (Review Focus 5).
  - The post page shows the quill top-right, writing once, then rocking.
  - Performance trace on home while hovering through every row: no long
    tasks over 50 ms after load.
  - No console errors on either page.
- [ ] **Step 5: Commit.** `git commit -am "feat(dot-cloud): three.js renderer and page wiring"`

---

### Task 12: `docs/dot-clouds.md`, CLAUDE.md, and final verification

**Files:**
- Create: `docs/dot-clouds.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: everything above. The doc must name the real files, types and
  functions as they now exist.

- [ ] **Step 1: Write `docs/dot-clouds.md`.** Cover spec §"`docs/dot-clouds.md`"
  points 1–8 in order, each with the real shape as its example:
  1. Unit space: x ±1.5, y ±1.05, z ±1, **+y is down**, keep shapes within
     ±0.9, and the projection formulas from `math.ts`.
  2. Point budget and index identity: `i % k` and range allocation, with the
     badge's 82/18 split and the quill's `i % 20`.
  3. Sampling recipes: volume, Fibonacci sphere, `cbrt` balls, jittered
     segments, layered planes, orbits, and spline + arc-length LUT.
  4. Silhouette first.
  5. Depth and density.
  6. Motion: `view` modes, overlays (and when one earns its place),
     `animate` for time-varying targets, and reduced motion.
  7. Determinism and performance: seeded `rng`, build once, no per-frame
     allocation.
  8. Checklist to add a cloud:
     - a `shapes/<id>.ts` `ShapeDef`;
     - the `CloudKey` union and a `SHAPES` entry;
     - an `IndexList` row with its panel;
     - tests in `shapes.test.ts`;
     - a line in this doc's catalogue.

  End with a catalogue table: id, subject, recipe, points split, view, and
  overlay or animate.
- [ ] **Step 2: Update `CLAUDE.md`** with the architecture (content
  pipeline, routes, dot-cloud layering of pure sim → renderer), a pointer to
  `docs/dot-clouds.md`, and the "keep in sync" rules: the RSS `Callout` stub ↔
  `mdx-components.tsx`, and the `CloudKey` union ↔ `SHAPES` ↔ index rows.
- [ ] **Step 3: Full verification.** Run
  `bun install --frozen-lockfile && bun test && bun run lint && bun run prettier:check && bun run build`.
  Expected: all exit 0, and the build lists `/`, 3 post routes, `/rss.xml`,
  `/sitemap.xml`, `/robots.txt` and `/icon` as static.
  `git ls-files | grep -E 'package-lock|yarn.lock|pnpm-lock'` → empty.
  `git diff --stat` against the fetched originals (Task 2 Step 1) still shows
  only the callout lines changed.
- [ ] **Step 4: Commit.** `git commit -am "docs: dot cloud first principles; CLAUDE.md"`
