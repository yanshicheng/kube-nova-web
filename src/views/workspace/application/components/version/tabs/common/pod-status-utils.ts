// pod-status-utils.ts - Pod 状态工具函数

import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader,
  AlertTriangle,
  Package,
  HardDrive,
  Network,
  Cpu,
  Zap
} from 'lucide-vue-next'
import type { Component } from 'vue'

export type PodStatusType = 'success' | 'warning' | 'danger' | 'info'

const statusConfig: Record<
  string,
  {
    type: PodStatusType
    icon: Component
    color: string
    description: string
    canExec: boolean
  }
> = {
  // 健康状态
  Running: {
    type: 'success',
    icon: CheckCircle,
    color: '#67c23a',
    description: 'Pod 正在运行且健康',
    canExec: true
  },
  Succeeded: {
    type: 'success',
    icon: CheckCircle,
    color: '#67c23a',
    description: 'Pod 已成功完成',
    canExec: false
  },
  Completed: {
    type: 'success',
    icon: CheckCircle,
    color: '#67c23a',
    description: '容器已正常完成',
    canExec: false
  },

  // 初始化状态
  Pending: {
    type: 'warning',
    icon: Clock,
    color: '#e6a23c',
    description: 'Pod 等待调度或初始化',
    canExec: false
  },
  ContainerCreating: {
    type: 'info',
    icon: Loader,
    color: '#409eff',
    description: '容器正在创建',
    canExec: false
  },
  PodInitializing: {
    type: 'info',
    icon: Loader,
    color: '#409eff',
    description: 'Pod 初始化容器正在执行',
    canExec: false
  },

  // 删除/驱逐
  Terminating: {
    type: 'warning',
    icon: Loader,
    color: '#e6a23c',
    description: 'Pod 正在删除',
    canExec: false
  },
  Evicted: {
    type: 'danger',
    icon: XCircle,
    color: '#f56c6c',
    description: 'Pod 因资源不足被驱逐',
    canExec: false
  },

  // 镜像错误
  ErrImagePull: {
    type: 'danger',
    icon: Package,
    color: '#f56c6c',
    description: '镜像拉取失败',
    canExec: false
  },
  ImagePullBackOff: {
    type: 'danger',
    icon: Package,
    color: '#f56c6c',
    description: '镜像拉取失败，进入退避重试',
    canExec: false
  },
  InvalidImageName: {
    type: 'danger',
    icon: Package,
    color: '#f56c6c',
    description: '无效的镜像名称',
    canExec: false
  },

  // 运行时错误
  CrashLoopBackOff: {
    type: 'danger',
    icon: AlertCircle,
    color: '#f56c6c',
    description: '容器反复崩溃重启',
    canExec: false
  },
  OOMKilled: {
    type: 'danger',
    icon: Cpu,
    color: '#f56c6c',
    description: '容器因内存溢出被终止',
    canExec: false
  },
  Error: {
    type: 'danger',
    icon: XCircle,
    color: '#f56c6c',
    description: '容器执行错误',
    canExec: false
  },
  Failed: {
    type: 'danger',
    icon: XCircle,
    color: '#f56c6c',
    description: 'Pod 执行失败',
    canExec: false
  },

  // 创建错误
  CreateContainerConfigError: {
    type: 'danger',
    icon: AlertTriangle,
    color: '#f56c6c',
    description: '容器配置错误',
    canExec: false
  },
  CreateContainerError: {
    type: 'danger',
    icon: AlertTriangle,
    color: '#f56c6c',
    description: '容器创建失败',
    canExec: false
  },

  // 存储错误
  FailedMount: {
    type: 'danger',
    icon: HardDrive,
    color: '#f56c6c',
    description: '卷挂载失败',
    canExec: false
  },
  FailedAttachVolume: {
    type: 'danger',
    icon: HardDrive,
    color: '#f56c6c',
    description: '卷附加失败',
    canExec: false
  },

  // 网络错误
  FailedCreatePodSandBox: {
    type: 'danger',
    icon: Network,
    color: '#f56c6c',
    description: 'Pod 沙盒创建失败',
    canExec: false
  },
  NetworkPluginNotReady: {
    type: 'danger',
    icon: Network,
    color: '#f56c6c',
    description: '网络插件未就绪',
    canExec: false
  },

  // 调度错误
  Unschedulable: {
    type: 'warning',
    icon: AlertTriangle,
    color: '#e6a23c',
    description: 'Pod 无法调度',
    canExec: false
  },

  // 钩子错误
  PostStartHookError: {
    type: 'danger',
    icon: Zap,
    color: '#f56c6c',
    description: 'PostStart 钩子执行失败',
    canExec: false
  },

  // 其他
  NotReady: {
    type: 'warning',
    icon: AlertTriangle,
    color: '#e6a23c',
    description: '容器运行但健康检查未通过',
    canExec: true
  },
  Unknown: {
    type: 'info',
    icon: AlertCircle,
    color: '#909399',
    description: '无法获取 Pod 状态',
    canExec: false
  }
}

export function getStatusConfig(status: string) {
  if (statusConfig[status]) {
    return statusConfig[status]
  }

  // 处理 Init: 前缀
  if (status.startsWith('Init:')) {
    const suffix = status.substring(5)
    if (suffix.includes('/')) {
      return {
        type: 'info' as PodStatusType,
        icon: Loader,
        color: '#409eff',
        description: '初始化容器执行中',
        canExec: false
      }
    } else {
      return {
        type: 'danger' as PodStatusType,
        icon: XCircle,
        color: '#f56c6c',
        description: `初始化容器 ${suffix}`,
        canExec: false
      }
    }
  }

  // 默认配置
  return {
    type: 'info' as PodStatusType,
    icon: AlertCircle,
    color: '#909399',
    description: status,
    canExec: false
  }
}

export function getStatusType(status: string): PodStatusType {
  return getStatusConfig(status).type
}

export function getStatusIcon(status: string): Component {
  return getStatusConfig(status).icon
}

export function canExecTerminal(status: string): boolean {
  return getStatusConfig(status).canExec
}

export function getAllStatusOptions() {
  const statuses = [
    'Running',
    'Pending',
    'ContainerCreating',
    'PodInitializing',
    'Terminating',
    'Succeeded',
    'Failed',
    'CrashLoopBackOff',
    'ImagePullBackOff',
    'ErrImagePull',
    'OOMKilled',
    'Evicted',
    'Error',
    'Unknown',
    'NotReady',
    'Unschedulable',
    'FailedMount',
    'CreateContainerError'
  ]

  return statuses.map((status) => ({
    label: status,
    value: status
  }))
}