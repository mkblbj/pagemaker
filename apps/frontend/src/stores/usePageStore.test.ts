import { renderHook, act } from '@testing-library/react';
import { usePageStore } from './usePageStore';
import type { PageTemplate, PageModule } from '@pagemaker/shared-types';
import { PageModuleType } from '@pagemaker/shared-types';

describe('usePageStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    usePageStore.setState({
      currentPage: null,
      selectedModuleId: null,
      targetArea: 'pc',
      isPageLoaded: false,
      hasUnsavedChanges: false,
    });
  });

  const mockPage: PageTemplate = {
    id: 'test-page-id',
    name: 'Test Page',
    content: [
      {
        id: 'module-1',
        type: PageModuleType.TEXT,
      }
    ],
    target_area: 'pc',
    owner_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    module_count: 1
  };

  it('应该初始化默认状态', () => {
    const { result } = renderHook(() => usePageStore());
    
    expect(result.current.currentPage).toBeNull();
    expect(result.current.selectedModuleId).toBeNull();
    expect(result.current.targetArea).toBe('pc');
    expect(result.current.isPageLoaded).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('应该正确设置页面', () => {
    const { result } = renderHook(() => usePageStore());
    
    act(() => {
      result.current.setPage(mockPage);
    });

    expect(result.current.currentPage).toEqual(mockPage);
    expect(result.current.isPageLoaded).toBe(true);
    expect(result.current.targetArea).toBe('pc');
  });

  it('应该正确更新页面信息', () => {
    const { result } = renderHook(() => usePageStore());
    
    act(() => {
      result.current.setPage(mockPage);
      result.current.updatePage({ name: 'Updated Name' });
    });

    expect(result.current.currentPage?.name).toBe('Updated Name');
  });

  it('应该正确添加模块', () => {
    const { result } = renderHook(() => usePageStore());
    
    act(() => {
      result.current.setPage(mockPage);
    });

    const newModule: PageModule = {
      id: 'module-2',
      type: PageModuleType.IMAGE,
    };

    act(() => {
      result.current.addModule(newModule);
    });

    expect(result.current.currentPage?.content).toHaveLength(2);
    expect(result.current.currentPage?.content[1]).toEqual(newModule);
    expect(result.current.currentPage?.module_count).toBe(2);
  });

  it('应该正确更新模块', () => {
    const { result } = renderHook(() => usePageStore());
    
    act(() => {
      result.current.setPage(mockPage);
    });

    const updatedContent = { text: 'Updated Text' };
    
    act(() => {
      result.current.updateModule('module-1', { content: updatedContent });
    });

    expect(result.current.currentPage?.content[0].content).toEqual(updatedContent);
  });

  it('应该正确删除模块', () => {
    const { result } = renderHook(() => usePageStore());
    
    act(() => {
      result.current.setPage(mockPage);
      result.current.deleteModule('module-1');
    });

    expect(result.current.currentPage?.content).toHaveLength(0);
    expect(result.current.currentPage?.module_count).toBe(0);
    expect(result.current.selectedModuleId).toBeNull();
  });

  it('应该正确重新排序模块', () => {
    const { result } = renderHook(() => usePageStore());
    
    const pageWithMultipleModules: PageTemplate = {
      ...mockPage,
      content: [
        { id: 'module-1', type: PageModuleType.TEXT },
        { id: 'module-2', type: PageModuleType.TEXT },
      ],
      module_count: 2
    };

    act(() => {
      result.current.setPage(pageWithMultipleModules);
      result.current.reorderModules(0, 1);
    });

    expect(result.current.currentPage?.content[0].id).toBe('module-2');
    expect(result.current.currentPage?.content[1].id).toBe('module-1');
  });

  it('应该正确设置选中的模块', () => {
    const { result } = renderHook(() => usePageStore());
    
    act(() => {
      result.current.setPage(mockPage);
      result.current.setSelectedModule('module-1');
    });

    expect(result.current.selectedModuleId).toBe('module-1');
  });

  it('应该正确设置目标区域', () => {
    const { result } = renderHook(() => usePageStore());
    
    act(() => {
      result.current.setPage(mockPage);
      result.current.setTargetArea('mobile');
    });

    expect(result.current.targetArea).toBe('mobile');
    expect(result.current.currentPage?.target_area).toBe('mobile');
  });

  it('应该正确管理保存状态', () => {
    const { result } = renderHook(() => usePageStore());
    
    act(() => {
      result.current.setPage(mockPage);
      result.current.markUnsaved();
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.markSaved();
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('应该正确清空页面', () => {
    const { result } = renderHook(() => usePageStore());
    
    act(() => {
      result.current.setPage(mockPage);
      result.current.setSelectedModule('module-1');
      result.current.markUnsaved();
    });

    act(() => {
      result.current.clearPage();
    });

    expect(result.current.currentPage).toBeNull();
    expect(result.current.selectedModuleId).toBeNull();
    expect(result.current.isPageLoaded).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });
}); 