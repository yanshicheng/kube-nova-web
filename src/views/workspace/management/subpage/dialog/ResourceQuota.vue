<template>
  <div class="step-panel">
    <!-- 集群资源概览 -->
    <div class="resource-overview-card" v-if="cluster">
      <div class="overview-header">
        <span class="title">
          <ElIcon><Monitor /></ElIcon>
          集群资源概览
        </span>
        <span class="cluster-name">{{ cluster.clusterName }}</span>
      </div>
      <div class="resource-grid">
        <div class="resource-card" :class="{ 'has-warning': cpuUsagePercent > 80 }">
          <div class="resource-icon cpu">
            <ElIcon><Cpu /></ElIcon>
          </div>
          <div class="resource-info">
            <div class="resource-name">CPU</div>
            <div class="resource-value">
              <!-- 显示时，formatResourceDisplay 会根据数值大小自动选择合适的单位 -->
              <span class="available">{{ formatResourceDisplay(availableCpu, 'cpu') }}</span>
              <span class="separator">/</span>
              <span class="total">{{ formatResourceDisplay(cluster.cpuCapacity, 'cpu') }}</span>
            </div>
            <ElProgress
              :percentage="cpuUsagePercent"
              :stroke-width="3"
              :color="getProgressColor(cpuUsagePercent)"
              :show-text="false"
            />
          </div>
        </div>
        <div class="resource-card" :class="{ 'has-warning': memUsagePercent > 80 }">
          <div class="resource-icon memory">
            <ElIcon><Histogram /></ElIcon>
          </div>
          <div class="resource-info">
            <div class="resource-name">内存</div>
            <div class="resource-value">
              <span class="available">{{ formatResourceDisplay(availableMemory, 'memory') }}</span>
              <span class="separator">/</span>
              <span class="total">{{ formatResourceDisplay(cluster.memCapacity, 'memory') }}</span>
            </div>
            <ElProgress
              :percentage="memUsagePercent"
              :stroke-width="3"
              :color="getProgressColor(memUsagePercent)"
              :show-text="false"
            />
          </div>
        </div>
        <div class="resource-card" :class="{ 'has-warning': storageUsagePercent > 80 }">
          <div class="resource-icon storage">
            <ElIcon><FolderOpened /></ElIcon>
          </div>
          <div class="resource-info">
            <div class="resource-name">存储</div>
            <div class="resource-value">
              <span class="available">{{ formatResourceDisplay(availableStorage, 'memory') }}</span>
              <span class="separator">/</span>
              <span class="total">{{ formatResourceDisplay(cluster.storageLimit, 'memory') }}</span>
            </div>
            <ElProgress
              :percentage="storageUsagePercent"
              :stroke-width="3"
              :color="getProgressColor(storageUsagePercent)"
              :show-text="false"
            />
          </div>
        </div>
        <div class="resource-card" :class="{ 'has-warning': podsUsagePercent > 80 }">
          <div class="resource-icon pods">
            <ElIcon><Box /></ElIcon>
          </div>
          <div class="resource-info">
            <div class="resource-name">Pods</div>
            <div class="resource-value">
              <span class="available">{{ availablePods }}</span>
              <span class="separator">/</span>
              <span class="total">{{ cluster.podsLimit }}</span>
            </div>
            <ElProgress
              :percentage="podsUsagePercent"
              :stroke-width="3"
              :color="getProgressColor(podsUsagePercent)"
              :show-text="false"
            />
          </div>
        </div>
        <div
          class="resource-card"
          v-if="cluster.gpuLimit > 0"
          :class="{ 'has-warning': gpuUsagePercent > 80 }"
        >
          <div class="resource-icon gpu">
            <ElIcon><VideoPlay /></ElIcon>
          </div>
          <div class="resource-info">
            <div class="resource-name">GPU</div>
            <div class="resource-value">
              <span class="available">{{ formatResourceDisplay(availableGpu, 'cpu') }}</span>
              <span class="separator">/</span>
              <span class="total">{{ formatResourceDisplay(cluster.gpuCapacity, 'cpu') }}</span>
            </div>
            <ElProgress
              :percentage="gpuUsagePercent"
              :stroke-width="3"
              :color="getProgressColor(gpuUsagePercent)"
              :show-text="false"
            />
          </div>
        </div>
      </div>
    </div>

    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="160px">
      <!-- 基础资源配置 -->
      <div class="form-section">
        <div class="section-header">
          <ElIcon><Cpu /></ElIcon>
          <span>基础资源配置</span>
          <ElTooltip content="CPU、内存为必填项" placement="top">
            <ElIcon style="margin-left: 8px; color: var(--el-color-warning)">
              <Warning />
            </ElIcon>
          </ElTooltip>
        </div>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="CPU 配额" prop="cpuAllocated" required>
              <ResourceInput
                v-model="formData.cpuAllocated"
                type="cpu"
                :min="0"
                @update:model-value="handleResourceChange"
              />
              <div class="form-tip">
                <ElIcon><InfoFilled /></ElIcon>
                可用: {{ formatResourceDisplay(availableCpu, 'cpu') }}
              </div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="内存配额" prop="memAllocated" required>
              <ResourceInput
                v-model="formData.memAllocated"
                type="memory"
                :min="0"
                @update:model-value="handleResourceChange"
              />
              <div class="form-tip">
                <ElIcon><InfoFilled /></ElIcon>
                可用: {{ formatResourceDisplay(availableMemory, 'memory') }}
              </div>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="存储配额" prop="storageAllocated">
              <ResourceInput
                v-model="formData.storageAllocated"
                type="memory"
                :min="0"
                @update:model-value="handleResourceChange"
              />
              <div class="form-tip">
                <ElIcon><InfoFilled /></ElIcon>
                可用: {{ formatResourceDisplay(availableStorage, 'memory') }}
              </div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12" v-if="cluster?.gpuLimit > 0">
            <ElFormItem label="GPU 配额" prop="gpuAllocated">
              <ResourceInput
                v-model="formData.gpuAllocated"
                type="cpu"
                :min="0"
                @update:model-value="handleResourceChange"
              />
              <div class="form-tip">
                <ElIcon><InfoFilled /></ElIcon>
                可用: {{ formatResourceDisplay(availableGpu, 'cpu') }}
              </div>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </div>

      <!-- 对象资源限制 -->
      <div class="form-section">
        <div class="section-header">
          <ElIcon><Files /></ElIcon>
          <span>对象资源限制</span>
          <ElTooltip content="Pod 数量为必填项，其他设置为 0 表示不限制" placement="top">
            <ElIcon style="margin-left: 8px; color: var(--el-color-warning)">
              <Warning />
            </ElIcon>
          </ElTooltip>
        </div>

        <!-- 工作负载限制 -->
        <ElCollapse v-model="activeCollapse">
          <ElCollapseItem title="工作负载" name="workload">
            <ElRow :gutter="20">
              <ElCol :span="8">
                <ElFormItem label="Pod 数量" prop="podsAllocated" required>
                  <ElInputNumber
                    v-model="formData.podsAllocated"
                    :min="1"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">
                    <ElIcon><InfoFilled /></ElIcon>
                    可用: {{ availablePods }} 个
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="Deployment" prop="deploymentsAllocated">
                  <ElInputNumber
                    v-model="formData.deploymentsAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableDeployments }} 个</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="StatefulSet" prop="statefulsetsAllocated">
                  <ElInputNumber
                    v-model="formData.statefulsetsAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableStatefulsets }} 个</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="20">
              <ElCol :span="8">
                <ElFormItem label="DaemonSet" prop="daemonsetsAllocated">
                  <ElInputNumber
                    v-model="formData.daemonsetsAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableDaemonsets }} 个</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="Job" prop="jobsAllocated">
                  <ElInputNumber
                    v-model="formData.jobsAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableJobs }} 个</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="CronJob" prop="cronjobsAllocated">
                  <ElInputNumber
                    v-model="formData.cronjobsAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableCronjobs }} 个</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElCollapseItem>

          <ElCollapseItem title="网络资源" name="network">
            <ElRow :gutter="20">
              <ElCol :span="8">
                <ElFormItem label="Service" prop="serviceAllocated">
                  <ElInputNumber
                    v-model="formData.serviceAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableServices }} 个</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="Ingress" prop="ingressesAllocated">
                  <ElInputNumber
                    v-model="formData.ingressesAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableIngresses }} 个</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="LoadBalancer" prop="loadbalancersAllocated">
                  <ElInputNumber
                    v-model="formData.loadbalancersAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableLoadbalancers }} 个</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="20">
              <ElCol :span="8">
                <ElFormItem label="NodePort" prop="nodeportsAllocated">
                  <ElInputNumber
                    v-model="formData.nodeportsAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableNodeports }} 个</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElCollapseItem>

          <ElCollapseItem title="配置与存储" name="config">
            <ElRow :gutter="20">
              <ElCol :span="8">
                <ElFormItem label="ConfigMap" prop="configmapAllocated">
                  <ElInputNumber
                    v-model="formData.configmapAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableConfigmaps }} 个</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="Secret" prop="secretAllocated">
                  <ElInputNumber
                    v-model="formData.secretAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availableSecrets }} 个</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="PVC" prop="pvcAllocated">
                  <ElInputNumber
                    v-model="formData.pvcAllocated"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleResourceChange"
                  />
                  <div class="form-tip">可用: {{ availablePvcs }} 个</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="20">
              <ElCol :span="8">
                <ElFormItem label="临时存储" prop="ephemeralStorageAllocated">
                  <ResourceInput
                    v-model="formData.ephemeralStorageAllocated"
                    type="memory"
                    :min="0"
                    @update:model-value="handleResourceChange"
                  />
                  <div class="form-tip">
                    可用: {{ formatResourceDisplay(availableEphemeralStorage, 'memory') }}
                  </div>
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElCollapseItem>
        </ElCollapse>
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import {
    Cpu,
    Monitor,
    Histogram,
    FolderOpened,
    VideoPlay,
    Files,
    InfoFilled,
    Warning,
    Box
  } from '@element-plus/icons-vue'
  import type { ProjectCluster, ProjectWorkspace } from '@/api'
  import ResourceInput from './components/ResourceInput.vue'
  import {
    formatResourceDisplay,
    parseCpu,
    parseMemory,
    getMemoryInBytes, // 新增
    getCpuInCore    // 新增
  } from '@/utils/resource'

  interface Props {
    formData: Record<string, any>
    cluster: ProjectCluster | null
    workspace?: ProjectWorkspace | null
    mode: 'create' | 'edit'
  }

  interface Emits {
    (e: 'update', data: Record<string, any>): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref()
  const activeCollapse = ref(['workload', 'network', 'config'])

  // 初始化
  onMounted(() => {
    if (
      props.mode === 'create' &&
      (!props.formData.podsAllocated || props.formData.podsAllocated === 0)
    ) {
      props.formData.podsAllocated = 1
      emit('update', props.formData)
    }
  })

  // 验证规则
  const rules = {
    cpuAllocated: [{ required: true, message: '请设置 CPU 配额', trigger: 'blur' }],
    memAllocated: [{ required: true, message: '请设置内存配额', trigger: 'blur' }],
    podsAllocated: [
      { required: true, message: '请设置 Pod 数量', trigger: 'blur' },
      { type: 'number', min: 1, message: 'Pod 数量至少为 1', trigger: 'blur' }
    ]
  }

  // ==================== 资源可用量计算 (Fix: 统一单位计算) ====================
  // 【重要】对于支持超分的资源（CPU、内存、GPU）：
  //  可用量 = capacity（超分后容量）- allocated（已分配）
  // 对于不支持超分的资源（存储、Pods、ConfigMap等）：
  //  可用量 = limit（配额上限）- allocated（已分配）

  // CPU（支持超分）：可用 = cpuCapacity - cpuAllocated
  const availableCpu = computed(() => {
    if (!props.cluster) return 0
    // 统一转换为核心数(Core)计算
    const allocated = getCpuInCore(props.cluster.cpuAllocated)
    const capacity = getCpuInCore(props.cluster.cpuCapacity)
    return Math.max(0, capacity - allocated)
  })

  // 内存（支持超分）：可用 = memCapacity - memAllocated
  const availableMemory = computed(() => {
    if (!props.cluster) return 0
    // 统一转换为字节(Bytes)计算
    const allocated = getMemoryInBytes(props.cluster.memAllocated)
    const capacity = getMemoryInBytes(props.cluster.memCapacity)
    return Math.max(0, capacity - allocated)
  })

  // 存储（不支持超分）：可用 = storageLimit - storageAllocated
  const availableStorage = computed(() => {
    if (!props.cluster) return 0
    // 统一转换为字节(Bytes)计算
    const allocated = getMemoryInBytes(props.cluster.storageAllocated)
    const limit = getMemoryInBytes(props.cluster.storageLimit)
    return Math.max(0, limit - allocated)
  })

  // GPU（支持超分）：可用 = gpuCapacity - gpuAllocated
  const availableGpu = computed(() => {
    if (!props.cluster) return 0
    const allocated = getCpuInCore(props.cluster.gpuAllocated)
    const capacity = getCpuInCore(props.cluster.gpuCapacity)
    return Math.max(0, capacity - allocated)
  })

  // 临时存储
  const availableEphemeralStorage = computed(() => {
    if (!props.cluster) return 0
    const allocated = getMemoryInBytes(props.cluster.ephemeralStorageAllocated)
    const limit = getMemoryInBytes(props.cluster.ephemeralStorageLimit)
    return Math.max(0, limit - allocated)
  })

  // Pods（不支持超分）：可用 = podsLimit - podsAllocated
  const availablePods = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.podsLimit - props.cluster.podsAllocated)
  })

  const availableDeployments = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.deploymentsLimit - props.cluster.deploymentsAllocated)
  })

  const availableStatefulsets = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.statefulsetsLimit - props.cluster.statefulsetsAllocated)
  })

  const availableDaemonsets = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.daemonsetsLimit - props.cluster.daemonsetsAllocated)
  })

  const availableJobs = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.jobsLimit - props.cluster.jobsAllocated)
  })

  const availableCronjobs = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.cronjobsLimit - props.cluster.cronjobsAllocated)
  })

  const availableServices = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.serviceLimit - props.cluster.serviceAllocated)
  })

  const availableIngresses = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.ingressesLimit - props.cluster.ingressesAllocated)
  })

  const availableLoadbalancers = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.loadbalancersLimit - props.cluster.loadbalancersAllocated)
  })

  const availableNodeports = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.nodeportsLimit - props.cluster.nodeportsAllocated)
  })

  const availableConfigmaps = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.configmapLimit - props.cluster.configmapAllocated)
  })

  const availableSecrets = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.secretLimit - props.cluster.secretAllocated)
  })

  const availablePvcs = computed(() => {
    if (!props.cluster) return 0
    return Math.max(0, props.cluster.pvcLimit - props.cluster.pvcAllocated)
  })

  // ==================== 使用率百分比计算 ====================
  // CPU 使用率 = cpuAllocated / cpuCapacity
  const cpuUsagePercent = computed(() => {
    if (!props.cluster) return 0
    const capacity = getCpuInCore(props.cluster.cpuCapacity)
    const allocated = getCpuInCore(props.cluster.cpuAllocated)
    return capacity === 0 ? 0 : Math.round((allocated / capacity) * 100)
  })

  // 内存使用率 = memAllocated / memCapacity
  const memUsagePercent = computed(() => {
    if (!props.cluster) return 0
    const capacity = getMemoryInBytes(props.cluster.memCapacity)
    const allocated = getMemoryInBytes(props.cluster.memAllocated)
    return capacity === 0 ? 0 : Math.round((allocated / capacity) * 100)
  })

  // 存储使用率 = storageAllocated / storageLimit
  const storageUsagePercent = computed(() => {
    if (!props.cluster) return 0
    const limit = getMemoryInBytes(props.cluster.storageLimit)
    const allocated = getMemoryInBytes(props.cluster.storageAllocated)
    return limit === 0 ? 0 : Math.round((allocated / limit) * 100)
  })

  // GPU 使用率 = gpuAllocated / gpuCapacity
  const gpuUsagePercent = computed(() => {
    if (!props.cluster) return 0
    const capacity = getCpuInCore(props.cluster.gpuCapacity)
    const allocated = getCpuInCore(props.cluster.gpuAllocated)
    return capacity === 0 ? 0 : Math.round((allocated / capacity) * 100)
  })

  // Pods 使用率 = podsAllocated / podsLimit
  const podsUsagePercent = computed(() => {
    if (!props.cluster || props.cluster.podsLimit === 0) return 0
    return Math.round((props.cluster.podsAllocated / props.cluster.podsLimit) * 100)
  })

  // 进度条颜色
  const getProgressColor = (percentage: number) => {
    if (percentage < 60) return '#67c23a'
    if (percentage < 80) return '#e6a23c'
    return '#f56c6c'
  }

  // 处理资源变化
  const handleResourceChange = () => {
    emit('update', props.formData)
  }

  // 验证方法
  const validate = async () => {
    try {
      await formRef.value?.validate()
      return true
    } catch {
      return false
    }
  }

  defineExpose({
    validate
  })
</script>

<style lang="scss" scoped>
  .step-panel {
    .resource-overview-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 16px;
      color: white;

      .overview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
        }

        .cluster-name {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 13px;
        }
      }

      .resource-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;

        .resource-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 6px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s;

          &:hover {
            background: rgba(255, 255, 255, 0.15);
          }

          &.has-warning {
            border-color: #e6a23c;
            background: rgba(230, 162, 60, 0.15);
          }

          .resource-icon {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            font-size: 18px;

            &.cpu {
              background: rgba(64, 158, 255, 0.2);
            }
            &.memory {
              background: rgba(103, 194, 58, 0.2);
            }
            &.storage {
              background: rgba(230, 162, 60, 0.2);
            }
            &.pods {
              background: rgba(144, 147, 153, 0.2);
            }
            &.gpu {
              background: rgba(245, 108, 108, 0.2);
            }
          }

          .resource-info {
            .resource-name {
              font-size: 11px;
              margin-bottom: 6px;
              opacity: 0.9;
            }

            .resource-value {
              font-size: 13px;
              font-weight: 600;
              margin-bottom: 6px;
              word-break: break-all;

              .available {
                font-size: 15px;
              }
              .separator {
                margin: 0 2px;
                opacity: 0.6;
              }
              .total {
                opacity: 0.8;
                font-size: 11px;
              }
            }
          }
        }
      }
    }

    .form-section {
      margin-bottom: 24px;
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #ebeef5;

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f0f2f5;
        font-size: 16px;
        font-weight: 600;

        .el-icon {
          font-size: 20px;
          color: var(--el-color-primary);
        }
      }

      .form-tip {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 6px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
</style>
