<template>
  <el-dialog
    v-model="visible"
    title="新建文件夹"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="文件夹名称" prop="folderName">
        <el-input
          v-model="form.folderName"
          placeholder="请输入文件夹名称"
          @keyup.enter="handleConfirm"
        >
          <template #prefix>
            <i class="mdi mdi-folder"></i>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="权限" prop="mode">
        <el-input v-model="form.mode" placeholder="默认: 0755">
          <template #prefix>
            <i class="mdi mdi-lock"></i>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm"> 创建 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { createPodDirApi } from '@/api'

const props = defineProps<{
  modelValue: boolean
  workspaceId: number
  podName: string
  container: string
  currentPath: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  folderName: '',
  mode: '0755'
})

const rules: FormRules = {
  folderName: [
    { required: true, message: '请输入文件夹名称', trigger: 'blur' },
    {
      pattern: /^[^<>:"|?*\\/]+$/,
      message: '文件夹名称不能包含特殊字符',
      trigger: 'blur'
    }
  ],
  mode: [
    {
      pattern: /^[0-7]{4}$/,
      message: '权限格式错误，应为4位八进制数',
      trigger: 'blur'
    }
  ]
}

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      form.folderName = ''
      form.mode = '0755'
      formRef.value?.clearValidate()
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

async function handleConfirm() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true

  try {
    const path =
      props.currentPath === '/'
        ? `/${form.folderName}`
        : `${props.currentPath}/${form.folderName}`

    await createPodDirApi({
      workloadId: props.workspaceId,
      podName: props.podName,
      container: props.container || undefined,
      path,
      mode: form.mode,
      createParents: true
    })

    ElMessage.success('创建成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    console.error('创建失败:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  visible.value = false
}
</script>