/**
 * 菜单处理器
 *
 * 负责菜单数据的获取、过滤和处理
 *
 * @module router/core/MenuProcessor
 * @author Kube Nova Team
 */

import type { AppRouteRecord } from '@/types/router'
import { useUserStore } from '@/store/modules/user'
import { useAppMode } from '@/hooks/core/useAppMode'
import { fetchGetMenuList } from '@/api/system-manage'
import { asyncRoutes } from '../routes/asyncRoutes'
import { RoutesAlias } from '../routesAlias'

export class MenuProcessor {
  /**
   * 获取菜单数据
   */
  async getMenuList(): Promise<AppRouteRecord[]> {
    const { isFrontendMode } = useAppMode()

    let menuList: AppRouteRecord[]
    if (isFrontendMode.value) {
      menuList = await this.processFrontendMenu()
    } else {
      menuList = await this.processBackendMenu()
    }

    // 🔥 直接规范化路径，不再验证（自动修正）
    return this.normalizeMenuPaths(menuList)
  }

  /**
   * 处理前端控制模式的菜单
   */
  private async processFrontendMenu(): Promise<AppRouteRecord[]> {
    const userStore = useUserStore()
    const roles = userStore.info?.roles

    let menuList = [...asyncRoutes]

    // 根据角色过滤菜单
    if (roles && roles.length > 0) {
      menuList = this.filterMenuByRoles(menuList, roles)
    }

    return this.filterEmptyMenus(menuList)
  }

  /**
   * 处理后端控制模式的菜单
   */
  private async processBackendMenu(): Promise<AppRouteRecord[]> {
    const list = await fetchGetMenuList()
    return this.filterEmptyMenus(list)
  }

  /**
   * 根据角色过滤菜单
   */
  private filterMenuByRoles(menu: AppRouteRecord[], roles: string[]): AppRouteRecord[] {
    return menu.reduce((acc: AppRouteRecord[], item) => {
      const itemRoles = item.meta?.roles
      const hasPermission = !itemRoles || itemRoles.some((role) => roles?.includes(role))

      if (hasPermission) {
        const filteredItem = { ...item }
        if (filteredItem.children?.length) {
          filteredItem.children = this.filterMenuByRoles(filteredItem.children, roles)
        }
        acc.push(filteredItem)
      }

      return acc
    }, [])
  }

  /**
   * 递归过滤空菜单项
   */
  private filterEmptyMenus(menuList: AppRouteRecord[]): AppRouteRecord[] {
    return menuList
      .map((item) => {
        // 如果有子菜单，先递归过滤子菜单
        if (item.children && item.children.length > 0) {
          const filteredChildren = this.filterEmptyMenus(item.children)
          return {
            ...item,
            children: filteredChildren
          }
        }
        return item
      })
      .filter((item) => {
        // 如果定义了 children 属性（即使是空数组），说明这是一个目录菜单，应该保留
        if ('children' in item) {
          return true
        }

        // 如果有外链或 iframe，保留
        if (item.meta?.isIframe === true || item.meta?.link) {
          return true
        }

        // 如果有有效的 component，保留
        if (item.component && item.component !== '' && item.component !== RoutesAlias.Layout) {
          return true
        }

        // 其他情况过滤掉
        return false
      })
  }

  /**
   * 验证菜单列表是否有效
   */
  validateMenuList(menuList: AppRouteRecord[]): boolean {
    return Array.isArray(menuList) && menuList.length > 0
  }

  /**
   * 规范化菜单路径（智能修正路径格式）
   *
   * 规则：
   * 1. 一级菜单：必须以 / 开头（如果没有则自动添加）
   * 2. 子菜单：不能以 / 开头（如果有则自动去除）
   * 3. 外部链接和 iframe：保持原样
   */
  private normalizeMenuPaths(
    menuList: AppRouteRecord[],
    parentPath = '',
    level = 1
  ): AppRouteRecord[] {
    return menuList.map((item) => {
      const originalPath = item.path || ''

      // 构建完整路径（自动修正格式）
      const fullPath = this.buildFullPath(originalPath, parentPath, level)

      // 递归处理子菜单
      const children = item.children?.length
        ? this.normalizeMenuPaths(item.children, fullPath, level + 1)
        : item.children

      return {
        ...item,
        path: fullPath,
        children
      }
    })
  }

  /**
   * 判断是否为外部链接或特殊路径
   */
  private isExternalOrSpecialPath(path: string): boolean {
    return (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('/outside/iframe/')
    )
  }

  /**
   * 构建完整路径（智能修正）
   *
   * @param path 原始路径
   * @param parentPath 父级路径
   * @param level 菜单层级（1表示顶级菜单）
   */
  private buildFullPath(path: string, parentPath: string, level: number): string {
    if (!path) return ''

    // 外部链接和特殊路径直接返回
    if (this.isExternalOrSpecialPath(path)) {
      return path
    }

    // 🔥 一级菜单处理
    if (level === 1) {
      // 一级菜单必须以 / 开头
      if (!path.startsWith('/')) {
        const correctedPath = `/${path}`
        return correctedPath
      }
      return path
    }

    // 🔥 子菜单处理（level > 1）
    // 如果子菜单以 / 开头，说明后端配置错误，需要去掉 /
    if (path.startsWith('/')) {
      const correctedPath = path.slice(1) // 去掉开头的 /
      path = correctedPath
    }

    // 拼接父路径和当前路径
    if (parentPath) {
      const cleanParent = parentPath.replace(/\/$/, '') // 移除父路径末尾的斜杠
      const cleanChild = path.replace(/^\//, '') // 移除子路径开头的斜杠
      return `${cleanParent}/${cleanChild}`
    }

    // 没有父路径但不是一级菜单（理论上不应该发生）
    return `/${path}`
  }
}
