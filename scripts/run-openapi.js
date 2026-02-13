/**
 * 加载 .env 后执行 openapi-typescript 与 generate-openapi-modules。
 * 解决 npm/pnpm 脚本中 EXPO_PUBLIC_API_BASE_URL 未展开的问题（尤其 Windows）。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

/** 从 .env 文件解析出变量到 process.env（仅支持 KEY=VALUE 单行） */
function loadEnvFile(filePath) {
  const full = path.resolve(rootDir, filePath);
  if (!fs.existsSync(full)) return;
  const content = fs.readFileSync(full, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  });
}

// 优先 .env.development，其次 .env
loadEnvFile('.env.development');
loadEnvFile('.env');

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!baseUrl) {
  console.error('缺少 EXPO_PUBLIC_API_BASE_URL，请在 .env.development 或 .env 中配置');
  process.exit(1);
}

const openapiUrl = baseUrl.replace(/\/+$/, '') + '/openapi.json';
const schemaOut = path.join(rootDir, 'src/api/openapi-schema.ts');

console.log('OpenAPI 文档地址:', openapiUrl);
execSync(`npx openapi-typescript "${openapiUrl}" -o "${schemaOut}"`, {
  cwd: rootDir,
  stdio: 'inherit',
});

execSync('node ./scripts/generate-openapi-modules.js', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_API_BASE_URL: baseUrl },
});
