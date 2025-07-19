import type { PageModule } from '@pagemaker/shared-types'

// HTML导出配置
export interface HtmlExportOptions {
  includeStyles?: boolean
  minify?: boolean
  title?: string
  description?: string
  language?: string
  fullDocument?: boolean // 是否生成完整HTML文档（包含头尾）
  mobileMode?: boolean // 是否使用移动端模式（乐天约束）
}

// 默认导出选项
const DEFAULT_OPTIONS: Required<HtmlExportOptions> = {
  includeStyles: true,
  minify: false,
  title: 'Pagemaker 导出页面',
  description: '使用 Pagemaker CMS 创建的页面',
  language: 'zh-CN',
  fullDocument: false, // 默认只导出内容部分
  mobileMode: false // 默认不使用移动端模式
}

// 类型安全的属性获取函数
function getStringProp(obj: PageModule, key: string, defaultValue = ''): string {
  const value = obj[key]
  return typeof value === 'string' ? value : String(value || defaultValue)
}

function getNumberProp(obj: PageModule, key: string, defaultValue = 0): number {
  const value = obj[key]
  return typeof value === 'number' ? value : Number(value) || defaultValue
}

function getArrayProp(obj: PageModule, key: string): unknown[] {
  const value = obj[key]
  return Array.isArray(value) ? value : []
}

/**
 * HTML导出服务类
 */
export class HtmlExportService {
  /**
   * 生成HTML文档
   */
  static generateHTML(modules: PageModule[], options: HtmlExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    const htmlContent = this.generateModulesHTML(modules, opts)

    // 如果只需要内容部分，直接返回模块HTML
    if (!opts.fullDocument) {
      return opts.minify ? this.minifyHTML(htmlContent) : htmlContent
    }

    // 生成完整HTML文档
    const styles = opts.includeStyles ? this.generateCSS() : ''

    const html = `<!DOCTYPE html>
<html lang="${opts.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(opts.title)}</title>
    <meta name="description" content="${this.escapeHtml(opts.description)}">
    <meta name="generator" content="Pagemaker CMS">
    ${styles ? `<style>\n${styles}\n    </style>` : ''}
</head>
<body>
    <div class="pagemaker-content">
${htmlContent}
    </div>
</body>
</html>`

    return opts.minify ? this.minifyHTML(html) : html
  }

  /**
   * 生成模块的HTML内容
   */
  private static generateModulesHTML(
    modules: PageModule[],
    options: Required<HtmlExportOptions> = DEFAULT_OPTIONS
  ): string {
    return modules
      .map(module => this.generateModuleHTML(module, options))
      .filter(html => html.trim() !== '')
      .join('\n')
  }

  /**
   * 生成单个模块的HTML
   */
  private static generateModuleHTML(module: PageModule, options: Required<HtmlExportOptions>): string {
    switch (module.type) {
      case 'title':
        return options.mobileMode ? this.generateTitleHTMLMobile(module) : this.generateTitleHTML(module)
      case 'text':
        return options.mobileMode ? this.generateTextHTMLMobile(module) : this.generateTextHTML(module)
      case 'image':
        return this.generateImageHTML(module)
      case 'separator':
        return this.generateSeparatorHTML(module)
      case 'keyValue':
        return this.generateKeyValueHTML(module)
      case 'multiColumn':
        return this.generateMultiColumnHTML(module)
      default:
        console.warn(`未知的模块类型: ${module.type}`)
        return ''
    }
  }

  /**
   * 生成标题模块HTML
   */
  private static generateTitleHTML(module: PageModule): string {
    const content = getStringProp(module, 'text', getStringProp(module, 'content'))
    const level = module.level ? `h${module.level}` : getStringProp(module, 'level', 'h2')
    const alignment = getStringProp(module, 'alignment', 'left')
    const color = getStringProp(module, 'color', '#000000')
    const fontFamily = getStringProp(module, 'fontFamily', 'inherit')
    const fontWeight = getStringProp(module, 'fontWeight', 'bold')

    const styles = this.generateInlineStyles({
      'text-align': alignment,
      color: color,
      'font-family': fontFamily !== 'inherit' ? fontFamily : undefined,
      'font-weight': fontWeight,
      'margin-top': this.formatSpacing(getStringProp(module, 'marginTop')),
      'margin-bottom': this.formatSpacing(getStringProp(module, 'marginBottom')),
      'padding-top': this.formatSpacing(getStringProp(module, 'paddingTop')),
      'padding-bottom': this.formatSpacing(getStringProp(module, 'paddingBottom')),
      'padding-left': this.formatSpacing(getStringProp(module, 'paddingLeft')),
      'padding-right': this.formatSpacing(getStringProp(module, 'paddingRight')),
      'background-color': getStringProp(module, 'backgroundColor')
    })

    // 处理换行符
    const formattedContent = this.escapeHtml(content).replace(/\n/g, '<br>')

    return `        <${level} class="pm-title" style="${styles}">${formattedContent}</${level}>`
  }

  /**
   * 生成文本模块HTML
   */
  private static generateTextHTML(module: PageModule): string {
    const content = getStringProp(module, 'content')
    const alignment = getStringProp(module, 'alignment', 'left')
    const fontSize = getStringProp(module, 'fontSize', '14px')
    const fontFamily = getStringProp(module, 'fontFamily', 'inherit')
    const textColor = getStringProp(module, 'textColor', '#000000')
    const backgroundColor = getStringProp(module, 'backgroundColor', 'transparent')

    const styles = this.generateInlineStyles({
      'text-align': alignment,
      'font-size': fontSize,
      'font-family': fontFamily !== 'inherit' ? fontFamily : undefined,
      'line-height': '1.6',
      color: textColor,
      'background-color': backgroundColor !== 'transparent' ? backgroundColor : undefined,
      'margin-top': this.formatSpacing(getStringProp(module, 'marginTop')),
      'margin-bottom': this.formatSpacing(getStringProp(module, 'marginBottom')),
      'padding-top': this.formatSpacing(getStringProp(module, 'paddingTop')),
      'padding-bottom': this.formatSpacing(getStringProp(module, 'paddingBottom')),
      'padding-left': this.formatSpacing(getStringProp(module, 'paddingLeft')),
      'padding-right': this.formatSpacing(getStringProp(module, 'paddingRight'))
    })

    // 文本模块支持富文本HTML内容，无需转义
    // 但需要确保安全性，这里我们假设内容已经被适当处理
    const formattedContent = content || '输入文本内容'

    return `        <div class="pm-text" style="${styles}">${formattedContent}</div>`
  }

  /**
   * 生成标题模块HTML（移动端乐天约束版本）
   */
  private static generateTitleHTMLMobile(module: PageModule): string {
    const content = getStringProp(module, 'text', getStringProp(module, 'content'))
    const alignment = getStringProp(module, 'alignment', 'left')
    const color = getStringProp(module, 'color', '#000000')
    const fontSize = this.convertToFontSize(getStringProp(module, 'fontSize', '24px'))

    // 转换对齐方式为乐天支持的格式
    const alignValue = alignment === 'justify' ? 'left' : alignment

    // 处理换行符，转换为<br>
    const formattedContent = this.escapeHtml(content).replace(/\n/g, '<br>')

    // 使用table布局和font标签，符合乐天约束
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td align="${alignValue}"><font size="${fontSize}" color="${color}"><b>${formattedContent}</b></font></td>
</tr>
</table>`
  }

  /**
   * 生成文本模块HTML（移动端乐天约束版本）
   */
  private static generateTextHTMLMobile(module: PageModule): string {
    const content = getStringProp(module, 'content')
    const alignment = getStringProp(module, 'alignment', 'left')
    const textColor = getStringProp(module, 'textColor', '#000000')
    const fontSize = this.convertToFontSize(getStringProp(module, 'fontSize', '14px'))
    const backgroundColor = getStringProp(module, 'backgroundColor', 'transparent')

    // 转换对齐方式为乐天支持的格式
    const alignValue = alignment === 'justify' ? 'left' : alignment

    // 处理富文本内容，确保只使用乐天允许的标签
    const formattedContent = this.sanitizeHTMLForRakuten(content || '输入文本内容')

    // 使用<p>标签，更语义化且符合乐天约束
    const bgColorAttr = backgroundColor !== 'transparent' ? ` bgcolor="${backgroundColor}"` : ''
    const alignAttr = alignValue !== 'left' ? ` align="${alignValue}"` : ''

    return `<p${alignAttr}><font size="${fontSize}" color="${textColor}">${formattedContent}</font></p>`
  }

  /**
   * 转换CSS字体大小为HTML font标签的size属性
   */
  private static convertToFontSize(cssSize: string): string {
    // 将CSS字体大小转换为HTML font标签的size属性（1-7）
    const size = parseInt(cssSize.replace(/[^\d]/g, ''))
    if (size <= 10) return '1'
    if (size <= 12) return '2'
    if (size <= 14) return '3'
    if (size <= 18) return '4'
    if (size <= 24) return '5'
    if (size <= 36) return '6'
    return '7'
  }

  /**
   * 清理HTML内容，确保只包含乐天允许的标签
   */
  private static sanitizeHTMLForRakuten(html: string): string {
    // 允许的标签：a, img, table, td, th, tr, br, p, font, b, center, hr
    // 移除不允许的标签，保留内容
    return (
      html
        .replace(/<div[^>]*>/gi, '<p>')
        .replace(/<\/div>/gi, '</p>')
        .replace(/<span[^>]*>/gi, '')
        .replace(/<\/span>/gi, '')
        .replace(/<strong[^>]*>/gi, '<b>')
        .replace(/<\/strong>/gi, '</b>')
        .replace(/<em[^>]*>/gi, '')
        .replace(/<\/em>/gi, '')
        .replace(/<u[^>]*>/gi, '')
        .replace(/<\/u>/gi, '')
        // 清理不允许的属性，只保留href, target, alt, src, width, height等
        .replace(/\s(class|id|style)="[^"]*"/gi, '')
    )
  }

  /**
   * 生成图片模块HTML
   */
  private static generateImageHTML(module: PageModule): string {
    const src = getStringProp(module, 'src')
    const alt = getStringProp(module, 'alt')
    const width = getStringProp(module, 'width', 'auto')
    const height = getStringProp(module, 'height', 'auto')
    const alignment = getStringProp(module, 'alignment', 'center')

    if (!src) {
      return `        <div class="pm-image-placeholder" style="text-align: ${alignment}; padding: 20px; background-color: #f5f5f5; border: 2px dashed #ccc;">
            <p style="margin: 0; color: #666;">图片未设置</p>
        </div>`
    }

    const imgStyles = this.generateInlineStyles({
      width: width === 'auto' ? 'auto' : width,
      height: height === 'auto' ? 'auto' : height,
      'max-width': '100%'
    })

    const containerStyles = this.generateInlineStyles({
      'text-align': alignment,
      'margin-top': this.formatSpacing(getStringProp(module, 'marginTop')),
      'margin-bottom': this.formatSpacing(getStringProp(module, 'marginBottom')),
      'padding-top': this.formatSpacing(getStringProp(module, 'paddingTop')),
      'padding-bottom': this.formatSpacing(getStringProp(module, 'paddingBottom')),
      'padding-left': this.formatSpacing(getStringProp(module, 'paddingLeft')),
      'padding-right': this.formatSpacing(getStringProp(module, 'paddingRight')),
      'background-color': getStringProp(module, 'backgroundColor')
    })

    return `        <div class="pm-image" style="${containerStyles}">
            <img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(alt)}" style="${imgStyles}">
        </div>`
  }

  /**
   * 生成分隔符模块HTML
   */
  private static generateSeparatorHTML(module: PageModule): string {
    const style = getStringProp(module, 'style', 'solid')
    const color = getStringProp(module, 'color', '#e0e0e0')
    const thickness = getNumberProp(module, 'thickness', 1)
    const width = getStringProp(module, 'width', '100%')

    const styles = this.generateInlineStyles({
      'border-top': `${thickness}px ${style} ${color}`,
      width: width,
      'margin-top': this.formatSpacing(getStringProp(module, 'marginTop')),
      'margin-bottom': this.formatSpacing(getStringProp(module, 'marginBottom')),
      'margin-left': 'auto',
      'margin-right': 'auto'
    })

    return `        <hr class="pm-separator" style="${styles}">`
  }

  /**
   * 生成键值对模块HTML
   */
  private static generateKeyValueHTML(module: PageModule): string {
    const items = getArrayProp(module, 'items')
    const layout = getStringProp(module, 'layout', 'horizontal')

    const containerStyles = this.generateInlineStyles({
      'margin-top': this.formatSpacing(getStringProp(module, 'marginTop')),
      'margin-bottom': this.formatSpacing(getStringProp(module, 'marginBottom')),
      'padding-top': this.formatSpacing(getStringProp(module, 'paddingTop')),
      'padding-bottom': this.formatSpacing(getStringProp(module, 'paddingBottom')),
      'padding-left': this.formatSpacing(getStringProp(module, 'paddingLeft')),
      'padding-right': this.formatSpacing(getStringProp(module, 'paddingRight')),
      'background-color': getStringProp(module, 'backgroundColor')
    })

    const itemsHTML = items
      .map((item: any) => {
        const key = this.escapeHtml(String(item?.key || ''))
        const value = this.escapeHtml(String(item?.value || ''))

        if (layout === 'vertical') {
          return `            <div class="pm-kv-item" style="margin-bottom: 8px;">
                <div class="pm-kv-key" style="font-weight: bold; margin-bottom: 4px;">${key}</div>
                <div class="pm-kv-value">${value}</div>
            </div>`
        } else {
          return `            <div class="pm-kv-item" style="display: flex; margin-bottom: 8px;">
                <div class="pm-kv-key" style="font-weight: bold; margin-right: 16px; min-width: 120px;">${key}</div>
                <div class="pm-kv-value" style="flex: 1;">${value}</div>
            </div>`
        }
      })
      .join('\n')

    return `        <div class="pm-key-value" style="${containerStyles}">
${itemsHTML}
        </div>`
  }

  /**
   * 生成多列模块HTML
   */
  private static generateMultiColumnHTML(module: PageModule): string {
    const columns = getArrayProp(module, 'columns')
    const gap = getNumberProp(module, 'gap', 16)

    const containerStyles = this.generateInlineStyles({
      display: 'flex',
      gap: `${gap}px`,
      'margin-top': this.formatSpacing(getStringProp(module, 'marginTop')),
      'margin-bottom': this.formatSpacing(getStringProp(module, 'marginBottom')),
      'padding-top': this.formatSpacing(getStringProp(module, 'paddingTop')),
      'padding-bottom': this.formatSpacing(getStringProp(module, 'paddingBottom')),
      'padding-left': this.formatSpacing(getStringProp(module, 'paddingLeft')),
      'padding-right': this.formatSpacing(getStringProp(module, 'paddingRight')),
      'background-color': getStringProp(module, 'backgroundColor'),
      'flex-wrap': 'wrap'
    })

    const columnsHTML = columns
      .map((column: any) => {
        const width = String(column?.width || 'auto')
        const content = this.escapeHtml(String(column?.content || ''))

        const columnStyles = this.generateInlineStyles({
          flex: width === 'auto' ? '1' : 'none',
          width: width !== 'auto' ? width : undefined,
          'min-width': '0'
        })

        return `            <div class="pm-column" style="${columnStyles}">
                ${content.replace(/\n/g, '<br>')}
            </div>`
      })
      .join('\n')

    return `        <div class="pm-multi-column" style="${containerStyles}">
${columnsHTML}
        </div>`
  }

  /**
   * 生成CSS样式
   */
  private static generateCSS(): string {
    return `        /* Pagemaker CMS 导出样式 */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .pagemaker-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .pm-title {
            margin: 16px 0;
            font-weight: 600;
        }
        
        .pm-text {
            margin: 12px 0;
        }
        
        .pm-image {
            margin: 16px 0;
        }
        
        .pm-separator {
            border: none;
            margin: 20px 0;
        }
        
        .pm-key-value {
            margin: 16px 0;
        }
        
        .pm-multi-column {
            margin: 16px 0;
        }
        
        .pm-image-placeholder {
            border-radius: 4px;
        }
        
        @media (max-width: 768px) {
            .pagemaker-content {
                padding: 16px;
            }
            
            .pm-multi-column {
                flex-direction: column !important;
            }
            
            .pm-column {
                width: 100% !important;
                flex: none !important;
            }
            
            .pm-kv-item {
                flex-direction: column !important;
            }
            
            .pm-kv-key {
                min-width: auto !important;
                margin-right: 0 !important;
                margin-bottom: 4px !important;
            }
        }`
  }

  /**
   * 生成内联样式字符串
   */
  private static generateInlineStyles(styles: Record<string, string | undefined>): string {
    return Object.entries(styles)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([property, value]) => `${property}: ${value}`)
      .join('; ')
  }

  /**
   * 格式化间距值
   */
  private static formatSpacing(value: string): string | undefined {
    if (!value || value === '') return undefined
    if (/^\d+$/.test(value)) return `${value}px`
    return value
  }

  /**
   * HTML转义
   */
  private static escapeHtml(text: string): string {
    // 优先使用手动转义，确保在所有环境中都能正常工作
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

  /**
   * 简单的HTML压缩
   */
  private static minifyHTML(html: string): string {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/^\s+|\s+$/g, '')
  }
}

/**
 * 便捷的导出函数
 */
export function generateHTML(modules: PageModule[], options?: HtmlExportOptions): string {
  return HtmlExportService.generateHTML(modules, options)
}

/**
 * 生成预览HTML（不包含完整文档结构）
 */
export function generatePreviewHTML(modules: PageModule[]): string {
  return HtmlExportService['generateModulesHTML'](modules)
}
