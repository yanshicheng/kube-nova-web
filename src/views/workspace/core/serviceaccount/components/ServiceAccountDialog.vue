<template>
  <ElDialog
    :model-value="visible"
    :title="dialogType === 'add' ? '创建 ServiceAccount' : '编辑 ServiceAccount'"
    width="800px"
    top="5vh"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
    @closed="handleClosed"
  >
    <!-- 编辑模式切换 -->
    <div class="mode-switch">
      <ElRadioGroup v-model="editMode" size="small">
        <ElRadioButton value="form">
          <div class="radio-content">
            <FormInput :size="13" />
            <span>表单编辑</span>
          </div>
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <div class="radio-content">
            <Code :size="13" />
            <span>YAML 编辑</span>
          </div>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 加载状态 -->
    <div v-if="dataLoading" style="text-align: center; padding: 30px">
      <ElSkeleton :rows="6" animated />
      <div style="margin-top: 12px; color: #909399; font-size: 13px">
        正在加载 ServiceAccount 配置...
      </div>
    </div>

    <!-- 表单模式 -->
    <div v-else-if="editMode === 'form'" class="form-content">
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="140px">
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <ShieldCheck :size="16" />
              <span>基础信息</span>
            </div>
          </div>

          <ElFormItem label="名称" prop="name" required>
            <ElInput
              v-model="formData.name"
              placeholder="例如: my-service-account"
              :disabled="dialogType === 'edit'"
              maxlength="63"
              show-word-limit
            >
              <template #suffix>
                <ElTooltip
                  content="小写字母、数字、连字符，以字母或数字开头结尾"
                  placement="top"
                >
                  <HelpCircle :size="13" class="help-icon" />
                </ElTooltip>
              </template>
            </ElInput>
          </ElFormItem>
        </div>

        <!-- Secrets 配置 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <Key :size="16" />
              <span>Secrets</span>
              <span class="optional-mark">可选</span>
            </div>
            <ElTooltip placement="top">
              <template #content>
                <div>关联到此 ServiceAccount 的 Secrets</div>
                <div>Pod 可以通过挂载卷的方式访问这些 Secrets</div>
              </template>
              <HelpCircle :size="13" class="help-icon" />
            </ElTooltip>
          </div>

          <div v-if="formData.secrets.length > 0" class="secrets-list">
            <div v-for="(secret, index) in formData.secrets" :key="index" class="secret-item">
              <div class="secret-content">
                <Key :size="14" class="secret-icon" />
                <ElInput
                  v-model="formData.secrets[index]"
                  placeholder="输入 Secret 名称"
                  style="flex: 1"
                />
              </div>
              <ElButton
                type="danger"
                :icon="Trash2"
                circle
                size="small"
                @click="removeSecret(index)"
              />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addSecret">
            添加 Secret
          </ElButton>
        </div>

        <!-- Image Pull Secrets -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <ImageIcon :size="16" />
              <span>Image Pull Secrets</span>
              <span class="optional-mark">可选</span>
            </div>
            <ElTooltip placement="top">
              <template #content>
                <div>用于拉取私有镜像仓库的认证凭据</div>
                <div>Pod 会自动使用这些凭据来拉取容器镜像</div>
              </template>
              <HelpCircle :size="13" class="help-icon" />
            </ElTooltip>
          </div>

          <div v-if="formData.imagePullSecrets.length > 0" class="secrets-list">
            <div
              v-for="(secret, index) in formData.imagePullSecrets"
              :key="index"
              class="secret-item image-pull"
            >
              <div class="secret-content">
                <ImageIcon :size="14" class="secret-icon" />
                <ElInput
                  v-model="formData.imagePullSecrets[index]"
                  placeholder="输入 Image Pull Secret 名称"
                  style="flex: 1"
                />
              </div>
              <ElButton
                type="danger"
                :icon="Trash2"
                circle
                size="small"
                @click="removeImagePullSecret(index)"
              />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addImagePullSecret">
            添加 Image Pull Secret
          </ElButton>
        </div>

        <!-- Token 挂载 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <Shield :size="16" />
              <span>Token 配置</span>
            </div>
          </div>

          <div class="token-config">
            <div class="config-item">
              <div class="config-label">
                <span>自动挂载 ServiceAccount Token</span>
                <ElTooltip placement="top">
                  <template #content>
                    <div>启用后，Pod 会自动挂载此 ServiceAccount 的 Token</div>
                    <div>Token 用于 Pod 内部访问 Kubernetes API</div>
                    <div style="color: #f56c6c; margin-top: 4px">
                      ⚠️ 出于安全考虑，建议仅在需要时启用
                    </div>
                  </template>
                  <HelpCircle :size="13" class="help-icon" />
                </ElTooltip>
              </div>
              <ElSwitch v-model="formData.automountServiceAccountToken" size="default" />
            </div>
          </div>
        </div>

        <!-- 标签 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <Tag :size="16" />
              <span>标签 (Labels)</span>
              <span class="optional-mark">可选</span>
            </div>
          </div>

          <div v-if="formData.labels.length > 0" class="labels-list">
            <div v-for="(item, index) in formData.labels" :key="index" class="label-row">
              <ElInput v-model="item.key" placeholder="键" style="width: 200px" maxlength="63" />
              <span class="separator">=</span>
              <ElInput v-model="item.value" placeholder="值" style="flex: 1" maxlength="63" />
              <ElButton
                type="danger"
                :icon="Trash2"
                circle
                size="small"
                @click="removeLabel(index)"
              />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addLabel"> 添加标签 </ElButton>
        </div>

        <!-- 注解 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <FileText :size="16" />
              <span>注解 (Annotations)</span>
              <span class="optional-mark">可选</span>
            </div>
          </div>

          <div v-if="formData.annotations.length > 0" class="annotations-list">
            <div v-for="(item, index) in formData.annotations" :key="index" class="annotation-row">
              <ElInput
                v-model="item.key"
                placeholder="键"
                style="width: 240px"
                maxlength="253"
              />
              <span class="separator">=</span>
              <ElInput v-model="item.value" placeholder="值" style="flex: 1" />
              <ElButton
                type="danger"
                :icon="Trash2"
                circle
                size="small"
                @click="removeAnnotation(index)"
              />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addAnnotation">
            添加注解
          </ElButton>
        </div>
      </ElForm>
    </div>

    <!-- YAML 模式 -->
    <div v-else-if="editMode === 'yaml'" class="yaml-content">
      <ArtYamlEditor v-model="yamlContent" height="600px" @change="handleYamlChange" />
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">
        {{ dialogType === 'add' ? '创建' : '更新' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch, nextTick, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import yaml from 'js-yaml'
  import {
    ShieldCheck,
    Key,
    ImageIcon,
    Shield,
    Tag,
    FileText,
    FormInput,
    Code,
    Plus,
    Trash2,
    HelpCircle
  } from 'lucide-vue-next'
  import {
    createServiceAccountApi,
    updateServiceAccountApi,
    getServiceAccountYamlApi,
    type ServiceAccountListItem,
    type ProjectWorkspace
  } from '@/api/workload/core'
  import ArtYamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    visible: boolean
    dialogType: 'add' | 'edit'
    saData?: ServiceAccountListItem
    workspace: ProjectWorkspace | null
  }

  interface KeyValue {
    key: string
    value: string
  }

  const props = withDefaults(defineProps<Props>(), {
    saData: undefined
  })

  const emit = defineEmits(['close', 'success'])

  const formRef = ref()
  const editMode = ref<'form' | 'yaml'>('form')
  const submitting = ref(false)
  const dataLoading = ref(false)
  const yamlContent = ref('')

  const formData = ref({
    name: '',
    secrets: [] as string[],
    imagePullSecrets: [] as string[],
    automountServiceAccountToken: true,
    labels: [] as KeyValue[],
    annotations: [] as KeyValue[]
  })

  const formRules = {
    name: [
      { required: true, message: '请输入 ServiceAccount 名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '名称格式不正确',
        trigger: 'blur'
      }
    ]
  }

  const handleClose = (val: boolean) => {
    if (!val) {
      emit('close')
    }
  }

  // Secrets 管理
  const addSecret = () => {
    formData.value.secrets.push('')
  }

  const removeSecret = (index: number) => {
    formData.value.secrets.splice(index, 1)
  }

  // Image Pull Secrets 管理
  const addImagePullSecret = () => {
    formData.value.imagePullSecrets.push('')
  }

  const removeImagePullSecret = (index: number) => {
    formData.value.imagePullSecrets.splice(index, 1)
  }

  // Labels 管理
  const addLabel = () => {
    formData.value.labels.push({ key: '', value: '' })
  }

  const removeLabel = (index: number) => {
    formData.value.labels.splice(index, 1)
  }

  // Annotations 管理
  const addAnnotation = () => {
    formData.value.annotations.push({ key: '', value: '' })
  }

  const removeAnnotation = (index: number) => {
    formData.value.annotations.splice(index, 1)
  }

  // 工具函数
  const objectToArray = (obj?: Record<string, string>): KeyValue[] => {
    if (!obj) return []
    return Object.entries(obj)
      .filter(([key]) => key)
      .map(([key, value]) => ({ key, value }))
  }

  const arrayToObject = (arr: KeyValue[]): Record<string, string> => {
    const obj: Record<string, string> = {}
    arr.forEach((item) => {
      if (item.key && item.key.trim()) {
        obj[item.key.trim()] = item.value
      }
    })
    return obj
  }

  // 表单转 YAML
  const formToYaml = () => {
    const saObj: any = {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: formData.value.name || 'service-account-name',
        namespace: props.workspace?.namespace || 'default'
      }
    }

    // Labels
    const labelsObj = arrayToObject(formData.value.labels)
    if (Object.keys(labelsObj).length > 0) {
      saObj.metadata.labels = labelsObj
    }

    // Annotations
    const annotationsObj = arrayToObject(formData.value.annotations)
    if (Object.keys(annotationsObj).length > 0) {
      saObj.metadata.annotations = annotationsObj
    }

    // Secrets
    if (formData.value.secrets.length > 0) {
      saObj.secrets = formData.value.secrets
        .filter((s) => s.trim())
        .map((s) => ({ name: s.trim() }))
    }

    // Image Pull Secrets
    if (formData.value.imagePullSecrets.length > 0) {
      saObj.imagePullSecrets = formData.value.imagePullSecrets
        .filter((s) => s.trim())
        .map((s) => ({ name: s.trim() }))
    }

    // Automount Token
    if (formData.value.automountServiceAccountToken === false) {
      saObj.automountServiceAccountToken = false
    }

    yamlContent.value = yaml.dump(saObj, { indent: 2 })
  }

  // YAML 转表单
  const yamlToForm = (yamlStr: string) => {
    try {
      const obj = yaml.load(yamlStr) as any

      formData.value.name = obj.metadata?.name || ''

      // Secrets
      formData.value.secrets = obj.secrets?.map((s: any) => s.name) || []

      // Image Pull Secrets
      formData.value.imagePullSecrets = obj.imagePullSecrets?.map((s: any) => s.name) || []

      // Automount Token
      formData.value.automountServiceAccountToken = obj.automountServiceAccountToken !== false

      // Labels
      formData.value.labels = objectToArray(obj.metadata?.labels)

      // Annotations
      formData.value.annotations = objectToArray(obj.metadata?.annotations)
    } catch (error) {
      console.error('YAML 解析失败:', error)
      throw error
    }
  }

  // 加载 YAML
  const loadServiceAccountYAML = async () => {
    if (!props.workspace || !props.saData) {
      return
    }

    dataLoading.value = true
    try {
      const yamlStr = await getServiceAccountYamlApi({
        clusterUuid: props.workspace.clusterUuid!,
        namespace: props.workspace.namespace!,
        name: props.saData.name
      })

      yamlContent.value = yamlStr
      yamlToForm(yamlStr)
    } catch (error: any) {
      console.error('加载失败:', error)
      emit('close')
    } finally {
      dataLoading.value = false
    }
  }

  // 监听对话框打开
  watch(
    () => props.visible,
    async (val) => {
      if (val) {
        if (props.dialogType === 'edit' && props.saData && props.workspace) {
          await loadServiceAccountYAML()
        } else if (props.dialogType === 'add') {
          await nextTick()
          formToYaml()
        }
      }
    },
    { immediate: true }
  )

  // 监听编辑模式切换
  watch(editMode, (newMode, oldMode) => {
    if (newMode === 'yaml' && oldMode === 'form') {
      formToYaml()
    } else if (newMode === 'form' && oldMode === 'yaml') {
      try {
        yamlToForm(yamlContent.value)
        ElMessage.success('已切换到表单模式')
      } catch (error) {
        ElMessage.error('YAML 格式错误，无法切换到表单模式')
        nextTick(() => {
          editMode.value = 'yaml'
        })
      }
    }
  })

  // 监听表单数据变化
  watch(
    () => formData.value,
    () => {
      if (editMode.value === 'form' && !dataLoading.value) {
        formToYaml()
      }
    },
    { deep: true }
  )

  const handleYamlChange = (content: string) => {
    yamlContent.value = content
  }

  // 提交
  const handleSubmit = async () => {
    if (!props.workspace) {
      return
    }

    if (editMode.value === 'form') {
      try {
        await formRef.value?.validate()
      } catch (error) {
        return
      }

      formToYaml()
    }

    submitting.value = true
    try {
      if (props.dialogType === 'add') {
        await createServiceAccountApi({
          clusterUuid: props.workspace.clusterUuid!,
          namespace: props.workspace.namespace!,
          yamlStr: yamlContent.value
        })
        ElMessage.success('创建成功')
      } else {
        await updateServiceAccountApi({
          clusterUuid: props.workspace.clusterUuid!,
          namespace: props.workspace.namespace!,
          name: formData.value.name,
          yamlStr: yamlContent.value
        })
        ElMessage.success('更新成功')
      }

      emit('success')
      emit('close')
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const handleCancel = () => {
    emit('close')
  }

  const handleClosed = () => {
    formRef.value?.resetFields()
    formData.value = {
      name: '',
      secrets: [],
      imagePullSecrets: [],
      automountServiceAccountToken: true,
      labels: [],
      annotations: []
    }
    yamlContent.value = ''
    editMode.value = 'form'
  }
</script>

<style lang="scss" scoped>
  .mode-switch {
    margin-bottom: 14px;
    display: flex;
    justify-content: flex-end;

    .radio-content {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
    }
  }

  .form-content {
    max-height: 65vh;
    overflow-y: auto;
    padding-right: 6px;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }
  }

  .form-section {
    margin-bottom: 20px;
    padding: 18px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 10px;
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: #d0d3d9;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e4e7ed;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #303133;

        svg {
          color: #409eff;
        }
      }

      .optional-mark {
        margin-left: 8px;
        font-size: 11px;
        font-weight: 400;
        color: #909399;
        background: #f4f4f5;
        padding: 2px 8px;
        border-radius: 10px;
      }
    }
  }

  .help-icon {
    cursor: help;
    color: #909399;
    transition: color 0.2s;

    &:hover {
      color: #606266;
    }
  }

  .secrets-list,
  .labels-list,
  .annotations-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }

  .secret-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    transition: all 0.2s;

    &:hover {
      border-color: #c0c4cc;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    &.image-pull {
      border-left: 3px solid #f56c6c;
    }

    .secret-content {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .secret-icon {
        color: #67c23a;
        flex-shrink: 0;
      }
    }

    &.image-pull .secret-icon {
      color: #f56c6c;
    }
  }

  .token-config {
    .config-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e4e7ed;

      .config-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 500;
        color: #303133;
      }
    }
  }

  .label-row,
  .annotation-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    transition: all 0.2s;

    &:hover {
      border-color: #c0c4cc;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    .separator {
      color: #6c757d;
      font-weight: 600;
      font-size: 13px;
      flex-shrink: 0;
    }
  }

  .yaml-content {
    min-height: 550px;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }

  :deep(.el-input__inner) {
    font-size: 13px;
  }

  :deep(.el-switch) {
    --el-switch-on-color: #67c23a;
  }
</style>