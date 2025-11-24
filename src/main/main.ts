import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { runExport, stopExport as stopExportProcess } from './finamExport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root .env file
// In production, store .env in userData directory for user-specific config
const envPath = app.isPackaged
  ? path.join(app.getPath('userData'), '.env')
  : path.join(app.getAppPath(), '.env');
dotenv.config({ path: envPath });

let mainWindow: BrowserWindow | null = null;
const configPath = path.join(app.getPath('userData'), 'config.json');

function createWindow(): void {
  // Use app.getAppPath() for consistent path resolution
  const appPath = app.getAppPath();

  const preloadPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'dist', 'preload.cjs')
    : path.join(appPath, 'dist', 'preload.cjs');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools();
  } else {
    const htmlPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar', 'dist', 'renderer', 'index.html')
      : path.join(appPath, 'dist', 'renderer', 'index.html');

    mainWindow.loadFile(htmlPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

ipcMain.handle('selectFolder', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Выберите папку для сохранения данных',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('search', async (event, query: string) => {
  try {
    // Use Electron's net module which shares cookies with BrowserWindow
    const { net } = await import('electron');
    const url = `https://www.finam.ru/api/search?text=${encodeURIComponent(query)}&onlyAvailabled=true&redirectBlackList=false`;

    const request = net.request({
      method: 'GET',
      url: url,
      redirect: 'follow',
    });

    request.setHeader('accept', '*/*');
    request.setHeader('accept-language', 'en-US,en;q=0.9,ru;q=0.8');
    request.setHeader('referer', 'https://www.finam.ru/quote/batsnq/aapl/export/');
    request.setHeader('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');

    return new Promise((resolve, reject) => {
      let responseData = '';

      request.on('response', (response) => {
        console.error('Search response status:', response.statusCode);

        response.on('data', (chunk) => {
          responseData += chunk.toString();
        });

        response.on('end', () => {
          try {
            if (response.statusCode !== 200) {
              console.error('Response not ok:', response.statusCode, response.statusMessage);
              resolve([]);
              return;
            }

            const result = JSON.parse(responseData);
            console.error('Got JSON response');

            // Check if response has the expected structure
            if (!result || !result.data || !Array.isArray(result.data.items)) {
              console.error('Invalid response structure');
              resolve([]);
              return;
            }

            // Map API response to our format
            const items = result.data.items
              .map((item: any) => ({
                id: item.quoteId || 0,
                code: item.ticker || '',
                name: item.name || item.companyName || '',
                market: 0,
              }))
              .filter((item: any) => item.code)
              .slice(0, 50);

            console.error('Search results count:', items.length);
            resolve(items);
          } catch (error: any) {
            console.error('Parse error:', error.message);
            resolve([]);
          }
        });

        response.on('error', (error: any) => {
          console.error('Response error:', error.message);
          resolve([]);
        });
      });

      request.on('error', (error: any) => {
        console.error('Request error:', error.message);
        resolve([]);
      });

      request.end();
    });
  } catch (error: any) {
    console.error('Search error:', error.message);
    return [];
  }
});

ipcMain.handle('startExport', async (event, config) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Token not found. Please set FINAM_TOKEN in settings.');
    }

    await runExport(config, token, (progress) => {
      if (mainWindow) {
        mainWindow.webContents.send('progress', progress);
      }
    });
  } catch (error: any) {
    console.error('Export error:', error);
    throw error;
  }
});

ipcMain.handle('stopExport', async () => {
  stopExportProcess();
});

ipcMain.handle('save-token', async (event, token: string) => {
  try {
    // Use the same envPath logic as defined at the top
    const tokenEnvPath = app.isPackaged
      ? path.join(app.getPath('userData'), '.env')
      : path.join(app.getAppPath(), '.env');

    let envContent = '';

    if (fs.existsSync(tokenEnvPath)) {
      envContent = fs.readFileSync(tokenEnvPath, 'utf-8');
    }

    const lines = envContent.split('\n');
    let tokenFound = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('FINAM_TOKEN=')) {
        lines[i] = `FINAM_TOKEN=${token}`;
        tokenFound = true;
        break;
      }
    }

    if (!tokenFound) {
      lines.push(`FINAM_TOKEN=${token}`);
    }

    fs.writeFileSync(tokenEnvPath, lines.join('\n'), 'utf-8');

    // Reload environment variables
    process.env.FINAM_TOKEN = token;

    return { success: true };
  } catch (error: any) {
    console.error('Save token error:', error);
    throw error;
  }
});

ipcMain.handle('get-config', async () => {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
    return {};
  } catch (error: any) {
    console.error('Get config error:', error);
    return {};
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Save config error:', error);
    throw error;
  }
});

ipcMain.handle('open-path', async (event, filePath: string) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error: any) {
    console.error('Open path error:', error);
    throw error;
  }
});

// Helper functions

function getToken(): string | null {
  // Try environment variable first
  if (process.env.FINAM_TOKEN) {
    return process.env.FINAM_TOKEN;
  }

  // Fallback to finam_token.txt in userData for backward compatibility
  const tokenPath = path.join(app.getPath('userData'), 'finam_token.txt');
  if (fs.existsSync(tokenPath)) {
    try {
      const token = fs.readFileSync(tokenPath, 'utf-8').trim();
      if (token) {
        return token;
      }
    } catch (error) {
      console.error('Error reading token file:', error);
    }
  }

  return null;
}
