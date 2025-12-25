/**
 * PersistentVolume 类型定义和转换
 * 专注于静态制备（Static Provisioning）
 * 完全符合 Kubernetes 标准
 */

import * as yaml from 'js-yaml'

// ==================== 基础类型 ====================

export interface KeyValuePair {
  key: string
  value: string
}

export interface NodeAffinityRequirement {
  key: string
  operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist'
  values: string[]
}

// ==================== Kubernetes 标准类型 ====================

export interface V1ObjectMeta {
  name?: string
  namespace?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
  uid?: string
  resourceVersion?: string
  creationTimestamp?: string
  [key: string]: any
}

export type PVAccessMode = 'ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany' | 'ReadWriteOncePod'
export type PVReclaimPolicy = 'Delete' | 'Retain' | 'Recycle'
export type PVVolumeMode = 'Filesystem' | 'Block'
export type PVPhase = 'Available' | 'Bound' | 'Released' | 'Failed' | 'Pending'
export type SourceType = 'nfs' | 'hostPath' | 'csi' | 'local'

export interface V1PersistentVolumeSpec {
  capacity: {
    storage: string
  }
  accessModes: PVAccessMode[]
  persistentVolumeReclaimPolicy: PVReclaimPolicy
  volumeMode?: PVVolumeMode
  storageClassName?: string
  mountOptions?: string[]

  // 存储源（互斥，只能配置一个）
  nfs?: {
    server: string
    path: string
    readOnly?: boolean
  }
  hostPath?: {
    path: string
    type?: string
  }
  csi?: {
    driver: string
    volumeHandle: string
    fsType?: string
    readOnly?: boolean
    volumeAttributes?: Record<string, string>
  }
  local?: {
    path: string
    fsType?: string
  }

  // Local 卷必须配置节点亲和性
  nodeAffinity?: {
    required?: {
      nodeSelectorTerms: Array<{
        matchExpressions?: Array<{
          key: string
          operator: string
          values?: string[]
        }>
      }>
    }
  }

  claimRef?: {
    namespace: string
    name: string
  }
}

export interface V1PersistentVolumeStatus {
  phase?: PVPhase
  message?: string
  reason?: string
}

export interface V1PersistentVolume {
  apiVersion: string
  kind: string
  metadata: V1ObjectMeta
  spec: V1PersistentVolumeSpec
  status?: V1PersistentVolumeStatus
}

// ==================== 表单数据类型（静态制备） ====================

export interface PVFormData {
  // 基本信息
  name: string
  capacity: number
  capacityUnit: 'Gi' | 'Mi' | 'Ti'
  accessModes: PVAccessMode[]
  reclaimPolicy: PVReclaimPolicy
  volumeMode: PVVolumeMode
  storageClassName: string // 可选，仅用于分类管理
  mountOptions: string[]

  // 存储源类型（必选，互斥）
  sourceType: SourceType

  // NFS 配置
  nfs: {
    server: string
    path: string
    readOnly: boolean
  }

  // HostPath 配置
  hostPath: {
    path: string
    type: string
  }

  // CSI 配置
  csi: {
    driver: string
    volumeHandle: string
    fsType: string
    readOnly: boolean
    volumeAttributes: KeyValuePair[]
  }

  // Local 配置
  local: {
    path: string
    fsType: string
  }

  // Local 节点亲和性（Local 卷必须配置）
  nodeAffinity: NodeAffinityRequirement[]

  // 元数据
  labels: KeyValuePair[]
  annotations: KeyValuePair[]

  // 内部使用（编辑时保留完整数据）
  _rawYaml?: string
  _metadata?: V1ObjectMeta
  _status?: V1PersistentVolumeStatus
}

// ==================== 工具函数 ====================

/**
 * Record 转 KeyValuePair 数组
 */
function recordToKeyValuePairs(record?: Record<string, string>): KeyValuePair[] {
  if (!record) return []
  return Object.entries(record)
    .filter(([key]) => key.trim() !== '')
    .map(([key, value]) => ({ key, value }))
}

/**
 * KeyValuePair 数组转 Record
 */
function keyValuePairsToRecord(pairs: KeyValuePair[]): Record<string, string> | undefined {
  const filtered = pairs.filter((p) => p.key.trim() !== '')
  if (filtered.length === 0) return undefined

  return filtered.reduce((acc, { key, value }) => {
    acc[key.trim()] = value
    return acc
  }, {} as Record<string, string>)
}

/**
 * 解析容量字符串
 */
function parseCapacity(capacity?: string): { value: number; unit: 'Gi' | 'Mi' | 'Ti' } {
  if (!capacity) return { value: 1, unit: 'Gi' }

  const match = capacity.match(/^(\d+(?:\.\d+)?)(Gi|Mi|Ti|G|M|T)$/i)
  if (!match) return { value: 1, unit: 'Gi' }

  let value = parseFloat(match[1])
  let unit = match[2].toUpperCase()

  // 标准化单位
  if (unit === 'G') unit = 'GI'
  if (unit === 'M') unit = 'MI'
  if (unit === 'T') unit = 'TI'

  return { value: Math.round(value), unit: unit as 'Gi' | 'Mi' | 'Ti' }
}

/**
 * 判断存储源类型
 */
function detectSourceType(spec: V1PersistentVolumeSpec): SourceType {
  if (spec.nfs) return 'nfs'
  if (spec.hostPath) return 'hostPath'
  if (spec.csi) return 'csi'
  if (spec.local) return 'local'
  return 'nfs' // 默认
}

// ==================== 核心转换函数 ====================

/**
 * PV YAML -> 表单数据
 */
export function pvYamlToForm(yamlStr: string): PVFormData {
  const pv = yaml.load(yamlStr) as V1PersistentVolume

  if (!pv || !pv.spec) {
    throw new Error('无效的 PV YAML')
  }

  const spec = pv.spec

  // 解析容量
  const { value: capacity, unit: capacityUnit } = parseCapacity(spec.capacity?.storage)

  // 判断存储源类型
  const sourceType = detectSourceType(spec)

  // 解析节点亲和性
  const nodeAffinity: NodeAffinityRequirement[] = []
  if (spec.nodeAffinity?.required?.nodeSelectorTerms) {
    for (const term of spec.nodeAffinity.required.nodeSelectorTerms) {
      if (term.matchExpressions) {
        for (const expr of term.matchExpressions) {
          nodeAffinity.push({
            key: expr.key,
            operator: expr.operator as any,
            values: expr.values || []
          })
        }
      }
    }
  }

  // 如果是 local 卷但没有节点亲和性，添加默认的
  if (sourceType === 'local' && nodeAffinity.length === 0) {
    nodeAffinity.push({
      key: 'kubernetes.io/hostname',
      operator: 'In',
      values: []
    })
  }

  return {
    name: pv.metadata?.name || '',
    capacity,
    capacityUnit,
    accessModes: spec.accessModes || ['ReadWriteOnce'],
    reclaimPolicy: spec.persistentVolumeReclaimPolicy || 'Retain',
    volumeMode: spec.volumeMode || 'Filesystem',
    storageClassName: spec.storageClassName || '',
    mountOptions: spec.mountOptions || [],

    sourceType,

    nfs: {
      server: spec.nfs?.server || '',
      path: spec.nfs?.path || '/',
      readOnly: spec.nfs?.readOnly || false
    },

    hostPath: {
      path: spec.hostPath?.path || '',
      type: spec.hostPath?.type || 'DirectoryOrCreate'
    },

    csi: {
      driver: spec.csi?.driver || '',
      volumeHandle: spec.csi?.volumeHandle || '',
      fsType: spec.csi?.fsType || 'ext4',
      readOnly: spec.csi?.readOnly || false,
      volumeAttributes: recordToKeyValuePairs(spec.csi?.volumeAttributes)
    },

    local: {
      path: spec.local?.path || '',
      fsType: spec.local?.fsType || ''
    },

    nodeAffinity,

    labels: recordToKeyValuePairs(pv.metadata?.labels),
    annotations: recordToKeyValuePairs(pv.metadata?.annotations),

    _rawYaml: yamlStr,
    _metadata: pv.metadata,
    _status: pv.status
  }
}

/**
 * 表单数据 -> PV YAML（静态制备）
 */
export function pvFormToYaml(form: PVFormData, isEdit = false): string {
  // 注意：为了支持实时同步，这里不做严格验证
  // 验证在提交时进行（调用 validatePVForm）

  // 使用默认值，确保总能生成有效的 YAML
  const name = form.name && form.name.trim() !== '' ? form.name.trim() : 'pv-name'
  const capacity = form.capacity > 0 ? form.capacity : 1
  const accessModes = form.accessModes.length > 0 ? form.accessModes : ['ReadWriteOnce']

  // 构建 PV 对象
  const pv: V1PersistentVolume = {
    apiVersion: 'v1',
    kind: 'PersistentVolume',
    metadata: {
      name,
      labels: keyValuePairsToRecord(form.labels),
      annotations: keyValuePairsToRecord(form.annotations)
    },
    spec: {
      capacity: {
        storage: `${capacity}${form.capacityUnit}`
      },
      accessModes,
      persistentVolumeReclaimPolicy: form.reclaimPolicy,
      volumeMode: form.volumeMode,
      storageClassName: form.storageClassName || undefined,
      mountOptions: form.mountOptions.length > 0 ? form.mountOptions : undefined
    }
  }

  // 如果是编辑模式，保留原始的 metadata 字段
  if (isEdit && form._metadata) {
    pv.metadata = {
      ...form._metadata,
      name: form.name.trim(),
      labels: keyValuePairsToRecord(form.labels),
      annotations: keyValuePairsToRecord(form.annotations)
    }
  }

  // 配置存储源（互斥，只能配置一个）
  // 注意：这里不验证，验证在提交时进行
  configureVolumeSource(pv.spec, form, false) // 传 false 表示不验证

  return yaml.dump(pv, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  })
}

/**
 * 验证 PV 表单数据（提交时调用）
 */
export function validatePVForm(form: PVFormData): void {
  // 基础验证
  if (!form.name || form.name.trim() === '') {
    throw new Error('PV 名称不能为空')
  }

  if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(form.name)) {
    throw new Error('PV 名称格式不正确，必须符合 DNS 子域名规范')
  }

  if (!form.capacity || form.capacity < 1) {
    throw new Error('容量必须大于 0')
  }

  if (!form.accessModes || form.accessModes.length === 0) {
    throw new Error('请至少选择一个访问模式')
  }

  // 验证存储源配置（静态制备必须配置）
  validateSourceConfig(form)
}

/**
 * 验证存储源配置（静态制备必须配置）
 */
function validateSourceConfig(form: PVFormData): void {
  switch (form.sourceType) {
    case 'nfs':
      if (!form.nfs.server || !form.nfs.path) {
        throw new Error('NFS 配置不完整：服务器和路径不能为空')
      }
      if (!form.nfs.path.startsWith('/')) {
        throw new Error('NFS 路径必须以 / 开头')
      }
      break

    case 'hostPath':
      if (!form.hostPath.path) {
        throw new Error('HostPath 路径不能为空')
      }
      if (!form.hostPath.path.startsWith('/')) {
        throw new Error('HostPath 路径必须以 / 开头')
      }
      break

    case 'csi':
      if (!form.csi.driver || !form.csi.volumeHandle) {
        throw new Error('CSI 配置不完整：驱动和卷句柄不能为空')
      }
      break

    case 'local':
      if (!form.local.path) {
        throw new Error('Local 路径不能为空')
      }
      if (!form.local.path.startsWith('/')) {
        throw new Error('Local 路径必须以 / 开头')
      }
      if (!form.nodeAffinity || form.nodeAffinity.length === 0) {
        throw new Error('Local 卷必须配置节点亲和性')
      }

      // 验证节点亲和性配置
      for (const req of form.nodeAffinity) {
        if (!req.key) {
          throw new Error('节点亲和性：标签键不能为空')
        }
        if (['In', 'NotIn'].includes(req.operator) && req.values.length === 0) {
          throw new Error(`节点亲和性：${req.operator} 操作符必须指定值`)
        }
      }
      break
  }
}

/**
 * 配置存储源（确保互斥）
 */
function configureVolumeSource(spec: V1PersistentVolumeSpec, form: PVFormData, validate: boolean = true): void {
  // 清空所有存储源
  delete spec.nfs
  delete spec.hostPath
  delete spec.csi
  delete spec.local
  delete spec.nodeAffinity

  // 根据类型配置对应的存储源
  switch (form.sourceType) {
    case 'nfs':
      // 实时同步时可能数据不完整，不验证
      if (validate && (!form.nfs.server || !form.nfs.path)) {
        break
      }
      spec.nfs = {
        server: form.nfs.server?.trim() || 'nfs-server',
        path: form.nfs.path?.trim() || '/',
        readOnly: form.nfs.readOnly || undefined
      }
      break

    case 'hostPath':
      if (validate && !form.hostPath.path) {
        break
      }
      spec.hostPath = {
        path: form.hostPath.path?.trim() || '/path',
        type: form.hostPath.type
      }
      break

    case 'csi':
      if (validate && (!form.csi.driver || !form.csi.volumeHandle)) {
        break
      }
      spec.csi = {
        driver: form.csi.driver?.trim() || 'csi-driver',
        volumeHandle: form.csi.volumeHandle?.trim() || 'volume-handle',
        fsType: form.csi.fsType || undefined,
        readOnly: form.csi.readOnly || undefined,
        volumeAttributes: keyValuePairsToRecord(form.csi.volumeAttributes)
      }
      break

    case 'local':
      if (validate && !form.local.path) {
        break
      }
      spec.local = {
        path: form.local.path?.trim() || '/local-path',
        fsType: form.local.fsType || undefined
      }

      // Local 卷必须配置节点亲和性
      if (form.nodeAffinity && form.nodeAffinity.length > 0) {
        const matchExpressions = form.nodeAffinity
          .filter((req) => req.key && req.operator)
          .map((req) => {
            const expression: any = {
              key: req.key.trim(),
              operator: req.operator
            }

            if (['In', 'NotIn'].includes(req.operator) && req.values && req.values.length > 0) {
              expression.values = req.values.map((v) => v.trim()).filter((v) => v)
            }

            return expression
          })

        if (matchExpressions.length > 0) {
          spec.nodeAffinity = {
            required: {
              nodeSelectorTerms: [
                {
                  matchExpressions
                }
              ]
            }
          }
        }
      }
      break
  }
}

/**
 * 创建空的表单数据
 */
export function createEmptyPVForm(): PVFormData {
  return {
    name: '',
    capacity: 1,
    capacityUnit: 'Gi',
    accessModes: ['ReadWriteOnce'],
    reclaimPolicy: 'Retain',
    volumeMode: 'Filesystem',
    storageClassName: '',
    mountOptions: [],

    sourceType: 'nfs',

    nfs: {
      server: '',
      path: '/',
      readOnly: false
    },

    hostPath: {
      path: '',
      type: 'DirectoryOrCreate'
    },

    csi: {
      driver: '',
      volumeHandle: '',
      fsType: 'ext4',
      readOnly: false,
      volumeAttributes: []
    },

    local: {
      path: '',
      fsType: ''
    },

    nodeAffinity: [
      {
        key: 'kubernetes.io/hostname',
        operator: 'In',
        values: []
      }
    ],

    labels: [],
    annotations: []
  }
}

/**
 * 检查是否支持 ReadWriteMany (RWX)
 */
export function supportsRWX(sourceType: SourceType, csiDriver?: string): boolean {
  // NFS 天然支持 RWX
  if (sourceType === 'nfs') {
    return true
  }

  // 某些 CSI 驱动支持 RWX
  if (sourceType === 'csi' && csiDriver) {
    const driver = csiDriver.toLowerCase()
    return (
      driver.includes('nfs') ||
      driver.includes('cephfs') ||
      driver.includes('glusterfs') ||
      driver.includes('longhorn')
    )
  }

  // HostPath 和 Local 不支持 RWX
  return false
}

/**
 * 获取存储源类型的显示名称
 */
export function getSourceTypeName(type: SourceType): string {
  const names: Record<SourceType, string> = {
    nfs: 'NFS',
    hostPath: 'HostPath',
    csi: 'CSI',
    local: 'Local'
  }
  return names[type] || type
}

/**
 * 获取访问模式的描述
 */
export function getAccessModeDescription(mode: PVAccessMode): string {
  const descriptions: Record<PVAccessMode, string> = {
    ReadWriteOnce: '单节点读写 (RWO)',
    ReadOnlyMany: '多节点只读 (ROX)',
    ReadWriteMany: '多节点读写 (RWX)',
    ReadWriteOncePod: '单 Pod 读写 (RWOP)'
  }
  return descriptions[mode] || mode
}