import React, { useContext, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AppContext from '@utils/AppContext';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import {
  failDdeRun,
  setPythonCheck,
  setStep1Config,
  startDdeRun,
} from '@redux/slices/dde';
import { openSnackbar, setPathname } from '@redux/slices/ui';
import DdeExecution from '@components/DdeExecution';
import { buildLoaderArgs } from '@utils/buildLoaderArgs';
import { paths } from '@/misc/constants';

const styles = {
  page: {
    p: 3,
  },
};

const DdeStep1: React.FC = () => {
  const dispatch = useAppDispatch();
  const { apiService } = useContext(AppContext);
  const config = useAppSelector((state) => state.dde.step1);
  const pythonCheck = useAppSelector((state) => state.dde.pythonCheck);
  const pythonCommand = useAppSelector(
    (state) => state.settings.other.pythonCommand,
  );

  useEffect(() => {
    if (pythonCheck !== null) {
      return;
    }

    const runCheck = async () => {
      const result = await apiService.checkPython();
      dispatch(setPythonCheck(result));
    };

    runCheck();
  }, [apiService, dispatch, pythonCheck]);

  const updateConfig = (next: Partial<typeof config>) => {
    dispatch(setStep1Config(next));
  };

  const pickFile = async (
    key: 'usdmPath' | 'patchFile' | 'validationReportPath',
    filters: { name: string; extensions: string[] }[],
  ) => {
    const result = await apiService.openFileDialog({ filters });
    if (!result || result.length === 0) {
      return;
    }

    updateConfig({ [key]: result[0].fullPath } as Partial<typeof config>);
  };

  const pickOutputFolder = async () => {
    const result = await apiService.openDirectoryDialog(
      config.outputTemplatePath || null,
    );
    if (!result) {
      return;
    }

    const baseName = config.usdmPath
      ? config.usdmPath
          .split('/')
          .pop()
          ?.replace(/\.[^.]+$/, '') || 'dds'
      : 'dds';
    updateConfig({ outputTemplatePath: `${result}/${baseName}.json` });
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

    dispatch(startDdeRun({ id, step: 'step1' }));
    const result = await apiService.runDdeStep({
      id,
      step: 'step1',
      args,
      env: {
        CDISC_API_KEY: config.cdiscApiKey || undefined,
        DDE_PYTHON_EXE: pythonCommand || undefined,
      },
    });

    if ('error' in result) {
      dispatch(failDdeRun({ id, step: 'step1', error: result.error }));
    }
  };

  return (
    <Stack spacing={3} sx={styles.page}>
      <Box>
        <Typography variant="h4">Step 1</Typography>
        <Typography color="text.secondary">
          Generate a DDS JSON template from a USDM input file.
        </Typography>
      </Box>

      {pythonCheck ? (
        <Alert severity={pythonCheck.ok ? 'success' : 'warning'}>
          {pythonCheck.ok
            ? `Using ${pythonCheck.pythonCommand} (${pythonCheck.version})`
            : `Python check failed for ${pythonCheck.pythonCommand}${pythonCheck.error ? `: ${pythonCheck.error}` : ''}${pythonCheck.missingModules.length > 0 ? `. Missing modules: ${pythonCheck.missingModules.join(', ')}` : ''}`}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="USDM JSON"
                value={config.usdmPath}
                onChange={(event) =>
                  updateConfig({ usdmPath: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() =>
                  pickFile('usdmPath', [
                    {
                      name: 'USDM JSON',
                      extensions: ['json'],
                    },
                  ])
                }
              >
                Choose USDM File
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="DDS JSON Output"
                value={config.outputTemplatePath}
                onChange={(event) =>
                  updateConfig({
                    outputTemplatePath: event.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button fullWidth variant="outlined" onClick={pickOutputFolder}>
                Choose Output Folder
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="SDTM CT"
                slotProps={{ inputLabel: { shrink: true } }}
                value={config.sdtmct}
                onChange={(event) =>
                  updateConfig({ sdtmct: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
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
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                label="Study Version"
                value={config.studyversion}
                onChange={(event) =>
                  updateConfig({ studyversion: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                label="Study Design"
                value={config.studydesign}
                onChange={(event) =>
                  updateConfig({ studydesign: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                label="Doc Version"
                value={config.docversion}
                onChange={(event) =>
                  updateConfig({ docversion: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="password"
                label="CDISC API Key"
                value={config.cdiscApiKey}
                onChange={(event) =>
                  updateConfig({ cdiscApiKey: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Cosmos Version"
                value={config.cosmosversion}
                onChange={(event) =>
                  updateConfig({ cosmosversion: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Validation Report XLSX"
                value={config.validationReportPath}
                onChange={(event) =>
                  updateConfig({
                    validationReportPath: event.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() =>
                  pickFile('validationReportPath', [
                    {
                      name: 'Excel Workbook',
                      extensions: ['xlsx'],
                    },
                  ])
                }
              >
                Choose Report File
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Patch File"
                value={config.patchFile}
                onChange={(event) =>
                  updateConfig({ patchFile: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() =>
                  pickFile('patchFile', [
                    {
                      name: 'YAML',
                      extensions: ['yaml', 'yml'],
                    },
                  ])
                }
              >
                Choose Patch File
              </Button>
            </Grid>
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
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
    </Stack>
  );
};

export default DdeStep1;
