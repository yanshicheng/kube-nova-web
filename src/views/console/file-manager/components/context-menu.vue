<template>
  <div class="context-menu" :style="{ left: x + 'px', top: y + 'px' }">
    <div v-if="file && file.isDir" class="menu-item" @click="$emit('open', file)">
      <FolderOpen :size="16" />
      <span>打开</span>
    </div>
    <div v-if="file && !file.isDir" class="menu-item" @click="$emit('download', file)">
      <Download :size="16" />
      <span>下载</span>
    </div>
    <div class="menu-divider"></div>
    <div v-if="file" class="menu-item" @click="$emit('rename', file)">
      <Edit2 :size="16" />
      <span>重命名</span>
    </div>
    <div v-if="file" class="menu-item" @click="$emit('copy', file)">
      <Copy :size="16" />
      <span>复制</span>
    </div>
    <div v-if="file" class="menu-item" @click="$emit('cut', file)">
      <Scissors :size="16" />
      <span>剪切</span>
    </div>
    <div v-if="hasClipboard" class="menu-item" @click="$emit('paste')">
      <Clipboard :size="16" />
      <span>粘贴</span>
    </div>
    <div class="menu-divider"></div>
    <div v-if="file" class="menu-item danger" @click="$emit('delete', file)">
      <Trash2 :size="16" />
      <span>删除</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { FolderOpen, Download, Edit2, Copy, Scissors, Clipboard, Trash2 } from 'lucide-vue-next'
  import type { FileInfo } from '@/api'

  defineProps<{
    file: FileInfo | null
    x: number
    y: number
    hasClipboard: boolean
  }>()

  defineEmits<{
    open: [file: FileInfo]
    download: [file: FileInfo]
    rename: [file: FileInfo]
    copy: [file: FileInfo]
    cut: [file: FileInfo]
    paste: []
    delete: [file: FileInfo]
    close: []
  }>()
</script>

<style lang="scss" scoped>
  .context-menu {
    position: fixed;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    padding: 8px 0;
    z-index: 1000;
    min-width: 200px;
    animation: menuIn 0.2s ease-out;
  }

  @keyframes menuIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .menu-item {
    padding: 10px 20px;
    font-size: 14px;
    color: #e6edf3;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 12px;

    &:hover {
      background: rgba(88, 166, 255, 0.1);
      color: #58a6ff;
    }

    &.danger {
      color: #ff7b72;

      &:hover {
        background: rgba(255, 123, 114, 0.1);
      }
    }
  }

  .menu-divider {
    height: 1px;
    background: rgba(148, 163, 184, 0.1);
    margin: 8px 0;
  }
</style>
