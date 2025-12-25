<template>
  <ElDialog v-model="visible" title="Secret 引用情况" width="900px" @closed="handleClosed">
    <ElSkeleton v-if="loading" :rows="6" animated />

    <template v-else-if="usage">
      <!-- 基本信息 -->
      <div class="usage-summary">
        <div class="summary-item">
          <span class="label">Secret 名称:</span>
          <span class="value">{{ usage.secretName }}</span>
        </div>
        <div class="summary-item">
          <span class="label">命名空间:</span>
          <span class="value">{{ usage.secretNamespace }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Secret 类型:</span>
          <ElTag :type="getTypeTag(usage.secretType).type as any" size="large">
            {{ getTypeTag(usage.secretType).label }}
          </ElTag>
        </div>
        <div class="summary-item">
          <span class="label">引用次数:</span>
          <ElTag :type="usage.totalUsageCount > 0 ? 'warning' : 'success'" size="large">
            {{ usage.totalUsageCount }} 次
          </ElTag>
        </div>
        <div class="summary-item">
          <span class="label">可删除:</span>
          <ElTag :type="usage.canDelete ? 'success' : 'danger'" size="large">
            {{ usage.canDelete ? '是' : '否' }}
          </ElTag>
        </div>
      </div>

      <!-- 删除警告 -->
      <ElAlert v-if="usage.deleteWarning" type="warning" :closable="false" style="margin-top: 16px">
        <template #title>
          <div style="display: flex; align-items: center; gap: 8px">
            <AlertCircle :size="16" />
            <span>{{ usage.deleteWarning }}</span>
          </div>
        </template>
      </ElAlert>

      <!-- 引用列表 -->
      <div v-if="usage.usedBy && usage.usedBy.length > 0" class="usage-list">
        <div class="section-title">
          <Link :size="16" />
          <span>被以下资源引用</span>
        </div>

        <div class="usage-items">
          <div v-for="(ref, index) in usage.usedBy" :key="index" class="usage-item">
            <div class="usage-header">
              <div class="resource-info">
                <ElTag type="primary" size="small">{{ ref.resourceType }}</ElTag>
                <span class="resource-name">{{ ref.resourceName }}</span>
                <span class="namespace-tag">{{ ref.namespace }}</span>
              </div>
            </div>

            <div class="usage-details">
              <div v-if="ref.usageType && ref.usageType.length > 0" class="detail-row">
                <span class="detail-label">使用方式:</span>
                <div class="detail-value">
                  <ElTag
                    v-for="type in ref.usageType"
                    :key="type"
                    size="small"
                    :type="getUsageTypeTag(type)"
                    style="margin-right: 8px"
                  >
                    {{ getUsageTypeLabel(type) }}
                  </ElTag>
                </div>
              </div>

              <div v-if="ref.usedKeys && ref.usedKeys.length > 0" class="detail-row">
                <span class="detail-label">使用的 Key:</span>
                <div class="detail-value">
                  <ElTag
                    v-for="key in ref.usedKeys"
                    :key="key"
                    type="info"
                    size="small"
                    style="margin-right: 8px"
                  >
                    {{ key }}
                  </ElTag>
                </div>
              </div>

              <div v-if="ref.containerNames && ref.containerNames.length > 0" class="detail-row">
                <span class="detail-label">容器:</span>
                <div class="detail-value">
                  <ElTag
                    v-for="container in ref.containerNames"
                    :key="container"
                    type="success"
                    size="small"
                    style="margin-right: 8px"
                  >
                    {{ container }}
                  </ElTag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无引用提示 -->
      <ElEmpty v-else description="该 Secret 暂未被任何资源引用" :image-size="100">
        <template #image>
          <div class="empty-icon">
            <CheckCircle :size="48" />
          </div>
        </template>
        <template #description>
          <div class="empty-text">
            <h4>该 Secret 暂未被任何资源引用</h4>
            <p>可以安全删除</p>
          </div>
        </template>
      </ElEmpty>
    </template>

    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Link, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { getSecretUsageApi, type SecretUsageResponse, type ProjectWorkspace } from '@/api'

interface Props {
  modelValue: boolean
  secretName: string
  workspace: ProjectWorkspace | null
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const usage = ref<SecretUsageResponse | null>(null)

// 获取 Secret 类型标签
const getTypeTag = (type: string) => {
  const typeMap: Record<string, { type: string; label: string }> = {
    'Opaque': { type: 'info', label: 'Opaque' },
    'kubernetes.io/tls': { type: 'success', label: 'TLS 证书' },
    'kubernetes.io/dockerconfigjson': { type: 'warning', label: 'Docker 配置' },
    'kubernetes.io/service-account-token': { type: 'primary', label: 'SA Token' },
    'kubernetes.io/basic-auth': { type: 'danger', label: 'Basic Auth' },
    'kubernetes.io/ssh-auth': { type: '', label: 'SSH Auth' }
  }
  return typeMap[type] || { type: 'info', label: type }
}

// 获取使用类型标签
const getUsageTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    'volume': 'primary',
    'env': 'success',
    'envFrom': 'warning',
    'imagePullSecret': 'danger',
    'serviceAccountToken': 'info'
  }
  return typeMap[type] || ''
}

// 获取使用类型标签文本
const getUsageTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    'volume': '挂载卷',
    'env': '环境变量',
    'envFrom': '环境变量(EnvFrom)',
    'imagePullSecret': '镜像拉取密钥',
    'serviceAccountToken': 'ServiceAccount Token'
  }
  return labelMap[type] || type
}

// 监听弹窗打开
watch(visible, (val) => {
  if (val) {
    loadUsage()
  }
})

// 加载引用情况
const loadUsage = async () => {
  if (!props.workspace || !props.secretName) {
    return
  }

  loading.value = true
  try {
    usage.value = await getSecretUsageApi({
      workloadId: props.workspace.id,
      name: props.secretName
    })
  } catch (error) {
    console.error('加载引用情况失败:', error)
    visible.value = false
  } finally {
    loading.value = false
  }
}

// 弹窗关闭
const handleClosed = () => {
  usage.value = null
}
</script>

<style lang="scss" scoped>
.usage-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;

  .summary-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .label {
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }

    .value {
      font-size: 14px;
      color: #303133;
      font-weight: 600;
    }
  }
}

.usage-list {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e4e7ed;
  }

  .usage-items {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .usage-item {
    padding: 16px;
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-color: #67c23a;
    }

    .usage-header {
      margin-bottom: 12px;

      .resource-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .resource-name {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }

        .namespace-tag {
          font-size: 13px;
          color: #909399;
        }
      }
    }

    .usage-details {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .detail-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        .detail-label {
          flex-shrink: 0;
          width: 120px;
          font-size: 13px;
          color: #606266;
          font-weight: 500;
        }

        .detail-value {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    }
  }
}

.empty-icon {
  color: #67c23a;
  margin-bottom: 16px;
}

.empty-text {
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: #67c23a;
    margin: 0;
  }
}
</style>