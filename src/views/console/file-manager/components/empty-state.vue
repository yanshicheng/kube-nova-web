<template>
  <div class="empty-state">
    <FolderOpen :size="80" class="empty-icon" />
    <div class="empty-text">{{ hasSearch ? '没有找到匹配的文件' : '文件夹为空' }}</div>
    <div class="empty-hint">{{ hasSearch ? '尝试其他关键词' : '点击上传按钮添加文件' }}</div>
  </div>
</template>

<script setup lang="ts">
  import { FolderOpen } from 'lucide-vue-next'

  defineProps<{
    hasSearch: boolean
  }>()
</script>

<style lang="scss" scoped>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #94a3b8;
  }

  .empty-icon {
    margin-bottom: 20px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 18px;
    color: #e6edf3;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .empty-hint {
    font-size: 14px;
    color: #94a3b8;
  }
</style>
