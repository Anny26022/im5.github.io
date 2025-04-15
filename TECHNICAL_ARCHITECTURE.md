# Technical Architecture Documentation

## Overview
This document describes the technical architecture of the Stock Industry Mapper & Results Calendar Export web application. It provides a high-level view of the application's structure, key flows, data handling, performance strategies, and extensibility guidelines.

---

## High-Level Architecture

- **Frontend:** React (Next.js App Router), TypeScript, shadcn/ui & Tailwind CSS, Framer Motion for animation
- **State Management:** React Context API; local UI state
- **Data Ingestion:** Static CSVs (user-uploads possible); CSV parsing done client-side with PapaParse
- **Hosting & Build:** Vercel/Netlify, uses Bun for build scripts
- **Storage:** No server database; ephemeral in-memory and CSV; browser LocalStorage for watchlist

### Diagram: System Components
```
+-------------------+
|                   |
|  Browser Client   |
|                   |
+-------------------+
         | React API/UI
         v
+-------------------+           +-----------------+
|  Next.js App      |-- static->| CSV Data        |
|                   |           | (public/data/)  |
+-------------------+           +-----------------+
```

---
## Key Technologies
- **Next.js (App Router, TypeScript)**
- **Bun** (preferred local dev)
- **Tailwind CSS, shadcn/ui:** Fast, modern UI with utility classes and pre-built components
- **PapaParse:** Fast CSV parsing in-browser
- **lucide-react, framer-motion:** Icons and animation

---
## Security
- **No persistent server-side data.** All user data is processed in memory or in-browser only.
- **CSV uploads/read:** Only safe CSV is read—no parsing of JS or unsafe input. Potential for XSS is minimized.
- Security best practices enforced via Next.js defaults and code review (e.g., no `dangerouslySetInnerHTML`).
- **No authentication required.**

---
## Performance
- **Static Serving:** CSVs are fetched statically and parsed in parallel, minimizing initial load.
- **Virtualization:** List-chunking for results previews/exports (for large symbol sets)
- **Fast parsing:** PapaParse parses CSV files asynchronously to avoid blocking the UI thread
- **Mobile-first optimizations:** Layout prioritizes most-used features and avoids expensive reflows
- **Configurable delays and timeouts:** Prevents UI lockup on loading/initialization

---
## Main Components & Data Flow

**Stock Industry Mapper Workflow:**
1. User pastes up to 999 NSE symbols (with/without NSE: prefix)
2. Symbols are cleaned, deduped, and chunked client-side
3. Data fetched from in-memory classes or CSV files (`Industry_Analytics.csv` for sectors, `Basic_RS_Setup.csv` for fundamentals)
4. Results are displayed in a categorized table and a flat TradingView format
5. User can copy/download result sets or save as watchlists locally

**Results Calendar Export Workflow:**
1. App loads CSV (`Results_Calendar.csv`) and parses it via PapaParse
2. All available quarterly dates and company/event mappings are loaded into state
3. User filters by date/all/range; optionally by symbol
4. Output is formatted to TradingView/watcher format, ready to copy or download

**Data Flow Diagram:**
```
User Input --> [React/TS Processing] --> [CSV Parse] <--> [App State] --> [UI Display/Export]
```

---
## Extensibility & Customization
- **Easily replace data:** Swap in new CSVs in the `public/data/` folder for updates
- **Theme/UI extension:** Uses Tailwind & shadcn—extend by creating new components or variants
- **Support for new exchanges:** Refactor parsing logic to accept BSE/Ticker prefix; swap industry-class mapping as needed
- **Component modularity:** Major flows (inputs, display, export) are cleanly separated for rapid modification
- **Add authentication/server:** Integrate Next.js server API routes for persistence if desired; otherwise remains static

---
## Files/Dirs of Interest
- `src/app/page.tsx`: Stock Industry Mapper page main logic/UI
- `src/app/results-calendar-export/page.tsx`: Calendar export tool and logic
- `src/components/`: UI composition (inputs, display, stats, instructions, watchlist, etc)
- `src/lib/data-processor.ts`: Data handling for symbol/industry resolution
- `public/data/`: All updatable source CSVs

---
## Diagrams (placeholder)
- ![System Context](docs/diagram-system-context.png)
- ![Data Flow](docs/diagram-dataflow.png)
- ![Component Map](docs/diagram-components.png)

---
## Further Notes
- All code is strictly typed with TypeScript, with preference for immutable data where possible.
- UI/UX quickly adapts for mobile and desktop.
- Project ships with full-feature linting, formatting, and is ready for cloud deployment (Netlify, Vercel, Bun-native).
