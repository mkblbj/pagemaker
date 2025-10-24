/**
 * 前端持久化缓存服务
 * 使用 IndexedDB 存储 Cabinet 文件夹和图片数据
 */

const DB_NAME = 'pagemaker_cabinet_cache'
const DB_VERSION = 1
const FOLDERS_STORE = 'folders'
const IMAGES_STORE = 'images'
const CACHE_DURATION = 30 * 60 * 1000 // 30分钟

interface CacheEntry<T> {
  key: string
  data: T
  timestamp: number
  pageId?: string
}

class CacheService {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  /**
   * 初始化 IndexedDB
   */
  private async init(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建文件夹存储
        if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
          const foldersStore = db.createObjectStore(FOLDERS_STORE, { keyPath: 'key' })
          foldersStore.createIndex('pageId', 'pageId', { unique: false })
          foldersStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // 创建图片存储
        if (!db.objectStoreNames.contains(IMAGES_STORE)) {
          const imagesStore = db.createObjectStore(IMAGES_STORE, { keyPath: 'key' })
          imagesStore.createIndex('pageId', 'pageId', { unique: false })
          imagesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(type: 'folders' | 'images', params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key] || ''}`)
      .join('&')
    return `${type}_${sorted}`
  }

  /**
   * 检查缓存是否过期
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_DURATION
  }

  /**
   * 从缓存获取数据
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.get(key)

        request.onsuccess = () => {
          const entry = request.result as CacheEntry<T> | undefined
          if (!entry) {
            resolve(null)
            return
          }

          // 检查是否过期
          if (this.isExpired(entry.timestamp)) {
            // 异步删除过期数据
            this.delete(storeName, key).catch(() => {})
            resolve(null)
            return
          }

          resolve(entry.data)
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[CacheService] 获取缓存失败:', error)
      return null
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(storeName: string, key: string, data: T, pageId?: string): Promise<void> {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite')
        const store = transaction.objectStore(storeName)
        const entry: CacheEntry<T> = {
          key,
          data,
          timestamp: Date.now(),
          pageId
        }
        const request = store.put(entry)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[CacheService] 设置缓存失败:', error)
    }
  }

  /**
   * 删除缓存数据
   */
  async delete(storeName: string, key: string): Promise<void> {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.delete(key)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[CacheService] 删除缓存失败:', error)
    }
  }

  /**
   * 清除指定页面的所有缓存
   */
  async clearByPageId(pageId: string): Promise<void> {
    try {
      const db = await this.init()
      
      for (const storeName of [FOLDERS_STORE, IMAGES_STORE]) {
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite')
          const store = transaction.objectStore(storeName)
          const index = store.index('pageId')
          const request = index.openCursor(IDBKeyRange.only(pageId))

          request.onsuccess = () => {
            const cursor = request.result
            if (cursor) {
              cursor.delete()
              cursor.continue()
            } else {
              resolve()
            }
          }

          request.onerror = () => reject(request.error)
        })
      }
    } catch (error) {
      console.error('[CacheService] 清除页面缓存失败:', error)
    }
  }

  /**
   * 清除所有过期缓存
   */
  async clearExpired(): Promise<void> {
    try {
      const db = await this.init()
      const now = Date.now()
      
      for (const storeName of [FOLDERS_STORE, IMAGES_STORE]) {
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite')
          const store = transaction.objectStore(storeName)
          const index = store.index('timestamp')
          const request = index.openCursor()

          request.onsuccess = () => {
            const cursor = request.result
            if (cursor) {
              const entry = cursor.value as CacheEntry<any>
              if (this.isExpired(entry.timestamp)) {
                cursor.delete()
              }
              cursor.continue()
            } else {
              resolve()
            }
          }

          request.onerror = () => reject(request.error)
        })
      }
    } catch (error) {
      console.error('[CacheService] 清除过期缓存失败:', error)
    }
  }

  /**
   * 获取文件夹列表（带缓存）
   */
  async getFolders(params: Record<string, any>): Promise<any | null> {
    const key = this.getCacheKey('folders', params)
    return this.get(FOLDERS_STORE, key)
  }

  /**
   * 设置文件夹列表缓存
   */
  async setFolders(params: Record<string, any>, data: any): Promise<void> {
    const key = this.getCacheKey('folders', params)
    await this.set(FOLDERS_STORE, key, data, params.pageId)
  }

  /**
   * 获取图片列表（带缓存）
   */
  async getImages(params: Record<string, any>): Promise<any | null> {
    const key = this.getCacheKey('images', params)
    return this.get(IMAGES_STORE, key)
  }

  /**
   * 设置图片列表缓存
   */
  async setImages(params: Record<string, any>, data: any): Promise<void> {
    const key = this.getCacheKey('images', params)
    await this.set(IMAGES_STORE, key, data, params.pageId)
  }
}

// 导出单例
export const cacheService = new CacheService()

// 应用启动时清理过期缓存
if (typeof window !== 'undefined') {
  cacheService.clearExpired().catch(err => {
    console.warn('[CacheService] 启动时清理过期缓存失败:', err)
  })
}

