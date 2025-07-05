'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { PageTemplate } from '@pagemaker/shared-types';

interface ConflictData {
  localVersion: PageTemplate;
  serverVersion: PageTemplate;
  conflictFields: string[];
  lastSyncTime: string;
  serverLastModified: string;
  conflictingUser?: string;
}

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictData: ConflictData | null;
  onResolve: (resolution: 'local' | 'server' | 'merge') => Promise<void>;
  isResolving?: boolean;
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflictData,
  onResolve,
  isResolving = false
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'server' | 'merge' | null>(null);

  if (!conflictData) return null;

  const { localVersion, serverVersion, conflictFields, lastSyncTime, serverLastModified, conflictingUser } = conflictData;

  const handleResolve = async () => {
    if (!selectedResolution) return;
    
    try {
      await onResolve(selectedResolution);
      onOpenChange(false);
      setSelectedResolution(null);
    } catch (error) {
      console.error('解决冲突失败:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getFieldDisplayName = (field: string) => {
    const fieldMap: Record<string, string> = {
      name: '页面名称',
      content: '页面内容',
      target_area: '目标区域',
      module_count: '模块数量'
    };
    return fieldMap[field] || field;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            数据冲突检测
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 冲突概览 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">冲突概览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>您的最后保存: {formatDate(lastSyncTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>服务器最后更新: {formatDate(serverLastModified)}</span>
                </div>
                {conflictingUser && (
                  <div className="flex items-center gap-2 col-span-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <span>冲突用户: {conflictingUser}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium mb-2">冲突字段:</p>
                <div className="flex flex-wrap gap-1">
                  {conflictFields.map((field) => (
                    <Badge key={field} variant="destructive" className="text-xs">
                      {getFieldDisplayName(field)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 版本对比 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 本地版本 */}
            <Card className={`transition-all ${selectedResolution === 'local' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  您的版本 (本地)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">页面名称:</span>
                      <p className="text-muted-foreground">{localVersion.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">目标区域:</span>
                      <p className="text-muted-foreground">{localVersion.target_area}</p>
                    </div>
                    <div>
                      <span className="font-medium">模块数量:</span>
                      <p className="text-muted-foreground">{localVersion.module_count || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium">最后修改:</span>
                      <p className="text-muted-foreground">{formatDate(localVersion.updated_at)}</p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* 服务器版本 */}
            <Card className={`transition-all ${selectedResolution === 'server' ? 'ring-2 ring-green-500' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  服务器版本 (远程)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">页面名称:</span>
                      <p className="text-muted-foreground">{serverVersion.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">目标区域:</span>
                      <p className="text-muted-foreground">{serverVersion.target_area}</p>
                    </div>
                    <div>
                      <span className="font-medium">模块数量:</span>
                      <p className="text-muted-foreground">{serverVersion.module_count || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium">最后修改:</span>
                      <p className="text-muted-foreground">{formatDate(serverVersion.updated_at)}</p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* 解决方案选择 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">选择解决方案</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* 使用本地版本 */}
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedResolution === 'local' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedResolution('local')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedResolution === 'local' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedResolution === 'local' && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">使用我的版本</h4>
                      <p className="text-sm text-muted-foreground">
                        保留您的本地更改，覆盖服务器版本
                      </p>
                    </div>
                  </div>
                </div>

                {/* 使用服务器版本 */}
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedResolution === 'server' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedResolution('server')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedResolution === 'server' 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedResolution === 'server' && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">使用服务器版本</h4>
                      <p className="text-sm text-muted-foreground">
                        放弃您的本地更改，使用服务器最新版本
                      </p>
                    </div>
                  </div>
                </div>

                {/* 手动合并 */}
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedResolution === 'merge' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedResolution('merge')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedResolution === 'merge' 
                        ? 'border-purple-500 bg-purple-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedResolution === 'merge' && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">手动合并</h4>
                      <p className="text-sm text-muted-foreground">
                        进入合并模式，手动选择要保留的内容
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isResolving}
          >
            取消
          </Button>
          <Button 
            onClick={handleResolve}
            disabled={!selectedResolution || isResolving}
          >
            {isResolving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                解决中...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                解决冲突
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 