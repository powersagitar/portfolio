import type { ComponentProps, ReactNode } from 'react';

type AnchorProps = Omit<ComponentProps<'a'>, 'className'> & {
  className?: string | string[];
};

// Keep in sync with src/mdx-components.tsx: the feed renders Callout as a
// plain blockquote, drops the heading `#` links and renders `pre` without
// CodeBlock's label strip, because feed readers have no site CSS.
export const feedComponents = {
  Callout: ({ children }: { children?: ReactNode }) => (
    <blockquote>{children}</blockquote>
  ),
  pre: (p: ComponentProps<'pre'>) => <pre {...p} />,
  a: (p: AnchorProps) => {
    const cls = p.className;
    const names = Array.isArray(cls) ? cls : (cls ?? '').split(/\s+/);
    if (names.includes('anc')) return null;
    return <a {...p} className={names.join(' ') || undefined} />;
  },
};
