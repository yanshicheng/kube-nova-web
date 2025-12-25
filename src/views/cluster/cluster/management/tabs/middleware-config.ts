// middleware-config.ts
import {
  BarChart3,
  Activity,
  Monitor,
  Search,
  Eye,
  Database,
  GitBranch,
  Zap,
  Bell,
  Shield,
  Key,
  ShieldCheck,
  FileKey,
  Cloud,
  Lock
} from 'lucide-vue-next'

// ✅ 直接导入所有图片
import prometheusImg from '@/assets/img/cluster/prometheus.png'
import thanosImg from '@/assets/img/cluster/thanos.png'
import grafanaImg from '@/assets/img/cluster/grafana.png'
import victoriaMetricsImg from '@/assets/img/cluster/victoria-metrics.png'
import elasticsearchImg from '@/assets/img/cluster/elasticsearch.png'
import kibanaImg from '@/assets/img/cluster/kibana.png'
import fluentdImg from '@/assets/img/cluster/fluentd.png'
import jaegerImg from '@/assets/img/cluster/jaeger.png'
import skywalkingImg from '@/assets/img/cluster/skywalking.png'
import zipkinImg from '@/assets/img/cluster/zipkin.png'
import alertmanagerImg from '@/assets/img/cluster/alertmanager.png'
import karmaImg from '@/assets/img/cluster/karma.png'

// 应用类型枚举
export enum AppType {
  MONITORING = 1,
  LOGGING = 2,
  TRACING = 3,
  MESH = 4,
  ALERT = 5
}

export interface AppItem {
  name: string
  code: string
  type: string
  icon?: any
  iconSrc?: string
  description: string
  defaultPort: number
  isConfigured: boolean
  isHealthy: boolean
  features: string[]
  id?: number
}

export interface AppCategory {
  category: string
  categoryIcon?: any
  categoryiconSrc?: string
  color: string
  gradient: string
  items: AppItem[]
}

export const appTypeMap: Record<string, number> = {
  monitoring: AppType.MONITORING,
  logging: AppType.LOGGING,
  tracing: AppType.TRACING,
  mesh: AppType.MESH,
  alerting: AppType.ALERT
}

export const authTypeOptions = [
  {
    label: '无认证',
    value: 'none',
    icon: Shield,
    color: '#64748b',
    description: '无需任何认证即可访问'
  },
  {
    label: '基础认证',
    value: 'basic',
    icon: Key,
    color: '#3b82f6',
    description: '使用用户名和密码进行认证'
  },
  {
    label: 'Bearer Token',
    value: 'token',
    icon: ShieldCheck,
    color: '#8b5cf6',
    description: '使用 Bearer Token 进行认证'
  },
  {
    label: 'API Key',
    value: 'apikey',
    icon: FileKey,
    color: '#10b981',
    description: '使用 Access Key 和 Secret 进行认证'
  },
  {
    label: '证书认证',
    value: 'certificate',
    icon: Lock,
    color: '#ef4444',
    description: '使用客户端证书进行双向认证'
  }
]

export const protocolOptions = [
  { label: 'HTTP', value: 'http', icon: Cloud },
  { label: 'HTTPS', value: 'https', icon: Lock },
  { label: 'gRPC', value: 'grpc', icon: Database }
]

// 应用列表配置
export const middlewareApplications: AppCategory[] = [
  // 监控管理
  {
    category: '监控管理',
    categoryIcon: Monitor,
    categoryiconSrc: 'iconsys-monitor-category',
    color: '#667eea',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    items: [
      {
        name: 'Prometheus',
        code: 'prometheus',
        type: 'monitoring',
        iconSrc: prometheusImg,
        description: '开源监控和告警工具包',
        defaultPort: 9090,
        isConfigured: false,
        isHealthy: false,
        features: ['指标收集', '数据存储', '查询语言', '告警规则']
      },
      {
        name: 'Thanos',
        code: 'thanos',
        type: 'monitoring',
        iconSrc: thanosImg,
        description: '高可用性 Prometheus 长期存储',
        defaultPort: 10902,
        isConfigured: false,
        isHealthy: false,
        features: ['长期存储', '全局查询', '降采样', '压缩']
      },
      {
        name: 'Grafana',
        code: 'grafana',
        type: 'monitoring',
        iconSrc: grafanaImg,
        description: '开源可视化和监控平台',
        defaultPort: 3000,
        isConfigured: false,
        isHealthy: false,
        features: ['数据可视化', '仪表板', '告警', '多数据源']
      },
      {
        name: 'VictoriaMetrics',
        code: 'victoria-metrics',
        type: 'monitoring',
        icon: BarChart3,
        iconSrc: victoriaMetricsImg,
        description: '快速、经济高效的监控解决方案',
        defaultPort: 8428,
        isConfigured: false,
        isHealthy: false,
        features: ['高性能', '低成本', '长期存储', 'PromQL兼容']
      }
    ]
  },
  // 日志管理
  {
    category: '日志管理',
    categoryIcon: FileKey,
    categoryiconSrc: 'iconsys-log-category',
    color: '#f093fb',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    items: [
      {
        name: 'Elasticsearch',
        code: 'elasticsearch',
        type: 'logging',
        iconSrc: elasticsearchImg,
        description: '分布式搜索和分析引擎',
        defaultPort: 9200,
        isConfigured: false,
        isHealthy: false,
        features: ['全文搜索', '实时分析', '分布式', 'RESTful API']
      },
      {
        name: 'Loki',
        code: 'loki',
        type: 'logging',
        iconSrc: grafanaImg,
        description: '水平可扩展的日志聚合系统',
        defaultPort: 3100,
        isConfigured: false,
        isHealthy: false,
        features: ['低成本', '无索引', 'LogQL', 'Grafana集成']
      },
      {
        name: 'Kibana',
        code: 'kibana',
        type: 'logging',
        iconSrc: kibanaImg,
        description: 'Elasticsearch 数据可视化工具',
        defaultPort: 5601,
        isConfigured: false,
        isHealthy: false,
        features: ['数据探索', '可视化', '仪表板', '机器学习']
      },
      {
        name: 'Fluentd',
        code: 'fluentd',
        type: 'logging',
        iconSrc: fluentdImg,
        description: '统一的日志收集器',
        defaultPort: 24224,
        isConfigured: false,
        isHealthy: false,
        features: ['数据收集', '过滤转换', '多输出', '插件生态']
      }
    ]
  },
  // 链路追踪
  {
    category: '链路追踪',
    categoryIcon: GitBranch,
    categoryiconSrc: 'iconsys-trace-category',
    color: '#4facfe',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    items: [
      {
        name: 'Jaeger',
        code: 'jaeger',
        type: 'tracing',
        iconSrc: jaegerImg,
        description: '端到端分布式追踪系统',
        defaultPort: 16686,
        isConfigured: false,
        isHealthy: false,
        features: ['分布式追踪', '性能优化', '根因分析', '服务依赖']
      },
      {
        name: 'SkyWalking',
        code: 'skywalking',
        type: 'tracing',
        iconSrc: skywalkingImg,
        description: '应用性能监控系统',
        defaultPort: 8080,
        isConfigured: false,
        isHealthy: false,
        features: ['APM', '服务网格', '数据库监控', '多语言支持']
      },
      {
        name: 'Zipkin',
        code: 'zipkin',
        type: 'tracing',
        iconSrc: zipkinImg,
        description: '分布式追踪系统',
        defaultPort: 9411,
        isConfigured: false,
        isHealthy: false,
        features: ['追踪收集', '查询服务', '依赖分析', 'UI界面']
      }
    ]
  },
  // 告警管理
  {
    category: '告警管理',
    categoryIcon: Bell,
    categoryiconSrc: 'iconsys-alert-category',
    color: '#fa709a',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    items: [
      {
        name: 'AlertManager',
        code: 'alertmanager',
        type: 'alerting',
        iconSrc: alertmanagerImg,
        description: '处理由 Prometheus 发送的告警',
        defaultPort: 9093,
        isConfigured: false,
        isHealthy: false,
        features: ['告警分组', '告警抑制', '告警静默', '通知路由']
      },
      {
        name: 'Karma',
        code: 'karma',
        type: 'alerting',
        iconSrc: karmaImg,
        description: 'AlertManager 告警仪表板',
        defaultPort: 8080,
        isConfigured: false,
        isHealthy: false,
        features: ['告警聚合', '多实例支持', '告警过滤', '静默管理']
      }
    ]
  }
]

export function getAppTypeLabel(appType: number): string {
  switch (appType) {
    case AppType.MONITORING:
      return '监控'
    case AppType.LOGGING:
      return '日志'
    case AppType.TRACING:
      return '链路追踪'
    case AppType.MESH:
      return '服务网格'
    case AppType.ALERT:
      return '告警'
    default:
      return '未知'
  }
}

export function getAuthTypeLabel(authType: string): string {
  const option = authTypeOptions.find((opt) => opt.value === authType)
  return option?.label || authType
}

export function getAppStatusInfo(status: number) {
  switch (status) {
    case 1:
      return { label: '正常', type: 'success', color: '#10b981' }
    case 2:
      return { label: '异常', type: 'danger', color: '#ef4444' }
    case 3:
      return { label: '未知', type: 'info', color: '#6b7280' }
    default:
      return { label: '未配置', type: 'warning', color: '#f59e0b' }
  }
}
