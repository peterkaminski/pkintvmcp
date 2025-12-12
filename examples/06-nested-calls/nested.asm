; ==============================================================================
; 06-nested-calls: Nested Subroutine Calls with Stack Management
; ==============================================================================
; Demonstrates: Stack usage for nested calls, PSHR/PULR, proper R5 management
; Instructions: JSR, JR, PSHR, PULR, MVI, ADDR, MOVR, HLT
; Note: Sprint 1.5 instructions (PSHR/PULR/JSR/JR implemented)
; ==============================================================================

        ORG $5000           ; Standard cartridge ROM start

main:
        ; Initialize stack pointer (standard Intellivision location)
        MVI #$02F0, R6      ; R6 = stack pointer = $02F0

        ; Initialize values
        MVI #5, R0          ; R0 = 5

        ; Call outer function (uses R5 for return)
        JSR R5, outer       ; R5 = return address, call outer

        ; After return: R1 = 15 (triple of 5)

        HLT                 ; Stop execution

; ==============================================================================
; Subroutine: outer
; Purpose: Triple the value (call inner twice to add value 3 times)
; Input:  R0 = value
; Output: R1 = value * 3
; Uses:   R2, R3
; ==============================================================================
outer:
        ; Save return address (we're going to make nested calls)
        PSHR R5             ; Push R5 to stack (R6 = $02F1, [$02F1] = R5)

        ; Save input value
        MOVR R0, R2         ; R2 = R0 (preserve input)

        ; First call to inner: add R0 to itself
        MOVR R2, R0         ; R0 = original value
        MOVR R2, R1         ; R1 = original value
        JSR R5, inner       ; Call inner (R1 = R0 + R1 = 2*original)

        ; Second call to inner: add R0 again
        MOVR R2, R0         ; R0 = original value
        JSR R5, inner       ; Call inner (R1 = R0 + R1 = 3*original)

        ; Result now in R1 (triple the original value)

        ; Restore return address and return
        PULR R5             ; Pop R5 from stack (R5 = return, R6 = $02F0)
        JR R5               ; Return to main

; ==============================================================================
; Subroutine: inner
; Purpose: Add R0 to R1
; Input:  R0 = value to add
;         R1 = accumulator
; Output: R1 = R1 + R0
; Uses:   R3 (temporary)
; ==============================================================================
inner:
        ; Add R0 to R1
        MOVR R1, R3         ; R3 = R1 (preserve for addition)
        ADDR R0, R3         ; R3 = R3 + R0
        MOVR R3, R1         ; R1 = R3 (result)

        ; Return (R5 already contains return address)
        JR R5               ; Return to outer

; ==============================================================================
; Expected Final State:
;   R0 = 5    ($0005) - original input (preserved by outer)
;   R1 = 15   ($000F) - result (5 * 3)
;   R2 = 5    ($0005) - saved by outer
;   R3 = 15   ($000F) - temporary from last inner call
;   R5 = $5004        - return address to main
;   R6 = $02F0        - stack pointer (back to initial value)
;   R7 (PC) = $5005   - after HLT
;   Memory[$02F0] = unchanged
;   Halted: true
; ==============================================================================
