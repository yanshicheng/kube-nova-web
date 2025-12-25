<template>
  <div class="advanced-management-container">
    <div class="content-layout">
      <!-- 左侧 Tabs -->
      <div class="tabs-sidebar">
        <ElMenu :default-active="activeTab" @select="handleTabChange" class="config-menu">
          <ElMenuItem index="env">
            <Database :size="16" />
            <span>环境变量</span>
          </ElMenuItem>
          <ElMenuItem index="probes">
            <Activity :size="16" />
            <span>健康检查</span>
          </ElMenuItem>
          <ElMenuItem index="resources">
            <Cpu :size="16" />
            <span>资源配额</span>
          </ElMenuItem>
          <ElMenuItem index="scheduling">
            <Server :size="16" />
            <span>调度管理</span>
          </ElMenuItem>
          <ElMenuItem index="storage">
            <HardDrive :size="16" />
            <span>存储管理</span>
          </ElMenuItem>
        </ElMenu>
      </div>

      <!-- 右侧内容区 -->
      <div class="config-content">
        <!-- 环境变量 -->
        <div v-show="activeTab === 'env'" class="config-section">
          <EnvManagement
            v-if="loadedTabs.env"
            ref="envRef"
            :version="version"
            :workspace="workspace"
            :refresh-trigger="refreshTriggers.env"
          />
        </div>

        <!-- 健康检查 -->
        <div v-show="activeTab === 'probes'" class="config-section">
          <ProbesManagement
            v-if="loadedTabs.probes"
            ref="probesRef"
            :version="version"
            :refresh-trigger="refreshTriggers.probes"
          />
        </div>

        <!-- 资源配额 -->
        <div v-show="activeTab === 'resources'" class="config-section">
          <ResourceQuotaManagement
            v-if="loadedTabs.resources"
            ref="resourcesRef"
            :version="version"
            :refresh-trigger="refreshTriggers.resources"
          />
        </div>

        <!-- 调度管理 -->
        <div v-show="activeTab === 'scheduling'" class="config-section">
          <SchedulingManagement
            v-if="loadedTabs.scheduling"
            ref="schedulingRef"
            :version="version"
            :cluster="cluster"
            :workspace="workspace"
            :refresh-trigger="refreshTriggers.scheduling"
          />
        </div>

        <!-- 存储管理 -->
        <div v-show="activeTab === 'storage'" class="config-section">
          <StorageManagement
            v-if="loadedTabs.storage"
            ref="storageRef"
            :version="version"
            :refresh-trigger="refreshTriggers.storage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, nextTick } from 'vue'
  import { ElMessageBox } from 'element-plus'
  import { Database, Activity, Cpu, Server, HardDrive } from 'lucide-vue-next'
  import type { OnecProjectVersion, ProjectWorkspace, ProjectCluster } from '@/api'
  import EnvManagement from './advanced/EnvManagement.vue'
  import ProbesManagement from './advanced/ProbesManagement.vue'
  import ResourceQuotaManagement from './advanced/ResourceQuotaManagement.vue'
  import SchedulingManagement from './advanced/SchedulingManagement.vue'
  import StorageManagement from './advanced/StorageManagement.vue'

  interface Props {
    version: OnecProjectVersion
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
    refreshTrigger?: number
  }

  const props = defineProps<Props>()

  const activeTab = ref('env')
  const pendingTab = ref('env')

  // 为每个子组件创建 ref
  const envRef = ref<InstanceType<typeof EnvManagement>>()
  const probesRef = ref<InstanceType<typeof ProbesManagement>>()
  const resourcesRef = ref<InstanceType<typeof ResourceQuotaManagement>>()
  const schedulingRef = ref<InstanceType<typeof SchedulingManagement>>()
  const storageRef = ref<InstanceType<typeof StorageManagement>>()

  const loadedTabs = ref({
    env: false,
    probes: false,
    resources: false,
    scheduling: false,
    storage: false
  })

  const refreshTriggers = ref({
    env: 0,
    probes: 0,
    resources: 0,
    scheduling: 0,
    storage: 0
  })

  // 检查当前 tab 是否有未保存的修改
  const hasUnsavedChanges = (): boolean => {
    const currentTab = activeTab.value
    const refMap: Record<string, any> = {
      env: envRef.value,
      probes: probesRef.value,
      resources: resourcesRef.value,
      scheduling: schedulingRef.value,
      storage: storageRef.value
    }

    const currentRef = refMap[currentTab]

    // 检查子组件是否暴露了 hasUnsavedChanges 方法
    if (currentRef && typeof currentRef.hasUnsavedChanges === 'function') {
      return currentRef.hasUnsavedChanges()
    }

    // 兼容：直接检查 editing 状态
    if (currentRef && currentRef.editing === true) {
      return true
    }

    return false
  }

  // 重置当前 tab 的编辑状态
  const resetCurrentTab = async () => {
    const currentTab = activeTab.value
    const tab = currentTab as keyof typeof refreshTriggers.value

    if (tab in refreshTriggers.value) {
      refreshTriggers.value[tab]++
    }
  }

  // 切换 Tab 处理
  const handleTabChange = async (tabName: string) => {

    // 如果当前 tab 有未保存的修改，弹出确认对话框
    if (hasUnsavedChanges()) {
      try {
        await ElMessageBox.confirm(
          '当前有未保存的修改，切换标签页将丢失这些修改。是否继续？',
          '提示',
          {
            confirmButtonText: '继续切换',
            cancelButtonText: '取消',
            type: 'warning',
            distinguishCancelAndClose: true
          }
        )

        // 用户确认切换，重置当前 tab 数据
        await resetCurrentTab()
      } catch (error) {
        // 用户取消，阻止切换
        // 恢复到之前的 tab
        nextTick(() => {
          activeTab.value = pendingTab.value
        })
        return
      }
    }

    // 执行切换
    activeTab.value = tabName
    pendingTab.value = tabName
    const tab = tabName as keyof typeof loadedTabs.value

    // 只在首次点击时加载
    if (!loadedTabs.value[tab]) {
      loadedTabs.value[tab] = true

      // 首次加载时触发刷新
      nextTick(() => {
        if (tab in refreshTriggers.value) {
          refreshTriggers.value[tab]++
        }
      })
    }
  }

  // 监听 activeTab 变化，同步 pendingTab
  watch(activeTab, (newVal) => {
    if (newVal && !hasUnsavedChanges()) {
      pendingTab.value = newVal
    }
  })

  // 监听外部刷新触发
  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        const tab = activeTab.value as keyof typeof refreshTriggers.value
        if (tab in refreshTriggers.value) {
          refreshTriggers.value[tab]++
        }
      }
    }
  )

  // 组件挂载时自动加载当前 tab
  onMounted(() => {
    const tab = activeTab.value as keyof typeof loadedTabs.value
    if (!loadedTabs.value[tab]) {
      loadedTabs.value[tab] = true
      nextTick(() => {
        if (tab in refreshTriggers.value) {
          refreshTriggers.value[tab]++
        }
      })
    }

    // 初始化 pendingTab
    pendingTab.value = activeTab.value
  })
</script>

<style scoped lang="scss">
  .advanced-management-container {
    height: 100%;
    background: #fff;
    border-radius: 8px;

    .content-layout {
      display: flex;
      height: 100%;

      // 🎨 左侧 Tabs（参考 CronSchedule.vue 风格）
      .tabs-sidebar {
        width: 160px;
        border-right: 1px solid var(--el-border-color);
        padding: 20px 16px 20px 20px;
        flex-shrink: 0;

        .config-menu {
          border: none;

          :deep(.el-menu-item) {
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 6px;
            margin-bottom: 4px;
            height: 40px;
            padding: 0 12px;

            &:hover {
              background-color: #f5f7fa;
              color: var(--el-color-primary);
            }

            &.is-active {
              background-color: var(--el-color-primary-light-9);
              color: var(--el-color-primary);
              font-weight: 500;
            }

            span {
              font-size: 14px;
            }
          }
        }
      }

      // 🎨 右侧内容区
      .config-content {
        flex: 1;
        overflow-y: auto;
        background: #f5f7fa;

        .config-section {
          height: 100%;
          min-height: 900px;
        }
      }
    }
  }
</style>
