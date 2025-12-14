/**
 * State Inspection Tools
 */

import type { SessionManager } from '../session-manager.js';
import type { GetStateResult, ExamineMemoryResult, DisassembleResult, DisassembledInstruction } from '../types.js';

/**
 * cp1600_get_state tool
 */
export function getState(
  sessionManager: SessionManager,
  args: { sessionId: string }
): GetStateResult {
  const session = sessionManager.getSession(args.sessionId);
  const state = session.cpu.getState();

  return {
    registers: {
      r0: session.cpu.getRegister(0),
      r1: session.cpu.getRegister(1),
      r2: session.cpu.getRegister(2),
      r3: session.cpu.getRegister(3),
      r4: session.cpu.getRegister(4),
      r5: session.cpu.getRegister(5),
      r6: session.cpu.getRegister(6),
      r7: session.cpu.getRegister(7),
    },
    flags: {
      sign: state.flags.S,
      zero: state.flags.Z,
      carry: state.flags.C,
      overflow: state.flags.OV,
    },
    halted: state.halted,
    cycles: state.cycles,
    sdbd: state.sdbd,
  };
}

/**
 * cp1600_get_registers tool
 */
export function getRegisters(
  sessionManager: SessionManager,
  args: { sessionId: string; format?: string }
): { registers: Record<string, string> } {
  const session = sessionManager.getSession(args.sessionId);
  const format = args.format ?? 'hex';

  const formatValue = (value: number): string => {
    const hex = `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;
    const dec = value.toString();

    switch (format) {
      case 'hex':
        return hex;
      case 'dec':
        return dec;
      case 'both':
        return `${hex} (${dec})`;
      default:
        return hex;
    }
  };

  return {
    registers: {
      r0: formatValue(session.cpu.getRegister(0)),
      r1: formatValue(session.cpu.getRegister(1)),
      r2: formatValue(session.cpu.getRegister(2)),
      r3: formatValue(session.cpu.getRegister(3)),
      r4: formatValue(session.cpu.getRegister(4)),
      r5: formatValue(session.cpu.getRegister(5)),
      r6: formatValue(session.cpu.getRegister(6)),
      r7: formatValue(session.cpu.getRegister(7)),
    },
  };
}

/**
 * cp1600_get_flags tool
 */
export function getFlags(
  sessionManager: SessionManager,
  args: { sessionId: string }
): { flags: Record<string, { value: boolean; description: string }>; summary: string } {
  const session = sessionManager.getSession(args.sessionId);
  const state = session.cpu.getState();

  return {
    flags: {
      sign: {
        value: state.flags.S,
        description: state.flags.S ? 'Result is negative' : 'Result is positive',
      },
      zero: {
        value: state.flags.Z,
        description: state.flags.Z ? 'Result is zero' : 'Result is non-zero',
      },
      carry: {
        value: state.flags.C,
        description: state.flags.C ? 'Carry/borrow occurred' : 'No carry/borrow',
      },
      overflow: {
        value: state.flags.OV,
        description: state.flags.OV ? 'Signed overflow occurred' : 'No signed overflow',
      },
    },
    summary: `S=${state.flags.S ? '1' : '0'} Z=${state.flags.Z ? '1' : '0'} C=${state.flags.C ? '1' : '0'} OV=${state.flags.OV ? '1' : '0'}`,
  };
}

/**
 * cp1600_examine_memory tool
 */
export function examineMemory(
  sessionManager: SessionManager,
  args: { sessionId: string; address: number; length?: number; format?: string }
): ExamineMemoryResult {
  const session = sessionManager.getSession(args.sessionId);
  const address = args.address;
  const length = args.length ?? 16;
  // const format = args.format ?? 'hex'; // TODO: Use format parameter

  if (length < 1 || length > 256) {
    throw new Error('length must be between 1 and 256');
  }

  // Read memory
  const data: number[] = [];
  for (let i = 0; i < length; i++) {
    data.push(session.memory.read(address + i));
  }

  // Format output
  let formatted = '';
  const wordsPerLine = 8;
  for (let i = 0; i < data.length; i += wordsPerLine) {
    const lineAddr = address + i;
    const lineWords = data.slice(i, i + wordsPerLine);

    formatted += `$${lineAddr.toString(16).toUpperCase().padStart(4, '0')}: `;
    formatted += lineWords.map(w => w.toString(16).toUpperCase().padStart(4, '0')).join(' ');

    if (i + wordsPerLine < data.length) {
      formatted += '\n';
    }
  }

  return {
    address,
    length,
    data,
    formatted,
  };
}

/**
 * cp1600_disassemble tool
 */
export function disassemble(
  sessionManager: SessionManager,
  args: { sessionId: string; address: number; count?: number }
): DisassembleResult {
  const session = sessionManager.getSession(args.sessionId);
  const startAddress = args.address;
  const count = args.count ?? 10;

  if (count < 1 || count > 100) {
    throw new Error('count must be between 1 and 100');
  }

  const instructions: DisassembledInstruction[] = [];
  let currentAddress = startAddress;

  for (let i = 0; i < count; i++) {
    try {
      const instruction = session.decoder.decode(currentAddress, false);

      // Format mnemonic (simplified for now)
      let mnemonic = instruction.opcode.toString();
      if (instruction.operands && instruction.operands.length > 0) {
        const operandStr = instruction.operands.map(op => {
          if (op.type === 'immediate') {
            return `#$${op.value.toString(16).toUpperCase().padStart(4, '0')}`;
          } else if (op.type === 'register') {
            return `R${op.value}`;
          } else {
            return `$${op.value.toString(16).toUpperCase().padStart(4, '0')}`;
          }
        }).join(', ');
        mnemonic += ` ${operandStr}`;
      }

      instructions.push({
        address: currentAddress,
        addressHex: `$${currentAddress.toString(16).toUpperCase().padStart(4, '0')}`,
        opcode: session.memory.read(currentAddress),
        mnemonic,
        bytes: [session.memory.read(currentAddress)],
        cycles: 6, // TODO: Calculate actual cycle count
      });

      currentAddress++;
    } catch (error) {
      // Stop if we encounter an error (likely invalid opcode)
      break;
    }
  }

  return { instructions };
}
