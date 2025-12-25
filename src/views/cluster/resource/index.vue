<!-- views/cluster/resource/index.vue -->
<template>
  <div class="cluster-resource-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <img src="/src/assets/img/cluster/kubernetes.png" alt="Kubernetes" class="k8s-logo" />
          <h1>集群资源管理</h1>
        </div>
        <p class="page-desc">管理和查看 Kubernetes 集群的各类资源对象</p>
      </div>

      <!-- 集群选择器 -->
      <div class="header-right">
        <div class="cluster-selector">
          <label class="selector-label">选择集群</label>
          <ElSelect
            v-model="selectedClusterId"
            placeholder="请选择或搜索集群"
            filterable
            clearable
            style="width: 320px"
            @change="handleClusterChange"
            @clear="handleClusterClear"
            :loading="clustersLoading"
            size="large"
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
          <ElButton :icon="RefreshCwIcon" @click="loadClusters" :loading="clustersLoading" circle />
        </div>
      </div>
    </div>

    <!-- 未选择集群提示 -->
    <div v-if="!selectedClusterId" class="empty-state">
      <ElCard shadow="never">
        <div class="empty-content">
          <img src="/src/assets/img/cluster/kubernetes.png" alt="" class="empty-icon" />
          <h2>欢迎使用集群资源管理</h2>
          <p>请先在上方选择一个集群，然后查看该集群的资源信息</p>
          <div class="feature-list">
            <div class="feature-item">
              <FileStackIcon :size="20" />
              <span>StorageClass - 存储类管理</span>
            </div>
            <div class="feature-item">
              <CoinsIcon :size="20" />
              <span>PersistentVolume - 持久卷管理</span>
            </div>
            <div class="feature-item">
              <UserIcon :size="20" />
              <span>ClusterRole - 集群角色管理</span>
            </div>
            <div class="feature-item">
              <LinkIcon :size="20" />
              <span>ClusterRoleBinding - 角色绑定管理</span>
            </div>
            <div class="feature-item">
              <NetworkIcon :size="20" />
              <span>IngressClass - 入口类管理</span>
            </div>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- 资源标签页 -->
    <div v-else class="resource-content">
      <ElCard shadow="never" class="resource-card">
        <!-- 集群信息栏 -->
        <div class="cluster-info-bar">
          <div class="info-item">
            <img src="/src/assets/img/cluster/kubernetes.png" alt="" class="info-k8s-icon" />
            <span class="info-label">当前集群：</span>
            <span class="info-value">{{ currentCluster?.name }}</span>
          </div>
          <ElDivider direction="vertical" />
          <div class="info-item">
            <span class="info-label">环境：</span>
            <ElTag :type="getEnvironmentType(currentCluster?.environment)" size="small">
              {{ currentCluster?.environment }}
            </ElTag>
          </div>
          <ElDivider direction="vertical" />
          <div class="info-item">
            <span class="info-label">版本：</span>
            <span class="info-value">{{ currentCluster?.version }}</span>
          </div>
          <ElDivider direction="vertical" />
          <div class="info-item">
            <span class="info-label">健康状态：</span>
            <ElTag :type="getHealthType(currentCluster?.healthStatus)" size="small">
              {{ getHealthText(currentCluster?.healthStatus) }}
            </ElTag>
          </div>
        </div>

        <!-- 资源标签页 -->
        <ElTabs v-model="activeTab" @tab-change="handleTabChange" class="resource-tabs">
          <ElTabPane name="storage-class" :lazy="true">
            <template #label>
              <span class="tab-label">
                <FileStackIcon :size="18" />
                StorageClass
              </span>
            </template>
            <StorageClassTab
              v-if="currentCluster?.uuid"
              ref="storageClassRef"
              :cluster-id="selectedClusterId!"
              :cluster-uuid="currentCluster.uuid"
              :active="activeTab === 'storage-class'"
              @refresh="handleTabRefresh"
            />
          </ElTabPane>

          <ElTabPane name="pv" :lazy="true">
            <template #label>
              <span class="tab-label">
                <CoinsIcon :size="18" />
                PersistentVolume
              </span>
            </template>
            <PersistentVolumeTab
              v-if="currentCluster?.uuid"
              ref="pvRef"
              :cluster-id="selectedClusterId!"
              :cluster-uuid="currentCluster.uuid"
              :active="activeTab === 'pv'"
              @refresh="handleTabRefresh"
            />
          </ElTabPane>

          <ElTabPane name="cluster-role" :lazy="true">
            <template #label>
              <span class="tab-label">
                <UserIcon :size="18" />
                ClusterRole
              </span>
            </template>
            <ClusterRoleTab
              v-if="currentCluster?.uuid"
              ref="clusterRoleRef"
              :cluster-id="selectedClusterId!"
              :cluster-uuid="currentCluster.uuid"
              :active="activeTab === 'cluster-role'"
              @refresh="handleTabRefresh"
            />
          </ElTabPane>

          <ElTabPane name="cluster-role-binding" :lazy="true">
            <template #label>
              <span class="tab-label">
                <LinkIcon :size="18" />
                ClusterRoleBinding
              </span>
            </template>
            <ClusterRoleBindingTab
              v-if="currentCluster?.uuid"
              ref="crbRef"
              :cluster-id="selectedClusterId!"
              :cluster-uuid="currentCluster.uuid"
              :active="activeTab === 'cluster-role-binding'"
              @refresh="handleTabRefresh"
            />
          </ElTabPane>

          <ElTabPane name="ingress-class" :lazy="true">
            <template #label>
              <span class="tab-label">
                <NetworkIcon :size="18" />
                IngressClass
              </span>
            </template>
            <IngressClassTab
              v-if="currentCluster?.uuid"
              ref="ingressClassRef"
              :cluster-id="selectedClusterId!"
              :cluster-uuid="currentCluster.uuid"
              :active="activeTab === 'ingress-class'"
              @refresh="handleTabRefresh"
            />
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    RefreshCw as RefreshCwIcon,
    FileStack as FileStackIcon,
    Coins as CoinsIcon,
    User as UserIcon,
    Link as LinkIcon,
    Network as NetworkIcon
  } from 'lucide-vue-next'
  import {
    searchClusterApi,
    getClusterDetailApi,
    type Cluster,
    type ClusterDetail
  } from '@/api/manager'

  // 导入子页面组件
  import StorageClassTab from './tabs/StorageClass/index.vue'
  import PersistentVolumeTab from './tabs/PersistentVolume/index.vue'
  import ClusterRoleTab from './tabs/ClusterRole/index.vue'
  import ClusterRoleBindingTab from './tabs/ClusterRoleBinding/index.vue'
  import IngressClassTab from './tabs/IngressClass/index.vue'

  defineOptions({ name: 'ClusterResource' })

  // 本地存储的 key
  const STORAGE_KEY_CLUSTER = 'cluster-resource-selected-cluster'
  const STORAGE_KEY_TAB = 'cluster-resource-active-tab'

  // 工具函数:从 localStorage 加载
  function loadFromStorage(key: string): number | string | null {
    try {
      const value = localStorage.getItem(key)
      return value || null
    } catch (error) {
      console.error('加载存储失败:', error)
      return null
    }
  }

  // 工具函数:保存到 localStorage
  function saveToStorage(key: string, value: number | string | null) {
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

  // 状态管理
  const selectedClusterId = ref<number | null>(null)
  const clusters = ref<Cluster[]>([])
  const currentCluster = ref<ClusterDetail | null>(null)
  const clustersLoading = ref(false)
  const activeTab = ref('storage-class')

  // Tab 组件引用
  const storageClassRef = ref()
  const pvRef = ref()
  const clusterRoleRef = ref()
  const crbRef = ref()
  const ingressClassRef = ref()

  // 记录每个 Tab 的上次激活时间
  const tabLastActiveTime = ref<Record<string, number>>({})

  // 获取集群列表
  const loadClusters = async () => {
    try {
      clustersLoading.value = true
      const response = await searchClusterApi({ pageSize: 200 })
      clusters.value = response.items || []

      // 恢复之前选择的集群
      const savedClusterId = loadFromStorage(STORAGE_KEY_CLUSTER)
      if (savedClusterId) {
        const clusterId = Number(savedClusterId)
        const cluster = clusters.value.find((c) => c.id === clusterId)
        if (cluster) {
          selectedClusterId.value = clusterId
          await getClusterDetail(clusterId)

          // 恢复之前的标签页
          const savedTab = loadFromStorage(STORAGE_KEY_TAB)
          if (savedTab && typeof savedTab === 'string') {
            activeTab.value = savedTab
          }
        } else {
          // 缓存的集群不存在,清空
          console.warn('缓存的集群不存在,清空选择')
          saveToStorage(STORAGE_KEY_CLUSTER, null)
          saveToStorage(STORAGE_KEY_TAB, null)
        }
      }
    } catch (error) {
      console.error('获取集群列表失败:', error)
    } finally {
      clustersLoading.value = false
    }
  }

  // 获取集群详情（包含UUID）
  const getClusterDetail = async (clusterId: number) => {
    try {
      const detail = await getClusterDetailApi(clusterId)
      currentCluster.value = detail
    } catch (error) {
      console.error('获取集群详情失败:', error)
      currentCluster.value = null
    }
  }

  // 处理集群选择变化
  const handleClusterChange = async (clusterId: number | null) => {
    console.log('集群切换:', clusterId)

    // 保存到存储
    saveToStorage(STORAGE_KEY_CLUSTER, clusterId)

    if (clusterId) {
      await getClusterDetail(clusterId)
      // 重置到第一个标签页
      activeTab.value = 'storage-class'
      saveToStorage(STORAGE_KEY_TAB, 'storage-class')
      // 清空 Tab 激活时间记录
      tabLastActiveTime.value = {}
    } else {
      currentCluster.value = null
      // 清除标签页存储
      saveToStorage(STORAGE_KEY_TAB, null)
    }
  }

  // 处理集群清空
  const handleClusterClear = () => {
    console.log('清空集群')

    currentCluster.value = null
    activeTab.value = 'storage-class'

    // 清除存储
    saveToStorage(STORAGE_KEY_CLUSTER, null)
    saveToStorage(STORAGE_KEY_TAB, null)
    tabLastActiveTime.value = {}
  }

  // 处理标签页切换
  const handleTabChange = (tabName: string) => {
    console.log('标签页切换:', tabName)

    // 保存当前标签页
    saveToStorage(STORAGE_KEY_TAB, tabName)

    // 记录激活时间，触发子组件刷新
    tabLastActiveTime.value[tabName] = Date.now()
  }

  // 处理子组件刷新请求
  const handleTabRefresh = (tabName: string) => {
    console.log('Tab 请求刷新:', tabName)
  }

  // 获取环境类型
  const getEnvironmentType = (env?: string) => {
    const envMap: Record<string, string> = {
      production: 'danger',
      staging: 'warning',
      testing: 'info',
      development: 'success'
    }
    return envMap[env || ''] || 'info'
  }

  // 获取状态类型
  const getStatusType = (status?: number) => {
    const statusMap: Record<number, string> = {
      1: 'warning',
      2: 'danger',
      3: 'success'
    }
    return statusMap[status || 0] || 'info'
  }

  // 获取状态文本
  const getStatusText = (status?: number) => {
    const statusMap: Record<number, string> = {
      1: '同步中',
      2: '同步异常',
      3: '同步正常'
    }
    return statusMap[status || 0] || '未知'
  }

  // 获取健康状态类型
  const getHealthType = (health?: number) => {
    const healthMap: Record<number, string> = {
      1: 'success',
      2: 'danger',
      3: 'warning',
      4: 'info'
    }
    return healthMap[health || 0] || 'info'
  }

  // 获取健康状态文本
  const getHealthText = (health?: number) => {
    const healthMap: Record<number, string> = {
      1: '健康',
      2: '不健康',
      3: '降级',
      4: '未知'
    }
    return healthMap[health || 0] || '未知'
  }

  // 初始化
  onMounted(() => {
    loadClusters()
  })
</script>

<style lang="scss" scoped>
  .cluster-resource-page {
    //padding: 20px;
    min-height: calc(100vh - 90px);
    background: linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%);

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      .header-left {
        .page-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .k8s-logo {
            width: 40px;
            height: 40px;
          }

          h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #303133;
          }
        }

        .page-desc {
          margin: 0;
          font-size: 14px;
          color: #606266;
          padding-left: 52px;
        }
      }

      .header-right {
        .cluster-selector {
          display: flex;
          align-items: center;
          gap: 12px;

          .selector-label {
            font-size: 14px;
            color: #606266;
            font-weight: 500;
          }
        }
      }
    }

    .empty-state {
      .el-card {
        border-radius: 12px;
        border: none;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }

      .empty-content {
        padding: 60px 20px;
        text-align: center;

        .empty-icon {
          width: 120px;
          height: 120px;
          margin-bottom: 24px;
          opacity: 0.8;
        }

        h2 {
          margin: 0 0 12px;
          font-size: 24px;
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
          gap: 20px;
          max-width: 800px;
          margin: 0 auto;

          .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 16px;
            background: #f5f7fa;
            border-radius: 8px;
            transition: all 0.3s;
            color: #409eff;

            &:hover {
              background: #ecf5ff;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
            }

            span {
              font-size: 14px;
              color: #303133;
              font-weight: 500;
            }
          }
        }
      }
    }

    .resource-content {
      .resource-card {
        border-radius: 12px;
        border: none;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

        .cluster-info-bar {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(90deg, #f0f9ff 0%, #f5f7fa 100%);
          border-radius: 8px;
          margin-bottom: 20px;

          .info-item {
            display: flex;
            align-items: center;
            gap: 8px;

            .info-k8s-icon {
              width: 16px;
              height: 16px;
            }

            .info-label {
              font-size: 14px;
              color: #909399;
            }

            .info-value {
              font-size: 14px;
              color: #303133;
              font-weight: 500;
            }
          }

          :deep(.el-divider--vertical) {
            height: 20px;
            margin: 0 16px;
          }
        }

        .resource-tabs {
          :deep(.el-tabs__header) {
            margin-bottom: 20px;

            .el-tabs__nav-wrap::after {
              height: 1px;
              background: #e4e7ed;
            }

            .el-tabs__active-bar {
              height: 3px;
              background: linear-gradient(90deg, #409eff, #667eea);
            }

            .el-tabs__item {
              padding: 0 20px;
              height: 48px;
              line-height: 48px;

              .tab-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 15px;
              }

              &.is-active .tab-label {
                color: #409eff;
                font-weight: 500;
              }
            }
          }
        }
      }
    }
  }

  // 集群选择器下拉框样式
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
        font-size: 14px;
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

        .el-tag {
          height: 20px;
          line-height: 18px;
        }
      }
    }

    &.selected {
      .cluster-option-content {
        .cluster-name {
          color: #409eff;
        }
      }
    }

    &:hover {
      background-color: #f5f7fa;
    }
  }
</style>
