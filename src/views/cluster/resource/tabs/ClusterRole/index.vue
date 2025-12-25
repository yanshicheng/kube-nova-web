<!-- views/cluster/resource/tabs/ClusterRole/index.vue -->
<template>
  <div class="cluster-role-page">
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
              创建 ClusterRole
            </ElButton>
            <ElTooltip content="ClusterRole 是集群级别的角色，定义了一组权限规则">
              <ElButton :icon="InfoIcon" circle />
            </ElTooltip>
          </ElSpace>
        </template>
      </ArtTableHeader>

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
    <ClusterRoleDialog
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

    <!-- Describe 查看弹窗 -->
    <DescribeDialog
      v-model="describeDialogVisible"
      :describe="currentDescribe"
      :resource-name="currentResourceName"
    />

    <!-- 使用情况弹窗 -->
    <ElDialog v-model="usageDialogVisible" title="ClusterRole 使用情况" width="800px" align-center>
      <div v-if="currentUsage" class="usage-info">
        <ElDescriptions :column="3" border>
          <ElDescriptionsItem label="ClusterRole">{{
            currentUsage.clusterRoleName
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="ClusterRoleBinding 数">{{
            currentUsage.bindingCount
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="RoleBinding 数">{{
            currentUsage.roleBindingCount
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="总主体数">{{ currentUsage.totalSubjects }}</ElDescriptionsItem>
          <ElDescriptionsItem label="ServiceAccount 数">{{
            currentUsage.serviceAccountCount
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用户数">{{ currentUsage.userCount }}</ElDescriptionsItem>
        </ElDescriptions>

        <template
          v-if="currentUsage.clusterRoleBindings && currentUsage.clusterRoleBindings.length > 0"
        >
          <ElDivider content-position="left">ClusterRoleBinding</ElDivider>
          <ElTable :data="currentUsage.clusterRoleBindings" style="width: 100%" max-height="200">
            <ElTableColumn prop="name" label="名称" />
            <ElTableColumn label="主体">
              <template #default="{ row }">
                <ElSpace wrap>
                  <ElTag v-for="(s, i) in row.subjects?.slice(0, 3)" :key="i" size="small">
                    {{ s.kind }}: {{ s.name }}
                  </ElTag>
                  <span v-if="row.subjects?.length > 3" style="color: #909399">
                    +{{ row.subjects.length - 3 }}
                  </span>
                </ElSpace>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="age" label="存在时间" width="120" />
          </ElTable>
        </template>

        <ElAlert
          v-if="!currentUsage.canDelete"
          :title="currentUsage.deleteWarning || '此 ClusterRole 正在使用中，删除前请先解除绑定'"
          type="warning"
          :closable="false"
          style="margin-top: 16px"
          show-icon
        />
      </div>
    </ElDialog>

    <!-- 权限摘要弹窗 -->
    <ElDialog v-model="permissionDialogVisible" title="权限摘要" width="900px" align-center>
      <div v-if="currentPermissions" class="permissions-info">
        <ElAlert
          v-if="currentPermissions.isSuperAdmin"
          title="警告：此角色拥有集群的完全控制权限（超级管理员）"
          type="error"
          :closable="false"
          style="margin-bottom: 16px"
          show-icon
        />

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="ClusterRole">{{
            currentPermissions.clusterRoleName
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="风险等级">
            <ElTag :type="getRiskLevelType(currentPermissions.riskLevel)" size="small">
              {{ getRiskLevelText(currentPermissions.riskLevel) }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="超级管理员">
            <ElTag :type="currentPermissions.isSuperAdmin ? 'danger' : 'info'" size="small">
              {{ currentPermissions.isSuperAdmin ? '是' : '否' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="所有动作权限">
            <ElTag :type="currentPermissions.hasAllVerbs ? 'warning' : 'info'" size="small">
              {{ currentPermissions.hasAllVerbs ? '是' : '否' }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElDivider content-position="left">按动作分组</ElDivider>
        <div class="verb-summary">
          <div
            v-for="(resources, verb) in currentPermissions.verbSummary"
            :key="verb"
            class="verb-item"
          >
            <ElTag type="primary" size="small">{{ verb }}</ElTag>
            <span class="resources">{{ resources.join(', ') }}</span>
          </div>
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus as PlusIcon, Info as InfoIcon } from 'lucide-vue-next'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import {
    getClusterRoleListApi,
    getClusterRoleYamlApi,
    getClusterRoleDescribeApi,
    getClusterRoleUsageApi,
    getClusterRolePermissionSummaryApi,
    deleteClusterRoleApi,
    canDeleteClusterRoleApi,
    type ClusterRoleListItem,
    type ClusterRoleUsageResponse,
    type ClusterRolePermissionSummary
  } from '@/api/workload/cluster-resource'
  import { useClusterRoleTableConfig } from './modules/table-config'
  import ClusterRoleDialog from './modules/cluster-role-dialog.vue'
  import YamlViewerDialog from '../../components/YamlViewerDialog.vue'
  import DescribeDialog from '../../components/DescribeDialog.vue'

  interface Props {
    clusterId: number
    clusterUuid: string
    active: boolean
  }

  const props = defineProps<Props>()

  defineOptions({ name: 'ClusterRoleTab' })

  const { loading, showSearchBar, deleteLoadingMap, createTableColumns } =
    useClusterRoleTableConfig()

  const data = ref<ClusterRoleListItem[]>([])
  const filteredData = ref<ClusterRoleListItem[]>([])
  const hasLoaded = ref(false)
  const searchBarRef = ref()

  const dialogVisible = ref(false)
  const dialogType = ref<'create' | 'edit'>('create')
  const currentResourceName = ref('')
  const yamlDialogVisible = ref(false)
  const describeDialogVisible = ref(false)
  const usageDialogVisible = ref(false)
  const permissionDialogVisible = ref(false)
  const currentYaml = ref('')
  const currentDescribe = ref('')
  const currentUsage = ref<ClusterRoleUsageResponse | null>(null)
  const currentPermissions = ref<ClusterRolePermissionSummary | null>(null)

  const searchForm = ref({ search: '' })

  const searchFormItems = computed(() => [
    {
      label: '名称',
      key: 'search',
      type: 'input',
      placeholder: '请输入 ClusterRole 名称搜索',
      clearable: true
    }
  ])

  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 前端分页：计算当前页数据
  const paginatedData = computed(() => {
    const start = (pagination.value.current - 1) * pagination.value.size
    const end = start + pagination.value.size
    return filteredData.value.slice(start, end)
  })

  // 前端搜索过滤
  const filterData = () => {
    const searchText = searchForm.value.search.toLowerCase().trim()
    if (!searchText) {
      filteredData.value = data.value
    } else {
      filteredData.value = data.value.filter((item) => item.name.toLowerCase().includes(searchText))
    }
    pagination.value.total = filteredData.value.length
    pagination.value.current = 1
  }

  const getRiskLevelType = (level: string) => {
    const map: Record<string, string> = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      critical: 'danger'
    }
    return map[level] || 'info'
  }

  const getRiskLevelText = (level: string) => {
    const map: Record<string, string> = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '极高风险'
    }
    return map[level] || level
  }

  const buttonMoreClick = async (item: ButtonMoreItem, row: ClusterRoleListItem) => {
    switch (item.key) {
      case 'yaml':
        await viewYaml(row)
        break
      case 'describe':
        await viewDescribe(row)
        break
      case 'usage':
        await viewUsage(row)
        break
      case 'permissions':
        await viewPermissions(row)
        break
      case 'edit':
        showEditDialog(row)
        break
      case 'delete':
        await handleDelete(row)
        break
    }
  }

  const { columns } = createTableColumns({ buttonMoreClick })

  const loadData = async (force = false) => {
    if (!props.clusterUuid) return
    if (hasLoaded.value && !force) return

    try {
      loading.value = true
      const response = await getClusterRoleListApi({
        clusterUuid: props.clusterUuid
      })
      data.value = response.items || []
      filterData()
      hasLoaded.value = true
    } catch (error: any) {
      console.error('加载 ClusterRole 列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const refresh = () => loadData(true)

  const handleSearch = () => {
    filterData()
  }

  const handleReset = () => {
    searchForm.value.search = ''
    filterData()
  }

  const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1
  }

  const handleCurrentChange = (page: number) => {
    pagination.value.current = page
  }

  const showCreateDialog = () => {
    dialogType.value = 'create'
    currentResourceName.value = ''
    dialogVisible.value = true
  }

  const showEditDialog = (row: ClusterRoleListItem) => {
    dialogType.value = 'edit'
    currentResourceName.value = row.name
    dialogVisible.value = true
  }

  const handleDialogSuccess = () => refresh()

  const viewYaml = async (row: ClusterRoleListItem) => {
    try {
      currentResourceName.value = row.name
      currentYaml.value = await getClusterRoleYamlApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      yamlDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const viewDescribe = async (row: ClusterRoleListItem) => {
    try {
      currentResourceName.value = row.name
      currentDescribe.value = await getClusterRoleDescribeApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      describeDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const viewUsage = async (row: ClusterRoleListItem) => {
    try {
      currentUsage.value = await getClusterRoleUsageApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      usageDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const viewPermissions = async (row: ClusterRoleListItem) => {
    try {
      currentPermissions.value = await getClusterRolePermissionSummaryApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      permissionDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const handleDelete = async (row: ClusterRoleListItem) => {
    try {
      const checkResult = await canDeleteClusterRoleApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      if (!checkResult.canDelete) {
        ElMessage.warning(checkResult.warning || '无法删除此 ClusterRole')
        return
      }

      await ElMessageBox.confirm(
        `确定要删除 ClusterRole "${row.name}" 吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      deleteLoadingMap.value[row.name] = true

      await deleteClusterRoleApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      ElMessage.success(`ClusterRole "${row.name}" 已删除`)
      refresh()
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    } finally {
      deleteLoadingMap.value[row.name] = false
    }
  }

  watch(
    () => props.active,
    (active) => {
      if (active) {
        if (!hasLoaded.value) {
          loadData()
        } else {
          loadData(true)
        }
      }
    },
    { immediate: true }
  )

  watch(
    () => props.clusterUuid,
    (newUuid, oldUuid) => {
      if (newUuid !== oldUuid) {
        hasLoaded.value = false
        data.value = []
        filteredData.value = []
        if (props.active) loadData()
      }
    }
  )
</script>

<style lang="scss" scoped>
  .cluster-role-page {
    .usage-info,
    .permissions-info {
      .el-divider {
        margin: 20px 0 16px;
      }
    }

    .verb-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .verb-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        .resources {
          color: #606266;
          font-size: 13px;
          line-height: 22px;
        }
      }
    }
  }
</style>
