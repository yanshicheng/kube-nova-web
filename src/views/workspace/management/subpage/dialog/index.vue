<template>
  <ElDialog
    v-model="visible"
    :title="mode === 'create' ? '创建工作空间' : '编辑工作空间'"
    width="1200px"
    @close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    destroy-on-close
    class="workspace-dialog"
  >
    <div class="dialog-container">
      <!-- 标签页内容 -->
      <ElTabs v-model="activeTab" class="workspace-tabs">
        <ElTabPane name="basic">
          <template #label>
            <span class="tab-label">
              <ElIcon><Document /></ElIcon>
              基础信息
              <ElTag v-if="!basicInfoValid" type="danger" size="small" style="margin-left: 8px"
                >必填</ElTag
              >
            </span>
          </template>
          <BasicInfo
            ref="basicInfoRef"
            :form-data="formData"
            :mode="mode"
            @update="updateFormData"
          />
        </ElTabPane>

        <ElTabPane name="quota">
          <template #label>
            <span class="tab-label">
              <ElIcon><DataAnalysis /></ElIcon>
              资源配额
              <ElTag v-if="!quotaValid" type="danger" size="small" style="margin-left: 8px"
                >必填</ElTag
              >
            </span>
          </template>
          <ResourceQuota
            ref="resourceQuotaRef"
            :form-data="formData"
            :cluster="cluster"
            :workspace="workspace"
            :mode="mode"
            @update="updateFormData"
          />
        </ElTabPane>

        <ElTabPane name="limitrange">
          <template #label>
            <span class="tab-label">
              <ElIcon><Setting /></ElIcon>
              限制策略
              <ElTag type="info" size="small" style="margin-left: 8px">选填</ElTag>
            </span>
          </template>
          <LimitRange
            ref="limitRangeRef"
            :form-data="formData"
            :mode="mode"
            @update="updateFormData"
          />
        </ElTabPane>

        <ElTabPane name="confirm" v-if="mode === 'create'">
          <template #label>
            <span class="tab-label">
              <ElIcon><CircleCheck /></ElIcon>
              确认信息
            </span>
          </template>
          <ConfirmationView :form-data="formData" :cluster="cluster" />
        </ElTabPane>
      </ElTabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <ElButton @click="handleClose" :disabled="submitting">
            <ElIcon><Close /></ElIcon>
            取消
          </ElButton>
        </div>
        <div class="footer-right">
          <ElButton v-if="activeTab !== 'basic'" @click="handlePrevTab" :disabled="submitting">
            <ElIcon><ArrowLeft /></ElIcon>
            上一步
          </ElButton>
          <ElButton
            v-if="mode === 'create' && activeTab !== 'confirm'"
            type="primary"
            @click="handleNextTab"
            :disabled="submitting"
          >
            下一步
            <ElIcon><ArrowRight /></ElIcon>
          </ElButton>
          <ElButton
            v-if="(mode === 'create' && activeTab === 'confirm') || mode === 'edit'"
            type="primary"
            @click="handleSubmit"
            :loading="submitting"
          >
            <ElIcon><Check /></ElIcon>
            {{ mode === 'create' ? '确认创建' : '保存修改' }}
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Document,
    DataAnalysis,
    Setting,
    CircleCheck,
    Close,
    ArrowLeft,
    ArrowRight,
    Check
  } from '@element-plus/icons-vue'
  import {
    addProjectWorkspaceApi,
    updateProjectWorkspaceApi,
    type ProjectCluster,
    type ProjectWorkspace,
    type AddProjectWorkspaceRequest,
    type UpdateProjectWorkspaceRequest
  } from '@/api'
  import BasicInfo from './BasicInfo.vue'
  import ResourceQuota from './ResourceQuota.vue'
  import LimitRange from './LimitRange.vue'
  import ConfirmationView from './ConfirmationView.vue'

  interface Props {
    modelValue: boolean
    mode: 'create' | 'edit'
    workspace?: ProjectWorkspace | null
    project: any
    cluster?: ProjectCluster | null
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 状态
  const activeTab = ref('basic')
  const submitting = ref(false)
  const submitSuccess = ref(false)
  const cluster = ref<ProjectCluster | null>(null)
  const basicInfoRef = ref()
  const resourceQuotaRef = ref()
  const limitRangeRef = ref()

  // 表单数据
  const getDefaultFormData = () => ({
    name: '',
    namespace: '',
    description: '',
    // 基础资源 - 字符串格式
    cpuAllocated: '0',
    memAllocated: '0',
    storageAllocated: '0',
    gpuAllocated: '0',
    // 对象限制
    podsAllocated: 1,
    configmapAllocated: 0,
    secretAllocated: 0,
    pvcAllocated: 0,
    ephemeralStorageAllocated: '0',
    serviceAllocated: 0,
    loadbalancersAllocated: 0,
    nodeportsAllocated: 0,
    deploymentsAllocated: 0,
    jobsAllocated: 0,
    cronjobsAllocated: 0,
    daemonsetsAllocated: 0,
    statefulsetsAllocated: 0,
    ingressesAllocated: 0,
    // LimitRange - 字符串格式
    podMaxCpu: '8',
    podMaxMemory: '16Gi',
    podMaxEphemeralStorage: '10Gi',
    podMinCpu: '10m',
    podMinMemory: '128Mi',
    podMinEphemeralStorage: '100Mi',
    containerMaxCpu: '4',
    containerMaxMemory: '8Gi',
    containerMaxEphemeralStorage: '5Gi',
    containerMinCpu: '10m',
    containerMinMemory: '64Mi',
    containerMinEphemeralStorage: '50Mi',
    containerDefaultCpu: '1',
    containerDefaultMemory: '1Gi',
    containerDefaultEphemeralStorage: '1Gi',
    containerDefaultRequestCpu: '500m',
    containerDefaultRequestMemory: '512Mi',
    containerDefaultRequestEphemeralStorage: '500Mi',
    isSystem: 0
  })

  const formData =
    ref<Partial<AddProjectWorkspaceRequest & UpdateProjectWorkspaceRequest>>(getDefaultFormData())

  // 计算属性
  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 验证状态
  const basicInfoValid = computed(() => {
    return !!(formData.value.name && formData.value.namespace)
  })

  const quotaValid = computed(() => {
    const cpu = formData.value.cpuAllocated
    const mem = formData.value.memAllocated
    const pods = formData.value.podsAllocated
    return !!(cpu && cpu !== '0' && mem && mem !== '0' && pods && pods > 0)
  })

  // 更新表单数据
  const updateFormData = (data: any) => {
    formData.value = { ...formData.value, ...data }
  }

  // 监听对话框打开
  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal) {
        submitSuccess.value = false
        cluster.value = props.cluster || null
        activeTab.value = 'basic'

        if (props.workspace && props.mode === 'edit') {
          formData.value = {
            ...getDefaultFormData(),
            ...props.workspace,
            isSystem: 0
          }
        } else {
          formData.value = getDefaultFormData()
        }
      }
    },
    { immediate: true }
  )

  // 标签页导航
  const tabOrder = ['basic', 'quota', 'limitrange', 'confirm']

  const handleNextTab = async () => {
    // 验证当前标签页
    if (activeTab.value === 'basic') {
      const valid = await basicInfoRef.value?.validate()
      if (!valid) {
        return
      }
    } else if (activeTab.value === 'quota') {
      const valid = await resourceQuotaRef.value?.validate()
      if (!valid) {
        return
      }
    }

    const currentIndex = tabOrder.indexOf(activeTab.value)
    if (currentIndex < tabOrder.length - 1) {
      activeTab.value = tabOrder[currentIndex + 1]
    }
  }

  const handlePrevTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab.value)
    if (currentIndex > 0) {
      activeTab.value = tabOrder[currentIndex - 1]
    }
  }

  // 提交
  const handleSubmit = async () => {
    try {
      if (!cluster.value) {
        return
      }

      // 编辑模式验证当前表单
      if (props.mode === 'edit') {
        let valid = true
        if (activeTab.value === 'basic') {
          valid = await basicInfoRef.value?.validate()
        } else if (activeTab.value === 'quota') {
          valid = await resourceQuotaRef.value?.validate()
        } else if (activeTab.value === 'limitrange') {
          valid = await limitRangeRef.value?.validate()
        }
        if (!valid) return
      }

      // 创建模式最终确认
      if (props.mode === 'create') {
        await ElMessageBox.confirm(
          '请确认工作空间配置无误，创建后命名空间将无法修改。',
          '创建确认',
          {
            confirmButtonText: '确认创建',
            cancelButtonText: '返回检查',
            type: 'warning'
          }
        )
      }

      submitting.value = true

      const submitData = { ...formData.value }

      if (props.mode === 'create') {
        const createData: AddProjectWorkspaceRequest = {
          projectClusterId: cluster.value.id,
          clusterUuid: cluster.value.clusterUuid,
          ...(submitData as AddProjectWorkspaceRequest),
          isSystem: 0
        }
        await addProjectWorkspaceApi(createData)
        ElMessage.success('工作空间创建成功')
      } else {
        const updateData: UpdateProjectWorkspaceRequest = {
          ...(submitData as UpdateProjectWorkspaceRequest),
          isSystem: 0
        }
        await updateProjectWorkspaceApi(props.workspace!.id, updateData)
        ElMessage.success('工作空间更新成功')
      }

      submitSuccess.value = true
      emit('success')
      resetAndClose()
    } catch (error: any) {
      if (error === 'cancel') return
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  }

  // 关闭对话框
  const handleClose = () => {
    if (submitting.value || submitSuccess.value) {
      resetAndClose()
      return
    }

    const hasContent = formData.value.name || formData.value.namespace || formData.value.description

    if (hasContent) {
      ElMessageBox.confirm('您填写的内容尚未提交，确定要关闭吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          resetAndClose()
        })
        .catch(() => {})
    } else {
      resetAndClose()
    }
  }

  const resetAndClose = () => {
    visible.value = false
    activeTab.value = 'basic'
    formData.value = getDefaultFormData()
    submitSuccess.value = false
  }
</script>

<style lang="scss" scoped>
  .workspace-dialog {
    :deep(.el-dialog__body) {
      padding: 0;
      max-height: 75vh;
      overflow-y: auto;
    }

    .dialog-container {
      .workspace-tabs {
        padding: 0 24px;

        .tab-label {
          display: flex;
          align-items: center;
          gap: 6px;

          .el-icon {
            font-size: 16px;
          }
        }

        :deep(.el-tabs__header) {
          margin-bottom: 0;
          background: #f5f7fa;
          padding: 12px 0;
        }

        :deep(.el-tabs__content) {
          padding: 24px 0;
        }
      }
    }

    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      background: #f5f7fa;

      .footer-left,
      .footer-right {
        display: flex;
        gap: 12px;
      }

      .el-button {
        min-width: 100px;
      }
    }
  }
</style>
