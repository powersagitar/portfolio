# Wide monitors: a centred stage

## Why

At ultrawide sizes (checked at 3440×1440) the full-bleed layout falls apart.
Type stops growing at about 1600px, so the content takes up the left quarter.
Row meta and the hero's right-hand line follow the far right edge, and the
cloud (anchored at 71% of the viewport) drifts away from the text it goes with.
On posts the quill cloud is small and isolated.

## Goals / non-goals

- Goal: above a max width, the page keeps its laptop-size composition,
  centred, with black margins.
- Goal: at or below the max width, nothing changes.
- Non-goal: new layouts that use the extra width (side-by-side panels, a TOC).
- Anti-goal: blowing the display type up to fill 3440px.

## Approaches

1. **Centred stage with a max width** (picked). Cheap, keeps the design.
2. Keep it full-bleed and raise the `clamp()` caps. Rejected: type gets huge and
   the rows stay empty.
3. Use the extra width for content. Rejected: a second layout to design and
   maintain for a small share of visitors.

## Design

- **Stage width `1920px`** (padding included). Horizontal padding everywhere
  that now uses `clamp(20px, 4vw, 64px)` (`.wrap`, `.idx`, `Hero`, the home
  footer wrapper) becomes
  `max(clamp(20px, 4vw, 64px), calc((100vw - 1920px) / 2 + 64px))`, defined
  once as a CSS custom property. No new wrapper elements. Rows, rules and
  MetaRows stop at the stage edges.
- **Display type keeps growing up to the stage width**: raise the caps to their
  vw value at 1920px. `.name` 248 → 298px, `.row .t` 116 → 142px, `.post-title`
  132 → 161px, `.next-post .t` 72 → 96px. Panel and body text stay as they are.
- **Home cloud follows the stage**: `homeLayout` computes `F = min(W, 1920)` and
  `L = (W - F) / 2`, then uses `S = min(F * 0.58, H) * 0.34` and
  `sox = L + F * 0.71` (phone is unchanged). Home dust (`homeBlend` 1) still
  fills the whole viewport. The 1920 lives in one exported TS constant. CSS
  duplicates it, and a "Keep in sync" line in `CLAUDE.md` says so.
- **Post cloud follows the stage**: `.cloud-post` gets
  `right: max(0px, (100vw - 1920px) / 2)` and `width: min(46vw, 883px)`. Height
  stays 620px.

### Post page: one alignment, wider column

At every width, the post's header (date, title, subhead) is left-aligned and
its body is centred, which reads as two separate pages. The body also feels
narrow.

Options considered: **A. left-aligned on the title's edge** (picked: matches the
home page, with text on the left and the cloud on the right, and keeps the large
title) and B. everything in one centred column (rejected: the title would have
to shrink to fit the column, and the quill would need a new spot).

- `.post-body` loses `margin: 0 auto`. Its left edge is the title's left edge
  (the stage padding). `max-width` goes from 680px to 760px (about 80 characters
  at 19px). The rule above it stays and is now 760px wide from the same edge.
- Code blocks, callouts and lists widen with it. Nothing else in the body
  changes.
- The Next card and footer stay full stage width, like the home rows.
- Phone (`max-width: 700px`) looks the same, because the body is already full
  width there.
- Not in scope: the quill sitting close to the title, and the subhead's weight
  (both raised, but not picked).

## Left to the builder

- Tests for the new `homeLayout` maths (W ≤ 1920 gives the same output as
  today; W > 1920 is centred).
- Visual check at 1440, 1920, 2560 and 3440, plus phone width.
