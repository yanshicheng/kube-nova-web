/**
 * IngressClass 类型定义和转换
 * 确保 YAML 和表单之间转换时不丢失任何数据
 */

import * as yaml from 'js-yaml'

// ==================== 基础类型 ====================

export interface KeyValuePair {
  key: string
  value: string
}

// ==================== Kubernetes 类型 ====================

export interface V1ObjectMeta {
  name?: string
  namespace?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
  uid?: string
  resourceVersion?: string
  creationTimestamp?: Date
}

export interface V1IngressClassParametersReference {
  apiGroup?: string
  kind: string
  name: string
  namespace?: string
  scope?: 'Cluster' | 'Namespace'
}

export interface V1IngressClassSpec {
  controller?: string
  parameters?: V1IngressClassParametersReference
}

export interface V1IngressClass {
  apiVersion?: string
  kind?: string
  metadata?: V1ObjectMeta
  spec?: V1IngressClassSpec
}

// ==================== 表单数据类型 ====================

export interface IngressClassFormData {
  name: string
  controller: string
  isDefault: boolean
  hasParameters: boolean
  parameters: {
    apiGroup: string
    kind: string
    name: string
    namespace: string
    scope: 'Cluster' | 'Namespace'
  }
  labels: KeyValuePair[]
  annotations: KeyValuePair[]
}

// ==================== 常量 ====================

export const COMMON_CONTROLLERS = [
  {
    label: 'NGINX Ingress Controller',
    value: 'k8s.io/ingress-nginx',
    description: 'Kubernetes 社区维护的 NGINX 控制器'
  },
  {
    label: 'Traefik',
    value: 'traefik.io/ingress-controller',
    description: '现代化的云原生边缘路由器'
  },
  {
    label: 'HAProxy',
    value: 'haproxy.org/ingress-controller',
    description: '高性能的负载均衡器'
  },
  {
    label: 'NGINX Inc',
    value: 'nginx.org/ingress-controller',
    description: 'NGINX Inc 商业版本'
  },
  {
    label: 'Contour',
    value: 'projectcontour.io/contour',
    description: '基于 Envoy 的 Ingress 控制器'
  }
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

// ==================== 转换函数 ====================

/**
 * 验证控制器名称格式
 * 控制器名称通常是域名格式
 */
export function validateControllerName(controller: string): boolean {
  if (!controller || controller.trim() === '') {
    return false
  }
  // 简单验证：至少包含一个点号，类似域名格式
  return controller.includes('.') || controller.includes('/')
}

/**
 * IngressClass 类型定义和转换（改造版）
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

export interface V1IngressClassParametersReference {
  apiGroup?: string
  kind: string
  name: string
  namespace?: string
  scope?: string
}

export interface V1IngressClassSpec {
  controller?: string
  parameters?: V1IngressClassParametersReference
}

export interface V1IngressClass {
  apiVersion?: string
  kind?: string
  metadata?: V1ObjectMeta
  spec?: V1IngressClassSpec
}

export interface IngressClassFormData {
  name: string
  controller: string
  isDefault: boolean
  hasParameters: boolean
  parameters: {
    apiGroup: string
    kind: string
    name: string
    namespace: string
    scope: 'Cluster' | 'Namespace'
  }
  labels: KeyValuePair[]
  annotations: KeyValuePair[]
}

// ==================== 转换函数（无验证）====================

/** IngressClass YAML -> 表单数据 */
export function ingressClassYamlToForm(yamlStr: string): IngressClassFormData {
  const ic = yaml.load(yamlStr) as V1IngressClass

  const isDefault =
    ic.metadata?.annotations?.['ingressclass.kubernetes.io/is-default-class'] === 'true'

  const hasParameters = !!ic.spec?.parameters

  return {
    name: ic.metadata?.name || '',
    controller: ic.spec?.controller || '',
    isDefault,
    hasParameters,
    parameters: {
      apiGroup: ic.spec?.parameters?.apiGroup || '',
      kind: ic.spec?.parameters?.kind || '',
      name: ic.spec?.parameters?.name || '',
      namespace: ic.spec?.parameters?.namespace || '',
      scope: (ic.spec?.parameters?.scope as 'Cluster' | 'Namespace') || 'Cluster'
    },
    labels: recordToKeyValuePairs(ic.metadata?.labels),
    annotations: recordToKeyValuePairs(
      // 过滤掉 isDefaultClass annotation，因为它是由 isDefault 控制的
      Object.fromEntries(
        Object.entries(ic.metadata?.annotations || {}).filter(
          ([key]) => key !== 'ingressclass.kubernetes.io/is-default-class'
        )
      )
    )
  }
}

/**
 * IngressClass 表单数据 -> YAML
 * 🔥 核心改造：不验证，允许空值，给默认值
 */
export function ingressClassFormToYaml(form: IngressClassFormData): string {
  // 🔥 处理 annotations
  const annotations = keyValuePairsToRecord(form.annotations) || {}

  // 设置默认类标记
  if (form.isDefault) {
    annotations['ingressclass.kubernetes.io/is-default-class'] = 'true'
  }

  // 🔥 构建 parameters（如果启用且有效）
  let parameters: V1IngressClassParametersReference | undefined = undefined

  if (form.hasParameters) {
    // 只有当至少有 kind 和 name 时才添加 parameters
    if (form.parameters.kind?.trim() && form.parameters.name?.trim()) {
      parameters = {
        kind: form.parameters.kind.trim(),
        name: form.parameters.name.trim()
      }

      // 添加可选字段（如果有值）
      if (form.parameters.apiGroup?.trim()) {
        parameters.apiGroup = form.parameters.apiGroup.trim()
      }

      if (form.parameters.scope === 'Namespace' && form.parameters.namespace?.trim()) {
        parameters.namespace = form.parameters.namespace.trim()
        parameters.scope = 'Namespace'
      }
    }
  }

  const ic: V1IngressClass = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'IngressClass',
    metadata: {
      name: form.name.trim() || 'ingressclass-name', // 🔥 空时给默认值
      labels: keyValuePairsToRecord(form.labels),
      annotations: Object.keys(annotations).length > 0 ? annotations : undefined
    },
    spec: {
      controller: form.controller.trim() || 'example.com/ingress-controller', // 🔥 空时给默认值
      parameters // 🔥 可能是 undefined
    }
  }

  return yaml.dump(ic, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  })
}

// ==================== 验证函数（独立）====================

/**
 * 验证 IngressClass 表单数据
 * 🔥 只在提交时调用
 */
export function validateIngressClassForm(form: IngressClassFormData): void {
  if (!form.name || form.name.trim() === '') {
    throw new Error('IngressClass 名称不能为空')
  }

  if (!validateIngressClassName(form.name)) {
    throw new Error('名称格式不正确（只能包含小写字母、数字和连字符，且必须以字母数字开头和结尾）')
  }

  if (!form.controller || form.controller.trim() === '') {
    throw new Error('控制器不能为空')
  }

  // 如果启用了 parameters，验证必填字段
  if (form.hasParameters) {
    if (!form.parameters.kind || form.parameters.kind.trim() === '') {
      throw new Error('参数的 Kind 不能为空')
    }

    if (!form.parameters.name || form.parameters.name.trim() === '') {
      throw new Error('参数的 Name 不能为空')
    }

    // 如果 scope 是 Namespace，必须指定 namespace
    if (form.parameters.scope === 'Namespace') {
      if (!form.parameters.namespace || form.parameters.namespace.trim() === '') {
        throw new Error('当参数范围为 Namespace 时，必须指定命名空间')
      }
    }
  }
}

/** 创建空表单 */
export function createEmptyIngressClassForm(): IngressClassFormData {
  return {
    name: '',
    controller: '',
    isDefault: false,
    hasParameters: false,
    parameters: {
      apiGroup: '',
      kind: '',
      name: '',
      namespace: '',
      scope: 'Cluster'
    },
    labels: [],
    annotations: []
  }
}

/** 验证名称格式 */
export function validateIngressClassName(name: string): boolean {
  // RFC 1123 subdomain (DNS label)
  const pattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
  return pattern.test(name) && name.length <= 253
}
