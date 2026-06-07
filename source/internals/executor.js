const { spawn } = require('child_process');
const fs = require('fs');

function elapsedTime(startTime) {
  const precision = 0;
  const elapsed = process.hrtime(startTime)[1] / 1000000;
  const secondCount = process.hrtime(startTime)[0];
  const millisecondCount = elapsed.toFixed(precision);

  if (secondCount > 0) return `${secondCount}s`;
  return `${millisecondCount}ms`;
}

async function executeTask(task) {
  if (task.onlyDarwin && process.platform !== 'darwin') {
    console.log(`ℹ️  SKIPPED: "${task.name}" (only runs on macOS)`);
    return '';
  }

  if (task.runCondition && !task.runCondition()) {
    console.log(`ℹ️  SKIPPED: "${task.name}" (run condition not met)`);
    return '';
  }

  if (task.cwd && !fs.existsSync(task.cwd)) {
    console.log(
      `ℹ️  SKIPPED: "${task.name}" (Directory ${task.cwd} does not exist)`
    );
    return '';
  }

  const startTime = process.hrtime();
  console.log(`\nℹ️  STARTED: "${task.name}"`);

  if (typeof task.run === 'function') {
    try {
      await task.run();
    } catch (err) {
      if (task.ignoreError) {
        console.log(
          `⚠️  WARNING: "${task.name}" failed: ${err.message}. Ignoring error.`
        );
        console.log(
          `✅ FINISHED: "${
            task.name
          }" task has finished running in ${elapsedTime(startTime)}.`
        );
        return '';
      }
      throw new Error(`\n\nTask "${task.name}" \nError: ${err.message}.\n\n`, {
        cause: err
      });
    }
    console.log(
      `✅ FINISHED: "${task.name}" task has finished running in ${elapsedTime(
        startTime
      )}.`
    );
    return '';
  }

  const spawnOptions = { shell: true };
  if (task.cwd) {
    spawnOptions.cwd = task.cwd;
  }

  let spawnedTask;
  try {
    spawnedTask = spawn(task.command, task.args, spawnOptions);
  } catch (err) {
    if (task.ignoreError) {
      console.log(
        `⚠️  WARNING: "${task.name}" failed to start: ${err.message}. Ignoring error.`
      );
      console.log(
        `✅ FINISHED: "${task.name}" task has finished running in ${elapsedTime(
          startTime
        )}.`
      );
      return '';
    }
    throw new Error(`\n\nTask "${task.name}" \nError: ${err.message}.\n\n`, {
      cause: err
    });
  }

  let data = '';
  let error = '';
  const iteratorPromises = [];

  if (spawnedTask.stdout) {
    if (typeof spawnedTask.stdout.on === 'function') {
      spawnedTask.stdout.on('data', (chunk) => {
        data += chunk;
        process.stdout.write(chunk);
      });
    } else if (spawnedTask.stdout[Symbol.asyncIterator]) {
      iteratorPromises.push(
        (async () => {
          try {
            for await (const chunk of spawnedTask.stdout) {
              data += chunk;
            }
          } catch {
            // Ignore
          }
        })()
      );
    }
  }

  if (spawnedTask.stderr) {
    if (typeof spawnedTask.stderr.on === 'function') {
      spawnedTask.stderr.on('data', (chunk) => {
        error += chunk;
        process.stderr.write(chunk);
      });
    } else if (spawnedTask.stderr[Symbol.asyncIterator]) {
      iteratorPromises.push(
        (async () => {
          try {
            for await (const chunk of spawnedTask.stderr) {
              error += chunk;
            }
          } catch {
            // Ignore
          }
        })()
      );
    }
  }

  await Promise.all(iteratorPromises);

  const exitCode = await new Promise((resolve) => {
    spawnedTask.on('close', resolve);
    spawnedTask.on('error', () => resolve(1));
  });

  if (exitCode) {
    if (task.ignoreError) {
      console.log(
        `⚠️  WARNING: "${task.name}" exited with code ${exitCode}. Ignoring error.`
      );
    } else {
      throw new Error(
        `\n\nTask "${task.name}" \nError: ${error}. \nExit code: ${exitCode}\n\n`
      );
    }
  }

  console.log(
    `✅ FINISHED: "${task.name}" task has finished running in ${elapsedTime(
      startTime
    )}.`
  );
  return data;
}

module.exports = {
  executeTask
};
