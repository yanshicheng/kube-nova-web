<script setup lang="ts">
  import { HardDrive } from 'lucide-vue-next'

  interface Props {
    clusterDetail?: any
    clusterId: number
  }

  defineProps<Props>()
</script>

<template>
  <div class="placeholder-container">
    <HardDrive class="placeholder-icon" />
    <h2>节点管理</h2>
    <p>节点管理功能正在开发中...</p>
  </div>
</template>

<style scoped lang="scss">
  .placeholder-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    color: #6b7280;

    .placeholder-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.3;
    }

    h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
    }
  }
</style>
