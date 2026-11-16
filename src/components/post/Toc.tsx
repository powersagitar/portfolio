'use client';

import { useEffect, useState } from 'react';

import type { TocEntry } from '@/lib/outline';

import { tocState } from './toc-state';

type TocProps = {
  sections: TocEntry[];
  publishDate: string;
  codeBlocks: number;
};

const pad = (n: number) => String(n).padStart(2, '0');

export function Toc({ sections, publishDate, codeBlocks }: TocProps) {
  // Server render and no-JS: nothing highlighted, rail empty.
  const [state, setState] = useState({ active: -1, progress: 0 });

  useEffect(() => {
    const article = document.querySelector('article.post-body');
    if (!article) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const tops = sections.map(
        ({ id }) =>
          document.getElementById(id)?.getBoundingClientRect().top ?? Infinity,
      );
      const { top, height } = article.getBoundingClientRect();
      const next = tocState(tops, { top, height }, window.innerHeight);
      setState((prev) =>
        prev.active === next.active && prev.progress === next.progress
          ? prev
          : next,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const link = (e.target as Element).closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!link) return;
      const id = decodeURIComponent(link.getAttribute('href')!.slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView();
      // Move focus too (keyboard users), without a second scroll.
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      // replaceState: no history entry per click (as in IndexList).
      const { pathname, search } = window.location;
      history.replaceState(
        history.state,
        '',
        `${pathname}${search}#${encodeURIComponent(id)}`,
      );
    };
    const layout = document.querySelector('.post-layout');

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    layout?.addEventListener('click', onClick as EventListener);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      layout?.removeEventListener('click', onClick as EventListener);
    };
  }, [sections]);

  return (
    <nav className="toc" aria-label="On this page">
      <p className="lbl mono">On this page</p>
      <div className="tl">
        <span className="rail" aria-hidden>
          <span
            className="fill"
            style={{ height: `${state.progress * 100}%` }}
          />
        </span>
        <ol>
          {sections.map(({ id, label }, i) => {
            const on = i === state.active;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={on ? 'on' : undefined}
                  aria-current={on ? 'location' : undefined}
                >
                  <span className="n mono">{pad(i + 1)}</span>
                  <span>{label}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
      <dl className="mono">
        <dt>Published</dt>
        <dd>{publishDate}</dd>
        <dt>Sections</dt>
        <dd>{pad(sections.length)}</dd>
        {codeBlocks > 0 && (
          <>
            <dt>Code</dt>
            <dd>
              {pad(codeBlocks)} {codeBlocks === 1 ? 'block' : 'blocks'}
            </dd>
          </>
        )}
      </dl>
    </nav>
  );
}
