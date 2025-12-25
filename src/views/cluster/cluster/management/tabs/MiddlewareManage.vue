<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
  import {
    ElMessage,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElSelect,
    ElOption,
    ElSwitch,
    ElButton,
    ElTooltip
  } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    Activity,
    AlertTriangle,
    Shield,
    Settings,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
    RefreshCw,
    Link,
    Cloud,
    Globe
  } from 'lucide-vue-next'

  import {
    addClusterAppApi,
    getClusterAppDetailApi,
    validateClusterAppApi,
    getClusterAppListApi,
    type ClusterAppDetail,
    type AddClusterAppRequest
  } from '@/api/manager'

  import {
    middlewareApplications,
    authTypeOptions,
    protocolOptions,
    appTypeMap,
    getAppTypeLabel,
    type AppItem,
    type AppCategory
  } from './middleware-config'

  interface Props {
    clusterDetail?: any
    clusterId: number
    clusterUuid: string
    isActive?: boolean
  }

  const props = defineProps<Props>()

  // 状态
  const configDialogVisible = ref(false)
  const currentApp = ref<string>('')
  const currentAppItem = ref<AppItem | null>(null)
  const saveLoading = ref(false)
  const testLoading = ref(false)
  const cardTestLoading = ref<{ [key: string]: boolean }>({})
  const formRef = ref<FormInstance>()
  const appListLoading = ref(false)
  const configuredApps = ref<ClusterAppDetail[]>([])
  const applications = ref<AppCategory[]>(middlewareApplications)

  // 表单
  const configForm = reactive<AddClusterAppRequest & { id?: number }>({
    clusterUuid: props.clusterUuid || '',
    appName: '',
    appCode: '',
    appType: 1,
    appUrl: '',
    port: undefined,
    protocol: 'http',
    authEnabled: 0,
    authType: 'none',
    username: '',
    password: '',
    token: '',
    accessKey: '',
    accessSecret: '',
    tlsEnabled: 0,
    caFile: '',
    caKey: '',
    caCert: '',
    clientCert: '',
    clientKey: '',
    insecureSkipVerify: 0,
    isDefault: 0,
    updatedBy: ''
  })

  // 校验规则
  const formRules = ref<FormRules>({
    appUrl: [
      { required: true, message: '请输入访问地址', trigger: 'blur' },
      {
        validator: (_rule: any, value: string, callback: any) => {
          if (!value) {
            callback()
            return
          }
          if (/^(https?|grpc):\/\//i.test(value)) {
            callback(new Error('访问地址不需要包含协议（如 http:// 或 https://）'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    port: [
      { required: true, message: '请输入服务端口', trigger: 'blur' },
      {
        validator: (_rule: any, value: any, callback: any) => {
          if (!value) {
            callback(new Error('请输入服务端口'))
          } else if (value < 1 || value > 65535) {
            callback(new Error('端口范围为 1-65535'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  })

  // 计算属性
  const showBasicAuth = computed(
    () => configForm.authEnabled === 1 && configForm.authType === 'basic'
  )
  const showTokenAuth = computed(
    () => configForm.authEnabled === 1 && configForm.authType === 'token'
  )
  const showApiKeyAuth = computed(
    () => configForm.authEnabled === 1 && configForm.authType === 'apikey'
  )
  const showCertAuth = computed(
    () => configForm.authEnabled === 1 && configForm.authType === 'certificate'
  )
  const showTlsConfig = computed(
    () => configForm.authEnabled === 1 && configForm.authType === 'apikey'
  )
  const showInsecureOption = computed(
    () => configForm.authEnabled === 1 && configForm.authType !== 'none'
  )

  // 获取状态信息
  const getStatusInfo = (item: AppItem) => {
    if (!item.isConfigured) {
      return { icon: AlertTriangle, color: '#94a3b8', label: '未配置' }
    }
    if (item.isHealthy) {
      return { icon: CheckCircle, color: '#10b981', label: '正常' }
    }
    return { icon: XCircle, color: '#ef4444', label: '异常' }
  }

  // 获取已配置应用的详细信息
  const getConfiguredAppInfo = (appItem: AppItem) => {
    const configuredApp = configuredApps.value.find((app) => app.appCode === appItem.code)
    if (configuredApp) {
      return {
        port: configuredApp.port,
        protocol: configuredApp.protocol,
        appUrl: configuredApp.appUrl,
        fullUrl: `${configuredApp.protocol}://${configuredApp.appUrl}:${configuredApp.port}`
      }
    }
    return {
      port: appItem.defaultPort,
      protocol: 'http',
      appUrl: '',
      fullUrl: ''
    }
  }

  // 跳转到应用地址
  const openAppUrl = (appItem: AppItem, event: Event) => {
    event.stopPropagation()
    const info = getConfiguredAppInfo(appItem)
    if (info.fullUrl && info.appUrl) {
      window.open(info.fullUrl, '_blank')
    } else {
      ElMessage.warning('应用地址未配置')
    }
  }

  // 加载应用列表
  const loadAppList = async () => {
    if (!props.clusterUuid) return

    appListLoading.value = true
    try {
      const response = await getClusterAppListApi(props.clusterUuid)
      configuredApps.value = response || []

      // 更新应用状态
      applications.value.forEach((category) => {
        category.items.forEach((item) => {
          const configuredApp = configuredApps.value.find((app) => app.appCode === item.code)
          if (configuredApp) {
            item.isConfigured = true
            item.isHealthy = configuredApp.status === 1
            item.id = configuredApp.id
          } else {
            item.isConfigured = false
            item.isHealthy = false
            item.id = undefined
          }
        })
      })
    } catch (error) {
      console.error('Failed to load app list:', error)
    } finally {
      appListLoading.value = false
    }
  }

  // 加载应用配置详情
  const loadAppConfig = async (appId: number) => {
    try {
      const appDetail = await getClusterAppDetailApi(appId)
      Object.assign(configForm, {
        id: appDetail.id,
        clusterUuid: appDetail.clusterUuid,
        appName: appDetail.appName,
        appCode: appDetail.appCode,
        appType: appDetail.appType,
        appUrl: appDetail.appUrl,
        port: appDetail.port,
        protocol: appDetail.protocol,
        authEnabled: appDetail.authEnabled,
        authType: appDetail.authType,
        username: appDetail.username,
        password: appDetail.password,
        token: appDetail.token,
        accessKey: appDetail.accessKey,
        accessSecret: appDetail.accessSecret,
        tlsEnabled: appDetail.tlsEnabled,
        caFile: appDetail.caFile,
        caKey: appDetail.caKey,
        caCert: appDetail.caCert,
        clientCert: appDetail.clientCert,
        clientKey: appDetail.clientKey,
        insecureSkipVerify: appDetail.insecureSkipVerify,
        isDefault: appDetail.isDefault
      })
    } catch (error) {
      console.error('Failed to load app config:', error)
    }
  }

  // 重置表单
  const resetForm = (appItem: AppItem) => {
    Object.assign(configForm, {
      id: undefined,
      clusterUuid: props.clusterUuid || '',
      appName: `${appItem.name}-${props.clusterDetail?.name || '默认'}`,
      appCode: appItem.code,
      appType: appTypeMap[appItem.type] || 1,
      appUrl: '',
      port: appItem.defaultPort,
      protocol: 'http',
      authEnabled: 0,
      authType: 'none',
      username: '',
      password: '',
      token: '',
      accessKey: '',
      accessSecret: '',
      tlsEnabled: 0,
      caFile: '',
      caKey: '',
      caCert: '',
      clientCert: '',
      clientKey: '',
      insecureSkipVerify: 0,
      isDefault: 0,
      updatedBy: ''
    })
  }

  // 打开配置对话框
  const openConfigDialog = async (category: AppCategory, appItem: AppItem) => {
    currentApp.value = appItem.name
    currentAppItem.value = appItem

    resetForm(appItem)

    if (appItem.isConfigured && appItem.id) {
      await loadAppConfig(appItem.id)
    }

    resetFormRules()
    nextTick(() => {
      formRef.value?.clearValidate()
    })

    configDialogVisible.value = true
  }

  // 重置表单规则
  const resetFormRules = () => {
    formRules.value = {
      appUrl: [
        { required: true, message: '请输入访问地址', trigger: 'blur' },
        {
          validator: (_rule: any, value: string, callback: any) => {
            if (!value) {
              callback()
              return
            }
            if (/^(https?|grpc):\/\//i.test(value)) {
              callback(new Error('访问地址不需要包含协议（如 http:// 或 https://）'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      port: [
        { required: true, message: '请输入服务端口', trigger: 'blur' },
        {
          validator: (_rule: any, value: any, callback: any) => {
            if (!value) {
              callback(new Error('请输入服务端口'))
            } else if (value < 1 || value > 65535) {
              callback(new Error('端口范围为 1-65535'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }
  }

  // 更新认证规则
  const updateAuthRules = () => {
    resetFormRules()

    if (configForm.authEnabled === 1) {
      switch (configForm.authType) {
        case 'basic':
          formRules.value.username = [{ required: true, message: '请输入用户名', trigger: 'blur' }]
          formRules.value.password = [{ required: true, message: '请输入密码', trigger: 'blur' }]
          break
        case 'token':
          formRules.value.token = [
            { required: true, message: '请输入Bearer Token', trigger: 'blur' }
          ]
          break
        case 'apikey':
          formRules.value.accessKey = [
            { required: true, message: '请输入Access Key', trigger: 'blur' }
          ]
          formRules.value.accessSecret = [
            { required: true, message: '请输入Access Secret', trigger: 'blur' }
          ]
          if (configForm.tlsEnabled === 1) {
            formRules.value.caFile = [
              { required: true, message: '请输入CA证书内容', trigger: 'blur' }
            ]
            formRules.value.caKey = [
              { required: true, message: '请输入CA Key内容', trigger: 'blur' }
            ]
          }
          break
        case 'certificate':
          formRules.value.caCert = [{ required: true, message: '请输入CA证书', trigger: 'blur' }]
          formRules.value.clientCert = [
            { required: true, message: '请输入客户端证书', trigger: 'blur' }
          ]
          formRules.value.clientKey = [
            { required: true, message: '请输入客户端密钥', trigger: 'blur' }
          ]
          break
      }
    }
  }

  // 保存配置
  const saveConfig = async () => {
    if (!formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return
    } catch {
      return
    }

    saveLoading.value = true
    try {
      const { id, ...requestData } = configForm
      await addClusterAppApi(requestData)
      ElMessage.success('配置保存成功')
      configDialogVisible.value = false
      await loadAppList()
    } finally {
      saveLoading.value = false
    }
  }

  // 测试连接（对话框内）
  const testConnection = async () => {
    if (!formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return
    } catch {
      return
    }

    testLoading.value = true
    try {
      const { id, ...requestData } = configForm
      await addClusterAppApi(requestData)
      await loadAppList()
      const savedApp = configuredApps.value.find((app) => app.appCode === configForm.appCode)

      if (!savedApp) {
        ElMessage.error('保存配置失败，请重试')
        return
      }

      await validateClusterAppApi(savedApp.id)
      ElMessage.success('连接测试成功')
      await loadAppList()

      if (currentAppItem.value) {
        currentAppItem.value.isHealthy = true
      }
    } finally {
      testLoading.value = false
    }
  }

  // 卡片上测试连接
  const testCardConnection = async (appItem: AppItem, event: Event) => {
    event.stopPropagation()

    if (!appItem.isConfigured || !appItem.id) return

    cardTestLoading.value[appItem.code] = true
    try {
      await validateClusterAppApi(appItem.id)
      ElMessage.success('连接测试成功')
      await loadAppList()
    } finally {
      cardTestLoading.value[appItem.code] = false
    }
  }

  // 刷新状态
  const refreshAppStatus = async () => {
    await loadAppList()
    ElMessage.success('刷新成功')
  }

  // 认证开关变更
  const onAuthEnabledChange = () => {
    if (configForm.authEnabled === 0) {
      configForm.authType = 'none'
      configForm.username = ''
      configForm.password = ''
      configForm.token = ''
      configForm.accessKey = ''
      configForm.accessSecret = ''
      configForm.caCert = ''
      configForm.clientCert = ''
      configForm.clientKey = ''
      configForm.caFile = ''
      configForm.caKey = ''
      configForm.insecureSkipVerify = 0
    }
    updateAuthRules()
    nextTick(() => formRef.value?.clearValidate())
  }

  // 认证类型变更
  const onAuthTypeChange = () => {
    configForm.username = ''
    configForm.password = ''
    configForm.token = ''
    configForm.accessKey = ''
    configForm.accessSecret = ''
    configForm.caCert = ''
    configForm.clientCert = ''
    configForm.clientKey = ''
    configForm.caFile = ''
    configForm.caKey = ''

    if (configForm.authType !== 'apikey') {
      configForm.tlsEnabled = 0
    }
    updateAuthRules()
    nextTick(() => formRef.value?.clearValidate())
  }

  // TLS开关变更
  const onTlsEnabledChange = () => {
    if (configForm.tlsEnabled === 0) {
      configForm.caFile = ''
      configForm.caKey = ''
    }
    updateAuthRules()
    nextTick(() => formRef.value?.clearValidate())
  }

  // 监听
  watch(
    () => props.clusterUuid,
    (newVal) => {
      if (newVal) {
        configForm.clusterUuid = newVal
        if (props.isActive) loadAppList()
      }
    },
    { immediate: true }
  )

  watch(
    () => props.isActive,
    (newVal) => {
      if (newVal && props.clusterUuid) loadAppList()
    }
  )

  onMounted(() => {
    if (props.clusterUuid && props.isActive) loadAppList()
  })
</script>

<template>
  <div class="middleware-panel" v-loading="appListLoading">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-left">
        <div class="header-icon"><Activity /></div>
        <div class="header-text">
          <h2>中间件管理</h2>
          <p>监控、日志、链路追踪和告警系统配置</p>
        </div>
      </div>
      <el-button size="small" @click="refreshAppStatus"> <RefreshCw />刷新 </el-button>
    </div>

    <!-- 应用列表 -->
    <div class="apps-container">
      <div v-for="category in applications" :key="category.category" class="category-section">
        <!-- 分类头部 -->
        <div class="category-header">
          <div class="category-info">
            <div class="category-icon" :style="{ background: category.gradient }">
              <img
                v-if="category.categoryIconSrc"
                :src="category.categoryIconSrc"
                :alt="category.category"
              />
              <component v-else :is="category.categoryIcon" />
            </div>
            <span class="category-name">{{ category.category }}</span>
            <span class="category-count">{{ category.items.length }} 个组件</span>
          </div>
          <div class="category-stats">
            <span class="stat healthy">
              <i></i>{{ category.items.filter((i) => i.isHealthy).length }} 运行中
            </span>
          </div>
        </div>

        <!-- 应用卡片 -->
        <div class="apps-grid">
          <div
            v-for="app in category.items"
            :key="app.code"
            class="app-card"
            :class="{ healthy: app.isHealthy, error: app.isConfigured && !app.isHealthy }"
            @click="openConfigDialog(category, app)"
          >
            <!-- 状态条 -->
            <div
              class="status-bar"
              :class="{ healthy: app.isHealthy, error: app.isConfigured && !app.isHealthy }"
            ></div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="card-top">
                <div class="app-icon" :style="{ background: `${category.color}15` }">
                  <img v-if="app.iconSrc" :src="app.iconSrc" :alt="app.name" />
                  <component v-else :is="app.icon" :style="{ color: category.color }" />
                </div>
                <div class="app-info">
                  <h4>{{ app.name }}</h4>
                  <p>{{ app.description }}</p>
                </div>
              </div>

              <div class="card-footer">
                <div class="meta">
                  <!-- 点击跳转到真实地址 -->
                  <el-tooltip
                    :content="
                      app.isConfigured && getConfiguredAppInfo(app).appUrl
                        ? `点击访问: ${getConfiguredAppInfo(app).fullUrl}`
                        : '未配置访问地址'
                    "
                    placement="top"
                  >
                    <span
                      class="port"
                      :class="{ clickable: app.isConfigured && getConfiguredAppInfo(app).appUrl }"
                      @click="openAppUrl(app, $event)"
                    >
                      <Globe />
                      {{ app.isConfigured ? getConfiguredAppInfo(app).port : app.defaultPort }}
                    </span>
                  </el-tooltip>
                  <span class="status" :style="{ color: getStatusInfo(app).color }">
                    <component :is="getStatusInfo(app).icon" />
                    {{ getStatusInfo(app).label }}
                  </span>
                </div>
                <div class="actions">
                  <el-tooltip v-if="app.isConfigured" content="测试连接" placement="top">
                    <button
                      class="test-btn"
                      @click="testCardConnection(app, $event)"
                      :disabled="cardTestLoading[app.code]"
                    >
                      <RefreshCw v-if="cardTestLoading[app.code]" class="spinning" />
                      <Link v-else />
                    </button>
                  </el-tooltip>
                  <span class="config-btn">
                    {{ app.isConfigured ? '修改' : '配置' }}
                    <ChevronRight />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置对话框 -->
    <el-dialog
      v-model="configDialogVisible"
      :title="`配置 ${currentApp}`"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
      class="config-dialog"
    >
      <el-form
        ref="formRef"
        :model="configForm"
        :rules="formRules"
        label-width="90px"
        size="default"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title"><Settings /> 基本信息</div>
          <el-form-item label="应用名称">
            <el-input v-model="configForm.appName" disabled />
          </el-form-item>
          <div class="form-row">
            <el-form-item label="应用标识">
              <el-input v-model="configForm.appCode" disabled />
            </el-form-item>
            <el-form-item label="应用类型">
              <el-input :value="getAppTypeLabel(configForm.appType)" disabled />
            </el-form-item>
          </div>
        </div>

        <!-- 连接信息 -->
        <div class="form-section">
          <div class="section-title"><Cloud /> 连接信息</div>
          <el-form-item label="访问地址" prop="appUrl">
            <el-input
              v-model="configForm.appUrl"
              placeholder="如: 192.168.1.100 或 prometheus.example.com"
            >
              <template #prepend>
                <el-select v-model="configForm.protocol" style="width: 90px">
                  <el-option
                    v-for="opt in protocolOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </template>
            </el-input>
            <div class="form-tip">不需要填写协议前缀，通过左侧下拉选择协议</div>
          </el-form-item>
          <el-form-item label="服务端口" prop="port">
            <el-input
              v-model.number="configForm.port"
              type="number"
              placeholder="如: 9090"
              style="width: 200px"
            />
          </el-form-item>
        </div>

        <!-- 认证配置 -->
        <div class="form-section">
          <div class="section-title"><Shield /> 认证配置</div>
          <el-form-item label="启用认证">
            <el-switch
              v-model="configForm.authEnabled"
              :active-value="1"
              :inactive-value="0"
              @change="onAuthEnabledChange"
            />
            <span class="switch-label">{{
              configForm.authEnabled === 1 ? '已启用' : '已禁用'
            }}</span>
          </el-form-item>

          <template v-if="configForm.authEnabled === 1">
            <el-form-item label="认证类型">
              <el-select
                v-model="configForm.authType"
                style="width: 100%"
                @change="onAuthTypeChange"
                popper-class="auth-type-popper"
              >
                <el-option
                  v-for="opt in authTypeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                >
                  <div class="auth-option-item">
                    <component :is="opt.icon" class="auth-icon" :style="{ color: opt.color }" />
                    <span class="auth-label">{{ opt.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- 基础认证 -->
            <template v-if="showBasicAuth">
              <div class="form-row">
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="configForm.username" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="密码" prop="password">
                  <el-input
                    v-model="configForm.password"
                    type="password"
                    show-password
                    placeholder="请输入密码"
                  />
                </el-form-item>
              </div>
            </template>

            <!-- Token认证 -->
            <template v-if="showTokenAuth">
              <el-form-item label="Token" prop="token">
                <el-input
                  v-model="configForm.token"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入 Bearer Token"
                />
              </el-form-item>
            </template>

            <!-- API Key认证 -->
            <template v-if="showApiKeyAuth">
              <div class="form-row">
                <el-form-item label="Access Key" prop="accessKey">
                  <el-input v-model="configForm.accessKey" placeholder="请输入 Access Key" />
                </el-form-item>
                <el-form-item label="Secret" prop="accessSecret">
                  <el-input
                    v-model="configForm.accessSecret"
                    type="password"
                    show-password
                    placeholder="请输入 Access Secret"
                  />
                </el-form-item>
              </div>
            </template>

            <!-- 证书认证 -->
            <template v-if="showCertAuth">
              <el-form-item label="CA证书" prop="caCert">
                <el-input
                  v-model="configForm.caCert"
                  type="textarea"
                  :rows="2"
                  placeholder="CA证书（PEM格式）"
                />
              </el-form-item>
              <el-form-item label="客户端证书" prop="clientCert">
                <el-input
                  v-model="configForm.clientCert"
                  type="textarea"
                  :rows="2"
                  placeholder="客户端证书（PEM格式）"
                />
              </el-form-item>
              <el-form-item label="客户端密钥" prop="clientKey">
                <el-input
                  v-model="configForm.clientKey"
                  type="textarea"
                  :rows="2"
                  placeholder="客户端密钥（PEM格式）"
                />
              </el-form-item>
            </template>

            <!-- TLS配置（仅apikey） -->
            <template v-if="showTlsConfig">
              <el-form-item label="TLS">
                <el-switch
                  v-model="configForm.tlsEnabled"
                  :active-value="1"
                  :inactive-value="0"
                  @change="onTlsEnabledChange"
                />
                <span class="switch-label">{{
                  configForm.tlsEnabled === 1 ? '已启用' : '已禁用'
                }}</span>
              </el-form-item>
              <template v-if="configForm.tlsEnabled === 1">
                <el-form-item label="CA证书" prop="caFile">
                  <el-input
                    v-model="configForm.caFile"
                    type="textarea"
                    :rows="2"
                    placeholder="CA证书（PEM格式）"
                  />
                </el-form-item>
                <el-form-item label="CA Key" prop="caKey">
                  <el-input
                    v-model="configForm.caKey"
                    type="textarea"
                    :rows="2"
                    placeholder="CA Key（PEM格式）"
                  />
                </el-form-item>
              </template>
            </template>

            <!-- 跳过证书验证 -->
            <template v-if="showInsecureOption">
              <el-form-item label="跳过验证">
                <el-switch
                  v-model="configForm.insecureSkipVerify"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="warning-tip"><AlertCircle /> 生产环境不推荐</span>
              </el-form-item>
            </template>
          </template>
        </div>

        <!-- 其他设置 -->
        <div class="form-section">
          <div class="section-title"><Settings /> 其他设置</div>
          <el-form-item label="设为默认">
            <el-switch v-model="configForm.isDefault" :active-value="1" :inactive-value="0" />
            <span class="switch-label">设为该类型应用的默认实例</span>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="testConnection" :loading="testLoading">
            <Link v-if="!testLoading" /> 测试连接
          </el-button>
          <div class="right-btns">
            <el-button @click="configDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveConfig" :loading="saveLoading">保存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
  .middleware-panel {
    // 头部
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      margin-bottom: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          svg {
            width: 18px;
            height: 18px;
          }
        }

        .header-text {
          h2 {
            font-size: 16px;
            font-weight: 600;
            color: white;
            margin: 0 0 2px 0;
          }
          p {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            margin: 0;
          }
        }
      }

      :deep(.el-button) {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        svg {
          width: 14px;
          height: 14px;
          margin-right: 4px;
        }
        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }

    // 分类区域
    .category-section {
      margin-bottom: 20px;
      &:last-child {
        margin-bottom: 0;
      }

      .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: #f8fafc;
        border-radius: 8px;
        margin-bottom: 10px;

        .category-info {
          display: flex;
          align-items: center;
          gap: 10px;

          .category-icon {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            svg {
              width: 14px;
              height: 14px;
            }
            img {
              width: 16px;
              height: 16px;
              object-fit: contain;
            }
          }

          .category-name {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          .category-count {
            font-size: 12px;
            color: #94a3b8;
          }
        }

        .category-stats {
          .stat {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #64748b;
            i {
              width: 6px;
              height: 6px;
              border-radius: 50%;
            }
            &.healthy i {
              background: #10b981;
            }
          }
        }
      }

      .apps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 10px;

        .app-card {
          position: relative;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;

          &:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.12);
          }

          &.healthy {
            border-color: #d1fae5;
          }
          &.error {
            border-color: #fecaca;
          }

          .status-bar {
            height: 3px;
            background: #e5e7eb;
            &.healthy {
              background: linear-gradient(90deg, #10b981, #34d399);
            }
            &.error {
              background: linear-gradient(90deg, #ef4444, #f87171);
            }
          }

          .card-content {
            padding: 12px;

            .card-top {
              display: flex;
              gap: 10px;
              margin-bottom: 10px;

              .app-icon {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                svg {
                  width: 18px;
                  height: 18px;
                }
                img {
                  width: 20px;
                  height: 20px;
                  object-fit: contain;
                }
              }

              .app-info {
                flex: 1;
                min-width: 0;
                h4 {
                  font-size: 13px;
                  font-weight: 600;
                  color: #1e293b;
                  margin: 0 0 2px 0;
                }
                p {
                  font-size: 11px;
                  color: #64748b;
                  margin: 0;
                  line-height: 1.4;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                }
              }
            }

            .card-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-top: 10px;
              border-top: 1px solid #f3f4f6;

              .meta {
                display: flex;
                gap: 12px;

                .port,
                .status {
                  display: flex;
                  align-items: center;
                  gap: 3px;
                  font-size: 11px;
                  color: #64748b;
                  svg {
                    width: 12px;
                    height: 12px;
                  }
                }

                .port {
                  &.clickable {
                    cursor: pointer;
                    padding: 2px 6px;
                    border-radius: 4px;
                    transition: all 0.2s;

                    &:hover {
                      background: #667eea;
                      color: white;

                      svg {
                        color: white;
                      }
                    }
                  }
                }
              }

              .actions {
                display: flex;
                align-items: center;
                gap: 8px;

                .test-btn {
                  width: 24px;
                  height: 24px;
                  border: none;
                  background: #f3f4f6;
                  border-radius: 4px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  color: #64748b;
                  transition: all 0.2s;

                  &:hover {
                    background: #10b981;
                    color: white;
                  }
                  &:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                  }
                  svg {
                    width: 12px;
                    height: 12px;
                  }
                  .spinning {
                    animation: spin 1s linear infinite;
                  }
                }

                .config-btn {
                  display: flex;
                  align-items: center;
                  gap: 2px;
                  font-size: 11px;
                  color: #667eea;
                  font-weight: 500;
                  svg {
                    width: 12px;
                    height: 12px;
                  }
                }
              }
            }
          }
        }
      }
    }

    // 对话框
    :deep(.config-dialog) {
      .el-dialog {
        border-radius: 10px;
      }
      .el-dialog__header {
        padding: 14px 18px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 0;
        .el-dialog__title {
          color: white;
          font-size: 15px;
          font-weight: 600;
        }
        .el-dialog__headerbtn .el-dialog__close {
          color: white;
        }
      }
      .el-dialog__body {
        padding: 16px;
        max-height: 60vh;
        overflow-y: auto;
      }
      .el-dialog__footer {
        padding: 12px 16px;
        border-top: 1px solid #f1f5f9;
      }
    }

    .form-section {
      background: #f9fafb;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
        svg {
          width: 14px;
          height: 14px;
          color: #667eea;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .form-tip {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 4px;
      }

      :deep(.el-form-item) {
        margin-bottom: 12px;
        &:last-child {
          margin-bottom: 0;
        }
        .el-form-item__label {
          font-size: 12px;
          color: #4b5563;
        }
      }

      .switch-label {
        margin-left: 8px;
        font-size: 12px;
        color: #6b7280;
      }

      .warning-tip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
        padding: 2px 6px;
        background: #fef3c7;
        border-radius: 4px;
        font-size: 11px;
        color: #92400e;
        svg {
          width: 11px;
          height: 11px;
          color: #f59e0b;
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .el-button {
        svg {
          width: 14px;
          height: 14px;
          margin-right: 4px;
        }
      }

      .right-btns {
        display: flex;
        gap: 8px;
      }
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>

<!-- 全局样式：认证类型下拉框选项 -->
<style lang="scss">
  .auth-type-popper {
    .el-select-dropdown__item {
      padding: 8px 12px;

      .auth-option-item {
        display: flex;
        align-items: center;
        gap: 10px;

        .auth-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .auth-label {
          font-size: 14px;
          color: #374151;
        }
      }
    }
  }
</style>
