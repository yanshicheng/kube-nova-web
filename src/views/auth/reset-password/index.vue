<!-- 重置密码页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">重置密码</h3>
          <p class="sub-title">首次登录需要重置密码</p>
          <ElForm
            class="mt-7.5"
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
          >
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                v-model.trim="formData.username"
                placeholder="请输入用户名"
                :disabled="true"
              />
            </ElFormItem>

            <ElFormItem prop="oldPassword">
              <ElInput
                class="custom-height"
                v-model.trim="formData.oldPassword"
                placeholder="请输入当前密码"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="newPassword">
              <ElInput
                class="custom-height"
                v-model.trim="formData.newPassword"
                placeholder="请输入新密码"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="confirmPassword">
              <ElInput
                class="custom-height"
                v-model.trim="formData.confirmPassword"
                placeholder="请再次输入新密码"
                type="password"
                autocomplete="off"
                @keyup.enter="handleResetPassword"
                show-password
              />
            </ElFormItem>

            <div style="margin-top: 15px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleResetPassword"
                :loading="loading"
                v-ripple
              >
                确认重置
              </ElButton>
            </div>

            <div style="margin-top: 15px">
              <ElButton class="w-full custom-height" plain @click="toLogin">
                返回登录
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { updateUserPasswordApi } from '@/api/portal/user'
  import { HttpError } from '@/utils/http/error'

  defineOptions({ name: 'ResetPassword' })

  interface ResetPasswordForm {
    username: string
    oldPassword: string
    newPassword: string
    confirmPassword: string
  }

  const PASSWORD_MIN_LENGTH = 6
  const REDIRECT_DELAY = 1500

  const router = useRouter()
  const route = useRoute()
  const formRef = ref<FormInstance>()

  const loading = ref(false)

  const formData = reactive<ResetPasswordForm>({
    username: (route.query.username as string) || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  /**
   * 验证新密码
   */
  const validateNewPassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error('请输入新密码'))
      return
    }

    if (value.length < PASSWORD_MIN_LENGTH) {
      callback(new Error('密码长度不能少于6位'))
      return
    }

    if (formData.confirmPassword) {
      formRef.value?.validateField('confirmPassword')
    }

    callback()
  }

  /**
   * 验证确认密码
   */
  const validateConfirmPassword = (
    _rule: any,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (!value) {
      callback(new Error('请再次输入新密码'))
      return
    }

    if (value !== formData.newPassword) {
      callback(new Error('两次输入的密码不一致'))
      return
    }

    callback()
  }

  const rules: FormRules<ResetPasswordForm> = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    oldPassword: [
      { required: true, message: '请输入当前密码', trigger: 'blur' },
      { min: PASSWORD_MIN_LENGTH, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    newPassword: [
      { required: true, validator: validateNewPassword, trigger: 'blur' }
    ],
    confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }]
  }

  /**
   * 重置密码
   */
  const handleResetPassword = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      loading.value = true

      await updateUserPasswordApi({
        username: formData.username,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      })

      ElMessage.success('密码重置成功，请重新登录')
      toLogin()
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('[ResetPassword] 重置密码失败:', error.message)
      } else {
        console.error('[ResetPassword] 表单验证失败:', error)
      }
      loading.value = false
    }
  }

  /**
   * 跳转到登录页面
   */
  const toLogin = () => {
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, REDIRECT_DELAY)
  }
</script>

<style scoped>
  @import '../login/style.css';
</style>