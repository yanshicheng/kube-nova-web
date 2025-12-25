<template>
  <div class="job-status-tab">
    <ElCard v-loading="loading">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>Job 状态信息</span>
          <ElButton :icon="RefreshCw" size="small" :loading="loading" @click="loadStatus"
            >刷新</ElButton
          >
        </div>
      </template>
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="任务名称">{{ jobStatus.name }}</ElDescriptionsItem>
        <ElDescriptionsItem label="状态">
          <ElTag :type="getStatusType(jobStatus.status)">{{ jobStatus.status }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="完成数">
          {{ jobStatus.succeeded }}/{{ jobStatus.completions }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="并行数">{{ jobStatus.parallelism }}</ElDescriptionsItem>
        <ElDescriptionsItem label="失败次数">{{ jobStatus.failed }}</ElDescriptionsItem>
        <ElDescriptionsItem label="重试次数">{{ jobStatus.backoffLimit }}</ElDescriptionsItem>
        <ElDescriptionsItem label="开始时间">{{
          formatTime(jobStatus.startTime)
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="完成时间">{{
          formatTime(jobStatus.completionTime)
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="持续时间" :span="2">{{ jobStatus.duration }}</ElDescriptionsItem>
      </ElDescriptions>
      <div style="margin-top: 20px; display: flex; gap: 12px">
        <ElButton type="danger" :loading="stopping" @click="handleStop">停止 Job</ElButton>
        <ElButton type="warning" :loading="restarting" @click="handleRestart">重新运行</ElButton>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { RefreshCw } from 'lucide-vue-next'
  import type { OnecProjectVersion } from '@/api'
  import dayjs from 'dayjs'

  interface Props {
    version: OnecProjectVersion
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  const loading = ref(false)
  const stopping = ref(false)
  const restarting = ref(false)

  const jobStatus = reactive({
    name: 'data-migration-job',
    status: 'Running',
    completions: 1,
    succeeded: 0,
    parallelism: 1,
    failed: 0,
    backoffLimit: 3,
    startTime: Date.now() - 120000,
    completionTime: 0,
    duration: '2m'
  })

  const formatTime = (timestamp: number) => {
    return timestamp ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss') : '-'
  }

  const getStatusType = (status: string) => {
    const typeMap: Record<string, string> = {
      Complete: 'success',
      Failed: 'danger',
      Running: 'primary',
      Pending: 'warning'
    }
    return typeMap[status] || 'info'
  }

  const loadStatus = () => {
    loading.value = true
    setTimeout(() => {
      loading.value = false
    }, 300)
  }

  const handleStop = () => {
    stopping.value = true
    setTimeout(() => {
      ElMessage.success('Job已停止')
      jobStatus.status = 'Failed'
      stopping.value = false
      emit('success')
    }, 500)
  }

  const handleRestart = () => {
    restarting.value = true
    setTimeout(() => {
      ElMessage.success('Job已重新运行')
      jobStatus.status = 'Running'
      jobStatus.startTime = Date.now()
      restarting.value = false
      emit('success')
    }, 500)
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        loadStatus()
      }
    }
  )

  onMounted(() => {
    loadStatus()
  })
</script>
