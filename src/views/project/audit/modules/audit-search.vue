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
  import { ref, computed, onMounted, watch } from 'vue'
  import {
    searchProjectClusterApi,
    searchProjectWorkspaceApi,
    type ProjectCluster
  } from '@/api/manager/project'

  interface Props {
    modelValue: Record<string, any>
    projectId: number
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

  // 集群选项（项目集群）
  const clusterOptions = ref<Array<{ label: string; value: string; projectClusterId: number }>>([])
  const clusterLoading = ref(false)

  // 当前选中的项目集群ID
  const currentProjectClusterId = ref<number | null>(null)

  // 工作空间选项
  const workspaceOptions = ref<Array<{ label: string; value: number }>>([
    { label: '所有工作空间', value: -1 },
    { label: '项目级别操作', value: 0 }
  ])
  const workspaceLoading = ref(false)

  // 操作状态选项
  const statusOptions = [
    { label: '全部', value: -1 },
    { label: '成功', value: 1 },
    { label: '失败', value: 0 }
  ]

  // 时间快捷选项
  const timeShortcuts = [
    {
      text: '最近1小时',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setHours(start.getHours() - 1)
        return [start, end]
      }
    },
    {
      text: '今天',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        return [start, end]
      }
    },
    {
      text: '最近3天',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 3)
        return [start, end]
      }
    },
    {
      text: '最近7天',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 7)
        return [start, end]
      }
    },
    {
      text: '最近30天',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 30)
        return [start, end]
      }
    }
  ]

  // 加载项目集群列表
  const loadProjectClusters = async () => {
    if (!props.projectId) {
      clusterOptions.value = []
      return
    }

    try {
      clusterLoading.value = true
      const response = await searchProjectClusterApi({
        projectId: props.projectId
      })

      clusterOptions.value = (response || []).map((item) => ({
        label: item.clusterName,
        value: item.clusterUuid,
        projectClusterId: item.id
      }))
    } catch (error) {
      console.error('加载集群列表失败:', error)
      clusterOptions.value = []
    } finally {
      clusterLoading.value = false
    }
  }

  // 加载工作空间列表
  const loadWorkspaceList = async (projectClusterId: number) => {
    try {
      workspaceLoading.value = true
      const response = await searchProjectWorkspaceApi({ projectClusterId })
      workspaceOptions.value = [
        { label: '所有工作空间', value: -1 },
        { label: '项目级别操作', value: 0 },
        ...(response || []).map((item) => ({
          label: `${item.name} (${item.namespace})`,
          value: item.id
        }))
      ]
    } catch (error) {
      console.error('加载工作空间列表失败:', error)
      workspaceOptions.value = [
        { label: '所有工作空间', value: -1 },
        { label: '项目级别操作', value: 0 }
      ]
    } finally {
      workspaceLoading.value = false
    }
  }

  // 监听集群变化，加载工作空间列表
  watch(
    () => formData.value.clusterUuid,
    async (newClusterUuid) => {
      // 清空工作空间选择
      formData.value.workspaceId = undefined
      currentProjectClusterId.value = null

      // 重置工作空间选项
      workspaceOptions.value = [
        { label: '所有工作空间', value: -1 },
        { label: '项目级别操作', value: 0 }
      ]

      // 如果选择了集群，加载工作空间
      if (newClusterUuid) {
        const cluster = clusterOptions.value.find((c) => c.value === newClusterUuid)
        if (cluster) {
          currentProjectClusterId.value = cluster.projectClusterId
          await loadWorkspaceList(cluster.projectClusterId)
        }
      }
    }
  )

  // 监听 projectId 变化，重新加载集群
  watch(
    () => props.projectId,
    async (newProjectId) => {
      if (newProjectId) {
        // 清空选择
        formData.value.clusterUuid = undefined
        formData.value.workspaceId = undefined
        currentProjectClusterId.value = null

        // 重新加载集群
        await loadProjectClusters()
      } else {
        clusterOptions.value = []
        workspaceOptions.value = [
          { label: '所有工作空间', value: -1 },
          { label: '项目级别操作', value: 0 }
        ]
      }
    },
    { immediate: false }
  )

  // 表单配置项
  const formItems = computed(() => [
    {
      label: '集群',
      key: 'clusterUuid',
      type: 'select',
      props: {
        placeholder: '请选择集群',
        options: clusterOptions.value,
        clearable: true,
        filterable: true,
        loading: clusterLoading.value
      }
    },
    {
      label: '工作空间',
      key: 'workspaceId',
      type: 'select',
      props: {
        placeholder: '请选择工作空间',
        options: workspaceOptions.value,
        clearable: true,
        filterable: true,
        loading: workspaceLoading.value,
        disabled: !formData.value.clusterUuid
      }
    },
    {
      label: '操作状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择操作状态',
        options: statusOptions,
        clearable: true
      }
    },
    {
      label: '时间范围',
      key: 'timeRange',
      type: 'daterange',
      props: {
        type: 'datetimerange',
        rangeSeparator: '至',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        clearable: true,
        shortcuts: timeShortcuts,
        valueFormat: 'x',
        defaultTime: [
          new Date(0, 0, 0, 0, 0, 0), // 00:00:00
          new Date(0, 0, 0, 23, 59, 59) // 23:59:59
        ]
      }
    },
    {
      label: '操作简称',
      key: 'title',
      type: 'input',
      props: {
        placeholder: '请输入操作简称',
        clearable: true,
        maxlength: 200
      }
    },
    {
      label: '操作人',
      key: 'operatorName',
      type: 'input',
      props: {
        placeholder: '请输入操作人姓名',
        clearable: true,
        maxlength: 100
      }
    },
    {
      label: '应用ID',
      key: 'applicationId',
      type: 'input-number',
      props: {
        placeholder: '-1表示不筛选',
        clearable: true,
        min: -1,
        max: 999999999
      }
    }
  ])

  // 处理重置
  const handleReset = () => {
    currentProjectClusterId.value = null
    workspaceOptions.value = [
      { label: '所有工作空间', value: -1 },
      { label: '项目级别操作', value: 0 }
    ]
    emit('reset')
  }

  // 处理搜索
  const handleSearch = async () => {
    if (!props.projectId) {
      console.error('❌ 没有选择项目，无法搜索')
      return
    }

    try {
      await searchBarRef.value?.validate()

      // 处理参数
      const params: Record<string, any> = {
        projectId: props.projectId // ⭐ 必传 projectId
      }

      // 遍历表单数据
      Object.entries(formData.value).forEach(([key, value]) => {
        // 跳过空值
        if (value === undefined || value === null || value === '') {
          return
        }

        // 处理时间范围
        if (key === 'timeRange' && Array.isArray(value) && value.length === 2) {
          const startMs = typeof value[0] === 'string' ? parseInt(value[0]) : Number(value[0])
          const endMs = typeof value[1] === 'string' ? parseInt(value[1]) : Number(value[1])

          // 转换为秒级时间戳
          params.startAt = Math.floor(startMs / 1000)
          params.endAt = Math.floor(endMs / 1000)

          return
        }

        // 其他字段直接赋值（包括 -1）
        params[key] = value
      })

      emit('search', params)
    } catch (error) {
      // 验证失败
    }
  }

  // 初始化
  onMounted(() => {
    if (props.projectId) {
      loadProjectClusters()
    }
  })
</script>
