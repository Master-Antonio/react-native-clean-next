const fs = require('fs');
const { rmDir } = require('../source/internals/tasks');

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    rmSync: jest.fn()
  };
});

describe('rmDir with retries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete directory successfully on the first try', () => {
    fs.existsSync.mockReturnValue(true);
    fs.rmSync.mockReturnValue(undefined);

    rmDir('test-dir');

    expect(fs.existsSync).toHaveBeenCalledWith('test-dir');
    expect(fs.rmSync).toHaveBeenCalledTimes(1);
    expect(fs.rmSync).toHaveBeenCalledWith('test-dir', {
      recursive: true,
      force: true
    });
  });

  it('should retry deleting on ENOTEMPTY and then succeed', () => {
    fs.existsSync.mockReturnValue(true);
    let calls = 0;
    fs.rmSync.mockImplementation(() => {
      calls++;
      if (calls === 1) {
        const error = new Error('Directory not empty');
        error.code = 'ENOTEMPTY';
        throw error;
      }
    });

    const startTime = Date.now();
    rmDir('test-dir');
    const duration = Date.now() - startTime;

    expect(fs.rmSync).toHaveBeenCalledTimes(2);
    expect(duration).toBeGreaterThanOrEqual(100);
  });

  it('should retry up to 5 times and then throw if it keeps failing', () => {
    fs.existsSync.mockReturnValue(true);
    fs.rmSync.mockImplementation(() => {
      const error = new Error('Directory not empty');
      error.code = 'ENOTEMPTY';
      throw error;
    });

    expect(() => rmDir('test-dir')).toThrow('Directory not empty');
    expect(fs.rmSync).toHaveBeenCalledTimes(6); // 1 initial + 5 retries = 6 times
  });

  it('should not retry on non-transient errors', () => {
    fs.existsSync.mockReturnValue(true);
    fs.rmSync.mockImplementation(() => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      throw error;
    });

    expect(() => rmDir('test-dir')).toThrow('ENOENT');
    expect(fs.rmSync).toHaveBeenCalledTimes(1);
  });
});
