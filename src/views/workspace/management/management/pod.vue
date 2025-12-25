<!-- /views/workspace/management/pod.vue -->
<template>
  <div class="pod-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <ElSpace>
        <ElInput
          v-model="searchKeyword"
          placeholder="搜索 Pod 名称..."
          :prefix-icon="Search"
          style="width: 300px"
          clearable
        />
        <ElSelect v-model="statusFilter" placeholder="状态筛选" clearable style="width: 150px">
          <ElOption label="全部" value="" />
          <ElOption label="Running" value="Running" />
          <ElOption label="Pending" value="Pending" />
          <ElOption label="Failed" value="Failed" />
          <ElOption label="Succeeded" value="Succeeded" />
        </ElSelect>
        <ElButton :icon="Refresh" @click="refreshPods">刷新</ElButton>
      </ElSpace>
    </div>

    <!-- Pod 列表 -->
    <ElTable :data="filteredPods" style="width: 100%" v-loading="loading">
      <ElTableColumn prop="name" label="Pod 名称" min-width="200" show-overflow-tooltip />

      <ElTableColumn prop="status" label="状态" width="120">
        <template #default="{ row }">
          <ElTag :type="getStatusType(row.status)" size="small">
            {{ row.status }}
          </ElTag>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="ready" label="就绪状态" width="100">
        <template #default="{ row }">
          <span>{{ row.readyContainers }}/{{ row.totalContainers }}</span>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="restarts" label="重启次数" width="100" align="center">
        <template #default="{ row }">
          <ElTag :type="row.restarts > 0 ? 'warning' : 'info'" size="small">
            {{ row.restarts }}
          </ElTag>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="age" label="运行时长" width="120" />

      <ElTableColumn prop="cpu" label="CPU" width="100">
        <template #default="{ row }">
          <span>{{ row.cpu }}m</span>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="memory" label="内存" width="100">
        <template #default="{ row }">
          <span>{{ row.memory }}Mi</span>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="node" label="节点" min-width="150" show-overflow-tooltip />

      <ElTableColumn label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <ElSpace>
            <ElButton size="small" link type="primary" @click="viewPodDetail(row)">
              详情
            </ElButton>
            <ElButton size="small" link type="primary" @click="viewPodLogs(row)">
              日志
            </ElButton>
            <ElButton size="small" link type="primary" @click="openTerminal(row)">
              终端
            </ElButton>
            <ElButton size="small" link type="danger" @click="deletePod(row)">
              删除
            </ElButton>
          </ElSpace>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <ElPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalPods"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- Pod 详情对话框 -->
    <ElDialog v-model="detailDialogVisible" title="Pod 详情" width="800px">
      <ElDescriptions :column="2" border v-if="selectedPod">
        <ElDescriptionsItem label="Pod 名称" :span="2">
          {{ selectedPod.name }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="命名空间">
          {{ selectedPod.namespace }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="状态">
          <ElTag :type="getStatusType(selectedPod.status)">
            {{ selectedPod.status }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="Pod IP">
          {{ selectedPod.podIP }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="节点">
          {{ selectedPod.node }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间" :span="2">
          {{ selectedPod.createdAt }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="标签" :span="2">
          <ElTag v-for="(value, key) in selectedPod.labels" :key="key" style="margin: 2px">
            {{ key }}: {{ value }}
          </ElTag>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>

    <!-- 日志对话框 -->
    <ElDialog v-model="logsDialogVisible" title="Pod 日志" width="900px">
      <div class="log-viewer">
        <pre>{{ podLogs }}</pre>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import type { ProjectWorkspace } from '@/api'

interface Props {
  workspace: ProjectWorkspace | null
}

interface Pod {
  name: string
  namespace: string
  status: string
  readyContainers: number
  totalContainers: number
  restarts: number
  age: string
  cpu: number
  memory: number
  node: string
  podIP: string
  createdAt: string
  labels: Record<string, string>
}

defineProps<Props>()

// 状态
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const detailDialogVisible = ref(false)
const logsDialogVisible = ref(false)
const selectedPod = ref<Pod | null>(null)
const podLogs = ref('')

// 模拟 Pod 数据
const mockPods = ref<Pod[]>([
  {
    name: 'nginx-deployment-7fb96c846b-xvnhj',
    namespace: 'default',
    status: 'Running',
    readyContainers: 1,
    totalContainers: 1,
    restarts: 0,
    age: '2d',
    cpu: 100,
    memory: 128,
    node: 'node-1',
    podIP: '10.244.1.5',
    createdAt: new Date().toISOString(),
    labels: {
      app: 'nginx',
      version: 'v1.0.0'
    }
  },
  {
    name: 'redis-master-0',
    namespace: 'default',
    status: 'Running',
    readyContainers: 1,
    totalContainers: 1,
    restarts: 2,
    age: '5d',
    cpu: 50,
    memory: 256,
    node: 'node-2',
    podIP: '10.244.2.10',
    createdAt: new Date().toISOString(),
    labels: {
      app: 'redis',
      role: 'master'
    }
  },
  {
    name: 'mysql-0',
    namespace: 'default',
    status: 'Pending',
    readyContainers: 0,
    totalContainers: 1,
    restarts: 0,
    age: '1h',
    cpu: 0,
    memory: 0,
    node: 'node-3',
    podIP: '',
    createdAt: new Date().toISOString(),
    labels: {
      app: 'mysql',
      tier: 'database'
    }
  },
  {
    name: 'job-backup-xk2j9',
    namespace: 'default',
    status: 'Succeeded',
    readyContainers: 0,
    totalContainers: 1,
    restarts: 0,
    age: '3h',
    cpu: 0,
    memory: 0,
    node: 'node-1',
    podIP: '',
    createdAt: new Date().toISOString(),
    labels: {
      job: 'backup'
    }
  },
  {
    name: 'app-deployment-5d9b66c9f-k8s9j',
    namespace: 'default',
    status: 'Failed',
    readyContainers: 0,
    totalContainers: 1,
    restarts: 5,
    age: '30m',
    cpu: 0,
    memory: 0,
    node: 'node-2',
    podIP: '',
    createdAt: new Date().toISOString(),
    labels: {
      app: 'webapp',
      env: 'prod'
    }
  }
])

// 生成更多模拟数据
for (let i = 5; i < 50; i++) {
  const statuses = ['Running', 'Pending', 'Failed', 'Succeeded']
  const status = statuses[Math.floor(Math.random() * statuses.length)]

  mockPods.value.push({
    name: `pod-${i}-${Math.random().toString(36).substr(2, 9)}`,
    namespace: 'default',
    status: status,
    readyContainers: status === 'Running' ? 1 : 0,
    totalContainers: 1,
    restarts: Math.floor(Math.random() * 10),
    age: `${Math.floor(Math.random() * 7)}d`,
    cpu: status === 'Running' ? Math.floor(Math.random() * 500) : 0,
    memory: status === 'Running' ? Math.floor(Math.random() * 1024) : 0,
    node: `node-${Math.floor(Math.random() * 3) + 1}`,
    podIP: status === 'Running' ? `10.244.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : '',
    createdAt: new Date().toISOString(),
    labels: {
      app: `app-${i}`,
      version: `v${Math.floor(Math.random() * 3) + 1}.0.0`
    }
  })
}

// 计算属性
const filteredPods = computed(() => {
  let result = [...mockPods.value]

  // 搜索过滤
  if (searchKeyword.value) {
    result = result.filter(pod =>
      pod.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    result = result.filter(pod => pod.status === statusFilter.value)
  }

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

const totalPods = computed(() => {
  let result = [...mockPods.value]

  if (searchKeyword.value) {
    result = result.filter(pod =>
      pod.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    result = result.filter(pod => pod.status === statusFilter.value)
  }

  return result.length
})

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    Running: 'success',
    Pending: 'warning',
    Failed: 'danger',
    Succeeded: 'info'
  }
  return typeMap[status] || 'info'
}

// 查看 Pod 详情
const viewPodDetail = (pod: Pod) => {
  selectedPod.value = pod
  detailDialogVisible.value = true
}

// 查看 Pod 日志
const viewPodLogs = (pod: Pod) => {
  // 模拟日志数据
  podLogs.value = `
[2024-01-15 10:23:45] INFO: Starting application...
[2024-01-15 10:23:46] INFO: Loading configuration from /etc/app/config.yaml
[2024-01-15 10:23:46] INFO: Database connection established
[2024-01-15 10:23:47] INFO: Server listening on port 8080
[2024-01-15 10:23:48] INFO: Health check endpoint ready
[2024-01-15 10:23:49] INFO: Application started successfully
[2024-01-15 10:24:15] INFO: Received request: GET /api/health
[2024-01-15 10:24:15] INFO: Response sent: 200 OK
[2024-01-15 10:25:30] INFO: Received request: POST /api/data
[2024-01-15 10:25:31] INFO: Processing data...
[2024-01-15 10:25:32] INFO: Data processed successfully
[2024-01-15 10:25:32] INFO: Response sent: 201 Created
`.trim()

  logsDialogVisible.value = true
}

// 打开终端
const openTerminal = (pod: Pod) => {
  ElMessage.info('终端功能开发中')
}

// 删除 Pod
const deletePod = async (pod: Pod) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 Pod "${pod.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    ElMessage.success('删除成功')
    refreshPods()
  } catch (error) {
    // 用户取消
  }
}

// 刷新 Pod 列表
const refreshPods = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('刷新成功')
  }, 1000)
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 初始化
onMounted(() => {
  refreshPods()
})
</script>

<style lang="scss" scoped>
.pod-management {
  .toolbar {
    margin-bottom: 16px;
  }

  .pagination-wrapper {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .log-viewer {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 16px;
    border-radius: 4px;
    max-height: 500px;
    overflow-y: auto;

    pre {
      margin: 0;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  }

  :deep(.el-descriptions) {
    .el-descriptions__label {
      font-weight: 500;
    }
  }
}
</style>