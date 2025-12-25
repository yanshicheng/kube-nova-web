<template>
  <div class="message-filters">
    <el-form :inline="true" label-width="auto">
      <el-form-item label="阅读状态">
        <el-select
          :model-value="filters.isRead"
          placeholder="请选择"
          style="width: 120px"
          @change="handleIsReadChange"
        >
          <el-option
            v-for="item in readStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="消息类型">
        <el-select
          :model-value="filters.category"
          placeholder="全部"
          clearable
          style="width: 140px"
          @change="handleCategoryChange"
        >
          <el-option label="平台通知" value="system" />
          <el-option label="集群告警" value="prometheus" />
        </el-select>
      </el-form-item>

      <el-form-item label="严重级别">
        <el-select
          :model-value="filters.severity"
          placeholder="全部"
          clearable
          style="width: 120px"
          @change="handleSeverityChange"
        >
          <el-option
            v-for="item in severityOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="关键词">
        <el-input
          :model-value="filters.title"
          placeholder="搜索标题"
          clearable
          style="width: 200px"
          @input="handleTitleInput"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { Search, Refresh } from '@element-plus/icons-vue'
  import type { MessageFilters } from '../types'

  interface Props {
    filters: MessageFilters
  }

  defineProps<Props>()

  const emit = defineEmits<{
    'update:filters': [filters: Partial<MessageFilters>]
    search: []
    reset: []
  }>()

  // 阅读状态选项
  const readStatusOptions = [
    { value: 3, label: '全部' },
    { value: 0, label: '未读' },
    { value: 1, label: '已读' }
  ]

  // 严重级别选项
  const severityOptions = [
    { value: 'info', label: '提示' },
    { value: 'warning', label: '警告' },
    { value: 'critical', label: '严重' }
  ]

  const handleIsReadChange = (value: number) => {
    emit('update:filters', { isRead: value })
  }

  const handleCategoryChange = (value: string) => {
    emit('update:filters', { category: value || '' })
  }

  const handleSeverityChange = (value: string) => {
    emit('update:filters', { severity: value || '' })
  }

  const handleTitleInput = (value: string) => {
    emit('update:filters', { title: value })
  }

  const handleSearch = () => {
    emit('search')
  }

  const handleReset = () => {
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .message-filters {
    margin-bottom: 20px;
    padding: 16px 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

    .el-form {
      margin-bottom: 0;

      :deep(.el-form-item) {
        margin-bottom: 0;
        margin-right: 16px;
      }
    }
  }
</style>
