import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DotCloud } from '@/components/dot-cloud';
import { NextPost } from '@/components/post/NextPost';
import { PostHeader } from '@/components/post/PostHeader';
import { Toc } from '@/components/post/Toc';
import { Footer } from '@/components/site/Footer';
import { MetaRow } from '@/components/site/MetaRow';
import { postPosition, splitTitle } from '@/lib/post-meta';
import { getOutline, getPost, getPosts } from '@/lib/posts';
import {
  POSTS_SECTION,
  sectionHref,
  sectionNumber,
  sectionTitle,
} from '@/lib/sections';

type Params = { yyyy: string; mm: string; dd: string; slug: string };

export const dynamicParams = false;

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
      url: post.path,
      siteName: 'Mohan Dong',
      publishedTime: post.publishDate,
      ...(post.lastEdited ? { modifiedTime: post.lastEdited } : {}),
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description: post.description,
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
  const { index, total, next, nextIndex } = postPosition(getPosts(), post.path);
  const outline = getOutline(p);
  const { headline, subhead } = splitTitle(post.title, post.description);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-black text-[#f5f5f7]">
      <DotCloud variant="post" />
      <div className="wrap">
        <MetaRow
          left={
            <Link
              href={sectionHref(POSTS_SECTION)}
              className="text-[#d1d1d6] no-underline"
            >
              ← Index
            </Link>
          }
          right={`${sectionNumber(POSTS_SECTION)} ${sectionTitle(POSTS_SECTION)} · ${index} of ${total}`}
        />
        <PostHeader
          date={post.publishDate}
          headline={headline}
          subhead={subhead}
        />
        <div className="post-layout">
          <article className="post-body">
            <Body />
          </article>
          {outline.sections.length > 0 && (
            <Toc
              sections={outline.sections}
              publishDate={post.publishDate}
              codeBlocks={outline.codeBlocks}
            />
          )}
        </div>
        <NextPost
          index={nextIndex}
          total={total}
          title={next.title}
          href={next.path}
        />
        <Footer />
      </div>
    </div>
  );
}
