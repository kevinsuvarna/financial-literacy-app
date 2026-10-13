import { describe, expect, it } from 'vitest';
import { sceneTypeSchema } from '@app/content';

describe('content package wiring', () => {
  it('resolves the shared content package from apps/web', () => {
    expect(sceneTypeSchema.parse('table')).toBe('table');
  });
});
