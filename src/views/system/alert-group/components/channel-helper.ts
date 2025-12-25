import {
  ChatDotRound,
  Message,
  Postcard,
  Promotion,
  Phone,
  Link,
  Bell
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

// 渠道类型配置
export const channelTypes = [
  {
    value: 'dingtalk',
    label: '钉钉',
    icon: ChatDotRound,
    color: '#1677FF'
  },
  {
    value: 'wechat',
    label: '企业微信',
    icon: Message,
    color: '#07C160'
  },
  {
    value: 'feishu',
    label: '飞书',
    icon: Postcard,
    color: '#00D6B9'
  },
  {
    value: 'email',
    label: '邮件',
    icon: Promotion,
    color: '#F56C6C'
  },
  {
    value: 'sms',
    label: '短信',
    icon: ChatDotRound,
    color: '#E6A23C'
  },
  {
    value: 'voice_call',
    label: '语音电话',
    icon: Phone,
    color: '#909399'
  },
  {
    value: 'webhook',
    label: 'Webhook',
    icon: Link,
    color: '#67C23A'
  }
]

/**
 * 获取渠道图标
 */
export function getChannelIcon(type: string): Component {
  const channel = channelTypes.find(item => item.value === type)
  return channel?.icon || Bell
}

/**
 * 获取渠道颜色
 */
export function getChannelColor(type: string): string {
  const channel = channelTypes.find(item => item.value === type)
  return channel?.color || '#909399'
}

/**
 * 获取渠道类型名称
 */
export function getChannelTypeName(type: string): string {
  const channel = channelTypes.find(item => item.value === type)
  return channel?.label || type
}

/**
 * 获取渠道配置模板
 */
export function getChannelConfigTemplate(type: string): any {
  const templates: Record<string, any> = {
    dingtalk: {
      webhook: '',
      secret: ''
    },
    wechat: {
      webhook: ''
    },
    feishu: {
      webhook: '',
      secret: ''
    },
    email: {
      smtpHost: '',
      smtpPort: 465,
      username: '',
      password: '',
      fromEmail: '',
      useSSL: true
    },
    webhook: {
      url: '',
      authType: 'none',
      method: 'POST'
    }
  }
  return templates[type] || {}
}