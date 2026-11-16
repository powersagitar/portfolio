# Portfolio

Personal portfolio and blog (Next.js 16, App Router, Tailwind, Bun). Read
`AGENTS.md` first: this Next.js has breaking changes, check
`node_modules/next/dist/docs/` before writing code.

## Commands

- `bun install`
- `bun run dev` / `build` / `start`
- `bun run lint`
- `bun run prettier` (write) / `bun run prettier:check`
- `bun run test` (`bun test`, root `./src`)

## Layout

- `src/`: all code. `content/`: blog posts (MDX) only.
- Aliases: `@/*` -> `src/*`, `@content/*` -> `content/*`.
- Nothing in `content/` imports from `src/`.
- Filesystem access only in `server-only` modules under `src/lib/`.

## Architecture

- Content pipeline: `content/blog/YYYY/MM/DD/slug.mdx` (frontmatter + MDX).
  `src/lib/posts.ts` (`server-only`) reads and indexes them with `gray-matter`;
  `src/app/blog/[yyyy]/[mm]/[dd]/[slug]` renders each through `@next/mdx` with
  `src/mdx-components.tsx`. The post route uses `dynamicParams = false`.
  `getOutline` (`posts.ts`) feeds the post page's contents column.
- Routes: `/` (home index + dot cloud), the post pages, `/rss.xml`
  (`src/app/rss.xml/route.tsx`), `/sitemap.xml`, `/robots.txt`, `/icon`, and a
  `/blog` redirect (308) to `POSTS_SECTION`'s hash (`/#writing`). All static.
  The URL hash is the open row: `/#<row-id>` loads with that row open (and
  `hashchange` follows it), opening a row sets the hash (`history.replaceState`,
  no history entry) and closing it clears it, so rows are linkable and Back from
  a post reopens Writing.
- Home: `src/components/home/` (`Hero`, `HomeClient`, `IndexList` rows from
  `SECTIONS` with `panels/`). `IndexList` reports the active `CloudKey` to the
  cloud.
- Dot cloud: `src/components/dot-cloud/`, layered as pure data to pure sim to
  thin renderer. `shapes/*.ts` and `overlays/*.ts` build points and overlay
  frames; `simulation.ts` steps time into batches; `renderer.ts` (three.js) only
  draws them; `DotCloud.tsx` wires it to the page and survives having no WebGL.
  Read `docs/dot-clouds.md` before adding or changing a cloud.

## Keep in sync

- `src/lib/outline.ts` parses posts as plain CommonMark (no MDX/GFM extensions)
  with one github-slugger over every heading; its ids must equal the ids
  `rehype-slug` renders. A new remark/rehype plugin that changes headings, or
  MDX expressions in headings, needs a check.
- The stage width 1920px is `--stage` in `globals.css` and `STAGE_MAX` in
  `src/components/dot-cloud/math.ts`.
- The feed's `feedComponents` in `src/lib/feed-components.tsx` must match
  `src/mdx-components.tsx`: its `Callout` stub mirrors `Callout`, and its `pre`
  and `a` overrides undo `CodeBlock` and the heading `#` links (the feed renders
  posts without the site's styles).
- Home rows are `SECTIONS` in `src/lib/sections.ts` (order, title, meta).
  `CloudKey` derives from it; `SHAPES` (`satisfies`) and `IndexList`'s `extras`
  are `Record`s over its ids, so TypeScript enforces they match. Row numbers,
  the hero's count and the URL hash derive from it too. `POSTS_SECTION` names
  the posts' row: the post page's label and Index link and the `/blog` redirect
  use it, never a literal `'writing'`.

## Gotchas

- `next.config.ts` has no `cacheComponents` or `partialPrefetching`: classic
  static generation. Do not add them.
- `content/blog/` is in `.prettierignore` (Prettier would reflow post prose). So
  are `docs/superpowers/`, `.claude/` and `.superpowers/`.
- Tests importing `server-only` modules rely on the bun test preload in
  `bunfig.toml` (`src/test/setup.ts` mocks `server-only`).
- Prettier scripts run `bunx --bun prettier`.
- The renderer keeps three's default `premultipliedAlpha`; do not change it
  without checking dim dots on the black page.
- `posts.ts` marks its `process.cwd()` path `/* turbopackIgnore: true */` to
  avoid tracing the whole project.
- Locally, `/_vercel/insights/script.js` 404s under `bun run start`; that is
  expected off Vercel.

## Rules

- Bun only: `bun`, `bunx`, `bun --bun ...`. Never npm, npx, pnpm, yarn or node.
  The only lockfile is `bun.lock`.
- Post prose is never edited. Only change: `:::callout{type=note}` blocks are
  `<Callout type="note">` JSX; the text inside is byte-identical to the
  original, trailing two-space hard breaks included.
- Frontmatter keys are kebab-case: `title`, `description`, `publish-date`,
  `last-edited`. Dates are strings like `2024-02-01` (never shift the day).
- Use `type`, not `interface`.
- Prettier: single quotes, semicolons, trailing commas `all`; import order
  React, Next, third-party, `@/`, `@content/`, relative; Tailwind classes
  sorted. Pre-commit runs lint-staged (prettier).
- Palette: bg `#000`, text `#f5f5f7`, secondary `#d1d1d6`, muted `#86868b`,
  hover-dim `#6e6e73`, row rule `#2c2c2e`, inner rule `#1d1d1f`, link underline
  `#48484a`, code bg `#0d0d0d`. Phone breakpoint `max-width: 700px`. Dark only.
- Post URLs: `/blog/YYYY/MM/DD/slug`. RSS feed at `/rss.xml`.
- The cloud canvas is `aria-hidden`, `pointer-events: none`; the page must work
  without WebGL. `prefers-reduced-motion: reduce` disables drift, pulses and
  animated morphs.
- Out of scope: deployment, git remotes, Vercel settings, share images.
