import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  webUtils,
} from 'electron';
import {
  DdeProgressEvent,
  DdeRunRequest,
  IUiSnackbar,
} from '@interfaces/common';
import { Channels, ElectronApi } from '@interfaces/electron.api';

const writeToClipboard: ElectronApi['writeToClipboard'] = (text) =>
  ipcRenderer.invoke('main:writeToClipboard', text);

const saveLocalStore: ElectronApi['saveLocalStore'] = (localStore) =>
  ipcRenderer.invoke('store:save', localStore);

const loadLocalStore: ElectronApi['loadLocalStore'] = () =>
  ipcRenderer.invoke('store:load');

const onSaveStore: ElectronApi['onSaveStore'] = (callback) => {
  ipcRenderer.on('renderer:saveStore', async () => {
    await callback();
    ipcRenderer.send('main:storeSaved');
  });
};

const onSnackbarMessage: ElectronApi['onSnackbarMessage'] = (callback) => {
  ipcRenderer.on(
    'renderer:snackbarMessage',
    (_event: IpcRendererEvent, data: IUiSnackbar) => {
      callback(data);
    },
  );
};

const onFileOpen: ElectronApi['onFileOpen'] = (callback) => {
  ipcRenderer.on(
    'renderer:openFile',
    (_event: IpcRendererEvent, filePath: string) => {
      callback(filePath);
    },
  );
};

const removeFileOpenListener: ElectronApi['removeFileOpenListener'] = () => {
  ipcRenderer.removeAllListeners('renderer:openFile');
};

const pathForFile: ElectronApi['pathForFile'] = (file) =>
  webUtils.getPathForFile(file);

const openFileDialog: ElectronApi['openFileDialog'] = (options) =>
  ipcRenderer.invoke('main:openFileDialog', options);

const openDirectoryDialog: ElectronApi['openDirectoryDialog'] = (
  initialFolder,
) => ipcRenderer.invoke('main:openDirectoryDialog', initialFolder);

const isWindows: ElectronApi['isWindows'] = process.platform === 'win32';

const isDevelopment: ElectronApi['isDevelopment'] =
  process.env.NODE_ENV === 'development';

const setZoom: ElectronApi['setZoom'] = (zoomLevel) =>
  ipcRenderer.invoke('main:setZoom', zoomLevel);

const openDefineXml: ElectronApi['openDefineXml'] = (filePath) =>
  ipcRenderer.invoke('main:openDefineXml', filePath);

const getDefineXmlContent: ElectronApi['getDefineXmlContent'] = (fileId) =>
  ipcRenderer.invoke('main:getDefineXmlContent', fileId);

const closeDefineXml: ElectronApi['closeDefineXml'] = (fileId) =>
  ipcRenderer.invoke('main:closeDefineXml', fileId);

const openInDefaultApplication: ElectronApi['openInDefaultApplication'] = (
  filePath,
) => ipcRenderer.invoke('main:openInDefaultApplication', filePath);

const searchInPage: ElectronApi['searchInPage'] = (searchTerm) =>
  ipcRenderer.invoke('main:searchInPage', searchTerm);

const searchInPageNext: ElectronApi['searchInPageNext'] = (searchTerm) =>
  ipcRenderer.invoke('main:searchInPageNext', searchTerm);

const searchInPagePrevious: ElectronApi['searchInPagePrevious'] = (
  searchTerm,
) => ipcRenderer.invoke('main:searchInPagePrevious', searchTerm);

const clearSearchResults: ElectronApi['clearSearchResults'] = () =>
  ipcRenderer.invoke('main:clearSearchResults');

const runDdeStep: ElectronApi['runDdeStep'] = (request: DdeRunRequest) =>
  ipcRenderer.invoke('main:runDdeStep', request);

const stopDdeStep: ElectronApi['stopDdeStep'] = (id: string) =>
  ipcRenderer.invoke('main:stopDdeStep', id);

const onDdeProgress: ElectronApi['onDdeProgress'] = (callback) => {
  const subscription = (_event: IpcRendererEvent, event: DdeProgressEvent) =>
    callback(event);
  ipcRenderer.on('renderer:ddeProgress', subscription);
  return () => {
    ipcRenderer.removeListener('renderer:ddeProgress', subscription);
  };
};

const checkPython: ElectronApi['checkPython'] = () =>
  ipcRenderer.invoke('main:checkPython');

contextBridge.exposeInMainWorld('electron', {
  writeToClipboard,
  saveLocalStore,
  loadLocalStore,
  onSaveStore,
  onSnackbarMessage,
  onFileOpen,
  removeFileOpenListener,
  pathForFile,
  openFileDialog,
  openDirectoryDialog,
  isWindows,
  isDevelopment,
  setZoom,
  openDefineXml,
  getDefineXmlContent,
  closeDefineXml,
  openInDefaultApplication,
  searchInPage,
  searchInPageNext,
  searchInPagePrevious,
  clearSearchResults,
  runDdeStep,
  stopDdeStep,
  onDdeProgress,
  checkPython,
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (..._args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (..._args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
});
