#!/usr/bin/env node
/**
 * Test script to run MCP server directly and test it
 * This simulates what Cursor does when connecting to the MCP server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

console.log('🧪 Testing MCP Playwright Server');
console.log('================================\n');

// Check environment
console.log('Environment variables:');
console.log('  USE_EXTENSION:', process.env.USE_EXTENSION);
console.log('  USE_BRAVE:', process.env.USE_BRAVE);
console.log('  BRAVE_EXECUTABLE:', process.env.BRAVE_EXECUTABLE);
console.log('');

// Build MCP request (JSON-RPC format)
const mcpRequest = {
  jsonrpc: '2.0',
  id: 1,
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

console.log('📤 Sending MCP request:');
console.log(JSON.stringify(mcpRequest, null, 2));
console.log('');

// Spawn the MCP server
const cliPath = path.join(__dirname, 'cli-brave.js');
const mcpProcess = spawn('node', [cliPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env
});

let stdoutBuffer = '';
let stderrBuffer = '';

mcpProcess.stdout.on('data', (data) => {
  const text = data.toString();
  stdoutBuffer += text;
  process.stdout.write('📥 STDOUT: ' + text);
});

mcpProcess.stderr.on('data', (data) => {
  const text = data.toString();
  stderrBuffer += text;
  process.stderr.write('📥 STDERR: ' + text);
});

mcpProcess.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});

mcpProcess.on('exit', (code) => {
  console.log(`\n\n✅ MCP server exited with code: ${code}`);
  console.log('\n📋 Full STDOUT:');
  console.log(stdoutBuffer);
  console.log('\n📋 Full STDERR:');
  console.log(stderrBuffer);
  process.exit(code);
});

// Send the initialize request after a short delay
setTimeout(() => {
  console.log('📤 Sending initialize request...\n');
  const requestStr = JSON.stringify(mcpRequest) + '\n';
  mcpProcess.stdin.write(requestStr);
  
  // After 2 seconds, send a ping
  setTimeout(() => {
    const pingRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'ping'
    };
    console.log('📤 Sending ping...\n');
    mcpProcess.stdin.write(JSON.stringify(pingRequest) + '\n');
    
    // After 5 more seconds, close
    setTimeout(() => {
      console.log('\n\n⏹️  Closing connection...');
      mcpProcess.stdin.end();
    }, 5000);
  }, 2000);
}, 1000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Interrupted by user');
  mcpProcess.kill();
  process.exit(0);
});

