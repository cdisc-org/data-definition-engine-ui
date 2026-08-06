import React from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  Box,
  Typography,
  Drawer,
  IconButton,
  Divider,
} from '@mui/material';

const styles = {
  drawer: {
    zIndex: 9001,
  },
  paper: {
    minWidth: '500px',
  },
  category: {
    fontWeight: 'bold',
    fontSize: '14pt',
  },
  shortcut: {
    fontWeight: 'bold',
    backgroundColor: 'grey.200',
  },
  headerTitle: {
    marginLeft: 1,
    color: 'white',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '0 8px',
    backgroundColor: 'primary.main',
  },
};

const shortcuts = {
  General: {
    'Ctrl + F1': 'Open Step 1',
    'Ctrl + F2': 'Open Step 2',
    'Ctrl + F3': 'Open Step 3',
    'Ctrl + F4': 'Open Result',
    'Ctrl + /': 'Open Shortcuts',
    'Ctrl + Scroll/+/-': 'Zoom In/Out',
    'Ctrl + 0': 'Reset Zoom',
    Escape: 'Escape/Cancel/Close',
  },
  Result: {
    'Ctrl + F': 'Focus Define-XML search',
    Enter: 'Find next match',
    'Shift + Enter': 'Find previous match',
  },
};

const Shortcuts: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={styles.drawer}
      slotProps={{ paper: { sx: styles.paper } }}
      anchor="right"
    >
      <Box tabIndex={0} role="button">
        <Box sx={styles.drawerHeader}>
          <IconButton onClick={onClose}>
            <ChevronRightIcon />
          </IconButton>
          <Typography variant="h6" sx={styles.headerTitle}>
            Shortcuts
          </Typography>
        </Box>
        <Divider />
        <Table>
          <TableBody>
            {Object.keys(shortcuts).map((category) => {
              return (
                <React.Fragment key={category}>
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Typography variant="h6">{category}</Typography>
                    </TableCell>
                  </TableRow>
                  {Object.keys(shortcuts[category]).map((shortcut) => {
                    return (
                      <TableRow key={shortcut}>
                        <TableCell sx={styles.shortcut}>{shortcut}</TableCell>
                        <TableCell>{shortcuts[category][shortcut]}</TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Drawer>
  );
};

export default Shortcuts;
