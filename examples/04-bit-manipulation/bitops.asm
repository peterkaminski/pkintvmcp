; ==============================================================================
; 04-bit-manipulation: Shifts, Rotates, and Masking
; ==============================================================================
; Demonstrates: Bit-level operations (shifts, rotates, masking)
; Instructions: SLL, SLR, SAR, RLC, SWAP, ANDR, XORR, MVI, HLT
; Note: Sprint 1.6 instructions (not yet implemented)
; ==============================================================================

        ORG $5000           ; Standard cartridge ROM start

        ; Example 1: Extract high byte using shift
        MVI #$1234, R0      ; R0 = $1234
        MOVR R0, R1         ; R1 = $1234 (preserve original)
        SLR R1              ; R1 = $091A (shift right 1 bit)
        SLR R1              ; R1 = $048D
        SLR R1              ; R1 = $0246
        SLR R1              ; R1 = $0123
        SLR R1              ; R1 = $0091
        SLR R1              ; R1 = $0048
        SLR R1              ; R1 = $0024
        SLR R1              ; R1 = $0012 (high byte in low position)

        ; Example 2: Extract low byte using mask
        MOVR R0, R2         ; R2 = $1234
        ANDI #$FF, R2       ; R2 = $0034 (mask off high byte)

        ; Example 3: Swap bytes
        MOVR R0, R3         ; R3 = $1234
        SWAP R3             ; R3 = $3412 (bytes swapped)

        ; Example 4: Rotate left through carry
        MVI #$8001, R4      ; R4 = $8001 (bit 15 set, bit 0 set)
        RLC R4              ; R4 = $0002, C=1 (rotated bit 15 into carry)
        RLC R4              ; R4 = $0005, C=0 (rotated carry into bit 0)

        ; Example 5: Arithmetic shift right (preserve sign)
        MVI #$F000, R5      ; R5 = $F000 (negative: -4096)
        SAR R5              ; R5 = $F800 (still negative: -2048)
        SAR R5              ; R5 = $FC00 (still negative: -1024)

        HLT                 ; Stop execution

; ==============================================================================
; Expected Final State:
;   R0 = $1234          - Original value
;   R1 = $0012          - High byte extracted
;   R2 = $0034          - Low byte extracted
;   R3 = $3412          - Bytes swapped
;   R4 = $0005          - After rotate
;   R5 = $FC00          - After arithmetic shift (sign preserved)
; ==============================================================================
