import request from '@/utils/http'

// 定义基础路径
const STORAGE_BASE_PATH = '/portal/v1/storage'

// ========== 类型定义 ==========

/** 上传图片请求 - 使用FormData */
export interface ImageUploadRequest {
  project: string // 项目名称，必填
  file?: File // 文件对象（通过FormData传递）
}

/** 上传图片响应 */
export interface ImageUploadResponse {
  imageUri: string // 图片URI
  imageUrl: string // 图片URL
}

// ========== API 接口 ==========

/**
 * 上传图片
 * @param data 上传图片请求参数
 * @param file 文件对象
 * @returns 图片信息
 */
export async function uploadImageApi(data: ImageUploadRequest, file: File) {
  const formData = new FormData()
  formData.append('Project', data.project)
  formData.append('file', file)

  return request.post<ImageUploadResponse>({
    url: `${STORAGE_BASE_PATH}/image/upload`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
