<!-- views/cluster/resource/tabs/StorageClass/index.vue -->
<template>
  <div class="storage-class-page">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-show="showSearchBar"
      ref="searchBarRef"
      v-model="searchForm"
      :items="searchFormItems"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard
      class="art-table-card"
      shadow="never"
      :style="{ 'margin-top': showSearchBar ? '12px' : '0' }"
    >
      <!-- 表格头部 -->
      <ArtTableHeader
        v-model:columns="columns"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        :showZebra="true"
        :showBorder="true"
        :showHeaderBackground="true"
        :fullClass="'art-page-view'"
        :layout="'search,refresh,size,fullscreen,columns,settings'"
        @refresh="refresh"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" :icon="PlusIcon" @click="showCreateDialog">
              创建 StorageClass
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 数据表格 -->
      <ArtTable
        :loading="loading"
        :data="paginatedData"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 创建/编辑弹窗 -->
    <StorageClassDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :cluster-uuid="clusterUuid"
      :resource-name="currentResourceName"
      @success="handleDialogSuccess"
    />

    <!-- YAML 查看弹窗 -->
    <YamlViewerDialog
      v-model="yamlDialogVisible"
      :yaml="currentYaml"
      :resource-name="currentResourceName"
    />

    <!-- 详情查看弹窗（使用 YAML 编辑器展示） -->
    <DetailViewerDialog
      v-model="detailDialogVisible"
      :content="currentDetail"
      :resource-name="currentResourceName"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus as PlusIcon } from 'lucide-vue-next'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import {
    getStorageClassListApi,
    getStorageClassYamlApi,
    getStorageClassDescribeApi,
    deleteStorageClassApi,
    canDeleteStorageClassApi,
    setDefaultStorageClassApi,
    unsetDefaultStorageClassApi,
    type StorageClassListItem
  } from '@/api/workload/cluster-resource'
  import { useStorageClassTableConfig } from './modules/table-config'
  import StorageClassDialog from './modules/storage-class-dialog.vue'
  import YamlViewerDialog from '../../components/YamlViewerDialog.vue'
  import DetailViewerDialog from '../../components/DetailViewerDialog.vue'

  interface Props {
    clusterId: number
    clusterUuid: string
    active: boolean
  }

  interface Emits {
    (e: 'refresh', tabName: string): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  defineOptions({ name: 'StorageClassTab' })

  // 使用表格配置
  const { loading, showSearchBar, deleteLoadingMap, createTableColumns } = useStorageClassTableConfig()

  // 状态
  const allData = ref<StorageClassListItem[]>([])
  const hasLoaded = ref(false)
  const searchBarRef = ref()

  // 弹窗状态
  const dialogVisible = ref(false)
  const dialogType = ref<'create' | 'edit'>('create')
  const currentResourceName = ref('')
  const yamlDialogVisible = ref(false)
  const detailDialogVisible = ref(false)
  const currentYaml = ref('')
  const currentDetail = ref('')

  // 搜索表单
  const searchForm = ref({
    search: '',
    provisioner: undefined as string | undefined
  })

  // 搜索表单配置
  const searchFormItems = computed(() => [
    {
      label: '名称',
      key: 'search',
      type: 'input',
      placeholder: '请输入名称搜索',
      clearable: true
    },
    {
      label: '供应商',
      key: 'provisioner',
      type: 'select',
      props: {
        placeholder: '请选择供应商',
        clearable: true,
        options: provisionerFilterOptions.value
      }
    }
  ])

  // 供应商筛选选项（从数据中提取）
  const provisionerFilterOptions = computed(() => {
    const provisioners = [...new Set(allData.value.map(item => item.provisioner))]
    return provisioners.map(p => ({ label: p, value: p }))
  })

  // 分页配置（前端分页）
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 过滤后的数据
  const filteredData = computed(() => {
    let result = allData.value

    // 名称搜索
    if (searchForm.value.search) {
      const keyword = searchForm.value.search.toLowerCase()
      result = result.filter(item => item.name.toLowerCase().includes(keyword))
    }

    // 供应商筛选
    if (searchForm.value.provisioner) {
      result = result.filter(item => item.provisioner === searchForm.value.provisioner)
    }

    return result
  })

  // 分页后的数据（前端分页）
  const paginatedData = computed(() => {
    const start = (pagination.value.current - 1) * pagination.value.size
    const end = start + pagination.value.size
    pagination.value.total = filteredData.value.length
    return filteredData.value.slice(start, end)
  })

  // 处理设置默认
  const handleSetDefault = async (row: StorageClassListItem) => {
    try {
      await ElMessageBox.confirm(
        `确定要将 "${row.name}" 设为默认 StorageClass 吗？`,
        '设为默认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await setDefaultStorageClassApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      ElMessage.success('已设为默认')
      refresh()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('设置默认失败:', error)
      }
    }
  }

  // 处理取消默认
  const handleUnsetDefault = async (row: StorageClassListItem) => {
    try {
      await ElMessageBox.confirm(
        `确定要取消 "${row.name}" 的默认状态吗？`,
        '取消默认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await unsetDefaultStorageClassApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      ElMessage.success('已取消默认')
      refresh()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('取消默认失败:', error)
      }
    }
  }

  // 按钮更多点击事件
  const buttonMoreClick = async (item: ButtonMoreItem, row: StorageClassListItem) => {
    switch (item.key) {
      case 'yaml':
        await viewYaml(row)
        break
      case 'detail':
        await viewDetail(row)
        break
      case 'edit':
        showEditDialog(row)
        break
      case 'setDefault':
        await handleSetDefault(row)
        break
      case 'unsetDefault':
        await handleUnsetDefault(row)
        break
      case 'delete':
        await handleDelete(row)
        break
    }
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    handleSetDefault,
    handleUnsetDefault,
    buttonMoreClick
  })

  // 加载数据
  const loadData = async (force = false) => {
    // 检查集群 UUID
    if (!props.clusterUuid) {
      return
    }

    // 如果不是强制刷新且已加载过，跳过
    if (hasLoaded.value && !force) {
      return
    }

    try {
      loading.value = true
      const response = await getStorageClassListApi({
        clusterUuid: props.clusterUuid
      })
      allData.value = response.items || []
      hasLoaded.value = true
      // 重置到第一页
      pagination.value.current = 1
    } catch (error: any) {
      console.error('加载 StorageClass 列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 刷新
  const refresh = () => {
    loadData(true)
  }

  // 搜索（前端过滤，只需重置页码）
  const handleSearch = () => {
    pagination.value.current = 1
  }

  // 重置
  const handleReset = () => {
    searchForm.value.search = ''
    searchForm.value.provisioner = undefined
    pagination.value.current = 1
  }

  // 分页
  const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1
  }

  const handleCurrentChange = (page: number) => {
    pagination.value.current = page
  }

  // 显示创建弹窗
  const showCreateDialog = () => {
    dialogType.value = 'create'
    currentResourceName.value = ''
    dialogVisible.value = true
  }

  // 显示编辑弹窗
  const showEditDialog = (row: StorageClassListItem) => {
    dialogType.value = 'edit'
    currentResourceName.value = row.name
    dialogVisible.value = true
  }

  // 弹窗成功回调
  const handleDialogSuccess = () => {
    refresh()
  }

  // 查看 YAML
  const viewYaml = async (row: StorageClassListItem) => {
    try {
      currentResourceName.value = row.name
      currentYaml.value = await getStorageClassYamlApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      yamlDialogVisible.value = true
    } catch (error: any) {
      console.error('获取 YAML 失败:', error)
    }
  }

  // 查看详情（原 Describe）
  const viewDetail = async (row: StorageClassListItem) => {
    try {
      currentResourceName.value = row.name
      currentDetail.value = await getStorageClassDescribeApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      detailDialogVisible.value = true
    } catch (error: any) {
      console.error('获取详情失败:', error)
    }
  }

  // 删除
  const handleDelete = async (row: StorageClassListItem) => {
    try {
      // 检查是否可删除
      const checkResult = await canDeleteStorageClassApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      if (!checkResult.canDelete) {
        ElMessage.warning(checkResult.warning || '无法删除此 StorageClass')
        return
      }

      // 确认删除
      await ElMessageBox.confirm(
        checkResult.warning
          ? `${checkResult.warning}\n\n确定要删除 StorageClass "${row.name}" 吗？此操作不可恢复！`
          : `确定要删除 StorageClass "${row.name}" 吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      deleteLoadingMap.value[row.name] = true

      await deleteStorageClassApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      ElMessage.success(`StorageClass "${row.name}" 已删除`)
      refresh()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      deleteLoadingMap.value[row.name] = false
    }
  }

  // 监听 active 变化，实现懒加载和刷新
  watch(
    () => props.active,
    (active) => {
      if (active && props.clusterUuid) {
        if (!hasLoaded.value) {
          loadData()
        } else {
          loadData(true)
        }
      }
    },
    { immediate: true }
  )

  // 监听集群变化
  watch(
    () => props.clusterUuid,
    (newUuid, oldUuid) => {
      if (newUuid && newUuid !== oldUuid) {
        hasLoaded.value = false
        allData.value = []
        if (props.active) {
          loadData()
        }
      }
    }
  )
</script>

<style lang="scss" scoped>
  .storage-class-page {
    .art-table-card {
      :deep(.name-cell) {
        display: flex;
        align-items: center;
        gap: 8px;

        .resource-name {
          font-weight: 500;
          color: #303133;
        }

        .default-tag {
          margin-left: 4px;
        }
      }

      :deep(.provisioner-cell) {
        display: flex;
        align-items: center;
        gap: 8px;

        .provisioner-icon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .provisioner-text {
          font-family: 'SF Mono', Monaco, Consolas, monospace;
          font-size: 12px;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
          padding: 4px 8px;
          border-radius: 4px;
          color: #606266;
        }
      }
    }
  }
</style>