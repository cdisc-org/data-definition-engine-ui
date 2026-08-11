import React from 'react';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  SvgIcon,
  Toolbar,
  Typography,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { useAppTheme } from '@renderer/theme';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HealingIcon from '@mui/icons-material/Healing';
import DescriptionIcon from '@mui/icons-material/Description';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import { AllowedPathnames } from '@interfaces/common';
import { paths } from '@/misc/constants';
import { useAppDispatch } from '@redux/hooks';
import { setPathname } from '@redux/slices/ui';
import { clearDdeRun } from '@redux/slices/dde';
import DefineToolbar from '@components/Toolbars/DefineToolbar';
import ToolbarActions from '@components/ToolbarActions';
import Shortcuts from '@components/Shortcuts';

type NavigationEntry =
  | {
      id: string;
      kind: 'header';
      title: string;
    }
  | {
      id: string;
      kind: 'divider';
    }
  | {
      id: string;
      kind: 'item';
      title: string;
      icon: React.ReactNode;
      pathname?: AllowedPathnames;
      action?: 'shortcuts';
    };

interface ToolpadProps {
  title: string;
  pathname: AllowedPathnames;
  shortcutsOpen: boolean;
  onOpenShortcuts: () => void;
  onCloseShortcuts: () => void;
  children: React.ReactNode;
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: 'background.default',
  },
  main: {
    display: 'flex',
    flex: '1 1 0%',
    overflow: 'auto',
    flexDirection: 'column',
  },
  logo: {
    width: 32,
    height: 32,
    marginTop: '3px',
    ml: 1,
    color: 'grey.700',
    borderRadius: 1,
    p: 0.5,
  },
  drawerList: {
    py: 0,
  },
  drawerHeader: {
    height: 40,
    color: 'text.secondary',
    whiteSpace: 'nowrap',
    fontWeight: 700,
    fontSize: 12,
  },
  brandTitle: {
    fontWeight: 700,
    whiteSpace: 'nowrap',
    color: 'primary.main',
  },
  genericTitle: {
    pl: 2,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  appBar: (theme: Theme, navigationWidth: number) => ({
    width: '100%',
    ml: `${navigationWidth}px`,
    backgroundColor: 'background.toolbar',
    color: 'text.primary',
    borderBottom: '1px solid',
    borderColor: 'divider',
    boxShadow: 'none',
    transition: theme.transitions.create(['width', 'margin'], {
      duration: theme.transitions.duration.standard,
    }),
    zIndex: theme.zIndex.drawer + 1,
  }),
  toolbar: {
    gap: 2,
    pl: 1.5,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  },
  actionsBox: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  drawer: (theme: Theme, navigationWidth: number) => ({
    width: navigationWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: navigationWidth,
      boxSizing: 'border-box',
      overflowX: 'hidden',
      backgroundColor: 'background.toolbar',
      borderRight: '1px solid',
      borderColor: 'divider',
      transition: theme.transitions.create('width', {
        duration: theme.transitions.duration.standard,
      }),
    },
  }),
  listItemButton: (appBarExpanded: boolean, selected: boolean) => ({
    minHeight: 48,
    justifyContent: appBarExpanded ? 'initial' : 'center',
    px: appBarExpanded ? 2 : 1.5,
    mx: 1,
    borderRadius: 1.5,
    '& .MuiListItemIcon-root': {
      color: selected ? 'primary.main' : 'text.secondary',
    },
    '& .MuiListItemText-primary': {
      fontWeight: selected ? 600 : 500,
    },
  }),
  listItemIcon: (appBarExpanded: boolean, selected: boolean) => ({
    minWidth: 0,
    mr: appBarExpanded ? 2 : 0,
    justifyContent: 'center',
    '& .MuiSvgIcon-root': {
      color: selected ? 'primary.main' : 'grey.600',
    },
  }),
  listItemText: (appBarExpanded: boolean, selected: boolean) => ({
    opacity: appBarExpanded ? 1 : 0,
    whiteSpace: 'nowrap',
    fontWeight: selected ? 600 : 400,
    color: selected ? 'primary.main' : 'grey.800',
  }),
  mainContainer: {
    flex: '1 1 0%',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  divider: {
    mt: 1,
    mx: 1,
    borderWidth: '0 0 2px',
  },
  menuIcon: {
    color: 'grey.600',
  },
};

const NAVIGATION: NavigationEntry[] = [
  {
    id: 'step1',
    kind: 'item',
    pathname: paths.STEP1,
    title: 'Step 1',
    icon: <UploadFileIcon />,
  },
  {
    id: 'step2',
    kind: 'item',
    pathname: paths.STEP2,
    title: 'Step 2',
    icon: <HealingIcon />,
  },
  {
    id: 'step3',
    kind: 'item',
    pathname: paths.STEP3,
    title: 'Step 3',
    icon: <SportsScoreIcon />,
  },
  {
    id: 'result',
    kind: 'item',
    pathname: paths.DEFINEXML,
    title: 'Result',
    icon: <DescriptionIcon />,
  },
];

const Logo: React.FC = () => {
  const dots = [
    { color: '#144678', cx: 8, cy: 8 },
    { color: '#cb4544', cx: 20, cy: 8 },
    { color: '#edaa00', cx: 8, cy: 20 },
    { color: '#a1d0ca', cx: 20, cy: 20 },
  ];

  return (
    <SvgIcon sx={styles.logo} viewBox="0 0 28 28">
      {dots.map((dot) => (
        <circle
          key={dot.color}
          cx={dot.cx}
          cy={dot.cy}
          r={4.5}
          fill={dot.color}
        />
      ))}
    </SvgIcon>
  );
};

const Toolpad: React.FC<ToolpadProps> = ({
  title,
  pathname,
  shortcutsOpen,
  onOpenShortcuts,
  onCloseShortcuts,
  children,
}) => {
  const theme = useAppTheme();
  const dispatch = useAppDispatch();

  const navigationWidth = theme.densitySettings.drawer.widthExpanded;

  const handleNavigationClick = (entry: NavigationEntry) => {
    if (entry.kind !== 'item') {
      return;
    }

    if (entry.action === 'shortcuts') {
      onOpenShortcuts();
      return;
    }

    if (entry.pathname) {
      if (
        entry.pathname === paths.STEP1 ||
        entry.pathname === paths.STEP2 ||
        entry.pathname === paths.STEP3
      ) {
        dispatch(clearDdeRun());
      }
      dispatch(setPathname({ pathname: entry.pathname }));
    }
  };

  const renderToolbar = () => {
    if (pathname === paths.DEFINEXML) {
      return <DefineToolbar />;
    }
    return null;
  };

  return (
    <Box sx={styles.root}>
      <AppBar position="fixed" sx={styles.appBar(theme, navigationWidth)}>
        <Toolbar sx={styles.toolbar}>
          <Box sx={styles.titleContainer}>
            <Logo />
            <Typography variant="h6" sx={styles.genericTitle} noWrap>
              {title}
            </Typography>
          </Box>
          {renderToolbar()}
          <Box sx={styles.actionsBox}>
            <ToolbarActions />
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={styles.drawer(theme, navigationWidth)}>
        <Toolbar />
        <List
          sx={styles.drawerList}
          subheader={
            <ListSubheader sx={styles.drawerHeader}>Workflow</ListSubheader>
          }
        >
          {NAVIGATION.map((entry) => {
            if (entry.kind === 'header') {
              return (
                <ListSubheader key={entry.id} sx={styles.drawerHeader}>
                  {entry.title}
                </ListSubheader>
              );
            }

            if (entry.kind === 'divider') {
              return <Divider key={entry.id} sx={styles.divider} />;
            }

            const isSelected = entry.pathname === pathname;

            return (
              <ListItemButton
                key={entry.id}
                selected={isSelected}
                onClick={() => handleNavigationClick(entry)}
                sx={styles.listItemButton(true, isSelected)}
              >
                <ListItemIcon sx={styles.listItemIcon(true, isSelected)}>
                  {entry.icon}
                </ListItemIcon>
                <ListItemText
                  primary={entry.title}
                  sx={styles.listItemText(true, isSelected)}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>
      <Box component="main" sx={styles.mainContainer}>
        <Toolbar />
        <Box
          sx={{
            ...styles.main,
            px: 2,
            py: 2,
          }}
        >
          {children}
        </Box>
      </Box>
      <Shortcuts open={shortcutsOpen} onClose={onCloseShortcuts} />
    </Box>
  );
};

export default Toolpad;
