<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Save, RefreshCw, Shield, AlertCircle, KeyRound, Lock } from 'lucide-vue-next'
  import {
    getClusterAuthInfoApi,
    updateClusterAuthInfoApi,
    testClusterConnectivityApi,
    type ClusterAuthInfo,
    type UpdateClusterAuthInfoRequest
  } from '@/api/manager/cluster'
  import { authTypeOptions } from '../../constants'

  interface Props {
    clusterDetail?: any
    clusterId: number
    isActive?: boolean
  }

  const props = defineProps<Props>()

  const loading = ref(false)
  const saveLoading = ref(false)
  const testLoading = ref(false)
  const authInfo = ref<ClusterAuthInfo>()
  const isFirstLoad = ref(true)
  const isEditMode = ref(false) // 是否处于编辑模式
  const hasExistingAuth = ref(false) // 是否已有认证信息
  const formRef = ref() // 表单引用

  const authForm = reactive<UpdateClusterAuthInfoRequest>({
    id: props.clusterId,
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

  // 表单验证规则
  const authRules = computed(() => {
    const rules: any = {}

    if (authForm.authType === 'kubeconfig') {
      rules.kubeFile = [{ required: true, message: '请输入 KubeConfig 内容', trigger: 'blur' }]
    } else if (authForm.authType === 'token') {
      rules.apiServerHost = [{ required: true, message: '请输入 API Server 地址', trigger: 'blur' }]
      rules.token = [{ required: true, message: '请输入 Bearer Token', trigger: 'blur' }]
    } else if (authForm.authType === 'certificate') {
      rules.apiServerHost = [{ required: true, message: '请输入 API Server 地址', trigger: 'blur' }]
      rules.clientCert = [{ required: true, message: '请输入客户端证书', trigger: 'blur' }]
      rules.clientKey = [{ required: true, message: '请输入客户端密钥', trigger: 'blur' }]
      rules.caCert = [{ required: true, message: '请输入 CA 证书', trigger: 'blur' }]
    }

    return rules
  })

  const fetchAuthInfo = async () => {
    loading.value = true
    try {
      authInfo.value = await getClusterAuthInfoApi(props.clusterId)
      if (authInfo.value && authInfo.value.authType) {
        hasExistingAuth.value = true
        // 不直接显示认证信息内容，只记录认证类型
        authForm.authType = authInfo.value.authType
        authForm.apiServerHost = authInfo.value.apiServerHost || ''
        authForm.insecureSkipVerify = authInfo.value.insecureSkipVerify ?? 0
        // 清空敏感信息，不显示
        authForm.kubeFile = ''
        authForm.token = ''
        authForm.caCert = ''
        authForm.clientCert = ''
        authForm.clientKey = ''
      } else {
        hasExistingAuth.value = false
        isEditMode.value = true // 如果没有认证信息，直接进入编辑模式
      }
      isFirstLoad.value = false
    } catch (error) {
      hasExistingAuth.value = false
      isEditMode.value = true
    } finally {
      loading.value = false
    }
  }

  // 更换认证信息
  const changeAuthInfo = () => {
    ElMessageBox.confirm('更换认证信息将覆盖现有配置，是否继续？', '更换认证信息', {
      confirmButtonText: '确定更换',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        isEditMode.value = true
        // 清空表单内容
        authForm.kubeFile = ''
        authForm.token = ''
        authForm.caCert = ''
        authForm.clientCert = ''
        authForm.clientKey = ''
        authForm.caFile = ''
        authForm.certFile = ''
        authForm.keyFile = ''
        if (authForm.authType !== 'incluster') {
          authForm.apiServerHost = ''
        }
      })
      .catch(() => {
        // 用户取消
      })
  }

  // 取消编辑
  const cancelEdit = () => {
    isEditMode.value = false
    // 重置表单
    if (formRef.value) {
      formRef.value.resetFields()
    }
    // 如果有现有认证信息，恢复原有类型
    if (authInfo.value && authInfo.value.authType) {
      authForm.authType = authInfo.value.authType
      authForm.apiServerHost = authInfo.value.apiServerHost || ''
      authForm.insecureSkipVerify = authInfo.value.insecureSkipVerify ?? 0
    }
  }

  const testConnection = async () => {
    if (!isEditMode.value) {
      return
    }

    // 先验证表单
    try {
      await formRef.value?.validate()
    } catch (error) {
      return
    }

    testLoading.value = true
    try {
      await testClusterConnectivityApi({
        authType: authForm.authType,
        apiServerHost: authForm.apiServerHost,
        kubeFile: authForm.kubeFile,
        token: authForm.token,
        caCert: authForm.caCert,
        caFile: authForm.caFile,
        clientCert: authForm.clientCert,
        certFile: authForm.certFile,
        clientKey: authForm.clientKey,
        keyFile: authForm.keyFile,
        insecureSkipVerify: authForm.insecureSkipVerify
      })
      ElMessage.success('连接测试成功')
    } catch (error) {
    } finally {
      testLoading.value = false
    }
  }

  const saveAuthInfo = async () => {
    if (!isEditMode.value) {
      return
    }

    // 先验证表单
    try {
      await formRef.value?.validate()
    } catch (error) {
      return
    }

    saveLoading.value = true
    try {
      await updateClusterAuthInfoApi(authForm)
      ElMessage.success('认证信息更新成功')
      isEditMode.value = false
      hasExistingAuth.value = true
      await fetchAuthInfo()
    } catch (error) {
    } finally {
      saveLoading.value = false
    }
  }

  // 监听激活状态，实现懒加载
  watch(
    () => props.isActive,
    (newVal) => {
      if (newVal && isFirstLoad.value) {
        fetchAuthInfo()
      }
    },
    { immediate: true }
  )

  // 切换认证类型时清空相关字段
  watch(
    () => authForm.authType,
    () => {
      if (isEditMode.value) {
        // 清空之前的输入
        authForm.kubeFile = ''
        authForm.token = ''
        authForm.caCert = ''
        authForm.clientCert = ''
        authForm.clientKey = ''
        // 清除验证结果
        formRef.value?.clearValidate()
      }
    }
  )
</script>

<template>
  <div class="auth-config-panel" v-loading="loading">
    <div class="panel-header">
      <div class="header-title">
        <Shield />
        <div>
          <h2>集群认证配置</h2>
          <p>配置集群的访问认证信息，确保安全连接</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button v-if="hasExistingAuth && !isEditMode" type="warning" @click="changeAuthInfo">
          <KeyRound />
          更换认证信息
        </el-button>
        <el-button v-if="isEditMode" @click="cancelEdit"> 取消</el-button>
        <el-button @click="testConnection" :loading="testLoading" :disabled="!isEditMode">
          <RefreshCw v-if="!testLoading" :class="{ 'animate-spin': testLoading }" />
          {{ testLoading ? '测试中...' : '测试连接' }}
        </el-button>
        <el-button
          type="primary"
          @click="saveAuthInfo"
          :loading="saveLoading"
          :disabled="!isEditMode"
        >
          <Save v-if="!saveLoading" />
          {{ saveLoading ? '保存中...' : '保存配置' }}
        </el-button>
      </div>
    </div>

    <!-- 认证状态提示 -->
    <div v-if="hasExistingAuth && !isEditMode" class="auth-status">
      <el-alert type="success" :closable="false">
        <template #title>
          <div class="status-title">
            <Lock />
            <span>认证信息已配置</span>
          </div>
        </template>
        <div class="status-content">
          <p
            >当前认证类型：<strong>{{
              authTypeOptions.find((t) => t.value === authForm.authType)?.label
            }}</strong></p
          >
          <p class="security-tip"
            >为保证安全，认证信息只可修改不可查看。如需更换认证信息，请点击上方"更换认证信息"按钮。</p
          >
        </div>
      </el-alert>
    </div>

    <div class="auth-content" v-show="isEditMode">
      <!-- 认证类型选择 -->
      <div class="auth-type-selector">
        <div
          v-for="type in authTypeOptions"
          :key="type.value"
          class="auth-type-card"
          :class="{ active: authForm.authType === type.value }"
          @click="authForm.authType = type.value"
        >
          <div class="card-gradient" :style="{ background: type.gradient }"></div>
          <div class="card-content">
            <h4>{{ type.label }}</h4>
            <p>{{ type.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 认证配置表单 -->
      <div class="auth-form-container">
        <el-form ref="formRef" :model="authForm" :rules="authRules" label-width="140px">
          <!-- API Server 地址 -->
          <el-form-item
            label="API Server 地址"
            prop="apiServerHost"
            v-if="authForm.authType === 'token' || authForm.authType === 'certificate'"
          >
            <el-input
              v-model="authForm.apiServerHost"
              placeholder="https://kubernetes.example.com:6443"
            />
          </el-form-item>

          <!-- KubeConfig -->
          <template v-if="authForm.authType === 'kubeconfig'">
            <el-form-item label="KubeConfig" prop="kubeFile" required>
              <el-input
                v-model="authForm.kubeFile"
                type="textarea"
                :rows="12"
                placeholder="请粘贴完整的 KubeConfig 文件内容"
                class="code-input"
              />
            </el-form-item>
          </template>

          <!-- Token -->
          <template v-if="authForm.authType === 'token'">
            <el-form-item label="Bearer Token" prop="token" required>
              <el-input v-model="authForm.token" placeholder="请输入 Bearer Token" show-password />
            </el-form-item>
            <el-form-item label="CA 证书" prop="caCert">
              <el-input
                v-model="authForm.caCert"
                type="textarea"
                :rows="6"
                placeholder="CA 证书内容（PEM 格式，可选）"
                class="code-input"
              />
            </el-form-item>
          </template>

          <!-- 证书 -->
          <template v-if="authForm.authType === 'certificate'">
            <el-form-item label="客户端证书" prop="clientCert" required>
              <el-input
                v-model="authForm.clientCert"
                type="textarea"
                :rows="6"
                placeholder="客户端证书内容（PEM 格式）"
                class="code-input"
              />
            </el-form-item>
            <el-form-item label="客户端密钥" prop="clientKey" required>
              <el-input
                v-model="authForm.clientKey"
                type="textarea"
                :rows="6"
                placeholder="客户端密钥内容（PEM 格式）"
                class="code-input"
              />
            </el-form-item>
            <el-form-item label="CA 证书" prop="caCert" required>
              <el-input
                v-model="authForm.caCert"
                type="textarea"
                :rows="6"
                placeholder="CA 证书内容（PEM 格式）"
                class="code-input"
              />
            </el-form-item>
          </template>

          <!-- 集群内部提示 -->
          <el-alert
            v-if="authForm.authType === 'incluster'"
            type="info"
            :closable="false"
            class="incluster-alert"
          >
            <template #title>
              <div class="alert-title">
                <Shield />
                集群内部认证模式
              </div>
            </template>
            <p>系统将自动使用集群内部的 ServiceAccount 进行认证</p>
            <p>此模式适用于管理平台部署在 Kubernetes 集群内部的场景</p>
          </el-alert>

          <!-- TLS 验证 -->
          <el-form-item v-if="authForm.authType !== 'incluster'" class="tls-option">
            <el-checkbox v-model="authForm.insecureSkipVerify" :true-value="1" :false-value="0">
              跳过 TLS 证书验证
            </el-checkbox>
            <div class="warning-tip">
              <AlertCircle />
              <span>不推荐在生产环境使用此选项</span>
            </div>
          </el-form-item>

          <!-- 安全提示 -->
          <el-alert type="warning" :closable="false" class="security-alert">
            <template #title>
              <div class="alert-title">
                <Lock />
                安全提示
              </div>
            </template>
            <p>• 认证信息将被加密存储，保存后将无法查看原始内容</p>
            <p>• 请妥善保管您的认证凭据，避免泄露给未授权人员</p>
            <p>• 建议定期更换认证信息以提高安全性</p>
          </el-alert>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .auth-config-panel {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #f1f5f9;

      .header-title {
        display: flex;
        align-items: center;
        gap: 16px;

        svg {
          width: 40px;
          height: 40px;
          color: #667eea;
        }

        h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        p {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;

        .el-button {
          display: flex;
          align-items: center;
          gap: 6px;

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          svg {
            width: 14px;
            height: 14px;
          }
        }
      }
    }

    .auth-status {
      margin-bottom: 24px;

      :deep(.el-alert) {
        border-radius: 12px;
        padding: 20px;

        .status-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;

          svg {
            width: 18px;
            height: 18px;
          }
        }

        .status-content {
          margin-top: 12px;

          p {
            margin: 8px 0;
            color: #475569;
            font-size: 14px;

            strong {
              color: #1e293b;
              font-weight: 600;
            }

            &.security-tip {
              color: #64748b;
              font-style: italic;
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid #e2e8f0;
            }
          }
        }
      }
    }

    .auth-content {
      .auth-type-selector {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 32px;

        .auth-type-card {
          position: relative;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
          overflow: hidden;

          .card-gradient {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            transition: height 0.3s;
          }

          .card-content {
            position: relative;

            h4 {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
              margin: 0 0 8px 0;
            }

            p {
              font-size: 13px;
              color: #64748b;
              margin: 0;
              line-height: 1.5;
            }
          }

          &:hover {
            border-color: #cbd5e1;
            background: #f8fafc;

            .card-gradient {
              height: 6px;
            }
          }

          &.active {
            border-color: transparent;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);

            .card-gradient {
              height: 100%;
              opacity: 0.1;
            }
          }
        }
      }

      .auth-form-container {
        background: #f8fafc;
        border-radius: 16px;
        padding: 32px;

        :deep(.el-form-item) {
          &.is-required {
            .el-form-item__label::before {
              content: '*';
              color: #f56c6c;
              margin-right: 4px;
            }
          }
        }

        :deep(.code-input) {
          .el-textarea__inner {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            line-height: 1.6;
            border-radius: 8px;
          }
        }

        :deep(.el-input) {
          .el-input__wrapper {
            border-radius: 8px;
          }
        }

        .incluster-alert {
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border: 1px solid #667eea30;
          border-radius: 12px;

          .alert-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;

            svg {
              width: 18px;
              height: 18px;
            }
          }

          p {
            margin: 4px 0;
            color: #475569;
            font-size: 13px;
          }
        }

        .security-alert {
          margin-top: 24px;
          background: linear-gradient(135deg, #fef3c715 0%, #fed7aa15 100%);
          border: 1px solid #fbbf2430;
          border-radius: 12px;

          .alert-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;

            svg {
              width: 18px;
              height: 18px;
            }
          }

          p {
            margin: 6px 0;
            color: #92400e;
            font-size: 13px;
            line-height: 1.5;
          }
        }

        .tls-option {
          margin-top: 24px;

          .warning-tip {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
            color: #f59e0b;
            font-size: 13px;

            svg {
              width: 14px;
              height: 14px;
            }
          }
        }
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

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
