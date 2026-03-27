export const BRAND_NAME = 'UO-PageMaker'
export const BRAND_LOGO_SRC = '/logo.png'
export const BRAND_LOGO_ALT = `${BRAND_NAME} logo`
export const BRAND_METADATA_DESCRIPTION = `${BRAND_NAME} content management system for creating and managing web pages`
export const BRAND_LOGIN_DESCRIPTION = `欢迎回到 ${BRAND_NAME}`
export const BRAND_DASHBOARD_DESCRIPTION = `欢迎使用 ${BRAND_NAME}，这里是您的内容管理中心`
export const BRAND_COMPATIBILITY_DESCRIPTION = `检测您的浏览器是否支持 ${BRAND_NAME} 编辑器的所有功能`
export const BRAND_EXPORT_TITLE = `${BRAND_NAME} 导出页面`

export function getBrandPageDescription(title: string) {
  return `使用 ${BRAND_NAME} 创建的页面：${title}`
}
