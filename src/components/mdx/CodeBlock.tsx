import type { ComponentProps } from 'react';

const LABELS: Record<string, string> = {
  cpp: 'C++',
  plaintext: 'Code',
  text: 'Code',
};

export function codeLabel(lang?: string): string {
  if (!lang) return 'Code';
  return LABELS[lang] ?? lang.toUpperCase();
}

export function CodeBlock({
  'data-language': lang,
  ...rest
}: ComponentProps<'pre'> & { 'data-language'?: string }) {
  return (
    <div className="codeblk">
      <span className="lang mono">{codeLabel(lang)}</span>
      <pre data-language={lang} {...rest} />
    </div>
  );
}
