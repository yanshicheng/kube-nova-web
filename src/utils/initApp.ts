// src/utils/initApp.ts
import { useUserStore } from '@/store/modules/user'
import { useMenuStore } from '@/store/modules/menu'
import { useSettingStore } from '@/store/modules/setting'

/**
 * 应用初始化
 * 在 main.ts 中调用，用于恢复用户状态和系统设置
 */
export async function initApp(): Promise<void> {
  console.log('[应用初始化] 开始初始化...')

  try {
    // 1. 初始化系统设置
    const settingStore = useSettingStore()
    // 如果有需要从 localStorage 恢复的设置，在这里处理

    // 2. 初始化用户状态
    const userStore = useUserStore()
    const isLoggedIn = userStore.initUserState()

    if (isLoggedIn) {
      console.log('[应用初始化] 用户已登录，恢复状态')

      // 3. 尝试加载菜单缓存
      const menuStore = useMenuStore()
      const menuLoaded = menuStore.loadMenuFromCache()

      if (menuLoaded) {
        console.log('[应用初始化] 菜单缓存加载成功')
      }

      // 4. 检查用户信息是否需要更新
      if (userStore.shouldUpdateUserInfo()) {
        console.log('[应用初始化] 后台更新用户信息...')
        // 静默更新，不阻塞应用启动
        userStore.fetchUserInfo(true).catch((error) => {
          console.warn('[应用初始化] 更新用户信息失败:', error)
        })
      }

      // 5. 检查菜单是否需要更新
      if (menuStore.shouldUpdateMenu()) {
        console.log('[应用初始化] 后台更新菜单数据...')
        // 静默更新，不阻塞应用启动
        // 这将在路由守卫中处理
      }
    } else {
      console.log('[应用初始化] 用户未登录')
    }

    console.log('[应用初始化] 初始化完成')
  } catch (error) {
    console.error('[应用初始化] 初始化失败:', error)
    // 初始化失败不应该阻止应用启动
  }
}

/**
 * 清理应用状态
 * 在登出或需要重置应用时调用
 */
export function cleanupApp(): void {
  console.log('[应用清理] 开始清理应用状态...')

  const userStore = useUserStore()
  const menuStore = useMenuStore()

  // 清除用户状态
  userStore.clearUserState()

  // 清除菜单缓存
  menuStore.clearMenuCache()
  menuStore.setMenuList([])

  // 清除其他缓存数据
  // sessionStorage.clear() // 谨慎使用，可能清除其他模块的数据

  console.log('[应用清理] 清理完成')
}