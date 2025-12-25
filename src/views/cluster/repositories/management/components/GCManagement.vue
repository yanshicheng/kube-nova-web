<template>
  <div class="gc-management">
    <div class="toolbar">
      <div class="toolbar-left">
        <ElAlert type="info" :closable="false" show-icon>
          垃圾回收可以清理未使用的镜像层和制品，释放存储空间
        </ElAlert>
      </div>
      <div class="toolbar-right">
        <ElButton type="primary" :icon="Play" @click="handleTriggerGC">立即执行 GC</ElButton>
        <ElButton :icon="Settings" @click="handleScheduleConfig">调度配置</ElButton>
        <ElButton :icon="RefreshCw" @click="fetchGCHistory">刷新</ElButton>
      </div>
    </div>

    <ElCard shadow="never" class="table-card" v-loading="loading">
      <ElTable :data="gcHistory" style="width: 100%">
        <ElTableColumn label="任务名称" min-width="180">
          <template #default="{ row }">
            <div class="job-name-cell">
              <Play :size="16" />
              <span>{{ row.jobName }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="任务类型" width="120">
          <template #default="{ row }">
            <ElTag size="small">{{ row.jobKind }}</ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <ElTag :type="getStatusType(row.jobStatus)" size="small">
              <div class="status-cell">
                <component :is="getStatusIcon(row.jobStatus)" :size="12"></component>
                <span>{{ getStatusText(row.jobStatus) }}</span>
              </div>
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="删除无标签镜像" width="140">
          <template #default="{ row }">
            <ElTag :type="row.deleteUntagged ? 'warning' : 'info'" size="small">
              {{ row.deleteUntagged ? '是' : '否' }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.creationTime) }}</template>
        </ElTableColumn>

        <ElTableColumn label="更新时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElSpace :size="4">
              <ElButton size="small" :icon="Info" @click="handleViewDetail(row)">详情</ElButton>
              <ElButton size="small" :icon="FileText" @click="handleViewLog(row)">日志</ElButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>

      <div v-if="gcHistory.length > 0" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        ></ElPagination>
      </div>

      <ElEmpty v-if="gcHistory.length === 0 && !loading" description="暂无 GC 记录"></ElEmpty>
    </ElCard>

    <ElDialog
      v-model="triggerDialogVisible"
      title="执行垃圾回收"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm ref="triggerFormRef" :model="triggerForm" :rules="triggerRules" label-width="140px">
        <ElFormItem label="删除无标签镜像">
          <ElSwitch v-model="triggerForm.deleteUntagged"></ElSwitch>
          <div class="form-tip">开启后将删除没有标签的镜像</div>
        </ElFormItem>

        <ElFormItem label="并发工作进程数" prop="workers">
          <ElInputNumber
            v-model="triggerForm.workers"
            :min="1"
            :max="10"
            placeholder="默认为 1"
            style="width: 100%"
          ></ElInputNumber>
          <div class="form-tip">建议值：1-5，过高可能影响性能</div>
        </ElFormItem>

        <ElAlert type="warning" :closable="false" show-icon style="margin-top: 16px">
          <template #title>注意事项</template>
          <ul class="tips-list">
            <li>GC 过程中会占用一定的系统资源</li>
            <li>删除无标签镜像操作不可恢复</li>
            <li>建议在业务低峰期执行</li>
          </ul>
        </ElAlert>
      </ElForm>

      <template #footer>
        <ElButton @click="triggerDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmitTrigger" :loading="triggering">
          立即执行
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="scheduleDialogVisible"
      title="GC 调度配置"
      width="600px"
      :close-on-click-modal="false"
    >
      <ElForm
        ref="scheduleFormRef"
        :model="scheduleForm"
        :rules="scheduleRules"
        label-width="140px"
      >
        <ElFormItem label="Cron 表达式" prop="schedule">
          <ElInput
            v-model="scheduleForm.schedule"
            placeholder="例如: 0 0 2 * * ? (每天凌晨2点执行)"
          ></ElInput>
          <div class="form-tip">
            <a href="https://cron.qqe2.com/" target="_blank" style="color: var(--el-color-primary)">
              Cron 表达式生成器
            </a>
          </div>
        </ElFormItem>

        <ElFormItem label="删除无标签镜像">
          <ElSwitch v-model="scheduleForm.deleteUntagged"></ElSwitch>
        </ElFormItem>

        <ElAlert type="info" :closable="false" show-icon style="margin-top: 16px">
          <template #title>Cron 表达式说明</template>
          <div class="cron-examples">
            <div class="example-item">
              <code>0 0 2 * * ?</code>
              <span>每天凌晨2点执行</span>
            </div>
            <div class="example-item">
              <code>0 0 */6 * * ?</code>
              <span>每6小时执行一次</span>
            </div>
            <div class="example-item">
              <code>0 0 3 * * 1</code>
              <span>每周一凌晨3点执行</span>
            </div>
          </div>
        </ElAlert>
      </ElForm>

      <template #footer>
        <ElButton @click="scheduleDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmitSchedule" :loading="scheduling">
          保存配置
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="detailDialogVisible"
      :title="`GC 详情 - ${currentGC?.jobName || ''}`"
      width="700px"
    >
      <ElDescriptions v-if="currentGC" :column="2" border>
        <ElDescriptionsItem label="任务 ID">{{ currentGC.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="任务名称">{{ currentGC.jobName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="任务类型">{{ currentGC.jobKind }}</ElDescriptionsItem>
        <ElDescriptionsItem label="状态">
          <ElTag :type="getStatusType(currentGC.jobStatus)" size="small">
            {{ getStatusText(currentGC.jobStatus) }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="删除无标签镜像" :span="2">
          <ElTag :type="currentGC.deleteUntagged ? 'warning' : 'info'" size="small">
            {{ currentGC.deleteUntagged ? '是' : '否' }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">
          {{ formatDateTime(currentGC.creationTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="更新时间">
          {{ formatDateTime(currentGC.updateTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="currentGC.jobParameters" label="任务参数" :span="2">
          <pre class="params-pre">{{ JSON.stringify(currentGC.jobParameters, null, 2) }}</pre>
        </ElDescriptionsItem>
      </ElDescriptions>

      <template #footer>
        <ElButton @click="detailDialogVisible = false">关闭</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="logDialogVisible"
      :title="`GC 日志 - ${currentGC?.jobName || ''}`"
      width="900px"
    >
      <div class="log-container" v-loading="loadingLog">
        <pre class="log-pre">{{ gcLog || '暂无日志' }}</pre>
      </div>

      <template #footer>
        <ElButton @click="logDialogVisible = false">关闭</ElButton>
        <ElButton type="primary" :icon="Copy" @click="handleCopyLog">复制日志</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    Play,
    Settings,
    RefreshCw,
    Info,
    FileText,
    Copy,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
  } from 'lucide-vue-next'
  import {
    listGCHistoryApi,
    getGCApi,
    getGCLogApi,
    getGCScheduleApi,
    updateGCScheduleApi,
    triggerGCApi,
    type GCHistory
  } from '@/api'

  interface Props {
    registryUuid: string
  }

  const props = defineProps<Props>()

  const loading = ref(false)
  const gcHistory = ref<GCHistory[]>([])
  const total = ref(0)

  const searchParams = reactive({
    page: 1,
    pageSize: 10
  })

  const triggerDialogVisible = ref(false)
  const triggerFormRef = ref<FormInstance>()
  const triggering = ref(false)

  const triggerForm = reactive({
    deleteUntagged: false,
    workers: 1
  })

  const triggerRules: FormRules = {
    workers: [{ required: true, message: '请输入工作进程数', trigger: 'blur' }]
  }

  const scheduleDialogVisible = ref(false)
  const scheduleFormRef = ref<FormInstance>()
  const scheduling = ref(false)

  const scheduleForm = reactive({
    schedule: '',
    deleteUntagged: false
  })

  const scheduleRules: FormRules = {
    schedule: [{ required: true, message: '请输入 Cron 表达式', trigger: 'blur' }]
  }

  const detailDialogVisible = ref(false)
  const currentGC = ref<GCHistory>()

  const logDialogVisible = ref(false)
  const loadingLog = ref(false)
  const gcLog = ref('')

  const fetchGCHistory = async () => {
    loading.value = true
    try {
      const response = await listGCHistoryApi({
        registryUuid: props.registryUuid,
        page: searchParams.page,
        pageSize: searchParams.pageSize
      })

      gcHistory.value = response.items || []
      total.value = response.total || 0
    } catch (error) {
      console.error('获取 GC 历史失败:', error)
    } finally {
      loading.value = false
    }
  }

  const handleSizeChange = () => {
    searchParams.page = 1
    fetchGCHistory()
  }

  const handlePageChange = () => {
    fetchGCHistory()
  }

  const handleTriggerGC = () => {
    Object.assign(triggerForm, {
      deleteUntagged: false,
      workers: 1
    })
    triggerDialogVisible.value = true
  }

  const handleSubmitTrigger = async () => {
    if (!triggerFormRef.value) return

    try {
      await triggerFormRef.value.validate()

      triggering.value = true
      const response = await triggerGCApi({
        registryUuid: props.registryUuid,
        deleteUntagged: triggerForm.deleteUntagged,
        workers: triggerForm.workers
      })

      ElMessage.success({
        message: `GC 任务已提交成功！任务 ID: ${response.jobId}`,
        duration: 5000,
        showClose: true
      })
      triggerDialogVisible.value = false
      fetchGCHistory()
    } catch (error: any) {
      console.error('触发 GC 失败:', error)
    } finally {
      triggering.value = false
    }
  }

  const handleScheduleConfig = async () => {
    try {
      const response = await getGCScheduleApi(props.registryUuid)
      if (response.data) {
        scheduleForm.schedule = response.data.schedule || ''
        scheduleForm.deleteUntagged = response.data.parameters?.deleteUntagged === 'true'
      }
      scheduleDialogVisible.value = true
    } catch (error) {
      console.error('获取调度配置失败:', error)
    }
  }

  const handleSubmitSchedule = async () => {
    if (!scheduleFormRef.value) return

    try {
      await scheduleFormRef.value.validate()

      scheduling.value = true
      await updateGCScheduleApi({
        registryUuid: props.registryUuid,
        schedule: scheduleForm.schedule,
        deleteUntagged: scheduleForm.deleteUntagged
      })

      ElMessage.success('调度配置已保存')
      scheduleDialogVisible.value = false
    } catch (error: any) {
      console.error('保存调度配置失败:', error)
    } finally {
      scheduling.value = false
    }
  }

  const handleViewDetail = async (gc: GCHistory) => {
    try {
      const response = await getGCApi(gc.id, props.registryUuid)
      currentGC.value = response.data
      detailDialogVisible.value = true
    } catch (error) {
      console.error('获取 GC 详情失败:', error)
    }
  }

  const handleViewLog = async (gc: GCHistory) => {
    currentGC.value = gc
    logDialogVisible.value = true
    loadingLog.value = true
    gcLog.value = ''

    try {
      const response = await getGCLogApi(gc.id, props.registryUuid)
      gcLog.value = response.log || '暂无日志'
    } catch (error) {
      console.error('获取 GC 日志失败:', error)
      gcLog.value = '获取日志失败'
    } finally {
      loadingLog.value = false
    }
  }

  const handleCopyLog = async () => {
    try {
      await navigator.clipboard.writeText(gcLog.value)
      ElMessage.success('日志已复制到剪贴板')
    } catch (error) {
    }
  }

  const getStatusType = (status: string) => {
    const typeMap: Record<string, any> = {
      Pending: 'info',
      Running: 'warning',
      Success: 'success',
      Error: 'danger'
    }
    return typeMap[status] || 'info'
  }

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      Pending: '等待中',
      Running: '运行中',
      Success: '成功',
      Error: '失败'
    }
    return textMap[status] || status
  }

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      Pending: Clock,
      Running: AlertCircle,
      Success: CheckCircle,
      Error: XCircle
    }
    return iconMap[status] || Clock
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  onMounted(() => {
    fetchGCHistory()
  })
</script>

<style lang="scss" scoped>
  .gc-management {
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .toolbar-left {
        flex: 1;
        margin-right: 16px;
      }

      .toolbar-right {
        display: flex;
        gap: 12px;
      }
    }

    .table-card {
      .job-name-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
      }

      .status-cell {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .pagination-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }

    .form-tip {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .tips-list {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      line-height: 1.8;

      li {
        margin-bottom: 4px;
      }
    }

    .cron-examples {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;

      .example-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 13px;

        code {
          padding: 2px 8px;
          background: var(--el-fill-color);
          border-radius: 4px;
          font-family: 'Monaco', 'Consolas', monospace;
          min-width: 140px;
        }

        span {
          color: var(--el-text-color-secondary);
        }
      }
    }

    .params-pre {
      margin: 0;
      padding: 12px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 12px;
      line-height: 1.6;
      overflow-x: auto;
    }

    .log-container {
      max-height: 500px;
      overflow-y: auto;
      background: #1e1e1e;
      border-radius: 4px;
      padding: 16px;

      .log-pre {
        margin: 0;
        color: #d4d4d4;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 12px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }
</style>
