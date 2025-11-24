# Finam Export Tool

Desktop application for exporting historical market data from Finam.

## Features

- 🔍 Search and select financial instruments
- 📊 Export historical data in various timeframes (ticks, minutes, hours, daily)
- 📅 Flexible date range selection
- ⚙️ Customizable export formats
- 🚀 Automatic chunking for large datasets
- 💾 Multiple file format options

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Material-UI** - Modern component library
- **Vite** - Fast build tool

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure your Finam API token:
   - Copy `.env.example` to `.env`
   - Add your token: `FINAM_TOKEN=your_token_here`
   - Or configure via Settings in the app

### Run in Development

```bash
npm run dev
```

This starts:
- Vite dev server on http://localhost:3000
- Electron app with hot reload

### Build

```bash
npm run build
```

## Distribution

### Create Installers

Build production-ready installers for Windows:

```bash
npm run dist
```

This creates in `release/` directory:
- **FinamExport-Setup-1.0.0.exe** - Full installer with NSIS
- **FinamExport-Portable-1.0.0.exe** - Portable version (no installation needed)

### What Users Get

**Installer Version:**
- Standard Windows installation
- Desktop shortcut
- Start Menu entry
- Add/Remove Programs integration
- Easy uninstall

**Portable Version:**
- Single .exe file
- No installation required
- Run from USB drive
- Perfect for restricted environments

## Distribution Best Practices

1. **GitHub Releases**
   - Upload installers as release assets
   - Include changelog
   - Users download from Releases page

2. **Auto-Updates** (optional)
   - Configure `publish` section in package.json
   - Users get automatic updates

3. **Code Signing** (recommended for production)
   - Prevents Windows SmartScreen warnings
   - Requires code signing certificate

## Project Structure

```
finam-export/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts
│   │   ├── finamExport.ts
│   │   └── preload.cjs
│   └── renderer/       # React UI
│       ├── App.tsx
│       └── components/
├── dist/               # Build output
├── release/            # Production installers
├── .env.example        # Environment template
└── package.json
```

## License

MIT
