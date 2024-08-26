const fs = require('fs');
const EventEmitter = require('events');

/**
 * Watcher class to monitor changes in a log file and emit updates.
 */
class Watcher extends EventEmitter {
  /**
   * Creates an instance of Watcher.
   * @param {string} filename - The path to the log file to monitor.
   */
  constructor(filename) {
    super();
    this.filename = filename;
    this.lastModified = 0; // Last modification time of the file
    this.lastReadPosition = 0; // Last position read in the file
    this.store = []; // Array to store the last 10 lines of the log
  }

  /**
   * Returns the current logs stored (last 10 lines).
   * @returns {string} - The joined logs as a single string.
   */
  getLogs() {
    return this.store.join('\n');
  }

  /**
   * Starts the log monitoring process by reading the initial file content
   * and setting up polling to check for updates.
   */
  start() {
    this.readInitial(); // Read the initial file content
    this.poll(); // Start polling for file updates
  }

  /**
   * Reads the initial log file content and sets up the last read position.
   */
  readInitial() {
    const stats = fs.statSync(this.filename); // Get file stats
    this.lastModified = stats.mtimeMs; // Update last modification time
    this.lastReadPosition = stats.size; // Set last read position to file end

    const buffer = Buffer.alloc(1024); // Allocate buffer for reading file
    let file = fs.openSync(this.filename, 'r'); // Open file for reading
    let position = Math.max(0, stats.size - 1024); // Position to start reading
    let bytesRead = fs.readSync(file, buffer, 0, 1024, position); // Read file content
    fs.closeSync(file); // Close the file

    // Convert buffer to string and update the store with last 10 lines
    let content = buffer.toString('utf8', 0, bytesRead);
    this.store = content.split('\n').slice(-10);

    this.emit('update', this.store); // Emit initial log lines to listeners
  }

  /**
   * Sets up polling to check for file changes at regular intervals.
   */
  poll() {
    setInterval(() => {
      const stats = fs.statSync(this.filename); // Get file stats
      if (stats.mtimeMs > this.lastModified) {
        // Check if file has been modified
        this.readUpdates(); // Read and process new updates
        this.lastModified = stats.mtimeMs; // Update last modification time
      }
    }, 1000); // Poll every second
  }

  /**
   * Reads new updates from the file and updates the store with the last 10 lines.
   */
  readUpdates() {
    const stats = fs.statSync(this.filename); // Get file stats
    if (this.lastReadPosition >= stats.size) return; // No new updates to process
  
    const buffer = Buffer.alloc(stats.size - this.lastReadPosition); // Allocate buffer
    let file = fs.openSync(this.filename, 'r'); // Open file for reading
    fs.readSync(file, buffer, 0, buffer.length, this.lastReadPosition); // Read new content
    fs.closeSync(file); // Close the file
  
    this.lastReadPosition = stats.size; // Update last read position
  
    const newContent = buffer.toString('utf8'); // Convert buffer to string
    const lines = newContent.split('\n'); // Split new content into lines
  
    // Update the store with the new lines and ensure we only keep the last 10 lines
    this.store = [...this.store.slice(-9), ...lines].slice(-10); // Keep last 10 lines
  
    this.emit('update', lines); // Emit the new lines only
  }  
}

module.exports = Watcher;