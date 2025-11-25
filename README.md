# Finam Export Tool

Desktop application for downloading historical market data from [Finam](https://www.finam.ru/) export service.

![Electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- Search and select financial instruments via Finam API
- Export historical data in various timeframes (ticks, 1min, 5min, 15min, hourly, daily, weekly, monthly)
- Flexible date range selection with automatic chunking for API limits
- Progress tracking with rate limiting between requests
- Configurable output directory and export settings
- Russian localization

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Component library
- **Vite** - Build tool

## Getting Started

### Prerequisites

- Node.js 18+
- Finam account with API access

### Installation

```bash
git clone https://github.com/ak40u/finam-export.git
cd finam-export
npm install
```

### Configuration

1. Copy `.env.example` to `.env`
2. Add your Finam API token: `FINAM_TOKEN=your_token_here`
3. Or configure via Settings in the app

### Development

```bash
npm run dev
```

### Build

```bash
npm run build      # Build for development
npm run dist       # Create Windows installers
```

## Project Structure

```
src/
├── main/              # Electron main process
│   ├── main.ts        # App entry, IPC handlers
│   ├── finamExport.ts # Export logic, API integration
│   └── preload.cjs    # Secure bridge to renderer
└── renderer/          # React UI
    ├── App.tsx        # Main component
    └── components/    # UI components
```

## Disclaimer

**This software is provided "as is", without warranty of any kind.**

- This is an unofficial tool and is not affiliated with, endorsed by, or connected to Finam in any way
- Use at your own risk. The author is not responsible for any damages, data loss, or account restrictions resulting from the use of this software
- This tool is intended for personal use only. Please respect Finam's terms of service and API usage limits
- Market data obtained through this tool should not be redistributed without proper authorization
- The author makes no guarantees about the accuracy or completeness of exported data

**By using this software, you acknowledge that you have read and understood this disclaimer.**

## License

MIT License - see [LICENSE](LICENSE) for details.
