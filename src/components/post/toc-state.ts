/** Fraction of the viewport height where a section counts as "current". */
const LINE = 0.33;

export type TocState = { active: number; progress: number };

/**
 * Reading position for the contents column. `headingTops` and `article.top`
 * are viewport-relative (getBoundingClientRect). The current section is the
 * last heading whose top has passed the line; progress is how far the line
 * has travelled through the article, clamped to 0-1.
 */
export function tocState(
  headingTops: number[],
  article: { top: number; height: number },
  vh: number,
): TocState {
  const line = LINE * vh;
  let active = 0;
  headingTops.forEach((top, i) => {
    if (top <= line) active = i;
  });
  const raw = (line - article.top) / Math.max(1, article.height - 0.5 * vh);
  return { active, progress: Math.min(1, Math.max(0, raw)) };
}
