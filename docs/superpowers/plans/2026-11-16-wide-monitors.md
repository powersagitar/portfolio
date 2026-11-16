# Wide Monitors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Above 1920px the page keeps its laptop composition in a centred
stage, and the post body aligns with the post title in a wider column.

**Architecture:** One CSS custom property `--gutter` replaces every
`clamp(20px, 4vw, 64px)` horizontal padding and grows to centre a 1920px stage.
Display-type caps rise to their 1920px values. `homeLayout` takes an optional
max stage width so the home cloud follows the stage. The post cloud and post
body change in CSS only.

**Tech Stack:** Next.js 16, Tailwind v4, three.js, Bun test.

**Spec:** `docs/superpowers/specs/2026-11-16-wide-monitors-design.md`

## Global Constraints

- Stage max width `1920px` (padding included). At or below 1920px wide, nothing
  on the home page changes.
- Gutter:
  `max(clamp(20px, 4vw, 64px), calc((100vw - 1920px) / 2 + 64px))`.
- Phone breakpoint `max-width: 700px`: phone padding rules stay as they are.
- Bun only. Use `type`, not `interface`. Prettier: single quotes, semicolons,
  trailing commas, sorted Tailwind classes.
- `homeLayout`'s W/H are **device pixels**: the stage width passed in must be
  `1920 * dpr`.

## Review Focus

- Exactly 1920px wide: the gutter is continuous (both terms are 64px), so there
  is no jump. Check by measuring at 1919, 1920 and 1921.
- Phone (390px): the Hero's `max-[700px]:px-5` and the `.wrap` phone padding
  still win over `--gutter`, so the padding stays 20px.
- dpr 2 at 3440 CSS px: the home cloud centres on the stage, not on a stage
  that is half as wide (unit test with dpr-scaled values).
- `homeBlend` 1 (home dust) still fills the whole viewport at ultrawide (unit
  test).
- A post with code blocks or callouts: they widen to 760px and stay
  left-aligned with the title (visual check).

---

### Task 1: Stage gutter, type caps, post cloud anchor

**Files:**

- Modify: `src/app/globals.css` (`:root`, `.wrap`, `.post-title`,
  `.next-post .t`, `.cloud-post`, `.name`, `.idx`, `.row .t`)
- Modify: `src/components/home/Hero.tsx:16`
- Modify: `src/components/home/HomeClient.tsx:26`
- Modify: `CLAUDE.md` (Keep in sync)

**Interfaces:**

- Produces: CSS custom property `--gutter` on `:root`.

- [ ] **Step 1:** In `:root`, add `--stage: 1920px;` and
      `--gutter: max(clamp(20px, 4vw, 64px), calc((100vw - var(--stage)) / 2 + 64px));`.
- [ ] **Step 2:** Replace the horizontal `clamp(20px, 4vw, 64px)` with
      `var(--gutter)` in `.wrap` and `.idx`. Replace
      `px-[clamp(20px,4vw,64px)]` with `px-(--gutter)` in `Hero.tsx` and
      `HomeClient.tsx`. Leave the `max-[700px]:px-5` override in place.
- [ ] **Step 3:** Raise the caps: `.name` 248px → 298px, `.row .t` 116px →
      142px, `.post-title` 132px → 161px, `.next-post .t` 72px → 96px. Leave the
      vw and min terms as they are.
- [ ] **Step 4:** `.cloud-post` (desktop rule): set
      `right: max(0px, calc((100vw - var(--stage)) / 2))` and
      `width: min(46vw, 883px)`. The phone rule is unchanged.
- [ ] **Step 5:** In `CLAUDE.md` "Keep in sync", add: "The stage width 1920px
      is `--stage` in `globals.css` and `STAGE_MAX` in
      `src/components/dot-cloud/math.ts`."
- [ ] **Step 6: Verify.** Run `bun run lint && bun run prettier:check`.
      Expected: clean. With the dev server on :3000, use Chrome DevTools at
      1440, 1919, 1920, 1921, 3440 and 390 px wide. Run
      `getComputedStyle(document.querySelector('.idx')).paddingLeft`.
      Expected: 57.6px, 64px, 64px, 64.5px, 824px and 20px (`.wrap`/Hero match
      on their pages). Take screenshots at 3440 of `/#about` and of a post.
- [ ] **Step 7: Commit** with
      `feat(layout): centre a 1920px stage on wide monitors`.

### Task 2: Home cloud follows the stage

**Files:**

- Modify: `src/components/dot-cloud/math.ts:14-31`
- Modify: `src/components/dot-cloud/simulation.ts:255`
- Test: `src/components/dot-cloud/math.test.ts`

**Interfaces:**

- Produces:
  `export const STAGE_MAX = 1920;` (CSS px) and
  `homeLayout(W: number, H: number, phone: boolean, homeBlend: number, maxW = Infinity): Layout`
  (`maxW` in device px).

- [ ] **Step 1: Write failing tests** in the `layouts` describe block:

```ts
test('home desktop, wider than the stage', () => {
  // F = 1920, L = 760, S = min(1113.6, 1440) * 0.34
  close(homeLayout(3440, 1440, false, 0, 1920), {
    ox: 760 + 1920 * 0.71,
    oy: 720,
    sx: 378.624,
    sy: 378.624,
  });
});
test('home stage scales with dpr', () => {
  close(homeLayout(6880, 2880, false, 0, STAGE_MAX * 2), {
    ox: 1520 + 3840 * 0.71,
    sx: 757.248,
  });
});
test('home narrower than the stage is unchanged', () => {
  close(homeLayout(1000, 800, false, 0, 1920), { ox: 710, sx: 197.2 });
});
test('home dust ignores the stage', () => {
  close(homeLayout(3440, 1440, false, 1, 1920), {
    ox: 1720,
    sx: 1720 / 1.3,
  });
});
```

- [ ] **Step 2:** Run `bun test src/components/dot-cloud/math.test.ts`.
      Expected: the new tests FAIL (`STAGE_MAX` is not exported, or ox is
      wrong).
- [ ] **Step 3:** Implement. For desktop, `F = min(W, maxW)` and
      `L = (W - F) / 2`, then `S = min(F * 0.58, H) * 0.34` and
      `sox = L + F * 0.71`. The phone branch and the blend-1 targets keep
      using `W`. In `simulation.ts`, pass `STAGE_MAX * i.dpr` as `maxW`.
- [ ] **Step 4:** Run `bun run test`. Expected: all tests pass.
- [ ] **Step 5: Verify** at 3440×1440 on `/#about` with a screenshot. The
      network sits to the right of the text, inside the stage.
- [ ] **Step 6: Commit** with `feat(cloud): anchor the home cloud to the stage`.

### Task 3: Post body on the title's edge, 760px

**Files:**

- Modify: `src/app/globals.css` (`.post-body`)

- [ ] **Step 1:** In `.post-body`, replace `margin: 0 auto` with `margin: 0`
      and change `max-width: 680px` to `max-width: 760px`.
- [ ] **Step 2: Verify.** At 1440 and 3440, on
      `/blog/2026/11/16/hack-the-badge`, check
      `document.querySelector('.post-body').getBoundingClientRect().left ===
      document.querySelector('.post-title').getBoundingClientRect().left`
      (within the optical-align offset, a few px). Width is 760. Scroll to a
      code block and a callout and take screenshots. At 390, the body is full
      width as before.
- [ ] **Step 3:** Run `bun run lint && bun run prettier:check && bun run build`.
      Expected: clean, and the build succeeds.
- [ ] **Step 4: Commit** with
      `feat(post): align the body with the title, widen to 760px`.
