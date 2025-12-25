<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :showExpand="false"
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

  // 表单配置项
  const formItems = computed(() => [
    {
      label: '项目名称',
      key: 'name',
      type: 'input',
      placeholder: '请输入项目名称',
      clearable: true,
      props: {
        maxlength: '100'
      }
    },
    {
      label: '项目标识',
      key: 'uuid',
      type: 'input',
      placeholder: '请输入项目标识',
      clearable: true,
      props: {
        maxlength: '100'
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
      console.error('搜索失败:', error)
    }
  }
</script>