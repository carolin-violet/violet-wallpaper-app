## Violet Wallpaper App

基于 Expo 构建的手机壁纸应用，提供手机壁纸与头像壁纸浏览体验，支持多端开发与现代 React Native 技术栈。

---

## 效果展示

<div align="center">
  <img src="docs/1.jpg" width="30%" />
  <img src="docs/2.jpg" width="30%" />
  <img src="docs/3.jpg" width="30%" />
</div>

## 快速开始

项目默认使用 **pnpm** 管理依赖，EAS 云构建也基于 pnpm。建议只保留 `pnpm-lock.yaml`，避免出现多锁文件导致检查失败。

1. **安装依赖**

   ```bash
   pnpm install
   ```

2. **启动开发服务器**

   ```bash
   pnpm start
   ```

3. **常用运行命令**

   ```bash
   pnpm run android
   pnpm run ios
   pnpm run web
   ```

---

## 文档

- [开发与构建指南（扩展）](docs/development-guide.md)：路由结构、依赖一致性检查、EAS 打包发布、本地构建 APK、项目结构等扩展说明

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

## 更多文档

- [Expo 文档](https://docs.expo.dev/)
- [Expo Router 文档](https://docs.expo.dev/router/introduction/)
- [React Native 文档](https://reactnative.dev/docs/getting-started)
