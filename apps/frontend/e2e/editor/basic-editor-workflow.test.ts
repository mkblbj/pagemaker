import { test, expect } from '@playwright/test'

test.describe('Basic Editor Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到编辑器页面（使用测试页面ID）
    await page.goto('/editor/test-page-id')

    // 等待页面加载完成
    await page.waitForLoadState('networkidle')
  })

  test('应该显示编辑器布局的三个主要区域', async ({ page }) => {
    // 等待编辑器布局加载
    await page.waitForSelector('[data-testid="editor-layout"]')

    // 检查三个主要区域是否存在
    await expect(page.locator('[data-testid="module-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="canvas"]')).toBeVisible()
    await expect(page.locator('[data-testid="property-panel"]')).toBeVisible()
  })

  test('应该显示目标区域选择器', async ({ page }) => {
    // 等待目标区域选择器加载
    await page.waitForSelector('[data-testid="target-area-selector"]')

    // 验证选择器是否可见
    await expect(page.locator('[data-testid="target-area-selector"]')).toBeVisible()

    // 验证默认选中的是PC
    const selector = page.locator('[data-testid="target-area-selector"]')
    await expect(selector).toHaveValue('pc')
  })

  test('应该能够切换目标区域', async ({ page }) => {
    // 等待目标区域选择器加载
    await page.waitForSelector('[data-testid="target-area-selector"]')

    const selector = page.locator('[data-testid="target-area-selector"]')

    // 切换到移动端
    await selector.selectOption('mobile')

    // 验证切换成功
    await expect(selector).toHaveValue('mobile')

    // 等待页面内容更新
    await page.waitForTimeout(500)

    // 切换回PC端
    await selector.selectOption('pc')
    await expect(selector).toHaveValue('pc')
  })

  test('应该能够选择模块', async ({ page }) => {
    // 等待画布加载
    await page.waitForSelector('[data-testid="canvas"]')

    // 查找第一个模块
    const firstModule = page.locator('[data-testid^="module-"]').first()

    if ((await firstModule.count()) > 0) {
      // 点击模块
      await firstModule.click()

      // 验证模块被选中（通过检查是否有选中状态的样式类）
      await expect(firstModule).toHaveClass(/selected|active/)

      // 验证属性面板显示模块属性
      await expect(page.locator('[data-testid="property-panel"]')).toBeVisible()
    }
  })

  test('应该显示保存状态指示器', async ({ page }) => {
    // 等待编辑器加载
    await page.waitForSelector('[data-testid="editor-layout"]')

    // 检查保存状态指示器
    const saveIndicator = page.locator('[data-testid="save-indicator"]')

    if ((await saveIndicator.count()) > 0) {
      await expect(saveIndicator).toBeVisible()
    }
  })

  test('应该能够调整面板宽度', async ({ page }) => {
    // 等待编辑器加载
    await page.waitForSelector('[data-testid="editor-layout"]')

    // 查找分割条
    const leftSplitter = page.locator('[data-testid="left-splitter"]')
    const rightSplitter = page.locator('[data-testid="right-splitter"]')

    if ((await leftSplitter.count()) > 0) {
      // 获取初始位置
      const initialBox = await leftSplitter.boundingBox()

      if (initialBox) {
        // 拖拽分割条
        await leftSplitter.dragTo(leftSplitter, {
          targetPosition: { x: initialBox.x + 50, y: initialBox.y }
        })

        // 验证面板宽度发生变化
        const newBox = await leftSplitter.boundingBox()
        expect(newBox?.x).not.toBe(initialBox.x)
      }
    }
  })

  test('应该正确处理加载状态', async ({ page }) => {
    // 导航到一个可能需要加载时间的页面
    await page.goto('/editor/loading-test-page')

    // 检查是否显示加载指示器
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]')

    if ((await loadingIndicator.count()) > 0) {
      await expect(loadingIndicator).toBeVisible()

      // 等待加载完成
      await page.waitForSelector('[data-testid="editor-layout"]')

      // 验证加载指示器消失
      await expect(loadingIndicator).not.toBeVisible()
    }
  })

  test('应该正确处理错误状态', async ({ page }) => {
    // 导航到一个不存在的页面
    await page.goto('/editor/non-existent-page')

    // 检查是否显示错误消息
    const errorMessage = page.locator('[data-testid="error-message"]')

    if ((await errorMessage.count()) > 0) {
      await expect(errorMessage).toBeVisible()

      // 验证错误消息内容
      await expect(errorMessage).toContainText(/error|错误|失败/i)
    }
  })

  test('应该支持键盘导航', async ({ page }) => {
    // 等待编辑器加载
    await page.waitForSelector('[data-testid="editor-layout"]')

    // 使用Tab键导航
    await page.keyboard.press('Tab')

    // 验证焦点移动到可聚焦元素
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // 继续Tab导航
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // 验证可以通过键盘访问主要功能
    const targetSelector = page.locator('[data-testid="target-area-selector"]')
    if ((await targetSelector.count()) > 0) {
      await targetSelector.focus()
      await expect(targetSelector).toBeFocused()
    }
  })

  test('应该在不同分辨率下正确显示', async ({ page }) => {
    // 测试不同的屏幕尺寸
    const viewports = [
      { width: 1280, height: 720 }, // 最小支持分辨率
      { width: 1920, height: 1080 }, // 常见分辨率
      { width: 2560, height: 1440 } // 高分辨率
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)

      // 等待布局调整
      await page.waitForTimeout(300)

      // 验证三栏布局仍然可见
      await expect(page.locator('[data-testid="module-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="canvas"]')).toBeVisible()
      await expect(page.locator('[data-testid="property-panel"]')).toBeVisible()

      // 验证布局没有溢出
      const editorLayout = page.locator('[data-testid="editor-layout"]')
      const box = await editorLayout.boundingBox()

      if (box) {
        expect(box.width).toBeLessThanOrEqual(viewport.width)
        expect(box.height).toBeLessThanOrEqual(viewport.height)
      }
    }
  })
})
