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
    const fontSize = getStringProp(module, 'fontSize', '4') // 默认size为4
    const fontFamily = getStringProp(module, 'fontFamily', 'inherit')
    const textColor = getStringProp(module, 'textColor', '#000000')
    const backgroundColor = getStringProp(module, 'backgroundColor', 'transparent')

    // 将数字字体大小转换为CSS像素值，与HTML font size标准保持一致
    const getFontSizeInPx = (size: string): string => {
      // 标准HTML font size映射 - 与浏览器默认行为一致
      const sizeMap: Record<string, string> = {
        '1': '12px', // xx-small
        '2': '16px', // small
        '3': '18px', // medium (浏览器默认)
        '4': '24px', // large - 标准大小
        '5': '32px', // x-large
        '6': '48px', // xx-large
        '7': '64px' // xxx-large
      }
      return sizeMap[size] || '18px' // 默认18px对应size 3
    }

    const styles = this.generateInlineStyles({
      'text-align': alignment,
      'font-size': getFontSizeInPx(fontSize), // 转换为像素值
      'font-family': fontFamily !== 'inherit' ? fontFamily : undefined,
      'line-height': '1.625', // 匹配TextModule的leading-relaxed
      color: textColor,
      'background-color': backgroundColor !== 'transparent' ? backgroundColor : undefined,
      'margin-top': this.formatSpacing(getStringProp(module, 'marginTop')),
      'margin-bottom': this.formatSpacing(getStringProp(module, 'marginBottom')),
      'padding-top': this.formatSpacing(getStringProp(module, 'paddingTop')),
      'padding-bottom': this.formatSpacing(getStringProp(module, 'paddingBottom')),
      'padding-left': this.formatSpacing(getStringProp(module, 'paddingLeft')),
      'padding-right': this.formatSpacing(getStringProp(module, 'paddingRight'))
    })

    // 将换行符转换为br标签，确保换行正确显示
    const processedContent = (content || '输入文本内容').replace(/\n/g, '<br>')

    return `        <div class="pm-text" style="${styles}">${processedContent}</div>`
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
    // 支持两种属性结构：直接属性和textConfig属性
    const textConfig = (module as any).textConfig
    const content = textConfig?.content || getStringProp(module, 'content')
    const alignment = textConfig?.alignment || getStringProp(module, 'alignment', 'left')
    const textColor = textConfig?.color || getStringProp(module, 'textColor', '#000000')
    const fontSize = this.convertToFontSize(textConfig?.fontSize || getStringProp(module, 'fontSize', '4')) // 默认size为4

    // 转换对齐方式为乐天支持的格式
    const alignValue = alignment === 'justify' ? 'left' : alignment

    // 如果没有内容，返回默认文本
    if (!content || content.trim() === '') {
      const alignAttr = alignValue !== 'left' ? ` align="${alignValue}"` : ''
      return `<p${alignAttr}><font size="${fontSize}" color="${textColor}">输入文本内容</font></p>`
    }

    // 将换行符转换为br标签，然后进行HTML清理
    const contentWithBr = content.replace(/\n/g, '<br>')
    const sanitizedContent = this.sanitizeHTMLForRakuten(contentWithBr)

    // 使用单个p标签包裹，内部使用br标签换行（符合楽天格式）
    const alignAttr = alignValue !== 'left' ? ` align="${alignValue}"` : ''
    return `<p${alignAttr}><font size="${fontSize}" color="${textColor}">${sanitizedContent}</font></p>`
  }

  /**
   * 转换字体大小为HTML font标签的size属性
   * 直接使用1-7的size数值
   */
  private static convertToFontSize(size: string | number): string {
    const numericSize = typeof size === 'number' ? size : parseInt(size.toString().replace(/[^\d]/g, ''))

    // 确保在1-7范围内
    if (numericSize >= 1 && numericSize <= 7) {
      return numericSize.toString()
    }

    // 超出范围时使用默认值4
    return '4'
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
        return `<p align="${alignment}"><font size="2" color="#666666">图片未设置</font></p>`
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

    // 生成图片元素的基本属性
    const imgAttributes = [`src="${this.escapeHtml(src)}"`, `alt="${this.escapeHtml(alt)}"`, `width="${imageWidth}"`]

    // 添加对齐样式（仅在非居中时添加）
    if (alignment !== 'center') {
      if (options.mobileMode) {
        imgAttributes.push(`align="${alignment}"`)
      } else {
        imgAttributes.push(
          `style="display: block; margin: 0 ${alignment === 'left' ? 'auto 0 0' : alignment === 'right' ? '0 0 auto' : 'auto'};"`
        )
      }
    }

    const imgElement = `<img ${imgAttributes.join(' ')}>`

    // 如果有链接，包装在链接中
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

      const linkAttributes = [`href="${this.escapeHtml(href)}"`]
      if (!options.mobileMode && link.type === 'url') {
        linkAttributes.push('target="_blank"', 'rel="noopener noreferrer"')
      }

      return `<a ${linkAttributes.join(' ')}>${imgElement}</a>`
    }

    // 直接返回图片元素
    return imgElement
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
    const layout = getStringProp(module, 'layout', 'imageLeft')
    const imageConfig = (module.imageConfig as any) || {}
    const textConfig = (module.textConfig as any) || {}

    // 如果图片和文本都为空，返回占位符
    if (!imageConfig.src && !textConfig.content) {
      if (options.mobileMode) {
        return `<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td align="center"><font size="2" color="#666666">多列图文模块：内容未设置</font></td>
</tr>
</table>`
      } else {
        return `        <div class="pm-multi-column-placeholder" style="text-align: center; padding: 20px; background-color: #f5f5f5; border: 2px dashed #ccc;">
            <p style="margin: 0; color: #666;">多列图文模块：内容未设置</p>
        </div>`
      }
    }

    if (options.mobileMode) {
      // 乐天移动端约束版本 - 所有布局都使用垂直堆叠
      return this.generateMultiColumnHTMLMobile(module, imageConfig, textConfig)
    } else {
      // 标准版本 - 支持四种布局和响应式
      return this.generateMultiColumnHTMLStandard(module, layout, imageConfig, textConfig)
    }
  }

  /**
   * 生成多列图文模块HTML（移动端乐天约束版本）
   */
  private static generateMultiColumnHTMLMobile(module: PageModule, imageConfig: any, textConfig: any): string {
    const layout = getStringProp(module, 'layout', 'imageLeft')

    // 如果图片和文本都不存在，返回空
    if (!imageConfig.src && !textConfig.content) {
      return ''
    }

    // 如果只有图片或只有文本，使用单独的table
    if (!imageConfig.src || !textConfig.content) {
      return this.generateSingleContentMobile(imageConfig, textConfig)
    }

    // 根据布局生成HTML
    switch (layout) {
      case 'imageLeft':
      case 'textLeft':
        return this.generateHorizontalLayoutMobile(layout, imageConfig, textConfig)
      case 'imageTop':
      case 'textTop':
        return this.generateVerticalLayoutMobile(layout, imageConfig, textConfig)
      default:
        return this.generateHorizontalLayoutMobile('imageLeft', imageConfig, textConfig)
    }
  }

  /**
   * 生成单内容移动端HTML（只有图片或只有文本）
   */
  private static generateSingleContentMobile(imageConfig: any, textConfig: any): string {
    if (imageConfig.src) {
      const imageWidth = this.parseWidth(imageConfig.width, '100%')
      const rawAlignment = imageConfig.alignment || 'center'
      // 移动端乐天约束：table的left/right对齐会导致页面崩溃，只使用center
      const imageAlignment = rawAlignment === 'left' || rawAlignment === 'right' ? 'center' : rawAlignment

      let imgElement = `<img src="${this.escapeHtml(imageConfig.src)}" alt="${this.escapeHtml(imageConfig.alt || '图片')}" width="${imageWidth}">`

      if (imageConfig.link && imageConfig.link.value) {
        const href = this.generateLinkHref(imageConfig.link)
        imgElement = `<a href="${this.escapeHtml(href)}">${imgElement}</a>`
      }

      return `<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td align="${imageAlignment}">${imgElement}</td>
</tr>
</table>`
    }

    if (textConfig.content) {
      const textAlignment = textConfig.alignment || 'left'
      const fontSize = this.convertToFontSize(textConfig.fontSize || '4') // 默认size为4
      const textColor = textConfig.color || '#000000'
      const backgroundColor = textConfig.backgroundColor || 'transparent'

      const bgColorAttr = backgroundColor !== 'transparent' ? ` bgcolor="${backgroundColor}"` : ''
      const alignAttr = textAlignment !== 'left' ? ` align="${textAlignment}"` : ''

      // 将换行符转换为br标签，然后进行HTML清理
      const contentWithBr = textConfig.content.replace(/\n/g, '<br>')
      const sanitizedContent = this.sanitizeHTMLForRakuten(contentWithBr)

      return `<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td${alignAttr}${bgColorAttr}><font size="${fontSize}" color="${textColor}">${sanitizedContent}</font></td>
</tr>
</table>`
    }

    return ''
  }

  /**
   * 生成水平布局移动端HTML（左图右文/左文右图）
   */
  private static generateHorizontalLayoutMobile(layout: string, imageConfig: any, textConfig: any): string {
    const imageWidth = this.parseWidth(imageConfig.width, '100%') // 移动端默认全宽
    const rawImageAlignment = imageConfig.alignment || 'center'
    // 移动端乐天约束：table的left/right对齐会导致页面崩溃，只使用center
    const imageAlignment = rawImageAlignment === 'left' || rawImageAlignment === 'right' ? 'center' : rawImageAlignment

    let imgElement = `<img src="${this.escapeHtml(imageConfig.src)}" alt="${this.escapeHtml(imageConfig.alt || '图片')}" width="${imageWidth}">`

    if (imageConfig.link && imageConfig.link.value) {
      const href = this.generateLinkHref(imageConfig.link)
      imgElement = `<a href="${this.escapeHtml(href)}">${imgElement}</a>`
    }

    const textAlignment = textConfig.alignment || 'left'
    const fontSize = this.convertToFontSize(textConfig.fontSize || '4') // 默认size为4
    const textColor = textConfig.color || '#000000'
    const backgroundColor = textConfig.backgroundColor || 'transparent'

    const textBgColorAttr = backgroundColor !== 'transparent' ? ` bgcolor="${backgroundColor}"` : ''
    const textAlignAttr = textAlignment !== 'left' ? ` align="${textAlignment}"` : ''

    // 将换行符转换为br标签，然后进行HTML清理
    const contentWithBr = textConfig.content.replace(/\n/g, '<br>')
    const sanitizedContent = this.sanitizeHTMLForRakuten(contentWithBr)

    // 根据布局决定图片和文本的顺序
    const isImageLeft = layout === 'imageLeft'
    const imageCell = `<td width="49%" align="${imageAlignment}">${imgElement}</td>`
    const textCell = `<td${textBgColorAttr} width="49%"${textAlignAttr}><font size="${fontSize}" color="${textColor}">${sanitizedContent}</font></td>`

    return `<table width="100%" cellspacing="0" cellpadding="0" border="0">
<tr align="center">
${isImageLeft ? imageCell : textCell}
${isImageLeft ? textCell : imageCell}
</tr>
</table>`
  }

  /**
   * 生成垂直布局移动端HTML（上图下文/上文下图）
   */
  private static generateVerticalLayoutMobile(layout: string, imageConfig: any, textConfig: any): string {
    const imageWidth = this.parseWidth(imageConfig.width, '100%')
    const rawImageAlignment = imageConfig.alignment || 'center'
    // 移动端乐天约束：table的left/right对齐会导致页面崩溃，只使用center
    const imageAlignment = rawImageAlignment === 'left' || rawImageAlignment === 'right' ? 'center' : rawImageAlignment

    let imgElement = `<img src="${this.escapeHtml(imageConfig.src)}" alt="${this.escapeHtml(imageConfig.alt || '图片')}" width="${imageWidth}">`

    if (imageConfig.link && imageConfig.link.value) {
      const href = this.generateLinkHref(imageConfig.link)
      imgElement = `<a href="${this.escapeHtml(href)}">${imgElement}</a>`
    }

    const textAlignment = textConfig.alignment || 'left'
    const fontSize = this.convertToFontSize(textConfig.fontSize || '4') // 默认size为4
    const textColor = textConfig.color || '#000000'
    const backgroundColor = textConfig.backgroundColor || 'transparent'

    const textBgColorAttr = backgroundColor !== 'transparent' ? ` bgcolor="${backgroundColor}"` : ''
    const textAlignAttr = textAlignment !== 'left' ? ` align="${textAlignment}"` : ''

    // 将换行符转换为br标签，然后进行HTML清理
    const contentWithBr = textConfig.content.replace(/\n/g, '<br>')
    const sanitizedContent = this.sanitizeHTMLForRakuten(contentWithBr)

    // 根据布局决定图片和文本的顺序
    const isImageTop = layout === 'imageTop'
    const imageRow = `<tr>
<td align="${imageAlignment}">${imgElement}</td>
</tr>`
    const textRow = `<tr>
<td${textAlignAttr}${textBgColorAttr}><font size="${fontSize}" color="${textColor}">${sanitizedContent}</font></td>
</tr>`

    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
${isImageTop ? imageRow : textRow}
${isImageTop ? textRow : imageRow}
</table>`
  }

  /**
   * 生成多列图文模块HTML（标准版本）
   */
  private static generateMultiColumnHTMLStandard(
    module: PageModule,
    layout: string,
    imageConfig: any,
    textConfig: any
  ): string {
    const isHorizontal = layout === 'imageLeft' || layout === 'textLeft'
    const isImageFirst = layout === 'imageLeft' || layout === 'imageTop'

    // 生成图片部分
    const imagePart = this.generateImagePart(imageConfig, isHorizontal)

    // 生成文本部分
    const textPart = this.generateTextPart(textConfig, isHorizontal)

    // 根据布局排列内容
    const parts = isImageFirst ? [imagePart, textPart] : [textPart, imagePart]
    const validParts = parts.filter(part => part.trim() !== '')

    if (validParts.length === 0) {
      return ''
    }

    // 容器样式
    const containerStyles = this.generateInlineStyles({
      display: 'flex',
      'flex-direction': isHorizontal ? 'row' : 'column',
      gap: '16px',
      'align-items': isHorizontal ? 'center' : 'stretch',
      margin: '16px 0'
    })

    // 由于内联样式不支持媒体查询，我们需要生成带有媒体查询的完整样式
    const responsiveStyles = `
      .pm-multi-column {
        display: flex;
        flex-direction: ${isHorizontal ? 'row' : 'column'};
        gap: 16px;
        align-items: ${isHorizontal ? 'center' : 'stretch'};
        margin: 16px 0;
      }
      @media (max-width: 768px) {
        .pm-multi-column {
          flex-direction: column !important;
        }
        .pm-multi-column > * {
          flex: none !important;
          width: 100% !important;
        }
      }
    `

    return `        <style>
${responsiveStyles}
        </style>
        <div class="pm-multi-column">
${validParts.join('\n')}
        </div>`
  }

  /**
   * 生成图片部分HTML
   */
  private static generateImagePart(imageConfig: any, isHorizontal: boolean): string {
    if (!imageConfig.src) {
      return ''
    }

    const imageWidth = this.parseWidth(imageConfig.width, isHorizontal ? '50%' : '100%')
    const imageAlignment = imageConfig.alignment || 'center'

    const imgStyles = this.generateInlineStyles({
      width: imageWidth,
      'max-width': '100%',
      height: 'auto',
      'object-fit': 'cover'
    })

    const containerStyles = this.generateInlineStyles({
      flex: isHorizontal ? '1' : 'none',
      'text-align': imageAlignment
    })

    let imgElement = `<img src="${this.escapeHtml(imageConfig.src)}" alt="${this.escapeHtml(imageConfig.alt || '图片')}" style="${imgStyles}">`

    // 处理图片链接
    if (imageConfig.link && imageConfig.link.value) {
      const href = this.generateLinkHref(imageConfig.link)
      imgElement = `<a href="${this.escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${imgElement}</a>`
    }

    return `            <div class="pm-multi-column-image" style="${containerStyles}">
                ${imgElement}
            </div>`
  }

  /**
   * 生成文本部分HTML
   */
  private static generateTextPart(textConfig: any, isHorizontal: boolean): string {
    if (!textConfig.content) {
      return ''
    }

    // 将换行符转换为br标签，确保换行正确显示
    const processedContent = textConfig.content.replace(/\n/g, '<br>')

    const fontSize = textConfig.fontSize || '4' // 默认size为4

    // 将数字字体大小转换为CSS像素值，与HTML font size标准保持一致
    const getFontSizeInPx = (size: string): string => {
      // 标准HTML font size映射 - 与浏览器默认行为一致
      const sizeMap: Record<string, string> = {
        '1': '12px', // xx-small
        '2': '16px', // small
        '3': '18px', // medium (浏览器默认)
        '4': '24px', // large - 标准大小
        '5': '32px', // x-large
        '6': '48px', // xx-large
        '7': '64px' // xxx-large
      }
      return sizeMap[size] || '18px' // 默认18px对应size 3
    }

    const textStyles = this.generateInlineStyles({
      'font-family': textConfig.font !== 'inherit' ? textConfig.font : undefined,
      'font-size': getFontSizeInPx(fontSize), // 转换为像素值
      color: textConfig.color || '#000000',
      'background-color': textConfig.backgroundColor !== 'transparent' ? textConfig.backgroundColor : undefined,
      'text-align': textConfig.alignment || 'left',
      'line-height': '1.625', // 匹配TextModule的leading-relaxed
      padding: textConfig.backgroundColor !== 'transparent' ? '12px' : undefined,
      'border-radius': textConfig.backgroundColor !== 'transparent' ? '4px' : undefined
    })

    const containerStyles = this.generateInlineStyles({
      flex: isHorizontal ? '1' : 'none'
    })

    return `            <div class="pm-multi-column-text" style="${containerStyles}">
                <div style="${textStyles}">
                    ${processedContent}
                </div>
            </div>`
  }

  /**
   * 生成链接href
   */
  private static generateLinkHref(link: any): string {
    if (!link || !link.value) return ''

    switch (link.type) {
      case 'email':
        return `mailto:${link.value}`
      case 'phone':
        return `tel:${link.value}`
      case 'anchor':
        return `#${link.value}`
      default:
        return link.value
    }
  }

  /**
   * 解析宽度值，确保返回有效的CSS值
   */
  private static parseWidth(width: string | undefined, defaultWidth: string): string {
    if (!width) return defaultWidth

    // 如果已经包含单位，直接返回
    if (width.includes('%') || width.includes('px') || width.includes('em') || width.includes('rem')) {
      return width
    }

    // 如果是纯数字，假设是百分比
    const num = parseFloat(width)
    if (!isNaN(num)) {
      return `${num}%`
    }

    return defaultWidth
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
