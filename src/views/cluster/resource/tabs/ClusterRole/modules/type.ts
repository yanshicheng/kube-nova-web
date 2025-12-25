/**
 * ClusterRole 类型定义和转换
 * 核心改动：
 * 1. 空表单也能生成有效的 YAML（name 为空字符串）
 * 2. YAML 转表单时进行验证
 * 3. 表单和 YAML 实时同步
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
}

export interface V1LabelSelector {
  matchLabels?: Record<string, string>
  matchExpressions?: V1LabelSelectorRequirement[]
}

export interface V1LabelSelectorRequirement {
  key: string
  operator: string
  values?: string[]
}

export interface V1PolicyRule {
  verbs: string[]
  apiGroups?: string[]
  resources?: string[]
  resourceNames?: string[]
  nonResourceURLs?: string[]
}

export interface V1AggregationRule {
  clusterRoleSelectors?: V1LabelSelector[]
}

export interface V1ClusterRole {
  apiVersion?: string
  kind?: string
  metadata?: V1ObjectMeta
  rules?: V1PolicyRule[]
  aggregationRule?: V1AggregationRule
}

export interface ClusterRoleFormData {
  name: string
  rules: {
    verbs: string[]
    apiGroups: string[]
    resources: string[]
    resourceNames: string[]
  }[]
  useAggregation: boolean
  aggregationSelectors: {
    matchLabels: KeyValuePair[]
  }[]
  labels: KeyValuePair[]
  annotations: KeyValuePair[]
}

// ==================== 常量 ====================
export const COMMON_VERBS = [
  'get', 'list', 'watch', 'create', 'update', 'patch', 'delete', 'deletecollection', '*'
]

export const COMMON_API_GROUPS = [
  '', 'apps', 'batch', 'extensions', 'networking.k8s.io', 'storage.k8s.io',
  'rbac.authorization.k8s.io', 'policy', 'autoscaling'
]

export const COMMON_RESOURCES = [
  'pods', 'services', 'deployments', 'statefulsets', 'daemonsets', 'replicasets',
  'configmaps', 'secrets', 'persistentvolumeclaims', 'ingresses', 'namespaces', 'nodes', 'events'
]

// ==================== 工具函数 ====================
function recordToKeyValuePairs(record?: Record<string, string>): KeyValuePair[] {
  if (!record) return []
  return Object.entries(record).map(([key, value]) => ({ key, value }))
}

function keyValuePairsToRecord(pairs: KeyValuePair[]): Record<string, string> | undefined {
  const filtered = pairs.filter((p) => p.key.trim() !== '')
  if (filtered.length === 0) return undefined
  return filtered.reduce(
    (acc, { key, value }) => {
      acc[key] = value
      return acc
    },
    {} as Record<string, string>
  )
}

// ==================== 核心转换函数 ====================

/**
 * ClusterRole YAML -> 表单数据
 * 解析时进行基本验证
 */
export function clusterRoleYamlToForm(yamlStr: string): ClusterRoleFormData {
  let cr: V1ClusterRole

  try {
    cr = yaml.load(yamlStr) as V1ClusterRole
  } catch (error: any) {
    throw new Error(`YAML 解析失败: ${error.message}`)
  }

  if (!cr || typeof cr !== 'object') {
    throw new Error('无效的 YAML 格式')
  }

  // 验证 kind
  if (cr.kind && cr.kind !== 'ClusterRole') {
    throw new Error(`资源类型不匹配，期望 ClusterRole，实际为 ${cr.kind}`)
  }

  const useAggregation = !!cr.aggregationRule

  if (useAggregation) {
    const aggregationSelectors = (cr.aggregationRule?.clusterRoleSelectors || []).map(
      (selector) => {
        const matchLabels = recordToKeyValuePairs(selector.matchLabels)
        if (matchLabels.length === 0) {
          matchLabels.push({ key: '', value: '' })
        }
        return { matchLabels }
      }
    )

    if (aggregationSelectors.length === 0) {
      aggregationSelectors.push({
        matchLabels: [{ key: '', value: '' }]
      })
    }

    return {
      name: cr.metadata?.name || '',
      rules: [],
      useAggregation: true,
      aggregationSelectors,
      labels: recordToKeyValuePairs(cr.metadata?.labels),
      annotations: recordToKeyValuePairs(cr.metadata?.annotations)
    }
  }

  const rules = (cr.rules || []).map((rule) => ({
    verbs: rule.verbs || [],
    apiGroups: rule.apiGroups || [''],
    resources: rule.resources || [],
    resourceNames: rule.resourceNames || []
  }))

  if (rules.length === 0) {
    rules.push({
      verbs: [],
      apiGroups: [''],
      resources: [],
      resourceNames: []
    })
  }

  return {
    name: cr.metadata?.name || '',
    rules,
    useAggregation: false,
    aggregationSelectors: [],
    labels: recordToKeyValuePairs(cr.metadata?.labels),
    annotations: recordToKeyValuePairs(cr.metadata?.annotations)
  }
}

/**
 * ClusterRole 表单数据 -> YAML
 * 空表单也能生成有效的 YAML 结构
 */
export function clusterRoleFormToYaml(form: ClusterRoleFormData): string {
  const cr: V1ClusterRole = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'ClusterRole',
    metadata: {
      name: form.name, // 允许空字符串
      labels: keyValuePairsToRecord(form.labels),
      annotations: keyValuePairsToRecord(form.annotations)
    }
  }

  // 清理 metadata 中的 undefined 值
  if (!cr.metadata!.labels) delete cr.metadata!.labels
  if (!cr.metadata!.annotations) delete cr.metadata!.annotations

  if (form.useAggregation) {
    // 聚合模式
    const clusterRoleSelectors: V1LabelSelector[] = []

    for (const selector of form.aggregationSelectors) {
      const matchLabels = keyValuePairsToRecord(selector.matchLabels)
      if (matchLabels && Object.keys(matchLabels).length > 0) {
        clusterRoleSelectors.push({ matchLabels })
      }
    }

    cr.aggregationRule = {
      clusterRoleSelectors: clusterRoleSelectors.length > 0 ? clusterRoleSelectors : []
    }
  } else {
    // 标准模式
    cr.rules = []

    for (const rule of form.rules) {
      // 只添加有内容的规则
      if (
        rule.verbs.length > 0 ||
        rule.resources.length > 0 ||
        (rule.apiGroups.length > 0 && rule.apiGroups.some(g => g !== ''))
      ) {
        cr.rules.push({
          verbs: rule.verbs.length > 0 ? rule.verbs : [],
          apiGroups: rule.apiGroups.length > 0 ? rule.apiGroups : [''],
          resources: rule.resources.length > 0 ? rule.resources : [],
          resourceNames: rule.resourceNames.length > 0 ? rule.resourceNames : undefined
        })
      }
    }

    // 如果没有规则，给一个空数组
    if (cr.rules.length === 0) {
      cr.rules = []
    }
  }

  return yaml.dump(cr, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  })
}

/**
 * 验证 ClusterRole 表单数据（提交时调用）
 */
export function validateClusterRoleForm(form: ClusterRoleFormData): void {
  if (!form.name || form.name.trim() === '') {
    throw new Error('ClusterRole 名称不能为空')
  }

  if (!validateClusterRoleName(form.name)) {
    throw new Error('ClusterRole 名称格式不正确（只能包含小写字母、数字、连字符和点，且必须以字母数字开头和结尾）')
  }

  if (form.useAggregation) {
    if (form.aggregationSelectors.length === 0) {
      throw new Error('聚合模式下至少需要一个选择器')
    }

    let hasValidSelector = false
    for (const selector of form.aggregationSelectors) {
      const matchLabels = keyValuePairsToRecord(selector.matchLabels)
      if (matchLabels && Object.keys(matchLabels).length > 0) {
        hasValidSelector = true
        break
      }
    }

    if (!hasValidSelector) {
      throw new Error('每个选择器至少需要一个有效的标签')
    }
  } else {
    if (form.rules.length === 0) {
      throw new Error('至少需要一条权限规则')
    }

    let hasValidRule = false
    for (const rule of form.rules) {
      if (rule.verbs.length > 0 && rule.resources.length > 0) {
        hasValidRule = true
        break
      }
    }

    if (!hasValidRule) {
      throw new Error('每条规则至少需要一个动作 (verb) 和一个资源类型')
    }
  }
}

/** 创建空的 ClusterRole 表单数据 */
export function createEmptyClusterRoleForm(): ClusterRoleFormData {
  return {
    name: '',
    rules: [
      {
        verbs: [],
        apiGroups: [''],
        resources: [],
        resourceNames: []
      }
    ],
    useAggregation: false,
    aggregationSelectors: [],
    labels: [],
    annotations: []
  }
}

/** 验证 ClusterRole 名称格式 */
export function validateClusterRoleName(name: string): boolean {
  const pattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
  return pattern.test(name) && name.length <= 253
}