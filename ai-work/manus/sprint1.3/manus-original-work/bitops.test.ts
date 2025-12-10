/**
 * Tests for bit operation utilities
 */

import { toUint16, toInt16, toUint10, getBit, setBit, clearBit } from '../bitops';

describe('bitops', () => {
  describe('toUint16', () => {
    it('should preserve values within 16-bit range', () => {
      expect(toUint16(0x0000)).toBe(0x0000);
      expect(toUint16(0x1234)).toBe(0x1234);
      expect(toUint16(0xFFFF)).toBe(0xFFFF);
      expect(toUint16(0x7FFF)).toBe(0x7FFF);
    });

    it('should wrap 0x10000 to 0x0000', () => {
      expect(toUint16(0x10000)).toBe(0x0000);
    });

    it('should wrap 0x1FFFF to 0xFFFF', () => {
      expect(toUint16(0x1FFFF)).toBe(0xFFFF);
    });

    it('should wrap values above 16-bit range', () => {
      expect(toUint16(0x10001)).toBe(0x0001);
      expect(toUint16(0x1ABCD)).toBe(0xABCD);
      expect(toUint16(0x20000)).toBe(0x0000);
      expect(toUint16(0x2FFFF)).toBe(0xFFFF);
    });

    it('should handle negative numbers by masking', () => {
      expect(toUint16(-1)).toBe(0xFFFF);
      expect(toUint16(-2)).toBe(0xFFFE);
      expect(toUint16(-32768)).toBe(0x8000);
    });

    it('should handle zero', () => {
      expect(toUint16(0)).toBe(0);
    });
  });

  describe('toInt16', () => {
    it('should convert positive 16-bit values correctly', () => {
      expect(toInt16(0x0000)).toBe(0);
      expect(toInt16(0x0001)).toBe(1);
      expect(toInt16(0x7FFF)).toBe(32767);
    });

    it('should convert 0x7FFF to 32767', () => {
      expect(toInt16(0x7FFF)).toBe(32767);
    });

    it('should convert 0x8000 to -32768', () => {
      expect(toInt16(0x8000)).toBe(-32768);
    });

    it('should convert 0xFFFF to -1', () => {
      expect(toInt16(0xFFFF)).toBe(-1);
    });

    it('should convert negative values correctly', () => {
      expect(toInt16(0xFFFE)).toBe(-2);
      expect(toInt16(0xFFFD)).toBe(-3);
      expect(toInt16(0x8001)).toBe(-32767);
    });

    it('should handle values above 16-bit by masking first', () => {
      expect(toInt16(0x10000)).toBe(0); // Wraps to 0x0000
      expect(toInt16(0x1FFFF)).toBe(-1); // Wraps to 0xFFFF
      expect(toInt16(0x18000)).toBe(-32768); // Wraps to 0x8000
    });

    it('should handle boundary values', () => {
      expect(toInt16(0x7FFE)).toBe(32766);
      expect(toInt16(0x7FFF)).toBe(32767);
      expect(toInt16(0x8000)).toBe(-32768);
      expect(toInt16(0x8001)).toBe(-32767);
    });
  });

  describe('toUint10', () => {
    it('should preserve values within 10-bit range', () => {
      expect(toUint10(0x0000)).toBe(0x0000);
      expect(toUint10(0x0001)).toBe(0x0001);
      expect(toUint10(0x03FF)).toBe(0x03FF);
      expect(toUint10(0x0200)).toBe(0x0200);
    });

    it('should mask to 10 bits (0x03FF)', () => {
      expect(toUint10(0x03FF)).toBe(0x03FF); // Max 10-bit value (1023)
      expect(toUint10(0x0400)).toBe(0x0000); // Bit 10 masked out
      expect(toUint10(0x07FF)).toBe(0x03FF); // Upper bits masked
    });

    it('should mask values above 10-bit range', () => {
      expect(toUint10(0x0400)).toBe(0x0000);
      expect(toUint10(0x0401)).toBe(0x0001);
      expect(toUint10(0x0FFF)).toBe(0x03FF);
      expect(toUint10(0x1234)).toBe(0x0234);
      expect(toUint10(0xFFFF)).toBe(0x03FF);
    });

    it('should handle boundary values', () => {
      expect(toUint10(1023)).toBe(1023); // Max 10-bit decimal
      expect(toUint10(1024)).toBe(0);    // Just over 10-bit
      expect(toUint10(1025)).toBe(1);    // Wraps around
    });

    it('should handle zero', () => {
      expect(toUint10(0)).toBe(0);
    });
  });

  describe('getBit', () => {
    it('should get individual bits correctly', () => {
      expect(getBit(0b1010, 0)).toBe(0);
      expect(getBit(0b1010, 1)).toBe(1);
      expect(getBit(0b1010, 2)).toBe(0);
      expect(getBit(0b1010, 3)).toBe(1);
    });

    it('should get bit 15 (sign bit)', () => {
      expect(getBit(0x8000, 15)).toBe(1);
      expect(getBit(0x7FFF, 15)).toBe(0);
      expect(getBit(0xFFFF, 15)).toBe(1);
    });

    it('should handle zero', () => {
      expect(getBit(0, 0)).toBe(0);
      expect(getBit(0, 15)).toBe(0);
    });

    it('should handle all bits set', () => {
      expect(getBit(0xFFFF, 0)).toBe(1);
      expect(getBit(0xFFFF, 7)).toBe(1);
      expect(getBit(0xFFFF, 15)).toBe(1);
    });
  });

  describe('setBit', () => {
    it('should set individual bits', () => {
      expect(setBit(0b0000, 0)).toBe(0b0001);
      expect(setBit(0b0000, 1)).toBe(0b0010);
      expect(setBit(0b0000, 2)).toBe(0b0100);
      expect(setBit(0b0000, 3)).toBe(0b1000);
    });

    it('should not change already set bits', () => {
      expect(setBit(0b1111, 0)).toBe(0b1111);
      expect(setBit(0b1111, 1)).toBe(0b1111);
    });

    it('should set bit 15', () => {
      expect(setBit(0x0000, 15)).toBe(0x8000);
      expect(setBit(0x7FFF, 15)).toBe(0xFFFF);
    });

    it('should set specific bits without affecting others', () => {
      expect(setBit(0b1010, 0)).toBe(0b1011);
      expect(setBit(0b1010, 2)).toBe(0b1110);
    });
  });

  describe('clearBit', () => {
    it('should clear individual bits', () => {
      expect(clearBit(0b1111, 0)).toBe(0b1110);
      expect(clearBit(0b1111, 1)).toBe(0b1101);
      expect(clearBit(0b1111, 2)).toBe(0b1011);
      expect(clearBit(0b1111, 3)).toBe(0b0111);
    });

    it('should not change already cleared bits', () => {
      expect(clearBit(0b0000, 0)).toBe(0b0000);
      expect(clearBit(0b0000, 1)).toBe(0b0000);
    });

    it('should clear bit 15', () => {
      expect(clearBit(0xFFFF, 15)).toBe(0x7FFF);
      expect(clearBit(0x8000, 15)).toBe(0x0000);
    });

    it('should clear specific bits without affecting others', () => {
      expect(clearBit(0b1111, 0)).toBe(0b1110);
      expect(clearBit(0b1111, 2)).toBe(0b1011);
    });
  });

  describe('integration tests', () => {
    it('should handle combined operations', () => {
      let value = 0x0000;
      value = setBit(value, 0);
      value = setBit(value, 15);
      expect(value).toBe(0x8001);
      
      value = clearBit(value, 0);
      expect(value).toBe(0x8000);
      
      expect(getBit(value, 15)).toBe(1);
      expect(getBit(value, 0)).toBe(0);
    });

    it('should convert between signed and unsigned correctly', () => {
      const unsigned = 0xFFFF;
      const signed = toInt16(unsigned);
      expect(signed).toBe(-1);
      
      const backToUnsigned = toUint16(signed);
      expect(backToUnsigned).toBe(0xFFFF);
    });

    it('should handle masking operations together', () => {
      const value = 0x1FFFF;
      const masked16 = toUint16(value);
      expect(masked16).toBe(0xFFFF);
      
      const masked10 = toUint10(value);
      expect(masked10).toBe(0x03FF);
    });
  });
});
