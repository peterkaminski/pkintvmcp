; ==============================================================================
; 05-signed-math: Signed Arithmetic and Comparison Branches
; ==============================================================================
; Demonstrates: Signed comparisons, two's complement, overflow detection
; Instructions: SUBI, CMPI, BLT, BGE, BLE, BGT, MVI, MOVR, HLT
; Note: Sprint 1.5 instructions (BLT/BGE/BLE/BGT implemented)
; ==============================================================================

        ORG $5000           ; Standard cartridge ROM start

        ; Example 1: Compare positive numbers (10 vs 20)
        MVI #10, R0         ; R0 = 10
        CMPI #20, R0        ; Compare R0 with 20 (R0 - 20)
                            ; Result: negative, S=1, OV=0, Z=0
        BLT is_less         ; Branch taken (10 < 20)
        MVI #$FFFF, R1      ; Should not execute
        J next1
is_less:
        MVI #1, R1          ; R1 = 1 (indicating 10 < 20)

next1:
        ; Example 2: Compare negative numbers (-10 vs -5)
        MVI #$FFF6, R2      ; R2 = -10 (two's complement)
        CMPI #$FFFB, R2     ; Compare with -5 (R2 - (-5))
                            ; Result: -10 - (-5) = -5, negative
        BLT neg_less        ; Branch taken (-10 < -5)
        MVI #$FFFF, R3
        J next2
neg_less:
        MVI #1, R3          ; R3 = 1 (indicating -10 < -5)

next2:
        ; Example 3: Test greater than or equal (15 >= 10)
        MVI #15, R4         ; R4 = 15
        CMPI #10, R4        ; Compare R4 with 10 (R4 - 10)
                            ; Result: positive, S=0, OV=0
        BGE is_gte          ; Branch taken (15 >= 10)
        MVI #$FFFF, R5
        J next3
is_gte:
        MVI #1, R5          ; R5 = 1 (indicating 15 >= 10)

next3:
        ; Example 4: Test with overflow (tricky case)
        MVI #$8000, R0      ; R0 = -32768 (most negative 16-bit)
        CMPI #1, R0         ; Compare with 1 (R0 - 1)
                            ; Result: $7FFF (positive due to overflow!)
                            ; S=0, OV=1 (overflow occurred)
        ; Without overflow correction: S=0 would suggest >= 1
        ; With overflow correction (S XOR OV): 0 XOR 1 = 1 (less than!)
        BLT overflow_case   ; Branch taken (-32768 < 1, despite S=0)
        MVI #$FFFF, R1
        J done
overflow_case:
        MVI #2, R1          ; R1 = 2 (correct comparison)

done:
        HLT                 ; Stop execution

; ==============================================================================
; Expected Final State:
;   R0 = $8000 (-32768) - overflow test value
;   R1 = 2              - overflow case handled correctly
;   R2 = $FFF6 (-10)    - negative comparison
;   R3 = 1              - -10 < -5 is true
;   R4 = 15             - positive comparison
;   R5 = 1              - 15 >= 10 is true
; ==============================================================================
