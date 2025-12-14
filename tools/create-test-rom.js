#!/usr/bin/env node

/**
 * Create a simple test ROM for hello-world example
 *
 * Program:
 *   MVI #42, R0     ; Load 42 into R0
 *   MVI #100, R1    ; Load 100 into R1
 *   ADDR R1, R0     ; R0 = R0 + R1 = 142
 *   MOVR R0, R2     ; Copy R0 to R2
 *   HLT             ; Halt
 *
 * Expected final state:
 *   R0 = 142 (0x008E)
 *   R1 = 100 (0x0064)
 *   R2 = 142 (0x008E)
 */

const fs = require('fs');
const path = require('path');

// Instruction encoding based on decoder.ts:
//
// MVI #imm, Rd (MVII - Move Immediate)
//   Pattern: 1o oo11 1ddd where o=010 for MVI
//   Encoding: (2 << 6) | 0x038 | dest_reg = 0x2B8 | dest_reg
//   Followed by immediate value word
//
// ADDR Rs, Rd (Add Register to Register)
//   Pattern: 0 ooo sss ddd where o=011 for ADDR
//   Encoding: (3 << 6) | (src_reg << 3) | dest_reg
//
// MOVR Rs, Rd (Move Register to Register)
//   Pattern: 0 ooo sss ddd where o=010 for MOVR
//   Encoding: (2 << 6) | (src_reg << 3) | dest_reg
//
// HLT (Halt)
//   Encoding: 0x000

function createHelloWorldROM() {
  const instructions = [];

  // MVI #42, R0
  instructions.push(0x2B8);  // MVI immediate to R0: (2 << 6) | 0x38 | 0
  instructions.push(42);     // Immediate value: 42

  // MVI #100, R1
  instructions.push(0x2B9);  // MVI immediate to R1: (2 << 6) | 0x38 | 1
  instructions.push(100);    // Immediate value: 100

  // ADDR R1, R0  (R0 = R0 + R1)
  instructions.push(0x0C8);  // ADDR: (3 << 6) | (1 << 3) | 0

  // MOVR R0, R2  (R2 = R0)
  instructions.push(0x082);  // MOVR: (2 << 6) | (0 << 3) | 2

  // HLT
  instructions.push(0x000);  // HLT

  return instructions;
}

function writeROMFile(instructions, filename) {
  // Create buffer (2 bytes per 16-bit word, little-endian)
  const buffer = Buffer.alloc(instructions.length * 2);

  for (let i = 0; i < instructions.length; i++) {
    const word = instructions[i] & 0xFFFF;
    // Little-endian: low byte first, high byte second
    buffer[i * 2] = word & 0xFF;
    buffer[i * 2 + 1] = (word >> 8) & 0xFF;
  }

  fs.writeFileSync(filename, buffer);
  console.log(`Created ROM: ${filename}`);
  console.log(`Size: ${instructions.length} words (${buffer.length} bytes)`);
  console.log(`\nInstructions:`);
  instructions.forEach((word, i) => {
    console.log(`  [$${(0x5000 + i).toString(16).toUpperCase().padStart(4, '0')}] 0x${word.toString(16).toUpperCase().padStart(3, '0')}`);
  });
}

// Create output directory if it doesn't exist
const exampleDir = path.join(__dirname, '..', 'examples', '01-hello-world');
if (!fs.existsSync(exampleDir)) {
  fs.mkdirSync(exampleDir, { recursive: true });
}

// Generate and write ROM
const rom = createHelloWorldROM();
const outputPath = path.join(exampleDir, 'hello.bin');
writeROMFile(rom, outputPath);

console.log(`\nExpected final state:`);
console.log(`  R0 = 142 (0x008E)`);
console.log(`  R1 = 100 (0x0064)`);
console.log(`  R2 = 142 (0x008E)`);
console.log(`  Cycles = 31 (8+8+6+6+3)`);
