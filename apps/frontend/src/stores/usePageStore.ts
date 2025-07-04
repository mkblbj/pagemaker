import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PageTemplate, PageModule } from '@pagemaker/shared-types';

interface PageState {
  // 当前页面数据
  currentPage: PageTemplate | null;
  
  // 选中的模块ID
  selectedModuleId: string | null;
  
  // 目标区域
  targetArea: string;
  
  // 页面是否已加载
  isPageLoaded: boolean;
  
  // 未保存的更改
  hasUnsavedChanges: boolean;
  
  // Actions
  setPage: (page: PageTemplate) => void;
  updatePage: (updates: Partial<PageTemplate>) => void;
  addModule: (module: PageModule) => void;
  updateModule: (moduleId: string, updates: Partial<PageModule>) => void;
  deleteModule: (moduleId: string) => void;
  reorderModules: (sourceIndex: number, destinationIndex: number) => void;
  setSelectedModule: (moduleId: string | null) => void;
  setTargetArea: (area: string) => void;
  markSaved: () => void;
  markUnsaved: () => void;
  clearPage: () => void;
}

export const usePageStore = create<PageState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentPage: null,
      selectedModuleId: null,
      targetArea: 'pc', // 默认PC端
      isPageLoaded: false,
      hasUnsavedChanges: false,

      // Actions
      setPage: (page) => 
        set({ 
          currentPage: page, 
          isPageLoaded: true,
          targetArea: page.target_area || 'pc'
        }, false, 'setPage'),

      updatePage: (updates) =>
        set((state) => ({
          currentPage: state.currentPage ? { ...state.currentPage, ...updates } : null
        }), false, 'updatePage'),

      addModule: (module) =>
        set((state) => {
          if (!state.currentPage) return state;
          
          const modules = Array.isArray(state.currentPage.content) 
            ? [...state.currentPage.content, module]
            : [module];
            
          return {
            currentPage: {
              ...state.currentPage,
              content: modules,
              module_count: modules.length
            }
          };
        }, false, 'addModule'),

      updateModule: (moduleId, updates) =>
        set((state) => {
          if (!state.currentPage?.content || !Array.isArray(state.currentPage.content)) return state;
          
          const modules = state.currentPage.content.map((module: PageModule) =>
            module.id === moduleId ? { ...module, ...updates } : module
          );
          
          return {
            currentPage: {
              ...state.currentPage,
              content: modules
            }
          };
        }, false, 'updateModule'),

      deleteModule: (moduleId) =>
        set((state) => {
          if (!state.currentPage?.content || !Array.isArray(state.currentPage.content)) return state;
          
          const modules = state.currentPage.content.filter(
            (module: PageModule) => module.id !== moduleId
          );
          
          return {
            currentPage: {
              ...state.currentPage,
              content: modules,
              module_count: modules.length
            },
            selectedModuleId: state.selectedModuleId === moduleId ? null : state.selectedModuleId
          };
        }, false, 'deleteModule'),

      reorderModules: (sourceIndex, destinationIndex) =>
        set((state) => {
          if (!state.currentPage?.content || !Array.isArray(state.currentPage.content)) return state;
          
          const modules = [...state.currentPage.content];
          const [movedModule] = modules.splice(sourceIndex, 1);
          modules.splice(destinationIndex, 0, movedModule);
          
          return {
            currentPage: {
              ...state.currentPage,
              content: modules
            }
          };
        }, false, 'reorderModules'),

      setSelectedModule: (moduleId) =>
        set({ selectedModuleId: moduleId }, false, 'setSelectedModule'),

      setTargetArea: (area) =>
        set((state) => ({
          targetArea: area,
          currentPage: state.currentPage ? { ...state.currentPage, target_area: area } : null
        }), false, 'setTargetArea'),

      markSaved: () =>
        set({ hasUnsavedChanges: false }, false, 'markSaved'),

      markUnsaved: () =>
        set({ hasUnsavedChanges: true }, false, 'markUnsaved'),

      clearPage: () =>
        set({ 
          currentPage: null, 
          selectedModuleId: null, 
          isPageLoaded: false,
          hasUnsavedChanges: false
        }, false, 'clearPage'),
    }),
    { name: 'page-store' }
  )
); 