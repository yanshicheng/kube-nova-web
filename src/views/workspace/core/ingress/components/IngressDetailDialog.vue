<template>
  <ElDialog
    :model-value="visible"
    title="Ingress 详情"
    width="1000px"
    top="5vh"
    class="ingress-detail-dialog"
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
              <span class="label">Ingress Class</span>
              <ElTag type="info" size="default">
                {{ detail.ingressClass || 'default' }}
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

        <!-- 负载均衡器信息 -->
        <div
          class="detail-section"
          v-if="detail.loadBalancer?.ingress && detail.loadBalancer.ingress.length > 0"
        >
          <div class="section-header">
            <div class="section-title">
              <CloudUpload :size="18" />
              <span>负载均衡器</span>
            </div>
          </div>
          <div class="lb-list">
            <div v-for="(lb, index) in detail.loadBalancer.ingress" :key="index" class="lb-item">
              <div class="lb-info">
                <Network :size="14" />
                <span v-if="lb.ip" class="monospace">{{ lb.ip }}</span>
                <span v-else-if="lb.hostname">{{ lb.hostname }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 路由规则 -->
        <div class="detail-section" v-if="detail.rules && detail.rules.length > 0">
          <div class="section-header">
            <div class="section-title">
              <Route :size="18" />
              <span>路由规则</span>
            </div>
            <ElTag size="small" type="success">{{ detail.rules.length }} 条规则</ElTag>
          </div>
          <div class="rules-list">
            <div v-for="(rule, ruleIdx) in detail.rules" :key="ruleIdx" class="rule-item">
              <div class="rule-header">
                <div class="host-info">
                  <Globe :size="16" />
                  <span class="host-name">{{ rule.host || '*' }}</span>
                </div>
                <ElTag type="info" size="small">{{ rule.paths.length }} 个路径</ElTag>
              </div>
              <div class="paths-list">
                <div v-for="(path, pathIdx) in rule.paths" :key="pathIdx" class="path-item">
                  <div class="path-info">
                    <div class="path-detail">
                      <span class="path-label">路径:</span>
                      <span class="path-value monospace">{{ path.path }}</span>
                      <ElTag type="warning" size="small">{{ path.pathType }}</ElTag>
                    </div>
                    <ArrowRight :size="16" class="arrow-icon" />
                    <div class="backend-detail">
                      <span class="backend-label">后端:</span>
                      <span class="backend-value">
                        {{ path.backend.serviceName }}:{{ path.backend.servicePort }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TLS 配置 -->
        <div class="detail-section" v-if="detail.tls && detail.tls.length > 0">
          <div class="section-header">
            <div class="section-title">
              <Lock :size="18" />
              <span>TLS 配置</span>
            </div>
            <ElTag size="small" type="warning">{{ detail.tls.length }} 个证书</ElTag>
          </div>
          <div class="tls-list">
            <div v-for="(tls, index) in detail.tls" :key="index" class="tls-item">
              <div class="tls-secret">
                <Key :size="14" />
                <span class="secret-name">{{ tls.secretName }}</span>
              </div>
              <div class="tls-hosts">
                <ElTag v-for="host in tls.hosts" :key="host" type="success" size="small">
                  {{ host }}
                </ElTag>
              </div>
            </div>
          </div>
        </div>

        <!-- 默认后端 -->
        <div class="detail-section" v-if="detail.defaultBackend">
          <div class="section-header">
            <div class="section-title">
              <Server :size="18" />
              <span>默认后端</span>
            </div>
          </div>
          <div class="default-backend">
            <div class="backend-info">
              <span class="label">Service:</span>
              <span class="value monospace">
                {{ detail.defaultBackend.serviceName }}:{{ detail.defaultBackend.servicePort }}
              </span>
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
    Globe,
    Tag,
    FileText,
    Clock,
    Route,
    Lock,
    Key,
    Server,
    ArrowRight,
    Code2,
    CloudUpload,
    Network
  } from 'lucide-vue-next'
  import { getIngressDetailApi, type IngressDetail, type ProjectWorkspace } from '@/api'

  interface Props {
    visible: boolean
    ingressName?: string
    workspace?: ProjectWorkspace
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close'])

  const loading = ref(false)
  const detail = ref<IngressDetail | null>(null)

  const loadDetail = async () => {
    if (!props.ingressName || !props.workspace) return

    loading.value = true
    try {
      detail.value = await getIngressDetailApi({
        workloadId: props.workspace.id,
        name: props.ingressName
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
  .ingress-detail-dialog {
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
      }
    }
  }

  .lb-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .lb-item {
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e4e7ed;

      .lb-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #303133;

        svg {
          color: #409eff;
        }

        .monospace {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          color: #409eff;
          font-weight: 600;
        }
      }
    }
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .rule-item {
      background: white;
      border-radius: 8px;
      border: 1px solid #e4e7ed;
      overflow: hidden;

      .rule-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: #f5f7fa;
        border-bottom: 1px solid #e4e7ed;

        .host-info {
          display: flex;
          align-items: center;
          gap: 8px;

          svg {
            color: #67c23a;
          }

          .host-name {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
          }
        }
      }

      .paths-list {
        .path-item {
          padding: 14px 16px;
          border-bottom: 1px dashed #e4e7ed;

          &:last-child {
            border-bottom: none;
          }

          .path-info {
            display: flex;
            align-items: center;
            gap: 16px;

            .path-detail,
            .backend-detail {
              display: flex;
              align-items: center;
              gap: 8px;
              flex: 1;
            }

            .path-label,
            .backend-label {
              font-size: 13px;
              color: #909399;
              font-weight: 500;
            }

            .path-value,
            .backend-value {
              font-size: 13px;
              color: #303133;
              font-weight: 500;
            }

            .path-value {
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              color: #409eff;
            }

            .backend-value {
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              color: #67c23a;
            }

            .arrow-icon {
              color: #909399;
              flex-shrink: 0;
            }
          }
        }
      }
    }
  }

  .tls-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .tls-item {
      padding: 14px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e4e7ed;
      border-left: 3px solid #e6a23c;

      .tls-secret {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;

        svg {
          color: #e6a23c;
        }

        .secret-name {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
      }

      .tls-hosts {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
    }
  }

  .default-backend {
    padding: 14px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;

    .backend-info {
      display: flex;
      align-items: center;
      gap: 12px;

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
          color: #67c23a;
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
      padding: 10px 14px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e4e7ed;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
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

  .monospace {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
