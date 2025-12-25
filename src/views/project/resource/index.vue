<template>
  <div class="resource-pool-page art-full-height cluster-page">
    <!-- 项目选择器 -->
    <ElCard shadow="never" class="selector-card">
      <ElAlert
        v-if="!selectedProject"
        title="请先选择一个项目"
        type="info"
        description="选择项目后才能查看和管理该项目的资源池"
        show-icon
        :closable="false"
      />

      <div class="selector-bar">
        <ElSelect
          v-model="selectedProjectId"
          placeholder="请选择项目"
          filterable
          @change="handleProjectChange"
          size="large"
          style="width: 300px"
          :loading="projectLoading"
        >
          <ElOption
            v-for="project in projectList"
            :key="project.id"
            :label="project.name"
            :value="project.id"
          >
            <div class="project-option">
              <span>{{ project.name }}</span>
              <ElTag v-if="project.isSystem" type="info" size="small">系统</ElTag>
            </div>
          </ElOption>
        </ElSelect>

        <div class="view-switcher" v-if="selectedProject">
          <ElRadioGroup v-model="viewMode" @change="handleViewChange" size="default">
            <ElRadioButton value="card">
              <div class="view-btn-content">
                <Grid2X2 :size="16" />
                <span>卡片视图</span>
              </div>
            </ElRadioButton>
            <ElRadioButton value="list">
              <div class="view-btn-content">
                <List :size="16" />
                <span>列表视图</span>
              </div>
            </ElRadioButton>
          </ElRadioGroup>

          <ElButton type="primary" @click="handleAddResource" :loading="submitLoading">
            <Plus :size="16" style="margin-right: 4px" v-if="!submitLoading" />
            分配资源池
          </ElButton>
        </div>
      </div>
    </ElCard>

    <!-- 资源池内容 -->
    <div v-if="selectedProject" class="resource-content">
      <!-- 卡片视图 -->
      <ElCard v-if="viewMode === 'card'" shadow="never" class="card-view" v-loading="loading">
        <div class="card-container">
          <div v-if="resourceList.length > 0" class="card-grid">
            <div v-for="resource in displayData" :key="resource.id" class="resource-card">
              <!-- 卡片头部 -->
              <div class="card-header">
                <div class="header-left">
                  <div class="card-icon-wrapper">
                    <img
                      src="@imgs/cluster/kubernetes.png"
                      alt="Kubernetes"
                      class="cluster-icon"
                      @error="(e) => (e.target.src = '/default-cluster.png')"
                    />
                  </div>
                  <div class="card-info">
                    <h3 class="cluster-name">{{ resource.clusterName || '未命名集群' }}</h3>
                    <div class="cluster-uuid">
                      <Server :size="12" />
                      <span>{{ resource.clusterUuid }}</span>
                    </div>
                  </div>
                </div>
                <!-- 操作按钮移到右上角 -->
                <div class="header-actions">
                  <ElTooltip content="编辑配额" placement="top">
                    <button
                      class="action-btn edit"
                      @click="handleEditResource(resource)"
                      :disabled="submitLoading"
                    >
                      <Edit2 :size="16" />
                    </button>
                  </ElTooltip>

                  <ElTooltip content="同步状态" placement="top">
                    <button
                      class="action-btn sync"
                      @click="handleSyncResource(resource)"
                      :disabled="syncLoadingMap[resource.id] || submitLoading"
                    >
                      <RefreshCw
                        :size="16"
                        :class="{ 'spin-animation': syncLoadingMap[resource.id] }"
                      />
                    </button>
                  </ElTooltip>

                  <ElTooltip content="删除资源池" placement="top">
                    <button
                      class="action-btn delete"
                      @click="handleDeleteResource(resource)"
                      :disabled="submitLoading || syncLoadingMap[resource.id]"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </ElTooltip>
                </div>
              </div>

              <!-- 资源统计区 -->
              <div class="card-body">
                <div class="resources-grid">
                  <!-- CPU -->
                  <div class="resource-item">
                    <div class="resource-icon cpu">
                      <Cpu :size="16" />
                    </div>
                    <div class="resource-content">
                      <div class="resource-label">CPU</div>
                      <div class="resource-value">
                        {{ formatResourceValue(resource.cpuAllocated) }}/{{
                          formatResourceValue(resource.cpuCapacity)
                        }}
                        <span class="unit">核</span>
                      </div>
                      <div class="resource-progress">
                        <div
                          class="progress-bar"
                          :style="{
                            width:
                              calculateUsagePercentage(
                                resource.cpuAllocated,
                                resource.cpuCapacity
                              ) + '%',
                            backgroundColor: getProgressColor(
                              calculateUsagePercentage(resource.cpuAllocated, resource.cpuCapacity)
                            )
                          }"
                        ></div>
                      </div>
                      <div class="resource-hint">
                        配额: {{ formatResourceValue(resource.cpuLimit) }} 核
                      </div>
                    </div>
                  </div>

                  <!-- 内存 -->
                  <div class="resource-item">
                    <div class="resource-icon memory">
                      <HardDrive :size="16" />
                    </div>
                    <div class="resource-content">
                      <div class="resource-label">内存</div>
                      <div class="resource-value">
                        {{ formatResourceValue(resource.memAllocated) }}/{{
                          formatResourceValue(resource.memCapacity)
                        }}
                        <span class="unit">GiB</span>
                      </div>
                      <div class="resource-progress">
                        <div
                          class="progress-bar"
                          :style="{
                            width:
                              calculateUsagePercentage(
                                resource.memAllocated,
                                resource.memCapacity
                              ) + '%',
                            backgroundColor: getProgressColor(
                              calculateUsagePercentage(resource.memAllocated, resource.memCapacity)
                            )
                          }"
                        ></div>
                      </div>
                      <div class="resource-hint">
                        配额: {{ formatResourceValue(resource.memLimit) }} GiB
                      </div>
                    </div>
                  </div>

                  <!-- 存储 -->
                  <div class="resource-item">
                    <div class="resource-icon storage">
                      <Database :size="16" />
                    </div>
                    <div class="resource-content">
                      <div class="resource-label">存储</div>
                      <div class="resource-value">
                        {{ formatResourceValue(resource.storageAllocated) }}/{{
                          formatResourceValue(resource.storageLimit)
                        }}
                        <span class="unit">GiB</span>
                      </div>
                      <div class="resource-progress">
                        <div
                          class="progress-bar"
                          :style="{
                            width:
                              calculateUsagePercentage(
                                resource.storageAllocated,
                                resource.storageLimit
                              ) + '%',
                            backgroundColor: getProgressColor(
                              calculateUsagePercentage(
                                resource.storageAllocated,
                                resource.storageLimit
                              )
                            )
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- GPU -->
                  <div class="resource-item">
                    <div class="resource-icon gpu">
                      <Zap :size="16" />
                    </div>
                    <div class="resource-content">
                      <div class="resource-label">GPU</div>
                      <div class="resource-value">
                        {{ formatResourceValue(resource.gpuAllocated) }}/{{
                          formatResourceValue(resource.gpuCapacity)
                        }}
                        <span class="unit">个</span>
                      </div>
                      <div class="resource-progress">
                        <div
                          class="progress-bar"
                          :style="{
                            width:
                              calculateUsagePercentage(
                                resource.gpuAllocated,
                                resource.gpuCapacity
                              ) + '%',
                            backgroundColor: getProgressColor(
                              calculateUsagePercentage(resource.gpuAllocated, resource.gpuCapacity)
                            )
                          }"
                        ></div>
                      </div>
                      <div class="resource-hint" v-if="resource.gpuLimit > 0">
                        配额: {{ formatResourceValue(resource.gpuLimit) }} 个
                      </div>
                    </div>
                  </div>

                  <!-- Pods -->
                  <div class="resource-item">
                    <div class="resource-icon pods">
                      <Package :size="16" />
                    </div>
                    <div class="resource-content">
                      <div class="resource-label">Pods</div>
                      <div class="resource-value">
                        {{ resource.podsAllocated || 0 }}/{{ resource.podsLimit || 0 }}
                        <span class="unit">个</span>
                      </div>
                      <div class="resource-progress">
                        <div
                          class="progress-bar"
                          :style="{
                            width:
                              calculateUsagePercentage(resource.podsAllocated, resource.podsLimit) +
                              '%',
                            backgroundColor: getProgressColor(
                              calculateUsagePercentage(resource.podsAllocated, resource.podsLimit)
                            )
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 超分信息 - 始终显示 -->
                <div class="overcommit-info">
                  <div class="overcommit-title">
                    <Layers :size="12" />
                    <span>超分配置</span>
                  </div>
                  <div class="overcommit-tags">
                    <ElTag size="small" effect="plain">
                      CPU: {{ resource.cpuOvercommitRatio || 1 }}x
                    </ElTag>
                    <ElTag size="small" effect="plain">
                      内存: {{ resource.memOvercommitRatio || 1 }}x
                    </ElTag>
                    <ElTag v-if="parseFloat(resource.gpuLimit) > 0" size="small" effect="plain">
                      GPU: {{ resource.gpuOvercommitRatio || 1 }}x
                    </ElTag>
                  </div>
                </div>
              </div>

              <!-- 卡片底部 -->
              <div class="card-footer">
                <div class="update-time">
                  <Clock :size="12" />
                  <span>{{ formatDate(resource.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <ElEmpty v-else description="暂无资源池">
            <ElButton type="primary" @click="handleAddResource">
              <Plus :size="16" style="margin-right: 4px" />
              分配资源池
            </ElButton>
          </ElEmpty>
        </div>

        <!-- 分页器（卡片视图） -->
        <div v-if="resourceList.length > 0 && !loading" class="pagination-wrapper">
          <ElPagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[12, 24, 36, 48]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </ElCard>

      <!-- 列表视图 -->
      <ElCard v-else shadow="never" class="list-view">
        <!-- 表格头部 -->
        <ArtTableHeader
          v-model:columns="columns"
          v-model:showSearchBar="showSearchBar"
          :loading="loading"
          :showZebra="true"
          :showBorder="true"
          :showHeaderBackground="true"
          :fullClass="'art-page-view'"
          :layout="'refresh,size,fullscreen,columns,settings'"
          @refresh="getResourceList"
        >
          <template #left>
            <ElButton type="primary" @click="handleAddResource" :loading="submitLoading">
              <Plus :size="16" style="margin-right: 4px" v-if="!submitLoading" />
              分配资源池
            </ElButton>
          </template>
        </ArtTableHeader>

        <!-- 数据表格 -->
        <ArtTable
          :loading="loading"
          :data="displayData"
          :columns="columns"
          :pagination="pagination"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </ElCard>
    </div>

    <!-- 分配资源池弹窗 -->
    <ResourceDialog
      v-model:visible="resourceDialogVisible"
      :projectId="selectedProjectId"
      :editData="editResourceData"
      :submitLoading="submitLoading"
      @submit="handleResourceSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Plus,
    Edit2,
    Trash2,
    RefreshCw,
    Server,
    Clock,
    Grid2X2,
    List,
    Cpu,
    HardDrive,
    Database,
    Package,
    Zap,
    Layers
  } from 'lucide-vue-next'
  import ResourceDialog from './modules/resource-dialog.vue'
  import { useResourceTableConfig } from './modules/table-config'
  import {
    searchProjectApi,
    searchProjectClusterApi,
    addProjectClusterApi,
    updateProjectClusterApi,
    deleteProjectClusterApi,
    syncProjectClusterResourceApi,
    type ProjectCluster
  } from '@/api'

  defineOptions({ name: 'ProjectResourcePool' })

  // LocalStorage Keys
  const STORAGE_KEY = {
    PROJECT_ID: 'project_resource_pool_selected_project_id',
    VIEW_MODE: 'project_resource_pool_view_mode'
  }

  // 使用抽离的表格配置逻辑
  const { loading, showSearchBar, submitLoading, syncLoadingMap, createTableColumns, formatDate } =
    useResourceTableConfig()

  // 状态管理
  const projectLoading = ref(false)
  const viewMode = ref<'card' | 'list'>('card')
  const selectedProjectId = ref<number | null>(null)
  const selectedProject = ref<any>(null)
  const resourceDialogVisible = ref(false)
  const editResourceData = ref<ProjectCluster | null>(null)

  // 数据
  const projectList = ref<any[]>([])
  const resourceList = ref<ProjectCluster[]>([])

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 12,
    total: 0
  })

  /**
   * 从字符串格式转换为数值（处理 "2", "2.5Gi" 等格式）
   */
  const parseResourceValue = (value: string | number): number => {
    if (typeof value === 'number') return value
    if (!value) return 0

    // 移除单位，只保留数字
    const numStr = String(value).replace(/[^0-9.]/g, '')
    const num = parseFloat(numStr)
    return isNaN(num) ? 0 : num
  }

  /**
   * 格式化资源值显示（保留2位小数）
   */
  const formatResourceValue = (value: string | number): string => {
    const num = parseResourceValue(value)
    return num.toFixed(2)
  }

  /**
   * 计算使用率百分比
   * @param allocated 已分配量（工作空间实际使用）
   * @param capacity 可用容量（超分后的容量，或limit）
   */
  const calculateUsagePercentage = (
    allocated: string | number,
    capacity: string | number
  ): number => {
    const allocatedNum = parseResourceValue(allocated)
    const capacityNum = parseResourceValue(capacity)

    if (capacityNum === 0) return 0
    const percentage = (allocatedNum / capacityNum) * 100
    return Math.min(100, Math.round(percentage))
  }

  /**
   * 获取进度条颜色
   */
  const getProgressColor = (percentage: number): string => {
    if (percentage <= 60) return '#10b981'
    if (percentage <= 80) return '#f59e0b'
    return '#ef4444'
  }

  /**
   * 从 localStorage 恢复状态
   */
  const restoreFromStorage = () => {
    try {
      // 恢复项目选择
      const savedProjectId = localStorage.getItem(STORAGE_KEY.PROJECT_ID)
      if (savedProjectId) {
        selectedProjectId.value = parseInt(savedProjectId)
      }

      // 恢复视图模式
      const savedViewMode = localStorage.getItem(STORAGE_KEY.VIEW_MODE)
      if (savedViewMode === 'card' || savedViewMode === 'list') {
        viewMode.value = savedViewMode

        // 根据视图模式设置分页大小
        if (savedViewMode === 'card') {
          pagination.value.size = 12
          showSearchBar.value = false
        } else {
          pagination.value.size = 10
          showSearchBar.value = true
        }
      }
    } catch (error) {
      console.error('恢复状态失败:', error)
    }
  }

  /**
   * 保存状态到 localStorage
   */
  const saveToStorage = () => {
    try {
      if (selectedProjectId.value) {
        localStorage.setItem(STORAGE_KEY.PROJECT_ID, String(selectedProjectId.value))
      } else {
        localStorage.removeItem(STORAGE_KEY.PROJECT_ID)
      }

      localStorage.setItem(STORAGE_KEY.VIEW_MODE, viewMode.value)
    } catch (error) {
      console.error('保存状态失败:', error)
    }
  }

  // 监听项目选择变化，保存到 localStorage
  watch(selectedProjectId, () => {
    saveToStorage()
  })

  // 监听视图模式变化，保存到 localStorage
  watch(viewMode, () => {
    saveToStorage()
  })

  // 编辑资源
  const handleEditResource = (resource: ProjectCluster) => {
    editResourceData.value = resource
    resourceDialogVisible.value = true
  }

  // 同步资源
  const handleSyncResource = async (resource: ProjectCluster) => {
    try {
      syncLoadingMap.value[resource.id] = true
      await syncProjectClusterResourceApi(resource.id)
      ElMessage.success('同步成功')
      getResourceList()
    } catch (error: any) {
      console.error('同步失败:', error)
    } finally {
      setTimeout(() => {
        delete syncLoadingMap.value[resource.id]
      }, 2000)
    }
  }

  // 删除资源
  const handleDeleteResource = async (resource: ProjectCluster) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除集群 "${resource.clusterName}" 的资源配额吗？删除后该集群下的所有工作空间也会被清除。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      loading.value = true
      await deleteProjectClusterApi(resource.id)
      ElMessage.success('删除成功')
      getResourceList()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      loading.value = false
    }
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    handleEditResource,
    handleSyncResource,
    handleDeleteResource
  })

  // 计算分页后的数据
  const displayData = computed(() => {
    const start = (pagination.value.current - 1) * pagination.value.size
    const end = start + pagination.value.size
    return resourceList.value.slice(start, end)
  })

  // 获取项目列表
  const getProjectList = async () => {
    projectLoading.value = true
    try {
      const response = await searchProjectApi({ page: 1, pageSize: 100 })
      projectList.value = response.items || []

      // 如果有保存的项目ID，尝试恢复选择
      if (selectedProjectId.value) {
        const project = projectList.value.find((p) => p.id === selectedProjectId.value)
        if (project) {
          selectedProject.value = project
          // 自动加载资源列表
          await getResourceList()
        } else {
          // 如果项目不存在了，清除选择
          selectedProjectId.value = null
          selectedProject.value = null
          localStorage.removeItem(STORAGE_KEY.PROJECT_ID)
        }
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
      projectList.value = []
    } finally {
      projectLoading.value = false
    }
  }

  // 获取资源池列表
  const getResourceList = async () => {
    if (!selectedProjectId.value) {
      console.warn('未选择项目，不执行查询')
      return
    }

    loading.value = true
    try {
      const response = await searchProjectClusterApi({
        projectId: selectedProjectId.value
      })
      resourceList.value = response || []
      pagination.value.total = resourceList.value.length
    } catch (error) {
      console.error('获取资源池列表失败:', error)
      resourceList.value = []
      pagination.value.total = 0
    } finally {
      loading.value = false
    }
  }

  // 分页事件处理
  const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1
  }

  const handleCurrentChange = (current: number) => {
    pagination.value.current = current
  }

  // 项目变化
  const handleProjectChange = (value: number) => {
    selectedProject.value = projectList.value.find((p) => p.id === value)
    if (selectedProject.value) {
      pagination.value.current = 1 // 重置分页
      getResourceList()
    } else {
      resourceList.value = []
    }
  }

  // 视图切换
  const handleViewChange = () => {
    if (viewMode.value === 'card') {
      showSearchBar.value = false
      pagination.value.size = 12
    } else if (viewMode.value === 'list') {
      showSearchBar.value = true
      pagination.value.size = 10
    }
    pagination.value.current = 1
  }

  // 添加资源
  const handleAddResource = () => {
    if (!selectedProjectId.value) {
      return
    }
    editResourceData.value = null
    resourceDialogVisible.value = true
  }

  // 提交资源表单
  const handleResourceSubmit = async (formData: any) => {
    submitLoading.value = true
    try {
      if (editResourceData.value) {
        await updateProjectClusterApi(editResourceData.value.id, formData)
        ElMessage.success('更新成功')
      } else {
        await addProjectClusterApi({
          ...formData,
          projectId: selectedProjectId.value!
        })
        ElMessage.success('创建成功')
      }
      resourceDialogVisible.value = false
      getResourceList()
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitLoading.value = false
    }
  }

  // 生命周期
  onMounted(async () => {
    // 1. 先恢复状态
    restoreFromStorage()

    // 2. 再获取项目列表（会自动恢复项目选择和加载资源）
    await getProjectList()
  })
</script>

<style lang="scss" scoped>
  .cluster-page {
    height: 100%;

    .content-card {
      min-height: calc(100vh - 200px);

      .card-container {
        .loading-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 16px;

          .skeleton-card {
            background: var(--el-bg-color);
            border-radius: 8px;
            border: 1px solid var(--el-border-color-lighter);
          }
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 16px;
        }
      }

      .pagination-wrapper {
        display: flex;
        justify-content: center;
        margin-top: 20px;
      }
    }
  }

  .resource-pool-page {
    background: linear-gradient(to bottom, #f8f9fa, #ffffff);
    min-height: 100vh;
    display: flex;
    flex-direction: column;

    .selector-card {
      margin-bottom: 16px;
      flex-shrink: 0;
      border-radius: 8px;
      border: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      .el-alert {
        margin-bottom: 20px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #667eea15, #764ba215);
      }

      .selector-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;

        .project-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .view-switcher {
          display: flex;
          align-items: center;
          gap: 16px;

          .view-btn-content {
            display: flex;
            align-items: center;
            gap: 6px;
          }
        }
      }
    }

    .resource-content {
      flex: 1;
      display: flex;
      flex-direction: column;

      .card-view,
      .list-view {
        flex: 1;
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        border: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        :deep(.el-card__body) {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px;
        }
      }

      .card-view {
        :deep(.el-card__body) {
          .card-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 400px;

            .card-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
              gap: 12px;
              flex: 1;
              align-content: start;
            }

            .el-empty {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 400px;
            }
          }

          .pagination-wrapper {
            flex-shrink: 0;
            display: flex;
            justify-content: center;
            margin-top: auto;
            padding: 20px 0 0 0;
          }
        }

        .resource-card {
          background: var(--el-bg-color);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: var(--el-box-shadow-light);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--el-border-color-lighter);

          &:hover {
            transform: translateY(-2px);
            box-shadow: var(--el-box-shadow);
          }

          .card-header {
            padding: 12px;
            border-bottom: 1px solid #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, #fafbfc, #ffffff);

            .header-left {
              display: flex;
              align-items: center;
              gap: 10px;
              flex: 1;
              min-width: 0;

              .card-icon-wrapper {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                background: linear-gradient(135deg, #667eea20, #764ba220);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                padding: 5px;

                .cluster-icon {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                }
              }

              .card-info {
                flex: 1;
                min-width: 0;

                .cluster-name {
                  font-size: 14px;
                  font-weight: 600;
                  color: #1f2937;
                  margin: 0 0 3px 0;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .cluster-uuid {
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  font-size: 11px;
                  color: #6b7280;
                  opacity: 0.8;

                  svg {
                    color: #9ca3af;
                  }

                  span {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                }
              }
            }

            .header-actions {
              display: flex;
              gap: 6px;

              .action-btn {
                width: 28px;
                height: 28px;
                border-radius: 6px;
                border: none;
                background: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

                &:hover:not(:disabled) {
                  transform: translateY(-1px);
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }

                &:disabled {
                  cursor: not-allowed;
                  opacity: 0.4;
                }

                &.edit {
                  color: #f59e0b;

                  &:hover:not(:disabled) {
                    background: linear-gradient(135deg, #fef3c7, #fed7aa);
                  }
                }

                &.sync {
                  color: #10b981;

                  &:hover:not(:disabled) {
                    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
                  }

                  .spin-animation {
                    animation: spin 1s linear infinite;
                  }
                }

                &.delete {
                  color: #ef4444;

                  &:hover:not(:disabled) {
                    background: linear-gradient(135deg, #fee2e2, #fecaca);
                  }
                }
              }
            }
          }

          .card-body {
            padding: 12px;

            .resources-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
              margin-bottom: 8px;

              .resource-item {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 8px;
                background: #f9fafb;
                border-radius: 6px;
                transition: all 0.2s ease;

                &:hover {
                  background: #f3f4f6;
                }

                // Pods 占据完整一行
                &:nth-child(5) {
                  grid-column: 1 / -1;
                  max-width: 50%;
                }

                .resource-icon {
                  width: 32px;
                  height: 32px;
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;

                  &.cpu {
                    background: linear-gradient(135deg, #667eea20, #764ba220);
                    color: #6366f1;
                  }

                  &.memory {
                    background: linear-gradient(135deg, #ec489920, #f6871920);
                    color: #ec4899;
                  }

                  &.storage {
                    background: linear-gradient(135deg, #06b6d420, #10b98120);
                    color: #06b6d4;
                  }

                  &.gpu {
                    background: linear-gradient(135deg, #f59e0b20, #fbbf2420);
                    color: #f59e0b;
                  }

                  &.pods {
                    background: linear-gradient(135deg, #8b5cf620, #a855f720);
                    color: #8b5cf6;
                  }
                }

                .resource-content {
                  flex: 1;
                  min-width: 0;
                  display: flex;
                  flex-direction: column;
                  gap: 4px;

                  .resource-label {
                    font-size: 11px;
                    color: #6b7280;
                    font-weight: 500;
                  }

                  .resource-value {
                    font-size: 13px;
                    color: #1f2937;
                    font-weight: 600;
                    line-height: 1.2;

                    .unit {
                      font-size: 11px;
                      color: #9ca3af;
                      font-weight: normal;
                      margin-left: 2px;
                    }
                  }

                  .resource-progress {
                    height: 3px;
                    background: #e5e7eb;
                    border-radius: 1.5px;
                    overflow: hidden;

                    .progress-bar {
                      height: 100%;
                      border-radius: 1.5px;
                      transition:
                        width 0.5s ease,
                        background-color 0.3s ease;
                    }
                  }

                  .resource-hint {
                    font-size: 10px;
                    color: #9ca3af;
                    margin-top: 2px;
                  }
                }
              }
            }

            .overcommit-info {
              padding: 6px 8px;
              background: linear-gradient(135deg, #fef3c7, #fef9e8);
              border-radius: 6px;
              border: 1px solid #fde68a;

              .overcommit-title {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
                color: #92400e;
                font-weight: 600;
                margin-bottom: 4px;
              }

              .overcommit-tags {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;

                .el-tag {
                  background: #ffffff;
                  border-color: #fbbf24;
                  color: #92400e;
                  height: 18px;
                  line-height: 16px;
                  font-size: 10px;
                }
              }
            }
          }

          .card-footer {
            padding: 10px 12px;
            background: linear-gradient(to bottom, #fafbfc, #f9fafb);
            border-top: 1px solid #f5f5f5;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .update-time {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              color: #6b7280;

              svg {
                color: #9ca3af;
              }
            }

            .status-badge {
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;

              &.active {
                background: #10b98115;
                color: #059669;

                .status-dot {
                  width: 5px;
                  height: 5px;
                  border-radius: 50%;
                  background: #10b981;
                  animation: pulse 2s infinite;
                }
              }

              &.inactive {
                background: #ef444415;
                color: #dc2626;

                .status-dot {
                  width: 5px;
                  height: 5px;
                  border-radius: 50%;
                  background: #ef4444;
                }
              }
            }
          }
        }
      }

      .list-view {
        .resource-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .resource-text {
            font-size: 12px;
            color: var(--el-text-color-regular);
          }
        }
      }
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
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
</style>
