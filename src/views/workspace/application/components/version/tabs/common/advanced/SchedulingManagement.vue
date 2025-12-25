<template>
  <div class="scheduling-management">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <ElButton v-if="!editing" type="primary" @click="startEdit">
        <Edit :size="16" />
        编辑配置
      </ElButton>
      <template v-else>
        <ElButton type="primary" :loading="saving" @click="handleSave">保存配置</ElButton>
        <ElButton @click="handleCancel">取消</ElButton>
      </template>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" v-loading="loading" class="loading-wrapper"></div>

    <!-- 主内容区 -->
    <div v-else class="content-wrapper">
      <!-- 使用 Radio 切换分类 -->
      <div class="category-selector">
        <ElRadioGroup
          v-model="activeCategory"
          class="category-radio-group"
          @change="handleCategoryChange"
        >
          <ElRadioButton
            v-for="cat in categories"
            :key="cat.key"
            :value="cat.key"
            class="category-radio-btn"
          >
            <div class="radio-content">
              <component :is="cat.icon" :size="16" />
              <span>{{ cat.label }}</span>
              <ElBadge
                v-if="getCategoryBadge(cat.key) > 0"
                :value="getCategoryBadge(cat.key)"
                :max="99"
              />
            </div>
          </ElRadioButton>
        </ElRadioGroup>
      </div>

      <!-- 内容区域 -->
      <div class="config-content">
        <!-- 主机调度 -->
        <div v-show="activeCategory === 'host'" class="config-section">
          <HostSchedulingConfig
            :editing="editing"
            :version="version"
            :cluster="cluster"
            :workspace="workspace"
            v-model:mode="hostSchedulingMode"
            v-model:node-name="nodeName"
            v-model:node-selector="nodeSelector"
            v-model:node-affinity-required="nodeAffinityRequired"
            v-model:node-affinity-preferred="nodeAffinityPreferred"
          />
        </div>

        <!-- 容忍配置 -->
        <div v-show="activeCategory === 'toleration'" class="config-section">
          <TolerationConfig :editing="editing" v-model:tolerations="tolerations" />
        </div>

        <!-- 服务亲和性 -->
        <div v-show="activeCategory === 'service-affinity'" class="config-section">
          <ServiceAffinityConfig
            :editing="editing"
            :version="version"
            :cluster="cluster"
            :workspace="workspace"
            v-model:pod-affinity="podAffinity"
            v-model:pod-anti-affinity="podAntiAffinity"
          />
        </div>

        <!-- 服务内亲和性 -->
        <div v-show="activeCategory === 'self-affinity'" class="config-section">
          <SelfAffinityConfig
            :editing="editing"
            :version="version"
            v-model:self-affinity="selfAffinity"
            v-model:self-anti-affinity="selfAntiAffinity"
          />
        </div>

        <!-- 拓扑分布 -->
        <div v-show="activeCategory === 'topology'" class="config-section">
          <TopologySpreadConfig
            :editing="editing"
            v-model:constraints="topologySpreadConstraints"
          />
        </div>

        <!-- 高级配置 -->
        <div v-show="activeCategory === 'advanced'" class="config-section">
          <AdvancedConfig
            :editing="editing"
            v-model:scheduler-name="schedulerName"
            v-model:priority-class="priorityClassName"
            v-model:priority="priority"
            v-model:runtime-class="runtimeClassName"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Server, Shield, Users, Layers, Settings, Edit, Globe } from 'lucide-vue-next'
  import {
    getSchedulingConfigApi,
    updateSchedulingConfigApi,
    type OnecProjectVersion,
    type ProjectCluster,
    type ProjectWorkspace,
    type SchedulingConfig,
    type UpdateSchedulingConfigRequest
  } from '@/api'

  import HostSchedulingConfig from './scheduling/HostSchedulingConfig.vue'
  import TolerationConfig from './scheduling/TolerationConfig.vue'
  import ServiceAffinityConfig from './scheduling/ServiceAffinityConfig.vue'
  import SelfAffinityConfig from './scheduling/SelfAffinityConfig.vue'
  import TopologySpreadConfig from './scheduling/TopologySpreadConfig.vue'
  import AdvancedConfig from './scheduling/AdvancedConfig.vue'

  interface Props {
    version: OnecProjectVersion
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  const loading = ref(false)
  const saving = ref(false)
  const editing = ref(false)
  const activeCategory = ref('host')
  const pendingCategory = ref('')

  const categories = [
    { key: 'host', label: '主机调度', icon: Server },
    { key: 'toleration', label: '容忍配置', icon: Shield },
    { key: 'service-affinity', label: '服务亲和性', icon: Users },
    { key: 'self-affinity', label: '服务内亲和性', icon: Globe },
    { key: 'topology', label: '拓扑分布', icon: Layers },
    { key: 'advanced', label: '高级配置', icon: Settings }
  ]

  // 主机调度配置
  const hostSchedulingMode = ref<'auto' | 'nodeName' | 'nodeSelector' | 'nodeAffinity'>('auto')
  const nodeName = ref('')
  const nodeSelector = ref<Record<string, string>>({})
  const nodeAffinityRequired = ref<any[]>([])
  const nodeAffinityPreferred = ref<any[]>([])

  // 容忍配置
  const tolerations = ref<any[]>([])

  // 服务亲和性配置
  const podAffinity = ref<any[]>([])
  const podAntiAffinity = ref<any[]>([])

  // 服务内亲和性配置
  const selfAffinity = ref<any[]>([])
  const selfAntiAffinity = ref<any[]>([])

  // 拓扑分布配置
  const topologySpreadConstraints = ref<any[]>([])

  // 高级配置
  const schedulerName = ref('')
  const priorityClassName = ref('')
  const priority = ref(0)
  const runtimeClassName = ref('')

  const originalConfig = ref<SchedulingConfig | null>(null)

  const getCategoryBadge = (key: string): number => {
    switch (key) {
      case 'host':
        if (hostSchedulingMode.value === 'nodeName' && nodeName.value) return 1
        if (
          hostSchedulingMode.value === 'nodeSelector' &&
          Object.keys(nodeSelector.value).length > 0
        ) {
          return Object.keys(nodeSelector.value).length
        }
        if (hostSchedulingMode.value === 'nodeAffinity') {
          return nodeAffinityRequired.value.length + nodeAffinityPreferred.value.length
        }
        return 0
      case 'toleration':
        return tolerations.value.length
      case 'service-affinity':
        return podAffinity.value.length + podAntiAffinity.value.length
      case 'self-affinity':
        return selfAffinity.value.length + selfAntiAffinity.value.length
      case 'topology':
        return topologySpreadConstraints.value.length
      case 'advanced':
        let count = 0
        if (schedulerName.value) count++
        if (priorityClassName.value) count++
        if (priority.value > 0) count++
        if (runtimeClassName.value) count++
        return count
      default:
        return 0
    }
  }

  // 检查是否有未保存的修改
  const hasUnsavedChanges = (): boolean => {
    if (!editing.value || !originalConfig.value) return false

    const current = JSON.stringify({
      hostSchedulingMode: hostSchedulingMode.value,
      nodeName: nodeName.value,
      nodeSelector: nodeSelector.value,
      nodeAffinityRequired: nodeAffinityRequired.value,
      nodeAffinityPreferred: nodeAffinityPreferred.value,
      tolerations: tolerations.value,
      podAffinity: podAffinity.value,
      podAntiAffinity: podAntiAffinity.value,
      selfAffinity: selfAffinity.value,
      selfAntiAffinity: selfAntiAffinity.value,
      topologySpreadConstraints: topologySpreadConstraints.value,
      schedulerName: schedulerName.value,
      priorityClassName: priorityClassName.value,
      priority: priority.value,
      runtimeClassName: runtimeClassName.value
    })

    const original = JSON.stringify(originalConfig.value)

    return current !== original
  }

  // 处理分类切换
  const handleCategoryChange = async (newCategory: string) => {
    if (hasUnsavedChanges()) {
      try {
        await ElMessageBox.confirm(
          '当前有未保存的修改，切换分类将丢失这些修改。是否继续？',
          '提示',
          {
            confirmButtonText: '继续切换',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        // 用户确认切换，恢复原始数据
        if (originalConfig.value) {
          await loadConfig()
        }
      } catch {
        // 用户取消，恢复到之前的分类
        activeCategory.value = pendingCategory.value
        return
      }
    }
    pendingCategory.value = newCategory
  }

  // 监听分类变化，保存当前分类
  watch(activeCategory, (newVal) => {
    if (newVal && !hasUnsavedChanges()) {
      pendingCategory.value = newVal
    }
  })

  const loadConfig = async () => {
    loading.value = true
    try {
      const response = await getSchedulingConfigApi(props.version.id)

      // 解析主机调度模式
      if (response.nodeName) {
        hostSchedulingMode.value = 'nodeName'
        nodeName.value = response.nodeName
      } else if (response.nodeSelector && Object.keys(response.nodeSelector).length > 0) {
        hostSchedulingMode.value = 'nodeSelector'
        nodeSelector.value = response.nodeSelector
      } else if (response.affinity?.nodeAffinity) {
        hostSchedulingMode.value = 'nodeAffinity'
        parseNodeAffinity(response.affinity.nodeAffinity)
      } else {
        hostSchedulingMode.value = 'auto'
      }

      // 解析容忍配置
      tolerations.value = (response.tolerations || []).map((t) => ({
        key: t.key || '',
        operator: t.operator || 'Equal',
        value: t.value || '',
        effect: t.effect || 'NoSchedule',
        tolerationSeconds: t.tolerationSeconds
      }))

      // 解析Pod亲和性
      if (response.affinity?.podAffinity) {
        parsePodAffinity(response.affinity.podAffinity, 'affinity')
      }
      if (response.affinity?.podAntiAffinity) {
        parsePodAffinity(response.affinity.podAntiAffinity, 'antiAffinity')
      }

      // 解析拓扑分布
      topologySpreadConstraints.value = response.topologySpreadConstraints || []

      // 解析高级配置
      schedulerName.value = response.schedulerName || ''
      priorityClassName.value = response.priorityClassName || ''
      priority.value = response.priority || 0
      runtimeClassName.value = response.runtimeClassName || ''

      // 保存原始配置用于对比
      originalConfig.value = {
        hostSchedulingMode: hostSchedulingMode.value,
        nodeName: nodeName.value,
        nodeSelector: JSON.parse(JSON.stringify(nodeSelector.value)),
        nodeAffinityRequired: JSON.parse(JSON.stringify(nodeAffinityRequired.value)),
        nodeAffinityPreferred: JSON.parse(JSON.stringify(nodeAffinityPreferred.value)),
        tolerations: JSON.parse(JSON.stringify(tolerations.value)),
        podAffinity: JSON.parse(JSON.stringify(podAffinity.value)),
        podAntiAffinity: JSON.parse(JSON.stringify(podAntiAffinity.value)),
        selfAffinity: JSON.parse(JSON.stringify(selfAffinity.value)),
        selfAntiAffinity: JSON.parse(JSON.stringify(selfAntiAffinity.value)),
        topologySpreadConstraints: JSON.parse(JSON.stringify(topologySpreadConstraints.value)),
        schedulerName: schedulerName.value,
        priorityClassName: priorityClassName.value,
        priority: priority.value,
        runtimeClassName: runtimeClassName.value
      } as any

    } catch (error) {
      console.error('[调度管理] 加载失败:', error)
    } finally {
      loading.value = false
    }
  }

  const parseNodeAffinity = (nodeAffinity: any) => {
    if (nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
      const required = nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution
      if (required.nodeSelectorTerms) {
        nodeAffinityRequired.value = required.nodeSelectorTerms.flatMap((term: any) =>
          (term.matchExpressions || []).map((expr: any) => ({
            key: expr.key || '',
            operator: expr.operator || 'In',
            values: (expr.values || []).join(',')
          }))
        )
      }
    }

    if (nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
      nodeAffinityPreferred.value =
        nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution.flatMap((item: any) =>
          (item.preference?.matchExpressions || []).map((expr: any) => ({
            weight: item.weight || 50,
            key: expr.key || '',
            operator: expr.operator || 'In',
            values: (expr.values || []).join(',')
          }))
        )
    }
  }

  const parsePodAffinity = (affinity: any, type: 'affinity' | 'antiAffinity') => {
    const required = affinity.requiredDuringSchedulingIgnoredDuringExecution || []
    const preferred = affinity.preferredDuringSchedulingIgnoredDuringExecution || []

    const rules = [
      ...required.map((term: any) => ({
        type: 'required',
        labelSelector: term.labelSelector?.matchLabels || {},
        topologyKey: term.topologyKey || 'kubernetes.io/hostname',
        namespaces: term.namespaces || []
      })),
      ...preferred.map((item: any) => ({
        type: 'preferred',
        weight: item.weight || 50,
        labelSelector: item.podAffinityTerm?.labelSelector?.matchLabels || {},
        topologyKey: item.podAffinityTerm?.topologyKey || 'kubernetes.io/hostname',
        namespaces: item.podAffinityTerm?.namespaces || []
      }))
    ]

    if (type === 'affinity') {
      podAffinity.value = rules
    } else {
      podAntiAffinity.value = rules
    }
  }

  const startEdit = () => {
    editing.value = true
  }

  const handleSave = async () => {
    try {
      await ElMessageBox.confirm('确定要保存调度配置吗？', '确认保存', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      saving.value = true

      const data: UpdateSchedulingConfigRequest = {}

      // 主机调度配置
      if (hostSchedulingMode.value === 'nodeName') {
        if (!nodeName.value) {
          saving.value = false
          return
        }
        data.nodeName = nodeName.value
      } else if (hostSchedulingMode.value === 'nodeSelector') {
        if (Object.keys(nodeSelector.value).length === 0) {
          saving.value = false
          return
        }
        data.nodeSelector = nodeSelector.value
      } else if (hostSchedulingMode.value === 'nodeAffinity') {
        data.affinity = data.affinity || {}
        data.affinity.nodeAffinity = buildNodeAffinity()
      }

      // 容忍配置
      if (tolerations.value.length > 0) {
        data.tolerations = tolerations.value.map((t) => ({
          key: t.key,
          operator: t.operator,
          value: t.value,
          effect: t.effect,
          ...(t.tolerationSeconds ? { tolerationSeconds: t.tolerationSeconds } : {})
        }))
      }

      // Pod亲和性配置
      if (podAffinity.value.length > 0 || podAntiAffinity.value.length > 0) {
        data.affinity = data.affinity || {}
        if (podAffinity.value.length > 0) {
          data.affinity.podAffinity = buildPodAffinity(podAffinity.value)
        }
        if (podAntiAffinity.value.length > 0) {
          data.affinity.podAntiAffinity = buildPodAffinity(podAntiAffinity.value)
        }
      }

      // 服务内亲和性
      if (selfAffinity.value.length > 0 || selfAntiAffinity.value.length > 0) {
        data.affinity = data.affinity || {}

        if (selfAffinity.value.length > 0) {
          const selfAffinityData = buildSelfAffinity(selfAffinity.value)
          if (data.affinity.podAffinity) {
            data.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution = [
              ...(data.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution || []),
              ...(selfAffinityData.requiredDuringSchedulingIgnoredDuringExecution || [])
            ]
            data.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution = [
              ...(data.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution || []),
              ...(selfAffinityData.preferredDuringSchedulingIgnoredDuringExecution || [])
            ]
          } else {
            data.affinity.podAffinity = selfAffinityData
          }
        }

        if (selfAntiAffinity.value.length > 0) {
          const selfAntiAffinityData = buildSelfAffinity(selfAntiAffinity.value)
          if (data.affinity.podAntiAffinity) {
            data.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution = [
              ...(data.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution ||
                []),
              ...(selfAntiAffinityData.requiredDuringSchedulingIgnoredDuringExecution || [])
            ]
            data.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution = [
              ...(data.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution ||
                []),
              ...(selfAntiAffinityData.preferredDuringSchedulingIgnoredDuringExecution || [])
            ]
          } else {
            data.affinity.podAntiAffinity = selfAntiAffinityData
          }
        }
      }

      // 拓扑分布配置
      if (topologySpreadConstraints.value.length > 0) {
        data.topologySpreadConstraints = topologySpreadConstraints.value
      }

      // 高级配置
      if (schedulerName.value) data.schedulerName = schedulerName.value
      if (priorityClassName.value) data.priorityClassName = priorityClassName.value
      if (priority.value > 0) data.priority = priority.value
      if (runtimeClassName.value) data.runtimeClassName = runtimeClassName.value

      await updateSchedulingConfigApi(props.version.id, data)

      ElMessage.success('调度配置保存成功')
      editing.value = false
      await loadConfig()
      emit('success')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('[调度管理] 保存失败:', error)
      }
    } finally {
      saving.value = false
    }
  }

  const buildNodeAffinity = () => {
    const nodeAffinity: any = {}

    if (nodeAffinityRequired.value.length > 0) {
      nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution = {
        nodeSelectorTerms: nodeAffinityRequired.value
          .filter((r) => r.key)
          .map((rule) => ({
            matchExpressions: [
              {
                key: rule.key,
                operator: rule.operator,
                ...(['In', 'NotIn'].includes(rule.operator) && rule.values
                  ? { values: rule.values.split(',').map((v: string) => v.trim()) }
                  : {})
              }
            ]
          }))
      }
    }

    if (nodeAffinityPreferred.value.length > 0) {
      nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution = nodeAffinityPreferred.value
        .filter((r) => r.key)
        .map((rule) => ({
          weight: rule.weight || 50,
          preference: {
            matchExpressions: [
              {
                key: rule.key,
                operator: rule.operator,
                ...(['In', 'NotIn'].includes(rule.operator) && rule.values
                  ? { values: rule.values.split(',').map((v: string) => v.trim()) }
                  : {})
              }
            ]
          }
        }))
    }

    return nodeAffinity
  }

  const buildPodAffinity = (rules: any[]) => {
    const required = rules.filter(
      (r) => r.type === 'required' && Object.keys(r.labelSelector).length > 0
    )
    const preferred = rules.filter(
      (r) => r.type === 'preferred' && Object.keys(r.labelSelector).length > 0
    )

    const result: any = {}

    if (required.length > 0) {
      result.requiredDuringSchedulingIgnoredDuringExecution = required.map((rule) => ({
        labelSelector: { matchLabels: rule.labelSelector },
        topologyKey: rule.topologyKey,
        ...(rule.namespaces && rule.namespaces.length > 0 ? { namespaces: rule.namespaces } : {})
      }))
    }

    if (preferred.length > 0) {
      result.preferredDuringSchedulingIgnoredDuringExecution = preferred.map((rule) => ({
        weight: rule.weight || 50,
        podAffinityTerm: {
          labelSelector: { matchLabels: rule.labelSelector },
          topologyKey: rule.topologyKey,
          ...(rule.namespaces && rule.namespaces.length > 0 ? { namespaces: rule.namespaces } : {})
        }
      }))
    }

    return result
  }

  const buildSelfAffinity = (rules: any[]) => {
    return buildPodAffinity(rules)
  }

  const handleCancel = () => {
    editing.value = false
    if (originalConfig.value) {
      loadConfig()
    }
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        editing.value = false
        loadConfig()
      }
    }
  )

  onMounted(() => {
    loadConfig()
    pendingCategory.value = activeCategory.value
  })
  // 暴露给父组件的方法和属性
  defineExpose({
    editing,
    hasUnsavedChanges
  })
</script>

<style lang="scss" scoped>
  .scheduling-management {
    height: 100%;
    display: flex;
    flex-direction: column;

    .top-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      background: white;
      border-bottom: 1px solid var(--el-border-color);
      flex-shrink: 0;
    }

    .loading-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 20px;

      .category-selector {
        margin-bottom: 20px;

        .category-radio-group {
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          :deep(.el-radio-button) {
            flex: 1;
            min-width: 150px;

            .el-radio-button__inner {
              width: 100%;
              padding: 12px 16px;
              border-radius: 8px;
              border: 2px solid #e4e7ed;

              &:hover {
                border-color: #409eff;
                color: #409eff;
              }
            }

            &.is-active .el-radio-button__inner {
              background: #409eff;
              border-color: #409eff;
              color: white;
              font-weight: 600;
            }
          }

          .radio-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;

            :deep(.el-badge) {
              margin-left: 4px;

              .el-badge__content {
                background-color: #f56c6c;
              }
            }
          }
        }
      }

      .config-content {
        .config-section {
          min-height: 200px;
        }
      }
    }
  }
</style>
