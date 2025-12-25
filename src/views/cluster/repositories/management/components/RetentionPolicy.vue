<template>
  <div class="retention-policy">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ElSelect
          v-model="selectedProject"
          placeholder="选择项目"
          style="width: 300px"
          filterable
          @change="handleProjectChange"
        >
          <ElOption
            v-for="project in projects"
            :key="project.name"
            :label="project.name"
            :value="project.name"
          />
        </ElSelect>
      </div>

      <div class="toolbar-right">
        <ElButton v-if="currentPolicy" type="primary" :icon="Play" @click="handleExecutePolicy">
          执行策略
        </ElButton>
        <ElButton v-if="currentPolicy" :icon="Edit" @click="handleEditPolicy"> 编辑策略 </ElButton>
        <ElButton v-else type="primary" :icon="Plus" @click="handleCreatePolicy">
          创建策略
        </ElButton>
        <ElButton :icon="RefreshCw" @click="fetchPolicy">刷新</ElButton>
      </div>
    </div>

    <!-- 策略信息 -->
    <ElCard v-if="currentPolicy" shadow="never" class="policy-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <Archive :size="20" />
          <span>保留策略</span>
        </div>
      </template>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="策略 ID">{{ currentPolicy.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="算法">{{ currentPolicy.algorithm }}</ElDescriptionsItem>
        <ElDescriptionsItem label="触发方式">{{ currentPolicy.trigger }}</ElDescriptionsItem>
        <ElDescriptionsItem label="作用域">{{ currentPolicy.scope }}</ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">
          {{ formatDateTime(currentPolicy.createTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="更新时间">
          {{ formatDateTime(currentPolicy.updateTime) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 规则列表 -->
      <div class="rules-section">
        <div class="section-title">保留规则</div>
        <ElTable :data="currentPolicy.rules" style="width: 100%">
          <ElTableColumn label="优先级" width="100">
            <template #default="{ row }">
              <ElTag size="small">{{ row.priority }}</ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="规则说明" min-width="250">
            <template #default="{ row }">
              {{ getRuleDescription(row) }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="标签选择器" min-width="150">
            <template #default="{ row }">
              {{ row.tagSelectors || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="状态" width="100">
            <template #default="{ row }">
              <ElTag :type="row.disabled ? 'info' : 'success'" size="small">
                {{ row.disabled ? '禁用' : '启用' }}
              </ElTag>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <!-- 执行历史 -->
      <div class="history-section">
        <div class="section-title">
          <Clock :size="16" />
          执行历史
        </div>
        <ElTable :data="executions" style="width: 100%" v-loading="loadingExecutions">
          <ElTableColumn label="执行 ID" width="100">
            <template #default="{ row }">{{ row.id }}</template>
          </ElTableColumn>

          <ElTableColumn label="状态" width="120">
            <template #default="{ row }">
              <ElTag :type="getExecutionStatusType(row.status)" size="small">
                {{ row.status }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="触发方式" width="120">
            <template #default="{ row }">{{ row.trigger }}</template>
          </ElTableColumn>

          <ElTableColumn label="模式" width="100">
            <template #default="{ row }">
              <ElTag :type="row.dryRun ? 'warning' : 'primary'" size="small">
                {{ row.dryRun ? '预演' : '正式' }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="开始时间" width="180">
            <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
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
      </div>
    </ElCard>

    <!-- 空状态 -->
    <ElEmpty
      v-else-if="selectedProject && !loading"
      description="该项目暂无保留策略"
      :image-size="120"
    >
      <ElButton type="primary" :icon="Plus" @click="handleCreatePolicy">创建策略</ElButton>
    </ElEmpty>

    <ElEmpty v-else-if="!selectedProject" description="请先选择项目" :image-size="120" />

    <!-- 创建/编辑策略对话框 -->
    <ElDialog
      v-model="policyDialogVisible"
      :title="policyMode === 'create' ? '创建保留策略' : '编辑保留策略'"
      width="900px"
      :close-on-click-modal="false"
    >
      <ElForm ref="policyFormRef" :model="policyForm" :rules="policyRules" label-width="120px">
        <ElFormItem label="算法" prop="algorithm">
          <ElRadioGroup v-model="policyForm.algorithm">
            <ElRadio value="or">OR（满足任一规则即保留）</ElRadio>
            <ElRadio value="and">AND（满足所有规则才保留）</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem label="定时调度">
          <ElInput
            v-model="policyForm.schedule"
            placeholder="Cron 表达式（可选），例如: 0 0 2 * * ?"
          />
        </ElFormItem>

        <ElFormItem label="保留规则">
          <div class="rules-editor">
            <div v-for="(rule, index) in policyForm.rules" :key="index" class="rule-item">
              <div class="rule-header">
                <span class="rule-title">规则 {{ index + 1 }}</span>
                <ElButton
                  type="danger"
                  size="small"
                  :icon="Trash2"
                  circle
                  @click="handleRemoveRule(index)"
                />
              </div>

              <ElForm :model="rule" label-width="100px" size="small">
                <ElFormItem label="优先级">
                  <ElInputNumber v-model="rule.priority" :min="0" style="width: 100%" />
                </ElFormItem>

                <ElFormItem label="规则模板">
                  <ElSelect
                    v-model="rule.template"
                    placeholder="选择规则模板"
                    style="width: 100%"
                    @change="handleTemplateChange(rule)"
                  >
                    <ElOption
                      v-for="tmpl in ruleTemplates"
                      :key="tmpl.value"
                      :label="tmpl.label"
                      :value="tmpl.value"
                    >
                      <div class="template-option">
                        <span class="template-name">{{ tmpl.label }}</span>
                        <span class="template-desc">{{ tmpl.description }}</span>
                      </div>
                    </ElOption>
                  </ElSelect>
                </ElFormItem>

                <!-- 动态参数输入 -->
                <ElFormItem v-if="rule.template === 'latestPushedK'" label="保留数量">
                  <ElInputNumber
                    v-model="rule.latestPushedK"
                    :min="1"
                    :max="100"
                    style="width: 100%"
                    placeholder="保留最新推送的 N 个制品"
                  />
                </ElFormItem>

                <ElFormItem v-if="rule.template === 'latestPulledN'" label="保留数量">
                  <ElInputNumber
                    v-model="rule.latestPulledN"
                    :min="1"
                    :max="100"
                    style="width: 100%"
                    placeholder="保留最新拉取的 N 个制品"
                  />
                </ElFormItem>

                <ElFormItem v-if="rule.template === 'nDaysSinceLastPush'" label="保留天数">
                  <ElInputNumber
                    v-model="rule.nDaysSinceLastPush"
                    :min="1"
                    :max="365"
                    style="width: 100%"
                    placeholder="保留最近 N 天内推送的制品"
                  />
                </ElFormItem>

                <ElFormItem v-if="rule.template === 'nDaysSinceLastPull'" label="保留天数">
                  <ElInputNumber
                    v-model="rule.nDaysSinceLastPull"
                    :min="1"
                    :max="365"
                    style="width: 100%"
                    placeholder="保留最近 N 天内拉取的制品"
                  />
                </ElFormItem>

                <ElFormItem v-if="rule.template === 'always'" label="说明">
                  <ElAlert type="info" :closable="false" show-icon>
                    此规则将始终保留匹配的制品
                  </ElAlert>
                </ElFormItem>

                <ElFormItem v-if="rule.template === 'recentlyPushed'" label="时间范围">
                  <ElInputNumber
                    v-model="rule.recentDays"
                    :min="1"
                    :max="30"
                    style="width: 100%"
                    placeholder="最近 N 天"
                  />
                </ElFormItem>

                <ElFormItem v-if="rule.template === 'mostPopular'" label="拉取次数">
                  <ElInputNumber
                    v-model="rule.pullCountThreshold"
                    :min="1"
                    :max="1000"
                    style="width: 100%"
                    placeholder="最小拉取次数"
                  />
                </ElFormItem>

                <ElFormItem label="标签选择器">
                  <ElInput
                    v-model="rule.tagSelectors"
                    placeholder="例如: ** 表示所有标签，或 v* 表示以 v 开头"
                  />
                </ElFormItem>

                <ElFormItem label="作用域选择器">
                  <ElInput v-model="rule.scopeSelectors" placeholder="例如: ** 表示所有仓库" />
                </ElFormItem>

                <ElFormItem label="启用状态">
                  <ElSwitch v-model="rule.enabled" active-text="启用" inactive-text="禁用" />
                </ElFormItem>
              </ElForm>
            </div>

            <ElButton type="primary" :icon="Plus" @click="handleAddRule" style="width: 100%">
              添加规则
            </ElButton>
          </div>
        </ElFormItem>

        <ElAlert type="info" :closable="false" show-icon style="margin-top: 16px">
          <template #title>规则说明</template>
          <ul class="tips-list">
            <li>优先级数字越小，优先级越高（0 为最高）</li>
            <li>OR 算法：制品满足任一规则即保留</li>
            <li>AND 算法：制品必须满足所有规则才保留</li>
            <li>标签选择器支持通配符，** 表示匹配所有</li>
          </ul>
        </ElAlert>
      </ElForm>

      <template #footer>
        <ElButton @click="policyDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmitPolicy" :loading="submitting">
          {{ policyMode === 'create' ? '创建' : '保存' }}
        </ElButton>
      </template>
    </ElDialog>

    <!-- 执行策略对话框 -->
    <ElDialog
      v-model="executeDialogVisible"
      title="执行保留策略"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm label-width="100px">
        <ElFormItem label="执行模式">
          <ElRadioGroup v-model="executeForm.dryRun">
            <ElRadio :value="true">预演模式（不实际删除）</ElRadio>
            <ElRadio :value="false">正式执行</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElAlert type="warning" :closable="false" show-icon style="margin-top: 16px">
          <template #title>注意</template>
          <ul class="tips-list">
            <li>预演模式仅模拟执行，不会实际删除制品</li>
            <li>正式执行会根据规则删除制品，操作不可恢复</li>
            <li>建议先使用预演模式验证规则是否正确</li>
          </ul>
        </ElAlert>
      </ElForm>

      <template #footer>
        <ElButton @click="executeDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmitExecute" :loading="executing">
          {{ executeForm.dryRun ? '开始预演' : '正式执行' }}
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { Archive, Plus, Edit, Play, RefreshCw, Clock, Trash2 } from 'lucide-vue-next'
  import {
    listRegistryProjectsApi,
    getRetentionPolicyApi,
    createRetentionPolicyApi,
    updateRetentionPolicyApi,
    executeRetentionPolicyApi,
    listRetentionExecutionsApi,
    type RegistryProject,
    type RetentionPolicy,
    type RetentionRule,
    type RetentionExecution
  } from '@/api'

  interface Props {
    registryUuid: string
  }

  const props = defineProps<Props>()

  // 规则模板定义
  const ruleTemplates = [
    {
      value: 'latestPushedK',
      label: '保留最新推送的 N 个',
      description: '保留最新推送的 N 个制品'
    },
    {
      value: 'latestPulledN',
      label: '保留最新拉取的 N 个',
      description: '保留最新拉取的 N 个制品'
    },
    {
      value: 'nDaysSinceLastPush',
      label: '保留最近推送的',
      description: '保留最近 N 天内推送的制品'
    },
    {
      value: 'nDaysSinceLastPull',
      label: '保留最近拉取的',
      description: '保留最近 N 天内拉取的制品'
    },
    {
      value: 'recentlyPushed',
      label: '保留最近推送的制品',
      description: '保留指定天数内推送的所有制品'
    },
    {
      value: 'mostPopular',
      label: '保留热门制品',
      description: '保留拉取次数超过阈值的制品'
    },
    {
      value: 'always',
      label: '始终保留',
      description: '始终保留匹配的制品'
    }
  ]

  const loading = ref(false)
  const projects = ref<RegistryProject[]>([])
  const selectedProject = ref('')
  const currentPolicy = ref<RetentionPolicy>()

  // 执行历史
  const loadingExecutions = ref(false)
  const executions = ref<RetentionExecution[]>([])
  const executionTotal = ref(0)
  const executionParams = reactive({
    page: 1,
    pageSize: 10
  })

  // 策略对话框
  const policyDialogVisible = ref(false)
  const policyMode = ref<'create' | 'edit'>('create')
  const policyFormRef = ref<FormInstance>()
  const submitting = ref(false)

  interface RuleForm {
    priority: number
    enabled: boolean
    template: string
    latestPushedK?: number
    latestPulledN?: number
    nDaysSinceLastPush?: number
    nDaysSinceLastPull?: number
    recentDays?: number
    pullCountThreshold?: number
    tagSelectors: string
    scopeSelectors: string
  }

  const policyForm = reactive({
    algorithm: 'or',
    schedule: '',
    rules: [] as RuleForm[]
  })

  const policyRules: FormRules = {
    algorithm: [{ required: true, message: '请选择算法', trigger: 'change' }]
  }

  // 执行对话框
  const executeDialogVisible = ref(false)
  const executing = ref(false)
  const executeForm = reactive({
    dryRun: true
  })

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const response = await listRegistryProjectsApi({
        registryUuid: props.registryUuid,
        page: 1,
        pageSize: 100
      })
      projects.value = response.items || []
    } catch (error) {
      console.error('获取项目列表失败:', error)
    }
  }

  // 获取策略
  const fetchPolicy = async () => {
    if (!selectedProject.value) return

    loading.value = true
    try {
      const response = await getRetentionPolicyApi({
        registryUuid: props.registryUuid,
        projectName: selectedProject.value
      })
      currentPolicy.value = response.data
      if (currentPolicy.value) {
        fetchExecutions()
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        currentPolicy.value = undefined
      } else {
        console.error('获取保留策略失败:', error)
      }
    } finally {
      loading.value = false
    }
  }

  // 获取执行历史
  const fetchExecutions = async () => {
    if (!currentPolicy.value) return

    loadingExecutions.value = true
    try {
      const response = await listRetentionExecutionsApi({
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

  // 项目切换
  const handleProjectChange = () => {
    currentPolicy.value = undefined
    executions.value = []
    fetchPolicy()
  }

  // 创建策略
  const handleCreatePolicy = () => {
    policyMode.value = 'create'
    Object.assign(policyForm, {
      algorithm: 'or',
      schedule: '',
      rules: []
    })
    policyDialogVisible.value = true
  }

  // 编辑策略
  const handleEditPolicy = () => {
    if (!currentPolicy.value) return

    policyMode.value = 'edit'
    Object.assign(policyForm, {
      algorithm: currentPolicy.value.algorithm,
      schedule: '',
      rules: currentPolicy.value.rules.map((rule) => {
        const ruleForm: RuleForm = {
          priority: rule.priority,
          enabled: !rule.disabled,
          template: rule.template,
          tagSelectors: rule.tagSelectors,
          scopeSelectors: rule.scopeSelectors
        }

        // 解析参数
        if (rule.params) {
          if (rule.params.latestPushedK) {
            ruleForm.latestPushedK = parseInt(rule.params.latestPushedK)
          }
          if (rule.params.latestPulledN) {
            ruleForm.latestPulledN = parseInt(rule.params.latestPulledN)
          }
          if (rule.params.nDaysSinceLastPush) {
            ruleForm.nDaysSinceLastPush = parseInt(rule.params.nDaysSinceLastPush)
          }
          if (rule.params.nDaysSinceLastPull) {
            ruleForm.nDaysSinceLastPull = parseInt(rule.params.nDaysSinceLastPull)
          }
        }

        return ruleForm
      })
    })
    policyDialogVisible.value = true
  }

  // 添加规则
  const handleAddRule = () => {
    policyForm.rules.push({
      priority: policyForm.rules.length,
      enabled: true,
      template: 'latestPushedK',
      latestPushedK: 10,
      tagSelectors: '**',
      scopeSelectors: '**'
    })
  }

  // 移除规则
  const handleRemoveRule = (index: number) => {
    policyForm.rules.splice(index, 1)
  }

  // 模板变更
  const handleTemplateChange = (rule: RuleForm) => {
    // 重置参数
    delete rule.latestPushedK
    delete rule.latestPulledN
    delete rule.nDaysSinceLastPush
    delete rule.nDaysSinceLastPull
    delete rule.recentDays
    delete rule.pullCountThreshold

    // 设置默认值
    switch (rule.template) {
      case 'latestPushedK':
        rule.latestPushedK = 10
        break
      case 'latestPulledN':
        rule.latestPulledN = 10
        break
      case 'nDaysSinceLastPush':
        rule.nDaysSinceLastPush = 30
        break
      case 'nDaysSinceLastPull':
        rule.nDaysSinceLastPull = 30
        break
      case 'recentlyPushed':
        rule.recentDays = 7
        break
      case 'mostPopular':
        rule.pullCountThreshold = 10
        break
    }
  }

  // 提交策略
  const handleSubmitPolicy = async () => {
    if (!policyFormRef.value) return

    try {
      await policyFormRef.value.validate()

      // 转换规则格式
      const rules: RetentionRule[] = policyForm.rules.map((rule) => {
        const params: Record<string, string> = {}

        if (rule.latestPushedK !== undefined) {
          params.latestPushedK = rule.latestPushedK.toString()
        }
        if (rule.latestPulledN !== undefined) {
          params.latestPulledN = rule.latestPulledN.toString()
        }
        if (rule.nDaysSinceLastPush !== undefined) {
          params.nDaysSinceLastPush = rule.nDaysSinceLastPush.toString()
        }
        if (rule.nDaysSinceLastPull !== undefined) {
          params.nDaysSinceLastPull = rule.nDaysSinceLastPull.toString()
        }
        if (rule.recentDays !== undefined) {
          params.recentDays = rule.recentDays.toString()
        }
        if (rule.pullCountThreshold !== undefined) {
          params.pullCountThreshold = rule.pullCountThreshold.toString()
        }

        return {
          priority: rule.priority,
          disabled: !rule.enabled,
          action: 'retain',
          template: rule.template,
          params,
          tagSelectors: rule.tagSelectors,
          scopeSelectors: rule.scopeSelectors
        }
      })

      submitting.value = true

      if (policyMode.value === 'create') {
        await createRetentionPolicyApi({
          registryUuid: props.registryUuid,
          projectName: selectedProject.value,
          algorithm: policyForm.algorithm,
          rules,
          schedule: policyForm.schedule || undefined
        })
        ElMessage.success('创建成功')
      } else {
        await updateRetentionPolicyApi({
          registryUuid: props.registryUuid,
          policyId: currentPolicy.value!.id,
          algorithm: policyForm.algorithm,
          rules,
          schedule: policyForm.schedule || undefined
        })
        ElMessage.success('保存成功')
      }

      policyDialogVisible.value = false
      fetchPolicy()
    } catch (error: any) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  }

  // 执行策略
  const handleExecutePolicy = () => {
    executeForm.dryRun = true
    executeDialogVisible.value = true
  }

  // 提交执行
  const handleSubmitExecute = async () => {
    if (!currentPolicy.value) return

    executing.value = true
    try {
      const response = await executeRetentionPolicyApi({
        registryUuid: props.registryUuid,
        policyId: currentPolicy.value.id,
        dryRun: executeForm.dryRun
      })

      ElMessage.success({
        message: `策略已${executeForm.dryRun ? '开始预演' : '开始执行'}，执行 ID: ${response.executionId}`,
        duration: 5000,
        showClose: true
      })
      executeDialogVisible.value = false

      setTimeout(() => {
        fetchExecutions()
      }, 1000)
    } catch (error: any) {
      console.error('执行策略失败:', error)
    } finally {
      executing.value = false
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

  // 获取规则描述
  const getRuleDescription = (rule: RetentionRule) => {
    const template = ruleTemplates.find((t) => t.value === rule.template)
    if (!template) return rule.template

    let desc = template.label
    if (rule.params) {
      if (rule.params.latestPushedK) {
        desc += ` (${rule.params.latestPushedK} 个)`
      } else if (rule.params.latestPulledN) {
        desc += ` (${rule.params.latestPulledN} 个)`
      } else if (rule.params.nDaysSinceLastPush) {
        desc += ` (${rule.params.nDaysSinceLastPush} 天)`
      } else if (rule.params.nDaysSinceLastPull) {
        desc += ` (${rule.params.nDaysSinceLastPull} 天)`
      } else if (rule.params.recentDays) {
        desc += ` (${rule.params.recentDays} 天)`
      } else if (rule.params.pullCountThreshold) {
        desc += ` (≥${rule.params.pullCountThreshold} 次)`
      }
    }
    return desc
  }

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  onMounted(() => {
    fetchProjects()
  })
</script>

<style lang="scss" scoped>
  .retention-policy {
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

    .policy-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
      }

      .rules-section,
      .history-section {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--el-border-color-lighter);

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .pagination-wrapper {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--el-border-color-lighter);
        }
      }
    }

    .rules-editor {
      width: 100%;

      .rule-item {
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        background: var(--el-fill-color-lighter);

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--el-border-color-lighter);

          .rule-title {
            font-weight: 600;
            font-size: 14px;
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    .template-option {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .template-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .template-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .tips-list {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      line-height: 1.8;

      li {
        margin-bottom: 4px;
      }
    }
  }
</style>
