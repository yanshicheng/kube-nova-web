<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增部门' : '编辑部门'"
    width="600px"
    align-center
    @close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElFormItem label="上级部门" prop="parentId">
        <ElTreeSelect
          v-model="formData.parentId"
          :data="parentTreeOptions"
          :render-after-expand="false"
          placeholder="选择上级部门（不选则为顶级部门）"
          check-strictly
          clearable
          :disabled="loading"
          style="width: 100%"
          :props="{
            label: 'name',
            value: 'id'
          }"
        />
      </ElFormItem>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="部门名称" prop="name">
            <ElInput
              v-model="formData.name"
              placeholder="请输入部门名称"
              maxlength="30"
              :disabled="loading"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="显示排序" prop="sort">
            <ElInputNumber
              v-model="formData.sort"
              :min="0"
              :max="9999"
              controls-position="right"
              style="width: 100%"
              :disabled="loading"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="负责人" prop="leader">
            <ElInput
              v-model="formData.leader"
              placeholder="请输入负责人姓名"
              maxlength="20"
              :disabled="loading"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="联系电话" prop="phone">
            <ElInput
              v-model="formData.phone"
              placeholder="请输入联系电话"
              maxlength="20"
              :disabled="loading"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElFormItem label="邮箱" prop="email">
        <ElInput
          v-model="formData.email"
          placeholder="请输入邮箱"
          maxlength="50"
          :disabled="loading"
        />
      </ElFormItem>

      <ElFormItem label="部门状态" prop="status">
        <ElRadioGroup v-model="formData.status" :disabled="loading">
          <ElRadio :label="1">启用</ElRadio>
          <ElRadio :label="0">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="备注" prop="remark">
        <ElInput
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          maxlength="200"
          show-word-limit
          :disabled="loading"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" :disabled="loading">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading">
          {{
            loading
              ? dialogType === 'add'
                ? '新增中...'
                : '更新中...'
              : dialogType === 'add'
                ? '新增'
                : '更新'
          }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    addDeptApi,
    updateDeptApi,
    type DeptSysDeptTree,
    type DeptAddRequest,
    type DeptUpdateRequest
  } from '@/api/portal/dept'

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    deptData: DeptSysDeptTree | null
    deptTree: DeptSysDeptTree[]
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void

    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    deptData: null,
    deptTree: () => []
  })

  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 表单实例
  const formRef = ref<FormInstance>()
  const loading = ref(false) // 内部管理loading状态

  // 表单数据
  const formData = reactive({
    id: 0,
    name: '',
    parentId: 0 as number | undefined,
    remark: '',
    leader: '',
    phone: '',
    email: '',
    status: 1,
    sort: 0
  })

  // 表单验证规则
  const rules: FormRules = {
    name: [
      { required: true, message: '请输入部门名称', trigger: 'blur' },
      { min: 2, max: 30, message: '部门名称长度在 2 到 30 个字符', trigger: 'blur' }
    ],
    sort: [{ required: true, message: '请输入显示排序', trigger: 'blur' }],
    phone: [
      {
        pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/,
        message: '请输入正确的电话格式',
        trigger: 'blur'
      }
    ],
    email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }]
  }

  // 处理部门树，过滤掉当前编辑的部门及其子部门
  const filterTree = (tree: DeptSysDeptTree[], excludeId?: number): DeptSysDeptTree[] => {
    return tree
      .filter((item) => {
        // 如果是当前编辑的部门，则过滤掉
        if (item.id === excludeId) {
          return false
        }

        // 递归处理子部门
        if (item.children && item.children.length > 0) {
          item = {
            ...item,
            children: filterTree(item.children, excludeId)
          }
        }

        return true
      })
      .map((item) => ({
        ...item,
        children:
          item.children && item.children.length > 0 ? filterTree(item.children, excludeId) : []
      }))
  }

  // 父部门选项（编辑时需要过滤掉自己及子部门）
  const parentTreeOptions = computed(() => {
    if (props.dialogType === 'edit' && formData.id) {
      return filterTree(props.deptTree, formData.id)
    }
    return props.deptTree
  })

  // 初始化表单数据
  const initFormData = () => {
    if (props.dialogType === 'edit' && props.deptData) {
      // 编辑模式，填充数据
      const dept = props.deptData
      Object.assign(formData, {
        id: dept.id,
        name: dept.name,
        parentId: dept.parentId || 0,
        remark: dept.remark || '',
        leader: dept.leader || '',
        phone: dept.phone || '',
        email: dept.email || '',
        status: dept.status ?? 1,
        sort: dept.sort || 0
      })
    } else {
      // 新增模式
      Object.assign(formData, {
        id: 0,
        name: '',
        parentId: props.deptData?.id || 0, // 如果有父部门数据，设置为父部门ID
        remark: '',
        leader: '',
        phone: '',
        email: '',
        status: 1,
        sort: 0
      })
    }

    // 如果 parentId 为 0，设置为 undefined（顶级部门）
    if (formData.parentId === 0) {
      formData.parentId = undefined
    }
  }

  // 监听对话框状态变化
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    }
  )

  // 关闭对话框
  const handleClose = () => {
    if (loading.value) {
      return
    }
    visible.value = false
    formRef.value?.resetFields()
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      // 编辑时进行二次确认
      if (props.dialogType === 'edit') {
        await ElMessageBox.confirm(`确定要保存对部门"${formData.name}"的修改吗？`, '确认修改部门', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      }

      loading.value = true // 开始loading

      // 处理 parentId，如果为 undefined 则设为 0（顶级部门）
      const parentId = formData.parentId || 0

      if (props.dialogType === 'add') {
        // 新增部门
        const addData: DeptAddRequest = {
          name: formData.name,
          parentId,
          remark: formData.remark,
          leader: formData.leader,
          phone: formData.phone,
          email: formData.email,
          status: formData.status,
          sort: formData.sort
        }
        await addDeptApi(addData)
        ElMessage.success('新增成功')
      } else {
        // 更新部门
        const updateData: DeptUpdateRequest = {
          id: formData.id,
          name: formData.name,
          parentId,
          remark: formData.remark,
          leader: formData.leader,
          phone: formData.phone,
          email: formData.email,
          status: formData.status,
          sort: formData.sort
        }
        await updateDeptApi(updateData)
        ElMessage.success('更新成功')
      }

      emit('success')
      visible.value = false
    } catch (error: any) {
      if (error === 'cancel') {
        // 用户取消了确认
        return
      } else if (error === false) {
        // 表单验证失败
      } else {
      }
    } finally {
      loading.value = false // 结束loading
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
