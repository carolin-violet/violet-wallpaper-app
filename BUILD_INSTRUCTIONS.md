## Android APK 本地构建与后端联调说明

> 本文专门解决这样一个问题:
>
> - 在 **Expo Go / `expo run:android` / 模拟器调试** 时,手机壁纸、头像壁纸接口都能正常访问;
> - 但 **打包成 APK 安装到模拟器 / 真机后,接口全部报 `Network request failed` 或没有数据**。
>
> 核心结论: 只要正确配置 `app.json` 中的 **`expo-build-properties` 网络安全配置** 和 **`extra.apiBaseUrl`**, 再按要求 `prebuild + assembleRelease`, APK 中的接口即可正常访问本地后端。

---

### 1. 必须正确配置的几个位置

#### 1.0 Android 权限(对应 `app.json:25–30`)

在 `app.json` 的 `expo.android.permissions` 中,需要显式声明以下权限,否则 APK 中可能无法正常访问网络或读写相册:

- `INTERNET` → 允许访问网络(所有 HTTP/HTTPS 请求都依赖它);
- `ACCESS_NETWORK_STATE` → 允许读取当前网络状态;
- `READ_EXTERNAL_STORAGE` → 读取存储/相册(部分老设备仍需要);
- `WRITE_EXTERNAL_STORAGE` → 写入存储/保存图片到相册。

示意:

```jsonc
"android": {
  "permissions": [
    "INTERNET",
    "ACCESS_NETWORK_STATE",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE"
  ]
}
```

#### 1.1 允许 HTTP 明文 + 指定可访问域名(对应 `app.json:57–81`)

在 `app.json` 的 `expo.plugins` 中使用 `expo-build-properties` 配置 Android 网络安全策略,关键点有三条:

- **允许 HTTP 明文流量**
  - `usesCleartextTraffic: true`
- **全局允许明文**
  - `networkSecurityConfig.cleartextTrafficPermitted: true`
- **白名单域名(必须包含下列三项)**:
  - `192.168.0.178` → 你的后端局域网 IP
  - `localhost` → 本地/回环访问
  - `10.0.2.2` → Android 模拟器访问宿主机的保留地址

简要示意(请以实际 `app.json` 为准):

```jsonc
// app.json 片段(示意, 已在项目中配置)
"plugins": [
  [
    "expo-build-properties",
    {
      "android": {
        "usesCleartextTraffic": true,
        "networkSecurityConfig": {
          "cleartextTrafficPermitted": true,
          "domain": [
            { "includeSubdomains": true, "name": "192.168.0.178" },
            { "includeSubdomains": true, "name": "localhost" },
            { "includeSubdomains": true, "name": "10.0.2.2" }
          ]
        }
      }
    }
  ]
]
```

这一段会在 `expo prebuild` 时自动生成 `network_security_config.xml` 并写入 `AndroidManifest.xml`, 不需要手动改原生文件。

#### 1.2 配置后端基础地址 apiBaseUrl(对应 `app.json:92`)

在 `app.json` 的 `expo.extra` 中设置后端基础地址:

```jsonc
// app.json 片段(示意)
"extra": {
  // ...
  "apiBaseUrl": "http://192.168.0.178:8203"
}
```

在 `src/api/httpClient.ts` 中,默认会按以下优先级读取 baseUrl:

1. `app.json` 中的 `expo.extra.apiBaseUrl`;
2. 构建时环境变量 `EXPO_PUBLIC_API_BASE_URL`;
3. 兜底默认值(同样指向本地后端)。

> 对于本地构建的 APK 来说,**最可靠的是写死在 `app.json.extra.apiBaseUrl`**。  
> 环境变量更适合开发阶段(`expo start` / `expo run:android`)。

---

### 2. 修改配置后如何正确打 APK

> 只改 `app.json` 不会自动同步到 `android/` 原生工程,**每次修改上述两处配置后都必须重新 prebuild**。

在项目根目录执行:

```bash
# 1. 清理并重新生成 Android 原生工程
npx expo prebuild --platform android --clean

# 2. 进入 android 目录,打 Release 包
cd android
.\gradlew.bat assembleRelease
```

生成的 APK 路径:

```text
android/app/build/outputs/apk/release/app-release.apk
```

安装到设备/模拟器:

```bash
adb install -r app\build\outputs\apk\release\app-release.apk
```

> 仅做本地调试时,也可以用 `assembleDebug` + `installDebug`,行为与 Release 略有差异,但网络安全配置同样来自 `app.json + expo-build-properties`。

---

### 3. 安装 APK 后如何验证接口是否配置正确

#### 3.1 确认 APK 使用的 API 地址

1. 设备连接电脑,确认 ADB 可用:

   ```bash
   adb devices
   ```

2. 运行 App,在 PowerShell/CMD 中执行:

   ```bash
   adb logcat -c
   adb logcat | findstr "API Config"
   ```

3. 重新打开 App,看到类似日志:

   ```text
   [API Config] DEFAULT_API_BASE_URL: http://192.168.0.178:8203
   [API Config] from extra.apiBaseUrl: http://192.168.0.178:8203
   [API Config] from env: undefined
   ```

   - `DEFAULT_API_BASE_URL` 必须是你期望的后端地址;  
   - `from extra.apiBaseUrl` 表示是从 `app.json` 正确读取到的。

#### 3.2 确认接口请求是否真的发出

`src/api/httpClient.ts` 中已经为所有请求增加了日志:

- `[API Request] METHOD URL`;
- `[API Response] STATUS URL`;
- `[API Network Error] URL Network request failed`;
- `[API Error] STATUS ...`。

在设备上打开手机壁纸 / 头像壁纸页面时,再执行:

```bash
adb logcat -c
adb logcat | findstr "API "
```

期望情况:

- 能看到 `[API Request] GET http://192.168.0.178:8203/api/pictures/list?...`;
- 正常时能看到 `[API Response] 200 ...`。

如果看到:

```text
[API Network Error] http://192.168.0.178:8203/... Network request failed
```

说明请求发出时 **底层 TCP 无法连通该地址**, 需要按下一节排查网络。

---

### 4. 常见问题与排查建议

#### 4.1 模拟器可以,真机 APK 不行

1. **确认真机与后端在同一 WiFi**  
   手机浏览器访问 `http://192.168.0.178:8203` 或某个接口文档页面,确认可以打开。
2. **确认防火墙未拦截 8203 端口**  
   暂时关闭 Windows 防火墙或为 8203 添加入站规则。
3. **确认后端监听 `0.0.0.0:8203`**  
   而不是只监听 `127.0.0.1`。
4. **如果安装了 VPN/代理/加速器**  
   先全部关闭后再测试,避免 App 流量被重定向或禁止访问局域网。

#### 4.2 真机浏览器能访问,但 APK 报 `Network request failed`

这种情况通常说明:

- 浏览器走了“带代理”的网络通路;
- APK 的直连流量走的是另一套策略,访问局域网 IP 时被环境或安全软件拦截。

此时可以考虑:

- 临时使用公网可访问的 HTTPS 地址(如通过 ngrok/Cloudflare Tunnel 暴露后端),  
  将 `apiBaseUrl` 改为该 HTTPS 域名验证;  
- 或在路由/软路由中检查是否有“客户端隔离/局域网访问限制”等规则。

#### 4.3 模拟器访问宿主机

- 对于 **Android 模拟器**,访问宿主机有两种方式:
  - 使用 `10.0.2.2` 访问宿主机的 `127.0.0.1`;
  - 使用宿主机在局域网中的 IP(`192.168.0.178`),但部分环境下可能不通。
- 因此 `app.json` 中的 `networkSecurityConfig.domain` 同时配置了:
  - `192.168.0.178`;
  - `10.0.2.2`。

建议做法:

- 调试时优先在模拟器中使用 `http://10.0.2.2:8203` 作为 `apiBaseUrl`;
- 真机联调时使用局域网 IP (`http://192.168.0.178:8203`)。

---

### 5. 小结

- **接口不通时,优先检查 `app.json` 的这两处配置是否正确同步到 APK**:
  - `plugins` 中的 `expo-build-properties` 网络安全配置;
  - `extra.apiBaseUrl` 的后端基础地址。
- **每次修改以上配置后都必须执行**:
  - `npx expo prebuild --platform android --clean`;
  - 再用 Gradle 重新打包 APK。
- 结合 Logcat 日志 `[API Config] / [API Request] / [API Network Error]` 可以快速定位问题是在“配置”还是“网络连通性”上。

