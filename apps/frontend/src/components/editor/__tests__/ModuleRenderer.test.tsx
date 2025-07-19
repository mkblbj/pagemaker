import React from 'react'
import { render, screen } from '@/test-utils'
import { vi } from 'vitest'
import { ModuleRenderer } from '../ModuleRenderer'
import { PageModuleType } from '@pagemaker/shared-types'

describe('ModuleRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染标题模块', () => {
    const titleModule = {
      id: 'title-1',
      type: PageModuleType.TITLE,
      text: '测试标题',
      level: 1
    }

    render(<ModuleRenderer module={titleModule} />)

    expect(screen.getByText('测试标题')).toBeInTheDocument()
    expect(screen.getByText('标题模块 (H1)')).toBeInTheDocument()
  })

  it('应该渲染不同级别的标题', () => {
    const titleModule = {
      id: 'title-2',
      type: PageModuleType.TITLE,
      text: '二级标题',
      level: 2
    }

    render(<ModuleRenderer module={titleModule} />)

    expect(screen.getByText('二级标题')).toBeInTheDocument()
    expect(screen.getByText('标题模块 (H2)')).toBeInTheDocument()
  })

  it('应该渲染文本模块', () => {
    const textModule = {
      id: 'text-1',
      type: PageModuleType.TEXT,
      content: '这是一段测试文本'
    }

    render(<ModuleRenderer module={textModule} />)

    expect(screen.getByText('这是一段测试文本')).toBeInTheDocument()
    expect(screen.getByText('文本模块')).toBeInTheDocument()
  })

  it('应该渲染图片模块', () => {
    const imageModule = {
      id: 'image-1',
      type: PageModuleType.IMAGE,
      src: 'https://example.com/test.jpg',
      alt: '测试图片'
    }

    render(<ModuleRenderer module={imageModule} />)

    expect(screen.getByText('图片模块')).toBeInTheDocument()
    expect(screen.getByAltText('测试图片')).toBeInTheDocument()
  })

  it('应该渲染没有src的图片模块', () => {
    const imageModule = {
      id: 'image-2',
      type: PageModuleType.IMAGE,
      alt: '测试图片'
    }

    render(<ModuleRenderer module={imageModule} />)

    expect(screen.getByText('图片模块')).toBeInTheDocument()
    expect(screen.getByText('点击上传图片')).toBeInTheDocument()
  })

  it('应该渲染键值对模块', () => {
    const keyValueModule = {
      id: 'kv-1',
      type: PageModuleType.KEY_VALUE,
      pairs: [
        { key: '名称', value: '测试产品' },
        { key: '价格', value: '￥99.99' }
      ]
    }

    render(<ModuleRenderer module={keyValueModule} />)

    expect(screen.getByText('键值对模块')).toBeInTheDocument()
    expect(screen.getByText('名称:')).toBeInTheDocument()
    expect(screen.getByText('测试产品')).toBeInTheDocument()
    expect(screen.getByText('价格:')).toBeInTheDocument()
    expect(screen.getByText('￥99.99')).toBeInTheDocument()
  })

  it('应该渲染空的键值对模块', () => {
    const keyValueModule = {
      id: 'kv-empty',
      type: PageModuleType.KEY_VALUE,
      pairs: []
    }

    render(<ModuleRenderer module={keyValueModule} />)

    expect(screen.getByText('键值对模块')).toBeInTheDocument()
    expect(screen.getByText('键:')).toBeInTheDocument()
    expect(screen.getByText('值')).toBeInTheDocument()
  })

  it('应该渲染分隔线模块', () => {
    const separatorModule = {
      id: 'sep-1',
      type: PageModuleType.SEPARATOR
    }

    render(<ModuleRenderer module={separatorModule} />)

    expect(screen.getByText('分隔线模块')).toBeInTheDocument()
  })

  it('应该渲染多列布局模块', () => {
    const multiColumnModule = {
      id: 'mc-1',
      type: PageModuleType.MULTI_COLUMN,
      columns: 3
    }

    render(<ModuleRenderer module={multiColumnModule} />)

    expect(screen.getByText('多列布局模块')).toBeInTheDocument()
    expect(screen.getByText('3 列布局')).toBeInTheDocument()
    expect(screen.getByText('列 1')).toBeInTheDocument()
    expect(screen.getByText('列 2')).toBeInTheDocument()
    expect(screen.getByText('列 3')).toBeInTheDocument()
  })

  it('应该渲染默认2列的多列布局', () => {
    const multiColumnModule = {
      id: 'mc-2',
      type: PageModuleType.MULTI_COLUMN
    }

    render(<ModuleRenderer module={multiColumnModule} />)

    expect(screen.getByText('多列布局模块')).toBeInTheDocument()
    expect(screen.getByText('2 列布局')).toBeInTheDocument()
  })

  it('应该处理未知模块类型', () => {
    const unknownModule = {
      id: 'unknown-1',
      type: 'UNKNOWN_TYPE' as PageModuleType
    }

    render(<ModuleRenderer module={unknownModule} />)

    expect(screen.getByText('未知模块类型')).toBeInTheDocument()
    expect(screen.getByText('模块类型: UNKNOWN_TYPE')).toBeInTheDocument()
    expect(screen.getByText('该模块类型暂不支持预览')).toBeInTheDocument()
  })

  it('应该渲染没有文本的标题模块', () => {
    const titleModule = {
      id: 'title-empty',
      type: PageModuleType.TITLE,
      level: 1
    }

    render(<ModuleRenderer module={titleModule} />)

    expect(screen.getByText('标题文本')).toBeInTheDocument()
    expect(screen.getByText('标题模块 (H1)')).toBeInTheDocument()
  })

  it('应该渲染没有文本的文本模块', () => {
    const textModule = {
      id: 'text-empty',
      type: PageModuleType.TEXT
    }

    render(<ModuleRenderer module={textModule} />)

    expect(screen.getByText('输入文本内容')).toBeInTheDocument()
    expect(screen.getByText('文本模块')).toBeInTheDocument()
  })

  it('应该处理长文本内容', () => {
    const longText = '这是一段很长的文本内容，用来测试组件是否能够正确处理长文本的显示和布局。'.repeat(3)
    const textModule = {
      id: 'text-long',
      type: PageModuleType.TEXT,
      content: longText
    }

    render(<ModuleRenderer module={textModule} />)

    expect(screen.getByText(longText)).toBeInTheDocument()
  })

  it('应该处理特殊字符', () => {
    const specialText = '特殊字符测试: <>&"\''
    const textModule = {
      id: 'text-special',
      type: PageModuleType.TEXT,
      content: specialText
    }

    render(<ModuleRenderer module={textModule} />)

    expect(screen.getByText(specialText)).toBeInTheDocument()
  })

  it('应该为H1标题应用正确的样式', () => {
    const titleModule = {
      id: 'title-h1',
      type: PageModuleType.TITLE,
      text: '大标题',
      level: 1
    }

    render(<ModuleRenderer module={titleModule} />)

    const titleElement = screen.getByText('大标题')
    expect(titleElement).toHaveClass('text-3xl')
  })

  it('应该为H2标题应用正确的样式', () => {
    const titleModule = {
      id: 'title-h2',
      type: PageModuleType.TITLE,
      text: '中标题',
      level: 2
    }

    render(<ModuleRenderer module={titleModule} />)

    const titleElement = screen.getByText('中标题')
    expect(titleElement).toHaveClass('text-2xl')
  })

  it('应该为H3标题应用正确的样式', () => {
    const titleModule = {
      id: 'title-h3',
      type: PageModuleType.TITLE,
      text: '小标题',
      level: 3
    }

    render(<ModuleRenderer module={titleModule} />)

    const titleElement = screen.getByText('小标题')
    expect(titleElement).toHaveClass('text-xl')
  })
})
