<template>
  <div class="art-card architecture-diagram-card">
    <div class="diagram-header">
      <h3 class="diagram-title">
        <ArtSvgIcon icon="ri:node-tree" class="title-icon" />
        系统架构拓扑图
      </h3>
      <div class="diagram-controls">
        <ElSwitch v-model="showConnections" active-text="连接线" size="small" />
        <ElSwitch v-model="showDataFlow" active-text="数据流" size="small" class="ml-3" />
        <ElButton
          type="primary"
          size="small"
          @click="resetView"
          class="ml-3"
          icon="Refresh"
          circle
          title="重置视图"
        />
      </div>
    </div>

    <div class="diagram-wrapper" ref="diagramWrapper">
      <!-- SVG 连接线层 -->
      <svg class="connections-svg" :style="{ display: showConnections ? 'block' : 'none' }">
        <defs>
          <!-- 箭头标记 - 紫色系 -->
          <marker
            id="arrow-web"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 8 2.5, 0 5" fill="#8B5CF6" />
          </marker>
          <marker
            id="arrow-bff"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 8 2.5, 0 5" fill="#667eea" />
          </marker>
          <marker
            id="arrow-rpc"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 8 2.5, 0 5" fill="#06b6d4" />
          </marker>
          <marker
            id="arrow-manager"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 8 2.5, 0 5" fill="#ec4899" />
          </marker>
          <marker
            id="arrow-infra"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 8 2.5, 0 5" fill="#6b7280" />
          </marker>

          <!-- 发光效果 -->
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 连接线组 -->
        <g class="connections-group">
          <!-- Web -> BFF 连接 -->
          <path
            v-for="line in webToBffLines"
            :key="line.id"
            :d="line.path"
            :stroke="line.color"
            stroke-width="2.5"
            fill="none"
            :marker-end="`url(#arrow-${line.type})`"
            class="connection-line"
            :class="{ animated: showDataFlow }"
            opacity="0.7"
          />

          <!-- BFF -> RPC 连接 -->
          <path
            v-for="line in bffToRpcLines"
            :key="line.id"
            :d="line.path"
            :stroke="line.color"
            stroke-width="2.5"
            fill="none"
            :marker-end="`url(#arrow-${line.type})`"
            class="connection-line"
            :class="{ animated: showDataFlow }"
            opacity="0.7"
          />

          <!-- RPC -> Manager 连接 -->
          <path
            v-for="line in rpcToManagerLines"
            :key="line.id"
            :d="line.path"
            :stroke="line.color"
            stroke-width="2"
            fill="none"
            :marker-end="`url(#arrow-${line.type})`"
            class="connection-line"
            :class="{ animated: showDataFlow }"
            stroke-dasharray="5,5"
            opacity="0.6"
          />

          <!-- Manager -> Infra 连接 -->
          <path
            v-for="line in managerToInfraLines"
            :key="line.id"
            :d="line.path"
            :stroke="line.color"
            stroke-width="2"
            fill="none"
            :marker-end="`url(#arrow-${line.type})`"
            class="connection-line"
            :class="{ animated: showDataFlow }"
            opacity="0.5"
          />
        </g>

        <!-- 数据流动画粒子 -->
        <g v-if="showDataFlow">
          <circle
            v-for="particle in dataParticles"
            :key="particle.id"
            r="4"
            :fill="particle.color"
            class="data-particle"
            filter="url(#glow)"
          >
            <animateMotion
              :path="particle.path"
              :dur="`${particle.duration}s`"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>

      <!-- 节点层 -->
      <div class="diagram-layers">
        <!-- Web 层 -->
        <div class="arch-layer web-layer">
          <div class="layer-title">
            <div class="title-bar web-bar"></div>
            <h4>Web 展示层</h4>
          </div>
          <div class="nodes-row single-node">
            <div class="arch-node web-node" :id="`node-web`" @click="showNodeInfo(webNode)">
              <div class="node-status-dot"></div>
              <div class="node-icon-wrapper">
                <ArtSvgIcon icon="ri:vuejs-line" class="node-icon" />
              </div>
              <div class="node-info">
                <div class="node-name">{{ webNode.name }}</div>
                <div class="node-desc">{{ webNode.desc }}</div>
              </div>
              <div class="node-badge">Vue 3</div>
            </div>
          </div>
        </div>

        <!-- BFF 层 -->
        <div class="arch-layer bff-layer">
          <div class="layer-title">
            <div class="title-bar bff-bar"></div>
            <h4>BFF 层 (API Gateway)</h4>
          </div>
          <div class="nodes-row">
            <div
              v-for="node in bffNodes"
              :key="node.id"
              class="arch-node bff-node"
              :id="`node-${node.id}`"
              @click="showNodeInfo(node)"
            >
              <div class="node-status-dot"></div>
              <div class="node-icon-wrapper">
                <ArtSvgIcon :icon="node.icon" class="node-icon" />
              </div>
              <div class="node-info">
                <div class="node-name">{{ node.name }}</div>
                <div class="node-desc">{{ node.desc }}</div>
              </div>
              <div class="node-badge">{{ node.endpoints }}+ APIs</div>
            </div>
          </div>
        </div>

        <!-- RPC 层 -->
        <div class="arch-layer rpc-layer">
          <div class="layer-title">
            <div class="title-bar rpc-bar"></div>
            <h4>RPC 服务层 (微服务)</h4>
          </div>
          <div class="nodes-row rpc-row">
            <div
              v-for="node in rpcNodes"
              :key="node.id"
              class="arch-node rpc-node"
              :id="`node-${node.id}`"
              @click="showNodeInfo(node)"
            >
              <div class="node-status-dot"></div>
              <div class="node-icon-wrapper">
                <ArtSvgIcon :icon="node.icon" class="node-icon" />
              </div>
              <div class="node-info">
                <div class="node-name">{{ node.name }}</div>
                <div class="node-desc">{{ node.desc }}</div>
              </div>
              <div class="node-tags">
                <span v-for="tag in node.tags?.slice(0, 2)" :key="tag">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Manager 层 -->
        <div class="arch-layer manager-layer">
          <div class="layer-title">
            <div class="title-bar manager-bar"></div>
            <h4>中间管理器层</h4>
          </div>
          <div class="nodes-row manager-row">
            <div
              v-for="node in managerNodes"
              :key="node.id"
              class="arch-node manager-node compact"
              :id="`node-${node.id}`"
              @click="showNodeInfo(node)"
            >
              <div class="node-status-dot"></div>
              <div class="node-icon-wrapper">
                <ArtSvgIcon :icon="node.icon" class="node-icon" />
              </div>
              <div class="node-info">
                <div class="node-name">{{ node.name }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Infrastructure 层 -->
        <div class="arch-layer infra-layer">
          <div class="layer-title">
            <div class="title-bar infra-bar"></div>
            <h4>基础设施层</h4>
          </div>
          <div class="nodes-row infra-row">
            <div
              v-for="node in infraNodes"
              :key="node.id"
              class="arch-node infra-node"
              :id="`node-${node.id}`"
              @click="showNodeInfo(node)"
            >
              <div class="node-status-dot"></div>
              <div class="node-icon-wrapper">
                <ArtSvgIcon :icon="node.icon" class="node-icon" />
              </div>
              <div class="node-info">
                <div class="node-name">{{ node.name }}</div>
                <div class="node-desc">{{ node.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 节点详情抽屉 -->
    <ElDrawer v-model="drawerVisible" :title="currentNode?.name" size="500px" direction="rtl">
      <div class="node-detail" v-if="currentNode">
        <div class="detail-header">
          <div class="detail-icon-large">
            <ArtSvgIcon :icon="currentNode.icon" />
          </div>
          <div class="detail-meta">
            <h3>{{ currentNode.name }}</h3>
            <p>{{ currentNode.desc }}</p>
          </div>
        </div>

        <ElDivider />

        <div class="detail-section" v-if="currentNode.tech">
          <h4><ArtSvgIcon icon="ri:code-box-line" /> 技术栈</h4>
          <div class="tech-tags">
            <ElTag v-for="tech in currentNode.tech" :key="tech" type="primary">{{ tech }}</ElTag>
          </div>
        </div>

        <div class="detail-section" v-if="currentNode.features">
          <h4><ArtSvgIcon icon="ri:function-line" /> 核心功能</h4>
          <ul class="feature-list">
            <li v-for="feature in currentNode.features" :key="feature">
              <ArtSvgIcon icon="ri:checkbox-circle-line" />
              {{ feature }}
            </li>
          </ul>
        </div>

        <div class="detail-section" v-if="currentNode.dependencies">
          <h4><ArtSvgIcon icon="ri:links-line" /> 依赖服务</h4>
          <div class="dep-tags">
            <ElTag
              v-for="dep in currentNode.dependencies"
              :key="dep"
              type="info"
              effect="plain"
            >
              {{ dep }}
            </ElTag>
          </div>
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { nextTick } from 'vue'

  interface ArchNode {
    id: string
    name: string
    desc: string
    icon: string
    endpoints?: number
    tags?: string[]
    tech?: string[]
    features?: string[]
    dependencies?: string[]
  }

  interface ConnectionLine {
    id: string
    path: string
    color: string
    type: string
  }

  interface DataParticle {
    id: number
    color: string
    path: string
    duration: number
  }

  const diagramWrapper = ref<HTMLElement>()
  const drawerVisible = ref(false)
  const currentNode = ref<ArchNode | null>(null)
  const showConnections = ref(true)
  const showDataFlow = ref(true)

  // 连接线数据
  const webToBffLines = ref<ConnectionLine[]>([])
  const bffToRpcLines = ref<ConnectionLine[]>([])
  const rpcToManagerLines = ref<ConnectionLine[]>([])
  const managerToInfraLines = ref<ConnectionLine[]>([])
  const dataParticles = ref<DataParticle[]>([])

  // Web 层节点
  const webNode: ArchNode = {
    id: 'web',
    name: 'Kube Nova Web',
    desc: 'Vue3 前端应用',
    icon: 'ri:vuejs-line',
    tech: ['Vue 3', 'TypeScript', 'Vite', 'Element Plus', 'Pinia'],
    features: ['多集群管理界面', '实时监控大屏', '权限管理', 'WebSocket 实时通信']
  }

  // BFF 层节点
  const bffNodes: ArchNode[] = [
    {
      id: 'portal-api',
      name: 'Portal API',
      desc: '门户网关',
      icon: 'ri:door-line',
      endpoints: 50,
      tech: ['Go-Zero', 'REST API'],
      features: ['用户认证', '权限校验', '告警通知', '站内消息', '文件上传'],
      dependencies: ['portal-rpc', 'Redis', 'JWT']
    },
    {
      id: 'manager-api',
      name: 'Manager API',
      desc: '集群管理网关',
      icon: 'ri:server-line',
      endpoints: 80,
      tech: ['Go-Zero', 'REST API'],
      features: ['集群管理', '项目管理', '资源调度', '审计日志'],
      dependencies: ['manager-rpc', 'K8s Manager']
    },
    {
      id: 'console-api',
      name: 'Console API',
      desc: '控制台网关',
      icon: 'ri:terminal-box-line',
      endpoints: 40,
      tech: ['Go-Zero', 'REST API'],
      features: ['镜像仓库', 'Prometheus 配置', '工作负载'],
      dependencies: ['console-rpc', 'Harbor Manager']
    },
    {
      id: 'workload-api',
      name: 'Workload API',
      desc: '工作负载网关',
      icon: 'ri:stack-line',
      endpoints: 60,
      tech: ['Go-Zero', 'REST API'],
      features: ['Deployment', 'StatefulSet', 'DaemonSet', 'Job/CronJob'],
      dependencies: ['K8s Manager', 'manager-rpc']
    }
  ]

  // RPC 层节点
  const rpcNodes: ArchNode[] = [
    {
      id: 'portal-rpc',
      name: 'Portal RPC',
      desc: '门户核心服务',
      icon: 'ri:service-line',
      tags: ['gRPC', 'Auth', 'Alert'],
      tech: ['Go-Zero', 'gRPC', 'Casbin', 'GORM'],
      features: [
        '用户/角色/部门管理',
        'RBAC 权限控制',
        '告警通知聚合',
        '站内消息推送',
        '对象存储管理'
      ],
      dependencies: ['MySQL', 'Redis', 'Casbin Manager', 'Alert Manager', 'Storage Manager']
    },
    {
      id: 'manager-rpc',
      name: 'Manager RPC',
      desc: '集群管理核心',
      icon: 'ri:kubernetes-line',
      tags: ['gRPC', 'K8s', 'Sync'],
      tech: ['Go-Zero', 'gRPC', 'Client-Go', 'Informer'],
      features: ['多集群接入', '项目工作空间', '应用版本控制', '资源同步', '告警规则'],
      dependencies: ['MySQL', 'Redis', 'K8s Manager', 'Sync Operator', 'Alert RPC']
    },
    {
      id: 'console-rpc',
      name: 'Console RPC',
      desc: '控制台核心',
      icon: 'ri:settings-3-line',
      tags: ['gRPC', 'Harbor'],
      tech: ['Go-Zero', 'gRPC', 'Harbor SDK'],
      features: ['Harbor 镜像仓库', '镜像项目绑定', 'Registry 集群管理'],
      dependencies: ['MySQL', 'Redis', 'Harbor Manager']
    }
  ]

  // Manager 层节点
  const managerNodes: ArchNode[] = [
    {
      id: 'casbin-manager',
      name: 'Casbin Manager',
      desc: 'RBAC 权限',
      icon: 'ri:shield-check-line',
      features: ['分布式 RBAC', '动态权限加载', 'API 访问控制'],
      dependencies: ['Redis', 'MySQL']
    },
    {
      id: 'k8s-manager',
      name: 'K8s Manager',
      desc: 'K8s 集群管理',
      icon: 'ri:kubernetes-fill',
      features: ['多集群连接池', 'Client-Go 封装', 'Informer 机制'],
      dependencies: ['Redis', 'K8s API Server']
    },
    {
      id: 'harbor-manager',
      name: 'Harbor Manager',
      desc: '镜像仓库',
      icon: 'ri:ship-line',
      features: ['Harbor API 集成', '项目管理', '镜像推拉'],
      dependencies: ['Harbor API']
    },
    {
      id: 'alert-manager',
      name: 'Alert Manager',
      desc: '告警通知',
      icon: 'ri:alarm-warning-line',
      features: ['告警聚合', '多渠道通知', '告警分组'],
      dependencies: ['Redis MQ', 'MySQL']
    },
    {
      id: 'storage-manager',
      name: 'Storage Manager',
      desc: '对象存储',
      icon: 'ri:database-2-line',
      features: ['MinIO 集成', '文件上传下载', 'TLS 支持'],
      dependencies: ['MinIO']
    },
    {
      id: 'prometheus-manager',
      name: 'Prometheus Manager',
      desc: '监控管理',
      icon: 'ri:line-chart-line',
      features: ['Prometheus 配置', '多副本共享'],
      dependencies: ['Redis', 'Prometheus']
    },
    {
      id: 'message-pusher',
      name: 'Message Pusher',
      desc: '消息推送',
      icon: 'ri:notification-4-line',
      features: ['Redis Pub/Sub', 'WebSocket 推送'],
      dependencies: ['Redis', 'WebSocket Hub']
    }
  ]

  // Infrastructure 层节点
  const infraNodes: ArchNode[] = [
    {
      id: 'redis',
      name: 'Redis',
      desc: '缓存 + 消息队列',
      icon: 'ri:database-line',
      features: ['数据缓存', 'MySQL 缓存层', 'Pub/Sub', '分布式锁', '配置存储']
    },
    {
      id: 'mysql',
      name: 'MySQL',
      desc: '关系型数据库',
      icon: 'ri:database-2-line',
      features: ['数据持久化', '事务支持', '连接池管理']
    },
    {
      id: 'minio',
      name: 'MinIO',
      desc: '对象存储',
      icon: 'ri:folder-cloud-line',
      features: ['文件存储', 'S3 兼容', 'TLS 加密']
    }
  ]

  // 显示节点详情
  const showNodeInfo = (node: ArchNode): void => {
    currentNode.value = node
    drawerVisible.value = true
  }

  // 重置视图
  const resetView = (): void => {
    showConnections.value = true
    showDataFlow.value = true
  }

  // 创建曲线路径（使用贝塞尔曲线，优化路径避免交叉）
  const createCurvePath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): string => {
    const dx = end.x - start.x
    const dy = end.y - start.y

    // 计算控制点，使曲线更平滑且避免过度弯曲
    const controlY1 = start.y + dy * 0.4
    const controlY2 = end.y - dy * 0.4

    // 使用三次贝塞尔曲线，让路径更流畅
    return `M ${start.x} ${start.y} C ${start.x} ${controlY1}, ${end.x} ${controlY2}, ${end.x} ${end.y}`
  }

  // 获取节点中心点坐标
  const getNodeCenter = (id: string) => {
    const node = document.getElementById(`node-${id}`)
    if (!node || !diagramWrapper.value) return { x: 0, y: 0 }

    const rect = node.getBoundingClientRect()
    const wrapperRect = diagramWrapper.value.getBoundingClientRect()

    return {
      x: rect.left - wrapperRect.left + rect.width / 2,
      y: rect.top - wrapperRect.top + rect.height / 2
    }
  }

  // 计算所有连接线
  const calculateConnections = (): void => {
    nextTick(() => {
      if (!diagramWrapper.value) return

      // Web -> BFF 连接（紫色）
      webToBffLines.value = bffNodes.map((bffNode) => {
        const start = getNodeCenter('web')
        const end = getNodeCenter(bffNode.id)
        return {
          id: `web-${bffNode.id}`,
          path: createCurvePath(start, end),
          color: '#8B5CF6',
          type: 'web'
        }
      })

      // BFF -> RPC 连接（蓝紫色）
      const bffRpcConnections = [
        { from: 'portal-api', to: 'portal-rpc' },
        { from: 'manager-api', to: 'manager-rpc' },
        { from: 'console-api', to: 'console-rpc' },
        { from: 'workload-api', to: 'manager-rpc' }
      ]

      bffToRpcLines.value = bffRpcConnections.map((conn) => {
        const start = getNodeCenter(conn.from)
        const end = getNodeCenter(conn.to)
        return {
          id: `${conn.from}-${conn.to}`,
          path: createCurvePath(start, end),
          color: '#667eea',
          type: 'bff'
        }
      })

      // RPC -> Manager 连接（青色）
      const rpcManagerConnections = [
        { from: 'portal-rpc', to: 'casbin-manager' },
        { from: 'portal-rpc', to: 'alert-manager' },
        { from: 'portal-rpc', to: 'storage-manager' },
        { from: 'portal-rpc', to: 'message-pusher' },
        { from: 'manager-rpc', to: 'k8s-manager' },
        { from: 'console-rpc', to: 'harbor-manager' },
        { from: 'console-rpc', to: 'prometheus-manager' }
      ]

      rpcToManagerLines.value = rpcManagerConnections.map((conn) => {
        const start = getNodeCenter(conn.from)
        const end = getNodeCenter(conn.to)
        return {
          id: `${conn.from}-${conn.to}`,
          path: createCurvePath(start, end),
          color: '#06b6d4',
          type: 'rpc'
        }
      })

      // Manager -> Infra 连接（粉紫色）
      const managerInfraConnections = [
        { from: 'casbin-manager', to: 'redis' },
        { from: 'casbin-manager', to: 'mysql' },
        { from: 'k8s-manager', to: 'redis' },
        { from: 'alert-manager', to: 'redis' },
        { from: 'alert-manager', to: 'mysql' },
        { from: 'storage-manager', to: 'minio' },
        { from: 'message-pusher', to: 'redis' },
        { from: 'prometheus-manager', to: 'redis' }
      ]

      managerToInfraLines.value = managerInfraConnections.map((conn) => {
        const start = getNodeCenter(conn.from)
        const end = getNodeCenter(conn.to)
        return {
          id: `${conn.from}-${conn.to}`,
          path: createCurvePath(start, end),
          color: '#ec4899',
          type: 'manager'
        }
      })

      // 初始化数据流粒子
      initDataParticles()
    })
  }

  // 初始化数据流粒子
  const initDataParticles = (): void => {
    const allLines = [
      ...webToBffLines.value,
      ...bffToRpcLines.value,
      ...rpcToManagerLines.value.slice(0, 4),
      ...managerToInfraLines.value.slice(0, 4)
    ]

    dataParticles.value = allLines.slice(0, 16).map((line, index) => ({
      id: index,
      color: line.color,
      path: line.path,
      duration: 2.5 + Math.random() * 1.5
    }))
  }

  onMounted(() => {
    setTimeout(calculateConnections, 100)
    window.addEventListener('resize', calculateConnections)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', calculateConnections)
  })
</script>

<style lang="scss" scoped>
  .architecture-diagram-card {
    padding: 24px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);
    border-radius: 20px;
    border: 1px solid rgba(139, 92, 246, 0.1);
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08);

    .diagram-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid transparent;
      border-image: linear-gradient(90deg, #8b5cf6, #667eea, #06b6d4) 1;

      .diagram-title {
        font-size: 20px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        background: linear-gradient(135deg, #8b5cf6 0%, #667eea 50%, #06b6d4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;

        .title-icon {
          font-size: 24px;
          color: #8b5cf6;
          -webkit-text-fill-color: initial;
          animation: rotate 20s linear infinite;
        }
      }

      .diagram-controls {
        display: flex;
        align-items: center;
        gap: 16px;
      }
    }

    .diagram-wrapper {
      position: relative;
      min-height: 550px;
      background: #ffffff;
      border-radius: 16px;
      padding: 32px 24px;
      box-shadow:
        0 2px 16px rgba(139, 92, 246, 0.06),
        inset 0 0 0 1px rgba(139, 92, 246, 0.05);

      .connections-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;

        .connection-line {
          transition: all 0.3s ease;

          &.animated {
            stroke-dasharray: 8;
            animation: dash 20s linear infinite;
          }

          &:hover {
            stroke-width: 3.5 !important;
            opacity: 1 !important;
            filter: url(#glow);
          }
        }

        .data-particle {
          opacity: 0.9;
        }
      }

      .diagram-layers {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 32px;

        .arch-layer {
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);

          .layer-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;

            .title-bar {
              width: 5px;
              height: 20px;
              border-radius: 3px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);

              &.web-bar {
                background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%);
              }
              &.bff-bar {
                background: linear-gradient(180deg, #667eea 0%, #5b6eea 100%);
              }
              &.rpc-bar {
                background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%);
              }
              &.manager-bar {
                background: linear-gradient(180deg, #ec4899 0%, #db2777 100%);
              }
              &.infra-bar {
                background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%);
              }
            }

            h4 {
              font-size: 16px;
              font-weight: 700;
              margin: 0;
              color: var(--art-text-color);
              letter-spacing: 0.3px;
            }
          }

          .nodes-row {
            display: grid;
            gap: 16px;

            &.single-node {
              grid-template-columns: 1fr;
              max-width: 300px;
              margin: 0 auto;
            }

            &:not(.single-node):not(.manager-row):not(.rpc-row):not(.infra-row) {
              grid-template-columns: repeat(4, 1fr);
            }

            &.rpc-row {
              grid-template-columns: repeat(3, 1fr);
              max-width: 800px;
              margin: 0 auto;
            }

            &.manager-row {
              grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
              max-width: 1000px;
              margin: 0 auto;
            }

            &.infra-row {
              grid-template-columns: repeat(3, 1fr);
              max-width: 700px;
              margin: 0 auto;
            }

            .arch-node {
              position: relative;
              background: #ffffff;
              border: 2px solid transparent;
              border-radius: 16px;
              padding: 16px 14px;
              cursor: pointer;
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              box-shadow:
                0 4px 16px rgba(139, 92, 246, 0.08),
                0 2px 6px rgba(139, 92, 246, 0.04);
              overflow: hidden;

              &::before {
                content: '';
                position: absolute;
                inset: -2px;
                border-radius: 16px;
                padding: 2px;
                background: linear-gradient(135deg, transparent, transparent);
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                opacity: 0;
                transition: opacity 0.4s;
              }

              &::after {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: 16px;
                background: radial-gradient(
                    circle at top right,
                    rgba(255, 255, 255, 0.8),
                    transparent 60%
                );
                opacity: 0;
                transition: opacity 0.4s;
              }

              &:hover {
                transform: translateY(-6px) scale(1.02);
                box-shadow:
                  0 12px 28px rgba(139, 92, 246, 0.15),
                  0 6px 12px rgba(139, 92, 246, 0.1);

                &::before {
                  opacity: 1;
                }

                &::after {
                  opacity: 0.4;
                }

                .node-icon-wrapper {
                  transform: scale(1.15) rotate(5deg);
                }
              }

              &.compact {
                padding: 12px 10px;
              }

              .node-status-dot {
                position: absolute;
                top: 12px;
                right: 12px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
                box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
                animation: statusPulse 2.5s infinite;
                z-index: 3;
              }

              .node-icon-wrapper {
                width: 52px;
                height: 52px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 12px;
                font-size: 26px;
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                z-index: 2;

                .node-icon {
                  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.1));
                }
              }

              &.compact .node-icon-wrapper {
                width: 44px;
                height: 44px;
                font-size: 22px;
                margin-bottom: 10px;
              }

              .node-info {
                text-align: center;
                position: relative;
                z-index: 2;

                .node-name {
                  font-size: 14px;
                  font-weight: 700;
                  margin-bottom: 5px;
                  color: var(--art-text-color);
                  line-height: 1.3;
                }

                .node-desc {
                  font-size: 12px;
                  color: var(--art-text-color-secondary);
                  line-height: 1.4;
                }
              }

              &.compact .node-info .node-name {
                font-size: 12px;
                margin-bottom: 0;
              }

              .node-badge {
                position: absolute;
                bottom: 12px;
                right: 12px;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.3px;
                z-index: 2;
              }

              .node-tags {
                display: flex;
                gap: 6px;
                margin-top: 10px;
                justify-content: center;
                flex-wrap: wrap;
                position: relative;
                z-index: 2;

                span {
                  padding: 4px 9px;
                  border-radius: 10px;
                  font-size: 10px;
                  font-weight: 700;
                  letter-spacing: 0.2px;
                }
              }

              // 各层级节点样式 - 紫色系
              &.web-node {
                &::before {
                  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                }

                .node-icon-wrapper {
                  background: linear-gradient(135deg, #f3e8ff, #ede9fe);
                  color: #8b5cf6;
                }

                .node-badge {
                  background: linear-gradient(135deg, #f3e8ff, #ede9fe);
                  color: #7c3aed;
                  border: 1px solid rgba(139, 92, 246, 0.2);
                }
              }

              &.bff-node {
                &::before {
                  background: linear-gradient(135deg, #667eea, #5b6eea);
                }

                .node-icon-wrapper {
                  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
                  color: #667eea;
                }

                .node-badge {
                  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
                  color: #5b6eea;
                  border: 1px solid rgba(102, 126, 234, 0.2);
                }
              }

              &.rpc-node {
                &::before {
                  background: linear-gradient(135deg, #06b6d4, #0891b2);
                }

                .node-icon-wrapper {
                  background: linear-gradient(135deg, #ecfeff, #cffafe);
                  color: #06b6d4;
                }

                .node-tags span {
                  background: linear-gradient(135deg, #ecfeff, #cffafe);
                  color: #0891b2;
                  border: 1px solid rgba(6, 182, 212, 0.2);
                }
              }

              &.manager-node {
                &::before {
                  background: linear-gradient(135deg, #ec4899, #db2777);
                }

                .node-icon-wrapper {
                  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
                  color: #ec4899;
                }
              }

              &.infra-node {
                &::before {
                  background: linear-gradient(135deg, #6b7280, #4b5563);
                }

                .node-icon-wrapper {
                  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
                  color: #6b7280;
                }

                &#node-redis {
                  &::before {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                  }
                  .node-icon-wrapper {
                    background: linear-gradient(135deg, #fee2e2, #fecaca);
                    color: #dc2626;
                  }
                }

                &#node-mysql {
                  &::before {
                    background: linear-gradient(135deg, #0891b2, #0e7490);
                  }
                  .node-icon-wrapper {
                    background: linear-gradient(135deg, #cffafe, #a5f3fc);
                    color: #0891b2;
                  }
                }

                &#node-minio {
                  &::before {
                    background: linear-gradient(135deg, #c72025, #b71c1c);
                  }
                  .node-icon-wrapper {
                    background: linear-gradient(135deg, #fee2e2, #fecaca);
                    color: #c72025;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // 节点详情样式
  .node-detail {
    .detail-header {
      display: flex;
      gap: 24px;
      align-items: flex-start;
      margin-bottom: 28px;
      padding: 20px;
      background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);
      border-radius: 16px;

      .detail-icon-large {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        background: linear-gradient(135deg, #f3e8ff, #ede9fe);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        color: #8b5cf6;
        flex-shrink: 0;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15);
      }

      .detail-meta {
        flex: 1;

        h3 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 10px 0;
          background: linear-gradient(135deg, #8b5cf6, #667eea);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        p {
          color: var(--art-text-color-secondary);
          margin: 0;
          line-height: 1.7;
          font-size: 14px;
        }
      }
    }

    .detail-section {
      margin-bottom: 28px;

      &:last-child {
        margin-bottom: 0;
      }

      h4 {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--art-text-color);

        svg {
          color: #8b5cf6;
          font-size: 18px;
        }
      }

      .tech-tags,
      .dep-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .feature-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(139, 92, 246, 0.1);
          line-height: 1.6;

          &:last-child {
            border-bottom: none;
          }

          svg {
            color: #10b981;
            font-size: 20px;
            flex-shrink: 0;
            margin-top: 2px;
          }
        }
      }
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes statusPulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.25);
    }
  }

  @keyframes dash {
    to {
      stroke-dashoffset: -100;
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  // 响应式布局
  @media (max-width: 1400px) {
    .architecture-diagram-card {
      .diagram-wrapper {
        .diagram-layers {
          .arch-layer {
            .nodes-row {
              &:not(.single-node):not(.manager-row):not(.rpc-row):not(.infra-row) {
                grid-template-columns: repeat(2, 1fr);
              }

              &.manager-row {
                grid-template-columns: repeat(4, 1fr);
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 992px) {
    .architecture-diagram-card {
      padding: 20px;

      .diagram-wrapper {
        padding: 28px 20px;

        .diagram-layers {
          .arch-layer {
            .nodes-row {
              &:not(.single-node) {
                grid-template-columns: repeat(2, 1fr);
              }

              &.manager-row {
                grid-template-columns: repeat(3, 1fr);
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    .architecture-diagram-card {
      padding: 16px;

      .diagram-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;

        .diagram-title {
          font-size: 18px;
        }

        .diagram-controls {
          width: 100%;
          justify-content: space-between;
        }
      }

      .diagram-wrapper {
        padding: 24px 16px;
        min-height: auto;

        .diagram-layers {
          gap: 28px;

          .arch-layer {
            .nodes-row {
              grid-template-columns: 1fr !important;

              .arch-node {
                &:hover {
                  transform: translateY(-4px) scale(1.01);
                }
              }
            }
          }
        }
      }
    }
  }
</style>