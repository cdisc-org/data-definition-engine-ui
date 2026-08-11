import React, { useContext } from 'react';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FolderOpen, InsertDriveFile } from '@mui/icons-material';
import AppContext from '@utils/AppContext';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import {
  clearDdeRun,
  failDdeRun,
  setStep3Config,
  startDdeRun,
} from '@redux/slices/dde';
import { openSnackbar, setDefineFileId, setPathname } from '@redux/slices/ui';
import DdeExecution from '@components/DdeExecution';
import { paths } from '@/misc/constants';

const styles = {
  page: {
    p: 3,
  },
};

const DdeStep3: React.FC = () => {
  const dispatch = useAppDispatch();
  const { apiService } = useContext(AppContext);
  const config = useAppSelector((state) => state.dde.step3);
  const run = useAppSelector((state) => state.dde.run);
  const settings = useAppSelector((state) => state.settings.other);
  const pythonCommand = useAppSelector(
    (state) => state.settings.other.pythonCommand,
  );

  const updateConfig = (next: Partial<typeof config>) => {
    dispatch(setStep3Config(next));
  };

  const showExecutionView = run.status !== 'idle';

  const handleShowResult = async () => {
    if (!config.defineXmlPath) {
      return;
    }

    const fileInfo = await apiService.openDefineXml(config.defineXmlPath);
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

  const handleCancel = () => {
    dispatch(clearDdeRun());
  };

  const pickTemplate = async () => {
    const result = await apiService.openFileDialog({
      filters: [{ name: 'DDS JSON', extensions: ['json'] }],
    });
    if (!result || result.length === 0) {
      return;
    }

    updateConfig({ templatePath: result[0].fullPath });
  };

  const pickOutputFolder = async () => {
    const result = await apiService.openDirectoryDialog(
      config.defineXmlOutputPath || null,
    );
    if (!result) {
      return;
    }

    updateConfig({ defineXmlOutputPath: `${result}/define.xml` });
  };

  const runStep = async () => {
    if (!config.templatePath) {
      dispatch(
        openSnackbar({
          type: 'error',
          message: 'A DDS JSON template is required.',
        }),
      );
      return;
    }

    const id = `step3-${Date.now()}`;
    const args = ['-t', config.templatePath, '-l', config.logLevel];

    if (config.defineXmlOutputPath) {
      args.push('-d', config.defineXmlOutputPath);
    }
    if (config.validate) {
      args.push('-v');
    }
    if (config.submission) {
      args.push('-s');
    }
    if (config.xpt) {
      args.push('-x');
    }

    dispatch(startDdeRun({ id, step: 'step3' }));
    const result = await apiService.runDdeStep({
      id,
      step: 'step3',
      args,
      env: {
        DDE_PYTHON_EXE: pythonCommand || undefined,
      },
      runtimePaths: {
        ddeScriptsPath: settings.ddeScriptsPath || undefined,
        pythonVenvPath: settings.pythonVenvPath || undefined,
      },
    });

    if ('error' in result) {
      dispatch(failDdeRun({ id, step: 'step3', error: result.error }));
    }
  };

  return (
    <Stack spacing={3} sx={styles.page}>
      <div>
        <Typography variant="h4">Step 3</Typography>
        <Typography color="text.secondary">
          Generate Define-XML from the DDS JSON template.
        </Typography>
      </div>

      {!showExecutionView ? (
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="DDS JSON Template"
                  value={config.templatePath}
                  onChange={(event) =>
                    updateConfig({ templatePath: event.target.value })
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            aria-label="Choose template file"
                            onClick={pickTemplate}
                          >
                            <InsertDriveFile />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Define-XML Output"
                  value={config.defineXmlOutputPath}
                  onChange={(event) =>
                    updateConfig({
                      defineXmlOutputPath: event.target.value,
                    })
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            aria-label="Choose output folder"
                            onClick={pickOutputFolder}
                          >
                            <FolderOpen />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Log Level"
                  value={config.logLevel}
                  onChange={(event) =>
                    updateConfig({
                      logLevel: event.target.value as typeof config.logLevel,
                    })
                  }
                >
                  <MenuItem value="DEBUG">DEBUG</MenuItem>
                  <MenuItem value="INFO">INFO</MenuItem>
                  <MenuItem value="WARNING">WARNING</MenuItem>
                  <MenuItem value="ERROR">ERROR</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.validate}
                        onChange={(event) =>
                          updateConfig({ validate: event.target.checked })
                        }
                      />
                    }
                    label="Validate"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.submission}
                        onChange={(event) =>
                          updateConfig({ submission: event.target.checked })
                        }
                      />
                    }
                    label="Submission"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.xpt}
                        onChange={(event) =>
                          updateConfig({ xpt: event.target.checked })
                        }
                      />
                    }
                    label="XPT"
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      {showExecutionView ? (
        <DdeExecution hideActions fullHeight />
      ) : (
        <DdeExecution />
      )}

      <Stack direction="row" spacing={1}>
        {run.status === 'done' ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              disabled={run.status !== 'done'}
              onClick={handleShowResult}
            >
              Show Result
            </Button>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          </Stack>
        ) : (
          <Button variant="contained" onClick={runStep}>
            Run Step 3
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default DdeStep3;
