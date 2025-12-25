<template>
  <div class="step-panel">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="140px">
      <div class="form-section">
        <div class="section-header">
          <ElIcon><FolderOpened /></ElIcon>
          <span>工作空间信息</span>
        </div>

        <ElFormItem label="工作空间名称" prop="name">
          <ElInput
            v-model="formData.name"
            placeholder="请输入工作空间名称，如：开发环境"
            maxlength="100"
            show-word-limit
            clearable
            @change="handleChange"
          />
          <div class="form-tip">
            <ElIcon><InfoFilled /></ElIcon>
            用于标识工作空间的友好名称，支持中英文
          </div>
        </ElFormItem>

        <ElFormItem label="命名空间" prop="namespace" :required="mode === 'create'">
          <ElInput
            v-model="formData.namespace"
            placeholder="请输入 Kubernetes 命名空间，如：dev-namespace 或 prod-env"
            maxlength="63"
            :disabled="mode === 'edit'"
            clearable
            @input="handleNamespaceInput"
            @change="handleChange"
          >
            <template #prefix>
              <ElIcon><Link /></ElIcon>
            </template>
          </ElInput>
          <div class="form-tip">
            <ElIcon><InfoFilled /></ElIcon>
            命名空间必须以小写字母开头，只能包含小写字母(a-z)和连字符(-)，且必须以字母结尾
            <span v-if="mode === 'edit'" class="warning-text">（创建后不可修改）</span>
          </div>
        </ElFormItem>

        <ElFormItem label="描述信息" prop="description">
          <ElInput
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入工作空间的用途和说明..."
            maxlength="500"
            show-word-limit
            @change="handleChange"
          />
          <div class="form-tip">
            <ElIcon><InfoFilled /></ElIcon>
            详细描述工作空间的用途、负责人、相关项目等信息
          </div>
        </ElFormItem>
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { FolderOpened, Link, InfoFilled } from '@element-plus/icons-vue'

  interface Props {
    formData: Record<string, any>
    mode: 'create' | 'edit'
  }

  interface Emits {
    (e: 'update', data: Record<string, any>): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref()

  // 验证规则
  const rules = {
    name: [
      { required: true, message: '请输入工作空间名称', trigger: 'blur' },
      { min: 1, max: 100, message: '名称长度在 1 到 100 个字符', trigger: 'blur' }
    ],
    namespace: [
      { required: true, message: '请输入命名空间', trigger: 'blur' },
      { min: 1, max: 63, message: '命名空间长度在 1 到 63 个字符', trigger: 'blur' },
      {
        pattern: /^[a-z][a-z\-]*[a-z]$|^[a-z]$/,
        message: '命名空间必须以小写字母开头和结尾，中间只能包含小写字母和连字符',
        trigger: 'blur'
      }
    ],
    description: [{ max: 500, message: '描述信息不能超过 500 个字符', trigger: 'blur' }]
  }

  // 处理命名空间输入 - 实时过滤非法字符
  const handleNamespaceInput = (value: string) => {
    const filtered = value.toLowerCase().replace(/[^a-z\-]/g, '')
    if (filtered !== value) {
      props.formData.namespace = filtered
    }
  }

  // 处理变更
  const handleChange = () => {
    emit('update', props.formData)
  }

  // 验证方法
  const validate = async () => {
    try {
      await formRef.value?.validate()
      return true
    } catch {
      return false
    }
  }

  // 暴露方法
  defineExpose({
    validate
  })
</script>

<style lang="scss" scoped>
  .step-panel {
    .form-section {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #ebeef5;

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f0f2f5;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .el-icon {
          font-size: 20px;
          color: var(--el-color-primary);
        }
      }

      .form-tip {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        margin-top: 6px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1.5;

        .el-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warning-text {
          color: var(--el-color-warning);
        }
      }
    }
  }
</style>
