'use client';

import { useRef } from 'react';

import { MetaRow } from '@/components/site/MetaRow';
import { useOpticalAlign } from '@/hooks/use-optical-align';

export function Hero() {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const marginLeft = useOpticalAlign(nameRef, taglineRef);

  return (
    <section
      className="relative z-1 box-border flex min-h-screen flex-col justify-between px-[clamp(20px,4vw,64px)] pt-10 pb-12 max-[700px]:min-h-[88vh] max-[700px]:px-5 max-[700px]:pt-6 max-[700px]:pb-8"
      aria-label="Introduction"
    >
      <MetaRow left="Index — 06" right="mohandong.com" />
      <div className="flex flex-col gap-10">
        <h1 ref={nameRef} className="name" style={{ marginLeft }}>
          Mohan
          <br />
          Dong
        </h1>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <p
            ref={taglineRef}
            className="m-0 max-w-[26ch] text-[clamp(20px,2.2vw,30px)] leading-[1.25] font-medium tracking-[-0.02em]"
          >
            Software Engineering,
            <br />
            University of Waterloo.
          </p>
          <p className="mono m-0 text-[14px] tracking-[.04em] text-[#86868b]">
            Design. Develop. Deliver.
          </p>
        </div>
      </div>
    </section>
  );
}
