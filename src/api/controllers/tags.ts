/**
 * 此文件由 scripts/generate-openapi-modules.js 自动生成。
 *
 * 请勿手动修改，如需更新请执行：
 *   npm run openapi
 */

import { apiRequest, type ApiRequestConfig, type ApiResponse } from '..';

/**
 * 创建标签
 * operationId: create_tag_api_tags__post
 */
export function createTagApiTagsPost(config?: Omit<ApiRequestConfig<'/api/tags/', 'post'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/tags/', 'post'>> {
  return apiRequest<'/api/tags/', 'post'>({
    ...(config as ApiRequestConfig<'/api/tags/', 'post'> | undefined),
    path: '/api/tags/',
    method: 'post',
  });
}

/**
 * 删除标签
 * operationId: delete_tag_api_tags__tag_id__delete
 */
export function deleteTagApiTagsTagIdDelete(config?: Omit<ApiRequestConfig<'/api/tags/{tag_id}', 'delete'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/tags/{tag_id}', 'delete'>> {
  return apiRequest<'/api/tags/{tag_id}', 'delete'>({
    ...(config as ApiRequestConfig<'/api/tags/{tag_id}', 'delete'> | undefined),
    path: '/api/tags/{tag_id}',
    method: 'delete',
  });
}

/**
 * 查询所有标签列表
 * operationId: list_tags_api_tags_list_get
 */
export function listTagsApiTagsListGet(config?: Omit<ApiRequestConfig<'/api/tags/list', 'get'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/tags/list', 'get'>> {
  return apiRequest<'/api/tags/list', 'get'>({
    ...(config as ApiRequestConfig<'/api/tags/list', 'get'> | undefined),
    path: '/api/tags/list',
    method: 'get',
  });
}
