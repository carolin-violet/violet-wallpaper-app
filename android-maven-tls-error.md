## Android 构建报错：无法从 Google Maven 下载依赖（TLS 握手失败）

本文件记录在 **Windows 11 + Gradle 8.14.3 + Expo / React Native** 环境下，本项目执行 Android 构建时，Gradle 无法从 Google Maven 仓库下载依赖，出现 TLS 握手错误的情况，以及对应的分析与解决方案，方便后续排查复用。

---

### 1. 问题现象

- **触发场景**
  - 在 `android/` 目录下执行：

```bash
.\gradlew.bat assembleDebug
```

- **关键报错信息（节选）**

```text
Execution failed for task ':expo-constants:compileDebugKotlin'.
> Error while evaluating property 'friendPathsSet$kotlin_gradle_plugin_common' of task ':expo-constants:compileDebugKotlin'.
   > Could not resolve all files for configuration ':expo-constants:debugCompileClasspath'.
      > Failed to transform collection-1.0.0.jar (androidx.collection:collection:1.0.0) ...
         > Could not download collection-1.0.0.jar (androidx.collection:collection:1.0.0)
            > Could not get resource 'https://dl.google.com/dl/android/maven2/androidx/collection/collection/1.0.0/collection-1.0.0.jar'.
               > Could not GET 'https://dl.google.com/dl/android/maven2/androidx/collection/collection/1.0.0/collection-1.0.0.jar'.
                  > The server may not support the client's requested TLS protocol versions: (TLSv1.2, TLSv1.3).
                     > Remote host terminated the handshake
```

- **辅助信息**
  - 同时还会看到类似报错：
    - `Could not download annotation-1.0.0.jar (androidx.annotation:annotation:1.0.0)`
    - 目标地址均为 `https://dl.google.com/dl/android/maven2/...`

---

### 2. 原因分析

- **核心原因：Gradle 无法通过 TLS 与 Google Maven 仓库正常通信**
  - Gradle 需要从 `https://dl.google.com/dl/android/maven2` 下载 AndroidX 等依赖。
  - 在国内或受限网络环境中，直连 `dl.google.com` 可能：
    - 被墙 / 被中间设备拦截，TLS 握手直接失败；
    - 或被劫持到不支持 TLS1.2/1.3 的代理 / 中间人服务上。
  - 因此 Gradle 报出：
    - “The server may not support the client's requested TLS protocol versions: (TLSv1.2, TLSv1.3)”；
    - “Remote host terminated the handshake”。

- **补充说明：这不是代码或依赖版本问题**
  - 报错发生在 **下载 Jar 包阶段**，项目源码尚未参与编译。
  - 依赖坐标如 `androidx.collection:collection:1.0.0`、`androidx.annotation:annotation:1.0.0` 都是标准官方库，版本正常。
  - 问题本质是 **网络 / TLS 通信层面**，而非业务代码或 Gradle 脚本错误。

---

### 3. 解决方案整理

#### 3.1 方案一：使用可访问 Google Maven 的代理 / VPN（推荐）

- **思路**
  - 通过系统级 VPN / 代理，让 Gradle 能正常访问 `https://dl.google.com/dl/android/maven2/...`。
  - 这是最符合官方预期的用法，对 Gradle 配置改动最小。

- **建议做法**
  1. 启用 **系统级 VPN / 代理**，优先选择支持 TUN / TAP 模式的工具，使所有进程（包括 `java.exe` / `gradlew.bat`）都走代理。
  2. 测试浏览器是否能正常访问类似地址：

     ```text
     https://dl.google.com/dl/android/maven2/androidx/collection/collection/1.0.0/collection-1.0.0.jar
     ```

  3. 如有必要，在系统环境变量中配置：
     - `HTTP_PROXY` / `HTTPS_PROXY` 指向本地代理。

  4. 再次在 `android/` 目录运行：

     ```bash
     .\gradlew.bat clean
     .\gradlew.bat assembleDebug
     ```

- **优点**
  - 不需要修改任何 Gradle 脚本或仓库配置。
  - 适用于今后所有需要访问 Google / Maven 仓库的场景。

- **注意事项**
  - 需确保 VPN 对 Java / Gradle 同样生效，而不仅仅是浏览器。
  - 某些公司网络环境可能限制自带 VPN，需要遵守内网规范。

---

#### 3.2 方案二：为 Gradle 配置国内 Maven 镜像（例如阿里云镜像）

- **思路**
  - 使用国内 Maven 镜像代理 Google Maven 与 Maven Central，避免直连 `dl.google.com`。
  - 常见公开镜像例如：
    - `https://maven.aliyun.com/repository/google`
    - `https://maven.aliyun.com/repository/central`

- **配置思路（示意）**
  - 在 `android/settings.gradle` 中找到 `dependencyResolutionManagement { repositories { ... } }` 段，按照 **镜像在前，官方仓库在后** 的顺序配置：
    - 先添加阿里云等镜像；
    - 再保留 `google()`、`mavenCentral()` 作为兜底。
  - 若 `android/build.gradle` 中仍有 `allprojects { repositories { ... } }`，可做类似调整，保持仓库列表一致。

- **优点**
  - 在没有稳定梯子的情况下，常规可行方案。
  - 一次配置生效，后续所有依赖下载都会走国内镜像，速度也会更快。

- **注意事项**
  - 需要团队达成共识，确保所有人本地构建时使用相同的镜像配置。
  - 镜像站偶尔会与官方存在少量版本延迟，如遇极新版本依赖，可暂时回退到官方仓库。

---

#### 3.3 方案三：检查并关闭“拦截 TLS”的本地软件

- **思路**
  - 某些本地软件（如“网络加速器”、“HTTP 代理”、“杀毒 HTTPS 扫描”等）可能会以中间人方式拦截 TLS 流量：
    - 只支持 TLS1.0/1.1；
    - 或以非标准方式处理 TLS 握手。
  - 在这种情况下，即使网络看似“通了”，Gradle 仍然可能报 TLS 协议不匹配。

- **建议排查步骤**
  1. 临时关闭：
     - 第三方 HTTP/HTTPS 代理软件；
     - 开启了“HTTPS 扫描 / 证书替换”的杀毒软件或安全套件。
  2. 重新执行：

     ```bash
     .\gradlew.bat assembleDebug
     ```

  3. 如果关闭后构建恢复正常，则需：
     - 将 `java.exe`、`gradlew.bat`、`gradle` 相关进程加入白名单；
     - 或在这些软件中对 `dl.google.com` 域名放行。

---

### 4. 操作建议与经验总结

- **实践建议**
  - 在国内网络环境下，首次在本机构建 Android 前，应优先决定：
    - 是通过稳定梯子访问 Google Maven；
    - 还是为 Gradle 配置可靠的国内 Maven 镜像。
  - 一旦确定了方案，应在团队内部文档中明确下来（例如本文件），避免每位开发者各自踩坑。

- **排查顺序建议**
  1. 看到 `Could not GET 'https://dl.google.com/...` + `Remote host terminated the handshake`：
     - 第一时间判定为 **网络 / TLS 问题**，而非项目依赖或代码问题。
  2. 检查：
     - 是否已开启系统级 VPN 并对 Gradle 生效；
     - 是否已在 `settings.gradle` / `build.gradle` 中配置国内 Maven 镜像；
     - 是否有本地拦截 TLS 的软件正在运行。

- **与其他问题的关系**
  - 本问题与 `ninja: error: manifest 'build.ninja' still dirty after 100 tries` 属于不同维度：
    - `build.ninja dirty`：多为 **CMake / 文件路径长度 / 构建缓存** 问题；
    - 本文问题：纯粹是 **网络 / TLS / 仓库访问** 问题。
  - 两者可以在同一次构建中先后出现，需要分别对待、分别解决。

通过以上方法，可以在不修改业务代码的前提下，稳定解决 Gradle 在本机构建 Android 时下载 AndroidX / Google Maven 依赖失败的错误。若后续升级 Gradle 或迁移到新机器，再次遇到类似 TLS 报错时，可优先参考本文件进行网络与镜像排查。 

