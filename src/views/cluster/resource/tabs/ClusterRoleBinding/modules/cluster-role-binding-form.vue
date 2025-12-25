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
              placeholder="例如：read-pods-global"
              :disabled="isEdit"
            />
            <div class="form-tip">仅支持小写字母、数字、连字符</div>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="ClusterRole" prop="roleRef.name">
            <div class="role-select-wrapper">
              <ElSelect
                v-model="formData.roleRef.name"
                placeholder="选择要绑定的 ClusterRole"
                filterable
                :loading="rolesLoading"
                :disabled="isEdit"
              >
                <ElOption
                  v-for="role in clusterRoles"
                  :key="role.name"
                  :label="role.name"
                  :value="role.name"
                >
                  <div class="role-option">
                    <span>{{ role.name }}</span>
                    <ElTag v-if="role.name.startsWith('system:')" type="info" size="small">
                      系统
                    </ElTag>
                  </div>
                </ElOption>
              </ElSelect>
              <ElPopover v-if="!isEdit" placement="top" :width="250" trigger="hover">
                <template #reference>
                  <InfoIcon :size="14" class="info-icon" />
                </template>
                <div class="help-text">选择要授予主体的权限角色</div>
              </ElPopover>
              <ElPopover v-else placement="top" :width="250" trigger="hover">
                <template #reference>
                  <InfoIcon :size="14" class="info-icon" />
                </template>
                <div class="help-text">角色引用创建后不可修改</div>
              </ElPopover>
            </div>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </div>

    <!-- 主体 -->
    <div class="form-section">
      <div class="section-header">
        <h4>主体 (Subjects)</h4>
        <ElPopover placement="top" :width="400" trigger="hover">
          <template #reference>
            <InfoIcon :size="14" class="info-icon" />
          </template>
          <div class="help-text">
            <strong>User：</strong>用户账号，通常是邮箱或用户名<br />
            <strong>Group：</strong>用户组，用于批量授权<br />
            <strong>ServiceAccount：</strong>Pod 中运行的应用使用的账号，必须指定命名空间
          </div>
        </ElPopover>
      </div>

      <div class="subjects-list">
        <div v-for="(subject, index) in formData.subjects" :key="index" class="subject-card">
          <div class="card-header">
            <span class="card-title">主体 {{ index + 1 }}</span>
            <ElButton
              type="danger"
              text
              :icon="DeleteIcon"
              size="small"
              @click="removeSubject(index)"
              :disabled="formData.subjects.length <= 1"
            >
              删除
            </ElButton>
          </div>

          <div class="card-body">
            <ElRow :gutter="16">
              <ElCol :span="8">
                <ElFormItem
                  label="类型"
                  :prop="`subjects.${index}.kind`"
                  :rules="[{ required: true, message: '请选择类型', trigger: 'change' }]"
                >
                  <ElSelect
                    v-model="subject.kind"
                    size="small"
                    @change="handleSubjectKindChange(index)"
                  >
                    <ElOption label="User" value="User">
                      <div class="subject-type-option">
                        <span>User</span>
                        <span class="desc">用户账号</span>
                      </div>
                    </ElOption>
                    <ElOption label="Group" value="Group">
                      <div class="subject-type-option">
                        <span>Group</span>
                        <span class="desc">用户组</span>
                      </div>
                    </ElOption>
                    <ElOption label="ServiceAccount" value="ServiceAccount">
                      <div class="subject-type-option">
                        <span>ServiceAccount</span>
                        <span class="desc">服务账号</span>
                      </div>
                    </ElOption>
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem
                  label="名称"
                  :prop="`subjects.${index}.name`"
                  :rules="[{ required: true, message: '请输入名称', trigger: 'blur' }]"
                >
                  <ElInput
                    v-model="subject.name"
                    :placeholder="getSubjectNamePlaceholder(subject.kind)"
                    size="small"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem
                  v-if="subject.kind === 'ServiceAccount'"
                  label="命名空间"
                  :prop="`subjects.${index}.namespace`"
                  :rules="[
                    { required: true, message: 'ServiceAccount 必须指定命名空间', trigger: 'blur' }
                  ]"
                >
                  <ElInput v-model="subject.namespace" placeholder="例如：default" size="small" />
                </ElFormItem>
                <div v-else class="namespace-placeholder"> {{ subject.kind }} 不需要命名空间 </div>
              </ElCol>
            </ElRow>
          </div>
        </div>

        <ElButton type="primary" :icon="PlusIcon" @click="addSubject" plain> 添加主体 </ElButton>
      </div>
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
  import { ref, reactive, watch, onMounted } from 'vue'
  import { Plus as PlusIcon, Delete as DeleteIcon, Info as InfoIcon } from 'lucide-vue-next'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { getClusterRoleListApi } from '@/api/workload/cluster-resource'
  import type { ClusterRoleBindingFormData } from './type.ts'

  interface ClusterRoleListItem {
    name: string
    ruleCount: number
    age: string
  }

  interface Props {
    modelValue: ClusterRoleBindingFormData
    disabled?: boolean
    isEdit?: boolean
    clusterUuid: string
  }

  interface Emits {
    (e: 'update:modelValue', value: ClusterRoleBindingFormData): void
  }

  const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    isEdit: false
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const rolesLoading = ref(false)
  const clusterRoles = ref<ClusterRoleListItem[]>([])

  const formData = reactive<ClusterRoleBindingFormData>({
    name: '',
    roleRef: {
      kind: 'ClusterRole',
      name: ''
    },
    subjects: [
      {
        kind: 'User',
        name: '',
        namespace: ''
      }
    ],
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
    'roleRef.name': [{ required: true, message: '请选择 ClusterRole', trigger: 'change' }]
  }

  // 加载 ClusterRole 列表
  const loadClusterRoles = async () => {
    try {
      rolesLoading.value = true
      const response = await getClusterRoleListApi({
        clusterUuid: props.clusterUuid
      })
      clusterRoles.value = response.items || []
    } catch (error) {
      console.error('加载 ClusterRole 失败:', error)
    } finally {
      rolesLoading.value = false
    }
  }

  const getSubjectNamePlaceholder = (kind: string) => {
    switch (kind) {
      case 'User':
        return '例如：john@example.com'
      case 'Group':
        return '例如：system:masters'
      case 'ServiceAccount':
        return '例如：my-service-account'
      default:
        return '请输入名称'
    }
  }

  const handleSubjectKindChange = (index: number) => {
    const subject = formData.subjects[index]
    if (subject.kind !== 'ServiceAccount') {
      subject.namespace = ''
    }
  }

  const addSubject = () => {
    formData.subjects.push({ kind: 'User', name: '', namespace: '' })
  }

  const removeSubject = (index: number) => {
    if (formData.subjects.length > 1) {
      formData.subjects.splice(index, 1)
    }
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

  onMounted(() => {
    loadClusterRoles()
  })

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

  .role-select-wrapper {
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

  .role-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  // 主体卡片样式
  .subjects-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .subject-card {
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

  .subject-type-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .desc {
      color: #909399;
      font-size: 12px;
    }
  }

  .namespace-placeholder {
    padding-top: 32px;
    color: #909399;
    font-size: 13px;
    text-align: center;
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
