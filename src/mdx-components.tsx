import type { MDXComponents } from 'mdx/types';

import { Callout } from '@/components/mdx/Callout';
import { CodeBlock } from '@/components/mdx/CodeBlock';

export function useMDXComponents(
  components: MDXComponents = {},
): MDXComponents {
  return { Callout, pre: CodeBlock, ...components };
}
