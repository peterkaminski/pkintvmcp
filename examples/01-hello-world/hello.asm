; ==============================================================================
; 01-hello-world: Simplest CP-1600 Program
; ==============================================================================
; Demonstrates: Basic instruction execution, register operations
; Instructions: MVI, MOVR, ADDR, HLT
; Expected cycles: 36
; ==============================================================================

        ORG $5000           ; Standard cartridge ROM start

        ; Load two values into registers
        MVI #42, R0         ; R0 = 42 (decimal)
        MVI #100, R1        ; R1 = 100 (decimal)

        ; Add them together
        ADDR R1, R0         ; R0 = R0 + R1 = 142

        ; Copy result to another register
        MOVR R0, R2         ; R2 = R0 = 142

        ; Halt the processor
        HLT                 ; Stop execution

; ==============================================================================
; Expected Final State:
;   R0 = 142 ($008E)
;   R1 = 100 ($0064)
;   R2 = 142 ($008E)
;   R7 (PC) = $5006
;   Flags: S=0, Z=0, OV=0, C=0 (from ADDR)
;   Halted: true
; ==============================================================================
