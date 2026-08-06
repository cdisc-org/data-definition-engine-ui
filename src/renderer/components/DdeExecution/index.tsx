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
import { openSnackbar, setDefineFileId, setPathname } from '@redux/slices/ui';
import { paths } from '@/misc/constants';

const styles = {
  card: {
    borderRadius: 3,
  },
  logBox: {
    fontFamily: 'Roboto Mono, monospace',
    fontSize: 13,
    lineHeight: 1.5,
    backgroundColor: 'grey.950',
    color: 'grey.100',
    borderRadius: 2,
    p: 2,
    minHeight: 180,
    maxHeight: 320,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
  },
};

const DdeExecution: React.FC = () => {
  const dispatch = useAppDispatch();
  const { apiService } = useContext(AppContext);
  const run = useAppSelector((state) => state.dde.run);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const { startedAt, status: runStatus } = run;

  useEffect(() => {
    if (!startedAt || !['starting', 'running'].includes(runStatus)) {
      setElapsedMs(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);

    return () => window.clearInterval(timer);
  }, [startedAt, runStatus]);

  useEffect(() => {
    const openGeneratedDefine = async () => {
      if (run.status !== 'done' || !run.definePath) {
        return;
      }

      const fileInfo = await apiService.openDefineXml(run.definePath);
      if (fileInfo === null) {
        return;
      }

      dispatch(setDefineFileId(fileInfo.fileId));
      dispatch(setPathname({ pathname: paths.DEFINEXML }));
      dispatch(
        openSnackbar({
          type: 'success',
          message: `Loaded ${fileInfo.filename}`,
        }),
      );
    };

    openGeneratedDefine();
  }, [apiService, dispatch, run]);

  const elapsedLabel = useMemo(() => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedMs]);

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
    <Card sx={styles.card}>
      <CardContent>
        <Stack spacing={2}>
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
          {run.outputPath ? (
            <Alert severity="info">Output: {run.outputPath}</Alert>
          ) : null}
          <Box sx={styles.logBox}>
            {run.lines.length > 0
              ? run.lines.join('\n')
              : 'Waiting for process output...'}
          </Box>
          <Stack direction="row" spacing={1}>
            {['starting', 'running'].includes(run.status) ? (
              <Button variant="contained" color="error" onClick={handleCancel}>
                Cancel
              </Button>
            ) : null}
            {run.status !== 'running' && run.status !== 'starting' ? (
              <Button variant="text" onClick={handleClear}>
                Clear
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DdeExecution;
