# Pagemaker 移动端预览组件 - v0.dev 提示词

请为我创建一个专业的移动端预览组件，用于 Pagemaker CMS 系统中展示页面预览效果。

## 核心需求

### 1. iPhone 16 Pro Max 套壳设计
创建一个逼真的 iPhone 16 Pro Max 外壳，包含所有硬件细节：
- **尺寸**：整体高度 650px，宽度 320px
- **屏幕区域**：390px × 844px（内容显示区域）
- **Dynamic Island**：顶部胶囊状凹槽
- **边框按键**：音量键、电源键、静音开关
- **底部**：USB-C接口和扬声器孔

### 2. 组件接口
```typescript
interface MobilePreviewProps {
  htmlContent: string        // 要预览的HTML内容
  isVisible: boolean         // 是否显示预览
  onClose: () => void        // 关闭预览回调
  title?: string            // 预览标题
  deviceColor?: 'black' | 'white' | 'gold' | 'purple'
  showStatusBar?: boolean   // 是否显示状态栏
}
```

### 3. 预览功能
- **HTML渲染**：使用 `dangerouslySetInnerHTML` 或 iframe 渲染传入的HTML
- **实时更新**：支持HTML内容的实时更新
- **滚动支持**：内容区域可滚动
- **缩放适配**：内容自动适配390px宽度

### 4. 交互体验
- **打开动画**：从右侧滑入或从小到大的缩放动画
- **关闭动画**：淡出或滑出动画
- **悬停效果**：鼠标悬停时的微妙3D倾斜
- **背景遮罩**：半透明黑色背景，点击关闭

### 5. 状态栏模拟（可选）
```jsx
// 顶部状态栏内容
<div className="status-bar">
  <span>9:41</span>           {/* 时间 */}
  <div className="indicators">
    <span>📶</span>           {/* 信号 */}
    <span>📶</span>           {/* WiFi */}
    <span>🔋</span>           {/* 电池 */}
  </div>
</div>
```

### 6. 使用场景
```jsx
// 在编辑器中的使用
const [showPreview, setShowPreview] = useState(false)
const [htmlContent, setHtmlContent] = useState('')

<MobilePreview
  htmlContent={htmlContent}
  isVisible={showPreview}
  onClose={() => setShowPreview(false)}
  title="页面预览"
  deviceColor="black"
  showStatusBar={true}
/>
```

### 7. 样式要求
- **真实感**：使用渐变、阴影、反光效果
- **性能优化**：使用 CSS transforms 而非修改 layout 属性
- **响应式**：在不同屏幕尺寸下的适配
- **暗色主题**：支持暗色/亮色主题切换

### 8. 特殊效果
```css
/* 关键视觉效果 */
.iphone-container {
  /* 3D 透视效果 */
  transform: perspective(1000px) rotateX(5deg) rotateY(-5deg);
  
  /* 真实阴影 */
  filter: drop-shadow(0 25px 50px rgba(0,0,0,0.15));
  
  /* 金属质感边框 */
  background: linear-gradient(145deg, #2c2c2e, #1c1c1e);
  border: 2px solid #3a3a3c;
}

.screen-content {
  /* 屏幕反光效果 */
  position: relative;
}

.screen-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    135deg,
    transparent 40%,
    rgba(255,255,255,0.1) 50%,
    transparent 60%
  );
  pointer-events: none;
}
```

### 9. 动画时序
```css
/* 进入动画 */
@keyframes slideInRight {
  from {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

/* 悬停动画 */
@keyframes tilt {
  0% { transform: perspective(1000px) rotateX(5deg) rotateY(-5deg); }
  100% { transform: perspective(1000px) rotateX(10deg) rotateY(-10deg); }
}
```

### 10. 技术栈
- **React** + **TypeScript**
- **Tailwind CSS** + 自定义CSS
- **Framer Motion**（可选，用于复杂动画）
- **React Portal**（用于全屏覆盖）

### 11. 额外功能
- **截图功能**：html2canvas 截取预览内容
- **分享功能**：生成预览链接
- **全屏模式**：点击放大到全屏预览
- **设备切换**：iPhone/iPad/Desktop 切换

### 12. 布局结构
```jsx
<div className="preview-overlay">          {/* 全屏遮罩 */}
  <div className="iphone-container">       {/* iPhone外壳 */}
    <div className="dynamic-island" />     {/* Dynamic Island */}
    <div className="screen">              {/* 屏幕区域 */}
      <div className="status-bar" />      {/* 状态栏 */}
      <div className="content-area">      {/* 内容区域 */}
        {/* HTML内容渲染 */}
      </div>
    </div>
    <div className="home-indicator" />     {/* 底部指示条 */}
  </div>
</div>
```

请生成一个高质量、可复用的组件，注重用户体验和视觉效果。组件应该易于集成到现有的React项目中。 