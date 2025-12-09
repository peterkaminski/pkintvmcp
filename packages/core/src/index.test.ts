import { describe, test, expect } from 'vitest';
import { version, phase } from './index.js';

describe('@pkintvmcp/core', () => {
  test('exports version', () => {
    expect(version).toBe('0.1.0');
  });

  test('exports phase', () => {
    expect(phase).toBe('1.1-skeleton');
  });

  test('placeholder test (Sprint 1.1)', () => {
    // This ensures tests run successfully
    // Real tests will be added in Sprint 1.2+
    expect(true).toBe(true);
  });
});
