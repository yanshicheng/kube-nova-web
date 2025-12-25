<template>
  <div class="app-create-manager">
    <ElCard shadow="hover" class="header-card">
      <div class="header-content">
        <div class="header-left">
          <ElButton :icon="ArrowLeft" @click="handleBack" circle />
          <h2>创建工作负载</h2>
          <ElTag type="info">{{ currentNamespace }}</ElTag>
        </div>
      </div>
    </ElCard>

    <div class="resource-type-grid">
      <ElCard
        v-for="resource in resourceTypes"
        :key="resource.type"
        shadow="hover"
        class="resource-card"
        :class="{ selected: selectedType === resource.type }"
        @click="selectResourceType(resource.type)"
      >
        <div class="card-content">
          <div class="card-icon" :style="{ background: resource.gradient }">
            <component :is="resource.icon" :size="32" />
          </div>
          <div class="card-info">
            <h3 class="card-title">{{ resource.title }}</h3>
            <p class="card-description">{{ resource.description }}</p>
            <div class="card-features">
              <ElTag
                v-for="(feature, idx) in resource.features"
                :key="idx"
                size="small"
                effect="plain"
                type="info"
              >
                {{ feature }}
              </ElTag>
            </div>
          </div>
        </div>
      </ElCard>
    </div>

    <div class="action-footer">
      <ElButton @click="handleBack">取消</ElButton>
      <ElButton type="primary" :disabled="!selectedType" @click="handleConfirm" :loading="loading">
        <CheckCircle :size="16" style="margin-right: 4px" />
        确认创建
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import {
    ArrowLeft,
    CheckCircle,
    Box,
    Copy,
    Boxes,
    Clock,
    Calendar,
    Layers
  } from 'lucide-vue-next'

  interface ResourceType {
    type: string
    title: string
    description: string
    icon: any
    gradient: string
    features: string[]
    routeName: string
  }

  const router = useRouter()
  const route = useRoute()

  // 路由参数
  const resourceClusterId = ref<number>(0)
  const clusterUuid = ref<string>('')
  const workspaceId = ref<number>(0)
  const appProjectId = ref<number>(0)
  const currentNamespace = ref<string>('default')

  const selectedType = ref<string>('')
  const loading = ref(false)

  // ✅ 按照要求的顺序排列：Deployment → StatefulSet → DaemonSet → CronJob → Job → Pod
  const resourceTypes = ref<ResourceType[]>([
    {
      type: 'deployment',
      title: 'Deployment',
      description: '无状态应用部署，支持滚动更新和水平扩展',
      icon: Copy,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      features: ['无状态', '副本管理', '滚动更新'],
      routeName: 'CreateDeployment'
    },
    {
      type: 'statefulset',
      title: 'StatefulSet',
      description: '有状态应用部署，提供稳定的网络标识和持久化存储',
      icon: Boxes,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      features: ['有状态', '稳定标识', '持久存储'],
      routeName: 'CreateStatefulSet'
    },
    {
      type: 'daemonset',
      title: 'DaemonSet',
      description: '在每个节点上运行一个 Pod 副本，适合系统守护进程',
      icon: Layers,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      features: ['节点守护', '全节点部署', '日志/监控'],
      routeName: 'CreateDaemonSet'
    },
    {
      type: 'cronjob',
      title: 'CronJob',
      description: '定时任务，按照指定的时间表周期性运行',
      icon: Calendar,
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      features: ['定时执行', '周期性', 'Cron 表达式'],
      routeName: 'CreateCronJob'
    },
    {
      type: 'job',
      title: 'Job',
      description: '一次性任务，运行完成后自动退出',
      icon: Clock,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      features: ['一次性', '批处理', '任务完成退出'],
      routeName: 'CreateJob'
    },
    {
      type: 'pod',
      title: 'Pod',
      description: 'Kubernetes 最小的可部署单元，包含一个或多个容器',
      icon: Box,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      features: ['单实例', '适合测试', '快速部署'],
      routeName: 'CreatePod'
    }
  ])

  const validateAndInitParams = (): boolean => {
    const clusterId = Number(route.query.resourceClusterId) || 0
    const uuid = String(route.query.clusterUuid || '')
    const spaceId = Number(route.query.workspaceId) || 0
    const projectId = Number(route.query.appProjectId) || 0
    const ns = String(route.query.namespace || '')


    if (!clusterId || !uuid || !spaceId || !projectId || !ns) {
      console.error(
        '缺少必要参数，请检查 resourceClusterId, clusterUuid, workspaceId, appProjectId, namespace'
      )
      return false
    }

    resourceClusterId.value = clusterId
    clusterUuid.value = uuid
    workspaceId.value = spaceId
    appProjectId.value = projectId
    currentNamespace.value = ns

    return true
  }

  const selectResourceType = (type: string) => {
    selectedType.value = type
  }

  const handleConfirm = () => {
    if (!selectedType.value) {
      return
    }

    const resource = resourceTypes.value.find((r) => r.type === selectedType.value)
    if (!resource) {
      return
    }

    loading.value = true

    // 跳转到对应的创建页面（携带所有必要参数）
    router.push({
      name: resource.routeName,
      query: {
        resourceClusterId: resourceClusterId.value,
        clusterUuid: clusterUuid.value,
        workspaceId: workspaceId.value,
        appProjectId: appProjectId.value,
        namespace: currentNamespace.value,
        mode: 'createApp'
      }
    })
  }

  const handleBack = () => {
    router.back()
  }

  onMounted(() => {
    const paramsValid = validateAndInitParams()
    if (!paramsValid) {
      setTimeout(() => {
        router.back()
      }, 1500)
    }
  })
</script>

<style lang="scss" scoped>
  .app-create-manager {
    padding: 20px;

    .header-card {
      margin-bottom: 20px;

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;

          h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          }
        }
      }
    }

    .resource-type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 20px;

      .resource-card {
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 2px solid transparent;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        &.selected {
          border-color: #409eff;
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
        }

        .card-content {
          display: flex;
          gap: 16px;
          padding: 8px;

          .card-icon {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }

          .card-info {
            flex: 1;

            .card-title {
              margin: 0 0 8px;
              font-size: 18px;
              font-weight: 600;
              color: #303133;
            }

            .card-description {
              margin: 0 0 12px;
              font-size: 13px;
              color: #606266;
              line-height: 1.5;
            }

            .card-features {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }
          }
        }
      }
    }

    .action-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
    }
  }
</style>
