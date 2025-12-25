<template>
  <div class="toolbar">
    <div class="toolbar-section">
      <!-- 导航按钮 -->
      <button @click="$emit('navigateBack')" class="btn-icon" :disabled="!canGoBack" title="后退">
        <ArrowLeft :size="18" />
      </button>
      <button
        @click="$emit('navigateForward')"
        class="btn-icon"
        :disabled="!canGoForward"
        title="前进"
      >
        <ArrowRight :size="18" />
      </button>
      <button @click="$emit('navigateUp')" class="btn-icon" :disabled="!canGoUp" title="上一级">
        <ArrowUp :size="18" />
      </button>

      <div class="toolbar-divider"></div>

      <!-- 功能按钮 -->
      <button @click="$emit('refresh')" class="btn-icon" title="刷新">
        <RefreshCw :size="18" :class="{ spin: loading }" />
      </button>
      <button @click="$emit('goHome')" class="btn-icon" title="根目录">
        <Home :size="18" />
      </button>

      <div class="toolbar-divider"></div>

      <!-- 视图切换 -->
      <div class="view-switcher">
        <button
          @click="$emit('update:viewMode', 'grid')"
          class="view-btn"
          :class="{ active: viewMode === 'grid' }"
          title="网格视图"
        >
          <Grid :size="16" />
        </button>
        <button
          @click="$emit('update:viewMode', 'list')"
          class="view-btn"
          :class="{ active: viewMode === 'list' }"
          title="列表视图"
        >
          <List :size="16" />
        </button>
      </div>
    </div>

    <div class="toolbar-section">
      <!-- 操作按钮 -->
      <button @click="$emit('upload')" class="btn btn-primary">
        <Upload :size="16" />
        上传文件
      </button>
      <button @click="$emit('createFolder')" class="btn btn-secondary">
        <FolderPlus :size="16" />
        新建文件夹
      </button>

      <!-- 搜索框 -->
      <div class="search-wrapper">
        <input
          :value="searchQuery"
          @input="handleSearchInput"
          class="search-input"
          placeholder="搜索文件或文件夹..."
        />
        <Search :size="18" class="search-icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  Home,
  Grid,
  List,
  Upload,
  FolderPlus,
  Search
} from 'lucide-vue-next'

defineProps<{
  viewMode: 'grid' | 'list'
  searchQuery: string
  canGoBack: boolean
  canGoForward: boolean
  canGoUp: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:viewMode': [value: 'grid' | 'list']
  'update:searchQuery': [value: string]
  navigateBack: []
  navigateForward: []
  navigateUp: []
  refresh: []
  goHome: []
  upload: []
  createFolder: []
}>()

function handleSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}
</script>

<style lang="scss" scoped>
.toolbar {
  padding: 16px 20px;
  background: #f9fbfd;
  border-bottom: 1px solid #e3e9ef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;

  &:last-child {
    padding-right: 20px; /* 右边留边距 */
  }
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #d8dee5;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #d8dee5;
  border-radius: 6px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(:disabled) {
    background: #f5f7fa;
    border-color: #409eff;
    color: #409eff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.view-switcher {
  display: flex;
  background: #ffffff;
  border: 1px solid #d8dee5;
  border-radius: 6px;
  padding: 2px;
}

.view-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    background: #409eff;
    color: #ffffff;
  }

  &:hover:not(.active) {
    background: #f5f7fa;
    color: #409eff;
  }
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.btn-primary {
  background: #409eff;
  color: #ffffff;

  &:hover {
    background: #66b1ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(64, 169, 255, 0.3);
  }
}

.btn-secondary {
  background: #ffffff;
  color: #606266;
  border: 1px solid #d8dee5;

  &:hover {
    background: #f5f7fa;
    border-color: #409eff;
    color: #409eff;
  }
}

.search-wrapper {
  position: relative;
  width: 280px;
  margin-right: 20px; /* 右边留边距，防止被截断 */
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 12px;
  background: #ffffff;
  border: 1px solid #d8dee5;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::placeholder {
    color: #b6c2cd;
  }

  &:focus {
    outline: none;
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.1);
  }
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #b6c2cd;
  pointer-events: none;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-section {
    flex-wrap: wrap;

    &:last-child {
      padding-right: 0;
    }
  }

  .search-wrapper {
    width: 100%;
    margin-right: 0;
  }
}
</style>