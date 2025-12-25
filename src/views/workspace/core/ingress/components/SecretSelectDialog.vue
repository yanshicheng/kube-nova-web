<template>
  <ElDialog v-model="visible" title="选择 TLS Secret" width="900px" @closed="handleClosed">
    <!-- 搜索 -->
    <div class="search-bar">
      <ElInput
        v-model="searchKeyword"
        placeholder="搜索 Secret 名称"
        clearable
        style="width: 300px"
        @input="handleSearch"
      >
        <template #prefix>
          <Search :size="16" />
        </template>
      </ElInput>
    </div>

    <ElSkeleton v-if="loading" :rows="6" animated />

    <template v-else>
      <div v-if="secrets.length === 0" class="empty-state">
        <ElEmpty description="暂无 TLS Secret">
          <template #description>
            <div>暂无 TLS 类型的 Secret</div>
            <div style="font-size: 12px; color: #909399; margin-top: 4px">
              请先创建 kubernetes.io/tls 类型的 Secret
            </div>
          </template>
        </ElEmpty>
      </div>

      <div v-else class="secret-list">
        <div
          v-for="secret in secrets"
          :key="secret.name"
          class="secret-item"
          @click="handleSelect(secret)"
        >
          <div class="secret-header">
            <div class="secret-info">
              <Key :size="18" class="secret-icon" />
              <span class="secret-name">{{ secret.name }}</span>
            </div>
            <ElTag type="success" size="small">{{ secret.type }}</ElTag>
          </div>

          <div class="secret-details">
            <div class="detail-row">
              <span class="label">命名空间:</span>
              <span class="value">{{ secret.namespace }}</span>
            </div>
            <div class="detail-row">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatTimestamp(secret.creationTimestamp) }}</span>
            </div>
            <div v-if="secret.dataCount" class="detail-row">
              <span class="label">数据项:</span>
              <span class="value">{{ secret.dataCount }} 个</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <ElPagination
        v-if="total > 0"
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: center"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </template>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Key, Search } from 'lucide-vue-next'
  import { getSecretListApi, type ProjectWorkspace } from '@/api'

  interface Props {
    modelValue: boolean
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'select'])

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const loading = ref(false)
  const secrets = ref<any[]>([])
  const searchKeyword = ref('')
  const total = ref(0)
  const isFirstLoad = ref(true) // 标记是否首次加载

  const pagination = ref({
    current: 1,
    size: 20
  })

  // 只在对话框首次打开时加载
  watch(visible, (val) => {
    if (val && isFirstLoad.value) {
      isFirstLoad.value = false
      loadSecrets()
    }
  })

  const loadSecrets = async () => {
    if (!props.workspace || loading.value) {
      return
    }

    loading.value = true
    try {
      const params = {
        workloadId: props.workspace.id,
        search: searchKeyword.value || undefined,
        type: 'kubernetes.io/tls' // 只查询 TLS 类型
      }

      const response = await getSecretListApi(params)

      if (Array.isArray(response)) {
        secrets.value = response
        total.value = response.length
      } else {
        secrets.value = response?.items || []
        total.value = response?.total || 0
      }
    } catch (error) {
      console.error('加载 Secret 列表失败:', error)
      secrets.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  const handleSelect = (secret: any) => {
    emit('select', secret)
    visible.value = false
  }

  const handleSearch = () => {
    pagination.value.current = 1
    loadSecrets()
  }

  const handleSizeChange = () => {
    pagination.value.current = 1
    loadSecrets()
  }

  const handleCurrentChange = () => {
    loadSecrets()
  }

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const handleClosed = () => {
    // 对话框关闭时重置状态，下次打开时重新加载
    searchKeyword.value = ''
    pagination.value.current = 1
    secrets.value = []
    total.value = 0
    isFirstLoad.value = true
  }
</script>

<style lang="scss" scoped>
  .search-bar {
    margin-bottom: 20px;
  }

  .empty-state {
    padding: 40px 0;
    text-align: center;
  }

  .secret-list {
    max-height: 500px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }
  }

  .secret-item {
    padding: 16px;
    margin-bottom: 12px;
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #67c23a;
      box-shadow: 0 2px 8px rgba(103, 194, 58, 0.15);
    }

    .secret-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .secret-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .secret-icon {
          color: #67c23a;
        }

        .secret-name {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .secret-details {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .detail-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;

        .label {
          color: #606266;
          font-weight: 500;
          min-width: 80px;
        }

        .value {
          color: #303133;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
</style>
