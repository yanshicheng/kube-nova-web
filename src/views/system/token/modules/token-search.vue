<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  interface Props {
    modelValue: Record<string, any>
  }

  interface Emits {
    (e: 'update:modelValue', value: Record<string, any>): void

    (e: 'search', params: Record<string, any>): void

    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 表单数据双向绑定
  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 校验规则
  const rules = {}

  // Token类型选项
  const typeOptions = [
    { label: '临时', value: 1 },
    { label: '长期', value: 2 },
    { label: '永久', value: 3 }
  ]

  // 状态选项
  const statusOptions = [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 }
  ]

  // 表单配置
  const formItems = computed(() => [
    {
      label: 'Token',
      key: 'name',
      type: 'input',
      placeholder: '请输入Token名称',
      clearable: true
    },
    {
      label: 'Token值',
      key: 'token',
      type: 'input',
      placeholder: '请输入Token值',
      clearable: true
    },
    {
      label: '类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '请选择类型',
        options: typeOptions,
        clearable: true
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        options: statusOptions,
        clearable: true
      }
    }
  ])

  // 事件处理
  const handleReset = () => {
    emit('reset')
  }

  const handleSearch = async () => {
    try {
      await searchBarRef.value?.validate()
      emit('search', formData.value)
    } catch (error) {
    }
  }
</script>