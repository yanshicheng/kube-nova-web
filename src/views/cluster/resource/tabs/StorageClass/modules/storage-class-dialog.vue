<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="960px"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
    @opened="handleDialogOpened"
  >
    <!-- 顶部工具栏 -->
    <div class="dialog-toolbar">
      <!-- 帮助按钮 -->
      <ElPopover placement="bottom-start" :width="520" trigger="click">
        <template #reference>
          <ElButton :icon="InfoCircleIcon" circle size="small" />
        </template>
        <div class="help-popover">
          <h4>StorageClass 使用说明</h4>
          <div class="help-content">
            <p><strong>什么是 StorageClass？</strong></p>
            <p>
              StorageClass
              为管理员提供了描述存储"类"的方法，不同的类可能映射到不同的服务质量等级、备份策略或由管理员确定的策略。
            </p>

            <p><strong>核心概念：</strong></p>
            <ul>
              <li><strong>供应商 (Provisioner)：</strong>决定使用哪个存储插件来动态创建 PV</li>
              <li
                ><strong>回收策略：</strong>PVC 删除后，PV 的处理方式（Delete 删除/Retain 保留）</li
              >
              <li>
                <strong>绑定模式：</strong>Immediate 立即绑定/WaitForFirstConsumer
                等待首次使用时绑定
              </li>
              <li><strong>允许扩容：</strong>是否允许在不重建 PVC 的情况下扩容</li>
            </ul>

            <p><strong>常用供应商：</strong></p>
            <ul>
              <li><strong>OpenEBS：</strong>Kubernetes 原生的容器化存储解决方案</li>
              <li><strong>Longhorn：</strong>轻量级、可靠的分布式块存储</li>
              <li><strong>Ceph：</strong>高性能、可扩展的分布式存储系统</li>
              <li><strong>NFS：</strong>网络文件系统，适合共享存储</li>
              <li><strong>Local Path：</strong>本地路径存储，适合单节点或开发环境</li>
            </ul>

            <p><strong>注意事项：</strong></p>
            <ul>
              <li>供应商一旦设置，编辑时不可修改</li>
              <li>一个集群可以有多个 StorageClass，但只能有一个默认的</li>
              <li>删除 StorageClass 不会删除已创建的 PV</li>
            </ul>
          </div>
        </div>
      </ElPopover>

      <!-- 编辑模式切换 -->
      <ElRadioGroup v-model="editMode" size="small">
        <ElRadioButton value="form">
          <FormInputIcon :size="14" />
          <span>表单</span>
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <FileCodeIcon :size="14" />
          <span>YAML</span>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 转换错误提示 -->
    <ElAlert
      v-if="convertError"
      :title="convertError"
      type="error"
      :closable="true"
      @close="convertError = ''"
      style="margin-bottom: 16px"
      show-icon
    />

    <!-- 加载状态 -->
    <div v-if="initialLoading" class="loading-container">
      <ElIcon class="is-loading" :size="32">
        <LoaderIcon />
      </ElIcon>
      <span>正在加载资源数据...</span>
    </div>

    <!-- 表单模式 -->
    <div v-show="editMode === 'form' && !initialLoading" class="form-container">
      <StorageClassForm
        ref="formRef"
        v-model="formData"
        :disabled="loading"
        :is-edit="dialogType === 'edit'"
      />
    </div>

    <!-- YAML 模式 -->
    <div v-show="editMode === 'yaml' && !initialLoading" class="yaml-container">
      <YamlEditorPro
        v-model="yamlContent"
        :readonly="loading"
        :filename="`${formData.name || 'storageclass'}.yaml`"
        :show-toolbar="true"
        :show-status-bar="true"
        height="550px"
        @valid-change="handleYamlValidChange"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" :disabled="loading">取消</ElButton>
        <ElButton
          type="primary"
          @click="handleSubmit"
          :loading="loading"
          :disabled="(editMode === 'yaml' && !isYamlValid) || initialLoading"
        >
          {{ loading ? '提交中...' : submitText }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    FormInput as FormInputIcon,
    FileCode as FileCodeIcon,
    Info as InfoCircleIcon,
    Loader as LoaderIcon
  } from 'lucide-vue-next'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'
  import StorageClassForm from './storage-class-form.vue'
  import {
    createStorageClassApi,
    updateStorageClassApi,
    getStorageClassYamlApi
  } from '@/api/workload/cluster-resource'
  import {
    storageClassYamlToForm,
    storageClassFormToYaml,
    validateStorageClassForm,
    createEmptyStorageClassForm
  } from './type'
  import type { StorageClassFormData } from './type'

  interface Props {
    modelValue: boolean
    dialogType: 'create' | 'edit'
    clusterUuid: string
    resourceName?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    resourceName: ''
  })

  const emit = defineEmits<Emits>()

  // 状态
  const editMode = ref<'form' | 'yaml'>('form')
  const formData = ref<StorageClassFormData>(createEmptyStorageClassForm())
  const yamlContent = ref('')
  const loading = ref(false)
  const initialLoading = ref(false)
  const isYamlValid = ref(true)
  const convertError = ref('')
  const isInitializing = ref(false)

  // 表单引用
  const formRef = ref()

  // 计算属性
  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const dialogTitle = computed(() => {
    return props.dialogType === 'create'
      ? '创建 StorageClass'
      : `编辑 StorageClass: ${props.resourceName}`
  })

  const submitText = computed(() => {
    return props.dialogType === 'create' ? '创建' : '保存'
  })

  // 表单数据变化时，同步到 YAML（仅在表单模式下）
  watch(
    formData,
    () => {
      if (editMode.value === 'form' && !isInitializing.value) {
        try {
          const isEdit = props.dialogType === 'edit'
          yamlContent.value = storageClassFormToYaml(formData.value, isEdit)
          convertError.value = ''
        } catch (error: any) {
          console.error('表单转 YAML 失败:', error)
          // 不显示错误，因为实时转换可能有中间状态
        }
      }
    },
    { deep: true }
  )

  // 监听模式切换
  watch(editMode, (newMode, oldMode) => {
    if (!oldMode || isInitializing.value) return

    convertError.value = ''

    if (newMode === 'form' && oldMode === 'yaml') {
      // YAML -> 表单：需要验证和转换
      try {
        const parsed = storageClassYamlToForm(yamlContent.value)
        formData.value = parsed
      } catch (error: any) {
        convertError.value = `YAML 转表单失败: ${error.message}`
        // 转换失败，切回 YAML 模式
        nextTick(() => {
          editMode.value = 'yaml'
        })
      }
    }
    // 表单 -> YAML：已经通过 watch formData 自动同步了
  })

  // 监听弹窗打开
  watch(
    () => props.modelValue,
    async (val) => {
      if (val) {
        // 重置状态
        convertError.value = ''
        editMode.value = 'form'
        isInitializing.value = true

        if (props.dialogType === 'create') {
          // 创建模式：重置为空表单
          formData.value = createEmptyStorageClassForm()
          await nextTick()
          yamlContent.value = storageClassFormToYaml(formData.value, false)
          isInitializing.value = false
        }
        // 编辑模式在 handleDialogOpened 中处理
      }
    }
  )

  // 弹窗完全打开后加载数据（避免动画卡顿）
  const handleDialogOpened = async () => {
    if (props.dialogType === 'edit' && props.resourceName && isInitializing.value) {
      await loadExistingYaml()
    }
  }

  // 加载现有资源的 YAML
  const loadExistingYaml = async () => {
    try {
      initialLoading.value = true
      const yaml = await getStorageClassYamlApi({
        clusterUuid: props.clusterUuid,
        name: props.resourceName!
      })

      yamlContent.value = yaml

      // 解析 YAML 到表单数据
      try {
        formData.value = storageClassYamlToForm(yaml)
      } catch (parseError: any) {
        console.error('解析 YAML 失败:', parseError)
        // 解析失败时切换到 YAML 模式
        editMode.value = 'yaml'
        convertError.value = `表单解析失败: ${parseError.message}，已切换到 YAML 模式`
      }
    } catch (error: any) {
      console.error('加载 YAML 失败:', error)
      visible.value = false
    } finally {
      initialLoading.value = false
      isInitializing.value = false
    }
  }

  // 处理 YAML 验证状态变化
  const handleYamlValidChange = (valid: boolean) => {
    isYamlValid.value = valid
  }

  // 关闭弹窗
  const handleClose = () => {
    if (loading.value) return
    visible.value = false
  }

  // 提交
  const handleSubmit = async () => {
    let finalYaml = ''

    // 如果是 YAML 模式，先转换到表单进行验证
    if (editMode.value === 'yaml') {
      if (!isYamlValid.value) {
        ElMessage.warning('YAML 格式错误，请修正后再提交')
        return
      }

      try {
        formData.value = storageClassYamlToForm(yamlContent.value)
      } catch (error: any) {
        ElMessage.error(`YAML 解析失败: ${error.message}`)
        return
      }
    }

    // 验证表单数据
    try {
      validateStorageClassForm(formData.value)
    } catch (error: any) {
      ElMessage.warning(error.message)
      return
    }

    // 生成最终 YAML
    try {
      const isEdit = props.dialogType === 'edit'
      finalYaml = storageClassFormToYaml(formData.value, isEdit)
    } catch (error: any) {
      return
    }

    // 确认提交（编辑模式）
    if (props.dialogType === 'edit') {
      try {
        await ElMessageBox.confirm(
          `确定要保存对 StorageClass "${formData.value.name}" 的修改吗？`,
          '确认修改',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch {
        return
      }
    }

    // 提交请求
    loading.value = true
    try {
      const api = props.dialogType === 'create' ? createStorageClassApi : updateStorageClassApi
      await api({
        clusterUuid: props.clusterUuid,
        yamlStr: finalYaml
      })

      ElMessage.success(props.dialogType === 'create' ? '创建成功' : '保存成功')
      emit('success')
      visible.value = false
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .dialog-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;

    :deep(.el-radio-group) {
      .el-radio-button__inner {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  }

  .help-popover {
    h4 {
      margin: 0 0 12px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .help-content {
      font-size: 13px;
      line-height: 1.6;
      color: #606266;

      p {
        margin: 0 0 8px;

        strong {
          color: #409eff;
          font-weight: 600;
        }
      }

      ul {
        margin: 4px 0 12px;
        padding-left: 20px;

        li {
          margin-bottom: 4px;

          strong {
            color: #409eff;
          }
        }
      }
    }
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #909399;
    gap: 16px;

    .el-icon {
      color: #409eff;
    }
  }

  .form-container {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c0c4cc;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-track {
      background: #f5f7fa;
    }
  }

  .yaml-container {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e4e7ed;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
