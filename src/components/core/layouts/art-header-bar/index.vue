<template>
  <div
    class="header-bar-container w-full bg-[var(--default-bg-color)]"
    :class="[
      tabStyle === 'tab-card' || tabStyle === 'tab-google' ? 'mb-5 max-sm:mb-3 !bg-box' : ''
    ]"
  >
    <div
      class="relative box-border flex-b h-15 leading-15 select-none"
      :class="[
        tabStyle === 'tab-card' || tabStyle === 'tab-google'
          ? 'border-b border-[var(--art-card-border)]'
          : ''
      ]"
    >
      <div class="flex-c flex-1 min-w-0 leading-15" style="display: flex">
        <!-- 系统信息 -->
        <div class="flex-c c-p" @click="toHome" v-if="isTopMenu">
          <ArtLogo class="pl-4.5" />
          <p v-if="width >= 1400" class="my-0 mx-2 ml-2 text-lg">{{ AppConfig.systemInfo.name }}</p>
        </div>

        <ArtLogo
          class="!hidden pl-3.5 overflow-hidden align-[-0.15em] fill-current"
          @click="toHome"
        />

        <!-- 菜单按钮 -->
        <ArtIconButton
          v-if="isLeftMenu && shouldShowMenuButton"
          icon="ri:menu-2-fill"
          class="ml-3 max-sm:ml-[7px]"
          @click="visibleMenu"
        />

        <!-- 刷新按钮 -->
        <ArtIconButton
          v-if="shouldShowRefreshButton"
          icon="ri:refresh-line"
          class="!ml-3 refresh-btn max-sm:!hidden"
          :style="{ marginLeft: !isLeftMenu ? '10px' : '0' }"
          @click="reload"
        />

        <!-- 面包屑 -->
        <ArtBreadcrumb
          v-if="(shouldShowBreadcrumb && isLeftMenu) || (shouldShowBreadcrumb && isDualMenu)"
        />

        <!-- 顶部菜单 -->
        <ArtHorizontalMenu v-if="isTopMenu" :list="menuList" />

        <!-- 混合菜单-顶部 -->
        <ArtMixedMenu v-if="isTopLeftMenu" :list="menuList" />
      </div>

      <div class="flex-c gap-2.5">
        <ArtProjectSelector v-if="shouldShowGlobalSearch" />

        <!-- 全屏按钮 -->
        <ArtIconButton
          v-if="shouldShowFullscreen"
          :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-fill'"
          :class="[!isFullscreen ? 'full-screen-btn' : 'exit-full-screen-btn', 'ml-3']"
          class="max-md:!hidden"
          @click="toggleFullScreen"
        />

        <!-- 通知按钮 -->
        <div v-if="shouldShowNotification" class="relative">
          <ElBadge :value="unreadCount" :max="99" :hidden="unreadCount === 0" type="danger">
            <ArtIconButton
              icon="ri:notification-2-line"
              class="notice-button"
              @click="visibleNotice"
            >
              <!-- 未读消息脉动提示点 -->
              <div
                v-if="hasUnreadAlert"
                class="breathing-dot absolute top-2 right-2 size-1.5 !bg-danger rounded-full"
              ></div>
            </ArtIconButton>
          </ElBadge>
        </div>

        <!-- 设置按钮 -->
        <ArtIconButton
          v-if="shouldShowSettings"
          icon="ri:settings-line"
          class="setting-btn"
          @click="openSetting"
        />

        <!-- 用户头像、菜单 -->
        <ArtUserMenu />
      </div>
    </div>

    <!-- 标签页 -->
    <ArtWorkTab />

    <!-- 通知面板 - 使用 Teleport 传送到 body，避免被其他元素遮挡 -->
    <Teleport to="body">
      <ArtNotification
        v-model:value="showNotice"
        ref="noticeRef"
        @unread-count-change="handleUnreadCountChange"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { useFullscreen, useWindowSize } from '@vueuse/core'
  import { LanguageEnum, MenuTypeEnum } from '@/enums/appEnum'
  import { useSettingStore } from '@/store/modules/setting'
  import { useUserStore } from '@/store/modules/user'
  import { useMenuStore } from '@/store/modules/menu'
  import AppConfig from '@/config'
  import ArtProjectSelector from '@/components/core/project-selector/index.vue'

  import { mittBus } from '@/utils/sys'
  import { useCommon } from '@/hooks/core/useCommon'
  import { useHeaderBar } from '@/hooks/core/useHeaderBar'
  import ArtUserMenu from './widget/ArtUserMenu.vue'
  import { getUnreadCountApi } from '@/api/portal/site-messages'

  defineOptions({ name: 'ArtHeaderBar' })


  const router = useRouter()
  const { locale } = useI18n()
  const { width } = useWindowSize()

  const settingStore = useSettingStore()
  const userStore = useUserStore()
  const menuStore = useMenuStore()

  // 顶部栏功能配置
  const {
    shouldShowMenuButton,
    shouldShowRefreshButton,
    shouldShowBreadcrumb,
    shouldShowGlobalSearch,
    shouldShowFullscreen,
    shouldShowNotification,
    shouldShowSettings,
    fastEnterMinWidth: headerBarFastEnterMinWidth
  } = useHeaderBar()

  const { menuOpen, systemThemeColor, showSettingGuide, menuType, isDark, tabStyle } =
    storeToRefs(settingStore)

  const { language } = storeToRefs(userStore)
  const { menuList } = storeToRefs(menuStore)

  const showNotice = ref(false)
  const noticeRef = ref(null)
  const unreadCount = ref(0)
  const hasUnreadAlert = ref(false)

  // 菜单类型判断
  const isLeftMenu = computed(() => menuType.value === MenuTypeEnum.LEFT)
  const isDualMenu = computed(() => menuType.value === MenuTypeEnum.DUAL_MENU)
  const isTopMenu = computed(() => menuType.value === MenuTypeEnum.TOP)
  const isTopLeftMenu = computed(() => menuType.value === MenuTypeEnum.TOP_LEFT)

  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()

  onMounted(() => {
    initLanguage()
    document.addEventListener('click', bodyCloseNotice)
    initUnreadCount()
  })

  onUnmounted(() => {
    document.removeEventListener('click', bodyCloseNotice)
  })

  // 初始化未读数量
  const initUnreadCount = async () => {
    try {
      const res = await getUnreadCountApi()
      unreadCount.value = res.count || 0
      if (unreadCount.value > 0) {
        hasUnreadAlert.value = true
      }
    } catch (error) {
      console.error('[顶部栏] 获取未读消息数量失败:', error)
    }
  }

  // 处理未读数量变化
  const handleUnreadCountChange = (count: number) => {
    const oldCount = unreadCount.value
    unreadCount.value = count

    if (oldCount > 0 && count === 0) {
      hasUnreadAlert.value = false
    } else if (count > 0) {
      hasUnreadAlert.value = true
    }
  }

  // 切换全屏状态
  const toggleFullScreen = (): void => {
    toggleFullscreen()
  }

  // 切换菜单显示/隐藏状态
  const visibleMenu = (): void => {
    settingStore.setMenuOpen(!menuOpen.value)
  }

  const { homePath } = useCommon()
  const { refresh } = useCommon()

  // 跳转到首页
  const toHome = (): void => {
    router.push(homePath.value)
  }

  // 刷新页面
  const reload = (time: number = 0): void => {
    setTimeout(() => {
      refresh()
    }, time)
  }

  // 初始化语言设置
  const initLanguage = (): void => {
    locale.value = language.value
  }

  // 切换系统语言
  const changeLanguage = (lang: LanguageEnum): void => {
    if (locale.value === lang) return
    locale.value = lang
    userStore.setLanguage(lang)
    reload(50)
  }

  // 打开设置面板
  const openSetting = (): void => {
    mittBus.emit('openSetting')
    if (showSettingGuide.value) {
      settingStore.hideSettingGuide()
    }
  }

  // 打开全局搜索对话框
  const openSearchDialog = (): void => {
    mittBus.emit('openSearchDialog')
  }

  // 点击页面其他区域关闭通知面板
  const bodyCloseNotice = (e: any): void => {
    if (!showNotice.value) return

    const target = e.target as HTMLElement
    const isNoticeButton = target.closest('.notice-button')
    const isNoticePanel = target.closest('.notification-panel')

    if (!isNoticeButton && !isNoticePanel) {
      showNotice.value = false
    }
  }

  // 切换通知面板显示状态
  const visibleNotice = (): void => {
    showNotice.value = !showNotice.value
    if (showNotice.value && hasUnreadAlert.value) {
      hasUnreadAlert.value = false
    }
  }

  // 打开聊天窗口
  const openChat = (): void => {
    mittBus.emit('openChat')
  }
</script>

<style lang="scss" scoped>
  /* 顶部栏容器 */
  .header-bar-container {
    position: relative;
    z-index: 100;
  }

  /* 按钮动画 */
  @keyframes rotate180 {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(180deg);
    }
  }

  @keyframes shake {
    0% {
      transform: rotate(0);
    }
    25% {
      transform: rotate(-5deg);
    }
    50% {
      transform: rotate(5deg);
    }
    75% {
      transform: rotate(-5deg);
    }
    100% {
      transform: rotate(0);
    }
  }

  @keyframes expand {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes shrink {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes moveUp {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-3px);
    }
    100% {
      transform: translateY(0);
    }
  }

  @keyframes breathing {
    0% {
      opacity: 0.4;
      transform: scale(0.9);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
    100% {
      opacity: 0.4;
      transform: scale(0.9);
    }
  }

  /* 按钮悬停动画 */
  .refresh-btn:hover :deep(.art-svg-icon) {
    animation: rotate180 0.5s;
  }

  .language-btn:hover :deep(.art-svg-icon) {
    animation: moveUp 0.4s;
  }

  .setting-btn:hover :deep(.art-svg-icon) {
    animation: rotate180 0.5s;
  }

  .full-screen-btn:hover :deep(.art-svg-icon) {
    animation: expand 0.6s forwards;
  }

  .exit-full-screen-btn:hover :deep(.art-svg-icon) {
    animation: shrink 0.6s forwards;
  }

  .notice-button:hover :deep(.art-svg-icon) {
    animation: shake 0.5s ease-in-out;
  }

  .chat-button:hover :deep(.art-svg-icon) {
    animation: shake 0.5s ease-in-out;
  }

  /* 未读消息呼吸动画 */
  .breathing-dot {
    animation: breathing 1.5s ease-in-out infinite;
  }

  /* 响应式适配 */
  @media screen and (width <= 768px) {
    .logo2 {
      display: block !important;
    }
  }

  @media screen and (width <= 640px) {
    .btn-box {
      width: 40px;
    }
  }
</style>
