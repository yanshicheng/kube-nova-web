/**
 * 路由全局前置守卫模块
 *
 * 提供完整的路由导航守卫功能
 *
 * @module router/guards/beforeEach
 */
import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { nextTick } from 'vue'
import NProgress from 'nprogress'
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user'
import { useMenuStore } from '@/store/modules/menu'
import { setWorktab } from '@/utils/navigation'
import { setPageTitle } from '@/utils/router'
import { RoutesAlias } from '../routesAlias'
import { staticRoutes } from '../routes/staticRoutes'
import { loadingService } from '@/utils/ui'
import { useCommon } from '@/hooks/core/useCommon'
import { useWorktabStore } from '@/store/modules/worktab'
import { getUserInfoApi } from '@/api/portal/user'
import { ApiStatus } from '@/utils/http/status'
import { isHttpError } from '@/utils/http/error'
import { RouteRegistry, MenuProcessor, IframeRouteManager, RoutePermissionValidator } from '../core'

// 错误页面白名单（避免无限重定向）
const ERROR_PAGES = ['/404', '/403', '/500', '/auth/login']

// 公开页面白名单（不需要登录的页面）
const PUBLIC_PAGES = ['/auth/login', '/auth/register', '/auth/forget-password']

// 路由注册器实例
let routeRegistry: RouteRegistry | null = null

// 菜单处理器实例
const menuProcessor = new MenuProcessor()

// 跟踪是否需要关闭 loading
let pendingLoading = false

/**
 * 获取 pendingLoading 状态
 */
export function getPendingLoading(): boolean {
  return pendingLoading
}

/**
 * 重置 pendingLoading 状态
 */
export function resetPendingLoading(): void {
  pendingLoading = false
}

/**
 * 设置路由全局前置守卫
 */
export function setupBeforeEachGuard(router: Router): void {
  // 初始化路由注册器
  routeRegistry = new RouteRegistry(router)

  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      try {
        // 如果是错误页面，直接放行
        if (ERROR_PAGES.includes(to.path)) {
          return next()
        }

        await handleRouteGuard(to, from, next, router)
      } catch (error) {
        console.error('[RouteGuard] ❌ 路由守卫处理失败:', error)
        closeLoading()

        if (ERROR_PAGES.includes(from.path)) {
          console.warn('[RouteGuard] 从错误页面跳转失败，终止导航')
          return next(false)
        }

        next({ name: 'Exception500' })
      }
    }
  )
}

/**
 * 关闭 loading 效果
 */
function closeLoading(): void {
  if (pendingLoading) {
    void nextTick(() => {
      loadingService.hideLoading()
      pendingLoading = false
    })
  }
}

/**
 * 处理路由守卫逻辑
 */
async function handleRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  const settingStore = useSettingStore()
  const userStore = useUserStore()

  // 启动进度条
  if (settingStore.showNprogress) {
    NProgress.start()
  }

  // 1. 检查登录状态
  if (!handleLoginStatus(to, userStore, next)) {
    return
  }

  // 2. 处理动态路由注册
  if (!routeRegistry?.isRegistered() && userStore.isLogin) {
    await handleDynamicRoutes(to, from, next, router)
    return
  }

  // 3. 处理根路径重定向
  if (handleRootPathRedirect(to, next)) {
    return
  }

  // 4. 处理已匹配的路由
  if (to.matched.length > 0) {
    setWorktab(to)
    setPageTitle(to)
    next()
    return
  }

  // 5. 未匹配到路由，跳转到 404
  next({ name: 'Exception404' })
}

/**
 * 处理登录状态
 *
 */
function handleLoginStatus(
  to: RouteLocationNormalized,
  userStore: ReturnType<typeof useUserStore>,
  next: NavigationGuardNext
): boolean {
  if (PUBLIC_PAGES.includes(to.path) || isStaticRoute(to.path)) {
    return true
  }

  if (userStore.isLogin) {
    return true
  }

  console.log('[RouteGuard] 🔒 用户未登录，跳转到登录页')
  next({
    name: 'Login',
    query: { redirect: to.fullPath }
  })
  return false
}

/**
 * 检查路由是否为静态路由
 */
function isStaticRoute(path: string): boolean {
  const checkRoute = (routes: any[], targetPath: string): boolean => {
    return routes.some((route) => {
      const routePath = route.path
      const pattern = routePath.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)

      if (regex.test(targetPath)) {
        return true
      }
      if (route.children && route.children.length > 0) {
        return checkRoute(route.children, targetPath)
      }
      return false
    })
  }

  return checkRoute(staticRoutes, path)
}

/**
 * 处理动态路由注册
 *
 */
async function handleDynamicRoutes(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  pendingLoading = true
  loadingService.showLoading()

  try {
    console.log('[RouteGuard] 🚀 开始注册动态路由...')

    // 1. 获取用户信息（如果失败会抛出错误）
    await fetchUserInfo()

    // 2. 获取菜单数据
    const menuList = await menuProcessor.getMenuList()

    // 3. 验证菜单数据
    if (!menuProcessor.validateMenuList(menuList)) {
      console.warn('[RouteGuard] ⚠️  菜单列表为空')
      routeRegistry?.markAsRegistered()
      closeLoading()

      const { homePath } = useCommon()
      next({
        path: homePath.value || '/',
        replace: true
      })
      return
    }

    // 4. 注册动态路由
    try {
      routeRegistry?.register(menuList)
    } catch (registerError) {
      console.error('[RouteGuard] ❌ 路由注册失败:', registerError)
      routeRegistry?.markAsRegistered()
      console.warn('[RouteGuard] ⚠️  部分路由注册失败，程序将继续运行')
    }

    // 5. 保存菜单数据到 store
    const menuStore = useMenuStore()
    menuStore.setMenuList(menuList)
    menuStore.addRemoveRouteFns(routeRegistry?.getRemoveRouteFns() || [])

    // 6. 保存 iframe 路由
    try {
      IframeRouteManager.getInstance().save()
    } catch (iframeError) {
      console.error('[RouteGuard] ⚠️  保存 iframe 路由失败:', iframeError)
    }

    // 7. 验证工作标签页
    try {
      useWorktabStore().validateWorktabs(router)
    } catch (worktabError) {
      console.error('[RouteGuard] ⚠️  验证工作标签页失败:', worktabError)
    }

    // 8. 验证目标路径权限
    const { homePath } = useCommon()
    const { path: validatedPath, hasPermission } = RoutePermissionValidator.validatePath(
      to.path,
      menuList,
      homePath.value || '/'
    )

    closeLoading()

    // 9. 重新导航到目标路由
    if (!hasPermission) {
      if (to.path !== '/' && to.path !== '') {
        console.warn(`[RouteGuard] 🚫 用户无权限访问路径: ${to.path}`)
      }
      next({
        path: validatedPath,
        replace: true
      })
    } else {
      if (to.path === '/' || to.path === '') {
        next({
          path: validatedPath,
          replace: true
        })
      } else {
        next({
          path: to.path,
          query: to.query,
          hash: to.hash,
          replace: true
        })
      }
    }
  } catch (error) {
    console.error('[RouteGuard] ❌ 动态路由注册失败:', error)

    if (isTokenError(error)) {
      console.log('[RouteGuard] 🔑 Token 错误，终止路由守卫')
      routeRegistry?.markAsRegistered() // 标记已注册，避免再次进入
      closeLoading()
      next(false) // ❌ 终止当前导航，让 HTTP 拦截器处理跳转
      return
    }

    if (isUnauthorizedError(error)) {
      console.log('[RouteGuard] 🔒 401 未授权，终止路由守卫')
      routeRegistry?.markAsRegistered()
      closeLoading()
      next(false) // ❌ 终止当前导航，让 HTTP 拦截器处理跳转
      return
    }

    if (isNotFoundError(error)) {
      console.error('[RouteGuard] 🔍 接口返回 404')
      routeRegistry?.markAsRegistered()
      closeLoading()

      const { homePath } = useCommon()
      next({
        path: homePath.value || '/',
        replace: true
      })
      return
    }

    if (isHttpError(error)) {
      console.error(`[RouteGuard] 🌐 网络错误（${error.code}）: ${error.message}`)
      routeRegistry?.markAsRegistered()
      closeLoading()

      if (ERROR_PAGES.includes(from.path)) {
        console.warn('[RouteGuard] 从错误页面跳转失败，终止导航')
        return next(false)
      }

      const { homePath } = useCommon()
      next({
        path: homePath.value || '/',
        replace: true
      })
      return
    }

    closeLoading()

    if (ERROR_PAGES.includes(from.path)) {
      console.warn('[RouteGuard] 从错误页面跳转失败，终止导航')
      return next(false)
    }

    next({ name: 'Exception500' })
  }
}

/**
 * 获取用户信息
 *
 * ✅ 修复：如果失败，抛出错误让上层处理
 */
async function fetchUserInfo(): Promise<void> {
  const userStore = useUserStore()

  try {
    const data = await getUserInfoApi()

    userStore.setUserInfo({
      userId: data.id,
      userName: data.username,
      nickName: data.nickname,
      avatar: data.avatar,
      email: data.email,
      phone: data.phone
    })

    userStore.checkAndClearWorktabs()
  } catch (error) {
    console.error('[RouteGuard] ⚠️  获取用户信息失败:', error)
    // ✅ 关键修复：抛出错误，让上层的 try-catch 捕获
    throw error
  }
}

/**
 * 重置路由相关状态
 */
export function resetRouterState(delay: number): void {
  setTimeout(() => {
    routeRegistry?.unregister()
    IframeRouteManager.getInstance().clear()

    const menuStore = useMenuStore()
    menuStore.removeAllDynamicRoutes()
    menuStore.setMenuList([])
  }, delay)
}

/**
 * 处理根路径重定向到首页
 */
function handleRootPathRedirect(to: RouteLocationNormalized, next: NavigationGuardNext): boolean {
  if (to.path !== '/') {
    return false
  }

  const { homePath } = useCommon()
  if (homePath.value && homePath.value !== '/') {
    next({ path: homePath.value, replace: true })
    return true
  }

  return false
}

/**
 * 判断是否为 Token 相关错误
 */
function isTokenError(error: unknown): boolean {
  if (!isHttpError(error)) return false

  // Token 相关错误码：100091-100098, 100002
  const tokenErrorCodes = [100091, 100092, 100093, 100094, 100095, 100096, 100097, 100098, 100002]
  return tokenErrorCodes.includes(error.code)
}

/**
 * 判断是否为未授权错误（401）
 */
function isUnauthorizedError(error: unknown): boolean {
  return isHttpError(error) && error.code === ApiStatus.unauthorized
}

/**
 * 判断是否为 404 错误
 */
function isNotFoundError(error: unknown): boolean {
  return isHttpError(error) && error.code === 404
}
