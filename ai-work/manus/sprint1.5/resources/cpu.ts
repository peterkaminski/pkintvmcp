/**
 * CPU implementation
 */

import type { CPUState, CPUFlags } from './cpu.types.js';
import { toUint16 } from '../utils/bitops.js';

export class CPU {
  private registers: Uint16Array;
  private flags: CPUFlags;
  private cycles: number;
  private halted: boolean;
  private sdbd: boolean;

  constructor() {
    this.registers = new Uint16Array(8);
    this.flags = {
      C: false,
      OV: false,
      Z: false,
      S: false,
    };
    this.cycles = 0;
    this.halted = false;
    this.sdbd = false;
  }

  /**
   * Get the value of a register by index (0-7)
   */
  public getRegister(index: number): number {
    if (index < 0 || index > 7) {
      throw new Error(`Invalid register index: ${index}. Must be between 0 and 7.`);
    }
    return this.registers[index];
  }

  /**
   * Set the value of a register by index (0-7), wrapping to 16-bit
   */
  public setRegister(index: number, value: number): void {
    if (index < 0 || index > 7) {
      throw new Error(`Invalid register index: ${index}. Must be between 0 and 7.`);
    }
    this.registers[index] = toUint16(value);
  }

  /**
   * Get the Program Counter (R7)
   */
  public getPC(): number {
    return this.registers[7];
  }

  /**
   * Set the Program Counter (R7)
   */
  public setPC(val: number): void {
    this.registers[7] = toUint16(val);
  }

  /**
   * Increment the Program Counter, wrapping at 16 bits
   */
  public incrementPC(): void {
    this.registers[7] = toUint16(this.registers[7] + 1);
  }

  /**
   * Get a copy of the current flags
   */
  public getFlags(): CPUFlags {
    return {
      C: this.flags.C,
      OV: this.flags.OV,
      Z: this.flags.Z,
      S: this.flags.S,
    };
  }

  /**
   * Set flags using a partial update
   */
  public setFlags(partial: Partial<CPUFlags>): void {
    if (partial.C !== undefined) this.flags.C = partial.C;
    if (partial.OV !== undefined) this.flags.OV = partial.OV;
    if (partial.Z !== undefined) this.flags.Z = partial.Z;
    if (partial.S !== undefined) this.flags.S = partial.S;
  }

  /**
   * Reset the CPU to initial state
   */
  public reset(): void {
    this.registers.fill(0);
    this.flags = {
      C: false,
      OV: false,
      Z: false,
      S: false,
    };
    this.cycles = 0;
    this.halted = false;
    this.sdbd = false;
  }

  /**
   * Get a deep copy of the current CPU state
   */
  public getState(): CPUState {
    return {
      registers: new Uint16Array(this.registers),
      flags: {
        C: this.flags.C,
        OV: this.flags.OV,
        Z: this.flags.Z,
        S: this.flags.S,
      },
      cycles: this.cycles,
      halted: this.halted,
      sdbd: this.sdbd,
    };
  }

  /**
   * Load a CPU state, performing a deep copy
   */
  public setState(state: CPUState): void {
    this.registers = new Uint16Array(state.registers);
    this.flags = {
      C: state.flags.C,
      OV: state.flags.OV,
      Z: state.flags.Z,
      S: state.flags.S,
    };
    this.cycles = state.cycles;
    this.halted = state.halted;
    this.sdbd = state.sdbd;
  }

  /**
   * Add cycles to the cycle counter
   */
  public addCycles(n: number): void {
    this.cycles += n;
  }

  /**
   * Get the current cycle count
   */
  public getCycles(): number {
    return this.cycles;
  }
}
