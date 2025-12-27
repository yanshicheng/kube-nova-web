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

    <!-- 微信邀请弹窗 -->
    <Teleport to="body" v-if="isDemoEnabled">
      <Transition name="dialog-fade">
        <div v-if="showWechatDialog" class="dialog-overlay" @click="handleCloseWechatDialog">
          <Transition name="dialog-scale">
            <div v-if="showWechatDialog" class="dialog-container" @click.stop>
              <!-- 顶部装饰 -->
              <div class="dialog-header wechat-header">
                <div class="dialog-wave"></div>
                <div class="dialog-wave dialog-wave-2"></div>
              </div>

              <!-- 图标 -->
              <div class="dialog-icon wechat-icon">
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

              <!-- 标题 -->
              <div class="dialog-header-text">
                <h2 class="dialog-title">一起学习，共同成长</h2>
                <p class="dialog-subtitle">加入 Kube Nova 开发者社区</p>
              </div>

              <!-- 内容 -->
              <div class="dialog-content">
                <div class="intro-list">
                  <div class="intro-item">
                    <div class="intro-icon wechat-intro-icon">
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
                  <div class="intro-item">
                    <div class="intro-icon wechat-intro-icon">
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
                  <div class="intro-item">
                    <div class="intro-icon wechat-intro-icon">
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

                <!-- 二维码 -->
                <div class="qrcode-section">
                  <div class="qrcode-wrapper">
                    <div class="qrcode-border wechat-qrcode-border">
                      <img
                        :src="wechatQRCodeUrl"
                        alt="微信二维码"
                        class="qrcode-img"
                        @error="handleQRCodeError"
                      />
                    </div>
                    <p class="qrcode-tip">
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

                <!-- 提示 -->
                <div class="notice wechat-notice">
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

              <!-- 按钮 -->
              <button class="dialog-button wechat-button" @click="handleCloseWechatDialog">
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

    <!-- 演示环境弹窗 -->
    <Teleport to="body" v-if="isDemoEnabled">
      <Transition name="dialog-fade">
        <div v-if="showDemoDialog" class="dialog-overlay" @click="handleCloseDemoDialog">
          <Transition name="dialog-scale">
            <div v-if="showDemoDialog" class="dialog-container" @click.stop>
              <!-- 顶部装饰 -->
              <div class="dialog-header demo-header">
                <div class="dialog-wave"></div>
                <div class="dialog-wave dialog-wave-2"></div>
              </div>

              <!-- 图标 -->
              <div class="dialog-icon demo-icon">
                <img src="/src/assets/images/common/logo.webp" alt="Logo" class="logo-img" />
              </div>

              <!-- 标题 -->
              <div class="dialog-header-text">
                <h2 class="dialog-title">Kube Nova 平台 演示环境</h2>
                <p class="dialog-subtitle">体验完整功能，探索云原生管理</p>
              </div>

              <!-- 内容 -->
              <div class="dialog-content">
                <!-- 账号信息 -->
                <div class="account-box">
                  <div class="account-label">
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
                  <div class="account-content">
                    <div class="account-item">
                      <span class="account-key">账号</span>
                      <span class="account-value">super_admin</span>
                      <button
                        class="copy-btn"
                        @click="copyToClipboard('super_admin', '账号')"
                        title="复制"
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
                    <div class="account-item">
                      <span class="account-key">密码</span>
                      <span class="account-value">Admin@123456</span>
                      <button
                        class="copy-btn"
                        @click="copyToClipboard('Admin@123456', '密码')"
                        title="复制"
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

                <!-- 链接 -->
                <div class="links-list">
                  <a
                    href="https://www.cnblogs.com/yanshicheng/articles/19363328"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-item"
                  >
                    <div class="link-icon demo-link-icon">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                    </div>
                    <span>部署文档</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="link-arrow"
                    >
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>
                  <a
                    href="https://github.com/yanshicheng/kube-nova"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-item"
                  >
                    <div class="link-icon demo-link-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                        />
                      </svg>
                    </div>
                    <span>GitHub</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="link-arrow"
                    >
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>
                  <a
                    href="https://gitee.com/ikubeops/kube-nova"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-item"
                  >
                    <div class="link-icon demo-link-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.037a.594.594 0 0 1-.592-.593v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"
                        />
                      </svg>
                    </div>
                    <span>Gitee</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="link-arrow"
                    >
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>
                </div>
              </div>

              <!-- 按钮 -->
              <button class="dialog-button demo-button" @click="handleCloseDemoDialog">
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

    <!-- 悬浮按钮 -->
    <Teleport to="body" v-if="isDemoEnabled">
      <ElTooltip
        v-if="!showDemoDialog && !showWechatDialog"
        content="查看社区信息和演示账号"
        placement="left"
        :show-after="300"
      >
        <Transition name="fab-fade">
          <button
            v-if="!showDemoDialog && !showWechatDialog"
            class="fab-button"
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

    <!-- 复制成功提示 -->
    <Teleport to="body">
      <Transition name="toast-fade">
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

  // 弹窗状态
  const showWechatDialog = ref(false)
  const showDemoDialog = ref(false)
  const wechatQRCodeUrl = 'https://images.ikubeops.com/common/kube-nova-wechat.png'

  // 是否启用演示模式
  const isDemoEnabled = computed(() => {
    return import.meta.env.VITE_ENABLE_DEMO === 'true'
  })

  // 二维码加载失败
  const handleQRCodeError = () => {
    console.warn('二维码加载失败')
  }

  // 打开微信弹窗
  const handleOpenWechatDialog = () => {
    showWechatDialog.value = true
  }

  // 关闭微信弹窗，然后打开演示弹窗
  const handleCloseWechatDialog = () => {
    showWechatDialog.value = false
    setTimeout(() => {
      showDemoDialog.value = true
    }, 300)
  }

  // 关闭演示弹窗
  const handleCloseDemoDialog = () => {
    showDemoDialog.value = false
  }

  // 初始化弹窗显示
  const initDialogs = () => {
    if (!isDemoEnabled.value) return
    setTimeout(() => {
      showWechatDialog.value = true
    }, 500)
  }

  // 复制相关
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
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      showCopyMessage(ok ? `${label}复制成功` : `${label}复制失败`)
    }
  }

  onMounted(() => {
    initDialogs()
  })

  onUnmounted(() => {
    if (copyToastTimer) {
      clearTimeout(copyToastTimer)
    }
  })

  // 登录提交
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

      const loginResponse = await loginApi({ username, password })

      if (!loginResponse || !loginResponse.token) {
        throw new Error('登录失败')
      }

      const { userId, username: userName, nickName, uuid, roles, token } = loginResponse

      userStore.setToken(token.accessToken, token.refreshToken)
      userStore.setLoginStatus(true)

      userStore.setUserInfo({
        userId,
        userName,
        nickName,
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
      } catch {
        console.warn('获取用户详细信息失败')
      }

      userStore.checkAndClearWorktabs()
      showLoginSuccessNotice()

      const redirect = route.query.redirect as string
      await router.push(redirect || '/')
    } catch (error) {
      if (error instanceof HttpError && error.code === 101112) {
        return
      }
      console.error('登录失败:', error)
    } finally {
      loading.value = false
      resetDragVerify()
    }
  }

  const resetDragVerify = () => {
    if (dragVerify.value?.reset) {
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

  /* 弹窗遮罩 */
  .dialog-overlay {
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

  /* 弹窗容器 */
  .dialog-container {
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

  /* 弹窗头部 */
  .dialog-header {
    position: relative;
    height: 90px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .wechat-header {
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
  }

  .demo-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  /* 波浪动画 */
  .dialog-wave {
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 200%;
    height: 70px;
    background: var(--el-bg-color);
    border-radius: 50%;
    animation: wave 10s linear infinite;
  }

  .dialog-wave-2 {
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

  /* 图标 */
  .dialog-icon {
    position: relative;
    width: 68px;
    height: 68px;
    margin: -34px auto 0;
    flex-shrink: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .wechat-icon {
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
    box-shadow: 0 8px 24px rgba(7, 193, 96, 0.4);
    color: white;
  }

  .demo-icon {
    background: var(--el-bg-color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .logo-img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  /* 标题区 */
  .dialog-header-text {
    padding: 18px 24px 14px;
    text-align: center;
    flex-shrink: 0;
  }

  .dialog-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 6px;
  }

  .dialog-subtitle {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }

  /* 内容区 */
  .dialog-content {
    flex: 1;
    padding: 0 24px 18px;
  }

  /* 介绍列表 */
  .intro-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 18px;
  }

  .intro-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .intro-item:hover {
    background: var(--el-fill-color);
    transform: translateX(3px);
  }

  .intro-icon {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .wechat-intro-icon {
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
  }

  .intro-item span {
    flex: 1;
    font-size: 13px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  /* 二维码 */
  .qrcode-section {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .qrcode-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .qrcode-border {
    position: relative;
    padding: 10px;
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(7, 193, 96, 0.3);
  }

  .wechat-qrcode-border {
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
  }

  .qrcode-img {
    display: block;
    width: 170px;
    height: 170px;
    border-radius: 8px;
    background: white;
  }

  .qrcode-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
    margin: 0;
  }

  .qrcode-tip svg {
    flex-shrink: 0;
    color: #07c160;
  }

  /* 提示 */
  .notice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
  }

  .wechat-notice {
    background: linear-gradient(135deg, rgba(7, 193, 96, 0.1) 0%, rgba(0, 217, 118, 0.1) 100%);
    border-left: 3px solid #07c160;
  }

  .wechat-notice svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: #07c160;
  }

  .notice span {
    flex: 1;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }

  /* 账号信息 */
  .account-box {
    background: var(--el-fill-color-light);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 18px;
  }

  .account-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
  }

  .account-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .account-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    background: var(--el-bg-color);
    border-radius: 8px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  }

  .account-key {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
    min-width: 40px;
  }

  .account-value {
    flex: 1;
    font-size: 14px;
    color: var(--el-color-primary);
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .copy-btn {
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

  .copy-btn:hover {
    background: var(--el-fill-color);
    color: var(--el-color-primary);
  }

  .copy-btn:active {
    transform: scale(0.95);
  }

  /* 链接列表 */
  .links-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .link-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--el-fill-color-light);
    border-radius: 10px;
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
  }

  .link-item:hover {
    background: var(--el-fill-color);
    transform: translateX(3px);
  }

  .link-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .demo-link-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .link-item span {
    flex: 1;
    font-size: 14px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .link-arrow {
    color: var(--el-text-color-secondary);
    opacity: 0;
    transition: all 0.3s ease;
  }

  .link-item:hover .link-arrow {
    opacity: 1;
    color: var(--el-color-primary);
  }

  /* 按钮 */
  .dialog-button {
    width: 100%;
    margin: 0;
    padding: 16px 20px;
    flex-shrink: 0;
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

  .wechat-button {
    background: linear-gradient(135deg, #07c160 0%, #00d976 100%);
  }

  .wechat-button:hover {
    background: linear-gradient(135deg, #06b056 0%, #00c96c 100%);
  }

  .demo-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .demo-button:hover {
    background: linear-gradient(135deg, #5a72e0 0%, #6b4298 100%);
  }

  .dialog-button:active {
    transform: scale(0.98);
  }

  /* 悬浮按钮 */
  .fab-button {
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

  .fab-button:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
  }

  .fab-button:active {
    transform: translateY(-2px) scale(1);
  }

  .fab-button svg {
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

  /* 复制提示 */
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

  /* 动画 */
  .dialog-fade-enter-active,
  .dialog-fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .dialog-fade-enter-from,
  .dialog-fade-leave-to {
    opacity: 0;
  }

  .dialog-scale-enter-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .dialog-scale-leave-active {
    transition: all 0.3s ease;
  }

  .dialog-scale-enter-from {
    opacity: 0;
    transform: scale(0.85) translateY(30px);
  }

  .dialog-scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .fab-fade-enter-active,
  .fab-fade-leave-active {
    transition: all 0.3s ease;
  }

  .fab-fade-enter-from,
  .fab-fade-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }

  .toast-fade-enter-active,
  .toast-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .toast-fade-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }

  .toast-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }

  /* 移动端适配 */
  @media (max-width: 640px) {
    .dialog-container {
      margin: 20px;
    }

    .dialog-header {
      height: 80px;
    }

    .dialog-icon {
      width: 60px;
      height: 60px;
      margin: -30px auto 0;
    }

    .dialog-icon svg {
      width: 38px;
      height: 38px;
    }

    .dialog-header-text,
    .dialog-content {
      padding-left: 20px;
      padding-right: 20px;
    }

    .dialog-title {
      font-size: 18px;
    }

    .qrcode-img {
      width: 150px;
      height: 150px;
    }

    .fab-button {
      top: 60px;
      right: 16px;
      width: 48px;
      height: 48px;
    }

    .fab-button svg {
      width: 20px;
      height: 20px;
    }
  }

  /* 暗色模式 */
  .dark .dialog-icon.demo-icon {
    background: var(--el-bg-color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .dark .account-box {
    background: rgba(255, 255, 255, 0.05);
  }

  .dark .account-item {
    background: rgba(255, 255, 255, 0.08);
  }

  .dark .link-item {
    background: rgba(255, 255, 255, 0.05);
  }

  .dark .link-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .dark .copy-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .dark .intro-item {
    background: rgba(255, 255, 255, 0.05);
  }

  .dark .intro-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
