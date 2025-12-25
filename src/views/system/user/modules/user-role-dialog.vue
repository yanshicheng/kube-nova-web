<template>
  <ElDialog
    v-model="visible"
    title="分配角色"
    width="500px"
    align-center
    @close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElForm ref="formRef" :model="formData" label-width="100px" :disabled="loading">
      <ElFormItem label="用户名">
        <ElInput :value="userData?.username" disabled />
      </ElFormItem>
      <ElFormItem label="昵称">
        <ElInput :value="userData?.nickname" disabled />
      </ElFormItem>
      <ElFormItem label="角色" prop="roleIds">
        <ElSelect
          v-model="formData.roleIds"
          multiple
          placeholder="请选择角色"
          style="width: 100%"
          :loading="roleLoading"
          :disabled="loading"
        >
          <ElOption v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id" />
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" :disabled="loading">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading" :disabled="loading">
          {{ loading ? '保存中...' : '保存' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance } from 'element-plus'
  import { getUserRolesApi, updateUserBindRoleApi, type UserSysUser } from '@/api/portal/user'
  import { searchRoleApi, type RoleSysRole } from '@/api/portal/role'

  interface Props {
    modelValue: boolean
    userData?: UserSysUser
    loading?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void

    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    userData: undefined,
    loading: false
  })

  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 表单实例
  const formRef = ref<FormInstance>()
  const roleLoading = ref(false)

  // 角色列表
  const roleList = ref<RoleSysRole[]>([])

  // 表单数据
  const formData = reactive({
    roleIds: [] as number[]
  })

  // 加载角色列表
  const loadRoleList = async () => {
    try {
      roleLoading.value = true
      const res = await searchRoleApi({ page: 1, pageSize: 100 })
      roleList.value = res.items || []
    } catch (error) {
      console.error('加载角色列表失败:', error)
    } finally {
      roleLoading.value = false
    }
  }

  // 加载用户角色
  const loadUserRoles = async () => {
    if (!props.userData?.id) return

    try {
      const res = await getUserRolesApi(props.userData.id)
      formData.roleIds = res.roleIds || []
    } catch (error) {
      console.error('加载用户角色失败:', error)
      formData.roleIds = []
    }
  }

  // 监听对话框状态变化
  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal) {
        // 加载角色列表
        await loadRoleList()
        // 加载用户当前角色
        await loadUserRoles()
        // 清除验证
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    }
  )

  // 关闭对话框
  const handleClose = () => {
    if (props.loading) {
      return
    }
    visible.value = false
    formData.roleIds = []
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!props.userData?.id || props.loading) return

    try {
      await updateUserBindRoleApi({
        id: props.userData.id,
        roleIds: formData.roleIds
      })

      ElMessage.success('角色分配成功')
      emit('success')
      visible.value = false
    } catch (error: any) {
      console.error('分配角色失败:', error)
    }
  }
</script>

<style lang="scss" scoped>
  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
