<template>
  <ElDialog v-model="visible" title="ConfigMap 详情" width="900px" @closed="handleClosed">
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
        <ElDescriptionsItem label="创建时间">
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
        <div class="section-title">数据项（Data）</div>
        <div class="data-list">
          <div v-for="(value, key) in detail.data" :key="key" class="data-item">
            <div class="data-key">
              <FileText :size="16" />
              <span>{{ key }}</span>
            </div>
            <ElInput
              :model-value="value"
              type="textarea"
              :rows="6"
              readonly
              class="data-value"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- YAML 模式 -->
    <div v-else-if="viewMode === 'yaml'">
      <ElSkeleton v-if="loadingYaml" :rows="8" animated />
      <YamlEditor
        v-else
        v-model="yamlContent"
        :filename="`${configmapName}.yaml`"
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
import { FileText, FileEdit, Code } from 'lucide-vue-next'
import {
  getConfigMapDetailApi,
  getConfigMapYamlApi,
  type ConfigMapDetail,
  type ProjectWorkspace
} from '@/api'
import YamlEditor from '@/components/yaml-editor-pro/index.vue'

interface Props {
  modelValue: boolean
  configmapName: string
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
const detail = ref<ConfigMapDetail | null>(null)
const viewMode = ref<'form' | 'yaml'>('form')
const yamlContent = ref('')

const hasLabels = computed(() => {
  return detail.value?.labels && Object.keys(detail.value.labels).length > 0
})

const hasAnnotations = computed(() => {
  return detail.value?.annotations && Object.keys(detail.value.annotations).length > 0
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
  if (!props.workspace || !props.configmapName) return

  loading.value = true
  try {
    detail.value = await getConfigMapDetailApi({
      workloadId: props.workspace.id,
      name: props.configmapName
    })
  } catch (error) {
    console.error('加载ConfigMap详情失败:', error)
    visible.value = false
  } finally {
    loading.value = false
  }
}

const loadYaml = async () => {
  if (!props.workspace || !props.configmapName) return

  loadingYaml.value = true
  try {
    yamlContent.value = await getConfigMapYamlApi({
      workloadId: props.workspace.id,
      name: props.configmapName
    })
  } catch (error) {
    console.error('加载YAML失败:', error)
  } finally {
    loadingYaml.value = false
  }
}

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const handleClosed = () => {
  detail.value = null
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
        color: #303133;
        font-weight: 500;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .data-value {
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
