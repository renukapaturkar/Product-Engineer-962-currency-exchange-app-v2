# Decisions

**Which APIs did you choose and why?**
Based on comprehensive analysis of competitive services (XE, Wise, Revolut, Oanda) that set standard expectations for real-time aggregation platforms, we selected three tiers of APIs due to their balance between uptime, feature sets, and request allowances:
1. **Primary: Open Exchange Rates** - Excellent time-series structure and 1,000/month free quota updating hourly. High data accuracy.
2. **Secondary: Fixer.io** - Highly stable alternative providing historical depth, but tightly constrained by 100 requests/month, acting firmly as a secondary layer.
3. **Tertiary: ExchangeRate-API.io** - Generous usage (1,500/month) and no API key required. This serves as the ultimate failsafe when configured secrets run out or misconfigure.

**What's your fallback strategy when an API fails?**
We implement a deep multi-tier fallback strategy:
1. Attempt `Open Exchange Rates` securely using our backend `.env` variables.
2. If it times out or throws an authorization error, fallback to `Fixer.io` and normalize the response (as Fixer's free tier locks the base to EUR, we transpose its math against USD for standardized frontend mapping).
3. If both rate-limit error, attempt the keyless `ExchangeRate-API`.
4. If ALL live APIs collapse, we default to injecting stale server-side cache states.
5. Complete degradation returns an explicit "Systems Unavailable" to the end user.

**How do you handle conflicting data from different sources?**
We compartmentalize requests completely; no cross-pollination. When an API passes, its dataset reigns supreme. This stops arbitrage imbalances created by mixing EUR from Fixer alongside GBP from Open Exchange Rates.

**What does the user see when things fail or data is stale?**
The frontend displays an alert utilizing dynamic Tailwind styling. 
- Fresh data paints a secure **Green** verified emblem showing API source.
- Stale data / Rate-Limited data paints an **Amber/Red** degraded state warning. They receive data, but they immediately understand why it hasn't changed.

**Did you do anything to improve the staleness of data? If so, what?**
Given the strict request limitations of 'Open Exchange Rates' (1,000/month) and 'Fixer.io' (100/month):
We've set the memory limit TTL (Time To Live) up to **60 minutes**. 
- 1,000 requests/month ÷ 30 days = 33 requests/day roughly.
- Fetching exactly once per hour guarantees we will almost *never* hit the primary API limit while giving the user stable, hourly-updated exchange limits. No API budgets are unexpectedly breached.

**What did you cut to ship in 60 minutes?**
- Redis distributions / Real-Time WebSocket streams
- Dedicated Premium Route Gateways (mocked conceptually)

### Retrospective Observations
Working off modern API benchmarks like Wise and Oanda revealed that customers don't mind non-instant updates (e.g., hourly limits)—what they absolutely despise are *unexplained error screens*. By establishing a 3-layer architecture, free users receive maximum possible uptime, instilling faith that could convert them into premium subscribers who need precise to-the-second transactional tracking.
