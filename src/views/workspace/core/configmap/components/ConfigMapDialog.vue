<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '创建 ConfigMap' : '编辑 ConfigMap'"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <!-- 编辑模式切换 -->
    <div class="mode-switch">
      <ElRadioGroup v-model="editMode" size="default">
        <ElRadioButton value="form">
          <div class="radio-content">
            <FormInput :size="14" />
            <span>表单编辑</span>
          </div>
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <div class="radio-content">
            <Code :size="14" />
            <span>YAML 编辑</span>
          </div>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 表单模式 -->
    <div v-if="editMode === 'form'" class="form-content">
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-header">
            <Database :size="16" />
            <span>基础信息</span>
            <span class="section-required">*</span>
          </div>

          <ElFormItem label="名称" prop="name">
            <ElInput
              v-model="formData.name"
              placeholder="请输入 ConfigMap 名称"
              :disabled="dialogType === 'edit'"
              maxlength="63"
              show-word-limit
            />
          </ElFormItem>
        </div>

        <!-- 标签 -->
        <div class="form-section">
          <div class="section-header">
            <Tag :size="16" />
            <span>标签</span>
            <span class="section-desc">可选，用于组织和分类资源</span>
          </div>

          <div class="key-value-list">
            <div v-for="(item, index) in formData.labels" :key="index" class="key-value-item">
              <ElInput v-model="item.key" placeholder="键" class="key-input" maxlength="63" />
              <span class="separator">=</span>
              <ElInput v-model="item.value" placeholder="值" class="value-input" maxlength="63" />
              <ElButton type="danger" :icon="Trash2" circle @click="removeLabel(index)" />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addLabel"> 添加标签 </ElButton>
        </div>

        <!-- 注解 -->
        <div class="form-section">
          <div class="section-header">
            <FileText :size="16" />
            <span>注解</span>
            <span class="section-desc">可选，用于存储元数据</span>
          </div>

          <div class="key-value-list">
            <div v-for="(item, index) in formData.annotations" :key="index" class="key-value-item">
              <ElInput v-model="item.key" placeholder="键" class="key-input" maxlength="253" />
              <span class="separator">=</span>
              <ElInput v-model="item.value" placeholder="值" class="value-input" maxlength="253" />
              <ElButton type="danger" :icon="Trash2" circle @click="removeAnnotation(index)" />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addAnnotation"> 添加注解 </ElButton>
        </div>

        <!-- 数据 -->
        <div class="form-section">
          <div class="section-header">
            <Database :size="16" />
            <span>数据</span>
            <span class="section-required">*</span>
            <span class="section-desc">至少添加一个数据项</span>
          </div>

          <div class="data-list">
            <div v-for="(item, index) in formData.data" :key="index" class="data-item">
              <div class="data-header">
                <ElInput
                  v-model="item.key"
                  placeholder="键（必填）"
                  class="data-key-input"
                  maxlength="253"
                />
                <ElButton type="danger" :icon="Trash2" circle @click="removeData(index)" />
              </div>
              <ElInput
                v-model="item.value"
                type="textarea"
                placeholder="值（支持多行文本）"
                :rows="4"
                class="data-value-input"
              />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addData"> 添加数据项 </ElButton>
        </div>
      </ElForm>
    </div>

    <!-- YAML 模式 -->
    <div v-else class="yaml-content">
      <ArtYamlEditor v-model="yamlContent" height="600px" @change="handleYamlChange" />
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleCancel">取 消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ dialogType === 'add' ? '创 建' : '更 新' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Database, Tag, FileText, FormInput, Code, Plus, Trash2 } from 'lucide-vue-next'
  import yaml from 'js-yaml'
  import {
    createConfigMapApi,
    updateConfigMapApi,
    getConfigMapDetailApi,
    type ConfigMapListItem,
    type ProjectWorkspace
  } from '@/api'
  import ArtYamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    configmapData?: ConfigMapListItem
    workspace: ProjectWorkspace | null
  }

  interface KeyValue {
    key: string
    value: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'success'])

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const formRef = ref()
  const editMode = ref<'form' | 'yaml'>('form')
  const submitting = ref(false)
  const yamlContent = ref('')

  const formData = ref({
    name: '',
    labels: [] as KeyValue[],
    annotations: [] as KeyValue[],
    data: [] as KeyValue[]
  })

  const formRules = {
    name: [
      { required: true, message: '请输入 ConfigMap 名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '名称只能包含小写字母、数字和连字符，且必须以字母或数字开头和结尾',
        trigger: 'blur'
      }
    ]
  }

  // 监听弹窗打开，加载数据
  watch(visible, async (val) => {
    if (val && props.dialogType === 'edit' && props.configmapData && props.workspace) {
      try {
        const detail = await getConfigMapDetailApi({
          workloadId: props.workspace.id,
          name: props.configmapData.name
        })

        formData.value = {
          name: detail.name,
          labels: objectToArray(detail.labels),
          annotations: objectToArray(detail.annotations),
          data: objectToArray(detail.data)
        }

        formToYaml()
      } catch (error) {
        console.error('加载 ConfigMap 详情失败:', error)
        visible.value = false
      }
    } else if (val && props.dialogType === 'add') {
      // 新增模式，初始化一个空数据项
      formData.value.data = [{ key: '', value: '' }]
      formToYaml()
    }
  })

  // 监听表单数据变化，同步到 YAML
  watch(
    () => [
      formData.value.name,
      formData.value.labels,
      formData.value.annotations,
      formData.value.data
    ],
    () => {
      if (editMode.value === 'form') {
        formToYaml()
      }
    },
    { deep: true }
  )

  const objectToArray = (obj?: Record<string, string>): KeyValue[] => {
    if (!obj) return []
    return Object.entries(obj)
      .filter(([key]) => key && key.trim())
      .map(([key, value]) => ({ key, value }))
  }

  const arrayToObject = (arr: KeyValue[]): Record<string, string> => {
    const obj: Record<string, string> = {}
    arr.forEach((item) => {
      if (item.key && item.key.trim() && item.value !== undefined) {
        obj[item.key.trim()] = item.value
      }
    })
    return obj
  }

  const formToYaml = () => {
    const labelsObj = arrayToObject(formData.value.labels)
    const annotationsObj = arrayToObject(formData.value.annotations)
    const dataObj = arrayToObject(formData.value.data)

    const configMapObj: any = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: formData.value.name || 'configmap-name',
        namespace: props.workspace?.namespace || 'default'
      },
      data: dataObj
    }

    if (Object.keys(labelsObj).length > 0) {
      configMapObj.metadata.labels = labelsObj
    }
    if (Object.keys(annotationsObj).length > 0) {
      configMapObj.metadata.annotations = annotationsObj
    }

    yamlContent.value = yaml.dump(configMapObj, { indent: 2 })
  }

  const yamlToForm = () => {
    try {
      const obj: any = yaml.load(yamlContent.value)

      if (props.workspace) {
        obj.metadata.namespace = props.workspace.namespace
      }

      formData.value = {
        name: obj.metadata?.name || '',
        labels: objectToArray(obj.metadata?.labels),
        annotations: objectToArray(obj.metadata?.annotations),
        data: objectToArray(obj.data)
      }

      formToYaml()
    } catch (error) {
      console.error('YAML 解析失败:', error)
    }
  }

  const handleYamlChange = (content: string) => {
    yamlContent.value = content
  }

  const addLabel = () => {
    formData.value.labels.push({ key: '', value: '' })
  }

  const removeLabel = (index: number) => {
    formData.value.labels.splice(index, 1)
  }

  const addAnnotation = () => {
    formData.value.annotations.push({ key: '', value: '' })
  }

  const removeAnnotation = (index: number) => {
    formData.value.annotations.splice(index, 1)
  }

  const addData = () => {
    formData.value.data.push({ key: '', value: '' })
  }

  const removeData = (index: number) => {
    formData.value.data.splice(index, 1)
  }

  const handleSubmit = async () => {
    if (!props.workspace) {
      return
    }

    if (editMode.value === 'yaml') {
      yamlToForm()
    }

    if (editMode.value === 'form') {
      try {
        await formRef.value?.validate()
      } catch (error) {
        return
      }
    }

    if (formData.value.data.length === 0) {
      return
    }

    const hasEmptyDataKey = formData.value.data.some((item) => !item.key || !item.key.trim())
    if (hasEmptyDataKey) {
      return
    }

    submitting.value = true
    try {
      const requestData = {
        workloadId: props.workspace.id,
        name: formData.value.name,
        data: arrayToObject(formData.value.data),
        labels: arrayToObject(formData.value.labels),
        annotations: arrayToObject(formData.value.annotations)
      }

      if (props.dialogType === 'add') {
        await createConfigMapApi(requestData)
        ElMessage.success('创建成功')
      } else {
        await updateConfigMapApi(requestData)
        ElMessage.success('更新成功')
      }

      emit('success')
      visible.value = false
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const handleCancel = () => {
    visible.value = false
  }

  const handleClosed = () => {
    formRef.value?.resetFields()
    formData.value = {
      name: '',
      labels: [],
      annotations: [],
      data: []
    }
    yamlContent.value = ''
    editMode.value = 'form'
  }
</script>

<style lang="scss" scoped>
  .mode-switch {
    margin-bottom: 24px;
    display: flex;
    justify-content: flex-end;

    .radio-content {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .form-content {
    max-height: 600px;
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

  .yaml-content {
    min-height: 500px;
  }

  .form-section {
    margin-bottom: 32px;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e4e7ed;
      font-size: 15px;
      font-weight: 600;
      color: #303133;

      .section-required {
        color: #f56c6c;
        font-size: 16px;
      }

      .section-desc {
        margin-left: auto;
        font-size: 13px;
        font-weight: 400;
        color: #909399;
      }
    }
  }

  .key-value-list {
    margin-bottom: 16px;

    .key-value-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #dcdfe6;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
      }

      .key-input {
        flex: 0 0 200px;
      }

      .separator {
        flex-shrink: 0;
        color: #909399;
        font-weight: 600;
        font-size: 16px;
      }

      .value-input {
        flex: 1;
      }
    }
  }

  .data-list {
    margin-bottom: 16px;

    .data-item {
      margin-bottom: 16px;
      padding: 16px;
      background: white;
      border-radius: 6px;
      border: 1px solid #dcdfe6;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
      }

      .data-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .data-key-input {
          flex: 1;
        }
      }

      .data-value-input {
        :deep(.el-textarea__inner) {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
