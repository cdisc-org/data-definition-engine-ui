import DdeManager from '@main/managers/ddeManager';
import { DdeRuntimePaths } from '@interfaces/common';

describe('DdeManager', () => {
  it('returns an error when the bundled script is missing', async () => {
    const manager = new DdeManager({ resourcesPath: '/tmp/missing-assets' });
    const send = jest.fn();
    const event = { sender: { send } } as unknown as Parameters<
      DdeManager['runStep']
    >[0];

    const result = await manager.runStep(event, {
      id: 'run-1',
      step: 'step1',
      args: [],
    });

    expect(result).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('Bundled DDE script not found'),
      }),
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('uses the workspace virtual environment python interpreter', () => {
    const manager = new DdeManager({ resourcesPath: '/tmp/assets' });

    const pythonCommand = (
      manager as unknown as { getPythonCommand: () => string }
    ).getPythonCommand();

    expect(pythonCommand).toContain('.venv');
    expect(pythonCommand).toContain('python');
  });

  it('uses configured runtime paths for scripts and virtualenv', () => {
    const manager = new DdeManager({ resourcesPath: '/tmp/assets' });
    const runtimePaths: DdeRuntimePaths = {
      ddeScriptsPath: '/tmp/custom-dde',
      pythonVenvPath: '/tmp/custom-venv',
    };

    const scriptPath = (
      manager as unknown as {
        getScriptPath: (
          step: 'step1' | 'step2' | 'step3',
          runtimePaths?: DdeRuntimePaths,
        ) => string;
      }
    ).getScriptPath('step1', runtimePaths);

    const pythonCommand = (
      manager as unknown as {
        getPythonCommand: (
          env?: Record<string, string | undefined>,
          runtimePaths?: DdeRuntimePaths,
        ) => string;
      }
    ).getPythonCommand(undefined, runtimePaths);

    expect(scriptPath).toContain(
      '/tmp/custom-dde/define-xml/create_define_json.py',
    );
    expect(pythonCommand).toContain('/tmp/custom-venv');
    expect(pythonCommand).toContain('python');
  });
});
