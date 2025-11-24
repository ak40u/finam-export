import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import TickerSearch from './TickerSearch';
import { ExportConfig, AppConfig, PERIOD_OPTIONS, DATE_FORMAT_OPTIONS, TIME_FORMAT_OPTIONS, DATETIME_FORMAT_OPTIONS, SEPARATOR_OPTIONS } from '../types';

interface ExportFormProps {
  config: AppConfig;
  onStartExport: (config: ExportConfig) => void;
  onStopExport: () => void;
  isExporting: boolean;
}

const ExportForm: React.FC<ExportFormProps> = ({
  config,
  onStartExport,
  onStopExport,
  isExporting,
}) => {
  const [code, setCode] = useState(config.lastCode || '');
  const [em, setEm] = useState(config.lastEm || '');
  const [period, setPeriod] = useState(config.lastPeriod || 8);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [year, setYear] = useState(config.lastYear || new Date().getFullYear());
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [outputDir, setOutputDir] = useState(config.outputDir || '');

  // Advanced options
  const [datf, setDatf] = useState(1);
  const [dtf, setDtf] = useState(4);
  const [tmf, setTmf] = useState(4);
  const [sep, setSep] = useState(1);
  const [merge, setMerge] = useState(false);
  const [mergeAll, setMergeAll] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  const handleSelectFolder = async () => {
    const folder = await window.api.selectFolder();
    if (folder) {
      setOutputDir(folder);
    }
  };

  const handleTickerSelect = (ticker: any) => {
    setCode(ticker.code);
    setEm(String(ticker.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !em) {
      return;
    }

    const exportConfig: ExportConfig = {
      code,
      em,
      period,
      datf,
      dtf,
      tmf,
      sep,
      outputDir: outputDir || undefined,
      merge,
      mergeAll,
      fallback,
      dryRun,
    };

    if (useCustomRange && fromDate && toDate) {
      const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      };

      exportConfig.from = formatDate(fromDate);
      exportConfig.to = formatDate(toDate);
    } else {
      exportConfig.year = year;
    }

    onStartExport(exportConfig);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Экспорт данных
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TickerSearch onSelect={handleTickerSelect} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Код тикера"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID инструмента (em)"
              value={em}
              onChange={(e) => setEm(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Период"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
            >
              {PERIOD_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useCustomRange}
                  onChange={(e) => setUseCustomRange(e.target.checked)}
                />
              }
              label="Свой диапазон дат"
            />
          </Grid>

          {useCustomRange ? (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Дата начала"
                  value={fromDate}
                  onChange={(newValue) => setFromDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Дата окончания"
                  value={toDate}
                  onChange={(newValue) => setToDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
            </LocalizationProvider>
          ) : (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Год"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                inputProps={{ min: 1990, max: new Date().getFullYear() + 1 }}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                label="Папка для сохранения"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                placeholder="Выберите папку или оставьте пустым для ./out"
              />
              <Button variant="outlined" onClick={handleSelectFolder}>
                Обзор
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Дополнительные настройки</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Формат даты"
                      value={datf}
                      onChange={(e) => setDatf(Number(e.target.value))}
                    >
                      {DATE_FORMAT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Формат даты и времени"
                      value={dtf}
                      onChange={(e) => setDtf(Number(e.target.value))}
                    >
                      {DATETIME_FORMAT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Формат времени"
                      value={tmf}
                      onChange={(e) => setTmf(Number(e.target.value))}
                    >
                      {TIME_FORMAT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Разделитель"
                      value={sep}
                      onChange={(e) => setSep(Number(e.target.value))}
                    >
                      {SEPARATOR_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={merge}
                          onChange={(e) => setMerge(e.target.checked)}
                        />
                      }
                      label="Объединить файлы"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mergeAll}
                          onChange={(e) => setMergeAll(e.target.checked)}
                        />
                      }
                      label="Объединить все годы"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={fallback}
                          onChange={(e) => setFallback(e.target.checked)}
                        />
                      }
                      label="Резервное разбиение"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={dryRun}
                          onChange={(e) => setDryRun(e.target.checked)}
                        />
                      }
                      label="Пробный запуск"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isExporting ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={!code || !em}
                >
                  Начать экспорт
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  onClick={onStopExport}
                >
                  Остановить экспорт
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ExportForm;
