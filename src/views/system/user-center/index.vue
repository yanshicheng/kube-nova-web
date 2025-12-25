<template>
  <div class="user-center-container">
    <div class="user-header">
      <div class="header-content">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img :src="userInfo.avatar || defaultAvatar" alt="avatar" class="user-avatar" />
            <div class="avatar-upload" @click="handleAvatarClick">
              <el-icon :size="18" color="white"><Camera /></el-icon>
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarChange"
            />
          </div>
          <div class="user-info">
            <h2>{{ userInfo.nickname || userInfo.username || '用户' }}</h2>
            <p>{{ userInfo.email || '暂未设置邮箱' }}</p>
            <div class="user-meta">
              <span v-if="userInfo.workNumber">
                <el-icon><Ticket /></el-icon>
                工号: {{ userInfo.workNumber }}
              </span>
              <span v-if="userInfo.deptNames">
                <el-icon><OfficeBuilding /></el-icon>
                {{ userInfo.deptNames }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <el-icon class="stat-icon"><Calendar /></el-icon>
            <div class="stat-value">{{ daysSinceJoined }}</div>
            <div class="stat-label">加入天数</div>
          </div>
          <div class="stat-item">
            <el-icon class="stat-icon"><UserFilled /></el-icon>
            <div class="stat-value">{{ userRoles.length }}</div>
            <div class="stat-label">角色数量</div>
          </div>
          <div class="stat-item">
            <el-icon class="stat-icon"><Clock /></el-icon>
            <div class="stat-value">{{ lastLoginTime }}</div>
            <div class="stat-label">最后登录</div>
          </div>
        </div>
      </div>
    </div>

    <div class="user-content">
      <ElTabs v-model="activeTab" tab-position="left" class="user-tabs">
        <ElTabPane name="basic">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              基本信息
            </span>
          </template>
          <div class="tab-content">
            <h3 class="section-title">
              <el-icon><Setting /></el-icon>
              基本设置
            </h3>
            <div class="form-description">
              <ElAlert type="info" :closable="false">
                <template #default>
                  <div style="display: flex; align-items: center; gap: 8px">
                    <el-icon><InfoFilled /></el-icon>
                    只能修改昵称、邮箱和手机号，其他信息请联系管理员修改
                  </div>
                </template>
              </ElAlert>
            </div>
            <ElForm
              ref="basicFormRef"
              :model="basicForm"
              :rules="basicRules"
              label-width="100px"
              class="user-form"
            >
              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem label="用户名" prop="username">
                    <ElInput v-model="basicForm.username" disabled>
                      <template #prefix>
                        <el-icon><User /></el-icon>
                      </template>
                    </ElInput>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="昵称" prop="nickname">
                    <ElInput
                      v-model="basicForm.nickname"
                      placeholder="请输入昵称"
                      maxlength="20"
                      show-word-limit
                    >
                      <template #prefix>
                        <el-icon><EditPen /></el-icon>
                      </template>
                    </ElInput>
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem label="邮箱" prop="email">
                    <ElInput v-model="basicForm.email" placeholder="请输入邮箱">
                      <template #prefix>
                        <el-icon><Message /></el-icon>
                      </template>
                    </ElInput>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="手机号" prop="phone">
                    <ElInput v-model="basicForm.phone" placeholder="请输入手机号" maxlength="11">
                      <template #prefix>
                        <el-icon><Phone /></el-icon>
                      </template>
                    </ElInput>
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem label="工号" prop="workNumber">
                    <ElInput v-model="basicForm.workNumber" disabled>
                      <template #prefix>
                        <el-icon><Ticket /></el-icon>
                      </template>
                    </ElInput>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="部门" prop="deptNames">
                    <ElInput v-model="basicForm.deptNames" disabled>
                      <template #prefix>
                        <el-icon><OfficeBuilding /></el-icon>
                      </template>
                    </ElInput>
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElFormItem>
                <ElButton
                  type="primary"
                  @click="handleSaveBasicInfo"
                  :loading="basicLoading"
                  :disabled="basicLoading"
                >
                  <el-icon><Check /></el-icon>
                  {{ basicLoading ? '保存中...' : '保存信息' }}
                </ElButton>
                <ElButton @click="resetBasicForm" :disabled="basicLoading">
                  <el-icon><RefreshRight /></el-icon>
                  重置
                </ElButton>
              </ElFormItem>
            </ElForm>
          </div>
        </ElTabPane>

        <ElTabPane name="password">
          <template #label>
            <span class="tab-label">
              <el-icon><Lock /></el-icon>
              修改密码
            </span>
          </template>
          <div class="tab-content">
            <h3 class="section-title">
              <el-icon><Lock /></el-icon>
              密码安全
            </h3>
            <div class="security-tips">
              <el-icon class="tip-icon"><Warning /></el-icon>
              <span>建议定期修改密码以保证账号安全，修改密码后需要重新登录</span>
            </div>
            <ElForm
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="120px"
              class="user-form password-form"
            >
              <ElFormItem label="当前密码" prop="oldPassword">
                <ElInput
                  v-model="passwordForm.oldPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  show-password
                  clearable
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </ElInput>
              </ElFormItem>

              <ElFormItem label="新密码" prop="newPassword">
                <ElInput
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="请输入新密码(至少6位)"
                  show-password
                  clearable
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </ElInput>
                <div class="password-strength" v-if="passwordForm.newPassword">
                  <span>密码强度：</span>
                  <div class="strength-bar">
                    <div
                      class="strength-level"
                      :class="passwordStrength"
                      :style="{ width: passwordStrengthWidth }"
                    ></div>
                  </div>
                  <span class="strength-text">{{ passwordStrengthText }}</span>
                </div>
              </ElFormItem>

              <ElFormItem label="确认密码" prop="confirmPassword">
                <ElInput
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                  clearable
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </ElInput>
              </ElFormItem>

              <ElFormItem>
                <ElButton
                  type="primary"
                  @click="handleChangePassword"
                  :loading="passwordLoading"
                  :disabled="passwordLoading"
                >
                  <el-icon><Lock /></el-icon>
                  {{ passwordLoading ? '修改中...' : '修改密码' }}
                </ElButton>
                <ElButton @click="resetPasswordForm" :disabled="passwordLoading">
                  <el-icon><RefreshRight /></el-icon>
                  重置
                </ElButton>
              </ElFormItem>
            </ElForm>
          </div>
        </ElTabPane>

        <ElTabPane name="roles">
          <template #label>
            <span class="tab-label">
              <el-icon><UserFilled /></el-icon>
              角色权限
            </span>
          </template>
          <div class="tab-content">
            <h3 class="section-title">
              <el-icon><UserFilled /></el-icon>
              我的角色
            </h3>
            <div class="roles-list" v-if="userRoles.length > 0">
              <div v-for="role in userRoles" :key="role" class="role-item">
                <el-icon class="role-icon"><Avatar /></el-icon>
                <span>{{ role }}</span>
              </div>
            </div>
            <ElEmpty v-else description="暂无角色分配" />
          </div>
        </ElTabPane>
      </ElTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage, FormInstance, FormRules } from 'element-plus'
  import { useRouter } from 'vue-router'
  import {
    User,
    Lock,
    UserFilled,
    Calendar,
    Clock,
    Setting,
    InfoFilled,
    EditPen,
    Message,
    Phone,
    Ticket,
    OfficeBuilding,
    Check,
    RefreshRight,
    Warning,
    Key,
    Avatar,
    Camera
  } from '@element-plus/icons-vue'
  import {
    getUserInfoApi,
    updateUserInfoApi,
    updateUserPasswordApi,
    updateUserAvatarApi,
    uploadImageApi,
    type UserSysUserInfo
  } from '@/api/portal'

  defineOptions({ name: 'UserCenter' })

  const router = useRouter()

  // 默认头像
  const defaultAvatar = '/imgs/kube-nova.png'

  // 状态
  const activeTab = ref('basic')
  const basicLoading = ref(false)
  const passwordLoading = ref(false)
  const avatarInput = ref<HTMLInputElement>()
  const dataLoading = ref(false)

  // 用户信息
  const userInfo = ref<UserSysUserInfo>({
    id: 0,
    username: '',
    nickname: '',
    avatar: '',
    email: '',
    phone: '',
    workNumber: '',
    status: 1,
    isNeedResetPwd: 0,
    createdBy: '',
    updatedBy: '',
    createdAt: 0,
    updatedAt: 0,
    deptNames: '',
    roleNames: ''
  })

  // 用户角色列表
  const userRoles = computed(() => {
    const roles = userInfo.value.roleNames
    if (!roles) return []
    return roles
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
  })

  // 表单引用
  const basicFormRef = ref<FormInstance>()
  const passwordFormRef = ref<FormInstance>()

  // 基本信息表单
  const basicForm = reactive({
    username: '',
    nickname: '',
    email: '',
    phone: '',
    workNumber: '',
    deptNames: ''
  })

  // 密码表单
  const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 验证规则
  const basicRules = reactive<FormRules>({
    nickname: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
    ],
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: ['blur', 'change'] }
    ]
  })

  const validatePassword = (rule: any, value: any, callback: any) => {
    if (value === '') {
      callback(new Error('请输入新密码'))
    } else if (value.length < 6) {
      callback(new Error('密码长度不能少于6位'))
    } else if (value === passwordForm.oldPassword) {
      callback(new Error('新密码不能与当前密码相同'))
    } else {
      if (passwordForm.confirmPassword !== '') {
        passwordFormRef.value?.validateField('confirmPassword')
      }
      callback()
    }
  }

  const validateConfirmPassword = (rule: any, value: any, callback: any) => {
    if (value === '') {
      callback(new Error('请再次输入新密码'))
    } else if (value !== passwordForm.newPassword) {
      callback(new Error('两次输入密码不一致'))
    } else {
      callback()
    }
  }

  const passwordRules = reactive<FormRules>({
    oldPassword: [
      { required: true, message: '请输入当前密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    newPassword: [{ validator: validatePassword, trigger: ['blur', 'change'] }],
    confirmPassword: [{ validator: validateConfirmPassword, trigger: ['blur', 'change'] }]
  })

  // 计算属性
  const daysSinceJoined = computed(() => {
    const createdAt = userInfo.value.createdAt
    if (!createdAt) return 0
    const timestamp = createdAt > 9999999999 ? createdAt : createdAt * 1000
    const joinDate = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - joinDate.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  })

  const lastLoginTime = computed(() => {
    const updatedAt = userInfo.value.updatedAt
    if (!updatedAt) return '未知'
    const timestamp = updatedAt > 9999999999 ? updatedAt : updatedAt * 1000
    const lastTime = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - lastTime.getTime()

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`

    return lastTime.toLocaleDateString()
  })

  // 密码强度计算
  const passwordStrength = computed(() => {
    const pwd = passwordForm.newPassword
    if (!pwd) return ''

    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 10) strength++
    if (/\d/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++

    if (strength <= 2) return 'weak'
    if (strength <= 4) return 'medium'
    return 'strong'
  })

  const passwordStrengthWidth = computed(() => {
    const strength = passwordStrength.value
    if (strength === 'weak') return '33%'
    if (strength === 'medium') return '66%'
    if (strength === 'strong') return '100%'
    return '0%'
  })

  const passwordStrengthText = computed(() => {
    const strength = passwordStrength.value
    if (strength === 'weak') return '弱'
    if (strength === 'medium') return '中'
    if (strength === 'strong') return '强'
    return ''
  })

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      dataLoading.value = true
      const data = await getUserInfoApi()
      if (!data) throw new Error('未获取到用户数据')

      userInfo.value = data
      Object.assign(basicForm, {
        username: data.username || '',
        nickname: data.nickname || '',
        email: data.email || '',
        phone: data.phone || '',
        workNumber: data.workNumber || '',
        deptNames: data.deptNames || ''
      })
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
    } finally {
      dataLoading.value = false
    }
  }

  // 保存基本信息
  const handleSaveBasicInfo = async () => {
    try {
      const valid = await basicFormRef.value?.validate()
      if (!valid) return

      basicLoading.value = true
      await updateUserInfoApi({
        nickname: basicForm.nickname,
        email: basicForm.email,
        phone: basicForm.phone
      })

      await fetchUserInfo()
      ElMessage.success('保存成功')
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || error.message || '保存失败，请重试')
    } finally {
      basicLoading.value = false
    }
  }

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userInfo')
    sessionStorage.clear()
    router.push('/login')
  }

  // 修改密码
  const handleChangePassword = async () => {
    try {
      const valid = await passwordFormRef.value?.validate()
      if (!valid) return

      passwordLoading.value = true
      await updateUserPasswordApi({
        username: basicForm.username,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      })

      ElMessage.success('密码修改成功，请重新登录')
      resetPasswordForm()
      setTimeout(() => handleLogout(), 1500)
    } catch (error: any) {
      ElMessage.error(
        error.response?.data?.message || error.message || '密码修改失败，请检查当前密码是否正确'
      )
    } finally {
      passwordLoading.value = false
    }
  }

  // 头像相关
  const handleAvatarClick = () => {
    avatarInput.value?.click()
  }

  const handleAvatarChange = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过 5MB')
      return
    }

    try {
      const uploadResponse = await uploadImageApi({ project: 'user' }, file)
      const imageUrl = uploadResponse?.imageUri
      if (!imageUrl) throw new Error('上传成功但未返回图片地址')

      await updateUserAvatarApi({ avatar: imageUrl })
      await fetchUserInfo()
      ElMessage.success('头像更新成功')
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || error.message || '头像更新失败')
    } finally {
      if (input) input.value = ''
    }
  }

  // 重置表单
  const resetBasicForm = () => {
    Object.assign(basicForm, {
      username: userInfo.value.username || '',
      nickname: userInfo.value.nickname || '',
      email: userInfo.value.email || '',
      phone: userInfo.value.phone || '',
      workNumber: userInfo.value.workNumber || '',
      deptNames: userInfo.value.deptNames || ''
    })
    basicFormRef.value?.clearValidate()
  }

  const resetPasswordForm = () => {
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordFormRef.value?.clearValidate()
  }

  // 生命周期
  onMounted(async () => {
    await fetchUserInfo()
  })
</script>

<style lang="scss" scoped>
  .user-center-container {
    height: 100%;
    background: var(--art-main-bg-color);
    border-radius: calc(var(--custom-radius) + 4px);
    overflow: hidden;

    .user-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      color: white;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 32px;

        .avatar-section {
          display: flex;
          align-items: center;
          gap: 28px;

          .avatar-wrapper {
            position: relative;
            flex-shrink: 0;

            .user-avatar {
              width: 110px;
              height: 110px;
              border-radius: 50%;
              border: 5px solid rgba(255, 255, 255, 0.4);
              object-fit: cover;
              background: rgba(255, 255, 255, 0.1);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            }

            .avatar-upload {
              position: absolute;
              bottom: 2px;
              right: 2px;
              width: 36px;
              height: 36px;
              background: rgba(0, 0, 0, 0.6);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.3s;
              border: 2px solid white;

              &:hover {
                background: rgba(0, 0, 0, 0.8);
                transform: scale(1.1);
              }
            }
          }

          .user-info {
            h2 {
              font-size: 28px;
              margin-bottom: 10px;
              font-weight: 600;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            p {
              opacity: 0.95;
              margin-bottom: 14px;
              font-size: 15px;
            }

            .user-meta {
              display: flex;
              gap: 24px;
              font-size: 14px;
              opacity: 0.9;
              flex-wrap: wrap;

              span {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                backdrop-filter: blur(10px);

                .el-icon {
                  font-size: 16px;
                }
              }
            }
          }
        }

        .header-stats {
          display: flex;
          gap: 48px;

          .stat-item {
            text-align: center;
            padding: 16px 24px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            min-width: 120px;
            transition: all 0.3s;

            &:hover {
              background: rgba(255, 255, 255, 0.25);
              transform: translateY(-2px);
            }

            .stat-icon {
              font-size: 24px;
              margin-bottom: 8px;
              opacity: 0.9;
            }

            .stat-value {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 6px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .stat-label {
              font-size: 13px;
              opacity: 0.85;
              font-weight: 500;
            }
          }
        }
      }
    }

    .user-content {
      padding: 28px;
      height: calc(100% - 210px);

      .user-tabs {
        height: 100%;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);

        .tab-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;

          .el-icon {
            font-size: 18px;
          }
        }

        :deep(.el-tabs__header) {
          background: #f8f9fa;
          border-radius: 12px 0 0 12px;
          margin: 0;
        }

        :deep(.el-tabs__nav-wrap) {
          padding: 16px 0;
        }

        :deep(.el-tabs__content) {
          height: 100%;
          padding-left: 24px;
          overflow: hidden;
        }

        :deep(.el-tabs__item) {
          height: 52px;
          line-height: 52px;
          font-size: 14px;
          color: #606266;
          border-radius: 0;
          margin: 0 16px;
          padding: 0 24px;
          transition: all 0.3s;

          &:hover {
            color: #409eff;
            background: rgba(64, 158, 255, 0.08);
          }

          &.is-active {
            background: white;
            font-weight: 600;
            color: #409eff;
            border-radius: 12px 0 0 12px;
            box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
          }
        }

        .tab-content {
          padding: 28px;
          height: 100%;
          overflow-y: auto;

          .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 28px;
            padding-bottom: 14px;
            border-bottom: 2px solid #e4e7ed;
            color: #303133;
            display: flex;
            align-items: center;
            gap: 10px;
            position: relative;

            .el-icon {
              font-size: 22px;
              color: #409eff;
            }

            &::before {
              content: '';
              position: absolute;
              left: 0;
              bottom: -2px;
              width: 60px;
              height: 3px;
              background: linear-gradient(90deg, #409eff 0%, transparent 100%);
            }
          }

          .form-description {
            margin-bottom: 28px;

            :deep(.el-alert) {
              border-radius: 8px;
              border-left-width: 4px;
            }
          }

          .user-form {
            max-width: 860px;

            &.password-form {
              max-width: 540px;
            }

            :deep(.el-form-item) {
              margin-bottom: 28px;
            }

            :deep(.el-form-item__label) {
              font-weight: 600;
              color: #303133;
            }

            :deep(.el-input__wrapper) {
              transition: all 0.3s;
              box-shadow: 0 0 0 1px #dcdfe6 inset;

              &:hover {
                box-shadow: 0 0 0 1px #c0c4cc inset;
              }

              &.is-focus {
                box-shadow: 0 0 0 1px #409eff inset;
              }
            }

            :deep(.el-button) {
              border-radius: 8px;
              font-weight: 600;
              padding: 12px 24px;
              transition: all 0.3s;
              display: inline-flex;
              align-items: center;
              gap: 6px;

              &:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(64, 158, 255, 0.25);
              }

              &.is-loading {
                transform: none;
              }
            }
          }

          .security-tips {
            background: linear-gradient(135deg, #fff4e6 0%, #fef7e0 100%);
            border: 2px solid #fcd34d;
            border-left: 5px solid #f59e0b;
            padding: 18px 24px;
            margin-bottom: 28px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 14px;
            color: #92400e;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.12);

            .tip-icon {
              font-size: 24px;
              color: #f59e0b;
              flex-shrink: 0;
            }

            span {
              font-size: 14px;
              line-height: 1.6;
              font-weight: 500;
            }
          }

          .password-strength {
            margin-top: 14px;
            display: flex;
            align-items: center;
            gap: 14px;
            font-size: 13px;
            padding: 10px 14px;
            background: #f8f9fa;
            border-radius: 8px;

            .strength-bar {
              flex: 1;
              max-width: 220px;
              height: 10px;
              background: #e5e7eb;
              border-radius: 5px;
              overflow: hidden;
              position: relative;

              .strength-level {
                height: 100%;
                transition: all 0.3s ease;
                position: relative;

                &::after {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.4) 50%,
                    transparent 100%
                  );
                  animation: shimmer 2s infinite;
                }

                &.weak {
                  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
                }

                &.medium {
                  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
                }

                &.strong {
                  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
                }
              }
            }

            .strength-text {
              color: #6b7280;
              min-width: 24px;
              font-weight: 600;
            }
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          .roles-list {
            display: flex;
            flex-wrap: wrap;
            gap: 18px;

            .role-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 14px 24px;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 28px;
              font-size: 15px;
              color: #475569;
              border: 2px solid #e2e8f0;
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

              &::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(255, 255, 255, 0.5),
                  transparent
                );
                transition: left 0.5s;
              }

              &:hover {
                background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
                border-color: #94a3b8;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);

                &::before {
                  left: 100%;
                }
              }

              .role-icon {
                font-size: 20px;
                color: #64748b;
                flex-shrink: 0;
              }

              span {
                font-weight: 600;
              }
            }
          }
        }
      }
    }
  }

  :root {
    --art-main-bg-color: #f5f7fa;
    --custom-radius: 8px;
  }
</style>
