import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { dde as initialDde } from '@redux/initialState';
import {
  DdeProgressEvent,
  DdeStep,
  IDdeStep1Config,
  IDdeStep2Config,
  IDdeStep3Config,
  PythonCheckResult,
} from '@interfaces/common';

const clampLines = (lines: string[]) => {
  if (lines.length <= 500) {
    return lines;
  }
  return lines.slice(lines.length - 500);
};

export const ddeSlice = createSlice({
  name: 'dde',
  initialState: initialDde,
  reducers: {
    setStep1Config: (
      state,
      action: PayloadAction<Partial<IDdeStep1Config>>,
    ) => {
      state.step1 = { ...state.step1, ...action.payload };
    },
    setStep2Config: (
      state,
      action: PayloadAction<Partial<IDdeStep2Config>>,
    ) => {
      state.step2 = { ...state.step2, ...action.payload };
    },
    setStep3Config: (
      state,
      action: PayloadAction<Partial<IDdeStep3Config>>,
    ) => {
      state.step3 = { ...state.step3, ...action.payload };
    },
    setPythonCheck: (
      state,
      action: PayloadAction<PythonCheckResult | null>,
    ) => {
      state.pythonCheck = action.payload;
    },
    startDdeRun: (
      state,
      action: PayloadAction<{ id: string; step: DdeStep }>,
    ) => {
      state.run = {
        id: action.payload.id,
        step: action.payload.step,
        status: 'starting',
        startedAt: Date.now(),
        lines: [],
        exitCode: null,
        error: null,
        outputPath: null,
        definePath: null,
      };
    },
    applyDdeProgress: (state, action: PayloadAction<DdeProgressEvent>) => {
      const event = action.payload;
      if (state.run.id !== event.id) {
        state.run.id = event.id;
        state.run.step = event.step;
        state.run.lines = [];
        state.run.startedAt = Date.now();
      }

      state.run.status = event.status;
      state.run.exitCode = event.exitCode ?? state.run.exitCode;
      state.run.error = event.error ?? state.run.error;

      if (event.line) {
        state.run.lines = clampLines([...state.run.lines, event.line]);
      }

      if (event.outputPath) {
        state.run.outputPath = event.outputPath;
        if (event.step === 'step1') {
          state.step1.ddsJsonPath = event.outputPath;
          state.step1.outputTemplatePath = event.outputPath;
          state.step2.applyPatch =
            state.step1.patchFile || state.step2.applyPatch;
          state.step3.templatePath = event.outputPath;
        }
        if (event.step === 'step2') {
          state.step2.ddsJsonPath = event.outputPath;
          state.step3.templatePath = event.outputPath;
        }
      }

      if (event.definePath) {
        state.run.definePath = event.definePath;
        state.step3.defineXmlPath = event.definePath;
        state.step3.defineXmlOutputPath = event.definePath;
      }
    },
    failDdeRun: (
      state,
      action: PayloadAction<{ id: string; step: DdeStep; error: string }>,
    ) => {
      state.run = {
        id: action.payload.id,
        step: action.payload.step,
        status: 'error',
        startedAt: Date.now(),
        lines: [action.payload.error],
        exitCode: null,
        error: action.payload.error,
        outputPath: null,
        definePath: null,
      };
    },
    clearDdeRun: (state) => {
      state.run = initialDde.run;
    },
  },
});

export const {
  setStep1Config,
  setStep2Config,
  setStep3Config,
  setPythonCheck,
  startDdeRun,
  applyDdeProgress,
  failDdeRun,
  clearDdeRun,
} = ddeSlice.actions;

export default ddeSlice.reducer;
