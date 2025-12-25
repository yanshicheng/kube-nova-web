<template>
  <ElDialog v-model="visible" title="Secret 详情" width="900px" @closed="handleClosed">
    <!-- 模式切换 -->
    <div class="mode-switch">
      <ElRadioGroup v-model="viewMode" size="default">
        <ElRadioButton value="form">
          <div class="radio-content">
            <FileEdit :size="16" />
            <span>表单模式</span>
          </div>
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <div class="radio-content">
            <Code :size="16" />
            <span>YAML 模式</span>
          </div>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <ElSkeleton v-if="loading" :rows="8" animated />

    <!-- 表单模式 -->
    <template v-else-if="detail && viewMode === 'form'">
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="名称">{{ detail.name }}</ElDescriptionsItem>
        <ElDescriptionsItem label="命名空间">{{ detail.namespace }}</ElDescriptionsItem>
        <ElDescriptionsItem label="类型" :span="2">
          <ElTag :type="getTypeTag(detail.type)" size="small">
            {{ getTypeLabel(detail.type) }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间" :span="2">
          {{ formatTimestamp(detail.creationTimestamp) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="运行时长" :span="2">{{ detail.age }}</ElDescriptionsItem>
      </ElDescriptions>

      <!-- 标签 -->
      <div v-if="hasLabels" class="section">
        <div class="section-title">标签（Labels）</div>
        <ElTag v-for="(value, key) in detail.labels" :key="key" class="tag-item" type="info">
          {{ key }}={{ value }}
        </ElTag>
      </div>

      <!-- 注解 -->
      <div v-if="hasAnnotations" class="section">
        <div class="section-title">注解（Annotations）</div>
        <div class="annotations-list">
          <div v-for="(value, key) in detail.annotations" :key="key" class="annotation-item">
            <span class="annotation-key">{{ key }}:</span>
            <span class="annotation-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <!-- 数据项 -->
      <div class="section">
        <div class="section-title">
          <span>数据项（Data）</span>
          <ElSwitch
            v-model="showDecoded"
            inline-prompt
            active-text="明文"
            inactive-text="密文"
            style="margin-left: 16px"
          />
        </div>
        <ElAlert type="warning" :closable="false" style="margin-bottom: 12px">
          <template #title>
            <div style="display: flex; align-items: center; gap: 8px">
              <ShieldAlert :size="16" />
              <span>敏感数据，默认显示 Base64 编码，可通过开关或单独点击眼睛图标查看明文</span>
            </div>
          </template>
        </ElAlert>
        <div v-if="detail.data && Object.keys(detail.data).length > 0" class="data-list">
          <div v-for="(value, key) in detail.data" :key="key" class="data-item">
            <div class="data-key">
              <Lock :size="16" />
              <span>{{ key }}</span>
              <ElButton
                :icon="dataVisibility[key] ? Eye : EyeOff"
                circle
                size="small"
                @click="toggleDataVisibility(key)"
                class="visibility-btn"
                :title="dataVisibility[key] ? '显示 Base64' : '显示明文'"
              />
            </div>
            <ElInput
              :model-value="dataVisibility[key] ? decodeData(value) : value"
              :type="dataVisibility[key] ? 'textarea' : 'text'"
              :rows="dataVisibility[key] ? 4 : 1"
              :placeholder="dataVisibility[key] ? '明文内容' : 'Base64 编码'"
              readonly
              class="data-value"
            />
          </div>
        </div>
        <ElEmpty v-else description="暂无数据" :image-size="80" />
      </div>
    </template>

    <!-- YAML 模式 -->
    <div v-else-if="viewMode === 'yaml'">
      <ElSkeleton v-if="loadingYaml" :rows="8" animated />
      <YamlEditor
        v-else
        v-model="yamlContent"
        :filename="`${secretName}.yaml`"
        :readonly="true"
        height="500px"
      />
    </div>

    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, ShieldAlert, Eye, EyeOff, FileEdit, Code } from 'lucide-vue-next'
import { getSecretDetailApi, getSecretYamlApi, type SecretDetail, type ProjectWorkspace } from '@/api'
import YamlEditor from '@/components/yaml-editor-pro/index.vue'

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
const loadingYaml = ref(false)
const detail = ref<SecretDetail | null>(null)
const showDecoded = ref(false)
const dataVisibility = ref<Record<string, boolean>>({})
const viewMode = ref<'form' | 'yaml'>('form')
const yamlContent = ref('')

const hasLabels = computed(() => {
  return detail.value?.labels && Object.keys(detail.value.labels).length > 0
})

const hasAnnotations = computed(() => {
  return detail.value?.annotations && Object.keys(detail.value.annotations).length > 0
})

const getTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    Opaque: 'info',
    'kubernetes.io/tls': 'success',
    'kubernetes.io/dockerconfigjson': 'warning',
    'kubernetes.io/service-account-token': 'primary',
    'kubernetes.io/basic-auth': 'danger',
    'kubernetes.io/ssh-auth': ''
  }
  return typeMap[type] || 'info'
}

const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    Opaque: 'Opaque',
    'kubernetes.io/tls': 'TLS 证书',
    'kubernetes.io/dockerconfigjson': 'Docker 配置',
    'kubernetes.io/service-account-token': 'SA Token',
    'kubernetes.io/basic-auth': 'Basic Auth',
    'kubernetes.io/ssh-auth': 'SSH Auth'
  }
  return labelMap[type] || type
}

const toggleDataVisibility = (key: string) => {
  dataVisibility.value[key] = !dataVisibility.value[key]
}

watch(showDecoded, (val) => {
  if (detail.value?.data) {
    Object.keys(detail.value.data).forEach((key) => {
      dataVisibility.value[key] = val
    })
  }
})

watch(viewMode, (newMode) => {
  if (newMode === 'yaml' && !yamlContent.value) {
    loadYaml()
  }
})

watch(visible, (val) => {
  if (val) {
    viewMode.value = 'form'
    yamlContent.value = ''
    loadDetail()
  }
})

const loadDetail = async () => {
  if (!props.workspace || !props.secretName) return

  loading.value = true
  try {
    detail.value = await getSecretDetailApi({
      workloadId: props.workspace.id,
      name: props.secretName
    })

    if (detail.value?.data) {
      Object.keys(detail.value.data).forEach((key) => {
        dataVisibility.value[key] = false
      })
    }
  } catch (error) {
    console.error('加载Secret详情失败:', error)
    visible.value = false
  } finally {
    loading.value = false
  }
}

const loadYaml = async () => {
  if (!props.workspace || !props.secretName) return

  loadingYaml.value = true
  try {
    yamlContent.value = await getSecretYamlApi({
      workloadId: props.workspace.id,
      name: props.secretName
    })
  } catch (error) {
    console.error('加载YAML失败:', error)
  } finally {
    loadingYaml.value = false
  }
}

const decodeData = (base64Str: string): string => {
  try {
    return decodeURIComponent(escape(atob(base64Str)))
  } catch {
    return '[解码失败]'
  }
}

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const handleClosed = () => {
  detail.value = null
  showDecoded.value = false
  dataVisibility.value = {}
  viewMode.value = 'form'
  yamlContent.value = ''
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

.section {
  margin-top: 24px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
  }

  .tag-item {
    margin-right: 8px;
    margin-bottom: 8px;
  }

  .annotations-list {
    .annotation-item {
      padding: 8px 12px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 13px;

      .annotation-key {
        color: #606266;
        font-weight: 500;
        margin-right: 8px;
      }

      .annotation-value {
        color: #909399;
      }
    }
  }

  .data-list {
    .data-item {
      margin-bottom: 16px;

      .data-key {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #e6a23c;
        font-weight: 500;
        margin-bottom: 8px;
        font-size: 14px;

        .visibility-btn {
          margin-left: auto;
        }
      }

      .data-value {
        :deep(.el-input__inner),
        :deep(.el-textarea__inner) {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          background: #f5f7fa;
        }
      }
    }
  }
}
</style>