<template>
  <div class="alert-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-icon">
          <ElIcon :size="22"><Bell /></ElIcon>
        </div>
        <div class="title-content">
          <h1 class="page-title">告警规则管理</h1>
          <p class="page-description">管理 Prometheus 告警规则，支持批量导入导出和一键部署</p>
        </div>
      </div>
      <div class="header-actions">
        <ElButton type="primary" plain @click="handleImport">
          <ElIcon><Upload /></ElIcon>
          批量导入
        </ElButton>
        <ElButton plain @click="handleExportAll">
          <ElIcon><Download /></ElIcon>
          导出全部
        </ElButton>
        <ElButton type="warning" plain @click="handleDeployAll">
          <ElIcon><Position /></ElIcon>
          部署全部
        </ElButton>
      </div>
    </div>

    <!-- 选择器工具栏 -->
    <div class="selector-toolbar">
      <div class="selector-group">
        <!-- 文件选择器 -->
        <div class="selector-item">
          <span class="selector-label">
            <ElIcon><Document /></ElIcon>
            规则文件
          </span>
          <ElSelect
            v-model="selectedFileId"
            placeholder="选择规则文件"
            clearable
            class="file-selector"
            :loading="fileLoading"
            @change="handleFileChange"
          >
            <template #header>
              <div class="selector-header">
                <div class="search-wrapper">
                  <ElIcon class="search-icon"><Search /></ElIcon>
                  <input
                    v-model="fileSearchKeyword"
                    class="search-input-native"
                    placeholder="搜索文件名称或代码..."
                    @click.stop
                  />
                  <ElIcon v-if="fileSearchKeyword" class="clear-icon" @click.stop="clearFileSearch">
                    <CircleClose />
                  </ElIcon>
                </div>
                <div class="header-divider"></div>
                <div class="header-action" @click.stop="handleAddFile">
                  <ElIcon class="action-icon"><Plus /></ElIcon>
                  <span>新建文件</span>
                </div>
              </div>
            </template>
            <ElOption
              v-for="file in filteredFileList"
              :key="file.id"
              :label="file.fileName"
              :value="file.id"
            >
              <div class="file-option">
                <div class="file-option-main">
                  <span class="file-name">{{ file.fileName }}</span>
                  <ElTag size="small" :type="file.isEnabled ? 'success' : 'info'" effect="light">
                    {{ file.isEnabled ? '启用' : '禁用' }}
                  </ElTag>
                </div>
                <div class="file-option-meta">
                  <span class="file-code">{{ file.fileCode }}</span>
                  <span class="file-stats">
                    <ElIcon :size="12"><Folder /></ElIcon>{{ file.groupCount || 0 }}
                    <ElIcon :size="12"><Bell /></ElIcon>{{ file.ruleCount || 0 }}
                  </span>
                </div>
                <div class="file-option-actions" @click.stop>
                  <ElButton size="small" type="primary" text @click.stop="handleEditFile(file)">
                    <ElIcon><Edit /></ElIcon>
                  </ElButton>
                  <ElButton size="small" type="danger" text @click.stop="handleDeleteFile(file)">
                    <ElIcon><Delete /></ElIcon>
                  </ElButton>
                </div>
              </div>
            </ElOption>
          </ElSelect>
        </div>

        <!-- 分组选择器 -->
        <div class="selector-item">
          <span class="selector-label">
            <ElIcon><FolderOpened /></ElIcon>
            告警分组
          </span>
          <ElSelect
            v-model="selectedGroupId"
            placeholder="选择告警分组"
            clearable
            class="group-selector"
            :loading="groupLoading"
            :disabled="!selectedFile"
            @change="handleGroupChange"
          >
            <template #header>
              <div class="selector-header">
                <div class="search-wrapper">
                  <ElIcon class="search-icon"><Search /></ElIcon>
                  <input
                    v-model="groupSearchKeyword"
                    class="search-input-native"
                    placeholder="搜索分组名称..."
                    @click.stop
                    @input="handleGroupSearch"
                  />
                  <ElIcon
                    v-if="groupSearchKeyword"
                    class="clear-icon"
                    @click.stop="clearGroupSearch"
                  >
                    <CircleClose />
                  </ElIcon>
                </div>
                <div class="header-divider"></div>
                <div
                  class="header-action"
                  :class="{ disabled: !selectedFile }"
                  @click.stop="handleAddGroup"
                >
                  <ElIcon class="action-icon"><Plus /></ElIcon>
                  <span>新建分组</span>
                </div>
              </div>
            </template>
            <ElOption
              v-for="group in groupList"
              :key="group.id"
              :label="group.groupName"
              :value="group.id"
            >
              <div class="group-option">
                <div class="group-option-main">
                  <span class="group-name">{{ group.groupName }}</span>
                  <ElTag size="small" type="info" effect="light">
                    {{ group.ruleCount || 0 }} 条规则
                  </ElTag>
                </div>
                <div class="group-option-meta">
                  <span class="group-code">{{ group.groupCode }}</span>
                  <span class="group-interval">
                    <ElIcon :size="12"><Timer /></ElIcon>{{ group.interval }}
                  </span>
                </div>
                <div class="group-option-actions" @click.stop>
                  <ElButton size="small" type="primary" text @click.stop="handleEditGroup(group)">
                    <ElIcon><Edit /></ElIcon>
                  </ElButton>
                  <ElButton size="small" type="danger" text @click.stop="handleDeleteGroup(group)">
                    <ElIcon><Delete /></ElIcon>
                  </ElButton>
                </div>
              </div>
            </ElOption>
            <template v-if="groupPagination.total > groupPagination.size" #footer>
              <div class="selector-footer">
                <ElPagination
                  v-model:current-page="groupPagination.current"
                  :total="groupPagination.total"
                  :page-size="groupPagination.size"
                  layout="prev, pager, next"
                  small
                  @current-change="loadGroupList"
                />
              </div>
            </template>
          </ElSelect>
        </div>
      </div>

      <!-- 文件级操作 -->
      <div v-if="selectedFile" class="file-actions">
        <ElButton plain size="default" @click="handleExport">
          <ElIcon><Download /></ElIcon>
          导出选中文件
        </ElButton>
        <ElButton type="success" size="default" @click="handleDeploy">
          <ElIcon><Position /></ElIcon>
          部署选中文件
        </ElButton>
      </div>
    </div>

    <!-- 规则表格区域 -->
    <div class="rule-section">
      <!-- 空状态：未选择分组 -->
      <div v-if="!selectedGroup" class="empty-state">
        <div class="empty-icon-wrapper">
          <ElIcon :size="56"><FolderOpened /></ElIcon>
        </div>
        <h3 class="empty-title">{{ !selectedFile ? '请选择规则文件' : '请选择告警分组' }}</h3>
        <p class="empty-desc">{{
          !selectedFile
            ? '从上方下拉框中选择一个规则文件开始'
            : '从上方下拉框中选择一个分组以查看规则'
        }}</p>
      </div>

      <!-- 规则内容 -->
      <template v-else>
        <!-- 规则搜索和操作栏 -->
        <div class="rule-toolbar">
          <div class="rule-search">
            <ElInput
              v-model="ruleSearchForm.ruleNameCn"
              placeholder="规则名称(中文)"
              clearable
              :prefix-icon="Search"
              class="search-input"
            />
            <ElInput
              v-model="ruleSearchForm.alertName"
              placeholder="告警名称(英文)"
              clearable
              :prefix-icon="Search"
              class="search-input"
            />
            <ElSelect
              v-model="ruleSearchForm.severity"
              placeholder="严重程度"
              clearable
              class="search-select"
            >
              <ElOption label="严重" value="critical">
                <span class="severity-option critical"> <span class="dot"></span>严重 </span>
              </ElOption>
              <ElOption label="警告" value="warning">
                <span class="severity-option warning"> <span class="dot"></span>警告 </span>
              </ElOption>
              <ElOption label="提示" value="info">
                <span class="severity-option info"> <span class="dot"></span>提示 </span>
              </ElOption>
            </ElSelect>
            <ElButton type="primary" @click="handleRuleSearch">
              <ElIcon><Search /></ElIcon>
              查询
            </ElButton>
            <ElButton @click="handleRuleSearchReset">
              <ElIcon><RefreshRight /></ElIcon>
              重置
            </ElButton>
          </div>
          <div class="rule-actions">
            <ElButton type="primary" @click="handleAddRule">
              <ElIcon><Plus /></ElIcon>
              添加规则
            </ElButton>
          </div>
        </div>

        <!-- 规则表格 -->
        <div class="rule-table-container">
          <ElTable
            v-loading="ruleLoading"
            :data="ruleList"
            stripe
            border
            style="width: 100%"
            :header-cell-style="{ background: '#f8fafc', color: '#334155', fontWeight: 600 }"
          >
            <ElTableColumn type="selection" width="48" fixed="left" align="center" />
            <ElTableColumn prop="ruleNameCn" label="规则中文名" min-width="180" fixed="left">
              <template #default="{ row }">
                <span class="rule-name" :title="row.ruleNameCn">{{ row.ruleNameCn }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="alertName" label="告警名称" min-width="200">
              <template #default="{ row }">
                <code class="alert-name-code" :title="row.alertName">{{ row.alertName }}</code>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="severity" label="严重程度" width="120" align="center">
              <template #default="{ row }">
                <div class="severity-tag" :class="row.severity">
                  <span class="dot"></span>
                  <span class="label">{{ getSeverityLabel(row.severity) }}</span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="forDuration" label="持续时间" width="100" align="center">
              <template #default="{ row }">
                <ElTag size="small" type="info" effect="plain">{{ row.forDuration }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="isEnabled" label="状态" width="80" align="center">
              <template #default="{ row }">
                <ElTag size="small" :type="row.isEnabled ? 'success' : 'info'" effect="light">
                  {{ row.isEnabled ? '启用' : '禁用' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="expr" label="PromQL 表达式" min-width="320">
              <template #default="{ row }">
                <div class="expr-wrapper">
                  <code class="expr-code" :title="row.expr">{{ row.expr }}</code>
                  <ElTooltip content="复制表达式" placement="top">
                    <ElButton
                      size="small"
                      type="primary"
                      text
                      circle
                      class="copy-btn"
                      @click.stop="handleCopyExpr(row.expr)"
                    >
                      <ElIcon :size="14"><CopyDocument /></ElIcon>
                    </ElButton>
                  </ElTooltip>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="summary" label="告警摘要" min-width="240">
              <template #default="{ row }">
                <span class="summary-text" :title="row.summary">{{ row.summary }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="180" fixed="right" align="center">
              <template #default="{ row }">
                <div class="table-actions">
                  <ElButton link type="primary" size="small" @click="handleViewRule(row)">
                    查看
                  </ElButton>
                  <ElDivider direction="vertical" />
                  <ElButton link type="primary" size="small" @click="handleEditRule(row)">
                    编辑
                  </ElButton>
                  <ElDivider direction="vertical" />
                  <ElButton link type="danger" size="small" @click="handleDeleteRule(row)">
                    删除
                  </ElButton>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>

          <!-- 分页 -->
          <div class="table-pagination">
            <div class="pagination-info">
              共 <strong>{{ rulePagination.total }}</strong> 条规则
            </div>
            <ElPagination
              v-model:current-page="rulePagination.current"
              v-model:page-size="rulePagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="rulePagination.total"
              layout="sizes, prev, pager, next, jumper"
              background
              @size-change="handleRuleSizeChange"
              @current-change="handleRulePageChange"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- 弹窗组件 -->
    <FileForm
      v-model="fileFormVisible"
      :form-data="currentFile"
      :is-edit="isEditFile"
      @success="handleFileFormSuccess"
    />
    <GroupForm
      v-model="groupFormVisible"
      :form-data="currentGroup"
      :is-edit="isEditGroup"
      :file-id="selectedFile?.id"
      @success="handleGroupFormSuccess"
    />
    <RuleForm
      v-model="ruleFormVisible"
      :form-data="currentRule"
      :is-edit="isEditRule"
      :group-id="selectedGroup?.id"
      @success="handleRuleFormSuccess"
    />
    <ImportDialog v-model="importVisible" @success="handleImportSuccess" />
    <DeployDialog
      v-model="deployVisible"
      :file-id="selectedFile?.id"
      :deploy-all="isDeployAll"
      @success="handleDeploySuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import {
    ElMessage,
    ElMessageBox,
    ElTable,
    ElTableColumn,
    ElPagination,
    ElDivider
  } from 'element-plus'
  import {
    Plus,
    Edit,
    Delete,
    Upload,
    Download,
    Position,
    Document,
    FolderOpened,
    Folder,
    Bell,
    CopyDocument,
    Search,
    RefreshRight,
    Timer,
    CircleClose
  } from '@element-plus/icons-vue'
  import FileForm from './components/FileForm.vue'
  import GroupForm from './components/GroupForm.vue'
  import RuleForm from './components/RuleForm.vue'
  import ImportDialog from './components/ImportDialog.vue'
  import DeployDialog from './components/DeployDialog.vue'
  import {
    listAlertRuleFileApi,
    deleteAlertRuleFileApi,
    searchAlertRuleGroupApi,
    deleteAlertRuleGroupApi,
    searchAlertRuleApi,
    deleteAlertRuleApi,
    batchExportAlertRulesApi,
    exportAllAlertRulesApi,
    type AlertRuleFile,
    type AlertRuleGroup,
    type AlertRule
  } from '@/api/manager/alert'

  defineOptions({ name: 'AlertManagement' })

  // ==================== 文件相关 ====================
  const fileList = ref<AlertRuleFile[]>([])
  const fileLoading = ref(false)
  const fileSearchKeyword = ref('')
  const selectedFileId = ref<number | null>(null)
  const selectedFile = computed(
    () => fileList.value.find((f) => f.id === selectedFileId.value) || null
  )

  const fileFormVisible = ref(false)
  const isEditFile = ref(false)
  const currentFile = ref<Partial<AlertRuleFile>>({})

  const filteredFileList = computed(() => {
    if (!fileSearchKeyword.value) return fileList.value
    const keyword = fileSearchKeyword.value.toLowerCase()
    return fileList.value.filter(
      (file) =>
        file.fileName.toLowerCase().includes(keyword) ||
        file.fileCode.toLowerCase().includes(keyword)
    )
  })

  const loadFileList = async () => {
    try {
      fileLoading.value = true
      const res = await listAlertRuleFileApi()
      fileList.value = res || []

      if (selectedFileId.value) {
        const found = fileList.value.find((f) => f.id === selectedFileId.value)
        if (!found) {
          selectedFileId.value = null
          groupList.value = []
          ruleList.value = []
        }
      }
    } catch (error) {
      console.error('加载文件列表失败:', error)
    } finally {
      fileLoading.value = false
    }
  }

  const handleFileChange = (fileId: number | null) => {
    selectedGroupId.value = null
    ruleList.value = []
    groupPagination.current = 1
    if (fileId) {
      loadGroupList()
    } else {
      groupList.value = []
    }
  }

  const clearFileSearch = () => {
    fileSearchKeyword.value = ''
  }

  const handleAddFile = () => {
    isEditFile.value = false
    currentFile.value = {}
    fileFormVisible.value = true
  }

  const handleEditFile = (file: AlertRuleFile) => {
    isEditFile.value = true
    currentFile.value = { ...file }
    fileFormVisible.value = true
  }

  const handleDeleteFile = async (file: AlertRuleFile) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除文件 "${file.fileName}" 吗？该操作将同时删除文件下的所有分组和规则。`,
        '删除确认',
        {
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button--danger'
        }
      )

      await deleteAlertRuleFileApi(file.id, true)
      ElMessage.success('删除成功')

      if (selectedFileId.value === file.id) {
        selectedFileId.value = null
        groupList.value = []
        ruleList.value = []
      }

      await loadFileList()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除文件失败:', error)
      }
    }
  }

  const handleFileFormSuccess = () => {
    loadFileList()
  }

  // ==================== 分组相关 ====================
  const groupList = ref<AlertRuleGroup[]>([])
  const groupLoading = ref(false)
  const groupSearchKeyword = ref('')
  const selectedGroupId = ref<number | null>(null)
  const selectedGroup = computed(
    () => groupList.value.find((g) => g.id === selectedGroupId.value) || null
  )

  const groupPagination = reactive({
    current: 1,
    size: 20,
    total: 0
  })

  const groupFormVisible = ref(false)
  const isEditGroup = ref(false)
  const currentGroup = ref<Partial<AlertRuleGroup>>({})

  const loadGroupList = async () => {
    if (!selectedFile.value) return

    try {
      groupLoading.value = true
      const res = await searchAlertRuleGroupApi({
        fileId: selectedFile.value.id,
        page: groupPagination.current,
        pageSize: groupPagination.size,
        groupName: groupSearchKeyword.value || undefined
      })

      groupList.value = res.items || []
      groupPagination.total = res.total

      if (selectedGroupId.value) {
        const found = groupList.value.find((g) => g.id === selectedGroupId.value)
        if (!found) {
          selectedGroupId.value = null
          ruleList.value = []
        }
      }
    } catch (error) {
      console.error('加载分组列表失败:', error)
    } finally {
      groupLoading.value = false
    }
  }

  const handleGroupSearch = () => {
    groupPagination.current = 1
    loadGroupList()
  }

  const clearGroupSearch = () => {
    groupSearchKeyword.value = ''
    handleGroupSearch()
  }

  const handleGroupChange = (groupId: number | null) => {
    rulePagination.current = 1
    if (groupId) {
      loadRuleList()
    } else {
      ruleList.value = []
    }
  }

  const handleAddGroup = () => {
    if (!selectedFile.value) {
      ElMessage.warning('请先选择规则文件')
      return
    }
    isEditGroup.value = false
    currentGroup.value = {}
    groupFormVisible.value = true
  }

  const handleEditGroup = (group: AlertRuleGroup) => {
    isEditGroup.value = true
    currentGroup.value = { ...group }
    groupFormVisible.value = true
  }

  const handleDeleteGroup = async (group: AlertRuleGroup) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除分组 "${group.groupName}" 吗？该操作将同时删除分组下的所有规则。`,
        '删除确认',
        {
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button--danger'
        }
      )

      await deleteAlertRuleGroupApi(group.id, true)
      ElMessage.success('删除成功')

      if (selectedGroupId.value === group.id) {
        selectedGroupId.value = null
        ruleList.value = []
      }

      await loadGroupList()
      await loadFileList()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除分组失败:', error)
      }
    }
  }

  const handleGroupFormSuccess = () => {
    loadGroupList()
    loadFileList()
  }

  // ==================== 规则相关 ====================
  const ruleList = ref<AlertRule[]>([])
  const ruleLoading = ref(false)

  const rulePagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const ruleSearchForm = ref({
    ruleNameCn: '',
    alertName: '',
    severity: '' as '' | 'critical' | 'warning' | 'info'
  })

  const ruleFormVisible = ref(false)
  const isEditRule = ref(false)
  const currentRule = ref<Partial<AlertRule>>({})

  const loadRuleList = async () => {
    if (!selectedGroup.value) return

    try {
      ruleLoading.value = true
      const res = await searchAlertRuleApi({
        groupId: selectedGroup.value.id,
        page: rulePagination.current,
        pageSize: rulePagination.size,
        ruleNameCn: ruleSearchForm.value.ruleNameCn || undefined,
        alertName: ruleSearchForm.value.alertName || undefined,
        severity: ruleSearchForm.value.severity || undefined
      })

      ruleList.value = res.items || []
      rulePagination.total = res.total
    } catch (error) {
      console.error('加载规则列表失败:', error)
    } finally {
      ruleLoading.value = false
    }
  }

  const handleAddRule = () => {
    if (!selectedGroup.value) {
      ElMessage.warning('请先选择告警分组')
      return
    }
    isEditRule.value = false
    currentRule.value = {}
    ruleFormVisible.value = true
  }

  const handleViewRule = (rule: AlertRule) => {
    isEditRule.value = true
    currentRule.value = { ...rule }
    ruleFormVisible.value = true
  }

  const handleEditRule = (rule: AlertRule) => {
    isEditRule.value = true
    currentRule.value = { ...rule }
    ruleFormVisible.value = true
  }

  const handleDeleteRule = async (rule: AlertRule) => {
    try {
      await ElMessageBox.confirm(`确定要删除规则 "${rule.ruleNameCn}" 吗？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      })

      await deleteAlertRuleApi(rule.id)
      ElMessage.success('删除成功')
      await loadRuleList()
      await loadGroupList()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除规则失败:', error)
      }
    }
  }

  const handleRuleFormSuccess = () => {
    loadRuleList()
    loadGroupList()
  }

  const handleRuleSearch = () => {
    rulePagination.current = 1
    loadRuleList()
  }

  const handleRuleSearchReset = () => {
    ruleSearchForm.value = {
      ruleNameCn: '',
      alertName: '',
      severity: ''
    }
    rulePagination.current = 1
    loadRuleList()
  }

  const handleRuleSizeChange = (size: number) => {
    rulePagination.size = size
    rulePagination.current = 1
    loadRuleList()
  }

  const handleRulePageChange = (page: number) => {
    rulePagination.current = page
    loadRuleList()
  }

  const getSeverityLabel = (severity: string) => {
    const labelMap: Record<string, string> = {
      critical: '严重',
      warning: '警告',
      info: '提示'
    }
    return labelMap[severity] || severity
  }

  const handleCopyExpr = async (expr: string) => {
    try {
      await navigator.clipboard.writeText(expr)
      ElMessage.success('已复制到剪贴板')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = expr
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      ElMessage.success('已复制到剪贴板')
    }
  }

  // ==================== 批量操作 ====================
  const importVisible = ref(false)
  const deployVisible = ref(false)
  const isDeployAll = ref(false)

  const handleImport = () => {
    importVisible.value = true
  }

  const handleExport = async () => {
    if (!selectedFile.value) {
      ElMessage.warning('请先选择规则文件')
      return
    }

    try {
      const res = await batchExportAlertRulesApi({ fileId: selectedFile.value.id })
      downloadYaml(res.yamlStr, `${selectedFile.value.fileCode}_alert_rules`)
      ElMessage.success('导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('导出失败')
    }
  }

  const handleExportAll = async () => {
    try {
      const res = await exportAllAlertRulesApi()
      downloadYaml(res.yamlStr, 'all_alert_rules')
      ElMessage.success('导出全部成功')
    } catch (error) {
      console.error('导出全部失败:', error)
      ElMessage.error('导出全部失败')
    }
  }

  const downloadYaml = (yamlStr: string, filename: string) => {
    const blob = new Blob([yamlStr], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${Date.now()}.yaml`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeploy = () => {
    if (!selectedFile.value) {
      ElMessage.warning('请先选择规则文件')
      return
    }
    isDeployAll.value = false
    deployVisible.value = true
  }

  const handleDeployAll = () => {
    isDeployAll.value = true
    deployVisible.value = true
  }

  const handleImportSuccess = () => {
    loadFileList()
    if (selectedFile.value) {
      loadGroupList()
    }
  }

  const handleDeploySuccess = () => {
    ElMessage.success('部署成功')
  }

  // ==================== 生命周期 ====================
  onMounted(() => {
    loadFileList()
  })
</script>

<style lang="scss" scoped>
  .alert-management-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f0f2f5;
    padding: 20px;
    box-sizing: border-box;
    gap: 16px;

    // 页面头部
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .title-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          color: #fff;
        }

        .title-content {
          .page-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 4px 0;
          }

          .page-description {
            font-size: 13px;
            color: #64748b;
            margin: 0;
          }
        }
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

    // 选择器工具栏
    .selector-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      flex-wrap: wrap;
      gap: 16px;

      .selector-group {
        display: flex;
        align-items: center;
        gap: 24px;

        .selector-item {
          display: flex;
          align-items: center;
          gap: 10px;

          .selector-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #475569;
            white-space: nowrap;

            .el-icon {
              color: #667eea;
            }
          }

          .file-selector,
          .group-selector {
            width: 320px;
          }
        }
      }

      .file-actions {
        display: flex;
        gap: 10px;
      }
    }

    // 选择器头部
    .selector-header {
      display: flex;
      align-items: center;
      padding: 12px;
      background: linear-gradient(to bottom, #fafbfc, #f5f7fa);
      border-bottom: 1px solid #ebeef5;
      gap: 0;

      .search-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        background: #fff;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        padding: 0 12px;
        height: 36px;
        transition: all 0.2s ease;

        &:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          color: #a8abb2;
          font-size: 15px;
          flex-shrink: 0;
        }

        .search-input-native {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 0 10px;
          font-size: 13px;
          color: #303133;
          height: 100%;

          &::placeholder {
            color: #a8abb2;
          }
        }

        .clear-icon {
          color: #c0c4cc;
          font-size: 14px;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.2s;

          &:hover {
            color: #909399;
          }
        }
      }

      .header-divider {
        width: 1px;
        height: 24px;
        background: #e4e7ed;
        margin: 0 12px;
        flex-shrink: 0;
      }

      .header-action {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        transition: all 0.2s ease;
        flex-shrink: 0;

        .action-icon {
          font-size: 14px;
        }

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        &:active {
          transform: translateY(0);
        }

        &.disabled {
          background: #e4e7ed;
          color: #a8abb2;
          cursor: not-allowed;
          box-shadow: none;

          &:hover {
            transform: none;
            box-shadow: none;
          }
        }
      }
    }

    // 选择器底部
    .selector-footer {
      padding: 8px 12px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: center;
    }

    // 文件选项
    .file-option,
    .group-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 4px;
      width: 100%;
      border-radius: 6px;
      transition: background 0.15s;

      &-main {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        min-width: 0;

        .file-name,
        .group-name {
          font-weight: 500;
          color: #303133;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
        }
      }

      &-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-left: 12px;

        .file-code,
        .group-code {
          font-size: 12px;
          color: #909399;
          font-family: 'SF Mono', Monaco, Consolas, monospace;
          background: #f4f4f5;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .file-stats,
        .group-interval {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #909399;

          .el-icon {
            margin-right: 2px;
            color: #c0c4cc;
          }
        }

        .file-stats {
          gap: 10px;
        }
      }

      &-actions {
        display: flex;
        gap: 4px;
        margin-left: 10px;
        opacity: 0;
        transition: opacity 0.2s;

        .el-button {
          padding: 4px;

          &:hover {
            background: rgba(102, 126, 234, 0.1);
          }
        }
      }

      &:hover &-actions {
        opacity: 1;
      }
    }

    // 规则区域
    .rule-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      min-height: 0;

      // 空状态
      .empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;

        .empty-icon-wrapper {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-radius: 50%;
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #334155;
          margin: 0 0 8px 0;
        }

        .empty-desc {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }
      }

      // 规则工具栏
      .rule-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #f1f5f9;
        background: #fafbfc;
        flex-wrap: wrap;
        gap: 12px;

        .rule-search {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;

          .search-input {
            width: 180px;
          }

          .search-select {
            width: 130px;
          }
        }

        .rule-actions {
          display: flex;
          gap: 10px;
        }
      }

      // 规则表格容器
      .rule-table-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 16px 20px;

        :deep(.el-table) {
          border-radius: 8px;
          overflow: hidden;

          .el-table__header-wrapper th {
            background: #f8fafc !important;
          }
        }

        .rule-name {
          font-weight: 500;
          color: #334155;
        }

        .alert-name-code {
          font-family: 'SF Mono', Monaco, Consolas, monospace;
          font-size: 12px;
          color: #475569;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .severity-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          &.critical {
            background: #fef2f2;
            color: #dc2626;

            .dot {
              background: #dc2626;
              box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
            }
          }

          &.warning {
            background: #fffbeb;
            color: #d97706;

            .dot {
              background: #d97706;
              box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.2);
            }
          }

          &.info {
            background: #f0f9ff;
            color: #0284c7;

            .dot {
              background: #0284c7;
              box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
            }
          }
        }

        .expr-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;

          .expr-code {
            flex: 1;
            font-family: 'SF Mono', Monaco, Consolas, monospace;
            font-size: 12px;
            color: #475569;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .copy-btn {
            flex-shrink: 0;
            opacity: 0.6;
            transition: opacity 0.2s;

            &:hover {
              opacity: 1;
            }
          }
        }

        .summary-text {
          font-size: 13px;
          color: #64748b;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .table-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .table-pagination {
          padding: 16px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f1f5f9;
          margin-top: 16px;

          .pagination-info {
            font-size: 13px;
            color: #64748b;

            strong {
              color: #334155;
              font-weight: 600;
            }
          }
        }
      }
    }

    // 严重程度选项
    .severity-option {
      display: flex;
      align-items: center;
      gap: 8px;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      &.critical .dot {
        background: #dc2626;
      }

      &.warning .dot {
        background: #d97706;
      }

      &.info .dot {
        background: #0284c7;
      }
    }
  }

  // 深度样式覆盖
  :deep(.el-select-dropdown__item) {
    height: auto;
    padding: 6px 12px;
    line-height: 1.4;

    &:hover {
      background: #f5f7fa;

      .file-option-actions,
      .group-option-actions {
        opacity: 1;
      }
    }

    &.is-selected {
      background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.08) 0%,
        rgba(118, 75, 162, 0.08) 100%
      );

      .file-name,
      .group-name {
        color: #667eea;
      }
    }
  }

  :deep(.el-select-dropdown__header) {
    padding: 0;
  }

  :deep(.el-select-dropdown__footer) {
    padding: 0;
  }

  :deep(.el-select-dropdown) {
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
    border: 1px solid #ebeef5;
    overflow: hidden;
  }

  :deep(.el-select-dropdown__wrap) {
    max-height: 320px;
  }
</style>
