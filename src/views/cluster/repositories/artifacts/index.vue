<template>
  <div class="artifacts-container">
    <!-- 调试信息 -->
    <ElAlert
      v-if="!publicDelete"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    >
      <template #title>只读模式</template>
      当前为只读模式，无法执行删除操作。
    </ElAlert>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <ElButton :icon="ArrowLeft" @click="handleBack" circle size="large" />
        <div class="header-info">
          <h1 class="page-title">
            <Package :size="28" />
            制品管理
          </h1>
          <ElBreadcrumb separator="/">
            <ElBreadcrumbItem>{{ registryName }}</ElBreadcrumbItem>
            <ElBreadcrumbItem>{{ projectName }}</ElBreadcrumbItem>
          </ElBreadcrumb>
        </div>
      </div>
      <div class="header-actions">
        <ElButton :icon="RefreshCw" @click="fetchRepositories">刷新</ElButton>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <ElCard class="filter-card" shadow="never">
      <div class="filter-wrapper">
        <div class="filter-left">
          <ElInput
            v-model="searchParams.search"
            placeholder="搜索仓库名称..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            style="width: 300px"
          />
        </div>

        <div class="filter-right">
          <ElRadioGroup v-model="viewMode" @change="handleViewChange">
            <ElRadioButton value="card">
              <LayoutGrid :size="16" />
              卡片
            </ElRadioButton>
            <ElRadioButton value="list">
              <List :size="16" />
              列表
            </ElRadioButton>
          </ElRadioGroup>
        </div>
      </div>
    </ElCard>

    <!-- 内容区域 -->
    <ElCard class="content-card" shadow="never" v-loading="loading">
      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card' && repositories.length > 0" class="card-grid">
        <div
          v-for="repo in repositories"
          :key="repo.id"
          class="repository-card"
          @click="handleViewArtifacts(repo)"
        >
          <div class="card-header">
            <div class="repo-icon">
              <Box :size="24" />
            </div>
            <div class="repo-info">
              <div class="repo-name">{{ repo.name }}</div>
              <div class="repo-desc">{{ repo.description || '暂无描述' }}</div>
            </div>
          </div>

          <div class="card-body">
            <div class="stat-row">
              <div class="stat-item">
                <Tag :size="14" />
                <span>{{ repo.artifactCount }} 个制品</span>
              </div>
              <div class="stat-item">
                <Download :size="14" />
                <span>{{ repo.pullCount }} 次拉取</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <Clock :size="12" />
              <span>{{ formatDateTime(repo.updateTime) }}</span>
            </div>
            <div class="footer-right">
              <ElButton
                type="primary"
                size="small"
                :icon="FolderOpen"
                @click.stop="handleViewArtifacts(repo)"
              >
                查看
              </ElButton>
              <!-- 只有在允许删除时才显示下拉菜单 -->
              <ElDropdown v-if="publicDelete" @command="handleCommand(repo, $event)" @click.stop>
                <ElButton size="small" :icon="MoreVertical" circle />
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="delete" :icon="Trash2">删除</ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <ElTable v-else-if="viewMode === 'list' && repositories.length > 0" :data="repositories">
        <ElTableColumn label="仓库名称" min-width="300">
          <template #default="{ row }">
            <div class="repo-name-cell" @click="handleViewArtifacts(row)">
              <div class="repo-icon">
                <Box :size="20" />
              </div>
              <div class="repo-info">
                <span class="repo-name">{{ row.name }}</span>
                <span class="repo-desc">{{ row.description || '暂无描述' }}</span>
              </div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="制品数量" width="120">
          <template #default="{ row }">
            <div class="count-cell">
              <Tag :size="14" />
              <span>{{ row.artifactCount }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="拉取次数" width="120">
          <template #default="{ row }">
            <div class="count-cell">
              <Download :size="14" />
              <span>{{ row.pullCount }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.creationTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.updateTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <ElSpace :size="4">
              <ElButton
                type="primary"
                size="small"
                :icon="FolderOpen"
                @click="handleViewArtifacts(row)"
              >
                查看
              </ElButton>
              <!-- 只有在允许删除时才显示下拉菜单 -->
              <ElDropdown v-if="publicDelete" @command="handleCommand(row, $event)">
                <ElButton size="small" :icon="MoreVertical" circle />
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="delete" :icon="Trash2">删除</ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 空状态 -->
      <ElEmpty v-else description="暂无仓库" :image-size="120" />

      <!-- 分页 -->
      <div v-if="repositories.length > 0" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.pageSize"
          :total="total"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </ElCard>

    <!-- 制品列表对话框 - 传递 registryUrl 和权限参数 -->
    <ArtifactsDialog
      v-model="artifactsDialogVisible"
      :registry-uuid="registryUuid"
      :registry-url="registryUrl"
      :project-name="projectName"
      :repository="currentRepository"
      :public-delete="publicDelete"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    ArrowLeft,
    Package,
    RefreshCw,
    Search,
    LayoutGrid,
    List,
    Box,
    Tag,
    Download,
    Clock,
    FolderOpen,
    MoreVertical,
    Trash2
  } from 'lucide-vue-next'
  import ArtifactsDialog from './components/ArtifactsDialog.vue'
  import { listRepositoriesApi, deleteRepositoryApi, type Repository } from '@/api'

  const router = useRouter()
  const route = useRoute()

  // 从路由获取参数
  const registryUuid = computed(() => route.params.registryUuid as string)
  const projectName = computed(() => route.params.projectName as string)
  const registryUrl = computed(() => {
    const url = (route.query.registryUrl as string) || ''
    // 去除末尾的斜杠
    return url.replace(/\/$/, '')
  })
  const registryName = computed(() => (route.query.registryName as string) || '')

  // 权限控制：是否允许删除操作（默认为 true）
  const publicDelete = computed(() => {
    const value = route.query.publicDelete
    // 如果没有传递该参数，默认为 true
    if (value === undefined || value === null || value === '') {
      return true
    }
    // 转换为布尔值
    return value === 'true' || value === true
  })

  // 来源路由信息（用于返回）
  const fromRoute = computed(() => (route.query.from as string) || '')

  // 视图模式
  const viewMode = ref<'card' | 'list'>('card')

  // 仓库列表
  const repositories = ref<Repository[]>([])
  const total = ref(0)
  const loading = ref(false)

  // 搜索参数
  const searchParams = reactive({
    page: 1,
    pageSize: 12,
    search: '',
    sortBy: 'updateTime',
    sortDesc: true
  })

  // 制品对话框
  const artifactsDialogVisible = ref(false)
  const currentRepository = ref<Repository>()

  // 获取仓库列表
  const fetchRepositories = async () => {
    loading.value = true
    try {
      const response = await listRepositoriesApi({
        registryUuid: registryUuid.value,
        projectName: projectName.value,
        search: searchParams.search || undefined,
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        sortBy: searchParams.sortBy,
        sortDesc: searchParams.sortDesc
      })

      repositories.value = response.items || []
      total.value = response.total || 0
    } catch (error) {
      console.error('获取仓库列表失败:', error)
      ElMessage.error('获取仓库列表失败')
    } finally {
      loading.value = false
    }
  }

  // 返回 - 智能返回到来源页面
  const handleBack = () => {
    console.log('返回逻辑:', { from: fromRoute.value, publicDelete: publicDelete.value })

    // 如果有明确的来源路由，返回到指定路由
    if (fromRoute.value) {
      if (fromRoute.value === 'RegistryProjects') {
        // 返回到项目管理页面
        router.push({
          name: 'RegistryProjects',
          params: {
            registryUuid: registryUuid.value
          },
          query: {
            registryUrl: registryUrl.value,
            registryName: registryName.value
          }
        })
      } else if (fromRoute.value === 'RepositoriesManagement') {
        // 返回到仓库管理页面（项目视角）
        router.push({
          name: 'RepositoriesManagement'
        })
      } else {
        // 其他情况，尝试返回到指定的路由名称
        router.push({ name: fromRoute.value })
      }
    } else {
      // 如果没有来源信息，使用浏览器返回
      router.back()
    }
  }

  // 搜索
  const handleSearch = () => {
    searchParams.page = 1
    fetchRepositories()
  }

  // 视图切换
  const handleViewChange = () => {
    localStorage.setItem('artifacts-view-mode', viewMode.value)
  }

  // 分页
  const handleSizeChange = () => {
    searchParams.page = 1
    fetchRepositories()
  }

  const handlePageChange = () => {
    fetchRepositories()
  }

  // 🔥 关键修复：查看制品 - 使用 nextTick 确保 repository 先更新
  const handleViewArtifacts = (repository: Repository) => {
    // 调试日志
    console.log('打开制品对话框，传递参数:', {
      registryUuid: registryUuid.value,
      registryUrl: registryUrl.value,
      projectName: projectName.value,
      repositoryName: repository.name,
      publicDelete: publicDelete.value
    })

    // 验证必需参数
    if (!registryUrl.value) {
      ElMessage.error('缺少仓库地址信息，无法查看制品详情。请从镜像仓库列表重新进入。')
      return
    }

    // 🔥 关键修复：先设置 repository，使用 nextTick 确保响应式更新完成后再打开对话框
    currentRepository.value = repository
    nextTick(() => {
      artifactsDialogVisible.value = true
    })
  }

  // 删除仓库（只有在允许删除时才会被调用）
  const handleDelete = async (repository: Repository) => {
    if (!publicDelete.value) {
      ElMessage.warning('当前为只读模式，无法执行删除操作')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除仓库 "${repository.name}" 吗？此操作将删除该仓库下的所有制品，且不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await deleteRepositoryApi(repository.name, registryUuid.value, projectName.value)

      ElMessage.success('删除成功')
      fetchRepositories()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除仓库失败:', error)
        ElMessage.error('删除仓库失败')
      }
    }
  }

  // 处理命令
  const handleCommand = (repository: Repository, command: string) => {
    if (command === 'delete') {
      handleDelete(repository)
    }
  }

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  // 初始化
  onMounted(() => {
    // 输出调试信息
    console.log('制品管理页面参数:', {
      registryUuid: registryUuid.value,
      projectName: projectName.value,
      registryUrl: registryUrl.value,
      registryName: registryName.value,
      publicDelete: publicDelete.value,
      from: fromRoute.value
    })

    // 验证必需的路由参数
    if (!registryUrl.value) {
      ElMessage.warning('缺少仓库地址信息，部分功能可能无法使用。请从镜像仓库列表重新进入。')
      console.error('Missing registryUrl in route query:', route.query)
    }

    if (!registryName.value) {
      console.warn('Missing registryName in route query:', route.query)
    }

    // 恢复视图模式
    const savedViewMode = localStorage.getItem('artifacts-view-mode')
    if (savedViewMode === 'list' || savedViewMode === 'card') {
      viewMode.value = savedViewMode
    }

    fetchRepositories()
  })
</script>

<style lang="scss" scoped>
  .artifacts-container {
    padding: 20px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;

      .header-left {
        display: flex;
        gap: 16px;
        align-items: flex-start;

        .header-info {
          .page-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 24px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin: 0 0 8px 0;
          }
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }
    }

    .filter-card {
      margin-bottom: 16px;

      .filter-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;

        .filter-left {
          flex: 1;
          display: flex;
          gap: 12px;
        }

        .filter-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }
      }
    }

    .content-card {
      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 16px;
        margin-bottom: 20px;

        .repository-card {
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: var(--el-color-primary);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          .card-header {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;

            .repo-icon {
              width: 48px;
              height: 48px;
              border-radius: 8px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              flex-shrink: 0;
            }

            .repo-info {
              flex: 1;
              min-width: 0;

              .repo-name {
                font-size: 16px;
                font-weight: 500;
                color: var(--el-text-color-primary);
                margin-bottom: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .repo-desc {
                font-size: 12px;
                color: var(--el-text-color-secondary);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }

          .card-body {
            margin-bottom: 16px;

            .stat-row {
              display: flex;
              gap: 20px;

              .stat-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                color: var(--el-text-color-secondary);
              }
            }
          }

          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 12px;
            border-top: 1px solid var(--el-border-color-lighter);

            .footer-left {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              color: var(--el-text-color-placeholder);
            }

            .footer-right {
              display: flex;
              gap: 8px;
            }
          }
        }
      }

      .repo-name-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;

        .repo-icon {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .repo-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;

          .repo-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-color-primary);
            transition: color 0.3s;

            &:hover {
              color: var(--el-color-primary-light-3);
            }
          }

          .repo-desc {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      .count-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }

      .pagination-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }
  }
</style>