# 自定义模块可编辑功能 - 技术设计方案

## 1. 目标

将自定义 HTML 模块从只读预览转换为可直接编辑的所见即所得编辑器：
- ✅ 双击文本直接编辑（保留富文本格式）
- ✅ 点击图片打开 R-Cabinet 选择器替换
- ✅ 实时同步修改回 `customHTML` 字段

## 2. 架构设计

### 2.1 组件结构

```
EditableCustomHTMLRenderer (新组件)
├── 状态管理
│   ├── editingTextNode: 当前编辑的文本节点引用
│   ├── showImageSelector: 图片选择器状态
│   └── selectedImageElement: 当前选中的图片元素
├── HTML 渲染
│   ├── DOMPurify 清理 HTML
│   ├── dangerouslySetInnerHTML 渲染
│   └── refs 标记可编辑元素
├── 文本编辑
│   ├── contentEditable 启用
│   ├── 富文本工具栏（可选）
│   └── 失焦保存
└── 图片编辑
    ├── 点击图片事件监听
    ├── ImageSelectorDialog 集成
    └── 图片 URL 替换
```

### 2.2 核心流程

#### 文本编辑流程
```
1. 用户双击文本区域
2. 设置该元素 contentEditable="true"
3. 聚焦到该元素
4. 用户编辑内容
5. 失焦时：
   - 读取 innerHTML
   - 更新 customHTML
   - 调用 onUpdate({ customHTML })
   - 设置 contentEditable="false"
```

#### 图片编辑流程
```
1. 用户点击图片
2. 记录当前图片元素引用
3. 打开 ImageSelectorDialog
4. 用户选择新图片
5. 替换图片 src 属性
6. 更新 customHTML
7. 调用 onUpdate({ customHTML })
```

## 3. 实现细节

### 3.1 HTML 安全处理

使用 DOMPurify 清理 HTML，保留安全标签：

```typescript
import DOMPurify from 'dompurify'

const cleanHTML = DOMPurify.sanitize(customHTML, {
  ALLOWED_TAGS: [
    'table', 'tr', 'td', 'th', 'tbody', 'thead',
    'img', 'a', 'p', 'br', 'div', 'span',
    'font', 'b', 'strong', 'i', 'em', 'u',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],
  ALLOWED_ATTR: [
    'src', 'alt', 'href', 'target', 'width', 'height',
    'color', 'size', 'bgcolor', 'align', 'valign',
    'cellpadding', 'cellspacing', 'border', 'colspan'
  ]
})
```

### 3.2 可编辑元素标记

为文本和图片添加标识，方便事件监听：

```typescript
// 渲染后，使用 useEffect 添加事件监听
useEffect(() => {
  const container = containerRef.current
  if (!container) return

  // 为所有文本节点父元素添加双击事件
  const textElements = container.querySelectorAll('td, p, div, span')
  textElements.forEach(el => {
    el.addEventListener('dblclick', handleTextDoubleClick)
  })

  // 为所有图片添加点击事件
  const images = container.querySelectorAll('img')
  images.forEach(img => {
    img.addEventListener('click', handleImageClick)
    img.style.cursor = 'pointer'
  })

  return () => {
    textElements.forEach(el => {
      el.removeEventListener('dblclick', handleTextDoubleClick)
    })
    images.forEach(img => {
      img.removeEventListener('click', handleImageClick)
    })
  }
}, [html])
```

### 3.3 文本编辑实现

```typescript
const [editingElement, setEditingElement] = useState<HTMLElement | null>(null)

const handleTextDoubleClick = (e: Event) => {
  const target = e.target as HTMLElement
  
  // 设置为可编辑
  target.contentEditable = 'true'
  target.focus()
  setEditingElement(target)
  
  // 添加编辑样式
  target.classList.add('editing')
}

const handleTextBlur = (e: FocusEvent) => {
  const target = e.target as HTMLElement
  
  // 移除可编辑状态
  target.contentEditable = 'false'
  target.classList.remove('editing')
  setEditingElement(null)
  
  // 同步修改
  syncHTMLChanges()
}
```

### 3.4 图片编辑实现

```typescript
const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
const [showImageSelector, setShowImageSelector] = useState(false)

const handleImageClick = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  
  const img = e.target as HTMLImageElement
  setSelectedImage(img)
  setShowImageSelector(true)
}

const handleImageSelect = (result: ImageSelectorResult) => {
  if (!selectedImage) return
  
  // 更新图片 src
  selectedImage.src = result.url
  selectedImage.alt = result.filename
  
  // 同步修改
  syncHTMLChanges()
  
  setShowImageSelector(false)
  setSelectedImage(null)
}
```

### 3.5 同步机制

```typescript
const syncHTMLChanges = () => {
  const container = containerRef.current
  if (!container) return
  
  // 获取更新后的 HTML
  const updatedHTML = container.innerHTML
  
  // 通知父组件更新
  onUpdate?.({ customHTML: updatedHTML })
}
```

## 4. UI/UX 设计

### 4.1 视觉反馈

- **可编辑提示**：鼠标悬停时显示边框和提示
- **编辑状态**：编辑时高亮显示当前元素
- **图片悬停**：显示"点击更换图片"提示

### 4.2 样式

```css
/* 可编辑文本悬停 */
.editable-text:hover {
  outline: 2px dashed #3b82f6;
  outline-offset: 2px;
}

/* 编辑中 */
.editing {
  outline: 2px solid #3b82f6 !important;
  background: #eff6ff;
}

/* 可编辑图片 */
.editable-image {
  cursor: pointer;
  transition: opacity 0.2s;
}

.editable-image:hover {
  opacity: 0.8;
  outline: 2px solid #3b82f6;
}
```

## 5. 实现步骤

### Phase 1: 基础重构 ✅
1. 创建 `EditableCustomHTMLRenderer` 组件
2. 移除 iframe，改用 dangerouslySetInnerHTML
3. 集成 DOMPurify 清理 HTML

### Phase 2: 文本编辑 ✅
4. 实现双击文本进入编辑状态
5. 添加 contentEditable 支持
6. 实现失焦保存机制

### Phase 3: 图片编辑 ✅
7. 为图片添加点击事件
8. 集成 ImageSelectorDialog
9. 实现图片替换逻辑

### Phase 4: 优化和测试 ✅
10. 添加视觉反馈和提示
11. 处理边界情况（嵌套表格、复杂布局）
12. 性能优化（防抖、节流）

## 6. 风险和限制

### 6.1 已知限制
- **复杂嵌套**：深度嵌套的表格可能需要特殊处理
- **样式继承**：某些全局样式可能影响编辑体验
- **浏览器兼容**：contentEditable 在不同浏览器行为略有差异

### 6.2 解决方案
- 使用 CSS isolation 隔离样式
- 添加浏览器检测和兼容处理
- 提供"查看代码"回退方案

## 7. 未来增强

- 🔮 富文本工具栏（粗体、斜体、颜色选择）
- 🔮 撤销/重做功能
- 🔮 表格行列编辑
- 🔮 链接编辑器
- 🔮 实时预览对比

---

**文档版本**: v1.0  
**最后更新**: 2025-10-07  
**负责人**: AI Assistant 🤖

