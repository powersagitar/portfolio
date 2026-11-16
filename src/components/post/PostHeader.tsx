'use client';

import { useRef } from 'react';

import { useOpticalAlign } from '@/hooks/use-optical-align';

type PostHeaderProps = { date: string; headline: string; subhead: string };

export function PostHeader({ date, headline, subhead }: PostHeaderProps) {
  const headRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const marginLeft = useOpticalAlign(headRef, subRef);

  return (
    <header className="flex flex-col gap-7 pt-[clamp(96px,16vh,200px)] pb-16">
      <p className="mono m-0 text-sm tracking-[.04em] text-[#86868b]">{date}</p>
      <h1 ref={headRef} className="post-title" style={{ marginLeft }}>
        {headline}
      </h1>
      <p
        ref={subRef}
        className="m-0 max-w-[30ch] text-[clamp(22px,2.4vw,32px)] leading-[1.25] font-medium tracking-[-0.02em] text-[#d1d1d6]"
      >
        {subhead}
      </p>
    </header>
  );
}
