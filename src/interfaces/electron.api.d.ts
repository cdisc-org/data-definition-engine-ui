import {
  ILocalStore,
  FileInfo,
  NewWindowProps,
  DefineFileInfo,
  DefineXmlContent,
  IUiSnackbar,
  DdeRunRequest,
  DdeProgressEvent,
  PythonCheckResult,
} from '@interfaces/common';

export type Channels = 'ipc-vde';

export interface ElectronApi {
  pathForFile: (file: File) => string;
  saveLocalStore: (localStore: ILocalStore) => void;
  loadLocalStore: () => Promise<ILocalStore>;
  onSaveStore: (callback: () => Promise<void>) => void;
  onSnackbarMessage: (callback: (data: IUiSnackbar) => void) => void;
  onFileOpen: (
    callback: (filePath: string, props?: NewWindowProps) => void,
  ) => void;
  removeFileOpenListener: () => void;
  writeToClipboard: (text: string) => Promise<boolean>;
  openFileDialog: (options: {
    multiple?: boolean;
    initialFolder?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<FileInfo[] | null>;
  openDirectoryDialog: (initialFolder: string | null) => Promise<string>;
  openDefineXml: (filePath?: string) => Promise<DefineFileInfo | null>;
  getDefineXmlContent: (
    fileId: string,
  ) => Promise<DefineXmlContent | { error: string }>;
  closeDefineXml: (fileId: string) => Promise<boolean>;
  isWindows: boolean;
  isDevelopment: boolean;
  setZoom: (zoomLevel: number) => Promise<void>;
  openInDefaultApplication: (filePath: string) => Promise<string>;
  searchInPage: (searchTerm: string) => Promise<void>;
  searchInPageNext: (searchTerm: string) => Promise<void>;
  searchInPagePrevious: (searchTerm: string) => Promise<void>;
  clearSearchResults: () => Promise<void>;
  runDdeStep: (
    request: DdeRunRequest,
  ) => Promise<{ started: boolean } | { error: string }>;
  stopDdeStep: (id: string) => Promise<boolean>;
  onDdeProgress: (callback: (event: DdeProgressEvent) => void) => () => void;
  checkPython: (runtimePaths?: {
    ddeScriptsPath?: string;
    pythonVenvPath?: string;
  }) => Promise<PythonCheckResult>;
}
