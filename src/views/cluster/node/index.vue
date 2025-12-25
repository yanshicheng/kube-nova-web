<template>
  <div class="node-page">
    <ElCard v-show="showSearchBar" class="search-card" shadow="never">
      <NodeSearch
        v-model="searchForm"
        v-model:cluster-id="selectedClusterId"
        :clusters="clusters"
        @search="handleSearch"
        @reset="resetSearchParams"
        @cluster-change="handleClusterChange"
      />
    </ElCard>

    <ElCard
      class="content-card"
      shadow="never"
      :style="{ 'margin-top': showSearchBar ? '20px' : '0' }"
    >
      <ArtTableHeader
        v-model:columns="columns"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElSelect
              v-model="selectedClusterId"
              placeholder="请选择集群"
              clearable
              style="width: 200px"
              @change="handleClusterChange"
              :disabled="loading || operationLoading"
            >
              <ElOption
                v-for="cluster in clusters"
                :key="cluster.id"
                :label="cluster.name"
                :value="cluster.id"
              >
                <div class="cluster-option">
                  <span class="cluster-name">{{ cluster.name }}</span>
                  <ElTag
                    size="small"
                    :type="getEnvironmentType(cluster.environment)"
                    style="margin-left: 8px"
                    >{{ cluster.environment }}</ElTag
                  >
                </div>
              </ElOption>
            </ElSelect>
            <ElRadioGroup v-model="viewMode" @change="handleViewModeChange" :disabled="loading">
              <ElRadioButton value="card"
                ><ElIcon><Grid /></ElIcon>卡片视图</ElRadioButton
              >
              <ElRadioButton value="table"
                ><ElIcon><List /></ElIcon>列表视图</ElRadioButton
              >
            </ElRadioGroup>
            <ElButton :icon="Refresh" @click="refreshData" :loading="loading">刷新</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <div v-if="!selectedClusterId" class="empty-state">
        <ElEmpty description="">
          <template #image
            ><ElIcon :size="100" color="#c0c4cc"><Select /></ElIcon
          ></template>
          <template #default>
            <div class="empty-content">
              <h3>请选择一个集群</h3>
              <p>选择集群后，您可以查看和管理该集群下的所有节点</p>
              <ElButton
                type="primary"
                :icon="Search"
                @click="showSearchBar = true"
                style="margin-top: 20px"
                >开始选择集群</ElButton
              >
            </div>
          </template>
        </ElEmpty>
      </div>

      <div v-else-if="viewMode === 'card'" class="card-container" v-loading="operationLoading">
        <div v-if="loading" class="loading-container">
          <ElSkeleton v-for="i in 6" :key="i" animated style="width: 100%">
            <template #template>
              <div class="skeleton-card">
                <ElSkeletonItem variant="text" style="width: 60%; margin-bottom: 16px" />
                <ElSkeletonItem variant="text" style="width: 40%; margin-bottom: 12px" />
                <ElSkeletonItem variant="rect" style="width: 100%; height: 60px" />
              </div>
            </template>
          </ElSkeleton>
        </div>
        <div v-else-if="displayData.length > 0" class="card-grid">
          <NodeCard
            v-for="node in displayData"
            :key="node.id"
            :node="node"
            @manage="handleNodeManage"
            @monitor="handleNodeMonitor"
            @detail="handleNodeDetail"
            @schedule="handleScheduleToggle"
            @maintenance="handleMaintenanceNode"
          />
        </div>
        <ElEmpty v-else description="暂无节点数据" />
      </div>

      <div v-else v-loading="operationLoading">
        <ArtTable
          :loading="loading"
          :data="displayData"
          :columns="columns"
          :pagination="pagination"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </div>

      <div
        v-if="viewMode === 'card' && filteredData.length > 0 && !loading"
        class="pagination-wrapper"
      >
        <ElPagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </ElCard>

    <ElDialog
      v-model="yamlDialogVisible"
      :title="`节点详情 - ${currentNode?.nodeName || ''}`"
      width="80%"
      destroy-on-close
    >
      <YamlEditorPro
        v-if="yamlDialogVisible"
        v-model="yamlContent"
        :readonly="true"
        :filename="`${currentNode?.nodeName || 'node'}.yaml`"
        height="70vh"
      />
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Refresh, Search, Grid, List, Select } from '@element-plus/icons-vue'
  import {
    getNodeListApi,
    evictNodeApi,
    updateNodeScheduleApi,
    getNodeDetailYamlApi,
    type ClusterNodeInfo,
    type SearchClusterNodeRequest
  } from '@/api/manager/node'
  import { searchClusterApi, getClusterDetailApi, type Cluster } from '@/api/manager'
  import NodeSearch from './modules/node-search.vue'
  import NodeCard from './modules/node-card.vue'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'
  import { useNodeTableConfig } from './modules/table-config'

  defineOptions({ name: 'ClusterNode' })

  const router = useRouter()
  const route = useRoute()
  const { loading, showSearchBar, operationLoading, createTableColumns } = useNodeTableConfig()

  const viewMode = ref<'card' | 'table'>('card')
  const selectedClusterId = ref<number | null>(null)
  const clusters = ref<Cluster[]>([])
  const clusterUuidMap = ref<Map<number, string>>(new Map())
  const nodeData = ref<ClusterNodeInfo[]>([])
  const filteredData = ref<ClusterNodeInfo[]>([])
  const yamlDialogVisible = ref(false)
  const currentNode = ref<ClusterNodeInfo | null>(null)
  const yamlContent = ref('')

  const searchForm = ref({ nodeName: '', nodeIp: '', nodeRole: '', nodeStatus: '' })
  const pagination = ref({ current: 1, size: viewMode.value === 'card' ? 12 : 20, total: 0 })

  const displayData = computed(() => {
    const start = (pagination.value.current - 1) * pagination.value.size
    return filteredData.value.slice(start, start + pagination.value.size)
  })

  const getClusterUuid = async (clusterId: number): Promise<string> => {
    if (clusterUuidMap.value.has(clusterId)) return clusterUuidMap.value.get(clusterId)!
    const detail = await getClusterDetailApi(clusterId)
    clusterUuidMap.value.set(clusterId, detail.uuid)
    return detail.uuid
  }

  const handleNodeManage = async (node: ClusterNodeInfo) => {
    await router.push({
      name: 'NodeManagement',
      params: { nodeName: node.nodeName },
      query: { nodeId: String(node.id), clusterId: String(selectedClusterId.value) }
    })
  }

  const handleNodeMonitor = async (node: ClusterNodeInfo) => {
    const clusterUuid = await getClusterUuid(selectedClusterId.value!)
    await router.push({
      name: 'nodeMonitoring',
      query: { clusterUuid, clusterId: String(selectedClusterId.value), nodeName: node.nodeName }
    })
  }

  const handleNodeDetail = async (node: ClusterNodeInfo) => {
    currentNode.value = node
    yamlContent.value = await getNodeDetailYamlApi(node.id)
    yamlDialogVisible.value = true
  }

  const { columns } = createTableColumns({ handleNodeManage, handleNodeMonitor, handleNodeDetail })

  const getEnvironmentType = (env: string) =>
    ({ production: 'danger', staging: 'warning', testing: 'info', development: 'success' })[env] ||
    'info'

  const getClusterList = async () => {
    const response = await searchClusterApi({ pageSize: 100 })
    clusters.value = response.items || []
    if (clusters.value.length === 1) {
      selectedClusterId.value = clusters.value[0].id
      await getNodeData()
    }
  }

  const getNodeData = async () => {
    if (!selectedClusterId.value) {
      nodeData.value = []
      filteredData.value = []
      pagination.value.total = 0
      return
    }
    try {
      loading.value = true
      const clusterUuid = await getClusterUuid(selectedClusterId.value)
      const params: SearchClusterNodeRequest = { clusterUuid, page: 1, pageSize: 200 }
      const response = await getNodeListApi(params)
      nodeData.value = response.items || []
      applyFilters()
    } catch (error) {
      console.error('获取节点列表失败:', error)
      nodeData.value = []
      filteredData.value = []
      pagination.value.total = 0
    } finally {
      loading.value = false
    }
  }

  const applyFilters = () => {
    let data = [...nodeData.value]
    if (searchForm.value.nodeName)
      data = data.filter((n) =>
        n.nodeName.toLowerCase().includes(searchForm.value.nodeName.toLowerCase())
      )
    if (searchForm.value.nodeIp)
      data = data.filter((n) => n.nodeIp.includes(searchForm.value.nodeIp))
    if (searchForm.value.nodeRole)
      data = data.filter((n) => n.nodeRole === searchForm.value.nodeRole)
    if (searchForm.value.nodeStatus)
      data = data.filter((n) => n.nodeStatus === searchForm.value.nodeStatus)
    filteredData.value = data
    pagination.value.total = data.length
    if (pagination.value.current > Math.ceil(data.length / pagination.value.size))
      pagination.value.current = 1
  }

  const handleClusterChange = () => {
    searchForm.value = { nodeName: '', nodeIp: '', nodeRole: '', nodeStatus: '' }
    pagination.value.current = 1
    if (selectedClusterId.value) getNodeData()
  }

  const handleSearch = (params: Record<string, any>) => {
    searchForm.value = { ...searchForm.value, ...params }
    pagination.value.current = 1
    applyFilters()
  }
  const resetSearchParams = () => {
    searchForm.value = { nodeName: '', nodeIp: '', nodeRole: '', nodeStatus: '' }
    pagination.value.current = 1
    applyFilters()
  }
  const refreshData = () => getNodeData()
  const handleViewModeChange = () => {
    pagination.value.size = viewMode.value === 'card' ? 12 : 20
    pagination.value.current = 1
    showSearchBar.value = viewMode.value === 'table'
  }
  const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1
  }
  const handleCurrentChange = (current: number) => {
    pagination.value.current = current
  }

  const handleScheduleToggle = async (node: ClusterNodeInfo) => {
    const action = node.unschedulable === 2 ? '启用' : '禁用'
    await ElMessageBox.confirm(
      `确定要${action}节点 "${node.nodeName}" 的调度吗？`,
      `${action}调度确认`,
      { type: 'warning' }
    )
    operationLoading.value = true
    try {
      await updateNodeScheduleApi(node.id, node.unschedulable === 2 ? 1 : 2)
      ElMessage.success(`${action}调度成功`)
      refreshData()
    } finally {
      operationLoading.value = false
    }
  }

  const handleMaintenanceNode = async (node: ClusterNodeInfo) => {
    await ElMessageBox.confirm(
      `确定要对节点 "${node.nodeName}" 进行维护吗？这将导致该节点上的所有Pod被迁移。`,
      '节点维护确认',
      { type: 'warning' }
    )
    operationLoading.value = true
    try {
      await evictNodeApi(node.id)
      ElMessage.success('节点维护操作成功')
      refreshData()
    } finally {
      operationLoading.value = false
    }
  }

  watch(
    () => route.path,
    (newPath, oldPath) => {
      if (
        oldPath?.includes('/node/management') &&
        newPath === '/cluster/node' &&
        selectedClusterId.value
      )
        refreshData()
    }
  )

  onMounted(() => getClusterList())
</script>

<style lang="scss" scoped>
  .node-page {
    height: 100%;
    padding-bottom: 15px;
    .search-card {
      margin-bottom: 12px;
    }
    .content-card {
      min-height: calc(100vh - 200px);
      .empty-state {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        .empty-content {
          text-align: center;
          h3 {
            margin: 16px 0 8px;
            font-size: 20px;
            font-weight: 500;
          }
          p {
            margin: 0;
            font-size: 14px;
            color: var(--el-text-color-regular);
          }
        }
      }
      .card-container {
        margin-top: 20px;
        .loading-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 16px;
          .skeleton-card {
            padding: 20px;
            background: var(--el-bg-color);
            border-radius: 8px;
            border: 1px solid var(--el-border-color-lighter);
          }
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 16px;
        }
      }
      .pagination-wrapper {
        display: flex;
        justify-content: center;
        margin-top: 20px;
      }
    }
    .cluster-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      .cluster-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
</style>
