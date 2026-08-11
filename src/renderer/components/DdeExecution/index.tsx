import React, { useContext, useEffect, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import AppContext from '@utils/AppContext';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { clearDdeRun } from '@redux/slices/dde';

const styles = {
  card: {
    borderRadius: 3,
  },
  logBox: (fullHeight: boolean) => ({
    fontFamily: 'Roboto Mono, monospace',
    fontSize: 13,
    lineHeight: 1.5,
    backgroundColor: 'grey.950',
    color: 'grey.700',
    borderRadius: 2,
    p: 2,
    minHeight: 180,
    maxHeight: fullHeight ? '100%' : 320,
    height: fullHeight ? '100%' : 'auto',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    flex: fullHeight ? 1 : 'auto',
  }),
};

interface DdeExecutionProps {
  hideActions?: boolean;
  fullHeight?: boolean;
}

const DdeExecution: React.FC<DdeExecutionProps> = ({
  hideActions = false,
  fullHeight = false,
}) => {
  const dispatch = useAppDispatch();
  const { apiService } = useContext(AppContext);
  const run = useAppSelector((state) => state.dde.run);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const { startedAt, status: runStatus } = run;

  useEffect(() => {
    if (!startedAt || !['starting', 'running'].includes(runStatus)) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);

    return () => window.clearInterval(timer);
  }, [startedAt, runStatus]);

  const elapsedLabel = useMemo(() => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedMs]);

  const logContent =
    run.lines.length > 0
      ? run.lines.join('\n')
      : ['starting', 'running'].includes(run.status)
        ? 'Waiting for process output...'
        : `Execution finished with status ${run.status}`;

  if (run.status === 'idle') {
    return null;
  }

  const handleCancel = async () => {
    if (run.id) {
      await apiService.stopDdeStep(run.id);
    }
  };

  const handleClear = () => {
    dispatch(clearDdeRun());
  };

  return (
    <Card sx={{ ...styles.card, height: fullHeight ? '100%' : 'auto' }}>
      <CardContent sx={{ height: fullHeight ? '100%' : 'auto' }}>
        <Stack spacing={2} sx={{ height: fullHeight ? '100%' : 'auto' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h6">Execution</Typography>
            <Chip
              size="small"
              label={run.status}
              color={run.status === 'error' ? 'error' : 'primary'}
            />
            <Chip size="small" variant="outlined" label={elapsedLabel} />
          </Stack>
          {run.error ? <Alert severity="error">{run.error}</Alert> : null}
          <Box sx={styles.logBox(fullHeight)}>{logContent}</Box>
          {!hideActions ? (
            <Stack direction="row" spacing={1}>
              {['starting', 'running'].includes(run.status) ? (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              ) : null}
              {run.status !== 'running' && run.status !== 'starting' ? (
                <Button variant="text" onClick={handleClear}>
                  Clear
                </Button>
              ) : null}
            </Stack>
          ) : null}
          {run.outputPath ? (
            <Alert severity="info">Output: {run.outputPath}</Alert>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DdeExecution;
