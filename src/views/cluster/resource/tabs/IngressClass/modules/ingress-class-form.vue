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
              placeholder="例如：nginx"
              :disabled="isEdit"
            />
            <div class="form-tip">仅支持小写字母、数字、连字符</div>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="控制器" prop="controller">
            <div class="controller-select-wrapper">
              <ElSelect
                v-model="formData.controller"
                placeholder="选择或输入控制器"
                filterable
                allow-create
              >
                <el-option-group label="常用控制器">
                  <ElOption label="NGINX Ingress" value="k8s.io/ingress-nginx">
                    <div class="controller-option">
                      <span>NGINX Ingress</span>
                      <ElTag size="small" type="success">推荐</ElTag>
                    </div>
                  </ElOption>
                  <ElOption label="Traefik" value="traefik.io/ingress-controller" />
                  <ElOption label="HAProxy" value="haproxy.org/ingress-controller" />
                  <ElOption label="NGINX Inc" value="nginx.org/ingress-controller" />
                </el-option-group>
                <el-option-group label="其他控制器">
                  <ElOption label="Contour" value="projectcontour.io/contour" />
                  <ElOption label="Istio" value="istio.io/ingress" />
                  <ElOption label="Ambassador" value="getambassador.io/ingress-controller" />
                </el-option-group>
              </ElSelect>
              <ElPopover placement="top" :width="250" trigger="hover">
                <template #reference>
                  <InfoIcon :size="14" class="info-icon" />
                </template>
                <div class="help-text">控制器标识符，通常为域名格式</div>
              </ElPopover>
            </div>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElFormItem label="设为默认">
        <div class="switch-with-help">
          <ElSwitch v-model="formData.isDefault" />
          <ElPopover placement="top" :width="300" trigger="hover">
            <template #reference>
              <InfoIcon :size="14" class="info-icon" />
            </template>
            <div class="help-text">
              设为默认后，未明确指定 IngressClass 的 Ingress 资源将自动使用此类。<br />
              <strong>注意：</strong>一个集群只能有一个默认 IngressClass。
            </div>
          </ElPopover>
        </div>
      </ElFormItem>
    </div>

    <!-- 参数配置 -->
    <div class="form-section">
      <div class="section-header">
        <h4>参数配置（可选）</h4>
        <ElPopover placement="top" :width="350" trigger="hover">
          <template #reference>
            <InfoIcon :size="14" class="info-icon" />
          </template>
          <div class="help-text">
            参数允许你引用一个配置资源来定制 Ingress 控制器的行为。<br />
            例如：可以引用 ConfigMap 或 CRD 来配置控制器的高级选项。
          </div>
        </ElPopover>
      </div>

      <ElFormItem label="启用参数">
        <ElSwitch v-model="formData.hasParameters" />
      </ElFormItem>

      <template v-if="formData.hasParameters">
        <div class="parameters-card">
          <ElRow :gutter="20">
            <ElCol :span="12">
              <ElFormItem
                label="Kind"
                label-width="80px"
                prop="parameters.kind"
                :rules="[
                  { required: formData.hasParameters, message: '请输入资源类型', trigger: 'blur' }
                ]"
              >
                <ElInput
                  v-model="formData.parameters.kind"
                  placeholder="例如：IngressParameters"
                  size="small"
                />
                <div class="form-tip">参数资源的类型（Kind）</div>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem
                label="Name"
                label-width="80px"
                prop="parameters.name"
                :rules="[
                  { required: formData.hasParameters, message: '请输入资源名称', trigger: 'blur' }
                ]"
              >
                <ElInput
                  v-model="formData.parameters.name"
                  placeholder="例如：external-lb"
                  size="small"
                />
                <div class="form-tip">参数资源的名称</div>
              </ElFormItem>
            </ElCol>
          </ElRow>

          <ElRow :gutter="20">
            <ElCol :span="12">
              <ElFormItem label="API Group" label-width="80px">
                <ElInput
                  v-model="formData.parameters.apiGroup"
                  placeholder="例如：k8s.example.com（可选）"
                  size="small"
                />
                <div class="form-tip">留空表示核心 API</div>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="Namespace" label-width="80px">
                <ElInput
                  v-model="formData.parameters.namespace"
                  placeholder="命名空间（可选）"
                  size="small"
                />
                <div class="form-tip">Scope 为 Namespace 时需要</div>
              </ElFormItem>
            </ElCol>
          </ElRow>

          <ElFormItem label="Scope" label-width="80px">
            <ElRadioGroup v-model="formData.parameters.scope">
              <ElRadio value="Cluster">
                <span>Cluster</span>
                <span class="radio-desc">（集群级别）</span>
              </ElRadio>
              <ElRadio value="Namespace">
                <span>Namespace</span>
                <span class="radio-desc">（命名空间级别）</span>
              </ElRadio>
            </ElRadioGroup>
            <div class="form-tip">参数资源的作用域</div>
          </ElFormItem>
        </div>
      </template>
    </div>

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
              @click="formData.labels.splice(index, 1)"
            />
          </div>
          <ElButton
            type="primary"
            text
            :icon="PlusIcon"
            size="small"
            @click="formData.labels.push({ key: '', value: '' })"
          >
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
              @click="formData.annotations.splice(index, 1)"
            />
          </div>
          <ElButton
            type="primary"
            text
            :icon="PlusIcon"
            size="small"
            @click="formData.annotations.push({ key: '', value: '' })"
          >
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
  import type { IngressClassFormData } from './type.ts'

  interface Props {
    modelValue: IngressClassFormData
    disabled?: boolean
    isEdit?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: IngressClassFormData): void
  }

  const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    isEdit: false
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()

  const formData = reactive<IngressClassFormData>({
    name: '',
    controller: 'k8s.io/ingress-nginx',
    isDefault: false,
    hasParameters: false,
    parameters: {
      apiGroup: '',
      kind: '',
      name: '',
      namespace: '',
      scope: 'Cluster'
    },
    labels: [],
    annotations: []
  })

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '名称只能包含小写字母、数字、连字符',
        trigger: 'blur'
      }
    ],
    controller: [{ required: true, message: '请选择或输入控制器', trigger: 'change' }]
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

    strong {
      color: #409eff;
      font-weight: 600;
    }
  }

  .controller-select-wrapper,
  .switch-with-help {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(.el-select) {
      flex: 1;
    }

    .info-icon {
      color: #909399;
      cursor: help;
      flex-shrink: 0;
      transition: color 0.3s;

      &:hover {
        color: #409eff;
      }
    }
  }

  .controller-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  // 参数配置卡片
  .parameters-card {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    margin-bottom: 16px;
  }

  .radio-desc {
    color: #909399;
    font-size: 12px;
    margin-left: 4px;
  }

  // 键值对列表
  .kv-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .kv-item {
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

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
  }

  :deep(.el-select) {
    width: 100%;
  }
</style>