<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import {
    ArrowLeft,
    Server,
    Shield,
    Activity,
    FileText,
    RefreshCw,
    Layers,
    Network
  } from 'lucide-vue-next'
  import { getClusterDetailApi, syncClusterApi, type ClusterDetail } from '@/api'
  import { ElMessage } from 'element-plus'
  import { environmentOptions } from '../constants'

  // 正常导入组件
  import BasicInfo from './tabs/BasicInfo.vue'
  import AuthConfig from './tabs/AuthConfig.vue'
  import MiddlewareManage from './tabs/MiddlewareManage.vue'
  import ResourceInfo from './tabs/ResourceInfo.vue'
  import OperationLog from './tabs/OperationLog.vue'
  import NetworkInfo from './tabs/NetworkInfo.vue'

  const route = useRoute()
  const router = useRouter()
  const clusterId = ref(Number(route.params.id))
  const activeTab = ref('basic')
  const loading = ref(false)
  const syncLoading = ref(false)
  const backLoading = ref(false)
  const clusterDetail = ref<ClusterDetail>()

  // 标签页配置
  const tabs = [
    {
      name: 'basic',
      label: '基本信息',
      icon: Server,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      component: BasicInfo
    },
    {
      name: 'network',
      label: '网络信息',
      icon: Network,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      component: NetworkInfo
    },
    {
      name: 'auth',
      label: '认证配置',
      icon: Shield,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      component: AuthConfig
    },
    {
      name: 'middleware',
      label: '中间件管理',
      icon: Layers,
      gradient: 'linear-gradient(135deg, #ffa502 0%, #ff6348 100%)',
      component: MiddlewareManage
    },
    {
      name: 'resources',
      label: '资源信息',
      icon: Activity,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      component: ResourceInfo
    },
    {
      name: 'logs',
      label: '操作日志',
      icon: FileText,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      component: OperationLog
    }
  ]

  // 获取环境配置
  const getEnvironmentConfig = (environment: string) => {
    return (
      environmentOptions.find((env) => env.value === environment) || {
        label: environment,
        shortLabel: environment.toUpperCase(),
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }
    )
  }

  // 获取集群详情
  const fetchClusterDetail = async () => {
    loading.value = true
    try {
      clusterDetail.value = await getClusterDetailApi(clusterId.value)
    } catch (error) {
    } finally {
      loading.value = false
    }
  }

  // 同步集群
  const handleSync = async () => {
    if (!clusterDetail.value) return
    syncLoading.value = true
    try {
      await syncClusterApi(clusterDetail.value.id)
      ElMessage.success('集群同步任务已触发')
      await fetchClusterDetail()
    } catch (error) {
    } finally {
      syncLoading.value = false
    }
  }

  // 返回
  const goBack = async () => {
    backLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      router.replace('/cluster/list')
    } finally {
      backLoading.value = false
    }
  }

  onMounted(() => {
    fetchClusterDetail()
  })
</script>

<template>
  <div class="management-page">
    <!-- 返回按钮 -->
    <div class="page-nav">
      <el-button text @click="goBack" class="back-btn" :loading="backLoading">
        <ArrowLeft v-if="!backLoading" />
        返回列表
      </el-button>
    </div>

    <!-- 集群头部信息 -->
    <div class="cluster-header" v-if="clusterDetail">
      <div class="header-bg"></div>
      <div class="header-content">
        <div class="cluster-avatar">
          <img v-if="clusterDetail.avatar" :src="clusterDetail.avatar" alt="集群图标" />
          <div v-else class="avatar-placeholder">
            <Server />
          </div>
        </div>

        <div class="cluster-info">
          <h1 class="cluster-name">{{ clusterDetail.name }}</h1>
          <p class="cluster-desc" v-if="clusterDetail.description">
            {{ clusterDetail.description }}
          </p>

          <div class="cluster-meta">
            <div class="meta-item">
              <span class="meta-label">环境</span>
              <span
                class="meta-value env-tag"
                :style="{
                  background: getEnvironmentConfig(clusterDetail.environment).gradient,
                  color: 'white'
                }"
              >
                {{ getEnvironmentConfig(clusterDetail.environment).label }}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">类型</span>
              <span class="meta-value">{{ clusterDetail.clusterType }}</span>
            </div>
            <div class="meta-item" v-if="clusterDetail.version">
              <span class="meta-label">版本</span>
              <span class="meta-value version">{{ clusterDetail.version }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">状态</span>
              <span
                class="meta-value status-tag"
                :class="{
                  healthy: clusterDetail.healthStatus === 1,
                  unhealthy: clusterDetail.healthStatus === 2,
                  degraded: clusterDetail.healthStatus === 3,
                  unknown: clusterDetail.healthStatus === 4
                }"
              >
                <span class="status-dot"></span>
                {{
                  clusterDetail.healthStatus === 1
                    ? '健康'
                    : clusterDetail.healthStatus === 2
                      ? '异常'
                      : clusterDetail.healthStatus === 3
                        ? '降级'
                        : '未知'
                }}
              </span>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <el-button size="large" @click="handleSync" :loading="syncLoading" class="sync-btn">
            <RefreshCw v-if="!syncLoading" :class="{ 'animate-spin': syncLoading }" />
            {{ syncLoading ? '同步中...' : '同步集群' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="tab-container">
        <div class="custom-tabs">
          <div class="tab-nav">
            <div
              v-for="tab in tabs"
              :key="tab.name"
              class="tab-item"
              :class="{ active: activeTab === tab.name }"
              @click="activeTab = tab.name"
            >
              <div
                class="tab-icon"
                :style="{ background: activeTab === tab.name ? tab.gradient : '' }"
              >
                <component :is="tab.icon" />
              </div>
              <span class="tab-label">{{ tab.label }}</span>
            </div>
          </div>

          <div class="tab-panels" v-loading="loading">
            <!-- 使用v-show来控制显示，所有组件都会渲染但只显示当前激活的 -->
            <template v-for="tab in tabs" :key="tab.name">
              <component
                v-show="activeTab === tab.name"
                :is="tab.component"
                v-if="clusterDetail"
                :cluster-detail="clusterDetail"
                :cluster-id="clusterId"
                :cluster-uuid="clusterDetail.uuid"
                :is-active="activeTab === tab.name"
                @refresh="fetchClusterDetail"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .management-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);

    .page-nav {
      padding: 20px 24px;

      .back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #64748b;
        transition: all 0.3s;

        &:hover:not(:disabled) {
          color: #667eea;
          transform: translateX(-2px);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        svg {
          width: 16px;
          height: 16px;
        }
      }
    }

    .cluster-header {
      margin: 0 24px 32px;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      position: relative;

      .header-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 120px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        opacity: 0.1;
      }

      .header-content {
        position: relative;
        padding: 32px;
        display: flex;
        align-items: center;
        gap: 24px;

        .cluster-avatar {
          width: 100px;
          height: 100px;
          border-radius: 20px;
          overflow: hidden;
          background: white;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
          flex-shrink: 0;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .avatar-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;

            svg {
              width: 48px;
              height: 48px;
              color: white;
            }
          }
        }

        .cluster-info {
          flex: 1;

          .cluster-name {
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 8px 0;
            background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .cluster-desc {
            color: #64748b;
            margin: 0 0 20px 0;
            font-size: 15px;
            line-height: 1.6;
          }

          .cluster-meta {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;

            .meta-item {
              display: flex;
              align-items: center;
              gap: 8px;

              .meta-label {
                font-size: 13px;
                color: #94a3b8;
                font-weight: 500;
              }

              .meta-value {
                font-size: 14px;
                color: #475569;
                font-weight: 600;

                &.env-tag {
                  padding: 4px 12px;
                  border-radius: 8px;
                  font-size: 12px;
                }

                &.version {
                  font-family: 'Monaco', 'Menlo', monospace;
                  background: #f1f5f9;
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 13px;
                }

                &.status-tag {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  padding: 4px 10px;
                  border-radius: 8px;
                  font-size: 13px;

                  .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                  }

                  &.healthy {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;

                    .status-dot {
                      background: #10b981;
                    }
                  }

                  &.unhealthy {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;

                    .status-dot {
                      background: #ef4444;
                    }
                  }

                  &.degraded {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;

                    .status-dot {
                      background: #f59e0b;
                    }
                  }

                  &.unknown {
                    background: rgba(107, 114, 128, 0.1);
                    color: #6b7280;

                    .status-dot {
                      background: #6b7280;
                    }
                  }
                }
              }
            }
          }
        }

        .header-actions {
          .sync-btn {
            background: white;
            border: 2px solid #e2e8f0;
            color: #667eea;
            font-weight: 600;
            transition: all 0.3s;

            &:hover:not(:disabled) {
              background: #667eea;
              border-color: #667eea;
              color: white;
              transform: translateY(-2px);
              box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            svg {
              width: 18px;
              height: 18px;
              margin-right: 6px;
            }
          }
        }
      }
    }

    .main-content {
      padding: 0 24px 32px;

      .tab-container {
        background: white;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);

        .custom-tabs {
          .tab-nav {
            display: flex;
            padding: 24px 24px 0;
            border-bottom: 1px solid #f1f5f9;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);

            .tab-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 16px 24px;
              margin-right: 8px;
              cursor: pointer;
              border-radius: 12px 12px 0 0;
              transition: all 0.3s;
              position: relative;
              color: #64748b;

              .tab-icon {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f1f5f9;
                transition: all 0.3s;

                svg {
                  width: 16px;
                  height: 16px;
                  color: #64748b;
                  transition: all 0.3s;
                }
              }

              .tab-label {
                font-size: 14px;
                font-weight: 600;
              }

              &:hover {
                background: rgba(102, 126, 234, 0.05);

                .tab-icon {
                  transform: scale(1.1);
                }
              }

              &.active {
                background: white;
                color: #1e293b;

                &::after {
                  content: '';
                  position: absolute;
                  bottom: -1px;
                  left: 0;
                  right: 0;
                  height: 3px;
                  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                }

                .tab-icon {
                  svg {
                    color: white;
                  }
                }
              }
            }
          }

          .tab-panels {
            padding: 32px;
            min-height: 600px;
            background: white;
          }
        }
      }
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
