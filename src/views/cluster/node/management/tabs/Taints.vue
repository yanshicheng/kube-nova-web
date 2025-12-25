<template>
  <div class="taints-tab">
    <div class="toolbar">
      <div class="toolbar-left">
        <ElButton type="primary" :icon="Plus" @click="showAddDialog" :loading="loading"
          >添加污点</ElButton
        >
        <ElButton :icon="Refresh" @click="refreshTaints" :loading="loading">刷新</ElButton>
      </div>
      <div class="toolbar-right">
        <ElTooltip content="污点可以阻止 Pod 调度到节点上" placement="top">
          <ElButton :icon="QuestionFilled" link>什么是污点？</ElButton>
        </ElTooltip>
      </div>
    </div>

    <ElAlert
      title="污点 (Taints) 说明"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    >
      <template #default>
        <ul class="taint-tips">
          <li><strong>NoSchedule</strong>: 不允许新的 Pod 调度到该节点，已存在的 Pod 不受影响</li>
          <li><strong>PreferNoSchedule</strong>: 尽量避免将 Pod 调度到该节点，但不是强制的</li>
          <li><strong>NoExecute</strong>: 不允许新的 Pod 调度到该节点，并且驱逐已存在的 Pod</li>
        </ul>
      </template>
    </ElAlert>

    <div class="taints-container">
      <div v-if="loading" class="loading-container"><ElSkeleton :rows="3" animated /></div>
      <div v-else-if="taints && taints.length > 0" class="taints-grid">
        <div
          v-for="taint in taints"
          :key="`${taint.key}-${taint.effect}`"
          class="taint-card"
          :class="`effect-${taint.effect.toLowerCase()}`"
        >
          <div class="taint-header">
            <div class="taint-icon">
              <ElIcon :size="24">
                <Warning v-if="taint.effect === 'NoExecute'" />
                <SemiSelect v-else-if="taint.effect === 'NoSchedule'" />
                <Select v-else />
              </ElIcon>
            </div>
            <div class="taint-info">
              <h4 class="taint-key">{{ taint.key }}</h4>
              <p class="taint-value">{{ taint.value || '(空值)' }}</p>
            </div>
          </div>
          <div class="taint-status"
            ><ElTag :type="taint.isDelete ? 'success' : 'danger'" size="small">{{
              taint.isDelete ? '可管理' : '系统保护'
            }}</ElTag></div
          >
          <div class="taint-effect"
            ><ElTag :type="getEffectType(taint.effect)" effect="dark" size="small">{{
              taint.effect
            }}</ElTag></div
          >
          <div class="taint-meta"
            ><span class="meta-item"
              ><ElIcon><Clock /></ElIcon>{{ formatTime(taint.time) }}</span
            ></div
          >
          <div class="taint-actions">
            <template v-if="taint.isDelete">
              <ElButton
                type="primary"
                size="small"
                link
                :icon="Edit"
                @click="handleEdit(taint)"
                :disabled="deletingTaint !== ''"
                >编辑</ElButton
              >
              <ElDivider direction="vertical" />
              <ElPopconfirm
                title="删除污点后，Pod 可能会被调度到此节点，确定删除吗？"
                @confirm="handleDelete(taint)"
                width="220"
                :disabled="deletingTaint !== ''"
              >
                <template #reference
                  ><ElButton
                    type="danger"
                    size="small"
                    link
                    :icon="Delete"
                    :loading="deletingTaint === `${taint.key}-${taint.effect}`"
                    >删除</ElButton
                  ></template
                >
              </ElPopconfirm>
            </template>
            <template v-else>
              <ElTooltip content="系统污点不可修改" placement="left"
                ><ElIcon :size="18" style="color: #909399"><Lock /></ElIcon
              ></ElTooltip>
            </template>
          </div>
        </div>
      </div>
      <ElEmpty v-else description="暂无污点设置"
        ><ElButton type="primary" @click="showAddDialog">添加第一个污点</ElButton></ElEmpty
      >
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加污点' : '编辑污点'"
      width="600px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="taintForm" :rules="rules" label-width="100px">
        <ElFormItem label="污点键" prop="key">
          <ElInput
            v-model="taintForm.key"
            placeholder="请输入污点键，如: node-role.kubernetes.io/master"
            :disabled="dialogType === 'edit'"
          />
          <div class="form-tip">污点键最大长度 253 个字符</div>
        </ElFormItem>
        <ElFormItem label="污点值" prop="value">
          <ElInput v-model="taintForm.value" placeholder="可选，请输入污点值" />
          <div class="form-tip">污点值最大长度 63 个字符，可以为空</div>
        </ElFormItem>
        <ElFormItem label="效果" prop="effect">
          <ElRadioGroup v-model="taintForm.effect">
            <ElRadioButton value="NoSchedule"
              ><div class="effect-option"
                ><strong>NoSchedule</strong><span>禁止调度</span></div
              ></ElRadioButton
            >
            <ElRadioButton value="PreferNoSchedule"
              ><div class="effect-option"
                ><strong>PreferNoSchedule</strong><span>尽量不调度</span></div
              ></ElRadioButton
            >
            <ElRadioButton value="NoExecute"
              ><div class="effect-option"
                ><strong>NoExecute</strong><span>禁止执行</span></div
              ></ElRadioButton
            >
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem
          ><ElAlert
            :title="getEffectDescription(taintForm.effect)"
            :type="getEffectAlertType(taintForm.effect)"
            :closable="false"
            show-icon
        /></ElFormItem>
        <ElFormItem label="快速选择">
          <ElSelect placeholder="选择常用污点模板" @change="applyTemplate" style="width: 100%">
            <ElOption v-for="t in taintTemplates" :key="t.key" :label="t.label" :value="t.key">
              <div style="display: flex; justify-content: space-between"
                ><span>{{ t.label }}</span
                ><ElTag size="small" :type="getEffectType(t.effect)">{{ t.effect }}</ElTag></div
              >
            </ElOption>
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
  import { ref, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Plus,
    Refresh,
    QuestionFilled,
    Edit,
    Delete,
    Warning,
    SemiSelect,
    Select,
    Clock,
    Lock
  } from '@element-plus/icons-vue'
  import {
    getNodeTaintsApi,
    addNodeTaintApi,
    deleteNodeTaintApi,
    type NodeTaint,
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
  const taints = ref<NodeTaint[]>([])
  const formRef = ref()
  const hasInitialized = ref(false)
  const deletingTaint = ref('')

  const taintForm = ref({ key: '', value: '', effect: 'NoSchedule' as string })

  const taintTemplates = [
    {
      key: 'master',
      label: 'Master 节点专用',
      taintKey: 'node-role.kubernetes.io/master',
      value: '',
      effect: 'NoSchedule'
    },
    {
      key: 'gpu',
      label: 'GPU 节点专用',
      taintKey: 'nvidia.com/gpu',
      value: 'true',
      effect: 'NoSchedule'
    },
    {
      key: 'maintenance',
      label: '维护模式',
      taintKey: 'maintenance',
      value: 'true',
      effect: 'NoExecute'
    }
  ]

  const rules = {
    key: [
      { required: true, message: '请输入污点键', trigger: 'blur' },
      { max: 253, message: '污点键最大长度为253个字符', trigger: 'blur' }
    ],
    value: [{ max: 63, message: '污点值最大长度为63个字符', trigger: 'blur' }],
    effect: [{ required: true, message: '请选择污点效果', trigger: 'change' }]
  }

  const getTaints = async () => {
    if (!props.nodeId) return
    try {
      loading.value = true
      const res = await getNodeTaintsApi(props.nodeId)
      taints.value = res || []
    } catch (error) {
      console.error('获取污点失败:', error)
      taints.value = []
    } finally {
      loading.value = false
    }
  }

  const refreshTaints = () => getTaints()

  watch(
    () => props.active,
    (val) => {
      if (val && !hasInitialized.value) {
        hasInitialized.value = true
        getTaints()
      }
    },
    { immediate: true }
  )

  const showAddDialog = () => {
    dialogType.value = 'add'
    dialogVisible.value = true
  }

  const handleEdit = (taint: NodeTaint) => {
    if (!taint.isDelete) return
    dialogType.value = 'edit'
    taintForm.value = { key: taint.key, value: taint.value, effect: taint.effect }
    dialogVisible.value = true
  }

  const handleDelete = async (taint: NodeTaint) => {
    if (!taint.isDelete) return
    try {
      deletingTaint.value = `${taint.key}-${taint.effect}`
      await deleteNodeTaintApi(props.nodeId, { key: taint.key, effect: taint.effect })
      ElMessage.success('删除成功')
      refreshTaints()
      emit('refresh')
    } catch (error) {
      console.error('删除污点失败:', error)
    } finally {
      deletingTaint.value = ''
    }
  }

  const applyTemplate = (key: string) => {
    const t = taintTemplates.find((t) => t.key === key)
    if (t) {
      taintForm.value.key = t.taintKey
      taintForm.value.value = t.value
      taintForm.value.effect = t.effect
    }
  }

  const getEffectType = (effect: string) =>
    ({ NoSchedule: 'warning', PreferNoSchedule: 'info', NoExecute: 'danger' })[effect] || 'info'
  const getEffectDescription = (effect: string) =>
    ({
      NoSchedule: '新的 Pod 不能调度到该节点上，但不影响已经在节点上运行的 Pod',
      PreferNoSchedule: '系统将尽量避免将 Pod 调度到该节点上，但不是强制的',
      NoExecute: '新的 Pod 不能调度到该节点上，同时会驱逐节点上已经运行的 Pod'
    })[effect] || ''
  const getEffectAlertType = (effect: string) =>
    ({ NoSchedule: 'warning', PreferNoSchedule: 'info', NoExecute: 'error' })[effect] || 'info'
  const formatTime = (ts: number | undefined) =>
    ts ? new Date(ts * 1000).toLocaleDateString('zh-CN') : '-'

  const handleSubmit = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    try {
      if (
        dialogType.value === 'add' &&
        taints.value?.some(
          (t) => t.key === taintForm.value.key && t.effect === taintForm.value.effect
        )
      ) {
        ElMessage.warning('相同的污点已存在')
        return
      }
      if (taintForm.value.effect === 'NoExecute' && dialogType.value === 'add') {
        await ElMessageBox.confirm(
          '设置 NoExecute 效果将驱逐节点上没有相应容忍度的 Pod，确定继续吗？',
          '警告',
          { type: 'warning' }
        )
      }
      submitting.value = true
      await addNodeTaintApi(props.nodeId, {
        key: taintForm.value.key,
        value: taintForm.value.value,
        effect: taintForm.value.effect
      })
      ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
      dialogVisible.value = false
      refreshTaints()
      emit('refresh')
    } catch (error: any) {
      if (error !== 'cancel') console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const resetForm = () => {
    formRef.value?.resetFields()
    taintForm.value = { key: '', value: '', effect: 'NoSchedule' }
  }
</script>

<style lang="scss" scoped>
  .taints-tab {
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      .toolbar-left {
        display: flex;
        gap: 10px;
      }
    }
    .taint-tips {
      margin: 8px 0 0;
      padding-left: 20px;
      font-size: 13px;
      line-height: 1.8;
      strong {
        color: var(--el-color-primary);
      }
    }
    .loading-container {
      padding: 20px;
    }
    .taints-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
    }
    .taint-card {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      padding: 16px;
      transition: all 0.3s ease;
      &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }
      &.effect-noschedule {
        border-left: 3px solid var(--el-color-warning);
      }
      &.effect-prefernoschedule {
        border-left: 3px solid var(--el-color-info);
      }
      &.effect-noexecute {
        border-left: 3px solid var(--el-color-danger);
      }
      .taint-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        .taint-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: var(--el-fill-color-light);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .taint-info {
          flex: 1;
          min-width: 0;
          .taint-key {
            margin: 0 0 4px;
            font-size: 14px;
            font-weight: 500;
            font-family: 'Monaco', monospace;
            word-break: break-all;
          }
          .taint-value {
            margin: 0;
            font-size: 12px;
            color: var(--el-text-color-regular);
            font-family: 'Monaco', monospace;
          }
        }
      }
      .taint-status {
        margin-bottom: 12px;
      }
      .taint-effect {
        margin-bottom: 12px;
      }
      .taint-meta {
        margin-bottom: 12px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
      .taint-actions {
        display: flex;
        align-items: center;
      }
    }
    .form-tip {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
    .effect-option {
      display: flex;
      flex-direction: column;
      padding: 4px 0;
      strong {
        font-size: 14px;
        margin-bottom: 2px;
      }
      span {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
    }
  }
  :deep(.el-radio-button__inner) {
    padding: 12px 16px;
    height: auto;
  }
</style>
