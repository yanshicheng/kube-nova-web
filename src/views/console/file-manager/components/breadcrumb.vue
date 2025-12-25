<template>
  <div class="breadcrumb">
    <span
      v-for="(crumb, index) in breadcrumbs"
      :key="index"
      class="breadcrumb-item"
      :class="{ active: index === breadcrumbs.length - 1 }"
      @click="navigate(crumb)"
    >
      <Home v-if="index === 0" :size="16" />
      <span>{{ crumb.name }}</span>
      <ChevronRight v-if="index < breadcrumbs.length - 1" :size="16" class="breadcrumb-separator" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { Home, ChevronRight } from 'lucide-vue-next'
import type { BreadcrumbItem } from '@/api'

defineProps<{
  breadcrumbs: BreadcrumbItem[]
}>()

const emit = defineEmits<{
  navigate: [path: string]
}>()

function navigate(crumb: BreadcrumbItem) {
  emit('navigate', crumb.path)
}
</script>

<style lang="scss" scoped>
.breadcrumb {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid #e3e9ef;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f0f0;
  }

  &::-webkit-scrollbar-thumb {
    background: #d8dee5;
    border-radius: 2px;
  }
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #79879c;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    color: #409eff;
    background: rgba(64, 169, 255, 0.1);
  }

  &.active {
    color: #242e42;
    font-weight: 500;
    cursor: default;

    &:hover {
      background: transparent;
    }
  }
}

.breadcrumb-separator {
  color: #b6c2cd;
  margin: 0 4px;
}
</style>