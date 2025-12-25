<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Network,
    Globe,
    Cloud,
    Shield,
    Layers,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle,
    Info
  } from 'lucide-vue-next'
  import { getClusterNetworkApi, type ClusterNetwork } from '@/api/manager/cluster'

  interface Props {
    clusterDetail?: any
    clusterId: number
    clusterUuid: string
    isActive?: boolean
  }

  const props = defineProps<Props>()

  const loading = ref(false)
  const refreshLoading = ref(false)
  const networkInfo = ref<ClusterNetwork>()
  const isFirstLoad = ref(true)

  // 获取网络信息
  const fetchNetworkInfo = async () => {
    if (!props.clusterUuid) return

    loading.value = true
    try {
      networkInfo.value = await getClusterNetworkApi(props.clusterUuid)
      isFirstLoad.value = false
    } catch (error) {
    } finally {
      loading.value = false
    }
  }

  // 刷新网络信息
  const handleRefresh = async () => {
    refreshLoading.value = true
    try {
      await fetchNetworkInfo()
      ElMessage.success('网络信息已刷新')
    } finally {
      refreshLoading.value = false
    }
  }

  // 格式化日期
  const formatDate = (timestamp: number | undefined): string => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  // 监听激活状态，实现懒加载
  watch(
    () => props.isActive,
    (newVal) => {
      if (newVal && isFirstLoad.value && props.clusterUuid) {
        fetchNetworkInfo()
      }
    },
    { immediate: true }
  )

  // 监听 clusterUuid 变化
  watch(
    () => props.clusterUuid,
    (newVal) => {
      if (newVal && props.isActive && isFirstLoad.value) {
        fetchNetworkInfo()
      }
    }
  )
</script>

<template>
  <div class="network-info-panel" v-loading="loading">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-title">
        <Network />
        <div>
          <h2>网络配置信息</h2>
          <p>查看集群的网络配置和相关设置</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="handleRefresh" :loading="refreshLoading">
          <RefreshCw v-if="!refreshLoading" :class="{ 'animate-spin': refreshLoading }" />
          {{ refreshLoading ? '刷新中...' : '刷新' }}
        </el-button>
      </div>
    </div>

    <!-- 网络信息内容 -->
    <div v-if="networkInfo" class="network-content">
      <!-- 网络 CIDR 配置 -->
      <div class="info-group">
        <h3 class="group-title">
          <span
            class="title-icon"
            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          >
            <Network />
          </span>
          网络 CIDR 配置
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Pod 网络 CIDR</label>
            <span class="value cidr">{{ networkInfo.clusterCidr || '-' }}</span>
          </div>
          <div class="info-item">
            <label>Service 网络 CIDR</label>
            <span class="value cidr">{{ networkInfo.serviceCidr || '-' }}</span>
          </div>
          <div class="info-item">
            <label>节点 CIDR 掩码大小</label>
            <span class="value">{{ networkInfo.nodeCidrMaskSize || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- DNS 配置 -->
      <div class="info-group">
        <h3 class="group-title">
          <span
            class="title-icon"
            style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          >
            <Globe />
          </span>
          DNS 配置
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <label>DNS 域名后缀</label>
            <span class="value domain">{{ networkInfo.dnsDomain || '-' }}</span>
          </div>
          <div class="info-item">
            <label>DNS 服务 IP</label>
            <span class="value ip">{{ networkInfo.dnsServiceIp || '-' }}</span>
          </div>
          <div class="info-item">
            <label>DNS 提供者</label>
            <span class="value">{{ networkInfo.dnsProvider || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 网络插件配置 -->
      <div class="info-group">
        <h3 class="group-title">
          <span
            class="title-icon"
            style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          >
            <Layers />
          </span>
          网络插件配置
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <label>CNI 网络插件</label>
            <span class="value">{{ networkInfo.cniPlugin || '-' }}</span>
          </div>
          <div class="info-item">
            <label>CNI 插件版本</label>
            <span class="value version">{{ networkInfo.cniVersion || '-' }}</span>
          </div>
          <div class="info-item">
            <label>代理模式</label>
            <span class="value">{{ networkInfo.proxyMode || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Ingress 配置 -->
      <div class="info-group">
        <h3 class="group-title">
          <span
            class="title-icon"
            style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          >
            <Cloud />
          </span>
          Ingress 配置
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Ingress 控制器</label>
            <span class="value">{{ networkInfo.ingressController || '-' }}</span>
          </div>
          <div class="info-item">
            <label>默认 Ingress 类</label>
            <span class="value">{{ networkInfo.ingressClass || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 高级网络配置 -->
      <div class="info-group">
        <h3 class="group-title">
          <span
            class="title-icon"
            style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
          >
            <Shield />
          </span>
          高级网络配置
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <label>IPv6 支持</label>
            <el-tag :type="networkInfo.ipv6Enabled ? 'success' : 'info'" size="small">
              <div class="tag-content">
                <CheckCircle v-if="networkInfo.ipv6Enabled" />
                <XCircle v-else />
                <span>{{ networkInfo.ipv6Enabled ? '已启用' : '未启用' }}</span>
              </div>
            </el-tag>
          </div>
          <div class="info-item">
            <label>双栈网络</label>
            <el-tag :type="networkInfo.dualStackEnabled ? 'success' : 'info'" size="small">
              <div class="tag-content">
                <CheckCircle v-if="networkInfo.dualStackEnabled" />
                <XCircle v-else />
                <span>{{ networkInfo.dualStackEnabled ? '已启用' : '未启用' }}</span>
              </div>
            </el-tag>
          </div>
          <div class="info-item">
            <label>MTU 大小</label>
            <span class="value">{{ networkInfo.mtuSize || '-' }}</span>
          </div>
<!--          <div class="info-item">-->
<!--            <label>NodePort 支持</label>-->
<!--            <el-tag :type="networkInfo.enableNodePort ? 'success' : 'info'" size="small">-->
<!--              <div class="tag-content">-->
<!--                <CheckCircle v-if="networkInfo.enableNodePort" />-->
<!--                <XCircle v-else />-->
<!--                <span>{{ networkInfo.enableNodePort ? '已启用' : '未启用' }}</span>-->
<!--              </div>-->
<!--            </el-tag>-->
<!--          </div>-->
          <div class="info-item">
            <label>NodePort 端口范围</label>
            <span class="value">{{ networkInfo.nodePortRange || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 审计信息 -->
      <div class="info-group">
        <h3 class="group-title">
          <span
            class="title-icon"
            style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
          >
            <Info />
          </span>
          审计信息
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <label>创建人</label>
            <span class="value">{{ networkInfo.createdBy || '-' }}</span>
          </div>
          <div class="info-item">
            <label>创建时间</label>
            <span class="value">{{ formatDate(networkInfo.createdAt) }}</span>
          </div>
          <div class="info-item">
            <label>更新人</label>
            <span class="value">{{ networkInfo.updatedBy || '-' }}</span>
          </div>
          <div class="info-item">
            <label>更新时间</label>
            <span class="value">{{ formatDate(networkInfo.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading" class="empty-state">
      <AlertCircle />
      <h3>暂无网络配置信息</h3>
      <p>该集群尚未配置网络信息</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .network-info-panel {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #f1f5f9;

      .header-title {
        display: flex;
        align-items: center;
        gap: 16px;

        svg {
          width: 40px;
          height: 40px;
          color: #667eea;
        }

        h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        p {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;

        .el-button {
          display: flex;
          align-items: center;
          gap: 6px;

          svg {
            width: 14px;
            height: 14px;
          }
        }
      }
    }

    .network-content {
      .info-group {
        background: #f8fafc;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;

        &:last-child {
          margin-bottom: 0;
        }

        .group-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;

          .title-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;

            svg {
              width: 16px;
              height: 16px;
              color: white;
            }
          }
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 8px;

            label {
              font-size: 13px;
              color: #64748b;
              font-weight: 500;
            }

            .value {
              font-size: 14px;
              color: #1e293b;
              font-weight: 500;

              &.cidr {
                font-family: monospace;
                color: #667eea;
                background: #eef2ff;
                padding: 4px 8px;
                border-radius: 4px;
                display: inline-block;
              }

              &.ip {
                font-family: monospace;
                color: #667eea;
              }

              &.domain {
                font-family: monospace;
                color: #10b981;
              }

              &.version {
                color: #10b981;
                font-weight: 600;
              }
            }

            :deep(.el-tag) {
              width: fit-content;

              .tag-content {
                display: flex;
                align-items: center;
                gap: 4px;

                svg {
                  width: 12px;
                  height: 12px;
                }
              }
            }
          }
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      color: #94a3b8;

      svg {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      h3 {
        font-size: 20px;
        font-weight: 600;
        color: #64748b;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        margin: 0;
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

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
