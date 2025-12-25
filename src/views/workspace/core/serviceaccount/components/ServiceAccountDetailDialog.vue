<template>
  <ElDialog
    :model-value="visible"
    title="ServiceAccount 详情"
    width="900px"
    top="5vh"
    class="sa-detail-dialog"
    @close="handleClose"
  >
    <div v-loading="loading" class="detail-content">
      <template v-if="!loading && detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <div class="section-header">
            <div class="section-title">
              <Info :size="18" />
              <span>基础信息</span>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">名称</span>
              <div class="value">
                <ShieldCheck :size="16" style="color: #409eff" />
                <span>{{ detail.name }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">命名空间</span>
              <span class="value">{{ detail.namespace }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">
                <Clock :size="14" style="margin-right: 4px; color: #909399" />
                {{ detail.creationTimestamp }}
              </span>
            </div>
            <div class="info-item" v-if="detail.automountServiceAccountToken !== undefined">
              <span class="label">自动挂载 Token</span>
              <ElTag :type="detail.automountServiceAccountToken !== false ? 'success' : 'info'">
                {{ detail.automountServiceAccountToken !== false ? '已启用' : '已禁用' }}
              </ElTag>
            </div>
          </div>
        </div>

        <!-- Secrets -->
        <div class="detail-section" v-if="detail.secrets && detail.secrets.length > 0">
          <div class="section-header">
            <div class="section-title">
              <Key :size="18" />
              <span>Secrets</span>
            </div>
            <ElTag size="small" type="success">{{ detail.secrets.length }} 个</ElTag>
          </div>
          <div class="secrets-grid">
            <div v-for="(secret, index) in detail.secrets" :key="index" class="secret-card">
              <div class="secret-header">
                <Key :size="14" class="icon" />
                <span class="secret-name">{{ secret }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Image Pull Secrets -->
        <div
          class="detail-section"
          v-if="detail.imagePullSecrets && detail.imagePullSecrets.length > 0"
        >
          <div class="section-header">
            <div class="section-title">
              <ImageIcon :size="18" />
              <span>Image Pull Secrets</span>
            </div>
            <ElTag size="small" type="warning">{{ detail.imagePullSecrets.length }} 个</ElTag>
          </div>
          <div class="secrets-grid">
            <div
              v-for="(secret, index) in detail.imagePullSecrets"
              :key="index"
              class="secret-card image-pull"
            >
              <div class="secret-header">
                <ImageIcon :size="14" class="icon" />
                <span class="secret-name">{{ secret }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Labels -->
        <div class="detail-section" v-if="detail.labels && Object.keys(detail.labels).length > 0">
          <div class="section-header">
            <div class="section-title">
              <Tag :size="18" />
              <span>Labels</span>
            </div>
            <ElTag size="small" type="success">{{ Object.keys(detail.labels).length }} 个</ElTag>
          </div>
          <div class="tags-grid">
            <div v-for="(value, key) in detail.labels" :key="key" class="tag-item">
              <span class="tag-key">{{ key }}</span>
              <span class="tag-separator">=</span>
              <span class="tag-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- Annotations -->
        <div
          class="detail-section"
          v-if="detail.annotations && Object.keys(detail.annotations).length > 0"
        >
          <div class="section-header">
            <div class="section-title">
              <FileText :size="18" />
              <span>Annotations</span>
            </div>
            <ElTag size="small" type="warning">
              {{ Object.keys(detail.annotations).length }} 个
            </ElTag>
          </div>
          <div class="annotations-list">
            <div v-for="(value, key) in detail.annotations" :key="key" class="annotation-item">
              <div class="annotation-key">
                <Code2 :size="14" />
                <span>{{ key }}</span>
              </div>
              <div class="annotation-value">{{ value }}</div>
            </div>
          </div>
        </div>
      </template>

      <ElEmpty v-if="!loading && !detail" description="加载失败或数据不存在" :image-size="100" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton size="default" @click="handleClose">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import {
    Info,
    ShieldCheck,
    Clock,
    Key,
    ImageIcon,
    Tag,
    FileText,
    Code2
  } from 'lucide-vue-next'
  import {
    getServiceAccountDescribeApi,
    type ServiceAccountDescribe,
    type ProjectWorkspace
  } from '@/api/workload/core'

  interface Props {
    visible: boolean
    saName?: string
    workspace?: ProjectWorkspace
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close'])

  const loading = ref(false)
  const detail = ref<ServiceAccountDescribe | null>(null)

  const loadDetail = async () => {
    if (!props.saName || !props.workspace) return

    loading.value = true
    try {
      const describeStr = await getServiceAccountDescribeApi({
        clusterUuid: props.workspace.clusterUuid!,
        namespace: props.workspace.namespace!,
        name: props.saName
      })

      // 解析描述字符串为对象（根据实际返回格式调整）
      // 如果返回的是字符串，可能需要解析
      // 这里假设返回的是 JSON 字符串或者已经是对象
      if (typeof describeStr === 'string') {
        try {
          detail.value = JSON.parse(describeStr) as ServiceAccountDescribe
        } catch {
          // 如果不是 JSON，创建一个简单对象
          detail.value = {
            name: props.saName,
            namespace: props.workspace.namespace!,
            creationTimestamp: ''
          } as ServiceAccountDescribe
        }
      } else {
        detail.value = describeStr as ServiceAccountDescribe
      }
    } catch (error: any) {
      console.error('加载详情失败:', error)
      detail.value = null
    } finally {
      loading.value = false
    }
  }

  const handleClose = () => {
    emit('close')
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        loadDetail()
      } else {
        detail.value = null
      }
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .sa-detail-dialog {
    :deep(.el-dialog__body) {
      padding: 20px 24px;
      max-height: 70vh;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 3px;
      }
    }
  }

  .detail-content {
    min-height: 200px;
  }

  .detail-section {
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 10px;
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #409eff;

      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;

        svg {
          color: #409eff;
          flex-shrink: 0;
        }
      }
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .label {
        font-size: 13px;
        color: #909399;
        font-weight: 500;
      }

      .value {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  }

  .secrets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;

    .secret-card {
      padding: 14px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e4e7ed;
      border-left: 3px solid #67c23a;
      transition: all 0.3s;

      &:hover {
        border-color: #67c23a;
        box-shadow: 0 2px 8px rgba(103, 194, 58, 0.15);
      }

      &.image-pull {
        border-left-color: #f56c6c;

        &:hover {
          border-color: #f56c6c;
          box-shadow: 0 2px 8px rgba(245, 108, 108, 0.15);
        }

        .icon {
          color: #f56c6c;
        }
      }

      .secret-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .icon {
          color: #67c23a;
          flex-shrink: 0;
        }

        .secret-name {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          word-break: break-all;
        }
      }

      .secret-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;

        .meta-label {
          color: #909399;
        }
      }
    }
  }

  .tags-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;

    .tag-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e4e7ed;
      border-left: 3px solid #67c23a;
      transition: all 0.3s;

      &:hover {
        border-color: #67c23a;
        box-shadow: 0 2px 8px rgba(103, 194, 58, 0.15);
      }

      .tag-key {
        font-size: 13px;
        font-weight: 600;
        color: #303133;
        word-break: break-all;
      }

      .tag-separator {
        font-size: 14px;
        color: #909399;
        font-weight: bold;
        flex-shrink: 0;
      }

      .tag-value {
        font-size: 13px;
        color: #606266;
        word-break: break-all;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      }
    }
  }

  .annotations-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .annotation-item {
      background: white;
      border-radius: 8px;
      border: 1px solid #e4e7ed;
      border-left: 3px solid #e6a23c;
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        border-color: #e6a23c;
        box-shadow: 0 2px 8px rgba(230, 162, 60, 0.15);
      }

      .annotation-key {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: #fef9f0;
        border-bottom: 1px solid #f5e6d3;
        font-size: 13px;
        font-weight: 600;
        color: #606266;
        word-break: break-all;

        svg {
          color: #e6a23c;
          flex-shrink: 0;
        }
      }

      .annotation-value {
        padding: 12px 14px;
        font-size: 13px;
        color: #606266;
        line-height: 1.6;
        word-break: break-all;
        white-space: pre-wrap;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
  }
</style>