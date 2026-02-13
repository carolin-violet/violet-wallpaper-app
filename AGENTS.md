## 项目介绍
这是一个壁纸软件，当前主要有两大模块：手机壁纸、头像壁纸

## 技术栈

- Node.js 22.21.1
- React 19.1.0
- React Native 0.81.5
- Expo ~54 (expo、expo-router、expo-constants、expo-font、expo-image、expo-linking、expo-splash-screen、expo-status-bar、expo-system-ui、expo-web-browser 等)
- TypeScript ~5.9.2
- React Navigation 7 (@react-navigation/native、@react-navigation/bottom-tabs、@react-navigation/elements)
- react-native-reanimated ~4.1.1
- react-native-gesture-handler ~2.28.0
- react-native-screens ~4.16.0
- react-native-safe-area-context ~5.6.0
- react-native-web ~0.21.0
- @expo/vector-icons ^15.0.3
- ESLint ^9.25.0、eslint-config-expo ~10.0.0

### 开发环境

- Windows 11 / Powershell

### 构建与运行（pnpm）

- 默认使用 pnpm 进行依赖安装与运行
- 安装依赖: `pnpm install`
- 启动开发: `pnpm start`（Expo 开发服务器）
- 可选: `pnpm run android`、`pnpm run ios`、`pnpm run web`
- 代码检查: `pnpm run lint`

## 编码指南

- 代码遵循现代化的 React + TypeScript 开发最佳实践
- 避免冗余注释，确保代码自解释性
- 尽量使用较新的依赖版本，避免使用过时的库，不要使用任何废弃的接口
- 除非明确要求，代码编写不需要考虑兼容性，也不要保留无用代码，但是可以提醒注意潜在的兼容性问题
- 遇到问题不要试图绕过或者使用回退方案，要么解决问题要么报告问题

### React 组件规范

- 组件文件使用 PascalCase 命名，例如 `UserProfile.vue`
- 组合式函数使用 `use` 前缀，例如 `useUserData.ts`

### 样式规范

- 全局样式和主题变量定义在 `src/styles/` 目录
- 遵循 Element-Plus 的设计规范和主题变量
- 整体样式要求简约清新

### 状态管理规范


### API 调用规范

- API 请求模块放在 `src/api/` 目录
- 使用 Axios 进行 HTTP 请求

## 对话回复规则与工作流指令

- 每次回答都请查询参考vercel-react-native-skills技能
- 所有涉及页面样式相关的功能都参考frontend-design技能

### 基本设置

- 语言设置: 必须且仅使用 **简体中文** 进行回复

### 工作流规范

- 步骤 1: **提供计划 (Plan First)** - 收到需求后，必须**仅**输出详细修改计划（包含理解、改动文件、逻辑），**严禁在此步骤包含任何代码实现**。输出计划后必须**停止生成**，等待用户批准。
- 步骤 2: 执行修改 - 只有在收到用户明确“批准”后，才开始编写和输出代码。
- 步骤 3: 输出总结 (Summary) - 修改完成后，明确列出修改文件及核心逻辑。

### 代码与注释规范

- 代码风格: 保持简洁，避免过度设计
- 依赖管理: 优先使用系统原生库，严禁引入非必要第三方依赖
- 注释限制:
  - 严禁删除或修改用户未要求的注释
  - 严禁添加无意义废话注释
  - 新增的方法和参数，必须增加注释，注释必须使用中文

### 绝对禁令

- 严禁在修改完成后自动创建测试代码或验证步骤
- **严禁跳过“步骤 1”直接输出代码，第一轮回复必须是纯文本计划**
