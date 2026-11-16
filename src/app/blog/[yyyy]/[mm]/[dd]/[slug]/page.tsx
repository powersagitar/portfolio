import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { NextPost } from '@/components/post/NextPost';
import { PostHeader } from '@/components/post/PostHeader';
import { Footer } from '@/components/site/Footer';
import { MetaRow } from '@/components/site/MetaRow';
import { postPosition, splitTitle } from '@/lib/post-meta';
import { getPost, getPosts } from '@/lib/posts';

type Params = { yyyy: string; mm: string; dd: string; slug: string };

export function generateStaticParams(): Params[] {
  return getPosts().map(({ yyyy, mm, dd, slug }) => ({ yyyy, mm, dd, slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const post = getPost(await params);
  if (!post) notFound();
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: post.path },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: post.publishDate,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const p = await params;
  const post = getPost(p);
  if (!post) notFound();

  const { yyyy, mm, dd, slug } = p;
  const { default: Body } = await import(
    `@content/blog/${yyyy}/${mm}/${dd}/${slug}.mdx`
  );
  const { index, total, next } = postPosition(getPosts(), post.path);
  const { headline, subhead } = splitTitle(post.title, post.description);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-black text-[#f5f5f7]">
      {/* cloud: Task 11 */}
      <div className="wrap">
        <MetaRow
          left={
            <Link
              href="/"
              className="text-[#d1d1d6]"
              style={{ textDecoration: 'none' }}
            >
              ← Index
            </Link>
          }
          right={`05 Writing · ${index} of ${total}`}
        />
        <PostHeader
          date={post.publishDate}
          headline={headline}
          subhead={subhead}
        />
        <article className="post-body">
          <Body />
        </article>
        <NextPost
          index={index}
          total={total}
          title={next.title}
          href={next.path}
        />
        <Footer />
      </div>
    </div>
  );
}
