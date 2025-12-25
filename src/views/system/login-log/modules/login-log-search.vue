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
  const rules = {
    userId: [{ pattern: /^\d+$/, message: '用户ID必须为数字', trigger: 'blur' }]
  }

  // 表单配置项
  const formItems = computed(() => [
    {
      label: '用户ID',
      key: 'userId',
      type: 'input',
      placeholder: '请输入用户ID',
      clearable: true,
      props: {
        type: 'number'
      }
    },
    {
      label: '用户名',
      key: 'username',
      type: 'input',
      placeholder: '请输入用户名',
      clearable: true,
      props: {
        maxlength: '50'
      }
    },
    {
      label: 'IP地址',
      key: 'ipAddress',
      type: 'input',
      placeholder: '请输入IP地址',
      clearable: true,
      props: {
        maxlength: '50'
      }
    },
    {
      label: '用户代理',
      key: 'userAgent',
      type: 'input',
      placeholder: '请输入用户代理关键词',
      clearable: true,
      props: {
        maxlength: '256'
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

      // 过滤掉空值并转换类型
      const params = Object.entries(formData.value).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            // 处理 userId 字段，确保是数字类型
            if (key === 'userId') {
              acc[key] = Number(value)
            } else {
              acc[key] = value
            }
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
