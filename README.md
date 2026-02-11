# violet-wallpaper-app

手机壁纸软件应用，使用 [Expo](https://expo.dev) 构建。

## 快速开始

1. 安装依赖

   ```bash
   npm install
   ```

2. 启动开发服务器

   ```bash
   npm start
   ```

   或：

   ```bash
   npx expo start
   ```

3. 运行应用
   - [开发构建](https://docs.expo.dev/develop/development-builds/introduction/)
   - [Android 模拟器](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS 模拟器](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go)：扫描二维码在真机预览

## 打包 (EAS Build)

需先登录：`eas login`

| Profile     | 命令                                                 | 输出格式 | 用途             |
| ----------- | ---------------------------------------------------- | -------- | ---------------- |
| production  | `eas build --platform android --profile production`  | AAB      | 上架 Google Play |
| preview-apk | `eas build --platform android --profile preview-apk` | APK      | 内测 / 直接安装  |

均使用 `.env.production` 环境变量。

## 技术栈

- React Native + Expo
- expo-router（路由）

## 更多资源

- [Expo 文档](https://docs.expo.dev/)
- [Expo 教程](https://docs.expo.dev/tutorial/introduction/)

## 可扩展项
