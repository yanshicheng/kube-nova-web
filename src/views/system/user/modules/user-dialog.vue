<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
    width="600px"
    align-center
    @close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="用户名" prop="username">
            <ElInput
              v-model="formData.username"
              placeholder="请输入用户名"
              :disabled="dialogType === 'edit' || loading"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="昵称" prop="nickname">
            <ElInput v-model="formData.nickname" placeholder="请输入昵称" :disabled="loading" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="手机号" prop="phone">
            <ElInput
              v-model="formData.phone"
              placeholder="请输入手机号"
              maxlength="11"
              :disabled="loading"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="邮箱" prop="email">
            <ElInput v-model="formData.email" placeholder="请输入邮箱" :disabled="loading" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="工号" prop="workNumber">
            <ElInput v-model="formData.workNumber" placeholder="请输入工号" :disabled="loading" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12" v-if="dialogType === 'edit'">
          <ElFormItem label="状态" prop="status">
            <ElRadioGroup v-model="formData.status" :disabled="loading">
              <ElRadio :value="1">启用</ElRadio>
              <ElRadio :value="0">禁用</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- 部门选择器独占一整行 -->
      <ElRow :gutter="20">
        <ElCol :span="24">
          <ElFormItem label="部门" prop="deptId">
            <ElTreeSelect
              v-model="formData.deptId"
              :data="deptTreeData"
              :render-after-expand="false"
              placeholder="请选择部门"
              check-strictly
              :disabled="loading"
              :loading="deptLoading"
              style="width: 100%"
              :props="{
                label: 'name',
                value: 'id'
              }"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20" v-if="dialogType === 'edit'">
        <ElCol :span="12">
          <ElFormItem label="需重置密码" prop="isNeedResetPwd">
            <ElRadioGroup v-model="formData.isNeedResetPwd" :disabled="loading">
              <ElRadio :value="1">是</ElRadio>
              <ElRadio :value="0">否</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" :disabled="loading">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading">
          {{
            loading
              ? dialogType === 'add'
                ? '新增中...'
                : '更新中...'
              : dialogType === 'add'
                ? '新增'
                : '更新'
          }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    addUserApi,
    updateUserApi,
    type UserSysUser,
    type UserAddRequest,
    type UserUpdateRequest
  } from '@/api/portal/user'
  import { getDeptTreeApi, type DeptSysDeptTree } from '@/api/portal/dept'

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    userData?: UserSysUser
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void

    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    userData: undefined
  })

  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 表单实例
  const formRef = ref<FormInstance>()
  const loading = ref(false) // 内部管理loading状态
  const deptLoading = ref(false)

  // 部门树数据
  const deptTreeData = ref<DeptSysDeptTree[]>([])

  // 表单数据
  const formData = reactive({
    id: 0,
    username: '',
    nickname: '',
    email: '',
    phone: '',
    workNumber: '',
    deptId: undefined as number | undefined,
    status: 1,
    isNeedResetPwd: 0
  })

  // 表单验证规则
  const rules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 4, max: 50, message: '长度在 4 到 50 个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9_]+$/,
        message: '用户名只能包含字母、数字和下划线',
        trigger: 'blur'
      }
    ],
    nickname: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { min: 10, max: 20, message: '长度在 10 到 20 个字符', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    workNumber: [
      { required: true, message: '请输入工号', trigger: 'blur' },
      { max: 50, message: '工号长度不能超过50个字符', trigger: 'blur' }
    ],
    deptId: [{ required: true, message: '请选择部门', trigger: 'change' }]
  }

  // 加载部门树
  const loadDeptTree = async () => {
    try {
      deptLoading.value = true
      const res = await getDeptTreeApi()
      deptTreeData.value = res || []
    } catch (error) {
      console.error('加载部门树失败:', error)
    } finally {
      deptLoading.value = false
    }
  }

  // 初始化表单数据
  const initFormData = () => {
    if (props.dialogType === 'edit' && props.userData) {
      const user = props.userData
      Object.assign(formData, {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        workNumber: user.workNumber,
        deptId: user.deptId || undefined,
        status: user.status,
        isNeedResetPwd: user.isNeedResetPwd
      })
    } else {
      // 新增时重置表单
      Object.assign(formData, {
        id: 0,
        username: '',
        nickname: '',
        email: '',
        phone: '',
        workNumber: '',
        deptId: undefined,
        status: 1,
        isNeedResetPwd: 0
      })
    }
  }

  // 监听对话框状态变化
  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal) {
        // 加载基础数据
        await loadDeptTree()
        // 初始化表单
        initFormData()
        // 清除验证
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    }
  )

  // 关闭对话框
  const handleClose = () => {
    if (loading.value) {
      return
    }
    visible.value = false
    formRef.value?.resetFields()
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      // 编辑时进行二次确认
      if (props.dialogType === 'edit') {
        await ElMessageBox.confirm(
          `确定要保存对用户"${formData.nickname || formData.username}"的修改吗？`,
          '确认修改用户',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      }

      loading.value = true // 开始loading

      if (props.dialogType === 'add') {
        // 新增用户
        const addData: UserAddRequest = {
          username: formData.username,
          nickname: formData.nickname,
          email: formData.email,
          phone: formData.phone,
          workNumber: formData.workNumber,
          deptId: formData.deptId
        }
        await addUserApi(addData)
        ElMessage.success('新增成功')
      } else {
        // 更新用户
        const updateData: UserUpdateRequest = {
          id: formData.id,
          nickname: formData.nickname,
          email: formData.email,
          phone: formData.phone,
          workNumber: formData.workNumber,
          deptId: formData.deptId || 0,
          status: formData.status,
          isNeedResetPwd: formData.isNeedResetPwd
        }
        await updateUserApi(updateData)
        ElMessage.success('更新成功')
      }

      emit('success')
      visible.value = false
    } catch (error: any) {
      if (error === 'cancel') {
        // 用户取消了确认
        return
      } else if (error === false) {
        // 表单验证失败
      } else {
        console.error('提交失败:', error)
      }
    } finally {
      loading.value = false // 结束loading
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
