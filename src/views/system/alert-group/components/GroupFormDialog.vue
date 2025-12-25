<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="group-form-dialog"
  >
    <!-- 步骤条 -->
    <div class="steps-container">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="step-item"
        :class="{
          active: currentStep === index,
          completed: currentStep > index,
          clickable: true
        }"
        @click="handleStepClick(index)"
      >
        <div class="step-number">
          <el-icon v-if="currentStep > index" class="check-icon">
            <Check />
          </el-icon>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="step-info">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-desc">{{ step.desc }}</div>
        </div>
        <div v-if="index < steps.length - 1" class="step-line"></div>
      </div>
    </div>

    <!-- 步骤内容 -->
    <div class="step-content">
      <!-- 步骤1: 基本信息 -->
      <div v-show="currentStep === 0" class="step-panel">
        <el-form
          ref="baseFormRef"
          :model="baseForm"
          :rules="baseFormRules"
          label-width="110px"
          label-position="right"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="告警组名称" prop="groupName">
                <el-input
                  v-model="baseForm.groupName"
                  placeholder="如：运维一组"
                  maxlength="50"
                  show-word-limit
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="排序序号">
                <el-input-number
                  v-model="baseForm.sortOrder"
                  :min="0"
                  :max="9999"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="组类型" prop="groupType">
            <div class="type-selector">
              <div
                class="type-option"
                :class="{ active: baseForm.groupType === 'normal' }"
                @click="baseForm.groupType = 'normal'"
              >
                <div class="option-content">
                  <div class="option-header">
                    <span class="option-title">普通组</span>
                    <el-icon
                      v-if="baseForm.groupType === 'normal'"
                      class="check-icon"
                      color="#409eff"
                    >
                      <Check />
                    </el-icon>
                  </div>
                  <div class="option-desc">固定成员的告警组</div>
                </div>
              </div>
              <div
                class="type-option"
                :class="{ active: baseForm.groupType === 'duty' }"
                @click="baseForm.groupType = 'duty'"
              >
                <div class="option-content">
                  <div class="option-header">
                    <span class="option-title">值班组</span>
                    <el-icon
                      v-if="baseForm.groupType === 'duty'"
                      class="check-icon"
                      color="#409eff"
                    >
                      <Check />
                    </el-icon>
                  </div>
                  <div class="option-desc">支持值班排班的告警组</div>
                </div>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="描述">
            <el-input
              v-model="baseForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入告警组描述信息（选填）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="过滤规则">
            <el-input
              v-model="baseForm.filterRules"
              type="textarea"
              :rows="4"
              placeholder="JSON格式的标签匹配规则（选填）"
            />
            <div class="form-tip">
              示例：{"matchType":"all","rules":[{"label":"service","operator":"in","values":["order-service"]}]}
            </div>
          </el-form-item>

          <template v-if="baseForm.groupType === 'duty'">
            <el-form-item label="值班排班表">
              <el-input
                v-model="baseForm.dutySchedule"
                type="textarea"
                :rows="5"
                placeholder="JSON格式的值班排班表"
              />
              <div class="form-tip">值班组特有配置，用于定义值班人员的排班规则</div>
            </el-form-item>
          </template>
        </el-form>
      </div>

      <!-- 步骤2: 渠道配置 -->
      <div v-show="currentStep === 1" class="step-panel">
        <div class="panel-actions">
          <el-alert
            v-if="!hasDefaultChannel"
            type="error"
            title="必须配置 default 级别的告警渠道"
            :closable="false"
            show-icon
          />
          <el-button type="primary" :icon="Plus" @click="handleAddChannel">
            添加渠道配置
          </el-button>
        </div>

        <el-table :data="channelConfigs" border stripe class="config-table">
          <el-table-column label="告警级别" width="200" align="center">
            <template #default="{ row }">
              <el-select
                v-model="row.severity"
                placeholder="请选择级别"
                @change="validateDefaultChannel"
                style="width: 100%"
              >
                <el-option
                  v-for="level in alertLevels"
                  :key="level.value"
                  :label="level.label"
                  :value="level.value"
                >
                  <div class="simple-option">
                    <el-tag v-if="level.type" :type="level.type" size="small">{{
                      level.label
                    }}</el-tag>
                    <el-tag v-else size="small">{{ level.label }}</el-tag>
                    <span class="option-desc">{{ level.desc }}</span>
                  </div>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="告警渠道" min-width="350">
            <template #default="{ row }">
              <channel-selector v-model="row.channelIds" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link :icon="Delete" @click="handleDeleteChannel($index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-if="channelConfigs.length === 0"
          description="暂无渠道配置，请点击上方按钮添加"
          :image-size="120"
        />
      </div>

      <!-- 步骤3: 成员管理 -->
      <div v-show="currentStep === 2" class="step-panel">
        <div class="panel-actions">
          <el-alert
            v-if="userConfigs.length === 0"
            type="error"
            title="至少需要添加一个成员"
            :closable="false"
            show-icon
          />
          <el-button type="primary" :icon="Plus" @click="handleAddUser"> 添加成员 </el-button>
        </div>

        <el-table :data="userConfigs" border stripe class="config-table">
          <el-table-column label="用户" min-width="300">
            <template #default="{ row }">
              <user-selector v-model="row.userId" />
            </template>
          </el-table-column>
          <el-table-column label="角色" width="220" align="center">
            <template #default="{ row }">
              <el-select v-model="row.role" placeholder="请选择角色" style="width: 100%">
                <el-option label="所有者" value="owner">
                  <div class="simple-option">
                    <el-tag type="danger" size="small">所有者</el-tag>
                    <span class="option-desc">最高权限</span>
                  </div>
                </el-option>
                <el-option label="管理员" value="admin">
                  <div class="simple-option">
                    <el-tag type="warning" size="small">管理员</el-tag>
                    <span class="option-desc">管理权限</span>
                  </div>
                </el-option>
                <el-option label="成员" value="member">
                  <div class="simple-option">
                    <el-tag size="small">成员</el-tag>
                    <span class="option-desc">普通成员</span>
                  </div>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link :icon="Delete" @click="handleDeleteUser($index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-if="userConfigs.length === 0"
          description="暂无成员，请点击上方按钮添加"
          :image-size="120"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" size="large">取消</el-button>
        <el-button v-if="currentStep > 0" @click="handlePrevStep" size="large"> 上一步 </el-button>
        <el-button v-if="currentStep < 2" type="primary" @click="handleNextStep" size="large">
          下一步
        </el-button>
        <el-button
          v-else
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
          size="large"
        >
          {{ submitLoading ? '保存中...' : '完成' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { Plus, Delete, Check } from '@element-plus/icons-vue'
  import {
    getAlertGroupsByIdApi,
    addAlertGroupsApi,
    updateAlertGroupsApi,
    searchAlertGroupMembersApi,
    searchAlertGroupLevelChannelsApi
  } from '@/api/portal/alert'
  import UserSelector from './UserSelector.vue'
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

  const title = computed(() => (props.groupId ? '编辑告警组' : '新增告警组'))

  const currentStep = ref(0)
  const submitLoading = ref(false)
  const baseFormRef = ref<FormInstance>()

  const steps = [
    { title: '基本信息', desc: '设置告警组基础信息' },
    { title: '渠道配置', desc: '配置不同级别的告警渠道' },
    { title: '成员管理', desc: '添加告警组成员' }
  ]

  // 基本信息表单
  const baseForm = reactive({
    groupName: '',
    groupType: 'normal',
    description: '',
    filterRules: '',
    sortOrder: 0,
    dutySchedule: ''
  })

  const baseFormRules = reactive<FormRules>({
    groupName: [{ required: true, message: '请输入告警组名称', trigger: 'blur' }],
    groupType: [{ required: true, message: '请选择组类型', trigger: 'change' }]
  })

  // 渠道配置
  const channelConfigs = ref<Array<{ severity: string; channelIds: number[] }>>([])

  // 告警级别配置 - 修复：type 为空字符串改为 undefined
  const alertLevels = [
    { value: 'default', label: '默认', type: undefined, desc: '默认级别（必选）' },
    { value: 'info', label: '提示', type: 'info', desc: '信息提示' },
    { value: 'warning', label: '警告', type: 'warning', desc: '警告信息' },
    { value: 'critical', label: '严重', type: 'danger', desc: '严重告警' },
    { value: 'notification', label: '通知', type: 'success', desc: '普通通知' }
  ]

  // 成员配置
  const userConfigs = ref<Array<{ userId: number | undefined; role: string }>>([])

  // 验证是否有default级别
  const hasDefaultChannel = computed(() => {
    return channelConfigs.value.some((item) => item.severity === 'default')
  })

  // 点击步骤条切换步骤
  const handleStepClick = (index: number) => {
    currentStep.value = index
  }

  // 加载组数据
  const loadData = async () => {
    if (!props.groupId) return

    try {
      const res = await getAlertGroupsByIdApi(props.groupId)
      baseForm.groupName = res.groupName
      baseForm.groupType = res.groupType
      baseForm.description = res.description || ''
      baseForm.filterRules = res.filterRules || ''
      baseForm.sortOrder = res.sortOrder || 0
      baseForm.dutySchedule = res.dutySchedule || ''

      // 加载成员
      const membersRes = await searchAlertGroupMembersApi({
        groupId: props.groupId,
        page: 1,
        pageSize: 200
      })
      userConfigs.value = (membersRes.items || []).map((item) => ({
        userId: item.userId,
        role: item.role
      }))

      // 加载渠道配置
      const channelsRes = await searchAlertGroupLevelChannelsApi({
        groupId: props.groupId,
        page: 1,
        pageSize: 200
      })
      channelConfigs.value = (channelsRes.items || []).map((item) => ({
        severity: item.severity,
        channelIds: item.channelId.split(',').map((id) => parseInt(id))
      }))
    } catch (error) {
      // 错误已统一处理
    }
  }

  // 添加渠道
  const handleAddChannel = () => {
    channelConfigs.value.push({
      severity: 'default',
      channelIds: []
    })
  }

  // 删除渠道
  const handleDeleteChannel = (index: number) => {
    channelConfigs.value.splice(index, 1)
    validateDefaultChannel()
  }

  // 验证default渠道
  const validateDefaultChannel = () => {
    // 触发computed重新计算
  }

  // 添加成员
  const handleAddUser = () => {
    userConfigs.value.push({
      userId: undefined,
      role: 'member'
    })
  }

  // 删除成员
  const handleDeleteUser = (index: number) => {
    userConfigs.value.splice(index, 1)
  }

  // 上一步
  const handlePrevStep = () => {
    currentStep.value--
  }

  // 下一步
  const handleNextStep = async () => {
    if (currentStep.value === 0) {
      if (!baseFormRef.value) return
      const valid = await baseFormRef.value.validate().catch(() => false)
      if (!valid) return
    } else if (currentStep.value === 1) {
      if (!hasDefaultChannel.value) {
        ElMessage.warning('必须配置 default 级别的告警渠道')
        return
      }
      if (channelConfigs.value.length === 0) {
        ElMessage.warning('请至少配置一个告警渠道')
        return
      }
      const hasEmptyChannel = channelConfigs.value.some(
        (item) => !item.channelIds || item.channelIds.length === 0
      )
      if (hasEmptyChannel) {
        ElMessage.warning('请为每个级别选择至少一个渠道')
        return
      }
    }

    currentStep.value++
  }

  // 提交
  const handleSubmit = async () => {
    if (userConfigs.value.length === 0) {
      ElMessage.warning('请至少添加一个成员')
      return
    }
    const hasEmptyUser = userConfigs.value.some((item) => !item.userId)
    if (hasEmptyUser) {
      ElMessage.warning('请为每个成员选择用户')
      return
    }

    submitLoading.value = true
    try {
      const channels = channelConfigs.value.map((item) => ({
        severity: item.severity,
        channelId: item.channelIds.join(',')
      }))

      if (props.groupId) {
        await updateAlertGroupsApi({
          id: props.groupId,
          groupName: baseForm.groupName,
          groupType: baseForm.groupType,
          description: baseForm.description,
          filterRules: baseForm.filterRules,
          dutySchedule: baseForm.dutySchedule,
          sortOrder: baseForm.sortOrder
        })
        ElMessage.success('更新成功')
      } else {
        await addAlertGroupsApi({
          groupName: baseForm.groupName,
          groupType: baseForm.groupType,
          description: baseForm.description,
          filterRules: baseForm.filterRules,
          dutySchedule: baseForm.dutySchedule,
          sortOrder: baseForm.sortOrder,
          users: userConfigs.value as any,
          channels
        })
        ElMessage.success('新增成功')
      }

      visible.value = false
      emit('success')
    } finally {
      submitLoading.value = false
    }
  }

  // 关闭对话框
  const handleClose = () => {
    currentStep.value = 0
    baseFormRef.value?.resetFields()
    baseForm.groupName = ''
    baseForm.groupType = 'normal'
    baseForm.description = ''
    baseForm.filterRules = ''
    baseForm.sortOrder = 0
    baseForm.dutySchedule = ''
    channelConfigs.value = []
    userConfigs.value = []
  }

  watch(
    () => props.groupId,
    () => {
      if (visible.value && props.groupId) {
        loadData()
      }
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .group-form-dialog {
    :deep(.el-dialog__header) {
      padding: 24px 24px 20px;
      border-bottom: 1px solid #e4e7ed;
    }

    :deep(.el-dialog__body) {
      padding: 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    :deep(.el-dialog__footer) {
      padding: 16px 24px;
      border-top: 1px solid #e4e7ed;
    }
  }

  .steps-container {
    display: flex;
    align-items: flex-start;
    padding: 32px 24px;
    background: #f8f9fa;
    position: relative;

    .step-item {
      flex: 1;
      display: flex;
      align-items: flex-start;
      position: relative;
      cursor: pointer;
      transition: all 0.3s;

      &.clickable:hover {
        .step-number {
          transform: scale(1.1);
        }

        .step-title {
          color: #409eff;
        }
      }

      .step-number {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #e4e7ed;
        color: #909399;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 16px;
        flex-shrink: 0;
        transition: all 0.3s;
        position: relative;
        z-index: 2;

        .check-icon {
          font-size: 20px;
        }
      }

      .step-info {
        margin-left: 12px;
        flex: 1;
        min-width: 0;

        .step-title {
          font-size: 14px;
          font-weight: 600;
          color: #606266;
          margin-bottom: 4px;
          transition: all 0.3s;
        }

        .step-desc {
          font-size: 12px;
          color: #909399;
        }
      }

      .step-line {
        position: absolute;
        top: 18px;
        left: calc(36px + 12px);
        width: calc(100% - 36px - 24px);
        height: 2px;
        background: #e4e7ed;
        transition: all 0.3s;
      }

      &:last-child .step-line {
        display: none;
      }

      &.active {
        .step-number {
          background: #409eff;
          color: white;
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
        }

        .step-title {
          color: #409eff;
        }
      }

      &.completed {
        .step-number {
          background: #67c23a;
          color: white;
        }

        .step-title {
          color: #303133;
        }

        .step-line {
          background: #67c23a;
        }
      }
    }
  }

  .step-content {
    padding: 24px 32px 32px;

    :deep(.el-form-item) {
      margin-bottom: 24px;
    }

    .type-selector {
      display: flex;
      gap: 16px;
      width: 100%;

      .type-option {
        flex: 1;
        border: 1.5px solid #dcdfe6;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: #fff;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
        }

        &.active {
          border-color: #409eff;
          background: #ecf5ff;
          box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
        }

        .option-content {
          .option-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;

            .option-title {
              font-size: 15px;
              font-weight: 600;
              color: #303133;
            }

            .check-icon {
              font-size: 18px;
            }
          }

          .option-desc {
            font-size: 13px;
            color: #909399;
            line-height: 1.5;
          }
        }
      }
    }

    .panel-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;

      .el-alert {
        flex: 1;
      }
    }

    .config-table {
      margin-top: 16px;
      border-radius: 8px;
      overflow: hidden;

      :deep(.el-table__header) {
        th {
          background: #f5f7fa;
          color: #606266;
          font-weight: 600;
        }
      }
    }

    .form-tip {
      margin-top: 6px;
      font-size: 12px;
      color: #909399;
      line-height: 1.6;
    }

    .simple-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;

      .option-name {
        flex: 1;
        color: #303133;
      }

      .option-desc {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
