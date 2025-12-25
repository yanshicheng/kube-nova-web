<template>
  <el-dialog
    v-model="visible"
    title="重命名"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="新名称" prop="newName">
        <el-input
          v-model="form.newName"
          placeholder="请输入新名称"
          @keyup.enter="handleConfirm"
        >
          <template #prefix>
            <i class="mdi mdi-rename-box"></i>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm"> 确定 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { movePodFileApi, type FileInfo } from '@/api'

const props = defineProps<{
  modelValue: boolean
  workspaceId: number
  podName: string
  container: string
  file: FileInfo | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  newName: ''
})

const rules: FormRules = {
  newName: [
    { required: true, message: '请输入新名称', trigger: 'blur' },
    {
      pattern: /^[^<>:"|?*\\/]+$/,
      message: '名称不能包含特殊字符',
      trigger: 'blur'
    }
  ]
}

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val && props.file) {
      form.newName = props.file.name
      formRef.value?.clearValidate()
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

async function handleConfirm() {
  if (!formRef.value || !props.file) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (form.newName === props.file.name) {
    return
  }

  loading.value = true

  try {
    const pathParts = props.file.path.split('/')
    pathParts[pathParts.length - 1] = form.newName
    const newPath = pathParts.join('/')

    await movePodFileApi({
      workloadId: props.workspaceId,
      podName: props.podName,
      container: props.container || undefined,
      sourcePath: props.file.path,
      destPath: newPath
    })

    ElMessage.success('重命名成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    console.error('重命名失败:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  visible.value = false
}
</script>