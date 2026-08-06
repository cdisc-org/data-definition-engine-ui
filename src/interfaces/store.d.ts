import { modals, AllowedPathnames } from '@/misc/constants';
import { IDdeState } from '@interfaces/dde';
import { ThemeModePreference, ThemePalette } from '@interfaces/theme';

export interface SettingsDefine {
  stylesheetShowComments: boolean;
}

export interface ISettings {
  define: SettingsDefine;
  other: {
    colorMode: ThemeModePreference;
    themePalette: ThemePalette;
    compactMode: boolean;
    loadingAnimation: 'santa' | 'cat' | 'dog' | 'normal' | 'random';
    dragoverAnimation: boolean;
    disableUiAnimation: boolean;
    pythonCommand: string;
  };
}

export interface IUiModalMessage {
  type: typeof modals.ERROR;
  data: { message: string };
}

export type IUiModal = IUiModalMessage;

export interface IUiSnackbar {
  type: 'success' | 'error' | 'info' | 'warning' | null;
  message: string | null;
  props?: {
    duration?: number;
  };
}

export type DefineTab =
  | 'overview'
  | 'datasets'
  | 'variables'
  | 'codelists'
  | 'methods'
  | 'comments'
  | 'analysis';

export interface IUiDefine {
  currentFileId: string | null;
  isDefineLoading: boolean;
  currentTab: DefineTab;
  selectedItemGroupOid: string | null;
  selectedVariableOid: string | null;
  searchTerm: string;
  scrollPosition: { [fileId: string]: number };
}

export interface IUi {
  pathname: AllowedPathnames;
  zoomLevel: number;
  appBarExpanded: boolean;
  modals: IUiModal[];
  snackbar: IUiSnackbar;
  define: IUiDefine;
  reloadRequested: boolean;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

export interface IStore {
  ui: IUi;
  settings: ISettings;
  dde: IDdeState;
}
