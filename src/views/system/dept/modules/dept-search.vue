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

  // 状态选项
  const statusOptions = [
    { label: '全部', value: undefined },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 }
  ]

  // 表单配置项
  const formItems = computed(() => [
    {
      label: '部门名称',
      key: 'name',
      type: 'input',
      placeholder: '请输入部门名称',
      clearable: true,
      props: {
        maxlength: '30'
      }
    },
    {
      label: '负责人',
      key: 'leader',
      type: 'input',
      placeholder: '请输入负责人姓名',
      clearable: true,
      props: {
        maxlength: '20'
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
