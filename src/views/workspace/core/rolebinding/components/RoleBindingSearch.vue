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

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const rules = {}

  const formItems = computed(() => [
    {
      label: '名称',
      key: 'search',
      type: 'input',
      labelWidth: 100,
      props: {
        placeholder: '请输入 RoleBinding 名称',
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

  const handleReset = () => {
    emit('reset')
  }

  const handleSearch = async () => {
    try {
      await searchBarRef.value?.validate()
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