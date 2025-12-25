<template>
  <ElDialog
    :model-value="visible"
    title="Service 详情"
    width="900px"
    top="5vh"
    class="service-detail-dialog"
    @close="handleClose"
  >
    <div v-loading="loading" class="detail-content">
      <template v-if="!loading && detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <div class="section-header">
            <div class="section-title">
              <Info :size="18" />
              <span>基本信息</span>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">名称</span>
              <span class="value">{{ detail.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">命名空间</span>
              <span class="value">{{ detail.namespace }}</span>
            </div>
            <div class="info-item">
              <span class="label">类型</span>
              <ElTag :type="getServiceTypeTag(detail.type)" size="default">
                {{ detail.type }}
              </ElTag>
            </div>
            <div class="info-item">
              <span class="label">会话亲和性</span>
              <span class="value">{{ detail.sessionAffinity }}</span>
            </div>
            <div class="info-item">
              <span class="label">Cluster IP</span>
              <span class="value monospace">{{ detail.clusterIP || '-' }}</span>
            </div>
            <div class="info-item" v-if="detail.loadBalancerIP">
              <span class="label">LoadBalancer IP</span>
              <span class="value monospace">{{ detail.loadBalancerIP }}</span>
            </div>
            <div class="info-item">
              <span class="label">Endpoint 数量</span>
              <ElTag type="success" size="default">
                <Activity :size="14" style="margin-right: 4px; vertical-align: middle" />
                {{ detail.endpointCount }}
              </ElTag>
            </div>
            <div class="info-item">
              <span class="label">运行时长</span>
              <span class="value">
                <Clock
                  :size="14"
                  style="margin-right: 4px; vertical-align: middle; color: #909399"
                />
                {{ detail.age }}
              </span>
            </div>
          </div>
        </div>

        <!-- 端口配置 -->
        <div class="detail-section">
          <div class="section-header">
            <div class="section-title">
              <Network :size="18" />
              <span>端口配置</span>
            </div>
            <ElTag size="small" type="info">{{ detail.ports?.length || 0 }} 个端口</ElTag>
          </div>
          <div class="ports-table-wrapper">
            <ElTable :data="detail.ports" size="default" stripe :border="false">
              <ElTableColumn prop="name" label="名称" min-width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  <span style="font-weight: 500">{{ row.name || '-' }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="protocol" label="协议" width="100" align="center">
                <template #default="{ row }">
                  <ElTag size="small" type="info">{{ row.protocol }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="port" label="Service 端口" width="130" align="center">
                <template #default="{ row }">
                  <span class="port-value">{{ row.port }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="映射" width="60" align="center">
                <template #default>
                  <ArrowRight :size="16" style="color: #409eff" />
                </template>
              </ElTableColumn>
              <ElTableColumn prop="targetPort" label="目标端口" width="130" align="center">
                <template #default="{ row }">
                  <span class="port-value">{{ row.targetPort }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="nodePort" label="NodePort" width="130" align="center">
                <template #default="{ row }">
                  <span v-if="row.nodePort" class="port-value highlight">{{ row.nodePort }}</span>
                  <span v-else style="color: #c0c4cc">-</span>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </div>

        <!-- Selector -->
        <div
          class="detail-section"
          v-if="detail.selector && Object.keys(detail.selector).length > 0"
        >
          <div class="section-header">
            <div class="section-title">
              <Target :size="18" />
              <span>Selector</span>
            </div>
            <ElTag size="small" type="info">{{ Object.keys(detail.selector).length }} 个标签</ElTag>
          </div>
          <div class="tags-grid">
            <div v-for="(value, key) in detail.selector" :key="key" class="tag-item selector">
              <span class="tag-key">{{ key }}</span>
              <span class="tag-separator">=</span>
              <span class="tag-value">{{ value }}</span>
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
            <ElTag size="small" type="success"
              >{{ Object.keys(detail.labels).length }} 个标签</ElTag
            >
          </div>
          <div class="tags-grid">
            <div v-for="(value, key) in detail.labels" :key="key" class="tag-item label">
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
            <ElTag size="small" type="warning"
              >{{ Object.keys(detail.annotations).length }} 个注解</ElTag
            >
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

      <!-- 空状态 -->
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
  import { ElMessage } from 'element-plus'
  import {
    Info,
    Network,
    Tag,
    FileText,
    Clock,
    Activity,
    ArrowRight,
    Target,
    Code2
  } from 'lucide-vue-next'
  import { getServiceDetailApi, type ServiceDetail, type ProjectWorkspace } from '@/api'

  interface Props {
    visible: boolean
    serviceName?: string
    workspace?: ProjectWorkspace
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close'])

  const loading = ref(false)
  const detail = ref<ServiceDetail | null>(null)

  const getServiceTypeTag = (type: string) => {
    const tagMap: Record<string, string> = {
      ClusterIP: 'info',
      NodePort: 'success',
      LoadBalancer: 'warning',
      ExternalName: 'primary'
    }
    return tagMap[type] || 'info'
  }

  const loadDetail = async () => {
    if (!props.serviceName || !props.workspace) return

    loading.value = true
    try {
      detail.value = await getServiceDetailApi({
        workloadId: props.workspace.id,
        name: props.serviceName
      })
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
  .service-detail-dialog {
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
    max-width: 800px;
    margin: 0 auto;
  }

  .detail-section {
    margin-bottom: 24px;
    padding: 20px;
    background: #fafbfc;
    border-radius: 8px;
    border: 1px solid #e4e7ed;

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

  // 基本信息网格布局
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 24px;

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

        &.monospace {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          color: #409eff;
        }
      }
    }
  }

  // 端口表格样式
  .ports-table-wrapper {
    background: white;
    border-radius: 6px;
    overflow: hidden;

    :deep(.el-table) {
      .el-table__header {
        th {
          background: #f5f7fa;
          color: #606266;
          font-weight: 600;
          font-size: 13px;
        }
      }

      .el-table__body {
        td {
          padding: 12px 0;
        }
      }
    }

    .port-value {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      font-weight: 600;
      color: #303133;

      &.highlight {
        color: #67c23a;
      }
    }
  }

  // 标签网格布局
  .tags-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;

    .tag-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e4e7ed;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
      }

      &.selector {
        border-left: 3px solid #409eff;
      }

      &.label {
        border-left: 3px solid #67c23a;
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

  // Annotations 列表样式
  .annotations-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .annotation-item {
      background: white;
      border-radius: 6px;
      border: 1px solid #e4e7ed;
      border-left: 3px solid #e6a23c;
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        border-color: #e6a23c;
        box-shadow: 0 2px 8px rgba(230, 162, 60, 0.1);
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
        background: white;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
