/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import { clipboard, IpcMainInvokeEvent } from 'electron';
import path from 'path';

const resolveHtmlPath = (htmlFileName: string) => {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
};

const writeToClipboard = (_event: IpcMainInvokeEvent, text: string) => {
  clipboard.writeText(text);
  return true;
};

// Parse command line arguments
const parseArgs = (
  args: string[],
  isPackaged: boolean,
): {
  filePath: string | null;
  compareFiles: { path1: string; path2: string } | null;
  disableGpu: boolean | null;
  userDataDir: string | null;
} => {
  const startIdx = isPackaged ? 1 : 2;
  const optionArgIdxs: number[] = [];
  let filePath: string | null = null;
  let compareFiles: { path1: string; path2: string } | null = null;
  let userDataDir: string | null = null;
  let disableGpu: boolean | null = null;

  // Check for --disable-gpu
  const disableGpuIdx = args.indexOf('--disable-gpu');
  if (disableGpuIdx !== -1) {
    optionArgIdxs.push(disableGpuIdx);
    disableGpu = true;
  }

  // Check for --user-data-dir
  const userDataIdx = args.findIndex(
    (a) => a.startsWith('--user-data-dir=') || a === '--user-data-dir',
  );
  if (userDataIdx !== -1) {
    optionArgIdxs.push(userDataIdx);
    const arg = args[userDataIdx];
    const eqIdx = arg.indexOf('=');
    if (eqIdx !== -1) {
      userDataDir = arg.slice(eqIdx + 1);
    } else if (args.length > userDataIdx + 1) {
      optionArgIdxs.push(userDataIdx + 1);
      userDataDir = args[userDataIdx + 1];
    }
  }

  // Check for --compare
  const compareIndex = args.indexOf('--compare');
  if (compareIndex !== -1 && args.length > compareIndex + 2) {
    optionArgIdxs.push(compareIndex);
    // Skip parameter arguments
    for (
      let i = compareIndex + 1;
      i < args.length && compareFiles === null;
      i++
    ) {
      // Skip parameter arguments
      if (
        !args[i].startsWith('-') &&
        args[i + 1] &&
        !args[i + 1].startsWith('-') &&
        !optionArgIdxs.includes(i) &&
        !optionArgIdxs.includes(i + 1)
      ) {
        compareFiles = {
          path1: args[i],
          path2: args[i + 1],
        };
      }
    }
  } else if (args.length > startIdx) {
    for (let i = startIdx; i < args.length && filePath === null; i++) {
      // Skip parameter arguments
      if (!args[i].startsWith('-') && !optionArgIdxs.includes(i)) {
        filePath = args[i];
      }
    }
  }

  return { filePath, compareFiles, disableGpu, userDataDir };
};

export { writeToClipboard, resolveHtmlPath, parseArgs };
