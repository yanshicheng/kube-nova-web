/**
 * 用户状态管理模块
 *
 * 提供用户相关的状态管理
 *
 * @module store/modules/user
 */
import { logoutApi } from '@/api/portal/auth'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LanguageEnum } from '@/enums/appEnum'
import { router } from '@/router'
import { useSettingStore } from './setting'
import { useWorktabStore } from './worktab'
import { AppRouteRecord } from '@/types/router'
import { setPageTitle } from '@/utils/router'
import { resetRouterState } from '@/router/guards/beforeEach'
import { useMenuStore } from './menu'
import { StorageConfig } from '@/utils/storage/storage-config'
import { useProjectStore } from '@/store/modules/project.ts'

/**
 * 用户信息接口 - 匹配后端返回的格式
 */
export interface UserInfo {
  userId?: number
  userName?: string
  nickName?: string
  avatar?: string
  email?: string
  phone?: string
  roles?: string[]
  permissions?: string[]
}

/**
 * 清理所有页面的 localStorage 缓存数据
 * 包括：集群选择、工作空间选择、应用选择、标签页状态等
 */
function clearAllPageStorage(): void {
  // 清理项目 store 的数据
  useProjectStore().clearAllStoredData()

  // 定义所有需要清理的 localStorage 键
  const storageKeys = [
    // 集群资源管理页面
    'cluster-resource-selected-cluster',
    'cluster-resource-active-tab',

    // 应用管理页面
    'app-mgmt-selected-cluster',
    'app-mgmt-selected-workspace',
    'app-mgmt-selected-application',
    'app-mgmt-resource-type',
    'app-mgmt-active-tab',
    'app-mgmt-show-tree',

    // 核心配置页面
    'core-config-selected-cluster',
    'core-config-selected-workspace',
    'core-config-active-tab',

    // Job 管理页面
    'job-manager-selected-cluster',
    'job-manager-selected-workspace',

    // Pod 管理页面
    'pod-manager-selected-cluster',
    'pod-manager-selected-workspace',

    // 工作空间管理页面
    'workspace-management-selected-cluster',

    // 业务数据缓存
    'probe-selected-cluster',
    'prometheusrule-selected-cluster',
    'last_unread_count',
    'unread_alert_viewed',
    'project_resource_pool_selected_project_id',
    'repositories-view-mode',
    'project_resource_pool_view_mode',
    'kube_nova_demo_dialog_shown'
  ]

  // 批量清理所有存储键
  storageKeys.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      // 静默处理错误
    }
  })

  // 清理动态键（模式匹配）
  const allKeys = Object.keys(localStorage)
  allKeys.forEach((key) => {
    try {
      // 清理应用管理页面的动态状态
      if (key.startsWith('art-app-management-')) {
        localStorage.removeItem(key)
      }
    } catch (error) {
      // 静默处理错误
    }
  })
}

/**
 * 用户状态管理
 */
export const useUserStore = defineStore(
  'userStore',
  () => {
    // 语言设置
    const language = ref(LanguageEnum.ZH)
    // 登录状态
    const isLogin = ref(false)
    // 锁屏状态
    const isLock = ref(false)
    // 锁屏密码
    const lockPassword = ref('')
    // 用户信息
    const info = ref<Partial<UserInfo>>({})
    // 搜索历史记录
    const searchHistory = ref<AppRouteRecord[]>([])
    // 访问令牌
    const accessToken = ref('')
    // 刷新令牌
    const refreshToken = ref('')

    // 计算属性：获取用户信息
    const getUserInfo = computed(() => info.value)
    // 计算属性：获取设置状态
    const getSettingState = computed(() => useSettingStore().$state)
    // 计算属性：获取工作台状态
    const getWorktabState = computed(() => useWorktabStore().$state)

    /**
     * 设置用户信息（合并更新模式，支持 roles 去重）
     * @param newInfo 新的用户信息
     */
    const setUserInfo = (newInfo: Partial<UserInfo>): void => {
      try {
        if (!newInfo || typeof newInfo !== 'object') {
          console.warn('[UserStore] setUserInfo 接收到无效的 newInfo:', newInfo)
          return
        }

        if (info.value === null || info.value === undefined) {
          console.warn('[UserStore] info.value 是 null，重置为空对象')
          info.value = {}
        }

        const filteredNewInfo: Partial<UserInfo> = {}
        for (const [key, value] of Object.entries(newInfo)) {
          if (value !== null && value !== undefined) {
            filteredNewInfo[key as keyof UserInfo] = value
          }
        }

        let mergedRoles: string[] = []

        const existingRoles = Array.isArray(info.value?.roles)
          ? info.value.roles
          : info.value?.roles
            ? [info.value.roles]
            : []

        const newRoles = Array.isArray(filteredNewInfo?.roles)
          ? filteredNewInfo.roles
          : filteredNewInfo?.roles
            ? [filteredNewInfo.roles]
            : []

        // 合并并去重
        if (existingRoles.length > 0 || newRoles.length > 0) {
          mergedRoles = Array.from(new Set([...existingRoles, ...newRoles]))
        }

        info.value = {
          ...(info.value || {}), // 防御 info.value 为 null
          ...filteredNewInfo,
          // 只有当有 roles 数据时才覆盖
          ...(mergedRoles.length > 0 ? { roles: mergedRoles } : {})
        }
      } catch (error) {
        console.error('[UserStore] ❌ setUserInfo 执行出错:', error)
        // 出错时至少确保 info.value 不是 null
        if (!info.value) {
          info.value = {}
        }
      }
    }

    /**
     * 设置登录状态
     * @param status 登录状态
     */
    const setLoginStatus = (status: boolean): void => {
      isLogin.value = status
    }

    /**
     * 设置语言
     * @param lang 语言枚举值
     */
    const setLanguage = (lang: LanguageEnum): void => {
      setPageTitle(router.currentRoute.value)
      language.value = lang
    }

    /**
     * 设置搜索历史
     * @param list 搜索历史列表
     */
    const setSearchHistory = (list: AppRouteRecord[]): void => {
      searchHistory.value = list
    }

    /**
     * 设置锁屏状态
     * @param status 锁屏状态
     */
    const setLockStatus = (status: boolean): void => {
      isLock.value = status
    }

    /**
     * 设置锁屏密码
     * @param password 锁屏密码
     */
    const setLockPassword = (password: string): void => {
      lockPassword.value = password
    }

    /**
     * 设置令牌
     * @param newAccessToken 访问令牌
     * @param newRefreshToken 刷新令牌（可选）
     */
    const setToken = (newAccessToken: string, newRefreshToken?: string): void => {
      accessToken.value = newAccessToken
      if (newRefreshToken) {
        refreshToken.value = newRefreshToken
      }
    }

    /**
     * 退出登录
     * 清空所有用户相关状态并跳转到登录页
     */
    const logOut = async (): void => {
      // 保存当前用户 ID，用于下次登录时判断是否为同一用户
      const currentUserId = info.value.userId
      if (currentUserId) {
        localStorage.setItem(StorageConfig.LAST_USER_ID_KEY, String(currentUserId))
      }

      // 调用后端退出接口
      try {
        await logoutApi({
          username: info.value.userName,
          uuid: (info.value as any).uuid
        })
      } catch (error) {
        // 静默处理错误
      }

      // 清理 Worktab Store
      const worktabStore = useWorktabStore()
      worktabStore.opened = []
      worktabStore.current = {}
      worktabStore.keepAliveExclude = []

      // 清空用户信息
      info.value = {}
      // 重置登录状态
      isLogin.value = false
      // 重置锁屏状态
      isLock.value = false
      // 清空锁屏密码
      lockPassword.value = ''
      // 清空访问令牌
      accessToken.value = ''
      // 清空刷新令牌
      refreshToken.value = ''
      // 移除 iframe 路由缓存
      sessionStorage.removeItem('iframeRoutes')
      // 清空主页路径
      useMenuStore().setHomePath('')
      // 清理所有页面缓存
      clearAllPageStorage()
      // 重置路由状态
      resetRouterState(500)
      // 跳转到登录页
      // const currentRoute = router.currentRoute.value
      // const redirect = currentRoute.path !== '/login' ? currentRoute.fullPath : undefined
      void router.push({
        name: 'Login'
        // query: redirect ? { redirect } : undefined
      })
    }

    /**
     * 检查并清理工作台标签页
     * 如果不是同一用户登录，清空工作台标签页
     */
    const checkAndClearWorktabs = (): void => {
      const lastUserId = localStorage.getItem(StorageConfig.LAST_USER_ID_KEY)
      const currentUserId = info.value.userId

      // 无法获取当前用户 ID，跳过检查
      if (!currentUserId) return

      // 首次登录或缓存已清除，保留现有标签页
      if (!lastUserId) {
        return
      }

      // 不同用户登录，清空工作台标签页
      if (String(currentUserId) !== lastUserId) {
        const worktabStore = useWorktabStore()
        worktabStore.opened = []
        worktabStore.keepAliveExclude = []
      }

      // 清除临时存储
      localStorage.removeItem(StorageConfig.LAST_USER_ID_KEY)
    }

    return {
      language,
      isLogin,
      isLock,
      lockPassword,
      info,
      searchHistory,
      accessToken,
      refreshToken,
      getUserInfo,
      getSettingState,
      getWorktabState,
      setUserInfo,
      setLoginStatus,
      setLanguage,
      setSearchHistory,
      setLockStatus,
      setLockPassword,
      setToken,
      logOut,
      checkAndClearWorktabs
    }
  },
  {
    persist: {
      key: 'user',
      storage: localStorage
    }
  }
)
