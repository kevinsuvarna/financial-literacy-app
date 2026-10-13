import { describe, expect, it } from 'vitest';
import { sceneTypeSchema } from './schema';

describe('sceneTypeSchema', () => {
  it('accepts the four defined scene types', () => {
    for (const type of ['call', 'table', 'screen', 'cinematic'] as const) {
      expect(sceneTypeSchema.parse(type)).toBe(type);
    }
  });

  it('rejects unknown scene types', () => {
    expect(() => sceneTypeSchema.parse('cutscene')).toThrow();
  });
});
