# 🧼 React Native Clean Next

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-clean-next">
    <img src="https://badge.fury.io/js/react-native-clean-next.svg" alt="npm version" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/Master-Antonio/react-native-clean-next.svg" alt="License" />
  </a>
  <a href="https://github.com/Master-Antonio/react-native-clean-next/issues">
    <img src="https://img.shields.io/github/issues/Master-Antonio/react-native-clean-next.svg" alt="GitHub issues" />
  </a>
  <a href="https://github.com/Master-Antonio/react-native-clean-next/actions/workflows/nodejs.yml">
    <img src="https://github.com/Master-Antonio/react-native-clean-next/actions/workflows/nodejs.yml/badge.svg" alt="Node CI" />
  </a>
</p>

---

Cleans your React Native project by purging caches and modules, and reinstalling them again.

> 📢 **Maintenance Notice**
>
> This repository is actively maintained and updated by **Antonio Romeo Riga**. It is based on the original project by **Pedro Madruga** (discontinued/inactive since 2023).

---

## 📥 Installation

Install this package as a development dependency:

### Using npm

```bash
npm install --save-dev react-native-clean-next
```

### Using yarn

```bash
yarn add -D react-native-clean-next
```

### Using pnpm

```bash
pnpm add -D react-native-clean-next
```

---

## 🚀 Running

You can run this package either as an integrated React Native CLI plugin (interactive or automated) or directly using `npx`.

### 1. React Native CLI Plugin (Recommended)

This module is automatically detected by the standard React Native CLI, adding new sub-commands:

- **Interactive Project Clean** (Prompted configuration):
  ```bash
  npx react-native clean-next
  ```
- **Fully Automated Project Clean** (Cleans everything to a fresh state without prompts):
  ```bash
  npx react-native clean-next-auto
  ```

### 2. Direct CLI Execution

For advanced use cases, run the CLI directly to bypass questions and pass flags:

```bash
npx react-native-clean-next [options]
```

#### Package Script Integration

Add the script to your `package.json`:

```json
"scripts": {
  "clean": "react-native-clean-next"
}
```

Then run it with:

```bash
npm run clean
# or
yarn clean
# or
pnpm clean
```

---

## 🛠️ Cleaning Steps & Flags

This library groups together commands recommended in the React Native documentation alongside other common workspace cleanups.

| State Type                | Action / Command (Cross-Platform)                | In Auto Mode? | Optional? | Default? | Option Flag                    |
| :------------------------ | :----------------------------------------------- | :-----------: | :-------: | :------: | :----------------------------- |
| **React-native cache**    | Purges temp `react-*` caches                     |    **Yes**    |    No     |  `true`  | _(always runs)_                |
| **Metro bundler cache**   | Purges temp `metro-*` caches                     |    **Yes**    |    No     |  `true`  | _(always runs)_                |
| **Reset Metro cache**     | Starts Metro with `--reset-cache` and terminates |    **Yes**    |    Yes    |  `true`  | `--keep-metro-cache`           |
| **Watchman cache**        | `watchman watch-del-all`                         |    **Yes**    |    No     |  `true`  | _(always runs)_                |
| **NPM modules**           | Deletes `node_modules` & temp caches             |    **Yes**    |    Yes    |  `true`  | `--keep-node-modules`          |
| **Yarn cache**            | `yarn cache clean` (if `yarn.lock`)              |    **Yes**    |    Yes    |  `true`  | `--keep-node-modules`          |
| **Yarn packages**         | `yarn install` (if `yarn.lock`)                  |    **Yes**    |    Yes    |  `true`  | `--keep-node-modules`          |
| **PNPM cache**            | `pnpm store prune` (if `pnpm-lock.yaml`)         |    **Yes**    |    Yes    |  `true`  | `--keep-node-modules`          |
| **PNPM packages**         | `pnpm install` (if `pnpm-lock.yaml`)             |    **Yes**    |    Yes    |  `true`  | `--keep-node-modules`          |
| **Bun cache**             | `bun pm cache clean` (if `bun.lock`/`bun.lockb`) |    **Yes**    |    Yes    |  `true`  | `--keep-node-modules`          |
| **Bun packages**          | `bun install` (if `bun.lock`/`bun.lockb`)        |    **Yes**    |    Yes    |  `true`  | `--keep-node-modules`          |
| **NPM cache**             | `npm cache verify`                               |    **Yes**    |    Yes    |  `true`  | `--keep-node-modules`          |
| **NPM Install**           | `npm ci` (if `package-lock.json`)                |    **Yes**    |    Yes    |  `true`  | `--keep-node-modules`          |
| **iOS build folder**      | Deletes `ios/build` (Xcode cleanups)             |    **Yes**    |    Yes    | `false`  | `--remove-iOS-build`           |
| **iOS pods folder**       | Deletes `ios/Pods` folder                        |    **Yes**    |    Yes    | `false`  | `--remove-iOS-pods`            |
| **System iOS pods cache** | `pod cache clean --all`                          |    **Yes**    |    Yes    |  `true`  | `--keep-system-iOS-pods-cache` |
| **User iOS pods cache**   | Deletes `~/.cocoapods` directory                 |    **Yes**    |    Yes    |  `true`  | `--keep-user-iOS-pods-cache`   |
| **Android build folder**  | Deletes `android/build` folder                   |    **Yes**    |    Yes    | `false`  | `--remove-android-build`       |
| **Android clean project** | `gradlew clean` (in `android/` dir)              |    **Yes**    |    Yes    | `false`  | `--clean-android-project`      |
| **System Gradle cache**   | Wipes `~/.gradle/caches` directory               |    **Yes**    |    Yes    | `false`  | `--remove-system-gradle-cache` |
| **Brew package**          | `brew update && brew upgrade`                    |    **No**     |    Yes    |  `true`  | `--keep-brew`                  |
| **Pod packages**          | `pod update`                                     |    **No**     |    Yes    |  `true`  | `--keep-pods`                  |

### Usage Example:

```bash
npx react-native-clean-next --remove-iOS-build --clean-android-project
```

---

## 💻 OS & Platform Compatibility

This library is fully compatible with **macOS, Linux, and Windows**:

- **Filesystem Operations**: All folder deletions (such as `node_modules`, `android/build`, `ios/build`, `ios/Pods`, temp caches, and cocoapods directories) are performed natively using Node's `fs` APIs. This avoids compatibility bugs associated with shell commands like `rm -rf` on Windows.
- **Command Translation**: Scripts specific to certain operating systems (e.g. `./gradlew` vs `gradlew.bat`) are resolved automatically based on `process.platform`.
- **Graceful Degradation**: External toolchain tasks (like CocoaPods or Homebrew) check if the tool is installed first and ignore execution errors gracefully.

---

> [!TIP]
> You can also reset the Metro bundler cache directly when starting Metro by running:
>
> ```bash
> npx react-native start --reset-cache
> ```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## ✍️ Authors & Maintainers

- **Antonio Romeo Riga** — Current Maintainer
- **Pedro Madruga** — Original Creator & Author

See also the list of [contributors](https://github.com/Master-Antonio/react-native-clean-next/graphs/contributors) who helped build and improve the project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
