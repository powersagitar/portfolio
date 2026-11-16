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

## Rules

- Bun only: `bun`, `bunx`, `bun --bun ...`. Never npm, npx, pnpm, yarn or node.
  The only lockfile is `bun.lock`.
- Post prose is never edited. Only change: `:::callout{type=note}` blocks are
  `<Callout type="note">` JSX.
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
