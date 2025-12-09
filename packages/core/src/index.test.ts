import { describe, test, expect } from 'vitest';
import { version, phase } from './index.js';

describe('@pkintvmcp/core', () => {
  test('exports version', () => {
    expect(version).toBe('0.1.0');
  });

  test('exports phase', () => {
    expect(phase).toBe('1.2-decoder');
  });

  test('exports Memory class', async () => {
    const { Memory } = await import('./index.js');
    expect(Memory).toBeDefined();
  });

  test('exports decoder types', async () => {
    const { OpcodeEnum, AddressingModeEnum } = await import('./index.js');
    expect(OpcodeEnum).toBeDefined();
    expect(AddressingModeEnum).toBeDefined();
  });
});
