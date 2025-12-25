<template>
  <div class="probe-management-page">
    <!-- 页面头部 - 优化为更紧凑的布局 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <Activity :size="24" />
          <div class="title-group">
            <h1>Probe 探测管理</h1>
            <p class="page-desc">管理 Kubernetes 集群的 Blackbox Probe 探测配置</p>
          </div>
        </div>

        <div class="header-right">
          <div class="cluster-selector">
            <span class="selector-label">选择集群</span>
            <ElSelect
              v-model="selectedClusterId"
              placeholder="请选择或搜索集群"
              filterable
              clearable
              style="width: 280px"
              @change="handleClusterChange"
              @clear="handleClusterClear"
              :loading="clustersLoading"
            >
              <ElOption
                v-for="cluster in clusters"
                :key="cluster.id"
                :label="cluster.name"
                :value="cluster.id"
              >
                <div class="cluster-option-content">
                  <span class="cluster-name">{{ cluster.name }}</span>
                  <div class="cluster-tags">
                    <ElTag :type="getEnvironmentType(cluster.environment)" size="small">
                      {{ cluster.environment }}
                    </ElTag>
                    <ElTag :type="getStatusType(cluster.status)" size="small">
                      {{ getStatusText(cluster.status) }}
                    </ElTag>
                  </div>
                </div>
              </ElOption>
            </ElSelect>
            <ElButton :icon="RefreshCw" @click="loadClusters" :loading="clustersLoading" circle size="small" />
          </div>
        </div>
      </div>
    </div>

    <!-- 未选择集群提示 -->
    <div v-if="!selectedClusterId" class="empty-state">
      <ElCard shadow="never">
        <div class="empty-content">
          <Activity :size="80" class="empty-icon" />
          <h2>欢迎使用 Probe 探测管理</h2>
          <p>请先在上方选择一个集群，然后管理该集群的 Probe 探测配置</p>
          <div class="feature-list">
            <div class="feature-item">
              <Target :size="20" />
              <span>配置 Blackbox Exporter 探测</span>
            </div>
            <div class="feature-item">
              <Globe :size="20" />
              <span>支持 HTTP/TCP/ICMP 多种探测</span>
            </div>
            <div class="feature-item">
              <Settings :size="20" />
              <span>灵活的探测参数配置</span>
            </div>
            <div class="feature-item">
              <BarChart3 :size="20" />
              <span>集成 Prometheus 监控</span>
            </div>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- Probe 管理内容 -->
    <div v-else class="probe-content">
      <ProbeManagement
        :cluster-uuid="currentClusterUuid"
        :cluster-id="selectedClusterId"
        :refresh-trigger="refreshTrigger"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    RefreshCw,
    Activity,
    Target,
    Globe,
    Settings,
    BarChart3
  } from 'lucide-vue-next'
  import {
    searchClusterApi,
    getClusterDetailApi,
    type Cluster,
    type ClusterDetail
  } from '@/api/manager/cluster'
  import ProbeManagement from './components/ProbeManagement.vue'

  defineOptions({ name: 'ProbePage' })

  const STORAGE_KEY_CLUSTER = 'probe-selected-cluster'

  function loadFromStorage(key: string): number | null {
    try {
      const value = localStorage.getItem(key)
      return value ? Number(value) : null
    } catch (error) {
      console.error('加载存储失败:', error)
      return null
    }
  }

  function saveToStorage(key: string, value: number | null) {
    try {
      if (value !== null && value !== undefined) {
        localStorage.setItem(key, String(value))
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('保存存储失败:', error)
    }
  }

  const selectedClusterId = ref<number | null>(null)
  const currentClusterUuid = ref<string>('')
  const clusters = ref<Cluster[]>([])
  const currentCluster = ref<ClusterDetail | null>(null)
  const clustersLoading = ref(false)
  const refreshTrigger = ref(0)

  const loadClusters = async () => {
    try {
      clustersLoading.value = true
      const response = await searchClusterApi({ pageSize: 200 })
      clusters.value = response.items || []

      const savedClusterId = loadFromStorage(STORAGE_KEY_CLUSTER)
      if (savedClusterId) {
        const cluster = clusters.value.find((c) => c.id === savedClusterId)
        if (cluster) {
          selectedClusterId.value = savedClusterId
          await getClusterDetail(savedClusterId)
        } else {
          console.warn('缓存的集群不存在,清空选择')
          saveToStorage(STORAGE_KEY_CLUSTER, null)
        }
      }
    } catch (error) {
      console.error('获取集群列表失败:', error)
      ElMessage.error('获取集群列表失败')
    } finally {
      clustersLoading.value = false
    }
  }

  const getClusterDetail = async (clusterId: number) => {
    try {
      const detail = await getClusterDetailApi(clusterId)
      currentCluster.value = detail
      currentClusterUuid.value = detail.uuid || ''
      refreshTrigger.value++
    } catch (error) {
      console.error('获取集群详情失败:', error)
      currentCluster.value = null
      currentClusterUuid.value = ''
      ElMessage.error('获取集群详情失败')
    }
  }

  const handleClusterChange = async (clusterId: number | null) => {
    saveToStorage(STORAGE_KEY_CLUSTER, clusterId)
    if (clusterId) {
      await getClusterDetail(clusterId)
    } else {
      currentCluster.value = null
      currentClusterUuid.value = ''
    }
  }

  const handleClusterClear = () => {
    currentCluster.value = null
    currentClusterUuid.value = ''
    saveToStorage(STORAGE_KEY_CLUSTER, null)
  }

  const getEnvironmentType = (env?: string) => {
    const envMap: Record<string, string> = {
      production: 'danger',
      staging: 'warning',
      testing: 'info',
      development: 'success'
    }
    return envMap[env || ''] || 'info'
  }

  const getStatusType = (status?: number) => {
    const statusMap: Record<number, string> = {
      1: 'warning',
      2: 'danger',
      3: 'success'
    }
    return statusMap[status || 0] || 'info'
  }

  const getStatusText = (status?: number) => {
    const statusMap: Record<number, string> = {
      1: '同步中',
      2: '同步异常',
      3: '同步正常'
    }
    return statusMap[status || 0] || '未知'
  }

  onMounted(() => {
    loadClusters()
  })
</script>

<style lang="scss" scoped>
  .probe-management-page {
    min-height: calc(100vh - 90px);
    background: linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%);

    .page-header {
      margin-bottom: 16px;
      padding: 16px 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .title-group {
            h1 {
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: #303133;
              line-height: 1.4;
            }

            .page-desc {
              margin: 2px 0 0;
              font-size: 12px;
              color: #909399;
              line-height: 1.4;
            }
          }
        }

        .header-right {
          .cluster-selector {
            display: flex;
            align-items: center;
            gap: 10px;

            .selector-label {
              font-size: 13px;
              color: #606266;
              font-weight: 500;
            }
          }
        }
      }
    }

    .empty-state {
      .el-card {
        border-radius: 8px;
        border: none;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }

      .empty-content {
        padding: 60px 20px;
        text-align: center;

        .empty-icon {
          margin-bottom: 24px;
          opacity: 0.6;
          color: #409eff;
        }

        h2 {
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 500;
          color: #303133;
        }

        p {
          margin: 0 0 40px;
          font-size: 14px;
          color: #909399;
        }

        .feature-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;

          .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px;
            background: #f5f7fa;
            border-radius: 6px;
            transition: all 0.3s;
            color: #409eff;

            &:hover {
              background: #ecf5ff;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
            }

            span {
              font-size: 13px;
              color: #303133;
              font-weight: 500;
            }
          }
        }
      }
    }
  }

  :deep(.el-select-dropdown__item) {
    height: auto !important;
    padding: 6px 12px !important;

    .cluster-option-content {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;

      .cluster-name {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .cluster-tags {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }
    }

    &.selected {
      .cluster-option-content .cluster-name {
        color: #409eff;
      }
    }

    &:hover {
      background-color: #f5f7fa;
    }
  }
</style>