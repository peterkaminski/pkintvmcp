; ==============================================================================
; 02-counter-loop: Countdown Loop with Conditional Branch
; ==============================================================================
; Demonstrates: Loops, conditional branches, flag testing
; Instructions: MVI, SUBI, BNEQ, ADDR, HLT
; Expected cycles: 8 + 10*14 + 6 = 154
; ==============================================================================

        ORG $5000           ; Standard cartridge ROM start

        ; Initialize registers
        MVI #10, R0         ; R0 = loop counter (10 iterations)
        MVI #0, R1          ; R1 = accumulator (sum)

        ; Loop body - runs 10 times
loop:   ADDR R0, R1         ; R1 += R0 (add counter to sum)
        SUBI #1, R0         ; R0-- (decrement counter)
        BNEQ loop           ; Branch if R0 != 0

        ; After loop completes
        ; R0 = 0 (counter exhausted)
        ; R1 = 10+9+8+7+6+5+4+3+2+1 = 55

        HLT                 ; Stop execution

; ==============================================================================
; Expected Final State:
;   R0 = 0    (counter reached zero)
;   R1 = 55   (sum of 1..10 = $0037)
;   R7 (PC) = $5006
;   Flags: S=0, Z=1, OV=0, C=0 (from final SUBI)
;   Halted: true
;   Total cycles: 154
; ==============================================================================
