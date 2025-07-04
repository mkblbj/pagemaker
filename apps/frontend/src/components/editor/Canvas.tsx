'use client';

import { useState, useCallback } from 'react';
import { usePageStore } from '@/stores/usePageStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleRenderer } from './ModuleRenderer';
import { 
  Plus, 
  FileText, 
  GripVertical,
  Trash2,
  Copy,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { PageModuleType } from '@pagemaker/shared-types';

export function Canvas() {
  const { 
    currentPage, 
    selectedModuleId, 
    setSelectedModule,
    deleteModule,
    reorderModules,
    addModule
  } = usePageStore();
  
  const { 
    isDragging, 
    setDragging, 
    markUnsaved 
  } = useEditorStore();

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const modules = currentPage?.content || [];

  // 处理拖拽放置
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'MODULE') {
        // 从模块库拖拽新模块
        const newModule = {
          id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: data.moduleType,
          // 根据模块类型添加默认配置
          ...(data.moduleType === PageModuleType.TITLE && {
            text: '新标题',
            level: 1
          }),
          ...(data.moduleType === PageModuleType.TEXT && {
            text: '请输入文本内容'
          }),
          ...(data.moduleType === PageModuleType.IMAGE && {
            src: '',
            alt: '图片描述'
          }),
          ...(data.moduleType === PageModuleType.KEY_VALUE && {
            pairs: [{ key: '键', value: '值' }]
          }),
          ...(data.moduleType === PageModuleType.MULTI_COLUMN && {
            columns: 2,
            items: []
          })
        };

        // 在指定位置插入模块
        const newModules = [...modules];
        newModules.splice(dropIndex, 0, newModule);
        
        // 更新页面内容
        if (currentPage) {
          const updatedPage = {
            ...currentPage,
            content: newModules,
            module_count: newModules.length
          };
          // 这里应该调用updatePage，但为了简化先直接更新
          addModule(newModule);
        }
        
        markUnsaved();
      } else if (data.type === 'REORDER') {
        // 重新排序现有模块
        const sourceIndex = data.sourceIndex;
        if (sourceIndex !== dropIndex) {
          reorderModules(sourceIndex, dropIndex);
          markUnsaved();
        }
      }
    } catch (error) {
      console.error('拖拽数据解析失败:', error);
    }
    
    setDragOverIndex(null);
    setDragging(false);
  }, [modules, currentPage, addModule, reorderModules, markUnsaved, setDragging]);

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  // 处理拖拽离开
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  // 处理模块选择
  const handleModuleSelect = useCallback((moduleId: string) => {
    setSelectedModule(moduleId === selectedModuleId ? null : moduleId);
  }, [selectedModuleId, setSelectedModule]);

  // 处理模块删除
  const handleModuleDelete = useCallback((moduleId: string) => {
    deleteModule(moduleId);
    markUnsaved();
  }, [deleteModule, markUnsaved]);

  // 处理模块复制
  const handleModuleCopy = useCallback((moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      const newModule = {
        ...module,
        id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      addModule(newModule);
      markUnsaved();
    }
  }, [modules, addModule, markUnsaved]);

  // 处理模块移动
  const handleModuleMove = useCallback((moduleId: string, direction: 'up' | 'down') => {
    const currentIndex = modules.findIndex(m => m.id === moduleId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < modules.length) {
      reorderModules(currentIndex, newIndex);
      markUnsaved();
    }
  }, [modules, reorderModules, markUnsaved]);

  return (
    <div className="h-full bg-gray-50 p-6" data-testid="canvas">
      <div className="max-w-4xl mx-auto">
        {/* 画布头部 */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-2">页面预览</h2>
            <p className="text-sm text-muted-foreground">
              {modules.length === 0 
                ? '从左侧拖拽模块到此处开始构建页面' 
                : `共 ${modules.length} 个模块`
              }
            </p>
          </div>
        </div>

        {/* 模块列表 */}
        <div className="space-y-4">
          {modules.length === 0 ? (
            // 空状态
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-white"
              onDrop={(e) => handleDrop(e, 0)}
              onDragOver={(e) => handleDragOver(e, 0)}
              onDragLeave={handleDragLeave}
            >
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                开始创建您的页面
              </h3>
              <p className="text-gray-500 mb-4">
                从左侧模块库拖拽模块到此处，或点击下方按钮添加模块
              </p>
              <Button variant="outline" onClick={() => {
                // 添加一个默认的文本模块
                const newModule = {
                  id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: PageModuleType.TEXT,
                  text: '欢迎使用页面编辑器！'
                };
                addModule(newModule);
                markUnsaved();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                添加文本模块
              </Button>
            </div>
          ) : (
            // 渲染模块
            modules.map((module, index) => (
              <div key={module.id} className="relative">
                {/* 拖拽放置区域 */}
                {dragOverIndex === index && (
                  <div className="h-2 bg-primary/20 rounded-full mb-2" />
                )}
                
                {/* 模块容器 */}
                <Card 
                  className={`relative bg-white transition-all duration-200 ${
                    selectedModuleId === module.id 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleModuleSelect(module.id)}
                  data-testid={`module-${module.id}`}
                >
                  {/* 模块工具栏 */}
                  {selectedModuleId === module.id && (
                    <div className="absolute -top-10 right-0 flex items-center gap-1 bg-white border rounded-lg px-2 py-1 shadow-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleMove(module.id, 'up');
                        }}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <MoveUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleMove(module.id, 'down');
                        }}
                        disabled={index === modules.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleCopy(module.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleDelete(module.id);
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* 拖拽手柄 */}
                  <div 
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-move opacity-0 hover:opacity-100 transition-opacity"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'REORDER',
                        sourceIndex: index
                      }));
                    }}
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>

                  {/* 模块内容 */}
                  <div className="p-4 ml-6">
                    <ModuleRenderer module={module} />
                  </div>
                </Card>

                {/* 模块间的拖拽放置区域 */}
                <div
                  className="h-4 -my-2 relative z-10"
                  onDrop={(e) => handleDrop(e, index + 1)}
                  onDragOver={(e) => handleDragOver(e, index + 1)}
                  onDragLeave={handleDragLeave}
                >
                  {dragOverIndex === index + 1 && (
                    <div className="h-2 bg-primary/20 rounded-full" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部拖拽区域 */}
        {modules.length > 0 && (
          <div
            className="h-16 border-2 border-dashed border-gray-300 rounded-lg mt-4 flex items-center justify-center text-gray-500 bg-white"
            onDrop={(e) => handleDrop(e, modules.length)}
            onDragOver={(e) => handleDragOver(e, modules.length)}
            onDragLeave={handleDragLeave}
          >
            {dragOverIndex === modules.length ? (
              <div className="text-primary">放置模块到此处</div>
            ) : (
              <div className="text-sm">拖拽模块到此处添加</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 