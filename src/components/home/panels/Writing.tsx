import Link from 'next/link';

import type { Post } from '@/lib/post-meta';

export type WritingPost = Pick<Post, 'path' | 'title' | 'publishDate'>;

export function Writing({ posts }: { posts: WritingPost[] }) {
  return (
    <div className="pin block">
      <div className="max-w-[1040px] border-b border-[#1d1d1f]">
        {posts.map((post) => (
          <Link key={post.path} className="post" href={post.path}>
            <span className="pd mono">{post.publishDate}</span>
            <span className="pt">{post.title}</span>
            <span className="pa text-[#86868b]" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
