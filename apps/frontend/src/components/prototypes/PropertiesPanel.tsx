"use client";

import * as React from "react";
import {
  Trash2,
  RotateCcw,
  Type,
  Pilcrow,
  ImageIcon,
  Minus,
  Columns,
  ListTree,
  Package,
  ChevronDown,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { PageModule } from "./ModuleList"; // Assuming PageModule is exported from ModuleList.tsx

// Dynamically import Lucide icons for module types
const ModuleLucideIcons: { [key: string]: React.ElementType } = {
  title: Type,
  text: Pilcrow,
  image: ImageIcon,
  separator: Minus,
  multiColumn: Columns,
  keyValue: ListTree,
  default: Package,
};

export interface ModulePropertiesData {
  id: string;
  type: PageModule["type"]; // Use type from PageModule
  name: string; // Add name for display
  icon: string; // Add icon for display
  properties: Record<string, unknown>;
}

interface PropertiesPanelProps {
  selectedModule?: ModulePropertiesData | null;
  onPropertyChange?: (
    moduleId: string,
    propertyPath: string,
    value: unknown
  ) => void;
  onDeleteModule?: (moduleId: string) => void;
  onResetModule?: (moduleId: string) => void;
  // For KeyValue pairs
  onAddKeyValueItem?: (moduleId: string) => void;
  onRemoveKeyValueItem?: (moduleId: string, itemIndex: number) => void;
  onKeyValueItemChange?: (
    moduleId: string,
    itemIndex: number,
    keyOrValue: "key" | "value",
    value: string
  ) => void;
}

// Mock data examples (commented out to avoid ESLint warnings)
// const mockSelectedModule: ModulePropertiesData = { ... }
// const mockImageModule: ModulePropertiesData = { ... }
// const mockKeyValueModule: ModulePropertiesData = { ... }

// Helper to get module icon
const getModuleIcon = (iconName: string): React.ElementType => {
  return ModuleLucideIcons[iconName.toLowerCase()] || ModuleLucideIcons.default;
};

export default function PropertiesPanel({
  selectedModule, // = mockSelectedModule, // or mockImageModule, or mockKeyValueModule for testing
  onPropertyChange,
  onDeleteModule,
  onResetModule,
  onAddKeyValueItem,
  onRemoveKeyValueItem,
}: PropertiesPanelProps) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >({
    content: true,
    appearance: true,
    spacing: true,
    background: true,
    items: true, // For KeyValue
  });

  const validateProperty = (name: string, value: unknown): string | null => {
    if (
      name === "content" &&
      (value === null || value === undefined || String(value).trim() === "")
    ) {
      return "内容不能为空";
    }
    if (
      name.toLowerCase().includes("url") &&
      value &&
      !/^(ftp|http|https):\/\/[^ "]+$/.test(String(value))
    ) {
      return "请输入有效的URL";
    }
    if (
      name.toLowerCase().includes("color") &&
      value &&
      !/^#([0-9A-Fa-f]{3}){1,2}$|^transparent$|^inherit$/.test(String(value))
    ) {
      return "请输入有效的颜色值 (例如 #RRGGBB)";
    }
    if (
      name.toLowerCase().includes("margin") ||
      name.toLowerCase().includes("padding") ||
      name.toLowerCase().includes("size")
    ) {
      if (
        value !== "auto" &&
        (isNaN(Number.parseFloat(String(value))) ||
          Number.parseFloat(String(value)) < 0)
      ) {
        return "必须为非负数";
      }
    }
    return null;
  };

  const handleInputChange = (property: string, value: unknown) => {
    if (!selectedModule) return;

    const error = validateProperty(property, value);
    setErrors(prev => ({ ...prev, [property]: error || "" }));

    if (!error && onPropertyChange) {
      onPropertyChange(selectedModule.id, property, value);
    }
  };

  const handleNestedInputChange = (
    baseProperty: string,
    nestedKey: string,
    value: unknown
  ) => {
    if (!selectedModule) return;
    const propertyPath = `${baseProperty}.${nestedKey}`;
    // Validation can be extended for nested properties
    if (onPropertyChange) {
      onPropertyChange(selectedModule.id, propertyPath, value);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!selectedModule) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 bg-white text-gray-500">
        <Settings className="h-12 w-12 mb-4 text-gray-400" />
        <p className="text-sm font-medium">未选择模块</p>
        <p className="text-xs text-center mt-1">
          请在画布中选择一个模块以编辑其属性。
        </p>
      </div>
    );
  }

  const ModuleIcon = getModuleIcon(selectedModule.icon);

  const renderPropertyField = (
    propKey: string,
    propValue: unknown,
    label: string,
    type: "text" | "number" | "color" | "textarea" | "select" | "spacing",
    options?: Array<{ value: string; label: string }>
  ) => {
    const error = errors[propKey];
    const inputId = `${selectedModule.id}-${propKey}`;

    return (
      <div key={propKey} className="space-y-1.5">
        <Label htmlFor={inputId} className={cn(error && "text-red-600")}>
          {label}
        </Label>
        {type === "text" && (
          <Input
            id={inputId}
            type="text"
            value={String(propValue ?? "")}
            onChange={e => handleInputChange(propKey, e.target.value)}
            className={cn(error && "border-red-500")}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
        )}
        {type === "textarea" && (
          <Textarea
            id={inputId}
            value={String(propValue ?? "")}
            onChange={e => handleInputChange(propKey, e.target.value)}
            className={cn(error && "border-red-500")}
            aria-describedby={error ? `${inputId}-error` : undefined}
            rows={3}
          />
        )}
        {type === "number" && (
          <Input
            id={inputId}
            type="number"
            value={String(propValue ?? "")}
            onChange={e =>
              handleInputChange(
                propKey,
                e.target.value === "" ? null : Number.parseFloat(e.target.value)
              )
            }
            className={cn(error && "border-red-500")}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
        )}
        {type === "color" && (
          <ColorPickerInput
            id={inputId}
            value={String(propValue ?? "#000000")}
            onChange={color => handleInputChange(propKey, color)}
            error={error}
          />
        )}
        {type === "select" && options && (
          <Select
            value={String(propValue ?? "")}
            onValueChange={value => handleInputChange(propKey, value)}
          >
            <SelectTrigger
              id={inputId}
              className={cn(error && "border-red-500")}
            >
              <SelectValue placeholder={`选择${label}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: { value: string; label: string }) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {type === "spacing" && (
          <SpacingInputGroup
            idPrefix={inputId}
            values={
              propValue as {
                top: number;
                bottom: number;
                left: number;
                right: number;
              }
            }
            onChange={(key, value) =>
              handleNestedInputChange(propKey, key, value)
            }
          />
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderKeyValueItems = () => {
    if (
      selectedModule.type !== "keyValue" ||
      !selectedModule.properties.items ||
      !Array.isArray(selectedModule.properties.items)
    ) {
      return null;
    }
    const items = selectedModule.properties.items as Array<{
      key: string;
      value: string;
    }>;

    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-3 border border-gray-200 rounded-md space-y-2 bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                项目 {index + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:bg-red-100"
                onClick={() => onRemoveKeyValueItem?.(selectedModule.id, index)}
                aria-label={`删除项目 ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {renderPropertyField(
              `items[${index}].key`,
              item.key,
              "键 (Key)",
              "text"
            )}
            {renderPropertyField(
              `items[${index}].value`,
              item.value,
              "值 (Value)",
              "textarea"
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddKeyValueItem?.(selectedModule.id)}
          className="w-full"
        >
          添加键值对
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-800">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ModuleIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold">
              {selectedModule.name || "模块属性"}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {onResetModule && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-blue-600"
                onClick={() => onResetModule(selectedModule.id)}
                aria-label="重置模块属性"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            {onDeleteModule && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDeleteModule(selectedModule.id)}
                aria-label="删除模块"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">ID: {selectedModule.id}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Content Section */}
          {selectedModule.type === "title" && (
            <CollapsibleSection
              title="内容与样式"
              sectionKey="content"
              isOpen={openSections.content}
              onToggle={toggleSection}
            >
              {renderPropertyField(
                "content",
                selectedModule.properties.content,
                "标题文本",
                "textarea"
              )}
              {renderPropertyField(
                "level",
                selectedModule.properties.level,
                "标题级别",
                "select",
                [
                  { value: "h1", label: "H1" },
                  { value: "h2", label: "H2" },
                  { value: "h3", label: "H3" },
                  { value: "h4", label: "H4" },
                  { value: "h5", label: "H5" },
                  { value: "h6", label: "H6" },
                ]
              )}
              {renderPropertyField(
                "alignment",
                selectedModule.properties.alignment,
                "对齐方式",
                "select",
                [
                  { value: "left", label: "居左" },
                  { value: "center", label: "居中" },
                  { value: "right", label: "居右" },
                ]
              )}
              {renderPropertyField(
                "color",
                selectedModule.properties.color,
                "文字颜色",
                "color"
              )}
            </CollapsibleSection>
          )}

          {selectedModule.type === "text" && (
            <CollapsibleSection
              title="内容与样式"
              sectionKey="content"
              isOpen={openSections.content}
              onToggle={toggleSection}
            >
              {renderPropertyField(
                "content",
                selectedModule.properties.content,
                "文本内容",
                "textarea"
              )}
              {renderPropertyField(
                "fontSize",
                selectedModule.properties.fontSize,
                "字体大小 (px)",
                "number"
              )}
              {renderPropertyField(
                "alignment",
                selectedModule.properties.alignment,
                "对齐方式",
                "select",
                [
                  { value: "left", label: "居左" },
                  { value: "center", label: "居中" },
                  { value: "right", label: "居右" },
                  { value: "justify", label: "两端对齐" },
                ]
              )}
              {renderPropertyField(
                "color",
                selectedModule.properties.color,
                "文字颜色",
                "color"
              )}
            </CollapsibleSection>
          )}

          {selectedModule.type === "image" && (
            <CollapsibleSection
              title="图片设置"
              sectionKey="content"
              isOpen={openSections.content}
              onToggle={toggleSection}
            >
              {renderPropertyField(
                "imageUrl",
                selectedModule.properties.imageUrl,
                "图片URL",
                "text"
              )}
              {renderPropertyField(
                "altText",
                selectedModule.properties.altText,
                "替代文本",
                "text"
              )}
              {renderPropertyField(
                "width",
                selectedModule.properties.width,
                "宽度 (%)",
                "number"
              )}
              {/* Height might be more complex, e.g., auto or fixed. For now, let's assume it's handled by aspect ratio or CSS. */}
              {renderPropertyField(
                "alignment",
                selectedModule.properties.alignment,
                "对齐方式",
                "select",
                [
                  { value: "left", label: "居左" },
                  { value: "center", label: "居中" },
                  { value: "right", label: "居右" },
                ]
              )}
            </CollapsibleSection>
          )}

          {selectedModule.type === "separator" && (
            <CollapsibleSection
              title="分隔线样式"
              sectionKey="content"
              isOpen={openSections.content}
              onToggle={toggleSection}
            >
              {renderPropertyField(
                "lineStyle",
                selectedModule.properties.lineStyle,
                "线条样式",
                "select",
                [
                  { value: "solid", label: "实线" },
                  { value: "dashed", label: "虚线" },
                  { value: "dotted", label: "点线" },
                ]
              )}
              {renderPropertyField(
                "color",
                selectedModule.properties.color,
                "线条颜色",
                "color"
              )}
              {renderPropertyField(
                "thickness",
                selectedModule.properties.thickness,
                "线条粗细 (px)",
                "number"
              )}
            </CollapsibleSection>
          )}

          {selectedModule.type === "keyValue" && (
            <CollapsibleSection
              title="键值对列表"
              sectionKey="items"
              isOpen={openSections.items}
              onToggle={toggleSection}
            >
              {renderKeyValueItems()}
              {renderPropertyField(
                "itemStyle",
                selectedModule.properties.itemStyle,
                "列表样式",
                "select",
                [
                  { value: "default", label: "默认" },
                  { value: "bullet", label: "项目符号" },
                  { value: "numbered", label: "数字编号" },
                ]
              )}
              {renderPropertyField(
                "keyColor",
                selectedModule.properties.keyColor,
                "键 (Key) 颜色",
                "color"
              )}
              {renderPropertyField(
                "valueColor",
                selectedModule.properties.valueColor,
                "值 (Value) 颜色",
                "color"
              )}
            </CollapsibleSection>
          )}

          {/* Common Spacing Section */}
          <CollapsibleSection
            title="间距"
            sectionKey="spacing"
            isOpen={openSections.spacing}
            onToggle={toggleSection}
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {renderPropertyField(
                "marginTop",
                selectedModule.properties.marginTop,
                "上外边距 (px)",
                "number"
              )}
              {renderPropertyField(
                "marginBottom",
                selectedModule.properties.marginBottom,
                "下外边距 (px)",
                "number"
              )}
              {renderPropertyField(
                "paddingTop",
                selectedModule.properties.paddingTop,
                "上内边距 (px)",
                "number"
              )}
              {renderPropertyField(
                "paddingBottom",
                selectedModule.properties.paddingBottom,
                "下内边距 (px)",
                "number"
              )}
              {renderPropertyField(
                "paddingLeft",
                selectedModule.properties.paddingLeft,
                "左内边距 (px)",
                "number"
              )}
              {renderPropertyField(
                "paddingRight",
                selectedModule.properties.paddingRight,
                "右内边距 (px)",
                "number"
              )}
            </div>
          </CollapsibleSection>

          {/* Common Background Section */}
          <CollapsibleSection
            title="背景"
            sectionKey="background"
            isOpen={openSections.background}
            onToggle={toggleSection}
          >
            {renderPropertyField(
              "backgroundColor",
              selectedModule.properties.backgroundColor,
              "背景颜色",
              "color"
            )}
          </CollapsibleSection>

          {Object.values(errors).some(err => err) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>
                表单中存在一些错误，请检查并修正。
              </AlertDescription>
            </Alert>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Collapsible Section Helper
interface CollapsibleSectionProps {
  title: string;
  sectionKey: string;
  isOpen: boolean;
  onToggle: (sectionKey: string) => void;
  children: React.ReactNode;
}

const CollapsibleSection = ({
  title,
  sectionKey,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) => (
  <Collapsible open={isOpen} onOpenChange={() => onToggle(sectionKey)}>
    <CollapsibleTrigger asChild>
      <Button
        variant="ghost"
        className="w-full flex justify-between items-center px-1 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        aria-label={`${isOpen ? "折叠" : "展开"} ${title} 配置区域`}
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent className="pt-3 pb-1 pl-1 pr-1 border-t border-gray-200 mt-2">
      <div className="space-y-4">{children}</div>
    </CollapsibleContent>
  </Collapsible>
);

// Custom Color Picker Input
interface ColorPickerInputProps {
  id: string;
  value: string;
  onChange: (color: string) => void;
  error?: string | null;
}
const PRESET_COLORS = [
  { name: "主色", value: "#1975B0" },
  { name: "辅色", value: "#F2994A" },
  { name: "黑色", value: "#000000" },
  { name: "白色", value: "#FFFFFF" },
  { name: "灰色-100", value: "#F8F9FA" },
  { name: "灰色-300", value: "#DEE2E6" },
  { name: "灰色-500", value: "#ADB5BD" },
  { name: "灰色-700", value: "#495057" },
  { name: "透明", value: "transparent" },
];

const ColorPickerInput = ({
  id,
  value,
  onChange,
  error,
}: ColorPickerInputProps) => {
  const [customColor, setCustomColor] = React.useState(value);
  React.useEffect(() => {
    setCustomColor(value);
  }, [value]); // Sync with external changes

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    // Basic validation before calling onChange
    if (
      /^#([0-9A-Fa-f]{3}){1,2}$|^transparent$|^inherit$/.test(newColor) ||
      newColor === ""
    ) {
      onChange(newColor);
    }
  };

  const handlePresetClick = (presetValue: string) => {
    setCustomColor(presetValue);
    onChange(presetValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded border border-gray-300 shrink-0"
          style={{
            backgroundColor: value === "transparent" ? undefined : value,
            backgroundImage:
              value === "transparent"
                ? `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0H5V5H0V0Z' fill='%23E0E0E0'/%3E%3Cpath d='M5 0H10V5H5V0Z' fill='white'/%3E%3Cpath d='M0 5H5V10H0V5Z' fill='white'/%3E%3Cpath d='M5 5H10V10H5V5Z' fill='%23E0E0E0'/%3E%3C/svg%3E")`
                : undefined,
          }}
          aria-label={`当前颜色: ${value}`}
        />
        <Input
          id={id}
          type="text"
          value={customColor}
          onChange={handleCustomColorChange}
          placeholder="#RRGGBB"
          className={cn("flex-1", error && "border-red-500")}
          aria-describedby={error ? `${id}-error-detail` : undefined}
        />
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-5 gap-1.5 mt-1.5">
        {PRESET_COLORS.map(preset => (
          <Button
            key={preset.value}
            variant="outline"
            size="icon"
            className={cn(
              "h-7 w-full rounded border hover:opacity-80",
              value === preset.value && "ring-2 ring-offset-1 ring-blue-600"
            )}
            style={{
              backgroundColor:
                preset.value === "transparent" ? undefined : preset.value,
              backgroundImage:
                preset.value === "transparent"
                  ? `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0H5V5H0V0Z' fill='%23E0E0E0'/%3E%3Cpath d='M5 0H10V5H5V0Z' fill='white'/%3E%3Cpath d='M0 5H5V10H0V5Z' fill='white'/%3E%3Cpath d='M5 5H10V10H5V5Z' fill='%23E0E0E0'/%3E%3C/svg%3E")`
                  : undefined,
            }}
            onClick={() => handlePresetClick(preset.value)}
            aria-label={preset.name}
          >
            <span className="sr-only">{preset.name}</span>
          </Button>
        ))}
      </div>
      {error && (
        <p id={`${id}-error-detail`} className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

// Spacing Input Group
interface SpacingInputGroupProps {
  idPrefix: string;
  values: { top: number; bottom: number; left: number; right: number };
  onChange: (
    key: "top" | "bottom" | "left" | "right",
    value: number | null
  ) => void;
}
const SpacingInputGroup = ({
  idPrefix,
  values,
  onChange,
}: SpacingInputGroupProps) => {
  const spacingLabels = { top: "上", bottom: "下", left: "左", right: "右" };
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      {(["top", "bottom", "left", "right"] as const).map(side => (
        <div key={side}>
          <Label
            htmlFor={`${idPrefix}-${side}`}
            className="text-xs text-gray-500"
          >
            {spacingLabels[side]} (px)
          </Label>
          <Input
            id={`${idPrefix}-${side}`}
            type="number"
            value={String(values[side] ?? "")}
            onChange={e =>
              onChange(
                side,
                e.target.value === "" ? null : Number.parseFloat(e.target.value)
              )
            }
            className="mt-0.5"
            placeholder="0"
          />
        </div>
      ))}
    </div>
  );
};
