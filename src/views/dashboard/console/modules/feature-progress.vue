<template>
  <div class="art-card feature-progress-card">
    <div class="card-header">
      <h3 class="card-title">
        <ArtSvgIcon icon="ri:progress-3-line" class="title-icon" />
        功能开发进度
      </h3>
      <div class="overall-progress">
        <span class="progress-text">整体完成度</span>
        <span class="progress-value">{{ overallProgress }}%</span>
      </div>
    </div>

    <div class="progress-content">
      <!-- 模块进度列表 -->
      <div class="module-list">
        <div
          v-for="(module, index) in modules"
          :key="module.name"
          class="module-item"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="module-header">
            <div class="module-info">
              <div
                class="module-icon"
                :style="{ background: `linear-gradient(135deg, ${module.color}20, ${module.color}10)` }"
              >
                <ArtSvgIcon :icon="module.icon" :style="{ color: module.color }" />
              </div>
              <div class="module-details">
                <h4 class="module-name">{{ module.name }}</h4>
                <p class="module-desc">{{ module.description }}</p>
              </div>
            </div>
            <div class="module-stats">
              <span
                class="status-badge"
                :class="module.status"
                :style="{ background: getStatusColor(module.status) }"
              >
                {{ getStatusText(module.status) }}
              </span>
              <span class="progress-percent">{{ module.progress }}%</span>
            </div>
          </div>

          <div class="progress-bar-wrapper">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: `${module.animatedProgress}%`,
                  background: `linear-gradient(90deg, ${module.color}, ${module.color}cc)`
                }"
              >
                <div class="progress-shine"></div>
              </div>
            </div>
          </div>

          <div class="module-features" v-if="module.features && module.features.length > 0">
            <div
              v-for="feature in module.features"
              :key="feature.name"
              class="feature-item"
              @click="toggleFeatureDetail(feature)"
            >
              <ElCheckbox :model-value="feature.completed" disabled />
              <span class="feature-name">{{ feature.name }}</span>
              <span class="feature-count" v-if="feature.count">{{ feature.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-icon" :style="{ background: stat.color + '20', color: stat.color }">
            <ArtSvgIcon :icon="stat.icon" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- 里程碑时间线 -->
      <div class="milestones-section">
        <h4 class="section-title">
          <ArtSvgIcon icon="ri:flag-line" />
          里程碑
        </h4>
        <div class="timeline">
          <div
            v-for="(milestone, index) in milestones"
            :key="index"
            class="timeline-item"
            :class="{ completed: milestone.completed, active: milestone.active }"
          >
            <div class="timeline-dot">
              <ArtSvgIcon
                :icon="milestone.completed ? 'ri:checkbox-circle-fill' : 'ri:radio-button-line'"
              />
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <h5 class="timeline-title">{{ milestone.title }}</h5>
                <span class="timeline-date">{{ milestone.date }}</span>
              </div>
              <p class="timeline-desc">{{ milestone.description }}</p>
              <div class="timeline-tags" v-if="milestone.tags">
                <ElTag
                  v-for="tag in milestone.tags"
                  :key="tag"
                  size="small"
                  :type="milestone.completed ? 'success' : 'info'"
                >
                  {{ tag }}
                </ElTag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Feature {
    name: string
    completed: boolean
    count?: string
  }

  interface Module {
    name: string
    description: string
    icon: string
    color: string
    progress: number
    animatedProgress: number
    status: 'completed' | 'in-progress' | 'planned'
    features?: Feature[]
  }

  interface Stat {
    label: string
    value: string | number
    icon: string
    color: string
  }

  interface Milestone {
    title: string
    description: string
    date: string
    completed: boolean
    active?: boolean
    tags?: string[]
  }

  // 模块数据
  const modules = reactive<Module[]>([
    {
      name: '用户权限系统',
      description: '基于 Casbin 的 RBAC 权限管理',
      icon: 'ri:shield-user-line',
      color: '#409EFF',
      progress: 95,
      animatedProgress: 0,
      status: 'completed',
      features: [
        { name: '用户管理', completed: true },
        { name: '角色管理', completed: true },
        { name: '部门管理', completed: true },
        { name: 'API 权限控制', completed: true },
        { name: '菜单权限', completed: true },
        { name: '数据权限', completed: false }
      ]
    },
    {
      name: '多集群管理',
      description: 'Kubernetes 多集群接入与管理',
      icon: 'ri:kubernetes-line',
      color: '#326CE5',
      progress: 88,
      animatedProgress: 0,
      status: 'in-progress',
      features: [
        { name: '集群接入', completed: true, count: '5+' },
        { name: '集群认证', completed: true },
        { name: '资源同步', completed: true },
        { name: '网络配置', completed: true },
        { name: '集群监控', completed: false },
        { name: '多云支持', completed: false }
      ]
    },
    {
      name: '项目工作空间',
      description: '多租户项目与工作空间隔离',
      icon: 'ri:folder-user-line',
      color: '#67C23A',
      progress: 90,
      animatedProgress: 0,
      status: 'in-progress',
      features: [
        { name: '项目管理', completed: true },
        { name: '工作空间', completed: true },
        { name: '成员管理', completed: true },
        { name: '资源配额', completed: true },
        { name: '审计日志', completed: true }
      ]
    },
    {
      name: '应用管理',
      description: '应用生命周期与版本控制',
      icon: 'ri:apps-line',
      color: '#E6A23C',
      progress: 85,
      animatedProgress: 0,
      status: 'in-progress',
      features: [
        { name: '应用部署', completed: true },
        { name: '版本管理', completed: true },
        { name: '灰度发布', completed: false },
        { name: '回滚机制', completed: true },
        { name: 'CI/CD 集成', completed: false }
      ]
    },
    {
      name: '镜像仓库',
      description: 'Harbor 镜像仓库管理',
      icon: 'ri:ship-line',
      color: '#60D1C5',
      progress: 80,
      animatedProgress: 0,
      status: 'in-progress',
      features: [
        { name: 'Harbor 集成', completed: true },
        { name: '项目管理', completed: true },
        { name: '镜像扫描', completed: false },
        { name: '镜像复制', completed: true }
      ]
    },
    {
      name: '告警通知',
      description: '多渠道告警聚合与通知',
      icon: 'ri:alarm-warning-line',
      color: '#F56C6C',
      progress: 92,
      animatedProgress: 0,
      status: 'in-progress',
      features: [
        { name: '告警规则', completed: true, count: '20+' },
        { name: '告警分组', completed: true },
        { name: '多渠道通知', completed: true },
        { name: '告警聚合', completed: true },
        { name: '静默规则', completed: true },
        { name: '告警历史', completed: false }
      ]
    },
    {
      name: '监控系统',
      description: 'Prometheus 监控集成',
      icon: 'ri:line-chart-line',
      color: '#E85D48',
      progress: 75,
      animatedProgress: 0,
      status: 'in-progress',
      features: [
        { name: 'Prometheus 集成', completed: true },
        { name: '指标采集', completed: true },
        { name: '仪表盘', completed: false },
        { name: '自定义监控', completed: false }
      ]
    },
    {
      name: '工作负载',
      description: 'Deployment/StatefulSet/DaemonSet',
      icon: 'ri:stack-line',
      color: '#909399',
      progress: 70,
      animatedProgress: 0,
      status: 'in-progress',
      features: [
        { name: 'Deployment', completed: true },
        { name: 'StatefulSet', completed: true },
        { name: 'DaemonSet', completed: true },
        { name: 'Job/CronJob', completed: false }
      ]
    },
    {
      name: '存储管理',
      description: 'MinIO 对象存储',
      icon: 'ri:folder-cloud-line',
      color: '#C72025',
      progress: 85,
      animatedProgress: 0,
      status: 'in-progress',
      features: [
        { name: 'MinIO 集成', completed: true },
        { name: '文件上传', completed: true },
        { name: 'TLS 支持', completed: true },
        { name: '存储桶管理', completed: false }
      ]
    },
    {
      name: '日志审计',
      description: '操作日志与审计追踪',
      icon: 'ri:file-list-3-line',
      color: '#606266',
      progress: 65,
      animatedProgress: 0,
      status: 'in-progress',
      features: [
        { name: '登录日志', completed: true },
        { name: '操作日志', completed: true },
        { name: '集群审计', completed: true },
        { name: '日志检索', completed: false }
      ]
    }
  ])

  // 统计数据
  const stats: Stat[] = [
    { label: '已完成', value: 8, icon: 'ri:checkbox-circle-line', color: '#67C23A' },
    { label: '开发中', value: 9, icon: 'ri:loader-4-line', color: '#409EFF' },
    { label: '计划中', value: 3, icon: 'ri:time-line', color: '#909399' },
    { label: '功能点', value: 52, icon: 'ri:function-line', color: '#E6A23C' }
  ]

  // 里程碑
  const milestones: Milestone[] = [
    {
      title: 'Alpha 版本',
      description: '基础架构搭建，核心功能实现',
      date: '2024-06',
      completed: true,
      tags: ['架构设计', '用户系统', '集群接入']
    },
    {
      title: 'Beta 版本',
      description: '完善核心功能，增加告警与监控',
      date: '2024-09',
      completed: true,
      tags: ['告警系统', '监控集成', '工作空间']
    },
    {
      title: 'RC 版本',
      description: '功能完善，性能优化',
      date: '2024-11',
      completed: false,
      active: true,
      tags: ['性能优化', '功能完善', '测试']
    },
    {
      title: 'v1.0 正式版',
      description: '生产就绪，稳定发布',
      date: '2025-01',
      completed: false,
      tags: ['生产就绪', '文档完善']
    },
    {
      title: 'v2.0 企业版',
      description: '企业级功能，多云支持',
      date: '2025-Q2',
      completed: false,
      tags: ['多云', '企业功能', 'SaaS']
    }
  ]

  // 计算整体进度
  const overallProgress = computed(() => {
    const total = modules.reduce((sum, m) => sum + m.progress, 0)
    return Math.round(total / modules.length)
  })

  // 状态颜色映射
  const getStatusColor = (status: string): string => {
    const colors = {
      completed: '#67C23A20',
      'in-progress': '#409EFF20',
      planned: '#90939920'
    }
    return colors[status] || colors.planned
  }

  // 状态文本映射
  const getStatusText = (status: string): string => {
    const texts = {
      completed: '已完成',
      'in-progress': '开发中',
      planned: '计划中'
    }
    return texts[status] || '未知'
  }

  // 功能详情切换
  const toggleFeatureDetail = (feature: Feature): void => {
    console.log('Feature clicked:', feature)
    // 可以在这里添加详情展示逻辑
  }

  // 启动进度条动画
  const startProgressAnimation = (): void => {
    modules.forEach((module, index) => {
      setTimeout(() => {
        const interval = setInterval(() => {
          if (module.animatedProgress < module.progress) {
            module.animatedProgress += 1
          } else {
            clearInterval(interval)
          }
        }, 10)
      }, index * 100)
    })
  }

  onMounted(() => {
    startProgressAnimation()
  })
</script>

<style lang="scss" scoped>
  .feature-progress-card {
    padding: 24px;
    min-height: 800px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--art-border-color);

      .card-title {
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;

        .title-icon {
          font-size: 24px;
          color: var(--art-primary);
        }
      }

      .overall-progress {
        display: flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, var(--art-primary-light-9), var(--art-primary-light-8));
        padding: 12px 20px;
        border-radius: 12px;

        .progress-text {
          font-size: 14px;
          color: var(--art-text-color-secondary);
        }

        .progress-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--art-primary);
        }
      }
    }

    .progress-content {
      .module-list {
        .module-item {
          background: var(--art-bg-color);
          border: 1px solid var(--art-border-color);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          animation: slideInLeft 0.5s ease-out;
          transition: all 0.3s;

          &:hover {
            border-color: var(--art-primary);
            box-shadow: 0 4px 12px rgba(var(--art-primary-rgb), 0.1);
          }

          .module-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;

            .module-info {
              display: flex;
              gap: 12px;
              flex: 1;

              .module-icon {
                width: 48px;
                height: 48px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                flex-shrink: 0;
              }

              .module-details {
                flex: 1;

                .module-name {
                  font-size: 16px;
                  font-weight: 600;
                  margin: 0 0 6px 0;
                }

                .module-desc {
                  font-size: 13px;
                  color: var(--art-text-color-secondary);
                  margin: 0;
                }
              }
            }

            .module-stats {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 8px;

              .status-badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
              }

              .progress-percent {
                font-size: 18px;
                font-weight: 700;
                color: var(--art-primary);
              }
            }
          }

          .progress-bar-wrapper {
            margin-bottom: 16px;

            .progress-bar {
              height: 8px;
              background: var(--art-bg-color-overlay);
              border-radius: 4px;
              overflow: hidden;
              position: relative;

              .progress-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
                overflow: hidden;

                .progress-shine {
                  position: absolute;
                  top: 0;
                  left: -100%;
                  width: 100%;
                  height: 100%;
                  background: linear-gradient(
                      90deg,
                      transparent,
                      rgba(255, 255, 255, 0.3),
                      transparent
                  );
                  animation: shine 2s infinite;
                }
              }
            }
          }

          .module-features {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 8px;

            .feature-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 6px 12px;
              background: var(--art-bg-color-overlay);
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;

              &:hover {
                background: var(--art-primary-light-9);
              }

              .feature-name {
                flex: 1;
                font-size: 13px;
              }

              .feature-count {
                font-size: 12px;
                color: var(--art-primary);
                font-weight: 600;
              }
            }
          }
        }
      }

      .stats-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin: 24px 0;

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--art-bg-color);
          border: 1px solid var(--art-border-color);
          border-radius: 12px;
          transition: all 0.3s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .stat-info {
            .stat-value {
              font-size: 24px;
              font-weight: 700;
              color: var(--art-text-color);
            }

            .stat-label {
              font-size: 13px;
              color: var(--art-text-color-secondary);
              margin-top: 4px;
            }
          }
        }
      }

      .milestones-section {
        margin-top: 32px;

        .section-title {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          color: var(--art-text-color);

          svg {
            font-size: 20px;
            color: var(--art-primary);
          }
        }

        .timeline {
          position: relative;
          padding-left: 32px;

          &::before {
            content: '';
            position: absolute;
            left: 11px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--art-border-color);
          }

          .timeline-item {
            position: relative;
            padding-bottom: 32px;

            &:last-child {
              padding-bottom: 0;
            }

            .timeline-dot {
              position: absolute;
              left: -32px;
              top: 0;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: var(--art-bg-color);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              color: var(--art-text-color-placeholder);
              z-index: 1;
            }

            &.completed .timeline-dot {
              color: var(--art-success);
            }

            &.active .timeline-dot {
              color: var(--art-primary);
              animation: pulse 2s infinite;
            }

            .timeline-content {
              background: var(--art-bg-color);
              border: 1px solid var(--art-border-color);
              border-radius: 8px;
              padding: 16px;

              .timeline-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;

                .timeline-title {
                  font-size: 15px;
                  font-weight: 600;
                  margin: 0;
                }

                .timeline-date {
                  font-size: 12px;
                  color: var(--art-text-color-secondary);
                }
              }

              .timeline-desc {
                font-size: 13px;
                color: var(--art-text-color-secondary);
                margin: 0 0 12px 0;
              }

              .timeline-tags {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
              }
            }

            &.completed .timeline-content {
              border-color: var(--art-success-light-7);
              background: var(--art-success-light-9);
            }

            &.active .timeline-content {
              border-color: var(--art-primary);
              box-shadow: 0 0 0 3px var(--art-primary-light-9);
            }
          }
        }
      }
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes shine {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  @media (max-width: 768px) {
    .feature-progress-card {
      padding: 16px;

      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .progress-content {
        .module-list .module-item {
          .module-header {
            flex-direction: column;
            gap: 12px;

            .module-stats {
              flex-direction: row;
              width: 100%;
              justify-content: space-between;
            }
          }

          .module-features {
            grid-template-columns: 1fr;
          }
        }

        .stats-cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    }
  }
</style>