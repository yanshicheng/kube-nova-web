<template>
  <ElDialog
    :model-value="visible"
    :title="dialogType === 'add' ? '创建 PVC' : '编辑 PVC'"
    width="850px"
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
      <div style="margin-top: 12px; color: #909399; font-size: 13px">正在加载 PVC 配置...</div>
    </div>

    <!-- 表单模式 -->
    <div v-else-if="editMode === 'form'" class="form-content">
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="140px">
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <Database :size="16" />
              <span>基础信息</span>
            </div>
          </div>

          <ElFormItem label="名称" prop="name" required>
            <ElInput
              v-model="formData.name"
              placeholder="例如: data-pvc"
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

          <ElFormItem label="绑定模式" prop="bindingMode" required>
            <ElRadioGroup v-model="formData.bindingMode" :disabled="dialogType === 'edit'">
              <ElRadio value="dynamic">
                <span>动态制备</span>
                <ElTooltip placement="top">
                  <template #content>
                    <div>由 StorageClass 自动创建 PV</div>
                    <div>适合大多数场景（推荐）</div>
                  </template>
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElRadio>
              <ElRadio value="static">
                <span>静态绑定</span>
                <ElTooltip placement="top">
                  <template #content>
                    <div>绑定到已存在的 PV</div>
                    <div>适合预先创建好 PV 的场景</div>
                  </template>
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </div>

        <!-- 动态制备 - 存储配置 -->
        <div v-if="formData.bindingMode === 'dynamic'" class="form-section">
          <div class="section-header">
            <div class="header-left">
              <HardDrive :size="16" />
              <span>存储配置</span>
            </div>
          </div>

          <ElFormItem label="存储类" prop="storageClassName">
            <ElSelect
              v-model="formData.storageClassName"
              placeholder="留空使用默认存储类"
              clearable
              filterable
              :disabled="dialogType === 'edit'"
              :loading="storageClassLoading"
              @change="handleStorageClassChange"
              style="width: 100%"
            >
              <ElOption
                v-for="sc in storageClassList"
                :key="sc.name"
                :label="sc.name"
                :value="sc.name"
              >
                <div class="sc-option">
                  <div class="sc-option-main">
                    <span class="sc-name">{{ sc.name }}</span>
                    <ElTag v-if="sc.isDefault" type="success" size="small">默认</ElTag>
                  </div>
                  <div class="sc-option-sub">
                    <span class="sc-provisioner">{{ sc.provisioner }}</span>
                    <ElTag
                      v-if="sc.allowVolumeExpansion"
                      type="info"
                      size="small"
                      effect="plain"
                    >
                      支持扩容
                    </ElTag>
                  </div>
                </div>
              </ElOption>
            </ElSelect>
            <div v-if="selectedStorageClass" class="info-tip">
              <Info :size="12" />
              <span>
                {{ selectedStorageClass.provisioner }}
                {{
                  selectedStorageClass.allowVolumeExpansion ? ' • 支持在线扩容' : ' • 不支持扩容'
                }}
                {{
                  selectedStorageClass.reclaimPolicy
                    ? ` • 回收策略: ${selectedStorageClass.reclaimPolicy}`
                    : ''
                }}
              </span>
            </div>
          </ElFormItem>

          <ElFormItem label="存储容量" prop="requestStorage" required>
            <ElInput
              v-model="formData.requestStorage"
              placeholder="例如: 10Gi, 500Mi"
              :disabled="dialogType === 'edit' && !canExpandVolume"
            >
              <template #suffix>
                <ElTooltip placement="top">
                  <template #content>
                    <div>支持的单位: Ki, Mi, Gi, Ti, Pi</div>
                    <div v-if="dialogType === 'edit'">
                      {{ canExpandVolume ? '支持在线扩容' : '此存储类不支持扩容' }}
                    </div>
                  </template>
                  <HelpCircle :size="13" class="help-icon" />
                </ElTooltip>
              </template>
            </ElInput>
            <div v-if="dialogType === 'edit' && !canExpandVolume" class="warning-tip">
              <AlertCircle :size="12" />
              <span>当前存储类不支持扩容，容量无法修改</span>
            </div>
          </ElFormItem>

          <ElFormItem label="访问模式" prop="accessModes" required>
            <ElCheckboxGroup v-model="formData.accessModes" :disabled="dialogType === 'edit'">
              <ElCheckbox value="ReadWriteOnce">
                <span>ReadWriteOnce</span>
                <ElTooltip content="单节点读写" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElCheckbox>
              <ElCheckbox value="ReadOnlyMany">
                <span>ReadOnlyMany</span>
                <ElTooltip content="多节点只读" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElCheckbox>
              <ElCheckbox value="ReadWriteMany">
                <span>ReadWriteMany</span>
                <ElTooltip content="多节点读写" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElCheckbox>
              <ElCheckbox value="ReadWriteOncePod">
                <span>ReadWriteOncePod</span>
                <ElTooltip content="单 Pod 读写 (Kubernetes 1.22+)" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElCheckbox>
            </ElCheckboxGroup>
          </ElFormItem>

          <ElFormItem label="卷模式" prop="volumeMode">
            <ElRadioGroup v-model="formData.volumeMode" :disabled="dialogType === 'edit'">
              <ElRadio value="Filesystem">
                <span>Filesystem</span>
                <ElTooltip content="文件系统模式（默认）" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElRadio>
              <ElRadio value="Block">
                <span>Block</span>
                <ElTooltip content="块设备模式" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </div>

        <!-- 静态绑定 - PV 选择 -->
        <div v-else-if="formData.bindingMode === 'static'" class="form-section">
          <div class="section-header">
            <div class="header-left">
              <HardDrive :size="16" />
              <span>PV 选择</span>
            </div>
          </div>

          <ElFormItem label="选择方式" prop="pvSelectMode">
            <ElRadioGroup v-model="formData.pvSelectMode" :disabled="dialogType === 'edit'">
              <ElRadio value="name">
                <span>指定 PV 名称</span>
                <ElTooltip content="直接选择一个可用的 PV" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElRadio>
              <ElRadio value="selector">
                <span>标签选择器</span>
                <ElTooltip content="通过标签自动匹配符合条件的 PV" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElRadio>
            </ElRadioGroup>
          </ElFormItem>

          <!-- 指定 PV 名称 -->
          <ElFormItem
            v-if="formData.pvSelectMode === 'name'"
            label="选择 PV"
            prop="selectedPV"
            required
          >
            <ElSelect
              v-model="formData.selectedPV"
              placeholder="选择可用的 PV"
              clearable
              filterable
              :loading="pvLoading"
              :disabled="dialogType === 'edit'"
              @change="handlePVChange"
              style="width: 100%"
            >
              <ElOption
                v-for="pv in availablePVList"
                :key="pv.name"
                :label="pv.name"
                :value="pv.name"
              >
                <div class="pv-option">
                  <div class="pv-option-main">
                    <span class="pv-name">{{ pv.name }}</span>
                    <ElTag type="success" size="small">{{ pv.status }}</ElTag>
                  </div>
                  <div class="pv-option-sub">
                    <span>容量: {{ pv.capacity }}</span>
                    <span>访问: {{ pv.accessModes }}</span>
                    <span v-if="pv.storageClass">SC: {{ pv.storageClass }}</span>
                  </div>
                </div>
              </ElOption>
            </ElSelect>
            <div v-if="selectedPV" class="info-tip">
              <Info :size="12" />
              <span>
                容量: {{ selectedPV.capacity }} • 访问模式: {{ selectedPV.accessModes }} • 回收策略:
                {{ selectedPV.reclaimPolicy }}
              </span>
            </div>
            <div v-if="availablePVList.length === 0 && !pvLoading" class="warning-tip">
              <AlertCircle :size="12" />
              <span>当前集群中没有可用的 PV，请先创建 PV 或切换为动态制备模式</span>
            </div>
          </ElFormItem>

          <!-- 标签选择器 -->
          <ElFormItem
            v-if="formData.pvSelectMode === 'selector'"
            label="标签选择器"
            prop="selector"
          >
            <ElInput
              v-model="formData.selector"
              type="textarea"
              :rows="4"
              placeholder="用于匹配 PV 的标签选择器，YAML 格式：&#10;matchLabels:&#10;  environment: production&#10;  zone: cn-north-1"
              :disabled="dialogType === 'edit'"
            />
            <div class="info-tip" style="margin-top: 8px">
              <Info :size="12" />
              <span>PVC 将自动绑定到匹配此选择器的第一个可用 PV</span>
            </div>
          </ElFormItem>

          <!-- 当选择了 PV 后，自动填充这些字段并设为只读 -->
          <ElFormItem label="存储容量" prop="requestStorage" required>
            <ElInput
              v-model="formData.requestStorage"
              placeholder="将自动从所选 PV 获取"
              :disabled="true"
            >
              <template #suffix>
                <ElTooltip content="静态绑定时容量由 PV 决定" placement="top">
                  <HelpCircle :size="13" class="help-icon" />
                </ElTooltip>
              </template>
            </ElInput>
          </ElFormItem>

          <ElFormItem label="访问模式" prop="accessModes" required>
            <ElCheckboxGroup v-model="formData.accessModes" :disabled="true">
              <ElCheckbox value="ReadWriteOnce">ReadWriteOnce</ElCheckbox>
              <ElCheckbox value="ReadOnlyMany">ReadOnlyMany</ElCheckbox>
              <ElCheckbox value="ReadWriteMany">ReadWriteMany</ElCheckbox>
              <ElCheckbox value="ReadWriteOncePod">ReadWriteOncePod</ElCheckbox>
            </ElCheckboxGroup>
            <div class="info-tip" style="margin-top: 8px">
              <Info :size="12" />
              <span>静态绑定时访问模式由所选 PV 决定</span>
            </div>
          </ElFormItem>

          <ElFormItem label="卷模式" prop="volumeMode">
            <ElRadioGroup v-model="formData.volumeMode" :disabled="dialogType === 'edit'">
              <ElRadio value="Filesystem">Filesystem</ElRadio>
              <ElRadio value="Block">Block</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </div>

        <!-- 高级选项 -->
        <div class="form-section">
          <div class="section-header">
            <div class="header-left">
              <Settings :size="16" />
              <span>高级选项</span>
              <span class="optional-mark">可选</span>
            </div>
          </div>

          <ElFormItem label="数据源">
            <ElRadioGroup v-model="formData.dataSourceType" :disabled="dialogType === 'edit'">
              <ElRadio value="none">无</ElRadio>
              <ElRadio value="pvc">
                <span>从 PVC 克隆</span>
                <ElTooltip content="从现有 PVC 克隆数据" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElRadio>
              <ElRadio value="snapshot">
                <span>从快照恢复</span>
                <ElTooltip content="从 VolumeSnapshot 恢复数据" placement="top">
                  <HelpCircle :size="11" class="help-icon" style="margin-left: 4px" />
                </ElTooltip>
              </ElRadio>
            </ElRadioGroup>
          </ElFormItem>

          <ElFormItem
            v-if="formData.dataSourceType === 'pvc'"
            label="源 PVC"
            prop="dataSourcePVC"
          >
            <ElInput
              v-model="formData.dataSourcePVC"
              placeholder="输入源 PVC 名称（需在同一命名空间）"
              :disabled="dialogType === 'edit'"
            />
          </ElFormItem>

          <ElFormItem
            v-if="formData.dataSourceType === 'snapshot'"
            label="快照名称"
            prop="dataSourceSnapshot"
          >
            <ElInput
              v-model="formData.dataSourceSnapshot"
              placeholder="输入 VolumeSnapshot 名称"
              :disabled="dialogType === 'edit'"
            />
          </ElFormItem>
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
      <ArtYamlEditor v-model="yamlContent" height="600px" @change="handleYamlChange" />
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
  import { ref, watch, nextTick, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import yaml from 'js-yaml'
  import {
    Database,
    HardDrive,
    Settings,
    Tag,
    FileText,
    FormInput,
    Code,
    Plus,
    Trash2,
    HelpCircle,
    Info,
    AlertCircle
  } from 'lucide-vue-next'
  import {
    createPVCApi,
    updatePVCApi,
    getPVCYamlApi,
    type PVCListItem,
    type ProjectWorkspace
  } from '@/api/workload/core'
  import {
    getStorageClassListApi,
    getPVListApi,
    type StorageClassListItem,
    type PVListItem
  } from '@/api/workload/cluster-resource'
  import ArtYamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    visible: boolean
    dialogType: 'add' | 'edit'
    pvcData?: PVCListItem
    workspace: ProjectWorkspace | null
  }

  interface KeyValue {
    key: string
    value: string
  }

  const props = withDefaults(defineProps<Props>(), {
    pvcData: undefined
  })

  const emit = defineEmits(['close', 'success'])

  const formRef = ref()
  const editMode = ref<'form' | 'yaml'>('form')
  const submitting = ref(false)
  const dataLoading = ref(false)
  const storageClassLoading = ref(false)
  const pvLoading = ref(false)
  const yamlContent = ref('')
  const canExpandVolume = ref(false)

  // StorageClass 相关
  const storageClassList = ref<StorageClassListItem[]>([])
  const selectedStorageClass = computed(() => {
    if (!formData.value.storageClassName) {
      return storageClassList.value.find((sc) => sc.isDefault)
    }
    return storageClassList.value.find((sc) => sc.name === formData.value.storageClassName)
  })

  // PV 相关
  const availablePVList = ref<PVListItem[]>([])
  const selectedPV = computed(() => {
    if (!formData.value.selectedPV) return null
    return availablePVList.value.find((pv) => pv.name === formData.value.selectedPV)
  })

  const formData = ref({
    name: '',
    bindingMode: 'dynamic' as 'dynamic' | 'static', // 绑定模式
    storageClassName: '', // 动态制备时使用
    pvSelectMode: 'name' as 'name' | 'selector', // 静态绑定的选择方式
    selectedPV: '', // 静态绑定 - 指定 PV 名称
    selector: '', // 静态绑定 - 标签选择器
    requestStorage: '10Gi',
    accessModes: ['ReadWriteOnce'] as string[],
    volumeMode: 'Filesystem',
    dataSourceType: 'none',
    dataSourcePVC: '',
    dataSourceSnapshot: '',
    labels: [] as KeyValue[],
    annotations: [] as KeyValue[]
  })

  const formRules = {
    name: [
      { required: true, message: '请输入 PVC 名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '名称格式不正确',
        trigger: 'blur'
      }
    ],
    requestStorage: [
      { required: true, message: '请输入存储容量', trigger: 'blur' },
      {
        pattern: /^\d+(\.\d+)?(Ki|Mi|Gi|Ti|Pi|K|M|G|T|P)$/,
        message: '格式不正确，例如: 10Gi, 500Mi',
        trigger: 'blur'
      }
    ],
    accessModes: [
      {
        type: 'array',
        required: true,
        message: '请至少选择一个访问模式',
        trigger: 'change'
      }
    ],
    selectedPV: [
      {
        validator: (rule: any, value: any, callback: any) => {
          if (
            formData.value.bindingMode === 'static' &&
            formData.value.pvSelectMode === 'name' &&
            !value
          ) {
            callback(new Error('请选择一个 PV'))
          } else {
            callback()
          }
        },
        trigger: 'change'
      }
    ]
  }

  // 加载 StorageClass 列表
  const loadStorageClasses = async () => {
    if (!props.workspace?.clusterUuid) return

    storageClassLoading.value = true
    try {
      const response = await getStorageClassListApi({
        clusterUuid: props.workspace.clusterUuid
      })

      if (response && response.items) {
        storageClassList.value = response.items
      } else if (Array.isArray(response)) {
        storageClassList.value = response
      }
    } catch (error) {
      console.error('加载 StorageClass 列表失败:', error)
      storageClassList.value = []
    } finally {
      storageClassLoading.value = false
    }
  }

  // 加载可用的 PV 列表
  const loadAvailablePVs = async () => {
    if (!props.workspace?.clusterUuid) return

    pvLoading.value = true
    try {
      const response = await getPVListApi({
        clusterUuid: props.workspace.clusterUuid,
        status: 'Available' // 只获取可用的 PV
      })

      if (response && response.items) {
        availablePVList.value = response.items
      } else if (Array.isArray(response)) {
        availablePVList.value = response
      }
    } catch (error) {
      console.error('加载 PV 列表失败:', error)
      availablePVList.value = []
    } finally {
      pvLoading.value = false
    }
  }

  // StorageClass 变化处理
  const handleStorageClassChange = (value: string) => {
    const sc = storageClassList.value.find((item) => item.name === value)
    if (sc) {
      canExpandVolume.value = sc.allowVolumeExpansion
    } else {
      // 使用默认 StorageClass 的配置
      const defaultSC = storageClassList.value.find((item) => item.isDefault)
      canExpandVolume.value = defaultSC?.allowVolumeExpansion || false
    }
  }

  // PV 变化处理
  const handlePVChange = (value: string) => {
    const pv = availablePVList.value.find((item) => item.name === value)
    if (pv) {
      // 自动填充 PV 的相关信息
      formData.value.requestStorage = pv.capacity
      const modes = pv.accessModes.split(',').map((m: string) => m.trim())
      formData.value.accessModes = modes
    }
  }

  const handleClose = (val: boolean) => {
    if (!val) {
      emit('close')
    }
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
    const pvcObj: any = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: formData.value.name || 'pvc-name',
        namespace: props.workspace?.namespace || 'default'
      },
      spec: {
        accessModes: formData.value.accessModes,
        resources: {
          requests: {
            storage: formData.value.requestStorage || '10Gi'
          }
        }
      }
    }

    // 动态制备模式
    if (formData.value.bindingMode === 'dynamic') {
      // StorageClass（可选）
      if (formData.value.storageClassName) {
        pvcObj.spec.storageClassName = formData.value.storageClassName
      }
    }

    // 静态绑定模式
    if (formData.value.bindingMode === 'static') {
      if (formData.value.pvSelectMode === 'name' && formData.value.selectedPV) {
        // 指定 PV 名称
        pvcObj.spec.volumeName = formData.value.selectedPV
      } else if (formData.value.pvSelectMode === 'selector' && formData.value.selector) {
        // 标签选择器
        try {
          const selectorObj = yaml.load(formData.value.selector)
          pvcObj.spec.selector = selectorObj
        } catch (error) {
          console.error('标签选择器解析失败:', error)
        }
      }
    }

    // VolumeMode
    if (formData.value.volumeMode) {
      pvcObj.spec.volumeMode = formData.value.volumeMode
    }

    // DataSource
    if (formData.value.dataSourceType === 'pvc' && formData.value.dataSourcePVC) {
      pvcObj.spec.dataSource = {
        kind: 'PersistentVolumeClaim',
        name: formData.value.dataSourcePVC
      }
    } else if (formData.value.dataSourceType === 'snapshot' && formData.value.dataSourceSnapshot) {
      pvcObj.spec.dataSource = {
        kind: 'VolumeSnapshot',
        apiGroup: 'snapshot.storage.k8s.io',
        name: formData.value.dataSourceSnapshot
      }
    }

    // Labels
    const labelsObj = arrayToObject(formData.value.labels)
    if (Object.keys(labelsObj).length > 0) {
      pvcObj.metadata.labels = labelsObj
    }

    // Annotations
    const annotationsObj = arrayToObject(formData.value.annotations)
    if (Object.keys(annotationsObj).length > 0) {
      pvcObj.metadata.annotations = annotationsObj
    }

    yamlContent.value = yaml.dump(pvcObj, { indent: 2 })
  }

  // YAML 转表单
  const yamlToForm = (yamlStr: string) => {
    try {
      const obj = yaml.load(yamlStr) as any

      formData.value.name = obj.metadata?.name || ''
      formData.value.requestStorage = obj.spec?.resources?.requests?.storage || '10Gi'
      formData.value.accessModes = obj.spec?.accessModes || ['ReadWriteOnce']
      formData.value.volumeMode = obj.spec?.volumeMode || 'Filesystem'

      // 判断绑定模式
      if (obj.spec?.volumeName) {
        // 静态绑定 - 指定 PV 名称
        formData.value.bindingMode = 'static'
        formData.value.pvSelectMode = 'name'
        formData.value.selectedPV = obj.spec.volumeName
        formData.value.storageClassName = ''
      } else if (obj.spec?.selector) {
        // 静态绑定 - 标签选择器
        formData.value.bindingMode = 'static'
        formData.value.pvSelectMode = 'selector'
        formData.value.selector = yaml.dump(obj.spec.selector, { indent: 2 })
        formData.value.storageClassName = ''
      } else {
        // 动态制备
        formData.value.bindingMode = 'dynamic'
        formData.value.storageClassName = obj.spec?.storageClassName || ''
      }

      // DataSource
      if (obj.spec?.dataSource) {
        if (obj.spec.dataSource.kind === 'PersistentVolumeClaim') {
          formData.value.dataSourceType = 'pvc'
          formData.value.dataSourcePVC = obj.spec.dataSource.name || ''
        } else if (obj.spec.dataSource.kind === 'VolumeSnapshot') {
          formData.value.dataSourceType = 'snapshot'
          formData.value.dataSourceSnapshot = obj.spec.dataSource.name || ''
        }
      } else {
        formData.value.dataSourceType = 'none'
      }

      // Labels
      formData.value.labels = objectToArray(obj.metadata?.labels)

      // Annotations
      formData.value.annotations = objectToArray(obj.metadata?.annotations)

      // 检查是否支持扩容（仅动态制备时）
      if (formData.value.bindingMode === 'dynamic') {
        const sc = storageClassList.value.find((s) => s.name === formData.value.storageClassName)
        canExpandVolume.value = sc?.allowVolumeExpansion || false
      }
    } catch (error) {
      console.error('YAML 解析失败:', error)
      throw error
    }
  }

  // 加载 YAML
  const loadPVCYAML = async () => {
    if (!props.workspace || !props.pvcData) {
      return
    }

    dataLoading.value = true
    try {
      const yamlStr = await getPVCYamlApi({
        clusterUuid: props.workspace.clusterUuid!,
        namespace: props.workspace.namespace!,
        name: props.pvcData.name
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
        if (props.dialogType === 'edit' && props.pvcData && props.workspace) {
          // 编辑模式：先加载 StorageClass 列表，再加载 PVC 数据
          await loadStorageClasses()
          await loadPVCYAML()
        } else if (props.dialogType === 'add') {
          // 新建模式：加载 StorageClass 和 PV 列表
          await loadStorageClasses()
          await loadAvailablePVs()
          await nextTick()
          formToYaml()
        }
      }
    },
    { immediate: true }
  )

  // 监听绑定模式变化
  watch(
    () => formData.value.bindingMode,
    (newMode) => {
      if (newMode === 'static' && availablePVList.value.length === 0) {
        loadAvailablePVs()
      }
      // 切换模式时清空相关字段
      if (newMode === 'dynamic') {
        formData.value.selectedPV = ''
        formData.value.selector = ''
      } else {
        formData.value.storageClassName = ''
      }
    }
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

      formToYaml()
    }

    submitting.value = true
    try {
      if (props.dialogType === 'add') {
        await createPVCApi({
          clusterUuid: props.workspace.clusterUuid!,
          namespace: props.workspace.namespace!,
          yamlStr: yamlContent.value
        })
        ElMessage.success('创建成功')
      } else {
        await updatePVCApi({
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
      bindingMode: 'dynamic',
      storageClassName: '',
      pvSelectMode: 'name',
      selectedPV: '',
      selector: '',
      requestStorage: '10Gi',
      accessModes: ['ReadWriteOnce'],
      volumeMode: 'Filesystem',
      dataSourceType: 'none',
      dataSourcePVC: '',
      dataSourceSnapshot: '',
      labels: [],
      annotations: []
    }
    yamlContent.value = ''
    editMode.value = 'form'
    canExpandVolume.value = false
    storageClassList.value = []
    availablePVList.value = []
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

  // StorageClass 选项样式
  .sc-option {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 0;

    .sc-option-main {
      display: flex;
      align-items: center;
      gap: 8px;

      .sc-name {
        font-weight: 500;
        color: #303133;
      }
    }

    .sc-option-sub {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #909399;

      .sc-provisioner {
        font-family: 'Consolas', 'Monaco', monospace;
      }
    }
  }

  .info-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 8px 12px;
    background: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    font-size: 12px;
    color: #1e40af;

    svg {
      flex-shrink: 0;
      color: #3b82f6;
    }
  }

  .warning-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 8px 12px;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 6px;
    font-size: 12px;
    color: #92400e;

    svg {
      flex-shrink: 0;
      color: #f59e0b;
    }
  }

  // PV 选项样式
  .pv-option {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 0;

    .pv-option-main {
      display: flex;
      align-items: center;
      gap: 8px;

      .pv-name {
        font-weight: 500;
        color: #303133;
        font-family: 'Consolas', 'Monaco', monospace;
      }
    }

    .pv-option-sub {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: #909399;
    }
  }

  .labels-list,
  .annotations-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
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

  :deep(.el-checkbox) {
    margin-right: 16px;
    margin-bottom: 8px;
  }

  :deep(.el-radio) {
    margin-right: 16px;
    margin-bottom: 8px;
  }

  :deep(.el-select-dropdown__item) {
    height: auto;
    padding: 8px 12px;
  }
</style>