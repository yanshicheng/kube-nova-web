// store/workload/containers.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { V1Container } from '@kubernetes/client-node'
import { v4 as uuidv4 } from 'uuid'
import { normalizeCpu, normalizeMemory } from '@/utils/resource'

export interface ContainerWithId extends V1Container {
  id: string
  type: 'init' | 'main'
}

export const useContainersStore = defineStore('workload-containers', () => {
  // 初始化容器列表
  const initContainers = ref<ContainerWithId[]>([])

  // 主容器列表
  const mainContainers = ref<ContainerWithId[]>([])

  // 当前选中的容器ID
  const selectedContainerId = ref<string | null>(null)

  // 正在编辑名称的容器ID
  const editingContainerId = ref<string | null>(null)
  const isLoadingFromYaml = ref(false)

  // 所有容器列表（计算属性）
  const allContainers = computed(() => [...initContainers.value, ...mainContainers.value])

  // 获取选中的容器（计算属性）
  const selectedContainer = computed(() => {
    if (!selectedContainerId.value) return null
    return allContainers.value.find((c) => c.id === selectedContainerId.value) || null
  })

  // 创建默认容器
  function createDefaultContainer(type: 'init' | 'main', index: number): ContainerWithId {
    const baseName = type === 'init' ? 'init-container' : 'app'
    return {
      id: uuidv4(),
      type,
      name: `${baseName}-${index + 1}`,
      image: '',
      imagePullPolicy: 'IfNotPresent',
      command: undefined,
      args: undefined,
      workingDir: undefined,
      ports: undefined,
      env: undefined,
      envFrom: undefined,
      volumeMounts: undefined,
      volumeDevices: undefined,
      resources: undefined,
      livenessProbe: undefined,
      readinessProbe: undefined,
      startupProbe: undefined,
      lifecycle: undefined,
      securityContext: undefined,
      stdin: undefined,
      stdinOnce: undefined,
      tty: undefined,
      terminationMessagePath: '/dev/termination-log',
      terminationMessagePolicy: 'File'
    }
  }

  // 添加容器
  function addContainer(type: 'init' | 'main') {
    const list = type === 'init' ? initContainers.value : mainContainers.value
    const container = createDefaultContainer(type, list.length)
    list.push(container)
    selectedContainerId.value = container.id
    console.log(`添加${type === 'init' ? '初始化' : '主'}容器: ${container.name}`)
    return container
  }

  // 删除容器
  function removeContainer(id: string): boolean {
    // 从初始化容器中查找
    let index = initContainers.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      initContainers.value.splice(index, 1)
      console.log('删除初始化容器成功')

      // 重新选择容器
      if (selectedContainerId.value === id) {
        selectNextContainer()
      }
      return true
    }

    // 从主容器中查找
    index = mainContainers.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      // 主容器至少保留一个
      if (mainContainers.value.length === 1) {
        console.warn('主容器至少需要保留一个')
        return false
      }
      mainContainers.value.splice(index, 1)
      console.log('删除主容器成功')

      // 重新选择容器
      if (selectedContainerId.value === id) {
        selectNextContainer()
      }
      return true
    }

    return false
  }

  // 选择下一个可用容器
  function selectNextContainer() {
    if (mainContainers.value.length > 0) {
      selectedContainerId.value = mainContainers.value[0].id
    } else if (initContainers.value.length > 0) {
      selectedContainerId.value = initContainers.value[0].id
    } else {
      selectedContainerId.value = null
    }
  }

  function updateContainer(id: string, updates: Partial<ContainerWithId>): boolean {
    if (isLoadingFromYaml.value) {
      console.warn('⚠️ 正在加载 YAML，拒绝更新容器:', id)
      return false
    }

    // 查找初始化容器
    let index = initContainers.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      initContainers.value[index] = {
        ...initContainers.value[index],
        ...updates,
        id,
        type: 'init'
      }
      return true
    }

    // 查找主容器
    index = mainContainers.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      mainContainers.value[index] = {
        ...mainContainers.value[index],
        ...updates,
        id,
        type: 'main'
      }
      return true
    }

    return false
  }

  // 选择容器
  function selectContainer(id: string | null) {
    selectedContainerId.value = id
  }

  // 获取容器（通过ID）
  function getContainerById(id: string): ContainerWithId | null {
    return allContainers.value.find((c) => c.id === id) || null
  }

  // 获取选中的容器
  function getSelectedContainer(): ContainerWithId | null {
    return selectedContainer.value
  }

  // 开始编辑名称
  function startEditingName(id: string) {
    editingContainerId.value = id
  }

  // 停止编辑名称
  function stopEditingName() {
    editingContainerId.value = null
  }

  // 验证单个容器
  function validateContainer(container: ContainerWithId): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 容器名称必填且格式正确
    if (!container.name || !container.name.trim()) {
      errors.push('容器名称不能为空')
    } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(container.name)) {
      errors.push('容器名称格式不正确（只能包含小写字母、数字和连字符）')
    }

    // 镜像地址必填
    if (!container.image || !container.image.trim()) {
      errors.push('容器镜像不能为空')
    }

    // 验证端口
    if (container.ports && container.ports.length > 0) {
      container.ports.forEach((port, index) => {
        if (!port.containerPort) {
          errors.push(`端口 ${index + 1}: 缺少容器端口号`)
        }
        if (port.containerPort && (port.containerPort < 1 || port.containerPort > 65535)) {
          errors.push(`端口 ${index + 1}: 端口号必须在 1-65535 之间`)
        }
        if (port.name && !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(port.name)) {
          errors.push(`端口 ${index + 1}: 端口名称格式不正确`)
        }
      })
    }

    // 验证环境变量
    if (container.env && container.env.length > 0) {
      container.env.forEach((env, index) => {
        if (!env.name || !env.name.trim()) {
          errors.push(`环境变量 ${index + 1}: 缺少名称`)
        }
        // 如果是直接赋值，检查是否有值
        if (!env.valueFrom && env.value === undefined) {
          errors.push(`环境变量 ${index + 1}: 缺少值`)
        }
        // 如果是引用，检查引用配置
        if (env.valueFrom) {
          if (env.valueFrom.configMapKeyRef) {
            if (!env.valueFrom.configMapKeyRef.name) {
              errors.push(`环境变量 ${index + 1}: 缺少 ConfigMap 名称`)
            }
            if (!env.valueFrom.configMapKeyRef.key) {
              errors.push(`环境变量 ${index + 1}: 缺少 ConfigMap Key`)
            }
          }
          if (env.valueFrom.secretKeyRef) {
            if (!env.valueFrom.secretKeyRef.name) {
              errors.push(`环境变量 ${index + 1}: 缺少 Secret 名称`)
            }
            if (!env.valueFrom.secretKeyRef.key) {
              errors.push(`环境变量 ${index + 1}: 缺少 Secret Key`)
            }
          }
          if (env.valueFrom.fieldRef && !env.valueFrom.fieldRef.fieldPath) {
            errors.push(`环境变量 ${index + 1}: 缺少字段路径`)
          }
          if (env.valueFrom.resourceFieldRef && !env.valueFrom.resourceFieldRef.resource) {
            errors.push(`环境变量 ${index + 1}: 缺少资源字段`)
          }
        }
      })
    }

    // 验证卷挂载
    if (container.volumeMounts && container.volumeMounts.length > 0) {
      container.volumeMounts.forEach((mount, index) => {
        if (!mount.name || !mount.name.trim()) {
          errors.push(`卷挂载 ${index + 1}: 缺少卷名称`)
        }
        if (!mount.mountPath || !mount.mountPath.trim()) {
          errors.push(`卷挂载 ${index + 1}: 缺少挂载路径`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 验证所有容器配置
  function validate() {
    const errors: string[] = []

    // 必须至少有一个主容器
    if (mainContainers.value.length === 0) {
      errors.push('至少需要一个主容器')
      return {
        valid: false,
        errors
      }
    }

    // 验证所有容器
    allContainers.value.forEach((container) => {
      const result = validateContainer(container)
      if (!result.valid) {
        errors.push(...result.errors.map((err) => `${container.name || '未命名容器'}: ${err}`))
      }
    })

    // 检查容器名称重复
    const names = allContainers.value.map((c) => c.name).filter(Boolean)
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
    if (duplicates.length > 0) {
      errors.push(`容器名称重复: ${[...new Set(duplicates)].join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 转换为 K8s 格式（移除 id 和 type 字段）
  function toK8sFormat() {
    const removeMetadata = (container: ContainerWithId): V1Container => {
      const { id, type, ...rest } = container

      // 清理 undefined 字段
      const cleaned: any = {}
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // 数组类型：如果为空数组则不包含
          if (Array.isArray(value) && value.length === 0) {
            return
          }
          // 对象类型：检查是否有有效内容
          if (typeof value === 'object' && !Array.isArray(value)) {
            const hasContent = Object.values(value).some((v) => v !== undefined && v !== null)
            if (!hasContent) {
              return
            }
          }
          cleaned[key] = value
        }
      })

      return cleaned as V1Container
    }

    return {
      initContainers:
        initContainers.value.length > 0 ? initContainers.value.map(removeMetadata) : undefined,
      containers: mainContainers.value.map(removeMetadata)
    }
  }

  /**
   * 标准化容器资源配置
   * 确保从 YAML/K8s 加载的单位符合项目标准（二进制单位：Ki、Mi、Gi、Ti）
   * 如果 YAML 中包含十进制单位（K、M、G、T），会自动转换为二进制单位
   * 例如：10M -> 9.537Mi, 1G -> 953.674Mi
   */
  function normalizeContainerResources(container: V1Container): V1Container {
    const normalized = { ...container }

    if (container.resources) {
      normalized.resources = {
        requests: {},
        limits: {}
      }

      // 标准化 Requests
      if (container.resources.requests) {
        // CPU - 保持原单位（core 或 m）
        if (container.resources.requests.cpu) {
          const normalizedCpu = normalizeCpu(container.resources.requests.cpu as string)
          if (normalizedCpu) {
            normalized.resources.requests.cpu = normalizedCpu
          }
        }

        // 内存 - 统一转换为二进制单位（Ki、Mi、Gi、Ti）
        if (container.resources.requests.memory) {
          const normalizedMem = normalizeMemory(container.resources.requests.memory as string)
          if (normalizedMem) {
            normalized.resources.requests.memory = normalizedMem
          }
        }

        // 临时存储 - 统一转换为二进制单位
        if (container.resources.requests['ephemeral-storage']) {
          const normalizedStorage = normalizeMemory(
            container.resources.requests['ephemeral-storage'] as string
          )
          if (normalizedStorage) {
            normalized.resources.requests['ephemeral-storage'] = normalizedStorage
          }
        }

        // 复制其他 requests 字段
        Object.keys(container.resources.requests).forEach((key) => {
          if (!['cpu', 'memory', 'ephemeral-storage'].includes(key)) {
            normalized.resources!.requests![key] = container.resources!.requests![key]
          }
        })
      }

      // 标准化 Limits
      if (container.resources.limits) {
        // CPU
        if (container.resources.limits.cpu) {
          const normalizedCpu = normalizeCpu(container.resources.limits.cpu as string)
          if (normalizedCpu) {
            normalized.resources.limits.cpu = normalizedCpu
          }
        }

        // 内存 - 统一转换为二进制单位
        if (container.resources.limits.memory) {
          const normalizedMem = normalizeMemory(container.resources.limits.memory as string)
          if (normalizedMem) {
            normalized.resources.limits.memory = normalizedMem
          }
        }

        // 临时存储 - 统一转换为二进制单位
        if (container.resources.limits['ephemeral-storage']) {
          const normalizedStorage = normalizeMemory(
            container.resources.limits['ephemeral-storage'] as string
          )
          if (normalizedStorage) {
            normalized.resources.limits['ephemeral-storage'] = normalizedStorage
          }
        }

        // 复制其他 limits 字段（如 GPU）
        Object.keys(container.resources.limits).forEach((key) => {
          if (!['cpu', 'memory', 'ephemeral-storage'].includes(key)) {
            normalized.resources!.limits![key] = container.resources!.limits![key]
          }
        })
      }
    }

    return normalized
  }

  // 从 K8s 格式加载
  function loadFromK8s(data: { initContainers?: V1Container[]; containers?: V1Container[] }) {
    console.log('从 K8s 格式加载容器配置')

    // 设置加载标志
    isLoadingFromYaml.value = true

    try {
      // 先清空选中状态
      selectedContainerId.value = null

      // 加载初始化容器（标准化资源单位为二进制）
      initContainers.value = (data.initContainers || []).map((c, index) => {
        const normalized = normalizeContainerResources(c)
        return {
          ...normalized,
          id: uuidv4(),
          type: 'init' as const,
          name: c.name || `init-container-${index + 1}`
        }
      })

      // 加载主容器（标准化资源单位为二进制）
      mainContainers.value = (data.containers || []).map((c, index) => {
        const normalized = normalizeContainerResources(c)
        return {
          ...normalized,
          id: uuidv4(),
          type: 'main' as const,
          name: c.name || `app-${index + 1}`
        }
      })

      // 如果没有主容器，创建一个默认的
      if (mainContainers.value.length === 0) {
        const defaultContainer = addContainer('main')
        console.log('创建默认主容器:', defaultContainer.name)
      } else {
        // 选中第一个主容器
        selectedContainerId.value = mainContainers.value[0].id
      }

      console.log(
        `加载完成: ${initContainers.value.length} 个初始化容器, ${mainContainers.value.length} 个主容器`
      )
      console.log('资源单位已标准化为二进制单位（Ki、Mi、Gi、Ti）')
    } finally {
      // 延迟解锁，确保组件渲染完成
      setTimeout(() => {
        isLoadingFromYaml.value = false
        console.log('✅ YAML 加载状态已解除')
      }, 200)
    }
  }

  function reset() {
    initContainers.value = []
    mainContainers.value = []
    selectedContainerId.value = null
    editingContainerId.value = null
    isLoadingFromYaml.value = false // ✅ 直接重置，不需要 finally

    // 添加一个默认主容器
    addContainer('main')

    console.log('Containers store 已重置')
  }
  return {
    // State
    initContainers,
    mainContainers,
    selectedContainerId,
    editingContainerId,
    isLoadingFromYaml,
    // Computed
    allContainers,
    selectedContainer,

    // Actions
    createDefaultContainer,
    addContainer,
    removeContainer,
    updateContainer,
    selectContainer,
    getContainerById,
    getSelectedContainer,
    startEditingName,
    stopEditingName,
    validateContainer,
    validate,
    toK8sFormat,
    loadFromK8s,
    reset
  }
})
