import { useState, useEffect, useMemo } from 'react'

interface RateData {
  status: string;
  message?: string;
  data: Record<string, number>;
  metadata: {
    source: string;
    isCached: boolean;
    lastUpdated: string;
  }
}

function App() {
  const [rateData, setRateData] = useState<RateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState<string>('1.00');
  const [sourceCurrency, setSourceCurrency] = useState<string>('USD');
  const [targetCurrency, setTargetCurrency] = useState<string>('EUR');

  const fetchRates = () => {
    setLoading(true);
    fetch('/api/rates')
      .then(res => {
        if (!res.ok) throw new Error('Service Unavailable');
        return res.json();
      })
      .then((resData: RateData) => {
        if (resData.status === 'error') throw new Error(resData.message);
        
        // Add USD if it isn't in the data (to map cross-rates correctly)
        if (!resData.data['USD']) resData.data['USD'] = 1;

        setRateData(resData);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch rates');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const currenciesToShow = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CHF', 'CNY'];

  const allCurrencies = useMemo(() => {
    if (!rateData) return [];
    return Object.keys(rateData.data).sort();
  }, [rateData]);

  const handleSwap = () => {
    setSourceCurrency(targetCurrency);
    setTargetCurrency(sourceCurrency);
  };

  const convertedAmount = useMemo(() => {
    if (!rateData || !rateData.data[sourceCurrency] || !rateData.data[targetCurrency]) return null;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    
    // Everything is normalized relative to USD.
    // Source to USD => Amount / SourceRate
    // USD to Target => USDAmount * TargetRate
    const amountInUSD = numAmount / rateData.data[sourceCurrency];
    return (amountInUSD * rateData.data[targetCurrency]).toFixed(4);
  }, [amount, sourceCurrency, targetCurrency, rateData]);

  const exchangeRateInfo = useMemo(() => {
    if (!rateData || !rateData.data[sourceCurrency] || !rateData.data[targetCurrency]) return null;
    const rate = rateData.data[targetCurrency] / rateData.data[sourceCurrency];
    return `1 ${sourceCurrency} = ${rate.toFixed(4)} ${targetCurrency}`;
  }, [sourceCurrency, targetCurrency, rateData]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl border-b pb-4 border-gray-200">
            Real-Time Currency Tracker
          </h1>
          <p className="mt-4 text-xl text-gray-500">Live API Exchange Rates & Conversions</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-md shadow-sm">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong className="font-medium text-red-800">Error:</strong> {error}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Our live APIs are currently unreachable and no cache is available. Please try again later.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && !rateData && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <span className="ml-4 text-lg text-gray-600 font-medium">Loading live rates...</span>
          </div>
        )}

        {rateData && (
          <div className="flex flex-col gap-8">
            
            {/* Calculator Widget */}
            <div className="bg-white shadow-xl overflow-hidden sm:rounded-lg border border-gray-100 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Currency Calculator</h2>
              
              <div className="flex flex-col md:flex-row items-center gap-4">
                
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input 
                    type="number" 
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border text-lg"
                    placeholder="1.00"
                  />
                </div>

                <div className="w-full md:w-1/4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <select
                    value={sourceCurrency}
                    onChange={(e) => setSourceCurrency(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border text-lg bg-white"
                  >
                    {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex items-end justify-center pt-6">
                  <button onClick={handleSwap} className="p-3 text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 border border-gray-200 rounded-full hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    {/* Swap icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                </div>

                <div className="w-full md:w-1/4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <select
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border text-lg bg-white"
                  >
                    {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

              </div>

              <div className="mt-8 flex flex-col md:flex-row justify-between items-center bg-gray-50 rounded-lg p-6 border border-gray-100">
                <div>
                  <p className="text-gray-500 font-medium text-sm mb-1">{amount || "0"} {sourceCurrency} equals</p>
                  <p className="text-4xl font-bold text-gray-900">{convertedAmount !== null ? convertedAmount : "---"} <span className="text-2xl text-indigo-600 ml-1">{targetCurrency}</span></p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded shadow-sm border border-gray-200 inline-block">{exchangeRateInfo}</p>
                </div>
              </div>

            </div>

            {/* Freshness Indicator & Main Overview */}
            <div className="bg-white shadow-xl overflow-hidden sm:rounded-lg border border-gray-100">
              <div className={`px-4 py-5 border-b sm:px-6 flex justify-between items-center ${rateData.status === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                <div>
                  <h3 className={`text-lg leading-6 font-medium ${rateData.status === 'warning' ? 'text-amber-800' : 'text-green-800'}`}>
                    Data Status: {rateData.status === 'warning' ? 'Degraded / Cached' : 'Live & Verified'}
                  </h3>
                  <p className={`mt-1 max-w-2xl text-sm ${rateData.status === 'warning' ? 'text-amber-600' : 'text-green-600'}`}>
                    {rateData.status === 'warning' ? 'Live APIs are currently unreachable. Showing last known rates.' : 'Rates are fresh and actively synced.'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</p>
                  <p className="text-sm font-medium text-gray-900">{rateData.metadata.source}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(rateData.metadata.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="text-lg font-bold text-gray-800">Popular Markets (1 USD)</h3>
                </div>
                <dl className="sm:divide-y sm:divide-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6 bg-gray-50">
                  {currenciesToShow.map(currency => {
                    const rate = rateData.data[currency];
                    return rate ? (
                      <div key={currency} className="bg-white py-4 px-6 shadow-sm rounded-lg flex justify-between items-center hover:shadow-md hover:scale-[1.02] transition-all duration-200 border border-gray-100">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <span className="text-2xl mr-3 font-bold text-gray-800">{currency}</span>
                        </dt>
                        <dd className="mt-1 text-2xl font-bold text-indigo-600 sm:mt-0">
                          {rate.toFixed(4)}
                        </dd>
                      </div>
                    ) : null;
                  })}
                </dl>
              </div>
              <div className="p-4 text-center bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={fetchRates}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 border border-transparent justify-center w-full sm:w-auto text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Refreshing...' : 'Refresh Live Rates'}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default App
