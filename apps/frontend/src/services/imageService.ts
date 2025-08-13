import { apiClient } from '@/lib/apiClient'
import type { ApiResponse } from '@pagemaker/shared-types'

// 图片上传响应接口
export interface ImageUploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}

// R-Cabinet图片列表项接口
export interface CabinetImage {
  id: string
  url: string
  filename: string
  size: number
  width: number
  height: number
  mimeType: string
  uploadedAt: string
}

// R-Cabinet文件夹接口
export interface CabinetFolder {
  id: string
  name: string
  path: string
  fileCount: number
  fileSize: number
  updatedAt: string
  // 新增树形结构支持
  node: number // 1=根目录下, 2=二级, 3=三级
  parentPath?: string // 父路径
  children?: CabinetFolder[] // 子文件夹
  isExpanded?: boolean // 是否展开（前端状态）
}

// 文件夹列表响应接口
export interface CabinetFolderListResponse {
  folders: CabinetFolder[]
  total: number
  page: number
  pageSize: number
}

// R-Cabinet图片列表响应接口
export interface CabinetImageListResponse {
  images: CabinetImage[]
  total: number
  page: number
  pageSize: number
}

export const imageService = {
  /**
   * 上传图片到R-Cabinet
   */
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<ImageUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<ApiResponse<ImageUploadResponse>>('/api/v1/media/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '图片上传失败')
    }

    return response.data.data
  },

  /**
   * 获取R-Cabinet中的文件夹列表
   */
  async getCabinetFolders(params?: {
    page?: number
    pageSize?: number
    parentPath?: string
    all?: boolean
    force?: boolean
  }): Promise<CabinetFolderListResponse> {
    const response = await apiClient.get<ApiResponse<CabinetFolderListResponse>>('/api/v1/media/cabinet-folders/', {
      params
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '获取文件夹列表失败')
    }

    return response.data.data
  },

  /**
   * 获取R-Cabinet中的图片列表
   */
  async getCabinetImages(params?: {
    page?: number
    pageSize?: number
    search?: string
    folderId?: string
  }): Promise<CabinetImageListResponse> {
    const response = await apiClient.get<ApiResponse<CabinetImageListResponse>>('/api/v1/media/cabinet-images/', {
      params
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '获取图片列表失败')
    }

    return response.data.data
  },

  /**
   * 验证图片文件
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '不支持的图片格式，请上传 JPEG、PNG、GIF 或 WebP 格式的图片'
      }
    }

    // 检查文件大小 (5MB限制)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: '图片文件过大，请上传小于5MB的图片'
      }
    }

    return { valid: true }
  },

  /**
   * 生成图片预览URL
   */
  generatePreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

export default imageService
