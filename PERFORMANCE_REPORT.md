# Performance Report - Phase 6

Date: 2026-09-30

## Scope and benchmarks

No Section A2.3 benchmark document exists in this repository, so there are no approved numeric targets to compare against. The measurements below are reproducible repository measurements; Lighthouse and React DevTools profiler measurements are marked pending rather than estimated.

## Changes made

| Area | Before | After |
| --- | --- | --- |
| Chart loading | `lightweight-charts` was imported by the page render path. | The chart is loaded with `next/dynamic` and `ssr: false`; it is requested only by the client chart boundary. |
| Grid rendering | The grid already used row virtualization. | The grid remains virtualized and is memoized; the fallback caps its first render at 26 rows (500px viewport, 36px rows, 12-row overscan). |
| Realtime updates | Prices are batched per animation frame. | Memoized table/cell components retain that batching and limit price work to affected visible cells. |
| Filtering | Sector options were rebuilt on every panel render. | Sector options are memoized from the stock set. |
| Chart interaction | Chart rendering was part of the general page update path. | Chart rendering is isolated in a memoized component; further crosshair profiling is pending browser instrumentation. |
| Responsive layout | Main content assumed a horizontal layout. | Mobile/tablet stack controls, grid, and chart; desktop uses the original side-by-side layout from the `lg` breakpoint. |

## Build artifact measurement

The latest optimized-build output contains a separately emitted chart chunk:

| Artifact | Size |
| --- | ---: |
| `app-pages-browser_src_components_StockChart_tsx.js` | 1,972.4 KiB |

This proves the charting dependency is split out of the initial page JavaScript. It should only be requested when the client reaches the dynamic chart boundary. Do not treat this file size as an initial-load size.

## Verification

- TypeScript: `npx.cmd tsc --noEmit` passes.
- Unit tests: the existing Vitest suite covers grid virtualization, realtime batching/reconnects, cache behavior, and online/offline state.
- Accessibility checks in code: semantic grid roles and row/column counts, keyboard navigation, labelled controls, `aria-pressed` timeframe buttons, chart label, visible focus styles, and `prefers-reduced-motion` handling.

## Pending manual audits

The current sandbox could not establish its browser-inspection connection, so a Lighthouse run and React DevTools Profiler capture could not be performed here. Complete them against a production server (`npm.cmd run build`, then `npm.cmd start`) using these scenarios:

1. Initial page load with a cold cache.
2. Select a stock and inspect the lazy chart request.
3. Run simulated websocket updates for 30 seconds while scrolling the grid.
4. Resize at 375px, 768px, and 1440px widths.
5. Capture Lighthouse Performance, Accessibility, Best Practices, and SEO scores, and record the React commit duration for price ticks.

Add the resulting values to this document once the Section A2.3 targets are available.
