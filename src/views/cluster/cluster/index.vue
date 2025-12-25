<template>
  <div class="cluster-page">
    <!-- 搜索卡片 -->
    <ElCard v-show="showSearchBar" class="search-card" shadow="never">
      <ClusterSearch v-model="searchParams" @search="handleSearch" @reset="resetSearchParams" />
    </ElCard>

    <!-- 主内容卡片 -->
    <ElCard
      class="content-card"
      shadow="never"
      :style="{ 'margin-top': showSearchBar ? '20px' : '0' }"
    >
      <!-- 表格头部 -->
      <ArtTableHeader
        v-model:columns="columns"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        :showZebra="true"
        :showBorder="true"
        :showHeaderBackground="true"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <!-- 视图切换 -->
            <ElRadioGroup v-model="viewMode" @change="handleViewModeChange" :disabled="loading">
              <ElRadioButton value="card">
                <ElIcon>
                  <Grid />
                </ElIcon>
                卡片视图
              </ElRadioButton>
              <ElRadioButton value="table">
                <ElIcon>
                  <List />
                </ElIcon>
                列表视图
              </ElRadioButton>
            </ElRadioGroup>

            <!-- 新建集群按钮 -->
            <ElButton
              type="primary"
              :icon="Plus"
              @click="goToAddCluster"
              :disabled="loading"
              :loading="addClusterLoading"
            >
              新增集群
            </ElButton>

            <!-- 全部数据同步按钮 -->
            <ElButton
              type="warning"
              @click="handleSyncAll"
              :disabled="loading || clusters.length === 0"
              :loading="syncAllLoading"
            >
              <ElIcon v-if="!syncAllLoading" style="margin-right: 4px">
                <RefreshCw />
              </ElIcon>
              数据同步
            </ElButton>

            <!-- 刷新按钮 -->
            <ElButton :icon="Refresh" @click="refreshData" :loading="refreshLoading">
              刷新
            </ElButton>

            <!-- 导出按钮 -->
            <ElButton
              :icon="Download"
              @click="handleExport"
              :disabled="loading"
              :loading="exportLoading"
            >
              导出报表
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="card-container" v-loading="operationLoading">
        <div v-if="loading" class="loading-container">
          <ElSkeleton v-for="i in 6" :key="i" animated style="width: 100%">
            <template #template>
              <div class="skeleton-card">
                <ElSkeletonItem variant="text" style="width: 60%; margin-bottom: 16px" />
                <ElSkeletonItem variant="text" style="width: 40%; margin-bottom: 12px" />
                <ElSkeletonItem variant="text" style="width: 80%; margin-bottom: 12px" />
                <ElSkeletonItem variant="rect" style="width: 100%; height: 60px" />
              </div>
            </template>
          </ElSkeleton>
        </div>

        <div v-else-if="displayData.length > 0" class="card-grid">
          <ClusterCard
            v-for="cluster in displayData"
            :key="cluster.id"
            :cluster="cluster"
            :sync-loading="syncLoadingMap[cluster.id]"
            @click="goToManagement"
            @sync="handleSync"
            @delete="handleDelete"
            @update-avatar="openAvatarDialog"
          />
        </div>

        <ElEmpty v-else description="暂无集群数据">
          <ElButton type="primary" @click="goToAddCluster" :loading="addClusterLoading">
            <Plus />
            创建第一个集群
          </ElButton>
        </ElEmpty>
      </div>

      <!-- 列表视图 -->
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

      <!-- 分页器（卡片视图） -->
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

    <!-- 头像更换对话框 -->
    <ElDialog
      v-model="avatarDialogVisible"
      title="更换集群头像"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="dialog-content">
        <div class="current-avatar-section">
          <div class="avatar-preview">
            <img v-if="currentCluster?.avatar" :src="currentCluster.avatar" alt="当前头像" />
            <div v-else class="default-preview">
              <Server />
            </div>
          </div>
          <div class="avatar-info">
            <h4>{{ currentCluster?.name }}</h4>
            <p>建议使用 1:1 比例的图片</p>
          </div>
        </div>

        <ElUpload
          :show-file-list="false"
          :on-change="handleAvatarUpload"
          :before-upload="() => false"
          accept="image/*"
          drag
          class="upload-area"
          :disabled="avatarUploading"
        >
          <div class="upload-content">
            <Upload v-if="!avatarUploading" />
            <ElIcon v-else class="is-loading">
              <Loading />
            </ElIcon>
            <h4>{{ avatarUploading ? '上传中...' : '拖拽图片到此处或点击上传' }}</h4>
            <p>支持 JPG、PNG、SVG 格式，最大 2MB</p>
          </div>
        </ElUpload>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="avatarDialogVisible = false" :disabled="avatarUploading">取消</ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, h, watch, onActivated } from 'vue'
  import type { VNode } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox, ElTag, ElButton, ElIcon } from 'element-plus'
  import { Loading } from '@element-plus/icons-vue'
  import {
    Plus,
    RefreshCw as Refresh,
    Download,
    Server,
    Grid,
    List,
    Upload,
    RefreshCw
  } from 'lucide-vue-next'
  import {
    searchClusterApi,
    deleteClusterApi,
    syncClusterApi,
    syncAllClustersApi,
    updateClusterAvatarApi,
    type Cluster,
    type SearchClusterRequest
  } from '@/api'
  import {
    environmentOptions,
    clusterTypeOptions,
    healthStatusConfig,
    syncStatusConfig
  } from './constants'
  import ClusterSearch from './modules/cluster-search.vue'
  import ClusterCard from './modules/cluster-card.vue'

  defineOptions({ name: 'ClusterList' })

  // 路由
  const router = useRouter()

  // 状态管理
  const loading = ref(true)
  const refreshLoading = ref(false)
  const addClusterLoading = ref(false)
  const exportLoading = ref(false)
  const syncAllLoading = ref(false)
  const showSearchBar = ref(false)
  const viewMode = ref<'card' | 'table'>('card')
  const operationLoading = ref(false)
  const clusters = ref<Cluster[]>([])
  const filteredData = ref<Cluster[]>([])
  const syncLoadingMap = ref<Record<number, boolean>>({})

  // 头像相关
  const avatarDialogVisible = ref(false)
  const currentCluster = ref<Cluster | null>(null)
  const avatarUploading = ref(false)

  // 搜索参数
  const searchParams = ref<SearchClusterRequest>({
    page: 1,
    pageSize: 20,
    name: '',
    environment: ''
  })

  // 分页配置
  const pagination = ref({
    current: 1,
    size: viewMode.value === 'card' ? 12 : 20,
    total: 0
  })

  // 格式化时间戳
  const formatTimestamp = (timestamp: number | undefined | null): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('zh-CN')
  }

  // 跳转到管理页面
  const goToManagement = (id: number) => {
    router.push(`/cluster/management/${id}`)
  }

  // 同步集群
  const handleSync = async (cluster: Cluster) => {
    try {
      syncLoadingMap.value[cluster.id] = true
      await syncClusterApi(cluster.id)
      ElMessage.success(`集群 "${cluster.name}" 同步任务已触发`)
      setTimeout(() => {
        fetchClusters()
      }, 1000)
    } catch (error) {
      console.error('同步失败:', error)
    } finally {
      setTimeout(() => {
        delete syncLoadingMap.value[cluster.id]
      }, 2000)
    }
  }

  // 删除集群
  const handleDelete = async (cluster: Cluster) => {
    try {
      await ElMessageBox.confirm(
        `此操作将永久删除集群 "${cluster.name}" 及其所有相关配置，是否继续？`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              instance.confirmButtonLoading = true
              deleteClusterApi(cluster.id)
                .then(() => {
                  ElMessage.success('集群删除成功')
                  fetchClusters()
                  done()
                })
                .catch((error: any) => {
                  console.error('删除集群失败:', error)
                  instance.confirmButtonLoading = false
                })
            } else {
              done()
            }
          }
        }
      )
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除操作取消或失败:', error)
      }
    }
  }

  // 表格列配置（直接定义，不使用 useTableColumns）
  const columns = ref([
    {
      prop: 'name',
      label: '集群名称',
      minWidth: 150,
      fixed: 'left' as const,
      showOverflowTooltip: true,
      visible: true,
      formatter: (row: Record<string, any>): VNode => {
        return h('div', { class: 'cluster-name-cell' }, [
          h(
            'span',
            {
              class: 'cluster-name-link',
              style: 'color: #409eff; cursor: pointer;',
              onClick: () => goToManagement(row.id)
            },
            row.name
          )
        ])
      }
    },
    {
      prop: 'environment',
      label: '环境',
      width: 100,
      visible: true,
      formatter: (row: Record<string, any>): VNode => {
        const config = environmentOptions.find((env) => env.value === row.environment)
        return h(
          ElTag,
          { type: config?.type || 'info', size: 'small' },
          () => config?.label || row.environment
        )
      }
    },
    {
      prop: 'clusterType',
      label: '集群类型',
      width: 120,
      visible: true,
      formatter: (row: Record<string, any>) => {
        const config = clusterTypeOptions.find((type) => type.value === row.clusterType)
        return config?.label || row.clusterType
      }
    },
    {
      prop: 'version',
      label: '版本',
      width: 100,
      visible: true
    },
    {
      prop: 'healthStatus',
      label: '健康状态',
      width: 100,
      visible: true,
      formatter: (row: Record<string, any>): VNode => {
        const status = healthStatusConfig[row.healthStatus] || { text: '未知', type: 'info' }
        return h(ElTag, { type: status.type, size: 'small' }, () => status.label)
      }
    },
    {
      prop: 'status',
      label: '同步状态',
      width: 100,
      visible: true,
      formatter: (row: Record<string, any>): VNode => {
        const status = syncStatusConfig[row.status] || { label: '未知', color: '#6b7280' }
        return h(
          ElTag,
          {
            type: row.status === 1 ? 'primary' : row.status === 3 ? 'success' : 'danger',
            size: 'small'
          },
          () => status.label
        )
      }
    },
    {
      prop: 'createdAt',
      label: '创建时间',
      width: 180,
      sortable: true,
      visible: true,
      formatter: (row: Record<string, any>) => {
        return formatTimestamp(row.createdAt)
      }
    },
    {
      prop: 'operation',
      label: '操作',
      width: 280,
      fixed: 'right' as const,
      visible: true,
      formatter: (row: Record<string, any>): VNode => {
        return h('div', { class: 'table-operation-buttons' }, [
          // 集群管理按钮
          h(
            ElButton,
            {
              type: 'primary',
              size: 'small',
              disabled: operationLoading.value,
              onClick: () => goToManagement(row.id)
            },
            () => [
              h('i', { class: 'iconfont-sys iconsys-settings', style: 'margin-right: 4px;' }),
              '管理'
            ]
          ),
          // 同步集群按钮
          h(
            ElButton,
            {
              type: 'success',
              size: 'small',
              loading: syncLoadingMap.value[row.id],
              disabled: operationLoading.value || syncLoadingMap.value[row.id],
              onClick: () => handleSync(row as Cluster),
              style: 'margin-left: 8px;'
            },
            () => [
              !syncLoadingMap.value[row.id] &&
                h('i', {
                  class: 'iconfont-sys iconsys-refresh',
                  style: 'margin-right: 4px;'
                }),
              '同步'
            ]
          ),
          // 删除集群按钮
          h(
            ElButton,
            {
              type: 'danger',
              size: 'small',
              disabled: operationLoading.value,
              onClick: () => handleDelete(row as Cluster),
              style: 'margin-left: 8px;'
            },
            () => [
              h('i', { class: 'iconfont-sys iconsys-delete', style: 'margin-right: 4px;' }),
              '删除'
            ]
          )
        ])
      }
    }
  ])

  // 显示数据（分页后）
  const displayData = computed(() => {
    const start = (pagination.value.current - 1) * pagination.value.size
    const end = start + pagination.value.size
    return filteredData.value.slice(start, end)
  })

  // 获取集群列表
  const fetchClusters = async () => {
    try {
      loading.value = true
      const response = await searchClusterApi({
        ...searchParams.value,
        page: 1,
        pageSize: 20 // 获取所有数据，前端分页
      })
      clusters.value = response.items || []
      applyFilters()
    } catch (error) {
      console.error('获取集群列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 应用过滤
  const applyFilters = () => {
    let data = [...clusters.value]

    // 根据搜索条件过滤
    if (searchParams.value.name) {
      data = data.filter((cluster) =>
        cluster.name.toLowerCase().includes(searchParams.value.name.toLowerCase())
      )
    }
    if (searchParams.value.environment) {
      data = data.filter((cluster) => cluster.environment === searchParams.value.environment)
    }

    filteredData.value = data
    pagination.value.total = data.length

    // 重置到第一页
    if (pagination.value.current > Math.ceil(data.length / pagination.value.size)) {
      pagination.value.current = 1
    }
  }

  // 刷新数据
  const refreshData = async () => {
    refreshLoading.value = true
    try {
      await fetchClusters()
    } finally {
      refreshLoading.value = false
    }
  }

  // 处理搜索
  const handleSearch = (params: Record<string, any>) => {
    searchParams.value = { ...searchParams.value, ...params }
    pagination.value.current = 1
    applyFilters()
  }

  // 重置搜索参数
  const resetSearchParams = () => {
    searchParams.value = {
      page: 1,
      pageSize: 20,
      name: '',
      environment: ''
    }
    pagination.value.current = 1
    applyFilters()
  }

  // 处理视图模式切换
  const handleViewModeChange = () => {
    pagination.value.size = viewMode.value === 'card' ? 12 : 20
    pagination.value.current = 1

    // 根据视图模式自动切换搜索栏显示状态
    if (viewMode.value === 'card') {
      // 切换到卡片视图时自动隐藏搜索栏
      showSearchBar.value = false
    } else if (viewMode.value === 'table') {
      // 切换到表格视图时自动显示搜索栏
      showSearchBar.value = true
    }
  }

  // 分页大小改变
  const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1
  }

  // 当前页改变
  const handleCurrentChange = (current: number) => {
    pagination.value.current = current
  }

  // 同步所有集群
  const handleSyncAll = async () => {
    try {
      await ElMessageBox.confirm(
        h('div', { style: 'line-height: 1.6' }, [
          h(
            'p',
            { style: 'margin-bottom: 12px; font-weight: 600; color: #303133' },
            '确定要同步所有集群数据吗？'
          ),
          h('div', { style: 'color: #606266; font-size: 14px' }, [
            h('p', { style: 'margin-bottom: 8px' }, `• 当前共有 ${clusters.value.length} 个集群`),
            h('p', { style: 'margin-bottom: 8px' }, '• 批量同步可能需要较长时间'),
            h(
              'p',
              { style: 'margin-bottom: 8px; color: #E6A23C' },
              '• 建议优先使用单个集群同步功能'
            ),
            h('p', { style: 'color: #909399' }, '• 同步期间可能会影响集群性能')
          ])
        ]),
        '批量同步确认',
        {
          confirmButtonText: '确定同步',
          cancelButtonText: '取消',
          type: 'warning',
          customClass: 'sync-all-confirm-dialog',
          distinguishCancelAndClose: true,
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              instance.confirmButtonLoading = true
              syncAllClustersApi()
                .then(() => {
                  ElMessage.success('批量同步任务已触发，请稍后刷新查看结果')
                  // 延迟刷新数据
                  setTimeout(() => {
                    fetchClusters()
                  }, 2000)
                  done()
                })
                .catch((error: any) => {
                  console.error('批量同步失败:', error)
                  instance.confirmButtonLoading = false
                })
            } else {
              done()
            }
          }
        }
      )
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        console.error('批量同步操作取消或失败:', error)
      }
    }
  }

  // 跳转到添加页面
  const goToAddCluster = () => {
    addClusterLoading.value = true
    router.push('/cluster/add')
    // 路由跳转完成后重置loading状态
    setTimeout(() => {
      addClusterLoading.value = false
    }, 100)
  }

  // 导出报表
  const handleExport = async () => {
    exportLoading.value = true
    try {
      // 模拟导出操作
      await new Promise((resolve) => setTimeout(resolve, 2000))
      ElMessage.success('导出成功')
    } catch (error) {
    } finally {
      exportLoading.value = false
    }
  }

  // 打开头像更换对话框
  const openAvatarDialog = (cluster: Cluster) => {
    currentCluster.value = cluster
    avatarDialogVisible.value = true
  }

  // 头像上传处理
  const handleAvatarUpload = async (uploadFile: any) => {
    if (!uploadFile.raw || !currentCluster.value) return

    const isImage = uploadFile.raw.type.startsWith('image/')
    if (!isImage) {
      return
    }

    const isLt2M = uploadFile.raw.size / 1024 / 1024 < 2
    if (!isLt2M) {
      return
    }

    avatarUploading.value = true
    try {
      await updateClusterAvatarApi({
        id: currentCluster.value.id,
        avatar: uploadFile.raw
      })
      ElMessage.success('头像更新成功')
      avatarDialogVisible.value = false
      await fetchClusters()
    } catch (error) {
    } finally {
      avatarUploading.value = false
    }
  }

  // 监听搜索表单变化，自动过滤
  watch(
    searchParams,
    () => {
      applyFilters()
    },
    { deep: true }
  )

  // 初始化
  onMounted(() => {
    fetchClusters()
  })

  // 页面被激活时（从其他页面回来时）重新获取数据
  onActivated(() => {
    fetchClusters()
  })
</script>

<style lang="scss" scoped>
  .cluster-page {
    height: 100%;
    padding-bottom: 15px;

    .search-card {
      margin-bottom: 12px;
    }

    .content-card {
      min-height: calc(100vh - 200px);

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
  }

  :deep(.cluster-name-cell) {
    .cluster-name-link {
      &:hover {
        text-decoration: underline;
      }
    }
  }

  // 对话框样式
  .dialog-content {
    .current-avatar-section {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 32px;
      padding: 24px;
      background: rgba(248, 250, 252, 0.5);
      border-radius: 16px;

      .avatar-preview {
        width: 80px;
        height: 80px;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .default-preview {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;

          svg {
            width: 40px;
            height: 40px;
          }
        }
      }

      .avatar-info {
        h4 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
      }
    }

    .upload-area {
      :deep(.el-upload-dragger) {
        border: 2px dashed #cbd5e1;
        border-radius: 16px;
        background: rgba(248, 250, 252, 0.5);
        transition: all 0.3s ease;
        padding: 40px;

        &:hover:not(.is-disabled) {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        &.is-disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
      }

      .upload-content {
        text-align: center;

        svg,
        .el-icon {
          width: 48px;
          height: 48px;
          color: #94a3b8;
          margin-bottom: 16px;

          &.is-loading {
            animation: rotating 2s linear infinite;
          }
        }

        h4 {
          font-size: 16px;
          font-weight: 600;
          color: #475569;
          margin: 0 0 8px 0;
        }

        p {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }
      }
    }
  }

  // 批量同步确认对话框样式
  :global(.sync-all-confirm-dialog) {
    .el-message-box__header {
      padding-bottom: 15px;
    }

    .el-message-box__message {
      padding: 10px 15px;
    }
  }

  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
