import { describe, it, expect } from 'vitest';
import { extractOutline, detectLanguage } from './outline.js';

describe('detectLanguage', () => {
  it('maps extensions', () => {
    expect(detectLanguage('a/b/c.ts')).toBe('typescript');
    expect(detectLanguage('main.py')).toBe('python');
    expect(detectLanguage('x.unknownext')).toBeUndefined();
  });
});

describe('extractOutline', () => {
  it('finds TS functions, classes, interfaces, types', () => {
    const src = [
      'export function foo() {}',
      'class Bar {}',
      'export interface Baz { x: number }',
      'export type Qux = string;',
      'export const Helper = () => {};',
    ].join('\n');
    const syms = extractOutline(src, 'typescript');
    const names = syms.map((s) => s.name);
    expect(names).toContain('foo');
    expect(names).toContain('Bar');
    expect(names).toContain('Baz');
    expect(names).toContain('Qux');
    expect(names).toContain('Helper');
  });

  it('reports 1-based line numbers', () => {
    const syms = extractOutline('\n\ndef hello():\n    pass', 'python');
    expect(syms[0]).toMatchObject({ name: 'hello', line: 3 });
  });

  it('returns nothing for unknown languages', () => {
    expect(extractOutline('whatever', undefined)).toEqual([]);
  });
});
