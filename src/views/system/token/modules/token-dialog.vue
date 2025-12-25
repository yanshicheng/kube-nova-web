<template>
  <ElDialog v-model="visible" title="新增Token" width="600px" align-center @close="handleClose">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" :disabled="loading">
      <!-- 角色选择 -->
      <ElFormItem label="所属角色" prop="ownerId">
        <ElSelect v-model="formData.ownerId" placeholder="请选择角色" style="width: 100%">
          <ElOption v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="Token名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入Token名称" maxlength="50" />
      </ElFormItem>

      <ElFormItem label="Token类型" prop="type">
        <ElRadioGroup v-model="formData.type">
          <ElRadio :label="1">临时（24小时）</ElRadio>
          <ElRadio :label="2">长期（90天）</ElRadio>
          <ElRadio :label="3">永久</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="过期时间" prop="expireTime" v-if="formData.type !== 3">
        <ElDatePicker
          v-model="expireDate"
          type="datetime"
          placeholder="选择过期时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled-date="disabledDate"
        />
      </ElFormItem>

      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="formData.status">
          <ElRadio :label="1">启用</ElRadio>
          <ElRadio :label="0">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <!-- 显示生成的Token（仅在新增成功后显示） -->
      <ElFormItem label="生成的Token" v-if="generatedToken">
        <ElInput v-model="generatedToken" readonly type="textarea" :rows="3">
          <template #append>
            <ElButton @click="copyGeneratedToken">复制</ElButton>
          </template>
        </ElInput>
        <div style="color: #e6a23c; margin-top: 5px; font-size: 12px">
          请妥善保存Token，关闭对话框后将无法再次查看完整Token
        </div>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose">{{ generatedToken ? '关闭' : '取消' }}</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading" v-if="!generatedToken">
          生成Token
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { addTokenApi, type TokenSysToken, type TokenAddRequest } from '@/api/portal/token'
  import { searchRoleApi, type RoleSysRole } from '@/api/portal/role'

  interface Props {
    modelValue: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void

    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false
  })

  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 表单实例
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const generatedToken = ref('')
  const expireDate = ref<string>('')

  // 角色列表
  const roleList = ref<RoleSysRole[]>([])

  // 表单数据
  const formData = reactive({
    ownerType: 2, // 固定为角色类型
    ownerId: undefined as number | undefined,
    name: '',
    type: 2, // 默认长期
    expireTime: undefined as number | undefined,
    status: 1
  })

  // 表单验证规则
  const rules: FormRules = {
    ownerId: [{ required: true, message: '请选择角色', trigger: 'change' }],
    name: [
      { required: true, message: '请输入Token名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    type: [{ required: true, message: '请选择Token类型', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  // 加载角色列表
  const loadRoleList = async () => {
    try {
      const res = await searchRoleApi({ page: 1, pageSize: 100 })
      roleList.value = res.items || []
    } catch (error) {
      console.error('加载角色列表失败:', error)
    }
  }

  // 禁用今天之前的日期
  const disabledDate = (time: Date) => {
    return time.getTime() < Date.now() - 8.64e7 // 禁用今天之前的日期
  }

  // 监听Token类型变化，自动设置过期时间
  watch(
    () => formData.type,
    (newType) => {
      if (newType === 1) {
        // 临时：24小时后
        const date = new Date()
        date.setHours(date.getHours() + 24)
        expireDate.value = formatDate(date)
        formData.expireTime = Math.floor(date.getTime() / 1000)
      } else if (newType === 2) {
        // 长期：90天后
        const date = new Date()
        date.setDate(date.getDate() + 90)
        expireDate.value = formatDate(date)
        formData.expireTime = Math.floor(date.getTime() / 1000)
      } else if (newType === 3) {
        // 永久：清空过期时间
        expireDate.value = ''
        formData.expireTime = undefined
      }
    }
  )

  // 监听日期选择器变化
  watch(
    () => expireDate.value,
    (newDate) => {
      if (newDate && formData.type !== 3) {
        formData.expireTime = Math.floor(new Date(newDate).getTime() / 1000)
      }
    }
  )

  // 格式化日期
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  // 初始化表单数据
  const initFormData = async () => {
    generatedToken.value = '' // 清空生成的Token

    // 重置表单
    Object.assign(formData, {
      ownerType: 2,
      ownerId: undefined,
      name: '',
      type: 2,
      expireTime: undefined,
      status: 1
    })

    // 设置默认过期时间（90天后）
    const date = new Date()
    date.setDate(date.getDate() + 90)
    expireDate.value = formatDate(date)
    formData.expireTime = Math.floor(date.getTime() / 1000)
  }

  // 监听对话框状态变化
  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal) {
        await loadRoleList()
        await initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    }
  )

  // 复制生成的Token
  const copyGeneratedToken = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken.value)
      ElMessage.success('Token已复制到剪贴板')
    } catch (error) {
    }
  }

  // 关闭对话框
  const handleClose = () => {
    visible.value = false
    formRef.value?.resetFields()
    loading.value = false
    generatedToken.value = ''
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      loading.value = true

      // 新增Token
      const addData: TokenAddRequest = {
        ownerType: 2, // 固定为角色类型
        ownerId: formData.ownerId!,
        name: formData.name,
        type: formData.type,
        expireTime: formData.expireTime,
        status: formData.status
      }

      const res = await addTokenApi(addData)
      generatedToken.value = res.token
      ElMessage.success('Token生成成功')
      emit('success')
    } catch (error: any) {
      if (error === false) {
        // 表单验证失败
      } else {
        console.error('提交失败:', error)
      }
    } finally {
      loading.value = false
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
