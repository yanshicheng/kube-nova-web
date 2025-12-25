<template>
  <ElSelect
    :model-value="modelValue"
    placeholder="选择 IngressClass"
    clearable
    filterable
    size="default"
    style="max-width: 500px"
    @update:model-value="handleChange"
    @visible-change="handleVisibleChange"
    :loading="loading"
  >
    <template #prefix>
      <Layers :size="14" />
    </template>
    <ElOption v-for="ic in ingressClasses" :key="ic.name" :label="ic.name" :value="ic.name">
      <div class="ingress-class-option">
        <span class="ic-name">{{ ic.name }}</span>
        <ElTag v-if="ic.isDefault" type="success" size="small">默认</ElTag>
        <span class="ic-controller">{{ ic.controller }}</span>
      </div>
    </ElOption>
  </ElSelect>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { Layers } from 'lucide-vue-next'
  import {
    getIngressClassListApi,
    type IngressClassListItem
  } from '@/api/workload/cluster-resource.ts'
  import { type ProjectWorkspace } from '@/api'
  interface Props {
    modelValue?: string
    workspace?: ProjectWorkspace
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'change'])

  const loading = ref(false)
  const ingressClasses = ref<IngressClassListItem[]>([])
  const loaded = ref(false)

  // 只在下拉框首次展开时加载
  const handleVisibleChange = (visible: boolean) => {
    if (visible && !loaded.value && props.workspace) {
      loadIngressClasses()
    }
  }

  const loadIngressClasses = async () => {
    if (loaded.value || !props.workspace || loading.value) {
      return
    }

    loading.value = true
    try {
      const response = await getIngressClassListApi({
        workloadId: props.workspace.id
      })

      if (Array.isArray(response)) {
        ingressClasses.value = response
      } else if (response && response.items) {
        ingressClasses.value = response.items
      }

      loaded.value = true
    } catch (error) {
      console.error('加载 IngressClass 失败:', error)
      ingressClasses.value = []
    } finally {
      loading.value = false
    }
  }

  const handleChange = (value: string) => {
    emit('update:modelValue', value)
    emit('change', value)
  }

  // 对外暴露重置方法（如果需要强制刷新）
  defineExpose({
    reload: () => {
      loaded.value = false
      ingressClasses.value = []
      if (props.workspace) {
        loadIngressClasses()
      }
    }
  })
</script>

<style lang="scss" scoped>
  .ingress-class-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .ic-name {
      font-weight: 600;
      color: #303133;
    }

    .ic-controller {
      font-size: 12px;
      color: #909399;
      margin-left: auto;
    }
  }
</style>
