<template>
  <div class="events-management-optimized">
    <ElCard shadow="never" class="events-card">
      <template #header>
        <div class="header-wrapper">
          <div class="header-left">
            <Activity :size="16" />
            <span class="header-title">事件列表</span>
            <ElTag v-if="pagination.total > 0" type="info" size="small">
              {{ pagination.total }} 条
            </ElTag>
          </div>
          <div class="header-right">
            <ElSelect
              v-model="queryParams.type"
              placeholder="事件类型"
              clearable
              size="default"
              style="width: 130px"
              @change="handleSearch"
            >
              <ElOption label="全部" value="" />
              <ElOption label="正常" value="Normal">
                <div class="option-with-icon">
                  <CheckCircle :size="14" style="color: #67c23a" />
                  <span>正常</span>
                </div>
              </ElOption>
              <ElOption label="警告" value="Warning">
                <div class="option-with-icon">
                  <AlertTriangle :size="14" style="color: #e6a23c" />
                  <span>警告</span>
                </div>
              </ElOption>
            </ElSelect>
            <ElButton
              :icon="RefreshCw"
              circle
              size="default"
              :loading="loading"
              @click="loadEvents"
            />
          </div>
        </div>
      </template>

      <div class="table-container">
        <!-- 统计卡片 - 只在有数据时显示 -->
        <div v-if="events.length > 0" class="stats-cards">
          <div class="stat-card normal-card">
            <div class="stat-icon">
              <CheckCircle :size="24" />
            </div>
            <div class="stat-info">
              <div class="stat-label">正常事件</div>
              <div class="stat-value">{{ normalEventsCount }}</div>
            </div>
          </div>
          <div class="stat-card warning-card">
            <div class="stat-icon">
              <AlertTriangle :size="24" />
            </div>
            <div class="stat-info">
              <div class="stat-label">警告事件</div>
              <div class="stat-value">{{ warningEventsCount }}</div>
            </div>
          </div>
          <div class="stat-card total-card">
            <div class="stat-icon">
              <Activity :size="24" />
            </div>
            <div class="stat-info">
              <div class="stat-label">当前页数量</div>
              <div class="stat-value">{{ events.length }}</div>
            </div>
          </div>
        </div>

        <!-- 事件表格 -->
        <ElTable
          :data="events"
          v-loading="loading"
          stripe
          class="events-table"
          :header-cell-style="{ background: '#fafafa', color: '#606266' }"
          :empty-text="loading ? '加载中...' : '暂无事件记录'"
        >
          <ElTableColumn prop="type" label="类型" width="100" align="center">
            <template #default="{ row }">
              <ElTag
                :type="row.type === 'Normal' ? 'success' : 'warning'"
                size="default"
                class="type-tag"
              >
                <CheckCircle v-if="row.type === 'Normal'" :size="12" />
                <AlertTriangle v-else :size="12" />
                {{ row.type }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="reason" label="原因" width="180">
            <template #default="{ row }">
              <div class="reason-cell">
                <Info :size="14" class="icon-muted" />
                <span>{{ row.reason }}</span>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="message" label="消息" min-width="300" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="message-cell">{{ row.message }}</div>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="involvedObjectKind" label="对象类型" width="120">
            <template #default="{ row }">
              <ElTag size="small" type="info">{{ row.involvedObjectKind || '-' }}</ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn
            prop="involvedObjectName"
            label="对象名称"
            width="180"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span class="text-content">{{ row.involvedObjectName || '-' }}</span>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="count" label="次数" width="80" align="center">
            <template #default="{ row }">
              <ElTag size="small" type="info" round>{{ row.count || 1 }}</ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="lastTimestamp" label="最后发生时间" width="160" align="center">
            <template #default="{ row }">
              <div class="time-cell">
                <Clock :size="14" class="icon-muted" />
                <span>{{ formatTime(row.lastTimestamp) }}</span>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>

        <!-- 分页 - 只在有数据时显示 -->
        <div v-if="pagination.total > 0" class="pagination-wrapper">
          <ElPagination
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>

        <!-- 空状态 - 只在没有数据且不在加载时显示 -->
        <ElEmpty v-if="!loading && events.length === 0" :image-size="120">
          <template #description>
            <div class="empty-content">
              <Activity :size="48" class="empty-icon" />
              <p class="empty-title">暂无事件记录</p>
              <p class="empty-hint">系统还没有记录任何事件，事件将在发生时自动显示在这里</p>
            </div>
          </template>
        </ElEmpty>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted } from 'vue'
  import { Activity, RefreshCw, CheckCircle, AlertTriangle, Clock, Info } from 'lucide-vue-next'
  import {
    queryEventsApi,
    type OnecProjectVersion,
    type EventInfo,
    type EventsQueryParams
  } from '@/api'
  import dayjs from 'dayjs'

  interface Props {
    version: OnecProjectVersion
    refreshTrigger?: number
  }

  const props = defineProps<Props>()

  const events = ref<EventInfo[]>([])
  const loading = ref(false)

  const queryParams = reactive<EventsQueryParams>({
    page: 1,
    pageSize: 20,
    type: ''
  })

  const pagination = reactive({
    total: 0,
    totalPages: 0
  })

  // 计算当前页面的正常事件数量
  const normalEventsCount = computed(() => {
    return events.value.filter((e) => e.type === 'Normal').length
  })

  // 计算当前页面的警告事件数量
  const warningEventsCount = computed(() => {
    return events.value.filter((e) => e.type === 'Warning').length
  })

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '-'
    return dayjs(timestamp * 1000).format('MM-DD HH:mm:ss')
  }

  const loadEvents = async () => {
    loading.value = true
    try {
      const response = await queryEventsApi(props.version.id, queryParams)


      // 设置事件列表
      events.value = response.items || []

      // 设置分页信息
      pagination.total = response.total || 0
      pagination.totalPages = response.totalPages || 0


      // 如果有数据，打印第一条事件的详细信息
      if (events.value.length > 0) {
      }
    } catch (error) {
      console.error('[EventsManagement] 加载失败:', error)
      events.value = []
      pagination.total = 0
      pagination.totalPages = 0
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    queryParams.page = 1
    loadEvents()
  }

  const handlePageChange = () => {
    loadEvents()
  }

  const handleSizeChange = () => {
    queryParams.page = 1
    loadEvents()
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        loadEvents()
      }
    }
  )

  onMounted(() => {
    loadEvents()
  })
</script>

<style lang="scss" scoped>
  .events-management-optimized {
    .events-card {
      border-radius: 8px;
      overflow: hidden;

      :deep(.el-card__header) {
        padding: 16px 20px;
        background: #fafafa;
        border-bottom: 1px solid #e5e7eb;
      }

      :deep(.el-card__body) {
        padding: 0;
      }

      // 卡片头部
      .header-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;

          .header-title {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
          }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;

          .option-with-icon {
            display: flex;
            align-items: center;
            gap: 6px;
          }
        }
      }

      // 表格容器
      .table-container {
        padding: 20px;

        // 统计卡片
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;

          .stat-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 20px;
            border-radius: 8px;
            transition: all 0.3s ease;
            border: 2px solid;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }

            &.normal-card {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border-color: #22c55e;

              .stat-icon {
                background: rgba(34, 197, 94, 0.1);
                color: #16a34a;
              }
            }

            &.warning-card {
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              border-color: #f59e0b;

              .stat-icon {
                background: rgba(245, 158, 11, 0.1);
                color: #d97706;
              }
            }

            &.total-card {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border-color: #3b82f6;

              .stat-icon {
                background: rgba(59, 130, 246, 0.1);
                color: #2563eb;
              }
            }

            .stat-icon {
              width: 56px;
              height: 56px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 12px;
              flex-shrink: 0;
            }

            .stat-info {
              flex: 1;

              .stat-label {
                font-size: 13px;
                color: #6b7280;
                margin-bottom: 4px;
                font-weight: 500;
              }

              .stat-value {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
                line-height: 1;
              }
            }
          }
        }

        // 事件表格
        .events-table {
          margin-bottom: 16px;
          height: 550px;

          :deep(.el-table) {
            height: 100%;
          }

          :deep(.el-table__body-wrapper) {
            overflow-y: auto !important;
          }

          // Tag 样式
          .type-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          // 表格单元格样式
          .reason-cell {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
          }

          .message-cell {
            font-size: 13px;
            color: #4b5563;
            line-height: 1.5;
          }

          .text-content {
            color: #606266;
          }

          .time-cell {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-size: 13px;
            color: #606266;
          }

          .icon-muted {
            color: #909399;
            flex-shrink: 0;
          }

          // Tag 图标对齐
          :deep(.el-tag) {
            display: inline-flex;
            align-items: center;
            gap: 2px;
          }

          // 隐藏表格空文本
          :deep(.el-table__empty-text) {
            display: none;
          }
        }

        // 分页
        .pagination-wrapper {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        // 空状态
        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 24px;

          .empty-icon {
            color: #c0c4cc;
            margin-bottom: 16px;
          }

          .empty-title {
            margin: 0 0 8px 0;
            font-size: 15px;
            font-weight: 500;
            color: #606266;
          }

          .empty-hint {
            margin: 0;
            font-size: 13px;
            color: #909399;
            line-height: 1.6;
          }
        }
      }
    }
  }
</style>
