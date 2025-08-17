'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Folder, FolderOpen, Search, X, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { imageService, type CabinetFolder } from '@/services/imageService'
import { useTranslation } from '@/contexts/I18nContext'

// R-Cabinet 文件夹树节点接口
interface RCabinetTreeNode extends CabinetFolder {
  children?: RCabinetTreeNode[]
  isLoading?: boolean
  isExpanded?: boolean
  level?: number
}

interface RCabinetFileTreeProps {
  onFolderSelect: (folderId: string, folderName: string, folderPath?: string) => void
  selectedFolderId?: string
  className?: string
}

export function RCabinetFileTree({ onFolderSelect, selectedFolderId = '0', className }: RCabinetFileTreeProps) {
  const { tEditor } = useTranslation()
  const [treeData, setTreeData] = useState<RCabinetTreeNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // 从localStorage恢复展开状态
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('rcabinet_expanded_folders')
        return saved ? new Set(JSON.parse(saved)) : new Set()
      } catch {
        return new Set()
      }
    }
    return new Set()
  })
  const [sortMode, setSortMode] = useState<'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('rcabinet_tree_sort_mode') as any
      if (saved === 'name-asc' || saved === 'name-desc' || saved === 'date-desc' || saved === 'date-asc') return saved
    }
    return 'name-asc'
  })
  const [loadedAll, setLoadedAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const childrenCacheRef = useRef<Map<string, RCabinetTreeNode[]>>(new Map())
  const pendingRef = useRef<Map<string, Promise<RCabinetTreeNode[]>>>(new Map())
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 比较器
  const getComparator = () => {
    switch (sortMode) {
      case 'name-asc':
        return (a: RCabinetTreeNode, b: RCabinetTreeNode) => a.name.localeCompare(b.name)
      case 'name-desc':
        return (a: RCabinetTreeNode, b: RCabinetTreeNode) => b.name.localeCompare(a.name)
      case 'date-desc': {
        return (a: RCabinetTreeNode, b: RCabinetTreeNode) => {
          const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0
          const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0
          return tb - ta
        }
      }
      case 'date-asc': {
        return (a: RCabinetTreeNode, b: RCabinetTreeNode) => {
          const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0
          const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0
          return ta - tb
        }
      }
      default:
        return (a: RCabinetTreeNode, b: RCabinetTreeNode) => a.name.localeCompare(b.name)
    }
  }

  // 构建文件夹树形结构
  const buildFolderTree = (folders: CabinetFolder[]): RCabinetTreeNode[] => {
    const folderMap = new Map<string, RCabinetTreeNode>()
    const rootFolders: RCabinetTreeNode[] = []

    // 首先创建所有文件夹的映射
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        isExpanded: expandedFolders.has(folder.id),
        level: 0
      })
    })

    // 构建树形结构
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!

      if (folder.node === 1 || !folder.parentPath || folder.parentPath === '') {
        // 根级文件夹
        rootFolders.push(folderWithChildren)
      } else {
        // 查找父文件夹（通过parentPath匹配其他文件夹的path）
        const parent = Array.from(folderMap.values()).find(f => f.path === folder.parentPath)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push({
            ...folderWithChildren,
            level: (parent.level || 0) + 1
          })
        } else {
          // 如果找不到父文件夹，作为根级处理
          rootFolders.push(folderWithChildren)
        }
      }
    })

    // 递归设置层级并排序
    const setLevelsAndSort = (folders: RCabinetTreeNode[], level: number = 0) => {
      folders.forEach(folder => {
        folder.level = level
        if (folder.children && folder.children.length > 0) {
          folder.children.sort(getComparator())
          setLevelsAndSort(folder.children, level + 1)
        }
      })
    }

    rootFolders.sort(getComparator())
    setLevelsAndSort(rootFolders)

    return rootFolders
  }

  // 过滤文件夹树（支持搜索）
  const filterFolderTree = (folders: RCabinetTreeNode[], searchTerm: string): RCabinetTreeNode[] => {
    if (!searchTerm.trim()) {
      return folders
    }

    const filtered: RCabinetTreeNode[] = []

    for (const folder of folders) {
      const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase())
      const filteredChildren = folder.children ? filterFolderTree(folder.children, searchTerm) : []

      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...folder,
          children: filteredChildren,
          isExpanded: true // 搜索时自动展开匹配的文件夹
        })
      }
    }

    return filtered
  }

  // 初始加载根层（懒加载）
  useEffect(() => {
    const loadRoot = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // 仅请求根层
        const resp = await imageService.getCabinetFolders({ page: 1, pageSize: 100, parentPath: '' })
        const rootFolders = (resp.folders || []).map(folder => ({
          ...folder,
          children: [],
          isExpanded: expandedFolders.has(folder.id),
          level: 0
        }))

        // 排序根文件夹
        const cmp = getComparator()
        rootFolders.sort(cmp)

        setTreeData(rootFolders)
        setLoadedAll(false)
        // 根层缓存
        childrenCacheRef.current.set(
          '',
          (resp.folders || []).map(f => ({ ...(f as any) }))
        )
      } catch (error) {
        console.error('加载R-Cabinet文件夹失败:', error)
        setError('加载文件夹失败，请重试')
      } finally {
        setIsLoading(false)
      }
    }
    void loadRoot()
    // 静默预热服务端缓存（不阻塞UI）
    void Promise.resolve(imageService.getCabinetFolders({ all: true, page: 1, pageSize: 500 })).catch(() => void 0)
  }, [])

  // 搜索时自动加载全量（一次性，从缓存读，避免多次打API）
  useEffect(() => {
    const fetchAllIfNeeded = async () => {
      if (!searchTerm.trim() || loadedAll) return
      try {
        setIsLoading(true)
        setError(null)
        const pageSize = 500
        let page = 1
        let all: CabinetFolder[] = []
        while (true) {
          const resp = await imageService.getCabinetFolders({ page, pageSize, all: true })
          all = all.concat(resp.folders || [])
          const fetched = page * pageSize
          if (resp.total !== undefined && fetched >= resp.total) break
          if (!resp.folders || resp.folders.length === 0) break
          page += 1
        }
        const tree = buildFolderTree(all)
        setTreeData(tree)
        setLoadedAll(true)
      } catch (e) {
        // 忽略错误，保持已有树
      } finally {
        setIsLoading(false)
      }
    }
    void fetchAllIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // 辅助函数：在树中查找节点
  const findNodeById = (nodes: RCabinetTreeNode[], id: string): RCabinetTreeNode | null => {
    const stack: RCabinetTreeNode[] = [...nodes]
    while (stack.length) {
      const node = stack.shift()!
      if (node.id === id) return node
      if (node.children) stack.push(...node.children)
    }
    return null
  }

  // 滚动到选中的文件夹
  const scrollToSelectedFolder = (folderId: string, retryCount = 0) => {
    if (retryCount > 10) return // 最多重试10次，避免无限循环

    const selectedElement = document.querySelector(`[data-folder-id="${folderId}"]`)
    if (selectedElement && scrollRef.current) {
      // 清除之前的滚动定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // 延迟一点再滚动，确保DOM更新完成
      scrollTimeoutRef.current = setTimeout(() => {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }, 100)
    } else if (retryCount < 10) {
      // 如果元素还没有渲染，稍后重试
      setTimeout(() => scrollToSelectedFolder(folderId, retryCount + 1), 300)
    }
  }

  // 辅助函数：根据选中文件夹自动展开父级路径
  const autoExpandPathToFolder = (nodes: RCabinetTreeNode[], targetId: string): string[] => {
    const pathIds: string[] = []

    const findPath = (currentNodes: RCabinetTreeNode[], currentPath: string[]): boolean => {
      for (const node of currentNodes) {
        const newPath = [...currentPath, node.id]
        if (node.id === targetId) {
          pathIds.push(...newPath.slice(0, -1)) // 不包括目标节点本身，只包括父级路径
          return true
        }
        if (node.children && findPath(node.children, newPath)) {
          return true
        }
      }
      return false
    }

    findPath(nodes, [])
    return pathIds
  }

  // 懒加载展开：若无子节点，按需请求 parentPath = 当前path
  const toggleFolder = (folderId: string) => {
    const prevScroll = scrollRef.current?.scrollTop ?? 0

    // 第一步：立即切换展开状态和更新expandedFolders
    setTreeData(prevTreeData => {
      const clone = (nodes: RCabinetTreeNode[]): RCabinetTreeNode[] =>
        nodes.map(n => ({ ...n, children: n.children ? clone(n.children) : [] }))
      const next = clone(prevTreeData)
      const target = findNodeById(next, folderId)

      if (!target) return prevTreeData

      const willExpand = !target.isExpanded
      target.isExpanded = willExpand

      // 更新expandedFolders状态
      if (willExpand) {
        setExpandedFolders(prev => new Set([...prev, folderId]))
      } else {
        setExpandedFolders(prev => {
          const newSet = new Set(prev)
          newSet.delete(folderId)
          return newSet
        })
      }

      const hadChildren = !!(target.children && target.children.length)
      const couldHave = (target as any).hasChildren !== false

      if (willExpand && !hadChildren && couldHave) {
        // 检查缓存
        const cached = childrenCacheRef.current.get(target.path)
        if (cached) {
          // 直接使用缓存
          target.children = cached.map(c => ({ ...c, level: (target.level || 0) + 1 }))
          target.isLoading = false
        } else {
          // 设置loading状态，准备异步加载
          target.isLoading = true

          // 异步加载子节点
          const loadChildren = async () => {
            try {
              // 去重并复用正在进行的请求
              let p = pendingRef.current.get(target.path)
              if (!p) {
                p = imageService
                  .getCabinetFolders({ parentPath: target.path, page: 1, pageSize: 100 })
                  .then(resp => (resp.folders || []) as RCabinetTreeNode[])
                  .catch(err => {
                    pendingRef.current.delete(target.path)
                    throw err
                  })
                pendingRef.current.set(target.path, p)
              }

              const children = await p
              pendingRef.current.delete(target.path)

              // 使用函数式更新确保基于最新状态
              setTreeData(currentTreeData => {
                const newTreeData = clone(currentTreeData)
                const newTarget = findNodeById(newTreeData, folderId)

                if (!newTarget) return currentTreeData

                children.forEach(c => {
                  c.level = (newTarget.level || 0) + 1
                })
                newTarget.children = children
                newTarget.isLoading = false

                if (!children.length) {
                  ;(newTarget as any).hasChildren = false
                }

                // 缓存子列表
                childrenCacheRef.current.set(
                  target.path,
                  children.map(c => ({ ...c }))
                )

                // 排序子节点
                const cmp = getComparator()
                newTarget.children.sort(cmp)

                return newTreeData
              })
            } catch (e) {
              // 清除loading状态
              setTreeData(currentTreeData => {
                const newTreeData = clone(currentTreeData)
                const newTarget = findNodeById(newTreeData, folderId)
                if (newTarget) {
                  newTarget.isLoading = false
                }
                return newTreeData
              })
            }
          }

          // 立即开始异步加载
          void loadChildren()
        }
      }

      return next
    })

    // 恢复滚动位置
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = prevScroll
    })
  }

  // 处理文件夹选择
  const handleFolderSelect = (folder: RCabinetTreeNode) => {
    onFolderSelect(folder.id, folder.name, folder.path)
  }

  // 递归渲染树节点
  const TreeNodeComponent = ({ node }: { node: RCabinetTreeNode }) => {
    const mayHaveChildren = (node as any).hasChildren !== false
    const hasChildren = !!(node.children && node.children.length > 0)
    const showCaret = hasChildren || mayHaveChildren || node.isLoading
    const isSelected = selectedFolderId === node.id
    const isExpanded = !!node.isExpanded

    return (
      <div className="select-none">
        <div
          data-folder-id={node.id}
          className={cn(
            'flex items-center py-2 px-3 rounded-md cursor-pointer transition-all duration-150',
            'hover:bg-gray-100',
            isSelected && 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            'group'
          )}
          style={{ paddingLeft: `${12 + (node.level || 0) * 20}px` }}
          onClick={() => handleFolderSelect(node)}
        >
          {/* 展开/收起按钮（未知是否有子时也显示，以触发懒加载）*/}
          {showCaret ? (
            <button
              onClick={e => {
                e.stopPropagation()
                toggleFolder(node.id)
              }}
              className="flex-shrink-0 p-1 mr-1 rounded hover:bg-gray-200 transition-colors"
              aria-label={isExpanded ? '收起文件夹' : '展开文件夹'}
            >
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-gray-500 transition-transform duration-150',
                  isExpanded && 'transform rotate-90'
                )}
              />
            </button>
          ) : (
            <div className="w-6 mr-1" />
          )}

          {/* 文件夹图标 */}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
          )}

          {/* 文件夹名称 */}
          <span className="text-sm font-medium truncate flex-1 min-w-0" title={node.name}>
            {node.name}
          </span>

          {/* 文件数量/加载中 */}
          {node.isLoading ? (
            <span className="ml-2 flex-shrink-0">
              <span className="inline-block h-3 w-3 rounded-full border border-t-transparent border-gray-400 animate-spin" />
            </span>
          ) : (
            node.fileCount !== undefined &&
            node.fileCount > 0 && <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{node.fileCount}</span>
          )}
        </div>

        {/* 子文件夹/加载占位：展开即渲染容器 */}
        {isExpanded && (
          <div className="mt-1">
            {node.isLoading ? (
              <div className="pl-6 py-1">
                <span className="inline-block h-3 w-3 rounded-full border border-t-transparent border-gray-400 animate-spin" />
              </div>
            ) : hasChildren ? (
              node.children!.map(childNode => <TreeNodeComponent key={childNode.id} node={childNode} />)
            ) : null}
          </div>
        )}
      </div>
    )
  }

  const filteredTree = filterFolderTree(treeData, searchTerm)

  // 保存展开状态到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('rcabinet_expanded_folders', JSON.stringify(Array.from(expandedFolders)))
    }
  }, [expandedFolders])

  // 排序模式切换时，对现有树做就地排序
  useEffect(() => {
    const sortTree = (nodes: RCabinetTreeNode[]): RCabinetTreeNode[] => {
      const cmp = getComparator()
      const cloned = nodes.map(n => ({ ...n, children: n.children ? sortTree(n.children) : [] }))
      cloned.sort(cmp)
      return cloned
    }
    setTreeData(prev => sortTree(prev))
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('rcabinet_tree_sort_mode', sortMode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortMode])

  // 根据选中的文件夹和展开状态自动加载和展开深层级文件夹
  useEffect(() => {
    if (treeData.length === 0) return

    const autoExpandAndLoad = async () => {
      // 获取所有需要展开的文件夹ID
      const expandedIds = Array.from(expandedFolders)
      if (expandedIds.length === 0) return

      // 递归处理节点，确保按层级顺序加载
      const processNodeSequentially = async (node: RCabinetTreeNode): Promise<void> => {
        // 如果这个节点应该展开
        if (expandedIds.includes(node.id) && node.isExpanded) {
          const hasChildren = !!(node.children && node.children.length > 0)
          const couldHave = (node as any).hasChildren !== false

          if (!hasChildren && couldHave && !node.isLoading) {
            // 检查缓存
            const cached = childrenCacheRef.current.get(node.path)
            if (cached) {
              // 使用缓存数据立即更新
              setTreeData(prevTreeData => {
                const clone = (nodes: RCabinetTreeNode[]): RCabinetTreeNode[] =>
                  nodes.map(n => ({ ...n, children: n.children ? clone(n.children) : [] }))
                const next = clone(prevTreeData)
                const target = findNodeById(next, node.id)

                if (target) {
                  const childrenWithState = cached.map(c => ({
                    ...c,
                    level: (target.level || 0) + 1,
                    isExpanded: expandedIds.includes(c.id)
                  }))
                  target.children = childrenWithState
                  target.isLoading = false
                }

                return next
              })

              // 等待状态更新完成后递归处理子节点
              await new Promise(resolve => setTimeout(resolve, 50))
              for (const child of cached) {
                if (expandedIds.includes(child.id)) {
                  await processNodeSequentially({
                    ...child,
                    level: (node.level || 0) + 1,
                    isExpanded: expandedIds.includes(child.id)
                  })
                }
              }
            } else {
              // 需要异步加载
              try {
                // 防重复请求
                if (pendingRef.current.has(node.path)) return

                // 设置loading状态
                setTreeData(prevTreeData => {
                  const clone = (nodes: RCabinetTreeNode[]): RCabinetTreeNode[] =>
                    nodes.map(n => ({ ...n, children: n.children ? clone(n.children) : [] }))
                  const next = clone(prevTreeData)
                  const target = findNodeById(next, node.id)
                  if (target) {
                    target.isLoading = true
                  }
                  return next
                })

                const p = imageService
                  .getCabinetFolders({ parentPath: node.path, page: 1, pageSize: 100 })
                  .then(resp => (resp.folders || []) as RCabinetTreeNode[])
                pendingRef.current.set(node.path, p)

                const children = await p
                pendingRef.current.delete(node.path)

                // 更新树数据
                setTreeData(prevTreeData => {
                  const clone = (nodes: RCabinetTreeNode[]): RCabinetTreeNode[] =>
                    nodes.map(n => ({ ...n, children: n.children ? clone(n.children) : [] }))
                  const next = clone(prevTreeData)
                  const target = findNodeById(next, node.id)

                  if (target) {
                    const childrenWithState = children.map(c => ({
                      ...c,
                      level: (target.level || 0) + 1,
                      isExpanded: expandedIds.includes(c.id)
                    }))
                    target.children = childrenWithState
                    target.isLoading = false

                    if (!children.length) {
                      ;(target as any).hasChildren = false
                    }

                    // 缓存子列表
                    childrenCacheRef.current.set(
                      node.path,
                      children.map(c => ({ ...c }))
                    )

                    // 排序子节点
                    const cmp = getComparator()
                    target.children.sort(cmp)
                  }

                  return next
                })

                // 等待状态更新完成后递归处理子节点
                await new Promise(resolve => setTimeout(resolve, 50))
                for (const child of children) {
                  if (expandedIds.includes(child.id)) {
                    await processNodeSequentially({
                      ...child,
                      level: (node.level || 0) + 1,
                      isExpanded: expandedIds.includes(child.id)
                    })
                  }
                }
              } catch (e) {
                pendingRef.current.delete(node.path)
                setTreeData(prevTreeData => {
                  const clone = (nodes: RCabinetTreeNode[]): RCabinetTreeNode[] =>
                    nodes.map(n => ({ ...n, children: n.children ? clone(n.children) : [] }))
                  const next = clone(prevTreeData)
                  const target = findNodeById(next, node.id)
                  if (target) {
                    target.isLoading = false
                  }
                  return next
                })
              }
            }
          } else if (hasChildren && node.children) {
            // 如果已有子数据，递归处理子节点
            for (const child of node.children) {
              if (expandedIds.includes(child.id)) {
                await processNodeSequentially(child)
              }
            }
          }
        }
      }

      // 从根节点开始处理（按顺序，不并行）
      for (const rootNode of treeData) {
        if (expandedIds.includes(rootNode.id)) {
          await processNodeSequentially(rootNode)
        }
      }

      // 尝试自动展开到选中文件夹的路径
      if (selectedFolderId && selectedFolderId !== '0') {
        const pathIds = autoExpandPathToFolder(treeData, selectedFolderId)
        if (pathIds.length > 0) {
          setExpandedFolders(prev => new Set([...prev, ...pathIds]))
        }
      }

      // 自动滚动到选中的文件夹（在所有展开完成后）
      if (selectedFolderId && selectedFolderId !== '0') {
        // 等待所有展开动画和数据加载完成后再滚动
        setTimeout(() => {
          scrollToSelectedFolder(selectedFolderId)
        }, 1000)
      }
    }

    // 延迟执行，确保初始渲染完成
    const timer = setTimeout(() => {
      void autoExpandAndLoad()
    }, 200)

    return () => {
      clearTimeout(timer)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [selectedFolderId, treeData.length, expandedFolders.size])

  return (
    <div className={cn('flex flex-col h-full bg-gray-50', className)}>
      {/* 头部 */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{tEditor('文件夹')}</span>
            {isLoading && <span className="text-xs text-gray-500">{tEditor('加载中...')}</span>}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">{tEditor('排序')}</label>
            <select
              className="border border-gray-200 rounded px-2 py-1 text-xs"
              value={sortMode}
              onChange={e => setSortMode(e.target.value as any)}
            >
              <option value="name-asc">{tEditor('名称 A→Z')}</option>
              <option value="name-desc">{tEditor('名称 Z→A')}</option>
              <option value="date-desc">{tEditor('更新日期 新→旧')}</option>
              <option value="date-asc">{tEditor('更新日期 旧→新')}</option>
            </select>
            <button
              className="inline-flex items-center justify-center h-7 w-7 border rounded hover:bg-gray-50"
              title={tEditor('刷新文件夹')}
              onClick={async () => {
                try {
                  setIsLoading(true)
                  setError(null)
                  const resp = await imageService.getCabinetFolders({ all: true, page: 1, pageSize: 500, force: true })
                  const tree = buildFolderTree(resp.folders || [])
                  setTreeData(tree)
                  setLoadedAll(true)
                } catch (e) {
                  setError(tEditor('刷新失败，请重试'))
                } finally {
                  setIsLoading(false)
                }
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={tEditor('搜索文件夹...')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-200 transition-colors"
              title={tEditor('清除搜索')}
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* 文件夹树 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2">
        {/* 根目录 */}
        {!searchTerm.trim() && (
          <div
            data-folder-id="0"
            className={cn(
              'flex items-center py-2 px-3 rounded-md cursor-pointer transition-all duration-150',
              'hover:bg-gray-100 mb-2',
              selectedFolderId === '0' && 'bg-blue-100 text-blue-700 hover:bg-blue-100'
            )}
            onClick={() => onFolderSelect('0', tEditor('根目录'), '')}
          >
            <div className="w-6 mr-1" />
            <Folder className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm font-medium">{tEditor('根目录')}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        ) : filteredTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {searchTerm ? tEditor('未找到匹配的文件夹') : tEditor('暂无文件夹')}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTree.map(node => (
              <TreeNodeComponent key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
