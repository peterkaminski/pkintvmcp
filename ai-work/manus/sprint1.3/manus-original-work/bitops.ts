/**
 * Bit operation utilities
 */

/**
 * Convert a number to a 16-bit unsigned integer by wrapping
 * @param x - Input number
 * @returns 16-bit unsigned value (0x0000 to 0xFFFF)
 */
export function toUint16(x: number): number {
  return x & 0xFFFF;
}

/**
 * Convert a number to a 16-bit signed integer
 * @param x - Input number (typically 16-bit unsigned)
 * @returns 16-bit signed value (-32768 to 32767)
 */
export function toInt16(x: number): number {
  // First normalize to 16-bit unsigned
  const unsigned = x & 0xFFFF;
  
  // Check if bit 15 is set (negative in two's complement)
  if (unsigned & 0x8000) {
    // Convert to negative: subtract 2^16
    return unsigned - 0x10000;
  }
  
  return unsigned;
}

/**
 * Convert a number to a 10-bit unsigned integer by masking
 * @param x - Input number
 * @returns 10-bit unsigned value (0x0000 to 0x03FF)
 */
export function toUint10(x: number): number {
  return x & 0x03FF;
}

/**
 * Get the value of a specific bit in a number
 * @param value - Input number
 * @param position - Bit position (0-indexed from right)
 * @returns 1 if bit is set, 0 otherwise
 */
export function getBit(value: number, position: number): number {
  return (value >> position) & 1;
}

/**
 * Set a specific bit in a number to 1
 * @param value - Input number
 * @param position - Bit position (0-indexed from right)
 * @returns Number with specified bit set
 */
export function setBit(value: number, position: number): number {
  return value | (1 << position);
}

/**
 * Clear a specific bit in a number to 0
 * @param value - Input number
 * @param position - Bit position (0-indexed from right)
 * @returns Number with specified bit cleared
 */
export function clearBit(value: number, position: number): number {
  return value & ~(1 << position);
}
