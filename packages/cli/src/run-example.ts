#!/usr/bin/env node

/**
 * @pkintvmcp/cli - Run Example ROM
 *
 * Simple CLI test runner for CP-1600 ROM files
 * Sprint 1.7 Phase 1: Foundation for MCP server implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import { CPU, Memory, Decoder, Executor } from '@pkintvmcp/core';
import type { CPUState } from '@pkintvmcp/core';

interface RunOptions {
  romPath: string;
  loadAddress?: number;
  maxCycles?: number;
  trace?: boolean;
  verbose?: boolean;
}

interface ExecutionResult {
  finalState: CPUState;
  instructionsExecuted: number;
  reason: 'halted' | 'max_cycles' | 'error';
  error?: string;
}

/**
 * Load a binary ROM file and return as array of 16-bit words
 */
function loadROM(romPath: string): Uint16Array {
  const absolutePath = path.resolve(romPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`ROM file not found: ${absolutePath}`);
  }

  // Read binary file
  const buffer = fs.readFileSync(absolutePath);

  // CP-1600 ROMs are stored as 16-bit words in little-endian format
  // Each word is 2 bytes
  const wordCount = Math.floor(buffer.length / 2);
  const words = new Uint16Array(wordCount);

  for (let i = 0; i < wordCount; i++) {
    const byte0 = buffer[i * 2];
    const byte1 = buffer[i * 2 + 1];
    words[i] = (byte1 << 8) | byte0; // Little-endian
  }

  return words;
}

/**
 * Format register value for display
 */
function formatRegister(value: number): string {
  return `$${value.toString(16).toUpperCase().padStart(4, '0')} (${value})`;
}

/**
 * Format flags for display
 */
function formatFlags(flags: CPUState['flags']): string {
  const parts = [];
  parts.push(flags.S ? 'S=1' : 'S=0');
  parts.push(flags.Z ? 'Z=1' : 'Z=0');
  parts.push(flags.OV ? 'OV=1' : 'OV=0');
  parts.push(flags.C ? 'C=1' : 'C=0');
  return parts.join(' ');
}

/**
 * Execute a ROM file
 */
function executeROM(options: RunOptions): ExecutionResult {
  const {
    romPath,
    loadAddress = 0x5000, // Default cartridge load address
    maxCycles = 10000,
    trace = false,
    verbose = false
  } = options;

  try {
    // Load ROM
    if (verbose) {
      console.log(`Loading ROM: ${romPath}`);
    }
    const romData = loadROM(romPath);
    if (verbose) {
      console.log(`ROM size: ${romData.length} words (${romData.length * 2} bytes)`);
      console.log(`Load address: $${loadAddress.toString(16).toUpperCase().padStart(4, '0')}`);
    }

    // Create emulator components
    const memory = new Memory();
    const cpu = new CPU();
    const decoder = new Decoder(memory);
    const executor = new Executor(cpu, memory, { trace });

    // Load ROM into memory
    const romArray = Array.from(romData);
    memory.load(loadAddress, romArray);

    // Set PC to entry point
    cpu.setPC(loadAddress);

    if (verbose) {
      console.log(`\nStarting execution at $${loadAddress.toString(16).toUpperCase().padStart(4, '0')}\n`);
    }

    // Execution loop
    let instructionsExecuted = 0;
    const state = cpu.getState();

    while (!state.halted && state.cycles < maxCycles) {
      const pc = cpu.getPC();
      const sdbd = state.sdbd;

      // Decode instruction at PC
      const instruction = decoder.decode(pc, sdbd);

      if (trace) {
        console.log(`[$${pc.toString(16).toUpperCase().padStart(4, '0')}] ${instruction.opcode}`);
      }

      // Execute instruction
      executor.execute(instruction);

      // Advance PC by instruction length (unless it's a control flow instruction that modified PC)
      // Control flow instructions (jumps, branches) set PC directly in executor
      const newPC = cpu.getPC();
      if (newPC === pc) {
        // PC wasn't modified by instruction, advance it
        cpu.setPC(pc + instruction.length);
      }

      instructionsExecuted++;

      // Get updated state
      const newState = cpu.getState();
      Object.assign(state, newState);

      // Safety check for infinite loops
      if (instructionsExecuted > 1000000) {
        return {
          finalState: state,
          instructionsExecuted,
          reason: 'max_cycles',
          error: 'Exceeded maximum instruction count (1,000,000)'
        };
      }
    }

    return {
      finalState: state,
      instructionsExecuted,
      reason: state.halted ? 'halted' : 'max_cycles'
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Display execution results
 */
function displayResults(result: ExecutionResult): void {
  console.log('\n=== Execution Complete ===\n');

  console.log(`Reason: ${result.reason}`);
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  console.log(`Instructions executed: ${result.instructionsExecuted}`);
  console.log(`Cycles: ${result.finalState.cycles}`);
  console.log();

  console.log('Registers:');
  const regs = result.finalState.registers;
  for (let i = 0; i < 8; i++) {
    const name = i === 6 ? 'R6 (SP)' : i === 7 ? 'R7 (PC)' : `R${i}    `;
    console.log(`  ${name}: ${formatRegister(regs[i])}`);
  }
  console.log();

  console.log(`Flags: ${formatFlags(result.finalState.flags)}`);
  console.log(`Halted: ${result.finalState.halted}`);
  console.log(`SDBD: ${result.finalState.sdbd}`);
  console.log();
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: cp1600-run <rom-file> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --load-address <addr>  Load address in hex (default: 5000)');
    console.error('  --max-cycles <n>       Maximum cycles to execute (default: 10000)');
    console.error('  --trace                Enable instruction trace');
    console.error('  --verbose              Verbose output');
    console.error('');
    console.error('Examples:');
    console.error('  cp1600-run examples/01-hello-world/hello.bin');
    console.error('  cp1600-run test.bin --load-address 5000 --trace');
    process.exit(1);
  }

  const romPath = args[0];
  const options: RunOptions = {
    romPath,
    trace: args.includes('--trace'),
    verbose: args.includes('--verbose')
  };

  // Parse load address
  const loadAddrIndex = args.indexOf('--load-address');
  if (loadAddrIndex !== -1 && args[loadAddrIndex + 1]) {
    options.loadAddress = parseInt(args[loadAddrIndex + 1], 16);
  }

  // Parse max cycles
  const maxCyclesIndex = args.indexOf('--max-cycles');
  if (maxCyclesIndex !== -1 && args[maxCyclesIndex + 1]) {
    options.maxCycles = parseInt(args[maxCyclesIndex + 1], 10);
  }

  try {
    const result = executeROM(options);
    displayResults(result);

    // Exit with appropriate code
    process.exit(result.reason === 'halted' ? 0 : 1);
  } catch (error) {
    console.error('\nExecution failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Export for testing
export { executeROM, loadROM, displayResults };

// Run if executed directly (ESM compatible)
// In ESM, we check if the file URL matches the main module URL
if (import.meta.url.endsWith(process.argv[1])) {
  main();
}
