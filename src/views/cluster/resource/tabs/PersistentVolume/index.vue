<template>
  <div class="pv-page">
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
      <!-- 表格头部 -->
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
              创建 PersistentVolume
            </ElButton>
            <ElTooltip placement="bottom" :show-after="200">
              <template #content>
                <div class="help-tooltip">
                  <p><strong>PersistentVolume (PV) 简介</strong></p>
                  <p>• 集群级别的存储资源</p>
                  <p>• 独立于 Pod 生命周期</p>
                  <p>• 支持多种存储后端</p>
                  <p>• 通过 PVC 动态绑定给 Pod 使用</p>
                </div>
              </template>
              <ElButton :icon="InfoIcon" circle />
            </ElTooltip>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 数据表格 -->
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
    <PVDialog
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
    <DetailViewerDialog
      v-model="describeDialogVisible"
      :content="currentDescribe"
      :resource-name="currentResourceName"
    />

    <!-- 使用情况弹窗 -->
    <ElDialog
      v-model="usageDialogVisible"
      title="PV 使用情况"
      width="900px"
      align-center
      :close-on-click-modal="false"
    >
      <div v-if="currentUsage" class="usage-info">
        <!-- 状态警告 -->
        <ElAlert
          v-if="currentUsage.status === 'Bound'"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
          show-icon
        >
          <template #title>
            <strong>此 PV 已被绑定并正在使用中</strong>
          </template>
        </ElAlert>

        <!-- PV 基本信息 -->
        <div class="usage-section">
          <div class="section-title">
            <DatabaseIcon :size="16" />
            <span>PV 基本信息</span>
          </div>
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="PV 名称">
              <ElTag type="info">{{ currentUsage.pvName }}</ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <ElTag :type="getStatusType(currentUsage.status)">
                {{ getStatusLabel(currentUsage.status) }}
              </ElTag>
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>

        <!-- 绑定的 PVC -->
        <template v-if="currentUsage.claimInfo">
          <div class="usage-section">
            <div class="section-title">
              <LinkIcon :size="16" />
              <span>绑定的 PVC</span>
            </div>
            <ElDescriptions :column="2" border>
              <ElDescriptionsItem label="PVC 名称">
                <ElTag type="primary">{{ currentUsage.claimInfo.name }}</ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="命名空间">
                <ElTag>{{ currentUsage.claimInfo.namespace }}</ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="状态">
                {{ currentUsage.claimInfo.status }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="容量">
                {{ currentUsage.claimInfo.capacity }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>
        </template>

        <!-- 使用此 PV 的 Pod -->
        <template v-if="currentUsage.usedByPods && currentUsage.usedByPods.length > 0">
          <div class="usage-section">
            <div class="section-title">
              <BoxIcon :size="16" />
              <span>使用此 PV 的 Pod ({{ currentUsage.usedByPods.length }})</span>
            </div>
            <ElTable :data="currentUsage.usedByPods" border stripe max-height="300">
              <ElTableColumn prop="name" label="Pod 名称" min-width="180" show-overflow-tooltip />
              <ElTableColumn prop="namespace" label="命名空间" width="140" />
              <ElTableColumn prop="nodeName" label="节点" width="160" show-overflow-tooltip />
              <ElTableColumn prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <ElTag :type="row.status === 'Running' ? 'success' : 'warning'" size="small">
                    {{ row.status }}
                  </ElTag>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </template>

        <!-- 删除提示 -->
        <ElAlert
          v-if="!currentUsage.canDelete"
          type="warning"
          :closable="false"
          style="margin-top: 16px"
          show-icon
        >
          <template #title>
            <strong>无法删除</strong>
          </template>
          <template #default>
            <div>
              <p style="margin: 0 0 12px 0">
                {{ currentUsage.deleteReason || '此 PV 正在使用中，无法删除' }}
              </p>
              <div class="delete-hint">
                <p style="margin: 0 0 8px 0; font-weight: 600">
                  <AlertTriangleIcon :size="14" />
                  建议的删除顺序：
                </p>
                <ol style="margin: 0; padding-left: 20px">
                  <li>删除或迁移使用此 PV 的 Pod</li>
                  <li>删除绑定的 PVC</li>
                  <li>最后删除 PV</li>
                </ol>
              </div>
            </div>
          </template>
        </ElAlert>

        <ElAlert v-else type="success" :closable="false" style="margin-top: 16px" show-icon>
          <template #title>可以安全删除</template>
          <template #default> 此 PV 当前未被绑定或使用，可以安全删除 </template>
        </ElAlert>
      </div>

      <template #footer>
        <ElButton type="primary" @click="usageDialogVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Plus as PlusIcon,
    Info as InfoIcon,
    Database as DatabaseIcon,
    Link as LinkIcon,
    Box as BoxIcon,
    AlertTriangle as AlertTriangleIcon
  } from 'lucide-vue-next'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import {
    getPVListApi,
    getPVYamlApi,
    getPVDescribeApi,
    getPVUsageApi,
    deletePVApi,
    canDeletePVApi,
    type PVListItem,
    type PVUsageResponse
  } from '@/api/workload/cluster-resource'
  import { usePVTableConfig } from './modules/table-config'
  import PVDialog from './modules/pv-dialog.vue'
  import YamlViewerDialog from '../../components/YamlViewerDialog.vue'
  import DetailViewerDialog from '../../components/DetailViewerDialog.vue'

  interface Props {
    clusterId: number
    clusterUuid: string
    active: boolean
  }

  const props = defineProps<Props>()

  defineOptions({ name: 'PersistentVolumeTab' })

  const { loading, showSearchBar, deleteLoadingMap, createTableColumns } = usePVTableConfig()

  const allData = ref<PVListItem[]>([])
  const filteredData = ref<PVListItem[]>([])
  const hasLoaded = ref(false)
  const searchBarRef = ref()

  const dialogVisible = ref(false)
  const dialogType = ref<'create' | 'edit'>('create')
  const currentResourceName = ref('')
  const yamlDialogVisible = ref(false)
  const describeDialogVisible = ref(false)
  const usageDialogVisible = ref(false)
  const currentYaml = ref('')
  const currentDescribe = ref('')
  const currentUsage = ref<PVUsageResponse | null>(null)

  const searchForm = ref({
    search: '',
    status: undefined as string | undefined,
    storageClass: undefined as string | undefined
  })

  const searchFormItems = computed(() => [
    {
      label: '名称',
      key: 'search',
      type: 'input',
      placeholder: '请输入 PV 名称',
      clearable: true
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '可用', value: 'Available' },
          { label: '已绑定', value: 'Bound' },
          { label: '已释放', value: 'Released' },
          { label: '失败', value: 'Failed' }
        ]
      }
    },
    {
      label: '存储类',
      key: 'storageClass',
      type: 'input',
      placeholder: '请输入存储类名称',
      clearable: true
    }
  ])

  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 前端过滤
  const filterData = () => {
    let data = allData.value

    // 按名称搜索
    const keyword = searchForm.value.search?.toLowerCase().trim()
    if (keyword) {
      data = data.filter((item) => item.name.toLowerCase().includes(keyword))
    }

    // 按状态过滤
    if (searchForm.value.status) {
      data = data.filter((item) => item.status === searchForm.value.status)
    }

    // 按存储类过滤
    const scKeyword = searchForm.value.storageClass?.toLowerCase().trim()
    if (scKeyword) {
      data = data.filter((item) => item.storageClass?.toLowerCase().includes(scKeyword))
    }

    filteredData.value = data
    pagination.value.total = data.length
    pagination.value.current = 1
  }

  // 分页数据
  const paginatedData = computed(() => {
    const start = (pagination.value.current - 1) * pagination.value.size
    const end = start + pagination.value.size
    return filteredData.value.slice(start, end)
  })

  const getStatusType = (status: string) => {
    const map: Record<string, string> = {
      Available: 'success',
      Bound: 'primary',
      Released: 'warning',
      Failed: 'danger',
      Pending: 'info'
    }
    return map[status] || 'info'
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      Available: '可用',
      Bound: '已绑定',
      Released: '已释放',
      Failed: '失败',
      Pending: '等待中'
    }
    return map[status] || status
  }

  const buttonMoreClick = async (item: ButtonMoreItem, row: PVListItem) => {
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
      case 'edit':
        showEditDialog(row)
        break
      case 'delete':
        await handleDelete(row)
        break
    }
  }

  const { columns } = createTableColumns({ buttonMoreClick })

  const loadData = async (force = false) => {
    if (!props.clusterUuid) return
    if (hasLoaded.value && !force) return

    try {
      loading.value = true

      const response = await getPVListApi({
        clusterUuid: props.clusterUuid
      })

      allData.value = response.items || []
      filterData()
      hasLoaded.value = true
    } catch (error: any) {
      console.error('加载 PV 列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const refresh = () => loadData(true)

  const handleSearch = () => {
    filterData()
  }

  const handleReset = () => {
    searchForm.value = { search: '', status: undefined, storageClass: undefined }
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

  const showEditDialog = (row: PVListItem) => {
    dialogType.value = 'edit'
    currentResourceName.value = row.name
    dialogVisible.value = true
  }

  const handleDialogSuccess = () => refresh()

  const viewYaml = async (row: PVListItem) => {
    try {
      currentResourceName.value = row.name
      currentYaml.value = await getPVYamlApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      yamlDialogVisible.value = true
    } catch (error: any) {
      console.error('获取 YAML 失败:', error)
    }
  }

  const viewDescribe = async (row: PVListItem) => {
    try {
      currentResourceName.value = row.name
      currentDescribe.value = await getPVDescribeApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      describeDialogVisible.value = true
    } catch (error: any) {
      console.error('获取 Describe 失败:', error)
    }
  }

  const viewUsage = async (row: PVListItem) => {
    try {
      currentUsage.value = await getPVUsageApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      usageDialogVisible.value = true
    } catch (error: any) {
      console.error('获取使用情况失败:', error)
    }
  }

  const handleDelete = async (row: PVListItem) => {
    try {
      // 检查是否可以删除
      const checkResult = await canDeletePVApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      if (!checkResult.canDelete) {
        await ElMessageBox.alert(
          `
            <div>
              <p style="margin-bottom: 12px">${checkResult.warning || '此 PV 正在使用中，无法删除'}</p>
              <div style="padding: 12px; background: #fff7e6; border-radius: 4px; border: 1px solid #ffe7ba">
                <p style="margin: 0 0 8px; font-weight: 600; color: #e6a23c">建议的删除顺序：</p>
                <ol style="margin: 0; padding-left: 20px">
                  <li>删除或迁移使用此 PV 的 Pod</li>
                  <li>删除绑定的 PVC</li>
                  <li>最后删除 PV</li>
                </ol>
              </div>
            </div>
          `,
          '无法删除',
          {
            confirmButtonText: '知道了',
            type: 'warning',
            dangerouslyUseHTMLString: true
          }
        )
        return
      }

      // 确认删除
      await ElMessageBox.confirm(
        `
          <div>
            <p>确定要删除 PersistentVolume "<strong>${row.name}</strong>" 吗？</p>
            <p style="margin-top: 12px; color: #f56c6c; font-weight: 600">
              ⚠️ 此操作不可恢复！
            </p>
            <div style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 4px">
              <p style="margin: 0"><strong>PV 信息：</strong></p>
              <p style="margin: 4px 0">容量：${row.capacity}</p>
              <p style="margin: 4px 0">状态：${row.status}</p>
              <p style="margin: 4px 0">回收策略：${row.reclaimPolicy}</p>
            </div>
          </div>
        `,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'error',
          dangerouslyUseHTMLString: true
        }
      )

      deleteLoadingMap.value[row.name] = true

      await deletePVApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      ElMessage.success(`PV "${row.name}" 已删除`)
      refresh()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
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
        allData.value = []
        filteredData.value = []
        pagination.value.current = 1
        pagination.value.total = 0
        if (props.active) {
          loadData()
        }
      }
    }
  )
</script>

<style lang="scss" scoped>
  .pv-page {
    .usage-info {
      .usage-section {
        margin-bottom: 24px;

        &:last-of-type {
          margin-bottom: 0;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          padding-bottom: 8px;
          border-bottom: 2px solid #e4e7ed;
        }
      }

      .delete-hint {
        padding: 12px;
        background: #fff7e6;
        border-radius: 4px;
        border: 1px solid #ffe7ba;
        color: #606266;

        p {
          color: #e6a23c;
        }
      }
    }

    .help-tooltip {
      max-width: 300px;
      line-height: 1.6;

      p {
        margin: 0 0 6px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      strong {
        color: #409eff;
      }
    }
  }
</style>
