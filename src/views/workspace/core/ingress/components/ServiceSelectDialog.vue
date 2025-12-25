<template>
  <ElDialog v-model="visible" title="选择 Service" width="900px" @closed="handleClosed">
    <!-- 搜索 -->
    <div class="search-bar">
      <ElInput
        v-model="searchKeyword"
        placeholder="搜索 Service 名称"
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
      <div v-if="services.length === 0" class="empty-state">
        <ElEmpty description="暂无 Service" />
      </div>

      <div v-else class="service-list">
        <div
          v-for="service in services"
          :key="service.name"
          class="service-item"
          @click="selectService(service)"
        >
          <div class="service-header">
            <div class="service-info">
              <Server :size="18" class="service-icon" />
              <span class="service-name">{{ service.name }}</span>
            </div>
            <ElTag type="info" size="small">{{ service.type }}</ElTag>
          </div>

          <div class="service-ports">
            <div class="ports-label">可用端口:</div>
            <div class="ports-list">
              <ElButton
                v-for="(port, idx) in getServicePorts(service)"
                :key="idx"
                size="small"
                plain
                @click.stop="handlePortSelect(service, port)"
              >
                {{ port.label }}
              </ElButton>
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
  import { Server, Search } from 'lucide-vue-next'
  import { getServiceListApi, type ProjectWorkspace } from '@/api'

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
  const services = ref<any[]>([])
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
      loadServices()
    }
  })

  const loadServices = async () => {
    if (!props.workspace || loading.value) {
      return
    }

    loading.value = true
    try {
      const params = {
        workloadId: props.workspace.id,
        search: searchKeyword.value || undefined
      }

      const response = await getServiceListApi(params)

      if (Array.isArray(response)) {
        services.value = response
        total.value = response.length
      } else {
        services.value = response?.items || []
        total.value = response?.total || 0
      }
    } catch (error) {
      console.error('加载 Service 列表失败:', error)
      services.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  // 解析 Service 端口
  const getServicePorts = (service: any) => {
    // 如果 service 有 ports 属性
    if (service.ports && typeof service.ports === 'string') {
      // 解析格式如 "80:30080/TCP,443:30443/TCP"
      return service.ports.split(',').map((portStr: string) => {
        const parts = portStr.trim().split(':')
        const port = parts[0].replace(/\/.*$/, '') // 移除协议部分
        return {
          port: parseInt(port),
          label: portStr.trim()
        }
      })
    }

    // 如果 service 有 ports 数组
    if (Array.isArray(service.ports)) {
      return service.ports.map((port: any) => ({
        port: port.port || port,
        label: port.name
          ? `${port.name} (${port.port})`
          : `${port.port}${port.protocol ? '/' + port.protocol : ''}`
      }))
    }

    return []
  }

  const selectService = (service: any) => {
    const ports = getServicePorts(service)
    // 如果只有一个端口,直接选择
    if (ports.length === 1) {
      handlePortSelect(service, ports[0])
    }
  }

  const handlePortSelect = (service: any, port: any) => {
    emit('select', service, port)
    visible.value = false
  }

  const handleSearch = () => {
    pagination.value.current = 1
    loadServices()
  }

  const handleSizeChange = () => {
    pagination.value.current = 1
    loadServices()
  }

  const handleCurrentChange = () => {
    loadServices()
  }

  const handleClosed = () => {
    // 对话框关闭时重置状态，下次打开时重新加载
    searchKeyword.value = ''
    pagination.value.current = 1
    services.value = []
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

  .service-list {
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

  .service-item {
    padding: 16px;
    margin-bottom: 12px;
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
    }

    .service-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .service-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .service-icon {
          color: #409eff;
        }

        .service-name {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .service-ports {
      .ports-label {
        font-size: 13px;
        color: #606266;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .ports-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }
</style>
