<template>
  <div class="replication-policy">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ElInput
          v-model="searchParams.name"
          placeholder="搜索策略名称..."
          :prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 300px"
        />
      </div>

      <div class="toolbar-right">
        <ElButton type="primary" :icon="Plus" @click="handleCreate"> 创建策略 </ElButton>
        <ElButton :icon="RefreshCw" @click="fetchPolicies">刷新</ElButton>
      </div>
    </div>

    <!-- 策略列表 -->
    <ElCard shadow="never" class="table-card" v-loading="loading">
      <ElTable :data="policies" style="width: 100%">
        <ElTableColumn label="策略名称" min-width="200">
          <template #default="{ row }">
            <div class="policy-name-cell">
              <Copy :size="16" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="描述" min-width="200">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="源仓库" width="120">
          <template #default="{ row }">
            <ElTag size="small">Registry {{ row.srcRegistry }}</ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="目标仓库" width="120">
          <template #default="{ row }">
            <ElTag size="small" type="success">Registry {{ row.destRegistry }}</ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="触发方式" width="120">
          <template #default="{ row }">
            <ElTag size="small" :type="row.trigger.type === 'manual' ? 'info' : 'warning'">
              {{ getTriggerText(row.trigger.type) }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElSwitch
              :model-value="row.enabled"
              @change="handleToggleStatus(row, $event)"
              :disabled="toggling"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn label="删除远程" width="100">
          <template #default="{ row }">
            <ElTag :type="row.deletion ? 'danger' : 'info'" size="small">
              {{ row.deletion ? '是' : '否' }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="覆盖" width="100">
          <template #default="{ row }">
            <ElTag :type="row.override ? 'warning' : 'info'" size="small">
              {{ row.override ? '是' : '否' }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.creationTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <ElSpace :size="4">
              <ElButton type="primary" size="small" :icon="Play" @click="handleExecute(row)">
                执行
              </ElButton>
              <ElButton size="small" :icon="Clock" @click="handleViewExecutions(row)">
                历史
              </ElButton>
              <ElDropdown @command="handleCommand(row, $event)">
                <ElButton size="small" :icon="MoreVertical" circle />
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="edit" :icon="Edit">编辑</ElDropdownItem>
                    <ElDropdownItem command="delete" :icon="Trash2" divided>删除</ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div v-if="policies.length > 0" class="pagination-wrapper">
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
      <ElEmpty v-if="policies.length === 0 && !loading" description="暂无复制策略">
        <ElButton type="primary" :icon="Plus" @click="handleCreate">创建第一个策略</ElButton>
      </ElEmpty>
    </ElCard>

    <!-- 创建/编辑策略对话框 -->
    <ElDialog
      v-model="policyDialogVisible"
      :title="policyMode === 'create' ? '创建复制策略' : '编辑复制策略'"
      width="800px"
      :close-on-click-modal="false"
    >
      <ElForm ref="policyFormRef" :model="policyForm" :rules="policyRules" label-width="120px">
        <ElFormItem label="策略名称" prop="name">
          <ElInput
            v-model="policyForm.name"
            placeholder="请输入策略名称"
            :disabled="policyMode === 'edit'"
          />
          <div class="form-tip">策略名称创建后不可修改</div>
        </ElFormItem>

        <ElFormItem label="描述">
          <ElInput
            v-model="policyForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入策略描述"
          />
        </ElFormItem>

        <ElFormItem label="源仓库 ID" prop="srcRegistry">
          <ElInputNumber
            v-model="policyForm.srcRegistry"
            :min="0"
            placeholder="源仓库 ID"
            style="width: 100%"
          />
        </ElFormItem>

        <ElFormItem label="目标仓库 ID" prop="destRegistry">
          <ElInputNumber
            v-model="policyForm.destRegistry"
            :min="0"
            placeholder="目标仓库 ID"
            style="width: 100%"
          />
        </ElFormItem>

        <ElFormItem label="目标命名空间">
          <ElInput v-model="policyForm.destNamespace" placeholder="可选：目标命名空间" />
        </ElFormItem>

        <ElFormItem label="触发方式" prop="triggerType">
          <ElRadioGroup v-model="policyForm.triggerType">
            <ElRadio value="manual">手动触发</ElRadio>
            <ElRadio value="scheduled">定时触发</ElRadio>
            <ElRadio value="event_based">事件触发</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem v-if="policyForm.triggerType === 'scheduled'" label="Cron 表达式">
          <ElInput v-model="policyForm.cronExpression" placeholder="例如: 0 0 2 * * ?" />
        </ElFormItem>

        <ElFormItem label="过滤器">
          <div class="filters-editor">
            <div v-for="(filter, index) in policyForm.filters" :key="index" class="filter-item">
              <ElSelect v-model="filter.type" placeholder="类型" style="width: 150px">
                <ElOption label="仓库" value="repository" />
                <ElOption label="标签" value="tag" />
                <ElOption label="标签" value="label" />
              </ElSelect>
              <ElInput v-model="filter.value" placeholder="值" style="flex: 1" />
              <ElButton type="danger" :icon="Trash2" circle @click="handleRemoveFilter(index)" />
            </div>
            <ElButton type="primary" :icon="Plus" @click="handleAddFilter" style="width: 100%">
              添加过滤器
            </ElButton>
          </div>
        </ElFormItem>

        <ElFormItem label="选项">
          <div class="options-group">
            <ElCheckbox v-model="policyForm.deletion">
              删除远程资源（当源资源被删除时）
            </ElCheckbox>
            <ElCheckbox v-model="policyForm.override"> 覆盖目标资源 </ElCheckbox>
            <ElCheckbox v-model="policyForm.enabled"> 启用策略 </ElCheckbox>
          </div>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="policyDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmitPolicy" :loading="submitting">
          {{ policyMode === 'create' ? '创建' : '保存' }}
        </ElButton>
      </template>
    </ElDialog>

    <!-- 执行历史对话框 -->
    <ElDialog
      v-model="executionsDialogVisible"
      :title="`执行历史 - ${currentPolicy?.name}`"
      width="1000px"
    >
      <ElTable :data="executions" style="width: 100%" v-loading="loadingExecutions">
        <ElTableColumn label="执行 ID" width="100">
          <template #default="{ row }">
            {{ row.id }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <ElTag :type="getExecutionStatusType(row.status)" size="small">
              {{ row.status }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="触发方式" width="120">
          <template #default="{ row }">
            {{ row.trigger }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="成功" width="80">
          <template #default="{ row }">
            <ElTag type="success" size="small">{{ row.succeed }}</ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="失败" width="80">
          <template #default="{ row }">
            <ElTag type="danger" size="small">{{ row.failed }}</ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="进行中" width="80">
          <template #default="{ row }">
            <ElTag type="warning" size="small">{{ row.inProgress }}</ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="已停止" width="80">
          <template #default="{ row }">
            <ElTag type="info" size="small">{{ row.stopped }}</ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="结束时间" width="180">
          <template #default="{ row }">
            {{ row.endTime ? formatDateTime(row.endTime) : '-' }}
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 执行历史分页 -->
      <div v-if="executions.length > 0" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="executionParams.page"
          v-model:page-size="executionParams.pageSize"
          :total="executionTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleExecutionSizeChange"
          @current-change="handleExecutionPageChange"
        />
      </div>

      <template #footer>
        <ElButton @click="executionsDialogVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    Copy,
    Plus,
    Search,
    RefreshCw,
    Play,
    Clock,
    Edit,
    Trash2,
    MoreVertical
  } from 'lucide-vue-next'
  import {
    listReplicationPoliciesApi,
    getReplicationPolicyApi,
    createReplicationPolicyApi,
    updateReplicationPolicyApi,
    deleteReplicationPolicyApi,
    executeReplicationPolicyApi,
    listReplicationExecutionsApi,
    type ReplicationPolicy,
    type ReplicationFilter,
    type ReplicationExecution
  } from '@/api'

  interface Props {
    registryUuid: string
  }

  const props = defineProps<Props>()

  const loading = ref(false)
  const policies = ref<ReplicationPolicy[]>([])
  const total = ref(0)
  const toggling = ref(false)

  // 搜索参数
  const searchParams = reactive({
    page: 1,
    pageSize: 10,
    name: ''
  })

  // 策略对话框
  const policyDialogVisible = ref(false)
  const policyMode = ref<'create' | 'edit'>('create')
  const policyFormRef = ref<FormInstance>()
  const submitting = ref(false)

  interface FilterForm {
    type: string
    value: string
  }

  const policyForm = reactive({
    id: 0,
    name: '',
    description: '',
    srcRegistry: 0,
    destRegistry: 0,
    destNamespace: '',
    triggerType: 'manual',
    cronExpression: '',
    filters: [] as FilterForm[],
    deletion: false,
    override: false,
    enabled: true
  })

  const policyRules: FormRules = {
    name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
    srcRegistry: [{ required: true, message: '请输入源仓库 ID', trigger: 'blur' }],
    destRegistry: [{ required: true, message: '请输入目标仓库 ID', trigger: 'blur' }],
    triggerType: [{ required: true, message: '请选择触发方式', trigger: 'change' }]
  }

  // 执行历史
  const executionsDialogVisible = ref(false)
  const loadingExecutions = ref(false)
  const executions = ref<ReplicationExecution[]>([])
  const executionTotal = ref(0)
  const currentPolicy = ref<ReplicationPolicy>()
  const executionParams = reactive({
    page: 1,
    pageSize: 10
  })

  // 获取策略列表
  const fetchPolicies = async () => {
    loading.value = true
    try {
      const response = await listReplicationPoliciesApi({
        registryUuid: props.registryUuid,
        name: searchParams.name || undefined,
        page: searchParams.page,
        pageSize: searchParams.pageSize
      })

      policies.value = response.items || []
      total.value = response.total || 0
    } catch (error) {
      console.error('获取复制策略列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const handleSearch = () => {
    searchParams.page = 1
    fetchPolicies()
  }

  // 分页
  const handleSizeChange = () => {
    searchParams.page = 1
    fetchPolicies()
  }

  const handlePageChange = () => {
    fetchPolicies()
  }

  // 创建策略
  const handleCreate = () => {
    policyMode.value = 'create'
    Object.assign(policyForm, {
      id: 0,
      name: '',
      description: '',
      srcRegistry: 0,
      destRegistry: 0,
      destNamespace: '',
      triggerType: 'manual',
      cronExpression: '',
      filters: [],
      deletion: false,
      override: false,
      enabled: true
    })
    policyDialogVisible.value = true
  }

  // 编辑策略
  const handleEdit = async (policy: ReplicationPolicy) => {
    try {
      const response = await getReplicationPolicyApi(policy.id, props.registryUuid)
      const data = response.data

      policyMode.value = 'edit'
      Object.assign(policyForm, {
        id: data.id,
        name: data.name,
        description: data.description || '',
        srcRegistry: data.srcRegistry,
        destRegistry: data.destRegistry,
        destNamespace: data.destNamespace || '',
        triggerType: data.trigger.type,
        cronExpression: data.trigger.triggerSettings?.cron || '',
        filters: (data.filters || []).map((f) => ({
          type: f.type,
          value: f.value
        })),
        deletion: data.deletion,
        override: data.override,
        enabled: data.enabled
      })
      policyDialogVisible.value = true
    } catch (error) {
      console.error('获取策略详情失败:', error)
    }
  }

  // 添加过滤器
  const handleAddFilter = () => {
    policyForm.filters.push({
      type: 'repository',
      value: '**'
    })
  }

  // 移除过滤器
  const handleRemoveFilter = (index: number) => {
    policyForm.filters.splice(index, 1)
  }

  // 提交策略
  const handleSubmitPolicy = async () => {
    if (!policyFormRef.value) return

    try {
      await policyFormRef.value.validate()

      // 构建过滤器
      const filters: ReplicationFilter[] = policyForm.filters.map((f) => ({
        type: f.type,
        value: f.value
      }))

      // 构建触发器
      const trigger: any = {
        type: policyForm.triggerType
      }

      if (policyForm.triggerType === 'scheduled' && policyForm.cronExpression) {
        trigger.triggerSettings = {
          cron: policyForm.cronExpression
        }
      }

      submitting.value = true

      if (policyMode.value === 'create') {
        await createReplicationPolicyApi({
          registryUuid: props.registryUuid,
          name: policyForm.name,
          description: policyForm.description || undefined,
          srcRegistry: policyForm.srcRegistry,
          destRegistry: policyForm.destRegistry,
          destNamespace: policyForm.destNamespace || undefined,
          filters: filters.length > 0 ? filters : undefined,
          trigger,
          deletion: policyForm.deletion,
          override: policyForm.override,
          enabled: policyForm.enabled
        })
        ElMessage.success('创建成功')
      } else {
        await updateReplicationPolicyApi(policyForm.id, {
          registryUuid: props.registryUuid,
          name: policyForm.name,
          description: policyForm.description || undefined,
          srcRegistry: policyForm.srcRegistry,
          destRegistry: policyForm.destRegistry,
          destNamespace: policyForm.destNamespace || undefined,
          filters: filters.length > 0 ? filters : undefined,
          trigger,
          deletion: policyForm.deletion,
          override: policyForm.override,
          enabled: policyForm.enabled
        })
        ElMessage.success('保存成功')
      }

      policyDialogVisible.value = false
      fetchPolicies()
    } catch (error: any) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  }

  // 删除策略
  const handleDelete = async (policy: ReplicationPolicy) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除复制策略 "${policy.name}" 吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await deleteReplicationPolicyApi(policy.id, props.registryUuid)
      ElMessage.success('删除成功')
      fetchPolicies()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除策略失败:', error)
      }
    }
  }

  // 切换状态
  const handleToggleStatus = async (policy: ReplicationPolicy, enabled: boolean) => {
    toggling.value = true
    try {
      await updateReplicationPolicyApi(policy.id, {
        registryUuid: props.registryUuid,
        name: policy.name,
        description: policy.description,
        srcRegistry: policy.srcRegistry,
        destRegistry: policy.destRegistry,
        destNamespace: policy.destNamespace,
        filters: policy.filters,
        trigger: policy.trigger,
        deletion: policy.deletion,
        override: policy.override,
        enabled
      })
      ElMessage.success(enabled ? '已启用' : '已禁用')
      fetchPolicies()
    } catch (error) {
      console.error('切换状态失败:', error)
    } finally {
      toggling.value = false
    }
  }

  // 执行策略
  const handleExecute = async (policy: ReplicationPolicy) => {
    try {
      await ElMessageBox.confirm(`确定要立即执行复制策略 "${policy.name}" 吗？`, '执行确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      const response = await executeReplicationPolicyApi({
        registryUuid: props.registryUuid,
        policyId: policy.id
      })

      ElMessage.success({
        message: `策略已开始执行，执行 ID: ${response.executionId}`,
        duration: 5000
      })
    } catch (error) {
      if (error !== 'cancel') {
        console.error('执行策略失败:', error)
      }
    }
  }

  // 查看执行历史
  const handleViewExecutions = async (policy: ReplicationPolicy) => {
    currentPolicy.value = policy
    executionParams.page = 1
    executionsDialogVisible.value = true
    fetchExecutions()
  }

  // 获取执行历史
  const fetchExecutions = async () => {
    if (!currentPolicy.value) return

    loadingExecutions.value = true
    try {
      const response = await listReplicationExecutionsApi({
        registryUuid: props.registryUuid,
        policyId: currentPolicy.value.id,
        page: executionParams.page,
        pageSize: executionParams.pageSize
      })

      executions.value = response.items || []
      executionTotal.value = response.total || 0
    } catch (error) {
      console.error('获取执行历史失败:', error)
    } finally {
      loadingExecutions.value = false
    }
  }

  // 执行历史分页
  const handleExecutionSizeChange = () => {
    executionParams.page = 1
    fetchExecutions()
  }

  const handleExecutionPageChange = () => {
    fetchExecutions()
  }

  // 执行状态
  const getExecutionStatusType = (status: string) => {
    const typeMap: Record<string, any> = {
      InProgress: 'warning',
      Succeed: 'success',
      Failed: 'danger',
      Stopped: 'info'
    }
    return typeMap[status] || 'info'
  }

  // 触发方式文本
  const getTriggerText = (type: string) => {
    const textMap: Record<string, string> = {
      manual: '手动',
      scheduled: '定时',
      event_based: '事件'
    }
    return textMap[type] || type
  }

  // 处理命令
  const handleCommand = (policy: ReplicationPolicy, command: string) => {
    if (command === 'edit') {
      handleEdit(policy)
    } else if (command === 'delete') {
      handleDelete(policy)
    }
  }

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  onMounted(() => {
    fetchPolicies()
  })
</script>

<style lang="scss" scoped>
  .replication-policy {
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .toolbar-left {
        flex: 1;
        margin-right: 16px;
      }

      .toolbar-right {
        display: flex;
        gap: 12px;
      }
    }

    .table-card {
      .policy-name-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
      }

      .pagination-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }

    .form-tip {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .filters-editor {
      width: 100%;

      .filter-item {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 12px;
      }
    }

    .options-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
</style>
