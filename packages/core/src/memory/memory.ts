/**
 * @pkintvmcp/core - Memory Implementation
 *
 * CP-1600 Memory System
 * Sprint 1.2: Stub implementation for decoder support
 * Sprint 1.3+: Full implementation with ROM/RAM distinction, write protection
 */

import type { MemoryOptions } from './memory.types.js';

/**
 * Memory Class
 *
 * Represents the CP-1600's 64K word (16-bit) address space.
 *
 * Phase 1.2 (Current): Basic read/write for decoder
 * Phase 1.3+: ROM/RAM regions, write protection, MMIO (Phase 3)
 */
export class Memory {
  /** Memory storage: 64K of 16-bit words */
  private data: Uint16Array;

  /** Memory size in 16-bit words */
  private size: number;

  /** Enable bounds checking */
  private boundsCheck: boolean;

  /**
   * Create a new Memory instance
   *
   * @param options - Memory configuration options
   */
  constructor(options: MemoryOptions = {}) {
    this.size = options.size ?? 65536; // 64K words default
    this.boundsCheck = options.boundsCheck ?? true;
    this.data = new Uint16Array(this.size);
  }

  /**
   * Read a 16-bit word from memory
   *
   * @param address - Memory address (0x0000 - 0xFFFF)
   * @returns 16-bit value at address
   * @throws Error if address is out of bounds (when boundsCheck enabled)
   */
  read(address: number): number {
    // Mask address to 16 bits
    const addr = address & 0xFFFF;

    // Bounds check
    if (this.boundsCheck && addr >= this.size) {
      throw new Error(`Memory read out of bounds: address $${addr.toString(16).toUpperCase().padStart(4, '0')}`);
    }

    return this.data[addr];
  }

  /**
   * Write a 16-bit word to memory
   *
   * @param address - Memory address (0x0000 - 0xFFFF)
   * @param value - 16-bit value to write
   * @throws Error if address is out of bounds (when boundsCheck enabled)
   */
  write(address: number, value: number): void {
    // Mask address to 16 bits
    const addr = address & 0xFFFF;

    // Mask value to 16 bits
    const val = value & 0xFFFF;

    // Bounds check
    if (this.boundsCheck && addr >= this.size) {
      throw new Error(`Memory write out of bounds: address $${addr.toString(16).toUpperCase().padStart(4, '0')}`);
    }

    this.data[addr] = val;
  }

  /**
   * Load data into memory starting at specified address
   *
   * Useful for loading ROM images
   *
   * @param address - Starting address
   * @param data - Array of 16-bit words to load
   */
  load(address: number, data: number[]): void {
    const addr = address & 0xFFFF;

    for (let i = 0; i < data.length; i++) {
      this.write(addr + i, data[i]);
    }
  }

  /**
   * Load data from Uint16Array into memory
   *
   * @param address - Starting address
   * @param data - Uint16Array to load
   */
  loadBuffer(address: number, data: Uint16Array): void {
    const addr = address & 0xFFFF;
    const length = Math.min(data.length, this.size - addr);

    this.data.set(data.subarray(0, length), addr);
  }

  /**
   * Clear all memory to zero
   */
  clear(): void {
    this.data.fill(0);
  }

  /**
   * Clear a range of memory to zero
   *
   * @param start - Start address (inclusive)
   * @param end - End address (inclusive)
   */
  clearRange(start: number, end: number): void {
    const startAddr = start & 0xFFFF;
    const endAddr = end & 0xFFFF;

    for (let addr = startAddr; addr <= endAddr && addr < this.size; addr++) {
      this.data[addr] = 0;
    }
  }

  /**
   * Get memory size in words
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get a copy of a memory range
   *
   * @param start - Start address
   * @param length - Number of words to read
   * @returns Array of 16-bit words
   */
  readRange(start: number, length: number): number[] {
    const addr = start & 0xFFFF;
    const result: number[] = [];

    for (let i = 0; i < length && (addr + i) < this.size; i++) {
      result.push(this.data[addr + i]);
    }

    return result;
  }

  /**
   * Dump memory contents for debugging
   *
   * @param start - Start address
   * @param length - Number of words to dump
   * @returns Formatted string representation
   */
  dump(start: number, length: number = 16): string {
    const addr = start & 0xFFFF;
    const lines: string[] = [];

    for (let i = 0; i < length; i += 8) {
      const lineAddr = addr + i;
      const words: string[] = [];

      for (let j = 0; j < 8 && (i + j) < length; j++) {
        const value = this.read(lineAddr + j);
        words.push(value.toString(16).toUpperCase().padStart(4, '0'));
      }

      lines.push(`$${lineAddr.toString(16).toUpperCase().padStart(4, '0')}: ${words.join(' ')}`);
    }

    return lines.join('\n');
  }
}
