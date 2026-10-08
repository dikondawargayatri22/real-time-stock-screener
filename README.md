# Real-Time Stock Screener

A Next.js demo for screening a curated list of US equities. The app loads live quotes, lets you filter and sort them in the browser, streams price refreshes over a WebSocket, and shows a technical chart for the selected ticker. Last-known quotes are stored in IndexedDB so the table still works when the browser is offline.

This is a market-data **demo**, not a trading product. Quotes come from Yahoo Finance’s public chart/quote APIs (unauthenticated). Use a licensed provider before relying on the numbers for real decisions.

## What you can do

- Browse ~30 large US names (AAPL, MSFT, NVDA, and similar) in a virtualized table
- Filter by P/E, RSI, sector, exchange, and dividend; apply Value, Growth, or Technical Breakout presets
- Sort columns, pin the symbol column, and select rows
- Click a row to open a candlestick chart with SMA/EMA, Bollinger Bands, RSI, and volume
- See a **Live** badge while `/api/ws` is connected; reconnects automatically if the socket drops
- Keep using cached rows when the network goes away (amber offline banner)

## Architecture

```text
Browser
  |-- Home page ── React Query ── GET /api/stocks ── Yahoo Finance
  |       |              |
  |       |              `── Zustand store ── filter engine ── virtualized StockTable
  |       |
  |       `── StockChart ── indicators / chart-data ── Lightweight Charts
  |
  |-- IndexedDB cache (offline fallback)
  `-- WebSocket ── /api/ws ── price updates every 60s
```

| Layer | Role |
| --- | --- |
| `src/app/page.tsx` | Client UI: fetch, filters, table, chart, online/offline banners |
| `src/pages/api/stocks.ts` | Snapshot of quotes + fundamentals (HTTP cache ~60s) |
| `src/pages/api/ws.ts` | Node WebSocket that re-fetches prices and broadcasts `{ type: "prices", updates }` |
| `src/lib/marketData.ts` | Yahoo Finance chart + quote mapping into `Stock` |
| `src/lib/filterEngine.ts` | AND of predicates, cheapest operators first |
| `src/stores/useStockStore.ts` | Stocks, filters, and `updatePrices` |
| `src/lib/stockCache.ts` | IndexedDB `stock-screener` database |
| `src/hooks/useWebSocket.ts` | Subscribe, rAF-batched price patches, exponential reconnect |
| `src/lib/chartData.ts` | Synthetic OHLCV from the current quote (demo chart history) |

The UI uses the App Router. API routes still live under Pages Router so the WebSocket upgrade can attach to the Node HTTP server.

## Prerequisites

- Node.js 20+ (22 recommended)
- npm 10+

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are required.

On first load, React Query calls `/api/stocks`. Successful snapshots are written to IndexedDB. While online, the client opens `ws://localhost:3000/api/ws`, sends `{ "type": "subscribe", "stockIds": [...] }`, and applies price maps from the server. The poll interval on both HTTP and WebSocket is **60 seconds**.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` / `npm start` | Production build and Node server |
| `npm test` | Vitest (jsdom) |
| `npm run test:coverage` | Coverage (70% statements/lines/functions, 65% branches) |
| `npm run lint` | ESLint |

Also useful: `npx tsc --noEmit`. Husky + lint-staged run ESLint and Prettier on staged JS/TS.

## Project layout

```text
src/app/                 App Router page, layout, global styles
src/components/          table, filters, chart, providers
src/hooks/               online status and WebSocket
src/lib/                 market data, filters, indicators, cache, chart series
src/stores/              Zustand
src/types/               Stock, filters, OHLCV
src/pages/api/stocks.ts  live snapshot
src/pages/api/ws.ts      WebSocket upgrade + broadcast
```

## Deployment (Vercel)

```bash
npx vercel
npx vercel --prod
```

`vercel.json` sets the Next.js framework and `npm run build`. Snapshot HTTP (`/api/stocks`) works on Vercel Functions. The WebSocket listener in `/api/ws` needs a long-lived Node process, which Vercel Functions do not provide. For production streaming, run a dedicated WebSocket service and point the client at that URL.

After deploy, check that the page loads, filters work, and the offline banner appears when the network is disabled. Expect the Live badge to stay disconnected on Vercel until a separate socket service exists.

## Conventions

Use Conventional Commits (`feat: …`, `fix: …`). Keep PRs focused and run tests, lint, and `tsc` before opening one. Do not commit `.env*`, `.next`, `coverage`, or `node_modules`.
