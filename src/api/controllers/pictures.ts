/**
 * 此文件由 scripts/generate-openapi-modules.js 自动生成。
 *
 * 请勿手动修改，如需更新请执行：
 *   npm run openapi
 */

import { apiRequest, type ApiRequestConfig, type ApiResponse } from '..';

/**
 * 上传壁纸
 * operationId: upload_wallpaper_api_pictures__post
 */
export function uploadWallpaperApiPicturesPost(config?: Omit<ApiRequestConfig<'/api/pictures/', 'post'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/pictures/', 'post'>> {
  return apiRequest<'/api/pictures/', 'post'>({
    ...(config as ApiRequestConfig<'/api/pictures/', 'post'> | undefined),
    path: '/api/pictures/',
    method: 'post',
  });
}

/**
 * 删除壁纸
 * operationId: delete_wallpaper_api_pictures__picture_id__delete
 */
export function deleteWallpaperApiPicturesPictureIdDelete(config?: Omit<ApiRequestConfig<'/api/pictures/{picture_id}', 'delete'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/pictures/{picture_id}', 'delete'>> {
  return apiRequest<'/api/pictures/{picture_id}', 'delete'>({
    ...(config as ApiRequestConfig<'/api/pictures/{picture_id}', 'delete'> | undefined),
    path: '/api/pictures/{picture_id}',
    method: 'delete',
  });
}

/**
 * 编辑壁纸信息
 * operationId: update_wallpaper_api_pictures__picture_id__put
 */
export function updateWallpaperApiPicturesPictureIdPut(config?: Omit<ApiRequestConfig<'/api/pictures/{picture_id}', 'put'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/pictures/{picture_id}', 'put'>> {
  return apiRequest<'/api/pictures/{picture_id}', 'put'>({
    ...(config as ApiRequestConfig<'/api/pictures/{picture_id}', 'put'> | undefined),
    path: '/api/pictures/{picture_id}',
    method: 'put',
  });
}

/**
 * 下载图片
 * operationId: download_picture_api_pictures__picture_id__download_get
 */
export function downloadPictureApiPicturesPictureIdDownloadGet(config?: Omit<ApiRequestConfig<'/api/pictures/{picture_id}/download', 'get'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/pictures/{picture_id}/download', 'get'>> {
  return apiRequest<'/api/pictures/{picture_id}/download', 'get'>({
    ...(config as ApiRequestConfig<'/api/pictures/{picture_id}/download', 'get'> | undefined),
    path: '/api/pictures/{picture_id}/download',
    method: 'get',
  });
}

/**
 * 增加图片预览次数
 * operationId: increment_picture_view_api_pictures__picture_id__view_post
 */
export function incrementPictureViewApiPicturesPictureIdViewPost(config?: Omit<ApiRequestConfig<'/api/pictures/{picture_id}/view', 'post'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/pictures/{picture_id}/view', 'post'>> {
  return apiRequest<'/api/pictures/{picture_id}/view', 'post'>({
    ...(config as ApiRequestConfig<'/api/pictures/{picture_id}/view', 'post'> | undefined),
    path: '/api/pictures/{picture_id}/view',
    method: 'post',
  });
}

/**
 * 分页查询壁纸列表
 * operationId: list_wallpapers_api_pictures_list_get
 */
export function listWallpapersApiPicturesListGet(config?: Omit<ApiRequestConfig<'/api/pictures/list', 'get'>, 'path' | 'method'>,
): Promise<ApiResponse<'/api/pictures/list', 'get'>> {
  return apiRequest<'/api/pictures/list', 'get'>({
    ...(config as ApiRequestConfig<'/api/pictures/list', 'get'> | undefined),
    path: '/api/pictures/list',
    method: 'get',
  });
}
