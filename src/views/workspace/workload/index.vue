<template>
  <div class="workload-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>工作负载</h2>
        <p>管理 Kubernetes 工作负载资源</p>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCreateWorkload">
          <el-button type="primary">
            <Plus :size="16" class="mr-1" />
            创建工作负载
            <ChevronDown :size="16" class="ml-1" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="pod">
                <Box :size="14" class="mr-2" />
                Pod
              </el-dropdown-item>
              <el-dropdown-item command="deployment">
                <Layers :size="14" class="mr-2" />
                Deployment
              </el-dropdown-item>
              <el-dropdown-item command="statefulset">
                <Database :size="14" class="mr-2" />
                StatefulSet
              </el-dropdown-item>
              <el-dropdown-item command="daemonset">
                <Server :size="14" class="mr-2" />
                DaemonSet
              </el-dropdown-item>
              <el-dropdown-item command="job">
                <Play :size="14" class="mr-2" />
                Job
              </el-dropdown-item>
              <el-dropdown-item command="cronjob">
                <Clock :size="14" class="mr-2" />
                CronJob
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button @click="refreshData">
          <RefreshCw :size="16" />
        </el-button>
      </div>
    </div>

    <!-- 工作负载列表 -->
    <div class="workload-content">
      <!-- 现有的工作负载列表内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import {
    Plus,
    ChevronDown,
    Box,
    Layers,
    Database,
    Server,
    Play,
    Clock,
    RefreshCw
  } from 'lucide-vue-next'

  const router = useRouter()

  const handleCreateWorkload = (command: string) => {
    router.push(`/workspace/workload/create/${command}`)
  }

  const refreshData = () => {
    // 刷新工作负载数据
  }
</script>

<style scoped>
  .workload-page {
    padding: 20px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .header-left h2 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 600;
  }

  .header-left p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }

  .header-right {
    display: flex;
    gap: 12px;
  }

  .mr-1 {
    margin-right: 4px;
  }

  .mr-2 {
    margin-right: 8px;
  }

  .ml-1 {
    margin-left: 4px;
  }
</style>
