import {
  Server,
  Wifi,
  Cloud,
  Zap,
  Activity,
  Package,
  Shield,
  FileText,
  Key,
  Lock
} from 'lucide-vue-next'

// 环境类型配置
export const environmentOptions = [
  {
    value: 'development',
    label: '开发环境',
    icon: Zap,
    shortLabel: 'DEV',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    value: 'testing',
    label: '测试环境',
    icon: Activity,
    shortLabel: 'TEST',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    gradient: 'linear-gradient(135deg, #868e96 0%, #596164 100%)'
  },
  {
    value: 'staging',
    label: '预发布环境',
    icon: Package,
    shortLabel: 'STG',
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    value: 'production',
    label: '生产环境',
    icon: Shield,
    shortLabel: 'PROD',
    color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  }
]

// 集群类型配置
export const clusterTypeOptions = [
  {
    value: 'standard',
    label: '标准集群',
    icon: Server,
    badge: '推荐',
    badgeType: 'success' as const,
    desc: '适用于常规工作负载，提供完整功能',
    shortLabel: 'Standard'
  },
  {
    value: 'edge',
    label: '边缘集群',
    icon: Wifi,
    badge: '',
    badgeType: '' as const,
    desc: '部署在边缘节点，低延迟高性能',
    shortLabel: 'Edge'
  },
  {
    value: 'serverless',
    label: '无服务器',
    icon: Cloud,
    badge: 'Hot',
    badgeType: 'danger' as const,
    desc: '按需付费，自动伸缩，免运维',
    shortLabel: 'Serverless'
  }
]

// 云服务商配置
export const providerOptions = [
  { value: 'aws', label: 'AWS', logo: '🔶', bgColor: '#FF9900' },
  { value: 'azure', label: 'Azure', logo: '🔷', bgColor: '#0078D4' },
  { value: 'gcp', label: 'Google Cloud', logo: '🔴', bgColor: '#4285F4' },
  { value: 'alibaba', label: '阿里云', logo: '☁️', bgColor: '#FF6A00' },
  { value: 'tencent', label: '腾讯云', logo: '☁️', bgColor: '#006EFF' },
  { value: 'huawei', label: '华为云', logo: '☁️', bgColor: '#C7000B' },
  { value: 'self-hosted', label: '自建集群', logo: '🏠', bgColor: '#6366F1' }
]

// 认证类型配置
export const authTypeOptions = [
  {
    value: 'kubeconfig',
    label: 'KubeConfig',
    icon: FileText,
    desc: '使用 KubeConfig 文件进行认证，包含完整的集群访问信息'
  },
  {
    value: 'token',
    label: 'Token',
    icon: Key,
    desc: '使用 Bearer Token 进行认证，需要额外提供 API Server 地址'
  },
  {
    value: 'certificate',
    label: '证书',
    icon: Shield,
    desc: '使用客户端证书和密钥进行双向 TLS 认证'
  },
  {
    value: 'incluster',
    label: '集群内部',
    icon: Lock,
    desc: '在集群内部运行，使用 ServiceAccount 进行认证'
  }
]
