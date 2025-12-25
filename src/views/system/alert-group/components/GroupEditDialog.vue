// ============================================
// 文件: components/GroupEditDialog.vue
// 用途: 编辑告警组基本信息
// ============================================
<template>
  <el-dialog
    v-model="visible"
    title="编辑告警组"
    width="750px"
    @close="handleClose"
    class="group-edit-dialog modern-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="110px"
      label-position="right"
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="告警组名称" prop="groupName">
            <el-input
              v-model="form.groupName"
              placeholder="如：运维一组"
              maxlength="50"
              show-word-limit
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序序号">
            <el-input-number
              v-model="form.sortOrder"
              :min="0"
              :max="9999"
              style="width: 100%"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="组类型" prop="groupType">
        <div class="type-selector">
          <div
            class="type-option"
            :class="{ active: form.groupType === 'normal' }"
            @click="form.groupType = 'normal'"
          >
            <div class="option-content">
              <div class="option-header">
                <el-icon class="type-icon" :size="20"><UserFilled /></el-icon>
                <span class="option-title">普通组</span>
                <el-icon v-if="form.groupType === 'normal'" class="check-icon" color="#409eff">
                  <Check />
                </el-icon>
              </div>
              <div class="option-desc">固定成员的告警组</div>
            </div>
          </div>
          <div
            class="type-option"
            :class="{ active: form.groupType === 'duty' }"
            @click="form.groupType = 'duty'"
          >
            <div class="option-content">
              <div class="option-header">
                <el-icon class="type-icon" :size="20"><Clock /></el-icon>
                <span class="option-title">值班组</span>
                <el-icon v-if="form.groupType === 'duty'" class="check-icon" color="#409eff">
                  <Check />
                </el-icon>
              </div>
              <div class="option-desc">支持值班排班的告警组</div>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入告警组描述信息（选填）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="过滤规则">
        <el-input
          v-model="form.filterRules"
          type="textarea"
          :rows="4"
          placeholder="JSON格式的标签匹配规则（选填）"
        />
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          示例：{"matchType":"all","rules":[{"label":"service","operator":"in","values":["order-service"]}]}
        </div>
      </el-form-item>

      <template v-if="form.groupType === 'duty'">
        <el-form-item label="值班排班表">
          <el-input
            v-model="form.dutySchedule"
            type="textarea"
            :rows="5"
            placeholder="JSON格式的值班排班表"
          />
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            值班组特有配置，用于定义值班人员的排班规则
          </div>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" size="large">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit" size="large">
          <el-icon v-if="!submitLoading"><Check /></el-icon>
          {{ submitLoading ? '保存中...' : '保存' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { Check, UserFilled, Clock, InfoFilled } from '@element-plus/icons-vue'
  import {
    getAlertGroupsByIdApi,
    updateAlertGroupsApi,
    type UpdateAlertGroupsRequest
  } from '@/api/portal/alert'

  interface Props {
    modelValue: boolean
    groupId?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'success'])

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()

  const form = reactive({
    groupName: '',
    groupType: 'normal',
    description: '',
    filterRules: '',
    sortOrder: 0,
    dutySchedule: ''
  })

  const formRules = reactive<FormRules>({
    groupName: [{ required: true, message: '请输入告警组名称', trigger: 'blur' }],
    groupType: [{ required: true, message: '请选择组类型', trigger: 'change' }]
  })

  // 加载数据
  const loadData = async () => {
    if (!props.groupId) return

    try {
      const res = await getAlertGroupsByIdApi(props.groupId)
      form.groupName = res.groupName
      form.groupType = res.groupType
      form.description = res.description || ''
      form.filterRules = res.filterRules || ''
      form.sortOrder = res.sortOrder || 0
      form.dutySchedule = res.dutySchedule || ''
    } catch (error) {
      // 错误已统一处理
    }
  }

  // 提交
  const handleSubmit = async () => {
    if (!formRef.value || !props.groupId) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      submitLoading.value = true
      try {
        const params: UpdateAlertGroupsRequest = {
          id: props.groupId!,
          groupName: form.groupName,
          groupType: form.groupType,
          description: form.description,
          filterRules: form.filterRules,
          dutySchedule: form.dutySchedule,
          sortOrder: form.sortOrder
        }

        await updateAlertGroupsApi(params)
        ElMessage.success('更新成功')
        visible.value = false
        emit('success')
      } finally {
        submitLoading.value = false
      }
    })
  }

  // 关闭对话框
  const handleClose = () => {
    formRef.value?.resetFields()
  }

  // 监听 visible 和 groupId 变化
  watch(
    [() => visible.value, () => props.groupId],
    ([isVisible, groupId]) => {
      if (isVisible && groupId) {
        loadData()
      }
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .group-edit-dialog.modern-dialog {
    :deep(.el-dialog__header) {
      padding: 24px 24px 20px;
      border-bottom: 1px solid #e4e7ed;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

      .el-dialog__title {
        color: white;
        font-weight: 600;
        font-size: 18px;
      }

      .el-dialog__close {
        color: white;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }

    :deep(.el-dialog__body) {
      padding: 24px;
      background: #fafbfc;
    }

    :deep(.el-dialog__footer) {
      padding: 16px 24px;
      border-top: 1px solid #e4e7ed;
      background: white;
    }

    .type-selector {
      display: flex;
      gap: 16px;
      width: 100%;

      .type-option {
        flex: 1;
        border: 2px solid #dcdfe6;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        &:hover {
          border-color: #409eff;
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
          transform: translateY(-2px);
        }

        &.active {
          border-color: #409eff;
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
        }

        .option-content {
          .option-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;

            .type-icon {
              margin-right: 8px;
              color: #409eff;
            }

            .option-title {
              flex: 1;
              font-size: 16px;
              font-weight: 600;
              color: #303133;
            }

            .check-icon {
              font-size: 20px;
            }
          }

          .option-desc {
            font-size: 13px;
            color: #909399;
            line-height: 1.6;
            padding-left: 28px;
          }
        }
      }
    }

    .form-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
      line-height: 1.6;
      display: flex;
      align-items: flex-start;
      gap: 6px;

      .el-icon {
        margin-top: 2px;
        color: #409eff;
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;

      .el-button {
        min-width: 100px;
      }
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #606266;
    }

    :deep(.el-input__inner),
    :deep(.el-textarea__inner) {
      border-radius: 8px;
      transition: all 0.3s;

      &:focus {
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
      }
    }
  }
</style>