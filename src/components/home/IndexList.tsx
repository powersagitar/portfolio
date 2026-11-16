'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { CloudKey } from '@/components/dot-cloud/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  SECTIONS,
  type SectionId,
  pad2,
  sectionFromHash,
} from '@/lib/sections';

import { About } from './panels/About';
import { Badge } from './panels/Badge';
import { Contact } from './panels/Contact';
import { HowTo } from './panels/HowTo';
import { Mssg } from './panels/Mssg';
import { Writing, type WritingPost } from './panels/Writing';

type IndexListProps = {
  posts: WritingPost[];
  onCloudKey?: (key: CloudKey) => void;
};

// Per-row content. `Record<SectionId, …>` makes TypeScript fail if a section
// in `SECTIONS` has no panel, or a panel has no section.
type RowExtra = { panel: ReactNode; sup?: ReactNode };

const SCROLL_KEY = 'index-scroll';
let poppedBack = false;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    poppedBack = true;
  });
}

export function IndexList({ posts, onCloudKey }: IndexListProps) {
  const [open, setOpen] = useState<SectionId | null>(null);
  const [instant, setInstant] = useState(false);
  const keyRef = useRef<CloudKey>('home');

  const setKey = useCallback(
    (key: CloudKey) => {
      if (keyRef.current === key) return;
      keyRef.current = key;
      onCloudKey?.(key);
    },
    [onCloudKey],
  );

  useEffect(() => {
    // The URL hash is the source of truth for which row is open: on load and
    // on every hashchange (in-page links, manual edits) the row follows it.
    const openFromHash = (e?: Event) => {
      const id = sectionFromHash(window.location.hash);
      setOpen(id);
      if (!id) {
        if (e) setKey('home');
        return;
      }
      setKey(id);
      // Back from a link restores the scroll saved when a link was clicked;
      // any other arrival scrolls the row into view.
      let saved: string | null = null;
      try {
        saved = sessionStorage.getItem(SCROLL_KEY);
        sessionStorage.removeItem(SCROLL_KEY);
      } catch {}
      if (!e) {
        // Arriving on the page: open without the panel transition so the
        // page is already tall enough to scroll to. Scrolling earlier gets
        // clamped by the still-collapsed panel. Next scrolls to the hash
        // target after mount, so scroll after that, then re-enable
        // transitions.
        const restore = poppedBack && saved !== null ? Number(saved) : null;
        setInstant(true);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (restore !== null) window.scrollTo(0, restore);
            else document.getElementById(id)?.scrollIntoView();
            setInstant(false);
          }),
        );
      } else {
        document.getElementById(id)?.scrollIntoView();
      }
      poppedBack = false;
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [setKey]);

  const extras: Record<SectionId, RowExtra> = {
    about: { panel: <About /> },
    badge: { panel: <Badge /> },
    howto: { panel: <HowTo /> },
    mssg: { panel: <Mssg /> },
    writing: { panel: <Writing posts={posts} />, sup: posts.length },
    contact: { panel: <Contact /> },
  };

  const toggle = (value: string) => {
    const next = (value || null) as SectionId | null;
    // Closing reports the row that was open; opening reports the new row.
    setKey(next ?? open ?? 'home');
    setOpen(next);
    // Mirror the open row in the URL so it can be linked to and Back from a
    // post restores it. replaceState: no history entry per toggle, no jump.
    const { pathname, search } = window.location;
    history.replaceState(
      history.state,
      '',
      `${pathname}${search}${next ? `#${next}` : ''}`,
    );
  };

  return (
    <Accordion
      asChild
      type="single"
      collapsible
      value={open ?? ''}
      onValueChange={toggle}
    >
      <ol
        className="idx"
        data-instant={instant || undefined}
        onClickCapture={(e) => {
          if (!(e.target as Element).closest('a')) return;
          try {
            sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
          } catch {}
        }}
        onMouseLeave={() => setKey(open ?? 'home')}
      >
        {SECTIONS.map((row, i) => (
          <AccordionItem key={row.id} value={row.id} asChild>
            <li id={row.id}>
              <AccordionTrigger
                onPointerEnter={() => setKey(row.id)}
                onFocus={() => setKey(row.id)}
              >
                <span className="n mono">{pad2(i + 1)}</span>
                <span className="t">
                  {row.title}
                  {extras[row.id].sup !== undefined && (
                    <sup className="mono">{extras[row.id].sup}</sup>
                  )}
                </span>
                <span className="m mono">{row.meta}</span>
              </AccordionTrigger>
              <AccordionContent forceMount>
                {extras[row.id].panel}
              </AccordionContent>
            </li>
          </AccordionItem>
        ))}
      </ol>
    </Accordion>
  );
}
