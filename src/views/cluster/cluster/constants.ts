import {
  Zap,
  Activity,
  Package,
  Shield,
  Server,
  Wifi,
  Cloud,
  FileText,
  Key,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-vue-next'

// 环境类型配置
export const environmentOptions = [
  {
    value: 'development',
    label: '开发环境',
    shortLabel: 'DEV',
    icon: Zap,
    emoji: '💻',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    bgColor: 'rgba(102, 126, 234, 0.1)',
    color: 'rgba(102, 126, 234, 0.1)',
    type: 'success' as const
  },
  {
    value: 'testing',
    label: '测试环境',
    shortLabel: 'TEST',
    icon: Activity,
    emoji: '🧪',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    bgColor: 'rgba(240, 147, 251, 0.1)',
    color: 'rgba(250, 147, 255, 0.1)',
    type: 'info' as const
  },
  {
    value: 'staging',
    label: '预发布环境',
    shortLabel: 'STG',
    icon: Package,
    emoji: '🚀',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    bgColor: 'rgba(250, 112, 154, 0.1)',
    color: 'rgba(250, 112, 154, 0.1)',
    type: 'warning' as const
  },
  {
    value: 'production',
    label: '生产环境',
    shortLabel: 'PROD',
    icon: Shield,
    emoji: '⚡',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    bgColor: 'rgba(48, 207, 208, 0.1)',
    color: 'rgba(48, 207, 208, 0.1)',
    type: 'danger' as const
  }
]

// 集群类型配置
export const clusterTypeOptions = [
  {
    value: 'standard',
    label: '标准集群',
    shortLabel: 'Standard',
    icon: Server,
    badge: '推荐',
    badgeType: 'success' as const,
    desc: '适用于常规工作负载，提供完整功能',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)'
  },
  {
    value: 'edge',
    label: '边缘集群',
    shortLabel: 'Edge',
    icon: Wifi,
    badge: '',
    badgeType: '' as const,
    desc: '部署在边缘节点，低延迟高性能',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)'
  },
  {
    value: 'serverless',
    label: '无服务器',
    shortLabel: 'Serverless',
    icon: Cloud,
    badge: 'Hot',
    badgeType: 'danger' as const,
    desc: '按需付费，自动伸缩，免运维',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)'
  }
]

// 云服务商配置
export const providerOptions = [
  {
    value: 'aws',
    label: 'AWS',
    logo: '🔶',
    bgColor: '#FF9900'
  },
  {
    value: 'azure',
    label: 'Azure',
    logo: '🔷',
    bgColor: '#0078D4'
  },
  {
    value: 'gcp',
    label: 'Google Cloud',
    logo: '🔴',
    bgColor: '#4285F4'
  },
  {
    value: 'alibaba',
    label: '阿里云',
    logo: '☁️',
    bgColor: '#FF6A00'
  },
  {
    value: 'tencent',
    label: '腾讯云',
    logo: '☁️',
    bgColor: '#006EFF'
  },
  {
    value: 'huawei',
    label: '华为云',
    logo: '☁️',
    bgColor: '#C7000B'
  },
  {
    value: 'self-hosted',
    label: '自建集群',
    logo: '🏠',
    bgColor: '#6366F1'
  }
]

// 认证类型配置
export const authTypeOptions = [
  {
    value: 'kubeconfig',
    label: 'KubeConfig',
    icon: FileText,
    desc: '使用 KubeConfig 文件进行认证，包含完整的集群访问信息',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
  },
  {
    value: 'token',
    label: 'Token',
    icon: Key,
    desc: '使用 Bearer Token 进行认证，需要额外提供 API Server 地址',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
  },
  {
    value: 'certificate',
    label: '证书',
    icon: Shield,
    desc: '使用客户端证书和密钥进行双向 TLS 认证',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
  },
  {
    value: 'incluster',
    label: '集群内部',
    icon: Lock,
    desc: '在集群内部运行，使用 ServiceAccount 进行认证',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
  }
]

// 健康状态配置
export const healthStatusConfig: Record<number, any> = {
  1: {
    color: '#10b981',
    label: '健康',
    icon: CheckCircle,
    bgColor: 'rgba(16, 185, 129, 0.1)',
    pulse: false,
    value: 100
  },
  2: {
    color: '#ef4444',
    label: '异常',
    icon: XCircle,
    bgColor: 'rgba(239, 68, 68, 0.1)',
    pulse: true,
    value: 25
  },
  3: {
    color: '#f59e0b',
    label: '降级',
    icon: AlertCircle,
    bgColor: 'rgba(245, 158, 11, 0.1)',
    pulse: false,
    value: 60
  },
  4: {
    color: '#6b7280',
    label: '未知',
    icon: Clock,
    bgColor: 'rgba(107, 114, 128, 0.1)',
    pulse: false,
    value: 0
  }
}

// 同步状态配置
export const syncStatusConfig: Record<number, any> = {
  1: {
    label: '同步中',
    color: '#3b82f6',
    spinning: true,
    icon: RefreshCw,
    bgColor: 'rgba(59, 130, 246, 0.1)'
  },
  2: {
    label: '异常',
    color: '#ef4444',
    spinning: false,
    icon: XCircle,
    bgColor: 'rgba(239, 68, 68, 0.1)'
  },
  3: {
    label: '已同步',
    color: '#10b981',
    spinning: false,
    icon: CheckCircle,
    bgColor: 'rgba(16, 185, 129, 0.1)'
  }
}
