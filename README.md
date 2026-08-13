# Data Definition Engine UI

This Electron application provides a desktop workflow for the CDISC Data Definition Engine.

## Workflow

1. Step 1: generate a DDS JSON template from a USDM file.
2. Step 2: apply a patch file and regenerate the template.
3. Step 3: generate Define-XML from the DDS JSON template.
4. Result: open the generated Define-XML in the embedded stylesheet viewer.

## Current capabilities

- Persistent UI state and workflow settings are saved locally between app restarts.
- Runtime paths can be configured for the bundled DDE scripts and Python virtual environment.
- Step 1 performs a Python environment check before the workflow starts.
- Each DDE execution logs the exact Python command used as the first line in the execution output.
- The generated Define-XML output can be opened deliberately from the UI instead of auto-opening.

## Project layout

- `src/main` — Electron main-process logic, IPC handlers, and DDE execution manager.
- `src/renderer` — React UI, Redux store, workflow steps, and styling.
- `assets/dde` — bundled DDE scripts and data files.
- `data` — example protocol and metadata assets.

## Runtime configuration

The app supports custom runtime paths for:

- DDE scripts directory
- Python virtual environment directory

These values are configured from the Step 1 runtime path fields and are passed into the Python manager for each execution.

## Python requirements

The app expects a working Python environment with the bundled DDE dependencies available.

Typical setup:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r assets/dde/define-xml/requirements.txt
```

The Step 1 preflight check verifies the configured Python executable and required modules before continuing.

## Development

```bash
npm install
npx tsc -p tsconfig.json --noEmit
npm run start
```

Optional checks:

```bash
npm test
npm run lint
```

## Packaging

```bash
npm run build
npm run package-linux
npm run package-mac
npm run package-win
```

The packaged app is built with Electron Builder and includes the bundled assets needed to run the DDE workflow.