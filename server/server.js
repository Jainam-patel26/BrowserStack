const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const Watcher = require('./watcher');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const logWatcher = new Watcher(path.join(__dirname, 'test.log'));

app.use(express.static(path.join(__dirname, '../client')));

app.get('/log', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Handle new WebSocket connections
io.on('connection', (socket) => {
  // Send initial logs to the newly connected client
  socket.emit('initial_logs', logWatcher.getLogs());

  // Listen for updates from the Watcher and send them to the client
  logWatcher.on('update', (newLines) => {
    socket.emit('log_update', newLines);
  });
});

// Start monitoring the log file
logWatcher.start();

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
