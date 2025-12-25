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

  const searchBarRef = ref()

  // 表单数据双向绑定
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 校验规则
  const rules = {}

  // 表单配置项
  const formItems = computed(() => [
    {
      label: '名称',
      key: 'search',
      type: 'input',
      labelWidth: 100,
      props: {
        placeholder: '请输入 ConfigMap 名称',
        clearable: true,
        maxlength: '100'
      }
    },
    {
      label: '标签选择器',
      key: 'labelSelector',
      type: 'input',
      labelWidth: 100,
      props: {
        placeholder: '格式: key1=value1,key2=value2',
        clearable: true,
        maxlength: '200'
      }
    }
  ])

  // 处理重置
  const handleReset = () => {
    emit('reset')
  }

  // 处理搜索
  const handleSearch = async () => {
    try {
      await searchBarRef.value?.validate()
      // 过滤掉空值
      const params = Object.entries(formData.value).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, any>
      )

      emit('search', params)
    } catch (error) {
    }
  }
</script>
