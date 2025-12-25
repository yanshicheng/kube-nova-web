<template>
  <ElDialog
    :model-value="visible"
    :title="dialogType === 'add' ? '创建 PrometheusRule' : '编辑 PrometheusRule'"
    width="1000px"
    top="2vh"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
    @closed="handleClosed"
  >
    <!-- 编辑模式切换 -->
    <div class="mode-switch">
      <ElRadioGroup v-model="editMode" size="small">
        <ElRadioButton value="form">
          <div class="radio-content">
            <FormInput :size="13" />
            <span>表单编辑</span>
          </div>
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <div class="radio-content">
            <Code :size="13" />
            <span>YAML 编辑</span>
          </div>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 加载状态提示 -->
    <div v-if="dataLoading" style="text-align: center; padding: 30px">
      <ElSkeleton :rows="6" animated />
      <div style="margin-top: 12px; color: #909399; font-size: 13px">
        正在加载 PrometheusRule 配置...
      </div>
    </div>

    <!-- 表单模式 -->
    <div v-else-if="editMode === 'form'" class="form-content">
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="140px" size="">
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-header">
            <Database :size="14" />
            <span>基础信息</span>
          </div>

          <ElFormItem label="命名空间" prop="namespace" required>
            <ElSelect
              v-model="formData.namespace"
              placeholder="选择命名空间"
              filterable
              style="width: 100%"
              :loading="namespaceLoading"
              @visible-change="handleNamespaceVisibleChange"
            >
              <template #prefix>
                <FolderTree :size="14" />
              </template>
              <ElOption v-for="ns in namespaces" :key="ns" :label="ns" :value="ns">
                <div class="option-item">
                  <span class="option-name">{{ ns }}</span>
                  <ElTag v-if="ns === 'monitoring'" type="success" size="small">推荐</ElTag>
                </div>
              </ElOption>
            </ElSelect>
            <div class="form-tip">
              <InfoIcon :size="12" />
              <span>命名空间选择后具有最高优先级，不会被 YAML 覆盖</span>
            </div>
          </ElFormItem>

          <ElFormItem label="Rule 名称" prop="name" required>
            <ElInput
              v-model="formData.name"
              placeholder="例如: app-alerts"
              :disabled="dialogType === 'edit'"
              maxlength="63"
              show-word-limit
            >
              <template #suffix>
                <ElTooltip content="小写字母、数字、连字符，以字母或数字开头结尾" placement="top">
                  <HelpCircle :size="13" class="help-icon" />
                </ElTooltip>
              </template>
            </ElInput>
          </ElFormItem>
        </div>

        <!-- 规则组 -->
        <div class="form-section">
          <div class="section-header">
            <Layers :size="14" />
            <span>规则组</span>
          </div>

          <div class="groups-container">
            <div v-for="(group, groupIndex) in formData.groups" :key="groupIndex" class="group-card">
              <div class="group-card-header">
                <span class="group-title">规则组 {{ groupIndex + 1 }}</span>
                <ElButton
                  type="danger"
                  :icon="Trash2"
                  circle
                  size="small"
                  @click="removeGroup(groupIndex)"
                />
              </div>

              <div class="group-card-body">
                <!-- 组名称和间隔 -->
                <div class="two-columns">
                  <div class="form-item">
                    <label class="field-label">
                      <span style="color: #f56c6c">* </span>
                      组名称
                    </label>
                    <ElInput v-model="group.name" placeholder="例如: my-alerts" />
                  </div>

                  <div class="form-item">
                    <label class="field-label">评估间隔</label>
                    <ElInput v-model="group.interval" placeholder="例如: 30s, 1m">
                      <template #append>秒/分钟</template>
                    </ElInput>
                  </div>
                </div>

                <!-- 规则列表 -->
                <div class="rules-section">
                  <div class="rules-header">
                    <span>规则配置</span>
                    <ElSpace>
                      <ElButton
                        type="primary"
                        :icon="Plus"
                        size="small"
                        plain
                        @click="addAlertRule(groupIndex)"
                      >
                        添加告警规则
                      </ElButton>
                      <ElButton
                        type="success"
                        :icon="Plus"
                        size="small"
                        plain
                        @click="addRecordRule(groupIndex)"
                      >
                        添加记录规则
                      </ElButton>
                    </ElSpace>
                  </div>

                  <div
                    v-for="(rule, ruleIndex) in group.rules"
                    :key="ruleIndex"
                    class="rule-card"
                  >
                    <div class="rule-card-header">
                      <div class="rule-type-badge">
                        <AlertTriangle v-if="rule.type === 'alert'" :size="14" />
                        <FileText v-else :size="14" />
                        <span>{{ rule.type === 'alert' ? '告警规则' : '记录规则' }}</span>
                      </div>
                      <ElButton
                        type="danger"
                        :icon="Trash2"
                        circle
                        size="small"
                        @click="removeRule(groupIndex, ruleIndex)"
                      />
                    </div>

                    <div class="rule-card-body">
                      <!-- 告警规则 -->
                      <template v-if="rule.type === 'alert'">
                        <div class="form-item">
                          <label class="field-label">
                            <span style="color: #f56c6c">* </span>
                            告警名称
                          </label>
                          <ElInput v-model="rule.alert" placeholder="HighRequestLatency" />
                        </div>

                        <div class="form-item">
                          <label class="field-label">
                            <span style="color: #f56c6c">* </span>
                            PromQL 表达式
                            <ElTooltip placement="top">
                              <template #content>
                                <div>Prometheus 查询语言表达式</div>
                                <div>例如: rate(http_requests_total[5m]) > 0.5</div>
                              </template>
                              <HelpCircle :size="11" class="help-icon" />
                            </ElTooltip>
                          </label>
                          <ElInput
                            v-model="rule.expr"
                            type="textarea"
                            :rows="3"
                            placeholder="job:request_latency_seconds:mean5m{job=&quot;myjob&quot;} > 0.5"
                          />
                        </div>

                        <div class="form-item">
                          <label class="field-label">
                            持续时间
                            <ElTooltip content="告警触发前需要满足条件的时间" placement="top">
                              <HelpCircle :size="11" class="help-icon" />
                            </ElTooltip>
                          </label>
                          <ElInput v-model="rule.for" placeholder="10m">
                            <template #append>分钟</template>
                          </ElInput>
                        </div>

                        <!-- 告警标签 -->
                        <div class="form-item">
                          <label class="field-label">
                            告警标签
                            <ElTooltip content="附加到告警的标签" placement="top">
                              <HelpCircle :size="11" class="help-icon" />
                            </ElTooltip>
                          </label>
                          <div v-if="rule.labels && rule.labels.length > 0" class="kv-list">
                            <div v-for="(label, lIdx) in rule.labels" :key="lIdx" class="kv-row">
                              <ElInput v-model="label.key" placeholder="severity" style="flex: 1" />
                              <span>=</span>
                              <ElInput v-model="label.value" placeholder="warning" style="flex: 1" />
                              <ElButton
                                type="danger"
                                :icon="Trash2"
                                circle
                                size="small"
                                @click="removeRuleLabel(groupIndex, ruleIndex, lIdx)"
                              />
                            </div>
                          </div>
                          <ElButton
                            type="primary"
                            :icon="Plus"
                            plain
                            size="small"
                            @click="addRuleLabel(groupIndex, ruleIndex)"
                          >
                            添加标签
                          </ElButton>
                        </div>

                        <!-- 告警注解 -->
                        <div class="form-item">
                          <label class="field-label">
                            告警注解
                            <ElTooltip content="告警的描述信息" placement="top">
                              <HelpCircle :size="11" class="help-icon" />
                            </ElTooltip>
                          </label>
                          <div v-if="rule.annotations && rule.annotations.length > 0" class="kv-list">
                            <div v-for="(anno, aIdx) in rule.annotations" :key="aIdx" class="kv-row">
                              <ElInput v-model="anno.key" placeholder="summary" style="flex: 1" />
                              <span>=</span>
                              <ElInput
                                v-model="anno.value"
                                placeholder="High request latency"
                                style="flex: 1"
                              />
                              <ElButton
                                type="danger"
                                :icon="Trash2"
                                circle
                                size="small"
                                @click="removeRuleAnnotation(groupIndex, ruleIndex, aIdx)"
                              />
                            </div>
                          </div>
                          <ElButton
                            type="primary"
                            :icon="Plus"
                            plain
                            size="small"
                            @click="addRuleAnnotation(groupIndex, ruleIndex)"
                          >
                            添加注解
                          </ElButton>
                        </div>
                      </template>

                      <!-- 记录规则 -->
                      <template v-else>
                        <div class="form-item">
                          <label class="field-label">
                            <span style="color: #f56c6c">* </span>
                            记录名称
                          </label>
                          <ElInput
                            v-model="rule.record"
                            placeholder="job:http_inprogress_requests:sum"
                          />
                        </div>

                        <div class="form-item">
                          <label class="field-label">
                            <span style="color: #f56c6c">* </span>
                            PromQL 表达式
                          </label>
                          <ElInput
                            v-model="rule.expr"
                            type="textarea"
                            :rows="3"
                            placeholder="sum(http_inprogress_requests) by (job)"
                          />
                        </div>

                        <!-- 记录标签 -->
                        <div class="form-item">
                          <label class="field-label">记录标签</label>
                          <div v-if="rule.labels && rule.labels.length > 0" class="kv-list">
                            <div v-for="(label, lIdx) in rule.labels" :key="lIdx" class="kv-row">
                              <ElInput v-model="label.key" placeholder="键" style="flex: 1" />
                              <span>=</span>
                              <ElInput v-model="label.value" placeholder="值" style="flex: 1" />
                              <ElButton
                                type="danger"
                                :icon="Trash2"
                                circle
                                size="small"
                                @click="removeRuleLabel(groupIndex, ruleIndex, lIdx)"
                              />
                            </div>
                          </div>
                          <ElButton
                            type="primary"
                            :icon="Plus"
                            plain
                            size="small"
                            @click="addRuleLabel(groupIndex, ruleIndex)"
                          >
                            添加标签
                          </ElButton>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addGroup" style="margin-top: 8px">
            添加规则组
          </ElButton>
        </div>

        <!-- 标签 -->
        <div class="form-section">
          <div class="section-header">
            <Tag :size="14" />
            <span>标签 (Labels)</span>
            <span class="optional-mark">可选</span>
          </div>

          <div v-if="formData.labels.length > 0" class="labels-list">
            <div v-for="(item, index) in formData.labels" :key="index" class="label-row">
              <ElInput v-model="item.key" placeholder="键" style="width: 180px" maxlength="63" />
              <span class="separator">=</span>
              <ElInput v-model="item.value" placeholder="值" style="flex: 1" maxlength="63" />
              <ElButton
                type="danger"
                :icon="Trash2"
                circle
                size="small"
                @click="removeLabel(index)"
              />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addLabel"> 添加标签 </ElButton>
        </div>
      </ElForm>
    </div>

    <!-- YAML 模式 -->
    <div v-else-if="editMode === 'yaml'" class="yaml-content">
      <ArtYamlEditor v-model="yamlContent" height="600px" @change="handleYamlChange" />
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">
        {{ dialogType === 'add' ? '创建' : '更新' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import yaml from 'js-yaml'
  import {
    Database,
    Layers,
    Tag,
    FormInput,
    Code,
    Plus,
    Trash2,
    HelpCircle,
    Info as InfoIcon,
    FolderTree,
    AlertTriangle,
    FileText
  } from 'lucide-vue-next'
  import {
    createPrometheusRuleApi,
    updatePrometheusRuleApi,
    getPrometheusRuleYamlApi,
    type PrometheusRuleListItem
  } from '@/api/workload/monitor'
  import { getClusterNamespaceListApi } from '@/api/manager/cluster'
  import ArtYamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    visible: boolean
    dialogType: 'add' | 'edit'
    ruleData?: PrometheusRuleListItem
    clusterUuid: string
  }

  interface KeyValue {
    key: string
    value: string
  }

  interface Rule {
    type: 'alert' | 'record'
    alert?: string
    record?: string
    expr: string
    for?: string
    labels?: KeyValue[]
    annotations?: KeyValue[]
  }

  interface Group {
    name: string
    interval?: string
    rules: Rule[]
  }

  const props = withDefaults(defineProps<Props>(), {
    ruleData: undefined
  })

  const emit = defineEmits(['close', 'success'])

  const handleClose = (val: boolean) => {
    if (!val) {
      emit('close')
    }
  }

  const formRef = ref()
  const editMode = ref<'form' | 'yaml'>('form')
  const submitting = ref(false)
  const dataLoading = ref(false)
  const yamlContent = ref('')
  const namespaceLoading = ref(false)
  const namespaces = ref<string[]>([])

  const formData = ref({
    namespace: 'monitoring',
    name: '',
    groups: [] as Group[],
    labels: [] as KeyValue[]
  })

  const formRules = {
    namespace: [{ required: true, message: '请选择命名空间', trigger: 'change' }],
    name: [
      { required: true, message: '请输入 PrometheusRule 名称', trigger: 'blur' },
      { pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/, message: '名称格式不正确', trigger: 'blur' }
    ]
  }

  // 加载命名空间列表
  const handleNamespaceVisibleChange = async (visible: boolean) => {
    if (visible && namespaces.value.length === 0) {
      await loadNamespaces()
    }
  }

  const loadNamespaces = async () => {
    if (!props.clusterUuid || namespaceLoading.value) return

    namespaceLoading.value = true
    try {
      const nsList = await getClusterNamespaceListApi(props.clusterUuid)
      namespaces.value = nsList || []

      if (
        props.dialogType === 'add' &&
        nsList.includes('monitoring') &&
        !formData.value.namespace
      ) {
        formData.value.namespace = 'monitoring'
      }
    } catch (error) {
      console.error('加载命名空间失败:', error)
      namespaces.value = []
    } finally {
      namespaceLoading.value = false
    }
  }

  // 规则组操作
  const addGroup = () => {
    formData.value.groups.push({
      name: '',
      interval: '',
      rules: []
    })
  }

  const removeGroup = (groupIndex: number) => {
    formData.value.groups.splice(groupIndex, 1)
  }

  // 规则操作
  const addAlertRule = (groupIndex: number) => {
    formData.value.groups[groupIndex].rules.push({
      type: 'alert',
      alert: '',
      expr: '',
      for: '',
      labels: [],
      annotations: []
    })
  }

  const addRecordRule = (groupIndex: number) => {
    formData.value.groups[groupIndex].rules.push({
      type: 'record',
      record: '',
      expr: '',
      labels: []
    })
  }

  const removeRule = (groupIndex: number, ruleIndex: number) => {
    formData.value.groups[groupIndex].rules.splice(ruleIndex, 1)
  }

  // 规则标签操作
  const addRuleLabel = (groupIndex: number, ruleIndex: number) => {
    if (!formData.value.groups[groupIndex].rules[ruleIndex].labels) {
      formData.value.groups[groupIndex].rules[ruleIndex].labels = []
    }
    formData.value.groups[groupIndex].rules[ruleIndex].labels!.push({ key: '', value: '' })
  }

  const removeRuleLabel = (groupIndex: number, ruleIndex: number, labelIndex: number) => {
    formData.value.groups[groupIndex].rules[ruleIndex].labels!.splice(labelIndex, 1)
  }

  // 规则注解操作
  const addRuleAnnotation = (groupIndex: number, ruleIndex: number) => {
    if (!formData.value.groups[groupIndex].rules[ruleIndex].annotations) {
      formData.value.groups[groupIndex].rules[ruleIndex].annotations = []
    }
    formData.value.groups[groupIndex].rules[ruleIndex].annotations!.push({ key: '', value: '' })
  }

  const removeRuleAnnotation = (groupIndex: number, ruleIndex: number, annoIndex: number) => {
    formData.value.groups[groupIndex].rules[ruleIndex].annotations!.splice(annoIndex, 1)
  }

  // 标签操作
  const addLabel = () => {
    formData.value.labels.push({ key: '', value: '' })
  }

  const removeLabel = (index: number) => {
    formData.value.labels.splice(index, 1)
  }

  const objectToArray = (obj?: Record<string, string>): KeyValue[] => {
    if (!obj) return []
    return Object.entries(obj)
      .filter(([key]) => key)
      .map(([key, value]) => ({ key, value }))
  }

  const arrayToObject = (arr: KeyValue[]): Record<string, string> => {
    const obj: Record<string, string> = {}
    arr.forEach((item) => {
      if (item.key && item.key.trim()) obj[item.key.trim()] = item.value
    })
    return obj
  }

  const formToYaml = () => {
    const ruleObj: any = {
      apiVersion: 'monitoring.coreos.com/v1',
      kind: 'PrometheusRule',
      metadata: {
        name: formData.value.name || 'prometheusrule-name',
        namespace: formData.value.namespace || 'monitoring'
      },
      spec: {
        groups: []
      }
    }

    // Labels
    const labelsObj = arrayToObject(formData.value.labels)
    if (Object.keys(labelsObj).length > 0) {
      ruleObj.metadata.labels = labelsObj
    }

    // Groups
    formData.value.groups.forEach((group) => {
      if (!group.name || group.rules.length === 0) return

      const groupObj: any = {
        name: group.name,
        rules: []
      }

      if (group.interval) {
        groupObj.interval = group.interval
      }

      group.rules.forEach((rule) => {
        if (!rule.expr) return

        const ruleObj: any = {
          expr: rule.expr
        }

        if (rule.type === 'alert') {
          if (!rule.alert) return
          ruleObj.alert = rule.alert
          if (rule.for) ruleObj.for = rule.for
          if (rule.labels && rule.labels.length > 0) {
            ruleObj.labels = arrayToObject(rule.labels)
          }
          if (rule.annotations && rule.annotations.length > 0) {
            ruleObj.annotations = arrayToObject(rule.annotations)
          }
        } else {
          if (!rule.record) return
          ruleObj.record = rule.record
          if (rule.labels && rule.labels.length > 0) {
            ruleObj.labels = arrayToObject(rule.labels)
          }
        }

        groupObj.rules.push(ruleObj)
      })

      if (groupObj.rules.length > 0) {
        ruleObj.spec.groups.push(groupObj)
      }
    })

    yamlContent.value = yaml.dump(ruleObj, { indent: 2 })
  }

  const yamlToForm = (yamlStr: string) => {
    try {
      const obj = yaml.load(yamlStr) as any

      const selectedNamespace = formData.value.namespace

      formData.value.name = obj.metadata?.name || ''
      formData.value.namespace = selectedNamespace || obj.metadata?.namespace || 'monitoring'
      formData.value.labels = objectToArray(obj.metadata?.labels)

      // Groups
      formData.value.groups = []
      if (obj.spec?.groups && Array.isArray(obj.spec.groups)) {
        obj.spec.groups.forEach((group: any) => {
          const groupData: Group = {
            name: group.name || '',
            interval: group.interval || '',
            rules: []
          }

          if (group.rules && Array.isArray(group.rules)) {
            group.rules.forEach((rule: any) => {
              if (rule.alert) {
                groupData.rules.push({
                  type: 'alert',
                  alert: rule.alert,
                  expr: rule.expr || '',
                  for: rule.for || '',
                  labels: objectToArray(rule.labels),
                  annotations: objectToArray(rule.annotations)
                })
              } else if (rule.record) {
                groupData.rules.push({
                  type: 'record',
                  record: rule.record,
                  expr: rule.expr || '',
                  labels: objectToArray(rule.labels)
                })
              }
            })
          }

          formData.value.groups.push(groupData)
        })
      }
    } catch (error) {
      console.error('❌ [yamlToForm] YAML 解析失败:', error)
      throw error
    }
  }

  const loadPrometheusRuleYAML = async () => {
    if (!props.clusterUuid || !props.ruleData) {
      return
    }

    dataLoading.value = true
    try {
      await loadNamespaces()

      const yamlStr = await getPrometheusRuleYamlApi({
        clusterUuid: props.clusterUuid,
        namespace: props.ruleData.namespace,
        name: props.ruleData.name
      })

      yamlContent.value = yamlStr
      formData.value.namespace = props.ruleData.namespace
      yamlToForm(yamlStr)
      formData.value.namespace = props.ruleData.namespace
    } catch (error: any) {
      console.error('❌ [loadPrometheusRuleYAML] 加载失败:', error)
      emit('close')
    } finally {
      dataLoading.value = false
    }
  }

  watch(
    () => props.visible,
    async (val) => {
      if (val) {
        if (props.dialogType === 'edit' && props.ruleData) {
          await loadPrometheusRuleYAML()
        } else if (props.dialogType === 'add') {
          await loadNamespaces()
          formData.value.groups = [
            {
              name: '',
              interval: '',
              rules: []
            }
          ]
          await nextTick()
          formToYaml()
        }
      }
    },
    { immediate: true }
  )

  watch(editMode, (newMode, oldMode) => {
    if (newMode === 'yaml' && oldMode === 'form') {
      formToYaml()
    } else if (newMode === 'form' && oldMode === 'yaml') {
      try {
        const currentNamespace = formData.value.namespace
        yamlToForm(yamlContent.value)
        formData.value.namespace = currentNamespace
        ElMessage({
          type: 'success',
          message: '已切换到表单模式',
          duration: 2000
        })
      } catch (error) {
        console.error('❌ [watch editMode] YAML 解析失败:', error)
        ElMessage.error('YAML 格式错误，请检查后重试')
        nextTick(() => {
          editMode.value = 'yaml'
        })
      }
    }
  })

  const handleYamlChange = (content: string) => {
    yamlContent.value = content
  }

  const handleSubmit = async () => {
    if (!props.clusterUuid) {
      return
    }

    if (editMode.value === 'form') {
      try {
        await formRef.value?.validate()
      } catch (error) {
        return
      }

      if (formData.value.groups.length === 0) {
        ElMessage.warning('请至少添加一个规则组')
        return
      }

      const hasInvalidGroup = formData.value.groups.some(
        (group) => !group.name || group.rules.length === 0
      )
      if (hasInvalidGroup) {
        ElMessage.warning('每个规则组必须有名称和至少一个规则')
        return
      }

      formToYaml()
    }

    // 确保 YAML 中的 namespace 与选择的一致
    try {
      const obj = yaml.load(yamlContent.value) as any
      obj.metadata.namespace = formData.value.namespace
      yamlContent.value = yaml.dump(obj, { indent: 2 })
    } catch (error) {
      console.error('修正 YAML namespace 失败:', error)
    }

    submitting.value = true
    try {
      const requestData = {
        clusterUuid: props.clusterUuid,
        namespace: formData.value.namespace,
        yamlStr: yamlContent.value
      }

      if (props.dialogType === 'add') {
        await createPrometheusRuleApi(requestData)
        ElMessage.success('创建成功')
      } else {
        await updatePrometheusRuleApi(requestData)
        ElMessage.success('更新成功')
      }

      emit('success')
      emit('close')
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const handleCancel = () => {
    emit('close')
  }

  const handleClosed = () => {
    formRef.value?.resetFields()
    formData.value = {
      namespace: 'monitoring',
      name: '',
      groups: [],
      labels: []
    }

    namespaces.value = []
    yamlContent.value = ''
    editMode.value = 'form'
  }

  watch(
    () => [formData.value],
    () => {
      if (editMode.value === 'form' && !dataLoading.value) {
        formToYaml()
      }
    },
    { deep: true }
  )
</script>

<style lang="scss" scoped>
  .mode-switch {
    margin-bottom: 14px;
    display: flex;
    justify-content: flex-end;

    .radio-content {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
    }
  }

  .form-content {
    max-height: 68vh;
    overflow-y: auto;
    padding-right: 6px;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }
  }

  .form-section {
    margin-bottom: 16px;
    padding: 16px;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e4e7ed;
      font-size: 14px;
      font-weight: 600;
      color: #303133;

      .optional-mark {
        margin-left: auto;
        font-size: 12px;
        font-weight: 400;
        color: #909399;
        background: #f4f4f5;
        padding: 2px 8px;
        border-radius: 10px;
      }
    }
  }

  .form-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    padding: 8px 12px;
    background: #f0f9ff;
    border-radius: 6px;
    border: 1px solid #bfdbfe;
    font-size: 12px;
    color: #1e40af;

    svg {
      flex-shrink: 0;
    }
  }

  .help-icon {
    cursor: help;
    color: #909399;
    transition: color 0.2s;

    &:hover {
      color: #606266;
    }
  }

  .groups-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 8px;
  }

  .group-card {
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .group-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 13px;

    .group-title {
      font-weight: 600;
    }
  }

  .group-card-body {
    padding: 14px;
    background: white;
  }

  .two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .form-item {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #495057;
    margin-bottom: 6px;
  }

  .rules-section {
    margin-top: 12px;
  }

  .rules-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #dee2e6;
    font-weight: 600;
    font-size: 13px;
    color: #495057;
  }

  .rule-card {
    background: #fafafa;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    overflow: hidden;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .rule-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f0f0f1;
    font-weight: 500;
    font-size: 12px;
  }

  .rule-type-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: white;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    font-size: 12px;
    font-weight: 600;
    color: #495057;

    svg {
      color: #667eea;
    }
  }

  .rule-card-body {
    padding: 12px;
    background: white;
  }

  .kv-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
  }

  .kv-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: #fafbfc;
    border-radius: 4px;
    border: 1px solid #e4e7ed;

    span {
      color: #6c757d;
      font-weight: 600;
      font-size: 13px;
    }
  }

  .labels-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 8px;
  }

  .label-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: #fafbfc;
    border-radius: 6px;
    border: 1px solid #e4e7ed;

    .separator {
      color: #6c757d;
      font-weight: 600;
      font-size: 13px;
    }
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .option-name {
      flex: 1;
      font-weight: 500;
      font-size: 12px;
    }
  }

  .yaml-content {
    min-height: 550px;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }

  :deep(.el-input__inner) {
    font-size: 13px;
  }

  :deep(.el-select) {
    font-size: 13px;
  }

  :deep(.el-button) {
    font-size: 12px;
  }

  :deep(.el-input-group__append) {
    background-color: #f5f7fa;
    color: #606266;
    font-size: 12px;
  }

  :deep(.el-textarea__inner) {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
  }
</style>

<style lang="scss">
  .el-dialog__body {
    padding: 0 !important;
  }
</style>