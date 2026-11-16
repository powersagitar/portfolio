import { describe, expect, test } from 'bun:test';

import { codeLabel } from './CodeBlock';

describe('codeLabel', () => {
  test('maps known and unknown languages', () => {
    expect(codeLabel('cpp')).toBe('C++');
    expect(codeLabel('rust')).toBe('RUST');
  });
  test('falls back to Code', () => {
    expect(codeLabel(undefined)).toBe('Code');
    expect(codeLabel('plaintext')).toBe('Code');
    expect(codeLabel('text')).toBe('Code');
  });
});
