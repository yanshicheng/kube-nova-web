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
  import { ref, computed, watch, onMounted } from 'vue'
  import { getClusterNamespaceListApi } from '@/api/manager/cluster'

  interface Props {
    modelValue: Record<string, any>
    clusterUuid?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: Record<string, any>): void
    (e: 'search', params: Record<string, any>): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const namespaces = ref<string[]>([])
  const namespaceLoading = ref(false)

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const rules = {}

  const formItems = computed(() => [
    {
      label: '命名空间',
      key: 'namespace',
      type: 'select',
      labelWidth: 100,
      props: {
        placeholder: '全部命名空间',
        clearable: true,
        filterable: true,
        loading: namespaceLoading.value,
        options: namespaces.value.map((ns) => ({
          label: ns,
          value: ns
        }))
      }
    },
    {
      label: '名称',
      key: 'search',
      type: 'input',
      labelWidth: 100,
      props: {
        placeholder: '请输入 Probe 名称',
        clearable: true,
        maxlength: '100'
      }
    }
  ])

  const loadNamespaces = async () => {
    if (!props.clusterUuid || namespaceLoading.value) return

    namespaceLoading.value = true
    try {
      const nsList = await getClusterNamespaceListApi(props.clusterUuid)
      namespaces.value = nsList || []

      // ⚠️ 不再自动设置默认值，让用户主动选择
      // 如果已经有值，保持；否则为空（搜索全部）
    } catch (error) {
      console.error('加载命名空间失败:', error)
      namespaces.value = []
    } finally {
      namespaceLoading.value = false
    }
  }

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
      console.error('搜索参数验证失败:', error)
    }
  }

  watch(
    () => props.clusterUuid,
    (newUuid) => {
      if (newUuid) {
        loadNamespaces()
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    if (props.clusterUuid) {
      loadNamespaces()
    }
  })
</script>