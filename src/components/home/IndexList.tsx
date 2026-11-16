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
    const openFromHash = () => {
      if (window.location.hash !== '#writing') return;
      setOpen('writing');
      setKey('writing');
      document.getElementById('writing')?.scrollIntoView();
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
  };

  return (
    <Accordion
      asChild
      type="single"
      collapsible
      value={open ?? ''}
      onValueChange={toggle}
    >
      <ol className="idx" onMouseLeave={() => setKey(open ?? 'home')}>
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
