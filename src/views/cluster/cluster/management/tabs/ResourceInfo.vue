<script setup lang="ts">
  import { ref, computed, watch, onUnmounted, reactive } from 'vue'
  import {
    ElMessage,
    ElProgress,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElButton
  } from 'element-plus'
  import {
    Activity,
    Cpu,
    HardDrive,
    Database,
    Zap,
    Box,
    AlertCircle,
    Info,
    RefreshCw,
    BarChart3,
    RefreshCcw,
    Edit3
  } from 'lucide-vue-next'
  import {
    getClusterResourceInfoApi,
    syncClusterResourceApi,
    updateClusterStorageCapacityApi,
    type ClusterResourceInfo
  } from '@/api'

  interface Props {
    clusterDetail?: any
    clusterId: number
    isActive?: boolean
  }

  const props = defineProps<Props>()

  // 状态管理
  const loading = ref(false)
  const refreshLoading = ref(false)
  const syncLoading = ref(false)
  const resourceInfo = ref<ClusterResourceInfo>()
  const lastUpdateTime = ref<Date>(new Date())
  const isFirstLoad = ref(true)
  const refreshTimer = ref<any>(null)

  // 存储容量编辑相关
  const storageDialogVisible = ref(false)
  const storageEditLoading = ref(false)
  const storageFormRef = ref()
  const storageForm = reactive({
    resourceId: 0,
    storagePhysicalCapacity: 0
  })

  const storageRules = {
    storagePhysicalCapacity: [
      { required: true, message: '请输入存储容量', trigger: 'blur' },
      {
        validator: (rule: any, value: number, callback: any) => {
          if (!value || value <= 0) {
            callback(new Error('存储容量必须大于0'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }

  // 安全的数值转换函数
  const toSafeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || isNaN(value)) {
      return defaultValue
    }
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  // 安全计算百分比的辅助函数
  const safePercent = (value: number, total: number): number => {
    if (!total || total <= 0) return 0
    const percent = Math.round((value / total) * 100)
    return isNaN(percent) ? 0 : Math.max(0, Math.min(200, percent))
  }

  // 计算各类资源的统计信息
  const resourceStats = computed(() => {
    if (!resourceInfo.value) return null

    const data = resourceInfo.value

    // 安全获取数值，确保都是有效数字
    const cpuPhysicalCapacity = toSafeNumber(data.cpuPhysicalCapacity)
    const cpuAllocatedTotal = toSafeNumber(data.cpuAllocatedTotal)
    const cpuCapacityTotal = toSafeNumber(data.cpuCapacityTotal)

    const memPhysicalCapacity = toSafeNumber(data.memPhysicalCapacity)
    const memAllocatedTotal = toSafeNumber(data.memAllocatedTotal)
    const memCapacityTotal = toSafeNumber(data.memCapacityTotal)

    const storagePhysicalCapacity = toSafeNumber(data.storagePhysicalCapacity)
    const storageAllocatedTotal = toSafeNumber(data.storageAllocatedTotal)

    const gpuPhysicalCapacity = toSafeNumber(data.gpuPhysicalCapacity)
    const gpuAllocatedTotal = toSafeNumber(data.gpuAllocatedTotal)
    const gpuCapacityTotal = toSafeNumber(data.gpuCapacityTotal)
    const gpuUsedTotal = toSafeNumber(data.gpuUsedTotal)

    const podsPhysicalCapacity = toSafeNumber(data.podsPhysicalCapacity)
    const podsAllocatedTotal = toSafeNumber(data.podsAllocatedTotal)

    // CPU 统计 - 使用 safePercent 确保返回有效数字
    const cpuPhysicalRemaining = Math.max(0, cpuPhysicalCapacity - cpuAllocatedTotal)
    const cpuAllocationPercent = safePercent(cpuAllocatedTotal, cpuPhysicalCapacity)
    const cpuOverCommitPercent = safePercent(cpuCapacityTotal, cpuPhysicalCapacity)

    // 内存统计
    const memPhysicalRemaining = Math.max(0, memPhysicalCapacity - memAllocatedTotal)
    const memAllocationPercent = safePercent(memAllocatedTotal, memPhysicalCapacity)
    const memOverCommitPercent = safePercent(memCapacityTotal, memPhysicalCapacity)

    // 存储统计
    const storagePhysicalRemaining = Math.max(0, storagePhysicalCapacity - storageAllocatedTotal)
    const storageAllocationPercent = safePercent(storageAllocatedTotal, storagePhysicalCapacity)

    // GPU 统计
    const gpuPhysicalRemaining = Math.max(0, gpuPhysicalCapacity - gpuAllocatedTotal)
    const gpuAllocationPercent = safePercent(gpuAllocatedTotal, gpuPhysicalCapacity)
    const gpuOverCommitPercent = safePercent(gpuCapacityTotal, gpuPhysicalCapacity)
    const gpuUsagePercent = safePercent(gpuUsedTotal, gpuPhysicalCapacity)

    // Pod 统计
    const podsPhysicalRemaining = Math.max(0, podsPhysicalCapacity - podsAllocatedTotal)
    const podsAllocationPercent = safePercent(podsAllocatedTotal, podsPhysicalCapacity)

    return {
      cpu: {
        physicalCapacity: cpuPhysicalCapacity,
        allocatedTotal: cpuAllocatedTotal,
        capacityTotal: cpuCapacityTotal,
        physicalRemaining: cpuPhysicalRemaining,
        allocationPercent: cpuAllocationPercent,
        overCommitPercent: cpuOverCommitPercent
      },
      memory: {
        physicalCapacity: memPhysicalCapacity,
        allocatedTotal: memAllocatedTotal,
        capacityTotal: memCapacityTotal,
        physicalRemaining: memPhysicalRemaining,
        allocationPercent: memAllocationPercent,
        overCommitPercent: memOverCommitPercent
      },
      storage: {
        physicalCapacity: storagePhysicalCapacity,
        allocatedTotal: storageAllocatedTotal,
        physicalRemaining: storagePhysicalRemaining,
        allocationPercent: storageAllocationPercent
      },
      gpu: {
        physicalCapacity: gpuPhysicalCapacity,
        allocatedTotal: gpuAllocatedTotal,
        capacityTotal: gpuCapacityTotal,
        usedTotal: gpuUsedTotal,
        physicalRemaining: gpuPhysicalRemaining,
        allocationPercent: gpuAllocationPercent,
        overCommitPercent: gpuOverCommitPercent,
        usagePercent: gpuUsagePercent
      },
      pods: {
        physicalCapacity: podsPhysicalCapacity,
        allocatedTotal: podsAllocatedTotal,
        physicalRemaining: podsPhysicalRemaining,
        allocationPercent: podsAllocationPercent
      }
    }
  })

  // 格式化存储大小（后端返回的是GiB）
  const formatStorage = (gib: number): string => {
    const value = toSafeNumber(gib)
    if (value === 0) return '0 GiB'

    if (value < 1) {
      const mib = value * 1024
      return `${mib.toFixed(2)} MiB`
    }

    if (value >= 1024) {
      const tib = value / 1024
      return `${tib.toFixed(2)} TiB`
    }

    return `${value.toFixed(2)} GiB`
  }

  // 格式化内存大小（后端返回的是GiB）
  const formatMemory = (gib: number): string => {
    return formatStorage(gib)
  }

  // 格式化CPU（保持核数显示）
  const formatCPU = (cores: number): string => {
    const value = toSafeNumber(cores)
    if (value === 0) return '0'

    if (value % 1 !== 0) {
      return value.toFixed(2)
    }

    return value.toString()
  }

  // 获取进度条颜色
  const getProgressStatus = (percentage: number): string => {
    const value = toSafeNumber(percentage)
    if (value >= 90) return 'exception'
    if (value >= 70) return 'warning'
    return 'success'
  }

  // 获取状态颜色
  const getStatusColor = (percentage: number): string => {
    const value = toSafeNumber(percentage)
    if (value >= 90) return '#ff4757'
    if (value >= 70) return '#ffa502'
    return '#05c46b'
  }

  // 获取资源信息
  const fetchResourceInfo = async () => {
    loading.value = true
    try {
      resourceInfo.value = await getClusterResourceInfoApi(props.clusterId)
      lastUpdateTime.value = new Date()
      isFirstLoad.value = false
    } catch (error) {
    } finally {
      loading.value = false
    }
  }

  // 同步资源信息
  const handleSync = async () => {
    syncLoading.value = true
    try {
      await syncClusterResourceApi(props.clusterId)
      ElMessage.success('同步成功,正在获取最新数据...')
      await fetchResourceInfo()
    } catch (error) {
    } finally {
      syncLoading.value = false
    }
  }

  // 刷新资源信息
  const handleRefresh = async () => {
    refreshLoading.value = true
    try {
      await fetchResourceInfo()
      ElMessage.success('资源信息已刷新')
    } finally {
      refreshLoading.value = false
    }
  }

  // 打开存储编辑对话框
  const openStorageEdit = () => {
    if (!resourceInfo.value) return
    storageForm.resourceId = resourceInfo.value.id
    storageForm.storagePhysicalCapacity = toSafeNumber(resourceInfo.value.storagePhysicalCapacity)
    storageDialogVisible.value = true
  }

  // 保存存储容量
  const saveStorageCapacity = async () => {
    if (!storageFormRef.value) return

    try {
      await storageFormRef.value.validate()
    } catch (error) {
      return
    }

    storageEditLoading.value = true
    try {
      await updateClusterStorageCapacityApi({
        resourceId: storageForm.resourceId,
        storagePhysicalCapacity: storageForm.storagePhysicalCapacity
      })
      ElMessage.success('存储容量更新成功')
      storageDialogVisible.value = false
      await fetchResourceInfo()
    } catch (error) {
    } finally {
      storageEditLoading.value = false
    }
  }

  // 启动自动刷新
  const startAutoRefresh = () => {
    stopAutoRefresh()
    refreshTimer.value = setInterval(() => {
      if (props.isActive) {
        fetchResourceInfo()
      }
    }, 30000)
  }

  // 停止自动刷新
  const stopAutoRefresh = () => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
  }

  // 监听激活状态，实现懒加载
  watch(
    () => props.isActive,
    (newVal) => {
      if (newVal && isFirstLoad.value) {
        fetchResourceInfo()
        startAutoRefresh()
      } else if (!newVal) {
        stopAutoRefresh()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    stopAutoRefresh()
  })
</script>

<template>
  <div class="resource-info-panel" v-loading="loading">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-title">
        <Activity />
        <div>
          <h2>资源使用情况</h2>
          <p>实时监控集群资源使用状态和分配情况</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="update-time">
          <Info />
          <span>最后更新: {{ lastUpdateTime.toLocaleTimeString() }}</span>
        </div>
        <!-- 同步按钮 -->
        <el-button @click="handleSync" :loading="syncLoading" type="primary">
          <RefreshCcw v-if="!syncLoading" :class="{ 'animate-spin': syncLoading }" />
          {{ syncLoading ? '同步中...' : '同步' }}
        </el-button>
        <!-- 刷新按钮 -->
        <el-button @click="handleRefresh" :loading="refreshLoading">
          <RefreshCw v-if="!refreshLoading" :class="{ 'animate-spin': refreshLoading }" />
          {{ refreshLoading ? '刷新中...' : '刷新' }}
        </el-button>
      </div>
    </div>

    <!-- 资源概览卡片 -->
    <div class="resource-overview" v-if="resourceStats">
      <!-- CPU 资源卡片 -->
      <div class="resource-card">
        <div class="card-header">
          <div class="card-icon cpu">
            <Cpu />
          </div>
          <div class="card-title">
            <h3>CPU</h3>
            <p>{{ formatCPU(resourceStats.cpu.physicalCapacity) }} 核</p>
          </div>
        </div>

        <div class="allocation-badge">
          <span class="badge-percent">{{ resourceStats.cpu.allocationPercent }}%</span>
          <span class="badge-label">已分配</span>
        </div>

        <div class="progress-section">
          <div class="progress-item">
            <div class="progress-label">
              <span>分配率</span>
              <span
                class="progress-value"
                :style="{ color: getStatusColor(resourceStats.cpu.allocationPercent) }"
              >
                {{ resourceStats.cpu.allocationPercent }}%
              </span>
            </div>
            <el-progress
              :percentage="resourceStats.cpu.allocationPercent"
              :status="getProgressStatus(resourceStats.cpu.allocationPercent)"
              :stroke-width="6"
            />
          </div>

          <div class="progress-item" v-if="resourceStats.cpu.overCommitPercent > 100">
            <div class="progress-label">
              <span>超分配</span>
              <span class="progress-value warning">{{ resourceStats.cpu.overCommitPercent }}%</span>
            </div>
            <el-progress
              :percentage="Math.min(resourceStats.cpu.overCommitPercent, 200)"
              status="warning"
              :stroke-width="6"
            />
          </div>
        </div>

        <div class="remaining-info">
          <span>剩余: {{ formatCPU(resourceStats.cpu.physicalRemaining) }} 核</span>
        </div>
      </div>

      <!-- 内存资源卡片 -->
      <div class="resource-card">
        <div class="card-header">
          <div class="card-icon memory">
            <Database />
          </div>
          <div class="card-title">
            <h3>内存</h3>
            <p>{{ formatMemory(resourceStats.memory.physicalCapacity) }}</p>
          </div>
        </div>

        <div class="allocation-badge">
          <span class="badge-percent">{{ resourceStats.memory.allocationPercent }}%</span>
          <span class="badge-label">已分配</span>
        </div>

        <div class="progress-section">
          <div class="progress-item">
            <div class="progress-label">
              <span>分配率</span>
              <span
                class="progress-value"
                :style="{ color: getStatusColor(resourceStats.memory.allocationPercent) }"
              >
                {{ resourceStats.memory.allocationPercent }}%
              </span>
            </div>
            <el-progress
              :percentage="resourceStats.memory.allocationPercent"
              :status="getProgressStatus(resourceStats.memory.allocationPercent)"
              :stroke-width="6"
            />
          </div>

          <div class="progress-item" v-if="resourceStats.memory.overCommitPercent > 100">
            <div class="progress-label">
              <span>超分配</span>
              <span class="progress-value warning"
                >{{ resourceStats.memory.overCommitPercent }}%</span
              >
            </div>
            <el-progress
              :percentage="Math.min(resourceStats.memory.overCommitPercent, 200)"
              status="warning"
              :stroke-width="6"
            />
          </div>
        </div>

        <div class="remaining-info">
          <span>剩余: {{ formatMemory(resourceStats.memory.physicalRemaining) }}</span>
        </div>
      </div>

      <!-- GPU 资源卡片 -->
      <div class="resource-card">
        <div class="card-header">
          <div class="card-icon gpu">
            <Zap />
          </div>
          <div class="card-title">
            <h3>GPU</h3>
            <p>{{ formatCPU(resourceStats.gpu.physicalCapacity) }} 个</p>
          </div>
        </div>

        <div class="allocation-badge">
          <span class="badge-percent">{{ resourceStats.gpu.allocationPercent }}%</span>
          <span class="badge-label">已分配</span>
        </div>

        <div class="progress-section">
          <div class="progress-item">
            <div class="progress-label">
              <span>分配率</span>
              <span
                class="progress-value"
                :style="{ color: getStatusColor(resourceStats.gpu.allocationPercent) }"
              >
                {{ resourceStats.gpu.allocationPercent }}%
              </span>
            </div>
            <el-progress
              :percentage="resourceStats.gpu.allocationPercent"
              :status="getProgressStatus(resourceStats.gpu.allocationPercent)"
              :stroke-width="6"
            />
          </div>

          <div class="progress-item" v-if="resourceStats.gpu.overCommitPercent > 100">
            <div class="progress-label">
              <span>超分配</span>
              <span class="progress-value warning">{{ resourceStats.gpu.overCommitPercent }}%</span>
            </div>
            <el-progress
              :percentage="Math.min(resourceStats.gpu.overCommitPercent, 200)"
              status="warning"
              :stroke-width="6"
            />
          </div>
        </div>

        <div class="remaining-info">
          <span>剩余: {{ formatCPU(resourceStats.gpu.physicalRemaining) }} 个</span>
        </div>
      </div>

      <!-- Pod 资源卡片 -->
      <div class="resource-card">
        <div class="card-header">
          <div class="card-icon pod">
            <Box />
          </div>
          <div class="card-title">
            <h3>Pod</h3>
            <p>{{ resourceStats.pods.physicalCapacity }} 个</p>
          </div>
        </div>

        <div class="allocation-badge">
          <span class="badge-percent">{{ resourceStats.pods.allocationPercent }}%</span>
          <span class="badge-label">已分配</span>
        </div>

        <div class="progress-section">
          <div class="progress-item">
            <div class="progress-label">
              <span>分配率</span>
              <span
                class="progress-value"
                :style="{ color: getStatusColor(resourceStats.pods.allocationPercent) }"
              >
                {{ resourceStats.pods.allocationPercent }}%
              </span>
            </div>
            <el-progress
              :percentage="resourceStats.pods.allocationPercent"
              :status="getProgressStatus(resourceStats.pods.allocationPercent)"
              :stroke-width="6"
            />
          </div>
        </div>

        <div class="remaining-info">
          <span>剩余: {{ resourceStats.pods.physicalRemaining }} 个</span>
        </div>
      </div>

      <!-- 存储资源卡片 -->
      <div class="resource-card">
        <div class="card-header">
          <div class="card-icon storage">
            <HardDrive />
          </div>
          <div class="card-title">
            <h3>存储</h3>
            <p>{{ formatStorage(resourceStats.storage.physicalCapacity) }}</p>
          </div>
          <div class="card-action">
            <el-button size="small" @click="openStorageEdit" type="primary" text>
              <Edit3 />
            </el-button>
          </div>
        </div>

        <div class="allocation-badge">
          <span class="badge-percent">{{ resourceStats.storage.allocationPercent }}%</span>
          <span class="badge-label">已分配</span>
        </div>

        <div class="progress-section">
          <div class="progress-item">
            <div class="progress-label">
              <span>分配率</span>
              <span
                class="progress-value"
                :style="{ color: getStatusColor(resourceStats.storage.allocationPercent) }"
              >
                {{ resourceStats.storage.allocationPercent }}%
              </span>
            </div>
            <el-progress
              :percentage="resourceStats.storage.allocationPercent"
              :status="getProgressStatus(resourceStats.storage.allocationPercent)"
              :stroke-width="6"
            />
          </div>
        </div>

        <div class="remaining-info">
          <span>剩余: {{ formatStorage(resourceStats.storage.physicalRemaining) }}</span>
        </div>
      </div>

      <!-- 详细资源信息 -->
      <div class="detailed-info" v-if="resourceStats">
        <div class="info-header">
          <BarChart3 />
          <h3>详细资源信息</h3>
        </div>

        <div class="info-grid">
          <!-- CPU 详细信息 -->
          <div class="info-section">
            <div class="section-title">
              <Cpu />
              <span>CPU 资源 (核)</span>
            </div>
            <div class="info-items">
              <div class="info-item">
                <span class="label">物理总量</span>
                <span class="value">{{ formatCPU(resourceStats.cpu.physicalCapacity) }}</span>
              </div>
              <div class="info-item">
                <span class="label">分配总量</span>
                <span class="value">{{ formatCPU(resourceStats.cpu.allocatedTotal) }}</span>
              </div>
              <div class="info-item">
                <span class="label">超分配总量</span>
                <span class="value">{{ formatCPU(resourceStats.cpu.capacityTotal) }}</span>
              </div>
              <div class="info-item highlight">
                <span class="label">剩余总量</span>
                <span class="value success">{{
                  formatCPU(resourceStats.cpu.physicalRemaining)
                }}</span>
              </div>
            </div>
          </div>

          <!-- 内存详细信息 -->
          <div class="info-section">
            <div class="section-title">
              <Database />
              <span>内存资源 (GiB)</span>
            </div>
            <div class="info-items">
              <div class="info-item">
                <span class="label">物理总量</span>
                <span class="value">{{ formatMemory(resourceStats.memory.physicalCapacity) }}</span>
              </div>
              <div class="info-item">
                <span class="label">分配总量</span>
                <span class="value">{{ formatMemory(resourceStats.memory.allocatedTotal) }}</span>
              </div>
              <div class="info-item">
                <span class="label">超分配总量</span>
                <span class="value">{{ formatMemory(resourceStats.memory.capacityTotal) }}</span>
              </div>
              <div class="info-item highlight">
                <span class="label">剩余总量</span>
                <span class="value success">{{
                  formatMemory(resourceStats.memory.physicalRemaining)
                }}</span>
              </div>
            </div>
          </div>

          <!-- GPU 详细信息 -->
          <div class="info-section">
            <div class="section-title">
              <Zap />
              <span>GPU 资源 (个)</span>
            </div>
            <div class="info-items">
              <div class="info-item">
                <span class="label">物理总量</span>
                <span class="value">{{ formatCPU(resourceStats.gpu.physicalCapacity) }}</span>
              </div>
              <div class="info-item">
                <span class="label">分配总量</span>
                <span class="value">{{ formatCPU(resourceStats.gpu.allocatedTotal) }}</span>
              </div>
              <div class="info-item">
                <span class="label">超分配总量</span>
                <span class="value">{{ formatCPU(resourceStats.gpu.capacityTotal) }}</span>
              </div>
              <div class="info-item">
                <span class="label">实际使用总量</span>
                <span class="value">{{ formatCPU(resourceStats.gpu.usedTotal) }}</span>
              </div>
              <div class="info-item highlight">
                <span class="label">剩余总量</span>
                <span class="value success">{{
                  formatCPU(resourceStats.gpu.physicalRemaining)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Pod 详细信息 -->
          <div class="info-section">
            <div class="section-title">
              <Box />
              <span>Pod 资源 (个)</span>
            </div>
            <div class="info-items">
              <div class="info-item">
                <span class="label">物理总量</span>
                <span class="value">{{ resourceStats.pods.physicalCapacity }}</span>
              </div>
              <div class="info-item">
                <span class="label">分配总量</span>
                <span class="value">{{ resourceStats.pods.allocatedTotal }}</span>
              </div>
              <div class="info-item highlight">
                <span class="label">剩余总量</span>
                <span class="value success">{{ resourceStats.pods.physicalRemaining }}</span>
              </div>
            </div>
          </div>

          <!-- 存储详细信息 -->
          <div class="info-section">
            <div class="section-title">
              <HardDrive />
              <span>存储资源 (GiB)</span>
            </div>
            <div class="info-items">
              <div class="info-item">
                <span class="label">物理总量</span>
                <span class="value">{{
                  formatStorage(resourceStats.storage.physicalCapacity)
                }}</span>
              </div>
              <div class="info-item">
                <span class="label">分配总量</span>
                <span class="value">{{ formatStorage(resourceStats.storage.allocatedTotal) }}</span>
              </div>
              <div class="info-item highlight">
                <span class="label">剩余总量</span>
                <span class="value success">{{
                  formatStorage(resourceStats.storage.physicalRemaining)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading" class="empty-state">
      <AlertCircle />
      <h3>暂无资源数据</h3>
      <p>无法获取集群资源信息，请稍后重试</p>
      <el-button type="primary" @click="handleRefresh">重新加载</el-button>
    </div>

    <!-- 存储容量编辑对话框 -->
    <el-dialog
      v-model="storageDialogVisible"
      title="修改存储容量"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="storageFormRef" :model="storageForm" :rules="storageRules" label-width="120px">
        <el-form-item label="当前容量">
          <el-input :value="formatStorage(resourceStats?.storage.physicalCapacity || 0)" disabled />
        </el-form-item>
        <el-form-item label="新容量 (GiB)" prop="storagePhysicalCapacity">
          <el-input-number
            v-model="storageForm.storagePhysicalCapacity"
            :min="1"
            :step="100"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          style="margin-top: 12px"
          title="提示"
          description="修改存储容量后，系统将重新计算存储分配率"
        />
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="storageDialogVisible = false" :disabled="storageEditLoading">
            取消
          </el-button>
          <el-button type="primary" @click="saveStorageCapacity" :loading="storageEditLoading">
            {{ storageEditLoading ? '保存中...' : '确认修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
  .resource-info-panel {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 20px;
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
        align-items: center;
        gap: 12px;

        .update-time {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 13px;
          color: #64748b;

          svg {
            width: 14px;
            height: 14px;
          }
        }

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

    .resource-overview {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 32px;

      .resource-card {
        background: #ffffff;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;

        &:hover {
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;

          .card-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;

            svg {
              width: 20px;
              height: 20px;
            }

            &.cpu {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            &.memory {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }

            &.storage {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }

            &.pod {
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            }

            &.gpu {
              background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
            }
          }

          .card-title {
            flex: 1;
            min-width: 0;

            h3 {
              margin: 0 0 2px 0;
              font-size: 13px;
              font-weight: 600;
              color: #1e293b;
            }

            p {
              margin: 0;
              font-size: 12px;
              color: #64748b;
              font-weight: 500;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }

          .card-action {
            flex-shrink: 0;

            .el-button {
              display: flex;
              align-items: center;
              padding: 4px 8px;

              svg {
                width: 12px;
                height: 12px;
              }
            }
          }
        }

        .allocation-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 8px;
          margin-bottom: 12px;

          .badge-percent {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
          }

          .badge-label {
            font-size: 11px;
            color: #64748b;
          }
        }

        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
          flex: 1;

          .progress-item {
            .progress-label {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;

              span {
                font-size: 11px;
                color: #64748b;

                &.progress-value {
                  font-weight: 600;
                  font-size: 12px;
                  color: #1e293b;

                  &.warning {
                    color: #f59e0b;
                  }
                }
              }
            }

            :deep(.el-progress) {
              .el-progress__text {
                display: none;
              }

              .el-progress-bar__outer {
                background: #f1f5f9;
                border-radius: 3px;
              }

              .el-progress-bar__inner {
                border-radius: 3px;
              }
            }
          }
        }

        .remaining-info {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 10px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 8px;
          color: #166534;
          font-size: 11px;
          font-weight: 500;
        }
      }
    }

    .detailed-info {
      grid-column: 1 / -1;
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;

      .info-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #e2e8f0;

        svg {
          width: 22px;
          height: 22px;
          color: #667eea;
        }

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;

        .info-section {
          background: white;
          border-radius: 10px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

          .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;

            svg {
              width: 16px;
              height: 16px;
              color: #667eea;
            }
          }

          .info-items {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .info-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 10px;
              background: #f8fafc;
              border-radius: 6px;
              transition: all 0.2s ease;

              &.highlight {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 1px solid #bbf7d0;
              }

              &:hover {
                background: #f1f5f9;
              }

              .label {
                font-size: 12px;
                color: #64748b;
                font-weight: 500;
              }

              .value {
                font-size: 13px;
                font-weight: 600;
                color: #1e293b;

                &.success {
                  color: #10b981;
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
        margin: 0 0 24px 0;
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
