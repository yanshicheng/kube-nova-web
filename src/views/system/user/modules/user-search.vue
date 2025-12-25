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
      label: '昵称',
      key: 'nickname',
      type: 'input',
      placeholder: '请输入昵称',
      clearable: true,
      props: {
        maxlength: '50'
      }
    },
    {
      label: '手机号',
      key: 'phone',
      type: 'input',
      placeholder: '请输入手机号',
      clearable: true,
      props: {
        maxlength: '20'
      }
    },
    {
      label: '邮箱',
      key: 'email',
      type: 'input',
      placeholder: '请输入邮箱',
      clearable: true
    },
    {
      label: '工号',
      key: 'workNumber',
      type: 'input',
      placeholder: '请输入工号',
      clearable: true,
      props: {
        maxlength: '50'
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
    },
    {
      label: '登录IP',
      key: 'loginIp',
      type: 'input',
      placeholder: '请输入登录IP',
      clearable: true
    },
    {
      label: '创建人',
      key: 'createBy',
      type: 'input',
      placeholder: '请输入创建人',
      clearable: true
    },
    {
      label: '更新人',
      key: 'updateBy',
      type: 'input',
      placeholder: '请输入更新人',
      clearable: true
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
