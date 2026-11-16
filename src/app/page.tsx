import { HomeClient } from '@/components/home/HomeClient';
import { Footer } from '@/components/site/Footer';
import { getPosts } from '@/lib/posts';

export default function Home() {
  const posts = getPosts().map(({ path, title, publishDate }) => ({
    path,
    title,
    publishDate,
  }));
  return <HomeClient posts={posts} footer={<Footer />} />;
}
