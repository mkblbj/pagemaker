"use client";

import * as React from "react";
import {
  Search,
  GripVertical,
  ChevronDown,
  Type,
  Pilcrow,
  ImageIcon,
  Minus,
  Columns,
  ListTree,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Dynamically import Lucide icons
const LucideIcons: { [key: string]: React.ElementType } = {
  Type,
  Pilcrow,
  ImageIcon,
  Minus,
  Columns,
  ListTree,
  Package,
  AlertTriangle,
};

export interface PageModule {
  id: string;
  type:
    | "title"
    | "text"
    | "image"
    | "separator"
    | "keyValue"
    | "multiColumn"
    | string; // Allow custom types
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: "basic" | "layout" | "advanced";
}

interface ModuleListProps {
  modules: PageModule[];
  onModuleDragStart?: (
    event: React.DragEvent<HTMLDivElement>,
    module: PageModule
  ) => void;
  onModuleDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
}

const mockModules: PageModule[] = [
  {
    id: "title-1",
    type: "title",
    name: "标题",
    description: "添加一个页面或段落标题",
    icon: "Type",
    category: "basic",
  },
  {
    id: "text-1",
    type: "text",
    name: "文本块",
    description: "插入一段格式化文本内容",
    icon: "Pilcrow",
    category: "basic",
  },
  {
    id: "image-1",
    type: "image",
    name: "图片",
    description: "上传或选择一张图片",
    icon: "ImageIcon",
    category: "basic",
  },
  {
    id: "separator-1",
    type: "separator",
    name: "分隔线",
    description: "在内容之间添加一条水平线",
    icon: "Minus",
    category: "basic",
  },
  {
    id: "multicolumn-1",
    type: "multiColumn",
    name: "多列布局",
    description: "将内容分为多列展示",
    icon: "Columns",
    category: "layout",
  },
  {
    id: "keyvalue-1",
    type: "keyValue",
    name: "键值对",
    description: "展示项目列表或属性",
    icon: "ListTree",
    category: "layout",
  },
  {
    id: "advanced-module-1",
    type: "customForm",
    name: "自定义表单",
    description: "嵌入一个可配置的表单",
    icon: "Package", // Example, ensure this icon exists in Lucide
    category: "advanced",
  },
];

export default function ModuleList({
  modules = mockModules,
  onModuleDragStart,
  onModuleDragEnd,
}: ModuleListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [openCategories, setOpenCategories] = React.useState<
    Record<string, boolean>
  >({
    basic: true,
    layout: true,
    advanced: true,
  });
  const [draggingModuleId, setDraggingModuleId] = React.useState<string | null>(
    null
  );

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categorizedModules = {
    basic: filteredModules.filter(m => m.category === "basic"),
    layout: filteredModules.filter(m => m.category === "layout"),
    advanced: filteredModules.filter(m => m.category === "advanced"),
  };

  const categoryNames = {
    basic: "基础模块",
    layout: "布局模块",
    advanced: "高级模块",
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    module: PageModule
  ) => {
    event.dataTransfer.setData("application/json", JSON.stringify(module));
    event.dataTransfer.effectAllowed = "move";
    setDraggingModuleId(module.id);
    if (onModuleDragStart) {
      onModuleDragStart(event, module);
    }
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    setDraggingModuleId(null);
    if (onModuleDragEnd) {
      onModuleDragEnd(event);
    }
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-800">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="搜索模块..."
            aria-label="搜索模块"
            className="w-full pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {(
            Object.keys(categorizedModules) as Array<
              keyof typeof categorizedModules
            >
          ).map(categoryKey => {
            const modulesInCategory = categorizedModules[categoryKey];
            if (modulesInCategory.length === 0 && searchTerm) return null; // Hide category if search yields no results for it

            return (
              <Collapsible
                key={categoryKey}
                open={openCategories[categoryKey]}
                onOpenChange={() => toggleCategory(categoryKey)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex justify-between items-center px-0 hover:bg-transparent"
                    aria-label={`${openCategories[categoryKey] ? "折叠" : "展开"} ${categoryNames[categoryKey]} 分类`}
                  >
                    <h3 className="text-sm font-semibold text-gray-700">
                      {categoryNames[categoryKey]} ({modulesInCategory.length})
                    </h3>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-gray-500 transition-transform",
                        openCategories[categoryKey] && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2">
                    {modulesInCategory.map(module => {
                      const IconComponent = LucideIcons[module.icon] || Package; // Fallback icon
                      return (
                        <div
                          key={module.id}
                          draggable
                          onDragStart={e => handleDragStart(e, module)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "flex items-center p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-100 cursor-grab focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
                            draggingModuleId === module.id &&
                              "opacity-50 shadow-lg"
                          )}
                          aria-label={`拖拽 ${module.name} 模块`}
                          tabIndex={0} // Make it focusable
                        >
                          <IconComponent className="h-5 w-5 mr-3 text-blue-600 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {module.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {module.description}
                            </p>
                          </div>
                          <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600 shrink-0 cursor-grab" />
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {filteredModules.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                未找到与 &ldquo;{searchTerm}&rdquo; 相关的模块
              </p>
              <p className="text-xs text-gray-400 mt-1">
                请尝试其他关键词或清空搜索框。
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
