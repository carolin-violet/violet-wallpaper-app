/**
 * 根据后端 OpenAPI 文档，按 tag 自动生成按 controller 分类的 API 调用方法。
 *
 * 生成结果存放在 src/api/controllers 目录下。
 *
 * 使用方式：
 *   1. 确保后端已启动并可访问 OPENAPI_URL（默认 http://127.0.0.1:8203/openapi.json）
 *   2. 在项目根目录执行：
 *        npm run openapi:modules
 *      或：
 *        npm run openapi:all
 *
 * 注意：
 *   - 此文件为 Node.js 脚本，请勿在前端代码中引用。
 *   - 生成的 controllers/*.ts 文件属于自动生成文件，可随时覆盖，无需手动修改。
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

/**
 * 获取 OpenAPI 文档地址。
 * 优先使用环境变量 OPENAPI_URL，未设置则回退到本地默认地址。
 */
function getOpenApiUrl() {
  const envUrl = process.env.OPENAPI_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl;
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL + '/openapi.json';
}

/**
 * 将任意字符串转换为合法的 TypeScript 标识符（驼峰写法）。
 * @param {string} input 原始字符串
 */
function toIdentifier(input) {
  const words = String(input)
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean);

  if (words.length === 0) {
    return 'operation';
  }

  const [first, ...rest] = words;
  const base =
    first.charAt(0).toLowerCase() +
    first.slice(1) +
    rest
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

  if (!/^[A-Za-z_]/.test(base)) {
    return `op${base}`;
  }

  return base;
}

/**
 * 将 tag 名转换为文件名（kebab-case）。
 * @param {string} tag 原始 tag
 */
function tagToFileName(tag) {
  const normalized = String(tag)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'default';
}

/**
 * 基于 HTTP 方法、路径和 operationId 构造函数名。
 * @param {string} method HTTP 方法（小写）
 * @param {string} tag 分组 tag
 * @param {string} apiPath OpenAPI 中的路径
 * @param {string | undefined} operationId OpenAPI operationId
 * @param {Set<string>} usedNames 当前文件内已使用的函数名集合
 */
function buildFunctionName(method, tag, apiPath, operationId, usedNames) {
  let baseName;

  if (operationId && typeof operationId === 'string' && operationId.trim()) {
    baseName = toIdentifier(operationId);
  } else {
    const segments = apiPath
      .split('/')
      .filter((seg) => seg && seg !== 'api')
      .map((seg) => seg.replace(/[{}]/g, ''));

    const combined = [method.toLowerCase(), tag, ...segments].join(' ');
    baseName = toIdentifier(combined);
  }

  let name = baseName;
  let index = 1;
  while (usedNames.has(name)) {
    name = `${baseName}${index}`;
    index += 1;
  }
  usedNames.add(name);

  return name;
}

/**
 * 生成单个 controller 文件内容。
 * @param {string} tag 分组 tag
 * @param {Array<{
 *   path: string;
 *   method: string;
 *   operation: any;
 * }>} operations 该 tag 下的所有接口
 */
function generateControllerFileContent(tag, operations) {
  const usedFunctionNames = new Set();

  const lines = [];

  lines.push('/**');
  lines.push(' * 此文件由 scripts/generate-openapi-modules.js 自动生成。');
  lines.push(' *');
  lines.push(' * 请勿手动修改，如需更新请执行：');
  lines.push(' *   npm run openapi');
  lines.push(' */');
  lines.push('');
  lines.push(
    "import { apiRequest, type ApiRequestConfig, type ApiResponse } from '..';",
  );
  lines.push('');

  operations.forEach(({ path: apiPath, method, operation }) => {
    const summary =
      typeof operation.summary === 'string' && operation.summary.trim()
        ? operation.summary.trim()
        : undefined;
    const operationId =
      typeof operation.operationId === 'string'
        ? operation.operationId
        : undefined;

    const methodLiteral = method.toLowerCase();
    const pathLiteral = apiPath;

    const functionName = buildFunctionName(
      methodLiteral,
      tag,
      apiPath,
      operationId,
      usedFunctionNames,
    );

    if (summary) {
      lines.push('/**');
      lines.push(` * ${summary}`);
      if (operationId) {
        lines.push(` * operationId: ${operationId}`);
      }
      lines.push(' */');
    } else if (operationId) {
      lines.push('/**');
      lines.push(` * operationId: ${operationId}`);
      lines.push(' */');
    }

    const pathType = pathLiteral;
    const methodType = methodLiteral;

    lines.push(
      `export function ${functionName}(` +
        `config${
          summary || operationId ? '' : ''
        }?: Omit<ApiRequestConfig<'${pathType}', '${methodType}'>, 'path' | 'method'>,`,
    );
    lines.push(
      `): Promise<ApiResponse<'${pathType}', '${methodType}'>> {`,
    );
    lines.push(
      `  return apiRequest<'${pathType}', '${methodType}'>({`,
    );
    lines.push(
      `    ...(config as ApiRequestConfig<'${pathType}', '${methodType}'> | undefined),`,
    );
    lines.push(`    path: '${pathLiteral}',`);
    lines.push(`    method: '${methodLiteral}',`);
    lines.push('  });');
    lines.push('}');
    lines.push('');
  });

  return `${lines.join('\n')}`;
}

/**
 * 主执行函数。
 */
async function main() {
  const openApiUrl = getOpenApiUrl();

  // 项目根目录：当前脚本在 scripts 下，向上一级即为根目录
  const projectRoot = path.resolve(__dirname, '..');
  const controllersDir = path.join(projectRoot, 'src', 'api', 'controllers');

  const response = await fetch(openApiUrl);

  if (!response.ok) {
    throw new Error(
      `获取 OpenAPI 文档失败：${response.status} ${response.statusText}`,
    );
  }

  const openapi = await response.json();
  const pathsObject = openapi.paths || {};

  /** @type {Map<string, Array<{ path: string; method: string; operation: any }>>} */
  const tagMap = new Map();

  const supportedMethods = [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'options',
    'head',
  ];

  for (const [apiPath, pathItem] of Object.entries(pathsObject)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of Object.keys(pathItem)) {
      const methodLower = method.toLowerCase();
      if (!supportedMethods.includes(methodLower)) continue;

      const operation = pathItem[method];
      if (!operation) continue;

      const rawTags =
        Array.isArray(operation.tags) && operation.tags.length > 0
          ? operation.tags
          : ['default'];

      const tag = String(rawTags[0] || 'default');

      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }

      tagMap.get(tag).push({
        path: apiPath,
        method: methodLower,
        operation,
      });
    }
  }

  fs.mkdirSync(controllersDir, { recursive: true });

  const existingFiles = fs.readdirSync(controllersDir);
  existingFiles.forEach((file) => {
    if (file.endsWith('.ts')) {
      fs.unlinkSync(path.join(controllersDir, file));
    }
  });

  for (const [tag, operations] of tagMap.entries()) {
    operations.sort((a, b) => {
      if (a.path === b.path) {
        return a.method.localeCompare(b.method);
      }
      return a.path.localeCompare(b.path);
    });

    const fileName = `${tagToFileName(tag)}.ts`;
    const filePath = path.join(controllersDir, fileName);

    const content = generateControllerFileContent(tag, operations);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  // eslint-disable-next-line no-console
  console.log(
    `根据 OpenAPI 文档已生成 ${tagMap.size} 个 controller 文件到 src/api/controllers/ 目录。`,
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

