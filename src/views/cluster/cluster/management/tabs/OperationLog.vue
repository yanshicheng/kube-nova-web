<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    FileText,
    Activity,
    RefreshCw,
    Calendar,
    User,
    CheckCircle,
    XCircle,
    Trash2,
    Plus,
    Edit,
    Shield,
    Zap,
    Settings,
    Terminal
  } from 'lucide-vue-next'
  import {
    searchProjectAuditLogApi,
    deleteProjectAuditLogApi,
    type ProjectAuditLog,
    getAuditStatusInfo
  } from '@/api/manager/audit'

  interface Props {
    clusterDetail?: any
    isActive?: boolean
  }

  const props = defineProps<Props>()

  // 状态管理
  const loading = ref(false)
  const refreshLoading = ref(false)
  const auditLogs = ref<ProjectAuditLog[]>([])
  const total = ref(0)
  const isFirstLoad = ref(true)
  const deletingId = ref<number | null>(null) // ⭐ 新增：记录正在删除的ID

  // 分页配置
  const pagination = ref({
    page: 1,
    pageSize: 10
  })

  // 筛选配置
  const filterKeyword = ref<string>('')
  const filterStatus = ref<number>(-1)

  // 样式映射 (保持不变)
  const getLogStyle = (title: string = '') => {
    if (title.includes('创建') || title.includes('新增'))
      return { icon: Plus, color: '#10b981', bg: '#ecfdf5', label: '创建' }
    if (title.includes('更新') || title.includes('修改') || title.includes('编辑'))
      return { icon: Edit, color: '#3b82f6', bg: '#eff6ff', label: '更新' }
    if (title.includes('删除') || title.includes('移除'))
      return { icon: Trash2, color: '#ef4444', bg: '#fef2f2', label: '删除' }
    if (title.includes('扩容') || title.includes('缩容') || title.includes('副本'))
      return { icon: Zap, color: '#f59e0b', bg: '#fffbeb', label: '伸缩' }
    if (title.includes('同步'))
      return { icon: RefreshCw, color: '#6366f1', bg: '#eef2ff', label: '同步' }
    if (title.includes('配置'))
      return { icon: Settings, color: '#8b5cf6', bg: '#f5f3ff', label: '配置' }
    if (title.includes('认证') || title.includes('权限'))
      return { icon: Shield, color: '#ea580c', bg: '#fff7ed', label: '安全' }
    return { icon: Terminal, color: '#64748b', bg: '#f8fafc', label: '操作' }
  }

  // 时间格式化 (保持不变)
  const formatTime = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() / 1000 - timestamp
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  }

  // 分组逻辑 (保持不变)
  const groupedLogs = computed(() => {
    let logs = auditLogs.value
    if (filterStatus.value !== -1) logs = logs.filter((log) => log.status === filterStatus.value)
    if (filterKeyword.value) logs = logs.filter((log) => log.title.includes(filterKeyword.value))

    const groups: Record<string, ProjectAuditLog[]> = {}
    logs.forEach((log) => {
      const date = new Date(log.createdAt * 1000).toLocaleDateString('zh-CN')
      if (!groups[date]) groups[date] = []
      groups[date].push(log)
    })
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({ date, logs: groups[date] }))
  })

  // 获取日志
  const fetchAuditLogs = async () => {
    if (!props.clusterDetail?.uuid) return
    loading.value = true
    try {
      const params = {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        clusterUuid: props.clusterDetail.uuid,
        projectId: 0,
        applicationId: 0,
        workspaceId: 0,
        status: -1
      }
      // @ts-ignore
      const res = await searchProjectAuditLogApi(params)
      auditLogs.value = res.items || []
      total.value = res.total || 0
      isFirstLoad.value = false
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  const handleDelete = async (id: number) => {
    try {
      deletingId.value = id
      await deleteProjectAuditLogApi(id)
      ElMessage.success('删除成功')
      // 如果当前页只剩一条数据且不是第一页，向前翻页
      if (auditLogs.value.length === 1 && pagination.value.page > 1) {
        pagination.value.page--
      }
      fetchAuditLogs()
    } catch (error) {
    } finally {
      deletingId.value = null
    }
  }

  const handleRefresh = async () => {
    refreshLoading.value = true
    try {
      pagination.value.page = 1
      await fetchAuditLogs()
      ElMessage.success('日志已刷新')
    } finally {
      refreshLoading.value = false
    }
  }
  const handlePageChange = (val: number) => {
    pagination.value.page = val
    fetchAuditLogs()
  }

  watch(
    () => props.isActive,
    (active) => {
      if (active && isFirstLoad.value) fetchAuditLogs()
    },
    { immediate: true }
  )
  watch(
    () => props.clusterDetail?.uuid,
    (uuid) => {
      if (uuid && props.isActive) fetchAuditLogs()
    }
  )
</script>

<template>
  <div class="cluster-audit-panel">
    <div class="panel-header">
      <div class="header-left">
        <div class="icon-box"><Activity /></div>
        <div class="header-text"
          ><h3>集群操作审计</h3><p>追踪集群范围内的资源变更与操作记录</p></div
        >
      </div>
      <div class="header-right">
        <el-button :icon="RefreshCw" :loading="refreshLoading" circle @click="handleRefresh" />
      </div>
    </div>

    <div class="filter-toolbar">
      <el-input
        v-model="filterKeyword"
        placeholder="搜索操作名称..."
        :prefix-icon="FileText"
        clearable
        style="width: 200px"
      />
      <el-select v-model="filterStatus" placeholder="状态" style="width: 120px">
        <el-option :value="-1" label="全部状态" />
        <el-option :value="1" label="成功"
          ><span class="status-option success"><CheckCircle :size="14" /> 成功</span></el-option
        >
        <el-option :value="0" label="失败"
          ><span class="status-option fail"><XCircle :size="14" /> 失败</span></el-option
        >
      </el-select>
      <div class="total-badge" v-if="total > 0">共 {{ total }} 条</div>
    </div>

    <div class="log-container" v-loading="loading">
      <div v-if="groupedLogs.length > 0" class="timeline-wrapper">
        <div v-for="group in groupedLogs" :key="group.date" class="date-section">
          <div class="date-divider">
            <span class="date-label"><Calendar :size="14" /> {{ group.date }}</span>
            <span class="line"></span>
          </div>

          <div class="log-list">
            <div v-for="log in group.logs" :key="log.id" class="log-item">
              <div class="item-meta">
                <span class="time">{{ formatTime(log.createdAt).split(' ')[1] }}</span>
                <div class="status-line">
                  <div class="status-dot" :class="log.status === 1 ? 'success' : 'fail'">
                    <component :is="log.status === 1 ? CheckCircle : XCircle" :size="12" />
                  </div>
                  <div class="line"></div>
                </div>
              </div>

              <div class="item-card">
                <div class="card-header">
                  <div class="title-section">
                    <div
                      class="type-badge"
                      :style="{
                        background: getLogStyle(log.title).bg,
                        color: getLogStyle(log.title).color
                      }"
                    >
                      <component :is="getLogStyle(log.title).icon" :size="14" />
                      {{ getLogStyle(log.title).label }}
                    </div>
                    <span class="log-title">{{ log.title }}</span>
                  </div>

                  <div class="info-section">
                    <span class="operator"><User :size="12" /> {{ log.operatorName }}</span>
                    <span class="relative-time">{{ formatRelativeTime(log.createdAt) }}</span>

                    <el-popconfirm
                      title="确定删除这条记录吗?"
                      width="200"
                      @confirm="handleDelete(log.id)"
                    >
                      <template #reference>
                        <el-button
                          class="delete-btn"
                          type="danger"
                          link
                          :icon="Trash2"
                          :loading="deletingId === log.id"
                        >
                        </el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>

                <div class="card-body">
                  <div class="detail-box">{{ log.actionDetail || '暂无详细信息' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else-if="!loading" description="暂无审计记录" :image-size="100" />
    </div>

    <div class="pagination-bar" v-if="total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        background
        small
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
  .cluster-audit-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 8px;

    /* ... 头部和筛选样式保持不变 ... */
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .header-left {
        display: flex;
        gap: 12px;
        align-items: center;
        .icon-box {
          width: 40px;
          height: 40px;
          background: #f0f9ff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0ea5e9;
        }
        .header-text {
          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
          }
          p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #64748b;
          }
        }
      }
    }
    .filter-toolbar {
      padding: 12px 20px;
      display: flex;
      gap: 12px;
      align-items: center;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      .status-option {
        display: flex;
        align-items: center;
        gap: 6px;
        &.success {
          color: #10b981;
        }
        &.fail {
          color: #ef4444;
        }
      }
      .total-badge {
        margin-left: auto;
        font-size: 12px;
        color: #94a3b8;
      }
    }

    .log-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      .timeline-wrapper {
        .date-section {
          margin-bottom: 24px;
          .date-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            .date-label {
              font-size: 12px;
              font-weight: 600;
              color: #64748b;
              background: #f1f5f9;
              padding: 4px 10px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .line {
              flex: 1;
              height: 1px;
              background: #e2e8f0;
            }
          }
          .log-list {
            .log-item {
              display: flex;
              gap: 16px;
              margin-bottom: 16px;
              &:last-child {
                .item-meta .status-line .line {
                  display: none;
                }
              }
              .item-meta {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                width: 60px;
                flex-shrink: 0;
                .time {
                  font-size: 12px;
                  color: #94a3b8;
                  font-family: monospace;
                  margin-bottom: 4px;
                }
                .status-line {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  height: 100%;
                  width: 100%;
                  margin-right: -25px;
                  .status-dot {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                    background: #fff;
                    &.success {
                      color: #10b981;
                      box-shadow: 0 0 0 3px #d1fae5;
                    }
                    &.fail {
                      color: #ef4444;
                      box-shadow: 0 0 0 3px #fee2e2;
                    }
                  }
                  .line {
                    width: 2px;
                    flex: 1;
                    background: #f1f5f9;
                    margin-top: 4px;
                    min-height: 20px;
                  }
                }
              }
              .item-card {
                flex: 1;
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                transition: all 0.2s;
                &:hover {
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                  border-color: #cbd5e1;
                  .delete-btn {
                    opacity: 1;
                  }
                }
                .card-header {
                  padding: 12px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 1px solid #f8fafc;
                  .title-section {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    .type-badge {
                      display: flex;
                      align-items: center;
                      gap: 4px;
                      padding: 2px 8px;
                      border-radius: 6px;
                      font-size: 12px;
                      font-weight: 600;
                    }
                    .log-title {
                      font-size: 14px;
                      font-weight: 500;
                      color: #334155;
                    }
                  }
                  .info-section {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    font-size: 12px;
                    color: #94a3b8;
                    .operator {
                      display: flex;
                      align-items: center;
                      gap: 4px;
                    }
                    .delete-btn {
                      opacity: 1;
                      transition: opacity 0.2s;
                      padding: 4px;
                      height: auto;
                      margin-left: 4px;
                      color: #ef4444;
                      &:hover {
                        background-color: #fef2f2;
                        border-radius: 4px;
                      }
                    }
                  }
                }
                .card-body {
                  padding: 10px 12px;
                  background: #fcfcfc;
                  border-bottom-left-radius: 8px;
                  border-bottom-right-radius: 8px;
                  .detail-box {
                    font-size: 12px;
                    color: #475569;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    word-break: break-all;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    &:hover {
                      -webkit-line-clamp: unset;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    .pagination-bar {
      padding: 12px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: center;
    }
  }
</style>
