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
        return this.generateImageHTML(module, options)
      case 'separator':
        return this.generateSeparatorHTML(module, options)
      case 'keyValue':
        return this.generateKeyValueHTML(module, options)
      case 'multiColumn':
        return this.generateMultiColumnHTML(module, options)
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
  private static generateImageHTML(module: PageModule, options: Required<HtmlExportOptions> = DEFAULT_OPTIONS): string {
    const src = getStringProp(module, 'src')
    const alt = getStringProp(module, 'alt', '图片')
    const alignment = getStringProp(module, 'alignment', 'center')

    // 获取尺寸配置
    const size = module.size as { type: 'preset' | 'percentage'; value: string } | undefined

    // 获取链接配置
    const link = module.link as { type: 'url' | 'email' | 'phone' | 'anchor'; value: string } | undefined

    if (!src) {
      if (options.mobileMode) {
        return `<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td align="${alignment}"><font size="2" color="#666666">图片未设置</font></td>
</tr>
</table>`
      } else {
        return `        <div class="pm-image-placeholder" style="text-align: ${alignment}; padding: 20px; background-color: #f5f5f5; border: 2px dashed #ccc;">
            <p style="margin: 0; color: #666;">图片未设置</p>
        </div>`
      }
    }

    // 计算图片宽度
    let imageWidth = '100%'
    if (size) {
      if (size.type === 'preset') {
        const presetSizes: Record<string, string> = {
          small: '200px',
          medium: '400px',
          large: '600px',
          full: '100%'
        }
        imageWidth = presetSizes[size.value] || '100%'
      } else if (size.type === 'percentage') {
        imageWidth = `${size.value}%`
      }
    }

    if (options.mobileMode) {
      // 乐天移动端约束版本 - 使用table布局
      const alignValue = alignment === 'justify' ? 'center' : alignment

      // 生成图片元素（乐天约束：只支持特定属性）
      const imgElement = `<img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(alt)}" width="${imageWidth}">`

      // 如果有链接，包装在链接中
      let content = imgElement
      if (link && link.value) {
        let href = link.value

        // 根据链接类型生成正确的href
        switch (link.type) {
          case 'email':
            href = `mailto:${link.value}`
            break
          case 'phone':
            href = `tel:${link.value}`
            break
          case 'anchor':
            href = `#${link.value}`
            break
          // 'url' 类型直接使用原值
        }

        content = `<a href="${this.escapeHtml(href)}">${imgElement}</a>`
      }

      return `<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td align="${alignValue}">${content}</td>
</tr>
</table>`
    } else {
      // 标准版本 - 使用div和CSS样式
      const imgStyles = this.generateInlineStyles({
        width: imageWidth,
        'max-width': '100%',
        height: 'auto'
      })

      const containerStyles = this.generateInlineStyles({
        'text-align': alignment,
        margin: '16px 0'
      })

      // 生成图片元素
      const imgElement = `<img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(alt)}" style="${imgStyles}">`

      // 如果有链接，包装在链接中
      let content = imgElement
      if (link && link.value) {
        let href = link.value

        // 根据链接类型生成正确的href
        switch (link.type) {
          case 'email':
            href = `mailto:${link.value}`
            break
          case 'phone':
            href = `tel:${link.value}`
            break
          case 'anchor':
            href = `#${link.value}`
            break
          // 'url' 类型直接使用原值
        }

        content = `<a href="${this.escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${imgElement}</a>`
      }

      return `        <div class="pm-image" style="${containerStyles}">
            ${content}
        </div>`
    }
  }

  /**
   * 生成分隔符模块HTML
   */
  private static generateSeparatorHTML(
    module: PageModule,
    options: Required<HtmlExportOptions> = DEFAULT_OPTIONS
  ): string {
    const separatorType = getStringProp(module, 'separatorType', 'line')

    if (separatorType === 'space') {
      // 空白间距类型
      const spaceHeight = getStringProp(module, 'spaceHeight', 'medium')
      const heightMap = {
        small: '20px',
        medium: '40px',
        large: '60px',
        'extra-large': '80px'
      }
      const height = heightMap[spaceHeight as keyof typeof heightMap] || '40px'

      if (options.mobileMode) {
        // 乐天移动端约束版本 - 使用table实现空白间距
        return `<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td height="${height}">&nbsp;</td>
</tr>
</table>`
      } else {
        // 标准版本 - 使用div实现空白间距
        const styles = this.generateInlineStyles({
          height: height,
          width: '100%'
        })
        return `        <div class="pm-separator-space" style="${styles}"></div>`
      }
    } else {
      // 线条分隔类型
      const lineColor = getStringProp(module, 'lineColor', '#e5e7eb')
      const lineThickness = getNumberProp(module, 'lineThickness', 1)
      const lineStyle = getStringProp(module, 'lineStyle', 'solid')

      if (options.mobileMode) {
        // 乐天移动端约束版本
        if (lineStyle === 'solid') {
          // 实线使用标准hr标签
          return `<hr color="${lineColor}" size="${lineThickness}">`
        } else {
          // 虚线和点线使用table+border实现（更好的兼容性）
          const borderStyle = lineStyle === 'dashed' ? 'dashed' : 'dotted'
          return `<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td style="border-top: ${lineThickness}px ${borderStyle} ${lineColor}; height: 0; line-height: 0; font-size: 0;">&nbsp;</td>
</tr>
</table>`
        }
      } else {
        // 标准版本 - 使用CSS样式
        const styles = this.generateInlineStyles({
          'border-top': `${lineThickness}px ${lineStyle} ${lineColor}`,
          'border-bottom': 'none',
          'border-left': 'none',
          'border-right': 'none',
          width: '100%',
          margin: '16px 0',
          height: '0'
        })

        return `        <hr class="pm-separator-line" style="${styles}">`
      }
    }
  }

  /**
   * 生成键值对模块HTML
   */
  private static generateKeyValueHTML(
    module: PageModule,
    options: Required<HtmlExportOptions> = DEFAULT_OPTIONS
  ): string {
    // 支持新的rows属性，向后兼容items属性
    const rowsArray = getArrayProp(module, 'rows')
    const itemsArray = getArrayProp(module, 'items')

    // 优先使用rows，如果rows为空数组且module中没有rows属性，则使用items
    const rows =
      module.hasOwnProperty('rows') && rowsArray.length > 0
        ? rowsArray
        : !module.hasOwnProperty('rows') && itemsArray.length > 0
          ? itemsArray
          : rowsArray.length > 0
            ? rowsArray
            : itemsArray

    const labelBackgroundColor = getStringProp(module, 'labelBackgroundColor', '#f3f4f6')
    const textColor = getStringProp(module, 'textColor', '#374151')

    if (!rows || rows.length === 0) {
      return '<!-- 键值对模块：无数据 -->'
    }

    if (options.mobileMode) {
      // 乐天移动端约束版本 - 使用table布局，不能使用style属性
      const tableRows = rows
        .map((row: any) => {
          const key = this.escapeHtml(String(row?.key || ''))
          const value = this.escapeHtml(String(row?.value || ''))

          return `<tr>
<td bgcolor="${labelBackgroundColor}" width="30%" align="left" valign="top">
<font color="${textColor}"><b>${key}</b></font>
</td>
<td bgcolor="#ffffff" width="70%" align="left" valign="top">
<font color="${textColor}">${value}</font>
</td>
</tr>`
        })
        .join('\n')

      return `<table width="100%" cellpadding="8" cellspacing="1" border="0">
${tableRows}
</table>`
    } else {
      // 标准版本 - 使用table布局以获得更好的样式控制
      const containerStyles = this.generateInlineStyles({
        'margin-top': this.formatSpacing(getStringProp(module, 'marginTop')),
        'margin-bottom': this.formatSpacing(getStringProp(module, 'marginBottom')),
        'padding-top': this.formatSpacing(getStringProp(module, 'paddingTop')),
        'padding-bottom': this.formatSpacing(getStringProp(module, 'paddingBottom')),
        'padding-left': this.formatSpacing(getStringProp(module, 'paddingLeft')),
        'padding-right': this.formatSpacing(getStringProp(module, 'paddingRight')),
        width: '100%',
        'border-collapse': 'collapse'
      })

      const tableRows = rows
        .map((row: any) => {
          const key = this.escapeHtml(String(row?.key || ''))
          const value = this.escapeHtml(String(row?.value || ''))

          const labelCellStyles = this.generateInlineStyles({
            'background-color': labelBackgroundColor,
            color: textColor,
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            'font-weight': 'bold',
            'vertical-align': 'top',
            width: '30%'
          })

          const valueCellStyles = this.generateInlineStyles({
            color: textColor,
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            'vertical-align': 'top'
          })

          return `            <tr>
                <td class="pm-kv-key" style="${labelCellStyles}">${key}</td>
                <td class="pm-kv-value" style="${valueCellStyles}">${value.replace(/\n/g, '<br>')}</td>
            </tr>`
        })
        .join('\n')

      return `        <table class="pm-key-value" style="${containerStyles}">
${tableRows}
        </table>`
    }
  }

  /**
   * 生成多列模块HTML
   */
  private static generateMultiColumnHTML(
    module: PageModule,
    options: Required<HtmlExportOptions> = DEFAULT_OPTIONS
  ): string {
    const columns = getArrayProp(module, 'columns')
    const backgroundColor = getStringProp(module, 'backgroundColor')

    if (options.mobileMode) {
      // 乐天移动端约束版本 - 使用table布局
      const bgColorAttr = backgroundColor && backgroundColor !== 'transparent' ? ` bgcolor="${backgroundColor}"` : ''

      // 计算每列的宽度百分比
      const columnWidth = Math.floor(100 / columns.length)

      const columnsHTML = columns
        .map((column: any) => {
          const content = this.escapeHtml(String(column?.content || ''))
          return `<td width="${columnWidth}%" valign="top"><font size="2">${content.replace(/\n/g, '<br>')}</font></td>`
        })
        .join('\n')

      return `<table width="100%" cellpadding="5" cellspacing="0" border="0"${bgColorAttr}>
<tr>
${columnsHTML}
</tr>
</table>`
    } else {
      // 标准版本 - 使用div和CSS样式
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
        'background-color': backgroundColor,
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
