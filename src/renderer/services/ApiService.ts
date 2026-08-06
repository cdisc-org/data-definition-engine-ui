import {
  DefineFileInfo,
  DefineXmlContent,
  DdeRunRequest,
  FileInfo,
  ILocalStore,
  IStore,
  NewWindowProps,
  PythonCheckResult,
} from '@interfaces/common';

class ApiService {
  private openedDefines: DefineFileInfo[] = [];

  private openedDefineContents: { [fileId: string]: DefineXmlContent } = {};

  public loadLocalStore = async (): Promise<ILocalStore> => {
    return window.electron.loadLocalStore();
  };

  public saveLocalStore = async ({ reduxStore }: { reduxStore: IStore }) => {
    window.electron.saveLocalStore({ reduxStore });
  };

  public onFileOpen = (
    callback: (filePath: string, newWindowProps?: NewWindowProps) => void,
  ) => {
    window.electron.onFileOpen(callback);
  };

  public removeFileOpenListener = () => {
    window.electron.removeFileOpenListener();
  };

  public openFileDialog = async (options?: {
    multiple?: boolean;
    initialFolder?: string;
    filters?: { name: string; extensions: string[] }[];
  }): Promise<FileInfo[] | null> => {
    return window.electron.openFileDialog(options || {});
  };

  public openDirectoryDialog = async (
    initialFolder: string | null,
  ): Promise<string> => {
    return window.electron.openDirectoryDialog(initialFolder);
  };

  public setZoom = async (level: number): Promise<void> => {
    await window.electron.setZoom(level);
  };

  public openDefineXml = async (
    filePath?: string,
  ): Promise<DefineFileInfo | null> => {
    let defineFileInfo: DefineFileInfo | null = null;
    if (filePath !== undefined) {
      defineFileInfo =
        this.openedDefines.find((define) => define.fullPath === filePath) ||
        null;
    }

    if (defineFileInfo !== null) {
      return defineFileInfo;
    }

    defineFileInfo = await window.electron.openDefineXml(filePath);
    if (defineFileInfo !== null) {
      this.openedDefines.push(defineFileInfo);
    }
    return defineFileInfo;
  };

  public getOpenedDefineFiles = (): DefineFileInfo[] => {
    return this.openedDefines;
  };

  public getDefineXmlContent = async (
    fileId: string,
  ): Promise<DefineXmlContent | { error: string }> => {
    if (this.openedDefineContents[fileId] !== undefined) {
      return this.openedDefineContents[fileId];
    }
    const content = await window.electron.getDefineXmlContent(fileId);
    if ('error' in content) {
      return content;
    }
    this.openedDefineContents[fileId] = content;
    return content;
  };

  public closeDefineXml = async (fileId: string): Promise<boolean> => {
    const result = await window.electron.closeDefineXml(fileId);
    if (result) {
      delete this.openedDefineContents[fileId];
      this.openedDefines = this.openedDefines.filter(
        (define) => define.fileId !== fileId,
      );
    }
    return result;
  };

  public openFileInDefaultApp = async (filePath: string): Promise<string> => {
    return window.electron.openInDefaultApplication(filePath);
  };

  public searchInPage = async (searchTerm: string): Promise<void> => {
    await window.electron.searchInPage(searchTerm);
  };

  public searchInPageNext = async (searchTerm: string): Promise<void> => {
    await window.electron.searchInPageNext(searchTerm);
  };

  public searchInPagePrevious = async (searchTerm: string): Promise<void> => {
    await window.electron.searchInPagePrevious(searchTerm);
  };

  public clearSearchResults = async (): Promise<void> => {
    await window.electron.clearSearchResults();
  };

  public runDdeStep = async (
    request: DdeRunRequest,
  ): Promise<{ started: boolean } | { error: string }> => {
    return window.electron.runDdeStep(request);
  };

  public stopDdeStep = async (id: string): Promise<boolean> => {
    return window.electron.stopDdeStep(id);
  };

  public checkPython = async (): Promise<PythonCheckResult> => {
    return window.electron.checkPython();
  };
}

export default ApiService;
