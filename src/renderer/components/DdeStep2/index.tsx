import React, { useContext } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AppContext from '@utils/AppContext';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { failDdeRun, setStep2Config, startDdeRun } from '@redux/slices/dde';
import { openSnackbar, setPathname } from '@redux/slices/ui';
import DdeExecution from '@components/DdeExecution';
import { buildLoaderArgs } from '@utils/buildLoaderArgs';
import { paths } from '@/misc/constants';

const styles = {
  page: {
    p: 3,
  },
};

const DdeStep2: React.FC = () => {
  const dispatch = useAppDispatch();
  const { apiService } = useContext(AppContext);
  const step1 = useAppSelector((state) => state.dde.step1);
  const config = useAppSelector((state) => state.dde.step2);
  const pythonCommand = useAppSelector(
    (state) => state.settings.other.pythonCommand,
  );

  const updateConfig = (next: Partial<typeof config>) => {
    dispatch(setStep2Config(next));
  };

  const pickApplyPatch = async () => {
    const result = await apiService.openFileDialog({
      filters: [{ name: 'YAML', extensions: ['yaml', 'yml'] }],
    });
    if (!result || result.length === 0) {
      return;
    }

    updateConfig({ applyPatch: result[0].fullPath });
  };

  const runStep = async () => {
    if (!config.applyPatch) {
      dispatch(
        openSnackbar({
          type: 'error',
          message: 'An Apply Patch file is required.',
        }),
      );
      return;
    }

    if (!step1.usdmPath || !step1.outputTemplatePath || !step1.sdtmct) {
      dispatch(
        openSnackbar({
          type: 'error',
          message:
            'USDM file, DDS output path, and SDTM CT date from Step 1 are required.',
        }),
      );
      return;
    }

    const id = `step2-${Date.now()}`;
    const args = [
      ...buildLoaderArgs(step1),
      '--patch_file',
      config.applyPatch,
      '--apply_patch',
      config.applyPatch,
    ];

    dispatch(startDdeRun({ id, step: 'step2' }));
    const result = await apiService.runDdeStep({
      id,
      step: 'step2',
      args,
      env: {
        CDISC_API_KEY: step1.cdiscApiKey || undefined,
        DDE_PYTHON_EXE: pythonCommand || undefined,
      },
    });

    if ('error' in result) {
      dispatch(failDdeRun({ id, step: 'step2', error: result.error }));
    }
  };

  return (
    <Stack spacing={3} sx={styles.page}>
      <div>
        <Typography variant="h4">Step 2</Typography>
        <Typography color="text.secondary">
          Apply the patch file created in Step 1 and refresh the DDS JSON
          template.
        </Typography>
      </div>

      {!step1.usdmPath || !step1.outputTemplatePath || !step1.sdtmct ? (
        <Alert severity="warning">
          Complete Step 1 first so the USDM file, DDS output path, and SDTM CT
          date can be reused to regenerate the template.
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Apply Patch File"
                value={config.applyPatch}
                onChange={(event) =>
                  updateConfig({ applyPatch: event.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button fullWidth variant="outlined" onClick={pickApplyPatch}>
                Choose Apply-Patch File
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="USDM JSON"
                value={step1.usdmPath}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="SDTM CT"
                value={step1.sdtmct}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="DDS JSON Output"
                value={step1.outputTemplatePath}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={runStep}>
          Run Step 2
        </Button>
        <Button
          variant="outlined"
          onClick={() => dispatch(setPathname({ pathname: paths.STEP3 }))}
        >
          Skip to Step 3
        </Button>
      </Stack>

      <DdeExecution />
    </Stack>
  );
};

export default DdeStep2;
