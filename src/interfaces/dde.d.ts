export type DdeStep = 'step1' | 'step2' | 'step3';

export type DdeRunStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'done'
  | 'error'
  | 'stopped';

export interface IDdeStep1Config {
  usdmPath: string;
  outputTemplatePath: string;
  sdtmct: string;
  sdtmig: string;
  studyversion: string;
  studydesign: string;
  docversion: string;
  cdiscApiKey: string;
  useCdiscLibraryProxy: boolean;
  cosmosversion: string;
  validate: boolean;
  validationReportPath: string;
  debug: boolean;
  noSslVerify: boolean;
  patchFile: string;
  ddsJsonPath: string;
}

export interface IDdeStep2Config {
  applyPatch: string;
  ddsJsonPath: string;
}

export interface IDdeStep3Config {
  templatePath: string;
  defineXmlOutputPath: string;
  logLevel: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  validate: boolean;
  submission: boolean;
  xpt: boolean;
  defineXmlPath: string;
}

export interface IDdeRunState {
  id: string | null;
  step: DdeStep | null;
  status: DdeRunStatus;
  startedAt: number | null;
  lines: string[];
  exitCode: number | null;
  error: string | null;
  outputPath: string | null;
  definePath: string | null;
}

export interface PythonCheckResult {
  ok: boolean;
  pythonCommand: string;
  version: string | null;
  missingModules: string[];
  error: string | null;
}

export interface IDdeState {
  step1: IDdeStep1Config;
  step2: IDdeStep2Config;
  step3: IDdeStep3Config;
  run: IDdeRunState;
  pythonCheck: PythonCheckResult | null;
}

export interface DdeRuntimePaths {
  ddeScriptsPath?: string;
  pythonVenvPath?: string;
}

export interface DdeRunRequest {
  id: string;
  step: DdeStep;
  args: string[];
  env?: Record<string, string | undefined>;
  runtimePaths?: DdeRuntimePaths;
}

export interface DdeProgressEvent {
  id: string;
  step: DdeStep;
  status: Exclude<DdeRunStatus, 'idle'>;
  line?: string;
  exitCode?: number | null;
  outputPath?: string;
  definePath?: string;
  error?: string;
}
