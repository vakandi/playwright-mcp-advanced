#!/usr/bin/env node
/**
 * Interactive test script for MCP server
 * Allows you to send MCP commands interactively
 */

const readline = require('readline');
const { spawn } = require('child_process');
const path = require('path');

// Load .env
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
  } catch (e2) {
    // No .env file
  }
}

console.log('🧪 Interactive MCP Playwright Test');
console.log('==================================\n');
console.log('Environment:');
console.log('  USE_EXTENSION:', process.env.USE_EXTENSION || 'not set');
console.log('  USE_BRAVE:', process.env.USE_BRAVE || 'not set');
console.log('');

// Spawn MCP server
const cliPath = path.join(__dirname, 'cli-brave.js');
const mcpProcess = spawn('node', [cliPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env
});

let requestId = 1;

// Setup readline for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'MCP> '
});

// Handle MCP server output
mcpProcess.stdout.on('data', (data) => {
  const text = data.toString();
  try {
    // Try to parse as JSON
    const lines = text.trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          console.log('\n📥 Response:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('\n📥 Output:', line);
        }
      }
    });
  } catch (e) {
    console.log('\n📥 Output:', text);
  }
  rl.prompt();
});

mcpProcess.stderr.on('data', (data) => {
  console.error('\n⚠️  STDERR:', data.toString());
  rl.prompt();
});

mcpProcess.on('exit', (code) => {
  console.log(`\n\n✅ MCP server exited with code: ${code}`);
  rl.close();
  process.exit(code);
});

// Send initialize on start
setTimeout(() => {
  const initRequest = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  console.log('📤 Sending initialize...');
  mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  rl.prompt();
}, 500);

// Handle user commands
rl.on('line', (line) => {
  const input = line.trim();
  
  if (input === 'exit' || input === 'quit') {
    mcpProcess.kill();
    rl.close();
    return;
  }
  
  if (input === 'init' || input === 'initialize') {
    const request = {
      jsonrpc: '2.0',
      id: requestId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    return;
  }
  
  if (input === 'ping') {
    const request = {
      jsonrpc: '2.0',
      id: requestId++,
      method: 'ping'
    };
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    return;
  }
  
  if (input === 'tools' || input === 'list-tools') {
    const request = {
      jsonrpc: '2.0',
      id: requestId++,
      method: 'tools/list'
    };
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    return;
  }
  
  if (input.startsWith('{')) {
    // Try to parse as JSON and send directly
    try {
      const json = JSON.parse(input);
      if (!json.id) json.id = requestId++;
      mcpProcess.stdin.write(JSON.stringify(json) + '\n');
    } catch (e) {
      console.log('❌ Invalid JSON:', e.message);
      rl.prompt();
    }
    return;
  }
  
  if (input === 'help') {
    console.log('\nCommands:');
    console.log('  init, initialize  - Send initialize request');
    console.log('  ping              - Send ping request');
    console.log('  tools, list-tools - List available tools');
    console.log('  {json}            - Send raw JSON request');
    console.log('  exit, quit        - Exit');
    console.log('  help              - Show this help');
    rl.prompt();
    return;
  }
  
  if (input) {
    console.log('❌ Unknown command. Type "help" for commands.');
    rl.prompt();
  } else {
    rl.prompt();
  }
});

rl.on('close', () => {
  console.log('\n👋 Goodbye!');
  mcpProcess.kill();
  process.exit(0);
});

console.log('Type "help" for commands, or "exit" to quit\n');
rl.prompt();

