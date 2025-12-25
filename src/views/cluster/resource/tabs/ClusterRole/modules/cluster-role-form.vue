<template>
  <ElForm ref="formRef" :model="formData" :rules="rules" label-width="120px" :disabled="disabled">
    <!-- 基本信息 -->
    <div class="form-section">
      <div class="section-header">
        <h4>基本信息</h4>
      </div>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="名称" prop="name">
            <ElInput
              v-model="formData.name"
              placeholder="例如：app-viewer"
              :disabled="isEdit"
            />
            <div class="form-tip">仅支持小写字母、数字、连字符</div>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="使用聚合模式">
            <div class="switch-with-help">
              <ElSwitch v-model="formData.useAggregation" :disabled="isEdit" />
              <ElPopover placement="top" :width="300" trigger="hover">
                <template #reference>
                  <InfoIcon :size="14" class="info-icon" />
                </template>
                <div class="help-text">
                  聚合模式通过标签选择器自动聚合其他 ClusterRole 的规则，适用于组合多个角色
                </div>
              </ElPopover>
            </div>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </div>

    <!-- 聚合规则 -->
    <template v-if="formData.useAggregation">
      <div class="form-section">
        <div class="section-header">
          <h4>聚合选择器</h4>
          <ElPopover placement="top" :width="350" trigger="hover">
            <template #reference>
              <InfoIcon :size="14" class="info-icon" />
            </template>
            <div class="help-text">
              添加标签选择器来匹配其他 ClusterRole。例如：<br />
              标签 <code>rbac.example.com/aggregate-to-view: "true"</code> 可以聚合所有带此标签的
              ClusterRole
            </div>
          </ElPopover>
        </div>

        <div class="aggregation-selectors">
          <div
            v-for="(selector, sIndex) in formData.aggregationSelectors"
            :key="sIndex"
            class="selector-card"
          >
            <div class="card-header">
              <span class="card-title">选择器 {{ sIndex + 1 }}</span>
              <ElButton
                type="danger"
                text
                :icon="DeleteIcon"
                size="small"
                @click="removeAggregationSelector(sIndex)"
                :disabled="formData.aggregationSelectors.length <= 1"
              >
                删除
              </ElButton>
            </div>
            <div class="card-body">
              <div
                v-for="(label, lIndex) in selector.matchLabels"
                :key="lIndex"
                class="label-item"
              >
                <ElInput v-model="label.key" placeholder="标签名" size="small" />
                <span class="equal-sign">=</span>
                <ElInput v-model="label.value" placeholder="标签值" size="small" />
                <ElButton
                  type="danger"
                  text
                  :icon="DeleteIcon"
                  circle
                  size="small"
                  @click="removeAggregationLabel(sIndex, lIndex)"
                  :disabled="selector.matchLabels.length <= 1"
                />
              </div>
              <ElButton
                type="primary"
                text
                :icon="PlusIcon"
                size="small"
                @click="addAggregationLabel(sIndex)"
              >
                添加标签
              </ElButton>
            </div>
          </div>
          <ElButton type="primary" :icon="PlusIcon" @click="addAggregationSelector" plain>
            添加选择器
          </ElButton>
        </div>
      </div>
    </template>

    <!-- 权限规则 -->
    <template v-else>
      <div class="form-section">
        <div class="section-header">
          <h4>权限规则</h4>
          <ElPopover placement="top" :width="400" trigger="hover">
            <template #reference>
              <InfoIcon :size="14" class="info-icon" />
            </template>
            <div class="help-text">
              每条规则定义了对特定资源的操作权限：<br />
              <strong>动作 (Verbs)：</strong>允许的操作，如 get、list、create 等<br />
              <strong>API 组：</strong>资源所属的 API 组<br />
              <strong>资源类型：</strong>具体的资源类型，如 pods、services 等
            </div>
          </ElPopover>
        </div>

        <div class="rules-list">
          <div v-for="(rule, rIndex) in formData.rules" :key="rIndex" class="rule-card">
            <div class="card-header">
              <span class="card-title">规则 {{ rIndex + 1 }}</span>
              <ElButton
                type="danger"
                text
                :icon="DeleteIcon"
                size="small"
                @click="removeRule(rIndex)"
                :disabled="formData.rules.length <= 1"
              >
                删除
              </ElButton>
            </div>

            <div class="card-body">
              <!-- 动作选择 - 网格布局 -->
              <ElFormItem
                label="动作"
                :prop="`rules.${rIndex}.verbs`"
                label-width="80px"
                :rules="[
                  {
                    required: true,
                    message: '至少选择一个动作',
                    trigger: 'change',
                    type: 'array',
                    min: 1
                  }
                ]"
              >
                <ElCheckboxGroup v-model="rule.verbs" class="verbs-grid">
                  <ElCheckbox
                    v-for="verb in COMMON_VERBS"
                    :key="verb.value"
                    :value="verb.value"
                  >
                    <ElTooltip :content="verb.tooltip" placement="top">
                      <span :class="{ 'danger-text': verb.danger }">{{ verb.label }}</span>
                    </ElTooltip>
                  </ElCheckbox>
                </ElCheckboxGroup>
              </ElFormItem>

              <!-- API 组和资源类型 -->
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem
                    label="API 组"
                    label-width="80px"
                    :prop="`rules.${rIndex}.apiGroups`"
                    :rules="[
                      {
                        required: true,
                        message: '至少选择一个 API 组',
                        trigger: 'change',
                        type: 'array',
                        min: 1
                      }
                    ]"
                  >
                    <ElSelect
                      v-model="rule.apiGroups"
                      multiple
                      filterable
                      allow-create
                      placeholder="选择或输入"
                      size="small"
                    >
                      <ElOption
                        v-for="group in API_GROUPS"
                        :key="group.value"
                        :label="group.label"
                        :value="group.value"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem
                    label="资源类型"
                    label-width="80px"
                    :prop="`rules.${rIndex}.resources`"
                    :rules="[
                      {
                        required: true,
                        message: '至少选择一个资源',
                        trigger: 'change',
                        type: 'array',
                        min: 1
                      }
                    ]"
                  >
                    <ElSelect
                      v-model="rule.resources"
                      multiple
                      filterable
                      allow-create
                      placeholder="选择或输入"
                      size="small"
                    >
                      <el-option-group
                        v-for="group in RESOURCE_GROUPS"
                        :key="group.label"
                        :label="group.label"
                      >
                        <ElOption
                          v-for="resource in group.options"
                          :key="resource.value"
                          :label="resource.label"
                          :value="resource.value"
                        />
                      </el-option-group>
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <!-- 资源名称（可选） -->
              <ElFormItem label="资源名称" label-width="80px">
                <ElSelect
                  v-model="rule.resourceNames"
                  multiple
                  filterable
                  allow-create
                  placeholder="留空表示所有资源"
                  size="small"
                >
                  <template #empty>
                    <div class="select-empty">输入特定资源名称后按回车添加</div>
                  </template>
                </ElSelect>
                <div class="form-tip">限制此规则仅适用于特定名称的资源（可选）</div>
              </ElFormItem>
            </div>
          </div>

          <ElButton type="primary" :icon="PlusIcon" @click="addRule" plain>
            添加规则
          </ElButton>
        </div>
      </div>
    </template>

    <!-- 标签和注解 -->
    <div class="form-section">
      <div class="section-header">
        <h4>标签和注解（可选）</h4>
      </div>

      <ElFormItem label="标签">
        <div class="kv-list">
          <div v-for="(item, index) in formData.labels" :key="index" class="kv-item">
            <ElInput v-model="item.key" placeholder="标签名" size="small" />
            <span class="equal-sign">=</span>
            <ElInput v-model="item.value" placeholder="标签值" size="small" />
            <ElButton
              type="danger"
              text
              :icon="DeleteIcon"
              circle
              size="small"
              @click="removeLabel(index)"
            />
          </div>
          <ElButton type="primary" text :icon="PlusIcon" size="small" @click="addLabel">
            添加标签
          </ElButton>
        </div>
      </ElFormItem>

      <ElFormItem label="注解">
        <div class="kv-list">
          <div v-for="(item, index) in formData.annotations" :key="index" class="kv-item">
            <ElInput v-model="item.key" placeholder="注解名" size="small" />
            <span class="equal-sign">=</span>
            <ElInput v-model="item.value" placeholder="注解值" size="small" />
            <ElButton
              type="danger"
              text
              :icon="DeleteIcon"
              circle
              size="small"
              @click="removeAnnotation(index)"
            />
          </div>
          <ElButton type="primary" text :icon="PlusIcon" size="small" @click="addAnnotation">
            添加注解
          </ElButton>
        </div>
      </ElFormItem>
    </div>
  </ElForm>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { Plus as PlusIcon, Delete as DeleteIcon, Info as InfoIcon } from 'lucide-vue-next'
  import type { FormInstance, FormRules } from 'element-plus'
  import type { ClusterRoleFormData } from './type.ts'

  interface Props {
    modelValue: ClusterRoleFormData
    disabled?: boolean
    isEdit?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: ClusterRoleFormData): void
  }

  const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    isEdit: false
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()

  const formData = reactive<ClusterRoleFormData>({
    name: '',
    rules: [
      {
        verbs: [],
        apiGroups: [''],
        resources: [],
        resourceNames: []
      }
    ],
    useAggregation: false,
    aggregationSelectors: [],
    labels: [],
    annotations: []
  })

  // 常用动作 - 网格布局优化
  const COMMON_VERBS = [
    { value: 'get', label: 'get', tooltip: '读取单个资源', danger: false },
    { value: 'list', label: 'list', tooltip: '列出资源集合', danger: false },
    { value: 'watch', label: 'watch', tooltip: '监听资源变化', danger: false },
    { value: 'create', label: 'create', tooltip: '创建资源', danger: false },
    { value: 'update', label: 'update', tooltip: '更新资源', danger: false },
    { value: 'patch', label: 'patch', tooltip: '部分更新资源', danger: false },
    { value: 'delete', label: 'delete', tooltip: '删除单个资源', danger: false },
    {
      value: 'deletecollection',
      label: 'deletecollection',
      tooltip: '批量删除资源',
      danger: false
    },
    { value: '*', label: '* (所有)', tooltip: '所有操作（危险）', danger: true }
  ]

  // API 组
  const API_GROUPS = [
    { label: 'core (核心组)', value: '' },
    { label: 'apps', value: 'apps' },
    { label: 'batch', value: 'batch' },
    { label: 'extensions', value: 'extensions' },
    { label: 'networking.k8s.io', value: 'networking.k8s.io' },
    { label: 'storage.k8s.io', value: 'storage.k8s.io' },
    { label: 'rbac.authorization.k8s.io', value: 'rbac.authorization.k8s.io' },
    { label: 'policy', value: 'policy' },
    { label: 'autoscaling', value: 'autoscaling' },
    { label: '* (所有)', value: '*' }
  ]

  // 资源类型分组
  const RESOURCE_GROUPS = [
    {
      label: '核心资源',
      options: [
        { label: 'pods', value: 'pods' },
        { label: 'services', value: 'services' },
        { label: 'configmaps', value: 'configmaps' },
        { label: 'secrets', value: 'secrets' },
        { label: 'persistentvolumeclaims', value: 'persistentvolumeclaims' },
        { label: 'namespaces', value: 'namespaces' },
        { label: 'nodes', value: 'nodes' },
        { label: 'events', value: 'events' }
      ]
    },
    {
      label: '应用资源',
      options: [
        { label: 'deployments', value: 'deployments' },
        { label: 'statefulsets', value: 'statefulsets' },
        { label: 'daemonsets', value: 'daemonsets' },
        { label: 'replicasets', value: 'replicasets' }
      ]
    },
    {
      label: '网络资源',
      options: [
        { label: 'ingresses', value: 'ingresses' },
        { label: 'networkpolicies', value: 'networkpolicies' }
      ]
    },
    {
      label: '其他',
      options: [{ label: '* (所有资源)', value: '*' }]
    }
  ]

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
        message: '名称只能包含小写字母、数字、连字符和点',
        trigger: 'blur'
      }
    ]
  }

  watch(
    () => props.modelValue,
    (val) => {
      Object.assign(formData, val)
    },
    { immediate: true, deep: true }
  )

  watch(
    formData,
    (val) => {
      emit('update:modelValue', { ...val })
    },
    { deep: true }
  )

  // 规则操作
  const addRule = () => {
    formData.rules.push({
      verbs: [],
      apiGroups: [''],
      resources: [],
      resourceNames: []
    })
  }

  const removeRule = (index: number) => {
    if (formData.rules.length > 1) {
      formData.rules.splice(index, 1)
    }
  }

  // 聚合选择器操作
  const addAggregationSelector = () => {
    formData.aggregationSelectors.push({
      matchLabels: [{ key: '', value: '' }]
    })
  }

  const removeAggregationSelector = (index: number) => {
    if (formData.aggregationSelectors.length > 1) {
      formData.aggregationSelectors.splice(index, 1)
    }
  }

  const addAggregationLabel = (sIndex: number) => {
    formData.aggregationSelectors[sIndex].matchLabels.push({ key: '', value: '' })
  }

  const removeAggregationLabel = (sIndex: number, lIndex: number) => {
    const selector = formData.aggregationSelectors[sIndex]
    if (selector.matchLabels.length > 1) {
      selector.matchLabels.splice(lIndex, 1)
    }
  }

  // 标签操作
  const addLabel = () => {
    formData.labels.push({ key: '', value: '' })
  }

  const removeLabel = (index: number) => {
    formData.labels.splice(index, 1)
  }

  // 注解操作
  const addAnnotation = () => {
    formData.annotations.push({ key: '', value: '' })
  }

  const removeAnnotation = (index: number) => {
    formData.annotations.splice(index, 1)
  }

  const validate = () => formRef.value?.validate()
  const resetFields = () => formRef.value?.resetFields()

  defineExpose({ validate, resetFields, formRef })
</script>

<style lang="scss" scoped>
  .form-section {
    margin-bottom: 24px;

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e4e7ed;

      h4 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .info-icon {
        color: #909399;
        cursor: help;
        transition: color 0.3s;

        &:hover {
          color: #409eff;
        }
      }
    }
  }

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }

  .help-text {
    font-size: 13px;
    line-height: 1.8;
    color: #606266;

    code {
      background: #f5f7fa;
      padding: 2px 6px;
      border-radius: 3px;
      color: #e6a23c;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }

    strong {
      color: #409eff;
      font-weight: 600;
    }
  }

  .switch-with-help {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-icon {
      color: #909399;
      cursor: help;
      transition: color 0.3s;

      &:hover {
        color: #409eff;
      }
    }
  }

  // 聚合选择器样式
  .aggregation-selectors {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  // 规则卡片样式
  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rule-card,
  .selector-card {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s;

    &:hover {
      border-color: #c0c4cc;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f5f7fa;
      border-bottom: 1px solid #e4e7ed;

      .card-title {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }
    }

    .card-body {
      padding: 16px;
    }
  }

  // 动作网格布局 - 关键优化点
  .verbs-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px 16px;
    width: 100%;

    :deep(.el-checkbox) {
      margin-right: 0;
      width: 100%;

      .el-checkbox__label {
        font-size: 13px;
        width: 100%;
      }
    }

    .danger-text {
      color: #f56c6c;
      font-weight: 600;
    }
  }

  // 键值对列表
  .kv-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .kv-item,
  .label-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .equal-sign {
      color: #909399;
      font-weight: 500;
      flex-shrink: 0;
    }

    :deep(.el-input) {
      flex: 1;
    }
  }

  .select-empty {
    padding: 10px;
    text-align: center;
    color: #909399;
    font-size: 12px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
  }

  :deep(.el-select) {
    width: 100%;

    .el-select__tags {
      max-width: 100%;
    }
  }
</style>