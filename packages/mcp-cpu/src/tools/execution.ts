/**
 * Execution Control Tools
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SessionManager } from '../session-manager.js';
import type { LoadROMResult, StepResult, RunResult, ResetResult } from '../types.js';

/**
 * Load a binary ROM file and return as array of 16-bit words
 */
function loadROMFromFile(romPath: string): Uint16Array {
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
 * cp1600_load_rom tool
 */
export function loadROM(
  sessionManager: SessionManager,
  args: { sessionId: string; romPath: string; startAddress?: number }
): LoadROMResult {
  const session = sessionManager.getSession(args.sessionId);
  const loadAddress = args.startAddress ?? 0x5000;

  // Load ROM from file
  const romData = loadROMFromFile(args.romPath);

  // Load into memory
  const romArray = Array.from(romData);
  session.memory.load(loadAddress, romArray);

  // Set PC to entry point
  session.cpu.setPC(loadAddress);

  // Update session metadata
  session.romLoaded = true;
  session.romName = path.basename(args.romPath);
  session.loadAddress = loadAddress;
  session.entryPoint = loadAddress;

  return {
    loaded: true,
    romSize: romData.length,
    loadAddress,
    entryPoint: loadAddress,
    format: 'bin',
  };
}

/**
 * cp1600_step tool
 */
export function step(
  sessionManager: SessionManager,
  args: { sessionId: string; count?: number }
): StepResult {
  const session = sessionManager.getSession(args.sessionId);
  const count = args.count ?? 1;

  if (count < 1 || count > 10000) {
    throw new Error('count must be between 1 and 10000');
  }

  if (!session.romLoaded) {
    throw new Error('No ROM loaded. Use cp1600_load_rom to load a ROM file before executing.');
  }

  let instructionsExecuted = 0;
  const state = session.cpu.getState();

  for (let i = 0; i < count; i++) {
    if (state.halted) {
      break;
    }

    const pc = session.cpu.getPC();
    const sdbd = state.sdbd;

    // Decode instruction
    const instruction = session.decoder.decode(pc, sdbd);

    // Execute instruction (Executor handles PC advancement automatically)
    session.executor.execute(instruction);

    instructionsExecuted++;

    // Update state
    const newState = session.cpu.getState();
    Object.assign(state, newState);
  }

  return {
    instructionsExecuted,
    stopped: state.halted || instructionsExecuted < count,
    reason: state.halted ? 'halted' : 'completed',
    stoppedAt: session.cpu.getPC(),
    state: session.cpu.getState(),
  };
}

/**
 * cp1600_run tool
 */
export function run(
  sessionManager: SessionManager,
  args: { sessionId: string; maxInstructions?: number }
): RunResult {
  const session = sessionManager.getSession(args.sessionId);
  const maxInstructions = args.maxInstructions ?? 100000;

  if (!session.romLoaded) {
    throw new Error('No ROM loaded. Use cp1600_load_rom to load a ROM file before executing.');
  }

  let instructionsExecuted = 0;
  const state = session.cpu.getState();

  while (!state.halted && instructionsExecuted < maxInstructions) {
    const pc = session.cpu.getPC();
    const sdbd = state.sdbd;

    // Decode instruction
    const instruction = session.decoder.decode(pc, sdbd);

    // Execute instruction (Executor handles PC advancement automatically)
    session.executor.execute(instruction);

    instructionsExecuted++;

    // Update state
    const newState = session.cpu.getState();
    Object.assign(state, newState);
  }

  return {
    instructionsExecuted,
    stopped: true,
    reason: state.halted ? 'halted' : 'max_instructions',
    stoppedAt: session.cpu.getPC(),
    state: session.cpu.getState(),
  };
}

/**
 * cp1600_reset tool
 */
export function reset(
  sessionManager: SessionManager,
  args: { sessionId: string }
): ResetResult {
  const session = sessionManager.getSession(args.sessionId);

  // Reset CPU to initial state
  session.cpu.reset();

  // If ROM is loaded, set PC to entry point
  if (session.romLoaded && session.entryPoint !== undefined) {
    session.cpu.setPC(session.entryPoint);
  }

  return {
    state: session.cpu.getState(),
  };
}
