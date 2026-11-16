'use client';

import { type ReactNode, useState } from 'react';

import { DotCloud } from '@/components/dot-cloud';
import type { CloudKey } from '@/components/dot-cloud/types';

import { Hero } from './Hero';
import { IndexList } from './IndexList';
import type { WritingPost } from './panels/Writing';

type HomeClientProps = {
  posts: WritingPost[];
  // Server-rendered so its build year stays the build year.
  footer: ReactNode;
};

export function HomeClient({ posts, footer }: HomeClientProps) {
  const [cloudKey, setCloudKey] = useState<CloudKey>('home');

  return (
    <div className="relative min-h-screen overflow-x-clip bg-black text-[#f5f5f7]">
      <DotCloud variant="home" cloudKey={cloudKey} />
      <Hero />
      <IndexList posts={posts} onCloudKey={setCloudKey} />
      <div className="relative z-1 px-(--gutter) pb-12">{footer}</div>
    </div>
  );
}
