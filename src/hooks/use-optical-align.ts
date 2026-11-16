'use client';

import { type RefObject, useLayoutEffect, useState } from 'react';

// Inter Bold's left side bearing on M/D: the shift before anything is measured.
const FALLBACK = '-0.062em';

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

// Render glyphs at no less than this many px so the scan resolves sub-pixel ink.
const SCAN_PX = 256;

// A glyph's optical left edge: this percentile of its per-row left edges, so a
// round or pointed extreme (S, C, A) counts as starting further in, while a
// straight stem (M, D, U) doesn't move.
const EDGE_PERCENTILE = 0.3;
// The percentile may move the edge in by at most this much, so an overhang
// (T's bar, V, Y) stays close to the edge instead of jumping to the stem far
// inside it. Both values were tuned by eye on the home name and post titles.
const MAX_INSET_EM = 0.04;

const inkCache = new Map<string, number>();

// First character of each visual line, explicit <br> breaks and soft wraps
// alike ("Mohan<br>Dong" gives M, D; a wrapped "Decoding Conditionals" gives
// D, C). A character starts a line when its box sits below the previous one.
function firstLetters(el: HTMLElement): string[] {
  const out: string[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let lastTop = -Infinity;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getClientRects()[0];
      if (!rect) continue;
      if (rect.top > lastTop + rect.height / 2) out.push(text[i]);
      lastTop = rect.top;
    }
  }
  return out;
}

// px from a glyph's origin to its optical left edge (see EDGE_PERCENTILE),
// found by drawing it and scanning each row for its first ink. Safari's
// measureText reports actualBoundingBoxLeft as 0 for every glyph, so the
// metric can't be trusted.
function glyphInk(ctx: Ctx, font: string, size: number, ch: string): number {
  const key = `${font}|${ch}`;
  const hit = inkCache.get(key);
  if (hit !== undefined) return hit;

  // Scale with a transform, not the font size, so optical sizing stays the
  // one the page uses at `size`.
  const scale = Math.max(1, SCAN_PX / size);
  const pad = Math.ceil(size * 0.5 * scale);
  const w = Math.ceil(size * 2 * scale) + pad;
  const h = Math.ceil(size * 1.6 * scale);
  const c = ctx.canvas;
  c.width = w;
  c.height = h;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.font = font;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#000';
  ctx.fillText(ch, pad / scale, size * 1.2);

  const { data } = ctx.getImageData(0, 0, w, h);
  const edges: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 0) {
        // Partial coverage in the first column: ink starts inside it.
        edges.push((x + 1 - a / 255 - pad) / scale);
        break;
      }
    }
  }
  let ink = 0;
  if (edges.length) {
    edges.sort((a, b) => a - b);
    const min = edges[0];
    const pct = edges[Math.floor(EDGE_PERCENTILE * (edges.length - 1))];
    ink = Math.min(pct, min + MAX_INSET_EM * size);
  }
  inkCache.set(key, ink);
  return ink;
}

// px from the element's left edge to the optical edge of `chars`, in the font,
// weight and size actually rendered. Positive: ink starts right of the edge.
function inkOffset(ctx: Ctx, el: HTMLElement, chars: string[]): number {
  const cs = getComputedStyle(el);
  const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const size = parseFloat(cs.fontSize);
  return Math.min(...chars.map((ch) => glyphInk(ctx, font, size, ch)));
}

/**
 * Optical left alignment for display-size headings: returns a margin-left
 * that cancels the difference between the heading's left side bearing and the
 * reference line's, so their ink lines up rather than their boxes.
 */
export function useOpticalAlign(
  head: RefObject<HTMLElement | null>,
  ref: RefObject<HTMLElement | null>,
): string {
  const [shift, setShift] = useState(FALLBACK);

  useLayoutEffect(() => {
    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(1, 1)
        : document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
    }) as Ctx | null;
    if (!ctx) return;

    let alive = true;
    const run = () => {
      const h = head.current;
      const r = ref.current;
      if (!alive || !h || !r) return;
      const hc = firstLetters(h);
      const rc = firstLetters(r).slice(0, 1);
      if (!hc.length || !rc.length) return;
      const px = -(inkOffset(ctx, h, hc) - inkOffset(ctx, r, rc));
      setShift(`${px.toFixed(2)}px`);
    };

    run();
    // The font string is the same before and after a web font loads.
    document.fonts?.ready.then(() => {
      inkCache.clear();
      run();
    });
    // The heading's size is fluid (clamp(...vw)), so re-measure as it resizes.
    const ro = new ResizeObserver(run);
    if (head.current) ro.observe(head.current);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [head, ref]);

  return shift;
}
