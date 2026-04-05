# Real-Time Data Aggregation Service (Currency Tracker)

A resilient, multi-tiered currency exchange aggregator targeting traveler and freelance personas facing strict public API tolerances. Built to emulate benchmarking platforms like *XE* and *Wise* using limited free resources.

## The Strategy
1. The backend implements a cascading trio of reliable providers: **Open Exchange Rates -> Fixer.io -> ExchangeRate-API**. 
2. A protective 60-minute in-memory caching filter protects low-capacity rate limit ceilings (e.g., 100/mo and 1000/mo API budgets).
3. The Vite frontend alerts the user dynamically via Tailwind notifications identifying precisely where the data stems from and if degrading conditions invoked the fallback caching mechanisms.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS v3
- Backend: Node.js + Express
- Ecosystem: Vercel integration 

## How to Run

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Configure Secrets**
   Navigate to the `backend/` folder. Duplicate `.env.example` as `.env`.
   Insert your Secret Keys based on the research integration criteria:
   ```env
   OPENEXCHANGERATES_APP_ID="your_secret_app_id"
   FIXER_API_KEY="your_secret_fixer_api_key_here"
   ```

3. **Start Servers**
   ```bash
   npm run dev
   ```
   *Frontend initializes at `http://localhost:5173`, proxying `/api` safely against Vite's backend port integration `http://localhost:3000`.*
