// server.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Import the market cap emitter from getmarketcaps.js
const marketCapEmitter = require('./getmarketcaps'); // Ensure the path is correct

// Configuration
const PORT = process.env.PORT || 4000;
const CSV_FILE_PATH = path.join(__dirname, 'data', 'companies.csv'); // Ensure the CSV file exists at this path

// Initialize Express App
const app = express();
app.use(cors());

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSocket Server
const wss = new WebSocket.Server({ server });

// Data Structures
let companies = []; // Sorted array to hold company data
let cryptoMarketCap = null; // Updated via getmarketcaps.js
let currentCompany = null; // The current company based on cryptoMarketCap
let nextUpCompany = null; // The next company in the sorted list

/**
 * Function to load and sort company data from a CSV file.
 * The CSV should have headers: Name, Symbol, marketcap
 */
function loadCSVData() {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => {
        // Parse and clean data
        const company = {
          name: data.Name,
          symbol: data.Symbol,
          marketcap: parseFloat(data.marketcap),
        };
        // Validate data
        if (
          company.name &&
          company.symbol &&
          !isNaN(company.marketcap) &&
          company.marketcap >= 0
        ) {
          results.push(company);
        } else {
          console.warn(
            `Invalid data encountered and skipped: ${JSON.stringify(data)}`
          );
        }
      })
      .on('end', () => {
        // Sort companies in ascending order of market cap for efficient searching
        companies = results.sort((a, b) => a.marketcap - b.marketcap);
        console.log(`Loaded and sorted ${companies.length} companies from CSV.`);
        resolve();
      })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err);
        reject(err);
      });
  });
}

/**
 * Binary search to find the index where cryptoMarketCap would fit.
 * Returns the index of the first company with marketcap >= cryptoMarketCap.
 * If all companies have marketcap < cryptoMarketCap, returns companies.length
 */
function findInsertPosition(cryptoMarketCap) {
  let left = 0;
  let right = companies.length - 1;
  let result = companies.length; // Default to end if not found

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (companies[mid].marketcap === cryptoMarketCap) {
      return mid;
    } else if (companies[mid].marketcap < cryptoMarketCap) {
      left = mid + 1;
    } else {
      result = mid;
      right = mid - 1;
    }
  }

  return result;
}

/**
 * Function to determine currentCompany and nextUpCompany based on cryptoMarketCap.
 */
function determineCompanies(cryptoMarketCap) {
  if (!companies || companies.length === 0) {
    console.warn('Companies data is not loaded yet.');
    currentCompany = null;
    nextUpCompany = null;
    return;
  }

  const position = findInsertPosition(cryptoMarketCap);

  if (position === 0) {
    // cryptoMarketCap is less than the smallest company
    currentCompany = companies[0];
    nextUpCompany = companies[1] || null;
  } else if (position === companies.length) {
    // cryptoMarketCap is greater than all companies
    currentCompany = companies[companies.length - 1];
    nextUpCompany = null; // No next company
  } else {
    currentCompany = companies[position];
    nextUpCompany = companies[position + 1] || null;
  }

  console.log(
    `[${new Date().toISOString()}] Current Company: ${currentCompany ? currentCompany.name : 'N/A'}, Next Up Company: ${nextUpCompany ? nextUpCompany.name : 'N/A'}`
  );
}

/**
 * Function to broadcast data to all connected WebSocket clients.
 * @param {Object} data - The data object to broadcast.
 */
function broadcastData(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Set up WebSocket connection handling.
 * Sends initial data to clients upon connection.
 */
function setupWebSocketConnections() {
  wss.on('connection', (ws) => {
    console.log('New client connected.');

    // Prepare initial data
    const initialData = {
      cryptoCoinMarketCap: cryptoMarketCap, // Correctly mapping the key
      currentCompany,
      nextUpCompany,
    };

    // Send initial data to the connected client
    ws.send(JSON.stringify(initialData));

    ws.on('close', () => {
      console.log('Client disconnected.');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

/**
 * Listen for market cap updates emitted by getmarketcaps.js and broadcast them.
 */
function setupMarketCapListener() {
  marketCapEmitter.on('marketcap', (newMarketCap) => {
    cryptoMarketCap = newMarketCap;

    console.log(
      `[${new Date().toISOString()}] Updated Crypto Market Cap: $${cryptoMarketCap.toLocaleString(
        'en-US',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      )} USD`
    );

    // Determine currentCompany and nextUpCompany based on the new cryptoMarketCap
    determineCompanies(cryptoMarketCap);

    // Prepare data to broadcast
    const dataToBroadcast = {
      cryptoCoinMarketCap: cryptoMarketCap, // Correctly mapping the key
      currentCompany,
      nextUpCompany,
    };

    // Broadcast the updated data to all connected clients
    broadcastData(dataToBroadcast);
  });
}

/**
 * Initialize the server by loading data, setting up WebSocket connections,
 * and listening for market cap updates.
 */
async function initServer() {
  try {
    // Load and sort company data from CSV
    await loadCSVData();

    // Set up WebSocket connections
    setupWebSocketConnections();

    // Set up listener for market cap updates
    setupMarketCapListener();

    // Start the HTTP and WebSocket server
    server.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1); // Exit the process with an error code
  }
}

// Start the server
initServer();
