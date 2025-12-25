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
  import { searchClusterApi, type Cluster } from '@/api/manager/cluster'
  import {
    searchProjectApi,
    searchProjectClusterApi,
    searchProjectWorkspaceApi,
    type Project,
    type ProjectWorkspace
  } from '@/api/manager/project'

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

  // 集群列表
  const clusterList = ref<Cluster[]>([])
  // 项目列表
  const projectList = ref<Project[]>([])
  // 工作空间列表
  const workspaceList = ref<ProjectWorkspace[]>([])
  // 工作空间加载状态
  const workspaceLoading = ref(false)

  // 加载集群列表
  const loadClusterList = async () => {
    try {
      const response = await searchClusterApi({ page: 1, pageSize: 100 })
      clusterList.value = response.items || []
    } catch (error) {
      console.error('加载集群列表失败:', error)
    }
  }

  // 加载项目列表
  const loadProjectList = async () => {
    try {
      const response = await searchProjectApi({ page: 1, pageSize: 100 })
      projectList.value = response.items || []
    } catch (error) {
      console.error('加载项目列表失败:', error)
    }
  }

  // 加载工作空间列表
  const loadWorkspaceList = async (projectId: number) => {
    if (!projectId || projectId === 0) {
      workspaceList.value = []
      return
    }

    try {
      workspaceLoading.value = true
      // 先获取项目的集群配额列表
      const clusterResponse = await searchProjectClusterApi({ projectId })

      if (clusterResponse && clusterResponse.length > 0) {
        // 获取所有集群的工作空间列表
        const allWorkspaces: ProjectWorkspace[] = []
        for (const cluster of clusterResponse) {
          const workspaceResponse = await searchProjectWorkspaceApi({
            projectClusterId: cluster.id
          })
          if (workspaceResponse && workspaceResponse.length > 0) {
            allWorkspaces.push(...workspaceResponse)
          }
        }
        workspaceList.value = allWorkspaces
      } else {
        workspaceList.value = []
      }
    } catch (error) {
      console.error('加载工作空间列表失败:', error)
      workspaceList.value = []
    } finally {
      workspaceLoading.value = false
    }
  }

  // 监听项目变化
  watch(
    () => formData.value.projectId,
    (newProjectId) => {
      // 清空工作空间选择
      if (formData.value.workspaceId) {
        formData.value.workspaceId = undefined
      }
      // 加载工作空间列表
      if (newProjectId) {
        loadWorkspaceList(newProjectId)
      } else {
        workspaceList.value = []
      }
    }
  )

  // 集群选项
  const clusterOptions = computed(() =>
    clusterList.value.map((item) => ({
      label: item.name,
      value: item.uuid
    }))
  )

  // 项目选项（包含"非项目"选项）
  const projectOptions = computed(() => [
    { label: '非项目', value: 0 },
    ...projectList.value.map((item) => ({
      label: item.name,
      value: item.id
    }))
  ])

  // 工作空间选项
  const workspaceOptions = computed(() =>
    workspaceList.value.map((item) => ({
      label: item.name,
      value: item.id
    }))
  )

  // 严重级别选项
  const severityOptions = [
    { label: '提示', value: 'info' },
    { label: '警告', value: 'warning' },
    { label: '严重', value: 'critical' }
  ]

  // 状态选项
  const statusOptions = [
    { label: '告警中', value: 'firing' },
    { label: '已恢复', value: 'resolved' }
  ]

  // 表单配置项
  const formItems = computed(() => [
    // 第一排：告警名称、集群、严重级别、告警状态（span 总和 24，每个 6）
    {
      label: '名称',
      key: 'alertName',
      type: 'input',
      placeholder: '请输入告警名称',
      clearable: true,
      span: 6
    },
    {
      label: '集群',
      key: 'clusterUuid',
      type: 'select',
      span: 6,
      props: {
        placeholder: '请选择集群',
        options: clusterOptions.value,
        clearable: true,
        filterable: true
      }
    },
    {
      label: '级别',
      key: 'severity',
      type: 'select',
      span: 6,
      props: {
        placeholder: '请选择严重级别',
        options: severityOptions,
        clearable: true
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      span: 6,
      props: {
        placeholder: '请选择告警状态',
        options: statusOptions,
        clearable: true
      }
    },
    // 第二排：告警实例、告警指纹、项目、工作空间（span 总和 24，每个 6）
    {
      label: '实例',
      key: 'instance',
      type: 'input',
      placeholder: '请输入告警实例',
      clearable: true,
      span: 6
    },
    {
      label: '指纹',
      key: 'fingerprint',
      type: 'input',
      placeholder: '请输入告警指纹',
      clearable: true,
      span: 6
    },
    {
      label: '项目',
      key: 'projectId',
      type: 'select',
      span: 6,
      props: {
        placeholder: '请选择项目',
        options: projectOptions.value,
        clearable: true,
        filterable: true
      }
    },
    {
      label: '工作空间',
      key: 'workspaceId',
      type: 'select',
      span: 6,
      props: {
        placeholder: '请选择工作空间',
        options: workspaceOptions.value,
        clearable: true,
        filterable: true,
        disabled: !formData.value.projectId || formData.value.projectId === 0,
        loading: workspaceLoading.value
      }
    },
    // 第三排：集群名称、项目名称、工作空间名称（span 总和 18，每个 6）
    {
      label: '集群名称',
      key: 'clusterName',
      type: 'input',
      placeholder: '请输入集群名称',
      clearable: true,
      span: 6
    },
    {
      label: '项目名称',
      key: 'projectName',
      type: 'input',
      placeholder: '请输入项目名称',
      clearable: true,
      span: 6
    },
    {
      label: '空间名称',
      key: 'workspaceName',
      type: 'input',
      placeholder: '请输入工作空间名称',
      clearable: true,
      span: 6
    }
  ])

  // 处理重置
  const handleReset = () => {
    workspaceList.value = []
    emit('reset')
  }

  // 处理搜索
  const handleSearch = async () => {
    try {
      await searchBarRef.value?.validate()
      // 过滤掉空值和"非项目"选项的特殊处理
      const params = Object.entries(formData.value).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            // 如果是 projectId 且值为 0（非项目），则不传递此参数
            if (key === 'projectId' && value === 0) {
              return acc
            }
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

  // 初始化
  onMounted(() => {
    loadClusterList()
    loadProjectList()
  })
</script>

