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

  // 请求方法选项
  const methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'OPTIONS', value: 'OPTIONS' },
    { label: 'HEAD', value: 'HEAD' }
  ]

  // 类型选项
  const typeOptions = [
    { label: '分组', value: 0 },
    { label: '权限', value: 1 }
  ]

  // 表单配置
  const formItems = computed(() => [
    {
      label: 'API名称',
      key: 'name',
      type: 'input',
      placeholder: '请输入API名称',
      clearable: true
    },
    {
      label: 'API路径',
      key: 'path',
      type: 'input',
      placeholder: '请输入API路径',
      clearable: true
    },
    {
      label: '请求方法',
      key: 'method',
      type: 'select',
      props: {
        placeholder: '请选择请求方法',
        options: methodOptions,
        clearable: true
      }
    },
    {
      label: '类型',
      key: 'isPermission',
      type: 'select',
      props: {
        placeholder: '请选择类型',
        options: typeOptions,
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