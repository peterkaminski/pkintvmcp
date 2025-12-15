# Intellivision Master Component Memory Map

Based on "Your Friend The EXEC" Appendix A

## Complete Memory Map

| Address Range | Octal Range | Description |
|---------------|-------------|-------------|
| $0000-$003F | &0000-&0077 | **STIC Chip Locations** |
| $0000-$0007 | &0000-&0007 | Horizontal Position Table |
| $0008-$000F | &0010-&0017 | Vertical Position Table |
| $0010-$0017 | &0020-&0027 | Character Table |
| $0018-$001F | &0030-&0037 | Interaction Table |
| $0020 | &0040 | CPU-STIC Handshake |
| $0021 | &0041 | Background Mode (Read=Color Stack, Write=FG/BG) |
| $0022-$0027 | &0050-&0053 | [reserved] |
| $0028-$002B | &0054 | Color Stack |
| $002C | &0060 | Border Color |
| $002D-$002F | &0061-&0062 | [reserved] |
| $0030 | | Horizontal Scroll Distance |
| $0031 | | Vertical Scroll Distance |
| $0032 | | Border Extension (Bit 1: Top, Bit 0: Left) |
| $0033-$003F | | [reserved] |
| $0040-$00FF | | [unused] |
| | | |
| $0100-$01EF | &0400-&0757 | **8-Bit RAM (240 bytes)** |
| $0100-$015C | &0400-&0534 | EXEC 8-bit RAM (93 bytes) |
| $015D-$01EF | &0535-&0757 | Available 8-bit RAM (147 bytes) |
| | | |
| $01F0-$01FD | &0760-&0775 | **Sound Chip** |
| $01F0 | &0760 | Channel 1 Frequency (low 8 bits of 12) |
| $01F1 | &0761 | Channel 2 Frequency (low 8 bits of 12) |
| $01F2 | &0762 | Channel 3 Frequency (low 8 bits of 12) |
| $01F3 | &0763 | Envelope Period (low 8 bits of 16) |
| $01F4 | &0764 | Channel 1 Frequency (high 4 bits of 12) |
| $01F5 | &0765 | Channel 2 Frequency (high 4 bits of 12) |
| $01F6 | &0766 | Channel 3 Frequency (high 4 bits of 12) |
| $01F7 | &0767 | Envelope Period (high 8 bits of 16) |
| $01F8 | &0770 | Enable Noise/Tone (bits 3-5: noise, 0-2: tone) |
| $01F9 | &0771 | Noise Frequency (5 bits) |
| $01FA | &0772 | Envelope Characteristics (4 bits) |
| $01FB | &0773 | Channel 1 Volume (6 bits) |
| $01FC | &0774 | Channel 2 Volume (6 bits) |
| $01FD | &0775 | Channel 3 Volume (6 bits) |
| | | |
| $01FE-$01FF | &0776-&0777 | **Hand Controller Ports** |
| $01FE | &0776 | Keypad 1 (right) Port (8 bits) |
| $01FF | &0777 | Keypad 2 (left) Port (8 bits) |
| | | |
| $0200-$035F | &1000-&1537 | **16-Bit RAM (352 words)** |
| $0200-$02EF | &1000-&1357 | BACKTAB - Background Table (240 words) |
| $02F0 | &1360 | EXEC Object GRAM Allocation Table Pointer |
| $02F1-$0318 | &1361-&1430 | The Stack (40 words) |
| $0319-$031C | &1431-&1434 | EXEC 16-bit RAM (4 words) |
| $031D-$035C | &1435-&1534 | Moving Object RAM Data Bases (8 objects × 8 words) |
| $035D-$035F | &1535-&1537 | More EXEC 16-bit RAM (3 words) |
| | | |
| $0360-$0FFF | | [unused] |
| | | |
| $1000-$1FFF | &10000-&17777 | **THE EXEC ROM** |
| $1000 | &10000 | Trap Destination on RESET |
| | | |
| $2000-$2FFF | | [unused] |
| | | |
| $3000-$37FF | &30000-&33777 | **GROM - Graphics ROM (2K, 256 pictures)** |
| | | |
| $3800-$39FF | &34000-&34777 | **GRAM - Graphics RAM (512 bytes, 64 pictures)** |
| | | |
| $3A00-$3FFF | | Additional mappings of GRAM |
| | | |
| $4000-$403F | &40000-&40077 | **STIC Remapping** |
| | | |
| $4040-$47FF | | [for future expansion] |
| | | |
| $4800-$4FFF | &44000-&47777 | **Playcable Monitor** |
| | | |
| $5000-$5FFF | &50000-&57777 | **Cartridge Program ROM (4K)** |
| | | |
| $6000-$6FFF | &60000-&67777 | **Cartridge Program ROM (upper half of 8K cart)** |
| | | |
| $7000-$7FFF | &70000-&77777 | **Keyboard Component CPU1 (1600) Monitor** |

## Key Memory Regions for Emulation

### Essential Components
1. **STIC Registers** ($0000-$003F) - Graphics chip control
2. **8-bit RAM** ($0100-$01EF) - 240 bytes (93 for Exec, 147 for cartridge)
3. **Sound Chip** ($01F0-$01FD) - Audio registers
4. **Controllers** ($01FE-$01FF) - Input ports
5. **16-bit RAM** ($0200-$035F) - 352 words including BACKTAB, stack, objects
6. **EXEC ROM** ($1000-$1FFF) - Operating system (4K)
7. **GROM** ($3000-$37FF) - Graphics ROM (2K, 256 pictures)
8. **GRAM** ($3800-$39FF) - Graphics RAM (512 bytes, 64 pictures)
9. **Cartridge ROM** ($5000-$6FFF) - Game code (4K or 8K)

### BACKTAB (Background Table)
- Location: $0200-$02EF (&1000-&1357)
- Size: 240 words (20 columns × 12 rows)
- Dual-port RAM shared between CPU and STIC
- Defines background display

### Moving Objects
- 8 objects total
- Each object: 8-word data base in 16-bit RAM
- Location: $031D-$035C (&1435-&1534)
- Controlled by STIC via position/character/interaction tables

### Stack
- Location: $02F1-$0318 (&1361-&1430)
- Size: 40 words
- Used by Exec and cartridge
