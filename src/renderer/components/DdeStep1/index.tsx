import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Box,
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
  setPythonCheck,
  setStep1Config,
  startDdeRun,
} from '@redux/slices/dde';
import { openSnackbar, setPathname } from '@redux/slices/ui';
import { setSettings } from '@redux/slices/settings';
import DdeExecution from '@components/DdeExecution';
import { buildLoaderArgs } from '@utils/buildLoaderArgs';
import { paths } from '@/misc/constants';
import sdtmCtOptions from '@utils/sdtmCtOptions';

const styles = {
  page: {
    p: 3,
  },
};

const joinPath = (basePath: string, childPath: string) => {
  const trimmedBase = basePath.replace(/[\\/]+$/, '');
  const separator = trimmedBase.includes('\\') ? '\\' : '/';
  return `${trimmedBase}${separator}${childPath}`;
};

const DdeStep1: React.FC = () => {
  const dispatch = useAppDispatch();
  const { apiService } = useContext(AppContext);
  const config = useAppSelector((state) => state.dde.step1);
  const run = useAppSelector((state) => state.dde.run);
  const pythonCheck = useAppSelector((state) => state.dde.pythonCheck);
  const settings = useAppSelector((state) => state.settings.other);
  const [runSnapshot, setRunSnapshot] = useState<Partial<typeof config> | null>(
    null,
  );
  const pythonCommand = useAppSelector(
    (state) => state.settings.other.pythonCommand,
  );

  useEffect(() => {
    if (pythonCheck !== null) {
      return;
    }

    const runCheck = async () => {
      const result = await apiService.checkPython({
        ddeScriptsPath: settings.ddeScriptsPath || undefined,
        pythonVenvPath: settings.pythonVenvPath || undefined,
      });
      dispatch(setPythonCheck(result));
    };

    runCheck();
  }, [
    apiService,
    dispatch,
    pythonCheck,
    settings.ddeScriptsPath,
    settings.pythonVenvPath,
  ]);

  const updateConfig = (next: Partial<typeof config>) => {
    dispatch(setStep1Config(next));
  };

  const updateSetting = (next: Partial<typeof settings>) => {
    dispatch(setSettings({ other: next }));
  };

  const pickFile = async (
    key: 'usdmPath' | 'patchFile' | 'validationReportPath',
    filters: { name: string; extensions: string[] }[],
    type: 'file' | 'folder' = 'file',
  ) => {
    let result: { fullPath: string }[] | string | null = null;
    if (type === 'file') {
      result = await apiService.openFileDialog({ filters });
      if (!result || result.length === 0) {
        return;
      }
    } else {
      result = await apiService.openDirectoryDialog(null);
      if (!result) {
        return;
      }
    }

    if (key === 'patchFile' && type === 'folder') {
      // If the user selected a folder for the patch file, we want to append "patch.yaml" to the path
      result = joinPath(result as string, 'patch.yaml');
    }

    if (key === 'validationReportPath' && type === 'folder') {
      // If the user selected a folder for the validation report, we want to append "validation_report.xlsx" to the path
      result = joinPath(result as string, 'validation_report.xlsx');
    }

    updateConfig({
      [key]:
        type === 'file'
          ? (result as { fullPath: string }[])[0].fullPath
          : result,
    } as Partial<typeof config>);
  };

  const pickOutputFolder = async () => {
    const result = await apiService.openDirectoryDialog(
      config.outputTemplatePath || null,
    );
    if (!result) {
      return;
    }

    updateConfig({ outputTemplatePath: joinPath(result, 'define.json') });
  };

  const pickRuntimeDirectory = async (
    key: 'ddeScriptsPath' | 'pythonVenvPath',
  ) => {
    const result = await apiService.openDirectoryDialog(settings[key] || null);
    if (!result) {
      return;
    }

    updateSetting({ [key]: result } as Partial<typeof settings>);
  };

  const runStep = async () => {
    if (!config.usdmPath || !config.outputTemplatePath || !config.sdtmct) {
      dispatch(
        openSnackbar({
          type: 'error',
          message: 'USDM file, DDS output path, and SDTM CT date are required.',
        }),
      );
      return;
    }

    const id = `step1-${Date.now()}`;
    const args = [...buildLoaderArgs(config)];

    if (config.patchFile) {
      args.push('--patch_file', config.patchFile);
    }

    const currentConfig = { ...config };
    dispatch(setStep1Config(currentConfig));
    setRunSnapshot(currentConfig);
    dispatch(startDdeRun({ id, step: 'step1' }));
    const result = await apiService.runDdeStep({
      id,
      step: 'step1',
      args,
      env: {
        CDISC_API_KEY: config.cdiscApiKey || undefined,
        DDE_PYTHON_EXE: pythonCommand || undefined,
      },
      runtimePaths: {
        ddeScriptsPath: settings.ddeScriptsPath || undefined,
        pythonVenvPath: settings.pythonVenvPath || undefined,
      },
    });

    if ('error' in result) {
      dispatch(failDdeRun({ id, step: 'step1', error: result.error }));
    }
  };

  const handleContinueToStep2 = () => {
    // Reset execution status and log
    dispatch(clearDdeRun());
    dispatch(setPathname({ pathname: paths.STEP2 }));
  };

  const handleCancel = async () => {
    if (run.id) {
      await apiService.stopDdeStep(run.id);
    }

    if (runSnapshot) {
      dispatch(setStep1Config(runSnapshot));
    }
    dispatch(clearDdeRun());
    dispatch(setPathname({ pathname: paths.STEP1 }));
  };

  const showExecutionView = run.status !== 'idle';

  return (
    <Stack
      spacing={3}
      sx={{
        ...styles.page,
        minHeight: showExecutionView ? 'calc(100vh - 120px)' : 'auto',
      }}
    >
      <Box>
        <Typography variant="h4">Step 1</Typography>
        <Typography color="text.secondary">
          Generate a DDS JSON template from a USDM input file.
        </Typography>
      </Box>

      {!showExecutionView && pythonCheck ? (
        <Alert severity={pythonCheck.ok ? 'success' : 'warning'}>
          {pythonCheck.ok
            ? `Using ${pythonCheck.pythonCommand} (${pythonCheck.version})`
            : `Python check failed for ${pythonCheck.pythonCommand}${pythonCheck.error ? `: ${pythonCheck.error}` : ''}${pythonCheck.missingModules.length > 0 ? `. Missing modules: ${pythonCheck.missingModules.join(', ')}` : ''}`}
        </Alert>
      ) : null}

      {!showExecutionView ? (
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Runtime Paths
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Path to DDE Scripts"
                      value={settings.ddeScriptsPath}
                      onChange={(event) =>
                        updateSetting({ ddeScriptsPath: event.target.value })
                      }
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                aria-label="Choose DDE scripts path"
                                onClick={() =>
                                  pickRuntimeDirectory('ddeScriptsPath')
                                }
                              >
                                <FolderOpen />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Path to Python VENV"
                      value={settings.pythonVenvPath}
                      onChange={(event) =>
                        updateSetting({ pythonVenvPath: event.target.value })
                      }
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                aria-label="Choose Python venv path"
                                onClick={() =>
                                  pickRuntimeDirectory('pythonVenvPath')
                                }
                              >
                                <FolderOpen />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Inputs
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="USDM JSON"
                      value={config.usdmPath}
                      onChange={(event) =>
                        updateConfig({ usdmPath: event.target.value })
                      }
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                aria-label="Choose USDM file"
                                onClick={() =>
                                  pickFile('usdmPath', [
                                    {
                                      name: 'USDM JSON',
                                      extensions: ['json'],
                                    },
                                  ])
                                }
                              >
                                <InsertDriveFile />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 4, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      label="SDTM CT"
                      value={config.sdtmct}
                      onChange={(event) =>
                        updateConfig({ sdtmct: event.target.value })
                      }
                    >
                      {sdtmCtOptions.map((date) => (
                        <MenuItem key={date} value={date}>
                          {date}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 3, md: 1 }}>
                    <TextField
                      select
                      fullWidth
                      label="SDTMIG"
                      value={config.sdtmig}
                      onChange={(event) =>
                        updateConfig({ sdtmig: event.target.value })
                      }
                    >
                      <MenuItem value="3.4">3.4</MenuItem>
                      <MenuItem value="3.3">3.3</MenuItem>
                      <MenuItem value="3.2">3.2</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 3, md: 1 }}>
                    <TextField
                      fullWidth
                      label="Study Version"
                      value={config.studyversion}
                      onChange={(event) =>
                        updateConfig({ studyversion: event.target.value })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 3, md: 1 }}>
                    <TextField
                      fullWidth
                      label="Study Design"
                      value={config.studydesign}
                      onChange={(event) =>
                        updateConfig({ studydesign: event.target.value })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 3, md: 1 }}>
                    <TextField
                      fullWidth
                      label="Doc Version"
                      value={config.docversion}
                      onChange={(event) =>
                        updateConfig({ docversion: event.target.value })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={config.debug}
                          onChange={(event) =>
                            updateConfig({ debug: event.target.checked })
                          }
                        />
                      }
                      label="Debug"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  CDISC Library
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Key"
                      value={config.cdiscApiKey}
                      onChange={(event) =>
                        updateConfig({ cdiscApiKey: event.target.value })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 4, md: 1 }}>
                    <TextField
                      select
                      fullWidth
                      label="Cosmos Version"
                      value={config.cosmosversion}
                      onChange={(event) =>
                        updateConfig({ cosmosversion: event.target.value })
                      }
                    >
                      <MenuItem value="v1">v1</MenuItem>
                      <MenuItem value="v2">v2</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={config.noSslVerify}
                          onChange={(event) =>
                            updateConfig({
                              noSslVerify: event.target.checked,
                            })
                          }
                        />
                      }
                      label="Disable SSL Verify"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Validation
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
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
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      disabled={!config.validate}
                      label="Validation Report XLSX"
                      value={config.validationReportPath}
                      onChange={(event) =>
                        updateConfig({
                          validationReportPath: event.target.value,
                        })
                      }
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                aria-label="Choose validation report"
                                onClick={() =>
                                  pickFile('validationReportPath', [], 'folder')
                                }
                              >
                                <InsertDriveFile />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Outputs
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Output template"
                      value={config.outputTemplatePath}
                      onChange={(event) =>
                        updateConfig({
                          outputTemplatePath: event.target.value,
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
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Patch File Folder"
                      value={config.patchFile}
                      onChange={(event) =>
                        updateConfig({ patchFile: event.target.value })
                      }
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                aria-label="Choose patch output folder"
                                onClick={() =>
                                  pickFile('patchFile', [], 'folder')
                                }
                              >
                                <InsertDriveFile />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {showExecutionView ? (
        <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <DdeExecution hideActions fullHeight />
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={handleContinueToStep2}
              disabled={run.status !== 'done'}
            >
              Continue to Step 2
            </Button>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      ) : (
        <>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={runStep}>
              Run Step 1
            </Button>
            <Button
              variant="outlined"
              onClick={() => dispatch(setPathname({ pathname: paths.STEP2 }))}
            >
              Skip to Step 2
            </Button>
          </Stack>
          <DdeExecution />
        </>
      )}
    </Stack>
  );
};

export default DdeStep1;
