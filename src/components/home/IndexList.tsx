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

import { About } from './panels/About';
import { Badge } from './panels/Badge';
import { Contact } from './panels/Contact';
import { HowTo } from './panels/HowTo';
import { Mssg } from './panels/Mssg';
import { Writing, type WritingPost } from './panels/Writing';

type RowId = Exclude<CloudKey, 'home'>;

type IndexListProps = {
  posts: WritingPost[];
  onCloudKey?: (key: CloudKey) => void;
};

type Row = {
  id: RowId;
  n: string;
  title: ReactNode;
  meta: string;
  panel: ReactNode;
};

const SCROLL_KEY = 'index-scroll';
let poppedBack = false;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    poppedBack = true;
  });
}

export function IndexList({ posts, onCloudKey }: IndexListProps) {
  const [open, setOpen] = useState<RowId | null>(null);
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
    const openFromHash = (e?: Event) => {
      if (window.location.hash !== '#writing') return;
      setOpen('writing');
      setKey('writing');
      // Back from a post restores the scroll saved when a link was clicked;
      // any other arrival scrolls Writing into view.
      let saved: string | null = null;
      try {
        saved = sessionStorage.getItem(SCROLL_KEY);
        sessionStorage.removeItem(SCROLL_KEY);
      } catch {}
      if (!e && poppedBack && saved !== null) {
        // Next scrolls to the hash target after mount; restore after that.
        const y = Number(saved);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => window.scrollTo(0, y)),
        );
      } else {
        document.getElementById('writing')?.scrollIntoView();
      }
      poppedBack = false;
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [setKey]);

  const rows: Row[] = [
    { id: 'about', n: '01', title: 'About', meta: 'Person', panel: <About /> },
    {
      id: 'badge',
      n: '02',
      title: 'Hack the Badge',
      meta: 'Project · Rust',
      panel: <Badge />,
    },
    {
      id: 'howto',
      n: '03',
      title: 'how-to',
      meta: 'Project · Shell',
      panel: <HowTo />,
    },
    {
      id: 'mssg',
      n: '04',
      title: 'mssg',
      meta: 'Project · TypeScript',
      panel: <Mssg />,
    },
    {
      id: 'writing',
      n: '05',
      title: (
        <>
          Writing<sup className="mono">{posts.length}</sup>
        </>
      ),
      meta: 'Posts',
      panel: <Writing posts={posts} />,
    },
    {
      id: 'contact',
      n: '06',
      title: 'Contact',
      meta: 'Elsewhere',
      panel: <Contact />,
    },
  ];

  const toggle = (value: string) => {
    const next = (value || null) as RowId | null;
    // Closing reports the row that was open; opening reports the new row.
    setKey(next ?? open ?? 'home');
    setOpen(next);
    // Keep Writing's open state in the URL so Back from a post restores it.
    const { pathname, search, hash } = window.location;
    if (next === 'writing') {
      history.replaceState(history.state, '', `${pathname}${search}#writing`);
    } else if (hash === '#writing') {
      history.replaceState(history.state, '', `${pathname}${search}`);
    }
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
        onClickCapture={(e) => {
          if (!(e.target as Element).closest('a')) return;
          try {
            sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
          } catch {}
        }}
        onMouseLeave={() => setKey(open ?? 'home')}
      >
        {rows.map((row) => (
          <AccordionItem key={row.id} value={row.id} asChild>
            <li id={row.id}>
              <AccordionTrigger
                onPointerEnter={() => setKey(row.id)}
                onFocus={() => setKey(row.id)}
              >
                <span className="n mono">{row.n}</span>
                <span className="t">{row.title}</span>
                <span className="m mono">{row.meta}</span>
              </AccordionTrigger>
              <AccordionContent forceMount>{row.panel}</AccordionContent>
            </li>
          </AccordionItem>
        ))}
      </ol>
    </Accordion>
  );
}
