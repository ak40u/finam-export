# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Finam quotes export tool that downloads historical market data from Finam's export API. The project consists of:

1. **Python export scripts** (`finam_export.py`, `set_token.py`) - Core data fetching logic
2. **Electron desktop app** (`apps/desktop/`) - GUI wrapper for the export functionality
3. **Output directory structure** (`out/`) - Organized by ticker symbol, period, and year

## Architecture

### Data Export System (`finam_export.py`)

The main export script handles Finam's strict API limitations:

- **Period-based chunking**: Different period types (p=1 for ticks, p=2-7 for intraday, p=8-10 for daily+) have different maximum date range limits
  - p=1: Max 1 day per request
  - p=2-7: Max 3-4 months per request
  - p=8-10: Max 5 years per request
- **Date range splitting**: `chunk_ranges(start, end, period)` automatically breaks date ranges into API-compliant chunks
- **Error handling**: Retry logic with exponential backoff for HTTP 429/500+ errors
- **Fallback splitting**: `--fallback` flag triggers monthly splitting when quarterly chunks fail
- **File merging**: `--merge` and `--merge-all` options combine chunked files, removing duplicate headers

### Token Management (`set_token.py`)

Utility to extract and save Finam API token from URL or direct input. Token is stored in `finam_token.txt` and loaded by the export script via:
1. `--token` CLI argument
2. `FINAM_TOKEN` environment variable
3. `finam_token.txt` file (fallback)

### Desktop App (`apps/desktop/`)

TypeScript/Electron application that provides a GUI for the export functionality. Built with:
- Main process in `dist/main/main.js`
- TypeScript source in `src/`
- Assets copied via `scripts/copy-assets.js`

## Common Commands

### Python Export

Basic export for a ticker:
```bash
python finam_export.py --code AAPL --em 75022 --period 2 --year 2025
```

Export with quarterly merging:
```bash
python finam_export.py --code AAPL --em 75022 --period 2 --year 2025 --merge
```

Custom date range:
```bash
python finam_export.py --code AAPL --em 75022 --period 2 --from 01.09.2025 --to 23.11.2025
```

With monthly fallback for problematic ranges:
```bash
python finam_export.py --code AAPL --em 75022 --period 2 --year 2025 --fallback
```

Dry run (preview URLs without downloading):
```bash
python finam_export.py --code AAPL --em 75022 --period 2 --year 2025 --dry-run
```

### Desktop App Development

Build TypeScript and copy assets:
```bash
cd apps/desktop
npm run build
```

Run the Electron app:
```bash
npm run start
```

Create distributable package:
```bash
npm run dist
```

### Token Setup

From Finam export URL:
```bash
python set_token.py --url "https://export.finam.ru/...token=YOUR_TOKEN"
```

Direct token input:
```bash
python set_token.py --token YOUR_TOKEN
```

## File Organization

```
out/
  {TICKER}/
    p{PERIOD}/
      {YEAR}/
        {TICKER}_{YYMMDD}_{YYMMDD}.txt  # Individual chunks
        {TICKER}_{YEAR}_p{PERIOD}_merged.txt  # Yearly merge (if --merge)
      {TICKER}_p{PERIOD}_merged_all.txt  # All years merged (if --merge-all)
```

## Key Implementation Details

### Finam API Parameters

The `build_query()` function constructs URLs with these critical parameters:
- `em`: Instrument ID (e.g., 75022 for AAPL)
- `p`: Period type (1=ticks, 2=1min, 3=5min, 4=10min, 5=15min, 6=30min, 7=1hour, 8=daily, 9=weekly, 10=monthly)
- `from`/`to`: Date range in DD.MM.YYYY format
- `yf/yt/mf/mt/df/dt`: Decomposed year/month/day components
- `datf`: Date format (1=YYYYMMDD, etc.)
- `dtf`: Date/time format (4=DD.MM.YYYY HH:MM:SS)
- `tmf`: Time format (4=HH:MM:SS)
- `at`: Include header (1) or not (0)
- `token`: API authentication token
- `market`: Market ID (optional, omitted if undefined to avoid API errors)

### Response Validation

Files smaller than 128 bytes are checked for error messages:
- "Invalid request to date"
- "Error"
- Russian error text about unavailable depth

If errors detected and `--fallback` is enabled, the script automatically retries with monthly chunks.

### Date Utilities

- `fmt_date(d)`: Formats date as DD.MM.YYYY for API
- `fmt_file(code, start, end)`: Creates filename like AAPL_250901_251123
- `add_months(d, months)`: Adds months with proper day-of-month handling (leap years, month-end dates)
