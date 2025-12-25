<template>
  <div class="namespace-events-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>事件监控</h3>
              <p>Namespace 事件记录</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge total">
              <span class="label">总事件</span>
              <span class="value">{{ eventsData?.totalEvents || 0 }}</span>
            </div>
            <div class="stat-badge normal">
              <span class="label">正常</span>
              <span class="value">{{ eventsData?.normalEvents || 0 }}</span>
            </div>
            <div class="stat-badge warning">
              <span class="label">警告</span>
              <span class="value">{{ eventsData?.warningEvents || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
          <!-- 事件类型筛选 -->
          <div class="filter-section">
            <ElRadioGroup v-model="eventTypeFilter" size="small">
              <ElRadioButton label="all">全部</ElRadioButton>
              <ElRadioButton label="Normal">正常</ElRadioButton>
              <ElRadioButton label="Warning">警告</ElRadioButton>
            </ElRadioGroup>
          </div>

          <!-- 事件列表 -->
          <div v-if="filteredEvents.length > 0" class="events-list">
            <div
              v-for="(event, index) in filteredEvents.slice(0, displayLimit)"
              :key="index"
              class="event-item"
              :class="{ warning: event.type === 'Warning' }"
            >
              <div class="event-icon">
                <ElIcon v-if="event.type === 'Warning'" class="icon-warning">
                  <Warning />
                </ElIcon>
                <ElIcon v-else class="icon-normal">
                  <CircleCheck />
                </ElIcon>
              </div>
              <div class="event-content">
                <div class="event-header">
                  <ElTag :type="event.type === 'Warning' ? 'warning' : 'success'" size="small">
                    {{ event.type }}
                  </ElTag>
                  <span class="event-reason">{{ event.reason }}</span>
                  <span v-if="event.count > 1" class="event-count">
                    <ElIcon><Refresh /></ElIcon>
                    {{ event.count }} 次
                  </span>
                </div>
                <div class="event-message">{{ event.message }}</div>
                <div class="event-meta">
                  <span class="event-object">
                    <ElIcon><Box /></ElIcon>
                    {{ event.involvedObject.kind }}/{{ event.involvedObject.name }}
                  </span>
                  <span class="event-time">
                    <ElIcon><Clock /></ElIcon>
                    {{ formatTime(event.timestamp) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 加载更多 -->
            <div v-if="filteredEvents.length > displayLimit" class="load-more">
              <ElButton type="primary" text @click="loadMore">
                加载更多 ({{ filteredEvents.length - displayLimit }} 条)
              </ElButton>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-events">
            <ElEmpty description="暂无事件记录" :image-size="120">
              <template #image>
                <ElIcon :size="120" color="#d1d5db">
                  <CircleCheck />
                </ElIcon>
              </template>
            </ElEmpty>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无事件数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Warning, CircleCheck, Refresh, Box, Clock } from '@element-plus/icons-vue'
import type { NamespaceEvents } from '@/api/console/namespace-monitor'

interface Props {
  eventsData?: NamespaceEvents
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  eventsData: undefined,
  loading: false
})

const eventTypeFilter = ref<'all' | 'Normal' | 'Warning'>('all')
const displayLimit = ref(10)

const hasData = computed(() => {
  return !!(props.eventsData && props.eventsData.events && props.eventsData.events.length > 0)
})

const filteredEvents = computed(() => {
  if (!props.eventsData?.events) return []
  if (eventTypeFilter.value === 'all') return props.eventsData.events
  return props.eventsData.events.filter((event) => event.type === eventTypeFilter.value)
})

const formatTime = (timestamp: string): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }
  // 大于1天
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadMore = () => {
  displayLimit.value += 10
}
</script>

<style lang="scss" scoped>
.namespace-events-monitor {
  .monitor-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-bottom: 1px solid #bae6fd;
    flex-wrap: wrap;
    gap: 14px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .icon-wrapper {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .header-title {
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1a202c;
        }

        p {
          margin: 2px 0 0;
          font-size: 12px;
          color: #718096;
        }
      }
    }

    .header-stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .stat-badge {
        padding: 6px 12px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;

        &.total {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          color: #4c51bf;
        }

        &.normal {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
        }

        &.warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
        }

        .label {
          opacity: 0.8;
        }

        .value {
          font-weight: 700;
          font-size: 14px;
        }
      }
    }
  }

  .content-wrapper {
    padding: 20px;
  }

  .filter-section {
    margin-bottom: 20px;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .event-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      border-left: 4px solid #67c23a;
      transition: all 0.3s ease;

      &.warning {
        border-left-color: #e6a23c;
        background: linear-gradient(135deg, #fef9e8 0%, #fffbeb 100%);
      }

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateX(4px);
      }

      .event-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 24px;

        .icon-normal {
          color: #67c23a;
        }

        .icon-warning {
          color: #e6a23c;
        }
      }

      .event-content {
        flex: 1;
        min-width: 0;

        .event-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;

          .event-reason {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
          }

          .event-count {
            font-size: 12px;
            color: #909399;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            background: #f0f2f5;
            border-radius: 4px;
          }
        }

        .event-message {
          font-size: 13px;
          color: #606266;
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .event-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 12px;
          color: #909399;
          flex-wrap: wrap;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .event-object {
            color: #409eff;
          }
        }
      }
    }

    .load-more {
      text-align: center;
      padding: 16px;
    }
  }

  .empty-events {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 350px;
    background: white;
    border-radius: 12px;
  }
}

@media (max-width: 768px) {
  .namespace-events-monitor {
    .card-header {
      padding: 14px 18px;

      .header-stats {
        width: 100%;
      }
    }

    .event-item {
      padding: 12px;

      .event-icon {
        width: 32px;
        height: 32px;
        font-size: 20px;
      }

      .event-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  }
}
</style>