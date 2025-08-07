'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, File, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

// Define the file type as specified
interface FileItem {
  name: string
  is_directory: boolean
}

// Extended type for our hierarchical structure
interface TreeNode extends FileItem {
  id: string
  children?: TreeNode[]
  path: string
  isLoading?: boolean
  isExpanded?: boolean
}

// Normalize path to ensure it starts with a slash and has no trailing slash
const normalizePath = (path: string): string => {
  if (!path) return '/'
  return path.startsWith('/') ? path : `/${path}`
}

// Get parent path from a given path
const getParentPath = (path: string): string => {
  const normalizedPath = normalizePath(path)
  if (normalizedPath === '/') return '/'

  const lastSlashIndex = normalizedPath.lastIndexOf('/')
  if (lastSlashIndex <= 0) return '/'

  return normalizedPath.substring(0, lastSlashIndex) || '/'
}

// Get path segments from a path (e.g., "/a/b/c" -> ["/", "/a", "/a/b", "/a/b/c"])
const getPathSegments = (path: string): string[] => {
  const normalizedPath = normalizePath(path)
  if (normalizedPath === '/') return ['/']

  const segments = normalizedPath.split('/').filter(Boolean)
  return segments.reduce(
    (acc, segment, index) => {
      const previousPath = index === 0 ? '/' : acc[index]
      const currentPath = previousPath === '/' ? `/${segment}` : `${previousPath}/${segment}`
      return [...acc, currentPath]
    },
    ['/']
  )
}

// Extract the name from a path
const getNameFromPath = (path: string): string => {
  const normalizedPath = normalizePath(path)
  if (normalizedPath === '/') return '/'

  const parts = normalizedPath.split('/').filter(Boolean)
  return parts[parts.length - 1]
}

// Sample API function to fetch files
const fetchFiles = async (path = '/'): Promise<FileItem[]> => {
  // Normalize the path
  const normalizedPath = normalizePath(path)

  // In a real application, this would be an API call
  // For demo purposes, we'll simulate a network request
  return new Promise(resolve => {
    setTimeout(() => {
      // This is sample data - replace with your actual API call
      if (normalizedPath === '/') {
        resolve([
          { name: 'Documents', is_directory: true },
          { name: 'Images', is_directory: true },
          { name: 'readme.md', is_directory: false },
          { name: 'config.json', is_directory: false }
        ])
      } else if (normalizedPath === '/Documents') {
        resolve([
          { name: 'Work', is_directory: true },
          { name: 'Personal', is_directory: true },
          { name: 'report.pdf', is_directory: false }
        ])
      } else if (normalizedPath === '/Documents/Work') {
        resolve([
          { name: 'Project1', is_directory: true },
          { name: 'meeting-notes.txt', is_directory: false }
        ])
      } else if (normalizedPath === '/Documents/Personal') {
        resolve([
          { name: 'resume.pdf', is_directory: false },
          { name: 'notes.txt', is_directory: false }
        ])
      } else if (normalizedPath === '/Images') {
        resolve([
          { name: 'Vacation', is_directory: true },
          { name: 'profile.jpg', is_directory: false },
          { name: 'banner.png', is_directory: false }
        ])
      } else if (normalizedPath === '/Images/Vacation') {
        resolve([
          { name: 'beach.jpg', is_directory: false },
          { name: 'mountain.jpg', is_directory: false }
        ])
      } else if (normalizedPath === '/Documents/Work/Project1') {
        resolve([
          { name: 'specs.docx', is_directory: false },
          { name: 'data.xlsx', is_directory: false }
        ])
      } else {
        resolve([])
      }
    }, 500) // Simulate network delay
  })
}

interface FileTreeProps {
  initialPath?: string
}

export function FileTree({ initialPath = '/' }: FileTreeProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initial data fetch with recursive path resolution
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const normalizedInitialPath = normalizePath(initialPath)
        const pathSegments = getPathSegments(normalizedInitialPath)

        // Start with root data
        const rootFiles = await fetchFiles('/')
        const currentTreeData = rootFiles.map(file => ({
          ...file,
          id: `/${file.name}`,
          path: `/${file.name}`,
          isExpanded: false,
          children: file.is_directory ? [] : undefined
        }))

        // Skip the root path as we've already fetched it
        for (let i = 1; i < pathSegments.length; i++) {
          const currentPath = pathSegments[i]
          const parentPath = getParentPath(currentPath)
          const currentName = getNameFromPath(currentPath)

          // Find the parent node in the current tree data
          const findAndUpdateNode = (
            nodes: TreeNode[],
            path: string,
            updateFn: (node: TreeNode) => TreeNode
          ): boolean => {
            for (let j = 0; j < nodes.length; j++) {
              const node = nodes[j]
              if (node.path === path) {
                nodes[j] = updateFn(node)
                return true
              }
              if (node.children) {
                if (findAndUpdateNode(node.children, path, updateFn)) {
                  return true
                }
              }
            }
            return false
          }

          // Fetch children for the current path segment
          const childFiles = await fetchFiles(currentPath)
          const childNodes = childFiles.map(file => ({
            ...file,
            id: `${currentPath}/${file.name}`,
            path: `${currentPath}/${file.name}`,
            isExpanded: false,
            children: file.is_directory ? [] : undefined
          }))

          // Update the tree with the new children and expanded state
          findAndUpdateNode(currentTreeData, currentPath, node => ({
            ...node,
            isExpanded: true,
            children: childNodes
          }))
        }

        // Expand all nodes in the initial path
        for (let i = 0; i < pathSegments.length; i++) {
          const pathToExpand = pathSegments[i]
          if (pathToExpand === '/') continue // Skip root

          // Find and expand the node
          const findAndExpandNode = (nodes: TreeNode[], path: string): boolean => {
            for (let j = 0; j < nodes.length; j++) {
              const node = nodes[j]
              if (node.path === path) {
                nodes[j] = { ...node, isExpanded: true }
                return true
              }
              if (node.children && node.isExpanded) {
                if (findAndExpandNode(node.children, path)) {
                  return true
                }
              }
            }
            return false
          }

          findAndExpandNode(currentTreeData, pathToExpand)
        }

        setTreeData(currentTreeData)
      } catch (error) {
        console.error('Failed to fetch files:', error)
        setError('Failed to load file tree. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [initialPath])

  // Handle node expansion
  const handleToggle = async (node: TreeNode) => {
    if (!node.is_directory) return

    // Create a deep copy of the current tree data
    const updateTreeData = (nodes: TreeNode[], path: string, updateFn: (node: TreeNode) => TreeNode): TreeNode[] => {
      return nodes.map(n => {
        if (n.path === path) {
          return updateFn(n)
        }
        if (n.children) {
          return {
            ...n,
            children: updateTreeData(n.children, path, updateFn)
          }
        }
        return n
      })
    }

    // If the node is already expanded, just collapse it
    if (node.isExpanded) {
      setTreeData(
        updateTreeData(treeData, node.path, n => ({
          ...n,
          isExpanded: false
        }))
      )
      return
    }

    // If children are already loaded, just expand
    if (node.children && node.children.length > 0) {
      setTreeData(
        updateTreeData(treeData, node.path, n => ({
          ...n,
          isExpanded: true
        }))
      )
      return
    }

    // Set loading state
    setTreeData(
      updateTreeData(treeData, node.path, n => ({
        ...n,
        isLoading: true
      }))
    )

    try {
      // Fetch children
      const childFiles = await fetchFiles(node.path)
      const childNodes = childFiles.map(file => ({
        ...file,
        id: `${node.path}/${file.name}`,
        path: `${node.path}/${file.name}`,
        isExpanded: false,
        children: file.is_directory ? [] : undefined
      }))

      // Update the tree with new children and expanded state
      setTreeData(
        updateTreeData(treeData, node.path, n => ({
          ...n,
          isLoading: false,
          isExpanded: true,
          children: childNodes
        }))
      )
    } catch (error) {
      console.error(`Failed to fetch children for ${node.path}:`, error)
      // Reset loading state on error
      setTreeData(
        updateTreeData(treeData, node.path, n => ({
          ...n,
          isLoading: false
        }))
      )
    }
  }

  // Recursive component to render tree nodes
  const TreeNodeComponent = ({ node }: { node: TreeNode }) => {
    return (
      <div className="select-none">
        <div
          className={cn(
            'flex items-center py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer',
            node.isExpanded && 'bg-muted/30'
          )}
          onClick={() => handleToggle(node)}
          aria-expanded={node.isExpanded}
          role={node.is_directory ? 'treeitem' : undefined}
          aria-label={`${node.name}${node.is_directory ? ' (directory)' : ' (file)'}`}
        >
          {node.is_directory ? (
            <ChevronRight
              className={cn(
                'h-4 w-4 mr-1 text-muted-foreground transition-transform',
                node.isExpanded && 'transform rotate-90'
              )}
              aria-hidden="true"
            />
          ) : (
            <div className="w-5" />
          )}
          {node.is_directory ? (
            <Folder className="h-4 w-4 mr-2 text-blue-500" aria-hidden="true" />
          ) : (
            <File className="h-4 w-4 mr-2 text-gray-500" aria-hidden="true" />
          )}
          <span className="text-sm">{node.name}</span>
          {node.isLoading && (
            <div
              className="ml-2 h-3 w-3 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"
              aria-label="Loading"
              role="status"
            />
          )}
        </div>
        {node.isExpanded && node.children && (
          <div className="ml-4 pl-2 border-l border-muted" role="group">
            {node.children.map(childNode => (
              <TreeNodeComponent key={childNode.id} node={childNode} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md border rounded-lg p-4 bg-background">
      <h2 className="text-lg font-medium mb-4">File Explorer</h2>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div
            className="h-6 w-6 rounded-full border-2 border-t-transparent border-primary animate-spin"
            aria-label="Loading file tree"
            role="status"
          />
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : treeData.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">No files found</div>
      ) : (
        <div className="space-y-1" role="tree" aria-label="File tree">
          {treeData.map(node => (
            <TreeNodeComponent key={node.id} node={node} />
          ))}
        </div>
      )}
    </div>
  )
}
