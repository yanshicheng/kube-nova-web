<template>
  <div class="message-list">
    <!-- 批量操作栏 -->
    <div v-if="selectedIds.length > 0" class="list-toolbar">
      <el-checkbox
        :model-value="isAllSelected"
        :indeterminate="isIndeterminate"
        @change="handleSelectAll"
      >
        已选 {{ selectedIds.length }} 项
      </el-checkbox>
      <el-button text type="primary" size="small" @click="handleClearSelection">
        取消选择
      </el-button>
    </div>

    <!-- 消息列表 -->
    <div v-loading="loading" class="list-content">
      <el-scrollbar height="100%">
        <div class="message-items">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'message-item',
              {
                'is-active': currentId === message.id,
                'is-unread': !message.isRead,
                'is-expired': checkExpired(message.expireAt)
              }
            ]"
            @click="handleSelect(message.id)"
          >
            <!-- 选择框 -->
            <el-checkbox
              :model-value="selectedIds.includes(message.id)"
              class="item-checkbox"
              @click.stop
              @change="(val: boolean) => handleCheckChange(val, message.id)"
            />

            <!-- 消息类型图标 -->
            <div class="item-icon">
              <el-icon :size="20" :color="getCategoryColor(message.category)">
                <component :is="getCategoryIcon(message.category)" />
              </el-icon>
            </div>

            <!-- 消息内容 -->
            <div class="item-content">
              <div class="item-header">
                <span class="item-title">{{ message.title }}</span>
                <el-tag :type="getSeverityType(message.severity)" size="small" effect="plain">
                  {{ getSeverityName(message.severity) }}
                </el-tag>
              </div>

              <div class="item-meta">
                <el-tag
                  size="small"
                  :type="message.category === 'system' ? 'info' : 'warning'"
                  effect="plain"
                >
                  {{ getCategoryName(message.category) }}
                </el-tag>
                <span class="item-time">{{ formatRelativeTime(message.createdAt) }}</span>
              </div>

              <!-- 未读标识 -->
              <div v-if="!message.isRead" class="unread-dot" />
            </div>
          </div>

          <!-- 空状态 -->
          <el-empty
            v-if="!loading && messages.length === 0"
            description="暂无消息"
            :image-size="120"
          />
        </div>
      </el-scrollbar>
    </div>

    <div class="list-footer">
      <span class="footer-total"
        >共 <em>{{ total }}</em> 条</span
      >
      <div class="footer-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="currentPageSize"
          :total="total"
          :page-sizes="[15, 30, 50, 100]"
          :pager-count="5"
          size="small"
          background
          layout="prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
        <el-select
          v-model="currentPageSize"
          size="small"
          class="size-select"
          @change="handleSizeChange"
        >
          <el-option :value="15" label="15/页" />
          <el-option :value="30" label="30/页" />
          <el-option :value="50" label="50/页" />
          <el-option :value="100" label="100/页" />
        </el-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { Bell, WarnTriangleFilled, InfoFilled } from '@element-plus/icons-vue'
  import type { SiteMessages } from '@/api/portal/site-messages'
  import {
    getRelativeTime,
    isMessageExpired,
    getMessageSeverityTagType,
    MessageSeverityNames,
    MessageSeverity
  } from '@/api/portal/site-messages'

  interface Props {
    messages: SiteMessages[]
    loading: boolean
    currentId: number | null
    selectedIds: number[]
    total: number
    page: number
    pageSize: number
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    select: [id: number]
    selectChange: [ids: number[]]
    pageChange: [page: number]
    sizeChange: [size: number]
  }>()

  // 分页数据
  const currentPage = ref(props.page)
  const currentPageSize = ref(props.pageSize)

  // 监听外部分页变化
  watch(
    () => props.page,
    (val) => {
      currentPage.value = val
    }
  )

  watch(
    () => props.pageSize,
    (val) => {
      currentPageSize.value = val
    }
  )

  // 是否全选
  const isAllSelected = computed(() => {
    return props.messages.length > 0 && props.selectedIds.length === props.messages.length
  })

  // 是否半选
  const isIndeterminate = computed(() => {
    const len = props.selectedIds.length
    return len > 0 && len < props.messages.length
  })

  // 选择消息
  const handleSelect = (id: number) => {
    emit('select', id)
  }

  // 复选框变化
  const handleCheckChange = (checked: boolean, id: number) => {
    let newIds: number[]
    if (checked) {
      newIds = [...props.selectedIds, id]
    } else {
      newIds = props.selectedIds.filter((i) => i !== id)
    }
    emit('selectChange', newIds)
  }

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    const newIds = checked ? props.messages.map((m) => m.id) : []
    emit('selectChange', newIds)
  }

  // 清空选择
  const handleClearSelection = () => {
    emit('selectChange', [])
  }

  // 分页变化
  const handlePageChange = (page: number) => {
    emit('pageChange', page)
  }

  // 每页条数变化
  const handleSizeChange = (size: number) => {
    currentPageSize.value = size
    emit('sizeChange', size)
  }

  // 获取分类名称
  const getCategoryName = (category: string): string => {
    const map: Record<string, string> = {
      system: '平台通知',
      prometheus: '集群告警'
    }
    return map[category] || category
  }

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    const map: Record<string, typeof Bell> = {
      system: InfoFilled,
      prometheus: WarnTriangleFilled
    }
    return map[category] || Bell
  }

  // 获取分类颜色
  const getCategoryColor = (category: string): string => {
    const map: Record<string, string> = {
      system: '#409eff',
      prometheus: '#e6a23c'
    }
    return map[category] || '#909399'
  }

  // 获取严重级别标签类型
  const getSeverityType = (severity: string) => {
    return getMessageSeverityTagType(severity)
  }

  // 获取严重级别名称
  const getSeverityName = (severity: string): string => {
    return MessageSeverityNames[severity as MessageSeverity] || severity
  }

  // 格式化相对时间
  const formatRelativeTime = (timestamp: number): string => {
    return getRelativeTime(timestamp)
  }

  // 检查是否过期
  const checkExpired = (expireAt: number): boolean => {
    return isMessageExpired(expireAt)
  }
</script>

<style scoped lang="scss">
  .message-list {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .list-toolbar {
    padding: 10px 16px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f5f7fa;
    flex-shrink: 0;
  }

  .list-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .message-items {
    .message-item {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid #ebeef5;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f5f7fa;
      }

      &.is-active {
        background: #ecf5ff;
        border-left: 3px solid #409eff;
        padding-left: 13px;
      }

      &.is-unread {
        background: #fafcff;
      }

      &.is-expired {
        opacity: 0.6;
      }

      .item-checkbox {
        margin-top: 2px;
        flex-shrink: 0;
      }

      .item-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f7fa;
      }

      .item-content {
        flex: 1;
        min-width: 0;
        position: relative;

        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .item-title {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #909399;

          .item-time {
            margin-left: auto;
          }
        }

        .unread-dot {
          position: absolute;
          top: 2px;
          right: -8px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f56c6c;
        }
      }
    }
  }

  .list-footer {
    flex-shrink: 0;
    height: 48px;
    padding: 0 12px;
    border-top: 1px solid #ebeef5;
    background: #fafafa;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .footer-total {
      font-size: 12px;
      color: #909399;
      white-space: nowrap;
      flex-shrink: 0;

      em {
        color: #409eff;
        font-style: normal;
        font-weight: 600;
      }
    }

    .footer-pagination {
      display: flex;
      align-items: center;
      gap: 8px;

      .size-select {
        width: 80px;
        flex-shrink: 0;

        :deep(.el-input__wrapper) {
          padding: 0 8px;
        }

        :deep(.el-input__inner) {
          font-size: 12px;
        }
      }
    }

    :deep(.el-pagination) {
      padding: 0;
      flex-wrap: nowrap;

      .btn-prev,
      .btn-next {
        min-width: 24px;
        height: 24px;
        padding: 0;
        margin: 0 2px;
        background: #fff;
        border-radius: 4px;

        &:hover:not(:disabled) {
          color: #409eff;
        }

        &:disabled {
          color: #c0c4cc;
          background: #f5f7fa;
        }
      }

      .el-pager {
        li {
          min-width: 24px;
          height: 24px;
          line-height: 24px;
          font-size: 12px;
          margin: 0 2px;
          padding: 0;
          border-radius: 4px;

          &.is-active {
            background: #409eff;
            color: #fff;
          }

          &.more {
            background: transparent;
          }
        }
      }
    }
  }
</style>
