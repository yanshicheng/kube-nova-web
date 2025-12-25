<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="1100px"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <!-- 顶部工具栏 -->
    <div class="dialog-toolbar">
      <!-- 帮助按钮 -->
      <ElPopover placement="bottom-start" :width="500" trigger="click">
        <template #reference>
          <ElButton :icon="InfoCircleIcon" circle size="small" />
        </template>
        <div class="help-popover">
          <h4>ClusterRole 使用说明</h4>
          <div class="help-content">
            <p><strong>什么是 ClusterRole？</strong></p>
            <p>ClusterRole 是集群级别的权限角色，用于定义对集群资源的访问权限。</p>

            <p><strong>两种模式：</strong></p>
            <ul>
              <li><strong>标准模式：</strong>直接定义权限规则（verbs、apiGroups、resources）</li>
              <li><strong>聚合模式：</strong>通过标签选择器自动聚合其他 ClusterRole 的权限</li>
            </ul>

            <p><strong>注意事项：</strong></p>
            <ul>
              <li>系统内置角色（如 cluster-admin、view 等）不建议修改</li>
              <li>权限变更可能影响现有的绑定关系</li>
            </ul>
          </div>
        </div>
      </ElPopover>

      <!-- 编辑模式切换 -->
      <ElRadioGroup v-model="editMode" size="small">
        <ElRadioButton value="form">
          <FormInputIcon :size="14" />
          <span>表单</span>
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <FileCodeIcon :size="14" />
          <span>YAML</span>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 转换错误提示 -->
    <ElAlert
      v-if="convertError"
      :title="convertError"
      type="error"
      :closable="true"
      @close="convertError = ''"
      style="margin-bottom: 16px"
      show-icon
    />

    <div v-show="editMode === 'form'" class="form-container">
      <ClusterRoleForm
        ref="formRef"
        v-model="formData"
        :disabled="loading"
        :is-edit="dialogType === 'edit'"
      />
    </div>

    <div v-show="editMode === 'yaml'" class="yaml-container">
      <YamlEditorPro
        v-model="yamlContent"
        :readonly="loading"
        :filename="`${formData.name || 'clusterrole'}.yaml`"
        :show-toolbar="true"
        :show-status-bar="true"
        height="500px"
        @valid-change="handleYamlValidChange"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" :disabled="loading">取消</ElButton>
        <ElButton
          type="primary"
          @click="handleSubmit"
          :loading="loading"
          :disabled="editMode === 'yaml' && !isYamlValid"
        >
          {{ loading ? '提交中...' : submitText }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    FormInput as FormInputIcon,
    FileCode as FileCodeIcon,
    Info as InfoCircleIcon
  } from 'lucide-vue-next'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'
  import ClusterRoleForm from './cluster-role-form.vue'
  import {
    createClusterRoleApi,
    updateClusterRoleApi,
    getClusterRoleYamlApi
  } from '@/api/workload/cluster-resource'
  import {
    clusterRoleYamlToForm,
    clusterRoleFormToYaml,
    validateClusterRoleForm,
    createEmptyClusterRoleForm
  } from './type.ts'
  import type { ClusterRoleFormData } from './type.ts'

  interface Props {
    modelValue: boolean
    dialogType: 'create' | 'edit'
    clusterUuid: string
    resourceName?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    resourceName: ''
  })

  const emit = defineEmits<Emits>()

  const editMode = ref<'form' | 'yaml'>('form')
  const formData = ref<ClusterRoleFormData>(createEmptyClusterRoleForm())
  const yamlContent = ref('')
  const loading = ref(false)
  const isYamlValid = ref(true)
  const convertError = ref('')
  const isInitializing = ref(false)

  const formRef = ref()

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const dialogTitle = computed(() => {
    return props.dialogType === 'create'
      ? '创建 ClusterRole'
      : `编辑 ClusterRole: ${props.resourceName}`
  })

  const submitText = computed(() => {
    return props.dialogType === 'create' ? '创建' : '保存'
  })

  // 表单数据变化时，同步到 YAML（仅在表单模式下）
  watch(
    formData,
    () => {
      if (editMode.value === 'form' && !isInitializing.value) {
        try {
          yamlContent.value = clusterRoleFormToYaml(formData.value)
          convertError.value = ''
        } catch (error: any) {
          console.error('表单转 YAML 失败:', error)
        }
      }
    },
    { deep: true }
  )

  // 监听模式切换
  watch(editMode, (newMode, oldMode) => {
    if (!oldMode) return

    convertError.value = ''

    if (newMode === 'form' && oldMode === 'yaml') {
      // YAML -> 表单：需要验证
      try {
        const parsed = clusterRoleYamlToForm(yamlContent.value)
        formData.value = parsed
      } catch (error: any) {
        convertError.value = `YAML 转表单失败: ${error.message}`
        editMode.value = 'yaml'
      }
    }
    // 表单 -> YAML：已经通过 watch 自动同步了
  })

  // 监听弹窗打开
  watch(
    () => props.modelValue,
    async (val) => {
      if (val) {
        convertError.value = ''
        editMode.value = 'form'
        isInitializing.value = true

        if (props.dialogType === 'edit' && props.resourceName) {
          await loadExistingYaml()
        } else {
          formData.value = createEmptyClusterRoleForm()
          yamlContent.value = clusterRoleFormToYaml(formData.value)
        }

        isInitializing.value = false
      }
    }
  )

  const loadExistingYaml = async () => {
    try {
      loading.value = true

      const yaml = await getClusterRoleYamlApi({
        clusterUuid: props.clusterUuid,
        name: props.resourceName!
      })

      yamlContent.value = yaml
      formData.value = clusterRoleYamlToForm(yaml)
    } catch (error: any) {
      console.error('加载 YAML 失败:', error)
      visible.value = false
    } finally {
      loading.value = false
    }
  }

  const handleYamlValidChange = (valid: boolean) => {
    isYamlValid.value = valid
  }

  const handleClose = () => {
    if (loading.value) return
    visible.value = false
  }

  const handleSubmit = async () => {
    // 如果是 YAML 模式，先转换到表单进行验证
    if (editMode.value === 'yaml') {
      if (!isYamlValid.value) {
        ElMessage.warning('YAML 格式错误，请修正后再提交')
        return
      }

      try {
        formData.value = clusterRoleYamlToForm(yamlContent.value)
      } catch (error: any) {
        ElMessage.error(`YAML 解析失败: ${error.message}`)
        return
      }
    }

    // 验证表单
    try {
      validateClusterRoleForm(formData.value)
    } catch (error: any) {
      ElMessage.warning(error.message)
      return
    }

    // 确认修改
    if (props.dialogType === 'edit') {
      try {
        await ElMessageBox.confirm(
          `确定要保存对 ClusterRole "${formData.value.name}" 的修改吗？修改权限可能会影响现有的绑定。`,
          '确认修改',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch {
        return
      }
    }

    // 提交
    loading.value = true
    try {
      const finalYaml = clusterRoleFormToYaml(formData.value)
      const api = props.dialogType === 'create' ? createClusterRoleApi : updateClusterRoleApi
      await api({
        clusterUuid: props.clusterUuid,
        yamlStr: finalYaml
      })

      ElMessage.success(props.dialogType === 'create' ? '创建成功' : '保存成功')
      emit('success')
      visible.value = false
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .dialog-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;

    :deep(.el-radio-group) {
      .el-radio-button__inner {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  }

  .help-popover {
    h4 {
      margin: 0 0 12px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .help-content {
      font-size: 13px;
      line-height: 1.6;
      color: #606266;

      p {
        margin: 0 0 8px;

        strong {
          color: #409eff;
          font-weight: 600;
        }
      }

      ul {
        margin: 4px 0 12px;
        padding-left: 20px;

        li {
          margin-bottom: 4px;

          strong {
            color: #409eff;
          }
        }
      }
    }
  }

  .form-container {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }
  }

  .yaml-container {
    border-radius: 8px;
    overflow: hidden;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>