import React from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { ExportProgress as ExportProgressType } from '../types';

interface ExportProgressProps {
  progress: ExportProgressType[];
  isExporting: boolean;
}

const ExportProgress: React.FC<ExportProgressProps> = ({ progress, isExporting }) => {
  const getSegmentProgress = () => {
    const segmentsInfo = progress.find((p) => p.type === 'segments');
    const lastSegment = [...progress].reverse().find((p) => p.type === 'segment');

    if (!segmentsInfo || !lastSegment) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const current = lastSegment.current || 0;
    const total = segmentsInfo.total || 0;
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return { current, total, percentage };
  };

  const { current, total, percentage } = getSegmentProgress();

  const getIcon = (type: string) => {
    switch (type) {
      case 'fileSaved':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'sleep':
        return <HourglassEmptyIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Прогресс экспорта
      </Typography>

      {isExporting && total > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Сегмент {current} из {total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {percentage.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={percentage} />
        </Box>
      )}

      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {progress.map((item, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
              {getIcon(item.type)}
              <ListItemText
                primary={item.message || item.error}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: item.type === 'error' ? 'error' : 'textPrimary',
                }}
              />
            </Box>
          </ListItem>
        ))}
      </List>

      {!isExporting && progress.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {progress.some((p) => p.type === 'done')
              ? 'Экспорт завершён'
              : 'Экспорт остановлен'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ExportProgress;
