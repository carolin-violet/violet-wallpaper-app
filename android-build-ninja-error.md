## Android 构建报错：`ninja: error: manifest 'build.ninja' still dirty after 100 tries`

本文件记录在 **Windows 11 + pnpm + Expo + React Native** 环境下，本项目打包 Android 时遇到的 `ninja` / CMake 相关错误，以及对应的分析与解决方案，方便后续排查复用。

---

### 1. 问题现象

- **触发场景**
  - 执行 `expo prebuild` 或基于 prebuild 的 Gradle 构建（例如）：

```bash
pnpm exec expo prebuild --platform android
pnpm run android
```

- **典型报错关键字**
  - `Task :expo-modules-core:buildCMakeDebug[arm64-v8a] FAILED`
  - `Task :react-native-screens:buildCMakeDebug[arm64-v8a] FAILED`
  - `Task :react-native-worklets:buildCMakeDebug[arm64-v8a][worklets] FAILED`
  - `ninja: error: manifest 'build.ninja' still dirty after 100 tries`

- **CMake 警告特征**
  - 日志中反复出现类似警告（模块路径会有所不同）：

```text
CMake Warning in CMakeLists.txt:
  The object file directory
    D:/work/code/sener/violet-wallpaper-app/node_modules/.pnpm/...
  has 219 characters.  The maximum full path to an object file is 250
  characters (see CMAKE_OBJECT_PATH_MAX).  Object file
    D_/work/code/sener/violet-wallpaper-app/node_modules/.pnpm/...cpp.o
  cannot be safely placed under this directory.  The build may not work
  correctly.
```

---

### 2. 原因分析

- **核心原因：路径过长触发 CMake 限制**
  - CMake/`ninja` 对单个对象文件（`.o`）的**完整路径长度**有上限（`CMAKE_OBJECT_PATH_MAX`，默认为 250 字符左右）。
  - 在本项目中，路径结构大致为：
    - 项目根：`D:/work/code/sener/violet-wallpaper-app`
    - pnpm 结构：`node_modules/.pnpm/<包名@版本>_.../node_modules/<包名>/android/.cxx/Debug/.../arm64-v8a/...`
  - **Windows + 深层目录 + pnpm 的 `.pnpm/.../node_modules/...` 组合**，叠加后导致对象文件实际路径接近 / 超过 250 字符。

- **导致的直接效果**
  - CMake 一直在尝试重新生成 `build.ninja`，日志中不断出现：
    - `Re-running CMake...`
    - `-- Configuring done`
    - `-- Generating done`
  - `ninja` 发现 `build.ninja` 在构建过程中被 CMake 持续改写，重试 100 次后仍然认为 manifest「脏」：
    - `ninja: error: manifest 'build.ninja' still dirty after 100 tries`
  - 受影响模块包括但不限于：
    - `expo-modules-core`
    - `react-native-screens`
    - `react-native-worklets`

- **本质上是环境与路径问题，而非业务代码 Bug**
  - 这些模块本身在正常路径长度下可以正确构建。
  - 问题主要由 **Windows 文件路径长度限制 + pnpm 目录结构** 共同触发。

---

### 3. 解决方案（建议优先级）

#### 3.1 方案一：缩短项目根路径（推荐）

- **思路**
  - 把项目从较长路径（例如 `D:\work\code\sener\violet-wallpaper-app`）移动到一个**更短的目录**，从整体上缩短后续所有子路径。

- **操作步骤（示例）**

1. 在磁盘根目录创建一个更短的目录，例如：

   ```powershell
   # 手动操作：用资源管理器或 PowerShell 创建目录
   mkdir D:\vw
   ```

2. 将当前项目整个文件夹移动到该目录下，例如：

   ```text
   D:\vw\violet-wallpaper-app
   ```

3. 在新路径下重新安装依赖并构建：

   ```powershell
   cd D:\vw\violet-wallpaper-app
   pnpm install
   pnpm exec expo prebuild --platform android
   pnpm run android
   ```

- **优点**
  - 不修改任何业务代码和配置文件。
  - 对团队其他成员也友好，只需clone后放在短路径即可。

- **注意事项**
  - 移动目录后，IDE / 终端的打开路径需要更新。
  - 如果有本地绝对路径配置（例如某些外部工具），也需要同步调整。

---

#### 3.2 方案二：本地构建使用 npm / yarn 扁平安装（绕过 pnpm 深层 `.pnpm` 结构）

- **思路**
  - 问题的另一大来源是 pnpm 的 `.pnpm/<包>@版本_.../node_modules/<包>` 深层结构。
  - 可以在本机构建阶段**暂时不用 pnpm 安装依赖**，而改用 npm / yarn 生成扁平结构的 `node_modules`，从而显著缩短路径。
  - 仓库中仍然保留 `pnpm-lock.yaml`，线上 / EAS 仍可使用 pnpm。

- **操作步骤（仅用于本地构建）**

1. 删除当前的 `node_modules`：

   ```powershell
   cd <项目根目录>
   rm -r node_modules
   ```

2. 使用 `npm` 或 `yarn` 安装依赖（择一）：

   ```powershell
   # 使用 npm
   npm install

   # 或使用 yarn（需要已启用 corepack）
   # corepack enable
   # yarn install
   ```

3. 再执行 prebuild 与构建：

   ```powershell
   npx expo prebuild --platform android
   npm run android
   # 或使用对应的 yarn 脚本
   ```

- **优点**
  - 不需要移动项目目录。
  - 适合只在自己本机打 Android 包的场景。

- **注意事项**
  - 本地依赖树会与 pnpm 安装略有差异，建议在切换包管理器时注意不要把 `package-lock.json` / `yarn.lock` 提交到仓库（项目主锁文件仍为 `pnpm-lock.yaml`）。
  - 若需回到 pnpm，重新删除 `node_modules` 并执行 `pnpm install` 即可。

---

#### 3.3 方案三：继续使用 pnpm，但使用 hoisted 模式缩短路径（进阶，可选）

- **思路**
  - pnpm 默认的 `node-linker` 会使用 `.pnpm` 目录 + 二级 `node_modules` 结构，路径会比较长。
  - 可以通过配置 `node-linker=hoisted`，让依赖安装结构更扁平，缩短路径深度，从而降低触发 `CMAKE_OBJECT_PATH_MAX` 的风险。

- **说明**
  - 该方案需要在团队层面统一 pnpm 配置。
  - 具体配置方式和潜在影响（如与现有脚本、工具的兼容性）需要额外评估，此处不设为默认方案。

---

#### 3.4 辅助方案：清理 Android 原生工程与锁定目录占用问题

在排查本问题过程中，还曾遇到 `expo prebuild` 无法删除 `android/` 目录的情况：

```text
× Failed to delete android code: EBUSY: resource busy or locked, rmdir 'D:\...\android'
Error: EBUSY: resource busy or locked, rmdir 'D:\...\android'
```

这通常意味着 `android/` 目录正被以下进程占用：

- Android Studio / Gradle 后台构建；
- 打开的终端正在 `android/` 目录中；
- 资源管理器窗口正在浏览 `android/`；
- 杀毒软件或同步盘正在扫描该目录。

**处理建议：**

1. 关闭可能占用 `android/` 目录的工具：
   - 关闭 Android Studio 或停止当前 Gradle 构建。
   - 关闭所有在 `android/` 目录下的终端。
   - 关闭资源管理器中该目录的窗口。

2. 手动删除 `android/` 目录：

   ```powershell
   cd <项目根目录>
   rmdir android /S /Q
   ```

3. 重新执行 prebuild：

   ```powershell
   pnpm exec expo prebuild --platform android
   ```

该步骤可以确保 `android/` 原生工程是由当前 Expo 配置重新“干净生成”的，避免历史残留配置与最新依赖不匹配进一步放大构建问题。

---

### 4. 总结与经验

- **问题本质**：在 Windows 上，项目根路径 + pnpm 的 `.pnpm/.../node_modules/...` 结构过长，导致 CMake 生成的对象文件路径超过 `CMAKE_OBJECT_PATH_MAX`，从而引发 `build.ninja` 反复重写、`ninja` 报 manifest dirty 错误。
- **优先建议**：
  - 尽量将项目放在较短的磁盘路径下（如 `D:\vw\...`），减少整条路径的长度。
  - 如果需要在本机频繁打 Android 包，可以考虑在本机构建阶段使用 npm / yarn 扁平安装依赖。
- **团队使用建议**：
  - 新成员 clone 项目时，建议避免使用过深的嵌套目录（例如 `C:\Users\<user>\Documents\...` 多级目录），优先使用短路径。
  - 如再次遇到 `Re-running CMake...` + `ninja: error: manifest 'build.ninja' still dirty after 100 tries`，优先检查：
    - CMake 是否输出了路径长度相关警告；
    - 当前项目根路径和包管理器结构是否过深。

通过以上措施，可以在不修改业务代码的前提下，大幅降低在 Windows 环境下构建 Android 原生模块时踩到此类 `ninja`/CMake 限制的概率。

