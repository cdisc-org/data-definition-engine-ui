import React, { useCallback } from 'react';
import { Tooltip, IconButton, Stack } from '@mui/material';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness6Icon from '@mui/icons-material/Brightness6';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { setZoomLevel } from '@redux/slices/ui';
import { toggleColorMode } from '@redux/slices/settings';
import { resetDdeState } from '@redux/slices/dde';
import { useAppDispatch, useAppSelector } from '@redux/hooks';

const styles = {
  main: {
    width: 'auto',
    justifyContent: 'flex-start',
    pr: 1,
  },
  iconColor: {
    color: 'grey.600',
  },
};

const ToolbarActions: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentZoomLevel = useAppSelector((state) => state.ui.zoomLevel);
  const colorMode = useAppSelector((state) => state.settings.other.colorMode);

  const handleResetZoom = useCallback(() => {
    dispatch(setZoomLevel(0));
  }, [dispatch]);

  const handleToggleTheme = useCallback(() => {
    dispatch(toggleColorMode());
  }, [dispatch]);

  const handleResetDdeState = useCallback(() => {
    dispatch(resetDdeState());
  }, [dispatch]);

  return (
    <Stack sx={styles.main} direction="row" spacing={1}>
      {currentZoomLevel !== 0 && (
        <Tooltip title="Reset Zoom" enterDelay={1000}>
          <IconButton onClick={handleResetZoom} id="resetZoom" size="small">
            <ZoomInMapIcon
              sx={{
                color: 'primary.main',
              }}
            />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Reset DDE settings" enterDelay={1000} placement="left">
        <IconButton
          onClick={handleResetDdeState}
          id="resetDdeState"
          size="small"
        >
          <RestartAltIcon sx={styles.iconColor} />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={`Change color mode to ${colorMode === 'dark' ? 'light' : colorMode === 'light' ? 'system' : 'dark'}`}
        enterDelay={1000}
        placement="left"
      >
        <IconButton onClick={handleToggleTheme}>
          {colorMode === 'dark' ? (
            <Brightness4Icon sx={styles.iconColor} />
          ) : colorMode === 'system' ? (
            <Brightness6Icon sx={styles.iconColor} />
          ) : (
            <Brightness7Icon sx={styles.iconColor} />
          )}
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default ToolbarActions;
