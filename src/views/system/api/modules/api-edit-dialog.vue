<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="500px"
    align-center
    @close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElForm
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="100px"
      :validate-on-rule-change="false"
      :status-icon="false"
    >
      <ElFormItem label="父级分组" prop="parentId">
        <ElTreeSelect
          v-model="form.parentId"
          :data="treeData"
          :props="treeProps"
          :disabled="loading"
          placeholder="请选择父级分组"
          clearable
          check-strictly
          :render-after-expand="false"
          style="width: 100%"
        />
      </ElFormItem>

      <ElFormItem label="类型" prop="isPermission">
        <ElRadioGroup v-model="form.isPermission" :disabled="loading || dialogType === 'edit'">
          <ElRadio :label="0">分组</ElRadio>
          <ElRadio :label="1">API权限</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="名称" prop="name">
        <ElInput
          v-model="form.name"
          :placeholder="form.isPermission === 0 ? '请输入分组名称' : '请输入API名称'"
          :disabled="loading"
          maxlength="100"
          show-word-limit
        />
      </ElFormItem>

      <ElFormItem v-if="form.isPermission === 1" label="API路径" prop="path">
        <ElInput
          v-model="form.path"
          placeholder="请输入API路径，如 /api/users/:id"
          :disabled="loading"
          maxlength="255"
        />
      </ElFormItem>

      <ElFormItem v-if="form.isPermission === 1" label="HTTP方法" prop="method">
        <ElSelect
          v-model="form.method"
          placeholder="请选择HTTP方法"
          :disabled="loading"
          style="width: 100%"
        >
          <ElOption
            v-for="item in methodOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
              "
            >
              <span>{{ item.label }}</span>
              <ElTag :type="item.type as any" size="small">{{ item.value }}</ElTag>
            </div>
          </ElOption>
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleCancel" :disabled="loading">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading">
          {{ loading ? (dialogType === 'add' ? '创建中...' : '更新中...') : '提交' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    addApiApi,
    updateApiApi,
    getApiGroupsTreeApi,
    type ApiSysAPI,
    type ApiAddRequest,
    type ApiUpdateRequest,
    type ApiGroupTreeNode
  } from '@/api'

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    apiData?: ApiSysAPI
    parentId?: number
    isGroup?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void

    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    apiData: undefined,
    parentId: 0,
    isGroup: false
  })

  const emit = defineEmits<Emits>()

  // 对话框标题
  const dialogTitle = computed(() => {
    if (props.dialogType === 'add') {
      return props.isGroup ? '新增分组' : '新增API'
    } else {
      return props.isGroup ? '编辑分组' : '编辑API'
    }
  })

  // HTTP方法选项
  const methodOptions = [
    { label: '*', value: '*', type: '' }, // 把 * 作为默认选项
    { label: 'GET', value: 'GET', type: 'success' },
    { label: 'POST', value: 'POST', type: 'primary' },
    { label: 'PUT', value: 'PUT', type: 'warning' },
    { label: 'DELETE', value: 'DELETE', type: 'danger' },
    { label: 'PATCH', value: 'PATCH', type: 'info' },
    { label: 'OPTIONS', value: 'OPTIONS', type: '' },
    { label: 'HEAD', value: 'HEAD', type: '' }
  ]

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const treeData = ref<ApiGroupTreeNode[]>([])

  // 树形选择器配置
  const treeProps = {
    label: 'name',
    value: 'id',
    children: 'children'
  }

  // 表单数据
  const form = reactive({
    id: 0,
    parentId: 0,
    name: '',
    path: '',
    method: '*', // 默认值改为 *
    isPermission: 1
  })

  // 使用 ref 而不是 computed，避免动态计算导致的验证触发
  const formRules = ref<FormRules>({
    name: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    isPermission: [{ required: true, message: '请选择类型', trigger: 'change' }],
    path: [
      { required: true, message: '请输入API路径', trigger: 'blur' },
      { max: 255, message: '路径长度不能超过 255 个字符', trigger: 'blur' }
    ],
    method: [{ required: true, message: '请选择HTTP方法', trigger: 'change' }]
  })

  // 监听 isPermission 变化，更新验证规则
  watch(
    () => form.isPermission,
    (newVal) => {
      // 延迟更新规则，避免立即触发验证
      nextTick(() => {
        if (newVal === 0) {
          // 分组：移除 path 和 method 的验证
          delete formRules.value.path
          delete formRules.value.method
        } else {
          // API：添加 path 和 method 的验证
          formRules.value.path = [
            { required: true, message: '请输入API路径', trigger: 'blur' },
            { max: 255, message: '路径长度不能超过 255 个字符', trigger: 'blur' }
          ]
          formRules.value.method = [
            { required: true, message: '请选择HTTP方法', trigger: 'change' }
          ]
        }
        // 清除验证状态
        formRef.value?.clearValidate(['path', 'method'])
      })
    }
  )

  // 加载分组树
  const loadGroupTree = async () => {
    try {
      const response = await getApiGroupsTreeApi({ isPermission: 0 })
      // 添加根节点选项
      treeData.value = [
        {
          id: 0,
          name: '根节点',
          pid: 0,
          children: response || []
        }
      ]
    } catch (error) {
      console.error('加载分组树失败:', error)
    }
  }

  // 监听弹窗打开，初始化表单数据
  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal) {
        // 先重置表单
        if (formRef.value) {
          formRef.value.resetFields()
        }

        // 加载分组树
        await loadGroupTree()

        // 初始化表单数据
        initForm()

        // 延迟清除验证，确保DOM更新完成
        await nextTick()
        await nextTick() // 双重 nextTick 确保完全更新
        formRef.value?.clearValidate()
      }
    }
  )

  // 监听数据变化
  watch(
    () => props.apiData,
    (newData) => {
      if (newData && props.modelValue) {
        initForm()
      }
    },
    { deep: true }
  )

  // 监听父级ID变化
  watch(
    () => props.parentId,
    (newParentId) => {
      if (props.dialogType === 'add' && newParentId !== undefined) {
        form.parentId = newParentId
      }
    }
  )

  // 初始化表单
  const initForm = () => {
    if (props.dialogType === 'edit' && props.apiData) {
      form.id = props.apiData.id
      form.parentId = props.apiData.parentId
      form.name = props.apiData.name
      form.path = props.apiData.path || ''
      form.method = props.apiData.method || '*'
      form.isPermission = props.apiData.isPermission
    } else {
      form.id = 0
      form.parentId = props.parentId || 0
      form.name = ''
      form.path = ''
      form.method = '*' // 默认为 *
      form.isPermission = props.isGroup ? 0 : 1
    }
  }

  // 处理取消按钮
  const handleCancel = () => {
    if (loading.value) {
      return
    }
    visible.value = false
  }

  // 处理对话框关闭事件
  const handleClose = () => {
    if (loading.value) {
      return
    }
    // 延迟重置，避免关闭动画时出现闪烁
    setTimeout(() => {
      formRef.value?.resetFields()
      formRef.value?.clearValidate()
    }, 300)
    loading.value = false
  }

  // 处理提交
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      // 编辑时进行二次确认
      if (props.dialogType === 'edit') {
        await ElMessageBox.confirm(`确定要保存对"${form.name}"的修改吗？`, '确认修改', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      }

      loading.value = true

      if (props.dialogType === 'add') {
        const addData: ApiAddRequest = {
          parentId: form.parentId || 0,
          name: form.name,
          path: form.isPermission === 1 ? form.path : '',
          method: form.isPermission === 1 ? form.method : '',
          isPermission: form.isPermission
        }
        await addApiApi(addData)
        ElMessage.success(form.isPermission === 0 ? '分组创建成功' : 'API创建成功')
      } else {
        const updateData: ApiUpdateRequest = {
          id: form.id,
          parentId: form.parentId || 0,
          name: form.name,
          path: form.isPermission === 1 ? form.path : '',
          method: form.isPermission === 1 ? form.method : '',
          isPermission: form.isPermission
        }
        await updateApiApi(updateData)
        ElMessage.success('修改成功')
      }

      emit('success')
      visible.value = false
      loading.value = false
    } catch (error: any) {
      if (error === 'cancel') {
        return
      }
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
