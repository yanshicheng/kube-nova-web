<template>
  <div class="art-card update-log-card">
    <div class="card-header">
      <h3 class="card-title">
        <ArtSvgIcon icon="ri:file-list-3-line" class="title-icon" />
        更新日志
      </h3>
      <ElSelect v-model="selectedVersion" placeholder="选择版本" size="small" class="version-select">
        <ElOption
          v-for="version in versions"
          :key="version"
          :label="version"
          :value="version"
        />
      </ElSelect>
    </div>

    <div class="log-content">
      <ElScrollbar height="700px">
        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          class="log-item"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="log-header">
            <div class="version-info">
              <h4 class="version-tag">
                <ArtSvgIcon icon="ri:price-tag-3-line" />
                {{ log.version }}
              </h4>
              <ElTag :type="getVersionType(log.type)" size="small">{{ log.type }}</ElTag>
            </div>
            <div class="log-meta">
              <span class="log-date">
                <ArtSvgIcon icon="ri:calendar-line" />
                {{ log.date }}
              </span>
              <span class="log-author" v-if="log.author">
                <ArtSvgIcon icon="ri:user-3-line" />
                {{ log.author }}
              </span>
            </div>
          </div>

          <div class="log-body">
            <div class="log-description" v-if="log.description">
              <p>{{ log.description }}</p>
            </div>

            <!-- 新功能 -->
            <div class="change-section" v-if="log.features && log.features.length > 0">
              <div class="section-header feature-header">
                <ArtSvgIcon icon="ri:flashlight-line" />
                <span>新功能</span>
              </div>
              <ul class="change-list">
                <li v-for="(item, i) in log.features" :key="i" class="change-item feature-item">
                  <ArtSvgIcon icon="ri:checkbox-circle-line" class="item-icon" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- 优化改进 -->
            <div class="change-section" v-if="log.improvements && log.improvements.length > 0">
              <div class="section-header improvement-header">
                <ArtSvgIcon icon="ri:rocket-line" />
                <span>优化改进</span>
              </div>
              <ul class="change-list">
                <li
                  v-for="(item, i) in log.improvements"
                  :key="i"
                  class="change-item improvement-item"
                >
                  <ArtSvgIcon icon="ri:arrow-up-circle-line" class="item-icon" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- Bug 修复 -->
            <div class="change-section" v-if="log.bugfixes && log.bugfixes.length > 0">
              <div class="section-header bugfix-header">
                <ArtSvgIcon icon="ri:bug-line" />
                <span>Bug 修复</span>
              </div>
              <ul class="change-list">
                <li v-for="(item, i) in log.bugfixes" :key="i" class="change-item bugfix-item">
                  <ArtSvgIcon icon="ri:close-circle-line" class="item-icon" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- 破坏性变更 -->
            <div class="change-section" v-if="log.breaking && log.breaking.length > 0">
              <div class="section-header breaking-header">
                <ArtSvgIcon icon="ri:error-warning-line" />
                <span>破坏性变更</span>
              </div>
              <ul class="change-list">
                <li v-for="(item, i) in log.breaking" :key="i" class="change-item breaking-item">
                  <ArtSvgIcon icon="ri:alert-line" class="item-icon" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- 文档更新 -->
            <div class="change-section" v-if="log.docs && log.docs.length > 0">
              <div class="section-header docs-header">
                <ArtSvgIcon icon="ri:file-text-line" />
                <span>文档更新</span>
              </div>
              <ul class="change-list">
                <li v-for="(item, i) in log.docs" :key="i" class="change-item docs-item">
                  <ArtSvgIcon icon="ri:file-line" class="item-icon" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- 统计信息 -->
            <div class="log-stats" v-if="log.stats">
              <div class="stat-item" v-for="(value, key) in log.stats" :key="key">
                <span class="stat-label">{{ getStatLabel(key) }}:</span>
                <span class="stat-value">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface ChangeLog {
    version: string
    type: 'Major' | 'Minor' | 'Patch' | 'Pre-release'
    date: string
    author?: string
    description?: string
    features?: string[]
    improvements?: string[]
    bugfixes?: string[]
    breaking?: string[]
    docs?: string[]
    stats?: Record<string, string | number>
  }

  const selectedVersion = ref('全部版本')

  const versions = ['全部版本', 'v0.9.x', 'v0.8.x', 'v0.7.x', 'v0.6.x']

  // 更新日志数据
  const changeLogs: ChangeLog[] = [
    {
      version: 'v0.9.0-beta',
      type: 'Pre-release',
      date: '2024-11-28',
      author: 'DevOps Team',
      description: '即将发布的 v0.9 beta 版本，包含重要功能更新和性能优化',
      features: [
        '新增 Prometheus Manager 监控配置管理',
        '支持告警规则的 YAML 导入导出',
        '增加站内消息 WebSocket 实时推送',
        '工作负载支持灰度发布策略（Alpha）',
        '新增项目工作空间资源配额管理'
      ],
      improvements: [
        '优化 K8s Manager 连接池性能，支持更多并发',
        '改进告警聚合算法，减少重复告警',
        '优化前端打包体积，首屏加载速度提升 30%',
        'Redis 缓存策略优化，命中率提升至 95%',
        '完善 RBAC 权限校验逻辑'
      ],
      bugfixes: [
        '修复多集群切换时偶现的认证失败问题',
        '修复告警通知在高并发下的消息丢失',
        '修复 Harbor 镜像列表分页错误',
        '修复工作空间删除时的资源清理不完整',
        '修复审计日志时区显示不正确'
      ],
      stats: {
        commits: 128,
        filesChanged: 256,
        additions: '+12,340',
        deletions: '-3,280'
      }
    },
    {
      version: 'v0.8.5',
      type: 'Patch',
      date: '2024-11-15',
      author: 'DevOps Team',
      description: '稳定性修复和小功能增强',
      improvements: [
        '优化 MySQL 连接池配置，支持动态调整',
        '改进告警消息推送的错误重试机制',
        '优化前端路由懒加载策略'
      ],
      bugfixes: [
        '修复集群资源同步偶尔失败的问题',
        '修复用户登录日志记录不准确',
        '修复文件上传大小限制检查'
      ],
      stats: {
        commits: 32,
        filesChanged: 48,
        additions: '+1,240',
        deletions: '-680'
      }
    },
    {
      version: 'v0.8.0',
      type: 'Minor',
      date: '2024-10-30',
      author: 'DevOps Team',
      description: '告警系统重构和多项功能增强',
      features: [
        '告警管理系统全面重构',
        '支持告警分组和告警等级',
        '新增多渠道告警通知（钉钉、企业微信、邮件）',
        '支持告警静默和抑制规则',
        '新增告警历史查询和统计',
        '集成 MinIO 对象存储',
        '支持文件上传和 TLS 加密'
      ],
      improvements: [
        '优化 Casbin Manager 权限加载性能',
        '改进集群资源同步机制',
        '优化前端表格渲染性能'
      ],
      bugfixes: [
        '修复角色权限更新后缓存未刷新',
        '修复集群网络配置保存失败',
        '修复项目成员管理权限问题'
      ],
      breaking: ['告警 API 接口调整，需要更新客户端调用'],
      stats: {
        commits: 185,
        filesChanged: 312,
        additions: '+18,560',
        deletions: '-6,420'
      }
    },
    {
      version: 'v0.7.0',
      type: 'Minor',
      date: '2024-09-20',
      author: 'DevOps Team',
      description: '项目管理和工作空间功能上线',
      features: [
        '新增项目管理模块',
        '支持多工作空间隔离',
        '新增项目成员和权限管理',
        '支持应用版本控制',
        '新增项目审计日志',
        '集群支持网络配置管理'
      ],
      improvements: [
        '优化 K8s Manager 资源查询性能',
        '改进前端路由权限控制',
        '优化数据库索引，查询性能提升 40%'
      ],
      bugfixes: [
        '修复集群删除时的资源清理问题',
        '修复用户角色切换后权限不更新',
        '修复工作负载列表加载缓慢'
      ],
      docs: ['完善项目管理文档', '新增工作空间使用指南', '更新 API 文档'],
      stats: {
        commits: 156,
        filesChanged: 278,
        additions: '+15,680',
        deletions: '-4,920'
      }
    },
    {
      version: 'v0.6.0',
      type: 'Minor',
      date: '2024-08-10',
      author: 'DevOps Team',
      description: '多集群管理和 Harbor 集成',
      features: [
        'Kubernetes 多集群接入和管理',
        '集成 Harbor 镜像仓库管理',
        '新增集群资源同步服务',
        '支持集群认证和授权',
        '新增集群审计日志'
      ],
      improvements: [
        '优化 Go-Zero 微服务架构',
        '改进 gRPC 通信性能',
        '优化 Redis 缓存策略'
      ],
      bugfixes: [
        '修复用户权限缓存问题',
        '修复菜单权限树加载错误',
        '修复 API 权限校验遗漏'
      ],
      docs: ['新增多集群接入文档', '新增 Harbor 集成指南'],
      stats: {
        commits: 142,
        filesChanged: 245,
        additions: '+14,280',
        deletions: '-3,560'
      }
    }
  ]

  // 过滤后的日志
  const filteredLogs = computed(() => {
    if (selectedVersion.value === '全部版本') {
      return changeLogs
    }
    return changeLogs.filter((log) => log.version.startsWith(selectedVersion.value.slice(0, -2)))
  })

  // 获取版本类型样式
  const getVersionType = (type: string): string => {
    const typeMap = {
      Major: 'danger',
      Minor: 'primary',
      Patch: 'success',
      'Pre-release': 'warning'
    }
    return typeMap[type] || 'info'
  }

  // 获取统计标签
  const getStatLabel = (key: string): string => {
    const labels = {
      commits: '提交次数',
      filesChanged: '文件变更',
      additions: '新增代码',
      deletions: '删除代码'
    }
    return labels[key] || key
  }
</script>

<style lang="scss" scoped>
  .update-log-card {
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

      .version-select {
        width: 150px;
      }
    }

    .log-content {
      .log-item {
        background: var(--art-bg-color);
        border: 1px solid var(--art-border-color);
        border-left: 4px solid var(--art-primary);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        animation: fadeInUp 0.5s ease-out;
        transition: all 0.3s;

        &:hover {
          border-left-color: var(--art-primary);
          box-shadow: 0 4px 16px rgba(var(--art-primary-rgb), 0.1);
        }

        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;

          .version-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .version-tag {
              font-size: 20px;
              font-weight: 700;
              margin: 0;
              display: flex;
              align-items: center;
              gap: 6px;
              color: var(--art-primary);

              svg {
                font-size: 22px;
              }
            }
          }

          .log-meta {
            display: flex;
            gap: 16px;
            font-size: 13px;
            color: var(--art-text-color-secondary);

            .log-date,
            .log-author {
              display: flex;
              align-items: center;
              gap: 4px;

              svg {
                font-size: 14px;
              }
            }
          }
        }

        .log-body {
          .log-description {
            margin-bottom: 20px;

            p {
              font-size: 14px;
              color: var(--art-text-color-secondary);
              line-height: 1.6;
              margin: 0;
            }
          }

          .change-section {
            margin-bottom: 20px;

            &:last-child {
              margin-bottom: 0;
            }

            .section-header {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 12px;
              padding: 8px 12px;
              border-radius: 6px;

              svg {
                font-size: 16px;
              }

              &.feature-header {
                background: var(--art-success-light-9);
                color: var(--art-success);
              }

              &.improvement-header {
                background: var(--art-primary-light-9);
                color: var(--art-primary);
              }

              &.bugfix-header {
                background: var(--art-warning-light-9);
                color: var(--art-warning);
              }

              &.breaking-header {
                background: var(--art-danger-light-9);
                color: var(--art-danger);
              }

              &.docs-header {
                background: var(--art-info-light-9);
                color: var(--art-info);
              }
            }

            .change-list {
              list-style: none;
              padding: 0;
              margin: 0;

              .change-item {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 8px 12px;
                margin-bottom: 6px;
                background: var(--art-bg-color-overlay);
                border-radius: 6px;
                font-size: 13px;
                line-height: 1.6;
                transition: all 0.2s;

                &:hover {
                  transform: translateX(4px);
                }

                .item-icon {
                  font-size: 16px;
                  flex-shrink: 0;
                  margin-top: 2px;
                }

                &.feature-item .item-icon {
                  color: var(--art-success);
                }

                &.improvement-item .item-icon {
                  color: var(--art-primary);
                }

                &.bugfix-item .item-icon {
                  color: var(--art-warning);
                }

                &.breaking-item .item-icon {
                  color: var(--art-danger);
                }

                &.docs-item .item-icon {
                  color: var(--art-info);
                }
              }
            }
          }

          .log-stats {
            display: flex;
            gap: 24px;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px dashed var(--art-border-color);
            flex-wrap: wrap;

            .stat-item {
              font-size: 13px;

              .stat-label {
                color: var(--art-text-color-secondary);
                margin-right: 6px;
              }

              .stat-value {
                font-weight: 600;
                color: var(--art-primary);
              }
            }
          }
        }
      }
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .update-log-card {
      padding: 16px;

      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        .version-select {
          width: 100%;
        }
      }

      .log-content {
        .log-item {
          padding: 16px;

          .log-header {
            flex-direction: column;

            .log-meta {
              flex-direction: column;
              gap: 8px;
            }
          }

          .log-body {
            .log-stats {
              flex-direction: column;
              gap: 8px;
            }
          }
        }
      }
    }
  }
</style>