// src/App.js

import React, { useEffect, useState } from 'react';
import './App.css';

// Importing logo images
import xLogo from './assets/xlogo.png';
import discordLogo from './assets/discordlogo.png';

function App() {
  // State variables to hold WebSocket data
  const [cryptoMarketCap, setCryptoMarketCap] = useState(15792432); // Placeholder initial value
  const [currentCompany, setCurrentCompany] = useState(null);
  const [nextUpCompany, setNextUpCompany] = useState(null);
  const [copied, setCopied] = useState(false); // State to manage copy feedback

  useEffect(() => {
    // Establish WebSocket connection
    const ws = new WebSocket('ws://localhost:4000'); // Replace with your backend URL if different

    ws.onopen = () => {
      console.log('Connected to WebSocket server.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.cryptoCoinMarketCap !== undefined) {
          setCryptoMarketCap(data.cryptoCoinMarketCap);
        }
        if (data.currentCompany) {
          setCurrentCompany(data.currentCompany);
        } else {
          setCurrentCompany(null);
        }
        if (data.nextUpCompany) {
          setNextUpCompany(data.nextUpCompany);
        } else {
          setNextUpCompany(null);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server.');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup on component unmount
    return () => {
      ws.close();
    };
  }, []);

  /**
   * Helper function to generate Yahoo Finance URL based on ticker symbol
   * @param {string} symbol - The ticker symbol of the company
   * @returns {string} - The Yahoo Finance URL for the given ticker
   */
  const getYahooFinanceURL = (symbol) => {
    return `https://finance.yahoo.com/quote/${symbol}/`;
  };

  /**
   * Function to copy text to clipboard
   * @param {string} text - The text to copy
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Hide feedback after 2 seconds
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  /**
   * Function to handle smooth scrolling to the manifesto section
   */
  const scrollToManifesto = (e) => {
    e.preventDefault();
    const manifestoSection = document.getElementById('manifesto');
    if (manifestoSection) {
      manifestoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="App">
      {/* Section 1 */}
      <section className="section section-1">
        <div className="content">
          {/* Main Market Cap Display */}
          <h1 className="main-text">
          {(!cryptoMarketCap || !currentCompany)
            ? "WAITING FOR BOND..."
            : `$${Math.floor(currentCompany.marketcap - cryptoMarketCap).toLocaleString()}`
          }
        </h1>

          {/* Dynamic Company Names with Hyperlinks */}
          {currentCompany && (
            <p className="small-text">
              AWAY FROM VAMPING:{" "}
              <a 
                href={getYahooFinanceURL(currentCompany.symbol)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="company-link"
                aria-label={`View ${currentCompany.name} on Yahoo Finance`}
                title={`View ${currentCompany.name} on Yahoo Finance`}
              >
                {currentCompany.name}
              </a>
            </p>
          )}
          {nextUpCompany && (
            <p className="small-text next-up-text">
              NEXT UP:{" "}
              <a 
                href={getYahooFinanceURL(nextUpCompany.symbol)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="company-link next-up-link"
                aria-label={`View ${nextUpCompany.name} on Yahoo Finance`}
                title={`View ${nextUpCompany.name} on Yahoo Finance`}
              >
                {nextUpCompany.name}
              </a>
            </p>
          )}

          {/* Company Identifier Box */}
          <div 
            className="box" 
            onClick={() => copyToClipboard('2bq3iV4Sn8GV9E6CZbadP4NHofhgkDfMk2F77Epcpump')}
            aria-label="Copy company identifier to clipboard"
            title="Click to copy"
            tabIndex="0" /* Makes the div focusable */
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                copyToClipboard('2bq3iV4Sn8GV9E6CZbadP4NHofhgkDfMk2F77Epcpump');
              }
            }}
          >
            <p className="box-text">2bq3iV4Sn8GV9E6CZbadP4NHofhgkDfMk2F77Epcpump</p>
          </div>
          
          {/* Feedback Message for Copy Action */}
          {copied && <span className="copy-feedback">COPIED TO CLIPBOARD</span>}

          {/* "JOIN" Box */}
          <a href="#socials" className="box buy-box" aria-label="Join">
            <p className="box-text">JOIN</p>
          </a>

          {/* Scroll Indicator */}
          <a 
            href="#manifesto" 
            className="scroll-indicator" 
            aria-label="Scroll down to Manifesto"
            onClick={scrollToManifesto}
          >
            &#8595; Why? &#8595;
          </a>
        </div>
      </section>

      {/* Section 2 */}
      <section className="section section-2" id="manifesto">
        <div className="manifesto-content">
          <h2 className="manifesto-title">Manifesto</h2>
          <p className="manifesto-text">
            $VAMP is a revolutionary memecoin movement created to challenge the financial status quo by systematically overtaking the market capitalization of established companies.
          </p>
          <p className="manifesto-text">
            With each milestone, $VAMP targets larger and larger corporations, building momentum through community-driven growth and viral appeal. This digital asset harnesses the power of meme culture and social dynamics to fuel its ambitious ascent, aiming to flip traditional market hierarchies and ultimately claim the throne as the world's most valuable asset.
          </p>
          <p className="manifesto-text">
            Through this journey, $FLIP transforms the concept of value creation into an engaging, community-powered mission where every holder becomes part of a historic market revolution.
          </p>
        </div>
      </section>
      
      {/* Section 3 */}
      <section className="section section-3" id="socials">
        <div className="socials-container">
          {/* "Join Us" Text */}
          <h2 className="join-us">Join Us</h2>
          {/* Social Media Icons */}
          <div className="socials-content">
            <a href="https://x.com/i/communities/1876718589308207508" target="_blank" rel="noopener noreferrer" aria-label="Twitter" title="Follow us on Twitter">
              <img src={xLogo} alt="Twitter" className="social-icon" />
            </a>
            <a href="https://discord.gg/ymfyxZkW" target="_blank" rel="noopener noreferrer" aria-label="Discord" title="Join our Discord">
              <img src={discordLogo} alt="Discord" className="social-icon" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
