import React, { useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { createAppTheme } from '@renderer/theme';
import Main from '@components/Main';
import Snackbar from '@components/Snackbar';
import Modal from '@components/Modal';
import store from '@redux/store';
import AppContext from '@utils/AppContext';
import AppContextProvider from '@utils/AppContextProvider';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { dehydrateState, safeLoadState } from '@redux/stateUtils';
import {
  closeAllModals,
  openModal,
  setPathname,
  openSnackbar,
} from '@redux/slices/ui';
import { applyDdeProgress } from '@redux/slices/dde';
import { modals, paths } from '@/misc/constants';
import DragAndDrop from '@components/DragAndDrop';
import { DdeProgressEvent, IUiSnackbar } from '@interfaces/common';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    store.dispatch(closeAllModals());
    store.dispatch(setPathname({ pathname: paths.STEP1 }));
    store.dispatch(
      openModal({
        type: modals.ERROR,
        data: { message: error.stack || 'Unknown error' },
      }),
    );
    this.setState({ hasError: false });
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;
    if (hasError) {
      return null;
    }
    return children;
  }
}

const AppWithContext: React.FC = () => {
  // Get the store from the context
  const { apiService } = React.useContext(AppContext);
  const dispatch = useAppDispatch();
  const listenersRegistered = React.useRef({
    saveStore: false,
    snackbar: false,
    ddeProgress: false,
  });

  const disableUiAnimation = useAppSelector(
    (state) => state.settings.other.disableUiAnimation,
  );

  const themePalette = useAppSelector(
    (state) => state.settings.other.themePalette,
  );

  const compactMode = useAppSelector(
    (state) => state.settings.other.compactMode,
  );

  const theme = useMemo(
    () =>
      createAppTheme({
        compactMode,
        disableUiAnimation,
        themePalette,
      }),
    [disableUiAnimation, themePalette, compactMode],
  );

  useEffect(() => {
    // At app startup load the saved state
    const loadStore = async () => {
      const { reduxStore } = await apiService.loadLocalStore();
      const safeStore = safeLoadState(reduxStore);
      dispatch({ type: 'LOAD_STATE', payload: { store: safeStore } });
    };
    loadStore();
  }, [apiService, dispatch]);

  // Register the save store listener
  useEffect(() => {
    if (listenersRegistered.current.saveStore) {
      return;
    }

    listenersRegistered.current.saveStore = true;
    window.electron.onSaveStore(async () => {
      const state = dehydrateState(store.getState());
      if (state) {
        await apiService.saveLocalStore({ reduxStore: state });
      }
    });
  }, [apiService]);

  // Register snackbar listener, for reporting errors from the main process
  useEffect(() => {
    if (listenersRegistered.current.snackbar) {
      return;
    }

    listenersRegistered.current.snackbar = true;
    window.electron.onSnackbarMessage((data: IUiSnackbar) => {
      dispatch(openSnackbar(data));
    });
  }, [dispatch]);

  useEffect(() => {
    if (listenersRegistered.current.ddeProgress) {
      return undefined;
    }

    listenersRegistered.current.ddeProgress = true;
    const unsubscribe = window.electron.onDdeProgress(
      (event: DdeProgressEvent) => {
        dispatch(applyDdeProgress(event));
      },
    );

    return unsubscribe;
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <DragAndDrop>
          <Main />
          <Snackbar />
          <Modal />
        </DragAndDrop>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <AppContextProvider>
      <Provider store={store}>
        <AppWithContext />
      </Provider>
    </AppContextProvider>
  );
};

export default App;
