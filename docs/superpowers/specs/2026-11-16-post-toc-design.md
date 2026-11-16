# Post page: contents column and body details

Source: the `Post.dc.html` board of the design canvas
(claude.ai/code/artifact/1c404b5e-6114-45ce-85ce-cdde0a8d25a8). Builds on
`2026-11-16-wide-monitors-design.md`; everything decided there still holds.

## Why

Since the body moved to a 760px column on the title's edge, the right side of
a post is empty below the quill. A contents column fills it and makes long
posts (Mastermind, Hack the Badge) easier to move around in. The board also
refines the body itself; those details come along.

## Goals / non-goals / anti-goals

- Goal: a sticky "On this page" column right of the body, listing the post's
  `##` sections, showing where you are and how far through you are.
- Goal: the board's body details: a number above each `##`, a `#` link on
  heading hover, a language label on code blocks, the new note style.
- Goal: clicking a contents entry or `#` link scrolls smoothly.
- Non-goal: listing `###`/`####` in the contents.
- Anti-goal: anything that edits post prose, moves the body off the title's
  edge, narrows it below the agreed 760px, or needs JavaScript to show the list.
- Anti-goal: changing what the RSS feed shows beyond what it shows today.

## Approaches

1. **Read headings from the post file at build time** (picked). A `server-only`
   helper parses the MDX with `mdast-util-from-markdown`, takes depth-2
   headings, labels them with `mdast-util-to-string` and ids with
   `github-slugger` (what `rehype-slug` uses). Static HTML, testable; costs a
   second read of each file.
2. A custom remark plugin exporting `toc` from each MDX module. Rejected:
   Turbopack takes plugins by name with serialisable options, so a local plugin
   is fragile setup to save one file read.
3. Read headings from the DOM in the browser. Rejected: no list without JS and
   the column pops in after load.

## Design

### Layout

- Body and contents sit in one grid inside `.wrap`:
  `minmax(0, 760px) minmax(0, 1fr) 248px`, `column-gap: 48px`, `align-items:
  start`. The body stays on the title's left edge at up to 760px; the contents
  column sits at the stage's right edge (inside the 1920px stage).
- The rule above the body stays on `.post-body` (760px wide, as agreed), not
  across the whole grid. The contents column starts level with the body text
  (48px below the rule) and is `position: sticky; top: 40px`.
- **≤1100px:** one column. The contents list moves above the body (after the
  rule's position, before the text), not sticky, without the rail or the facts
  block; entries 16px, 40px tall. Same on phones (≤700px).
- Next card and footer are unchanged (full stage width).

### Contents column (from the board)

- Label "On this page": mono, 12px, `.08em`, uppercase, `#86868b`.
- List: entries are links to `#<id>`, grid `28px 1fr`, min-height 44px, 17px
  / 500, `#6e6e73`; number `01…` mono 12px. Hover `#d1d1d6`; current entry
  `#f5f5f7` with `aria-current="location"`.
- Rail: 1px `#2c2c2e` line left of the list (18px indent); a `#f5f5f7` fill
  grows with reading progress.
- Facts block below, `#1d1d1f` top rule: Published (publish date), Sections
  (count, two digits), Code (`NN blocks`). Code row hidden when a post has no
  code blocks (my call). Whole column hidden if a post has no `##` (none today).
- Current section: the last `##` whose top has passed 33% of the viewport
  height. Progress: as on the board, `(0.33·vh − article.top) / (article.height
  − 0.5·vh)`, clamped 0–1. Without JS: list renders, nothing highlighted, rail
  empty.

### Body details

- **Section numbers:** CSS counter on `.post-body h2`, shown as a block
  `::before` (mono 12px, `.08em`, `#86868b`, 72px above, 10px below the
  number; the h2's own top margin becomes 0). No markup change, so the feed is
  unaffected, and numbers match the contents list because both count `##`.
- **`#` links:** `rehype-autolink-headings` switches from `wrap` to `append`,
  adding a mono `#` link (class `anc`, static `aria-label`) after every
  heading's text, `#48484a`, hidden until the heading is hovered or the link is
  focused. Headings are no longer whole links. The feed drops these links
  (its `components` render `a.anc` as nothing), with a keep-in-sync note.
- **Code labels:** a header strip on each code block (mono 11px, uppercase,
  `#86868b`, `#1d1d1f` rule below): `cpp` → "C++", no language → "Code". Done
  in CSS where possible so the feed is unchanged.
- **Notes:** `Callout` drops its background: 1px `#2c2c2e` border, 14px
  radius, 20/22px padding, 17px text, label 11px. The feed's blockquote stub
  stays as is.

### Scrolling and the URL

- Smooth scrolling for in-page links on post pages only
  (`scroll-behavior: smooth`, scoped so the home page's hash handling is
  untouched), switched off under `prefers-reduced-motion: reduce` along with
  the rail's fill transition.
- Headings get a `scroll-margin-top` so they don't land under the top edge.
- Clicking an entry or `#` updates the hash with `history.replaceState` (no
  history entry), matching the home page, so Back from a post still returns
  to Writing. Loading `/blog/…#<id>` lands on that section.

## Left to the builder

- Where the heading helper lives (`src/lib/`, `server-only`) and its shape; the
  page passes its result to a client `Toc` component.
- Tests: ids from the helper equal the ids `rehype-slug` puts on the page for
  every real post (e.g. `if-else-statements`); labels drop inline-code ticks;
  code-block count.
- Scroll tracking mechanics (scroll listener with rAF or IntersectionObserver).
- Visual check at 1100, 1440, 1920, 3440 and phone width.
