<template>
  <ElDialog
    :model-value="visible"
    :title="dialogType === 'add' ? '创建 RoleBinding' : '编辑 RoleBinding'"
    width="800px"
    top="5vh"
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

    <!-- 加载状态 -->
    <div v-if="dataLoading" style="text-align: center; padding: 30px">
      <ElSkeleton :rows="6" animated />
      <div style="margin-top: 12px; color: #909399; font-size: 13px">
        正在加载 RoleBinding 配置...
      </div>
    </div>

    <!-- 表单模式 -->
    <div v-else-if="editMode === 'form'" class="form-content">
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="140px">
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <Link :size="16" />
              <span>基础信息</span>
            </div>
          </div>

          <ElFormItem label="名称" prop="name" required>
            <ElInput
              v-model="formData.name"
              placeholder="例如: my-rolebinding"
              :disabled="dialogType === 'edit'"
              maxlength="63"
              show-word-limit
            >
              <template #suffix>
                <ElTooltip
                  content="小写字母、数字、连字符，以字母或数字开头结尾"
                  placement="top"
                >
                  <HelpCircle :size="13" class="help-icon" />
                </ElTooltip>
              </template>
            </ElInput>
          </ElFormItem>
        </div>

        <!-- Role 引用 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <ShieldCheck :size="16" />
              <span>角色引用 (Role Ref)</span>
            </div>
            <ElTooltip placement="top">
              <template #content>
                <div>指定要绑定的 Role 或 ClusterRole</div>
                <div>此字段创建后不可修改</div>
              </template>
              <HelpCircle :size="13" class="help-icon" />
            </ElTooltip>
          </div>

          <div class="role-ref-card">
            <div class="two-columns">
              <ElFormItem label="类型" prop="roleRef.kind" required>
                <ElSelect
                  v-model="formData.roleRef.kind"
                  :disabled="dialogType === 'edit'"
                  style="width: 100%"
                >
                  <ElOption label="Role" value="Role" />
                  <ElOption label="ClusterRole" value="ClusterRole" />
                </ElSelect>
              </ElFormItem>

              <ElFormItem label="名称" prop="roleRef.name" required>
                <ElInput
                  v-model="formData.roleRef.name"
                  placeholder="角色名称"
                  :disabled="dialogType === 'edit'"
                />
              </ElFormItem>
            </div>

            <ElFormItem label="API Group">
              <ElInput
                v-model="formData.roleRef.apiGroup"
                placeholder="默认: rbac.authorization.k8s.io"
                :disabled="dialogType === 'edit'"
              />
            </ElFormItem>
          </div>
        </div>

        <!-- Subjects -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <Users :size="16" />
              <span>主体 (Subjects)</span>
            </div>
            <ElTooltip placement="top">
              <template #content>
                <div>要绑定的用户、组或 ServiceAccount</div>
                <div>至少需要添加一个主体</div>
              </template>
              <HelpCircle :size="13" class="help-icon" />
            </ElTooltip>
          </div>

          <div v-if="formData.subjects.length > 0" class="subjects-list">
            <div
              v-for="(subject, index) in formData.subjects"
              :key="index"
              class="subject-card"
            >
              <div class="subject-card-header">
                <span>主体 {{ index + 1 }}</span>
                <ElButton
                  type="danger"
                  :icon="Trash2"
                  circle
                  size="small"
                  @click="removeSubject(index)"
                />
              </div>

              <div class="subject-card-body">
                <div class="two-columns">
                  <div class="form-item">
                    <label class="field-label">
                      <span style="color: #f56c6c">* </span>
                      类型
                    </label>
                    <ElSelect v-model="subject.kind" style="width: 100%">
                      <ElOption label="ServiceAccount" value="ServiceAccount" />
                      <ElOption label="User" value="User" />
                      <ElOption label="Group" value="Group" />
                    </ElSelect>
                  </div>

                  <div class="form-item">
                    <label class="field-label">
                      <span style="color: #f56c6c">* </span>
                      名称
                    </label>
                    <ElInput v-model="subject.name" placeholder="主体名称" />
                  </div>
                </div>

                <div class="two-columns">
                  <div class="form-item" v-if="subject.kind === 'ServiceAccount'">
                    <label class="field-label">
                      <span style="color: #f56c6c">* </span>
                      命名空间
                      <ElTooltip content="ServiceAccount 必须指定命名空间" placement="top">
                        <HelpCircle :size="11" class="help-icon" />
                      </ElTooltip>
                    </label>
                    <ElInput v-model="subject.namespace" placeholder="命名空间" />
                  </div>

                  <div class="form-item" v-if="subject.kind !== 'ServiceAccount'">
                    <label class="field-label">
                      API Group
                      <ElTooltip
                        content="User/Group 默认为空，ServiceAccount 默认为空"
                        placement="top"
                      >
                        <HelpCircle :size="11" class="help-icon" />
                      </ElTooltip>
                    </label>
                    <ElInput v-model="subject.apiGroup" placeholder="留空使用默认值" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addSubject">
            添加主体
          </ElButton>
        </div>

        <!-- 标签 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <Tag :size="16" />
              <span>标签 (Labels)</span>
              <span class="optional-mark">可选</span>
            </div>
          </div>

          <div v-if="formData.labels.length > 0" class="labels-list">
            <div v-for="(item, index) in formData.labels" :key="index" class="label-row">
              <ElInput v-model="item.key" placeholder="键" style="width: 200px" maxlength="63" />
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

        <!-- 注解 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <FileText :size="16" />
              <span>注解 (Annotations)</span>
              <span class="optional-mark">可选</span>
            </div>
          </div>

          <div v-if="formData.annotations.length > 0" class="annotations-list">
            <div v-for="(item, index) in formData.annotations" :key="index" class="annotation-row">
              <ElInput
                v-model="item.key"
                placeholder="键"
                style="width: 240px"
                maxlength="253"
              />
              <span class="separator">=</span>
              <ElInput v-model="item.value" placeholder="值" style="flex: 1" />
              <ElButton
                type="danger"
                :icon="Trash2"
                circle
                size="small"
                @click="removeAnnotation(index)"
              />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addAnnotation">
            添加注解
          </ElButton>
        </div>
      </ElForm>
    </div>

    <!-- YAML 模式 -->
    <div v-else-if="editMode === 'yaml'" class="yaml-content">
      <ArtYamlEditor v-model="yamlContent" height="550" @change="handleYamlChange" />
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
    Link,
    ShieldCheck,
    Users,
    Tag,
    FileText,
    FormInput,
    Code,
    Plus,
    Trash2,
    HelpCircle
  } from 'lucide-vue-next'
  import {
    createRoleBindingApi,
    updateRoleBindingApi,
    getRoleBindingYamlApi,
    type RoleBindingListItem,
    type ProjectWorkspace,
    type RoleRefInfo,
    type SubjectInfo
  } from '@/api/workload/core'
  import ArtYamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    visible: boolean
    dialogType: 'add' | 'edit'
    bindingData?: RoleBindingListItem
    workspace: ProjectWorkspace | null
  }

  interface KeyValue {
    key: string
    value: string
  }

  const props = withDefaults(defineProps<Props>(), {
    bindingData: undefined
  })

  const emit = defineEmits(['close', 'success'])

  const formRef = ref()
  const editMode = ref<'form' | 'yaml'>('form')
  const submitting = ref(false)
  const dataLoading = ref(false)
  const yamlContent = ref('')

  const formData = ref({
    name: '',
    roleRef: {
      kind: 'Role',
      name: '',
      apiGroup: 'rbac.authorization.k8s.io'
    } as RoleRefInfo,
    subjects: [] as SubjectInfo[],
    labels: [] as KeyValue[],
    annotations: [] as KeyValue[]
  })

  const formRules = {
    name: [
      { required: true, message: '请输入 RoleBinding 名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '名称格式不正确',
        trigger: 'blur'
      }
    ],
    'roleRef.kind': [{ required: true, message: '请选择角色类型', trigger: 'change' }],
    'roleRef.name': [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
  }

  const handleClose = (val: boolean) => {
    if (!val) {
      emit('close')
    }
  }

  // Subjects 管理
  const addSubject = () => {
    formData.value.subjects.push({
      kind: 'ServiceAccount',
      name: '',
      namespace: props.workspace?.namespace || '',
      apiGroup: ''
    })
  }

  const removeSubject = (index: number) => {
    formData.value.subjects.splice(index, 1)
  }

  // Labels 管理
  const addLabel = () => {
    formData.value.labels.push({ key: '', value: '' })
  }

  const removeLabel = (index: number) => {
    formData.value.labels.splice(index, 1)
  }

  // Annotations 管理
  const addAnnotation = () => {
    formData.value.annotations.push({ key: '', value: '' })
  }

  const removeAnnotation = (index: number) => {
    formData.value.annotations.splice(index, 1)
  }

  // 工具函数
  const objectToArray = (obj?: Record<string, string>): KeyValue[] => {
    if (!obj) return []
    return Object.entries(obj)
      .filter(([key]) => key)
      .map(([key, value]) => ({ key, value }))
  }

  const arrayToObject = (arr: KeyValue[]): Record<string, string> => {
    const obj: Record<string, string> = {}
    arr.forEach((item) => {
      if (item.key && item.key.trim()) {
        obj[item.key.trim()] = item.value
      }
    })
    return obj
  }

  // 表单转 YAML
  const formToYaml = () => {
    const rbObj: any = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        name: formData.value.name || 'rolebinding-name',
        namespace: props.workspace?.namespace || 'default'
      },
      roleRef: {
        apiGroup: formData.value.roleRef.apiGroup || 'rbac.authorization.k8s.io',
        kind: formData.value.roleRef.kind || 'Role',
        name: formData.value.roleRef.name || 'role-name'
      },
      subjects: formData.value.subjects
        .filter((s) => s.kind && s.name)
        .map((s) => {
          const subject: any = {
            kind: s.kind,
            name: s.name
          }
          if (s.namespace) {
            subject.namespace = s.namespace
          }
          if (s.apiGroup) {
            subject.apiGroup = s.apiGroup
          }
          return subject
        })
    }

    // Labels
    const labelsObj = arrayToObject(formData.value.labels)
    if (Object.keys(labelsObj).length > 0) {
      rbObj.metadata.labels = labelsObj
    }

    // Annotations
    const annotationsObj = arrayToObject(formData.value.annotations)
    if (Object.keys(annotationsObj).length > 0) {
      rbObj.metadata.annotations = annotationsObj
    }

    yamlContent.value = yaml.dump(rbObj, { indent: 2 })
  }

  // YAML 转表单
  const yamlToForm = (yamlStr: string) => {
    try {
      const obj = yaml.load(yamlStr) as any

      formData.value.name = obj.metadata?.name || ''

      // RoleRef
      formData.value.roleRef = {
        kind: obj.roleRef?.kind || 'Role',
        name: obj.roleRef?.name || '',
        apiGroup: obj.roleRef?.apiGroup || 'rbac.authorization.k8s.io'
      }

      // Subjects
      formData.value.subjects = (obj.subjects || []).map((s: any) => ({
        kind: s.kind || 'ServiceAccount',
        name: s.name || '',
        namespace: s.namespace || '',
        apiGroup: s.apiGroup || ''
      }))

      // Labels
      formData.value.labels = objectToArray(obj.metadata?.labels)

      // Annotations
      formData.value.annotations = objectToArray(obj.metadata?.annotations)
    } catch (error) {
      console.error('YAML 解析失败:', error)
      throw error
    }
  }

  // 加载 YAML
  const loadRoleBindingYAML = async () => {
    if (!props.workspace || !props.bindingData) {
      return
    }

    dataLoading.value = true
    try {
      const yamlStr = await getRoleBindingYamlApi({
        clusterUuid: props.workspace.clusterUuid!,
        namespace: props.workspace.namespace!,
        name: props.bindingData.name
      })

      yamlContent.value = yamlStr
      yamlToForm(yamlStr)
    } catch (error: any) {
      console.error('加载失败:', error)
      emit('close')
    } finally {
      dataLoading.value = false
    }
  }

  // 监听对话框打开
  watch(
    () => props.visible,
    async (val) => {
      if (val) {
        if (props.dialogType === 'edit' && props.bindingData && props.workspace) {
          await loadRoleBindingYAML()
        } else if (props.dialogType === 'add') {
          // 初始化一个空的 Subject
          formData.value.subjects = [
            {
              kind: 'ServiceAccount',
              name: '',
              namespace: props.workspace?.namespace || '',
              apiGroup: ''
            }
          ]
          await nextTick()
          formToYaml()
        }
      }
    },
    { immediate: true }
  )

  // 监听编辑模式切换
  watch(editMode, (newMode, oldMode) => {
    if (newMode === 'yaml' && oldMode === 'form') {
      formToYaml()
    } else if (newMode === 'form' && oldMode === 'yaml') {
      try {
        yamlToForm(yamlContent.value)
        ElMessage.success('已切换到表单模式')
      } catch (error) {
        ElMessage.error('YAML 格式错误，无法切换到表单模式')
        nextTick(() => {
          editMode.value = 'yaml'
        })
      }
    }
  })

  // 监听表单数据变化
  watch(
    () => formData.value,
    () => {
      if (editMode.value === 'form' && !dataLoading.value) {
        formToYaml()
      }
    },
    { deep: true }
  )

  const handleYamlChange = (content: string) => {
    yamlContent.value = content
  }

  // 提交
  const handleSubmit = async () => {
    if (!props.workspace) {
      return
    }

    if (editMode.value === 'form') {
      try {
        await formRef.value?.validate()
      } catch (error) {
        return
      }

      // 验证至少有一个 Subject
      if (formData.value.subjects.length === 0) {
        ElMessage.error('至少需要添加一个主体')
        return
      }

      // 验证所有 Subject 都填写了必填字段
      const hasInvalidSubject = formData.value.subjects.some((s) => {
        if (!s.kind || !s.name) return true
        if (s.kind === 'ServiceAccount' && !s.namespace) return true
        return false
      })

      if (hasInvalidSubject) {
        ElMessage.error('请完整填写所有主体信息')
        return
      }

      formToYaml()
    }

    submitting.value = true
    try {
      if (props.dialogType === 'add') {
        await createRoleBindingApi({
          clusterUuid: props.workspace.clusterUuid!,
          namespace: props.workspace.namespace!,
          yamlStr: yamlContent.value
        })
        ElMessage.success('创建成功')
      } else {
        await updateRoleBindingApi({
          clusterUuid: props.workspace.clusterUuid!,
          namespace: props.workspace.namespace!,
          name: formData.value.name,
          yamlStr: yamlContent.value
        })
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
      name: '',
      roleRef: {
        kind: 'Role',
        name: '',
        apiGroup: 'rbac.authorization.k8s.io'
      },
      subjects: [],
      labels: [],
      annotations: []
    }
    yamlContent.value = ''
    editMode.value = 'form'
  }
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
    max-height: 65vh;
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
    margin-bottom: 20px;
    padding: 18px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 10px;
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: #d0d3d9;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e4e7ed;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #303133;

        svg {
          color: #409eff;
        }
      }

      .optional-mark {
        margin-left: 8px;
        font-size: 11px;
        font-weight: 400;
        color: #909399;
        background: #f4f4f5;
        padding: 2px 8px;
        border-radius: 10px;
      }
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

  .role-ref-card {
    padding: 14px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
  }

  .subjects-list,
  .labels-list,
  .annotations-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }

  .subject-card {
    background: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    overflow: hidden;
  }

  .subject-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 13px;
  }

  .subject-card-body {
    padding: 14px;
  }

  .two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #495057;
  }

  .label-row,
  .annotation-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    transition: all 0.2s;

    &:hover {
      border-color: #c0c4cc;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    .separator {
      color: #6c757d;
      font-weight: 600;
      font-size: 13px;
      flex-shrink: 0;
    }
  }

  .yaml-content {
    min-height: 550px;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }

  :deep(.el-input__inner) {
    font-size: 13px;
  }
</style>