import DdeManager from '@main/managers/ddeManager';

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
});
