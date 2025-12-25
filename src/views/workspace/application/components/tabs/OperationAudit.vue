<template>
  <div class="operation-audit-timeline">
    <div class="audit-header">
      <div class="header-left">
        <div class="icon-wrapper">
          <History :size="20" class="header-icon" />
        </div>
        <div class="title-group">
          <h2 class="header-title">操作审计</h2>
          <span class="header-subtitle">记录服务的变更历史与操作轨迹</span>
        </div>
        <ElTag v-if="pagination.total > 0" type="info" effect="plain" round class="count-tag">
          {{ pagination.total }} 条记录
        </ElTag>
      </div>
      <div class="header-right">
        <ElButton :icon="RefreshCw" circle @click="handleRefresh" :loading="loading" />
      </div>
    </div>

    <div class="timeline-container" v-loading="loading">
      <ElEmpty v-if="!canLoadData" description="请先选择项目、集群和工作空间" :image-size="120" />

      <ElEmpty v-else-if="!loading && auditLogs.length === 0" description="暂无审计记录" />

      <ElTimeline v-else>
        <ElTimelineItem
          v-for="log in auditLogs"
          :key="log.id"
          :timestamp="formatTime(log.createdAt)"
          placement="top"
          :color="getTimelineColor(log.status)"
          :hollow="log.status !== 1"
          :type="log.status === 1 ? 'success' : 'danger'"
        >
          <ElCard class="timeline-card" shadow="hover">
            <div class="card-content">
              <div class="card-main">
                <div class="card-header">
                  <div class="title-row">
                    <div :class="['action-icon-wrapper', `action-${getIconType(log.title)}`]">
                      <component :is="getActionIcon(log.title)" :size="16" />
                    </div>

                    <h3 class="card-title">{{ log.title }}</h3>

                    <ElTag :type="getStatusTagType(log.status)" size="small" effect="light">
                      {{ formatStatus(log.status) }}
                    </ElTag>
                  </div>

                  <div class="meta-row">
                    <div class="meta-item">
                      <User :size="12" />
                      <span>{{ log.operatorName }}</span>
                    </div>
                    <ElDivider direction="vertical" />
                    <div class="meta-item" v-if="log.applicationName">
                      <Package :size="12" />
                      <span>{{ log.applicationName }}</span>
                    </div>
                  </div>
                </div>

                <div class="card-body">
                  <div class="action-detail-box">
                    {{ formatDetailPreview(log.actionDetail) }}
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <ElTooltip content="查看详情" placement="top">
                  <ElButton type="primary" text bg circle :icon="Eye" @click="handleView(log)" />
                </ElTooltip>

                <ElPopconfirm
                  title="确定要删除这条审计记录吗？"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  width="200"
                  @confirm="handleDelete(log)"
                >
                  <template #reference>
                    <div style="display: inline-block">
                      <ElTooltip content="删除记录" placement="top">
                        <ElButton
                          type="danger"
                          text
                          bg
                          circle
                          :icon="Trash2"
                          :loading="deletingAudit === log.id"
                        />
                      </ElTooltip>
                    </div>
                  </template>
                </ElPopconfirm>
              </div>
            </div>
          </ElCard>
        </ElTimelineItem>
      </ElTimeline>

      <div class="pagination-wrapper" v-if="pagination.total > 0">
        <ElPagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </div>

    <ElDialog v-model="detailVisible" title="审计详情" width="650px" align-center destroy-on-close>
      <div class="detail-content" v-if="currentAudit">
        <ElDescriptions :column="2" border size="large">
          <ElDescriptionsItem label="操作人" label-class-name="desc-label">
            <div class="desc-value"><User :size="14" /> {{ currentAudit.operatorName }}</div>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作状态" label-class-name="desc-label">
            <ElTag :type="getStatusTagType(currentAudit.status)">{{
              formatStatus(currentAudit.status)
            }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作时间" label-class-name="desc-label">
            {{ formatTime(currentAudit.createdAt) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用名称" label-class-name="desc-label">
            {{ currentAudit.applicationName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="工作空间" label-class-name="desc-label">
            {{ currentAudit.workspaceName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="集群" label-class-name="desc-label">
            {{ currentAudit.clusterName || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <div class="detail-json-wrapper">
          <div class="detail-json-header">操作详情数据</div>
          <div class="detail-json-content">
            {{ currentAudit.actionDetail }}
          </div>
        </div>
      </div>
      <template #footer>
        <ElButton @click="detailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    History,
    RefreshCw,
    Eye,
    Trash2,
    User,
    Package,
    Plus,
    Edit,
    X,
    Zap,
    RotateCw,
    Terminal
  } from 'lucide-vue-next'
  import { useProjectStore } from '@/store/modules/project'
  import { useApplicationManagementStore } from '@/store/modules/applicationManagement'
  import {
    searchProjectAuditLogApi,
    deleteProjectAuditLogApi,
    getAuditStatusInfo,
    type ProjectAuditLog,
    type OnecProjectApplication,
    type ProjectWorkspace
  } from '@/api/manager/audit'
  import dayjs from 'dayjs'

  interface Props {
    application: OnecProjectApplication
    workspace: ProjectWorkspace | null
    refreshTrigger: number
  }

  const props = defineProps<Props>()

  const projectStore = useProjectStore()
  const managementStore = useApplicationManagementStore()

  const selectedProject = computed(() => projectStore.selectedProject)
  // 获取 Store 中的集群信息
  const currentCluster = computed(() => managementStore.selectedCluster)

  const canLoadData = computed(() => {
    return (
      !!selectedProject.value && !!currentCluster.value && !!props.workspace && !!props.application
    )
  })

  const auditLogs = ref<ProjectAuditLog[]>([])
  const loading = ref(false)
  const detailVisible = ref(false)
  const currentAudit = ref<ProjectAuditLog | null>(null)
  const deletingAudit = ref<number | null>(null)

  const pagination = reactive({
    current: 1,
    size: 20,
    total: 0
  })

  // --- 样式逻辑 ---
  const getTimelineColor = (status: number) => (status === 1 ? '#10b981' : '#ef4444')

  const getIconType = (title?: string) => {
    if (!title) return 'default'
    if (title.includes('创建')) return 'create'
    if (title.includes('更新') || title.includes('修改')) return 'update'
    if (title.includes('删除')) return 'delete'
    if (title.includes('扩容') || title.includes('缩容')) return 'scale'
    if (title.includes('重启')) return 'restart'
    return 'default'
  }

  const getActionIcon = (title?: string) => {
    const type = getIconType(title)
    const map: Record<string, any> = {
      create: Plus,
      update: Edit,
      delete: X,
      scale: Zap,
      restart: RotateCw,
      default: Terminal
    }
    return map[type]
  }

  const getStatusTagType = (status: number) => getAuditStatusInfo(status).type as any
  const formatStatus = (status: number) => getAuditStatusInfo(status).label
  const formatTime = (timestamp?: number) =>
    timestamp ? dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss') : '-'

  const formatDetailPreview = (detail: string) => {
    if (!detail) return '无详细信息'
    return detail.length > 120 ? detail.substring(0, 120) + '...' : detail
  }

  // --- 数据操作逻辑 ---
  const handleView = (audit: ProjectAuditLog) => {
    currentAudit.value = audit
    detailVisible.value = true
  }

  const handleDelete = async (audit: ProjectAuditLog) => {
    try {
      deletingAudit.value = audit.id
      await deleteProjectAuditLogApi(audit.id)
      ElMessage.success('删除成功')
      if (auditLogs.value.length === 1 && pagination.current > 1) {
        pagination.current--
      }
      loadAuditLogs()
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      deletingAudit.value = null
    }
  }

  const loadAuditLogs = async () => {
    if (!canLoadData.value) {
      return
    }

    loading.value = true
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.size,
        projectId: selectedProject.value!.id,
        clusterUuid: currentCluster.value!.clusterUuid,
        workspaceId: props.workspace!.id,
        applicationId: props.application.id,
        status: -1
      }

      const response = await searchProjectAuditLogApi(params as any)

      auditLogs.value = response.items || []
      pagination.total = response.total || 0
    } catch (error) {
    } finally {
      loading.value = false
    }
  }

  const handleRefresh = () => {
    pagination.current = 1
    loadAuditLogs()
  }

  const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    loadAuditLogs()
  }

  const handleCurrentChange = (current: number) => {
    pagination.current = current
    loadAuditLogs()
  }

  // --- 监听器 ---
  watch(
    () => props.refreshTrigger,
    () => loadAuditLogs()
  )

  watch(
    [
      () => selectedProject.value?.id,
      () => currentCluster.value?.id,
      () => props.workspace?.id,
      () => props.application.id
    ],
    () => {
      pagination.current = 1
      loadAuditLogs()
    }
  )

  onMounted(() => {
    loadAuditLogs()
  })
</script>

<style lang="scss" scoped>
  .operation-audit-timeline {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
    background: #f8fafc;

    .audit-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 16px 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          .header-icon {
            color: #3b82f6;
          }
        }

        .title-group {
          display: flex;
          flex-direction: column;
          .header-title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
          }
          .header-subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 2px;
          }
        }

        .count-tag {
          margin-left: 8px;
          font-weight: 500;
        }
      }
    }

    .timeline-container {
      flex: 1;
      overflow-y: auto;
      padding: 10px 24px 24px 24px;

      :deep(.el-timeline) {
        padding-left: 2px;
      }
      :deep(.el-timeline-item__timestamp) {
        font-family: monospace;
        font-size: 13px;
        color: #94a3b8;
      }

      .timeline-card {
        margin-top: 8px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition:
          transform 0.2s,
          box-shadow 0.2s;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        :deep(.el-card__body) {
          padding: 16px 20px;
        }

        .card-content {
          display: flex;
          justify-content: space-between;
          gap: 20px;

          .card-main {
            flex: 1;
            min-width: 0;

            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;

              .title-row {
                display: flex;
                align-items: center;
                gap: 12px;

                .action-icon-wrapper {
                  width: 32px;
                  height: 32px;
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  &.action-create {
                    background: #d1fae5;
                    color: #10b981;
                  }
                  &.action-update {
                    background: #dbeafe;
                    color: #3b82f6;
                  }
                  &.action-delete {
                    background: #fee2e2;
                    color: #ef4444;
                  }
                  &.action-scale {
                    background: #ffedd5;
                    color: #f97316;
                  }
                  &.action-default {
                    background: #f1f5f9;
                    color: #64748b;
                  }
                }

                .card-title {
                  margin: 0;
                  font-size: 15px;
                  font-weight: 600;
                  color: #334155;
                }
              }

              .meta-row {
                display: flex;
                align-items: center;
                gap: 12px;
                .meta-item {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  font-size: 13px;
                  color: #64748b;
                }
              }
            }

            .card-body {
              .action-detail-box {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 10px 12px;
                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                font-size: 12px;
                color: #475569;
                line-height: 1.5;
                word-break: break-all;
              }
            }
          }

          .card-actions {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 8px;
            padding-left: 12px;
            border-left: 1px solid #f1f5f9;
          }
        }
      }

      .pagination-wrapper {
        margin-top: 24px;
        display: flex;
        justify-content: center;
      }
    }

    .detail-content {
      :deep(.desc-label) {
        width: 100px;
        color: #64748b;
        font-weight: 500;
      }
      .desc-value {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .detail-json-wrapper {
        margin-top: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;

        .detail-json-header {
          padding: 8px 12px;
          background: #f1f5f9;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
        }

        .detail-json-content {
          padding: 16px;
          background: #0f172a;
          color: #e2e8f0;
          font-family: monospace;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 400px;
          overflow-y: auto;
        }
      }
    }
  }
</style>
