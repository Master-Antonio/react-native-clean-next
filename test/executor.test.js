const { executeTask } = require('../source/internals/executor');
const spawnMock = require('child_process').spawn;

jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

describe('executeTask', () => {
  let originalPlatform;

  beforeAll(() => {
    originalPlatform = process.platform;
  });

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip tasks marked as onlyDarwin when on non-darwin platform', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    });

    const task = {
      name: 'Darwin Only Task',
      onlyDarwin: true,
      command: 'echo'
    };

    const result = await executeTask(task);
    expect(result).toEqual('');
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('should run tasks marked as onlyDarwin when on darwin platform', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin'
    });

    const mockSpawned = {
      stdout: {
        [Symbol.asyncIterator]: async function* () {
          yield 'output';
        }
      },
      stderr: {
        [Symbol.asyncIterator]: async function* () {
          yield '';
        }
      },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          callback(0);
        }
      })
    };

    spawnMock.mockReturnValue(mockSpawned);

    const task = {
      name: 'Darwin Only Task',
      onlyDarwin: true,
      command: 'echo',
      args: ['hello']
    };

    const result = await executeTask(task);
    expect(result).toEqual('output');
    expect(spawnMock).toHaveBeenCalledWith('echo', ['hello'], { shell: true });
  });

  it('should skip tasks when runCondition returns false', async () => {
    const task = {
      name: 'Conditional Task',
      command: 'echo',
      runCondition: () => false
    };

    const result = await executeTask(task);
    expect(result).toEqual('');
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('should skip tasks when cwd directory does not exist', async () => {
    const task = {
      name: 'Cwd Task',
      command: 'echo',
      cwd: 'nonexistent-directory-name-123456'
    };

    const result = await executeTask(task);
    expect(result).toEqual('');
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('should execute task.run if it is a function', async () => {
    const runMock = jest.fn().mockResolvedValue('success');
    const task = {
      name: 'JS Runner Task',
      run: runMock
    };

    await executeTask(task);
    expect(runMock).toHaveBeenCalled();
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('should ignore error when ignoreError is true', async () => {
    const runMock = jest.fn().mockRejectedValue(new Error('forced failure'));
    const task = {
      name: 'Failed JS Task',
      run: runMock,
      ignoreError: true
    };

    await expect(executeTask(task)).resolves.not.toThrow();
  });
});
