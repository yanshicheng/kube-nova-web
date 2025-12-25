<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Canary 详情"
    width="900px"
    top="5vh"
    class="detail-dialog"
  >
    <div v-if="canaryDetail" v-loading="loading" class="detail-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <div class="section-title">
          <Settings :size="16" />
          基本信息
        </div>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="名称">{{ canaryDetail.name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="命名空间">{{ canaryDetail.namespace }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="getStatusTypeTag(canaryDetail.status)">
              {{ canaryDetail.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="阶段">
            <ElTag :type="getPhaseTypeTag(canaryDetail.phase)">
              {{ canaryDetail.phase }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="金丝雀权重">
            <span class="weight-value">{{ canaryDetail.canaryWeight }}%</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="失败检查次数">
            <span :class="{ 'error-value': canaryDetail.failedChecks > 0 }">
              {{ canaryDetail.failedChecks }}
            </span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="目标资源" :span="2">
            <ElTag type="primary" size="small">{{ canaryDetail.targetRef.kind }}</ElTag>
            <span style="margin-left: 8px">{{ canaryDetail.targetRef.name }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="进度截止时间" :span="2">
            {{ canaryDetail.progressDeadline }} 秒
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间" :span="2">
            {{ formatTimestamp(canaryDetail.creationTimestamp) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 分析配置 -->
      <div class="info-section">
        <div class="section-title">
          <Activity :size="16" />
          分析配置
        </div>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="分析间隔">
            {{ canaryDetail.analysis.interval }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="失败阈值">
            {{ canaryDetail.analysis.threshold }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最大权重">
            {{ canaryDetail.analysis.maxWeight }}%
          </ElDescriptionsItem>
          <ElDescriptionsItem label="步进权重">
            {{ canaryDetail.analysis.stepWeight }}%
          </ElDescriptionsItem>
          <ElDescriptionsItem label="迭代次数" :span="2">
            {{ canaryDetail.analysis.iterations }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <!-- 指标列表 -->
        <div
          v-if="canaryDetail.analysis.metrics && canaryDetail.analysis.metrics.length > 0"
          class="metrics-section"
        >
          <h4 class="sub-title">
            <BarChart3 :size="14" />
            指标列表
          </h4>
          <ElTable :data="canaryDetail.analysis.metrics" border size="small">
            <ElTableColumn prop="name" label="指标名称" min-width="150" />
            <ElTableColumn prop="interval" label="检查间隔" width="100" align="center" />
            <ElTableColumn label="阈值范围" width="150" align="center">
              <template #default="{ row }">
                <span v-if="row.thresholdRange">
                  {{ row.thresholdRange.min || '-' }} ~ {{ row.thresholdRange.max || '-' }}
                </span>
                <span v-else>-</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="查询语句" min-width="200">
              <template #default="{ row }">
                <ElTooltip v-if="row.query" :content="row.query" placement="top">
                  <span class="query-text">{{ row.query }}</span>
                </ElTooltip>
                <span v-else>-</span>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>

        <!-- Webhooks 列表 -->
        <div
          v-if="canaryDetail.analysis.webhooks && canaryDetail.analysis.webhooks.length > 0"
          class="webhooks-section"
        >
          <h4 class="sub-title">
            <Webhook :size="14" />
            Webhooks
          </h4>
          <ElTable :data="canaryDetail.analysis.webhooks" border size="small">
            <ElTableColumn prop="name" label="名称" width="150" />
            <ElTableColumn prop="type" label="类型" width="150">
              <template #default="{ row }">
                <ElTag size="small">{{ formatWebhookType(row.type) }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="url" label="URL" min-width="250" />
            <ElTableColumn prop="timeout" label="超时" width="100" align="center" />
          </ElTable>
        </div>

        <!-- 流量匹配规则 -->
        <div
          v-if="canaryDetail.analysis.match && canaryDetail.analysis.match.length > 0"
          class="match-section"
        >
          <h4 class="sub-title">
            <Filter :size="14" />
            流量匹配规则
          </h4>
          <ElTable :data="canaryDetail.analysis.match" border size="small">
            <ElTableColumn label="HTTP Headers" min-width="300">
              <template #default="{ row }">
                <div v-if="row.headers" class="headers-list">
                  <div v-for="(value, key) in row.headers" :key="key" class="header-item">
                    <ElTag size="small" type="info">{{ key }}</ElTag>
                    <span class="header-value">{{ JSON.stringify(value) }}</span>
                  </div>
                </div>
                <span v-else>-</span>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </div>

      <!-- 服务配置 -->
      <div class="info-section">
        <div class="section-title">
          <Globe :size="16" />
          服务配置
        </div>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="服务端口">
            {{ canaryDetail.service.port }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="目标端口">
            {{ canaryDetail.service.targetPort || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="端口名称" :span="2">
            {{ canaryDetail.service.portName || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <!-- Gateways -->
        <div
          v-if="canaryDetail.service.gateways && canaryDetail.service.gateways.length > 0"
          class="gateways-section"
        >
          <h4 class="sub-title">
            <Network :size="14" />
            Gateways
          </h4>
          <div class="tags-list">
            <ElTag
              v-for="gateway in canaryDetail.service.gateways"
              :key="gateway"
              type="primary"
              size="default"
            >
              {{ gateway }}
            </ElTag>
          </div>
        </div>

        <!-- Hosts -->
        <div
          v-if="canaryDetail.service.hosts && canaryDetail.service.hosts.length > 0"
          class="hosts-section"
        >
          <h4 class="sub-title">
            <Globe :size="14" />
            Hosts
          </h4>
          <div class="tags-list">
            <ElTag
              v-for="host in canaryDetail.service.hosts"
              :key="host"
              type="success"
              size="default"
            >
              {{ host }}
            </ElTag>
          </div>
        </div>

        <!-- TLS 配置 -->
        <div v-if="canaryDetail.service.trafficPolicy?.tls" class="tls-section">
          <h4 class="sub-title">
            <Shield :size="14" />
            TLS 配置
          </h4>
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="TLS 模式">
              <ElTag type="warning">{{ canaryDetail.service.trafficPolicy.tls.mode }}</ElTag>
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>
      </div>

      <!-- 标签和注解 -->
      <div class="info-section">
        <div class="section-title">
          <Tag :size="16" />
          标签和注解
        </div>

        <!-- Labels -->
        <div
          v-if="canaryDetail.labels && Object.keys(canaryDetail.labels).length > 0"
          class="labels-section"
        >
          <h4 class="sub-title">Labels</h4>
          <div class="kv-list">
            <div v-for="(value, key) in canaryDetail.labels" :key="key" class="kv-item">
              <span class="kv-key">{{ key }}</span>
              <span class="kv-separator">=</span>
              <span class="kv-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- Annotations -->
        <div
          v-if="canaryDetail.annotations && Object.keys(canaryDetail.annotations).length > 0"
          class="annotations-section"
        >
          <h4 class="sub-title">Annotations</h4>
          <div class="kv-list">
            <div v-for="(value, key) in canaryDetail.annotations" :key="key" class="kv-item">
              <span class="kv-key">{{ key }}</span>
              <span class="kv-separator">=</span>
              <span class="kv-value">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <ElEmpty description="暂无数据" />
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Settings,
    Activity,
    Globe,
    Network,
    Tag,
    BarChart3,
    Webhook,
    Filter,
    Shield
  } from 'lucide-vue-next'
  import dayjs from 'dayjs'
  import { getCanaryDetailApi, type CanaryDetail, type ProjectWorkspace } from '@/api'

  interface Props {
    modelValue: boolean
    canaryName: string
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue'])

  const loading = ref(false)
  const canaryDetail = ref<CanaryDetail | null>(null)

  const getStatusTypeTag = (status: string) => {
    const tagMap: Record<string, string> = {
      Initialized: 'info',
      Progressing: 'warning',
      Promoting: 'primary',
      Finalising: 'primary',
      Succeeded: 'success',
      Failed: 'danger'
    }
    return tagMap[status] || 'info'
  }

  const getPhaseTypeTag = (phase: string) => {
    const tagMap: Record<string, string> = {
      Initializing: 'info',
      Waiting: 'info',
      Progressing: 'warning',
      Promoting: 'primary',
      Finalising: 'primary',
      Succeeded: 'success',
      Failed: 'danger'
    }
    return tagMap[phase] || 'info'
  }

  const formatTimestamp = (timestamp: number): string => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
  }

  const formatWebhookType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'pre-rollout': '预发布',
      rollout: '发布中',
      'confirm-rollout': '确认发布',
      'post-rollout': '发布后',
      rollback: '回滚'
    }
    return typeMap[type] || type
  }

  const loadCanaryDetail = async () => {
    if (!props.workspace || !props.canaryName) return

    loading.value = true
    try {
      canaryDetail.value = await getCanaryDetailApi({
        workloadId: props.workspace.id,
        name: props.canaryName
      })
    } catch (error) {
      console.error('加载 Canary 详情失败:', error)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        loadCanaryDetail()
      }
    }
  )
</script>

<style lang="scss" scoped>
  .detail-dialog {
    .detail-content {
      padding: 20px;

      .info-section {
        margin-bottom: 24px;

        &:last-child {
          margin-bottom: 0;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #409eff;
        }

        .sub-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #606266;
          margin: 16px 0 12px 0;
        }

        .weight-value {
          font-weight: 600;
          color: #67c23a;
        }

        .error-value {
          font-weight: 600;
          color: #f56c6c;
        }

        .query-text {
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: monospace;
          font-size: 12px;
          color: #606266;
        }

        .headers-list {
          .header-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;

            &:last-child {
              margin-bottom: 0;
            }

            .header-value {
              font-family: monospace;
              font-size: 12px;
              color: #606266;
            }
          }
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          background: #f5f7fa;
          border-radius: 6px;
        }

        .kv-list {
          padding: 12px;
          background: #f5f7fa;
          border-radius: 6px;

          .kv-item {
            display: flex;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px dashed #e4e7ed;

            &:last-child {
              border-bottom: none;
            }

            .kv-key {
              flex: 0 0 200px;
              font-weight: 500;
              color: #303133;
              word-break: break-all;
            }

            .kv-separator {
              margin: 0 8px;
              color: #909399;
            }

            .kv-value {
              flex: 1;
              color: #606266;
              word-break: break-all;
            }
          }
        }
      }
    }

    .empty-state {
      padding: 60px 0;
    }
  }
</style>
