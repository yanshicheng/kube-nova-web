<template>
  <div class="basic-info-modern">
    <!-- 统计卡片网格 -->
    <div v-loading="loadingSummary" class="stats-grid">
      <div class="stat-card">
        <div
          class="stat-icon-wrapper"
          style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        >
          <Box :size="20" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ summary?.podCount || 0 }}</div>
          <div class="stat-label">Pod 总数</div>
          <div v-if="summary?.abnormalPodCount" class="stat-detail error">
            <AlertCircle :size="14" />
            {{ summary.abnormalPodCount }} 异常
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div
          class="stat-icon-wrapper"
          style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        >
          <Activity :size="20" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ normalPodCount }}</div>
          <div class="stat-label">正常 Pod</div>
          <div v-if="summary?.podCount" class="stat-detail success">
            <CheckCircle :size="14" />
            {{ normalPodPercentage }}%
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div
          class="stat-icon-wrapper"
          style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        >
          <AlertTriangle :size="20" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ summary?.abnormalPodCount || 0 }}</div>
          <div class="stat-label">异常 Pod</div>
          <div v-if="summary?.podCount" class="stat-detail warning">
            <AlertTriangle :size="14" />
            {{ abnormalPodPercentage }}%
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div
          class="stat-icon-wrapper"
          style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        >
          <Globe :size="20" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ summary?.serviceCount || 0 }}</div>
          <div class="stat-label">Service 数量</div>
        </div>
      </div>

      <div class="stat-card">
        <div
          class="stat-icon-wrapper"
          style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        >
          <Network :size="20" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ summary?.ingressCount || 0 }}</div>
          <div class="stat-label">Ingress 数量</div>
        </div>
      </div>
    </div>

    <!-- 服务访问信息区域 -->
    <section class="info-section access-section">
      <div class="section-header">
        <h3 class="section-title">
          <Link :size="18" />
          服务访问地址
        </h3>
        <ElButton
          size="small"
          text
          :icon="RefreshCw"
          :loading="loadingSummary"
          @click="loadSummary"
        >
          刷新
        </ElButton>
      </div>

      <div v-loading="loadingSummary" class="section-content access-content">
        <!-- 两列网格布局 -->
        <div class="access-grid">
          <!-- 集群内部地址 (ClusterIP) -->
          <div class="connection-group">
            <div class="group-header">
              <div class="group-title">
                <div class="title-icon bg-blue">
                  <Server :size="16" />
                </div>
                <span class="title-text">集群内部地址</span>
                <ElTag size="small" type="info">ClusterIP</ElTag>
              </div>
              <span v-if="summary?.service?.internalAccessList?.length" class="count-badge">
                {{ summary.service.internalAccessList.length }}
              </span>
            </div>

            <div v-if="summary?.service?.internalAccessList?.length" class="address-list-wrapper">
              <div class="address-list">
                <div
                  v-for="(addr, idx) in summary.service.internalAccessList"
                  :key="idx"
                  class="address-item clickable"
                  @click="openInNewTab(addr)"
                >
                  <div class="address-content">
                    <ExternalLink :size="14" class="link-icon" />
                    <code class="address-text">{{ addr }}</code>
                    <ElTag size="small" type="info" class="address-tag">内部访问</ElTag>
                  </div>
                  <ElButton
                    :icon="Copy"
                    size="small"
                    circle
                    text
                    :loading="copyingAddress === addr"
                    @click.stop="copyToClipboard(addr)"
                    class="copy-btn"
                    title="复制"
                  />
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <span class="empty-text">暂无集群内部访问地址</span>
            </div>
          </div>

          <!-- 节点端口地址 (NodePort) -->
          <div class="connection-group">
            <div class="group-header">
              <div class="group-title">
                <div class="title-icon bg-amber">
                  <Database :size="16" />
                </div>
                <span class="title-text">节点端口地址</span>
                <ElTag size="small" type="warning">NodePort</ElTag>
              </div>
              <span v-if="summary?.service?.nodePortList?.length" class="count-badge">
                {{ summary.service.nodePortList.length }}
              </span>
            </div>

            <div v-if="summary?.service?.nodePortList?.length" class="address-list-wrapper">
              <div class="address-list">
                <div
                  v-for="(addr, idx) in summary.service.nodePortList"
                  :key="idx"
                  class="address-item clickable"
                  @click="openInNewTab(`http://${addr}`)"
                >
                  <div class="address-content">
                    <ExternalLink :size="14" class="link-icon" />
                    <code class="address-text">{{ addr }}</code>
                    <ElTag size="small" type="warning" class="address-tag">节点访问</ElTag>
                  </div>
                  <ElButton
                    :icon="Copy"
                    size="small"
                    circle
                    text
                    :loading="copyingAddress === addr"
                    @click.stop="copyToClipboard(addr)"
                    class="copy-btn"
                    title="复制"
                  />
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <span class="empty-text">暂无节点端口访问地址</span>
            </div>
          </div>

          <!-- 负载均衡地址 (LoadBalancer) -->
          <div class="connection-group">
            <div class="group-header">
              <div class="group-title">
                <div class="title-icon bg-purple">
                  <Cloud :size="16" />
                </div>
                <span class="title-text">LoadBalancer 访问地址</span>
                <ElTag size="small" type="success">LoadBalancer</ElTag>
              </div>
              <span v-if="summary?.service?.externalAccessList?.length" class="count-badge">
                {{ summary.service.externalAccessList.length }}
              </span>
            </div>

            <div v-if="summary?.service?.externalAccessList?.length" class="address-list-wrapper">
              <div class="address-list">
                <div
                  v-for="(addr, idx) in summary.service.externalAccessList"
                  :key="idx"
                  class="address-item clickable"
                  @click="openInNewTab(addr)"
                >
                  <div class="address-content">
                    <ExternalLink :size="14" class="link-icon" />
                    <code class="address-text">{{ addr }}</code>
                    <ElTag size="small" type="success" class="address-tag">外部访问</ElTag>
                  </div>
                  <ElButton
                    :icon="Copy"
                    size="small"
                    circle
                    text
                    :loading="copyingAddress === addr"
                    @click.stop="copyToClipboard(addr)"
                    class="copy-btn"
                    title="复制"
                  />
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <span class="empty-text">暂无 LoadBalancer 访问地址</span>
            </div>
          </div>

          <!-- Ingress 域名 -->
          <div class="connection-group">
            <div class="group-header">
              <div class="group-title">
                <div class="title-icon bg-green">
                  <Globe2 :size="16" />
                </div>
                <span class="title-text">Ingress 访问地址</span>
                <ElTag size="small" type="primary">HTTP/HTTPS</ElTag>
              </div>
              <span v-if="summary?.ingressDomains?.length" class="count-badge">
                {{ summary.ingressDomains.length }}
              </span>
            </div>

            <div v-if="summary?.ingressDomains?.length" class="address-list-wrapper">
              <div class="address-list">
                <div
                  v-for="(domain, idx) in summary.ingressDomains"
                  :key="idx"
                  class="address-item clickable ingress-item"
                  @click="openInNewTab(`https://${domain}`)"
                >
                  <div class="address-content">
                    <ExternalLink :size="14" class="link-icon" />
                    <code class="address-text">{{ domain }}</code>
                    <ElTag size="small" type="primary" class="address-tag">域名</ElTag>
                  </div>
                  <ElButton
                    :icon="Copy"
                    size="small"
                    circle
                    text
                    :loading="copyingAddress === domain"
                    @click.stop="copyToClipboard(domain)"
                    class="copy-btn"
                    title="复制"
                  />
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <span class="empty-text">暂无 Ingress 访问地址</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 基本信息区域 -->
    <section class="info-section">
      <div class="section-header">
        <h3 class="section-title">
          <Info :size="18" />
          基本信息
        </h3>
        <div class="header-actions">
          <ElButton v-if="!isEditing" type="primary" size="small" text @click="handleEdit">
            <Edit :size="16" />
            编辑
          </ElButton>
          <template v-else>
            <ElButton size="small" @click="handleCancel">取消</ElButton>
            <ElButton type="primary" size="small" :loading="saving" @click="handleSave">
              保存
            </ElButton>
          </template>
        </div>
      </div>

      <div class="section-content">
        <ElForm :model="formData" label-width="120px" :disabled="!isEditing">
          <ElRow :gutter="24">
            <ElCol :span="12">
              <ElFormItem label="服务 ID">
                <ElInput v-model="formData.id" disabled>
                  <template #prepend>
                    <Hash :size="14" />
                  </template>
                </ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="资源类型">
                <ElInput v-model="formData.resourceType" disabled>
                  <template #prepend>
                    <component :is="getResourceIcon(formData.resourceType)" :size="14" />
                  </template>
                </ElInput>
              </ElFormItem>
            </ElCol>
          </ElRow>

          <ElRow :gutter="24">
            <ElCol :span="12">
              <ElFormItem label="中文名称">
                <ElInput
                  v-model="formData.nameCn"
                  :disabled="!isEditing"
                  placeholder="请输入中文名称"
                >
                  <template #prepend>
                    <Type :size="14" />
                  </template>
                </ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="英文名称">
                <ElInput v-model="formData.nameEn" disabled>
                  <template #prepend>
                    <FileText :size="14" />
                  </template>
                </ElInput>
              </ElFormItem>
            </ElCol>
          </ElRow>

          <ElFormItem label="描述信息">
            <ElInput
              v-model="formData.description"
              type="textarea"
              :rows="4"
              :disabled="!isEditing"
              maxlength="500"
              show-word-limit
              placeholder="请输入服务描述信息"
            />
          </ElFormItem>

          <ElDivider />

          <ElRow :gutter="24">
            <ElCol :span="12">
              <ElFormItem label="创建人">
                <ElInput v-model="formData.createdBy" disabled>
                  <template #prepend>
                    <User :size="14" />
                  </template>
                </ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="更新人">
                <ElInput v-model="formData.updatedBy" disabled>
                  <template #prepend>
                    <User :size="14" />
                  </template>
                </ElInput>
              </ElFormItem>
            </ElCol>
          </ElRow>

          <ElRow :gutter="24">
            <ElCol :span="12">
              <ElFormItem label="创建时间">
                <ElInput :value="formatTime(formData.createdAt)" disabled>
                  <template #prepend>
                    <Clock :size="14" />
                  </template>
                </ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="更新时间">
                <ElInput :value="formatTime(formData.updatedAt)" disabled>
                  <template #prepend>
                    <Clock :size="14" />
                  </template>
                </ElInput>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Edit,
    Activity,
    AlertTriangle,
    Globe,
    Network,
    RefreshCw,
    Copy,
    Server,
    ExternalLink,
    Link,
    Info,
    Box,
    Database,
    Cloud,
    Globe2,
    Hash,
    Type,
    FileText,
    User,
    Clock,
    CheckCircle,
    AlertCircle,
    Layers,
    Package,
    Briefcase
  } from 'lucide-vue-next'
  import {
    updateApplicationApi,
    getApplicationSummaryApi,
    type OnecProjectApplication,
    type ProjectWorkspace,
    type ProjectCluster,
    type ApplicationSummary
  } from '@/api'
  import dayjs from 'dayjs'

  interface Props {
    application: OnecProjectApplication
    workspace: ProjectWorkspace | null
    cluster: ProjectCluster | null
    refreshTrigger: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    refresh: []
  }>()

  const isEditing = ref(false)
  const formData = reactive<OnecProjectApplication>({ ...props.application })
  const summary = ref<ApplicationSummary | null>(null)
  const loadingSummary = ref(false)
  const saving = ref(false)
  const copyingAddress = ref<string>('')

  // 计算正常 Pod 数量
  const normalPodCount = computed(() => {
    if (!summary.value) return 0
    return (summary.value.podCount || 0) - (summary.value.abnormalPodCount || 0)
  })

  // 计算正常 Pod 百分比
  const normalPodPercentage = computed(() => {
    if (!summary.value?.podCount) return 0
    return Math.round((normalPodCount.value / summary.value.podCount) * 100)
  })

  // 计算异常 Pod 百分比
  const abnormalPodPercentage = computed(() => {
    if (!summary.value?.podCount) return 0
    return Math.round(((summary.value.abnormalPodCount || 0) / summary.value.podCount) * 100)
  })

  // 获取资源图标
  const getResourceIcon = (type: string) => {
    const resourceType = type?.toLowerCase() || ''
    const iconMap: Record<string, any> = {
      pod: Box,
      deployment: Layers,
      statefulset: Database,
      daemonset: Server,
      cronjob: Clock,
      job: Briefcase
    }
    return iconMap[resourceType] || Package
  }

  const formatTime = (timestamp: number) => {
    return timestamp ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss') : '-'
  }

  // 加载服务摘要信息
  const loadSummary = async () => {
    if (!props.application?.id || !props.workspace || !props.cluster) {
      console.warn('[BasicInfo] 缺少必要参数，无法加载摘要信息')
      return
    }

    const clusterUuid = props.cluster.clusterUuid
    if (!clusterUuid) {
      console.warn('[BasicInfo] 集群缺少 UUID，无法加载摘要信息')
      return
    }

    loadingSummary.value = true
    try {
      const response = await getApplicationSummaryApi(props.application.id, {
        clusterUuid: clusterUuid,
        namespace: props.workspace.namespace || 'default'
      })
      summary.value = response
    } catch (error) {
      console.error('[BasicInfo] 加载摘要信息失败:', error)
      summary.value = null
    } finally {
      loadingSummary.value = false
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    copyingAddress.value = text
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success('已复制到剪贴板')
    } catch {
    } finally {
      setTimeout(() => {
        copyingAddress.value = ''
      }, 300)
    }
  }

  // 在新标签页打开
  const openInNewTab = (url: string) => {
    // 如果 URL 不包含协议，添加 https://
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    window.open(fullUrl, '_blank')
  }

  const handleEdit = () => {
    isEditing.value = true
  }

  const handleCancel = () => {
    Object.assign(formData, props.application)
    isEditing.value = false
  }

  const handleSave = async () => {
    if (!formData.nameCn?.trim()) {
      return
    }

    saving.value = true
    try {
      await updateApplicationApi({
        id: formData.id,
        nameCn: formData.nameCn,
        description: formData.description
      })
      ElMessage.success('保存成功')
      isEditing.value = false
      emit('refresh')
    } catch (error) {
      console.error('[BasicInfo] 保存失败:', error)
    } finally {
      saving.value = false
    }
  }

  // 监听 application 变化
  watch(
    () => props.application,
    (newApp) => {
      Object.assign(formData, newApp)
      loadSummary()
    },
    { deep: true }
  )

  // 监听刷新触发器
  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal > 0) {
        loadSummary()
      }
    }
  )

  onMounted(() => {
    loadSummary()
  })
</script>

<style lang="scss" scoped>
  .basic-info-modern {
    padding: 0;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 20px;
      margin-bottom: 24px;
      padding-left: 16px;
      padding-right: 16px;

      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
          min-width: 0;

          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
            line-height: 1.2;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 13px;
            color: #909399;
            margin-bottom: 6px;
          }

          .stat-detail {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 500;

            &.success {
              color: #67c23a;
            }

            &.warning {
              color: #e6a23c;
            }

            &.error {
              color: #f56c6c;
            }
          }
        }
      }
    }

    .info-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f0f2f5;

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }
      }

      .section-content {
        min-height: 60px;
      }

      // 访问地址区域样式
      &.access-section {
        .access-content {
          min-height: auto;

          // 两列网格布局
          .access-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;

            // 响应式：小屏幕时改为单列
            @media (max-width: 1200px) {
              grid-template-columns: 1fr;
            }
          }
        }
      }
    }

    .connection-group {
      margin-bottom: 0; // 在网格布局中不需要下边距

      .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;

        .group-title {
          display: flex;
          align-items: center;
          gap: 10px;

          .title-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;

            &.bg-blue {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }

            &.bg-amber {
              background: linear-gradient(135deg, #fa8b0c 0%, #ffcb05 100%);
            }

            &.bg-purple {
              background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
            }

            &.bg-green {
              background: linear-gradient(135deg, #0ba360 0%, #3cba92 100%);
            }
          }

          .title-text {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
          }
        }

        .count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 24px;
          padding: 0 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 12px;
          font-weight: 600;
          border-radius: 12px;
        }
      }

      .address-list-wrapper {
        margin-left: 0;
        margin-top: 12px;
      }

      .address-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 260px;
        overflow-y: auto;
        padding-right: 8px;

        /* 自定义滚动条 */
        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: #f1f3f5;
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
          transition: background 0.2s;

          &:hover {
            background: #a0aec0;
          }
        }

        .address-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: white;
          border: 1px solid #e4e7ed;
          border-radius: 10px;
          transition: all 0.2s ease;

          &.clickable {
            cursor: pointer;

            &:hover {
              background: #ecf5ff;
              border-color: #b3d8ff;
              transform: translateX(4px);

              .link-icon {
                color: #409eff;
              }

              .copy-btn {
                opacity: 1;
              }
            }
          }

          &.ingress-item {
            background: linear-gradient(135deg, #f5f7fa 0%, #ecf0f5 100%);

            &:hover {
              background: linear-gradient(135deg, #e7f4ff 0%, #d9ecff 100%);
            }
          }

          .address-content {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;

            .link-icon {
              flex-shrink: 0;
              color: #909399;
              transition: color 0.2s;
            }

            .address-text {
              flex: 1;
              font-size: 13px;
              color: #303133;
              font-family: 'SF Mono', Monaco, 'Courier New', monospace;
              font-weight: 500;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .address-tag {
              flex-shrink: 0;
            }
          }

          .copy-btn {
            flex-shrink: 0;
            opacity: 0;
            transition: all 0.2s;
          }
        }
      }

      .empty-state {
        margin-left: 0;
        padding: 40px 20px;
        text-align: center;
        background: #f8f9fa;
        border: 2px dashed #dee2e6;
        border-radius: 10px;

        .empty-text {
          font-size: 14px;
          color: #909399;
          font-weight: 500;
        }
      }
    }

    :deep(.el-form) {
      .el-form-item {
        margin-bottom: 20px;

        .el-input-group__prepend {
          padding: 0 12px;
          background-color: #f5f7fa;
        }
      }

      .el-divider {
        margin: 24px 0;
      }
    }
  }
</style>
