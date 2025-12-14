# CP1600 CPU Instruction Set Reference (JSON)

This repository contains a machine-readable reference for the CP1600 CPU instruction set, derived from the original `cp1600_ref.pdf` documentation. The data is encapsulated in a single JSON file, `cp1600_ref.json`, designed for use by emulators, assemblers, disassemblers, and LLMs requiring structured access to the instruction set architecture.

## File Information

  * **Filename:** `cp1600_ref.json`
  * **Source Document:** `cp1600_ref.pdf`
  * **Description:** A structured representation of instruction mnemonics, opcodes, cycle counts, operands, and status flag updates.

## JSON Structure

The JSON object contains three primary root keys:

### 1. `document_info`

Contains metadata about the source of the data.

  * `title`: The title of the reference document.
  * `source_file`: The original filename of the PDF source.

### 2. `sections`

This array contains the core instruction data, organized by the functional categories found in the original documentation (e.g., "Register to Register", "Jump", "Branches").

Each object in the `sections` array includes:

  * `section_id`: The section number from the original manual (e.g., "3.6.1").
  * `title`: The descriptive title of the instruction group.
  * `notes`: (Optional) A list of specific usage notes or constraints relevant to that section (e.g., "Shifts are not interruptible").
  * `footnotes`: (Optional) Explanations for asterisks found in cycle counts (e.g., "\*7 Cycles if DDD=6 or 7").
  * `instructions`: An array of instruction objects belonging to this category.

#### Instruction Object Format

Each instruction object contains the following fields:

| Field | Description | Example |
| :--- | :--- | :--- |
| `mnemonic` | The assembly language mnemonic. | `MOVR`, `J`, `ADDI`  |
| `operands` | The expected operands (registers, addresses, literals). | `SSS, DDD`, `I-I, DDD`  |
| `cycles` | The number of clock cycles required to execute. | `6/7\*`, `8/11`  |
| `opcode_format` | The binary/hex representation of the instruction word(s). | `0 010 SSS DDD`  |
| `description` | A summary of the operation performed. | "MOVe contents of Register SSS to Register DDD."  |
| `status_change` | Flags affected by the operation (S, Z, C, OV). | `S, Z, C, OV`  |

### 3. `symbolic_notation`

This object provides a legend for interpreting the abbreviations and symbols used throughout the instruction set.

  * `address_modes`: Defines modes like `R` (register) or `I` (immediate).
  * `functions`: Defines mathematical symbols like `+` (addition) or `<-` (is replaced by).
  * `register_address_mode_mmm`: specific bit codes (000-111) used for the `MMM` operand field.
  * `operands`: Explains placeholders like `SSS` (Source Register) or `DDD` (Destination Register).
  * `status_flags`: Definitions for the status bits `S` (Sign), `Z` (Zero), `C` (Carry), and `OV` (Overflow).

## Usage Example

To find the opcode for the `MOVR` instruction using `jq`:

```bash
jq '.sections[] | select(.title=="REGISTER TO REGISTER") | .instructions[] | select(.mnemonic=="MOVR")' cp1600_ref.json
```

**Output:**

```json
{
  "mnemonic": "MOVR",
  "operands": "SSS, DDD",
  "cycles": "6/7\*",
  "opcode_format": "0 010 SSS DDD",
  "description": "MOVe contents of Register SSS to Register DDD.",
  "status_change": "S, Z"
}
```

## Status Flag Key

  * **S:** Sign bit
  * **Z:** Zero bit
  * **C:** Carry bit
  * **OV:** Overflow bit

## Notes on Cycle Counts

Some instructions have variable cycle counts denoted by asterisks (e.g., `6/7\*`). Refer to the `footnotes` array within the specific `section` object for conditions (e.g., accessing specific registers like R6 or R7 often incurs a penalty).