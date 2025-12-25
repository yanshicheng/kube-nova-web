<template>
  <div class="file-grid-light">
    <div
      v-for="file in files"
      :key="file.path"
      class="file-card"
      :class="{ selected: isSelected(file) }"
      @click="$emit('select', file)"
      @dblclick="$emit('open', file)"
      @contextmenu="(e) => $emit('context-menu', e, file)"
    >
      <component :is="getFileIcon(file.mimeType || '', file.isDir)" :size="56" :class="['file-icon', getFileIconClass(file.mimeType || '', file.isDir)]" />
      <div class="file-name">{{ file.name }}</div>
      <div v-if="!file.isDir" class="file-size">{{ formatFileSize(file.size) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { FileInfo } from '@/api'
  import { getFileIcon, getFileIconClass } from './file-type'

  const props = defineProps<{
    files: FileInfo[]
    selectedFiles: FileInfo[]
  }>()

  defineEmits<{
    select: [file: FileInfo]
    open: [file: FileInfo]
    'context-menu': [event: MouseEvent, file: FileInfo]
  }>()

  function isSelected(file: FileInfo) {
    return props.selectedFiles.some((f) => f.path === file.path)
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B'
    if (!bytes) return '-'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
</script>

<style lang="scss" scoped>
  .file-grid-light {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .file-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 16px;
    background: #ffffff;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    box-sizing: border-box;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    &.selected {
      background: rgba(64, 169, 255, 0.08);
      border-color: #409eff;
      box-shadow: 0 0 0 3px rgba(64, 169, 255, 0.15);
    }
  }

  .file-icon {
    margin-bottom: 12px;
    transition: all 0.3s ease;
    flex-shrink: 0;

    &.icon-folder {
      color: #ffa940 !important;
      stroke: #ffa940 !important;
    }

    &.icon-code {
      color: #409eff !important;
      stroke: #409eff !important;
    }

    &.icon-config {
      color: #9c27b0 !important;
      stroke: #9c27b0 !important;
    }

    &.icon-image {
      color: #f56c6c !important;
      stroke: #f56c6c !important;
    }

    &.icon-video {
      color: #e6a23c !important;
      stroke: #e6a23c !important;
    }

    &.icon-audio {
      color: #67c23a !important;
      stroke: #67c23a !important;
    }

    &.icon-archive {
      color: #e6a23c !important;
      stroke: #e6a23c !important;
    }

    &.icon-shell {
      color: #2e7d32 !important;
      stroke: #2e7d32 !important;
    }

    &.icon-document {
      color: #ff6b35 !important;
      stroke: #ff6b35 !important;
    }

    &.icon-file {
      color: #606266 !important;
      stroke: #606266 !important;
    }
  }

  .file-name {
    font-size: 13px;
    color: #303133;
    word-break: break-all;
    max-width: 120px;
    line-height: 1.4;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .file-size {
    font-size: 11px;
    color: #909399;
  }

  @media (max-width: 768px) {
    .file-grid-light {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
    }

    .file-card {
      padding: 16px 12px;
    }

    .file-icon {
      :deep(svg) {
        width: 48px;
        height: 48px;
      }
    }

    .file-name {
      font-size: 12px;
    }
  }
</style>