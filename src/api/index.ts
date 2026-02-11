/**
 * API 统一出口，对外暴露带类型的请求方法。
 */

import {
  apiRequest,
  type ApiPaths,
  type ApiMethodForPath,
  type ApiRequestConfig,
  type ApiRequestParams,
  type ApiRequestBody,
  type ApiResponse,
} from './httpClient';

export {
  apiRequest,
  type ApiPaths,
  type ApiMethodForPath,
  type ApiRequestConfig,
  type ApiRequestParams,
  type ApiRequestBody,
  type ApiResponse,
};

/**
 * 所有支持 GET 方法的路径
 */
export type GetPaths = {
  [P in ApiPaths]: 'get' extends ApiMethodForPath<P> ? P : never;
}[ApiPaths];

/**
 * 所有支持 POST 方法的路径
 */
export type PostPaths = {
  [P in ApiPaths]: 'post' extends ApiMethodForPath<P> ? P : never;
}[ApiPaths];

/**
 * 所有支持 PUT 方法的路径
 */
export type PutPaths = {
  [P in ApiPaths]: 'put' extends ApiMethodForPath<P> ? P : never;
}[ApiPaths];

/**
 * 所有支持 PATCH 方法的路径
 */
export type PatchPaths = {
  [P in ApiPaths]: 'patch' extends ApiMethodForPath<P> ? P : never;
}[ApiPaths];

/**
 * 所有支持 DELETE 方法的路径
 */
export type DeletePaths = {
  [P in ApiPaths]: 'delete' extends ApiMethodForPath<P> ? P : never;
}[ApiPaths];

/**
 * GET 请求快捷方法
 */
export function apiGet<P extends GetPaths>(
  path: P,
  config?: Omit<ApiRequestConfig<P, 'get'>, 'path' | 'method'>,
): Promise<ApiResponse<P, 'get'>> {
  return apiRequest<P, 'get'>({
    ...(config as ApiRequestConfig<P, 'get'> | undefined),
    path,
    method: 'get',
  });
}

/**
 * POST 请求快捷方法
 */
export function apiPost<P extends PostPaths>(
  path: P,
  config?: Omit<ApiRequestConfig<P, 'post'>, 'path' | 'method'>,
): Promise<ApiResponse<P, 'post'>> {
  return apiRequest<P, 'post'>({
    ...(config as ApiRequestConfig<P, 'post'> | undefined),
    path,
    method: 'post',
  });
}

/**
 * PUT 请求快捷方法
 */
export function apiPut<P extends PutPaths>(
  path: P,
  config?: Omit<ApiRequestConfig<P, 'put'>, 'path' | 'method'>,
): Promise<ApiResponse<P, 'put'>> {
  return apiRequest<P, 'put'>({
    ...(config as ApiRequestConfig<P, 'put'> | undefined),
    path,
    method: 'put',
  });
}

/**
 * PATCH 请求快捷方法
 */
export function apiPatch<P extends PatchPaths>(
  path: P,
  config?: Omit<ApiRequestConfig<P, 'patch'>, 'path' | 'method'>,
): Promise<ApiResponse<P, 'patch'>> {
  return apiRequest<P, 'patch'>({
    ...(config as ApiRequestConfig<P, 'patch'> | undefined),
    path,
    method: 'patch',
  });
}

/**
 * DELETE 请求快捷方法
 */
export function apiDelete<P extends DeletePaths>(
  path: P,
  config?: Omit<ApiRequestConfig<P, 'delete'>, 'path' | 'method'>,
): Promise<ApiResponse<P, 'delete'>> {
  return apiRequest<P, 'delete'>({
    ...(config as ApiRequestConfig<P, 'delete'> | undefined),
    path,
    method: 'delete',
  });
}

