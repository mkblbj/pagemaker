/**
 * 后台预加载服务
 * 在应用启动时预热缓存，提升用户体验
 */

import { imageService } from './imageService'
import { cacheService } from './cacheService'

class PreloadService {
  private isPreloading = false
  private preloadQueue: Array<() => Promise<void>> = []

  /**
   * 预加载 Cabinet 数据
   */
  async preloadCabinetData(pageId?: string): Promise<void> {
    if (this.isPreloading) {
      console.log('[PreloadService] 正在预加载中，跳过')
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    this.isPreloading = true
    console.log('[PreloadService] 开始预加载 Cabinet 数据')

    try {
      // 1. 预加载根文件夹列表
      await this.preloadFolders(pageId)

      // 2. 从 localStorage 恢复上次选择的文件夹ID
      const storageKey = pageId ? `rcabinet_selected_folder_id_${pageId}` : 'rcabinet_selected_folder_id'
      const lastFolderId = window.localStorage.getItem(storageKey) || '0'
      
      // 3. 预加载上次选择的文件夹的图片
      if (lastFolderId) {
        await this.preloadImages(lastFolderId, pageId)
      }

      console.log('[PreloadService] Cabinet 数据预加载完成')
    } catch (error) {
      console.error('[PreloadService] 预加载失败:', error)
    } finally {
      this.isPreloading = false
    }
  }

  /**
   * 预加载文件夹列表
   */
  private async preloadFolders(pageId?: string): Promise<void> {
    try {
      console.log('[PreloadService] 预加载文件夹列表')
      
      // 检查缓存是否已存在
      const cacheKey = { parentPath: '', all: false, pageId }
      const cached = await cacheService.getFolders(cacheKey)
      
      if (cached) {
        console.log('[PreloadService] 文件夹列表缓存已存在，跳过预加载')
        return
      }

      // 请求文件夹列表，触发缓存
      await imageService.getCabinetFolders({
        page: 1,
        pageSize: 100,
        parentPath: '',
        pageId
      })

      console.log('[PreloadService] 文件夹列表预加载完成')
    } catch (error) {
      console.warn('[PreloadService] 预加载文件夹列表失败:', error)
    }
  }

  /**
   * 预加载图片列表
   */
  private async preloadImages(folderId: string, pageId?: string): Promise<void> {
    try {
      console.log('[PreloadService] 预加载文件夹图片:', folderId)
      
      // 检查缓存是否已存在
      const cacheKey = { folderId, sortMode: 'name-asc', pageId }
      const cached = await cacheService.getImages(cacheKey)
      
      if (cached) {
        console.log('[PreloadService] 图片列表缓存已存在，跳过预加载')
        return
      }

      // 请求图片列表，触发缓存
      await imageService.getCabinetImages({
        page: 1,
        pageSize: 1000,
        folderId,
        sortMode: 'name-asc',
        pageId
      })

      console.log('[PreloadService] 图片列表预加载完成')
    } catch (error) {
      console.warn('[PreloadService] 预加载图片列表失败:', error)
    }
  }

  /**
   * 队列化预加载任务
   */
  queuePreload(task: () => Promise<void>): void {
    this.preloadQueue.push(task)
    
    if (!this.isPreloading) {
      this.processQueue()
    }
  }

  /**
   * 处理预加载队列
   */
  private async processQueue(): Promise<void> {
    if (this.preloadQueue.length === 0 || this.isPreloading) {
      return
    }

    this.isPreloading = true

    while (this.preloadQueue.length > 0) {
      const task = this.preloadQueue.shift()
      if (task) {
        try {
          await task()
        } catch (error) {
          console.warn('[PreloadService] 队列任务执行失败:', error)
        }
      }
    }

    this.isPreloading = false
  }

  /**
   * 预热指定页面的缓存
   */
  async warmupCache(pageId: string): Promise<void> {
    console.log('[PreloadService] 预热页面缓存:', pageId)
    
    // 使用 requestIdleCallback 在浏览器空闲时执行
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        this.preloadCabinetData(pageId).catch(err => {
          console.warn('[PreloadService] 预热缓存失败:', err)
        })
      }, { timeout: 2000 })
    } else {
      // 降级方案：使用 setTimeout
      setTimeout(() => {
        this.preloadCabinetData(pageId).catch(err => {
          console.warn('[PreloadService] 预热缓存失败:', err)
        })
      }, 1000)
    }
  }
}

// 导出单例
export const preloadService = new PreloadService()

