<template>
  <ElDialog
    :model-value="visible"
    :title="dialogTitle"
    width="900px"
    top="5vh"
    :close-on-click-modal="false"
    @close="handleClose"
    class="service-dialog"
  >
    <!-- 模式切换 -->
    <div class="mode-switcher">
      <ElRadioGroup v-model="editMode" size="default">
        <ElRadioButton value="form">
          <Settings :size="14" />
          表单模式
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <FileCode :size="14" />
          YAML 模式
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 表单模式 -->
    <div v-show="editMode === 'form'" class="dialog-content">
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="right"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <Settings :size="16" />
            基本信息
          </div>

          <ElFormItem label="Service 名称" prop="name">
            <ElInput
              v-model="formData.name"
              placeholder="请输入 Service 名称"
              clearable
              size="default"
              :disabled="dialogType === 'edit'"
              style="max-width: 500px"
            />
          </ElFormItem>

          <ElFormItem label="Service 类型" prop="type">
            <ElRadioGroup v-model="formData.type" size="default" @change="handleTypeChange">
              <ElRadioButton value="ClusterIP">
                <Network :size="14" />
                ClusterIP
              </ElRadioButton>
              <ElRadioButton value="NodePort">
                <Share2 :size="14" />
                NodePort
              </ElRadioButton>
              <ElRadioButton value="LoadBalancer">
                <CloudUpload :size="14" />
                LoadBalancer
              </ElRadioButton>
              <ElRadioButton value="ExternalName">
                <ExternalLink :size="14" />
                ExternalName
              </ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>

          <!-- ExternalName 专用字段 -->
          <ElFormItem v-if="formData.type === 'ExternalName'" label="外部域名" prop="externalName">
            <ElInput
              v-model="formData.externalName"
              placeholder="例如: my.database.example.com"
              clearable
              size="default"
              style="max-width: 500px"
            />
          </ElFormItem>
        </div>

        <!-- 端口配置 -->
        <div v-if="formData.type !== 'ExternalName'" class="form-section">
          <div class="section-title">
            <Network :size="16" />
            端口配置
          </div>

          <ElFormItem prop="ports" label-width="0">
            <div class="ports-table">
              <!-- 表头 -->
              <div class="ports-header">
                <div class="col-name">端口名称</div>
                <div class="col-protocol">协议</div>
                <div class="col-app-protocol">应用协议</div>
                <div class="col-port">Pod 端口</div>
                <div class="col-arrow"></div>
                <div class="col-port">Service 端口</div>
                <div
                  class="col-nodeport"
                  v-if="formData.type === 'NodePort' || formData.type === 'LoadBalancer'"
                >
                  宿主机端口
                </div>
                <div class="col-action">操作</div>
              </div>

              <!-- 端口列表 -->
              <div v-for="(port, index) in formData.ports" :key="index" class="port-row">
                <div class="col-name">
                  <ElInput v-model="port.name" placeholder="http" size="small" />
                </div>
                <div class="col-protocol">
                  <ElSelect v-model="port.protocol" size="small">
                    <ElOption label="TCP" value="TCP" />
                    <ElOption label="UDP" value="UDP" />
                    <ElOption label="SCTP" value="SCTP" />
                  </ElSelect>
                </div>
                <div class="col-app-protocol">
                  <ElSelect v-model="port.appProtocol" size="small" clearable placeholder="可选">
                    <ElOption label="HTTP" value="HTTP" />
                    <ElOption label="HTTPS" value="HTTPS" />
                    <ElOption label="gRPC" value="gRPC" />
                    <ElOption label="TCP" value="TCP" />
                  </ElSelect>
                </div>
                <div class="col-port">
                  <ElInput v-model="port.targetPort" placeholder="8080" size="small" />
                </div>
                <div class="col-arrow">
                  <ArrowRight :size="16" class="arrow-icon" />
                </div>
                <div class="col-port">
                  <ElInputNumber
                    v-model="port.port"
                    :min="1"
                    :max="65535"
                    size="small"
                    controls-position="right"
                    style="width: 100%"
                  />
                </div>
                <div
                  class="col-nodeport"
                  v-if="formData.type === 'NodePort' || formData.type === 'LoadBalancer'"
                >
                  <ElInputNumber
                    v-model="port.nodePort"
                    :min="30000"
                    :max="32767"
                    size="small"
                    controls-position="right"
                    placeholder="自动分配"
                    style="width: 100%"
                  />
                </div>
                <div class="col-action">
                  <ElButton
                    type="danger"
                    link
                    :icon="Trash2"
                    @click="removePort(index)"
                    :disabled="formData.ports.length === 1"
                  />
                </div>
              </div>

              <!-- 添加端口按钮 -->
              <div class="add-port-btn">
                <ElButton type="primary" link :icon="Plus" @click="addPort"> 添加端口 </ElButton>
              </div>
            </div>
          </ElFormItem>
        </div>

        <!-- Selector 配置 (非 ExternalName 类型) -->
        <div v-if="formData.type !== 'ExternalName'" class="form-section">
          <div class="section-title">
            <Tag :size="16" />
            Selector 配置
          </div>

          <!-- 选择服务和版本 -->
          <ElFormItem label="选择服务" prop="selectedApplicationId">
            <div style="display: flex; gap: 12px; width: 100%">
              <ElSelect
                v-model="formData.selectedApplicationId"
                placeholder="请选择服务"
                clearable
                size="default"
                style="flex: 1"
                @change="handleApplicationChange"
                :loading="loadingApplications"
              >
                <ElOption
                  v-for="app in applications"
                  :key="app.id"
                  :label="app.nameCn"
                  :value="app.id"
                >
                  <div class="application-option">
                    <Box :size="14" />
                    <span>{{ app.nameCn }}</span>
                  </div>
                </ElOption>
              </ElSelect>

              <ElSelect
                v-model="formData.selectedVersionId"
                placeholder="请选择版本"
                clearable
                size="default"
                style="flex: 1"
                :disabled="!formData.selectedApplicationId || loadingVersions"
                @change="handleVersionChange"
                :loading="loadingVersions"
              >
                <ElOption
                  v-for="version in versions"
                  :key="version.id"
                  :label="`v${version.version}`"
                  :value="version.id"
                >
                  <div class="version-option">
                    <Tag :size="14" />
                    <span class="version-name">v{{ version.version }}</span>
                  </div>
                </ElOption>
              </ElSelect>
            </div>
          </ElFormItem>

          <!-- Selector 预览 -->
          <ElFormItem label="Selector" label-width="120px">
            <div class="selector-preview">
              <div class="preview-header">
                <span class="preview-title">标签选择器</span>
                <ElButton
                  type="primary"
                  link
                  size="small"
                  :icon="Plus"
                  @click="showCustomSelectorDialog = true"
                >
                  添加自定义 Label
                </ElButton>
              </div>
              <div v-if="computedSelector.length > 0" class="preview-tags">
                <ElTag
                  v-for="(item, index) in computedSelector"
                  :key="index"
                  closable
                  @close="removeSelector(index)"
                  type="info"
                >
                  {{ item.key }}: {{ item.value }}
                </ElTag>
              </div>
              <div v-else style="color: #909399; font-size: 13px">
                未设置 Selector，请选择服务版本或添加自定义 Label
              </div>
            </div>
          </ElFormItem>
        </div>

        <!-- Labels 配置 -->
        <div class="form-section">
          <div class="section-title">
            <Tag :size="16" />
            Labels 配置
          </div>

          <ElFormItem label-width="0">
            <div class="kv-list">
              <div v-for="(label, index) in formData.labels" :key="index" class="kv-row">
                <ElInput v-model="label.key" placeholder="标签键" size="default" style="flex: 1" />
                <span class="separator">=</span>
                <ElInput
                  v-model="label.value"
                  placeholder="标签值"
                  size="default"
                  style="flex: 1"
                />
                <ElButton
                  type="danger"
                  link
                  :icon="Trash2"
                  @click="removeLabel(index)"
                  size="default"
                />
              </div>
            </div>
            <ElButton type="primary" link :icon="Plus" @click="addLabel" style="margin-top: 12px">
              添加 Label
            </ElButton>
          </ElFormItem>
        </div>

        <!-- 高级配置 -->
        <div class="form-section">
          <ElCollapse class="advanced-config">
            <ElCollapseItem name="advanced">
              <template #title>
                <div class="collapse-title">
                  <Settings :size="16" />
                  高级配置
                </div>
              </template>
              <div class="advanced-content">
                <!-- 会话保持 -->
                <div class="config-group">
                  <div class="group-label">
                    <Clock :size="14" />
                    会话保持
                  </div>
                  <ElFormItem label="会话亲和性" label-width="120px">
                    <ElRadioGroup v-model="formData.sessionAffinity" size="default">
                      <ElRadio value="None">无</ElRadio>
                      <ElRadio value="ClientIP">ClientIP</ElRadio>
                    </ElRadioGroup>
                  </ElFormItem>
                  <ElFormItem
                    v-if="formData.sessionAffinity === 'ClientIP'"
                    label="超时时间"
                    label-width="120px"
                  >
                    <ElInputNumber
                      v-model="formData.sessionAffinityTimeout"
                      :min="1"
                      :max="86400"
                      size="default"
                      controls-position="right"
                      style="width: 200px"
                    />
                    <span class="form-hint">秒 (默认: 10800)</span>
                  </ElFormItem>
                </div>

                <!-- 流量策略 -->
                <div
                  class="config-group"
                  v-if="formData.type === 'NodePort' || formData.type === 'LoadBalancer'"
                >
                  <div class="group-label">
                    <Network :size="14" />
                    流量策略
                  </div>
                  <ElFormItem label="外部流量策略" label-width="120px">
                    <ElRadioGroup v-model="formData.externalTrafficPolicy" size="default">
                      <ElRadio value="Cluster">Cluster</ElRadio>
                      <ElRadio value="Local">Local (保留源 IP)</ElRadio>
                    </ElRadioGroup>
                  </ElFormItem>
                  <ElFormItem label="内部流量策略" label-width="120px">
                    <ElRadioGroup v-model="formData.internalTrafficPolicy" size="default">
                      <ElRadio value="Cluster">Cluster</ElRadio>
                      <ElRadio value="Local">Local</ElRadio>
                    </ElRadioGroup>
                  </ElFormItem>
                </div>

                <!-- IP 配置 -->
                <div class="config-group" v-if="formData.type !== 'ExternalName'">
                  <div class="group-label">
                    <Network :size="14" />
                    IP 配置
                  </div>
                  <ElFormItem label="IP 协议族策略" label-width="120px">
                    <ElSelect
                      v-model="formData.ipFamilyPolicy"
                      size="default"
                      clearable
                      placeholder="默认: SingleStack"
                      style="width: 250px"
                    >
                      <ElOption label="SingleStack" value="SingleStack" />
                      <ElOption label="PreferDualStack" value="PreferDualStack" />
                      <ElOption label="RequireDualStack" value="RequireDualStack" />
                    </ElSelect>
                  </ElFormItem>
                </div>

                <!-- LoadBalancer 配置 -->
                <div class="config-group" v-if="formData.type === 'LoadBalancer'">
                  <div class="group-label">
                    <CloudUpload :size="14" />
                    负载均衡器配置
                  </div>
                  <ElFormItem label="负载均衡器类" label-width="120px">
                    <ElInput
                      v-model="formData.loadBalancerClass"
                      placeholder="例如: service.k8s.aws/nlb"
                      clearable
                      size="default"
                      style="max-width: 400px"
                    />
                  </ElFormItem>
                  <ElFormItem label="负载均衡器 IP" label-width="120px">
                    <ElInput
                      v-model="formData.loadBalancerIP"
                      placeholder="指定负载均衡器 IP"
                      clearable
                      size="default"
                      style="max-width: 400px"
                    />
                  </ElFormItem>
                  <ElFormItem label="分配 NodePort" label-width="120px">
                    <ElSwitch v-model="formData.allocateLoadBalancerNodePorts" />
                    <span class="form-hint">是否为 LoadBalancer 分配 NodePort</span>
                  </ElFormItem>
                </div>
              </div>
            </ElCollapseItem>
          </ElCollapse>
        </div>
      </ElForm>
    </div>

    <!-- YAML 模式 -->
    <div v-show="editMode === 'yaml'" class="yaml-content">
      <YamlEditor
        :model-value="yamlContent"
        height="600px"
        @update:model-value="handleYamlChange"
      />
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" size="default">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting" size="default">
          {{ dialogType === 'add' ? '创建' : '更新' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>

  <!-- 自定义 Selector 对话框 -->
  <ElDialog
    v-model="showCustomSelectorDialog"
    title="添加自定义 Label"
    width="500px"
    :close-on-click-modal="false"
  >
    <ElForm label-width="80px">
      <ElFormItem label="标签键">
        <ElInput v-model="customSelector.key" placeholder="例如: app" clearable />
      </ElFormItem>
      <ElFormItem label="标签值">
        <ElInput v-model="customSelector.value" placeholder="例如: nginx" clearable />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="showCustomSelectorDialog = false">取消</ElButton>
      <ElButton type="primary" @click="handleAddCustomSelector">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import * as yaml from 'js-yaml'
  import {
    Settings,
    FileCode,
    Network,
    Share2,
    CloudUpload,
    ExternalLink,
    Tag,
    Box,
    Plus,
    Trash2,
    Clock,
    ArrowRight
  } from 'lucide-vue-next'
  import {
    createServiceApi,
    updateServiceApi,
    getServiceDetailApi,
    searchApplicationApi,
    searchVersionApi,
    getVersionLabelsApi,
    type ServiceListItem,
    type ServicePort,
    type ProjectWorkspace
  } from '@/api'
  import YamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    visible: boolean
    dialogType: 'add' | 'edit'
    serviceData: ServiceListItem | null
    workspace?: ProjectWorkspace
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close', 'success'])

  // 表单数据
  interface FormData {
    name: string
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName'
    ports: ServicePort[]
    selectedApplicationId: number | null
    selectedVersionId: number | null
    customSelectors: Array<{ key: string; value: string }>
    labels: Array<{ key: string; value: string }>
    sessionAffinity: string
    sessionAffinityTimeout: number
    externalTrafficPolicy: string
    internalTrafficPolicy: string
    ipFamilyPolicy: string
    loadBalancerClass: string
    loadBalancerIP: string
    allocateLoadBalancerNodePorts: boolean
    externalName: string
  }

  const formRef = ref()
  const editMode = ref<'form' | 'yaml'>('form')
  const submitting = ref(false)
  const yamlContent = ref('')

  const formData = reactive<FormData>({
    name: '',
    type: 'ClusterIP',
    ports: [
      {
        name: 'http',
        protocol: 'TCP',
        port: 80,
        targetPort: '80',
        appProtocol: ''
      }
    ],
    selectedApplicationId: null,
    selectedVersionId: null,
    customSelectors: [],
    labels: [],
    sessionAffinity: 'None',
    sessionAffinityTimeout: 10800,
    externalTrafficPolicy: 'Cluster',
    internalTrafficPolicy: 'Cluster',
    ipFamilyPolicy: '',
    loadBalancerClass: '',
    loadBalancerIP: '',
    allocateLoadBalancerNodePorts: true,
    externalName: ''
  })

  // 表单验证规则
  const formRules = {
    name: [
      { required: true, message: '请输入 Service 名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '名称必须由小写字母、数字和中划线组成',
        trigger: 'blur'
      }
    ],
    type: [{ required: true, message: '请选择 Service 类型', trigger: 'change' }],
    externalName: [
      {
        required: true,
        message: '请输入外部域名',
        trigger: 'blur'
      }
    ]
  }

  const dialogTitle = computed(() => {
    return props.dialogType === 'add' ? '创建 Service' : '编辑 Service'
  })

  // 应用列表
  const applications = ref<any[]>([])
  const loadingApplications = ref(false)

  // 版本列表
  const versions = ref<any[]>([])
  const loadingVersions = ref(false)

  // 版本 labels
  const versionLabels = ref<Array<{ key: string; value: string }>>([])

  // 自定义 Selector
  const showCustomSelectorDialog = ref(false)
  const customSelector = reactive({
    key: '',
    value: ''
  })

  // 计算 Selector (版本 labels + 自定义 labels)
  const computedSelector = computed(() => {
    const selectors: Array<{ key: string; value: string }> = []

    // 添加版本 labels
    selectors.push(...versionLabels.value)

    // 添加自定义 labels
    formData.customSelectors.forEach((s) => {
      if (s.key && s.value) {
        selectors.push(s)
      }
    })

    return selectors
  })

  // 加载应用列表
  const loadApplications = async () => {
    if (!props.workspace) return

    loadingApplications.value = true
    try {
      const response = await searchApplicationApi({
        workspaceId: props.workspace.id
      })
      applications.value = response || []
    } catch (error: any) {
      console.error('加载应用列表失败:', error)
    } finally {
      loadingApplications.value = false
    }
  }

  // 加载版本列表
  const loadVersions = async (applicationId: number) => {
    loadingVersions.value = true
    try {
      const response = await searchVersionApi({
        applicationId
      })
      versions.value = response || []
    } catch (error: any) {
      console.error('加载版本列表失败:', error)
      versions.value = []
    } finally {
      loadingVersions.value = false
    }
  }

  // 加载版本 labels
  const loadVersionLabels = async (versionId: number) => {
    try {
      const labels = await getVersionLabelsApi(versionId)
      versionLabels.value = labels || []
    } catch (error: any) {
      console.error('加载版本标签失败:', error)
      versionLabels.value = []
    }
  }

  // 应用选择变化
  const handleApplicationChange = (applicationId: number | null) => {
    formData.selectedVersionId = null
    versions.value = []
    versionLabels.value = []

    if (applicationId) {
      loadVersions(applicationId)
    }
  }

  // 版本选择变化
  const handleVersionChange = (versionId: number | null) => {
    versionLabels.value = []
    if (versionId) {
      loadVersionLabels(versionId)
    }
  }

  // 添加自定义 Selector
  const handleAddCustomSelector = () => {
    if (!customSelector.key || !customSelector.value) {
      return
    }

    formData.customSelectors.push({
      key: customSelector.key,
      value: customSelector.value
    })

    customSelector.key = ''
    customSelector.value = ''
    showCustomSelectorDialog.value = false
  }

  // 移除 Selector
  const removeSelector = (index: number) => {
    const versionLabelsCount = versionLabels.value.length

    if (index < versionLabelsCount) {
    } else {
      const customIndex = index - versionLabelsCount
      formData.customSelectors.splice(customIndex, 1)
    }
  }

  // 端口管理
  const addPort = () => {
    formData.ports.push({
      name: '',
      protocol: 'TCP',
      port: 80,
      targetPort: '80',
      appProtocol: ''
    })
  }

  const removePort = (index: number) => {
    if (formData.ports.length > 1) {
      formData.ports.splice(index, 1)
    }
  }

  // Labels 管理
  const addLabel = () => {
    formData.labels.push({ key: '', value: '' })
  }

  const removeLabel = (index: number) => {
    formData.labels.splice(index, 1)
  }

  // 类型变化
  const handleTypeChange = () => {
    if (formData.type === 'ExternalName') {
      // ExternalName 类型不需要端口和 Selector
      formData.ports = []
    } else if (formData.ports.length === 0) {
      // 切换回其他类型时添加默认端口
      addPort()
    }
  }

  // 表单转 YAML
  const formToYaml = () => {
    const selector: Record<string, string> = {}
    computedSelector.value.forEach((s) => {
      if (s.key && s.value) {
        selector[s.key] = s.value
      }
    })

    const labels: Record<string, string> = {}
    formData.labels.forEach((l) => {
      if (l.key && l.value) {
        labels[l.key] = l.value
      }
    })

    const serviceObj: any = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: formData.name,
        namespace: props.workspace?.namespace || 'default',
        labels: labels
      },
      spec: {
        type: formData.type
      }
    }

    if (formData.type === 'ExternalName') {
      serviceObj.spec.externalName = formData.externalName
    } else {
      serviceObj.spec.selector = selector
      serviceObj.spec.sessionAffinity = formData.sessionAffinity
      serviceObj.spec.ports = formData.ports.map((p) => {
        const port: any = {
          name: p.name,
          protocol: p.protocol,
          port: p.port,
          targetPort: isNaN(Number(p.targetPort)) ? p.targetPort : Number(p.targetPort)
        }
        if (p.appProtocol) {
          port.appProtocol = p.appProtocol
        }
        if (p.nodePort) {
          port.nodePort = p.nodePort
        }
        return port
      })

      // 会话保持配置
      if (formData.sessionAffinity === 'ClientIP') {
        serviceObj.spec.sessionAffinityConfig = {
          clientIP: {
            timeoutSeconds: formData.sessionAffinityTimeout
          }
        }
      }

      // 流量策略
      if (formData.externalTrafficPolicy !== 'Cluster') {
        serviceObj.spec.externalTrafficPolicy = formData.externalTrafficPolicy
      }
      if (formData.internalTrafficPolicy !== 'Cluster') {
        serviceObj.spec.internalTrafficPolicy = formData.internalTrafficPolicy
      }

      // IP 配置
      if (formData.ipFamilyPolicy) {
        serviceObj.spec.ipFamilyPolicy = formData.ipFamilyPolicy
      }

      // LoadBalancer 配置
      if (formData.type === 'LoadBalancer') {
        if (formData.loadBalancerClass) {
          serviceObj.spec.loadBalancerClass = formData.loadBalancerClass
        }
        if (formData.loadBalancerIP) {
          serviceObj.spec.loadBalancerIP = formData.loadBalancerIP
        }
        if (!formData.allocateLoadBalancerNodePorts) {
          serviceObj.spec.allocateLoadBalancerNodePorts = false
        }
      }
    }

    if (Object.keys(serviceObj.metadata.labels).length === 0) {
      delete serviceObj.metadata.labels
    }

    yamlContent.value = yaml.dump(serviceObj, { indent: 2 })
  }

  // YAML 转表单
  const yamlToForm = () => {
    try {
      const obj: any = yaml.load(yamlContent.value)

      if (props.workspace) {
        obj.metadata.namespace = props.workspace.namespace
      }

      formData.name = obj.metadata?.name || ''
      formData.type = obj.spec?.type || 'ClusterIP'
      formData.externalName = obj.spec?.externalName || ''
      formData.sessionAffinity = obj.spec?.sessionAffinity || 'None'

      if (obj.spec?.sessionAffinityConfig?.clientIP?.timeoutSeconds) {
        formData.sessionAffinityTimeout = obj.spec.sessionAffinityConfig.clientIP.timeoutSeconds
      }

      formData.externalTrafficPolicy = obj.spec?.externalTrafficPolicy || 'Cluster'
      formData.internalTrafficPolicy = obj.spec?.internalTrafficPolicy || 'Cluster'
      formData.ipFamilyPolicy = obj.spec?.ipFamilyPolicy || ''
      formData.loadBalancerClass = obj.spec?.loadBalancerClass || ''
      formData.loadBalancerIP = obj.spec?.loadBalancerIP || ''
      formData.allocateLoadBalancerNodePorts = obj.spec?.allocateLoadBalancerNodePorts !== false

      formData.ports =
        obj.spec?.ports?.map((p: any) => ({
          name: p.name || '',
          protocol: p.protocol || 'TCP',
          port: p.port || 80,
          targetPort: String(p.targetPort || '80'),
          nodePort: p.nodePort,
          appProtocol: p.appProtocol || ''
        })) || []

      // Labels
      const labels = obj.metadata?.labels || {}
      formData.labels = Object.entries(labels).map(([key, value]) => ({
        key,
        value: String(value)
      }))

      // Selector 需要从 YAML 中解析
      // 但由于我们使用服务版本 + 自定义的方式,这里不直接解析 selector
      // 用户需要在表单模式中重新配置

      formToYaml()
    } catch (error) {
      console.error('YAML 解析失败:', error)
    }
  }

  const handleYamlChange = (content: string) => {
    yamlContent.value = content
  }

  // 加载编辑数据
  const loadEditData = async () => {
    if (!props.serviceData || !props.workspace) return

    try {
      const detail = await getServiceDetailApi({
        workloadId: props.workspace.id,
        name: props.serviceData.name
      })

      formData.name = detail.name
      formData.type = detail.type as any
      formData.sessionAffinity = detail.sessionAffinity

      formData.ports =
        detail.ports?.map((p) => ({
          name: p.name,
          protocol: p.protocol,
          port: p.port,
          targetPort: String(p.targetPort),
          nodePort: p.nodePort,
          appProtocol: (p as any).appProtocol || ''
        })) || []

      // Labels
      if (detail.labels) {
        formData.labels = Object.entries(detail.labels).map(([key, value]) => ({
          key,
          value: String(value)
        }))
      }

      // Selector - 转换为自定义 selectors
      if (detail.selector) {
        formData.customSelectors = Object.entries(detail.selector).map(([key, value]) => ({
          key,
          value: String(value)
        }))
      }

      formToYaml()
    } catch (error: any) {
      console.error('加载 Service 详情失败:', error)
    }
  }

  // 提交
  const handleSubmit = async () => {
    if (!props.workspace) {
      return
    }

    if (editMode.value === 'yaml') {
      yamlToForm()
    }

    try {
      await formRef.value?.validate()
    } catch (error) {
      return
    }

    if (formData.type !== 'ExternalName' && formData.ports.length === 0) {
      return
    }

    if (formData.type !== 'ExternalName' && computedSelector.value.length === 0) {
      return
    }

    submitting.value = true
    try {
      const selector: Record<string, string> = {}
      computedSelector.value.forEach((s) => {
        if (s.key && s.value) {
          selector[s.key] = s.value
        }
      })

      const labels: Record<string, string> = {}
      formData.labels.forEach((l) => {
        if (l.key && l.value) {
          labels[l.key] = l.value
        }
      })

      const requestData: any = {
        workloadId: props.workspace.id,
        name: formData.name,
        type: formData.type,
        labels
      }

      if (formData.type === 'ExternalName') {
        requestData.externalName = formData.externalName
      } else {
        requestData.ports = formData.ports.map((p) => {
          const port: any = {
            name: p.name,
            protocol: p.protocol,
            port: p.port,
            targetPort: isNaN(Number(p.targetPort)) ? p.targetPort : Number(p.targetPort)
          }
          if (p.appProtocol) {
            port.appProtocol = p.appProtocol
          }
          if (p.nodePort) {
            port.nodePort = p.nodePort
          }
          return port
        })
        requestData.selector = selector
        requestData.sessionAffinity = formData.sessionAffinity

        // 会话保持配置
        if (formData.sessionAffinity === 'ClientIP') {
          requestData.sessionAffinityConfig = {
            clientIP: {
              timeoutSeconds: formData.sessionAffinityTimeout
            }
          }
        }

        // 流量策略
        if (formData.externalTrafficPolicy !== 'Cluster') {
          requestData.externalTrafficPolicy = formData.externalTrafficPolicy
        }
        if (formData.internalTrafficPolicy !== 'Cluster') {
          requestData.internalTrafficPolicy = formData.internalTrafficPolicy
        }

        // IP 配置
        if (formData.ipFamilyPolicy) {
          requestData.ipFamilyPolicy = formData.ipFamilyPolicy
        }

        // LoadBalancer 配置
        if (formData.type === 'LoadBalancer') {
          if (formData.loadBalancerClass) {
            requestData.loadBalancerClass = formData.loadBalancerClass
          }
          if (formData.loadBalancerIP) {
            requestData.loadBalancerIP = formData.loadBalancerIP
          }
          if (!formData.allocateLoadBalancerNodePorts) {
            requestData.allocateLoadBalancerNodePorts = false
          }
        }
      }

      if (props.dialogType === 'add') {
        await createServiceApi(requestData)
        ElMessage.success('创建成功')
      } else {
        await updateServiceApi(requestData)
        ElMessage.success('更新成功')
      }

      emit('success')
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    emit('close')
  }

  // 初始化
  watch(
    () => props.visible,
    async (visible) => {
      if (visible) {
        await loadApplications()

        if (props.dialogType === 'edit' && props.serviceData) {
          await loadEditData()
        } else {
          // 重置表单
          Object.assign(formData, {
            name: '',
            type: 'ClusterIP',
            ports: [
              {
                name: 'http',
                protocol: 'TCP',
                port: 80,
                targetPort: '80',
                appProtocol: ''
              }
            ],
            selectedApplicationId: null,
            selectedVersionId: null,
            customSelectors: [],
            labels: [],
            sessionAffinity: 'None',
            sessionAffinityTimeout: 10800,
            externalTrafficPolicy: 'Cluster',
            internalTrafficPolicy: 'Cluster',
            ipFamilyPolicy: '',
            loadBalancerClass: '',
            loadBalancerIP: '',
            allocateLoadBalancerNodePorts: true,
            externalName: ''
          })
          versionLabels.value = []
          editMode.value = 'form'
          formToYaml()
        }

        await nextTick()
        formRef.value?.clearValidate()
      }
    },
    { immediate: true }
  )

  // 监听表单变化，同步到 YAML
  watch(
    () => [
      formData.name,
      formData.type,
      formData.ports,
      formData.labels,
      computedSelector.value,
      formData.sessionAffinity,
      formData.externalName
    ],
    () => {
      if (editMode.value === 'form') {
        formToYaml()
      }
    },
    { deep: true }
  )
</script>

<style lang="scss" scoped>
  .mode-switcher {
    padding: 20px 20px 0;
    margin-bottom: 20px;
    border-bottom: 1px solid #e4e7ed;
  }

  .dialog-content {
    max-height: 65vh;
    overflow-y: auto;
    padding: 0 20px 20px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }
  }

  .yaml-content {
    height: 60vh;
    padding: 0 20px 20px;
  }

  .form-section {
    margin-bottom: 24px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #409eff;
    }
  }

  .application-option,
  .version-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .version-name {
      color: #606266;
      font-size: 13px;
    }
  }

  .selector-preview {
    width: 100%;
    padding: 12px;
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    min-height: 60px;

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .preview-title {
        font-size: 13px;
        color: #606266;
        font-weight: 500;
      }
    }

    .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .ports-table {
    width: 100%;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    background: white;
    overflow: hidden;

    .ports-header {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      background: #f5f7fa;
      border-bottom: 1px solid #e4e7ed;
      font-size: 12px;
      font-weight: 600;
      color: #606266;
      gap: 8px;

      .col-name {
        flex: 0 0 110px;
      }
      .col-protocol {
        flex: 0 0 90px;
      }
      .col-app-protocol {
        flex: 0 0 100px;
      }
      .col-port {
        flex: 0 0 110px;
      }
      .col-arrow {
        flex: 0 0 28px;
        text-align: center;
      }
      .col-nodeport {
        flex: 0 0 110px;
      }
      .col-action {
        flex: 0 0 60px;
        text-align: center;
      }
    }

    .port-row {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      gap: 8px;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .col-name {
        flex: 0 0 110px;
      }
      .col-protocol {
        flex: 0 0 90px;
      }
      .col-app-protocol {
        flex: 0 0 100px;
      }
      .col-port {
        flex: 0 0 110px;
      }
      .col-arrow {
        flex: 0 0 28px;
        display: flex;
        justify-content: center;
        align-items: center;

        .arrow-icon {
          color: #409eff;
        }
      }
      .col-nodeport {
        flex: 0 0 110px;
      }
      .col-action {
        flex: 0 0 60px;
        display: flex;
        justify-content: center;
      }
    }

    .add-port-btn {
      padding: 10px 12px;
      text-align: center;
      border-top: 1px dashed #e4e7ed;
      background: #fafbfc;
    }
  }

  .kv-list {
    width: 100%;

    .kv-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;

      .separator {
        color: #909399;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
      }
    }
  }

  .advanced-config {
    border: none;

    :deep(.el-collapse-item) {
      border: none;
    }

    :deep(.el-collapse-item__header) {
      background: transparent;
      border: none;
      padding: 0;
      height: auto;
      line-height: 1.5;
      font-size: 14px;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #409eff;

      &:hover {
        background: transparent;
      }
    }

    :deep(.el-collapse-item__wrap) {
      border: none;
      background: transparent;
    }

    :deep(.el-collapse-item__content) {
      padding: 0;
      background: transparent;
      border: none;
    }

    .collapse-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
    }

    .advanced-content {
      max-height: 360px;
      overflow-y: auto;
      padding-right: 8px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 3px;
      }
    }

    .config-group {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px dashed #dcdfe6;

      &:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }

      .group-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: #409eff;
        margin-bottom: 12px;
        padding-left: 10px;
        border-left: 3px solid #409eff;
      }
    }
  }

  .form-hint {
    font-size: 12px;
    color: #909399;
    margin-left: 10px;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  :deep(.el-radio-button) {
    .el-radio-button__inner {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }
</style>

<style lang="scss">
  .service-dialog.el-dialog .el-dialog__body {
    padding: 0 !important;
    margin: 0 !important;
  }
</style>
