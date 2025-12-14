#!/usr/bin/env node

/**
 * @pkintvmcp/mcp-cpu - MCP Server for CP-1600 Debugging
 *
 * Sprint 1.7: Basic MCP server with session management and execution control
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SessionManager } from './session-manager.js';
import * as sessionTools from './tools/session.js';
import * as executionTools from './tools/execution.js';
import * as inspectionTools from './tools/inspection.js';

// Create session manager
const sessionManager = new SessionManager();

// Create MCP server
const server = new Server(
  {
    name: 'pkIntvMCP',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Session Management
      {
        name: 'cp1600_create_session',
        description: 'Create a new debugging session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Optional custom session ID (auto-generated if not provided)',
            },
          },
        },
      },
      {
        name: 'cp1600_list_sessions',
        description: 'List all active debugging sessions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'cp1600_destroy_session',
        description: 'Destroy a debugging session and free resources',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session to destroy',
            },
          },
          required: ['sessionId'],
        },
      },

      // Execution Control
      {
        name: 'cp1600_load_rom',
        description: 'Load a binary ROM file into session memory',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Target session',
            },
            romPath: {
              type: 'string',
              description: 'Path to ROM file',
            },
            startAddress: {
              type: 'number',
              description: 'Optional load address (default: 0x5000)',
            },
          },
          required: ['sessionId', 'romPath'],
        },
      },
      {
        name: 'cp1600_step',
        description: 'Execute N instructions',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Target session',
            },
            count: {
              type: 'number',
              description: 'Number of instructions to execute (default: 1)',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'cp1600_run',
        description: 'Run until halt or max instructions',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Target session',
            },
            maxInstructions: {
              type: 'number',
              description: 'Maximum instructions to execute (default: 100000)',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'cp1600_reset',
        description: 'Reset CPU to initial state',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Target session',
            },
          },
          required: ['sessionId'],
        },
      },

      // State Inspection
      {
        name: 'cp1600_get_state',
        description: 'Get complete CPU state snapshot',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Target session',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'cp1600_get_registers',
        description: 'Get register values in various formats',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Target session',
            },
            format: {
              type: 'string',
              description: 'Format: "hex", "dec", or "both" (default: "hex")',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'cp1600_get_flags',
        description: 'Get flag states with descriptions',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Target session',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'cp1600_examine_memory',
        description: 'Read memory range',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Target session',
            },
            address: {
              type: 'number',
              description: 'Start address',
            },
            length: {
              type: 'number',
              description: 'Number of words (default: 16, max: 256)',
            },
            format: {
              type: 'string',
              description: 'Format: "hex", "dec", "both", or "ascii" (default: "hex")',
            },
          },
          required: ['sessionId', 'address'],
        },
      },
      {
        name: 'cp1600_disassemble',
        description: 'Disassemble instructions from memory',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Target session',
            },
            address: {
              type: 'number',
              description: 'Start address',
            },
            count: {
              type: 'number',
              description: 'Number of instructions (default: 10, max: 100)',
            },
          },
          required: ['sessionId', 'address'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      // Session Management
      case 'cp1600_create_session':
        result = sessionTools.createSession(sessionManager, args || {});
        break;
      case 'cp1600_list_sessions':
        result = sessionTools.listSessions(sessionManager);
        break;
      case 'cp1600_destroy_session':
        result = sessionTools.destroySession(sessionManager, args as { sessionId: string });
        break;

      // Execution Control
      case 'cp1600_load_rom':
        result = executionTools.loadROM(sessionManager, args as { sessionId: string; romPath: string; startAddress?: number });
        break;
      case 'cp1600_step':
        result = executionTools.step(sessionManager, args as { sessionId: string; count?: number });
        break;
      case 'cp1600_run':
        result = executionTools.run(sessionManager, args as { sessionId: string; maxInstructions?: number });
        break;
      case 'cp1600_reset':
        result = executionTools.reset(sessionManager, args as { sessionId: string });
        break;

      // State Inspection
      case 'cp1600_get_state':
        result = inspectionTools.getState(sessionManager, args as { sessionId: string });
        break;
      case 'cp1600_get_registers':
        result = inspectionTools.getRegisters(sessionManager, args as { sessionId: string; format?: string });
        break;
      case 'cp1600_get_flags':
        result = inspectionTools.getFlags(sessionManager, args as { sessionId: string });
        break;
      case 'cp1600_examine_memory':
        result = inspectionTools.examineMemory(sessionManager, args as { sessionId: string; address: number; length?: number; format?: string });
        break;
      case 'cp1600_disassemble':
        result = inspectionTools.disassemble(sessionManager, args as { sessionId: string; address: number; count?: number });
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: {
              code: 'tool_execution_error',
              message: errorMessage,
            },
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('pkIntvMCP CPU Server v0.1.0 started');
  console.error('Sprint 1.7: Basic MCP server implementation');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
