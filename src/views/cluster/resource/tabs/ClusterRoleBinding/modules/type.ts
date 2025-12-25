/**
 * ClusterRoleBinding 类型定义和转换
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

export interface V1RoleRef {
  apiGroup: string
  kind: string
  name: string
}

export interface V1Subject {
  kind: 'User' | 'Group' | 'ServiceAccount'
  name: string
  namespace?: string
  apiGroup?: string
}

export interface V1ClusterRoleBinding {
  apiVersion?: string
  kind?: string
  metadata?: V1ObjectMeta
  roleRef: V1RoleRef
  subjects?: V1Subject[]
}

export interface ClusterRoleBindingFormData {
  name: string
  roleRef: {
    kind: 'ClusterRole'
    name: string
  }
  subjects: {
    kind: 'User' | 'Group' | 'ServiceAccount'
    name: string
    namespace?: string
  }[]
  labels: KeyValuePair[]
  annotations: KeyValuePair[]
}

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
 * ClusterRoleBinding YAML -> 表单数据
 * 解析时进行基本验证
 */
export function clusterRoleBindingYamlToForm(yamlStr: string): ClusterRoleBindingFormData {
  let crb: V1ClusterRoleBinding

  try {
    crb = yaml.load(yamlStr) as V1ClusterRoleBinding
  } catch (error: any) {
    throw new Error(`YAML 解析失败: ${error.message}`)
  }

  if (!crb || typeof crb !== 'object') {
    throw new Error('无效的 YAML 格式')
  }

  // 验证 kind
  if (crb.kind && crb.kind !== 'ClusterRoleBinding') {
    throw new Error(`资源类型不匹配，期望 ClusterRoleBinding，实际为 ${crb.kind}`)
  }

  const subjects = (crb.subjects || []).map((subject) => ({
    kind: subject.kind as 'User' | 'Group' | 'ServiceAccount',
    name: subject.name || '',
    namespace: subject.namespace || ''
  }))

  // 确保至少有一个空的 subject
  if (subjects.length === 0) {
    subjects.push({ kind: 'User', name: '', namespace: '' })
  }

  return {
    name: crb.metadata?.name || '',
    roleRef: {
      kind: 'ClusterRole',
      name: crb.roleRef?.name || ''
    },
    subjects,
    labels: recordToKeyValuePairs(crb.metadata?.labels),
    annotations: recordToKeyValuePairs(crb.metadata?.annotations)
  }
}

/**
 * ClusterRoleBinding 表单数据 -> YAML
 * 空表单也能生成有效的 YAML 结构
 */
export function clusterRoleBindingFormToYaml(form: ClusterRoleBindingFormData): string {
  // 构建 subjects
  const subjects: V1Subject[] = []

  for (const subject of form.subjects) {
    // 只添加有名称的 subject
    if (subject.name && subject.name.trim()) {
      if (subject.kind === 'ServiceAccount') {
        subjects.push({
          kind: 'ServiceAccount',
          name: subject.name.trim(),
          namespace: subject.namespace?.trim() || 'default',
          apiGroup: ''
        })
      } else {
        subjects.push({
          kind: subject.kind,
          name: subject.name.trim(),
          apiGroup: 'rbac.authorization.k8s.io'
        })
      }
    }
  }

  const crb: V1ClusterRoleBinding = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'ClusterRoleBinding',
    metadata: {
      name: form.name, // 允许空字符串
      labels: keyValuePairsToRecord(form.labels),
      annotations: keyValuePairsToRecord(form.annotations)
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: form.roleRef.name // 允许空字符串
    },
    subjects: subjects // 可以是空数组
  }

  // 清理 metadata 中的 undefined 值
  if (!crb.metadata!.labels) delete crb.metadata!.labels
  if (!crb.metadata!.annotations) delete crb.metadata!.annotations

  return yaml.dump(crb, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  })
}

/**
 * 验证 ClusterRoleBinding 表单数据（提交时调用）
 */
export function validateClusterRoleBindingForm(form: ClusterRoleBindingFormData): void {
  if (!form.name || form.name.trim() === '') {
    throw new Error('ClusterRoleBinding 名称不能为空')
  }

  if (!validateClusterRoleBindingName(form.name)) {
    throw new Error('名称格式不正确（只能包含小写字母、数字和连字符，且必须以字母数字开头和结尾）')
  }

  if (!form.roleRef.name || form.roleRef.name.trim() === '') {
    throw new Error('必须选择一个 ClusterRole')
  }

  if (!form.subjects || form.subjects.length === 0) {
    throw new Error('至少需要一个主体 (Subject)')
  }

  // 验证每个 subject
  let hasValidSubject = false
  for (let i = 0; i < form.subjects.length; i++) {
    const subject = form.subjects[i]

    if (!subject.name || subject.name.trim() === '') {
      continue // 跳过空的
    }

    hasValidSubject = true

    if (subject.kind === 'ServiceAccount') {
      if (!subject.namespace || subject.namespace.trim() === '') {
        throw new Error(`主体 ${i + 1} 是 ServiceAccount，必须指定命名空间`)
      }
    }
  }

  if (!hasValidSubject) {
    throw new Error('至少需要一个有效的主体（主体名称不能为空）')
  }
}

/** 创建空表单 */
export function createEmptyClusterRoleBindingForm(): ClusterRoleBindingFormData {
  return {
    name: '',
    roleRef: {
      kind: 'ClusterRole',
      name: ''
    },
    subjects: [
      {
        kind: 'User',
        name: '',
        namespace: ''
      }
    ],
    labels: [],
    annotations: []
  }
}

/** 验证名称格式 */
export function validateClusterRoleBindingName(name: string): boolean {
  const pattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/
  return pattern.test(name) && name.length <= 253
}

/** 验证 Subject */
export function validateSubject(subject: { kind: string; name: string; namespace?: string }): {
  valid: boolean
  error?: string
} {
  if (!subject.name || subject.name.trim() === '') {
    return { valid: false, error: '主体名称不能为空' }
  }

  if (subject.kind === 'ServiceAccount') {
    if (!subject.namespace || subject.namespace.trim() === '') {
      return { valid: false, error: 'ServiceAccount 必须指定命名空间' }
    }
  }

  return { valid: true }
}