<template>
  <div class="service-management-modern">
    <!-- 表格头部 -->
    <ArtTableHeader
      v-model:columns="columns"
      :loading="loading"
      :showZebra="true"
      :showBorder="true"
      :showHeaderBackground="true"
      :fullClass="'service-management-modern'"
      :layout="'refresh,size,fullscreen,columns,settings'"
      @refresh="handleRefresh"
    >
      <template #left>
        <ElSpace wrap>
          <ElButton type="primary" :icon="Plus" @click="handleCreate"> 创建 Service </ElButton>
        </ElSpace>
      </template>
    </ArtTableHeader>

    <!-- 数据表格 -->
    <ArtTable :loading="loading" :data="services" :columns="columns" />

    <!-- 创建/编辑 Service 对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      top="5vh"
      :close-on-click-modal="false"
      @close="handleDialogClose"
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
        <ElAlert v-if="editMode === 'yaml'" type="warning" :closable="false" show-icon>
          <template #title> 版本配置只能在表单模式中设置，YAML 中的 selector 将被忽略 </template>
        </ElAlert>
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
                style="max-width: 500px"
              />
            </ElFormItem>

            <ElFormItem label="Service 类型" prop="type">
              <ElRadioGroup v-model="formData.type" size="default" @change="handleTypeChange">
                <ElRadioButton value="ClusterIP">
                  <component :is="getServiceTypeIcon('ClusterIP')" :size="14" />
                  ClusterIP
                </ElRadioButton>
                <ElRadioButton value="NodePort">
                  <component :is="getServiceTypeIcon('NodePort')" :size="14" />
                  NodePort
                </ElRadioButton>
                <ElRadioButton value="LoadBalancer">
                  <component :is="getServiceTypeIcon('LoadBalancer')" :size="14" />
                  LoadBalancer
                </ElRadioButton>
                <ElRadioButton value="ExternalName">
                  <component :is="getServiceTypeIcon('ExternalName')" :size="14" />
                  ExternalName
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>

            <!-- ExternalName 专用字段 -->
            <ElFormItem
              v-if="formData.type === 'ExternalName'"
              label="外部域名"
              prop="externalName"
            >
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
                    <ArrowRight :size="14" class="arrow-icon" />
                  </div>
                  <div class="col-port">
                    <ElInputNumber
                      v-model="port.port"
                      :min="1"
                      :max="65535"
                      placeholder="80"
                      controls-position="right"
                      size="small"
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
                      placeholder="30000"
                      controls-position="right"
                      size="small"
                    />
                  </div>
                  <div class="col-action">
                    <ElButton
                      text
                      type="danger"
                      :icon="Trash2"
                      size="small"
                      @click="removePort(index)"
                    />
                  </div>
                </div>

                <!-- 添加按钮 -->
                <div class="add-port-btn">
                  <ElButton text type="primary" :icon="Plus" size="small" @click="addPort">
                    添加端口
                  </ElButton>
                </div>
              </div>
            </ElFormItem>
          </div>

          <!-- 版本配置 -->
          <div v-if="formData.type !== 'ExternalName'" class="form-section">
            <div class="section-title">
              <Tag :size="16" />
              版本配置
            </div>

            <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 12px">
              <template #title> 选择版本后，会自动设置 Service 的 Labels 和 Selector </template>
              <div style="font-size: 12px; margin-top: 4px">
                • 全部版本：Service 不使用 Selector，流量转发到所有版本的 Pod<br />
                • 指定版本：Service 使用版本的 Labels 作为 Selector，只转发到特定版本
              </div>
            </ElAlert>

            <ElFormItem label="版本选择" prop="versionMode">
              <ElRadioGroup v-model="versionMode" size="default" @change="handleVersionModeChange">
                <ElRadioButton value="all">
                  <Layers :size="14" />
                  全部版本
                </ElRadioButton>
                <ElRadioButton value="specific">
                  <CheckCircle :size="14" />
                  指定版本
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>

            <!-- 指定版本 -->
            <template v-if="versionMode === 'specific'">
              <ElFormItem label="选择版本">
                <ElSelect
                  v-model="selectedVersionId"
                  placeholder="请选择版本"
                  clearable
                  size="default"
                  @change="handleVersionSelect"
                  style="width: 100%"
                >
                  <ElOption
                    v-for="version in versions"
                    :key="version.id"
                    :label="`v${version.version} - ${version.resourceName}`"
                    :value="version.id"
                  >
                    <div class="version-option">
                      <ElTag size="small" type="success">v{{ version.version }}</ElTag>
                      <span class="version-name">{{ version.resourceName }}</span>
                    </div>
                  </ElOption>
                </ElSelect>
              </ElFormItem>

              <ElFormItem
                v-if="selectedVersionId && versionLabels.length > 0"
                label="Selector 预览"
              >
                <div class="selector-preview">
                  <div class="preview-header">
                    <span class="preview-title">将使用以下标签选择 Pod：</span>
                  </div>
                  <div class="preview-tags">
                    <ElTag
                      v-for="label in versionLabels"
                      :key="label.key"
                      type="success"
                      size="default"
                    >
                      {{ label.key }}={{ label.value }}
                    </ElTag>
                  </div>
                </div>
              </ElFormItem>
            </template>

            <!-- 全部版本提示 -->
            <ElFormItem v-if="versionMode === 'all'" label="Selector">
              <div class="selector-preview">
                <ElTag type="info" size="default">
                  <Layers :size="14" />
                  不使用 Selector，流量转发到所有版本
                </ElTag>
              </div>
            </ElFormItem>
          </div>

          <!-- 高级配置 -->
          <ElCollapse v-model="activeCollapse" class="advanced-config">
            <ElCollapseItem name="advanced">
              <template #title>
                <div class="collapse-title">
                  <Sliders :size="16" />
                  高级配置（可选）
                </div>
              </template>

              <div class="advanced-content">
                <!-- IP 配置 -->
                <div class="config-group" v-if="formData.type !== 'ExternalName'">
                  <div class="group-label">
                    <Network :size="14" />
                    IP 配置
                  </div>

                  <ElRow :gutter="16">
                    <ElCol :span="12">
                      <ElFormItem label="Cluster IP" label-width="120px">
                        <ElInput
                          v-model="formData.clusterIP"
                          placeholder="自动分配"
                          clearable
                          size="default"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                      <ElFormItem label="IP 协议族策略" label-width="120px">
                        <ElSelect v-model="formData.ipFamilyPolicy" size="default" clearable>
                          <ElOption label="单栈" value="SingleStack" />
                          <ElOption label="首选双栈" value="PreferDualStack" />
                          <ElOption label="必须双栈" value="RequireDualStack" />
                        </ElSelect>
                      </ElFormItem>
                    </ElCol>
                  </ElRow>

                  <ElFormItem label="IP 协议族" label-width="120px">
                    <ElCheckboxGroup v-model="formData.ipFamilies">
                      <ElCheckbox value="IPv4">IPv4</ElCheckbox>
                      <ElCheckbox value="IPv6">IPv6</ElCheckbox>
                    </ElCheckboxGroup>
                  </ElFormItem>

                  <ElFormItem label="External IPs" label-width="120px">
                    <ElSelect
                      v-model="formData.externalIPs"
                      multiple
                      filterable
                      allow-create
                      placeholder="按回车添加 IP"
                      size="default"
                      style="width: 100%"
                    />
                  </ElFormItem>
                </div>

                <!-- 负载均衡器配置 -->
                <div class="config-group" v-if="formData.type === 'LoadBalancer'">
                  <div class="group-label">
                    <Cloud :size="14" />
                    负载均衡器配置
                  </div>

                  <ElRow :gutter="16">
                    <ElCol :span="12">
                      <ElFormItem label="LoadBalancer IP" label-width="140px">
                        <ElInput
                          v-model="formData.loadBalancerIP"
                          placeholder="指定负载均衡器 IP"
                          clearable
                          size="default"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                      <ElFormItem label="LoadBalancer Class" label-width="150px">
                        <ElInput
                          v-model="formData.loadBalancerClass"
                          placeholder="例如: service.k8s.aws/nlb"
                          clearable
                          size="default"
                        />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>

                  <ElFormItem label="源 IP 限制 (CIDR)" label-width="150px">
                    <ElSelect
                      v-model="formData.loadBalancerSourceRanges"
                      multiple
                      filterable
                      allow-create
                      placeholder="例如: 10.0.0.0/8"
                      size="default"
                      style="width: 100%"
                    />
                  </ElFormItem>

                  <ElFormItem label="分配 NodePort" label-width="120px">
                    <ElSwitch v-model="formData.allocateLoadBalancerNodePorts" />
                    <span class="form-hint">关闭可节省端口资源</span>
                  </ElFormItem>
                </div>

                <!-- 流量策略 -->
                <div class="config-group" v-if="formData.type !== 'ExternalName'">
                  <div class="group-label">
                    <ArrowRightLeft :size="14" />
                    流量策略
                  </div>

                  <ElRow :gutter="16">
                    <!-- externalTrafficPolicy 只对 NodePort 和 LoadBalancer 可用 -->
                    <ElCol
                      :span="12"
                      v-if="formData.type === 'NodePort' || formData.type === 'LoadBalancer'"
                    >
                      <ElFormItem label="外部流量策略" label-width="120px">
                        <ElRadioGroup v-model="formData.externalTrafficPolicy" size="default">
                          <ElRadio value="Cluster">Cluster</ElRadio>
                          <ElRadio value="Local">Local</ElRadio>
                        </ElRadioGroup>
                        <div class="form-hint">Local 可保留源 IP</div>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                      <ElFormItem label="内部流量策略" label-width="120px">
                        <ElRadioGroup v-model="formData.internalTrafficPolicy" size="default">
                          <ElRadio value="Cluster">Cluster</ElRadio>
                          <ElRadio value="Local">Local</ElRadio>
                        </ElRadioGroup>
                      </ElFormItem>
                    </ElCol>
                  </ElRow>
                </div>

                <!-- 会话保持 -->
                <div class="config-group" v-if="formData.type !== 'ExternalName'">
                  <div class="group-label">
                    <Shield :size="14" />
                    会话保持
                  </div>

                  <ElRow :gutter="16">
                    <ElCol :span="12">
                      <ElFormItem label="Session Affinity" label-width="130px">
                        <ElRadioGroup v-model="formData.sessionAffinity" size="default">
                          <ElRadio value="None">None</ElRadio>
                          <ElRadio value="ClientIP">ClientIP</ElRadio>
                        </ElRadioGroup>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12" v-if="formData.sessionAffinity === 'ClientIP'">
                      <ElFormItem label="超时时间(秒)" label-width="120px">
                        <ElInputNumber
                          v-model="sessionAffinityTimeout"
                          :min="1"
                          :max="86400"
                          placeholder="10800"
                          size="default"
                          style="width: 100%"
                        />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>
                </div>

                <!-- 健康检查 -->
                <div class="config-group" v-if="formData.type === 'LoadBalancer'">
                  <div class="group-label">
                    <Heart :size="14" />
                    健康检查
                  </div>

                  <ElRow :gutter="16">
                    <ElCol :span="12">
                      <ElFormItem label="健康检查端口" label-width="120px">
                        <ElInputNumber
                          v-model="formData.healthCheckNodePort"
                          :min="30000"
                          :max="32767"
                          placeholder="自动分配"
                          size="default"
                          style="width: 100%"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                      <ElFormItem label="发布未就绪地址" label-width="130px">
                        <ElSwitch v-model="formData.publishNotReadyAddresses" />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>
                </div>

                <!-- 元数据 -->
                <div class="config-group">
                  <div class="group-label">
                    <FileText :size="14" />
                    元数据
                  </div>

                  <ElFormItem label="Labels" label-width="120px">
                    <div class="kv-list">
                      <div
                        v-for="(value, key, index) in formData.labels"
                        :key="index"
                        class="kv-row"
                      >
                        <ElInput :value="key" disabled size="default" style="width: 160px" />
                        <span class="separator">=</span>
                        <ElInput
                          :model-value="value"
                          @update:model-value="updateLabel(key, $event)"
                          size="default"
                          style="width: 160px"
                        />
                        <ElButton
                          text
                          type="danger"
                          :icon="Trash2"
                          size="small"
                          @click="removeLabel(key)"
                        />
                      </div>
                      <div class="kv-row">
                        <ElInput
                          v-model="newLabel.key"
                          placeholder="键"
                          size="default"
                          style="width: 160px"
                        />
                        <span class="separator">=</span>
                        <ElInput
                          v-model="newLabel.value"
                          placeholder="值"
                          size="default"
                          style="width: 160px"
                        />
                        <ElButton text type="primary" :icon="Plus" size="small" @click="addLabel">
                          添加
                        </ElButton>
                      </div>
                    </div>
                  </ElFormItem>

                  <ElFormItem label="Annotations" label-width="120px">
                    <div class="kv-list">
                      <div
                        v-for="(value, key, index) in formData.annotations"
                        :key="index"
                        class="kv-row"
                      >
                        <ElInput :value="key" disabled size="default" style="width: 160px" />
                        <span class="separator">=</span>
                        <ElInput
                          :model-value="value"
                          @update:model-value="updateAnnotation(key, $event)"
                          size="default"
                          style="width: 160px"
                        />
                        <ElButton
                          text
                          type="danger"
                          :icon="Trash2"
                          size="small"
                          @click="removeAnnotation(key)"
                        />
                      </div>
                      <div class="kv-row">
                        <ElInput
                          v-model="newAnnotation.key"
                          placeholder="键"
                          size="default"
                          style="width: 160px"
                        />
                        <span class="separator">=</span>
                        <ElInput
                          v-model="newAnnotation.value"
                          placeholder="值"
                          size="default"
                          style="width: 160px"
                        />
                        <ElButton
                          text
                          type="primary"
                          :icon="Plus"
                          size="small"
                          @click="addAnnotation"
                        >
                          添加
                        </ElButton>
                      </div>
                    </div>
                  </ElFormItem>
                </div>
              </div>
            </ElCollapseItem>
          </ElCollapse>
        </ElForm>
      </div>

      <!-- YAML 模式 -->
      <div v-show="editMode === 'yaml'" class="yaml-content">
        <YamlEditor
          v-model="yamlContent"
          height="calc(100vh - 300px)"
          :readonly="false"
          :show-toolbar="true"
          :show-line-numbers="true"
          :show-status-bar="true"
          filename="service.yaml"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false" size="default">取消</ElButton>
          <ElButton
            type="primary"
            :loading="submitting"
            :disabled="editMode === 'yaml'"
            @click="handleSubmit"
            size="default"
          >
            {{ dialogMode === 'create' ? '创建' : '更新' }}
          </ElButton>
          <ElTooltip v-if="editMode === 'yaml'" content="请切换到表单模式后提交" placement="top">
            <ElIcon style="margin-left: 8px; color: #909399">
              <InfoFilled />
            </ElIcon>
          </ElTooltip>
        </div>
      </template>
    </ElDialog>

    <!-- 详情查看弹窗 -->
    <ServiceDetailDialog
      v-model:visible="detailVisible"
      :service-name="currentServiceName"
      :workspace="workspace"
    />

    <!-- Endpoints 查看弹窗 -->
    <ServiceEndpointsDialog
      v-model:visible="endpointsVisible"
      :service-name="currentServiceName"
      :workspace="workspace"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, h } from 'vue'
  import type { VNode } from 'vue'
  import {
    ElMessage,
    ElMessageBox,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElTag,
    ElButton,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import { InfoFilled } from '@element-plus/icons-vue'
  import * as yaml from 'js-yaml'
  import {
    Plus,
    Server,
    Eye,
    Trash2,
    Settings,
    Tag,
    Network,
    Sliders,
    ArrowRight,
    Globe,
    ExternalLink,
    ArrowRightLeft,
    Cloud,
    Shield,
    Heart,
    FileText,
    Layers,
    CheckCircle,
    RefreshCw,
    Download,
    FileCode,
    MoreVertical,
    Edit
  } from 'lucide-vue-next'
  import YamlEditor from '@/components/yaml-editor-pro/index.vue'
  import ServiceDetailDialog from '../../../core/service/components/ServiceDetailDialog.vue'
  import ServiceEndpointsDialog from '../../../core/service/components/ServiceEndpointsDialog.vue'
  import {
    searchVersionApi,
    getVersionLabelsApi,
    createApplicationServiceApi,
    getApplicationServiceListApi,
    getServiceYamlApi,
    deleteServiceApi,
    updateApplicationServiceApi,
    getServiceDetailApi,
    type OnecProjectVersion,
    type VersionLabelsResp,
    type ApplicationServiceRequest,
    type ApplicationServiceListResponse,
    type OnecProjectApplication,
    type ProjectCluster,
    type ProjectWorkspace,
    type ServicePort
  } from '@/api'

  interface Props {
    application: OnecProjectApplication
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
    refreshTrigger: number
  }

  const props = defineProps<Props>()

  const services = ref<ApplicationServiceListResponse[]>([])
  const loading = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})
  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const submitting = ref(false)
  const editMode = ref<'form' | 'yaml'>('form')
  const yamlContent = ref('')

  const formRef = ref<FormInstance>()
  const activeCollapse = ref<string[]>([])

  // 详情弹窗
  const detailVisible = ref(false)
  const endpointsVisible = ref(false)
  const currentServiceName = ref('')

  // 版本相关
  const versions = ref<OnecProjectVersion[]>([])
  const versionMode = ref<'all' | 'specific'>('all')
  const selectedVersionId = ref<number | null>(null)
  const versionLabels = ref<VersionLabelsResp[]>([])

  // 会话保持超时
  const sessionAffinityTimeout = ref<number>(10800)

  // 表单数据
  const formData = ref<ApplicationServiceRequest>({
    workloadId: 0,
    applicationId: 0,
    isAppSvc: false,
    isAllSvc: true,
    name: '',
    type: 'ClusterIP',
    ports: [],
    selector: {},
    sessionAffinity: 'None',
    internalTrafficPolicy: 'Cluster',
    allocateLoadBalancerNodePorts: true,
    publishNotReadyAddresses: false,
    labels: {},
    annotations: {},
    ipFamilies: ['IPv4'],
    ipFamilyPolicy: 'SingleStack',
    externalIPs: [],
    loadBalancerSourceRanges: []
  })

  const newLabel = ref({ key: '', value: '' })
  const newAnnotation = ref({ key: '', value: '' })

  // 表单验证规则
  const formRules: FormRules = {
    name: [{ required: true, message: '请输入 Service 名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择 Service 类型', trigger: 'change' }],
    externalName: [
      {
        required: true,
        message: 'ExternalName 类型必须填写外部域名',
        trigger: 'blur'
      }
    ],
    ports: [
      {
        validator: (rule, value, callback) => {
          if (formData.value.type === 'ExternalName') {
            callback()
          } else if (!value || value.length === 0) {
            callback(new Error('请至少配置一个端口'))
          } else {
            callback()
          }
        },
        trigger: 'change'
      }
    ]
  }

  const dialogTitle = computed(() => {
    return dialogMode.value === 'create' ? '创建 Service' : '编辑 Service'
  })

  // 格式化运行时长
  const formatAge = (ageStr: string): string => {
    if (!ageStr) return '-'
    // 移除小数点后的数字，例如 33m34.682814s => 33m34s
    return ageStr.replace(/(\d+)\.(\d+)([a-z]+)/g, '$1$3')
  }

  const getServiceTypeTag = (type: string) => {
    const tagMap: Record<string, string> = {
      ClusterIP: 'info',
      NodePort: 'success',
      LoadBalancer: 'warning',
      ExternalName: 'danger'
    }
    return tagMap[type] || 'info'
  }

  const getServiceTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      ClusterIP: Network,
      NodePort: Server,
      LoadBalancer: Cloud,
      ExternalName: ExternalLink
    }
    return iconMap[type] || Globe
  }

  const handleCommand = (command: string, row: ApplicationServiceListResponse) => {
    switch (command) {
      case 'view':
        handleView(row)
        break
      case 'edit':
        handleEdit(row)
        break
      case 'endpoints':
        handleViewEndpoints(row)
        break
      case 'yaml':
        handleDownloadYaml(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  // 创建表格列配置
  const createTableColumns = () => {
    const allColumns = [
      {
        prop: 'name',
        label: 'Service 名称',
        minWidth: 180,
        fixed: 'left' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('span', { style: 'font-weight: 500;' }, row.name)
        }
      },
      {
        prop: 'version',
        label: '关联版本',
        width: 120,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          if (!row.version || row.version === 0) {
            return h(ElTag, { type: 'info', size: 'default' }, () => '全部版本')
          }
          return h(ElTag, { type: 'success', size: 'default' }, () => row.versionName)
        }
      },
      {
        prop: 'type',
        label: 'Service 类型',
        width: 140,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const type = row.type
          return h(ElTag, { type: getServiceTypeTag(type), size: 'default' }, () => type)
        }
      },
      {
        prop: 'clusterIP',
        label: 'Cluster IP',
        width: 150,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('span', row.clusterIP || '-')
        }
      },
      {
        prop: 'externalIP',
        label: 'External IP',
        width: 150,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          if (row.externalIP) {
            return h('span', { style: 'color: #409eff;' }, row.externalIP)
          }
          return h('span', { style: 'color: #909399;' }, '-')
        }
      },
      {
        prop: 'ports',
        label: '端口',
        minWidth: 200,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('span', row.ports || '-')
        }
      },
      {
        prop: 'age',
        label: '创建时长',
        width: 130,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('span', formatAge(row.age))
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 80,
        align: 'center' as const,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('div', [
            h(
              ElDropdown,
              {
                trigger: 'click',
                onCommand: (cmd: string) => handleCommand(cmd, row)
              },
              {
                default: () =>
                  h(ElButton, { type: 'primary', link: true }, () => h(MoreVertical, { size: 16 })),
                dropdown: () =>
                  h(ElDropdownMenu, {}, () => [
                    h(ElDropdownItem, { command: 'view' }, () => [
                      h(Eye, { size: 14, style: 'margin-right: 6px' }),
                      '查看详情'
                    ]),
                    h(ElDropdownItem, { command: 'edit' }, () => [
                      h(Edit, { size: 14, style: 'margin-right: 6px' }),
                      '编辑'
                    ]),
                    h(ElDropdownItem, { command: 'endpoints' }, () => [
                      h(Network, { size: 14, style: 'margin-right: 6px' }),
                      '查看端点'
                    ]),
                    h(ElDropdownItem, { command: 'yaml' }, () => [
                      h(Download, { size: 14, style: 'margin-right: 6px' }),
                      '下载 YAML'
                    ]),
                    h('li', { class: 'el-dropdown-menu__item--divided', role: 'separator' }),
                    h(ElDropdownItem, { command: 'delete' }, () => [
                      h(Trash2, { size: 14, style: 'margin-right: 6px; color: #f56c6c' }),
                      h('span', { style: 'color: #f56c6c' }, '删除')
                    ])
                  ])
              }
            )
          ])
        }
      }
    ]

    const columns = ref(allColumns)

    return {
      columns
    }
  }

  const { columns } = createTableColumns()

  const handleTypeChange = () => {
    // 清理不适用的字段
    if (formData.value.type === 'ExternalName') {
      // ExternalName 类型：清理所有端口、selector 和流量策略相关配置
      formData.value.ports = []
      formData.value.selector = {}
      delete (formData.value as any).externalTrafficPolicy
      delete (formData.value as any).internalTrafficPolicy
      formData.value.sessionAffinity = 'None'
      delete (formData.value as any).clusterIP
    } else if (formData.value.type === 'ClusterIP') {
      // ClusterIP 类型：不能有 externalTrafficPolicy 和 nodePort
      formData.value.externalName = ''
      delete (formData.value as any).externalTrafficPolicy // 使用 delete 彻底删除
      formData.value.internalTrafficPolicy = 'Cluster'
      // 清理端口中的 nodePort
      formData.value.ports.forEach((port) => {
        delete (port as any).nodePort
      })
      if (formData.value.ports.length === 0) {
        addPort()
      }
    } else if (formData.value.type === 'NodePort' || formData.value.type === 'LoadBalancer') {
      // NodePort 和 LoadBalancer：可以有 externalTrafficPolicy
      formData.value.externalName = ''
      formData.value.externalTrafficPolicy = 'Cluster'
      formData.value.internalTrafficPolicy = 'Cluster'
      if (formData.value.ports.length === 0) {
        addPort()
      }
    }
  }

  const loadServices = async () => {
    loading.value = true
    try {
      const result = await getApplicationServiceListApi({
        workloadId: props.workspace?.id || 0,
        applicationId: props.application.id
      })
      services.value = result || []
    } catch (error) {
      console.error('加载Service失败:', error)
    } finally {
      loading.value = false
    }
  }

  const loadVersions = async () => {
    try {
      const result = await searchVersionApi({
        applicationId: props.application.id
      })
      versions.value = result || []
    } catch (error) {
      console.error('加载版本列表失败:', error)
    }
  }

  const handleVersionModeChange = () => {
    if (versionMode.value === 'all') {
      // 全部版本：IsAllSvc = true, IsAppSvc = false
      formData.value.isAllSvc = true
      formData.value.isAppSvc = false
      selectedVersionId.value = null
      versionLabels.value = []

      // 设置基础 labels（应用级标识）
      formData.value.labels = {}

      // 清空 selector（全部版本不需要 selector）
      formData.value.selector = {}
    } else {
      // 指定版本：IsAppSvc = true, IsAllSvc = false
      formData.value.isAllSvc = false
      formData.value.isAppSvc = true

      // 清空版本相关的 labels，等待选择版本后填充
      formData.value.labels = {}
    }

    // 🔥 关键：确保 ClusterIP 类型不会有 externalTrafficPolicy
    if (formData.value.type === 'ClusterIP') {
      delete (formData.value as any).externalTrafficPolicy
    }
  }

  const handleVersionSelect = async (versionId: number) => {
    if (!versionId) {
      versionLabels.value = []
      // 恢复基础 labels
      formData.value.labels = {}
      formData.value.selector = {}
      return
    }

    await loadVersionLabels(versionId)

    // 将版本 labels 合并到 Service labels 和 selector 中
    const versionLabelMap: Record<string, string> = {}
    versionLabels.value.forEach((label) => {
      versionLabelMap[label.key] = label.value
    })

    // Service 的 labels 应该包含：基础标识 + 版本标识
    formData.value.labels = {
      ...versionLabelMap // 合并版本 labels
    }

    // Selector 用于选择 Pod，使用版本的 labels
    formData.value.selector = { ...versionLabelMap }

    // 🔥 关键：确保 ClusterIP 类型不会有 externalTrafficPolicy
    if (formData.value.type === 'ClusterIP') {
      delete (formData.value as any).externalTrafficPolicy
    }
  }

  const loadVersionLabels = async (versionId: number) => {
    try {
      const result = await getVersionLabelsApi(versionId)
      versionLabels.value = result || []
    } catch (error) {
      console.error('加载版本标签失败:', error)
    }
  }

  const addPort = () => {
    formData.value.ports.push({
      name: '',
      protocol: 'TCP',
      port: 80,
      targetPort: '8080'
    })
  }

  const removePort = (index: number) => {
    formData.value.ports.splice(index, 1)
  }

  // 判断是否为系统标签（不可删除）
  const isSystemLabel = (key: string): boolean => {
    const systemLabels: string[] = []
    // 也包含版本标签（从 versionLabels 中来的）
    const versionLabelKeys = versionLabels.value.map((l) => l.key)
    return systemLabels.includes(key) || versionLabelKeys.includes(key)
  }

  const addLabel = () => {
    if (newLabel.value.key && newLabel.value.value) {
      // 防止添加系统保留的标签键
      if (isSystemLabel(newLabel.value.key)) {
        return
      }
      formData.value.labels = formData.value.labels || {}
      formData.value.labels[newLabel.value.key] = newLabel.value.value
      newLabel.value = { key: '', value: '' }
    }
  }

  const updateLabel = (key: string, value: string) => {
    if (formData.value.labels) {
      formData.value.labels[key] = value
    }
  }

  const removeLabel = (key: string) => {
    // 防止删除系统标签
    if (isSystemLabel(key)) {
      return
    }
    if (formData.value.labels) {
      delete formData.value.labels[key]
    }
  }

  const addAnnotation = () => {
    if (newAnnotation.value.key && newAnnotation.value.value) {
      formData.value.annotations = formData.value.annotations || {}
      formData.value.annotations[newAnnotation.value.key] = newAnnotation.value.value
      newAnnotation.value = { key: '', value: '' }
    }
  }

  const updateAnnotation = (key: string, value: string) => {
    if (formData.value.annotations) {
      formData.value.annotations[key] = value
    }
  }

  const removeAnnotation = (key: string) => {
    if (formData.value.annotations) {
      delete formData.value.annotations[key]
    }
  }

  // 表单转 YAML
  const formToYaml = () => {
    try {
      const service: any = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: formData.value.name || 'my-service',
          labels: formData.value.labels || {},
          annotations: formData.value.annotations || {}
        },
        spec: {
          type: formData.value.type
        }
      }

      // ExternalName 特殊处理
      if (formData.value.type === 'ExternalName') {
        service.spec.externalName = formData.value.externalName
        // ExternalName 不需要 ports、selector、以及大部分其他字段
      } else {
        // 其他类型需要 ports 和 selector
        service.spec.ports = formData.value.ports.map((port) => {
          const portSpec: any = {
            name: port.name,
            protocol: port.protocol,
            port: port.port,
            targetPort: port.targetPort
          }
          // 只有 NodePort 和 LoadBalancer 才能有 nodePort
          if (
            (formData.value.type === 'NodePort' || formData.value.type === 'LoadBalancer') &&
            port.nodePort
          ) {
            portSpec.nodePort = port.nodePort
          }
          if (port.appProtocol) {
            portSpec.appProtocol = port.appProtocol
          }
          return portSpec
        })

        service.spec.selector = formData.value.selector

        // ClusterIP 配置
        if (formData.value.clusterIP) {
          service.spec.clusterIP = formData.value.clusterIP
        }

        // IP 协议族
        if (formData.value.ipFamilyPolicy) {
          service.spec.ipFamilyPolicy = formData.value.ipFamilyPolicy
        }
        if (formData.value.ipFamilies?.length) {
          service.spec.ipFamilies = formData.value.ipFamilies
        }
        if (formData.value.externalIPs?.length) {
          service.spec.externalIPs = formData.value.externalIPs
        }

        // 会话保持
        if (formData.value.sessionAffinity && formData.value.sessionAffinity !== 'None') {
          service.spec.sessionAffinity = formData.value.sessionAffinity
          if (formData.value.sessionAffinityConfig) {
            service.spec.sessionAffinityConfig = formData.value.sessionAffinityConfig
          }
        }

        // 流量策略 - 只有 NodePort 和 LoadBalancer 才能设置 externalTrafficPolicy
        if (formData.value.type === 'NodePort' || formData.value.type === 'LoadBalancer') {
          if (
            formData.value.externalTrafficPolicy &&
            formData.value.externalTrafficPolicy !== 'Cluster'
          ) {
            service.spec.externalTrafficPolicy = formData.value.externalTrafficPolicy
          }
        }

        // internalTrafficPolicy - 所有类型（除了 ExternalName）都可以设置
        if (
          formData.value.internalTrafficPolicy &&
          formData.value.internalTrafficPolicy !== 'Cluster'
        ) {
          service.spec.internalTrafficPolicy = formData.value.internalTrafficPolicy
        }

        // LoadBalancer 特有配置
        if (formData.value.type === 'LoadBalancer') {
          if (formData.value.loadBalancerIP) {
            service.spec.loadBalancerIP = formData.value.loadBalancerIP
          }
          if (formData.value.loadBalancerClass) {
            service.spec.loadBalancerClass = formData.value.loadBalancerClass
          }
          if (formData.value.loadBalancerSourceRanges?.length) {
            service.spec.loadBalancerSourceRanges = formData.value.loadBalancerSourceRanges
          }
          if (formData.value.allocateLoadBalancerNodePorts === false) {
            service.spec.allocateLoadBalancerNodePorts = false
          }
          if (formData.value.healthCheckNodePort) {
            service.spec.healthCheckNodePort = formData.value.healthCheckNodePort
          }
        }

        // publishNotReadyAddresses
        if (formData.value.publishNotReadyAddresses) {
          service.spec.publishNotReadyAddresses = true
        }
      }

      yamlContent.value = yaml.dump(service, { indent: 2, lineWidth: -1 })
    } catch (error) {
      console.error('表单转YAML失败:', error)
    }
  }

  // YAML 转表单
  const yamlToForm = () => {
    try {
      const service = yaml.load(yamlContent.value) as any

      // 验证 kind
      if (!service || service.kind !== 'Service') {
        return false
      }

      // 基本信息
      formData.value.name = service.metadata?.name || ''
      formData.value.type = service.spec?.type || 'ClusterIP'

      // Labels
      formData.value.labels = service.metadata?.labels || {}
      formData.value.annotations = service.metadata?.annotations || {}

      // ExternalName
      if (formData.value.type === 'ExternalName') {
        formData.value.externalName = service.spec?.externalName || ''
        formData.value.ports = []
        // ExternalName 不设置流量策略
        delete (formData.value as any).externalTrafficPolicy
        delete (formData.value as any).internalTrafficPolicy
      } else {
        // 端口
        formData.value.ports = (service.spec?.ports || []).map((port: any) => ({
          name: port.name || '',
          protocol: port.protocol || 'TCP',
          port: port.port,
          targetPort: port.targetPort,
          nodePort: port.nodePort,
          appProtocol: port.appProtocol
        }))

        // 高级配置
        formData.value.clusterIP = service.spec?.clusterIP
        formData.value.ipFamilyPolicy = service.spec?.ipFamilyPolicy
        formData.value.ipFamilies = service.spec?.ipFamilies || ['IPv4']
        formData.value.externalIPs = service.spec?.externalIPs || []
        formData.value.sessionAffinity = service.spec?.sessionAffinity || 'None'
        formData.value.sessionAffinityConfig = service.spec?.sessionAffinityConfig

        // 🔥 关键：根据类型设置流量策略
        if (formData.value.type === 'ClusterIP') {
          // ClusterIP 不能有 externalTrafficPolicy
          delete (formData.value as any).externalTrafficPolicy
          formData.value.internalTrafficPolicy = service.spec?.internalTrafficPolicy || 'Cluster'
        } else if (formData.value.type === 'NodePort' || formData.value.type === 'LoadBalancer') {
          // NodePort 和 LoadBalancer 可以有 externalTrafficPolicy
          formData.value.externalTrafficPolicy = service.spec?.externalTrafficPolicy || 'Cluster'
          formData.value.internalTrafficPolicy = service.spec?.internalTrafficPolicy || 'Cluster'
        }

        // LoadBalancer 特有配置
        formData.value.loadBalancerIP = service.spec?.loadBalancerIP
        formData.value.loadBalancerClass = service.spec?.loadBalancerClass
        formData.value.loadBalancerSourceRanges = service.spec?.loadBalancerSourceRanges || []
        formData.value.allocateLoadBalancerNodePorts =
          service.spec?.allocateLoadBalancerNodePorts !== false
        formData.value.healthCheckNodePort = service.spec?.healthCheckNodePort
        formData.value.publishNotReadyAddresses = service.spec?.publishNotReadyAddresses || false

        // 会话保持超时
        if (service.spec?.sessionAffinityConfig?.clientIP?.timeoutSeconds) {
          sessionAffinityTimeout.value = service.spec.sessionAffinityConfig.clientIP.timeoutSeconds
        }
      }

      // 忽略 selector，提示用户
      if (service.spec?.selector) {
      }

      ElMessage.success('YAML 已转换为表单，请在"版本配置"中设置关联版本')
      return true
    } catch (error) {
      console.error('YAML转表单失败:', error)
      return false
    }
  }

  // 监听编辑模式切换
  watch(editMode, (newMode, oldMode) => {
    if (newMode === 'yaml' && oldMode === 'form') {
      // 表单 → YAML
      formToYaml()
    } else if (newMode === 'form' && oldMode === 'yaml') {
      // YAML → 表单
      yamlToForm()
    }
  })

  const handleCreate = async () => {
    await loadVersions()

    dialogMode.value = 'create'
    editMode.value = 'form'
    dialogVisible.value = true

    // 重置表单 - ClusterIP 类型不设置 externalTrafficPolicy
    formData.value = {
      workloadId: props.workspace?.id || 0,
      applicationId: props.application.id,
      isAppSvc: false,
      isAllSvc: true,
      name: '',
      type: 'ClusterIP',
      ports: [
        {
          name: 'http',
          protocol: 'TCP',
          port: 80,
          targetPort: '8080'
        }
      ],
      selector: {},
      sessionAffinity: 'None',
      // 🔥 关键：ClusterIP 不设置 externalTrafficPolicy
      internalTrafficPolicy: 'Cluster',
      allocateLoadBalancerNodePorts: true,
      publishNotReadyAddresses: false,
      labels: {},
      annotations: {},
      ipFamilies: ['IPv4'],
      ipFamilyPolicy: 'SingleStack',
      externalIPs: [],
      loadBalancerSourceRanges: []
    } as ApplicationServiceRequest

    versionMode.value = 'all'
    selectedVersionId.value = null
    versionLabels.value = []
    sessionAffinityTimeout.value = 10800
    yamlContent.value = ''
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      // 验证 labels（指定版本时必须有 labels，全部版本时后端会补齐）
      if (
        versionMode.value === 'specific' &&
        (!formData.value.labels || Object.keys(formData.value.labels).length === 0)
      ) {
        return
      }

      // 🔥 最重要：在提交前立即清理 ClusterIP 的 externalTrafficPolicy
      if (formData.value.type === 'ClusterIP') {
        delete (formData.value as any).externalTrafficPolicy
      }

      submitting.value = true
      try {
        // 准备提交数据 - 深拷贝避免修改原始数据
        const submitData: ApplicationServiceRequest = JSON.parse(JSON.stringify(formData.value))

        // 设置会话保持配置
        if (submitData.sessionAffinity === 'ClientIP' && sessionAffinityTimeout.value) {
          submitData.sessionAffinityConfig = {
            clientIP: {
              timeoutSeconds: sessionAffinityTimeout.value
            }
          }
        }

        // 🔥 二次清理：根据类型清理不适用的字段（防御性编程）
        if (submitData.type === 'ClusterIP') {
          // ClusterIP 绝对不能有 externalTrafficPolicy
          delete (submitData as any).externalTrafficPolicy
          delete (submitData as any).externalName
          delete (submitData as any).loadBalancerIP
          delete (submitData as any).loadBalancerClass
          delete (submitData as any).loadBalancerSourceRanges
          delete (submitData as any).allocateLoadBalancerNodePorts
          delete (submitData as any).healthCheckNodePort

          // 清理端口中的 nodePort
          submitData.ports?.forEach((port) => {
            delete (port as any).nodePort
          })
        } else if (submitData.type === 'NodePort') {
          // NodePort: 清理 LoadBalancer 特有字段
          delete (submitData as any).externalName
          delete (submitData as any).loadBalancerIP
          delete (submitData as any).loadBalancerClass
          delete (submitData as any).loadBalancerSourceRanges
          delete (submitData as any).allocateLoadBalancerNodePorts
          delete (submitData as any).healthCheckNodePort
        } else if (submitData.type === 'LoadBalancer') {
          // LoadBalancer: 可以有所有字段，只清理 externalName
          delete (submitData as any).externalName
        } else if (submitData.type === 'ExternalName') {
          // ExternalName: 只保留 externalName 和基本元数据
          delete (submitData as any).ports
          delete (submitData as any).selector
          delete (submitData as any).clusterIP
          delete (submitData as any).externalTrafficPolicy
          delete (submitData as any).internalTrafficPolicy
          delete (submitData as any).sessionAffinity
          delete (submitData as any).sessionAffinityConfig
          delete (submitData as any).ipFamilies
          delete (submitData as any).ipFamilyPolicy
          delete (submitData as any).externalIPs
          delete (submitData as any).loadBalancerIP
          delete (submitData as any).loadBalancerClass
          delete (submitData as any).loadBalancerSourceRanges
          delete (submitData as any).allocateLoadBalancerNodePorts
          delete (submitData as any).healthCheckNodePort
          delete (submitData as any).publishNotReadyAddresses
        }

        // 清理默认值（减少 payload）
        if (submitData.sessionAffinity === 'None') {
          delete (submitData as any).sessionAffinity
          delete (submitData as any).sessionAffinityConfig
        }

        // 只有 NodePort 和 LoadBalancer 才清理 externalTrafficPolicy 默认值
        if (
          (submitData.type === 'NodePort' || submitData.type === 'LoadBalancer') &&
          submitData.externalTrafficPolicy === 'Cluster'
        ) {
          delete (submitData as any).externalTrafficPolicy
        }

        if (submitData.internalTrafficPolicy === 'Cluster') {
          delete (submitData as any).internalTrafficPolicy
        }
        if (submitData.allocateLoadBalancerNodePorts === true) {
          delete (submitData as any).allocateLoadBalancerNodePorts
        }
        if (submitData.publishNotReadyAddresses === false) {
          delete (submitData as any).publishNotReadyAddresses
        }
        if (!submitData.externalIPs?.length) {
          delete (submitData as any).externalIPs
        }
        if (!submitData.loadBalancerSourceRanges?.length) {
          delete (submitData as any).loadBalancerSourceRanges
        }

        if (dialogMode.value === 'create') {
          await createApplicationServiceApi(submitData)
          ElMessage.success('创建成功')
        } else {
          await updateApplicationServiceApi(submitData)
          ElMessage.success('更新成功')
        }

        dialogVisible.value = false
        await loadServices()
      } catch (error: any) {
        console.error('❌ 提交失败:', error)
      } finally {
        submitting.value = false
      }
    })
  }

  const handleDialogClose = () => {
    formRef.value?.resetFields()
    editMode.value = 'form'
    yamlContent.value = ''
  }

  const handleRefresh = async () => {
    await loadServices()
  }

  const handleView = (service: ApplicationServiceListResponse) => {
    currentServiceName.value = service.name
    detailVisible.value = true
  }

  const handleEdit = async (service: ApplicationServiceListResponse) => {
    await loadVersions()

    dialogMode.value = 'edit'
    editMode.value = 'form'
    dialogVisible.value = true

    try {
      // 加载 Service 详情
      const detail = await getServiceDetailApi({
        workloadId: props.workspace?.id || 0,
        name: service.name
      })

      // 填充表单数据
      formData.value = {
        workloadId: props.workspace?.id || 0,
        applicationId: props.application.id,
        isAppSvc: service.version ? true : false,
        isAllSvc: !service.version || service.version === 0,
        name: detail.name,
        type: detail.type as any,
        ports: detail.ports || [],
        selector: detail.selector || {},
        sessionAffinity: detail.sessionAffinity || 'None',
        internalTrafficPolicy: 'Cluster',
        allocateLoadBalancerNodePorts: true,
        publishNotReadyAddresses: false,
        labels: detail.labels || {},
        annotations: detail.annotations || {},
        ipFamilies: ['IPv4'],
        ipFamilyPolicy: 'SingleStack',
        externalIPs: detail.externalIPs || [],
        loadBalancerSourceRanges: []
      } as ApplicationServiceRequest

      // 设置类型相关的字段
      if (detail.type === 'NodePort' || detail.type === 'LoadBalancer') {
        formData.value.externalTrafficPolicy = service.externalTrafficPolicy || 'Cluster'
      }

      // 根据是否有版本ID设置版本模式
      if (service.version && service.version > 0) {
        versionMode.value = 'specific'
        selectedVersionId.value = service.version
        await handleVersionSelect(service.version)
      } else {
        versionMode.value = 'all'
        selectedVersionId.value = null
        versionLabels.value = []
      }
    } catch (error) {
      console.error('加载 Service 详情失败:', error)
      dialogVisible.value = false
    }
  }

  const handleViewEndpoints = (service: ApplicationServiceListResponse) => {
    currentServiceName.value = service.name
    endpointsVisible.value = true
  }

  const handleDownloadYaml = async (service: ApplicationServiceListResponse) => {
    try {
      downloadLoadingMap.value[service.name] = true
      const yaml = await getServiceYamlApi({
        workloadId: props.workspace?.id || 0,
        name: service.name
      })

      const blob = new Blob([yaml], { type: 'text/yaml' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${service.name}.yaml`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElMessage.success('下载成功')
    } catch (error) {
      console.error('下载YAML失败:', error)
    } finally {
      downloadLoadingMap.value[service.name] = false
    }
  }

  const handleDelete = async (service: ApplicationServiceListResponse) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除 Service "${service.name}" 吗？此操作不可恢复！`,
        '删除确认',
        {
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消'
        }
      )

      deleteLoadingMap.value[service.name] = true
      await deleteServiceApi({
        workloadId: props.workspace?.id || 0,
        name: service.name
      })

      ElMessage.success('删除成功')
      await loadServices()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      deleteLoadingMap.value[service.name] = false
    }
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal > 0) {
        loadServices()
      }
    }
  )

  // 🔥 监听 Service 类型变化，确保 ClusterIP 不会有 externalTrafficPolicy
  watch(
    () => formData.value.type,
    (newType) => {
      if (newType === 'ClusterIP') {
        delete (formData.value as any).externalTrafficPolicy
      }
    }
  )

  onMounted(() => {
    loadServices()
  })
</script>

<style lang="scss" scoped>
  .service-management-modern {
    // 表格单元格
    padding-top: 10px;
    padding-bottom: 15px;
    margin: 2px;
    .service-name-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .info-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 13px;
      color: #606266;
    }

    .ports-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #606266;
    }

    .icon-muted {
      color: #909399;
      flex-shrink: 0;
      padding-right: 10px;
    }

    .icon-primary {
      color: #409eff;
      flex-shrink: 0;
      padding-right: 10px;
    }

    .text-placeholder {
      color: #909399;
    }
  }

  // 对话框样式
  .service-dialog {
    :deep(.el-dialog__body) {
      padding: 0 !important;
      margin: 0 !important;
    }

    :deep(.el-dialog__header) {
      padding: 16px 20px !important;
      margin: 0 !important;
    }

    :deep(.el-dialog__footer) {
      padding: 12px 20px !important;
      border-top: 1px solid #e4e7ed;
      margin: 0 !important;
    }

    .mode-switcher {
      padding: 12px 20px;
      border-bottom: 1px solid #e4e7ed;
      background: #fafbfc;
      display: flex;
      align-items: center;
      gap: 12px;

      :deep(.el-radio-button__inner) {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      :deep(.el-alert) {
        flex: 1;
        margin: 0;
      }
    }

    .dialog-content {
      max-height: calc(100vh - 280px);
      overflow-y: auto;
      padding: 16px 20px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 3px;
      }
    }

    .yaml-content {
      padding: 16px 20px;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
    }
  }

  // 表单样式
  .form-section {
    margin-bottom: 16px;
    padding: 16px;
    background: #fafbfc;
    border-radius: 6px;
    border: 1px solid #e4e7ed;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #409eff;
    }
  }

  .version-option {
    display: flex;
    align-items: center;
    gap: 10px;

    .version-name {
      color: #606266;
      font-size: 13px;
    }
  }

  .selector-preview {
    padding: 12px;
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    min-height: 36px;

    .preview-header {
      margin-bottom: 10px;

      .preview-title {
        font-size: 12px;
        color: #606266;
        font-weight: 500;
      }
    }

    .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    // 单个标签的情况
    > .el-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
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
    margin-bottom: 16px;
    padding: 16px;
    background: #fafbfc;
    border-radius: 6px;
    border: 1px solid #e4e7ed;

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
  :deep(.el-table__empty-block) {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.el-table__empty-text) {
    width: 100%;
  }
  :deep(.el-table__empty-block) {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.el-table__empty-text) {
    width: 100%;
  }
  // RadioButton 样式优化
  :deep(.el-radio-button) {
    .el-radio-button__inner {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }
</style>

<style lang="scss">
  /* 强制覆盖 Dialog body 的 padding */
  .service-dialog.el-dialog .el-dialog__body {
    padding: 0 !important;
    margin: 0 !important;
  }
</style>
