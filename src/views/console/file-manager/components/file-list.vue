<template>
  <div class="file-list">
    <table class="file-table">
      <thead>
      <tr>
        <th @click="$emit('sort', 'name')" class="sortable">
          <div class="th-content">
            名称
            <ChevronUp v-if="sortField === 'name' && sortOrder === 'asc'" :size="16" />
            <ChevronDown v-if="sortField === 'name' && sortOrder === 'desc'" :size="16" />
          </div>
        </th>
        <th @click="$emit('sort', 'size')" class="sortable">
          <div class="th-content">
            大小
            <ChevronUp v-if="sortField === 'size' && sortOrder === 'asc'" :size="16" />
            <ChevronDown v-if="sortField === 'size' && sortOrder === 'desc'" :size="16" />
          </div>
        </th>
        <th @click="$emit('sort', 'modTime')" class="sortable">
          <div class="th-content">
            修改时间
            <ChevronUp v-if="sortField === 'modTime' && sortOrder === 'asc'" :size="16" />
            <ChevronDown v-if="sortField === 'modTime' && sortOrder === 'desc'" :size="16" />
          </div>
        </th>
        <th>权限</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr
        v-for="file in files"
        :key="file.path"
        :class="{ selected: isSelected(file) }"
        @click="$emit('select', file)"
        @dblclick="$emit('open', file)"
        @contextmenu="(e) => $emit('context-menu', e, file)"
      >
        <td>
          <div class="file-name-cell">
            <component
              :is="getFileIcon(file.mimeType || '', file.isDir)"
              :size="20"
              :class="['file-icon', getFileIconClass(file.mimeType || '', file.isDir)]"
            />
            <span>{{ file.name }}</span>
          </div>
        </td>
        <td>{{ file.isDir ? '-' : formatFileSize(file.size) }}</td>
        <td>{{ formatDate(file.modTime) }}</td>
        <td>
          <span class="file-mode">{{ file.mode }}</span>
        </td>
        <td>
          <div class="file-actions">
            <button
              v-if="!file.isDir"
              @click.stop="$emit('download', file)"
              class="action-btn"
              title="下载"
            >
              <Download :size="16" />
            </button>
            <button @click.stop="$emit('delete', file)" class="action-btn danger" title="删除">
              <Trash2 :size="16" />
            </button>
          </div>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
  import { Download, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next'
  import type { FileInfo } from '@/api'
  import { getFileIcon, getFileIconClass } from './file-type'

  const props = defineProps<{
    files: FileInfo[]
    selectedFiles: FileInfo[]
    sortField: 'name' | 'size' | 'modTime'
    sortOrder: 'asc' | 'desc'
  }>()

  defineEmits<{
    select: [file: FileInfo]
    open: [file: FileInfo]
    sort: [field: 'name' | 'size' | 'modTime']
    download: [file: FileInfo]
    delete: [file: FileInfo]
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

  function formatDate(dateString: string) {
    if (!dateString) return '-'

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
</script>

<style lang="scss" scoped>
  .file-list {
    width: 100%;
    overflow-x: auto;
  }

  .file-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;

    thead {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #f9fbfd;
    }

    th {
      text-align: left;
      padding: 14px 16px;
      border-bottom: 1px solid #e3e9ef;
      font-size: 12px;
      font-weight: 600;
      color: #79879c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      background: #f9fbfd;

      &.sortable {
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;

        &:hover {
          color: #409eff;
          background: rgba(64, 169, 255, 0.05);
        }

        .th-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }
    }

    td {
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
      color: #242e42;
    }

    tbody tr {
      cursor: pointer;
      transition: all 0.2s ease;
      background: #ffffff;

      &:hover {
        background: #f9fbfd;
      }

      &.selected {
        background: rgba(64, 169, 255, 0.08);
      }
    }
  }

  .file-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .file-icon {
      flex-shrink: 0;

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

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .file-mode {
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 13px;
    color: #79879c;
  }

  .file-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    color: #606266;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f5f7fa;
      border-color: #409eff;
      color: #409eff;
    }

    &.danger:hover {
      border-color: #f56c6c;
      color: #f56c6c;
      background: rgba(245, 108, 108, 0.1);
    }
  }
</style>