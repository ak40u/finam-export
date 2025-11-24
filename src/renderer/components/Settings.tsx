import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { AppConfig } from '../types';

interface SettingsProps {
  config: AppConfig;
  onSaveConfig: (config: AppConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSaveConfig }) => {
  const [token, setToken] = useState('');
  const [outputDir, setOutputDir] = useState(config.outputDir || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSelectFolder = async () => {
    const folder = await window.api.selectFolder();
    if (folder) {
      setOutputDir(folder);
    }
  };

  const handleSaveToken = async () => {
    try {
      if (!token.trim()) {
        setSaveError('Токен не может быть пустым');
        return;
      }

      await window.api.saveToken(token.trim());
      setSaveSuccess(true);
      setSaveError('');
      setToken('');

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error: any) {
      setSaveError(error.message || 'Ошибка сохранения токена');
      setSaveSuccess(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await onSaveConfig({ ...config, outputDir });
      setSaveSuccess(true);
      setSaveError('');

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error: any) {
      setSaveError(error.message || 'Ошибка сохранения настроек');
      setSaveSuccess(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Настройки
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Настройки успешно сохранены
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Токен Finam API
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Для работы приложения необходим токен из личного кабинета Finam. Токен сохраняется в
          файле .env в корне проекта.
        </Typography>

        <TextField
          fullWidth
          type="password"
          label="Токен"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Введите токен из URL экспорта Finam"
          sx={{ mb: 2 }}
        />

        <Button variant="contained" onClick={handleSaveToken}>
          Сохранить токен
        </Button>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Папка для сохранения
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          По умолчанию файлы сохраняются в папку ./out относительно текущей директории. Вы можете
          выбрать другую папку.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Папка"
            value={outputDir}
            onChange={(e) => setOutputDir(e.target.value)}
            placeholder="Выберите папку или оставьте пустым для ./out"
          />
          <Button variant="outlined" onClick={handleSelectFolder}>
            Обзор
          </Button>
        </Box>

        <Button variant="contained" onClick={handleSaveSettings}>
          Сохранить настройки
        </Button>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Справка
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Как получить токен:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          <ol>
            <li>Откройте страницу экспорта Finam: https://www.finam.ru/profile/itrade-export/</li>
            <li>Авторизуйтесь в личном кабинете</li>
            <li>Попробуйте скачать любой файл</li>
            <li>Скопируйте токен из адресной строки (параметр token=...)</li>
            <li>Вставьте токен в поле выше и сохраните</li>
          </ol>
        </Typography>
      </Box>
    </Paper>
  );
};

export default Settings;
