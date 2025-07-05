/**
 * 模块类型注册系统
 * 支持插件式扩展和动态注册新模块类型
 */

import React from 'react';
import { PageModuleType, PageModule } from '@pagemaker/shared-types';
import { LucideIcon } from 'lucide-react';

// 模块渲染器接口
export interface ModuleRenderer {
  component: React.ComponentType<{ module: PageModule; isSelected?: boolean; isEditing?: boolean }>;
  fallback?: React.ComponentType<{ module: PageModule; error?: Error }>;
}

// 模块属性编辑器接口
export interface ModulePropertyEditor {
  component: React.ComponentType<{ 
    module: PageModule; 
    onUpdate: (updates: Partial<PageModule>) => void;
    onValidate?: (module: PageModule) => string[];
  }>;
}

// 模块配置接口
export interface ModuleConfig {
  type: PageModuleType | string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: string;
  version: string;
  author?: string;
  deprecated?: boolean;
  experimental?: boolean;
  tags?: string[];
  
  // 默认配置生成器
  createDefault: () => Partial<PageModule>;
  
  // 验证器
  validate?: (module: PageModule) => string[];
  
  // 渲染器
  renderer: ModuleRenderer;
  
  // 属性编辑器
  propertyEditor: ModulePropertyEditor;
  
  // 预览缩略图生成器
  generateThumbnail?: (module: PageModule) => string | Promise<string>;
  
  // 导出处理器
  exportHandler?: (module: PageModule) => string | Promise<string>;
  
  // 导入处理器
  importHandler?: (data: any) => PageModule | Promise<PageModule>;
  
  // 依赖检查
  dependencies?: string[];
  
  // 兼容性检查
  compatibility?: {
    minVersion?: string;
    maxVersion?: string;
    browsers?: string[];
    features?: string[];
  };
}

// 模块类别
export enum ModuleCategory {
  CONTENT = 'content',
  LAYOUT = 'layout',
  MEDIA = 'media',
  INTERACTIVE = 'interactive',
  DATA = 'data',
  CUSTOM = 'custom'
}

// 注册表类
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules = new Map<string, ModuleConfig>();
  private categories = new Map<string, string[]>();
  private listeners: Array<(event: 'register' | 'unregister' | 'update', type: string) => void> = [];

  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * 注册模块类型
   */
  register(config: ModuleConfig): void {
    // 验证配置
    this.validateConfig(config);
    
    // 检查依赖
    this.checkDependencies(config);
    
    // 注册模块
    this.modules.set(config.type, config);
    
    // 更新类别索引
    if (!this.categories.has(config.category)) {
      this.categories.set(config.category, []);
    }
    this.categories.get(config.category)!.push(config.type);
    
    console.log(`模块类型 ${config.type} 注册成功`);
    
    // 通知监听器
    this.notifyListeners('register', config.type);
  }

  /**
   * 批量注册模块
   */
  registerBatch(configs: ModuleConfig[]): void {
    configs.forEach(config => this.register(config));
  }

  /**
   * 注销模块类型
   */
  unregister(type: string): boolean {
    const config = this.modules.get(type);
    if (!config) {
      return false;
    }

    // 从类别中移除
    const category = this.categories.get(config.category);
    if (category) {
      const index = category.indexOf(type);
      if (index > -1) {
        category.splice(index, 1);
      }
    }

    // 移除模块
    this.modules.delete(type);
    
    console.log(`模块类型 ${type} 注销成功`);
    
    // 通知监听器
    this.notifyListeners('unregister', type);
    
    return true;
  }

  /**
   * 获取模块配置
   */
  get(type: string): ModuleConfig | undefined {
    return this.modules.get(type);
  }

  /**
   * 检查模块是否已注册
   */
  has(type: string): boolean {
    return this.modules.has(type);
  }

  /**
   * 获取所有注册的模块类型
   */
  getAll(): ModuleConfig[] {
    return Array.from(this.modules.values());
  }

  /**
   * 按类别获取模块
   */
  getByCategory(category: string): ModuleConfig[] {
    const types = this.categories.get(category) || [];
    return types.map(type => this.modules.get(type)!).filter(Boolean);
  }

  /**
   * 获取所有类别
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * 搜索模块
   */
  search(query: string): ModuleConfig[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(config => 
      config.name.toLowerCase().includes(lowerQuery) ||
      config.description.toLowerCase().includes(lowerQuery) ||
      config.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 获取模块渲染器
   */
  getRenderer(type: string): ModuleRenderer | undefined {
    return this.modules.get(type)?.renderer;
  }

  /**
   * 获取属性编辑器
   */
  getPropertyEditor(type: string): ModulePropertyEditor | undefined {
    return this.modules.get(type)?.propertyEditor;
  }

  /**
   * 创建默认模块实例
   */
  createDefault(type: string): PageModule | undefined {
    const config = this.modules.get(type);
    if (!config) {
      return undefined;
    }

    return {
      id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as PageModuleType,
      ...config.createDefault()
    };
  }

  /**
   * 验证模块数据
   */
  validate(module: PageModule): string[] {
    const config = this.modules.get(module.type);
    if (!config) {
      return [`未知的模块类型: ${module.type}`];
    }

    return config.validate?.(module) || [];
  }

  /**
   * 添加事件监听器
   */
  addListener(listener: (event: 'register' | 'unregister' | 'update', type: string) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeListener(listener: (event: 'register' | 'unregister' | 'update', type: string) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 获取模块统计信息
   */
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    deprecated: number;
    experimental: number;
  } {
    const configs = this.getAll();
    const byCategory: Record<string, number> = {};
    
    this.getCategories().forEach(category => {
      byCategory[category] = this.getByCategory(category).length;
    });

    return {
      total: configs.length,
      byCategory,
      deprecated: configs.filter(c => c.deprecated).length,
      experimental: configs.filter(c => c.experimental).length
    };
  }

  /**
   * 导出注册表配置
   */
  export(): any {
    return {
      modules: Array.from(this.modules.entries()).map(([type, config]) => ({
        type,
        name: config.name,
        description: config.description,
        category: config.category,
        version: config.version,
        author: config.author,
        deprecated: config.deprecated,
        experimental: config.experimental,
        tags: config.tags
      })),
      categories: Array.from(this.categories.entries())
    };
  }

  /**
   * 验证模块配置
   */
  private validateConfig(config: ModuleConfig): void {
    if (!config.type) {
      throw new Error('模块类型不能为空');
    }
    
    if (!config.name) {
      throw new Error('模块名称不能为空');
    }
    
    if (!config.renderer?.component) {
      throw new Error('模块渲染器不能为空');
    }
    
    if (!config.propertyEditor?.component) {
      throw new Error('属性编辑器不能为空');
    }
    
    if (!config.createDefault) {
      throw new Error('默认配置生成器不能为空');
    }
    
    if (this.modules.has(config.type)) {
      console.warn(`模块类型 ${config.type} 已存在，将被覆盖`);
    }
  }

  /**
   * 检查依赖关系
   */
  private checkDependencies(config: ModuleConfig): void {
    if (!config.dependencies) {
      return;
    }

    const missingDeps = config.dependencies.filter(dep => !this.modules.has(dep));
    if (missingDeps.length > 0) {
      console.warn(`模块 ${config.type} 的依赖项缺失: ${missingDeps.join(', ')}`);
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: 'register' | 'unregister' | 'update', type: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, type);
      } catch (error) {
        console.error('模块注册表监听器执行失败:', error);
      }
    });
  }
}

// 导出单例实例
export const moduleRegistry = ModuleRegistry.getInstance();

/**
 * 模块注册装饰器
 */
export function registerModule(config: Omit<ModuleConfig, 'renderer' | 'propertyEditor'>) {
  return function<T extends { new(...args: any[]): any }>(
    RendererClass: T,
    PropertyEditorClass?: T
  ) {
    const fullConfig: ModuleConfig = {
      ...config,
      renderer: {
        component: RendererClass as any
      },
      propertyEditor: {
        component: PropertyEditorClass as any || RendererClass as any
      }
    };
    
    moduleRegistry.register(fullConfig);
    
    return RendererClass;
  };
}

/**
 * 便捷的模块注册函数
 */
export function registerSimpleModule(
  type: string,
  name: string,
  description: string,
  icon: LucideIcon,
  RendererComponent: React.ComponentType<any>,
  PropertyEditorComponent: React.ComponentType<any>,
  createDefault: () => Partial<PageModule>,
  options: Partial<ModuleConfig> = {}
): void {
  const config: ModuleConfig = {
    type,
    name,
    description,
    icon,
    color: 'text-gray-600',
    category: ModuleCategory.CUSTOM,
    version: '1.0.0',
    createDefault,
    renderer: {
      component: RendererComponent
    },
    propertyEditor: {
      component: PropertyEditorComponent
    },
    ...options
  };
  
  moduleRegistry.register(config);
}

/**
 * 获取模块注册表实例
 */
export function getModuleRegistry(): ModuleRegistry {
  return moduleRegistry;
} 