import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  TextField,
  Alert,
} from '@mui/material';

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (outputDir: string) => void;
}

const steps = ['Приветствие', 'Настройка токена', 'Выбор папки'];

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  open,
  onClose,
  onComplete,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [token, setToken] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (activeStep === 1) {
      // Save token
      if (!token.trim()) {
        setError('Токен не может быть пустым');
        return;
      }

      try {
        await window.api.saveToken(token.trim());
        setError('');
        setActiveStep(activeStep + 1);
      } catch (err: any) {
        setError(err.message || 'Ошибка сохранения токена');
      }
    } else if (activeStep === 2) {
      // Complete onboarding
      onComplete(outputDir);
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSelectFolder = async () => {
    const folder = await window.api.selectFolder();
    if (folder) {
      setOutputDir(folder);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Добро пожаловать в Finam Export Tool!
            </Typography>
            <Typography variant="body1" paragraph>
              Это приложение поможет вам экспортировать исторические данные с биржи через API
              Finam.
            </Typography>
            <Typography variant="body1" paragraph>
              Для работы потребуется:
            </Typography>
            <Typography variant="body2" component="div">
              <ul>
                <li>Токен API из личного кабинета Finam</li>
                <li>Папка для сохранения данных</li>
              </ul>
            </Typography>
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              Давайте настроим всё за несколько простых шагов.
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Настройка токена API
            </Typography>
            <Typography variant="body2" paragraph>
              Для получения токена:
            </Typography>
            <Typography variant="body2" component="div">
              <ol>
                <li>Откройте https://www.finam.ru/profile/itrade-export/</li>
                <li>Авторизуйтесь в личном кабинете</li>
                <li>Попробуйте скачать любой файл</li>
                <li>Скопируйте токен из адресной строки (параметр token=...)</li>
              </ol>
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              type="password"
              label="Токен API"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Вставьте токен сюда"
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Выбор папки для сохранения
            </Typography>
            <Typography variant="body1" paragraph>
              Выберите папку, куда будут сохраняться загруженные файлы. Если не выберете, файлы
              будут сохраняться в папку ./out относительно текущей директории.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Папка"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                placeholder="Не выбрана (будет использоваться ./out)"
              />
              <Button variant="outlined" onClick={handleSelectFolder}>
                Обзор
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              Вы всегда можете изменить эти настройки позже в разделе &quot;Настройки&quot;.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Первоначальная настройка</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 2, pb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 300 }}>{renderStepContent(activeStep)}</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Пропустить</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Назад
        </Button>
        <Button variant="contained" onClick={handleNext}>
          {activeStep === steps.length - 1 ? 'Завершить' : 'Далее'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingDialog;
