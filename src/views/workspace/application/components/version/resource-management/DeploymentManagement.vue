<template>
  <div class="deployment-management-full">
    <ElCard class="management-card">
      <ElTabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- Pod管理 - 所有版本都可以访问 -->
        <ElTabPane label="Pod管理" name="pods">
          <PodsManagement
            v-if="loadedTabs.pods"
            :version="version"
            :application="application"
            :cluster="cluster"
            :workspace="workspace"
            :refresh-trigger="refreshTriggers.pods"
          />
        </ElTabPane>

        <!-- 副本管理 - 仅 stable 版本可访问 -->
        <ElTabPane label="副本管理" name="scale">
          <ScaleManagement
            v-if="loadedTabs.scale && isStableVersion"
            :version="version"
            :application="application"
            :cluster="cluster"
            :workspace="workspace"
            :refresh-trigger="refreshTriggers.scale"
            @success="handleSuccess"
          />
          <!-- 🔥 非stable版本显示提示 -->
          <div v-else-if="!isStableVersion" class="permission-tip">
            <ElEmpty description="当前版本无权限操作" :image-size="120">
              <template #description>
                <div class="tip-content">
                  <p class="tip-title">⚠️ 权限不足</p>
                  <p class="tip-desc">{{ getVersionTipMessage() }}</p>
                  <p class="tip-hint">请切换到稳定版本进行操作</p>
                </div>
              </template>
            </ElEmpty>
          </div>
        </ElTabPane>

        <!-- 更新管理 - 仅 stable 版本可访问 -->
        <ElTabPane label="更新管理" name="update">
          <UpdateManagement
            v-if="loadedTabs.update && isStableVersion"
            :version="version"
            :application="application"
            :cluster="cluster"
            :workspace="workspace"
            :refresh-trigger="refreshTriggers.update"
            @success="handleSuccess"
          />
          <!-- 🔥 非stable版本显示提示 -->
          <div v-else-if="!isStableVersion" class="permission-tip">
            <ElEmpty description="当前版本无权限操作" :image-size="120">
              <template #description>
                <div class="tip-content">
                  <p class="tip-title">⚠️ 权限不足</p>
                  <p class="tip-desc">{{ getVersionTipMessage() }}</p>
                  <p class="tip-hint">请切换到稳定版本进行操作</p>
                </div>
              </template>
            </ElEmpty>
          </div>
        </ElTabPane>

        <!-- 高级管理 - 仅 stable 版本可访问 -->
        <ElTabPane label="高级管理" name="advanced">
          <AdvancedManagement
            v-if="loadedTabs.advanced && isStableVersion"
            :version="version"
            :cluster="cluster"
            :workspace="workspace"
            :refresh-trigger="refreshTriggers.advanced"
            @success="handleSuccess"
          />
          <!-- 🔥 非stable版本显示提示 -->
          <div v-else-if="!isStableVersion" class="permission-tip">
            <ElEmpty description="当前版本无权限操作" :image-size="120">
              <template #description>
                <div class="tip-content">
                  <p class="tip-title">⚠️ 权限不足</p>
                  <p class="tip-desc">{{ getVersionTipMessage() }}</p>
                  <p class="tip-hint">请切换到稳定版本进行操作</p>
                </div>
              </template>
            </ElEmpty>
          </div>
        </ElTabPane>

        <!-- 事件管理 - 所有版本都可以访问 -->
        <ElTabPane label="事件管理" name="events">
          <EventsManagement
            v-if="loadedTabs.events"
            :version="version"
            :refresh-trigger="refreshTriggers.events"
          />
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import type {
    OnecProjectApplication,
    OnecProjectVersion,
    ProjectCluster,
    ProjectWorkspace
  } from '@/api'
  import PodsManagement from '../tabs/common/PodsManagement.vue'
  import ScaleManagement from '../tabs/common/ScaleManagement.vue'
  import UpdateManagement from '../tabs/common/UpdateManagement.vue'
  import AdvancedManagement from '../tabs/common/AdvancedManagement.vue'
  import EventsManagement from '../tabs/common/EventsManagement.vue'

  interface Props {
    version: OnecProjectVersion
    application: OnecProjectApplication
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ refresh: [] }>()

  const activeTab = ref('pods')
  const loadedTabs = ref({
    pods: false,
    scale: false,
    update: false,
    advanced: false,
    events: false
  })
  const refreshTriggers = ref({
    pods: 0,
    scale: 0,
    update: 0,
    advanced: 0,
    events: 0
  })

  const isInitialized = ref(false)

  // 🔥 判断是否为 stable 版本
  const isStableVersion = computed(() => {
    return props.version.versionRole === 'stable'
  })

  // 🔥 受限的 tabs（仅 stable 版本可访问）
  const restrictedTabs = ['scale', 'update', 'advanced']

  // 🔥 获取版本角色提示信息
  const getVersionTipMessage = () => {
    const roleMessages: Record<string, string> = {
      primary: '当前为 Flagger 管理的金丝雀主版本，无法直接操作副本、更新和高级管理功能',
      canary: '当前为金丝雀测试版本，无法直接操作副本、更新和高级管理功能',
      blue: '当前为蓝绿发布的蓝版本，无法直接操作副本、更新和高级管理功能',
      green: '当前为蓝绿发布的绿版本，无法直接操作副本、更新和高级管理功能'
    }
    return roleMessages[props.version.versionRole || ''] || '当前版本无法操作此功能'
  }

  const handleSuccess = () => {
    emit('refresh')
  }

  const handleTabChange = (tabName: string) => {
    const tab = tabName as keyof typeof loadedTabs.value

    // 🔥 移除点击检查逻辑，改为通过 v-if 控制内容显示
    // 标记为已加载（用于 v-if 懒加载）
    if (!loadedTabs.value[tab]) {
      loadedTabs.value[tab] = true
    }

    // 触发刷新
    nextTick(() => {
      if (tab in refreshTriggers.value) {
        refreshTriggers.value[tab]++
      }
    })
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0 && isInitialized.value) {
        const tab = activeTab.value as keyof typeof refreshTriggers.value
        if (tab in refreshTriggers.value) {
          refreshTriggers.value[tab]++
        }
      }
    }
  )

  onMounted(() => {
    // 首次显示时自动触发当前 tab 的加载
    const tab = activeTab.value as keyof typeof loadedTabs.value
    if (!loadedTabs.value[tab]) {
      loadedTabs.value[tab] = true

      nextTick(() => {
        if (tab in refreshTriggers.value) {
          refreshTriggers.value[tab]++
        }

        nextTick(() => {
          isInitialized.value = true
        })
      })
    }
  })
</script>

<style lang="scss" scoped>
  .permission-tip {
    padding: 60px 20px;
    background: #fafbfc;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;

    .tip-content {
      text-align: center;

      .tip-title {
        font-size: 18px;
        font-weight: 600;
        color: #e6a23c;
        margin: 0 0 12px 0;
      }

      .tip-desc {
        font-size: 14px;
        color: #606266;
        margin: 0 0 8px 0;
        line-height: 1.6;
      }

      .tip-hint {
        font-size: 13px;
        color: #909399;
        margin: 0;
      }
    }
  }
</style>
