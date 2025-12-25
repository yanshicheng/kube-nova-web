<template>
  <div class="cluster-role-binding-page">
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
              创建 ClusterRoleBinding
            </ElButton>
            <ElTooltip>
              <template #content>
                <div style="max-width: 300px">
                  ClusterRoleBinding 将 ClusterRole 绑定到主体（用户、组或 ServiceAccount），<br />
                  授予其在集群级别的权限
                </div>
              </template>
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
    <ClusterRoleBindingDialog
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

    <!-- 权限弹窗 -->
    <ElDialog v-model="permissionsDialogVisible" title="实际权限详情" width="900px" align-center>
      <div v-if="currentPermissions" class="permissions-info">
        <ElAlert
          v-if="currentPermissions.isSuperAdmin"
          title="警告：此绑定授予了集群的完全控制权限（超级管理员）"
          type="error"
          :closable="false"
          style="margin-bottom: 16px"
          show-icon
        />

        <ElAlert
          v-if="!currentPermissions.roleExists"
          title="警告：绑定的 ClusterRole 不存在，此绑定无效"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
          show-icon
        />

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="绑定名称">{{
            currentPermissions.bindingName
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="角色名称">{{
            currentPermissions.roleName
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="角色存在">
            <ElTag :type="currentPermissions.roleExists ? 'success' : 'danger'" size="small">
              {{ currentPermissions.roleExists ? '是' : '否' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="超级管理员">
            <ElTag :type="currentPermissions.isSuperAdmin ? 'danger' : 'info'" size="small">
              {{ currentPermissions.isSuperAdmin ? '是' : '否' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="风险等级">
            <ElTag :type="getRiskLevelType(currentPermissions.riskLevel)" size="small">
              {{ getRiskLevelText(currentPermissions.riskLevel) }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>

        <template v-if="currentPermissions.subjects && currentPermissions.subjects.length > 0">
          <ElDivider content-position="left"
            >主体列表 ({{ currentPermissions.subjects.length }})</ElDivider
          >
          <ElTable :data="currentPermissions.subjects" style="width: 100%" max-height="300">
            <ElTableColumn prop="kind" label="类型" width="140">
              <template #default="{ row }">
                <ElTag size="small" :type="getSubjectTypeColor(row.kind)">{{ row.kind }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="name" label="名称" show-overflow-tooltip />
            <ElTableColumn prop="namespace" label="命名空间" width="150">
              <template #default="{ row }">
                {{ row.namespace || '-' }}
              </template>
            </ElTableColumn>
          </ElTable>
        </template>

        <template v-if="currentPermissions.rules && currentPermissions.rules.length > 0">
          <ElDivider content-position="left"
            >权限规则 ({{ currentPermissions.rules.length }})</ElDivider
          >
          <ElTable :data="currentPermissions.rules" style="width: 100%" max-height="300">
            <ElTableColumn label="动作 (Verbs)" width="250">
              <template #default="{ row }">
                <ElSpace wrap>
                  <ElTag
                    v-for="verb in row.verbs.slice(0, 5)"
                    :key="verb"
                    size="small"
                    type="primary"
                  >
                    {{ verb }}
                  </ElTag>
                  <span v-if="row.verbs.length > 5" style="color: #909399; font-size: 12px">
                    +{{ row.verbs.length - 5 }}
                  </span>
                </ElSpace>
              </template>
            </ElTableColumn>
            <ElTableColumn label="API 组" width="180">
              <template #default="{ row }">
                <span v-if="row.apiGroups && row.apiGroups.length > 0">
                  {{ row.apiGroups.join(', ') || 'core' }}
                </span>
                <span v-else style="color: #909399">-</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="资源" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.resources?.join(', ') || '*' }}
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
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
    getClusterRoleBindingListApi,
    getClusterRoleBindingYamlApi,
    getClusterRoleBindingDescribeApi,
    getClusterRoleBindingPermissionsApi,
    deleteClusterRoleBindingApi,
    canDeleteClusterRoleBindingApi,
    type ClusterRoleBindingListItem,
    type ClusterRoleBindingPermissionsResponse
  } from '@/api/workload/cluster-resource'
  import { useClusterRoleBindingTableConfig } from './modules/table-config'
  import ClusterRoleBindingDialog from './modules/cluster-role-binding-dialog.vue'
  import YamlViewerDialog from '../../components/YamlViewerDialog.vue'
  import DescribeDialog from '../../components/DescribeDialog.vue'

  interface Props {
    clusterId: number
    clusterUuid: string
    active: boolean
  }

  const props = defineProps<Props>()

  defineOptions({ name: 'ClusterRoleBindingTab' })

  const { loading, showSearchBar, deleteLoadingMap, createTableColumns } =
    useClusterRoleBindingTableConfig()

  const data = ref<ClusterRoleBindingListItem[]>([])
  const filteredData = ref<ClusterRoleBindingListItem[]>([])
  const hasLoaded = ref(false)
  const searchBarRef = ref()

  const dialogVisible = ref(false)
  const dialogType = ref<'create' | 'edit'>('create')
  const currentResourceName = ref('')
  const yamlDialogVisible = ref(false)
  const describeDialogVisible = ref(false)
  const permissionsDialogVisible = ref(false)
  const currentYaml = ref('')
  const currentDescribe = ref('')
  const currentPermissions = ref<ClusterRoleBindingPermissionsResponse | null>(null)

  const searchForm = ref({ search: '' })

  const searchFormItems = computed(() => [
    {
      label: '名称',
      key: 'search',
      type: 'input',
      placeholder: '请输入 ClusterRoleBinding 名称搜索',
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
      filteredData.value = data.value.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText) ||
          item.role.toLowerCase().includes(searchText)
      )
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

  const getSubjectTypeColor = (kind: string) => {
    const map: Record<string, string> = {
      User: 'primary',
      Group: 'success',
      ServiceAccount: 'warning'
    }
    return map[kind] || ''
  }

  const buttonMoreClick = async (item: ButtonMoreItem, row: ClusterRoleBindingListItem) => {
    switch (item.key) {
      case 'yaml':
        await viewYaml(row)
        break
      case 'describe':
        await viewDescribe(row)
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
      const response = await getClusterRoleBindingListApi({
        clusterUuid: props.clusterUuid
      })
      data.value = response.items || []
      filterData()
      hasLoaded.value = true
    } catch (error: any) {
      console.error('加载列表失败:', error)
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

  const showEditDialog = (row: ClusterRoleBindingListItem) => {
    dialogType.value = 'edit'
    currentResourceName.value = row.name
    dialogVisible.value = true
  }

  const handleDialogSuccess = () => refresh()

  const viewYaml = async (row: ClusterRoleBindingListItem) => {
    try {
      currentResourceName.value = row.name
      currentYaml.value = await getClusterRoleBindingYamlApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      yamlDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const viewDescribe = async (row: ClusterRoleBindingListItem) => {
    try {
      currentResourceName.value = row.name
      currentDescribe.value = await getClusterRoleBindingDescribeApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      describeDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const viewPermissions = async (row: ClusterRoleBindingListItem) => {
    try {
      currentPermissions.value = await getClusterRoleBindingPermissionsApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })
      permissionsDialogVisible.value = true
    } catch (error: any) {
    }
  }

  const handleDelete = async (row: ClusterRoleBindingListItem) => {
    try {
      const checkResult = await canDeleteClusterRoleBindingApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      if (!checkResult.canDelete) {
        ElMessage.warning(checkResult.warning || '无法删除')
        return
      }

      await ElMessageBox.confirm(
        `确定要删除 ClusterRoleBinding "${row.name}" 吗？删除后，相关主体将失去此绑定授予的权限。`,
        '删除确认',
        { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
      )

      deleteLoadingMap.value[row.name] = true

      await deleteClusterRoleBindingApi({
        clusterUuid: props.clusterUuid,
        name: row.name
      })

      ElMessage.success('删除成功')
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
  .cluster-role-binding-page {
    .permissions-info {
      .el-divider {
        margin: 20px 0 16px;
      }
    }
  }
</style>
