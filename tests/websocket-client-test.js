#!/usr/bin/env node
/**
 * Test WebSocket connection to the API server
 * This bypasses the Module Federation complexity and tests the socket directly
 */

const { io } = require('socket.io-client');

const WS_URL = 'http://localhost:3010';

console.log('Testing WebSocket connection to:', WS_URL);

// First, check if the server is reachable
const http = require('http');

http.get(`${WS_URL}/health`, (res) => {
  console.log('Health check status:', res.statusCode);

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Health check response:', data);
    testSocketConnection();
  });
}).on('error', (err) => {
  console.error('Health check failed:', err.message);
});

function testSocketConnection() {
  console.log('\n--- Testing Socket.io Connection ---');

  // Try connecting without auth first to see the error message
  const socket = io(WS_URL, {
    auth: {
      token: null, // Will fail auth but we want to see the response
    },
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('Connected! Socket ID:', socket.id);
    socket.disconnect();
  });

  socket.on('connect_error', (error) => {
    console.log('Connection error (expected without token):', error.message);

    // Now let's test that we can at least reach the socket endpoint
    console.log('\n--- Socket endpoint is reachable ---');
    console.log('The WebSocket server is running and responding.');
    console.log('Authentication is required to fully connect.');

    process.exit(0);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Timeout after 10 seconds
  setTimeout(() => {
    console.log('Test timed out');
    socket.disconnect();
    process.exit(1);
  }, 10000);
}
