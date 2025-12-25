<template>
  <div class="step-header">
    <div class="header-icon" v-if="icon">
      <component :is="iconComponent" :size="24" />
    </div>
    <div class="header-content">
      <h3 class="header-title">{{ title }}</h3>
      <p class="header-description">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import * as Icons from 'lucide-vue-next'

  interface Props {
    title: string
    description?: string
    icon?: string | any
  }

  const props = defineProps<Props>()

  const iconComponent = computed(() => {
    if (!props.icon) return null

    // 如果传入的是字符串，从 lucide-vue-next 中获取对应的图标
    if (typeof props.icon === 'string') {
      return (Icons as any)[props.icon]
    }

    // 如果直接传入了组件，则使用该组件
    return props.icon
  })
</script>

<style lang="scss" scoped>
  .step-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
    border-radius: 12px;
    border: 1px solid #e4e7ed;
    margin-bottom: 24px;

    .header-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      flex-shrink: 0;
    }

    .header-content {
      flex: 1;

      .header-title {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        line-height: 1.4;
      }

      .header-description {
        margin: 0;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
      }
    }
  }
</style>