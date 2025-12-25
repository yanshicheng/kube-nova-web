<template>
  <div class="repositories-management">
    <!-- 面包屑式选择器 -->
    <div class="breadcrumb-selector">
      <div class="breadcrumb-content">
        <!-- 集群选择 -->
        <div class="breadcrumb-item">
          <span class="breadcrumb-label">
            <Server :size="14" />
            集群
          </span>
          <ElSelect
            v-model="selectedClusterUuid"
            placeholder="选择集群"
            clearable
            size="default"
            :disabled="!selectedProject"
            :loading="loadingClusters"
            @change="handleClusterChange"
            @clear="handleClusterClear"
            class="breadcrumb-select"
          >
            <ElOption
              v-for="cluster in clusters"
              :key="cluster.id"
              :label="cluster.clusterName"
              :value="cluster.clusterUuid"
            >
              <div class="cluster-option">
                <span class="option-name">{{ cluster.clusterName }}</span>
                <span class="option-meta">
                  CPU {{ cluster.cpuCapacity }}核 · 内存 {{ cluster.memCapacity }}GB
                </span>
              </div>
            </ElOption>
          </ElSelect>
        </div>

        <div class="breadcrumb-separator">
          <ChevronRight :size="16" />
        </div>

        <!-- 镜像仓库选择 -->
        <div class="breadcrumb-item">
          <span class="breadcrumb-label">
            <Database :size="14" />
            镜像仓库
          </span>
          <ElSelect
            v-model="selectedRegistryUuid"
            placeholder="选择镜像仓库"
            clearable
            size="default"
            :disabled="!selectedClusterUuid"
            :loading="loadingRegistries"
            @change="handleRegistryChange"
            @clear="handleRegistryClear"
            class="breadcrumb-select"
          >
            <ElOption
              v-for="registry in registries"
              :key="registry.uuid"
              :label="registry.name"
              :value="registry.uuid"
            >
              <div class="registry-option">
                <span class="option-name">{{ registry.name }}</span>
                <ElTag :type="getRegistryTypeTag(registry.type)" size="small">
                  {{ registry.type }}
                </ElTag>
              </div>
            </ElOption>
          </ElSelect>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="breadcrumb-actions">
        <ElTooltip content="刷新数据" placement="bottom">
          <ElButton
            :icon="RefreshCw"
            circle
            size="default"
            :disabled="!selectedRegistryUuid"
            :loading="loadingProjects || loadingImages"
            @click="handleRefresh"
          />
        </ElTooltip>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="main-container">
      <ElCard v-if="selectedRegistryUuid" class="content-card">
        <!-- 搜索和筛选 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <!-- 视图切换 -->
            <ElRadioGroup v-model="viewMode" size="default" @change="handleViewModeChange">
              <ElRadioButton value="projects">项目列表</ElRadioButton>
              <ElRadioButton value="images">镜像搜索</ElRadioButton>
            </ElRadioGroup>

            <!-- 项目搜索 -->
            <ElInput
              v-if="viewMode === 'projects'"
              v-model="searchKeyword"
              placeholder="搜索项目名称..."
              :prefix-icon="Search"
              clearable
              size="default"
              style="width: 300px"
              @input="handleSearch"
            />

            <!-- 镜像搜索 -->
            <ElInput
              v-if="viewMode === 'images'"
              v-model="imageSearchKeyword"
              placeholder="搜索镜像名称..."
              :prefix-icon="Search"
              clearable
              size="default"
              style="width: 300px"
              @keyup.enter="handleImageSearch"
            >
              <template #append>
                <ElButton :icon="Search" @click="handleImageSearch" />
              </template>
            </ElInput>

            <!-- 项目类型筛选 -->
            <ElSelect
              v-if="viewMode === 'projects'"
              v-model="filterPublic"
              placeholder="项目类型"
              clearable
              size="default"
              style="width: 150px"
              @change="loadProjects"
            >
              <ElOption label="全部" value="" />
              <ElOption label="公开项目" :value="true" />
              <ElOption label="私有项目" :value="false" />
            </ElSelect>
          </div>
          <div class="toolbar-right">
            <span class="total-count">
              共 {{ viewMode === 'projects' ? totalProjects : totalImages }} 个{{
                viewMode === 'projects' ? '项目' : '镜像'
              }}
            </span>
          </div>
        </div>

        <!-- 项目列表 -->
        <div v-if="viewMode === 'projects'" v-loading="loadingProjects" class="projects-container">
          <div v-if="projects.length > 0" class="projects-grid">
            <div
              v-for="project in projects"
              :key="project.projectId"
              class="project-card"
              @click="handleProjectClick(project)"
            >
              <div class="project-header">
                <div class="project-title">
                  <FolderOpen :size="20" class="project-icon" />
                  <span class="project-name">{{ project.name }}</span>
                </div>
                <ElTag :type="project.isPublic ? 'success' : 'info'" size="small">
                  {{ project.isPublic ? '公开' : '私有' }}
                </ElTag>
              </div>
              <div class="project-content">
                <div class="project-stats">
                  <div class="stat-item">
                    <Package :size="16" />
                    <span>{{ project.repoCount }} 个仓库</span>
                  </div>
                  <div class="stat-item">
                    <User :size="16" />
                    <span>{{ project.ownerName || '系统' }}</span>
                  </div>
                </div>
                <!-- 配额信息 -->
                <div
                  v-if="project.storageLimitDisplay || project.storageUsedDisplay"
                  class="project-quota"
                >
                  <div class="quota-item">
                    <Database :size="14" />
                    <span class="quota-label">配额限制:</span>
                    <span class="quota-value">{{ project.storageLimitDisplay || '-' }}</span>
                  </div>
                  <div class="quota-item">
                    <HardDrive :size="14" />
                    <span class="quota-label">已用配额:</span>
                    <span class="quota-value">{{ project.storageUsedDisplay || '-' }}</span>
                  </div>
                </div>
                <div class="project-time">
                  <Clock :size="14" />
                  <span>{{ formatTime(project.updateTime) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <ElEmpty v-else description="暂无项目数据">
            <template #image>
              <FolderOpen :size="100" :stroke-width="1" style="color: #c0c4cc" />
            </template>
          </ElEmpty>
        </div>

        <!-- 镜像搜索结果 -->
        <div v-if="viewMode === 'images'" v-loading="loadingImages" class="images-container">
          <div v-if="imageSearchResults.length > 0" class="images-grid">
            <div v-for="(image, index) in imageSearchResults" :key="index" class="image-card">
              <div class="image-header">
                <div class="image-title">
                  <Box :size="20" class="image-icon" />
                  <span class="image-name">{{ image.repoName }}</span>
                </div>
              </div>
              <div class="image-content">
                <div class="image-tags">
                  <span class="tags-label">镜像标签 (点击复制完整地址):</span>
                  <div class="tags-list">
                    <ElTag
                      v-for="tag in image.tags"
                      :key="tag"
                      size="small"
                      type="info"
                      class="tag-clickable"
                      @click="handleCopyImageUrl(image.repoName, tag)"
                    >
                      <Copy :size="12" style="margin-right: 4px" />
                      {{ tag }}
                    </ElTag>
                  </div>
                </div>
                <div class="image-stats">
                  <div class="stat-item">
                    <Package :size="16" />
                    <span>{{ image.artifactCount }} 个制品</span>
                  </div>
                  <div class="stat-item">
                    <Download :size="16" />
                    <span>{{ image.pullCount }} 次拉取</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <ElEmpty v-else-if="!loadingImages && imageSearchKeyword" description="未找到匹配的镜像">
            <template #image>
              <Box :size="100" :stroke-width="1" style="color: #c0c4cc" />
            </template>
          </ElEmpty>

          <ElEmpty v-else description="请输入镜像名称进行搜索">
            <template #image>
              <Search :size="100" :stroke-width="1" style="color: #c0c4cc" />
            </template>
          </ElEmpty>
        </div>

        <!-- 分页 -->
        <div v-if="shouldShowPagination" class="pagination-container">
          <ElPagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 48, 96]"
            :total="viewMode === 'projects' ? totalProjects : totalImages"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </ElCard>

      <!-- 未选择仓库的空状态 -->
      <div v-else class="empty-container">
        <ElEmpty description="请先选择集群和镜像仓库">
          <template #image>
            <Database :size="100" :stroke-width="1" style="color: #c0c4cc" />
          </template>
          <p class="empty-hint">选择集群后，系统会自动加载该集群绑定的镜像仓库</p>
        </ElEmpty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import {
    Server,
    Database,
    ChevronRight,
    RefreshCw,
    FolderOpen,
    Package,
    User,
    Clock,
    Search,
    Box,
    Download,
    HardDrive,
    Copy
  } from 'lucide-vue-next'
  import type {
    RegistryProject,
    ContainerRegistry,
    ListProjectsByAppParams,
    ImageSearchResult,
    SearchImagesInRegistryByProjectParams
  } from '@/api'
  import {
    listClusterRegistriesApi,
    listProjectsByAppApi,
    searchImagesInRegistryByProjectApi
  } from '@/api'
  import { searchProjectClusterApi } from '@/api'
  import { useProjectStore } from '@/store/modules/project'
  import dayjs from 'dayjs'

  const router = useRouter()
  const projectStore = useProjectStore()

  // ========== 从 Store 获取当前项目 ==========
  const selectedProject = computed(() => projectStore.selectedProject)

  // ========== 状态管理 ==========
  const selectedClusterUuid = ref<string>('')
  const selectedRegistryUuid = ref<string>('')
  const clusters = ref<any[]>([])
  const registries = ref<ContainerRegistry[]>([])
  const projects = ref<RegistryProject[]>([])

  const loadingClusters = ref(false)
  const loadingRegistries = ref(false)
  const loadingProjects = ref(false)

  // 视图模式
  const viewMode = ref<'projects' | 'images'>('projects')

  // 项目搜索和筛选
  const searchKeyword = ref('')
  const filterPublic = ref<boolean | ''>('')
  const currentPage = ref(1)
  const pageSize = ref(12)
  const totalProjects = ref(0)

  // 镜像搜索
  const imageSearchKeyword = ref('')
  const imageSearchResults = ref<ImageSearchResult[]>([])
  const loadingImages = ref(false)
  const totalImages = ref(0)

  // ========== 计算属性 ==========
  const shouldShowPagination = computed(() => {
    if (viewMode.value === 'projects') {
      return totalProjects.value > pageSize.value
    } else {
      return totalImages.value > pageSize.value
    }
  })

  // 获取当前选中的镜像仓库
  const currentRegistry = computed(() => {
    return registries.value.find((r) => r.uuid === selectedRegistryUuid.value)
  })

  // ========== 监听项目变化 ==========
  watch(selectedProject, async (newProject, oldProject) => {
    if (newProject?.id !== oldProject?.id) {
      // 项目变化时，重置所有选择
      selectedClusterUuid.value = ''
      selectedRegistryUuid.value = ''
      clusters.value = []
      registries.value = []
      projects.value = []
      imageSearchResults.value = []
      viewMode.value = 'projects'

      if (newProject) {
        await loadClusters()
      }
    }
  })

  // ========== 生命周期 ==========
  onMounted(async () => {
    await projectStore.ensureInitialized()

    if (selectedProject.value) {
      await loadClusters()
    }
  })

  // ========== 加载数据 ==========
  /**
   * 通过项目加载集群列表
   */
  const loadClusters = async () => {
    if (!selectedProject.value) {
      console.warn('无法加载集群: 未选择项目')
      clusters.value = []
      return
    }

    try {
      loadingClusters.value = true
      const response = await searchProjectClusterApi({
        projectId: selectedProject.value.id
      })
      clusters.value = response || []
    } catch (error: any) {
      console.error('加载集群列表失败:', error)
      clusters.value = []
    } finally {
      loadingClusters.value = false
    }
  }

  /**
   * 加载集群绑定的镜像仓库
   */
  const loadRegistries = async (clusterUuid: string) => {
    try {
      loadingRegistries.value = true
      const res = await listClusterRegistriesApi({
        clusterUuid
      })

      // 直接使用res.data，它是RegistryCluster[]数组
      const registryClusters = res.data || []

      // 从RegistryCluster中提取registry对象
      registries.value = registryClusters
        .map((item) => item.registry)
        .filter((registry): registry is ContainerRegistry => !!registry)


      // 如果只有一个仓库，自动选中
      if (registries.value.length === 1) {
        selectedRegistryUuid.value = registries.value[0].uuid
        await loadProjects()
      }
    } catch (error: any) {
      console.error('加载镜像仓库失败:', error)
      registries.value = []
    } finally {
      loadingRegistries.value = false
    }
  }

  /**
   * 加载镜像仓库项目列表（通过应用项目视角）
   */
  const loadProjects = async () => {
    if (!selectedProject.value || !selectedClusterUuid.value || !selectedRegistryUuid.value) {
      console.warn('加载项目列表失败: 缺少必要参数', {
        hasProject: !!selectedProject.value,
        hasCluster: !!selectedClusterUuid.value,
        hasRegistry: !!selectedRegistryUuid.value
      })
      return
    }

    try {
      loadingProjects.value = true
      const params: ListProjectsByAppParams = {
        appProjectId: selectedProject.value.id,
        clusterUuid: selectedClusterUuid.value,
        registryUuid: selectedRegistryUuid.value,
        page: currentPage.value,
        pageSize: pageSize.value,
        sortBy: 'update_time',
        sortDesc: true
      }

      // 添加搜索关键词
      if (searchKeyword.value) {
        params.search = searchKeyword.value
      }

      const res = await listProjectsByAppApi(params)

      // 根据公开/私有筛选
      let filteredProjects = res.items || []
      if (filterPublic.value !== '') {
        filteredProjects = filteredProjects.filter((p) => p.isPublic === filterPublic.value)
      }

      projects.value = filteredProjects
      totalProjects.value = res.total || 0
    } catch (error: any) {
      console.error('加载项目列表失败:', error)
      projects.value = []
      totalProjects.value = 0
    } finally {
      loadingProjects.value = false
    }
  }

  /**
   * 搜索镜像（项目视角）
   */
  const searchImages = async () => {
    if (!selectedProject.value || !selectedClusterUuid.value || !selectedRegistryUuid.value) {
      console.warn('搜索镜像失败: 缺少必要参数')
      return
    }

    if (!imageSearchKeyword.value.trim()) {
      imageSearchResults.value = []
      totalImages.value = 0
      return
    }

    try {
      loadingImages.value = true
      const params: SearchImagesInRegistryByProjectParams = {
        appProjectId: selectedProject.value.id,
        clusterUuid: selectedClusterUuid.value,
        registryUuid: selectedRegistryUuid.value,
        imageName: imageSearchKeyword.value.trim(),
        page: currentPage.value,
        pageSize: pageSize.value
      }

      const res = await searchImagesInRegistryByProjectApi(params)

      imageSearchResults.value = res.data || []
      totalImages.value = res.total || 0
    } catch (error: any) {
      console.error('搜索镜像失败:', error)
      imageSearchResults.value = []
      totalImages.value = 0
    } finally {
      loadingImages.value = false
    }
  }

  // ========== 事件处理 ==========
  /**
   * 集群切换
   */
  const handleClusterChange = (clusterUuid: string) => {
    selectedRegistryUuid.value = ''
    registries.value = []
    projects.value = []
    imageSearchResults.value = []

    if (clusterUuid) {
      loadRegistries(clusterUuid)
    }
  }

  /**
   * 集群清空
   */
  const handleClusterClear = () => {
    selectedClusterUuid.value = ''
    selectedRegistryUuid.value = ''
    registries.value = []
    projects.value = []
    imageSearchResults.value = []
  }

  /**
   * 镜像仓库切换
   */
  const handleRegistryChange = () => {
    currentPage.value = 1
    imageSearchResults.value = []
    imageSearchKeyword.value = ''
    viewMode.value = 'projects'
    loadProjects()
  }

  /**
   * 镜像仓库清空
   */
  const handleRegistryClear = () => {
    selectedRegistryUuid.value = ''
    projects.value = []
    imageSearchResults.value = []
  }

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    if (viewMode.value === 'projects') {
      loadProjects()
    } else {
      searchImages()
    }
  }

  /**
   * 项目搜索
   */
  const handleSearch = () => {
    currentPage.value = 1
    loadProjects()
  }

  /**
   * 镜像搜索
   */
  const handleImageSearch = () => {
    currentPage.value = 1
    searchImages()
  }

  /**
   * 视图模式切换
   */
  const handleViewModeChange = (mode: 'projects' | 'images') => {
    currentPage.value = 1
    if (mode === 'projects') {
      loadProjects()
    } else {
      imageSearchResults.value = []
      totalImages.value = 0
    }
  }

  /**
   * 分页大小改变
   */
  const handleSizeChange = () => {
    currentPage.value = 1
    if (viewMode.value === 'projects') {
      loadProjects()
    } else {
      searchImages()
    }
  }

  /**
   * 页码改变
   */
  const handlePageChange = () => {
    if (viewMode.value === 'projects') {
      loadProjects()
    } else {
      searchImages()
    }
  }

  /**
   * 项目卡片点击 - 跳转到制品页面
   */
  const handleProjectClick = (project: RegistryProject) => {
    if (!currentRegistry.value) {
      return
    }
    router.push({
      name: 'RegistryArtifacts',
      params: {
        registryUuid: selectedRegistryUuid.value,
        projectName: project.name
      },
      query: {
        registryUrl: currentRegistry.value.url,
        registryName: currentRegistry.value.name,
        publicDelete: project.isPublic ? 'false' : 'true'
      }
    })
  }

  /**
   * 复制镜像地址
   */
  const handleCopyImageUrl = async (repoName: string, tag: string) => {
    if (!currentRegistry.value) {
      return
    }

    // 获取镜像仓库URL，去除末尾的斜杠
    let registryUrl = currentRegistry.value.url.replace(/\/$/, '')

    // 构建完整的镜像地址：registryUrl/repoName:tag
    const imageUrl = `${registryUrl}/${repoName}:${tag}`

    try {
      await navigator.clipboard.writeText(imageUrl)
      ElMessage.success({
        message: `已复制: ${imageUrl}`,
        duration: 2000
      })
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  // ========== 工具方法 ==========
  /**
   * 获取仓库类型标签类型
   */
  const getRegistryTypeTag = (type: string) => {
    const tagMap: Record<string, string> = {
      harbor: 'primary',
      'docker-registry': 'success',
      nexus: 'warning'
    }
    return tagMap[type] || 'info'
  }

  /**
   * 格式化时间
   */
  const formatTime = (timestamp: number) => {
    if (!timestamp) return '-'
    return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
  }
</script>

<style scoped lang="scss">
  .repositories-management {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #f5f7fa;

    .breadcrumb-selector {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

      .breadcrumb-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        overflow-x: auto;

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;

          .breadcrumb-label {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #606266;
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
          }

          .breadcrumb-select {
            min-width: 180px;
            max-width: 280px;

            :deep(.el-input__wrapper) {
              box-shadow: 0 0 0 1px #dcdfe6 inset;
              transition: all 0.2s;

              &:hover {
                box-shadow: 0 0 0 1px #c0c4cc inset;
              }
            }

            :deep(.el-input__inner) {
              font-size: 13px;
              font-weight: 500;
            }
          }
        }

        .breadcrumb-separator {
          color: #c0c4cc;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
      }

      .breadcrumb-actions {
        flex-shrink: 0;
        display: flex;
        gap: 8px;
      }
    }

    .cluster-option,
    .registry-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 8px;

      .option-name {
        font-weight: 500;
        color: #303133;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .option-meta {
        font-size: 12px;
        color: #909399;
        flex-shrink: 0;
      }
    }

    .main-container {
      flex: 1;
      overflow: hidden;

      .content-card {
        height: 100%;
        display: flex;
        flex-direction: column;

        :deep(.el-card__body) {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e4e7ed;

          .toolbar-left {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
          }

          .toolbar-right {
            .total-count {
              font-size: 14px;
              color: #606266;
              font-weight: 500;
            }
          }
        }

        .projects-container,
        .images-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 2px; // 给hover效果留出空间

          .projects-grid,
          .images-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px; // 增加间距，避免hover时重叠
            padding: 4px; // 额外的内边距

            .project-card,
            .image-card {
              background: #fafbfc;
              border: 1px solid #e4e7ed;
              border-radius: 8px;
              padding: 16px;
              transition: all 0.2s;
              position: relative;
              z-index: 1;

              &:hover {
                border-color: #409eff;
                box-shadow: 0 4px 20px rgba(64, 158, 255, 0.2);
                transform: translateY(-4px) scale(1.02);
                z-index: 100;

                .project-name,
                .image-name {
                  color: #409eff;
                }
              }

              .project-header,
              .image-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;

                .project-title,
                .image-title {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  flex: 1;
                  min-width: 0;

                  .project-icon,
                  .image-icon {
                    color: #409eff;
                    flex-shrink: 0;
                  }

                  .project-name,
                  .image-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #303133;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    transition: color 0.2s;
                  }
                }
              }

              .project-content,
              .image-content {
                .project-stats,
                .image-stats {
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                  margin-bottom: 12px;

                  .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #606266;

                    svg {
                      color: #909399;
                      flex-shrink: 0;
                    }
                  }
                }

                .project-quota {
                  display: flex;
                  flex-direction: column;
                  gap: 6px;
                  margin-bottom: 12px;
                  padding: 8px;
                  background: #f0f9ff;
                  border-radius: 4px;
                  border: 1px solid #b3e0ff;

                  .quota-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;

                    svg {
                      color: #409eff;
                      flex-shrink: 0;
                    }

                    .quota-label {
                      color: #606266;
                    }

                    .quota-value {
                      color: #409eff;
                      font-weight: 600;
                    }
                  }
                }

                .image-tags {
                  margin-bottom: 12px;

                  .tags-label {
                    font-size: 12px;
                    color: #909399;
                    margin-bottom: 6px;
                    display: block;
                  }

                  .tags-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                  }
                }

                .project-time {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  font-size: 12px;
                  color: #909399;
                  padding-top: 8px;
                  border-top: 1px solid #e4e7ed;

                  svg {
                    flex-shrink: 0;
                  }
                }
              }
            }

            .project-card {
              cursor: pointer;
            }

            .image-card {
              &:hover {
                border-color: #67c23a;
                box-shadow: 0 4px 20px rgba(103, 194, 58, 0.2);
                z-index: 100;

                .image-name {
                  color: #67c23a;
                }
              }

              .image-tags {
                .tag-clickable {
                  cursor: pointer;
                  display: inline-flex;
                  align-items: center;
                  transition: all 0.2s;

                  &:hover {
                    background-color: #409eff;
                    color: white;
                    border-color: #409eff;
                    transform: scale(1.05);
                  }

                  &:active {
                    transform: scale(0.98);
                  }
                }
              }
            }
          }
        }

        .pagination-container {
          display: flex;
          justify-content: center;
          padding-top: 20px;
          margin-top: 20px;
          border-top: 1px solid #e4e7ed;
        }
      }

      .empty-container {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

        .empty-hint {
          margin-top: 12px;
          font-size: 13px;
          color: #909399;
        }
      }
    }
  }

  @media (max-width: 1400px) {
    .breadcrumb-selector {
      .breadcrumb-content {
        .breadcrumb-item {
          .breadcrumb-select {
            min-width: 150px;
            max-width: 220px;
          }
        }
      }
    }
  }
</style>
