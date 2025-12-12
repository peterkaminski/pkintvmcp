; ==============================================================================
; 03-subroutine-call: Basic Subroutine Pattern (JSR/JR)
; ==============================================================================
; Demonstrates: Subroutines, return addresses, JSR/JR calling convention
; Instructions: JSR, JR, MVI, ADDR, MOVR, HLT
; Note: Uses register R5 for return address (not stack)
; ==============================================================================

        ORG $5000           ; Standard cartridge ROM start

main:
        ; Initialize values
        MVI #10, R0         ; R0 = first value
        MVI #20, R1         ; R1 = second value

        ; Call subroutine to add them
        JSR R5, add_numbers ; R5 = return address, PC = add_numbers

        ; Result is now in R2
        ; R0 = 10, R1 = 20, R2 = 30

        HLT                 ; Stop execution

; ==============================================================================
; Subroutine: add_numbers
; Input:  R0 = first number
;         R1 = second number
; Output: R2 = sum
; Uses:   R3 (temporary)
; ==============================================================================
add_numbers:
        ; Add R0 and R1, store in R3
        MOVR R0, R3         ; R3 = R0
        ADDR R1, R3         ; R3 = R3 + R1

        ; Move result to R2
        MOVR R3, R2         ; R2 = R3 (result)

        ; Return to caller
        JR R5               ; PC = R5 (return address)

; ==============================================================================
; Expected Final State:
;   R0 = 10   ($000A) - first input
;   R1 = 20   ($0014) - second input
;   R2 = 30   ($001E) - result
;   R3 = 30   ($001E) - temporary
;   R5 = $5003        - return address (address after JSR)
;   R7 (PC) = $5004   - address after HLT
;   Flags: From ADDR (S=0, Z=0, OV=0, C=0)
;   Halted: true
; ==============================================================================
