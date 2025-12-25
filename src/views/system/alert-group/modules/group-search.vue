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

  // 组类型选项
  const groupTypeOptions = [
    { label: '全部', value: '' },
    { label: '普通组', value: 'normal' },
    { label: '值班组', value: 'duty' }
  ]

  // 表单配置项
  const formItems = computed(() => [
    {
      label: '告警组名称',
      key: 'groupName',
      labelWidth: '100px',
      type: 'input',
      placeholder: '请输入告警组名称',
      clearable: true,
      props: {
        maxlength: 50
      }
    },
    {
      label: '组类型',
      key: 'groupType',
      type: 'select',
      props: {
        placeholder: '请选择组类型',
        options: groupTypeOptions,
        clearable: true
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
      // 验证失败
    }
  }
</script>