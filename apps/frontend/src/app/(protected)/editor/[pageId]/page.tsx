'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePageStore } from '@/stores/usePageStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { EditorLayout } from '@/components/editor/EditorLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAutoSave } from '@/hooks/useAutoSave';
import { pageService } from '@/services/pageService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/I18nContext';

function EditorPageContent() {
  const params = useParams();
  const pageId = params.pageId as string;
  const { tEditor, tCommon, tError } = useTranslation();

  const { 
    currentPage, 
    setPage, 
    clearPage, 
    isPageLoaded 
  } = usePageStore();
  
  const { 
    isLoading, 
    error, 
    setLoading, 
    setError, 
    reset 
  } = useEditorStore();

  // 启用自动保存
  useAutoSave({
    interval: 30000, // 30秒自动保存
    enabled: true,
    onSave: () => {
      console.log(tEditor('自动保存完成'));
    },
    onError: (error) => {
      console.error(tEditor('自动保存失败:'), error);
    }
  });

  // 加载页面数据
  useEffect(() => {
    const loadPage = async () => {
      if (!pageId) return;

      try {
        setLoading(true);
        setError(null);
        
        const page = await pageService.getPage(pageId);
        setPage(page);
      } catch (error) {
        console.error(tError('加载页面失败:'), error);
        setError(error instanceof Error ? error.message : tError('加载页面失败'));
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pageId, setPage, setLoading, setError, tError]);

  // 清理状态
  useEffect(() => {
    return () => {
      clearPage();
      reset();
    };
  }, [clearPage, reset]);

  // 重试加载
  const handleRetry = () => {
    window.location.reload();
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          <h2 className="text-lg font-semibold mb-2">{tEditor('加载页面中...')}</h2>
          <p className="text-muted-foreground">{tEditor('正在获取页面数据')}</p>
        </Card>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-semibold mb-2">{tError('加载失败')}</h2>
          <p className="text-muted-foreground mb-6">
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {tCommon('重试')}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pages">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tCommon('返回页面列表')}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 页面未找到
  if (isPageLoaded && !currentPage) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-lg font-semibold mb-2">{tError('页面不存在')}</h2>
          <p className="text-muted-foreground mb-6">
            {tError('页面 ID')} "{pageId}" {tError('不存在或您没有访问权限')}
          </p>
          <Button variant="outline" asChild>
            <Link href="/pages">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tCommon('返回页面列表')}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  // 正常渲染编辑器
  if (currentPage) {
    return <EditorLayout pageId={pageId} />;
  }

  // 默认加载状态
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Card className="p-8 text-center">
        <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-muted-foreground">{tEditor('初始化编辑器...')}</p>
      </Card>
    </div>
  );
}

export default function EditorPage() {
  return (
    <ErrorBoundary>
      <EditorPageContent />
    </ErrorBoundary>
  );
} 