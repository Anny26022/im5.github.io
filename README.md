# Stock Industry Mapper & Results Calendar Export

A web application for mapping Indian stock symbols to industry categories and exporting quarterly results data in TradingView-compatible formats.

## Features

- **Stock Industry Mapper**: Maps up to 999 NSE symbols to industry categories, returns categorized and flat exports, and supports watchlists and batch processing.
- **Results Calendar Export**: Parses quarterly results CSV calendars and outputs import-ready lists for TradingView.
- **Friendly UI**: Responsive design with mobile-first optimizations and helpful workflow instructions.
- **Quick Filtering**: Flexible filters for symbols, date ranges, and more.
- **Copy/Download Exports**: One-click copy or download for TradingView or analysis.

---

## Live Demo

_Coming Soon!_
<!-- Optionally include screenshot or Netlify/Vercel live link here. -->

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (preferred) or [Node.js + npm](https://nodejs.org/)
- [Git](https://git-scm.com/)

### Installation

```sh
# Clone the repo
bun create my-app  # or git clone <this-repo-url>
cd my-app

# Install dependencies
bun install

# Start the local development server
bun run dev
# App will be available at http://localhost:3000
```

---

## Usage

### 1. Stock Industry Mapper

- **Input stock symbols** to map them to industry and sector categories. Paste up to 999 symbols (comma/newline-separated, with/without NSE: prefix).
- **Instructions**: Read the quick-start card at the top for workflow tips or click "Show Instructions" button on mobile.
- **Export/Copy** your mapped results in categorized or flat TradingView format.
- **Watchlists**: Save mapped lists for quick re-use.

![Stock Industry Mapper Screenshot](docs/screenshot-mapper.png)

### 2. Results Calendar Export

- **Preview and export results** by company and date from the latest CSV.
- **Filter by dates or range** for tailored exports.
- **Download or copy** the TradingView-formatted output instantly.

![Results Calendar Export Screenshot](docs/screenshot-calendar.png)

---

## Project Structure

```
src/
  app/                  # Next.js app directory
    page.tsx            # Main Stock Industry Mapper page
    results-calendar-export/
      page.tsx          # Results Calendar Export page
    layout.tsx          # Main app layout
  components/           # UI and logic components
    instructions.tsx    # Instructional component
    stats-card.tsx      # Card components (stats, etc.)
    symbol-input-form.tsx   # Symbol input form logic
    results-display.tsx # Displays mapping results
    ...
  lib/                  # Utilities (data processors)
  context/              # React context for app state
  data/                 # Static or uploaded data files
public/
  ...                   # Static assets
```

---

## Contributing

Pull requests are welcome! For major changes, open an issue first to discuss what you’d like to change.

**To develop:**
- Use a feature branch and submit PRs against `main`.
- Keep code style consistent (`bun run lint` or similar).
- UI changes? Attach screenshots/gifs!

---

## FAQ

**Q: Can I map more than 999 symbols?**
A: The mapper restricts input to 999 symbols per batch for browser and performance reasons.

**Q: How do I update the results calendar data?**
A: Upload a new `Results_Calendar.csv` in the `public/data/` folder and refresh the page.

**Q: Does it support BSE or only NSE?**
A: Only NSE symbols are currently supported.

---

## License

MIT
