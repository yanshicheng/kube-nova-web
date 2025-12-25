<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">欢迎使用 Kube Nova 平台</h3>
          <p class="sub-title">请输入您的账号和密码</p>
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            @keyup.enter="handleSubmit"
            style="margin-top: 25px"
          >
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                placeholder="请输入用户名"
                v-model.trim="formData.username"
              />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                placeholder="请输入密码"
                v-model.trim="formData.password"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <div class="relative pb-5 mt-6">
              <div
                class="relative z-[2] overflow-hidden select-none rounded-lg border border-transparent tad-300"
                :class="{ '!border-[#FF4E4F]': !isPassing && isClickPass }"
              >
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  text="请按住滑块，拖动到最右边"
                  textColor="var(--art-gray-700)"
                  successText="验证通过"
                  :progressBarBg="getCssVar('--el-color-primary')"
                  :background="isDark ? '#26272F' : '#F1F1F4'"
                  handlerBg="var(--default-box-color)"
                />
              </div>
              <p
                class="absolute top-0 z-[1] px-px mt-2 text-xs text-[#f56c6c] tad-300"
                :class="{ 'translate-y-10': !isPassing && isClickPass }"
              >
                请完成滑块验证
              </p>
            </div>

            <div class="flex-cb mt-2 text-sm">
              <ElCheckbox v-model="formData.rememberPassword">记住密码</ElCheckbox>
              <RouterLink class="text-theme" :to="{ name: 'ForgetPassword' }">
                忘记密码？
              </RouterLink>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                登录
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>

    <Teleport to="body" v-if="isDemoEnabled">
      <Transition name="wechat-dialog-fade">
        <div v-if="showWechatDialog" class="wechat-dialog-overlay" @click="handleCloseWechatDialog">
          <Transition name="wechat-dialog-scale">
            <div v-if="showWechatDialog" class="wechat-dialog-container" @click.stop>
              <div class="wechat-dialog-header">
                <div class="wechat-wave"></div>
                <div class="wechat-wave wechat-wave-2"></div>
              </div>

              <div class="wechat-dialog-icon">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>

              <div class="wechat-dialog-header-text">
                <h2 class="wechat-dialog-title">一起学习，共同成长</h2>
                <p class="wechat-dialog-subtitle">加入 Kube Nova 开发者社区</p>
              </div>

              <div class="wechat-dialog-content">
                <div class="wechat-intro">
                  <div class="wechat-intro-item">
                    <div class="wechat-intro-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span>与志同道合的开发者交流技术</span>
                  </div>
                  <div class="wechat-intro-item">
                    <div class="wechat-intro-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span>参与开源项目，提升实战能力</span>
                  </div>
                  <div class="wechat-intro-item">
                    <div class="wechat-intro-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span>获取项目更新和技术分享</span>
                  </div>
                </div>

                <div class="wechat-qrcode-section">
                  <div class="wechat-qrcode-wrapper">
                    <div class="wechat-qrcode-border">
                      <img
                        :src="wechatQRCodeUrl"
                        alt="WeChat QR Code"
                        class="wechat-qrcode-img"
                        @error="handleQRCodeError"
                      />
                    </div>
                    <p class="wechat-qrcode-tip">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                        ></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      扫码加入微信群
                    </p>
                  </div>
                </div>

                <div class="wechat-notice">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>期待与您相遇，一起打造更好的云原生平台</span>
                </div>
              </div>

              <button class="wechat-dialog-button-single" @click="handleCloseWechatDialog">
                <span>知道了</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body" v-if="isDemoEnabled">
      <Transition name="demo-dialog-fade">
        <div v-if="showDemoDialog" class="demo-dialog-overlay" @click="handleCloseDemoDialog">
          <Transition name="demo-dialog-scale">
            <div v-if="showDemoDialog" class="demo-dialog-container" @click.stop>
              <div class="demo-dialog-header-decoration"></div>

              <div class="demo-dialog-icon">
                <img
                  src="/src/assets/images/common/logo.webp"
                  alt="Kube Nova Logo"
                  class="demo-logo-img"
                />
              </div>

              <h2 class="demo-dialog-title">Kube Nova 平台 演示环境</h2>

              <div class="demo-dialog-content">
                <div class="demo-info-item">
                  <div class="demo-info-label">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>作者</span>
                  </div>
                  <div class="demo-info-value">Yan Shicheng</div>
                </div>

                <div class="demo-account-box">
                  <div class="demo-info-label">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>演示账号</span>
                  </div>
                  <div class="demo-account-content">
                    <div class="demo-account-item">
                      <span class="demo-account-key">账号</span>
                      <span class="demo-account-value">super_admin</span>
                      <button
                        class="demo-copy-btn"
                        @click="copyToClipboard('super_admin', '账号')"
                        title="复制账号"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                    <div class="demo-account-item">
                      <span class="demo-account-key">密码</span>
                      <span class="demo-account-value">Admin@123456</span>
                      <button
                        class="demo-copy-btn"
                        @click="copyToClipboard('Admin@123456', '密码')"
                        title="复制密码"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="demo-links-grid">
                  <a
                    href="https://www.cnblogs.com/yanshicheng/articles/19363328"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="demo-link-item"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <div class="demo-link-content">
                      <div class="demo-link-label">部署文档</div>
                      <div class="demo-link-status">点击查看</div>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="demo-link-arrow"
                    >
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>

                  <a
                    href="https://github.com/yanshicheng/kube-nova"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="demo-link-item"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                      />
                    </svg>
                    <div class="demo-link-content">
                      <div class="demo-link-label">GitHub</div>
                      <div class="demo-link-status">点击访问</div>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="demo-link-arrow"
                    >
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>

                  <a
                    href="https://gitee.com/ikubeops/kube-nova"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="demo-link-item"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.037a.594.594 0 0 1-.592-.593v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"
                      />
                    </svg>
                    <div class="demo-link-content">
                      <div class="demo-link-label">Gitee</div>
                      <div class="demo-link-status">点击访问</div>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="demo-link-arrow"
                    >
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>
                </div>
              </div>

              <button class="demo-dialog-button" @click="handleCloseDemoDialog">
                <span>知道了</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body" v-if="isDemoEnabled">
      <ElTooltip
        v-if="!showDemoDialog && !showWechatDialog"
        content="查看社区信息和演示账号"
        placement="left"
        :show-after="300"
      >
        <Transition name="demo-fab-fade">
          <button
            v-if="!showDemoDialog && !showWechatDialog"
            class="demo-fab"
            @click="handleOpenWechatDialog"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </Transition>
      </ElTooltip>
    </Teleport>

    <Teleport to="body">
      <Transition name="copy-toast-fade">
        <div v-if="showCopyToast" class="copy-toast">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{{ copyToastMessage }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { useUserStore } from '@/store/modules/user'
  import { getCssVar } from '@/utils/ui'
  import { HttpError } from '@/utils/http/error'
  import { loginApi } from '@/api/portal/auth'
  import { getUserInfoApi } from '@/api/portal/user'
  import { ElNotification, ElTooltip, type FormInstance, type FormRules } from 'element-plus'
  import { useSettingStore } from '@/store/modules/setting'

  defineOptions({ name: 'Login' })

  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)

  const dragVerify = ref()
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()
  const isPassing = ref(false)
  const isClickPass = ref(false)

  const systemName = AppConfig.systemInfo.name
  const formRef = ref<FormInstance>()

  const formData = reactive({
    username: '',
    password: '',
    rememberPassword: true
  })

  const rules: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  }

  const loading = ref(false)

  const WECHAT_DIALOG_KEY = 'kube_nova_wechat_dialog_shown'
  const showWechatDialog = ref(false)
  const wechatQRCodeUrl = 'https://images.ikubeops.com/common/kube-nova-wechat.png'

  const handleQRCodeError = (event: Event) => {
    console.warn('[Login] 二维码加载失败:', wechatQRCodeUrl)
  }

  const handleOpenWechatDialog = () => {
    showWechatDialog.value = true
  }

  const handleCloseWechatDialog = () => {
    showWechatDialog.value = false
    try {
      localStorage.setItem(WECHAT_DIALOG_KEY, 'true')
    } catch (error) {
      console.warn('[Login] localStorage 写入失败:', error)
    }

    setTimeout(() => {
      showDemoDialog.value = true
    }, 300)
  }

  const DEMO_DIALOG_KEY = 'kube_nova_demo_dialog_shown'
  const showDemoDialog = ref(false)

  const isDemoEnabled = computed(() => {
    return import.meta.env.VITE_ENABLE_DEMO === 'true'
  })

  const checkShowDialogs = () => {
    if (!isDemoEnabled.value) return

    try {
      const hasShownWechat = localStorage.getItem(WECHAT_DIALOG_KEY)
      const hasShownDemo = localStorage.getItem(DEMO_DIALOG_KEY)

      setTimeout(() => {
        if (!hasShownWechat && !hasShownDemo) {
          showWechatDialog.value = true
        } else if (hasShownWechat && !hasShownDemo) {
          showDemoDialog.value = true
        } else if (!hasShownWechat && hasShownDemo) {
          showWechatDialog.value = true
        }
      }, 500)
    } catch (error) {
      console.warn('[Login] localStorage 访问失败:', error)
    }
  }

  const handleOpenDemoDialog = () => {
    showDemoDialog.value = true
  }

  const handleCloseDemoDialog = () => {
    showDemoDialog.value = false
    try {
      localStorage.setItem(DEMO_DIALOG_KEY, 'true')
    } catch (error) {
      console.warn('[Login] localStorage 写入失败:', error)
    }
  }

  const showCopyToast = ref(false)
  const copyToastMessage = ref('')
  let copyToastTimer: NodeJS.Timeout | null = null

  const showCopyMessage = (message: string) => {
    if (copyToastTimer) {
      clearTimeout(copyToastTimer)
    }

    copyToastMessage.value = message
    showCopyToast.value = true

    copyToastTimer = setTimeout(() => {
      showCopyToast.value = false
    }, 2000)
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showCopyMessage(`${label}复制成功`)
    } catch (error) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.top = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textarea)

        if (successful) {
          showCopyMessage(`${label}复制成功`)
        } else {
          showCopyMessage(`${label}复制失败，请手动复制`)
        }
      } catch (err) {
        showCopyMessage(`${label}复制失败，请手动复制`)
      }
    }
  }

  onMounted(() => {
    checkShowDialogs()
  })

  onUnmounted(() => {
    if (copyToastTimer) {
      clearTimeout(copyToastTimer)
    }
  })

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return

      if (!isPassing.value) {
        isClickPass.value = true
        return
      }

      loading.value = true

      const { username, password } = formData

      const loginResponse = await loginApi({
        username,
        password
      })

      if (!loginResponse || !loginResponse.token) {
        throw new Error('登录失败 - 未收到有效的 token')
      }

      const { userId, username: userName, nickName, uuid, roles, token } = loginResponse

      if (!roles || roles.length === 0) {
        console.warn('[Login] 后端未返回角色信息，请检查接口')
      }

      userStore.setToken(token.accessToken, token.refreshToken)
      userStore.setLoginStatus(true)

      userStore.setUserInfo({
        userId,
        userName: userName,
        nickName: nickName,
        uuid,
        roles: roles || []
      })

      await nextTick()

      try {
        const userInfo = await getUserInfoApi()

        userStore.setUserInfo({
          userId: userInfo.id,
          userName: userInfo.username,
          nickName: userInfo.nickname,
          avatar: userInfo.avatar,
          email: userInfo.email,
          phone: userInfo.phone,
          status: userInfo.status
        })
      } catch (error) {
        console.warn('[Login] 获取用户详细信息失败，使用登录返回的基本信息:', error)
      }

      userStore.checkAndClearWorktabs()

      showLoginSuccessNotice()

      const redirect = route.query.redirect as string
      await router.push(redirect || '/')
    } catch (error) {
      if (error instanceof HttpError && error.code === 101112) {
        return
      }

      if (error instanceof HttpError) {
        console.error('[Login] 登录失败:', error.message, 'Code:', error.code)
      } else {
        console.error('[Login] 未知错误:', error)
      }
    } finally {
      loading.value = false
      resetDragVerify()
    }
  }

  const resetDragVerify = () => {
    if (dragVerify.value && typeof dragVerify.value.reset === 'function') {
      dragVerify.value.reset()
    }
  }

  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: '登录成功',
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `欢迎回来，${systemName}!`
      })
    }, 1000)
  }
</script>

<style scoped>
  @import './style.css';

  .wechat-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }

  .wechat-dialog-container {
    position: relative;
    background: var(--el-bg-color);
    border-radius: 20px;
    max-width: 480px;
    width: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .wechat-dialog-header {
    position: relative;
    height: 90px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
    overflow: hidden;
  }

  .wechat-wave {
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 200%;
    height: 70px;
    background: var(--el-bg-color);
    border-radius: 50%;
    animation: wave 10s linear infinite;
  }

  .wechat-wave-2 {
    bottom: -15px;
    opacity: 0.5;
    animation-delay: -5s;
    animation-duration: 15s;
  }

  @keyframes wave {
    0% {
      transform: translateX(0) translateY(0);
    }
    50% {
      transform: translateX(-25%) translateY(-8px);
    }
    100% {
      transform: translateX(-50%) translateY(0);
    }
  }

  .wechat-dialog-icon {
    position: relative;
    width: 68px;
    height: 68px;
    margin: -34px auto 0;
    flex-shrink: 0;
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(7, 193, 96, 0.4);
    z-index: 1;
  }

  .wechat-dialog-icon svg {
    color: white;
  }

  .wechat-dialog-header-text {
    padding: 18px 24px 14px;
    text-align: center;
    flex-shrink: 0;
  }

  .wechat-dialog-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 6px;
  }

  .wechat-dialog-subtitle {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }

  .wechat-dialog-content {
    flex: 1;
    padding: 0 24px 18px;
  }

  .wechat-intro {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 18px;
  }

  .wechat-intro-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .wechat-intro-item:hover {
    background: var(--el-fill-color);
    transform: translateX(3px);
  }

  .wechat-intro-icon {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .wechat-intro-item span {
    flex: 1;
    font-size: 13px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .wechat-qrcode-section {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .wechat-qrcode-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .wechat-qrcode-border {
    position: relative;
    padding: 10px;
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(7, 193, 96, 0.3);
  }

  .wechat-qrcode-img {
    display: block;
    width: 170px;
    height: 170px;
    border-radius: 8px;
    background: white;
  }

  .wechat-qrcode-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
    margin: 0;
  }

  .wechat-qrcode-tip svg {
    flex-shrink: 0;
    color: #07c160;
  }

  .wechat-notice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    background: linear-gradient(135deg, rgba(7, 193, 96, 0.1) 0%, rgba(0, 217, 118, 0.1) 100%);
    border-radius: 10px;
    border-left: 3px solid #07c160;
    margin-bottom: 0;
  }

  .wechat-notice svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: #07c160;
  }

  .wechat-notice span {
    flex: 1;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }

  .wechat-dialog-button-single {
    width: 100%;
    margin: 0;
    padding: 16px 20px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
    color: white;
    border: none;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  }

  .wechat-dialog-button-single:hover {
    background: linear-gradient(135deg, #06b056 0%, #00c96c 100%);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  }

  .wechat-dialog-button-single:active {
    transform: scale(0.98);
  }

  .wechat-dialog-fade-enter-active,
  .wechat-dialog-fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .wechat-dialog-fade-enter-from,
  .wechat-dialog-fade-leave-to {
    opacity: 0;
  }

  .wechat-dialog-scale-enter-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .wechat-dialog-scale-leave-active {
    transition: all 0.3s ease;
  }

  .wechat-dialog-scale-enter-from {
    opacity: 0;
    transform: scale(0.85) translateY(30px);
  }

  .wechat-dialog-scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .demo-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }

  .demo-dialog-container {
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 3px;
    max-width: 480px;
    width: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .demo-dialog-container::before {
    content: '';
    position: absolute;
    inset: 3px;
    background: var(--el-bg-color);
    border-radius: 18px;
    z-index: 0;
  }

  .demo-dialog-header-decoration {
    position: relative;
    height: 100px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 18px 18px 0 0;
    overflow: hidden;
    z-index: 1;
    flex-shrink: 0;
  }

  .demo-dialog-header-decoration::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: rotate 20s linear infinite;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .demo-dialog-icon {
    position: relative;
    width: 72px;
    height: 72px;
    margin: -36px auto 0;
    background: var(--el-bg-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 1;
    flex-shrink: 0;
  }

  .demo-logo-img {
    width: 52px;
    height: 52px;
    object-fit: contain;
  }

  .demo-dialog-title {
    position: relative;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 20px 0 0;
    padding-bottom: 20px;
    z-index: 1;
    flex-shrink: 0;
  }

  .demo-dialog-content {
    position: relative;
    padding: 0 24px 18px;
    z-index: 1;
    flex: 1;
  }

  .demo-info-item {
    margin-bottom: 18px;
  }

  .demo-info-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: 10px;
  }

  .demo-info-label svg {
    flex-shrink: 0;
  }

  .demo-info-value {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding-left: 24px;
  }

  .demo-account-box {
    background: var(--el-fill-color-light);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 18px;
  }

  .demo-account-box .demo-info-label {
    margin-bottom: 12px;
  }

  .demo-account-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .demo-account-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    background: var(--el-bg-color);
    border-radius: 8px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  }

  .demo-account-key {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
    min-width: 40px;
  }

  .demo-account-value {
    flex: 1;
    font-size: 14px;
    color: var(--el-color-primary);
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .demo-copy-btn {
    padding: 6px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .demo-copy-btn:hover {
    background: var(--el-fill-color);
    color: var(--el-color-primary);
  }

  .demo-copy-btn:active {
    transform: scale(0.95);
  }

  .demo-links-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .demo-link-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 14px 10px;
    background: var(--el-fill-color-light);
    border-radius: 12px;
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
    position: relative;
    cursor: pointer;
  }

  .demo-link-item:hover {
    background: var(--el-fill-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }

  .demo-link-item:active {
    transform: translateY(0);
  }

  .demo-link-item > svg:first-child {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
  }

  .demo-link-arrow {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0;
    transition: all 0.3s ease;
  }

  .demo-link-item:hover .demo-link-arrow {
    opacity: 1;
    color: var(--el-color-primary);
  }

  .demo-link-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 100%;
  }

  .demo-link-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    text-align: center;
  }

  .demo-link-status {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }

  .demo-dialog-button {
    position: relative;
    width: 100%;
    margin: 0;
    padding: 16px 20px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 1;
  }

  .demo-dialog-button:hover {
    background: linear-gradient(135deg, #5a72e0 0%, #6b4298 100%);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  }

  .demo-dialog-button:active {
    transform: scale(0.98);
  }

  .demo-fab {
    position: fixed;
    top: 80px;
    right: 24px;
    width: 54px;
    height: 54px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 9998;
  }

  .demo-fab:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
  }

  .demo-fab:active {
    transform: translateY(-2px) scale(1);
  }

  .demo-fab svg {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .copy-toast {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 14px 28px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 600;
    z-index: 10001;
    pointer-events: none;
    min-width: 180px;
    justify-content: center;
  }

  .copy-toast svg {
    flex-shrink: 0;
  }

  .copy-toast-fade-enter-active,
  .copy-toast-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .copy-toast-fade-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }

  .copy-toast-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }

  .demo-dialog-fade-enter-active,
  .demo-dialog-fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .demo-dialog-fade-enter-from,
  .demo-dialog-fade-leave-to {
    opacity: 0;
  }

  .demo-dialog-scale-enter-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .demo-dialog-scale-leave-active {
    transition: all 0.3s ease;
  }

  .demo-dialog-scale-enter-from {
    opacity: 0;
    transform: scale(0.85) translateY(20px);
  }

  .demo-dialog-scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .demo-fab-fade-enter-active,
  .demo-fab-fade-leave-active {
    transition: all 0.3s ease;
  }

  .demo-fab-fade-enter-from,
  .demo-fab-fade-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }

  @media (max-width: 640px) {
    .wechat-dialog-container,
    .demo-dialog-container {
      margin: 20px;
    }

    .wechat-dialog-header {
      height: 80px;
    }

    .wechat-dialog-icon {
      width: 60px;
      height: 60px;
      margin: -30px auto 0;
    }

    .wechat-dialog-icon svg {
      width: 38px;
      height: 38px;
    }

    .wechat-dialog-header-text,
    .wechat-dialog-content {
      padding-left: 20px;
      padding-right: 20px;
    }

    .demo-dialog-content {
      padding-left: 20px;
      padding-right: 20px;
    }

    .wechat-dialog-title,
    .demo-dialog-title {
      font-size: 18px;
    }

    .wechat-qrcode-img {
      width: 150px;
      height: 150px;
    }

    .demo-links-grid {
      grid-template-columns: 1fr;
    }

    .demo-fab {
      top: 60px;
      right: 16px;
      width: 48px;
      height: 48px;
    }

    .demo-fab svg {
      width: 20px;
      height: 20px;
    }
  }

  .dark .demo-dialog-container::before {
    background: var(--el-bg-color);
  }

  .dark .demo-dialog-icon {
    background: var(--el-bg-color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .dark .demo-account-box {
    background: rgba(255, 255, 255, 0.05);
  }

  .dark .demo-account-item {
    background: rgba(255, 255, 255, 0.08);
  }

  .dark .demo-link-item {
    background: rgba(255, 255, 255, 0.05);
  }

  .dark .demo-link-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .dark .demo-copy-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .dark .wechat-intro-item {
    background: rgba(255, 255, 255, 0.05);
  }

  .dark .wechat-intro-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
