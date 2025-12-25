<!-- views/cluster/resource/tabs/IngressClass/index.vue -->
<template>
  <div class="ingress-class-page">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-show="showSearchBar"
      ref="searchBarRef"
      v-model="searchForm"
      :items="searchFormItems"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard
      class="art-table-card"
      shadow="never"
      :style="{ 'margin-top': showSearchBar ? '12px' : '0' }"
    >
      <ArtTableHeader
        v-model:columns="columns"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        :showZebra="true"
        :showBorder="true"
        :showHeaderBackground="true"
        :fullClass="'art-page-view'"
        :layout="'search,refresh,size,fullscreen,columns,settings'"
        @refresh="refresh"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" :icon="PlusIcon" @click="showCreateDialog">
              创建 IngressClass
            </ElButton>
            <ElTooltip>
              <template #content>
                <div style="max-width: 350px">
                  <strong>IngressClass 是什么？</strong><br/>
                  IngressClass 定义了 Ingress 控制器的类型，用于：<br/>
                  • 指定处理 Ingress 资源的控制器<br/>
                  • 支持集群中运行多个 Ingress 控制器<br/>
                  • 可设置默认 IngressClass
                </div>
              </template>
              <ElButton :icon="InfoIcon" circle />
            </ElTooltip>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="paginatedData"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 创建/编辑弹窗 -->
    <IngressClassDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :cluster-uuid="clusterUuid"
      :resource-name="currentResourceName"
      @success="handleDialogSuccess"
    />

    <!-- YAML 查看弹窗 -->
    <YamlViewerDialog
      v-model="yamlDialogVisible"
      :yaml="currentYaml"
      :resource-name="currentResourceName"
    />

    <!-- Describe 查看弹窗 -->
    <DescribeDialog
      v-model="describeDialogVisible"
      :describe="currentDescribe"
      :resource-name="currentResourceName"
    />

    <!-- 使用情况弹窗 -->
    <ElDialog v-model="usageDialogVisible" title="IngressClass 使用情况" width="900px" align-center>
      <div v-if="currentUsage" class="usage-info">
        <ElAlert
          v-if="currentUsage.isDefault && currentUsage.ingressCount > 0"
          :title="`此 IngressClass 是默认类，被 ${currentUsage.ingressCount} 个 Ingress 使用`"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
          show-icon
        />

        <ElDescriptions :column="3" border>
          <ElDescriptionsItem label="IngressClass">
            <ElSpace>
              <span>{{ currentUsage.ingressClassName }}</span>
              <ElTag v-if="currentUsage.isDefault" type="primary" size="small">默认</ElTag>
            </ElSpace>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Ingress 数量">
            <ElTag type="primary" size="small">{{ currentUsage.ingressCount }} 个</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="命名空间数量">
            <ElTag type="success" size="small">{{ currentUsage.namespaceCount }} 个</ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>

        <template v-if="currentUsage.ingresses && currentUsage.ingresses.length > 0">
          <ElDivider content-position="left">
            使用此 IngressClass 的 Ingress ({{ currentUsage.ingresses.length }})
          </ElDivider>
          <ElTable :data="currentUsage.ingresses" style="width: 100%" max-height="350">
            <ElTableColumn prop="name" label="名称" show-overflow-tooltip />
            <ElTableColumn prop="namespace" label="命名空间" width="140" />
            <ElTableColumn label="主机" show-overflow-tooltip>
              <template #default="{ row }">
                <ElSpace wrap v-if="row.hosts && row.hosts.length > 0">
                  <ElTag v-for="host in row.hosts.slice(0, 2)" :key="host" size="small">
                    {{ host }}
                  </ElTag>
                  <span v-if="row.hosts.length > 2" style="color: #909399; font-size: 12px">
                    +{{ row.hosts.length - 2 }}
                  </span>
                </ElSpace>
                <span v-else style="color: #909399">-</span>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="address" label="地址" width="150" show-overflow-tooltip />
            <ElTableColumn prop="tlsEnabled" label="TLS" width="80" align="center">
              <template #default="{ row }">
                <ElTag :type="row.tlsEnabled ? 'success' : 'info'" size="small">
                  {{ row.tlsEnabled ? '是' : '否' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="age" label="存在时间" width="110" />
          </ElTable>
        </template>

        <ElAlert
          v-if="!currentUsage.canDelete"
          :title="currentUsage.deleteWarning || '此 IngressClass 正在使用中，删除前请先删除或迁移相关 Ingress'"
          type="warning"
          :closable="false"
          style="margin-top: 16px"
          show-icon
        />
      </div>
    </ElDialog>

    <!-- 控制器状态弹窗 -->
    <ElDialog v-model="controllerStatusDialogVisible" title="控制器状态" width="700px" align-center>
      <div v-if="currentControllerStatus" class="controller-status-info">
        <ElAlert
          v-if="!currentControllerStatus.controllerReady"
          title="警告：控制器未就绪，Ingress 可能无法正常工作"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
          show-icon
        />

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="IngressClass">
            {{ currentControllerStatus.ingressClassName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="控制器">
            <code style="font-size: 12px; background: #f5f7fa; padding: 2px 8px; border-radius: 3px">
              {{ currentControllerStatus.controllerName }}
            </code>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag
              :type="currentControllerStatus.controllerReady ? 'success' : 'danger'"
              size="small"
            >
              {{ currentControllerStatus.controllerReady ? '就绪' : '未就绪' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="副本数">
            {{ currentControllerStatus.controllerReplicas || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="命名空间">
            {{ currentControllerStatus.namespace || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <template
          v-if="
            currentControllerStatus.controllerPods &&
            currentControllerStatus.controllerPods.length > 0
          "
        >
          <ElDivider content-position="left">
            控制器 Pod ({{ currentControllerStatus.controllerPods.length }})
          </ElDivider>
          <div class="controller-pods">
            <ElTag
              v-for="pod in currentControllerStatus.controllerPods"
              :key="pod"
              class="pod-tag"
              type="info"
            >
              {{ pod }}
            </ElTag>
          </div>
        </template>

        <ElAlert
          v-if="!currentControllerStatus.controllerPods || currentControllerStatus.controllerPods.length === 0"
          title="未找到控制器 Pod，请检查控制器是否已正确部署"
          type="warning"
          :closable="false"
          style="margin-top: 16px"
          show-icon
        />
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus as PlusIcon, Info as InfoIcon } from 'lucide-vue-next'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import {
    getIngressClassListApi,
    getIngressClassYamlApi,
    getIngressClassDescribeApi,
    getIngressClassUsageApi,
    getIngressClassControllerStatusApi,
    deleteIngressClassApi,
    canDeleteIngressClassApi,
    setDefaultIngressClassApi,
    unsetDefaultIngressClassApi,
    type IngressClassListItem,
    type IngressClassUsageResponse,
    type IngressClassControllerStatus
  } from '@/api/workload/cluster-resource'
  import { useIngressClassTableConfig } from './modules/table-config'
  import IngressClassDialog from './modules/ingress-class-dialog.vue'
  import YamlViewerDialog from '../../components/YamlViewerDialog.vue'
  import DescribeDialog from '../../components/DescribeDialog.vue'

  interface Props {
    clusterId: number
    clusterUuid: string
    active: boolean
  }

  const props = defineProps<Props>()

  defineOptions({ name: 'IngressClassTab' })

  const { loading, showSearchBar, deleteLoadingMap, createTableColumns } =
    useIngressClassTableConfig()

  const data = ref<IngressClassListItem[]>([])
  const filteredData = ref<IngressClassListItem[]>([])
  const hasLoaded = ref(false)
  const searchBarRef = ref()

  const dialogVisible = ref(false)
  const dialogType = ref<'create' | 'edit'>('create')
  const currentResourceName = ref('')
  const yamlDialogVisible = ref(false)
  const describeDialogVisible = ref(false)
  const usageDialogVisible = ref(false)
  const controllerStatusDialogVisible = ref(false)
  const currentYaml = ref('')
  const currentDescribe = ref('')
  const currentUsage = ref<IngressClassUsageResponse | null>(null)
  const currentControllerStatus = ref<IngressClassControllerStatus | null>(null)

  const searchForm = ref({ search: '' })

  const searchFormItems = computed(() => [
    {
      label: '名称',
      key: 'search',
      type: 'input',
      placeholder: '请输入 IngressClass 名称或控制器名称搜索',
      clearable: true
    }
  ])

  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 前端分页：计算当前页数据
  const paginatedData = computed(() => {
    const start = (pagination.value.current - 1) * pagination.value.size
    const end = start + pagination.value.size
    return filteredData.value.slice(start, end)
  })

  // 前端搜索过滤
  const filterData = () => {
    const searchText = searchForm.value.search.toLowerCase().trim()
    if (!searchText) {
      filteredData.value = data.value
    } else {
      filteredData.value = data.value.filter(item =>
        item.name.toLowerCase().includes(searchText) ||
        item.controller.toLowerCase().includes(searchText)
      )
    }
    pagination.value.total = filteredData.value.length
    pagination.value.current = 1
  }

  const handleSetDefault = async (row: IngressClassListItem) => {
    try {
      await ElMessageBox.confirm(
        `确定要将 "${row.name}" 设为默认 IngressClass 吗？未指定 IngressClass 的 Ingress 将使用此入口类。`,
        '设为默认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await setDefaultIngressClassApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      ElMessage.success('已设为默认 IngressClass')
      refresh()
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    }
  }

  const handleUnsetDefault = async (row: IngressClassListItem) => {
    try {
      await ElMessageBox.confirm(
        `确定要取消 "${row.name}" 的默认状态吗？`,
        '取消默认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await unsetDefaultIngressClassApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      ElMessage.success('已取消默认状态')
      refresh()
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    }
  }

  const buttonMoreClick = async (item: ButtonMoreItem, row: IngressClassListItem) => {
    switch (item.key) {
      case 'yaml':
        await viewYaml(row)
        break
      case 'describe':
        await viewDescribe(row)
        break
      case 'usage':
        await viewUsage(row)
        break
      case 'controllerStatus':
        await viewControllerStatus(row)
        break
      case 'edit':
        showEditDialog(row)
        break
      case 'delete':
        await handleDelete(row)
        break
    }
  }

  const { columns } = createTableColumns({
    handleSetDefault,
    handleUnsetDefault,
    buttonMoreClick
  })

  const loadData = async (force = false) => {
    if (!props.clusterUuid) return
    if (hasLoaded.value && !force) return

    try {
      loading.value = true
      const response = await getIngressClassListApi({
        clusterUuid: props.clusterUuid
      })
      data.value = response.items || []
      filterData()
      hasLoaded.value = true
    } catch (error: any) {
      console.error('加载列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const refresh = () => loadData(true)

  const handleSearch = () => {
    filterData()
  }

  const handleReset = () => {
    searchForm.value.search = ''
    filterData()
  }

  const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1
  }

  const handleCurrentChange = (page: number) => {
    pagination.value.current = page
  }

  const showCreateDialog = () => {
    dialogType.value = 'create'
    currentResourceName.value = ''
    dialogVisible.value = true
  }

  const showEditDialog = (row: IngressClassListItem) => {
    dialogType.value = 'edit'
    currentResourceName.value = row.name
    dialogVisible.value = true
  }

  const handleDialogSuccess = () => refresh()

  const viewYaml = async (row: IngressClassListItem) => {
    try {
      currentResourceName.value = row.name
      currentYaml.value = await getIngressClassYamlApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      yamlDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const viewDescribe = async (row: IngressClassListItem) => {
    try {
      currentResourceName.value = row.name
      currentDescribe.value = await getIngressClassDescribeApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      describeDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const viewUsage = async (row: IngressClassListItem) => {
    try {
      currentUsage.value = await getIngressClassUsageApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      usageDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const viewControllerStatus = async (row: IngressClassListItem) => {
    try {
      currentControllerStatus.value = await getIngressClassControllerStatusApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      controllerStatusDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const handleDelete = async (row: IngressClassListItem) => {
    try {
      const checkResult = await canDeleteIngressClassApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      if (!checkResult.canDelete) {
        ElMessage.warning(checkResult.warning || '无法删除此 IngressClass')
        return
      }

      await ElMessageBox.confirm(
        `确定要删除 IngressClass "${row.name}" 吗？删除后，使用此 IngressClass 的 Ingress 将无法正常工作。`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      deleteLoadingMap.value[row.name] = true

      await deleteIngressClassApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      ElMessage.success('删除成功')
      refresh()
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    } finally {
      deleteLoadingMap.value[row.name] = false
    }
  }

  watch(
    () => props.active,
    (active) => {
      if (active) {
        if (!hasLoaded.value) {
          loadData()
        } else {
          loadData(true)
        }
      }
    },
    { immediate: true }
  )

  watch(
    () => props.clusterUuid,
    (newUuid, oldUuid) => {
      if (newUuid !== oldUuid) {
        hasLoaded.value = false
        data.value = []
        filteredData.value = []
        if (props.active) loadData()
      }
    }
  )
</script>

<style lang="scss" scoped>
  .ingress-class-page {
    .usage-info,
    .controller-status-info {
      .el-divider {
        margin: 20px 0 16px;
      }
    }

    .controller-pods {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .pod-tag {
        font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
        font-size: 12px;
      }
    }

    :deep(.name-cell) {
      display: flex;
      align-items: center;
      gap: 8px;

      .resource-name {
        font-weight: 500;
      }

      .default-tag {
        margin-left: 4px;
      }
    }

    :deep(.controller-code) {
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      font-size: 12px;
      background: #f5f7fa;
      padding: 2px 8px;
      border-radius: 4px;
      color: #606266;
    }
  }
</style>