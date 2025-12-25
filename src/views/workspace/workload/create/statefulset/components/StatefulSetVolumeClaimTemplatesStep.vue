<template>
  <div class="volume-claim-templates-step">
    <div class="templates-panel">
      <div class="templates-header">
        <ElButton type="primary" @click="showAddDialog = true">
          <Plus :size="14" />
          添加 PVC 模板
        </ElButton>
        <ElTag type="info">
          <Database :size="14" />
          已添加 {{ templates.length }} 个 PVC 模板
        </ElTag>
      </div>

      <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 20px">
        <template #title>StatefulSet 持久卷申请模板</template>
        PVC 模板会为每个 Pod 副本自动创建独立的 PVC，确保每个 Pod 都有自己的持久化存储。
        例如：副本数为 3 时，会创建 3 个独立的 PVC。
      </ElAlert>

      <div v-if="templates.length === 0" class="empty-templates">
        <ElEmpty description="暂无 PVC 模板" :image-size="100">
          <ElButton type="primary" @click="showAddDialog = true">
            <Plus :size="14" />
            添加第一个 PVC 模板
          </ElButton>
        </ElEmpty>
      </div>

      <div v-else class="templates-list">
        <div v-for="(template, index) in templates" :key="index" class="template-item">
          <div class="template-info">
            <div class="template-name">
              <Database :size="16" style="margin-right: 8px" />
              {{ template.metadata?.name || '未命名' }}
            </div>
            <div class="template-details">
              <ElTag size="small" type="success">
                {{ getAccessModesLabel(template.spec?.accessModes) }}
              </ElTag>
              <ElTag size="small" type="info">
                {{ template.spec?.resources?.requests?.storage || '未设置大小' }}
              </ElTag>
              <ElTag v-if="template.spec?.storageClassName" size="small">
                {{ template.spec.storageClassName }}
              </ElTag>
            </div>
            <div v-if="template.spec?.volumeMode" class="template-meta">
              卷模式: {{ template.spec.volumeMode }}
            </div>
          </div>
          <div class="template-actions">
            <ElButton size="small" @click="editTemplate(index)">
              <Edit2 :size="14" />
              编辑
            </ElButton>
            <ElButton size="small" @click="duplicateTemplate(index)">
              <Copy :size="14" />
              复制
            </ElButton>
            <ElButton size="small" type="danger" @click="removeTemplate(index)">
              <Trash2 :size="14" />
              删除
            </ElButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑 PVC 模板对话框 -->
    <ElDialog
      v-model="showAddDialog"
      :title="editingIndex === -1 ? '添加 PVC 模板' : '编辑 PVC 模板'"
      width="650px"
      :close-on-click-modal="false"
    >
      <ElForm label-width="120px">
        <!-- PVC 名称 -->
        <ElFormItem label="PVC 名称" required>
          <ElInput
            v-model="newTemplate.metadata.name"
            placeholder="data（小写字母开头）"
            :class="{ 'is-error': nameError }"
            @input="validateName"
          />
          <div v-if="nameError" class="error-message">{{ nameError }}</div>
          <div class="form-tip">
            实际 PVC 名称格式：{{ newTemplate.metadata.name || 'data' }}-{{ '[podname]' }}-[序号]
          </div>
        </ElFormItem>

        <!-- 访问模式 -->
        <ElFormItem label="访问模式" required>
          <ElCheckboxGroup v-model="selectedAccessModes">
            <ElCheckbox value="ReadWriteOnce">ReadWriteOnce (单节点读写)</ElCheckbox>
            <ElCheckbox value="ReadOnlyMany">ReadOnlyMany (多节点只读)</ElCheckbox>
            <ElCheckbox value="ReadWriteMany">ReadWriteMany (多节点读写)</ElCheckbox>
            <ElCheckbox value="ReadWriteOncePod">ReadWriteOncePod (单 Pod 读写)</ElCheckbox>
          </ElCheckboxGroup>
        </ElFormItem>

        <!-- 存储容量 -->
        <ElFormItem label="存储容量" required>
          <ElInput v-model.number="storageValue" placeholder="请输入容量" type="number">
            <template #append>
              <ElSelect v-model="storageUnit" style="width: 70px">
                <ElOption label="Gi" value="Gi" />
                <ElOption label="Mi" value="Mi" />
                <ElOption label="Ti" value="Ti" />
              </ElSelect>
            </template>
          </ElInput>
        </ElFormItem>

        <!-- 存储类 -->
        <ElFormItem label="存储类 (StorageClass)">
          <ElSelect
            v-model="newTemplate.spec.storageClassName"
            filterable
            allow-create
            clearable
            placeholder="留空使用默认存储类"
            style="width: 100%"
            :loading="storageClassLoading"
          >
            <ElOption v-for="sc in storageClasses" :key="sc.name" :label="sc.name" :value="sc.name">
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>{{ sc.name }}</span>
                <div style="display: flex; gap: 4px; align-items: center">
                  <ElTag v-if="sc.isDefault" size="small" type="success">默认</ElTag>
                  <ElTag size="small" type="info">{{ sc.provisioner }}</ElTag>
                </div>
              </div>
            </ElOption>
          </ElSelect>
          <div class="form-tip">
            <span v-if="storageClasses.length === 0 && !storageClassLoading">
              未找到可用的 StorageClass
            </span>
            <span v-else-if="storageClassLoading">加载中...</span>
            <span v-else> 共 {{ storageClasses.length }} 个可用的 StorageClass </span>
          </div>
        </ElFormItem>

        <!-- 卷模式 -->
        <ElFormItem label="卷模式">
          <ElRadioGroup v-model="newTemplate.spec.volumeMode">
            <ElRadio value="Filesystem">文件系统</ElRadio>
            <ElRadio value="Block">块设备</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <!-- 标签 -->
        <ElFormItem label="标签">
          <div class="key-value-list">
            <div
              v-for="(value, key, index) in newTemplate.metadata.labels"
              :key="index"
              class="key-value-item"
            >
              <ElInput v-model="labelKeys[index]" placeholder="键" style="flex: 1" />
              <ElInput v-model="labelValues[index]" placeholder="值" style="flex: 1" />
              <ElButton
                size="small"
                type="danger"
                @click="removeLabel(index)"
                style="flex-shrink: 0"
              >
                <Trash2 :size="14" />
              </ElButton>
            </div>
            <ElButton size="small" @click="addLabel" style="width: 100%">
              <Plus :size="14" />
              添加标签
            </ElButton>
          </div>
        </ElFormItem>

        <!-- Selector 标签选择器 -->
        <ElFormItem label="Selector">
          <div class="key-value-list">
            <div
              v-for="(value, key, index) in newTemplate.spec.selector?.matchLabels"
              :key="index"
              class="key-value-item"
            >
              <ElInput v-model="selectorKeys[index]" placeholder="键" style="flex: 1" />
              <ElInput v-model="selectorValues[index]" placeholder="值" style="flex: 1" />
              <ElButton
                size="small"
                type="danger"
                @click="removeSelector(index)"
                style="flex-shrink: 0"
              >
                <Trash2 :size="14" />
              </ElButton>
            </div>
            <ElButton size="small" @click="addSelector" style="width: 100%">
              <Plus :size="14" />
              添加选择器
            </ElButton>
          </div>
          <div class="form-tip">用于选择现有的 PersistentVolume</div>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="cancelEdit">取消</ElButton>
        <ElButton type="primary" @click="saveTemplate" :loading="saving">
          {{ editingIndex === -1 ? '添加' : '保存' }}
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useStatefulSetStore } from '@/store/workload'
  import type { V1PersistentVolumeClaim } from '@kubernetes/client-node'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus, Database, Edit2, Copy, Trash2 } from 'lucide-vue-next'
  import { getStorageClassListApi } from '@/api/workload/cluster-resource'
  import type {
    StorageClassListItem,
    ClusterResourceListRequest
  } from '@/api/workload/cluster-resource'

  // Props
  interface Props {
    mode?: 'create' | 'edit'
  }

  const props = defineProps<Props>()

  // Emits
  const emit = defineEmits<{
    (e: 'validate', result: { valid: boolean; errors: string[]; warnings?: string[] }): void
  }>()

  // Route
  const route = useRoute()

  // Store
  const statefulSetStore = useStatefulSetStore()

  // 模板列表
  const templates = computed(() => statefulSetStore.volumeClaimTemplates)

  // UI 状态
  const showAddDialog = ref(false)
  const editingIndex = ref(-1)
  const saving = ref(false)
  const nameError = ref('')
  const storageClassLoading = ref(false)

  // 访问模式
  const selectedAccessModes = ref<string[]>(['ReadWriteOnce'])

  // 存储容量
  const storageValue = ref<number>(10)
  const storageUnit = ref('Gi')

  // 标签和选择器的键值数组
  const labelKeys = ref<string[]>([])
  const labelValues = ref<string[]>([])
  const selectorKeys = ref<string[]>([])
  const selectorValues = ref<string[]>([])

  // StorageClass 列表
  const storageClasses = ref<StorageClassListItem[]>([])

  // 新模板对象
  const newTemplate = reactive<V1PersistentVolumeClaim>({
    metadata: {
      name: '',
      labels: {}
    },
    spec: {
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: {
          storage: '10Gi'
        }
      },
      storageClassName: undefined,
      volumeMode: 'Filesystem',
      selector: {
        matchLabels: {}
      }
    }
  })
  const clusterUuidRef = inject<Ref<string>>('clusterUuid')
  const clusterUuid = computed(() => clusterUuidRef?.value ?? "")


  // 加载 StorageClass 列表
  async function loadStorageClasses() {
    if (!clusterUuid.value) {
      console.warn('clusterUuid is not available')
      return
    }

    storageClassLoading.value = true
    try {
      const params: ClusterResourceListRequest = {
        clusterUuid: clusterUuid.value
      }

      const response = await getStorageClassListApi(params)

      if (response && response.items) {
        storageClasses.value = response.items
      }
    } catch (error) {
      console.error('Failed to load StorageClasses:', error)
      ElMessage.error('加载 StorageClass 列表失败')
      storageClasses.value = []
    } finally {
      storageClassLoading.value = false
    }
  }

  // 监听 templates 变化
  watch(
    () => statefulSetStore.volumeClaimTemplates,
    () => {
      emitValidation()
    },
    { deep: true }
  )

  // 监听对话框打开，加载 StorageClass
  watch(showAddDialog, (newVal) => {
    if (newVal && storageClasses.value.length === 0) {
      loadStorageClasses()
    }
  })

  // 发送验证结果
  function emitValidation() {
    const validation = validateTemplates()
    emit('validate', {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    })
  }

  // 获取访问模式标签
  function getAccessModesLabel(modes: string[] | undefined): string {
    if (!modes || modes.length === 0) return '未设置'
    const labels: Record<string, string> = {
      ReadWriteOnce: 'RWO',
      ReadOnlyMany: 'ROX',
      ReadWriteMany: 'RWX',
      ReadWriteOncePod: 'RWOP'
    }
    return modes.map((mode) => labels[mode] || mode).join(', ')
  }

  // 编辑模板
  function editTemplate(index: number) {
    const template = templates.value[index]
    editingIndex.value = index
    resetNewTemplate()

    // 复制数据到编辑表单
    newTemplate.metadata.name = template.metadata?.name || ''
    newTemplate.metadata.labels = { ...(template.metadata?.labels || {}) }
    newTemplate.spec.accessModes = [...(template.spec?.accessModes || ['ReadWriteOnce'])]
    newTemplate.spec.storageClassName = template.spec?.storageClassName
    newTemplate.spec.volumeMode = template.spec?.volumeMode || 'Filesystem'
    newTemplate.spec.selector = template.spec?.selector
      ? { matchLabels: { ...(template.spec.selector.matchLabels || {}) } }
      : { matchLabels: {} }

    selectedAccessModes.value = [...(template.spec?.accessModes || ['ReadWriteOnce'])]

    // 解析存储容量
    const storage = template.spec?.resources?.requests?.storage || '10Gi'
    const match = storage.match(/^(\d+)([A-Za-z]+)$/)
    if (match) {
      storageValue.value = parseInt(match[1])
      storageUnit.value = match[2]
    }

    // 加载标签
    loadLabelsToArrays()
    // 加载选择器
    loadSelectorsToArrays()

    showAddDialog.value = true
  }

  // 复制模板
  function duplicateTemplate(index: number) {
    const template = templates.value[index]
    const newTemplateCopy: V1PersistentVolumeClaim = JSON.parse(JSON.stringify(template))
    if (newTemplateCopy.metadata?.name) {
      newTemplateCopy.metadata.name = `${newTemplateCopy.metadata.name}-copy`
    }
    statefulSetStore.addVolumeClaimTemplate(newTemplateCopy)
    ElMessage.success('PVC 模板已复制')
  }

  // 删除模板
  function removeTemplate(index: number) {
    ElMessageBox.confirm('确定要删除此 PVC 模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        statefulSetStore.removeVolumeClaimTemplate(index)
        ElMessage.success('已删除')
      })
      .catch(() => {})
  }

  // 验证名称
  function validateName() {
    const name = newTemplate.metadata.name?.trim() || ''

    if (!name) {
      nameError.value = 'PVC 名称不能为空'
      return false
    }

    if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(name)) {
      nameError.value = '必须以小写字母开头，只能包含小写字母、数字和中划线，不能以中划线结尾'
      return false
    }

    const isDuplicate = templates.value.some(
      (t, i) => t.metadata?.name === name && i !== editingIndex.value
    )
    if (isDuplicate) {
      nameError.value = 'PVC 名称已存在'
      return false
    }

    nameError.value = ''
    return true
  }

  // 更新存储容量
  function updateStorageRequest() {
    if (storageValue.value && storageValue.value > 0) {
      if (!newTemplate.spec.resources) {
        newTemplate.spec.resources = { requests: {} }
      }
      if (!newTemplate.spec.resources.requests) {
        newTemplate.spec.resources.requests = {}
      }
      newTemplate.spec.resources.requests.storage = `${storageValue.value}${storageUnit.value}`
    }
  }

  watch([storageValue, storageUnit], () => {
    updateStorageRequest()
  })

  // 标签管理
  function loadLabelsToArrays() {
    const labels = newTemplate.metadata.labels || {}
    labelKeys.value = Object.keys(labels)
    labelValues.value = Object.values(labels)
  }

  function addLabel() {
    labelKeys.value.push('')
    labelValues.value.push('')
  }

  function removeLabel(index: number) {
    labelKeys.value.splice(index, 1)
    labelValues.value.splice(index, 1)
    syncLabels()
  }

  function syncLabels() {
    const labels: Record<string, string> = {}
    labelKeys.value.forEach((key, index) => {
      if (key && key.trim() && labelValues.value[index] && labelValues.value[index].trim()) {
        labels[key.trim()] = labelValues.value[index].trim()
      }
    })
    newTemplate.metadata.labels = labels
  }

  watch([labelKeys, labelValues], syncLabels, { deep: true })

  // 选择器管理
  function loadSelectorsToArrays() {
    const selectors = newTemplate.spec.selector?.matchLabels || {}
    selectorKeys.value = Object.keys(selectors)
    selectorValues.value = Object.values(selectors)
  }

  function addSelector() {
    selectorKeys.value.push('')
    selectorValues.value.push('')
  }

  function removeSelector(index: number) {
    selectorKeys.value.splice(index, 1)
    selectorValues.value.splice(index, 1)
    syncSelectors()
  }

  function syncSelectors() {
    const selectors: Record<string, string> = {}
    selectorKeys.value.forEach((key, index) => {
      if (key && key.trim() && selectorValues.value[index] && selectorValues.value[index].trim()) {
        selectors[key.trim()] = selectorValues.value[index].trim()
      }
    })
    if (!newTemplate.spec.selector) {
      newTemplate.spec.selector = {}
    }
    newTemplate.spec.selector.matchLabels = selectors
  }

  watch([selectorKeys, selectorValues], syncSelectors, { deep: true })

  // 取消编辑
  function cancelEdit() {
    showAddDialog.value = false
    editingIndex.value = -1
    resetNewTemplate()
    nameError.value = ''
  }

  // 保存模板
  async function saveTemplate() {
    if (!validateName()) {
      return
    }

    if (selectedAccessModes.value.length === 0) {
      ElMessage.warning('请至少选择一个访问模式')
      return
    }

    if (!storageValue.value || storageValue.value <= 0) {
      ElMessage.warning('请输入有效的存储容量')
      return
    }

    saving.value = true

    try {
      // 同步最终数据
      syncLabels()
      syncSelectors()
      updateStorageRequest()
      newTemplate.spec.accessModes = [...selectedAccessModes.value]

      // 清理空的 selector
      if (
        newTemplate.spec.selector &&
        Object.keys(newTemplate.spec.selector.matchLabels || {}).length === 0
      ) {
        newTemplate.spec.selector = undefined
      }

      const template: V1PersistentVolumeClaim = JSON.parse(JSON.stringify(newTemplate))

      if (editingIndex.value === -1) {
        statefulSetStore.addVolumeClaimTemplate(template)
        ElMessage.success('PVC 模板添加成功')
      } else {
        statefulSetStore.updateVolumeClaimTemplate(editingIndex.value, template)
        ElMessage.success('PVC 模板更新成功')
      }

      cancelEdit()
    } catch (error) {
      console.error('Failed to save template:', error)
      ElMessage.error('保存 PVC 模板失败')
    } finally {
      saving.value = false
    }
  }

  // 重置新模板
  function resetNewTemplate() {
    newTemplate.metadata.name = ''
    newTemplate.metadata.labels = {}
    newTemplate.spec.accessModes = ['ReadWriteOnce']
    newTemplate.spec.resources = { requests: { storage: '10Gi' } }
    newTemplate.spec.storageClassName = undefined
    newTemplate.spec.volumeMode = 'Filesystem'
    newTemplate.spec.selector = { matchLabels: {} }

    selectedAccessModes.value = ['ReadWriteOnce']
    storageValue.value = 10
    storageUnit.value = 'Gi'
    labelKeys.value = []
    labelValues.value = []
    selectorKeys.value = []
    selectorValues.value = []
  }

  // 验证所有模板
  function validateTemplates() {
    const errors: string[] = []
    const warnings: string[] = []

    if (templates.value.length === 0) {
      warnings.push('未配置 PVC 模板，Pod 将使用 volumes 中定义的存储卷')
      return { valid: true, errors, warnings }
    }

    templates.value.forEach((template, index) => {
      if (!template.metadata?.name) {
        errors.push(`PVC 模板 ${index + 1}: 缺少名称`)
      }
      if (!template.spec?.accessModes || template.spec.accessModes.length === 0) {
        errors.push(`PVC 模板 ${index + 1}: 缺少访问模式`)
      }
      if (!template.spec?.resources?.requests?.storage) {
        errors.push(`PVC 模板 ${index + 1}: 缺少存储容量`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 表单验证
  async function validate(): Promise<boolean> {
    const validation = validateTemplates()
    if (!validation.valid) {
      return false
    }
    return true
  }

  // 初始化
  onMounted(() => {
    // 初始加载 StorageClass 列表
    if (clusterUuid.value) {
      loadStorageClasses()
    }

    emitValidation()
  })

  // 导出
  defineExpose({
    validate
  })
</script>

<style lang="scss" scoped>
  .volume-claim-templates-step {
    .templates-panel {
      .templates-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .empty-templates {
        padding: 60px;
        text-align: center;
        background: #f5f7fa;
        border-radius: 8px;
      }

      .templates-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .template-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid #ebeef5;
          border-radius: 8px;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }

          .template-info {
            flex: 1;

            .template-name {
              display: flex;
              align-items: center;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;
            }

            .template-details {
              display: flex;
              gap: 8px;
              margin-top: 8px;
            }

            .template-meta {
              font-size: 12px;
              color: #909399;
              margin-top: 6px;
            }
          }

          .template-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    .error-message {
      color: #f56c6c;
      font-size: 12px;
      margin-top: 4px;
    }

    .form-tip {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    .is-error {
      :deep(.el-input__wrapper) {
        border-color: #f56c6c;
        box-shadow: 0 0 0 1px #f56c6c inset;
      }
    }

    .key-value-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;

      .key-value-item {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }
  }
</style>
