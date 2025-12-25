import type { MenuAddRequest, MenuUpdateRequest } from '@/api/portal/menu'

/**
 * 菜单表单数据接口（前端使用）
 */
export interface MenuFormData {
  id: number
  parentId: number
  menuType: number
  name: string
  path: string
  label: string
  component: string
  redirect: string
  title: string
  icon: string
  sort: number
  link: string
  isEnable: boolean
  isMenu: boolean
  keepAlive: boolean
  isHide: boolean
  isHideTab: boolean
  isIframe: boolean
  showBadge: boolean
  showTextBadge: string
  isFirstLevel: boolean
  fixedTab: boolean
  isFullPage: boolean
  activePath: string
  roles: string[]
  authName: string
  authLabel: string
  authIcon: string
  authSort: number
  status: number
}

/**
 * 转换菜单表单数据为 API 请求格式
 * 将布尔值转换为数字（0/1），将数组转换为字符串
 */
export function convertMenuFormToApi(
  formData: MenuFormData
): MenuAddRequest | MenuUpdateRequest {
  const apiData: any = {
    ...formData,
    // 布尔值转换为数字
    isEnable: formData.isEnable ? 1 : 0,
    isMenu: formData.isMenu ? 1 : 0,
    keepAlive: formData.keepAlive ? 1 : 0,
    isHide: formData.isHide ? 1 : 0,
    isHideTab: formData.isHideTab ? 1 : 0,
    isIframe: formData.isIframe ? 1 : 0,
    showBadge: formData.showBadge ? 1 : 0,
    isFirstLevel: formData.isFirstLevel ? 1 : 0,
    fixedTab: formData.fixedTab ? 1 : 0,
    isFullPage: formData.isFullPage ? 1 : 0,
    // 数组转换为逗号分隔的字符串
    roles: Array.isArray(formData.roles) ? formData.roles.join(',') : formData.roles || ''
  }

  return apiData
}

/**
 * 转换 API 响应数据为表单格式
 * 将数字转换为布尔值（0/1 -> false/true），将字符串转换为数组
 */
export function convertMenuApiToForm(apiData: any): MenuFormData {
  return {
    id: apiData.id || 0,
    parentId: apiData.parentId || 0,
    menuType: apiData.menuType || 2,
    name: apiData.name || '',
    path: apiData.path || '',
    label: apiData.label || '',
    component: apiData.component || '',
    redirect: apiData.redirect || '',
    title: apiData.title || '',
    icon: apiData.icon || '',
    sort: apiData.sort || 0,
    link: apiData.link || '',
    // 数字转换为布尔值
    isEnable: apiData.isEnable === 1,
    isMenu: apiData.isMenu === 1,
    keepAlive: apiData.keepAlive === 1,
    isHide: apiData.isHide === 1,
    isHideTab: apiData.isHideTab === 1,
    isIframe: apiData.isIframe === 1,
    showBadge: apiData.showBadge === 1,
    isFirstLevel: apiData.isFirstLevel === 1,
    fixedTab: apiData.fixedTab === 1,
    isFullPage: apiData.isFullPage === 1,
    showTextBadge: apiData.showTextBadge || '',
    activePath: apiData.activePath || '',
    // 字符串转换为数组
    roles: apiData.roles ? apiData.roles.split(',').filter((r: string) => r.trim()) : [],
    authName: apiData.authName || '',
    authLabel: apiData.authLabel || '',
    authIcon: apiData.authIcon || '',
    authSort: apiData.authSort || 0,
    status: apiData.status !== undefined ? apiData.status : 1
  }
}