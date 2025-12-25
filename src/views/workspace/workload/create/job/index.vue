<template>
  <div class="job-create-wizard">
    <!-- 步骤卡片 -->
    <WorkloadStepsCard
      :steps="steps"
      :current-step="currentStep"
      :mode="mode"
      :namespace="currentNamespace"
      resource-type="Job"
      v-model:edit-mode="editMode"
      :is-valid="isValid"
      :creating="creating"
      @back="handleBack"
      @submit="handleSave"
      @step-click="goToStep"
    />

    <!-- 主内容卡片 -->
    <ElCard class="wizard-content-card" shadow="hover">
      <template v-if="editMode === 'form'">
        <!-- 步骤内容 -->
        <Transition name="step" mode="out-in">
          <component
            :is="currentStepComponent"
            :key="`${currentStep}-${componentKey}`"
            :mode="mode"
            ref="currentStepRef"
            @validate="handleValidation"
          />
        </Transition>
      </template>

      <!-- YAML模式 -->
      <template v-else>
        <YamlEditor
          v-model="yamlContent"
          :filename="`${metadataStore.metadata.nameEn || 'job'}.yaml`"
          :readonly="false"
          height="600px"
          @change="handleYamlChange"
          @save="handleYamlSave"
        />
      </template>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import {
    ref,
    computed,
    watch,
    provide,
    onMounted,
    onBeforeUnmount,
    shallowRef,
    nextTick,
    h
  } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox, ElButton } from 'element-plus'
  import { CopyDocument } from '@element-plus/icons-vue'
  import YamlEditor from '@/components/yaml-editor-pro/index.vue'
  import yaml from 'js-yaml'
  import WorkloadStepsCard from '../common/components/WorkloadStepsCard.vue'

  // 导入 Store
  import {
    useMetadataStore,
    useContainersStore,
    useVolumesStore,
    useSchedulingStore,
    useAdvancedStore,
    resetAllWorkloadStores,
    generateJobFromStores,
    updateStoresFromJob,
    validateAllStoresWithJob
  } from '@/store/workload'
  import { useJobStore } from '@/store/workload/job'

  // 导入 API
  import { ResourceType } from '@/api/workload'

  // 导入工具函数
  import {
    validateRouteParams,
    initWorkloadByMode,
    isFieldEditable,
    getModeText,
    ensureNamespace,
    ensureRequiredLabelsInResource,
    type RouteParams,
    type WorkloadMode
  } from '../common/utils/modeHandler'

  // 导入统一提交处理
  import { submitWorkload, submitWorkloadFromYaml } from '../common/utils/submitHandler'

  // 步骤组件
  import MetadataStep from '../common/components/MetadataStep.vue'
  import JobConfigStep from './components/JobConfigStep.vue'
  import ContainersStep from '../common/components/ContainersStep.vue'
  import VolumesStep from '../common/components/VolumesStep.vue'
  import SchedulingStep from '../common/components/SchedulingStep.vue'
  import AdvancedStep from '../common/components/AdvancedStep.vue'
  import ReviewStep from './components/ReviewStep.vue'

  // 初始化 Store
  const metadataStore = useMetadataStore()
  const containersStore = useContainersStore()
  const volumesStore = useVolumesStore()
  const schedulingStore = useSchedulingStore()
  const advancedStore = useAdvancedStore()
  const jobStore = useJobStore()

  const router = useRouter()
  const route = useRoute()

  // 路由参数
  const routeParams = ref<RouteParams | null>(null)
  const mode = computed(() => routeParams.value?.mode || 'createApp')
  const resourceClusterId = computed(() => routeParams.value?.resourceClusterId || 0)
  const clusterUuid = computed(() => routeParams.value?.clusterUuid || '')
  const workspaceId = computed(() => routeParams.value?.workspaceId || 0)
  const currentNamespace = computed(() => routeParams.value?.namespace || 'default')
  const applicationId = computed(() => routeParams.value?.applicationId)
  const applicationVersionId = computed(() => routeParams.value?.applicationVersionId)

  // 编辑模式
  const editMode = ref<'form' | 'yaml'>('form')

  // 当前步骤
  const currentStep = ref(0)
  const currentStepRef = ref<any>(null)

  // 创建状态
  const creating = ref(false)

  // 数据是否已修改
  const hasUnsavedChanges = ref(false)

  // 组件key，用于强制刷新
  const componentKey = ref(0)

  // 步骤配置接口
  interface StepConfig {
    id: string
    title: string
    description: string
    component: any
    hasError: boolean
    validated: boolean
    touched: boolean
    required: boolean
  }

  // 验证结果接口
  interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings?: string[]
  }

  const steps = shallowRef<StepConfig[]>([
    {
      id: 'metadata',
      title: '元数据配置',
      description: 'Job名称和标签',
      component: MetadataStep,
      hasError: true,
      validated: false,
      touched: false,
      required: true
    },
    {
      id: 'job',
      title: 'Job配置',
      description: '任务执行配置',
      component: JobConfigStep,
      hasError: true,
      validated: false,
      touched: false,
      required: true
    },
    {
      id: 'volumes',
      title: '存储配置',
      description: '配置存储卷（供容器挂载）',
      component: VolumesStep,
      hasError: false,
      validated: true,
      touched: false,
      required: false
    },
    {
      id: 'containers',
      title: '容器配置',
      description: '配置容器镜像和资源',
      component: ContainersStep,
      hasError: true,
      validated: false,
      touched: false,
      required: true
    },
    {
      id: 'scheduling',
      title: '调度策略',
      description: '节点选择和亲和性',
      component: SchedulingStep,
      hasError: false,
      validated: true,
      touched: false,
      required: false
    },
    {
      id: 'advanced',
      title: '高级配置',
      description: '安全上下文和网络',
      component: AdvancedStep,
      hasError: false,
      validated: true,
      touched: false,
      required: false
    },
    {
      id: 'review',
      title: '确认配置',
      description: '检查并确认',
      component: ReviewStep,
      hasError: false,
      validated: true,
      touched: false,
      required: false
    }
  ])

  // 当前步骤组件
  const currentStepComponent = computed(() => {
    return steps.value[currentStep.value].component
  })

  // 整体是否有效
  const isValid = computed(() => {
    return steps.value
      .filter((step) => step.required)
      .every((step) => step.validated && !step.hasError)
  })

  // YAML内容
  const yamlContent = ref('')

  // 字段是否可编辑
  const canEditField = (field: 'nameCn' | 'nameEn' | 'version' | 'resourceName' | 'desc') => {
    return isFieldEditable(mode.value, field)
  }

  // 提供给子组件
  provide('namespace', currentNamespace)
  provide('resourceClusterId', resourceClusterId)
  provide('clusterUuid', clusterUuid)
  provide('workspaceId', workspaceId)
  provide('mode', mode)
  provide('canEditField', canEditField)

  // ==================== 验证逻辑 ====================

  // 处理验证
  const handleValidation = (result: ValidationResult) => {
    const currentSteps = [...steps.value]
    const step = currentSteps[currentStep.value]

    step.validated = result.valid
    step.hasError = result.errors.length > 0
    step.touched = true

    steps.value = currentSteps

    if (step.touched) {
      hasUnsavedChanges.value = true
    }
  }

  // 验证当前步骤
  const validateCurrentStep = async (): Promise<boolean> => {
    const step = steps.value[currentStep.value]

    if (!currentStepRef.value?.validate) {
      if (!step.required) {
        const currentSteps = [...steps.value]
        currentSteps[currentStep.value].validated = true
        currentSteps[currentStep.value].hasError = false
        steps.value = currentSteps
        return true
      }

      return false
    }

    try {
      const result = await currentStepRef.value.validate()

      if (typeof result === 'boolean') {
        const validationResult = {
          valid: result,
          errors: result ? [] : ['验证失败']
        }
        handleValidation(validationResult)
        return result
      }

      handleValidation(result)
      return result.valid
    } catch (error) {
      console.error(`❌ 步骤 ${step.title} 验证异常:`, error)
      handleValidation({ valid: false, errors: ['验证过程发生错误'] })
      return false
    }
  }

  // ==================== 步骤导航 ====================

  // 跳转到指定步骤
  const goToStep = async (index: number) => {
    // 验证当前步骤
    if (currentStep.value !== index) {
      await validateCurrentStep()
    }

    const currentSteps = [...steps.value]
    currentSteps[currentStep.value].touched = true
    steps.value = currentSteps

    currentStep.value = index
  }

  // ==================== 复制资源名称 ====================
  const copyResourceName = (resourceName: string) => {
    navigator.clipboard
      .writeText(resourceName)
      .then(() => {
        ElMessage.success('资源名称已复制到剪贴板')
      })
      .catch(() => {})
  }

  // ==================== 显示成功提示弹窗 ====================
  const showSuccessDialog = (resourceName: string) => {
    ElMessageBox({
      title: 'Job 创建成功',
      message: h('div', { style: 'line-height: 1.8; font-size: 14px;' }, [
        h('p', { style: 'margin-bottom: 16px;' }, [
          h('span', null, 'Job 是一次性执行的批处理任务，暂不纳入服务中心管理。')
        ]),
        h('p', { style: 'margin-bottom: 16px;' }, [
          h('span', null, '即将跳转至 '),
          h('strong', { style: 'color: #409EFF;' }, 'Job 管理中心'),
          h('span', null, '，您可以在那里查看以下 Job：')
        ]),
        h(
          'div',
          {
            style:
              'display: flex; align-items: center; gap: 8px; padding: 12px; background: #f5f7fa; border-radius: 4px; margin-top: 8px;'
          },
          [
            h(
              'code',
              {
                style:
                  'flex: 1; font-family: monospace; font-size: 14px; color: #303133; word-break: break-all;'
              },
              resourceName
            ),
            h(
              ElButton,
              {
                size: 'small',
                icon: CopyDocument,
                onClick: () => copyResourceName(resourceName)
              },
              () => '复制'
            )
          ]
        )
      ]),
      confirmButtonText: '确定，前往查看',
      showCancelButton: false,
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      type: 'success',
      center: true,
      customClass: 'job-success-dialog'
    }).then(() => {
      navigateToJobManager()
    })
  }

  // ==================== 保存逻辑 ====================

  // 表单模式保存
  const handleSave = async () => {
    // 使用统一的验证函数验证所有配置
    const validationResult = validateAllStoresWithJob()

    if (!validationResult.valid) {
      console.error('❌ 配置验证失败:', validationResult.errors)

      // 显示具体错误信息
      if (validationResult.errors.length > 0) {
        const errorMsg = validationResult.errors.slice(0, 3).join('\n')
        ElMessage.error({
          message: errorMsg,
          duration: 5000,
          showClose: true
        })
      }
      return
    }

    // 显示警告信息（如果有）
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      console.warn('⚠️ 配置警告:', validationResult.warnings)
    }

    creating.value = true

    try {
      // 使用统一的生成函数生成 Job 对象
      const job = generateJobFromStores()

      // 确保 namespace 和标签正确
      ensureNamespace(job, currentNamespace.value)
      ensureRequiredLabelsInResource(
        job,
        metadataStore.metadata.nameEn,
        metadataStore.metadata.version
      )

      // 保存资源名称用于后续显示
      const savedResourceName = metadataStore.metadata.resourceName

      // 生成YAML字符串
      const yamlStr = yaml.dump(job, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })

      // 调用统一提交函数
      const result = await submitWorkload({
        mode: mode.value,
        resourceType: ResourceType.JOB,
        resourceClusterId: resourceClusterId.value,
        clusterUuid: clusterUuid.value,
        workspaceId: workspaceId.value,
        namespace: currentNamespace.value,
        nameCn: metadataStore.metadata.nameCn,
        resourceName: metadataStore.metadata.resourceName,
        nameEn: metadataStore.metadata.nameEn,
        version: metadataStore.metadata.version,
        description: metadataStore.metadata.desc,
        resourceYamlStr: yamlStr,
        applicationId: applicationId.value,
        applicationVersionId: applicationVersionId.value
      })

      if (result.success) {
        clearAllData()
        // 显示成功提示弹窗
        showSuccessDialog(savedResourceName)
      }
    } catch (error) {
      console.error('💥 保存 Job 失败:', error)
    } finally {
      creating.value = false
    }
  }

  // YAML模式保存
  const handleYamlSave = async () => {
    creating.value = true

    try {
      // 先解析 YAML 获取 resourceName
      let resourceNameFromYaml = ''
      try {
        const parsedJob = yaml.load(yamlContent.value) as any
        resourceNameFromYaml = parsedJob?.metadata?.name || ''
      } catch (error) {
        console.error('解析 YAML 失败:', error)
      }

      // 保存资源名称用于后续显示
      const savedResourceName = resourceNameFromYaml || metadataStore.metadata.resourceName

      const result = await submitWorkloadFromYaml(
        {
          mode: mode.value,
          resourceType: ResourceType.JOB,
          resourceClusterId: resourceClusterId.value,
          clusterUuid: clusterUuid.value,
          workspaceId: workspaceId.value,
          namespace: currentNamespace.value,
          applicationId: applicationId.value,
          applicationVersionId: applicationVersionId.value
        },
        yamlContent.value,
        {
          nameCn: metadataStore.metadata.nameCn,
          resourceName: resourceNameFromYaml || metadataStore.metadata.resourceName,
          nameEn: metadataStore.metadata.nameEn,
          version: metadataStore.metadata.version,
          desc: metadataStore.metadata.desc
        }
      )

      if (result.success) {
        clearAllData()
        // 显示成功提示弹窗
        showSuccessDialog(savedResourceName)
      }
    } catch (error) {
      console.error('💥 从 YAML 保存失败:', error)
    } finally {
      creating.value = false
    }
  }

  // YAML变化处理
  const handleYamlChange = (value: string) => {
    yamlContent.value = value
    hasUnsavedChanges.value = true
  }

  // ==================== 页面导航 ====================

  // 返回
  const handleBack = async () => {
    await confirmExit(() => {
      router.back()
    })
  }

  // 导航到列表页
  const navigateToList = () => {
    router.push({
      name: 'WorkspaceApp',
      query: {
        resourceClusterId: resourceClusterId.value,
        clusterUuid: clusterUuid.value,
        workspaceId: workspaceId.value,
        namespace: currentNamespace.value
      }
    })
  }

  // 导航到 Job 管理中心
  const navigateToJobManager = () => {
    router.push({
      name: 'JobManager',
      query: {
        resourceClusterId: resourceClusterId.value,
        clusterUuid: clusterUuid.value,
        workspaceId: workspaceId.value,
        namespace: currentNamespace.value
      }
    })
  }

  // 退出确认
  const confirmExit = async (callback: () => void) => {
    const message = hasUnsavedChanges.value
      ? '您有未保存的更改，确定要离开吗？所有未保存的配置将丢失。'
      : '确定要离开当前页面吗？'

    try {
      await ElMessageBox.confirm(message, '确认离开', {
        confirmButtonText: '确定离开',
        cancelButtonText: '继续编辑',
        type: 'warning',
        distinguishCancelAndClose: true,
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            clearAllData()
            done()
          } else {
            done()
          }
        }
      })
      window.removeEventListener('beforeunload', handleBeforeUnload)
      callback()
    } catch {
      // 用户取消
    }
  }

  // 清理所有数据
  const clearAllData = () => {
    resetAllWorkloadStores()

    hasUnsavedChanges.value = false
    currentStep.value = 0
    editMode.value = 'form'
    yamlContent.value = ''

    steps.value.forEach((step) => {
      step.touched = false
      if (step.required) {
        step.hasError = true
        step.validated = false
      } else {
        step.hasError = false
        step.validated = true
      }
    })
  }

  // 处理页面离开前的确认
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value) {
      e.preventDefault()
      e.returnValue = '您有未保存的更改，确定要离开吗？'
    }
  }

  // ==================== 监听器 ====================

  // ========== 文件: job/index.vue ==========
  // 替换 watch(editMode, ...) 函数

  watch(editMode, async (newMode, oldMode) => {
    if (newMode === 'yaml') {
      // 切换到 YAML 模式：从 stores 生成 YAML
      const job = generateJobFromStores()
      yamlContent.value = yaml.dump(job, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })
    } else if (newMode === 'form' && oldMode === 'yaml') {
      // 切换回表单模式：从 YAML 解析并更新 stores
      if (yamlContent.value && yamlContent.value.trim()) {
        try {
          // 验证 YAML 内容
          const documents = yaml.loadAll(yamlContent.value)

          // 检查是否只有一个文档
          if (documents.length === 0) {
            editMode.value = 'yaml'
            return
          }

          if (documents.length > 1) {
            ElMessage.error({
              message: `检测到 ${documents.length} 个 YAML 文档，Job 页面只能包含一个 Job 类型的 YAML`,
              duration: 5000,
              showClose: true
            })
            editMode.value = 'yaml'
            return
          }

          const parsedJob = documents[0] as any

          // 检查 kind 类型
          if (!parsedJob || !parsedJob.kind) {
            editMode.value = 'yaml'
            return
          }

          if (parsedJob.kind !== 'Job') {
            ElMessage.error({
              message: `当前页面只能处理 Job 类型的 YAML，但检测到 kind: ${parsedJob.kind}`,
              duration: 5000,
              showClose: true
            })
            editMode.value = 'yaml'
            return
          }

          // 检查 apiVersion
          if (!parsedJob.apiVersion || !parsedJob.apiVersion.includes('batch/v1')) {
            ElMessage.warning({
              message: `Job 的 apiVersion 应该是 batch/v1，当前是: ${parsedJob.apiVersion || '未设置'}`,
              duration: 4000,
              showClose: true
            })
          }

          // ⭐⭐⭐ 关键修复：从 YAML 中提取元数据 ⭐⭐⭐
          const yamlMetadata = parsedJob.metadata || {}
          const yamlLabels = yamlMetadata.labels || {}
          const yamlAnnotations = yamlMetadata.annotations || {}

          // 从 YAML 中解析字段
          const parsedNameEn = yamlLabels.app || ''
          const parsedVersion = yamlLabels.version || ''
          const parsedResourceName = yamlMetadata.name || ''
          const parsedDesc =
            yamlAnnotations.description || yamlAnnotations['ikubeops.com/description'] || ''
          const parsedNameCn = yamlAnnotations['ikubeops.com/project-name'] || ''

          console.log('📝 从 YAML 解析的元数据:', {
            nameEn: parsedNameEn,
            version: parsedVersion,
            resourceName: parsedResourceName,
            nameCn: parsedNameCn,
            desc: parsedDesc
          })

          // 先取消选中容器
          containersStore.selectContainer(null)

          // 切换到第一步
          currentStep.value = 0

          // 等待组件卸载完成
          await nextTick()

          // 更新 namespace
          if (parsedJob.metadata) {
            parsedJob.metadata.namespace = currentNamespace.value
          }

          // 使用统一的函数从 Job YAML 加载到各个 store
          updateStoresFromJob(parsedJob)

          // ⭐⭐⭐ 关键修复：使用从 YAML 解析的数据更新元数据 ⭐⭐⭐
          metadataStore.updateMetadata({
            nameCn: parsedNameCn,
            nameEn: parsedNameEn,
            version: parsedVersion,
            resourceName: parsedResourceName,
            desc: parsedDesc
          })

          // 设置命名空间
          metadataStore.setNamespace(currentNamespace.value)

          // 强制刷新组件
          componentKey.value++

          // 等待组件重新渲染后验证
          await nextTick()
          await nextTick()

          // 验证所有步骤
          await validateAllStepsAfterYamlImport()

          // 根据中文名是否为空给出不同提示
          if (!parsedNameCn) {
            ElMessage.warning({
              message: '已从 YAML 同步数据，请补充填写中文名',
              duration: 4000,
              showClose: true
            })
          } else {
            ElMessage.success('已从 YAML 同步数据')
          }
        } catch (error) {
          console.error('解析YAML失败:', error)
          ElMessage.error({
            message: `YAML 格式错误：${error instanceof Error ? error.message : '未知错误'}`,
            duration: 5000,
            showClose: true
          })
          editMode.value = 'yaml'
        }
      }
    }
  })

  const validateAllStepsAfterYamlImport = async () => {
    const currentSteps = [...steps.value]
    let allValid = true
    const validationErrors: string[] = []

    // 索引: 0-元数据, 1-Job配置, 2-存储, 3-容器, 4-调度, 5-高级, 6-确认

    // 1. 验证元数据步骤 (索引 0)
    try {
      const metadataValid =
        metadataStore.metadata.nameCn &&
        metadataStore.metadata.nameEn &&
        metadataStore.metadata.version &&
        metadataStore.metadata.resourceName
      currentSteps[0].validated = metadataValid
      currentSteps[0].hasError = !metadataValid
      currentSteps[0].touched = true
      if (!metadataValid) {
        validationErrors.push('元数据配置不完整')
        allValid = false
      }
    } catch (error) {
      console.error('元数据验证失败:', error)
    }

    // 2. 验证 Job 配置 (索引 1)
    try {
      const jobResult = jobStore.validate()
      currentSteps[1].validated = jobResult.valid
      currentSteps[1].hasError = !jobResult.valid
      currentSteps[1].touched = true
      if (!jobResult.valid) {
        validationErrors.push(...jobResult.errors)
        allValid = false
      }
    } catch (error) {
      console.error('Job 验证失败:', error)
    }

    // 3. 验证存储配置 (索引 2)
    try {
      const volumesResult = volumesStore.validate()
      currentSteps[2].validated = volumesResult.valid
      currentSteps[2].hasError = !volumesResult.valid
      currentSteps[2].touched = true
    } catch (error) {
      console.error('存储卷验证失败:', error)
    }

    // 4. 验证容器配置 (索引 3)
    try {
      const containersResult = containersStore.validate()
      currentSteps[3].validated = containersResult.valid
      currentSteps[3].hasError = !containersResult.valid
      currentSteps[3].touched = true
      if (!containersResult.valid) {
        validationErrors.push(...containersResult.errors)
        allValid = false
      }
    } catch (error) {
      console.error('容器验证失败:', error)
      currentSteps[3].validated = false
      currentSteps[3].hasError = true
      validationErrors.push('容器配置验证异常')
      allValid = false
    }

    // 5-6. 其他非必填步骤默认通过
    currentSteps[4].validated = true
    currentSteps[4].hasError = false
    currentSteps[5].validated = true
    currentSteps[5].hasError = false
    currentSteps[6].validated = true
    currentSteps[6].hasError = false

    steps.value = currentSteps

    if (!allValid && validationErrors.length > 0) {
      ElMessage.error({
        message: `配置验证：${validationErrors[0]}`,
        duration: 4000,
        showClose: true
      })
    }

    return allValid
  }
  // ==================== 生命周期 ====================

  // 组件挂载时
  onMounted(async () => {
    const params = validateRouteParams(route.query)
    if (!params) {
      setTimeout(() => {
        router.back()
      }, 1500)
      return
    }

    routeParams.value = params

    const success = await initWorkloadByMode(params)

    if (!success) {
      setTimeout(() => {
        router.back()
      }, 1500)
      return
    }

    hasUnsavedChanges.value = false
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  // 组件卸载时清理
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
</script>

<style lang="scss" scoped>
  .job-create-wizard {
    .wizard-content-card {
      min-height: 420px;

      ::v-deep(.el-card__body) {
        padding: 14px;
      }

      .step-enter-active,
      .step-leave-active {
        transition: all 0.3s ease;
      }

      .step-enter-from {
        opacity: 0;
        transform: translateX(20px);
      }

      .step-leave-to {
        opacity: 0;
        transform: translateX(-20px);
      }
    }
  }

  // 自定义弹窗样式
  :global(.job-success-dialog) {
    width: 520px !important;
    max-width: 90vw;
  }
</style>
