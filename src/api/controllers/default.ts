/**
 * 此文件由 scripts/generate-openapi-modules.js 自动生成。
 *
 * 请勿手动修改，如需更新请执行：
 *   npm run openapi
 */

import { apiRequest, type ApiRequestConfig, type ApiResponse } from '..';

/**
 * Root
 * operationId: root__get
 */
export function rootGet(config?: Omit<ApiRequestConfig<'/', 'get'>, 'path' | 'method'>,
): Promise<ApiResponse<'/', 'get'>> {
  return apiRequest<'/', 'get'>({
    ...(config as ApiRequestConfig<'/', 'get'> | undefined),
    path: '/',
    method: 'get',
  });
}
