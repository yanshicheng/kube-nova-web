<template>
  <ElDialog
    v-model="visible"
    title="🚀 部署全部告警规则到集群"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="deploy-all-container">
      <!-- 部署提示 -->
      <ElAlert type="warning" :closable="false" show-icon class="deploy-alert">
        <template #title>
          <div class="deploy-tips">
            <strong>⚠️ 注意：</strong>
            此操作将把系统中所有启用的告警规则部署到指定集群，请确认目标集群和命名空间正确无误。
          </div>
        </template>
      </ElAlert>

      <ElForm
        ref="formRef"
        :model="deployForm"
        :rules="rules"
        label-position="top"
        class="deploy-form"
      >
        <!-- 目标集群 -->
        <ElFormItem label="目标集群" prop="clusterUuid">
          <ElSelect
            v-model="deployForm.clusterUuid"
            placeholder="请选择要部署的目标集群"
            style="width: 100%"
            :loading="clusterLoading"
            filterable
            clearable
            size="large"
            @change="handleClusterChange"
            @visible-change="handleClusterDropdownVisible"
          >
            <ElOption
              v-for="cluster in clusterList"
              :key="cluster.uuid"
              :label="`${cluster.name} (${cluster.environment})`"
              :value="cluster.uuid"
            >
              <div class="cluster-option">
                <div class="cluster-info">
                  <span class="cluster-name">{{ cluster.name }}</span>
                  <div class="cluster-tags">
                    <ElTag size="small" :type="getEnvironmentType(cluster.environment)">
                      {{ cluster.environment }}
                    </ElTag>
                    <ElTag size="small" type="info">{{ cluster.version }}</ElTag>
                    <ElTag size="small" :type="getHealthStatusType(cluster.healthStatus)">
                      {{ getHealthStatusLabel(cluster.healthStatus) }}
                    </ElTag>
                  </div>
                </div>
              </div>
            </ElOption>

            <template #footer>
              <div v-if="hasMoreClusters" class="select-footer">
                <ElButton
                  size="small"
                  text
                  :loading="clusterLoading"
                  @click.stop="loadMoreClusters"
                >
                  {{ clusterLoading ? '加载中...' : '加载更多' }}
                </ElButton>
              </div>
            </template>
          </ElSelect>
        </ElFormItem>

        <!-- 命名空间 -->
        <ElFormItem label="命名空间" prop="namespace">
          <ElSelect
            v-model="deployForm.namespace"
            placeholder="请选择命名空间"
            style="width: 100%"
            :loading="namespaceLoading"
            filterable
            clearable
            size="large"
            :disabled="!deployForm.clusterUuid"
            @visible-change="handleNamespaceDropdownVisible"
          >
            <ElOption v-for="ns in namespaceList" :key="ns" :label="ns" :value="ns">
              <div class="namespace-option">
                <ElIcon><FolderOpened /></ElIcon>
                <span>{{ ns }}</span>
              </div>
            </ElOption>
          </ElSelect>
          <div class="form-tip" v-if="!deployForm.clusterUuid"> 💡 请先选择目标集群 </div>
        </ElFormItem>
      </ElForm>

      <!-- 部署统计预览 -->
      <div class="deploy-preview" v-if="deployForm.clusterUuid && deployForm.namespace">
        <div class="preview-header">
          <ElIcon><InfoFilled /></ElIcon>
          <span>部署预览</span>
        </div>
        <div class="preview-content">
          <div class="preview-item">
            <span class="label">目标集群：</span>
            <span class="value">{{ getSelectedClusterName() }}</span>
          </div>
          <div class="preview-item">
            <span class="label">命名空间：</span>
            <span class="value">{{ deployForm.namespace }}</span>
          </div>
          <div class="preview-item">
            <span class="label">部署范围：</span>
            <span class="value highlight">所有启用的告警规则</span>
          </div>
        </div>
      </div>

      <!-- 部署结果 -->
      <div v-if="deployResult" class="deploy-result">
        <ElAlert
          :type="deployResult.success ? 'success' : 'error'"
          :title="deployResult.success ? '✅ 部署成功' : '❌ 部署失败'"
          :closable="true"
          show-icon
          @close="deployResult = null"
        >
          <div v-if="deployResult.success" class="result-content">
            <div
              >集群：<strong>{{ deployResult.clusterName }}</strong></div
            >
            <div
              >命名空间：<strong>{{ deployResult.namespace }}</strong></div
            >
          </div>
          <div v-else>{{ deployResult.message }}</div>
        </ElAlert>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="visible = false" size="large">
          <ElIcon><Close /></ElIcon>
          取消
        </ElButton>
        <ElButton
          type="primary"
          size="large"
          :loading="loading"
          @click="handleDeploy"
          :disabled="!canDeploy"
        >
          <ElIcon><Position /></ElIcon>
          {{ loading ? '部署中...' : '确认部署全部' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { Close, Position, FolderOpened, InfoFilled } from '@element-plus/icons-vue'
  import { deployAllAlertRulesApi } from '@/api/manager/alert'
  import { searchClusterApi, getClusterNamespaceListApi, type Cluster } from '@/api/manager/cluster'

  interface Props {
    modelValue: boolean
  }

  interface DeployResult {
    success: boolean
    clusterName?: string
    namespace?: string
    message?: string
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    success: []
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const clusterLoading = ref(false)
  const namespaceLoading = ref(false)

  const clusterList = ref<Cluster[]>([])
  const clusterPagination = reactive({
    current: 1,
    size: 20,
    total: 0
  })

  const namespaceList = ref<string[]>([])
  const deployResult = ref<DeployResult | null>(null)

  const deployForm = reactive({
    clusterUuid: '',
    namespace: 'monitoring'
  })

  const rules: FormRules = {
    clusterUuid: [{ required: true, message: '请选择目标集群', trigger: 'change' }],
    namespace: [{ required: true, message: '请选择命名空间', trigger: 'change' }]
  }

  const canDeploy = computed(() => {
    return deployForm.clusterUuid && deployForm.namespace
  })

  const hasMoreClusters = computed(() => {
    return clusterList.value.length < clusterPagination.total
  })

  const getSelectedClusterName = () => {
    const cluster = clusterList.value.find((c) => c.uuid === deployForm.clusterUuid)
    return cluster?.name || deployForm.clusterUuid
  }

  const loadClusterList = async (append = false) => {
    try {
      clusterLoading.value = true
      const res = await searchClusterApi({
        page: clusterPagination.current,
        pageSize: clusterPagination.size,
        orderStr: 'id',
        isAsc: false
      })

      if (append) {
        clusterList.value = [...clusterList.value, ...res.items]
      } else {
        clusterList.value = res.items
      }

      clusterPagination.total = res.total
    } catch (error) {
      console.error('加载集群列表失败:', error)
    } finally {
      clusterLoading.value = false
    }
  }

  const loadMoreClusters = async () => {
    clusterPagination.current++
    await loadClusterList(true)
  }

  const handleClusterDropdownVisible = (visible: boolean) => {
    if (visible && clusterList.value.length === 0) {
      clusterPagination.current = 1
      loadClusterList()
    }
  }

  const handleClusterChange = async (uuid: string) => {
    deployResult.value = null
    deployForm.namespace = 'monitoring'
    namespaceList.value = []

    if (uuid) {
      await loadNamespaceList(uuid)
    }
  }

  const loadNamespaceList = async (clusterUuid: string) => {
    try {
      namespaceLoading.value = true
      const res = await getClusterNamespaceListApi(clusterUuid)
      namespaceList.value = res || []
    } catch (error) {
      console.error('加载命名空间列表失败:', error)
    } finally {
      namespaceLoading.value = false
    }
  }

  const handleNamespaceDropdownVisible = (visible: boolean) => {
    // 可以在这里添加额外的逻辑
  }

  const getEnvironmentType = (env: string) => {
    const typeMap: Record<string, any> = {
      production: 'danger',
      staging: 'warning',
      development: 'info',
      test: 'info'
    }
    return typeMap[env] || 'info'
  }

  const getHealthStatusType = (status: number) => {
    const typeMap: Record<number, any> = {
      1: 'success',
      2: 'danger',
      3: 'warning',
      4: 'info'
    }
    return typeMap[status] || 'info'
  }

  const getHealthStatusLabel = (status: number) => {
    const labelMap: Record<number, string> = {
      1: '健康',
      2: '不健康',
      3: '降级',
      4: '未知'
    }
    return labelMap[status] || '未知'
  }

  const handleDeploy = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      loading.value = true
      deployResult.value = null

      await deployAllAlertRulesApi({
        clusterUuid: deployForm.clusterUuid,
        namespace: deployForm.namespace
      })

      const cluster = clusterList.value.find((c) => c.uuid === deployForm.clusterUuid)

      deployResult.value = {
        success: true,
        clusterName: cluster?.name || deployForm.clusterUuid,
        namespace: deployForm.namespace
      }

      ElMessage.success('全部告警规则部署成功！')

      setTimeout(() => {
        emit('success')
        visible.value = false
      }, 2000)
    } catch (error: any) {

    } finally {
      loading.value = false
    }
  }

  const handleClosed = () => {
    deployForm.clusterUuid = ''
    deployForm.namespace = 'monitoring'
    deployResult.value = null
    clusterList.value = []
    namespaceList.value = []
    clusterPagination.current = 1
    clusterPagination.total = 0
    formRef.value?.clearValidate()
  }

  watch(
    () => visible.value,
    (newVisible) => {
      if (newVisible) {
        // 对话框打开时可以预加载集群列表
      }
    }
  )
</script>

<style scoped lang="scss">
  .deploy-all-container {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .deploy-alert {
      .deploy-tips {
        line-height: 1.8;

        strong {
          margin-right: 8px;
        }
      }
    }

    .deploy-form {
      .form-tip {
        margin-top: 8px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }

      .cluster-option {
        padding: 8px 0;

        .cluster-info {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .cluster-name {
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .cluster-tags {
            display: flex;
            gap: 8px;
          }
        }
      }

      .namespace-option {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .select-footer {
        padding: 8px;
        text-align: center;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }

    .deploy-preview {
      background: var(--el-fill-color-light);
      border-radius: 8px;
      overflow: hidden;

      .preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--el-color-primary-light-9);
        border-bottom: 1px solid var(--el-border-color-lighter);
        font-weight: 500;
        color: var(--el-color-primary);
      }

      .preview-content {
        padding: 16px;

        .preview-item {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px dashed var(--el-border-color-lighter);

          &:last-child {
            border-bottom: none;
          }

          .label {
            width: 100px;
            color: var(--el-text-color-secondary);
            flex-shrink: 0;
          }

          .value {
            flex: 1;
            font-weight: 500;
            color: var(--el-text-color-primary);

            &.highlight {
              color: var(--el-color-primary);
            }
          }
        }
      }
    }

    .deploy-result {
      animation: slideIn 0.3s ease-out;

      .result-content {
        div {
          margin: 4px 0;

          strong {
            color: var(--el-color-primary);
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
