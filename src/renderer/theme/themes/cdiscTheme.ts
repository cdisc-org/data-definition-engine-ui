import { alpha } from '@mui/material/styles';
import type {
  Theme as MuiTheme,
  ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import type { ResolvedThemeMode } from '@interfaces/theme';
import { compositeOverBackground } from '@renderer/theme/themes/utils';

export const cdiscColors = {
  navy: '#144678',
  teal: '#a1d0ca',
  red: '#cb4544',
  gold: '#edaa00',
} as const;

const buildCdiscGrey = (mode: ResolvedThemeMode): Record<string, string> => {
  if (mode === 'dark') {
    return {
      50: '#0f1c2b',
      100: '#162638',
      200: '#1d3147',
      300: '#263c56',
      400: '#324a66',
      500: '#405a78',
      600: '#547090',
      700: '#6e89a8',
      800: '#93a9c2',
      900: '#c2d2e2',
      A100: '#2e8b6b',
      A200: '#1e8e89',
      A400: '#7c5cbf',
      A700: '#c99900',
    };
  }

  return {
    50: '#ffffff',
    100: '#f4f6f9',
    200: '#e8ecf1',
    300: '#d4dbe3',
    400: '#a9b5c2',
    500: '#7f8fa0',
    600: '#5f7285',
    700: '#45576a',
    800: '#2d3d4e',
    900: '#152638',
    A100: '#2e8b6b',
    A200: '#1e8e89',
    A400: '#7c5cbf',
    A700: '#c99900',
  };
};

const createCdiscPalette = (
  mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
  const isDarkMode = mode === 'dark';
  const themeGrey = buildCdiscGrey(mode);
  const primary = isDarkMode ? '#7fa8d0' : cdiscColors.navy;
  const secondary = isDarkMode ? '#7cccc4' : '#1e8e89';
  const info = isDarkMode ? '#7cc9e8' : '#4a90c2';
  const warning = isDarkMode ? '#ffc94d' : '#c98f00';
  const success = isDarkMode ? '#63c9b8' : '#2e8b6b';
  const error = isDarkMode ? '#e57373' : cdiscColors.red;
  const textPrimary = isDarkMode ? themeGrey[900] : themeGrey[900];
  const textSecondary = isDarkMode ? themeGrey[700] : themeGrey[600];
  const subtleSurface = isDarkMode ? themeGrey[200] : themeGrey[100];
  const chromeSurface = isDarkMode ? themeGrey[300] : themeGrey[200];
  const backgroundDefault = isDarkMode ? themeGrey[50] : themeGrey[50];
  const edgeColor = isDarkMode ? themeGrey[500] : themeGrey[400];

  return {
    primary: { main: primary },
    secondary: { main: secondary },
    info: { main: info },
    warning: { main: warning },
    success: { main: success },
    error: { main: error },
    divider: alpha(edgeColor, isDarkMode ? 0.42 : 0.24),
    grey: themeGrey,
    gradients: {
      tabStrip: isDarkMode
        ? 'radial-gradient(circle farthest-corner at bottom center, #1d3147, #0f1c2b)'
        : 'radial-gradient(circle farthest-corner at bottom center, #e8ecf1, #ffffff)',
    },
    table: {
      header: subtleSurface,
      headerTextColor: primary,
      rowNumber: subtleSurface,
      highlightedCell: compositeOverBackground(
        info,
        isDarkMode ? 0.28 : 0.16,
        backgroundDefault,
      ),
      annotatedCell: compositeOverBackground(
        warning,
        isDarkMode ? 0.24 : 0.16,
        backgroundDefault,
      ),
      annotatedBorder: compositeOverBackground(
        warning,
        isDarkMode ? 0.62 : 0.42,
        backgroundDefault,
      ),
      highlightedAnnotatedCell: compositeOverBackground(
        warning,
        isDarkMode ? 0.48 : 0.32,
        backgroundDefault,
      ),
      highlightedAnnotatedBorder: compositeOverBackground(
        warning,
        isDarkMode ? 0.72 : 0.52,
        backgroundDefault,
      ),
      pinShadow: alpha('#0b1420', isDarkMode ? 0.65 : 0.18),
      resizeHandle: alpha(edgeColor, isDarkMode ? 0.7 : 0.45),
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
      muted: alpha(textPrimary, 0.56),
    },
    background: {
      default: backgroundDefault,
      paper: backgroundDefault,
      subtle: subtleSurface,
      chrome: chromeSurface,
      toolbar: backgroundDefault,
    },
    scrollbar: {
      thumb: alpha(themeGrey[500], isDarkMode ? 0.82 : 0.56),
      track: alpha(edgeColor, isDarkMode ? 0.18 : 0.1),
    },
  };
};

export const buildCdiscPalette = (_theme: MuiTheme, mode: ResolvedThemeMode) =>
  createCdiscPalette(mode);
