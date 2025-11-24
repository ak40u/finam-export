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

export interface TickerInfo {
  id: number;
  code: string;
  name: string;
  market?: number;
  decp?: number;
  emitent_id?: number;
  emitent_title?: string;
}

export interface ExportProgress {
  type: 'segments' | 'segment' | 'fileSaved' | 'error' | 'sleep' | 'log' | 'done';
  data?: any;
  message?: string;
  current?: number;
  total?: number;
  fileName?: string;
  error?: string;
  seconds?: number;
}

export interface AppConfig {
  outputDir?: string;
  lastCode?: string;
  lastEm?: string;
  lastPeriod?: number;
  lastYear?: number;
}

export const PERIOD_OPTIONS = [
  { value: 1, label: 'Тики' },
  { value: 2, label: '1 минута' },
  { value: 3, label: '5 минут' },
  { value: 4, label: '10 минут' },
  { value: 5, label: '15 минут' },
  { value: 6, label: '30 минут' },
  { value: 7, label: '1 час' },
  { value: 8, label: 'День' },
  { value: 9, label: 'Неделя' },
  { value: 10, label: 'Месяц' },
];

export const DATE_FORMAT_OPTIONS = [
  { value: 1, label: 'YYYYMMDD' },
  { value: 2, label: 'YYMMDD' },
  { value: 3, label: 'DDMMYY' },
  { value: 4, label: 'DD/MM/YY' },
  { value: 5, label: 'MM/DD/YY' },
];

export const TIME_FORMAT_OPTIONS = [
  { value: 1, label: 'HHMMSS' },
  { value: 2, label: 'HHMM' },
  { value: 3, label: 'HH:MM:SS' },
  { value: 4, label: 'HH:MM' },
];

export const DATETIME_FORMAT_OPTIONS = [
  { value: 1, label: 'YYYYMMDD HHMMSS' },
  { value: 2, label: 'YYYYMMDD HHMM' },
  { value: 3, label: 'DD.MM.YY HH:MM:SS' },
  { value: 4, label: 'DD.MM.YYYY HH:MM:SS' },
  { value: 5, label: 'DD/MM/YY HH:MM:SS' },
];

export const SEPARATOR_OPTIONS = [
  { value: 1, label: 'Запятая (,)' },
  { value: 2, label: 'Точка (.)' },
  { value: 3, label: 'Точка с запятой (;)' },
  { value: 4, label: 'Табуляция' },
  { value: 5, label: 'Пробел' },
];
