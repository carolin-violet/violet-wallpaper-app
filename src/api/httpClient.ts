/**
 * 通用 HTTP 客户端，基于 openapi-typescript 生成的 paths 类型，
 * 提供带完整类型推导的请求方法。
 */

import type { paths } from './openapi-schema';

/**
 * API 所有路径类型
 */
export type ApiPaths = keyof paths;

/**
 * 指定路径下支持的 HTTP 方法类型
 */
export type ApiMethodForPath<P extends ApiPaths> = keyof paths[P];

/**
 * 单个路径 + 方法 对应的 OpenAPI Operation 类型
 */
export type ApiOperation<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> = paths[P][M];

/**
 * 提取路径参数类型
 */
type ExtractPathParams<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> = ApiOperation<P, M> extends {
  parameters: { path: infer T };
}
  ? T
  : undefined;

/**
 * 提取查询参数类型
 */
type ExtractQueryParams<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> = ApiOperation<P, M> extends {
  parameters: { query: infer T };
}
  ? T
  : undefined;

/**
 * 提取 Header 参数类型
 */
type ExtractHeaderParams<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> = ApiOperation<P, M> extends {
  parameters: { header: infer T };
}
  ? T
  : undefined;

/**
 * 提取请求 Body 类型（优先 application/json）
 */
type ExtractRequestBody<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> = ApiOperation<P, M> extends {
  requestBody: { content: { 'application/json': infer T } };
}
  ? T
  : ApiOperation<P, M> extends {
        requestBody: { content: { [contentType: string]: infer T } };
      }
    ? T
    : undefined;

/**
 * 提取成功响应体类型（优先 200 / 201 / 204）
 */
type ExtractResponseBody<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> = ApiOperation<P, M> extends {
  responses: { 200: { content: { 'application/json': infer T } } };
}
  ? T
  : ApiOperation<P, M> extends {
        responses: { 201: { content: { 'application/json': infer T } } };
      }
    ? T
    : ApiOperation<P, M> extends {
          responses: { 204: unknown };
        }
      ? void
      : ApiOperation<P, M> extends {
            responses: {
              [status: string]: { content: { 'application/json': infer T } };
            };
          }
        ? T
        : unknown;

/**
 * 请求中的参数对象类型（路径 / 查询 / 头）
 */
export type ApiRequestParams<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> = {
  /**
   * 路径参数（/users/{id} 中的 id）
   */
  path?: ExtractPathParams<P, M>;
  /**
   * 查询参数（URL ? 后面的部分）
   */
  query?: ExtractQueryParams<P, M>;
  /**
   * 请求头参数（如鉴权等）
   */
  header?: ExtractHeaderParams<P, M>;
};

/**
 * 请求 Body 类型
 */
export type ApiRequestBody<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> = ExtractRequestBody<P, M>;

/**
 * 响应数据类型
 */
export type ApiResponse<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> = ExtractResponseBody<P, M>;

/**
 * 通用请求配置
 */
export interface ApiRequestConfig<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
> {
  /**
   * OpenAPI 中定义的路径字符串，例如 "/users/{id}"
   */
  path: P;
  /**
   * HTTP 方法，例如 "get"、"post"
   */
  method: M;
  /**
   * 路径 / 查询 / Header 参数
   */
  params?: ApiRequestParams<P, M>;
  /**
   * 请求体（通常为 JSON 对象）
   */
  body?: ApiRequestBody<P, M>;
  /**
   * 覆盖默认 baseUrl 的配置（可选）
   */
  baseUrl?: string;
  /**
   * 透传给 fetch 的额外配置（不包含 method / body）
   */
  init?: Omit<RequestInit, 'method' | 'body'>;
}

/**
 * 默认后端基础地址，可通过 .env.development 中 EXPO_PUBLIC_API_BASE_URL 覆盖。
 * 真机调试时务必用本机局域网 IP（如 http://192.168.x.x:8203），127.0.0.1 仅模拟器可用。
 */
const DEFAULT_API_BASE_URL =
  (typeof process !== 'undefined' &&
    (process as any).env &&
    ((process as any).env.EXPO_PUBLIC_API_BASE_URL as string | undefined)) ||
  'http://127.0.0.1:8203';

/**
 * 构建带路径参数的 URL 路径
 * @param template 原始路径模版，例如 "/users/{id}"
 * @param pathParams 路径参数对象
 */
function buildPath(
  template: string,
  pathParams?: Record<string, unknown>,
): string {
  if (!pathParams) return template;

  return template.replace(/{([^}]+)}/g, (_, key) => {
    const value = pathParams[key];
    if (value === undefined || value === null) {
      throw new Error(`缺少路径参数: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}

/**
 * 构建查询字符串
 * @param query 查询参数对象
 */
function buildQueryString(
  query?: Record<string, unknown> | undefined,
): string {
  if (!query) return '';

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null) return;
        searchParams.append(key, String(item));
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * 合并请求 Header
 */
function mergeHeaders(
  baseHeaders: HeadersInit | undefined,
  extraHeaders: Record<string, unknown> | undefined,
): Headers {
  const headers = new Headers(baseHeaders);

  if (extraHeaders) {
    Object.entries(extraHeaders).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      headers.set(key, String(value));
    });
  }

  return headers;
}

/**
 * 通用请求方法，自动带上 OpenAPI 类型推导。
 * @param config 请求配置
 */
export async function apiRequest<
  P extends ApiPaths,
  M extends ApiMethodForPath<P>,
>(config: ApiRequestConfig<P, M>): Promise<ApiResponse<P, M>> {
  const {
    path,
    method,
    params,
    body,
    baseUrl = DEFAULT_API_BASE_URL,
    init,
  } = config;

  const base = baseUrl.replace(/\/+$/, '');
  const rawPath = String(path);

  const finalPath = buildPath(
    rawPath,
    (params?.path ?? undefined) as Record<string, unknown> | undefined,
  );
  const queryString = buildQueryString(
    (params?.query ?? undefined) as Record<string, unknown> | undefined,
  );

  const url = `${base}${finalPath}${queryString}`;

  if (__DEV__) {
    // 开发环境：请求会打到 Metro 终端，便于真机排查「没数据」是未请求、接口报错还是 URL/网络问题
    const methodUpper = String(method).toUpperCase();
    console.log(`[API] ${methodUpper} ${url}`);
  }

  const headers = mergeHeaders(
    init?.headers,
    (params?.header ?? undefined) as Record<string, unknown> | undefined,
  );

  let requestBody: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    if (
      // FormData / Blob / ArrayBuffer 等不再进行 JSON 序列化
      typeof FormData !== 'undefined' &&
      body instanceof FormData
    ) {
      requestBody = body as unknown as BodyInit;
    } else if (
      typeof Blob !== 'undefined' &&
      body instanceof Blob
    ) {
      requestBody = body as unknown as BodyInit;
    } else {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      requestBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method: String(method).toUpperCase(),
      headers,
      body: requestBody,
    });
  } catch (networkError) {
    if (__DEV__) {
      const msg =
        networkError instanceof Error ? networkError.message : String(networkError);
      console.warn('[API] 网络异常', url, msg);
    }
    throw networkError;
  }

  if (__DEV__) {
    console.log(`[API] ${response.status} ${url}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (__DEV__) {
      console.warn('[API] 请求失败', response.status, errorText || response.statusText);
    }
    throw new Error(
      `请求失败: ${response.status} ${response.statusText}${
        errorText ? ` - ${errorText}` : ''
      }`,
    );
  }

  // 204 无内容
  if (response.status === 204) {
    return undefined as ApiResponse<P, M>;
  }

  // 尝试解析 JSON，若失败则返回 unknown
  try {
    const data = (await response.json()) as ApiResponse<P, M>;
    return data;
  } catch {
    return undefined as ApiResponse<P, M>;
  }
}

