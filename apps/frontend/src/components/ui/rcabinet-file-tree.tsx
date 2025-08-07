'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Folder, FolderOpen, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { imageService, type CabinetFolder } from '@/services/imageService'

// R-Cabinet 文件夹树节点接口
interface RCabinetTreeNode extends CabinetFolder {
  children?: RCabinetTreeNode[]
  isLoading?: boolean
  isExpanded?: boolean
  level?: number
}

interface RCabinetFileTreeProps {
  onFolderSelect: (folderId: string, folderName: string) => void
  selectedFolderId?: string
  className?: string
}

export function RCabinetFileTree({ onFolderSelect, selectedFolderId = '0', className }: RCabinetFileTreeProps) {
  const [treeData, setTreeData] = useState<RCabinetTreeNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

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
          folder.children.sort((a, b) => a.name.localeCompare(b.name))
          setLevelsAndSort(folder.children, level + 1)
        }
      })
    }

    rootFolders.sort((a, b) => a.name.localeCompare(b.name))
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

  // 初始数据加载
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await imageService.getCabinetFolders({ page: 1, pageSize: 1000 })
        const tree = buildFolderTree(response.folders)
        setTreeData(tree)
      } catch (error) {
        console.error('加载R-Cabinet文件夹失败:', error)
        setError('加载文件夹失败，请重试')
      } finally {
        setIsLoading(false)
      }
    }

    loadFolders()
  }, [])

  // 切换文件夹展开状态
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })

    // 更新树数据中的展开状态
    const updateTreeData = (nodes: RCabinetTreeNode[]): RCabinetTreeNode[] => {
      return nodes.map(node => {
        if (node.id === folderId) {
          return { ...node, isExpanded: !node.isExpanded }
        }
        if (node.children) {
          return { ...node, children: updateTreeData(node.children) }
        }
        return node
      })
    }

    setTreeData(updateTreeData)
  }

  // 处理文件夹选择
  const handleFolderSelect = (folder: RCabinetTreeNode) => {
    onFolderSelect(folder.id, folder.name)
  }

  // 递归渲染树节点
  const TreeNodeComponent = ({ node }: { node: RCabinetTreeNode }) => {
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedFolderId === node.id
    const isExpanded = expandedFolders.has(node.id)

    return (
      <div className="select-none">
        <div
          className={cn(
            'flex items-center py-2 px-3 rounded-md cursor-pointer transition-all duration-150',
            'hover:bg-gray-100',
            isSelected && 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            'group'
          )}
          style={{ paddingLeft: `${12 + (node.level || 0) * 20}px` }}
          onClick={() => handleFolderSelect(node)}
        >
          {/* 展开/收起按钮 */}
          {hasChildren ? (
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

          {/* 文件数量 */}
          {node.fileCount !== undefined && node.fileCount > 0 && (
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{node.fileCount}</span>
          )}
        </div>

        {/* 子文件夹 */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children!.map(childNode => (
              <TreeNodeComponent key={childNode.id} node={childNode} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const filteredTree = filterFolderTree(treeData, searchTerm)

  return (
    <div className={cn('flex flex-col h-full bg-gray-50', className)}>
      {/* 头部 */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center gap-2 mb-3">
          <Folder className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">文件夹</span>
          {isLoading && <span className="text-xs text-gray-500">加载中...</span>}
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文件夹..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-200 transition-colors"
              title="清除搜索"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* 文件夹树 */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* 根目录 */}
        {!searchTerm.trim() && (
          <div
            className={cn(
              'flex items-center py-2 px-3 rounded-md cursor-pointer transition-all duration-150',
              'hover:bg-gray-100 mb-2',
              selectedFolderId === '0' && 'bg-blue-100 text-blue-700 hover:bg-blue-100'
            )}
            onClick={() => onFolderSelect('0', '根目录')}
          >
            <div className="w-6 mr-1" />
            <Folder className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm font-medium">根目录</span>
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
            {searchTerm ? '未找到匹配的文件夹' : '暂无文件夹'}
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
