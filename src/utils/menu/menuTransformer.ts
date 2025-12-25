/**
 * 菜单数据转换工具
 *
 * 负责将后端菜单数据转换为前端路由格式
 *
 * @module utils/menu/menuTransformer
 * @author Kube Nova Team
 */

import type { AppRouteRecord } from '@/types/router'
import type { MenuSysMenuTree } from '@/api/portal/menu'

/**
 * 菜单类型枚举
 */
enum MenuType {
  DIRECTORY = 1, // 目录
  MENU = 2, // 菜单
  BUTTON = 3 // 按钮
}

/**
 * 将后端菜单树转换为前端路由格式
 * @param menuTree 后端菜单树
 * @returns 前端路由配置
 */
export function transformMenuToRoute(menuTree: MenuSysMenuTree[]): AppRouteRecord[] {
  return menuTree
    .filter((menu) => menu.menuType !== MenuType.BUTTON) // 过滤掉按钮类型
    .map((menu) => transformMenuItem(menu))
}

/**
 * 转换单个菜单项
 * @param menu 后端菜单项
 * @returns 前端路由配置
 */
function transformMenuItem(menu: MenuSysMenuTree): AppRouteRecord {
  // 处理权限按钮列表
  const authList = extractAuthList(menu)

  // 递归处理子菜单
  let children: AppRouteRecord[] | undefined
  if (menu.children && menu.children.length > 0) {
    const childMenus = menu.children.filter((child) => child.menuType !== MenuType.BUTTON)
    if (childMenus.length > 0) {
      children = childMenus.map((child) => transformMenuItem(child))
    }
  }

  // 基础路由配置 - 一次性创建完整对象
  const route: AppRouteRecord = {
    path: menu.path || '',
    name: menu.name || '',
    component: menu.component || '',
    redirect: menu.redirect || undefined,
    // meta 信息
    meta: {
      title: menu.title,
      icon: menu.icon || undefined,
      isHide: menu.isHide === 1,
      keepAlive: menu.keepAlive === 1,
      link: menu.link || undefined,
      isIframe: menu.isIframe === 1,
      isHideTab: menu.isHideTab === 1,
      showBadge: menu.showBadge === 1,
      showTextBadge: menu.showTextBadge || undefined,
      isFirstLevel: menu.isFirstLevel === 1,
      fixedTab: menu.fixedTab === 1,
      isFullPage: menu.isFullPage === 1,
      activePath: menu.activePath || undefined,
      roles: parseRoles(menu.roles),
      // 只在有权限按钮时添加 authList
      ...(authList.length > 0 ? { authList } : {})
    }
  }

  // 只在有子路由时添加 children
  if (children) {
    route.children = children
  }

  return route
}

/**
 * 解析角色权限
 * @param rolesStr 角色权限JSON字符串
 * @returns 角色数组
 */
function parseRoles(rolesStr: string): string[] | undefined {
  if (!rolesStr || rolesStr.trim() === '') {
    return undefined
  }

  try {
    const roles = JSON.parse(rolesStr)
    return Array.isArray(roles) ? roles : undefined
  } catch (error) {
    console.warn('[MenuTransformer] 解析角色权限失败:', rolesStr, error)
    return undefined
  }
}

/**
 * 提取权限按钮列表
 * @param menu 菜单项
 * @returns 权限按钮列表
 */
function extractAuthList(menu: MenuSysMenuTree): Array<{ title: string; authMark: string }> {
  const authList: Array<{ title: string; authMark: string }> = []

  // 从子节点中提取按钮类型的权限
  if (menu.children && menu.children.length > 0) {
    const buttons = menu.children.filter((child) => child.menuType === MenuType.BUTTON)

    buttons.forEach((button) => {
      if (button.authName && button.authLabel) {
        authList.push({
          title: button.authName,
          authMark: button.authLabel
        })
      }
    })

    // 按排序字段排序
    authList.sort((a, b) => {
      const btnA = buttons.find((btn) => btn.authLabel === a.authMark)
      const btnB = buttons.find((btn) => btn.authLabel === b.authMark)
      return (btnA?.authSort || 0) - (btnB?.authSort || 0)
    })
  }

  return authList
}

/**
 * 验证菜单数据有效性
 * @param menuTree 菜单树
 * @returns 是否有效
 */
export function validateMenuData(menuTree: MenuSysMenuTree[]): boolean {
  if (!Array.isArray(menuTree)) {
    console.error('[MenuTransformer] 菜单数据不是数组:', menuTree)
    return false
  }

  return menuTree.length > 0
}
