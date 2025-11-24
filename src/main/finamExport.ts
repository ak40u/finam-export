import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportConfig {
  code: string;
  em: string;
  period: number;
  from?: string;
  to?: string;
  year?: number;
  datf?: number;
  dtf?: number;
  tmf?: number;
  msor?: number;
  mstime?: string;
  sep?: number;
  at?: number;
  market?: number;
  fsp?: number;
  cn?: string;
  fileName?: string;
  outputDir?: string;
  merge?: boolean;
  mergeAll?: boolean;
  fallback?: boolean;
  dryRun?: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export type ProgressCallback = (progress: {
  type: 'segments' | 'segment' | 'fileSaved' | 'error' | 'sleep' | 'log' | 'done';
  data?: any;
  message?: string;
  current?: number;
  total?: number;
  fileName?: string;
  error?: string;
  seconds?: number;
}) => void;

let abortController: AbortController | null = null;

export function stopExport(): void {
  if (abortController) {
    abortController.abort();
  }
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatFileDate(date: Date): string {
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatFileName(code: string, start: Date, end: Date): string {
  return `${code}_${formatFileDate(start)}_${formatFileDate(end)}.txt`;
}

function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);

  // Handle day overflow (e.g., Jan 31 + 1 month = Feb 28/29)
  if (newDate.getDate() !== date.getDate()) {
    newDate.setDate(0);
  }

  return newDate;
}

function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function addYears(date: Date, years: number): Date {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
}

function chunkRanges(start: Date, end: Date, period: number): DateRange[] {
  const chunks: DateRange[] = [];
  let current = new Date(start);

  // Different period types have different maximum ranges
  let chunkSize: number;
  let unit: 'day' | 'month' | 'year';

  if (period === 1) {
    // Ticks: max 1 day per request
    chunkSize = 1;
    unit = 'day';
  } else if (period >= 2 && period <= 7) {
    // Intraday: max 3 months per request
    chunkSize = 3;
    unit = 'month';
  } else {
    // Daily and above: max 5 years per request
    chunkSize = 5;
    unit = 'year';
  }

  while (current < end) {
    let chunkEnd: Date;

    if (unit === 'day') {
      chunkEnd = addDays(current, chunkSize);
    } else if (unit === 'month') {
      chunkEnd = addMonths(current, chunkSize);
    } else {
      chunkEnd = addYears(current, chunkSize);
    }

    // Don't exceed the end date
    if (chunkEnd > end) {
      chunkEnd = new Date(end);
    }

    chunks.push({
      start: new Date(current),
      end: new Date(chunkEnd)
    });

    current = chunkEnd;
  }

  return chunks;
}

function buildQuery(
  config: ExportConfig,
  start: Date,
  end: Date,
  token: string,
  includeHeader: boolean = true
): string {
  const params = new URLSearchParams();

  params.append('apply', '0');
  params.append('p', String(config.period));
  params.append('e', 'txt');
  params.append('dtf', String(config.dtf ?? 4));
  params.append('tmf', String(config.tmf ?? 4));
  params.append('MSOR', String(config.msor ?? 0));
  params.append('mstimever', 'on');
  params.append('sep', String(config.sep ?? 1));
  params.append('sep2', '1');
  params.append('datf', String(config.datf ?? 1));
  params.append('at', includeHeader ? '1' : '0');
  params.append('from', formatDate(start));
  params.append('to', formatDate(end));
  params.append('em', config.em);
  params.append('code', config.code);
  params.append('f', config.fileName || `${config.code}_${formatFileDate(start)}_${formatFileDate(end)}`);
  params.append('cn', config.cn || config.code);

  // Only add market if it's defined and not zero
  if (config.market !== undefined && config.market !== 0) {
    params.append('market', String(config.market));
  } else {
    params.append('market', 'undefined');
  }

  params.append('yf', String(start.getFullYear()));
  params.append('yt', String(end.getFullYear()));
  params.append('df', String(start.getDate()));
  params.append('dt', String(end.getDate()));
  params.append('mf', String(start.getMonth()));
  params.append('mt', String(end.getMonth()));
  params.append('token', token);

  return `https://export.finam.ru/export9.out?${params.toString()}`;
}

async function downloadWithRetry(
  url: string,
  maxRetries: number = 5,
  initialDelay: number = 2000,
  onSleep?: (seconds: number) => void
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (abortController?.signal.aborted) {
        throw new Error('Export cancelled');
      }

      const response = await axios.get(url, {
        signal: abortController?.signal,
        timeout: 60000,
      });

      return response.data;
    } catch (error: any) {
      lastError = error;

      if (error.name === 'AbortError' || error.message === 'Export cancelled') {
        throw error;
      }

      if (error.response?.status === 429 || (error.response?.status >= 500 && error.response?.status < 600)) {
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          const seconds = Math.round(delay / 1000);

          if (onSleep) {
            onSleep(seconds);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError || new Error('Download failed after retries');
}

function validateFileContent(content: string, filePath: string): boolean {
  if (content.length < 256) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    if (lines.length <= 1) {
      const lowerContent = content.toLowerCase();

      if (
        lowerContent.includes('invalid request to date') ||
        lowerContent.includes('error') ||
        lowerContent.includes('недоступна')
      ) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return false;
      }
    }
  }

  return true;
}

export async function runExport(
  config: ExportConfig,
  token: string,
  onProgress: ProgressCallback
): Promise<void> {
  abortController = new AbortController();

  try {
    const outputDir = path.resolve(config.outputDir || process.cwd(), 'out');

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    if (config.from && config.to) {
      const [fromDay, fromMonth, fromYear] = config.from.split('.').map(Number);
      const [toDay, toMonth, toYear] = config.to.split('.').map(Number);
      startDate = new Date(fromYear, fromMonth - 1, fromDay);
      endDate = new Date(toYear, toMonth - 1, toDay);
    } else if (config.year) {
      startDate = new Date(config.year, 0, 1);
      endDate = new Date(config.year, 11, 31);
    } else {
      throw new Error('Either from/to dates or year must be specified');
    }

    // Chunk the date range
    const chunks = chunkRanges(startDate, endDate, config.period);

    onProgress({
      type: 'segments',
      total: chunks.length,
      message: `Разбито на ${chunks.length} сегмент(ов)`
    });

    // Create output directory structure
    const tickerDir = path.resolve(outputDir, config.code);
    const periodDir = path.resolve(tickerDir, `p${config.period}`);
    const yearDir = config.year ? path.resolve(periodDir, String(config.year)) : periodDir;

    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true });
    }

    const downloadedFiles: string[] = [];

    // Download each chunk
    for (let i = 0; i < chunks.length; i++) {
      if (abortController.signal.aborted) {
        throw new Error('Export cancelled');
      }

      const chunk = chunks[i];
      const fileName = formatFileName(config.code, chunk.start, chunk.end);
      const filePath = path.resolve(yearDir, fileName);

      onProgress({
        type: 'segment',
        current: i + 1,
        total: chunks.length,
        message: `Загрузка ${fileName}...`
      });

      // Add delay between segments (except for first segment)
      if (i > 0 && !config.dryRun) {
        const delay = 1000; // 1 second delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (!config.dryRun) {
        const url = buildQuery(config, chunk.start, chunk.end, token, i === 0);

        try {
          const content = await downloadWithRetry(url, 5, 2000, (seconds) => {
            onProgress({
              type: 'sleep',
              seconds,
              message: `Ожидание ${seconds}с перед повтором...`
            });
          });

          if (validateFileContent(content, filePath)) {
            fs.writeFileSync(filePath, content, 'utf-8');
            downloadedFiles.push(filePath);

            onProgress({
              type: 'fileSaved',
              fileName: filePath,
              message: `Сохранён: ${fileName}`
            });
          } else {
            onProgress({
              type: 'error',
              error: `Файл ${fileName} содержит ошибку и был удалён`
            });
          }
        } catch (error: any) {
          if (error.name === 'AbortError' || error.message === 'Export cancelled') {
            throw error;
          }

          onProgress({
            type: 'error',
            error: `Ошибка загрузки ${fileName}: ${error.message}`
          });
        }
      } else {
        const url = buildQuery(config, chunk.start, chunk.end, token, i === 0);
        onProgress({
          type: 'log',
          message: `[DRY RUN] ${url}`
        });
      }
    }

    // Merge files if requested
    if (config.merge && downloadedFiles.length > 1) {
      const mergedFileName = config.year
        ? `${config.code}_${config.year}_p${config.period}_merged.txt`
        : `${config.code}_p${config.period}_merged.txt`;
      const mergedFilePath = path.resolve(yearDir, mergedFileName);

      onProgress({
        type: 'log',
        message: 'Объединение файлов...'
      });

      const mergedContent: string[] = [];

      for (let i = 0; i < downloadedFiles.length; i++) {
        const content = fs.readFileSync(downloadedFiles[i], 'utf-8');
        const lines = content.split('\n');

        if (i === 0) {
          mergedContent.push(...lines);
        } else {
          // Skip header for subsequent files
          mergedContent.push(...lines.slice(1));
        }
      }

      fs.writeFileSync(mergedFilePath, mergedContent.join('\n'), 'utf-8');

      onProgress({
        type: 'fileSaved',
        fileName: mergedFilePath,
        message: `Объединённый файл: ${mergedFileName}`
      });
    }

    onProgress({
      type: 'done',
      message: 'Экспорт завершён'
    });
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'Export cancelled') {
      onProgress({
        type: 'error',
        error: 'Экспорт отменён'
      });
    } else {
      onProgress({
        type: 'error',
        error: error.message || 'Неизвестная ошибка'
      });
    }
    throw error;
  } finally {
    abortController = null;
  }
}
