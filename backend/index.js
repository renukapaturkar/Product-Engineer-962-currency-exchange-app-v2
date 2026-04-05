require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OER_APP_ID = process.env.OPENEXCHANGERATES_APP_ID;

// Keep cache data persistently between requests until it drops from Vercel memory
let apiCache = {
  rates: null,
  lastUpdated: null,
  source: null
};

// Cache for 60 minutes to respect free tier limits (Open Exchange Rates: 1000/mo)
// 1000 requests/month ~ 33 requests/day ~ ~1 request/45 mins. So 60 mins is safe!
const CACHE_TTL = 60 * 60 * 1000;

const fetchOpenExchangeRates = async () => {
    if (!OER_APP_ID || OER_APP_ID === 'your_open_exchange_rates_key_here') throw new Error("No OpenExchangeRates Key");
    const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${OER_APP_ID}`);
    if (!res.ok) throw new Error('OER API unavailable');
    const data = await res.json();
    return data.rates;
};

const fetchExchangeRateAPI = async () => {
    // Keyed authenticated fallback using provided V6 endpoint
    const apiKey = process.env.EXCHANGERATE_API_KEY || '38b55cfc391dbd21f2b1dab6';
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
    if (!res.ok) throw new Error('ExchangeRate-API unavailable');
    const data = await res.json();
    
    if (data.result !== 'success') throw new Error('ExchangeRate request failed');
    return data.conversion_rates;
};

app.get('/api/rates', async (req, res) => {
  const now = Date.now();
  const isCacheFresh = apiCache.lastUpdated && ((now - apiCache.lastUpdated) < CACHE_TTL);

  if (isCacheFresh) {
    return res.json({
      status: 'success',
      data: apiCache.rates,
      metadata: {
        source: apiCache.source,
        isCached: true,
        lastUpdated: new Date(apiCache.lastUpdated).toISOString()
      }
    });
  }

  try {
    apiCache.rates = await fetchOpenExchangeRates();
    apiCache.source = 'Primary (Open Exchange Rates)';
    apiCache.lastUpdated = now;
  } catch (err1) {
    console.error('OER failed: ', err1.message);
    try {
      apiCache.rates = await fetchExchangeRateAPI();
      apiCache.source = 'Secondary (ExchangeRate-API)';
      apiCache.lastUpdated = now;
    } catch (err2) {
      console.error('Secondary failed: ', err2.message);
      
      if (apiCache.rates) {
        return res.json({
          status: 'warning',
          message: 'Live APIs unreachable. Serving stale data.',
          data: apiCache.rates,
          metadata: {
            source: 'Stale Cache (' + apiCache.source + ')',
            isCached: true,
            lastUpdated: new Date(apiCache.lastUpdated).toISOString()
          }
        });
      }
      
      return res.status(503).json({
        status: 'error',
        message: 'Service Temporarily Unavailable'
      });
    }
  }

  return res.json({
    status: 'success',
    data: apiCache.rates,
    metadata: {
      source: apiCache.source,
      isCached: false,
      lastUpdated: new Date(apiCache.lastUpdated).toISOString()
    }
  });
});

// Since this file will be parsed by Vercel serverless function,
// we export the app instead of app.listen when on Vercel.
// But for local development, we need to listen on a port.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
