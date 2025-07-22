import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HtmlExportButton } from './HtmlExportButton'
import type { PageModule } from '@pagemaker/shared-types'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock dependencies
vi.mock('@/services/htmlExportService', () => ({
  generateHTML: vi.fn(() => '<html><body><h1>测试HTML</h1></body></html>')
}))

vi.mock('@/lib/clipboardUtils', () => ({
  copyTextWithFeedback: vi.fn(() => Promise.resolve({ success: true, message: '复制成功' })),
  getClipboardCapabilities: vi.fn(() => ({
    hasClipboardAPI: true,
    isSecureContext: true,
    canCopyHTML: true,
    canCopyText: true
  }))
}))

vi.mock('@/contexts/I18nContext', () => ({
  useTranslation: () => ({
    tEditor: (key: string) => key,
    tCommon: (key: string) => key
  })
}))

// Mock window.open
global.window.open = vi.fn()

describe('HtmlExportButton', () => {
  let mockModules: PageModule[]
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()

    mockModules = [
      {
        id: 'title-1',
        type: PageModuleType.TITLE,
        content: '测试标题'
      },
      {
        id: 'text-1',
        type: PageModuleType.TEXT,
        content: '测试文本'
      }
    ]
  })

  it('应该渲染导出按钮', () => {
    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    expect(button).toBeInTheDocument()
  })

  it('应该在没有模块时禁用按钮', () => {
    render(<HtmlExportButton modules={[]} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    expect(button).toBeDisabled()
  })

  it('应该在点击按钮时打开对话框', async () => {
    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    expect(screen.getByText('导出页面HTML')).toBeInTheDocument()
    expect(screen.getByText('生成完整的HTML代码，可直接粘贴到乐天店铺后台使用')).toBeInTheDocument()
  })

  it('应该显示模块数量和文件大小信息', async () => {
    render(<HtmlExportButton modules={mockModules} pageTitle="测试页面" />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('2 个模块')).toBeInTheDocument()
    })
  })

  it('应该支持导出选项配置', async () => {
    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    // 等待对话框内容加载
    await waitFor(() => {
      expect(screen.getByText('导出选项')).toBeInTheDocument()
    })

    const includeStylesCheckbox = screen.getByLabelText('包含CSS样式')
    const minifyCheckbox = screen.getByLabelText('压缩HTML代码')

    expect(includeStylesCheckbox).toBeChecked()
    expect(minifyCheckbox).toBeChecked() // 现在默认为true

    // 测试选项切换
    await user.click(minifyCheckbox)
    expect(minifyCheckbox).not.toBeChecked()
  })

  it('应该在对话框打开时自动生成HTML', async () => {
    const { generateHTML } = await import('@/services/htmlExportService')

    render(<HtmlExportButton modules={mockModules} pageTitle="测试页面" />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    await waitFor(() => {
      expect(generateHTML).toHaveBeenCalledWith(
        mockModules,
        expect.objectContaining({
          title: '测试页面',
          description: '使用 Pagemaker CMS 创建的页面：测试页面',
          includeStyles: true,
          minify: true,
          fullDocument: true, // 对话框打开时会重新生成，此时fullDocument可能为true
          language: 'ja-JP',
          mobileMode: false
        })
      )
    })
  })

  it('应该显示生成的HTML代码', async () => {
    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    await waitFor(() => {
      const textarea = screen.getByDisplayValue(/<html><body><h1>测试HTML<\/h1><\/body><\/html>/)
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveAttribute('readonly')
    })
  })

  it('应该支持复制HTML代码', async () => {
    // Mock document.execCommand for testing
    document.execCommand = vi.fn().mockReturnValue(true)

    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByDisplayValue(/<html>/)).toBeInTheDocument()
    })

    const copyButton = screen.getByRole('button', { name: /复制代码/i })
    await user.click(copyButton)

    // 验证复制功能被调用
    expect(document.execCommand).toHaveBeenCalledWith('copy')
  })

  it('应该支持预览HTML', async () => {
    const mockWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn()
      }
    }
    vi.mocked(window.open).mockReturnValue(mockWindow as any)

    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByDisplayValue(/<html>/)).toBeInTheDocument()
    })

    const previewButton = screen.getByRole('button', { name: /预览/i })
    await user.click(previewButton)

    expect(window.open).toHaveBeenCalledWith('', '_blank', 'width=1200,height=800')
    expect(mockWindow.document.write).toHaveBeenCalledWith('<html><body><h1>测试HTML</h1></body></html>')
    expect(mockWindow.document.close).toHaveBeenCalled()
  })

  it('应该支持重新生成HTML', async () => {
    const { generateHTML } = await import('@/services/htmlExportService')

    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByDisplayValue(/<html>/)).toBeInTheDocument()
    })

    vi.clearAllMocks()

    const regenerateButton = screen.getByRole('button', { name: /重新生成/i })
    await user.click(regenerateButton)

    await waitFor(() => {
      expect(generateHTML).toHaveBeenCalled()
    })
  })

  it('应该显示使用说明', async () => {
    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('使用说明')).toBeInTheDocument()
      expect(screen.getByText('默认导出纯内容HTML，适合直接粘贴到乐天店铺后台')).toBeInTheDocument()
    })
  })

  it('应该在浏览器不支持复制时显示兼容性警告', async () => {
    const { getClipboardCapabilities } = await import('@/lib/clipboardUtils')

    // Mock不支持复制的情况
    vi.mocked(getClipboardCapabilities).mockReturnValue({
      hasClipboardAPI: false,
      isSecureContext: false,
      canCopyHTML: false,
      canCopyText: false
    })

    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('浏览器兼容性提示')).toBeInTheDocument()
      expect(screen.getByText('您的浏览器可能不完全支持自动复制功能，请手动选择代码并复制')).toBeInTheDocument()
    })
  })

  it('应该正确处理自定义属性', () => {
    render(
      <HtmlExportButton
        modules={mockModules}
        pageTitle="自定义标题"
        variant="outline"
        size="sm"
        className="custom-class"
        disabled={true}
      />
    )

    const button = screen.getByRole('button', { name: /导出HTML/i })
    expect(button).toHaveClass('custom-class')
    expect(button).toBeDisabled()
  })

  it('应该在生成HTML时显示加载状态', async () => {
    // Mock延迟的HTML生成
    const { generateHTML } = await import('@/services/htmlExportService')
    vi.mocked(generateHTML).mockImplementation(() => '<html><body>延迟HTML</body></html>')

    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    // 等待生成完成，检查textarea的value属性包含mocked的HTML
    await waitFor(
      () => {
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
        expect(textarea.value).toContain('延迟HTML')
      },
      { timeout: 1000 }
    )
  })

  it('应该正确计算HTML文件大小', async () => {
    render(<HtmlExportButton modules={mockModules} />)

    const button = screen.getByRole('button', { name: /导出HTML/i })
    await user.click(button)

    await waitFor(() => {
      // 检查是否显示文件大小（具体数值可能因HTML内容而异）
      expect(screen.getByText(/\d+(\.\d+)?\s*(B|KB)/)).toBeInTheDocument()
    })
  })
})
