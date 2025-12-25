<template>
  <div class="project-details" v-loading="loading">
    <ElRow :gutter="20">
      <!-- 统计信息 - 顶部 -->
      <ElCol :span="24">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <FolderGit2 :size="32" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ details?.totalProjects || 0 }}</div>
              <div class="stat-label">项目总数</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <Package :size="32" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ details?.totalRepositories || 0 }}</div>
              <div class="stat-label">仓库总数</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <Lock :size="32" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ details?.privateProjects || 0 }}</div>
              <div class="stat-label">私有项目</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <Globe :size="32" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ details?.publicProjects || 0 }}</div>
              <div class="stat-label">公开项目</div>
            </div>
          </div>
        </div>
      </ElCol>

      <!-- 存储信息 -->
      <ElCol :span="24" style="margin-top: 20px">
        <ElCard shadow="never" class="storage-card">
          <template #header>
            <div class="card-header">
              <HardDrive :size="20" />
              <span>存储信息</span>
            </div>
          </template>

          <div class="storage-content">
            <div class="storage-left">
              <ElProgress
                type="circle"
                :percentage="storagePercentage"
                :width="180"
                :stroke-width="10"
                :color="storageColor"
              >
                <template #default>
                  <div class="progress-text">
                    <div class="progress-used">{{ formatSize(details?.storageUsed || 0) }}</div>
                    <div class="progress-divider">/</div>
                    <div class="progress-total">{{ formatSize(details?.storageTotal || 0) }}</div>
                  </div>
                </template>
              </ElProgress>
            </div>

            <div class="storage-right">
              <div class="storage-item">
                <div class="item-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                  <Database :size="20" />
                </div>
                <div class="item-info">
                  <div class="item-label">总容量</div>
                  <div class="item-value">{{ formatSize(details?.storageTotal || 0) }}</div>
                </div>
              </div>

              <div class="storage-item">
                <div class="item-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                  <HardDrive :size="20" />
                </div>
                <div class="item-info">
                  <div class="item-label">已使用</div>
                  <div class="item-value">{{ formatSize(details?.storageUsed || 0) }}</div>
                </div>
              </div>

              <div class="storage-item">
                <div class="item-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                  <CircleDashed :size="20" />
                </div>
                <div class="item-info">
                  <div class="item-label">可用空间</div>
                  <div class="item-value">{{ formatSize(details?.storageFree || 0) }}</div>
                </div>
              </div>

              <div class="storage-item">
                <div class="item-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                  <Activity :size="20" />
                </div>
                <div class="item-info">
                  <div class="item-label">使用率</div>
                  <div class="item-value" :style="{ color: storageColor }">
                    {{ storagePercentage }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ElCard>
      </ElCol>

      <!-- 基本信息 -->
      <ElCol :span="24" style="margin-top: 20px">
        <ElCard shadow="never" class="info-card">
          <template #header>
            <div class="card-header">
              <Server :size="20" />
              <span>基本信息</span>
            </div>
          </template>

          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="仓库名称" label-align="right">
              <div class="desc-value">
                <Server :size="16" />
                <span>{{ details?.name || '-' }}</span>
              </div>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="仓库类型" label-align="right">
              <ElTag size="small">{{ getTypeText(details?.type) }}</ElTag>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="环境" label-align="right">
              <ElTag size="small" :type="getEnvType(details?.env)">
                {{ getEnvText(details?.env) }}
              </ElTag>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="状态" label-align="right">
              <ElTag :type="details?.status === 1 ? 'success' : 'info'" size="small">
                <div class="tag-content">
                  <CircleCheck v-if="details?.status === 1" :size="14" />
                  <CircleX v-else :size="14" />
                  {{ details?.status === 1 ? '启用' : '禁用' }}
                </div>
              </ElTag>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="仓库地址" label-align="right" :span="2">
              <div class="desc-value url-value">
                <Link :size="16" />
                <span>{{ details?.url || '-' }}</span>
              </div>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="用户名" label-align="right">
              <div class="desc-value">
                <UserCircle2 :size="16" />
                <span>{{ details?.username || '-' }}</span>
              </div>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="证书验证" label-align="right">
              <ElTag :type="details?.insecure ? 'warning' : 'success'" size="small">
                <div class="tag-content">
                  <ShieldCheck v-if="!details?.insecure" :size="14" />
                  <ShieldAlert v-else :size="14" />
                  {{ details?.insecure ? '已跳过' : '已启用' }}
                </div>
              </ElTag>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="创建时间" label-align="right" :span="2">
              <div class="desc-value">
                <Calendar :size="16" />
                <span>{{ formatDateTime(details?.createdAt) }}</span>
              </div>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="描述" label-align="right" :span="2">
              <div class="desc-value">
                <FileText :size="16" />
                <span>{{ details?.description || '-' }}</span>
              </div>
            </ElDescriptionsItem>
          </ElDescriptions>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Server,
  BarChart3,
  FolderGit2,
  Package,
  Lock,
  Globe,
  HardDrive,
  Database,
  CircleDashed,
  Activity,
  UserCircle2,
  Link,
  Calendar,
  FileText,
  CircleCheck,
  CircleX,
  ShieldCheck,
  ShieldAlert
} from 'lucide-vue-next'
import {
  getRegistryDetailsApi,
  type ContainerRegistryDetails
} from '@/api'

interface Props {
  registryUuid: string
}

const props = defineProps<Props>()

const loading = ref(false)
const details = ref<ContainerRegistryDetails>()

// 获取详细信息
const fetchDetails = async () => {
  loading.value = true
  try {
    const response = await getRegistryDetailsApi(props.registryUuid)
    details.value = response.data
  } catch (error) {
    console.error('获取仓库详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 存储使用率
const storagePercentage = computed(() => {
  if (!details.value?.storageTotal || details.value.storageTotal === 0) return 0
  return Math.round((details.value.storageUsed || 0) / details.value.storageTotal * 100)
})

// 存储颜色
const storageColor = computed(() => {
  const percentage = storagePercentage.value
  if (percentage < 60) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
})

// 格式化大小
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 类型文本
const getTypeText = (type?: string) => {
  const texts: Record<string, string> = {
    harbor: 'Harbor',
    'docker-registry': 'Docker Registry',
    nexus: 'Nexus'
  }
  return texts[type || ''] || type || '-'
}

// 环境类型
const getEnvType = (env?: string) => {
  const types: Record<string, any> = {
    dev: 'info',
    test: 'warning',
    staging: 'success',
    prod: 'danger'
  }
  return types[env || ''] || 'info'
}

const getEnvText = (env?: string) => {
  const texts: Record<string, string> = {
    dev: '开发',
    test: '测试',
    staging: '预发',
    prod: '生产'
  }
  return texts[env || ''] || env || '-'
}

// 格式化日期时间
const formatDateTime = (timestamp?: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchDetails()
})
</script>

<style lang="scss" scoped>
.project-details {
  // 统计卡片网格
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: repeat(1, 1fr);
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s;
      min-height: 120px;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .stat-icon {
        width: 72px;
        height: 72px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .stat-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: var(--el-text-color-primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          font-weight: 500;
        }
      }
    }
  }

  // 存储卡片
  .storage-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }

    .storage-content {
      display: flex;
      gap: 48px;
      align-items: center;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 32px;
      }

      .storage-left {
        flex-shrink: 0;

        .progress-text {
          text-align: center;

          .progress-used {
            font-size: 24px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            line-height: 1.2;
          }

          .progress-divider {
            font-size: 16px;
            color: var(--el-text-color-secondary);
            margin: 4px 0;
          }

          .progress-total {
            font-size: 16px;
            color: var(--el-text-color-regular);
            font-weight: 500;
          }
        }
      }

      .storage-right {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }

        .storage-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          background: var(--el-fill-color-light);
          transition: all 0.3s;

          &:hover {
            background: var(--el-fill-color);
            transform: translateY(-2px);
          }

          .item-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }

          .item-info {
            flex: 1;
            min-width: 0;

            .item-label {
              font-size: 13px;
              color: var(--el-text-color-secondary);
              margin-bottom: 4px;
            }

            .item-value {
              font-size: 20px;
              font-weight: 700;
              color: var(--el-text-color-primary);
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
      }
    }
  }

  // 基本信息卡片
  .info-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }

    :deep(.el-descriptions) {
      .el-descriptions__label {
        font-weight: 500;
        color: var(--el-text-color-regular);
        width: 140px;
      }

      .el-descriptions__content {
        font-weight: 400;
      }
    }

    .desc-value {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--el-text-color-primary);

      &.url-value {
        font-family: 'Monaco', 'Consolas', monospace;
        word-break: break-all;
      }
    }

    .tag-content {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>