'use client';

import { type ReactNode, useState } from 'react';

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
  // Read by the dot cloud in Task 11.
  const [cloudKey, setCloudKey] = useState<CloudKey>('home');

  return (
    <div
      className="relative min-h-screen overflow-x-clip bg-black text-[#f5f5f7]"
      data-cloud-key={cloudKey}
    >
      {/* cloud: Task 11 */}
      <Hero />
      <IndexList posts={posts} onCloudKey={setCloudKey} />
      <div className="relative z-1 px-[clamp(20px,4vw,64px)] pb-12">
        {footer}
      </div>
    </div>
  );
}
