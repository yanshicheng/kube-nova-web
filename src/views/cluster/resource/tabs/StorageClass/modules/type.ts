/**
 * StorageClass 类型定义和转换
 *
 * 核心功能：
 * 1. 空表单也能生成有效的 YAML（name 为空字符串时使用占位符）
 * 2. YAML 转表单时进行基本验证
 * 3. 表单和 YAML 实时同步
 * 4. 支持供应商特定参数的智能处理
 * 5. 支持拓扑约束配置
 */

import * as yaml from 'js-yaml'

// ==================== 基础类型 ====================

export interface KeyValuePair {
  key: string
  value: string
}

export interface V1ObjectMeta {
  name?: string
  namespace?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
  uid?: string
  resourceVersion?: string
  creationTimestamp?: Date
  [key: string]: any
}

export interface V1TopologySelectorLabelRequirement {
  key: string
  values: string[]
}

export interface V1TopologySelectorTerm {
  matchLabelExpressions?: V1TopologySelectorLabelRequirement[]
}

export interface V1StorageClass {
  apiVersion?: string
  kind?: string
  metadata?: V1ObjectMeta
  provisioner: string
  parameters?: Record<string, string>
  reclaimPolicy?: 'Delete' | 'Retain'
  allowVolumeExpansion?: boolean
  volumeBindingMode?: 'Immediate' | 'WaitForFirstConsumer'
  allowedTopologies?: V1TopologySelectorTerm[]
  mountOptions?: string[]
}

// ==================== 表单数据类型 ====================

export interface TopologyRequirement {
  key: string
  values: string // 逗号分隔的值字符串
}

export interface StorageClassFormData {
  // 基本信息
  name: string
  provisioner: string
  reclaimPolicy: 'Delete' | 'Retain'
  volumeBindingMode: 'Immediate' | 'WaitForFirstConsumer'
  allowVolumeExpansion: boolean
  isDefault: boolean

  // 参数配置
  parameters: KeyValuePair[]
  mountOptions: string[]

  // 拓扑约束
  hasTopologyConstraints: boolean
  allowedTopologies: TopologyRequirement[]

  // 元数据
  labels: KeyValuePair[]
  annotations: KeyValuePair[]

  // 内部使用（编辑时保留完整数据）
  _rawYaml?: string
  _metadata?: V1ObjectMeta
}

// ==================== 常量定义 ====================

/** 默认 StorageClass 注解键 */
export const DEFAULT_STORAGE_CLASS_ANNOTATION = 'storageclass.kubernetes.io/is-default-class'

/** 常用的 Provisioner 列表 */
export const COMMON_PROVISIONERS = [
  // Kubernetes 内置
  'kubernetes.io/aws-ebs',
  'kubernetes.io/azure-disk',
  'kubernetes.io/azure-file',
  'kubernetes.io/cinder',
  'kubernetes.io/gce-pd',
  'kubernetes.io/glusterfs',
  'kubernetes.io/iscsi',
  'kubernetes.io/nfs',
  'kubernetes.io/rbd',
  'kubernetes.io/vsphere-volume',
  'kubernetes.io/portworx-volume',
  'kubernetes.io/scaleio',
  'kubernetes.io/storageos',
  'kubernetes.io/no-provisioner',
  // CSI 驱动
  'nfs.csi.k8s.io',
  'ebs.csi.aws.com',
  'pd.csi.storage.gke.io',
  'disk.csi.azure.com',
  'file.csi.azure.com',
  'csi.vsphere.vmware.com',
  // OpenEBS
  'local.csi.openebs.io',
  'cstor.csi.openebs.io',
  'lvm.csi.openebs.io',
  'zfs.csi.openebs.io',
  'io.openebs.csi-mayastor',
  // Longhorn
  'driver.longhorn.io',
  // Ceph
  'rbd.csi.ceph.com',
  'cephfs.csi.ceph.com',
  // Rancher
  'rancher.io/local-path'
]

/** 供应商显示名称映射 */
export const PROVISIONER_DISPLAY_NAMES: Record<string, string> = {
  'kubernetes.io/aws-ebs': 'AWS EBS',
  'kubernetes.io/gce-pd': 'GCE PD',
  'kubernetes.io/azure-disk': 'Azure Disk',
  'kubernetes.io/azure-file': 'Azure File',
  'kubernetes.io/no-provisioner': 'No Provisioner (Static)',
  'nfs.csi.k8s.io': 'NFS CSI',
  'ebs.csi.aws.com': 'AWS EBS CSI',
  'pd.csi.storage.gke.io': 'GKE PD CSI',
  'disk.csi.azure.com': 'Azure Disk CSI',
  'file.csi.azure.com': 'Azure File CSI',
  'csi.vsphere.vmware.com': 'vSphere CSI',
  'local.csi.openebs.io': 'OpenEBS Local PV',
  'cstor.csi.openebs.io': 'OpenEBS cStor',
  'lvm.csi.openebs.io': 'OpenEBS LVM',
  'zfs.csi.openebs.io': 'OpenEBS ZFS',
  'io.openebs.csi-mayastor': 'OpenEBS Mayastor',
  'driver.longhorn.io': 'Longhorn',
  'rbd.csi.ceph.com': 'Ceph RBD CSI',
  'cephfs.csi.ceph.com': 'CephFS CSI',
  'rancher.io/local-path': 'Local Path Provisioner'
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
  const filtered = pairs.filter((p) => p.key && p.key.trim() !== '')
  if (filtered.length === 0) return undefined
  return filtered.reduce(
    (acc, { key, value }) => {
      acc[key.trim()] = value
      return acc
    },
    {} as Record<string, string>
  )
}

/**
 * 解析拓扑约束
 */
function parseAllowedTopologies(
  allowedTopologies?: V1TopologySelectorTerm[]
): TopologyRequirement[] {
  if (!allowedTopologies || allowedTopologies.length === 0) {
    return [{ key: '', values: '' }]
  }

  const result: TopologyRequirement[] = []

  for (const term of allowedTopologies) {
    if (term.matchLabelExpressions && term.matchLabelExpressions.length > 0) {
      for (const expr of term.matchLabelExpressions) {
        result.push({
          key: expr.key || '',
          values: (expr.values || []).join(',')
        })
      }
    }
  }

  return result.length > 0 ? result : [{ key: '', values: '' }]
}

/**
 * 构建拓扑约束
 */
function buildAllowedTopologies(
  topologies: TopologyRequirement[]
): V1TopologySelectorTerm[] | undefined {
  const matchLabelExpressions: V1TopologySelectorLabelRequirement[] = []

  for (const topology of topologies) {
    const key = topology.key?.trim()
    const valuesStr = topology.values?.trim()

    if (key && valuesStr) {
      const values = valuesStr
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '')

      if (values.length > 0) {
        matchLabelExpressions.push({ key, values })
      }
    }
  }

  if (matchLabelExpressions.length === 0) {
    return undefined
  }

  return [{ matchLabelExpressions }]
}

// ==================== 核心转换函数 ====================

/**
 * StorageClass YAML -> 表单数据
 * 解析时进行基本验证
 */
export function storageClassYamlToForm(yamlStr: string): StorageClassFormData {
  let sc: V1StorageClass

  try {
    sc = yaml.load(yamlStr) as V1StorageClass
  } catch (error: any) {
    throw new Error(`YAML 解析失败: ${error.message}`)
  }

  if (!sc || typeof sc !== 'object') {
    throw new Error('无效的 YAML 格式')
  }

  // 验证 kind
  if (sc.kind && sc.kind !== 'StorageClass') {
    throw new Error(`资源类型不匹配，期望 StorageClass，实际为 ${sc.kind}`)
  }

  // 检查是否是默认 StorageClass
  const isDefault = sc.metadata?.annotations?.[DEFAULT_STORAGE_CLASS_ANNOTATION] === 'true'

  // 过滤掉 isDefault annotation，单独处理
  const filteredAnnotations: Record<string, string> = {}
  if (sc.metadata?.annotations) {
    for (const [key, value] of Object.entries(sc.metadata.annotations)) {
      if (key !== DEFAULT_STORAGE_CLASS_ANNOTATION) {
        filteredAnnotations[key] = value
      }
    }
  }

  // 解析拓扑约束
  const hasTopologyConstraints = !!(sc.allowedTopologies && sc.allowedTopologies.length > 0)
  const allowedTopologies = parseAllowedTopologies(sc.allowedTopologies)

  return {
    name: sc.metadata?.name || '',
    provisioner: sc.provisioner || '',
    reclaimPolicy: sc.reclaimPolicy || 'Delete',
    volumeBindingMode: sc.volumeBindingMode || 'Immediate',
    allowVolumeExpansion: sc.allowVolumeExpansion || false,
    isDefault,

    parameters: recordToKeyValuePairs(sc.parameters),
    mountOptions: sc.mountOptions || [],

    hasTopologyConstraints,
    allowedTopologies,

    labels: recordToKeyValuePairs(sc.metadata?.labels),
    annotations: recordToKeyValuePairs(filteredAnnotations),

    _rawYaml: yamlStr,
    _metadata: sc.metadata
  }
}

/**
 * StorageClass 表单数据 -> YAML
 * 空表单也能生成有效的 YAML 结构（用于实时预览）
 */
export function storageClassFormToYaml(form: StorageClassFormData, isEdit = false): string {
  // 处理 annotations
  const annotations: Record<string, string> = {}

  // 添加用户定义的注解
  const userAnnotations = keyValuePairsToRecord(form.annotations)
  if (userAnnotations) {
    Object.assign(annotations, userAnnotations)
  }

  // 设置默认类标记
  if (form.isDefault) {
    annotations[DEFAULT_STORAGE_CLASS_ANNOTATION] = 'true'
  }

  // 处理拓扑约束
  let allowedTopologies: V1TopologySelectorTerm[] | undefined = undefined
  if (form.hasTopologyConstraints) {
    allowedTopologies = buildAllowedTopologies(form.allowedTopologies)
  }

  // 使用默认值确保总能生成有效 YAML
  const name = form.name && form.name.trim() !== '' ? form.name.trim() : 'storageclass-name'
  const provisioner =
    form.provisioner && form.provisioner.trim() !== ''
      ? form.provisioner.trim()
      : 'kubernetes.io/no-provisioner'

  // 构建 StorageClass 对象
  const sc: V1StorageClass = {
    apiVersion: 'storage.k8s.io/v1',
    kind: 'StorageClass',
    metadata: {
      name,
      labels: keyValuePairsToRecord(form.labels),
      annotations: Object.keys(annotations).length > 0 ? annotations : undefined
    },
    provisioner,
    parameters: keyValuePairsToRecord(form.parameters),
    reclaimPolicy: form.reclaimPolicy,
    allowVolumeExpansion: form.allowVolumeExpansion,
    volumeBindingMode: form.volumeBindingMode,
    mountOptions: form.mountOptions.length > 0 ? form.mountOptions : undefined,
    allowedTopologies
  }

  // 如果是编辑模式，保留原始的 metadata 字段（如 resourceVersion, uid 等）
  if (isEdit && form._metadata) {
    sc.metadata = {
      ...form._metadata,
      name: form.name.trim() || form._metadata.name,
      labels: keyValuePairsToRecord(form.labels),
      annotations: Object.keys(annotations).length > 0 ? annotations : undefined
    }
  }

  // 清理 metadata 中的 undefined 值
  if (sc.metadata) {
    if (!sc.metadata.labels) delete sc.metadata.labels
    if (!sc.metadata.annotations) delete sc.metadata.annotations
  }

  // 清理 sc 中的 undefined 值
  if (!sc.parameters) delete sc.parameters
  if (!sc.mountOptions) delete sc.mountOptions
  if (!sc.allowedTopologies) delete sc.allowedTopologies

  // 如果不允许扩容，可以省略该字段（默认为 false）
  if (!sc.allowVolumeExpansion) delete sc.allowVolumeExpansion

  return yaml.dump(sc, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  })
}

/**
 * 验证 StorageClass 表单数据（提交时调用）
 */
export function validateStorageClassForm(form: StorageClassFormData): void {
  // 名称验证
  if (!form.name || form.name.trim() === '') {
    throw new Error('StorageClass 名称不能为空')
  }

  if (!validateStorageClassName(form.name)) {
    throw new Error(
      '名称格式不正确（只能包含小写字母、数字、连字符和点，且必须以字母数字开头和结尾，最大 253 字符）'
    )
  }

  // 供应商验证
  if (!form.provisioner || form.provisioner.trim() === '') {
    throw new Error('Provisioner（供应商）不能为空')
  }

  // 如果启用了拓扑约束，验证至少有一个有效的约束
  if (form.hasTopologyConstraints) {
    let hasValidTopology = false

    for (const topology of form.allowedTopologies) {
      const key = topology.key?.trim()
      const values = topology.values?.trim()

      if (key && values) {
        // 验证 values 格式（逗号分隔的非空值）
        const valueList = values
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v !== '')
        if (valueList.length > 0) {
          hasValidTopology = true
          break
        }
      }
    }

    if (!hasValidTopology) {
      throw new Error('启用拓扑约束时，至少需要一个有效的拓扑要求（包含 Key 和 Values）')
    }
  }

  // 验证参数键名格式
  for (const param of form.parameters) {
    if (param.key && param.key.trim() !== '') {
      // 参数键名不能包含特殊字符（除了 . / - _）
      if (!/^[a-zA-Z0-9._\-\/]+$/.test(param.key)) {
        throw new Error(
          `参数键名 "${param.key}" 格式不正确，只能包含字母、数字、点、斜杠、连字符和下划线`
        )
      }
    }
  }

  // 验证标签键名格式
  for (const label of form.labels) {
    if (label.key && label.key.trim() !== '') {
      if (!validateLabelKey(label.key)) {
        throw new Error(`标签键名 "${label.key}" 格式不正确`)
      }
    }
  }
}

// ==================== 辅助验证函数 ====================

/**
 * 验证 StorageClass 名称格式
 * 符合 DNS Subdomain 规范
 */
export function validateStorageClassName(name: string): boolean {
  if (!name || name.length > 253) return false
  // DNS Subdomain: 小写字母、数字、连字符、点，以字母数字开头和结尾
  const pattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
  return pattern.test(name)
}

/**
 * 验证标签键名格式
 */
export function validateLabelKey(key: string): boolean {
  if (!key) return false

  // 标签键可以有可选的前缀 (prefix/name)
  const parts = key.split('/')
  if (parts.length > 2) return false

  if (parts.length === 2) {
    const [prefix, name] = parts
    // 前缀必须是有效的 DNS 子域名
    if (!validateStorageClassName(prefix)) return false
    // 名称部分
    return /^[a-zA-Z0-9]([-a-zA-Z0-9_.]*[a-zA-Z0-9])?$/.test(name) && name.length <= 63
  }

  // 无前缀的键名
  return /^[a-zA-Z0-9]([-a-zA-Z0-9_.]*[a-zA-Z0-9])?$/.test(key) && key.length <= 63
}

// ==================== 工厂函数 ====================

/**
 * 创建空的 StorageClass 表单数据
 */
export function createEmptyStorageClassForm(): StorageClassFormData {
  return {
    name: '',
    provisioner: '',
    reclaimPolicy: 'Delete',
    volumeBindingMode: 'Immediate',
    allowVolumeExpansion: false,
    isDefault: false,

    parameters: [],
    mountOptions: [],

    hasTopologyConstraints: false,
    allowedTopologies: [{ key: '', values: '' }],

    labels: [],
    annotations: []
  }
}

/**
 * 创建带默认供应商的表单数据
 */
export function createStorageClassFormWithProvisioner(provisioner: string): StorageClassFormData {
  const form = createEmptyStorageClassForm()
  form.provisioner = provisioner

  // 根据供应商设置默认参数
  switch (provisioner) {
    case 'driver.longhorn.io':
      form.parameters = [
        { key: 'numberOfReplicas', value: '3' },
        { key: 'staleReplicaTimeout', value: '30' }
      ]
      form.allowVolumeExpansion = true
      break

    case 'nfs.csi.k8s.io':
      form.parameters = [
        { key: 'server', value: '' },
        { key: 'share', value: '' }
      ]
      break

    case 'local.csi.openebs.io':
      form.parameters = [{ key: 'openebs.io/cas-type', value: 'local' }]
      form.volumeBindingMode = 'WaitForFirstConsumer'
      break

    case 'lvm.csi.openebs.io':
      form.parameters = [
        { key: 'volgroup', value: '' },
        { key: 'fsType', value: 'ext4' }
      ]
      form.volumeBindingMode = 'WaitForFirstConsumer'
      form.allowVolumeExpansion = true
      break

    case 'zfs.csi.openebs.io':
      form.parameters = [
        { key: 'poolname', value: '' },
        { key: 'fstype', value: 'zfs' }
      ]
      form.volumeBindingMode = 'WaitForFirstConsumer'
      form.allowVolumeExpansion = true
      break

    case 'rbd.csi.ceph.com':
      form.parameters = [
        { key: 'clusterID', value: '' },
        { key: 'pool', value: '' },
        { key: 'imageFeatures', value: 'layering' }
      ]
      form.allowVolumeExpansion = true
      break

    case 'ebs.csi.aws.com':
      form.parameters = [
        { key: 'type', value: 'gp3' },
        { key: 'fsType', value: 'ext4' }
      ]
      form.allowVolumeExpansion = true
      break

    case 'rancher.io/local-path':
      form.volumeBindingMode = 'WaitForFirstConsumer'
      form.reclaimPolicy = 'Delete'
      break

    case 'kubernetes.io/no-provisioner':
      form.volumeBindingMode = 'WaitForFirstConsumer'
      form.reclaimPolicy = 'Retain'
      break
  }

  return form
}

// ==================== 供应商相关工具函数 ====================

/**
 * 获取供应商的显示名称
 */
export function getProvisionerDisplayName(provisioner: string): string {
  return PROVISIONER_DISPLAY_NAMES[provisioner] || provisioner
}

/**
 * 判断供应商是否支持卷扩容
 */
export function supportsVolumeExpansion(provisioner: string): boolean {
  const supportedProvisioners = [
    'driver.longhorn.io',
    'lvm.csi.openebs.io',
    'zfs.csi.openebs.io',
    'cstor.csi.openebs.io',
    'rbd.csi.ceph.com',
    'cephfs.csi.ceph.com',
    'ebs.csi.aws.com',
    'pd.csi.storage.gke.io',
    'disk.csi.azure.com',
    'file.csi.azure.com',
    'csi.vsphere.vmware.com',
    'kubernetes.io/aws-ebs',
    'kubernetes.io/gce-pd',
    'kubernetes.io/azure-disk',
    'kubernetes.io/cinder'
  ]
  return supportedProvisioners.includes(provisioner)
}

/**
 * 判断供应商是否建议使用延迟绑定
 */
export function recommendsWaitForFirstConsumer(provisioner: string): boolean {
  const recommendedProvisioners = [
    'kubernetes.io/no-provisioner',
    'local.csi.openebs.io',
    'lvm.csi.openebs.io',
    'zfs.csi.openebs.io',
    'rancher.io/local-path'
  ]
  return recommendedProvisioners.includes(provisioner)
}

/**
 * 获取供应商的常用参数模板
 */
export function getProvisionerParameterTemplate(provisioner: string): KeyValuePair[] {
  const templates: Record<string, KeyValuePair[]> = {
    'nfs.csi.k8s.io': [
      { key: 'server', value: '' },
      { key: 'share', value: '' }
    ],
    'driver.longhorn.io': [
      { key: 'numberOfReplicas', value: '3' },
      { key: 'staleReplicaTimeout', value: '30' },
      { key: 'dataLocality', value: 'disabled' }
    ],
    'local.csi.openebs.io': [
      { key: 'openebs.io/cas-type', value: 'local' },
      { key: 'basePath', value: '/var/openebs/local' }
    ],
    'lvm.csi.openebs.io': [
      { key: 'volgroup', value: '' },
      { key: 'fsType', value: 'ext4' }
    ],
    'zfs.csi.openebs.io': [
      { key: 'poolname', value: '' },
      { key: 'fstype', value: 'zfs' },
      { key: 'compression', value: 'off' }
    ],
    'cstor.csi.openebs.io': [
      { key: 'cstorPoolCluster', value: '' },
      { key: 'replicaCount', value: '3' }
    ],
    'rbd.csi.ceph.com': [
      { key: 'clusterID', value: '' },
      { key: 'pool', value: '' },
      { key: 'imageFeatures', value: 'layering' },
      { key: 'csi.storage.k8s.io/provisioner-secret-name', value: '' },
      { key: 'csi.storage.k8s.io/provisioner-secret-namespace', value: '' }
    ],
    'cephfs.csi.ceph.com': [
      { key: 'clusterID', value: '' },
      { key: 'fsName', value: '' },
      { key: 'csi.storage.k8s.io/provisioner-secret-name', value: '' },
      { key: 'csi.storage.k8s.io/provisioner-secret-namespace', value: '' }
    ],
    'ebs.csi.aws.com': [
      { key: 'type', value: 'gp3' },
      { key: 'fsType', value: 'ext4' },
      { key: 'encrypted', value: 'false' }
    ],
    'pd.csi.storage.gke.io': [
      { key: 'type', value: 'pd-standard' },
      { key: 'fsType', value: 'ext4' }
    ],
    'disk.csi.azure.com': [
      { key: 'skuName', value: 'Standard_LRS' },
      { key: 'fsType', value: 'ext4' }
    ]
  }

  return templates[provisioner] || []
}

// ==================== 导出类型 ====================

export type { V1StorageClass, V1TopologySelectorTerm, V1TopologySelectorLabelRequirement }
