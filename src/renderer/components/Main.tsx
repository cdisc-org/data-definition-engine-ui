import React, { useEffect } from 'react';
import { useColorScheme } from '@mui/material/styles';
import DefineXml from '@components/DefineXmlStylesheet';
import Toolpad from '@components/Toolpad';
import AppContext from '@utils/AppContext';
import { useAppSelector, useAppDispatch } from '@redux/hooks';
import {
  openSnackbar,
  setDefineFileId,
  setPathname,
  setZoomLevel,
} from '@redux/slices/ui';
import DdeStep1 from '@components/DdeStep1';
import DdeStep2 from '@components/DdeStep2';
import DdeStep3 from '@components/DdeStep3';
import { NewWindowProps } from '@interfaces/common';
import { paths } from '@/misc/constants';

const renderPage = (pathname: string): React.ReactElement | null => {
  if (pathname === paths.STEP1) {
    return <DdeStep1 />;
  }
  if (pathname === paths.STEP2) {
    return <DdeStep2 />;
  }
  if (pathname === paths.STEP3) {
    return <DdeStep3 />;
  }
  if (pathname === paths.DEFINEXML) {
    return <DefineXml />;
  }

  return null;
};

const Main: React.FC = () => {
  const title = 'Data Definition Engine';
  const dispatch = useAppDispatch();
  const { apiService } = React.useContext(AppContext);
  const pathname = useAppSelector((state) => state.ui.pathname);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  const { setMode } = useColorScheme();
  const colorMode = useAppSelector((state) => state.settings.other.colorMode);
  const currentZoom = useAppSelector((state) => state.ui.zoomLevel);

  useEffect(() => {
    if (colorMode) {
      setMode(colorMode);
    }
  }, [colorMode, setMode]);

  useEffect(() => {
    const handleMainKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      switch (event.key) {
        case 'F1':
          dispatch(setPathname({ pathname: paths.STEP1 }));
          break;
        case 'F2':
          dispatch(setPathname({ pathname: paths.STEP2 }));
          break;
        case 'F3':
          dispatch(setPathname({ pathname: paths.STEP3 }));
          break;
        case 'F4':
          dispatch(setPathname({ pathname: paths.DEFINEXML }));
          break;
        case '/':
          event.preventDefault();
          setShortcutsOpen(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleMainKeyDown);

    return () => {
      window.removeEventListener('keydown', handleMainKeyDown);
    };
  }, [dispatch]);

  useEffect(() => {
    const handleZoom = async (event: WheelEvent | KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        (event instanceof WheelEvent ||
          ['+', '-', '=', '_', '0'].includes(event.key))
      ) {
        const zoomStep = 0.1;
        const minZoom = -5;
        const maxZoom = 3;

        let newZoom = currentZoom;
        if (event instanceof WheelEvent) {
          event.preventDefault();
          if (event.deltaY < 0) {
            newZoom = Math.min(currentZoom + zoomStep, maxZoom);
          } else {
            newZoom = Math.max(currentZoom - zoomStep, minZoom);
          }
        } else {
          switch (event.key) {
            case '+':
            case '=':
              event.preventDefault();
              newZoom = Math.min(currentZoom + zoomStep, maxZoom);
              break;
            case '-':
            case '_':
              event.preventDefault();
              newZoom = Math.max(currentZoom - zoomStep, minZoom);
              break;
            case '0':
              event.preventDefault();
              newZoom = 0;
              break;
            default:
              break;
          }
        }

        dispatch(setZoomLevel(newZoom));
      }
    };

    window.addEventListener('wheel', handleZoom, { passive: false });
    window.addEventListener('keydown', handleZoom);

    return () => {
      window.removeEventListener('wheel', handleZoom);
      window.removeEventListener('keydown', handleZoom);
    };
  }, [dispatch, currentZoom]);

  useEffect(() => {
    apiService.setZoom(currentZoom);
  }, [apiService, currentZoom]);

  useEffect(() => {
    const handleFileOpen = async (
      filePath: string,
      _newWindowProps?: NewWindowProps,
    ) => {
      const extension = filePath.split('.').pop();

      if (extension?.toLowerCase() !== 'xml') {
        dispatch(
          openSnackbar({
            type: 'error',
            message: 'Only Define-XML files can be opened directly.',
          }),
        );
        return;
      }

      const fileInfo = await apiService.openDefineXml(filePath);
      if (fileInfo === null) {
        return;
      }

      dispatch(setDefineFileId(fileInfo.fileId));
      dispatch(setPathname({ pathname: paths.DEFINEXML }));
    };

    apiService.onFileOpen(handleFileOpen);

    return () => {
      apiService.removeFileOpenListener();
    };
  }, [apiService, dispatch]);

  return (
    <Toolpad
      title={title}
      pathname={pathname}
      shortcutsOpen={shortcutsOpen}
      onOpenShortcuts={() => setShortcutsOpen(true)}
      onCloseShortcuts={() => setShortcutsOpen(false)}
    >
      {renderPage(pathname)}
    </Toolpad>
  );
};

export default Main;
