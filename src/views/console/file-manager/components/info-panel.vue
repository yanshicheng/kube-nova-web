<template>
  <div class="info-panel-content">
    <!-- 文件图标预览 -->
    <div class="file-preview">
      <component
        :is="getFileIcon(file.mimeType || '', file.isDir)"
        :size="80"
        class="preview-icon"
        :class="getIconClass(file)"
      />
    </div>

    <!-- 文件名称 -->
    <div class="file-title">
      <div class="file-name">{{ file.name }}</div>
      <div class="file-type">{{ getFileType() }}</div>
    </div>

    <!-- 基本信息 -->
    <div class="info-section">
      <div class="section-title">基本信息</div>
      <div class="info-row">
        <span class="label">类型</span>
        <span class="value">{{ getFileType() }}</span>
      </div>
      <div class="info-row">
        <span class="label">大小</span>
        <span class="value">{{ file.isDir ? '-' : formatFileSize(file.size) }}</span>
      </div>
      <div class="info-row">
        <span class="label">位置</span>
        <span class="value path">{{ file.path }}</span>
      </div>
    </div>

    <!-- 时间信息 -->
    <div class="info-section">
      <div class="section-title">时间信息</div>
      <div class="info-row">
        <span class="label">修改时间</span>
        <span class="value">{{ formatDate(file.modTime) }}</span>
      </div>
    </div>

    <!-- 权限信息 -->
    <div class="info-section">
      <div class="section-title">权限信息</div>
      <div class="info-row">
        <span class="label">权限</span>
        <span class="value mode">{{ file.mode }}</span>
      </div>
      <div class="info-row">
        <span class="label">所有者</span>
        <span class="value">{{ file.owner || 'root' }}</span>
      </div>
      <div class="info-row">
        <span class="label">组</span>
        <span class="value">{{ file.group || 'root' }}</span>
      </div>
      <div class="permission-grid">
        <div class="permission-item">
          <div class="perm-label">可读</div>
          <CheckCircle2 v-if="file.isReadable" :size="20" class="perm-icon success" />
          <XCircle v-else :size="20" class="perm-icon" />
        </div>
        <div class="permission-item">
          <div class="perm-label">可写</div>
          <CheckCircle2 v-if="file.isWritable" :size="20" class="perm-icon success" />
          <XCircle v-else :size="20" class="perm-icon" />
        </div>
        <div class="permission-item">
          <div class="perm-label">可执行</div>
          <CheckCircle2 v-if="file.isExecutable" :size="20" class="perm-icon success" />
          <XCircle v-else :size="20" class="perm-icon" />
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="info-actions">
      <button v-if="!file.isDir" @click="$emit('download', file)" class="action-btn primary">
        <Download :size="16" />
        下载
      </button>
      <button @click="$emit('rename', file)" class="action-btn secondary">
        <Edit2 :size="16" />
        重命名
      </button>
      <button @click="$emit('delete', file)" class="action-btn danger">
        <Trash2 :size="16" />
        删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Download, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-vue-next'
  import type { FileInfo } from '@/api'
  import { getFileIcon, getFileIconClass, getFileTypeName } from './file-type'

  const props = defineProps<{
    file: FileInfo
    workspaceId: number
    podName: string
    container: string
  }>()

  defineEmits<{
    download: [file: FileInfo]
    rename: [file: FileInfo]
    delete: [file: FileInfo]
  }>()

  function getIconClass(file: FileInfo) {
    return getFileIconClass(file.mimeType || '', file.isDir)
  }

  function getFileType() {
    return getFileTypeName(props.file.mimeType || '', props.file.isDir)
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
</script>

<style lang="scss" scoped>
  .info-panel-content {
    display: flex;
    flex-direction: column;
    padding: 20px;
    height: 100%;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f0f0f0;
    }

    &::-webkit-scrollbar-thumb {
      background: #c0c4cc;
      border-radius: 3px;

      &:hover {
        background: #909399;
      }
    }
  }

  .file-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    margin-bottom: 20px;
    background: #f9fbfd;
    border-radius: 8px;
  }

  .preview-icon {
    &.icon-folder {
      color: #ffa940;
    }

    &.icon-code {
      color: #409eff;
    }

    &.icon-config {
      color: #9c27b0;
    }

    &.icon-image {
      color: #f56c6c;
    }

    &.icon-video {
      color: #e6a23c;
    }

    &.icon-audio {
      color: #67c23a;
    }

    &.icon-archive {
      color: #e6a23c;
    }

    &.icon-shell {
      color: #2e7d32;
    }

    &.icon-document {
      color: #ff6b35;
    }

    &.icon-file {
      color: #606266;
    }
  }

  .file-title {
    margin-bottom: 24px;
    text-align: center;
  }

  .file-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
    word-break: break-all;
  }

  .file-type {
    font-size: 12px;
    color: #909399;
  }

  .info-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: #909399;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 0;
    font-size: 14px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }
  }

  .label {
    color: #909399;
    flex-shrink: 0;
    margin-right: 16px;
  }

  .value {
    color: #303133;
    font-weight: 500;
    text-align: right;
    word-break: break-all;

    &.path {
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 12px;
    }

    &.mode {
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      background: #f9fbfd;
      padding: 2px 8px;
      border-radius: 4px;
    }
  }

  .permission-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 12px;
  }

  .permission-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    background: #f9fbfd;
    border-radius: 8px;
    gap: 8px;
  }

  .perm-label {
    font-size: 12px;
    color: #909399;
  }

  .perm-icon {
    color: #c0c4cc;

    &.success {
      color: #67c23a;
    }
  }

  .info-actions {
    margin-top: auto;
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &.primary {
      background: #409eff;
      color: #ffffff;

      &:hover {
        background: #66b1ff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(64, 169, 255, 0.3);
      }
    }

    &.secondary {
      background: #f9fbfd;
      color: #606266;
      border: 1px solid #e3e9ef;

      &:hover {
        background: #ffffff;
        border-color: #409eff;
        color: #409eff;
      }
    }

    &.danger {
      background: #f9fbfd;
      color: #f56c6c;
      border: 1px solid #e3e9ef;

      &:hover {
        background: #f56c6c;
        color: #ffffff;
        border-color: #f56c6c;
        transform: translateY(-1px);
      }
    }
  }
</style>
