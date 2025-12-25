/**
 * 站内消息类型定义
 */

export interface MessageFilters {
  isRead: number // -1=全部, 0=未读, 1=已读
  category: string // 消息分类
  severity: string // 严重级别
  title: string // 标题关键词
}

export interface AlertInstance {
  id: number
  fingerprint: string
  alertName: string
  clusterName: string
  status: string
  severity: string
  description: string
  startsAt: number
  endsAt: number
  labels: string
  annotations: string
  generatorURL: string
}