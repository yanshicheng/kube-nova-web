<script setup lang="ts">
  import { ref, reactive, computed, onMounted, onActivated, onBeforeUnmount } from 'vue'
  import { useRouter, onBeforeRouteLeave } from 'vue-router'
  import { ElMessage, ElNotification } from 'element-plus'
  import {
    ArrowLeft,
    ArrowRight,
    Server,
    Shield,
    Info,
    CheckCircle,
    FileText,
    CloudUpload,
    AlertCircle,
    Sparkles,
    Globe,
    MapPin,
    Building2,
    Settings,
    Layers,
    Network
  } from 'lucide-vue-next'
  import { addClusterApi, testClusterConnectivityApi } from '@/api/manager/cluster'
  import type { AddClusterRequest, TestClusterConnectivityRequest } from '@/api/manager/cluster'
  import {
    environmentOptions,
    clusterTypeOptions,
    providerOptions,
    authTypeOptions
  } from '../constants'

  const router = useRouter()

  // 步骤控制
  const currentStep = ref(0)
  const clusterSource = ref<'existing' | 'new' | ''>('')

  // 表单引用
  const basicFormRef = ref()
  const authFormRef = ref()

  // 加载状态
  const submitLoading = ref(false)
  const testLoading = ref(false)
  const backLoading = ref(false)
  const nextLoading = ref(false)
  const prevLoading = ref(false)

  // 步骤配置
  const steps = computed(() => {
    const baseSteps = [
      {
        title: '选择集群类型',
        description: '选择添加现有集群或创建新集群'
      }
    ]

    if (clusterSource.value === 'existing') {
      return [
        ...baseSteps,
        {
          title: '基础信息',
          description: '配置集群基本信息'
        },
        {
          title: '认证配置',
          description: '设置集群访问认证'
        },
        {
          title: '完成',
          description: '确认并创建集群'
        }
      ]
    }

    return baseSteps
  })

  // 表单数据
  const formData = reactive<AddClusterRequest>({
    name: '',
    avatar: '',
    description: '',
    clusterType: 'standard',
    environment: 'development',
    region: '',
    zone: '',
    datacenter: '',
    provider: 'self-hosted',
    isManaged: 0,
    nodeLb: '',
    masterLb: '',
    ingressDomain: '',
    authType: 'kubeconfig',
    apiServerHost: '',
    kubeFile: '',
    token: '',
    caCert: '',
    caFile: '',
    clientCert: '',
    certFile: '',
    clientKey: '',
    keyFile: '',
    insecureSkipVerify: 0
  })

  // IP/域名验证函数
  const validateAddressList = (rule: any, value: string, callback: any) => {
    if (!value || value.trim() === '') {
      callback()
      return
    }

    // IPv4 正则
    const ipv4Regex =
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

    // IPv6 正则（支持完整格式和压缩格式）
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|::)$/

    // 域名正则
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

    // 验证单个地址
    const isValidAddress = (addr: string): boolean => {
      return ipv4Regex.test(addr) || ipv6Regex.test(addr) || domainRegex.test(addr)
    }

    // 分割并验证
    const addresses = value
      .split(',')
      .map((addr) => addr.trim())
      .filter((addr) => addr)

    if (addresses.length === 0) {
      callback()
      return
    }

    const invalidAddresses = addresses.filter((addr) => !isValidAddress(addr))

    if (invalidAddresses.length > 0) {
      callback(
        new Error(
          `无效的地址格式: ${invalidAddresses.slice(0, 3).join(', ')}${invalidAddresses.length > 3 ? ' 等' : ''}`
        )
      )
    } else {
      callback()
    }
  }

  // 域名验证函数
  const validateDomainList = (rule: any, value: string, callback: any) => {
    if (!value || value.trim() === '') {
      callback()
      return
    }

    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    const domains = value
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d)

    if (domains.length === 0) {
      callback()
      return
    }

    const invalidDomains = domains.filter((d) => !domainRegex.test(d))

    if (invalidDomains.length > 0) {
      callback(
        new Error(
          `无效的域名格式: ${invalidDomains.slice(0, 3).join(', ')}${invalidDomains.length > 3 ? ' 等' : ''}`
        )
      )
    } else {
      callback()
    }
  }

  // 基础信息表单验证规则
  const basicRules = {
    name: [
      { required: true, message: '请输入集群名称', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    clusterType: [{ required: true, message: '请选择集群类型', trigger: 'change' }],
    environment: [{ required: true, message: '请选择环境类型', trigger: 'change' }],
    provider: [{ required: true, message: '请选择云服务商', trigger: 'change' }],
    nodeLb: [{ validator: validateAddressList, trigger: 'blur' }],
    masterLb: [{ validator: validateAddressList, trigger: 'blur' }],
    ingressDomain: [{ validator: validateDomainList, trigger: 'blur' }]
  }

  // 认证表单验证规则
  const authRules = {
    authType: [{ required: true, message: '请选择认证类型', trigger: 'change' }],
    apiServerHost: [
      {
        required: true,
        message: '请输入 API Server 地址',
        trigger: 'blur',
        validator: (rule: any, value: string, callback: any) => {
          if (formData.authType === 'kubeconfig' || formData.authType === 'incluster') {
            callback()
          } else if (!value) {
            callback(new Error('请输入 API Server 地址'))
          } else {
            callback()
          }
        }
      }
    ],
    kubeFile: [
      {
        required: true,
        message: '请输入 KubeConfig 内容',
        trigger: 'blur',
        validator: (rule: any, value: string, callback: any) => {
          if (formData.authType !== 'kubeconfig') {
            callback()
          } else if (!value) {
            callback(new Error('请输入 KubeConfig 内容'))
          } else {
            callback()
          }
        }
      }
    ],
    token: [
      {
        required: true,
        message: '请输入 Token',
        trigger: 'blur',
        validator: (rule: any, value: string, callback: any) => {
          if (formData.authType !== 'token') {
            callback()
          } else if (!value) {
            callback(new Error('请输入 Token'))
          } else {
            callback()
          }
        }
      }
    ]
  }

  // 选择集群源
  const selectClusterSource = (source: 'existing' | 'new') => {
    clusterSource.value = source
    if (source === 'existing') {
      currentStep.value = 1
    } else {
      ElMessage.info('新建集群功能正在开发中...')
    }
  }

  // 步骤点击跳转
  const handleStepClick = (index: number) => {
    // 步骤0不允许返回（选择类型）
    if (index === 0) {
      return
    }

    // 只允许跳转到已经访问过的步骤或当前步骤
    if (index < currentStep.value) {
      currentStep.value = index
    } else if (index === currentStep.value) {
      // 已在当前步骤，不做操作
      return
    }
  }

  // 上一步
  const handlePrev = async () => {
    prevLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      currentStep.value--
    } finally {
      prevLoading.value = false
    }
  }

  // 下一步
  const handleNext = async () => {
    nextLoading.value = true
    try {
      if (currentStep.value === 1) {
        // 验证基础信息表单
        try {
          await basicFormRef.value?.validate()
        } catch (error) {
          return
        }
      } else if (currentStep.value === 2) {
        // 验证认证配置表单
        try {
          await authFormRef.value?.validate()
        } catch (error) {
          return
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200))
      currentStep.value++
    } finally {
      nextLoading.value = false
    }
  }

  // 测试连通性
  const handleTestConnection = async () => {
    // 先验证认证表单
    try {
      await authFormRef.value?.validate()
    } catch (error) {
      return
    }

    testLoading.value = true
    try {
      const testParams: TestClusterConnectivityRequest = {
        authType: formData.authType as any,
        apiServerHost: formData.apiServerHost,
        kubeFile: formData.kubeFile,
        token: formData.token,
        caCert: formData.caCert,
        caFile: formData.caFile,
        clientCert: formData.clientCert,
        certFile: formData.certFile,
        clientKey: formData.clientKey,
        keyFile: formData.keyFile,
        insecureSkipVerify: formData.insecureSkipVerify
      }
      await testClusterConnectivityApi(testParams)
      ElMessage.success('连接测试成功！集群可正常访问')
    } catch (error: any) {
    } finally {
      testLoading.value = false
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    // 最终验证所有表单
    try {
      await basicFormRef.value?.validate()
      await authFormRef.value?.validate()
    } catch (error) {
      return
    }

    submitLoading.value = true
    try {
      await addClusterApi(formData)
      ElNotification({
        title: '创建成功',
        message: `集群 "${formData.name}" 已成功添加`,
        type: 'success',
        duration: 3000
      })

      router.replace('/cluster/list')
    } catch (error: any) {
    } finally {
      submitLoading.value = false
    }
  }

  // 返回上一页
  const goBack = async () => {
    backLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      router.replace('/cluster/list')
    } finally {
      backLoading.value = false
    }
  }

  // 计算属性：动态显示认证字段
  const showKubeconfigFields = computed(() => formData.authType === 'kubeconfig')
  const showTokenFields = computed(() => formData.authType === 'token')
  const showCertificateFields = computed(() => formData.authType === 'certificate')
  const showInclusterFields = computed(() => formData.authType === 'incluster')
  const showApiServerField = computed(
    () => formData.authType === 'token' || formData.authType === 'certificate'
  )

  // 重置表单数据
  const resetFormData = () => {
    // 重置步骤到初始状态
    currentStep.value = 0
    clusterSource.value = ''

    // 重置所有加载状态
    submitLoading.value = false
    testLoading.value = false
    backLoading.value = false
    nextLoading.value = false
    prevLoading.value = false

    // 重置表单数据到默认值
    Object.assign(formData, {
      name: '',
      avatar: '',
      description: '',
      clusterType: 'standard',
      environment: 'development',
      region: '',
      zone: '',
      datacenter: '',
      provider: 'self-hosted',
      isManaged: 0,
      nodeLb: '',
      masterLb: '',
      ingressDomain: '',
      authType: 'kubeconfig',
      apiServerHost: '',
      kubeFile: '',
      token: '',
      caCert: '',
      caFile: '',
      clientCert: '',
      certFile: '',
      clientKey: '',
      keyFile: '',
      insecureSkipVerify: 0
    })

    // 清除表单验证状态（使用nextTick确保DOM更新后再清除）
    setTimeout(() => {
      basicFormRef.value?.clearValidate()
      authFormRef.value?.clearValidate()
    }, 100)
  }

  // 页面挂载时重置数据
  onMounted(() => {
    resetFormData()
  })

  // Keep-alive 激活时也重置数据
  onActivated(() => {
    resetFormData()
  })

  // 路由离开前也清空数据，确保下次进入是干净的状态
  onBeforeRouteLeave((to, from, next) => {
    resetFormData()
    next()
  })
</script>

<template>
  <div class="add-cluster-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <el-button text @click="goBack" class="back-btn" :loading="backLoading">
          <ArrowLeft />
          返回
        </el-button>
        <div class="header-title">
          <h1>添加集群</h1>
          <p>将现有 Kubernetes 集群添加到管理平台</p>
        </div>
      </div>
    </div>

    <!-- 步骤条 -->
    <div v-if="clusterSource" class="steps-container">
      <el-steps :active="currentStep" align-center>
        <el-step
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
          :description="step.description"
          :class="{ 'is-clickable': index < currentStep }"
          @click="handleStepClick(index)"
        />
      </el-steps>
    </div>

    <!-- 内容区域 -->
    <div class="content-container">
      <!-- 步骤 0: 选择集群类型 -->
      <div v-if="currentStep === 0" class="step-content">
        <div class="cluster-source-selection">
          <h2>请选择集群来源</h2>
          <div class="selection-cards">
            <div class="selection-card" @click="selectClusterSource('existing')">
              <div class="card-icon">
                <Server />
              </div>
              <h3>添加现有集群</h3>
              <p>将已存在的 Kubernetes 集群接入平台进行统一管理</p>
              <div class="card-features">
                <div class="feature-item">
                  <CheckCircle />
                  <span>支持多种认证方式</span>
                </div>
                <div class="feature-item">
                  <CheckCircle />
                  <span>快速接入</span>
                </div>
                <div class="feature-item">
                  <CheckCircle />
                  <span>统一管理</span>
                </div>
              </div>
              <el-button type="primary">选择此项</el-button>
            </div>

            <div class="selection-card new-cluster" @click="selectClusterSource('new')">
              <div class="card-icon">
                <Sparkles />
              </div>
              <h3>创建新集群</h3>
              <p>在云平台或本地环境创建全新的 Kubernetes 集群</p>
              <div class="card-features">
                <div class="feature-item">
                  <CheckCircle />
                  <span>一键部署</span>
                </div>
                <div class="feature-item">
                  <CheckCircle />
                  <span>自动配置</span>
                </div>
                <div class="feature-item">
                  <CheckCircle />
                  <span>开箱即用</span>
                </div>
              </div>
              <el-tag type="warning" class="dev-tag">开发中</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤 1: 基础信息 -->
      <div v-if="currentStep === 1 && clusterSource === 'existing'" class="step-content">
        <el-form ref="basicFormRef" :model="formData" :rules="basicRules" label-width="0">
          <!-- 核心信息卡片 -->
          <div class="info-card primary-card">
            <div class="card-header">
              <div class="header-icon">
                <Info />
              </div>
              <div class="header-text">
                <h3>集群标识</h3>
                <p>设置集群的唯一标识和显示信息</p>
              </div>
            </div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-field full-width">
                  <label class="field-label required">集群名称</label>
                  <el-form-item prop="name">
                    <el-input
                      v-model="formData.name"
                      placeholder="请输入集群名称，如：prod-k8s-cluster"
                      size="large"
                      clearable
                    >
                      <template #prefix>
                        <Server />
                      </template>
                    </el-input>
                  </el-form-item>
                  <span class="field-hint"
                    >集群的唯一标识名称，建议使用有意义的命名，如：环境-用途-序号</span
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-field full-width">
                  <label class="field-label">集群描述</label>
                  <el-form-item prop="description">
                    <el-input
                      v-model="formData.description"
                      type="textarea"
                      :rows="3"
                      placeholder="请描述集群的用途、特点、注意事项等信息..."
                      maxlength="500"
                      show-word-limit
                    />
                  </el-form-item>
                  <span class="field-hint">添加详细描述，方便团队成员了解集群用途</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 集群类型选择 -->
          <div class="info-card">
            <div class="card-header">
              <div class="header-icon gradient-icon">
                <Layers />
              </div>
              <div class="header-text">
                <h3>集群类型</h3>
                <p>选择最适合您业务场景的集群类型</p>
              </div>
            </div>
            <div class="card-body">
              <el-form-item prop="clusterType">
                <div class="cluster-type-grid">
                  <div
                    v-for="option in clusterTypeOptions"
                    :key="option.value"
                    class="cluster-type-card"
                    :class="{ active: formData.clusterType === option.value }"
                    @click="formData.clusterType = option.value"
                  >
                    <el-badge v-if="option.badge" :value="option.badge" :type="option.badgeType">
                      <div class="type-icon">
                        <component :is="option.icon" />
                      </div>
                    </el-badge>
                    <div v-else class="type-icon">
                      <component :is="option.icon" />
                    </div>
                    <div class="type-info">
                      <h4>{{ option.label }}</h4>
                      <p>{{ option.desc }}</p>
                    </div>
                    <div class="type-check">
                      <CheckCircle v-if="formData.clusterType === option.value" />
                    </div>
                  </div>
                </div>
              </el-form-item>
            </div>
          </div>

          <!-- 部署配置 -->
          <div class="info-card">
            <div class="card-header">
              <div class="header-icon gradient-icon-2">
                <Settings />
              </div>
              <div class="header-text">
                <h3>部署配置</h3>
                <p>配置集群的运行环境和基础设施信息</p>
              </div>
            </div>
            <div class="card-body">
              <!-- 环境和提供商 -->
              <div class="config-section">
                <div class="section-label">运行环境</div>
                <el-form-item prop="environment">
                  <div class="env-selector">
                    <div
                      v-for="env in environmentOptions"
                      :key="env.value"
                      class="env-item"
                      :class="{ active: formData.environment === env.value }"
                      @click="formData.environment = env.value"
                    >
                      <div class="env-icon" :style="{ background: env.color }">
                        <component :is="env.icon" />
                      </div>
                      <span>{{ env.label }}</span>
                    </div>
                  </div>
                </el-form-item>
              </div>

              <!-- 云服务商 -->
              <div class="config-section">
                <div class="section-label">基础设施提供商</div>
                <el-form-item prop="provider">
                  <div class="provider-selector">
                    <div
                      v-for="provider in providerOptions"
                      :key="provider.value"
                      class="provider-item"
                      :class="{ active: formData.provider === provider.value }"
                      @click="formData.provider = provider.value"
                    >
                      <div class="provider-logo">{{ provider.logo }}</div>
                      <span>{{ provider.label }}</span>
                    </div>
                  </div>
                </el-form-item>
              </div>

              <!-- 位置信息 -->
              <div class="config-section">
                <div class="section-label">位置信息（可选）</div>
                <div class="location-grid">
                  <div class="location-item">
                    <Globe />
                    <el-input v-model="formData.region" placeholder="地域，如：cn-beijing" />
                  </div>
                  <div class="location-item">
                    <MapPin />
                    <el-input v-model="formData.zone" placeholder="可用区，如：zone-a" />
                  </div>
                  <div class="location-item">
                    <Building2 />
                    <el-input v-model="formData.datacenter" placeholder="数据中心" />
                  </div>
                </div>
              </div>

              <!-- 负载配置 -->
              <div class="config-section">
                <div class="section-label">
                  <Network style="width: 16px; height: 16px; margin-right: 8px" />
                  负载配置（可选）
                </div>
                <div class="network-grid">
                  <div class="network-item full-width">
                    <label>Ingress 域名</label>
                    <el-form-item prop="ingressDomain">
                      <el-input
                        v-model="formData.ingressDomain"
                        placeholder="如：example.com，多个用逗号分隔"
                      >
                        <template #prefix>
                          <Globe />
                        </template>
                      </el-input>
                    </el-form-item>
                    <span class="field-hint"
                      >配置可用的域名后缀，用于 Ingress 路由，多个域名用逗号分隔</span
                    >
                  </div>
                  <div class="network-item">
                    <label>Node 负载均衡</label>
                    <el-form-item prop="nodeLb">
                      <el-input
                        v-model="formData.nodeLb"
                        placeholder="如：192.168.1.100 或 node-lb.example.com，多个用逗号分隔"
                      />
                    </el-form-item>
                    <span class="field-hint">支持 IPv4、IPv6 或域名，多个地址用逗号分隔</span>
                  </div>
                  <div class="network-item">
                    <label>Master 负载均衡</label>
                    <el-form-item prop="masterLb">
                      <el-input
                        v-model="formData.masterLb"
                        placeholder="如：192.168.1.101 或 master-lb.example.com，多个用逗号分隔"
                      />
                    </el-form-item>
                    <span class="field-hint">支持 IPv4、IPv6 或域名，多个地址用逗号分隔</span>
                  </div>
                </div>
              </div>

              <!-- 托管选项 -->
              <div class="config-section">
                <div class="managed-option">
                  <div class="option-info">
                    <label>托管集群</label>
                    <span class="option-desc">是否为云厂商托管集群（如 EKS、AKS、GKE）</span>
                  </div>
                  <el-switch
                    v-model="formData.isManaged"
                    :active-value="1"
                    :inactive-value="0"
                    active-text="是"
                    inactive-text="否"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-form>
      </div>

      <!-- 步骤 2: 认证配置 -->
      <div v-if="currentStep === 2 && clusterSource === 'existing'" class="step-content">
        <el-form ref="authFormRef" :model="formData" :rules="authRules" label-width="120px">
          <div class="form-section">
            <div class="section-title">
              <Shield />
              <span>认证配置</span>
            </div>

            <el-form-item label="认证类型" prop="authType">
              <div class="auth-type-cards">
                <div
                  v-for="option in authTypeOptions"
                  :key="option.value"
                  class="auth-type-card"
                  :class="{ active: formData.authType === option.value }"
                  @click="formData.authType = option.value"
                >
                  <div class="card-ribbon" :class="`ribbon-${option.value}`"></div>
                  <div class="card-icon-wrapper">
                    <div class="card-icon" :class="`icon-${option.value}`">
                      <component :is="option.icon" />
                    </div>
                  </div>
                  <div class="card-content">
                    <div class="card-title">{{ option.label }}</div>
                    <div class="card-desc">{{ option.desc }}</div>
                  </div>
                  <div class="card-check">
                    <CheckCircle v-if="formData.authType === option.value" />
                  </div>
                </div>
              </div>
            </el-form-item>

            <!-- API Server 地址 -->
            <el-form-item v-if="showApiServerField" label="API Server" prop="apiServerHost">
              <el-input
                v-model="formData.apiServerHost"
                placeholder="https://kubernetes.example.com:6443"
              />
            </el-form-item>

            <!-- KubeConfig 模式 -->
            <div v-if="showKubeconfigFields">
              <el-form-item label="KubeConfig" prop="kubeFile" required>
                <el-input
                  v-model="formData.kubeFile"
                  type="textarea"
                  :rows="10"
                  placeholder="请粘贴完整的 KubeConfig 文件内容"
                />
              </el-form-item>
            </div>

            <!-- Token 模式 -->
            <div v-if="showTokenFields">
              <el-form-item label="Bearer Token" prop="token" required>
                <el-input
                  v-model="formData.token"
                  placeholder="请输入 Bearer Token"
                  show-password
                />
              </el-form-item>
              <el-form-item label="CA 证书" prop="caCert">
                <el-input
                  v-model="formData.caCert"
                  type="textarea"
                  :rows="6"
                  placeholder="CA 证书内容（PEM 格式，可选）"
                />
              </el-form-item>
              <el-form-item label="CA 文件路径">
                <el-input v-model="formData.caFile" placeholder="CA 证书文件路径（可选）" />
              </el-form-item>
            </div>

            <!-- 证书模式 -->
            <div v-if="showCertificateFields">
              <el-form-item label="客户端证书">
                <el-input
                  v-model="formData.clientCert"
                  type="textarea"
                  :rows="6"
                  placeholder="客户端证书内容（PEM 格式）"
                />
              </el-form-item>
              <el-form-item label="证书文件路径">
                <el-input v-model="formData.certFile" placeholder="客户端证书文件路径（可选）" />
              </el-form-item>
              <el-form-item label="客户端密钥">
                <el-input
                  v-model="formData.clientKey"
                  type="textarea"
                  :rows="6"
                  placeholder="客户端密钥内容（PEM 格式）"
                />
              </el-form-item>
              <el-form-item label="密钥文件路径">
                <el-input v-model="formData.keyFile" placeholder="客户端密钥文件路径（可选）" />
              </el-form-item>
              <el-form-item label="CA 证书">
                <el-input
                  v-model="formData.caCert"
                  type="textarea"
                  :rows="6"
                  placeholder="CA 证书内容（PEM 格式）"
                />
              </el-form-item>
              <el-form-item label="CA 文件路径">
                <el-input v-model="formData.caFile" placeholder="CA 证书文件路径（可选）" />
              </el-form-item>
            </div>

            <!-- 集群内部模式提示 -->
            <el-alert
              v-if="showInclusterFields"
              title="集群内部认证模式"
              type="info"
              show-icon
              :closable="false"
            >
              <div>
                <p>此模式适用于管理平台部署在 Kubernetes 集群内部的场景。</p>
                <p>系统将自动使用集群内部的 ServiceAccount 进行认证，无需提供额外的认证信息。</p>
              </div>
            </el-alert>

            <!-- 跳过 TLS 验证 -->
            <el-form-item v-if="!showInclusterFields">
              <el-checkbox v-model="formData.insecureSkipVerify" :true-value="1" :false-value="0">
                跳过 TLS 证书验证
              </el-checkbox>
              <div class="form-tip">
                <AlertCircle />
                不推荐在生产环境使用此选项
              </div>
            </el-form-item>

            <!-- 测试连接 -->
            <el-form-item>
              <el-button @click="handleTestConnection" :loading="testLoading">
                <CloudUpload v-if="!testLoading" />
                {{ testLoading ? '测试中...' : '测试连通性' }}
              </el-button>
              <span class="test-tip">建议在提交前测试集群连通性</span>
            </el-form-item>
          </div>
        </el-form>
      </div>

      <!-- 步骤 3: 确认信息 -->
      <div v-if="currentStep === 3 && clusterSource === 'existing'" class="step-content">
        <div class="confirm-section">
          <div class="section-title">
            <CheckCircle />
            <span>确认信息</span>
          </div>

          <div class="confirm-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="集群名称">{{ formData.name }}</el-descriptions-item>
              <el-descriptions-item label="环境类型">
                {{ environmentOptions.find((e) => e.value === formData.environment)?.label }}
              </el-descriptions-item>
              <el-descriptions-item label="集群类型">
                {{ clusterTypeOptions.find((c) => c.value === formData.clusterType)?.label }}
              </el-descriptions-item>
              <el-descriptions-item label="云服务商">
                {{ providerOptions.find((p) => p.value === formData.provider)?.label }}
              </el-descriptions-item>
              <el-descriptions-item label="认证类型">
                {{ authTypeOptions.find((a) => a.value === formData.authType)?.label }}
              </el-descriptions-item>
              <el-descriptions-item label="托管集群">
                {{ formData.isManaged === 1 ? '是' : '否' }}
              </el-descriptions-item>
              <el-descriptions-item label="地域" :span="2">
                {{ formData.region || '未设置' }} / {{ formData.zone || '未设置' }}
              </el-descriptions-item>
              <el-descriptions-item label="Ingress域名" :span="2">
                {{ formData.ingressDomain || '未设置' }}
              </el-descriptions-item>
              <el-descriptions-item label="Node LB" :span="2">
                {{ formData.nodeLb || '未设置' }}
              </el-descriptions-item>
              <el-descriptions-item label="Master LB" :span="2">
                {{ formData.masterLb || '未设置' }}
              </el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">
                {{ formData.description || '暂无描述' }}
              </el-descriptions-item>
            </el-descriptions>

            <el-alert
              title="请确认以上信息无误"
              type="info"
              description="集群添加后，基本信息可以修改，但认证信息需要重新验证"
              show-icon
              :closable="false"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="clusterSource === 'existing'" class="footer-actions">
      <el-button v-if="currentStep > 0" @click="handlePrev" :loading="prevLoading">
        <ArrowLeft v-if="!prevLoading" />
        上一步
      </el-button>
      <el-button
        v-if="currentStep < steps.length - 1"
        type="primary"
        @click="handleNext"
        :loading="nextLoading"
      >
        下一步
        <ArrowRight v-if="!nextLoading" />
      </el-button>
      <el-button
        v-if="currentStep === steps.length - 1"
        type="primary"
        @click="handleSubmit"
        :loading="submitLoading"
      >
        {{ submitLoading ? '创建中...' : '确认创建' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .add-cluster-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);

    .page-header {
      background: white;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      backdrop-filter: blur(10px);

      .header-content {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 24px;

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6366f1;
          font-weight: 500;
          transition: all 0.3s ease;

          &:hover:not(:disabled) {
            color: #5a67d8;
            transform: translateX(-2px);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          svg {
            width: 18px;
            height: 18px;
          }
        }

        .header-title {
          h1 {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 4px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          p {
            color: #64748b;
            margin: 0;
          }
        }
      }
    }

    .steps-container {
      background: white;
      padding: 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);

      :deep(.el-step__title) {
        font-size: 14px;
      }

      :deep(.el-step__description) {
        font-size: 12px;
      }

      // 步骤可点击样式
      :deep(.el-step.is-clickable) {
        cursor: pointer;

        .el-step__head,
        .el-step__title,
        .el-step__description {
          cursor: pointer;
        }

        &:hover {
          .el-step__head {
            .el-step__icon {
              transform: scale(1.1);
              transition: transform 0.3s ease;
            }
          }

          .el-step__title {
            color: #667eea;
          }
        }
      }

      // 当前步骤不允许点击
      :deep(.el-step.is-process) {
        cursor: default;

        .el-step__head,
        .el-step__title,
        .el-step__description {
          cursor: default;
        }
      }
    }

    .content-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      min-height: calc(100vh - 300px);

      .step-content {
        animation: fadeInUp 0.5s ease;
      }

      // 表单项错误提示增强
      :deep(.el-form-item) {
        margin-bottom: 20px;

        &.is-error {
          .el-input__wrapper {
            border-color: #f56c6c;
            box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.1);
          }

          .el-textarea__inner {
            border-color: #f56c6c;
            box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.1);
          }
        }

        .el-form-item__error {
          font-size: 12px;
          line-height: 1.5;
          padding-top: 6px;
          font-weight: 500;
        }

        .el-input__wrapper {
          box-shadow: 0 0 0 1px #e2e8f0 inset;
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 0 0 1px #cbd5e1 inset;
          }

          &.is-focus {
            box-shadow: 0 0 0 2px #818cf8 inset;
          }
        }

        .el-textarea__inner {
          box-shadow: 0 0 0 1px #e2e8f0 inset;
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 0 0 1px #cbd5e1 inset;
          }

          &:focus {
            box-shadow: 0 0 0 2px #818cf8 inset;
          }
        }
      }

      .field-hint {
        display: block;
        margin-top: 6px;
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.4;
      }

      // 集群源选择
      .cluster-source-selection {
        max-width: 1000px;
        margin: 0 auto;
        text-align: center;

        h2 {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 40px;
          color: #1e293b;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .selection-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;

          .selection-card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 3px solid transparent;
            position: relative;
            overflow: hidden;

            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 5px;
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              transform: scaleX(0);
              transition: transform 0.4s ease;
            }

            &::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: radial-gradient(
                circle at top right,
                rgba(102, 126, 234, 0.05),
                transparent
              );
              opacity: 0;
              transition: opacity 0.4s ease;
            }

            &:hover {
              transform: translateY(-10px);
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
              border-color: #e0e7ff;

              &::before {
                transform: scaleX(1);
              }

              &::after {
                opacity: 1;
              }

              .card-icon {
                transform: scale(1.1) rotate(5deg);
              }
            }

            &.new-cluster {
              position: relative;

              .dev-tag {
                position: absolute;
                top: 24px;
                right: 24px;
                font-weight: 600;
              }
            }

            .card-icon {
              width: 90px;
              height: 90px;
              margin: 0 auto 28px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
              transition: all 0.4s ease;
              position: relative;
              z-index: 1;

              svg {
                width: 45px;
                height: 45px;
              }
            }

            h3 {
              font-size: 22px;
              font-weight: 700;
              margin-bottom: 14px;
              color: #1e293b;
              position: relative;
              z-index: 1;
            }

            p {
              color: #64748b;
              margin-bottom: 28px;
              line-height: 1.7;
              font-size: 14px;
              position: relative;
              z-index: 1;
            }

            .card-features {
              margin-bottom: 28px;
              text-align: left;
              position: relative;
              z-index: 1;

              .feature-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                color: #475569;
                font-size: 14px;
                font-weight: 500;

                svg {
                  width: 18px;
                  height: 18px;
                  color: #10b981;
                  flex-shrink: 0;
                }
              }
            }

            .el-button {
              width: 100%;
              height: 44px;
              font-size: 15px;
              font-weight: 600;
              position: relative;
              z-index: 1;
            }
          }
        }
      }

      // 信息卡片
      .info-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 16px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        &.primary-card {
          border: 2px solid #e0e7ff;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;

          .header-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;

            &.gradient-icon {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }

            &.gradient-icon-2 {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }

            &.gradient-icon-3 {
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            }

            svg {
              width: 20px;
              height: 20px;
            }
          }

          .header-text {
            flex: 1;

            h3 {
              font-size: 16px;
              font-weight: 600;
              margin: 0 0 2px 0;
              color: #1e293b;
            }

            p {
              font-size: 13px;
              color: #64748b;
              margin: 0;
            }
          }
        }

        .card-body {
          .form-row {
            margin-bottom: 20px;

            &:last-child {
              margin-bottom: 0;
            }

            .form-field {
              &.full-width {
                width: 100%;
              }

              .field-label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #334155;
                margin-bottom: 10px;

                &.required::after {
                  content: '*';
                  color: #f56c6c;
                  margin-left: 4px;
                }
              }

              :deep(.el-input) {
                .el-input__wrapper {
                  border-radius: 8px;
                  box-shadow: 0 0 0 1px #e2e8f0 inset;
                  transition: all 0.3s ease;

                  &:hover {
                    box-shadow: 0 0 0 1px #cbd5e1 inset;
                  }

                  &.is-focus {
                    box-shadow: 0 0 0 2px #818cf8 inset;
                  }
                }
              }
            }
          }

          // 集群类型网格 - 优化为3列紧凑布局
          .cluster-type-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;

            .cluster-type-card {
              position: relative;
              padding: 16px;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 12px;
              background: white;

              &:hover {
                border-color: #cbd5e1;
                background: #f8fafc;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              }

              &.active {
                border-color: #818cf8;
                background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
                box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);

                .type-icon {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
              }

              .type-icon {
                width: 44px;
                height: 44px;
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: all 0.3s ease;

                svg {
                  width: 22px;
                  height: 22px;
                }
              }

              .type-info {
                flex: 1;
                min-width: 0;

                h4 {
                  font-size: 14px;
                  font-weight: 600;
                  margin: 0 0 3px 0;
                  color: #1e293b;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }

                p {
                  font-size: 12px;
                  color: #64748b;
                  margin: 0;
                  line-height: 1.4;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                }
              }

              .type-check {
                width: 22px;
                height: 22px;
                flex-shrink: 0;

                svg {
                  width: 22px;
                  height: 22px;
                  color: #10b981;
                  filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3));
                }
              }
            }
          }

          // 配置部分
          .config-section {
            margin-bottom: 20px;

            &:last-child {
              margin-bottom: 0;
            }

            .section-label {
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              padding-bottom: 8px;
              border-bottom: 2px solid #f1f5f9;
            }

            // 环境选择器 - 强制横向排列
            .env-selector {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;

              .env-item {
                flex: 1;
                min-width: 140px;
                padding: 12px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                justify-content: center;

                &:hover {
                  border-color: #cbd5e1;
                  background: #f8fafc;
                  transform: translateY(-2px);
                }

                &.active {
                  border-color: #818cf8;
                  background: #f0f4ff;
                  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
                }

                .env-icon {
                  width: 32px;
                  height: 32px;
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  flex-shrink: 0;

                  svg {
                    width: 16px;
                    height: 16px;
                  }
                }

                span {
                  font-size: 13px;
                  font-weight: 600;
                  color: #334155;
                }
              }
            }

            // 云服务商选择器 - 强制横向排列
            .provider-selector {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
              align-items: stretch;

              .provider-item {
                flex: 0 0 auto;
                min-width: 90px;
                padding: 12px 10px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 6px;

                &:hover {
                  border-color: #cbd5e1;
                  background: #f8fafc;
                  transform: translateY(-2px);
                }

                &.active {
                  border-color: #818cf8;
                  background: #f0f4ff;
                  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
                }

                .provider-logo {
                  font-size: 24px;
                  line-height: 1;
                }

                span {
                  font-size: 12px;
                  font-weight: 600;
                  color: #334155;
                  text-align: center;
                  white-space: nowrap;
                }
              }
            }

            // 位置网格
            .location-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;

              .location-item {
                display: flex;
                align-items: center;
                gap: 10px;

                svg {
                  width: 18px;
                  height: 18px;
                  color: #64748b;
                  flex-shrink: 0;
                }

                :deep(.el-input__wrapper) {
                  border-radius: 8px;
                }
              }
            }

            // 网络网格
            .network-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;

              .network-item {
                &.full-width {
                  grid-column: 1 / -1;
                }

                label {
                  display: block;
                  font-size: 13px;
                  font-weight: 600;
                  color: #475569;
                  margin-bottom: 8px;
                }

                :deep(.el-input__wrapper) {
                  border-radius: 8px;
                }
              }
            }

            // 托管选项
            .managed-option {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px 20px;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 10px;
              border: 2px solid #e2e8f0;
              transition: all 0.3s ease;

              &:hover {
                border-color: #cbd5e1;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
              }

              .option-info {
                flex: 1;

                label {
                  display: block;
                  font-size: 14px;
                  font-weight: 600;
                  color: #334155;
                  margin-bottom: 4px;
                }

                .option-desc {
                  font-size: 12px;
                  color: #64748b;
                  line-height: 1.5;
                }
              }

              :deep(.el-switch) {
                --el-switch-on-color: #667eea;
              }
            }
          }
        }
      }

      // 认证配置样式
      .form-section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;

          svg {
            width: 20px;
            height: 20px;
            color: #667eea;
          }
        }

        .auth-type-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;

          .auth-type-card {
            position: relative;
            padding: 18px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            overflow: hidden;
            background: white;

            &:hover {
              border-color: #cbd5e1;
              transform: translateY(-3px);
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
            }

            &.active {
              border-color: #818cf8;
              background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
              box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);

              .card-ribbon {
                transform: scaleX(1);
              }

              .card-icon {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
              }
            }

            .card-ribbon {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              transform: scaleX(0);
              transition: transform 0.3s ease;
            }

            .card-icon-wrapper {
              margin-bottom: 14px;

              .card-icon {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #667eea;
                transition: all 0.3s ease;

                svg {
                  width: 24px;
                  height: 24px;
                }
              }
            }

            .card-content {
              .card-title {
                font-size: 15px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 6px;
              }

              .card-desc {
                font-size: 12px;
                color: #64748b;
                line-height: 1.5;
              }
            }

            .card-check {
              position: absolute;
              top: 16px;
              right: 16px;

              svg {
                width: 22px;
                height: 22px;
                color: #10b981;
                filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3));
              }
            }
          }
        }

        .form-tip {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          font-size: 13px;
          color: #f59e0b;

          svg {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
          }
        }

        .test-tip {
          margin-left: 12px;
          font-size: 13px;
          color: #64748b;
        }
      }

      // 确认信息样式
      .confirm-section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;

          svg {
            width: 20px;
            height: 20px;
            color: #10b981;
          }
        }

        .confirm-content {
          :deep(.el-descriptions) {
            margin-bottom: 20px;

            .el-descriptions__label {
              font-weight: 600;
              color: #475569;
              font-size: 13px;
            }

            .el-descriptions__content {
              color: #1e293b;
              font-size: 13px;
            }
          }
        }
      }
    }

    .footer-actions {
      background: white;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding: 20px 24px;
      display: flex;
      justify-content: center;
      gap: 12px;
      position: sticky;
      bottom: 0;
      backdrop-filter: blur(10px);
      box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);

      .el-button {
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  // 响应式适配
  @media (max-width: 1200px) {
    .add-cluster-page {
      .content-container {
        .info-card {
          .card-body {
            .cluster-type-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .config-section {
              .location-grid {
                grid-template-columns: 1fr;
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    .add-cluster-page {
      .content-container {
        .cluster-source-selection {
          .selection-cards {
            grid-template-columns: 1fr;
          }
        }

        .info-card {
          .card-body {
            .cluster-type-grid {
              grid-template-columns: 1fr;
            }

            .config-section {
              .env-selector {
                flex-direction: column;

                .env-item {
                  min-width: 100%;
                }
              }

              .provider-selector {
                justify-content: center;
              }

              .network-grid {
                grid-template-columns: 1fr;
              }
            }
          }
        }

        .form-section {
          .auth-type-cards {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  }
</style>
