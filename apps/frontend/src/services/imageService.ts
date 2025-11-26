import { apiClient } from '@/lib/apiClient'
import type { ApiResponse } from '@pagemaker/shared-types'
import { cacheService } from './cacheService'

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
  async uploadImage(
    file: File, 
    onProgress?: (progress: number) => void,
    pageId?: string
  ): Promise<ImageUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    // 只在 pageId 存在且不为空时添加
    if (pageId && pageId.trim()) {
      formData.append('page_id', pageId)
    }

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
   * 获取R-Cabinet中的文件夹列表（带IndexedDB缓存）
   */
  async getCabinetFolders(params?: {
    page?: number
    pageSize?: number
    parentPath?: string
    all?: boolean
    force?: boolean
    pageId?: string
  }): Promise<CabinetFolderListResponse> {
    const isForceRefresh = params?.force === true
    
    // 过滤掉空字符串的 pageId，保留 force 参数发送给后端
    const filteredParams = params ? {
      page: params.page,
      pageSize: params.pageSize,
      parentPath: params.parentPath,
      all: params.all,
      pageId: params.pageId && params.pageId.trim() ? params.pageId : undefined,
      force: isForceRefresh ? 'true' : undefined  // 发送给后端以清除服务端缓存
    } : undefined
    
    console.log('[imageService.getCabinetFolders] 请求参数:', filteredParams, '强制刷新:', isForceRefresh)
    
    // 如果强制刷新，先清除对应的缓存（同步等待删除完成）
    if (isForceRefresh && typeof window !== 'undefined') {
      console.log('[imageService.getCabinetFolders] 强制刷新，清除缓存')
      const cacheKey = {
        parentPath: filteredParams?.parentPath,
        all: filteredParams?.all,
        pageId: filteredParams?.pageId
      }
      try {
        await cacheService.deleteFolders(cacheKey)
        console.log('[imageService.getCabinetFolders] 缓存已清除')
      } catch (err) {
        console.warn('[imageService.getCabinetFolders] 清除缓存失败:', err)
      }
    }
    
    // Stale-While-Revalidate: 如果不强制刷新，尝试从缓存获取
    if (!isForceRefresh && typeof window !== 'undefined') {
      const cacheKey = {
        parentPath: filteredParams?.parentPath,
        all: filteredParams?.all,
        pageId: filteredParams?.pageId
      }
      const cached = await cacheService.getFolders(cacheKey)
      if (cached) {
        console.log('[imageService.getCabinetFolders] 从IndexedDB缓存返回（stale-while-revalidate）')
        
        // 后台异步刷新缓存（不阻塞返回）
        setTimeout(async () => {
          try {
            console.log('[imageService.getCabinetFolders] 后台刷新缓存')
            const response = await apiClient.get<ApiResponse<CabinetFolderListResponse>>('/api/v1/media/cabinet-folders/', {
              params: filteredParams
            })
            if (response.data.success && response.data.data) {
              await cacheService.setFolders(cacheKey, response.data.data)
              console.log('[imageService.getCabinetFolders] 后台缓存刷新完成')
            }
          } catch (err) {
            console.warn('[imageService.getCabinetFolders] 后台刷新失败:', err)
          }
        }, 100)
        
        return cached
      }
    }
    
    const response = await apiClient.get<ApiResponse<CabinetFolderListResponse>>('/api/v1/media/cabinet-folders/', {
      params: filteredParams
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '获取文件夹列表失败')
    }

    // 存入缓存（仅在浏览器环境）
    if (typeof window !== 'undefined') {
      const cacheKey = {
        parentPath: filteredParams?.parentPath,
        all: filteredParams?.all,
        pageId: filteredParams?.pageId
      }
      cacheService.setFolders(cacheKey, response.data.data).catch(err => {
        console.warn('[imageService.getCabinetFolders] 存入缓存失败:', err)
      })
    }

    return response.data.data
  },

  /**
   * 获取R-Cabinet中的图片列表（带IndexedDB缓存）
   */
  async getCabinetImages(params?: {
    page?: number
    pageSize?: number
    search?: string
    folderId?: string
    sortMode?: 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc'
    pageId?: string
    force?: boolean  // 强制刷新，跳过缓存
  }): Promise<CabinetImageListResponse> {
    const isForceRefresh = params?.force === true
    
    // 过滤掉空字符串的 pageId，保留 force 参数发送给后端
    const filteredParams = params ? {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      folderId: params.folderId,
      sortMode: params.sortMode,
      pageId: params.pageId && params.pageId.trim() ? params.pageId : undefined,
      force: isForceRefresh ? 'true' : undefined  // 发送给后端以清除服务端缓存
    } : undefined
    
    // 如果强制刷新，先清除对应的缓存（同步等待删除完成）
    if (isForceRefresh && typeof window !== 'undefined') {
      console.log('[imageService.getCabinetImages] 强制刷新，清除缓存')
      const cacheKey = {
        folderId: filteredParams?.folderId,
        sortMode: filteredParams?.sortMode,
        pageId: filteredParams?.pageId
      }
      try {
        await cacheService.deleteImages(cacheKey)
        console.log('[imageService.getCabinetImages] 缓存已清除')
      } catch (err) {
        console.warn('[imageService.getCabinetImages] 清除缓存失败:', err)
      }
    }
    
    // Stale-While-Revalidate: 如果不是搜索模式且不强制刷新，尝试从缓存获取
    if (!params?.search && !isForceRefresh && typeof window !== 'undefined') {
      const cacheKey = {
        folderId: filteredParams?.folderId,
        sortMode: filteredParams?.sortMode,
        pageId: filteredParams?.pageId
      }
      const cached = await cacheService.getImages(cacheKey)
      if (cached) {
        console.log('[imageService.getCabinetImages] 从IndexedDB缓存返回（stale-while-revalidate）')
        
        // 后台异步刷新缓存（不阻塞返回）
        setTimeout(async () => {
          try {
            console.log('[imageService.getCabinetImages] 后台刷新缓存')
            const response = await apiClient.get<ApiResponse<CabinetImageListResponse>>('/api/v1/media/cabinet-images/', {
              params: { ...filteredParams, page: 1, pageSize: 1000 }
            })
            if (response.data.success && response.data.data) {
              const allImages = [...response.data.data.images]
              
              // 如果还有更多数据，继续获取
              if (response.data.data.total && response.data.data.total > allImages.length) {
                const totalPages = Math.ceil(response.data.data.total / 1000)
                const promises: Promise<any>[] = []
                for (let i = 2; i <= totalPages; i++) {
                  promises.push(
                    apiClient.get<ApiResponse<CabinetImageListResponse>>('/api/v1/media/cabinet-images/', {
                      params: { ...filteredParams, page: i, pageSize: 1000 }
                    })
                  )
                }
                const results = await Promise.all(promises)
                for (const result of results) {
                  if (result.data.success && result.data.data?.images) {
                    allImages.push(...result.data.data.images)
                  }
                }
              }
              
              await cacheService.setImages(cacheKey, { images: allImages })
              console.log('[imageService.getCabinetImages] 后台缓存刷新完成')
            }
          } catch (err) {
            console.warn('[imageService.getCabinetImages] 后台刷新失败:', err)
          }
        }, 100)
        
        // 返回分页数据
        const page = params?.page || 1
        const pageSize = params?.pageSize || 20
        const start = (page - 1) * pageSize
        const end = start + pageSize
        return {
          images: cached.images.slice(start, end),
          total: cached.images.length,
          page,
          pageSize
        }
      }
    }
    
    const response = await apiClient.get<ApiResponse<CabinetImageListResponse>>('/api/v1/media/cabinet-images/', {
      params: filteredParams
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '获取图片列表失败')
    }

    // 存入缓存（仅非搜索模式）
    if (!params?.search && typeof window !== 'undefined') {
      // 如果是第一页，获取所有页并缓存
      if (params?.page === 1 || !params?.page) {
        const allImages = [...response.data.data.images]
        const total = response.data.data.total
        const pageSize = params?.pageSize || 20
        
        // 如果还有更多页，继续获取
        if (total && allImages.length < total) {
          const totalPages = Math.ceil(total / pageSize)
          const promises: Promise<any>[] = []
          for (let i = 2; i <= totalPages; i++) {
            promises.push(
              apiClient.get<ApiResponse<CabinetImageListResponse>>('/api/v1/media/cabinet-images/', {
                params: { ...filteredParams, page: i, pageSize }
              })
            )
          }
          
          const results = await Promise.all(promises)
          for (const result of results) {
            if (result.data.success && result.data.data?.images) {
              allImages.push(...result.data.data.images)
            }
          }
        }
        
        // 缓存所有图片
        const cacheKey = {
          folderId: filteredParams?.folderId,
          sortMode: filteredParams?.sortMode,
          pageId: filteredParams?.pageId
        }
        cacheService.setImages(cacheKey, { images: allImages }).catch(err => {
          console.warn('[imageService.getCabinetImages] 存入缓存失败:', err)
        })
      }
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
