<template>
  <div class="labels-tab">
    <div class="toolbar">
      <ElButton type="primary" :icon="Plus" @click="showAddDialog" :loading="loading"
        >添加标签</ElButton
      >
      <ElButton :icon="Refresh" @click="refreshLabels" :loading="loading">刷新</ElButton>
      <ElInput
        v-model="searchKeyword"
        placeholder="搜索标签..."
        :prefix-icon="Search"
        style="width: 300px; margin-left: auto"
        clearable
        :disabled="loading"
      />
    </div>

    <div class="labels-container">
      <ElTable :data="filteredLabels" style="width: 100%" v-loading="loading" empty-text="暂无标签">
        <ElTableColumn prop="key" label="键 (Key)" min-width="200">
          <template #default="{ row }">
            <div class="label-key"
              ><ElIcon><PriceTag /></ElIcon><span>{{ row.key }}</span
              ><ElButton :icon="CopyDocument" size="small" link @click="copyToClipboard(row.key)"
            /></div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="value" label="值 (Value)" min-width="200">
          <template #default="{ row }">
            <div class="label-value"
              ><span>{{ row.value || '-' }}</span
              ><ElButton
                v-if="row.value"
                :icon="CopyDocument"
                size="small"
                link
                @click="copyToClipboard(row.value)"
            /></div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="isDelete" label="类型" width="120">
          <template #default="{ row }"
            ><ElTag :type="row.isDelete ? 'success' : 'danger'" size="small">{{
              row.isDelete ? '可管理' : '系统保护'
            }}</ElTag></template
          >
        </ElTableColumn>
        <ElTableColumn label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <ElSpace v-if="row.isDelete">
              <ElButton
                type="primary"
                size="small"
                link
                :icon="Edit"
                @click="handleEdit(row)"
                :disabled="deletingKey !== ''"
                >编辑</ElButton
              >
              <ElPopconfirm
                title="确定删除该标签吗？"
                @confirm="handleDelete(row)"
                :disabled="deletingKey !== ''"
              >
                <template #reference
                  ><ElButton
                    type="danger"
                    size="small"
                    link
                    :icon="Delete"
                    :loading="deletingKey === row.key"
                    >删除</ElButton
                  ></template
                >
              </ElPopconfirm>
            </ElSpace>
            <ElTooltip v-else content="系统标签不可修改" placement="left"
              ><ElIcon :size="18" style="color: #909399; margin-left: 12px"><Lock /></ElIcon
            ></ElTooltip>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <ElAlert
      v-if="hasSystemLabels"
      title="标签管理说明"
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 16px"
    >
      <template #default>
        <ul class="label-tips">
          <li><strong>可管理标签</strong>：用户自定义的标签，可以自由编辑和删除</li>
          <li><strong>系统保护标签</strong>：由 Kubernetes 系统自动生成和管理，不可修改或删除</li>
        </ul>
      </template>
    </ElAlert>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加标签' : '编辑标签'"
      width="500px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="labelForm" :rules="rules" label-width="80px">
        <ElFormItem label="键" prop="key">
          <ElInput
            v-model="labelForm.key"
            placeholder="请输入标签键，如: environment"
            :disabled="dialogType === 'edit'"
          />
          <div class="form-tip">标签键最大长度 253 个字符</div>
        </ElFormItem>
        <ElFormItem label="值" prop="value">
          <ElInput v-model="labelForm.value" placeholder="请输入标签值，如: production" />
          <div class="form-tip">标签值最大长度 63 个字符，可以为空</div>
        </ElFormItem>
        <ElFormItem label="模板">
          <ElSelect placeholder="选择常用标签模板" @change="applyTemplate" style="width: 100%">
            <ElOption
              v-for="t in labelTemplates"
              :key="t.key"
              :label="`${t.key}: ${t.value}`"
              :value="t.key"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Plus,
    Refresh,
    Search,
    Edit,
    Delete,
    CopyDocument,
    PriceTag,
    Lock
  } from '@element-plus/icons-vue'
  import {
    getNodeLabelsApi,
    addNodeLabelApi,
    deleteNodeLabelApi,
    type NodeLabelItem,
    type ClusterNodeDetail
  } from '@/api/manager/node'

  interface Props {
    nodeDetail: Partial<ClusterNodeDetail>
    nodeId: number
    active?: boolean
  }
  const props = withDefaults(defineProps<Props>(), { active: false })
  const emit = defineEmits<{ refresh: [] }>()

  const loading = ref(false)
  const submitting = ref(false)
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const searchKeyword = ref('')
  const labels = ref<NodeLabelItem[]>([])
  const formRef = ref()
  const hasInitialized = ref(false)
  const deletingKey = ref('')

  const labelForm = ref({ key: '', value: '' })

  const labelTemplates = [
    { key: 'environment', value: 'production' },
    { key: 'tier', value: 'backend' },
    { key: 'app', value: 'nginx' },
    { key: 'team', value: 'devops' }
  ]

  const rules = {
    key: [
      { required: true, message: '请输入标签键', trigger: 'blur' },
      { max: 253, message: '标签键最大长度为253个字符', trigger: 'blur' }
    ],
    value: [{ max: 63, message: '标签值最大长度为63个字符', trigger: 'blur' }]
  }

  const filteredLabels = computed(() => {
    if (!labels.value) return []
    if (!searchKeyword.value) return labels.value
    const kw = searchKeyword.value.toLowerCase()
    return labels.value.filter(
      (l) => l.key.toLowerCase().includes(kw) || l.value.toLowerCase().includes(kw)
    )
  })

  const hasSystemLabels = computed(() => labels.value?.some((l) => !l.isDelete) || false)

  const getLabels = async () => {
    if (!props.nodeId) return
    try {
      loading.value = true
      const res = await getNodeLabelsApi(props.nodeId)
      labels.value = res || []
    } catch (error) {
      console.error('获取标签失败:', error)
      labels.value = []
    } finally {
      loading.value = false
    }
  }

  const refreshLabels = () => getLabels()

  watch(
    () => props.active,
    (val) => {
      if (val && !hasInitialized.value) {
        hasInitialized.value = true
        getLabels()
      }
    },
    { immediate: true }
  )

  const showAddDialog = () => {
    dialogType.value = 'add'
    dialogVisible.value = true
  }

  const handleEdit = (row: NodeLabelItem) => {
    if (!row.isDelete) return
    dialogType.value = 'edit'
    labelForm.value = { key: row.key, value: row.value }
    dialogVisible.value = true
  }

  const handleDelete = async (row: NodeLabelItem) => {
    if (!row.isDelete) return
    try {
      deletingKey.value = row.key
      await deleteNodeLabelApi(props.nodeId, row.key)
      ElMessage.success('删除成功')
      refreshLabels()
      emit('refresh')
    } catch (error) {
      console.error('删除标签失败:', error)
    } finally {
      deletingKey.value = ''
    }
  }

  const applyTemplate = (key: string) => {
    const t = labelTemplates.find((t) => t.key === key)
    if (t) {
      labelForm.value.key = t.key
      labelForm.value.value = t.value
    }
  }

  const handleSubmit = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    try {
      submitting.value = true
      if (dialogType.value === 'add' && labels.value?.some((l) => l.key === labelForm.value.key)) {
        ElMessage.warning('标签键已存在')
        return
      }
      await addNodeLabelApi(props.nodeId, {
        key: labelForm.value.key,
        value: labelForm.value.value
      })
      ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
      dialogVisible.value = false
      refreshLabels()
      emit('refresh')
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const resetForm = () => {
    formRef.value?.resetFields()
    labelForm.value = { key: '', value: '' }
  }
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制到剪贴板'))
  }
</script>

<style lang="scss" scoped>
  .labels-tab {
    .toolbar {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }
    .labels-container {
      .label-key,
      .label-value {
        display: flex;
        align-items: center;
        gap: 8px;
        span {
          flex: 1;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 13px;
          word-break: break-all;
        }
      }
    }
    .label-tips {
      margin: 8px 0 0;
      padding-left: 20px;
      font-size: 13px;
      line-height: 1.8;
      strong {
        color: var(--el-color-primary);
      }
    }
    .form-tip {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
</style>
