import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material';
import { OpenInNew as OpenInNewIcon, Folder as FolderIcon } from '@mui/icons-material';

interface ExportHistoryProps {
  files: string[];
}

const ExportHistory: React.FC<ExportHistoryProps> = ({ files }) => {
  const handleOpenFile = async (filePath: string) => {
    try {
      await window.api.openPath(filePath);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleOpenFolder = async (filePath: string) => {
    try {
      const dirPath = getFileDir(filePath);
      await window.api.openPath(dirPath);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const getFileName = (filePath: string) => {
    // Extract filename from path (works for both Windows and Unix paths)
    const parts = filePath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1];
  };

  const getFileDir = (filePath: string) => {
    // Extract directory from path (works for both Windows and Unix paths)
    const normalized = filePath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    return parts.slice(0, -1).join('/');
  };

  if (files.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          История загрузок
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Нет загруженных файлов
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        История загрузок
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Загружено файлов: {files.length}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <List sx={{ maxHeight: 600, overflow: 'auto' }}>
        {files.map((file, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={getFileName(file)}
              secondary={getFileDir(file)}
              primaryTypographyProps={{ variant: 'body1' }}
              secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleOpenFolder(file)}
                sx={{ mr: 1 }}
                title="Открыть папку"
              >
                <FolderIcon />
              </IconButton>
              <IconButton
                edge="end"
                onClick={() => handleOpenFile(file)}
                title="Открыть файл"
              >
                <OpenInNewIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ExportHistory;
