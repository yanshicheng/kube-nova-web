<template>
  <div class="node-management-page">
    <ElPageHeader @back="handleBack" class="page-header">
      <template #content>
        <div class="header-content">
          <h2>节点管理</h2>
          <ElBreadcrumb separator="/">
            <ElBreadcrumbItem :to="{ name: 'ClusterNode' }">节点列表</ElBreadcrumbItem>
            <ElBreadcrumbItem>{{ nodeDetail.name || nodeName || '-' }}</ElBreadcrumbItem>
          </ElBreadcrumb>
        </div>
      </template>
      <template #extra>
        <ElSpace>
          <ElButton :icon="Refresh" @click="refreshData" :loading="loading">刷新</ElButton>
          <ElButton @click="handleBack">返回列表</ElButton>
        </ElSpace>
      </template>
    </ElPageHeader>

    <ElCard class="node-info-card" shadow="never">
      <div class="node-header">
        <div class="node-icon">
          <ElIcon :size="32" :color="getStatusColor()">
            <Monitor
              v-if="nodeDetail.roles?.includes('master') || nodeDetail.roles?.includes('control')"
            />
            <Platform v-else />
          </ElIcon>
        </div>
        <div class="node-info">
          <h3>{{ nodeDetail.name || '-' }}</h3>
          <div class="node-meta">
            <span class="meta-item"
              ><ElIcon><Connection /></ElIcon>{{ nodeDetail.nodeIp || '-' }}</span
            >
            <ElTag :type="getRoleType()" size="small">
              {{
                nodeDetail.roles?.includes('master') || nodeDetail.roles?.includes('control')
                  ? 'Master'
                  : 'Worker'
              }}
            </ElTag>
            <ElBadge :is-dot="true" :type="getStatusType()">
              <span style="margin-left: 12px">{{ getStatusText() }}</span>
            </ElBadge>
            <ElTag :type="nodeDetail.unschedulable === 2 ? 'danger' : 'success'" size="small">
              {{ nodeDetail.unschedulable === 2 ? '禁止调度' : '允许调度' }}
            </ElTag>
          </div>
        </div>
      </div>
    </ElCard>

    <ElCard class="tabs-card" shadow="never">
      <ElTabs v-model="activeTab">
        <ElTabPane label="基本信息" name="basic">
          <BasicInfo :node-detail="nodeDetail" :node-id="nodeId" />
        </ElTabPane>
        <ElTabPane label="标签管理" name="labels" :lazy="true">
          <Labels
            :node-detail="nodeDetail"
            :node-id="nodeId"
            :active="activeTab === 'labels'"
            @refresh="refreshData"
          />
        </ElTabPane>
        <ElTabPane label="注解管理" name="annotations" :lazy="true">
          <Annotations
            :node-detail="nodeDetail"
            :node-id="nodeId"
            :active="activeTab === 'annotations'"
            @refresh="refreshData"
          />
        </ElTabPane>
        <ElTabPane label="污点管理" name="taints" :lazy="true">
          <Taints
            :node-detail="nodeDetail"
            :node-id="nodeId"
            :active="activeTab === 'taints'"
            @refresh="refreshData"
          />
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { Refresh, Connection, Platform, Monitor as MonitorIcon } from '@element-plus/icons-vue'
  import { getNodeDetailApi, type ClusterNodeDetail } from '@/api/manager/node'
  import BasicInfo from './tabs/BasicInfo.vue'
  import Labels from './tabs/Labels.vue'
  import Annotations from './tabs/Annotations.vue'
  import Taints from './tabs/Taints.vue'

  const Monitor = MonitorIcon
  const router = useRouter()
  const route = useRoute()

  const nodeName = computed(() => (route.params.nodeName as string) || '')
  const nodeId = computed(() => Number(route.query.nodeId) || 0)

  const loading = ref(false)
  const activeTab = ref('basic')
  const nodeDetail = ref<Partial<ClusterNodeDetail>>({})

  const getStatusColor = () =>
    ({ Ready: '#67c23a', NotReady: '#f56c6c', Unknown: '#e6a23c' })[
      nodeDetail.value.status || 'Unknown'
    ] || '#909399'
  const getStatusType = () =>
    ({ Ready: 'success', NotReady: 'danger', Unknown: 'warning' })[
      nodeDetail.value.status || 'Unknown'
    ] || 'info'
  const getStatusText = () =>
    ({ Ready: '就绪', NotReady: '未就绪', Unknown: '未知' })[
      nodeDetail.value.status || 'Unknown'
    ] || '未知'
  const getRoleType = () =>
    nodeDetail.value.roles?.includes('master') || nodeDetail.value.roles?.includes('control')
      ? 'danger'
      : 'info'

  const getNodeDetail = async () => {
    if (!nodeId.value) {
      handleBack()
      return
    }
    try {
      loading.value = true
      nodeDetail.value = await getNodeDetailApi(nodeId.value)
    } catch (error) {
      console.error('获取节点详情失败:', error)
    } finally {
      loading.value = false
    }
  }

  const refreshData = () => getNodeDetail()
  const handleBack = () => router.back()

  onMounted(() => {
    if (nodeId.value) getNodeDetail()
    else handleBack()
  })
</script>

<style lang="scss" scoped>
  .node-management-page {
    padding: 20px;
    min-height: 100vh;
    background: var(--el-fill-color-light);

    .page-header {
      background: white;
      padding: 16px 24px;
      border-radius: 8px;
      margin-bottom: 16px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      .header-content {
        h2 {
          margin: 0 0 8px;
          font-size: 20px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }
    }

    .node-info-card {
      margin-bottom: 16px;
      .node-header {
        display: flex;
        align-items: center;
        gap: 16px;
        .node-icon {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          background: var(--el-color-primary-light-9);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .node-info {
          flex: 1;
          h3 {
            margin: 0 0 8px;
            font-size: 18px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }
          .node-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            .meta-item {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 14px;
              color: var(--el-text-color-regular);
            }
          }
        }
      }
    }

    .tabs-card {
      :deep(.el-card__body) {
        padding: 0;
      }
      :deep(.el-tabs) {
        .el-tabs__header {
          margin: 0;
          padding: 0 20px;
          background: var(--el-fill-color-lighter);
        }
        .el-tabs__content {
          padding: 20px;
        }
      }
    }
  }
</style>
