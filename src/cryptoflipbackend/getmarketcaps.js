// getmarketcaps.js

const EventEmitter = require('events');
const axios = require('axios');
require('dotenv').config();

// Create an EventEmitter instance
class MarketCapEmitter extends EventEmitter {}
const marketCapEmitter = new MarketCapEmitter();

// Configuration
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WSOL_VAULT_ADDRESS = process.env.WSOL_VAULT_ADDRESS;
const TOKEN_VAULT_ADDRESS = process.env.TOKEN_VAULT_ADDRESS;
const SPL_TOKEN_SYMBOL = process.env.SPL_TOKEN_SYMBOL;
const TOKEN_TOTAL_SUPPLY = process.env.TOKEN_TOTAL_SUPPLY; // Add total supply in .env

const SOL_PRICE_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

// Helius API URL and headers
const HELIUS_API_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_HEADERS = {
    'Content-Type': 'application/json'
};

// Global cache for SOL/USD price
let priceCache = {
    solUsd: null,
    lastUpdated: 0,
    splTokenUsd: null // Initialize splTokenUsd
};

/**
 * Fetches the current SOL/USD price from CoinGecko.
 */
async function fetchSolUsdPrice() {
    try {
        const response = await axios.get(SOL_PRICE_API_URL);
        if (response.status === 200) {
            const solPrice = response.data.solana.usd;
            if (solPrice) {
                priceCache.solUsd = solPrice;
                console.log(`[${new Date().toISOString()}] Updated SOL/USD price: $${solPrice}`);
            } else {
                console.error('Error: SOL price not found in the response.');
            }
        } else {
            console.error(`Error fetching SOL/USD price: HTTP ${response.status}`);
        }
    } catch (error) {
        console.error(`Exception while fetching SOL/USD price: ${error.message}`);
    }
}

/**
 * Fetches the token balance from a given vault address.
 * @param {string} vaultAddress - The public key of the vault address.
 * @returns {number} - The token balance in UI amount.
 */
async function fetchTokenBalance(vaultAddress) {
    const requestBody = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountBalance",
        params: [vaultAddress]
    };

    try {
        const response = await axios.post(HELIUS_API_URL, requestBody, { headers: HELIUS_HEADERS });
        if (response.status === 200) {
            const balance = response.data.result.value.uiAmount;
            if (balance !== null) {
                return parseFloat(balance);
            } else {
                console.error(`Error: Balance not found for ${vaultAddress}.`);
                return 0;
            }
        } else {
            console.error(`Error fetching balance for ${vaultAddress}: HTTP ${response.status}`);
            return 0;
        }
    } catch (error) {
        console.error(`Exception while fetching balance for ${vaultAddress}: ${error.message}`);
        return 0;
    }
}

/**
 * Fetches the total supply of the SPL token.
 * @returns {number|null} - The total supply or null if error.
 */
function getTotalSupply() {
    if (TOKEN_TOTAL_SUPPLY) {
        const totalSupply = parseFloat(TOKEN_TOTAL_SUPPLY);
        if (!isNaN(totalSupply) && totalSupply > 0) {
            return totalSupply;
        } else {
            console.error('Error: Invalid TOKEN_TOTAL_SUPPLY value.');
            return null;
        }
    } else {
        console.error('Error: TOKEN_TOTAL_SUPPLY not defined in environment variables.');
        return null;
    }
}

/**
 * Calculates and emits the market cap using Raydium's pricing algorithm.
 */
async function calculateAndEmitMarketCap() {
    const wsolBalance = await fetchTokenBalance(WSOL_VAULT_ADDRESS);
    const splTokenBalance = await fetchTokenBalance(TOKEN_VAULT_ADDRESS);

    if (wsolBalance > 0 && splTokenBalance > 0) {
        // Implement Raydium's pricing algorithm
        // Assuming quoteMint is NATIVE_MINT (WSOL)
        // Thus, priceInSol = quote / base = wsolBalance / splTokenBalance
        const priceInSol = wsolBalance / splTokenBalance;

        if (priceInSol <= 0) {
            console.error('Error: Invalid priceInSol calculated.');
            return;
        }

        // Calculate SPL Token price in USD
        if (priceCache.solUsd) {
            const splTokenUsd = priceInSol * priceCache.solUsd;
            priceCache.splTokenUsd = splTokenUsd;

            const totalSupply = getTotalSupply();
            if (totalSupply) {
                // Calculate Market Cap
                const marketCapUsd = splTokenUsd * totalSupply;

                console.log(`[${new Date().toISOString()}] Market Cap: $${marketCapUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`);

                // Emit the market cap
                marketCapEmitter.emit('marketcap', marketCapUsd);
            }
        } else {
            console.error('Error: SOL/USD price not available.');
        }
    } else {
        console.error('Error: One or both token balances are zero or unavailable.');
    }
}

/**
 * Initializes the market cap calculation and updates.
 */
function initMarketCapUpdates() {
    // Initial fetch
    fetchSolUsdPrice().then(() => {
        calculateAndEmitMarketCap();
    });

    // Schedule price updater every 5 minutes
    setInterval(fetchSolUsdPrice, 5 * 60 * 1000);

    // Schedule market cap calculator every 2 seconds
    setInterval(calculateAndEmitMarketCap, 2 * 1000);
}

// Start updating
initMarketCapUpdates();

// Export the EventEmitter
module.exports = marketCapEmitter;
