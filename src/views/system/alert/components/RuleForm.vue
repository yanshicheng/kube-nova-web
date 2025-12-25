<template>
  <ElDialog
    v-model="visible"
    :title="isEdit ? '📋 查看/编辑告警规则' : '✨ 添加告警规则'"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="130px"
      @submit.prevent="handleSubmit"
    >
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="告警名称" prop="alertName">
            <ElInput
              v-model="form.alertName"
              placeholder="请输入告警名称(英文)，如：NodeMemoryLow"
              clearable
            />
          </ElFormItem>
        </ElCol>

        <ElCol :span="12">
          <ElFormItem label="规则中文名" prop="ruleNameCn">
            <ElInput v-model="form.ruleNameCn" placeholder="请输入规则中文名" clearable />
          </ElFormItem>
        </ElCol>

        <ElCol :span="12">
          <ElFormItem label="严重程度" prop="severity">
            <ElSelect v-model="form.severity" placeholder="请选择严重程度" style="width: 100%">
              <ElOption label="严重 (Critical)" value="critical">
                <span style="color: #f56c6c">🔴</span> 严重 (Critical)
              </ElOption>
              <ElOption label="警告 (Warning)" value="warning">
                <span style="color: #e6a23c">🟡</span> 警告 (Warning)
              </ElOption>
              <ElOption label="提示 (Info)" value="info">
                <span style="color: #409eff">🔵</span> 提示 (Info)
              </ElOption>
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <ElCol :span="12">
          <ElFormItem label="持续时间" prop="forDuration">
            <ElSelect v-model="form.forDuration" placeholder="请选择持续时间" style="width: 100%">
              <ElOption label="30秒" value="30s" />
              <ElOption label="1分钟" value="1m" />
              <ElOption label="2分钟" value="2m" />
              <ElOption label="5分钟" value="5m" />
              <ElOption label="10分钟" value="10m" />
              <ElOption label="15分钟" value="15m" />
              <ElOption label="30分钟" value="30m" />
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <ElCol :span="12">
          <ElFormItem label="是否启用" prop="isEnabled">
            <ElSwitch v-model="form.isEnabled" />
          </ElFormItem>
        </ElCol>

        <ElCol :span="12">
          <ElFormItem label="排序序号" prop="sortOrder">
            <ElInputNumber
              v-model="form.sortOrder"
              :min="0"
              :max="9999"
              placeholder="请输入排序序号"
              style="width: 100%"
            />
          </ElFormItem>
        </ElCol>

        <ElCol :span="24">
          <ElFormItem label="PromQL 表达式" prop="expr">
            <ElInput
              v-model="form.expr"
              type="textarea"
              :rows="4"
              placeholder="请输入 PromQL 表达式，例如：node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.1"
            />
            <div class="form-tip">💡 支持 Prometheus 查询语言，可以使用各种函数和操作符</div>
          </ElFormItem>
        </ElCol>

        <ElCol :span="24">
          <ElFormItem label="告警摘要" prop="summary">
            <ElInput v-model="form.summary" :placeholder="placeholderText.summary" clearable />
            <div class="form-tip">
              💡 支持模板变量：&#123;&#123; $labels.xxx &#125;&#125;, &#123;&#123; $value
              &#125;&#125;, &#123;&#123; $labels.instance &#125;&#125; 等
            </div>
          </ElFormItem>
        </ElCol>

        <ElCol :span="24">
          <ElFormItem label="告警详细描述" prop="description">
            <ElInput
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入告警详细描述，支持模板变量"
              maxlength="1000"
              show-word-limit
            />
          </ElFormItem>
        </ElCol>

        <ElCol :span="24">
          <ElFormItem label="额外标签">
            <ElInput
              v-model="form.labels"
              type="textarea"
              :rows="3"
              placeholder='JSON 格式，例如：{"team": "ops", "priority": "high"}'
            />
            <div class="form-tip">💡 JSON 格式的键值对，用于给告警添加额外的标签</div>
          </ElFormItem>
        </ElCol>

        <ElCol :span="24">
          <ElFormItem label="额外注解">
            <ElInput
              v-model="form.annotations"
              type="textarea"
              :rows="3"
              placeholder='JSON 格式，例如：{"dashboard": "https://grafana.example.com/d/xxx"}'
            />
            <div class="form-tip">💡 JSON 格式的键值对，用于给告警添加额外的注解信息</div>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">
        {{ isEdit ? '更新' : '添加' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import {
    addAlertRuleApi,
    updateAlertRuleApi,
    type AddAlertRuleRequest,
    type UpdateAlertRuleRequest,
    type AlertRule
  } from '@/api/manager/alert'

  interface Props {
    modelValue: boolean
    formData?: Partial<AlertRule>
    isEdit?: boolean
    groupId?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    formData: () => ({}),
    isEdit: false
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    success: []
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const formRef = ref<FormInstance>()
  const loading = ref(false)

  const placeholderText = {
    summary: '请输入告警摘要，支持模板变量如：{{ $labels.instance }}'
  }

  const form = reactive<Partial<AlertRule>>({
    alertName: '',
    ruleNameCn: '',
    summary: '',
    description: '',
    expr: '',
    forDuration: '1m',
    severity: 'warning',
    isEnabled: true,
    labels: '',
    annotations: '',
    sortOrder: 0
  })

  const rules: FormRules = {
    alertName: [
      { required: true, message: '请输入告警名称', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: '只能包含字母、数字和下划线，且必须以字母开头',
        trigger: 'blur'
      }
    ],
    ruleNameCn: [
      { required: true, message: '请输入规则中文名', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    expr: [
      { required: true, message: '请输入 PromQL 表达式', trigger: 'blur' },
      { min: 5, max: 2000, message: '长度在 5 到 2000 个字符', trigger: 'blur' }
    ],
    summary: [
      { required: true, message: '请输入告警摘要', trigger: 'blur' },
      { min: 5, max: 500, message: '长度在 5 到 500 个字符', trigger: 'blur' }
    ],
    forDuration: [{ required: true, message: '请选择持续时间', trigger: 'change' }],
    severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }]
  }

  const resetForm = () => {
    Object.assign(form, {
      alertName: '',
      ruleNameCn: '',
      summary: '',
      description: '',
      expr: '',
      forDuration: '1m',
      severity: 'warning',
      isEnabled: true,
      labels: '',
      annotations: '',
      sortOrder: 0
    })
    formRef.value?.clearValidate()
  }

  watch(
    () => props.formData,
    (val) => {
      if (val && Object.keys(val).length > 0) {
        Object.assign(form, val)
      } else {
        resetForm()
      }
    },
    { immediate: true, deep: true }
  )

  const validateJSON = (value: string): boolean => {
    if (!value) return true
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      if (form.labels && !validateJSON(form.labels)) {
        ElMessage.error('额外标签格式错误，请输入有效的 JSON')
        return
      }

      if (form.annotations && !validateJSON(form.annotations)) {
        ElMessage.error('额外注解格式错误，请输入有效的 JSON')
        return
      }

      loading.value = true

      if (props.isEdit && form.id) {
        await updateAlertRuleApi(form as UpdateAlertRuleRequest)
        ElMessage.success('更新成功')
      } else {
        if (!props.groupId) {
          ElMessage.error('缺少分组ID')
          return
        }
        await addAlertRuleApi({
          ...form,
          groupId: props.groupId
        } as AddAlertRuleRequest)
        ElMessage.success('添加成功')
      }

      visible.value = false
      emit('success')
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      loading.value = false
    }
  }

  const handleClosed = () => {
    resetForm()
  }
</script>

<style scoped lang="scss">
  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
</style>
