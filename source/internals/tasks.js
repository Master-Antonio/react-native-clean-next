const fs = require('fs');
const path = require('path');
const os = require('os');

function rmDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    let retries = 5;
    while (true) {
      try {
        if (fs.rmSync) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        } else if (fs.rmdirSync) {
          fs.rmdirSync(dirPath, { recursive: true });
        } else {
          fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              rmDir(curPath);
            } else {
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(dirPath);
        }
        break;
      } catch (err) {
        const isTransient =
          err.code === 'ENOTEMPTY' ||
          err.code === 'EBUSY' ||
          err.code === 'EPERM' ||
          err.code === 'EACCES';
        if (isTransient && retries > 0) {
          retries--;
          try {
            const sharedBuffer = new SharedArrayBuffer(4);
            const sharedArray = new Int32Array(sharedBuffer);
            Atomics.wait(sharedArray, 0, 0, 100);
          } catch {
            const limit = Date.now() + 100;
            while (Date.now() < limit) {
              // noop
            }
          }
        } else {
          throw err;
        }
      }
    }
  }
}

function cleanTempCaches() {
  const tempDir = os.tmpdir();
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      if (file.startsWith('react-') || file.startsWith('metro-')) {
        rmDir(path.join(tempDir, file));
      }
    }
  }
}

const tasks = {
  wipeiOSBuildFolder: {
    name: 'wipe iOS build artifacts',
    run: async () => {
      rmDir('ios/build');
      if (process.platform === 'darwin') {
        const { spawnSync } = require('child_process');
        spawnSync('killall Xcode || true', { shell: true });
        spawnSync('xcrun -k', { shell: true });
        if (fs.existsSync('ios')) {
          spawnSync('xcodebuild -alltargets clean', {
            cwd: 'ios',
            shell: true
          });
        }
        const getconf = spawnSync('getconf DARWIN_USER_CACHE_DIR', {
          shell: true
        });
        if (getconf.status === 0) {
          const cacheDir = getconf.stdout.toString().trim();
          rmDir(path.join(cacheDir, 'org.llvm.clang/ModuleCache'));
          const whoami = spawnSync('whoami', { shell: true })
            .stdout.toString()
            .trim();
          rmDir(path.join(cacheDir, `org.llvm.clang.${whoami}/ModuleCache`));
        }
        rmDir(path.join(os.homedir(), 'Library/Developer/Xcode/DerivedData'));
        rmDir(path.join(os.homedir(), 'Library/Caches/com.apple.dt.Xcode'));
      }
    }
  },
  wipeiOSPodsFolder: {
    name: 'wipe iOS Pods folder',
    run: () => rmDir('ios/Pods')
  },
  wipeSystemiOSPodsCache: {
    name: 'wipe system iOS Pods cache',
    command: 'bundle',
    args: ['exec', 'pod', 'cache', 'clean', '--all'],
    cwd: 'ios',
    ignoreError: true
  },
  wipeUseriOSPodsCache: {
    name: 'wipe user iOS Pods cache',
    run: () => rmDir(path.join(os.homedir(), '.cocoapods'))
  },
  updatePods: {
    name: 'update iOS Pods',
    command: 'pod',
    args: ['update'],
    cwd: 'ios',
    ignoreError: true
  },
  wipeAndroidBuildFolder: {
    name: 'wipe android build folder',
    run: () => rmDir('android/build')
  },
  cleanAndroidProject: {
    name: 'clean android project',
    command: process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
    args: ['clean'],
    cwd: 'android',
    ignoreError: true
  },
  wipeSystemGradleCache: {
    name: 'wipe system gradle cache',
    ignoreError: true,
    run: () => {
      if (fs.existsSync('android')) {
        const { spawnSync } = require('child_process');
        const cmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
        spawnSync(cmd, ['--stop'], { cwd: 'android', shell: true });
      }
      rmDir(path.join(os.homedir(), '.gradle', 'caches'));
    }
  },
  watchmanCacheClear: {
    name: 'watchman cache clear (if watchman is installed)',
    command: 'watchman',
    args: ['watch-del-all'],
    ignoreError: true
  },
  wipeTempCaches: {
    name: 'wipe temporary caches',
    run: () => cleanTempCaches()
  },
  brewUpdate: {
    name: 'brew update',
    command: 'brew',
    args: ['update'],
    ignoreError: true
  },
  brewUpgrade: {
    name: 'brew upgrade',
    command: 'brew',
    args: ['upgrade'],
    ignoreError: true
  },
  wipeNodeModules: {
    name: 'wipe node_modules',
    run: () => {
      rmDir('node_modules');
      cleanTempCaches();
    }
  },
  yarnCacheClean: {
    name: 'yarn cache clean (if yarn is installed)',
    command: 'yarn',
    args: ['cache', 'clean'],
    ignoreError: true,
    runCondition: () => fs.existsSync('yarn.lock')
  },
  yarnInstall: {
    name: 'yarn install (if yarn is installed)',
    command: 'yarn',
    args: ['install'],
    ignoreError: true,
    runCondition: () => fs.existsSync('yarn.lock')
  },
  npmCacheVerify: {
    name: 'npm cache verify',
    command: 'npm',
    args: ['cache', 'verify']
  },
  npmInstall: {
    name: 'npm ci',
    command: 'npm',
    args: ['ci'],
    ignoreError: true,
    runCondition: () => fs.existsSync('package-lock.json')
  },
  pnpmStorePrune: {
    name: 'pnpm store prune (if pnpm is installed)',
    command: 'pnpm',
    args: ['store', 'prune'],
    ignoreError: true,
    runCondition: () => fs.existsSync('pnpm-lock.yaml')
  },
  pnpmInstall: {
    name: 'pnpm install (if pnpm is installed)',
    command: 'pnpm',
    args: ['install', '--frozen-lockfile'],
    ignoreError: true,
    runCondition: () => fs.existsSync('pnpm-lock.yaml')
  },
  bunCacheClean: {
    name: 'bun cache clean (if bun is installed)',
    command: 'bun',
    args: ['pm', 'cache', 'clean'],
    ignoreError: true,
    runCondition: () => fs.existsSync('bun.lockb') || fs.existsSync('bun.lock')
  },
  bunInstall: {
    name: 'bun install (if bun is installed)',
    command: 'bun',
    args: ['install', '--frozen-lockfile'],
    ignoreError: true,
    runCondition: () => fs.existsSync('bun.lockb') || fs.existsSync('bun.lock')
  },
  resetMetroCache: {
    name: 'reset Metro bundler cache',
    run: () =>
      new Promise((resolve) => {
        const { spawn } = require('child_process');
        const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        const child = spawn(cmd, ['react-native', 'start', '--reset-cache'], {
          shell: true,
          stdio: 'ignore'
        });

        const timer = setTimeout(() => {
          if (child.pid) {
            if (process.platform === 'win32') {
              const { execSync } = require('child_process');
              try {
                execSync(`taskkill /pid ${child.pid} /f /t`);
              } catch {
                // Ignore
              }
            } else {
              child.kill('SIGTERM');
            }
          }
          resolve();
        }, 5000);

        child.on('close', () => {
          clearTimeout(timer);
          resolve();
        });

        child.on('error', (err) => {
          clearTimeout(timer);
          console.warn(
            `⚠️  WARNING: Metro cache reset failed to start: ${err.message}`
          );
          resolve();
        });
      })
  }
};

const autoTasks = [
  tasks.wipeiOSBuildFolder,
  tasks.wipeiOSPodsFolder,
  tasks.wipeSystemiOSPodsCache,
  tasks.wipeUseriOSPodsCache,
  tasks.wipeAndroidBuildFolder,
  tasks.watchmanCacheClear,
  tasks.wipeTempCaches,
  tasks.wipeSystemGradleCache,
  tasks.cleanAndroidProject,
  tasks.wipeNodeModules,
  tasks.yarnCacheClean,
  tasks.pnpmStorePrune,
  tasks.bunCacheClean,
  tasks.npmCacheVerify,
  tasks.npmInstall,
  tasks.yarnInstall,
  tasks.pnpmInstall,
  tasks.bunInstall,
  tasks.resetMetroCache
];

module.exports = {
  tasks,
  autoTasks,
  rmDir
};
