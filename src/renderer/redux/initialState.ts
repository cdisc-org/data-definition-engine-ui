import { IStore, IUi, ISettings, IDdeState } from '@interfaces/common';
import { paths } from '@/misc/constants';

export const settings: ISettings = {
  other: {
    colorMode: 'light',
    themePalette: 'cdisc',
    compactMode: false,
    loadingAnimation: 'random',
    dragoverAnimation: true,
    disableUiAnimation: false,
    pythonCommand: '',
  },
  define: {
    stylesheetShowComments: false,
  },
};
export const ui: IUi = {
  pathname: paths.STEP1,
  zoomLevel: 0,
  appBarExpanded: true,
  modals: [],
  snackbar: {
    type: null,
    message: null,
    props: {},
  },
  define: {
    currentFileId: null,
    isDefineLoading: false,
    currentTab: 'overview',
    selectedItemGroupOid: null,
    selectedVariableOid: null,
    searchTerm: '',
    scrollPosition: {},
  },
  reloadRequested: false,
};

export const dde: IDdeState = {
  step1: {
    usdmPath: '',
    outputTemplatePath: '',
    sdtmct: '',
    sdtmig: '3.4',
    studyversion: '0',
    studydesign: '0',
    docversion: '0',
    cdiscApiKey: '',
    cosmosversion: 'v2',
    validate: false,
    validationReportPath: '',
    debug: false,
    noSslVerify: false,
    patchFile: '',
    ddsJsonPath: '',
  },
  step2: {
    applyPatch: '',
    ddsJsonPath: '',
  },
  step3: {
    templatePath: '',
    defineXmlOutputPath: '',
    logLevel: 'INFO',
    validate: false,
    submission: false,
    xpt: false,
    defineXmlPath: '',
  },
  run: {
    id: null,
    step: null,
    status: 'idle',
    startedAt: null,
    lines: [],
    exitCode: null,
    error: null,
    outputPath: null,
    definePath: null,
  },
  pythonCheck: null,
};

const initialState: IStore = {
  ui,
  settings,
  dde,
};

export default initialState;
