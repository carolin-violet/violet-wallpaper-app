## Violet Wallpaper App

基于 Expo 构建的手机壁纸应用，提供手机壁纸与头像壁纸浏览体验，支持多端开发与现代 React Native 技术栈。

---

## 应用结构与路由

应用使用 `expo-router` + 原生 Tab 导航（`app/(tabs)/_layout.tsx`）组织页面：

- **底部 Tab**
  - **首页 (`app/(tabs)/index.tsx`)**
    - 欢迎页与示例组件（`ParallaxScrollView`、`HelloWave` 等）
    - 推荐入口、开发提示（如何重置模板、如何打开 DevTools）
  - **手机壁纸 (`app/(tabs)/mobile-wallpaper.tsx`)**
    - 用于展示手机纵向壁纸列表（可扩展为网络数据 / 本地资源）
  - **头像壁纸 (`app/(tabs)/avatar-wallpaper.tsx`)**
    - 用于展示头像 / 方形壁纸列表（可扩展为分类、搜索、收藏等）

- **根布局**
  - `app/_layout.tsx`：配置 `ThemeProvider`、栈导航与全局 `StatusBar`
  - 通过 `unstable_settings.anchor = '(tabs)'` 将 Tab 作为根锚点

> 推荐在实现业务前，先运行 `pnpm run reset-project`（或对应脚本）清理模板代码，再按实际业务重构 `app/(tabs)` 目录。

---

## 快速开始（开发者向）

项目默认使用 **pnpm** 管理依赖，EAS 云构建也基于 pnpm，请不要再提交 `package-lock.json`，只保留 `pnpm-lock.yaml`，否则可能触发「多锁文件」类检查错误。

1. **安装依赖**

   ```bash
   pnpm install
   ```

2. **启动开发服务器**

   ```bash
   pnpm start
   ```

   便捷脚本（来自 `package.json`）：

   ```bash
   pnpm run android  # 启动 Android 模拟器 / 设备
   pnpm run ios      # 启动 iOS 模拟器（仅 macOS）
   pnpm run web      # 启动 Web 版本
   ```

3. **运行与调试**
   - [开发构建](https://docs.expo.dev/develop/development-builds/introduction/)
   - [Android 模拟器](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS 模拟器](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go)：扫描终端中的二维码在真机预览

---

## 依赖与 SDK 一致性检查

项目使用 Expo SDK 54，并在 `package.json` 中预置了常用检查脚本，建议在安装或升级依赖后执行一次：

| 命令                     | 说明                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| `pnpm run doctor`        | 运行 `expo-doctor`，检查依赖版本、锁文件、配置是否与当前 SDK 匹配 |
| `pnpm run install:check` | 运行 `expo install --check`，仅检查各包版本是否符合 SDK 推荐版本  |

如果 `expo-doctor` 报依赖版本不匹配，可使用：

```bash
npx expo install --fix
```

根据 Expo SDK 推荐版本自动修正依赖。

---

## 打包与发布（EAS Build）

构建前请先登录 EAS：

```bash
eas login
```

`eas.json` 中已配置基于 Node `22.21.1` 与 pnpm `9.15.0` 的统一构建基线：

| Profile     | 命令                                                 | 平台    | 输出格式 | 用途                |
| ----------- | ---------------------------------------------------- | ------- | -------- | ------------------- |
| development | `eas build --platform android --profile development` | Android | 内部调试 | 开发客户端 / 内测   |
| preview     | `eas build --platform android --profile preview`     | Android | AAB      | 预发布 / 内部发布   |
| production  | `eas build --platform android --profile production`  | Android | AAB      | 上架 Google Play    |
| preview-apk | `eas build --platform android --profile preview-apk` | Android | APK      | 线下内测 / 直接安装 |

- `production` / `preview-apk` Profile 中会注入 `APP_ENV=production`。
- 构建时通常配合 `.env.production` 使用，按需在其中配置 API 域名、埋点等运行时常量。
- 使用 EAS 云端构建时，**建议开启梯子并启用 tun 模式**，否则可能因网络受限导致构建失败或极慢。

### EAS 中使用 pnpm

本项目在 `eas.json` 的 `build.base` 中显式指定了 pnpm 版本，EAS 云端会使用 pnpm 安装依赖：

- 仓库中 **只保留 `pnpm-lock.yaml`**；
- 如果存在历史遗留的 `package-lock.json`，请删除后提交一次，否则 EAS 可能 fallback 到 npm；
- 本地开发也建议统一使用 pnpm，避免依赖树不一致。

> 如果只需要一个用于本地安装调试的 APK，而不想依赖 EAS，可参考下文「本地构建可安装 APK」章节。

---

## 本地构建可安装 APK（不依赖 EAS）

在联网受限或仅需要一个调试用 APK 文件时，可以通过 **prebuild + Gradle** 在本机直接构建 APK，而不走 EAS 云端。

### 方式一：`expo run:android` 一键构建并安装

适合日常开发联调：

```bash
pnpm exec expo run:android
```

- 首次运行会自动执行 `expo prebuild` 生成 `android/` 原生工程；
- 然后使用 Gradle 构建一个 **debug 开发包**，并自动安装、启动到已连接的设备 / 模拟器；
- 这一方式的目标是「跑起来」，APK 文件仍然会生成在 `android/app/build/outputs/apk/debug/`，但不会特别提示。

如果自动启动模拟器超时，可以先手动打开 AVD，或改用下面的方式二。

### 方式二：手动 prebuild + Gradle 打 Debug APK (推荐)

当你明确希望拿到一个 **可拷贝 / 可分发的调试 APK 文件** 时，推荐使用此方式。

1. **生成原生 Android 工程（如已存在 `android/` 可视情况跳过）**

   ```bash
   pnpm exec expo prebuild --platform android
   # 或
   npx expo prebuild --platform android
   ```

   - 成功后，项目根目录会出现一个 `android/` 目录；
   - 若修改了 `app.json` / Expo 配置，需重新执行以同步到原生工程。

2. **进入 `android/` 目录，用 Gradle 打 Debug 包**

   在 Windows（PowerShell / CMD）中：

   ```bash
   cd android
   .\gradlew.bat assembleDebug
   ```

   在 macOS / Linux 中：

   ```bash
   cd android
   ./gradlew assembleDebug
   ```

   构建成功后，控制台会输出 `BUILD SUCCESSFUL`。

需要注意: 本地构建时，**建议开启梯子并启用 tun 模式**，否则可能因网络受限导致gradle构建失败。

3. **查找并安装 APK**

   默认输出路径为：

   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

   - 这是一个 **debug 签名的 APK**，可以直接拷贝到手机安装；
   - 也可以使用 ADB 安装（需已连接设备并配置好 Android SDK）：

   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

### 注意事项

- 本地构建需要安装 Android Studio / Android SDK，并确保命令行下 `adb devices` 能正常列出设备；
- `prebuild` 之后，项目将包含原生工程，升级 Expo SDK 或修改配置时请参考官方文档，谨慎手动更改 `android/`；
- 本地 Debug APK 仅用于开发调试，不适合作为商店上架包，**正式发布仍优先推荐使用上文的 EAS Build 流程**。

---

## 项目结构（开发视角）

核心目录与文件示例（仅列出与路由 / UI / 配置强相关的部分）：

- `app/`
  - `_layout.tsx`：根栈导航、主题（`ThemeProvider`）、`StatusBar` 配置
  - `(tabs)/_layout.tsx`：底部 Tab 布局，配置 `首页 / 手机壁纸 / 头像壁纸` 三个 Tab
  - `(tabs)/index.tsx`：首页示例页（`ParallaxScrollView`、`HelloWave` 等）
  - `(tabs)/mobile-wallpaper.tsx`：手机壁纸列表页（待按业务实现）
  - `(tabs)/avatar-wallpaper.tsx`：头像壁纸列表页（待按业务实现）

- `components/`
  - `parallax-scroll-view.tsx`：带视差效果的滚动容器
  - `themed-text.tsx` / `themed-view.tsx`：支持明暗主题的基础组件
  - `haptic-tab.tsx`：Tab 点击震动反馈封装
  - `ui/icon-symbol.tsx`：图标封装，统一使用 SF Symbols / Material Icons 等

- `constants/`
  - `theme.ts`：主题颜色、字体等设计系统常量

- `hooks/`
  - `use-color-scheme.ts`：封装系统明暗主题获取逻辑

- `scripts/`
  - `reset-project.js`：清理模板代码 / 重置项目结构的脚本

> 具体目录和文件可根据后续业务演进调整，建议保持 UI 组件（`components`）、主题常量（`constants`）、业务页面（`app`）三层清晰分层。

---

## 技术栈

- **运行环境**
  - Node.js `22.21.1`
  - pnpm `9.15.0`

- **核心框架**
  - React `19.1.0`
  - React Native `0.81.5`
  - Expo `~54.0.32`
  - expo-router `~6.0.22`（基于文件系统的路由 + 原生导航）

- **导航与 UI**
  - `@react-navigation/native`、`@react-navigation/bottom-tabs`、`@react-navigation/elements`
  - `react-native-safe-area-context`、`react-native-screens`
  - `@expo/vector-icons` 图标

- **动画与交互**
  - `react-native-reanimated ~4.1.1`
  - `react-native-gesture-handler ~2.28.0`
  - `expo-haptics`（触觉反馈）

- **系统与工具**
  - `expo-image`：高性能图片组件（建议在壁纸列表中统一使用）
  - `expo-constants`、`expo-linking`、`expo-splash-screen`、`expo-status-bar`、`expo-system-ui`、`expo-web-browser`

- **开发工具**
  - TypeScript `~5.9.2`
  - ESLint `^9.25.0` + `eslint-config-expo ~10.0.0`
  - `expo-doctor` / `expo install --check`（依赖健康检查）

---

## 可扩展方向（建议）

- 壁纸数据接入
  - 对接远程 API，按分类 / 标签 / 主题加载壁纸列表
  - 引入分页 / 瀑布流布局提升浏览体验
- 交互与个性化
  - 收藏 / 历史浏览记录
  - 一键设置系统壁纸（需原生能力或三方 SDK）
  - 按分辨率 / 设备型号自动推荐合适尺寸
- 性能与体验
  - 列表使用 `expo-image` + 缓存策略优化滚动性能
  - 使用 `react-native-reanimated` 做小型动效（Tab 交互、预览进入过渡等）

---

## 更多文档

- [Expo 文档](https://docs.expo.dev/)
- [Expo Router 文档](https://docs.expo.dev/router/introduction/)
- [React Native 文档](https://reactnative.dev/docs/getting-started)
