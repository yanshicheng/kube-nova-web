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

// 直接导入图片
import DingtalkImg from '@/assets/icons/channels/dingtalk.png'
import WechatImg from '@/assets/icons/channels/wechat.png'
import FeishuImg from '@/assets/icons/channels/Feishu.png'
import EmailImg from '@/assets/icons/channels/email-fill.png'
import SmsImg from '@/assets/icons/channels/comment-sms-copy.png'
import PhoneImg from '@/assets/icons/channels/phone.png'
import WebhookImg from '@/assets/icons/channels/webhook.png'

// 渠道类型配置
export const channelTypes = [
  {
    value: 'dingtalk',
    label: '钉钉',
    icon: ChatDotRound,
    imageUrl: DingtalkImg,
    color: '#1677FF',
    gradient: 'linear-gradient(135deg, #1677FF 0%, #0E5FCC 100%)'
  },
  {
    value: 'wechat',
    label: '企业微信',
    icon: Message,
    imageUrl: WechatImg,
    color: '#07C160',
    gradient: 'linear-gradient(135deg, #07C160 0%, #059048 100%)'
  },
  {
    value: 'feishu',
    label: '飞书',
    icon: Postcard,
    imageUrl: FeishuImg,
    color: '#00D6B9',
    gradient: 'linear-gradient(135deg, #00D6B9 0%, #00A896 100%)'
  },
  {
    value: 'email',
    label: '邮件',
    icon: Promotion,
    imageUrl: EmailImg,
    color: '#F56C6C',
    gradient: 'linear-gradient(135deg, #F56C6C 0%, #E03E3E 100%)'
  },
  {
    value: 'sms',
    label: '短信',
    icon: ChatDotRound,
    imageUrl: SmsImg,
    color: '#E6A23C',
    gradient: 'linear-gradient(135deg, #E6A23C 0%, #CF7E1F 100%)'
  },
  {
    value: 'voice_call',
    label: '语音电话',
    icon: Phone,
    imageUrl: PhoneImg,
    color: '#909399',
    gradient: 'linear-gradient(135deg, #909399 0%, #73767A 100%)'
  },
  {
    value: 'webhook',
    label: 'Webhook',
    icon: Link,
    imageUrl: WebhookImg,
    color: '#67C23A',
    gradient: 'linear-gradient(135deg, #67C23A 0%, #529B2E 100%)'
  },
  {
    value: 'site_message',
    label: '站内信',
    icon: Bell,
    imageUrl: null,
    color: '#409EFF',
    gradient: 'linear-gradient(135deg, #409EFF 0%, #337ECC 100%)'
  }
]

/**
 * 获取渠道图标组件（用于Element Plus图标）
 */
export function getChannelIcon(type: string): Component {
  const channel = channelTypes.find((item) => item.value === type)
  return channel?.icon || Bell
}

/**
 * 获取渠道图片URL（PNG）
 */
export function getChannelImageUrl(type: string): string | null {
  const channel = channelTypes.find((item) => item.value === type)
  return channel?.imageUrl || null
}

/**
 * 获取渠道颜色
 */
export function getChannelColor(type: string): string {
  const channel = channelTypes.find((item) => item.value === type)
  return channel?.color || '#909399'
}

/**
 * 获取渠道渐变色
 */
export function getChannelGradient(type: string): string {
  const channel = channelTypes.find((item) => item.value === type)
  return channel?.gradient || 'linear-gradient(135deg, #909399 0%, #73767A 100%)'
}

/**
 * 获取渠道类型名称
 */
export function getChannelTypeName(type: string): string {
  const channel = channelTypes.find((item) => item.value === type)
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
    },
    site_message: {
      // 站内信不需要额外配置
    }
  }
  return templates[type] || {}
}