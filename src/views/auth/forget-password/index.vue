<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">找回密码</h3>
          <p class="sub-title">忘记密码了？</p>

          <!-- 提示信息 -->
          <ElAlert class="mt-5" title="密码找回说明" type="info" :closable="false" show-icon>
            <template #default>
              <p class="text-sm">如果您忘记了密码，请联系系统管理员进行密码重置。</p>
              <p class="text-sm mt-2">管理员将为您重置密码并通过安全方式告知您新密码。</p>
              <p class="text-sm mt-2" v-if="adminContact">
                <span class="font-semibold">管理员联系方式：</span>{{ adminContact }}
              </p>
            </template>
          </ElAlert>

          <div style="margin-top: 30px">
            <ElButton class="w-full custom-height" type="primary" @click="toLogin" v-ripple>
              返回登录
            </ElButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ForgetPassword' })

  const router = useRouter()

  // 管理员联系方式（可以从配置文件或环境变量中读取）
  // 示例：const adminContact = ref('admin@example.com 或 联系电话：xxx-xxxx-xxxx')
  const adminContact = ref('')

  const toLogin = () => {
    router.push({ name: 'Login' })
  }
</script>

<style scoped>
  @import '../login/style.css';
</style>
