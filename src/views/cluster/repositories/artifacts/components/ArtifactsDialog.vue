<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="`制品列表 - ${repository?.name}`"
    width="80%"
    :close-on-click-modal="false"
    destroy-on-close
    @open="handleDialogOpen"
  >
    <div class="artifacts-dialog">
      <!-- 只读模式提示 -->
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

      <!-- 搜索栏 -->
      <div class="toolbar">
        <ElInput
          v-model="searchParams.search"
          placeholder="搜索制品..."
          :prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 300px"
        />

        <ElButton :icon="RefreshCw" @click="fetchArtifacts" :loading="loading"> 刷新 </ElButton>
      </div>

      <!-- 制品列表 -->
      <ElTable
        :data="artifacts"
        v-loading="loading"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <ElTableColumn label="标签" min-width="250">
          <template #default="{ row }">
            <div class="tags-cell">
              <div v-for="tag in row.tags" :key="tag.id" class="custom-tag">
                <div class="tag-icon">
                  <Tag :size="14" />
                </div>
                <span class="tag-text">{{ tag.name }}</span>
                <div v-if="tag.immutable || tag.signed" class="tag-badges">
                  <span v-if="tag.immutable" class="badge immutable" title="不可变">
                    <Lock :size="10" />
                  </span>
                  <span v-if="tag.signed" class="badge signed" title="已签名">
                    <ShieldCheck :size="10" />
                  </span>
                </div>
              </div>
              <span v-if="row.tags.length === 0" class="no-tags">
                <Tag :size="14" style="opacity: 0.3" />
                无标签
              </span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="类型" width="120">
          <template #default="{ row }">
            <ElTag size="small" type="info">
              {{ row.type }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="摘要" min-width="300">
          <template #default="{ row }">
            <div class="digest-cell">
              <code>{{ row.digest }}</code>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="大小" width="120" sortable="custom" prop="size">
          <template #default="{ row }">
            {{ formatSize(row.size) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="推送时间" width="180" sortable="custom" prop="pushTime">
          <template #default="{ row }">
            {{ formatDateTime(row.pushTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="拉取时间" width="180" sortable="custom" prop="pullTime">
          <template #default="{ row }">
            {{ row.pullTime ? formatDateTime(row.pullTime) : '-' }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <div class="status-cell">
              <ElTag v-if="row.immutable" type="warning" size="small">
                <Lock :size="12" />
                不可变
              </ElTag>
              <ElTag v-if="row.signed" type="success" size="small">
                <Shield :size="12" />
                已签名
              </ElTag>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <ElSpace :size="4">
              <ElButton
                type="primary"
                size="small"
                :icon="Copy"
                @click="handleCopyPullCommand(row)"
              >
                复制
              </ElButton>
              <!-- 只有在允许删除时才显示删除按钮 -->
              <ElButton
                v-if="publicDelete"
                type="danger"
                size="small"
                :icon="Trash2"
                @click="handleDelete(row)"
                :disabled="row.immutable"
              >
                删除
              </ElButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div v-if="artifacts.length > 0" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <!-- 空状态 -->
      <ElEmpty v-if="artifacts.length === 0 && !loading" description="暂无制品" />
    </div>

    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed, nextTick } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Search, RefreshCw, Tag, Lock, Shield, Copy, Trash2, ShieldCheck } from 'lucide-vue-next'
  import { listArtifactsApi, deleteArtifactApi, type Repository, type Artifact } from '@/api'

  interface Props {
    modelValue: boolean
    registryUuid: string
    registryUrl: string
    projectName: string
    repository?: Repository
    publicDelete?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    publicDelete: true
  })
  const emit = defineEmits<Emits>()

  const loading = ref(false)
  const artifacts = ref<Artifact[]>([])
  const total = ref(0)

  const searchParams = reactive({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: 'pushTime',
    sortDesc: true
  })

  // 从 registryUrl 中提取 host（去除协议）
  const registryHost = computed(() => {
    if (!props.registryUrl) {
      console.warn('registryUrl is empty!')
      return ''
    }
    return props.registryUrl.replace(/^https?:\/\//, '')
  })

  // 对话框打开时的处理
  const handleDialogOpen = () => {
    console.log('对话框打开，准备加载制品列表', {
      registryUuid: props.registryUuid,
      registryUrl: props.registryUrl,
      projectName: props.projectName,
      repositoryName: props.repository?.name
    })

    // 使用 nextTick 确保所有 props 都已正确设置
    nextTick(() => {
      fetchArtifacts()
    })
  }

  // 获取制品列表
  const fetchArtifacts = async () => {
    if (!props.repository) {
      console.warn('repository 未定义，无法加载制品')
      return
    }

    // 验证 registryUrl
    if (!props.registryUrl) {
      ElMessage.error('缺少仓库地址信息，请从镜像仓库列表重新进入')
      console.error('registryUrl 缺失')
      return
    }

    loading.value = true
    console.log('开始获取制品列表', {
      registryUuid: props.registryUuid,
      projectName: props.projectName,
      repoName: props.repository.name,
      searchParams: { ...searchParams }
    })

    try {
      const response = await listArtifactsApi({
        registryUuid: props.registryUuid,
        projectName: props.projectName,
        repoName: props.repository.name,
        search: searchParams.search || undefined,
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        sortBy: searchParams.sortBy,
        sortDesc: searchParams.sortDesc
      })

      artifacts.value = response.items || []
      total.value = response.total || 0

      console.log('制品列表获取成功', {
        count: artifacts.value.length,
        total: total.value
      })
    } catch (error) {
      console.error('获取制品列表失败:', error)
      ElMessage.error('获取制品列表失败')
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const handleSearch = () => {
    searchParams.page = 1
    fetchArtifacts()
  }

  // 排序
  const handleSortChange = ({ prop, order }: any) => {
    if (prop) {
      searchParams.sortBy = prop
      searchParams.sortDesc = order === 'descending'
      fetchArtifacts()
    }
  }

  // 分页
  const handleSizeChange = () => {
    searchParams.page = 1
    fetchArtifacts()
  }

  const handlePageChange = () => {
    fetchArtifacts()
  }

  // 复制拉取命令
  const handleCopyPullCommand = async (artifact: Artifact) => {
    if (!props.repository) return

    if (!props.registryUrl || !registryHost.value) {
      ElMessage.error('缺少仓库地址信息，无法生成拉取命令')
      return
    }

    const tag =
      artifact.tags.length > 0
        ? artifact.tags[0].name
        : artifact.digest.substring(
            artifact.digest.indexOf(':') + 1,
            artifact.digest.indexOf(':') + 13
          )

    const pullCommand = `${registryHost.value}/${props.projectName}/${props.repository.name}:${tag}`

    try {
      await navigator.clipboard.writeText(pullCommand)
      ElMessage.success('拉取命令已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      ElMessage.error('复制失败')
    }
  }

  // 删除制品
  const handleDelete = async (artifact: Artifact) => {
    if (!props.repository) return

    if (!props.publicDelete) {
      ElMessage.warning('当前为只读模式，无法执行删除操作')
      return
    }

    try {
      await ElMessageBox.confirm('确定要删除此制品吗？此操作不可恢复。', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      await deleteArtifactApi(
        artifact.digest,
        props.registryUuid,
        props.projectName,
        props.repository.name
      )

      ElMessage.success('删除成功')
      fetchArtifacts()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除制品失败:', error)
        ElMessage.error('删除制品失败')
      }
    }
  }

  // 格式化大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  // 监听对话框状态变化
  watch(
    () => props.modelValue,
    (val) => {
      if (!val) {
        // 关闭时重置搜索条件
        searchParams.page = 1
        searchParams.search = ''
        artifacts.value = []
        total.value = 0
      }
    }
  )
</script>

<style lang="scss" scoped>
  .artifacts-dialog {
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .tags-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;

      .custom-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 6px;
        color: #ffffff;
        font-size: 13px;
        font-weight: 500;
        font-family: 'Monaco', 'Consolas', monospace;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
        transition: all 0.3s ease;
        position: relative;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }

        .tag-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
        }

        .tag-text {
          line-height: 1;
          letter-spacing: 0.3px;
        }

        .tag-badges {
          display: flex;
          gap: 4px;
          margin-left: 4px;

          .badge {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);

            &.immutable {
              background: rgba(230, 162, 60, 0.3);
            }

            &.signed {
              background: rgba(103, 194, 58, 0.3);
            }
          }
        }
      }

      .no-tags {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--el-text-color-placeholder);
        font-style: italic;
      }
    }

    .digest-cell {
      code {
        font-size: 12px;
        font-family: 'Monaco', 'Consolas', monospace;
        color: var(--el-text-color-secondary);
        word-break: break-all;
      }
    }

    .status-cell {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;

      :deep(.el-tag) {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
</style>
