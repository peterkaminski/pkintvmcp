/**
 * @pkintvmcp/core - Memory Type Definitions
 *
 * Types for CP-1600 memory system
 * Sprint 1.2: Basic implementation for decoder
 */

/**
 * Memory Region Type
 *
 * Distinguishes different types of memory for future ROM/RAM handling
 */
export enum MemoryRegion {
  /** Read-Only Memory (ROM) */
  ROM = 'ROM',

  /** Random Access Memory (RAM) */
  RAM = 'RAM',

  /** Memory-Mapped I/O (Phase 3) */
  MMIO = 'MMIO',
}

/**
 * Memory Configuration Options
 */
export interface MemoryOptions {
  /**
   * Initial size in 16-bit words
   * Default: 65536 (64K words)
   */
  size?: number;

  /**
   * Enable bounds checking on read/write
   * Default: true
   */
  boundsCheck?: boolean;

  /**
   * Enable write protection for ROM regions (Phase 2)
   * Default: false (not implemented in Phase 1)
   */
  writeProtection?: boolean;
}
