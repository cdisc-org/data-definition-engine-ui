import { IpcMainInvokeEvent } from 'electron';
import { ChildProcessWithoutNullStreams, execFile, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { DdeRunRequest, PythonCheckResult } from '@interfaces/common';

interface DdeManagerOptions {
  resourcesPath: string;
}

interface RunningProcess {
  child: ChildProcessWithoutNullStreams;
  stopRequested: boolean;
}

class DdeManager {
  private readonly resourcesPath: string;

  private readonly runningProcesses = new Map<string, RunningProcess>();

  constructor({ resourcesPath }: DdeManagerOptions) {
    this.resourcesPath = resourcesPath;
  }

  private getPythonCommand(env?: Record<string, string | undefined>) {
    if (env?.DDE_PYTHON_EXE) {
      return env.DDE_PYTHON_EXE;
    }
    return process.platform === 'win32' ? 'python' : 'python3';
  }

  private getScriptPath(step: DdeRunRequest['step']) {
    if (step === 'step1' || step === 'step2') {
      return path.join(
        this.resourcesPath,
        'dde',
        'define-xml',
        'create_define_json.py',
      );
    }

    return path.join(
      this.resourcesPath,
      'dde',
      'generator',
      'define',
      'define_generator.py',
    );
  }

  private getOutputPath(request: DdeRunRequest) {
    if (request.step === 'step1' || request.step === 'step2') {
      const outputIndex = request.args.indexOf('--output_template');
      return outputIndex >= 0 ? request.args[outputIndex + 1] : undefined;
    }

    const defineIndex = request.args.indexOf('-d');
    return defineIndex >= 0 ? request.args[defineIndex + 1] : undefined;
  }

  public runStep = async (
    event: IpcMainInvokeEvent,
    request: DdeRunRequest,
  ): Promise<{ started: boolean } | { error: string }> => {
    const scriptPath = this.getScriptPath(request.step);
    if (!fs.existsSync(scriptPath)) {
      return { error: `Bundled DDE script not found: ${scriptPath}` };
    }

    const pythonCommand = this.getPythonCommand(request.env);
    const outputPath = this.getOutputPath(request);
    const definePath = request.step === 'step3' ? outputPath : undefined;
    const child = spawn(pythonCommand, [scriptPath, ...request.args], {
      cwd: path.dirname(scriptPath),
      env: {
        ...process.env,
        ...request.env,
        CDISC_API_KEY: request.env?.CDISC_API_KEY || process.env.CDISC_API_KEY,
      },
    });

    this.runningProcesses.set(request.id, {
      child,
      stopRequested: false,
    });

    event.sender.send('renderer:ddeProgress', {
      id: request.id,
      step: request.step,
      status: 'starting',
    });

    const forwardOutput = (stream: NodeJS.ReadableStream) => {
      const lineReader = readline.createInterface({ input: stream });
      lineReader.on('line', (line) => {
        event.sender.send('renderer:ddeProgress', {
          id: request.id,
          step: request.step,
          status: 'running',
          line,
        });
      });
    };

    forwardOutput(child.stdout);
    forwardOutput(child.stderr);

    child.on('error', (error) => {
      this.runningProcesses.delete(request.id);
      event.sender.send('renderer:ddeProgress', {
        id: request.id,
        step: request.step,
        status: 'error',
        error: error.message,
        outputPath,
        definePath,
      });
    });

    child.on('exit', (exitCode) => {
      const current = this.runningProcesses.get(request.id);
      this.runningProcesses.delete(request.id);
      const status =
        current?.stopRequested === true
          ? 'stopped'
          : exitCode === 0
            ? 'done'
            : 'error';

      event.sender.send('renderer:ddeProgress', {
        id: request.id,
        step: request.step,
        status,
        exitCode,
        outputPath,
        definePath,
        error:
          status === 'error'
            ? `Process exited with code ${exitCode}`
            : undefined,
      });
    });

    return { started: true };
  };

  public stopStep = async (
    _event: IpcMainInvokeEvent,
    id: string,
  ): Promise<boolean> => {
    const current = this.runningProcesses.get(id);
    if (!current) {
      return false;
    }

    current.stopRequested = true;
    return current.child.kill();
  };

  public checkPython = async (): Promise<PythonCheckResult> => {
    const pythonCommand = this.getPythonCommand();
    const modules = [
      'cdisc_library_client',
      'jmespath',
      'odmlib',
      'defineutils',
      'yaml',
      'dotenv',
    ];

    const script = [
      'import importlib.util, sys',
      `mods = ${JSON.stringify(modules)}`,
      'missing = [name for name in mods if importlib.util.find_spec(name) is None]',
      'print(sys.version.split()[0])',
      'print("|".join(missing))',
    ].join('; ');

    return new Promise((resolve) => {
      execFile(pythonCommand, ['-c', script], (error, stdout, stderr) => {
        if (error) {
          resolve({
            ok: false,
            pythonCommand,
            version: null,
            missingModules: [],
            error: stderr.trim() || error.message,
          });
          return;
        }

        const [versionLine = '', missingLine = ''] = stdout
          .trim()
          .split(/\r?\n/);
        const missingModules = missingLine
          ? missingLine.split('|').filter(Boolean)
          : [];

        resolve({
          ok: missingModules.length === 0,
          pythonCommand,
          version: versionLine || null,
          missingModules,
          error: null,
        });
      });
    });
  };
}

export default DdeManager;
