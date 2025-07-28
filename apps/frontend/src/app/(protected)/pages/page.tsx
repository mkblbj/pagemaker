'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Eye, FileText, Calendar, Monitor, Smartphone, Globe } from 'lucide-react'
import { pageService } from '@/services/pageService'
import { PageTemplateListItem } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

export default function PagesPage() {
  const router = useRouter()
  const { tCommon, tEditor, tError } = useTranslation()
  const [pages, setPages] = useState<PageTemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // 获取页面列表
  const fetchPages = useCallback(async (search?: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await pageService.getPages({
        search: search || undefined,
        limit: 50
      })
      setPages(result.pages)
    } catch (error) {
      console.error('获取页面列表失败:', error)
      setError(error instanceof Error ? error.message : '获取页面列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 当防抖搜索词变化时获取页面
  useEffect(() => {
    fetchPages(debouncedSearchTerm)
  }, [debouncedSearchTerm, fetchPages])

  // 获取目标区域图标
  const getTargetAreaIcon = (area: string) => {
    switch (area) {
      case 'pc':
        return <Monitor className="h-4 w-4" />
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  // 处理编辑页面
  const handleEditPage = (pageId: string) => {
    router.push(`/editor/${pageId}`)
  }

  // 处理预览页面
  const handlePreviewPage = (pageId: string) => {
    window.open(`/preview/${pageId}`, '_blank', 'width=480,height=900,scrollbars=no,resizable=yes')
  }

  // 处理删除页面
  const handleDeletePage = async (pageId: string) => {
    if (!confirm(tCommon('确定要删除这个页面吗？此操作不可撤销。'))) {
      return
    }

    try {
      await pageService.deletePage(pageId)
      setPages(pages.filter(page => page.id !== pageId))
    } catch (error) {
      console.error('删除页面失败:', error)
      alert(tError('删除页面失败，请重试'))
    }
  }

  // 处理创建新页面
  const handleCreatePage = () => {
    router.push('/editor/new')
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="container mx-auto p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{tCommon('页面管理')}</h1>
          <p className="text-muted-foreground">{tCommon('管理您的页面模板，创建和编辑页面内容')}</p>
        </div>
        <Button onClick={handleCreatePage}>
          <Plus className="h-4 w-4 mr-2" />
          {tCommon('创建页面')}
        </Button>
      </div>

      {/* 搜索和过滤 */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tCommon('搜索页面...')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 页面列表 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{tError('加载失败')}</h3>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      ) : pages.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? tCommon('没有找到匹配的页面') : tCommon('还没有页面')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? tCommon('尝试使用不同的关键词搜索') : tCommon('创建您的第一个页面开始使用')}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreatePage}>
              <Plus className="h-4 w-4 mr-2" />
              {tCommon('创建页面')}
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map(page => (
            <Card key={page.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{page.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getTargetAreaIcon(page.target_area)}
                      <Badge variant="outline" className="text-xs">
                        {page.target_area === 'pc'
                          ? tEditor('PC端')
                          : page.target_area === 'mobile'
                            ? tEditor('移动端')
                            : page.target_area}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 页面信息 */}
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>
                        {page.module_count || 0} {tCommon('个模块')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {tCommon('更新于')} {formatDate(page.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditPage(page.id)} className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      {tCommon('编辑')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePreviewPage(page.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePage(page.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 页面统计 */}
      {pages.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {tCommon('共')} {pages.length} {tCommon('个页面')}
        </div>
      )}
    </div>
  )
}
