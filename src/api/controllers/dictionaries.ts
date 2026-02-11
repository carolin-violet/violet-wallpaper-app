/**
 * 此文件由 scripts/generate-openapi-modules.js 自动生成。
 *
 * 请勿手动修改，如需更新请执行：
 *   npm run openapi
 */

import { apiRequest, type ApiRequestConfig, type ApiResponse } from '..';

/**
 * 查询整个字典表
 * operationId: get_all_dictionaries_api_dictionaries__get
 */
export function getAllDictionariesApiDictionariesGet(config?: Omit<ApiRequestConfig<'/api/dictionaries/', 'get'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/dictionaries/', 'get'>> {
  return apiRequest<'/api/dictionaries/', 'get'>({
    ...(config as ApiRequestConfig<'/api/dictionaries/', 'get'> | undefined),
    path: '/api/dictionaries/',
    method: 'get',
  });
}
