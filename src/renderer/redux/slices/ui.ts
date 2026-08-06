import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ui as initialUi } from '@redux/initialState';
import {
  AllowedPathnames,
  DefineTab,
  IUiModal,
  IUiSnackbar,
  ModalType,
} from '@interfaces/common';

export const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUi,
  reducers: {
    setPathname: (
      state,
      action: PayloadAction<{ pathname: AllowedPathnames }>,
    ) => {
      state.pathname = action.payload.pathname;
    },
    openSnackbar: (state, action: PayloadAction<IUiSnackbar>) => {
      const { type, message, props } = action.payload;
      state.snackbar = { type, message, props };
    },
    closeSnackbar: (state) => {
      state.snackbar = { type: null, message: null, props: {} };
    },
    openModal: (state, action: PayloadAction<IUiModal>) => {
      state.modals.push(action.payload);
    },
    closeModal: (state, action: PayloadAction<{ type: ModalType }>) => {
      const index = state.modals
        .map((modal) => modal.type)
        .lastIndexOf(action.payload.type);
      if (index !== -1) {
        state.modals.splice(index, 1);
      }
    },
    closeAllModals: (state) => {
      state.modals = [];
    },
    toggleAppBarExpanded: (state) => {
      state.appBarExpanded = !state.appBarExpanded;
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload;
    },
    setDefineFileId: (state, action: PayloadAction<string | null>) => {
      state.define.currentFileId = action.payload;
    },
    setDefineIsLoading: (state, action: PayloadAction<boolean>) => {
      state.define.isDefineLoading = action.payload;
    },
    setDefineTab: (state, action: PayloadAction<DefineTab>) => {
      state.define.currentTab = action.payload;
    },
    setDefineItemGroup: (state, action: PayloadAction<string | null>) => {
      state.define.selectedItemGroupOid = action.payload;
    },
    setDefineVariable: (state, action: PayloadAction<string | null>) => {
      state.define.selectedVariableOid = action.payload;
    },
    setDefineSearchTerm: (state, action: PayloadAction<string>) => {
      state.define.searchTerm = action.payload;
    },
    setDefineScrollPosition: (
      state,
      action: PayloadAction<{ fileId: string; position: number }>,
    ) => {
      state.define.scrollPosition[action.payload.fileId] =
        action.payload.position;
    },
    resetDefineUi: (state) => {
      state.define = initialUi.define;
    },
    setReloadRequested: (state, action: PayloadAction<boolean>) => {
      state.reloadRequested = action.payload;
    },
  },
});

export const {
  setPathname,
  openSnackbar,
  closeSnackbar,
  openModal,
  closeModal,
  closeAllModals,
  toggleAppBarExpanded,
  setZoomLevel,
  setDefineFileId,
  setDefineIsLoading,
  setDefineTab,
  setDefineItemGroup,
  setDefineVariable,
  setDefineSearchTerm,
  setDefineScrollPosition,
  resetDefineUi,
  setReloadRequested,
} = uiSlice.actions;

export default uiSlice.reducer;
