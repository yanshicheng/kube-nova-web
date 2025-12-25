<template>
  <div class="monitoring-center-modern">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h3 class="page-title">
          <Activity :size="20" />
          监控中心
        </h3>
      </div>
      <div class="toolbar-right">
        <ElSelect
          v-model="selectedVersionId"
          placeholder="选择版本"
          style="width: 200px"
          :loading="loadingVersions"
          @change="handleVersionChange"
        >
          <ElOption
            v-for="version in versions"
            :key="version.id"
            :label="version.version"
            :value="version.id"
          />
        </ElSelect>
        <ElSelect
          v-model="selectedPodName"
          placeholder="选择Pod"
          style="width: 250px"
          :loading="loadingPods"
          @change="handlePodChange"
        >
          <ElOption v-for="pod in pods" :key="pod" :label="pod" :value="pod" />
        </ElSelect>
        <ElButton type="primary" :icon="Search" :loading="querying" @click="handleQuery"
          >查询</ElButton
        >
      </div>
    </div>

    <!-- 监控内容 -->
    <div v-if="selectedPodName && cluster" class="monitoring-content">
      <MonitoringPanel
        :cluster-uuid="clusterUuid"
        :namespace="namespace"
        :pod-name="selectedPodName"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <Activity :size="64" style="color: #dcdfe6; opacity: 0.5" />
      <p>请选择版本和Pod以查看监控数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Search, Activity } from 'lucide-vue-next'
  import {
    searchVersionApi,
    type OnecProjectApplication,
    type OnecProjectVersion,
    type ProjectCluster,
    type ProjectWorkspace
  } from '@/api'
  import MonitoringPanel from '../monitoring/MonitoringPanel.vue'

  interface Props {
    application: OnecProjectApplication
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
    refreshTrigger: number
  }

  const props = defineProps<Props>()

  const versions = ref<OnecProjectVersion[]>([])
  const selectedVersionId = ref<number | null>(null)
  const selectedPodName = ref<string>('')
  const pods = ref<string[]>([])
  const loadingVersions = ref(false)
  const loadingPods = ref(false)
  const querying = ref(false)

  const clusterUuid = computed(() => {
    return props.cluster?.clusterUuid || props.cluster?.uuid || ''
  })

  const namespace = computed(() => {
    return props.workspace?.namespace || 'default'
  })

  const loadVersions = async () => {
    loadingVersions.value = true
    try {
      const response = await searchVersionApi({
        applicationId: props.application.id
      })
      versions.value = response || []

      if (versions.value.length > 0) {
        selectedVersionId.value = versions.value[0].id
        await loadPods()
      }
    } catch (error) {
      console.error('加载版本失败:', error)
    } finally {
      loadingVersions.value = false
    }
  }

  const loadPods = async () => {
    if (!selectedVersionId.value) return

    loadingPods.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      pods.value = [
        `app-${selectedVersionId.value}-pod-1`,
        `app-${selectedVersionId.value}-pod-2`,
        `app-${selectedVersionId.value}-pod-3`
      ]

      if (pods.value.length > 0) {
        selectedPodName.value = pods.value[0]
      }
    } catch (error) {
      console.error('加载Pod失败:', error)
    } finally {
      loadingPods.value = false
    }
  }

  const handleVersionChange = () => {
    selectedPodName.value = ''
    loadPods()
  }

  const handlePodChange = () => {
    // Pod变化时自动刷新
  }

  const handleQuery = () => {
    if (!selectedPodName.value) {
      return
    }
    querying.value = true
    setTimeout(() => {
      ElMessage.success('刷新监控数据')
      querying.value = false
    }, 500)
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal > 0) {
        loadVersions()
      }
    }
  )

  onMounted(() => {
    loadVersions()
  })
</script>

<style lang="scss" scoped>
  .monitoring-center-modern {
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .toolbar-left {
        .page-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .monitoring-content {
      // MonitoringPanel 内部会有自己的样式
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      p {
        margin-top: 16px;
        font-size: 15px;
        color: #909399;
      }
    }
  }
</style>
