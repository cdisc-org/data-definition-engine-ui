/* eslint global-require: off, no-console: off, promise/always-return: off */
import fs from 'fs/promises';
import path from 'path';
import {
  app,
  BrowserWindow,
  dialog,
  shell,
  ipcMain,
  protocol,
  net,
} from 'electron';
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';
import StoreManager from '@/main/managers/storeManager';
import DefineXmlManager from '@/main/managers/defineXmlManager';
import DdeManager from '@/main/managers/ddeManager';
import { resolveHtmlPath, writeToClipboard, parseArgs } from '@/main/utils';
import { FileInfo } from '@interfaces/common';

let mainWindow: BrowserWindow | null = null;

const args = parseArgs(process.argv, app.isPackaged);
let fileToOpen = args.filePath;
const { disableGpu, userDataDir } = args;

if (disableGpu) {
  app.disableHardwareAcceleration();
}

if (userDataDir) {
  app.setPath('userData', userDataDir);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();

    const newArgs = parseArgs(commandLine, app.isPackaged);
    if (newArgs.filePath) {
      mainWindow.webContents.send('renderer:openFile', newArgs.filePath);
    }
  });

  app.on('open-file', (event, incomingFilePath) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.webContents.send('renderer:openFile', incomingFilePath);
    } else {
      fileToOpen = incomingFilePath;
    }
  });
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, path.normalize('../../assets'));

const createWindow = async (openedFilePath?: string | null) => {
  const getAssetPath = (...pathsToJoin: string[]) =>
    path.join(RESOURCES_PATH, ...pathsToJoin);

  const newWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  newWindow.loadURL(resolveHtmlPath('index.html'));

  newWindow.on('ready-to-show', () => {
    if (process.env.START_MINIMIZED) {
      newWindow.minimize();
    } else {
      newWindow.maximize();
      newWindow.showInactive();
    }

    if (openedFilePath) {
      newWindow.webContents.send('renderer:openFile', openedFilePath);
    }
  });

  newWindow.on('close', (event) => {
    event.preventDefault();
    ipcMain.once('main:storeSaved', () => {
      newWindow.destroy();
    });
    newWindow.webContents.send('renderer:saveStore');
  });

  newWindow.on('closed', () => {
    if (mainWindow === newWindow) {
      mainWindow = null;
    }
  });

  newWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  return newWindow;
};

const getFileInfo = async (fullPath: string): Promise<FileInfo> => {
  const stats = await fs.stat(fullPath);
  const parsed = path.parse(fullPath);

  return {
    fullPath,
    folder: parsed.dir,
    filename: parsed.base,
    format: parsed.ext.replace(/^\./, ''),
    size: stats.size,
    lastModified: stats.mtime.getTime(),
  };
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(async () => {
    if (isDebug) {
      try {
        const [redux, react] = await installExtension([
          REDUX_DEVTOOLS,
          REACT_DEVELOPER_TOOLS,
        ]);
        console.log(`Added Extensions:  ${redux.name}, ${react.name}`);
      } catch (err) {
        console.error('An error occurred: ', err);
      }
    }

    const storeManager = new StoreManager();
    const defineXmlManager = new DefineXmlManager();
    const ddeManager = new DdeManager({ resourcesPath: RESOURCES_PATH });

    ipcMain.handle('main:writeToClipboard', writeToClipboard);
    ipcMain.handle('main:setZoom', async (event, zoomLevel: number) => {
      event.sender.setZoomLevel(zoomLevel);
    });
    ipcMain.handle('store:save', storeManager.save);
    ipcMain.handle('store:load', storeManager.load);
    ipcMain.handle(
      'main:openFileDialog',
      async (
        _event,
        options: {
          multiple?: boolean;
          initialFolder?: string;
          filters?: { name: string; extensions: string[] }[];
        },
      ) => {
        const result = await dialog.showOpenDialog({
          properties: options.multiple
            ? ['openFile', 'multiSelections']
            : ['openFile'],
          defaultPath: options.initialFolder || undefined,
          filters: options.filters,
        });

        if (result.canceled) {
          return [];
        }

        return Promise.all(
          result.filePaths.map((fullPath) => getFileInfo(fullPath)),
        );
      },
    );
    ipcMain.handle(
      'main:openDirectoryDialog',
      async (_event, initialFolder: string | null) => {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          defaultPath: initialFolder || undefined,
        });

        if (result.canceled || result.filePaths.length === 0) {
          return '';
        }

        return result.filePaths[0];
      },
    );
    ipcMain.handle('main:openDefineXml', defineXmlManager.openDefineXml);
    ipcMain.handle(
      'main:getDefineXmlContent',
      defineXmlManager.getDefineXmlContent,
    );
    ipcMain.handle('main:closeDefineXml', defineXmlManager.closeDefineXml);
    ipcMain.handle('main:runDdeStep', ddeManager.runStep);
    ipcMain.handle('main:stopDdeStep', ddeManager.stopStep);
    ipcMain.handle('main:checkPython', ddeManager.checkPython);
    ipcMain.handle('main:openInDefaultApplication', (_event, filePath) => {
      return shell.openPath(filePath);
    });
    ipcMain.handle('main:searchInPage', (_event, searchTerm) => {
      _event.sender.findInPage(searchTerm);
    });
    ipcMain.handle('main:searchInPageNext', (_event, searchTerm) => {
      _event.sender.findInPage(searchTerm, {
        forward: true,
        findNext: true,
      });
    });
    ipcMain.handle('main:searchInPagePrevious', (_event, searchTerm) => {
      _event.sender.findInPage(searchTerm, {
        forward: false,
        findNext: true,
      });
    });
    ipcMain.handle('main:clearSearchResults', (_event) => {
      _event.sender.stopFindInPage('clearSelection');
    });

    protocol.handle('media', (request) => {
      const filePath = path.resolve(
        path.join(
          RESOURCES_PATH,
          path.normalize(
            decodeURIComponent(request.url.replace(/^media:\/\/\/?/, '')),
          ),
        ),
      );

      if (filePath.startsWith(RESOURCES_PATH)) {
        return net.fetch(`file://${filePath}`);
      }

      return new Response('Incorrect path', { status: 403 });
    });

    mainWindow = await createWindow(fileToOpen);
    app.on('activate', async () => {
      if (mainWindow === null) {
        mainWindow = await createWindow(fileToOpen);
      }
    });
  })
  .catch(console.error);
