<template>
  <div class="annotations-tab">
    <div class="toolbar">
      <ElButton type="primary" :icon="Plus" @click="showAddDialog" :loading="loading"
        >添加注解</ElButton
      >
      <ElButton :icon="Refresh" @click="refreshAnnotations" :loading="loading">刷新</ElButton>
      <ElInput
        v-model="searchKeyword"
        placeholder="搜索注解..."
        :prefix-icon="Search"
        style="width: 300px; margin-left: auto"
        clearable
        :disabled="loading"
      />
    </div>

    <div class="annotations-container">
      <div v-if="loading" class="loading-container"><ElSkeleton :rows="5" animated /></div>
      <div
        v-else-if="filteredAnnotations && filteredAnnotations.length > 0"
        class="annotations-list"
      >
        <ElCard
          v-for="annotation in filteredAnnotations"
          :key="annotation.key"
          class="annotation-card"
          shadow="hover"
        >
          <div class="annotation-header">
            <div class="annotation-key"
              ><ElIcon><Document /></ElIcon><span class="key-text">{{ annotation.key }}</span></div
            >
            <ElTag
              :type="annotation.isDelete ? 'success' : 'danger'"
              size="small"
              class="status-tag"
              >{{ annotation.isDelete ? '可编辑' : '系统保护' }}</ElTag
            >
            <div class="annotation-actions" v-if="annotation.isDelete">
              <ElButton
                :icon="Edit"
                size="small"
                circle
                @click="handleEdit(annotation)"
                :disabled="deletingKey !== ''"
              />
              <ElPopconfirm
                title="确定删除该注解吗？"
                @confirm="handleDelete(annotation)"
                :disabled="deletingKey !== ''"
              >
                <template #reference
                  ><ElButton
                    :icon="Delete"
                    size="small"
                    circle
                    type="danger"
                    :loading="deletingKey === annotation.key"
                /></template>
              </ElPopconfirm>
            </div>
            <div class="annotation-actions" v-else>
              <ElTooltip content="系统注解不可修改" placement="top"
                ><ElIcon :size="20" style="color: #909399"><Lock /></ElIcon
              ></ElTooltip>
            </div>
          </div>
          <div class="annotation-value">
            <pre>{{ formatValue(annotation.value) }}</pre>
            <ElButton
              v-if="annotation.value"
              :icon="CopyDocument"
              size="small"
              link
              @click="copyToClipboard(annotation.value)"
              class="copy-btn"
              >复制</ElButton
            >
          </div>
        </ElCard>
      </div>
      <ElEmpty v-else description="暂无注解" />
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加注解' : '编辑注解'"
      width="600px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="annotationForm" :rules="rules" label-width="100px">
        <ElFormItem label="键" prop="key">
          <ElInput
            v-model="annotationForm.key"
            placeholder="请输入注解键，如: example.com/description"
            :disabled="dialogType === 'edit'"
          />
          <div class="form-tip">注解键最大长度 253 个字符</div>
        </ElFormItem>
        <ElFormItem label="值" prop="value">
          <ElInput
            v-model="annotationForm.value"
            type="textarea"
            :rows="6"
            placeholder="请输入注解值，支持任意格式的文本、JSON、YAML等"
          />
        </ElFormItem>
        <ElFormItem label="常用模板">
          <ElSelect placeholder="选择常用注解模板" @change="applyTemplate" style="width: 100%">
            <ElOption
              v-for="t in annotationTemplates"
              :key="t.key"
              :label="t.label"
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
    Document,
    Lock
  } from '@element-plus/icons-vue'
  import {
    getNodeAnnotationsApi,
    addNodeAnnotationApi,
    deleteNodeAnnotationApi,
    type NodeAnnotationItem,
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
  const annotations = ref<NodeAnnotationItem[]>([])
  const formRef = ref()
  const hasInitialized = ref(false)
  const deletingKey = ref('')

  const annotationForm = ref({ key: '', value: '' })

  const annotationTemplates = [
    { key: 'description', label: '描述信息', value: 'This node is used for production workloads' },
    {
      key: 'config',
      label: '配置信息 (JSON)',
      value: JSON.stringify({ maxPods: 110, networkPolicy: 'calico' }, null, 2)
    },
    {
      key: 'maintenance',
      label: '维护窗口',
      value: 'window: "Sunday 02:00-06:00 UTC"\ncontact: ops@example.com'
    }
  ]

  const rules = {
    key: [
      { required: true, message: '请输入注解键', trigger: 'blur' },
      { max: 253, message: '注解键最大长度为253个字符', trigger: 'blur' }
    ],
    value: [{ required: true, message: '请输入注解值', trigger: 'blur' }]
  }

  const filteredAnnotations = computed(() => {
    if (!annotations.value) return []
    if (!searchKeyword.value) return annotations.value
    const kw = searchKeyword.value.toLowerCase()
    return annotations.value.filter(
      (a) => a.key.toLowerCase().includes(kw) || a.value.toLowerCase().includes(kw)
    )
  })

  const getAnnotations = async () => {
    if (!props.nodeId) return
    try {
      loading.value = true
      const res = await getNodeAnnotationsApi(props.nodeId)
      annotations.value = res || []
    } catch (error) {
      console.error('获取注解失败:', error)
      annotations.value = []
    } finally {
      loading.value = false
    }
  }

  const refreshAnnotations = () => getAnnotations()

  watch(
    () => props.active,
    (val) => {
      if (val && !hasInitialized.value) {
        hasInitialized.value = true
        getAnnotations()
      }
    },
    { immediate: true }
  )

  const showAddDialog = () => {
    dialogType.value = 'add'
    dialogVisible.value = true
  }

  const handleEdit = (row: NodeAnnotationItem) => {
    if (!row.isDelete) return
    dialogType.value = 'edit'
    annotationForm.value = { key: row.key, value: row.value }
    dialogVisible.value = true
  }

  const handleDelete = async (row: NodeAnnotationItem) => {
    if (!row.isDelete) return
    try {
      deletingKey.value = row.key
      await deleteNodeAnnotationApi(props.nodeId, row.key)
      ElMessage.success('删除成功')
      refreshAnnotations()
      emit('refresh')
    } catch (error) {
      console.error('删除注解失败:', error)
    } finally {
      deletingKey.value = ''
    }
  }

  const applyTemplate = (key: string) => {
    const t = annotationTemplates.find((t) => t.key === key)
    if (t) {
      annotationForm.value.key = `example.com/${t.key}`
      annotationForm.value.value = t.value
    }
  }

  const formatValue = (value: string) => {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }

  const handleSubmit = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    try {
      submitting.value = true
      if (
        dialogType.value === 'add' &&
        annotations.value?.some((a) => a.key === annotationForm.value.key)
      ) {
        ElMessage.warning('注解键已存在')
        return
      }
      await addNodeAnnotationApi(props.nodeId, {
        key: annotationForm.value.key,
        value: annotationForm.value.value
      })
      ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
      dialogVisible.value = false
      refreshAnnotations()
      emit('refresh')
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const resetForm = () => {
    formRef.value?.resetFields()
    annotationForm.value = { key: '', value: '' }
  }
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制到剪贴板'))
  }
</script>

<style lang="scss" scoped>
  .annotations-tab {
    .toolbar {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }
    .loading-container {
      padding: 20px;
    }
    .annotations-list {
      display: grid;
      gap: 16px;
    }
    .annotation-card {
      transition: all 0.3s ease;
      &:hover {
        transform: translateY(-2px);
      }
      .annotation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        flex-wrap: wrap;
        gap: 8px;
        .annotation-key {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
          .key-text {
            font-weight: 500;
            font-size: 14px;
            color: var(--el-text-color-primary);
            font-family: 'Monaco', monospace;
            word-break: break-all;
          }
        }
        .annotation-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }
      }
      .annotation-value {
        position: relative;
        background: #f5f7fa;
        border-radius: 4px;
        padding: 12px;
        pre {
          margin: 0;
          font-family: 'Monaco', monospace;
          font-size: 13px;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 200px;
          overflow-y: auto;
        }
        .copy-btn {
          position: absolute;
          top: 8px;
          right: 8px;
        }
      }
    }
    .form-tip {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
</style>
