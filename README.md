# Data Definition Engine UI

This Electron application packages a narrow UI around the CDISC Data Definition Engine workflow:

- Step 1: generate a DDS JSON template from a USDM JSON file and create a patch file.
- Step 2: apply the patch file (manually edited by the user) and refresh the DDS JSON template.
- Step 3: generate Define-XML from the DDS JSON template.
- Result: render the generated Define-XML with the bundled stylesheet viewer.

## Bundle engine

The UI relies on upstream DDE sources under these paths:

- `assets/dde/define-xml`
- `assets/dde/generator`

Copy these files from the current `cdisc-org/data-definition-engine` repository.

## Python prerequisites

The app runs the bundled Python scripts from `assets/dde` by spawning the host Python executable.

- Python `3.8+`
- A working `python3` on macOS/Linux or `python` on Windows
- Optional override via persisted setting `settings.other.pythonCommand`

Install the required Python packages before running Step 1 or Step 2:

```bash
pip install -r assets/dde/define-xml/requirements.txt
pip install -r assets/dde/generator/requirements.txt
```

The app pre-flight check verifies these imports:

- `cdisc_library_client`
- `jmespath`
- `odmlib`
- `defineutils`
- `yaml`
- `dotenv`

## CDISC Library access

Step 1 may require a CDISC Library API key depending on the selected workflow inputs.

- Provide it in the Step 1 screen.
- The app forwards it to the Python process as both `--cdisc_api_key` and `CDISC_API_KEY`.

## Development

```bash
npm install
npx tsc --noEmit
npm test
npm run lint
npm run start
```