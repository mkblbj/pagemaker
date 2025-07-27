# iPhone 16 Pro Max 预览组件提示词

请帮我创建一个 React 组件，用于模拟 iPhone 16 Pro Max 的外观来展示网页预览。

## 设计要求

### 1. iPhone 16 Pro Max 外观规格
- 屏幕尺寸：6.9英寸，分辨率 1320x2868 (但显示区域约 390x844px)
- 设备颜色：深空黑色/钛原色金属边框
- 圆角：屏幕四角圆润，半径约 40px
- 整体尺寸：高度约 600px，宽度约 300px（适合桌面显示）

### 2. 硬件细节
- **Dynamic Island**：顶部中央的胶囊状凹槽，宽约 120px，高约 30px，圆角半径 15px
- **边框**：钛金属质感，宽度 3-4px，带有细微渐变
- **音量键**：左侧两个独立按键，长度约 30px 和 50px
- **静音开关**：音量键上方的小开关
- **电源键**：右侧长按键，长度约 60px
- **底部接口**：USB-C 接口居中，两侧各有扬声器孔

### 3. 屏幕效果
- 黑色边框（约 8px）模拟屏幕边缘
- 内容区域：390px 宽度，自适应高度
- 轻微的屏幕反光效果
- 可选：屏幕保护膜的细微反射

### 4. 组件功能
```typescript
interface iPhonePreviewProps {
  children: React.ReactNode  // 要预览的网页内容
  className?: string
  showReflection?: boolean   // 是否显示反光效果
  deviceColor?: 'black' | 'white' | 'gold' | 'purple'  // 设备颜色
}
```

### 5. 视觉效果
- **阴影**：设备底部投射自然阴影，模拟桌面放置效果
- **渐变**：边框使用金属质感渐变
- **反光**：屏幕表面的细微反光条纹
- **景深**：可选的背景模糊效果

### 6. 交互效果（可选）
- 鼠标悬停时轻微的 3D 倾斜效果
- 点击屏幕区域时的轻微按压动画
- 设备颜色切换动画

### 7. 响应式设计
- 桌面端：完整尺寸显示
- 平板端：适当缩放
- 移动端：简化版本或隐藏

### 8. CSS 样式要点
```css
/* 关键样式提示 */
.iphone-frame {
  background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
  border-radius: 50px;
  box-shadow: 
    0 20px 40px rgba(0,0,0,0.3),
    0 0 0 3px #3a3a3a,
    inset 0 1px 0 rgba(255,255,255,0.1);
}

.screen {
  background: #000;
  border-radius: 40px;
  overflow: hidden;
  position: relative;
}

.dynamic-island {
  background: #000;
  border-radius: 15px;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}
```

### 9. 使用示例
```jsx
<iPhonePreview deviceColor="black" showReflection={true}>
  <iframe 
    src="your-preview-url" 
    width="390" 
    height="844"
    frameBorder="0"
  />
</iPhonePreview>
```

### 10. 额外功能建议
- 状态栏模拟（时间、电池、信号）
- 屏幕截图功能
- 全屏预览模式
- 设备旋转动画（横屏/竖屏）

请生成一个高质量的 React + Tailwind CSS 组件，注重细节和真实感。组件应该是可复用的，并且性能优化良好。 