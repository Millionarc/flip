// src/components/CompanyCard.js

import React from 'react';
import PropTypes from 'prop-types';
import './CompanyCard.css'; 

const CompanyCard = React.memo(({ title, company }) => {
  if (!company) return null;

  const getYahooFinanceURL = (symbol) => `https://finance.yahoo.com/quote/${symbol}/`;

  return (
    <div className={`company-card ${title === 'Currently Vamping' ? 'current' : 'next-up'}`}>
      <h3>{title}:</h3>
      <a 
        href={getYahooFinanceURL(company.symbol)} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="company-link"
        aria-label={`View ${company.name} on Yahoo Finance`}
        title={`View ${company.name} on Yahoo Finance`}
      >
        {company.name} ({company.symbol})
      </a>
      <p className="delta">
        {company.delta} away from vamping.
      </p>
    </div>
  );
});

CompanyCard.propTypes = {
  title: PropTypes.string.isRequired,
  company: PropTypes.shape({
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    delta: PropTypes.number.isRequired,
  }),
};

export default CompanyCard;
