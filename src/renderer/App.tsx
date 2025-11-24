import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import ExportForm from './components/ExportForm';
import ExportProgress from './components/ExportProgress';
import ExportHistory from './components/ExportHistory';
import Settings from './components/Settings';
import OnboardingDialog from './components/OnboardingDialog';
import { ExportConfig, ExportProgress as ExportProgressType, AppConfig } from './types';

declare global {
  interface Window {
    api: {
      search: (query: string) => Promise<any[]>;
      startExport: (config: ExportConfig) => Promise<void>;
      stopExport: () => Promise<void>;
      saveToken: (token: string) => Promise<{ success: boolean }>;
      selectFolder: () => Promise<string | null>;
      openPath: (filePath: string) => Promise<{ success: boolean }>;
      getConfig: () => Promise<AppConfig>;
      saveConfig: (config: AppConfig) => Promise<{ success: boolean }>;
      onProgress: (callback: (progress: ExportProgressType) => void) => void;
    };
  }
}

type ViewType = 'export' | 'history' | 'settings' | 'help';

const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('export');
  const [config, setConfig] = useState<AppConfig>({});
  const [progress, setProgress] = useState<ExportProgressType[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadConfig();
    setupProgressListener();
    checkFirstRun();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await window.api.getConfig();
      setConfig(savedConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const saveConfig = async (newConfig: AppConfig) => {
    try {
      await window.api.saveConfig(newConfig);
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const setupProgressListener = () => {
    window.api.onProgress((progressData: ExportProgressType) => {
      handleProgressUpdate(progressData);
    });
  };

  const handleProgressUpdate = (progressData: ExportProgressType) => {
    setProgress((prev) => [...prev, progressData]);

    if (progressData.type === 'fileSaved' && progressData.fileName) {
      setDownloadedFiles((prev) => [...prev, progressData.fileName!]);
    }

    if (progressData.type === 'done' || progressData.type === 'error') {
      setIsExporting(false);

      // Check if we have downloaded files using functional update to avoid stale closure
      setDownloadedFiles((currentFiles) => {
        if (progressData.type === 'done' && currentFiles.length === 0) {
          setProgress((prev) => [
            ...prev,
            {
              type: 'error',
              error: 'Не удалось загрузить ни одного файла. Проверьте параметры и токен.',
            },
          ]);
        }
        return currentFiles;
      });
    }
  };

  const checkFirstRun = async () => {
    const savedConfig = await window.api.getConfig();
    if (!savedConfig.outputDir) {
      setShowOnboarding(true);
    }
  };

  const handleStartExport = async (exportConfig: ExportConfig) => {
    setProgress([]);
    setDownloadedFiles([]);
    setIsExporting(true);

    try {
      await window.api.startExport(exportConfig);
    } catch (error: any) {
      setIsExporting(false);
      setProgress((prev) => [
        ...prev,
        {
          type: 'error',
          error: error.message || 'Неизвестная ошибка',
        },
      ]);
    }
  };

  const handleStopExport = async () => {
    try {
      await window.api.stopExport();
      setIsExporting(false);
      setProgress((prev) => [
        ...prev,
        {
          type: 'error',
          error: 'Экспорт отменён пользователем',
        },
      ]);
    } catch (error: any) {
      console.error('Failed to stop export:', error);
    }
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setDrawerOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'export':
        return (
          <Box>
            <ExportForm
              config={config}
              onStartExport={handleStartExport}
              onStopExport={handleStopExport}
              isExporting={isExporting}
            />
            {(progress.length > 0 || isExporting) && (
              <ExportProgress progress={progress} isExporting={isExporting} />
            )}
          </Box>
        );
      case 'history':
        return <ExportHistory files={downloadedFiles} />;
      case 'settings':
        return <Settings config={config} onSaveConfig={saveConfig} />;
      case 'help':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Помощь
            </Typography>
            <Typography variant="body1" paragraph>
              Для работы приложения необходим токен Finam API.
            </Typography>
            <Typography variant="body1" paragraph>
              1. Откройте страницу экспорта: https://www.finam.ru/profile/itrade-export/
            </Typography>
            <Typography variant="body1" paragraph>
              2. Скопируйте токен из URL (параметр token=...)
            </Typography>
            <Typography variant="body1" paragraph>
              3. Вставьте токен в настройках приложения
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Finam Export Tool
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem button onClick={() => handleViewChange('export')}>
              <ListItemIcon>
                <DownloadIcon />
              </ListItemIcon>
              <ListItemText primary="Экспорт" />
            </ListItem>
            <ListItem button onClick={() => handleViewChange('history')}>
              <ListItemIcon>
                <HistoryIcon />
              </ListItemIcon>
              <ListItemText primary="История" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => handleViewChange('settings')}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Настройки" />
            </ListItem>
            <ListItem button onClick={() => handleViewChange('help')}>
              <ListItemIcon>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText primary="Помощь" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Container maxWidth="lg" sx={{ flexGrow: 1, mt: 3, mb: 3, overflow: 'auto' }}>
        {renderContent()}
      </Container>

      <OnboardingDialog
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={async (outputDir: string) => {
          await saveConfig({ ...config, outputDir });
          setShowOnboarding(false);
        }}
      />
    </Box>
  );
};

export default App;
