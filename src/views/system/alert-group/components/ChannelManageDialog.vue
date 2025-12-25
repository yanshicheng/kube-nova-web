<template>
  <el-dialog
    v-model="visible"
    title="渠道配置管理"
    width="1000px"
    @close="handleClose"
    class="channel-manage-dialog"
  >
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <div class="info-text">
        <el-icon :size="18" color="#409eff"><Bell /></el-icon>
        <span>为不同告警级别配置相应的通知渠道</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAdd"> 添加配置 </el-button>
    </div>

    <!-- 配置列表 - 卡片式 -->
    <div v-loading="loading" class="config-list">
      <div v-for="item in channelList" :key="item.id" class="config-card">
        <!-- 左侧：告警级别 -->
        <div class="level-section">
          <div class="level-badge" :class="`level-${item.severity}`">
            <span class="level-text">{{ getSeverityName(item.severity) }}</span>
          </div>
        </div>

        <!-- 中间：渠道列表 -->
        <div class="channels-section">
          <div class="channels-label">已配置渠道</div>
          <div class="channels-wrapper">
            <el-tag
              v-for="id in getChannelIds(item.channelId)"
              :key="id"
              class="channel-tag"
              size="large"
              effect="plain"
            >
              <el-icon><Bell /></el-icon>
              <span>{{ getChannelName(id) }}</span>
            </el-tag>
            <span v-if="getChannelIds(item.channelId).length === 0" class="no-channel">
              暂无渠道
            </span>
          </div>
        </div>

        <!-- 右侧：操作 -->
        <div class="actions-section">
          <div class="time-text">
            <el-icon :size="14"><Clock /></el-icon>
            {{ formatTime(item.createdAt) }}
          </div>
          <div class="action-buttons">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(item)"> 编辑 </el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(item)">
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="channelList.length === 0 && !loading"
        description="暂无渠道配置"
        :image-size="140"
      >
        <el-button type="primary" :icon="Plus" @click="handleAdd"> 添加配置 </el-button>
      </el-empty>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editMode === 'add' ? '添加渠道配置' : '编辑渠道配置'"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="告警级别" prop="severity">
          <el-select v-model="form.severity" placeholder="请选择告警级别" style="width: 100%">
            <el-option
              v-for="level in alertLevels"
              :key="level.value"
              :label="level.label"
              :value="level.value"
            >
              <div class="level-option">
                <div class="level-dot" :class="`level-${level.value}`"></div>
                <span class="level-label">{{ level.label }}</span>
                <span class="level-desc">{{ level.desc }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="告警渠道" prop="channelIds">
          <channel-selector v-model="form.channelIds" />
          <div class="form-tip">
            <el-icon color="#909399"><InfoFilled /></el-icon>
            <span>可选择多个渠道，系统将同时向所有选中的渠道发送告警通知</span>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ submitLoading ? '保存中...' : '确定' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { Plus, Delete, Edit, InfoFilled, Bell, Clock } from '@element-plus/icons-vue'
  import {
    searchAlertGroupLevelChannelsApi,
    addAlertGroupLevelChannelsApi,
    updateAlertGroupLevelChannelsApi,
    deleteAlertGroupLevelChannelsApi,
    searchAlertChannelsApi,
    type AlertGroupLevelChannels,
    type AlertChannels
  } from '@/api/portal/alert'
  import { formatTime } from '@/utils/date'
  import ChannelSelector from './ChannelSelector.vue'

  interface Props {
    modelValue: boolean
    groupId?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'success'])

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const loading = ref(false)
  const submitLoading = ref(false)
  const channelList = ref<AlertGroupLevelChannels[]>([])
  const channelDetailsMap = ref<Map<number, AlertChannels>>(new Map())

  const editDialogVisible = ref(false)
  const editMode = ref<'add' | 'edit'>('add')
  const editingId = ref<number>()
  const formRef = ref<FormInstance>()
  const form = reactive({
    severity: 'default',
    channelIds: [] as number[]
  })

  const formRules = reactive<FormRules>({
    severity: [{ required: true, message: '请选择告警级别', trigger: 'change' }],
    channelIds: [
      {
        required: true,
        type: 'array',
        min: 1,
        message: '请选择至少一个告警渠道',
        trigger: 'change'
      }
    ]
  })

  const alertLevels = [
    { value: 'default', label: '默认', desc: '默认级别' },
    { value: 'info', label: '提示', desc: '信息提示' },
    { value: 'warning', label: '警告', desc: '警告信息' },
    { value: 'critical', label: '严重', desc: '严重告警' },
    { value: 'notification', label: '通知', desc: '普通通知' }
  ]

  // 获取严重级别名称
  const getSeverityName = (severity: string) => {
    const level = alertLevels.find((item) => item.value === severity)
    return level?.label || severity
  }

  // 获取渠道IDs数组
  const getChannelIds = (channelId: string): number[] => {
    if (!channelId) return []
    return channelId
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id))
  }

  // 获取渠道名称
  const getChannelName = (channelId: number): string => {
    const channel = channelDetailsMap.value.get(channelId)
    return channel?.channelName || `渠道${channelId}`
  }

  // 加载渠道详情
  const loadChannelDetails = async () => {
    try {
      const res = await searchAlertChannelsApi()
      if (res.items) {
        res.items.forEach((channel) => {
          channelDetailsMap.value.set(channel.id, channel)
        })
      }
    } catch (error) {
      // 错误已统一处理
    }
  }

  // 加载渠道配置列表
  const loadChannels = async () => {
    if (!props.groupId) return

    loading.value = true
    try {
      await loadChannelDetails()

      const res = await searchAlertGroupLevelChannelsApi({
        groupId: props.groupId,
        page: 1,
        pageSize: 200
      })
      channelList.value = res.items || []
    } finally {
      loading.value = false
    }
  }

  // 添加渠道配置
  const handleAdd = () => {
    editMode.value = 'add'
    editingId.value = undefined
    form.severity = 'default'
    form.channelIds = []
    editDialogVisible.value = true
  }

  // 编辑渠道配置
  const handleEdit = (row: AlertGroupLevelChannels) => {
    editMode.value = 'edit'
    editingId.value = row.id
    form.severity = row.severity
    form.channelIds = getChannelIds(row.channelId)
    editDialogVisible.value = true
  }

  // 提交添加/编辑
  const handleSubmit = async () => {
    if (!formRef.value || !props.groupId) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      submitLoading.value = true
      try {
        const params = {
          groupId: props.groupId!,
          severity: form.severity,
          channelId: form.channelIds.join(',')
        }

        if (editMode.value === 'edit' && editingId.value) {
          await updateAlertGroupLevelChannelsApi({
            id: editingId.value,
            ...params
          })
          ElMessage.success('更新成功')
        } else {
          await addAlertGroupLevelChannelsApi(params)
          ElMessage.success('添加成功')
        }

        editDialogVisible.value = false
        await loadChannels()
        emit('success')
      } finally {
        submitLoading.value = false
      }
    })
  }

  // 删除渠道配置
  const handleDelete = async (row: AlertGroupLevelChannels) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除 "${getSeverityName(row.severity)}" 级别的渠道配置吗？`,
        '确认删除',
        {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }
      )
      await deleteAlertGroupLevelChannelsApi(row.id)
      ElMessage.success('删除成功')
      await loadChannels()
      emit('success')
    } catch (error) {
      if (error !== 'cancel') {
        // 错误已统一处理
      }
    }
  }

  // 关闭对话框
  const handleClose = () => {
    channelList.value = []
    channelDetailsMap.value.clear()
  }

  watch(
    [() => visible.value, () => props.groupId],
    ([isVisible, groupId]) => {
      if (isVisible && groupId) {
        loadChannels()
      }
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .channel-manage-dialog {
    :deep(.el-dialog__header) {
      padding: 20px 24px;
      border-bottom: 1px solid #ebeef5;
    }

    :deep(.el-dialog__body) {
      padding: 0;
      background: #f5f7fa;
    }

    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: white;
      border-bottom: 1px solid #ebeef5;

      .info-text {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #606266;
      }
    }

    .config-list {
      padding: 20px 24px;
      min-height: 300px;

      .config-card {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px;
        margin-bottom: 12px;
        background: white;
        border-radius: 8px;
        border: 1px solid #ebeef5;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        &:last-child {
          margin-bottom: 0;
        }

        // 左侧：告警级别
        .level-section {
          min-width: 80px;

          .level-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            color: white;

            &.level-default {
              background: #909399;
            }

            &.level-info {
              background: #409eff;
            }

            &.level-warning {
              background: #e6a23c;
            }

            &.level-critical {
              background: #f56c6c;
            }

            &.level-notification {
              background: #67c23a;
            }

            .level-text {
              display: block;
              text-align: center;
            }
          }
        }

        // 中间：渠道列表
        .channels-section {
          flex: 1;
          min-width: 0;

          .channels-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
          }

          .channels-wrapper {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .channel-tag {
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .no-channel {
              font-size: 13px;
              color: #c0c4cc;
            }
          }
        }

        // 右侧：操作
        .actions-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          min-width: 120px;

          .time-text {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #909399;
          }

          .action-buttons {
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    // 编辑对话框
    .level-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 0;

      .level-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;

        &.level-default {
          background: #909399;
        }

        &.level-info {
          background: #409eff;
        }

        &.level-warning {
          background: #e6a23c;
        }

        &.level-critical {
          background: #f56c6c;
        }

        &.level-notification {
          background: #67c23a;
        }
      }

      .level-label {
        font-weight: 500;
        color: #303133;
      }

      .level-desc {
        margin-left: auto;
        font-size: 12px;
        color: #909399;
      }
    }

    .form-tip {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
      line-height: 1.6;

      .el-icon {
        margin-top: 2px;
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
</style>
