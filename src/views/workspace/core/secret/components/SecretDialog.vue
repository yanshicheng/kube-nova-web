<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="1000px"
    top="5vh"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @closed="handleClosed"
  >
    <!-- 模式切换 -->
    <div class="mode-switch">
      <ElRadioGroup v-model="editMode" size="default">
        <ElRadioButton value="form">
          <div class="radio-content">
            <FileEdit :size="16" />
            <span>表单模式</span>
          </div>
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <div class="radio-content">
            <Code :size="16" />
            <span>YAML 模式</span>
          </div>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 表单模式 -->
    <div v-show="editMode === 'form'" class="form-content">
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="top"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-header">
            <Info :size="16" />
            <span>基本信息</span>
          </div>

          <ElRow :gutter="20">
            <ElCol :span="8">
              <ElFormItem label="名称" prop="name">
                <ElInput
                  v-model="formData.name"
                  placeholder="请输入 Secret 名称"
                  :disabled="dialogType === 'edit'"
                  :prefix-icon="FileText"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="命名空间">
                <ElInput :value="workspace?.namespace" disabled :prefix-icon="Box" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="类型" prop="type">
                <ElSelect
                  v-model="formData.type"
                  placeholder="请选择类型"
                  :disabled="dialogType === 'edit'"
                  style="width: 100%"
                  @change="handleTypeChange"
                >
                  <ElOption label="Opaque" value="Opaque" />
                  <ElOption label="TLS 证书" value="kubernetes.io/tls" />
                  <ElOption label="Docker 配置" value="kubernetes.io/dockerconfigjson" />
                  <ElOption label="Basic Auth" value="kubernetes.io/basic-auth" />
                  <ElOption label="SSH Auth" value="kubernetes.io/ssh-auth" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <!-- 标签 -->
        <div class="form-section">
          <div class="section-header">
            <Tag :size="16" />
            <span>标签（Labels）</span>
            <span class="section-desc">用于标识和组织资源</span>
          </div>

          <div class="key-value-list">
            <div v-for="(item, index) in formData.labels" :key="index" class="key-value-item">
              <ElInput
                v-model="item.key"
                placeholder="键（Key）"
                class="key-input"
                :prefix-icon="Key"
              />
              <span class="separator">=</span>
              <ElInput v-model="item.value" placeholder="值（Value）" class="value-input" />
              <ElButton type="danger" :icon="Trash2" circle @click="removeLabel(index)" />
            </div>
            <ElButton type="primary" :icon="Plus" plain @click="addLabel"> 添加标签 </ElButton>
          </div>
        </div>

        <!-- Opaque 类型 - 自定义键值对 -->
        <div v-if="formData.type === 'Opaque'" class="form-section">
          <div class="section-header">
            <Lock :size="16" />
            <span>敏感数据</span>
            <span class="section-required">*</span>
            <span class="section-desc">至少添加一个数据项</span>
          </div>

          <ElAlert type="warning" :closable="false" show-icon style="margin-bottom: 20px">
            <template #title>
              {{
                dialogType === 'add'
                  ? '数据将自动进行 Base64 编码存储'
                  : '编辑时默认显示 Base64 编码，点击眼睛图标可查看明文'
              }}
            </template>
          </ElAlert>

          <div class="data-list">
            <div v-for="(item, index) in formData.data" :key="index" class="data-item">
              <div class="data-header">
                <ElInput
                  v-model="item.key"
                  placeholder="键（Key）"
                  class="data-key-input"
                  :prefix-icon="Key"
                />
                <ElButton
                  type="danger"
                  :icon="Trash2"
                  circle
                  size="small"
                  @click="removeData(index)"
                />
              </div>

              <!-- 创建模式：直接输入明文 -->
              <template v-if="dialogType === 'add'">
                <ElInput
                  v-model="item.value"
                  type="textarea"
                  :rows="5"
                  placeholder="值（Value）- 明文输入"
                  class="data-value-input"
                />
              </template>

              <!-- 编辑模式：显示 base64，可通过眼睛图标切换查看明文 -->
              <template v-else>
                <div class="data-value-wrapper">
                  <ElInput
                    :model-value="dataDisplayValues[index] || item.value"
                    :type="dataVisibility[index] ? 'textarea' : 'text'"
                    :rows="dataVisibility[index] ? 5 : 1"
                    :placeholder="dataVisibility[index] ? '明文内容' : 'Base64 编码内容'"
                    class="data-value-input"
                    readonly
                  />
                  <ElButton
                    :icon="dataVisibility[index] ? Eye : EyeOff"
                    circle
                    size="small"
                    @click="toggleDataVisibility(index)"
                    class="visibility-btn"
                    :title="dataVisibility[index] ? '切换为 Base64' : '切换为明文'"
                  />
                </div>
              </template>
            </div>
            <ElButton type="primary" :icon="Plus" plain @click="addData"> 添加数据项 </ElButton>
          </div>
        </div>

        <!-- TLS 证书类型 -->
        <div v-else-if="formData.type === 'kubernetes.io/tls'" class="form-section">
          <div class="section-header">
            <ShieldCheck :size="16" />
            <span>TLS 证书</span>
            <span class="section-required">*</span>
          </div>

          <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 20px">
            <template #title>
              TLS Secret 包含 tls.crt（证书）和 tls.key（私钥）两个必需字段
            </template>
          </ElAlert>

          <ElFormItem label="证书 (tls.crt)" required>
            <div class="input-with-visibility">
              <ElInput
                v-model="formData.tlsCrt"
                type="textarea"
                :rows="15"
                placeholder="请粘贴 PEM 格式的证书内容"
                :class="{ 'password-mode': !tlsCrtVisible }"
              />
              <ElButton
                :icon="tlsCrtVisible ? Eye : EyeOff"
                circle
                size="small"
                @click="tlsCrtVisible = !tlsCrtVisible"
                class="visibility-toggle-btn"
              />
            </div>
          </ElFormItem>

          <ElFormItem label="私钥 (tls.key)" required>
            <div class="input-with-visibility">
              <ElInput
                v-model="formData.tlsKey"
                type="textarea"
                :rows="15"
                placeholder="请粘贴 PEM 格式的私钥内容"
                :class="{ 'password-mode': !tlsKeyVisible }"
              />
              <ElButton
                :icon="tlsKeyVisible ? Eye : EyeOff"
                circle
                size="small"
                @click="tlsKeyVisible = !tlsKeyVisible"
                class="visibility-toggle-btn"
              />
            </div>
          </ElFormItem>
        </div>

        <!-- Docker 配置类型 -->
        <div v-else-if="formData.type === 'kubernetes.io/dockerconfigjson'" class="form-section">
          <div class="section-header">
            <Database :size="16" />
            <span>Docker 配置</span>
            <span class="section-required">*</span>
          </div>

          <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 20px">
            <template #title> 用于拉取私有镜像仓库的镜像，包含 .dockerconfigjson 字段 </template>
          </ElAlert>

          <ElFormItem label="镜像仓库地址" required>
            <ElInput v-model="formData.dockerServer" placeholder="例如: docker.io" />
          </ElFormItem>

          <ElFormItem label="用户名" required>
            <ElInput v-model="formData.dockerUsername" placeholder="请输入用户名" />
          </ElFormItem>

          <ElFormItem label="密码" required>
            <div class="input-with-visibility">
              <ElInput
                v-model="formData.dockerPassword"
                :type="dockerPasswordVisible ? 'text' : 'password'"
                placeholder="请输入密码"
              />
              <ElButton
                :icon="dockerPasswordVisible ? Eye : EyeOff"
                circle
                size="small"
                @click="dockerPasswordVisible = !dockerPasswordVisible"
                class="visibility-toggle-btn"
              />
            </div>
          </ElFormItem>

          <ElFormItem label="邮箱">
            <ElInput v-model="formData.dockerEmail" placeholder="请输入邮箱（可选）" />
          </ElFormItem>
        </div>

        <!-- Basic Auth 类型 -->
        <div v-else-if="formData.type === 'kubernetes.io/basic-auth'" class="form-section">
          <div class="section-header">
            <UserCheck :size="16" />
            <span>基础认证</span>
            <span class="section-required">*</span>
          </div>

          <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 20px">
            <template #title> 用于 HTTP 基础认证，包含 username 和 password 字段 </template>
          </ElAlert>

          <ElFormItem label="用户名 (username)" required>
            <ElInput v-model="formData.basicAuthUsername" placeholder="请输入用户名" />
          </ElFormItem>

          <ElFormItem label="密码 (password)" required>
            <div class="input-with-visibility">
              <ElInput
                v-model="formData.basicAuthPassword"
                :type="basicAuthPasswordVisible ? 'text' : 'password'"
                placeholder="请输入密码"
              />
              <ElButton
                :icon="basicAuthPasswordVisible ? Eye : EyeOff"
                circle
                size="small"
                @click="basicAuthPasswordVisible = !basicAuthPasswordVisible"
                class="visibility-toggle-btn"
              />
            </div>
          </ElFormItem>
        </div>

        <!-- SSH Auth 类型 -->
        <div v-else-if="formData.type === 'kubernetes.io/ssh-auth'" class="form-section">
          <div class="section-header">
            <Terminal :size="16" />
            <span>SSH 认证</span>
            <span class="section-required">*</span>
          </div>

          <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 20px">
            <template #title> 用于 SSH 认证，包含 ssh-privatekey 字段 </template>
          </ElAlert>

          <ElFormItem label="SSH 私钥 (ssh-privatekey)" required>
            <div class="input-with-visibility">
              <ElInput
                v-model="formData.sshPrivateKey"
                type="textarea"
                :rows="18"
                placeholder="请粘贴 SSH 私钥内容"
                :class="{ 'password-mode': !sshPrivateKeyVisible }"
              />
              <ElButton
                :icon="sshPrivateKeyVisible ? Eye : EyeOff"
                circle
                size="small"
                @click="sshPrivateKeyVisible = !sshPrivateKeyVisible"
                class="visibility-toggle-btn"
              />
            </div>
          </ElFormItem>
        </div>
      </ElForm>
    </div>

    <!-- YAML 模式 -->
    <div v-show="editMode === 'yaml'" class="yaml-content">
      <YamlEditor
        v-model="yamlContent"
        :filename="`${formData.name || 'secret'}.yaml`"
        :readonly="false"
        height="600px"
        @change="handleYamlChange"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleCancel" :disabled="submitting" size="large"> 取消 </ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting" size="large">
          {{ dialogType === 'add' ? '创建' : '更新' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    Plus,
    Trash2,
    FileEdit,
    Code,
    Info,
    FileText,
    Tag,
    Key,
    Lock,
    Box,
    ShieldCheck,
    Database,
    UserCheck,
    Terminal,
    Eye,
    EyeOff
  } from 'lucide-vue-next'
  import * as yaml from 'js-yaml'
  import {
    createSecretApi,
    updateSecretApi,
    getSecretDetailApi,
    type SecretListItem,
    type ProjectWorkspace
  } from '@/api'
  import YamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    secretData?: SecretListItem
    workspace: ProjectWorkspace | null
  }

  interface KeyValue {
    key: string
    value: string
  }

  interface FormData {
    name: string
    type: string
    labels: KeyValue[]
    data: KeyValue[]
    tlsCrt: string
    tlsKey: string
    dockerServer: string
    dockerUsername: string
    dockerPassword: string
    dockerEmail: string
    basicAuthUsername: string
    basicAuthPassword: string
    sshPrivateKey: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'success'])

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const dialogTitle = computed(() => {
    return props.dialogType === 'add' ? '新增 Secret' : '编辑 Secret'
  })

  const formRef = ref<FormInstance>()
  const editMode = ref<'form' | 'yaml'>('form')
  const submitting = ref(false)
  const yamlContent = ref('')

  // 可见性控制
  const dataVisibility = ref<Record<number, boolean>>({})
  const dataDisplayValues = ref<Record<number, string>>({}) // 用于存储显示值（base64或明文）
  const originalBase64Data = ref<Record<number, string>>({}) // 存储原始 base64 数据

  const tlsCrtVisible = ref(false)
  const tlsKeyVisible = ref(false)
  const dockerPasswordVisible = ref(false)
  const basicAuthPasswordVisible = ref(false)
  const sshPrivateKeyVisible = ref(false)

  const formData = ref<FormData>({
    name: '',
    type: 'Opaque',
    labels: [],
    data: [],
    tlsCrt: '',
    tlsKey: '',
    dockerServer: '',
    dockerUsername: '',
    dockerPassword: '',
    dockerEmail: '',
    basicAuthUsername: '',
    basicAuthPassword: '',
    sshPrivateKey: ''
  })

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入 Secret 名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '名称只能包含小写字母、数字和连字符，且必须以字母或数字开头和结尾',
        trigger: 'blur'
      }
    ],
    type: [{ required: true, message: '请选择类型', trigger: 'change' }]
  }

  watch(visible, async (val) => {
    if (val) {
      await initFormData()
    }
  })

  watch(editMode, (newMode) => {
    if (newMode === 'yaml') {
      formToYaml()
    } else {
      yamlToForm()
    }
  })

  /**
   * 将字节数组转换为 Base64 字符串
   */
  const byteArrayToBase64 = (byteArray: number[] | string): string => {
    // 如果已经是字符串，直接返回
    if (typeof byteArray === 'string') {
      return byteArray
    }

    try {
      const uint8Array = new Uint8Array(byteArray)
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i])
      }
      return btoa(binary)
    } catch (error) {
      console.error('字节数组转Base64失败:', error)
      return ''
    }
  }

  /**
   * Base64 解码为明文
   */
  const base64ToPlainText = (base64Str: string): string => {
    try {
      return decodeURIComponent(escape(atob(base64Str)))
    } catch (error) {
      console.error('Base64解码失败:', error)
      return '[解码失败]'
    }
  }

  /**
   * 明文编码为 Base64
   */
  const plainTextToBase64 = (plainText: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(plainText)))
    } catch (error) {
      console.error('编码失败:', error)
      return ''
    }
  }

  const initFormData = async () => {
    if (props.dialogType === 'edit' && props.secretData) {
      try {
        const detail = await getSecretDetailApi({
          workloadId: props.workspace?.id || 0,
          name: props.secretData.name
        })

        formData.value = {
          name: detail.name,
          type: detail.type,
          labels: objectToArray(detail.labels),
          data: [],
          tlsCrt: '',
          tlsKey: '',
          dockerServer: '',
          dockerUsername: '',
          dockerPassword: '',
          dockerEmail: '',
          basicAuthUsername: '',
          basicAuthPassword: '',
          sshPrivateKey: ''
        }

        // 根据类型解析数据
        if (detail.data) {
          if (detail.type === 'Opaque') {
            // 处理 Opaque 类型的数据
            formData.value.data = Object.entries(detail.data).map(([key, value], index) => {
              // 后端可能返回字节数组或 base64 字符串
              const base64Str = byteArrayToBase64(value)

              // 存储原始 base64
              originalBase64Data.value[index] = base64Str
              // 默认显示 base64
              dataDisplayValues.value[index] = base64Str
              // 默认不显示明文
              dataVisibility.value[index] = false

              return {
                key,
                value: base64Str // 内部存储 base64
              }
            })
          } else if (detail.type === 'kubernetes.io/tls') {
            const tlsCrt = detail.data['tls.crt']
            const tlsKey = detail.data['tls.key']
            formData.value.tlsCrt =
              typeof tlsCrt === 'string'
                ? base64ToPlainText(tlsCrt)
                : base64ToPlainText(byteArrayToBase64(tlsCrt))
            formData.value.tlsKey =
              typeof tlsKey === 'string'
                ? base64ToPlainText(tlsKey)
                : base64ToPlainText(byteArrayToBase64(tlsKey))
          } else if (detail.type === 'kubernetes.io/basic-auth') {
            const username = detail.data['username']
            const password = detail.data['password']
            formData.value.basicAuthUsername =
              typeof username === 'string'
                ? base64ToPlainText(username)
                : base64ToPlainText(byteArrayToBase64(username))
            formData.value.basicAuthPassword =
              typeof password === 'string'
                ? base64ToPlainText(password)
                : base64ToPlainText(byteArrayToBase64(password))
          } else if (detail.type === 'kubernetes.io/ssh-auth') {
            const sshKey = detail.data['ssh-privatekey']
            formData.value.sshPrivateKey =
              typeof sshKey === 'string'
                ? base64ToPlainText(sshKey)
                : base64ToPlainText(byteArrayToBase64(sshKey))
          } else if (detail.type === 'kubernetes.io/dockerconfigjson') {
            const dockerConfig = detail.data['.dockerconfigjson']
            const dockerConfigStr =
              typeof dockerConfig === 'string'
                ? base64ToPlainText(dockerConfig)
                : base64ToPlainText(byteArrayToBase64(dockerConfig))
            try {
              const config = JSON.parse(dockerConfigStr)
              const firstServer = Object.keys(config.auths || {})[0]
              if (firstServer && config.auths[firstServer]) {
                formData.value.dockerServer = firstServer
                formData.value.dockerUsername = config.auths[firstServer].username || ''
                formData.value.dockerPassword = config.auths[firstServer].password || ''
                formData.value.dockerEmail = config.auths[firstServer].email || ''
              }
            } catch (error) {
              console.error('解析Docker配置失败:', error)
            }
          }
        }
      } catch (error) {
        console.error('获取 Secret 详情失败:', error)
      }
    } else {
      resetFormData()
    }

    editMode.value = 'form'
    formToYaml()
  }

  const resetFormData = () => {
    formData.value = {
      name: '',
      type: 'Opaque',
      labels: [],
      data: [],
      tlsCrt: '',
      tlsKey: '',
      dockerServer: '',
      dockerUsername: '',
      dockerPassword: '',
      dockerEmail: '',
      basicAuthUsername: '',
      basicAuthPassword: '',
      sshPrivateKey: ''
    }
    originalBase64Data.value = {}
    dataVisibility.value = {}
    dataDisplayValues.value = {}
  }

  const handleTypeChange = () => {
    // 清空特定类型的数据
    formData.value.data = []
    formData.value.tlsCrt = ''
    formData.value.tlsKey = ''
    formData.value.dockerServer = ''
    formData.value.dockerUsername = ''
    formData.value.dockerPassword = ''
    formData.value.dockerEmail = ''
    formData.value.basicAuthUsername = ''
    formData.value.basicAuthPassword = ''
    formData.value.sshPrivateKey = ''
    originalBase64Data.value = {}
    dataVisibility.value = {}
    dataDisplayValues.value = {}
  }

  const objectToArray = (obj?: Record<string, string>): KeyValue[] => {
    if (!obj) return []
    return Object.entries(obj)
      .filter(([key]) => key && key.trim())
      .map(([key, value]) => ({ key, value }))
  }

  const arrayToObject = (arr: KeyValue[]): Record<string, string> => {
    const obj: Record<string, string> = {}
    arr.forEach((item) => {
      if (item.key && item.key.trim() && item.value !== undefined) {
        obj[item.key.trim()] = item.value
      }
    })
    return obj
  }

  const formToYaml = () => {
    const labelsObj = arrayToObject(formData.value.labels)

    const secretObj: any = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: formData.value.name || 'secret-name',
        namespace: props.workspace?.namespace || 'default'
      },
      type: formData.value.type,
      data: {}
    }

    // 根据类型设置数据
    if (formData.value.type === 'Opaque') {
      formData.value.data.forEach((item) => {
        if (item.key && item.value) {
          if (props.dialogType === 'add') {
            // 创建模式：明文转 base64
            secretObj.data[item.key] = plainTextToBase64(item.value)
          } else {
            // 编辑模式：item.value 已经是 base64
            secretObj.data[item.key] = item.value
          }
        }
      })
    } else if (formData.value.type === 'kubernetes.io/tls') {
      if (formData.value.tlsCrt)
        secretObj.data['tls.crt'] = plainTextToBase64(formData.value.tlsCrt)
      if (formData.value.tlsKey)
        secretObj.data['tls.key'] = plainTextToBase64(formData.value.tlsKey)
    } else if (formData.value.type === 'kubernetes.io/dockerconfigjson') {
      if (
        formData.value.dockerServer &&
        formData.value.dockerUsername &&
        formData.value.dockerPassword
      ) {
        const auth = btoa(`${formData.value.dockerUsername}:${formData.value.dockerPassword}`)
        const dockerConfig = {
          auths: {
            [formData.value.dockerServer]: {
              username: formData.value.dockerUsername,
              password: formData.value.dockerPassword,
              email: formData.value.dockerEmail || '',
              auth: auth
            }
          }
        }
        secretObj.data['.dockerconfigjson'] = plainTextToBase64(JSON.stringify(dockerConfig))
      }
    } else if (formData.value.type === 'kubernetes.io/basic-auth') {
      if (formData.value.basicAuthUsername)
        secretObj.data['username'] = plainTextToBase64(formData.value.basicAuthUsername)
      if (formData.value.basicAuthPassword)
        secretObj.data['password'] = plainTextToBase64(formData.value.basicAuthPassword)
    } else if (formData.value.type === 'kubernetes.io/ssh-auth') {
      if (formData.value.sshPrivateKey)
        secretObj.data['ssh-privatekey'] = plainTextToBase64(formData.value.sshPrivateKey)
    }

    if (Object.keys(labelsObj).length > 0) {
      secretObj.metadata.labels = labelsObj
    }

    yamlContent.value = yaml.dump(secretObj, { indent: 2 })
  }

  const yamlToForm = () => {
    try {
      const obj: any = yaml.load(yamlContent.value)

      if (props.workspace) {
        obj.metadata.namespace = props.workspace.namespace
      }

      formData.value.name = obj.metadata?.name || ''
      formData.value.type = obj.type || 'Opaque'
      formData.value.labels = objectToArray(obj.metadata?.labels)

      // 清空所有数据
      handleTypeChange()

      formToYaml()
    } catch (error) {
      console.error('YAML 解析失败:', error)
    }
  }

  const handleYamlChange = (content: string) => {
    yamlContent.value = content
  }

  const addLabel = () => {
    formData.value.labels.push({ key: '', value: '' })
  }

  const removeLabel = (index: number) => {
    formData.value.labels.splice(index, 1)
  }

  const addData = () => {
    const newIndex = formData.value.data.length
    formData.value.data.push({ key: '', value: '' })

    if (props.dialogType === 'edit') {
      originalBase64Data.value[newIndex] = ''
      dataVisibility.value[newIndex] = false
      dataDisplayValues.value[newIndex] = ''
    }
  }

  const removeData = (index: number) => {
    formData.value.data.splice(index, 1)
    delete dataVisibility.value[index]
    delete originalBase64Data.value[index]
    delete dataDisplayValues.value[index]
  }

  /**
   * 切换 base64/明文 显示
   */
  const toggleDataVisibility = (index: number) => {
    const currentVisibility = dataVisibility.value[index] || false
    const base64Value = originalBase64Data.value[index]

    if (!currentVisibility) {
      // 当前显示 base64，切换为明文
      const plainText = base64ToPlainText(base64Value)
      dataDisplayValues.value[index] = plainText
      dataVisibility.value[index] = true
    } else {
      // 当前显示明文，切换回 base64
      dataDisplayValues.value[index] = base64Value
      dataVisibility.value[index] = false
    }
  }

  const validateFormData = (): boolean => {
    if (formData.value.type === 'Opaque') {
      if (formData.value.data.length === 0) {
        return false
      }
      const hasEmptyKey = formData.value.data.some((item) => !item.key || !item.key.trim())
      if (hasEmptyKey) {
        return false
      }
      const hasEmptyValue = formData.value.data.some((item) => !item.value || !item.value.trim())
      if (hasEmptyValue) {
        return false
      }
    } else if (formData.value.type === 'kubernetes.io/tls') {
      if (!formData.value.tlsCrt || !formData.value.tlsKey) {
        return false
      }
    } else if (formData.value.type === 'kubernetes.io/dockerconfigjson') {
      if (
        !formData.value.dockerServer ||
        !formData.value.dockerUsername ||
        !formData.value.dockerPassword
      ) {
        return false
      }
    } else if (formData.value.type === 'kubernetes.io/basic-auth') {
      if (!formData.value.basicAuthUsername || !formData.value.basicAuthPassword) {
        return false
      }
    } else if (formData.value.type === 'kubernetes.io/ssh-auth') {
      if (!formData.value.sshPrivateKey) {
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!props.workspace) {
      return
    }

    if (editMode.value === 'yaml') {
      yamlToForm()
    }

    if (editMode.value === 'form') {
      try {
        await formRef.value?.validate()
      } catch (error) {
        return
      }

      if (!validateFormData()) {
        return
      }
    }

    // 构建 YAML 字符串
    formToYaml()

    submitting.value = true
    try {
      const requestData = {
        workloadId: props.workspace.id,
        name: formData.value.name,
        secretYamlStr: yamlContent.value
      }

      if (props.dialogType === 'add') {
        await createSecretApi(requestData)
        ElMessage.success('创建成功')
      } else {
        await updateSecretApi(requestData)
        ElMessage.success('更新成功')
      }

      emit('success')
      visible.value = false
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const handleCancel = () => {
    visible.value = false
  }

  const handleClosed = () => {
    formRef.value?.resetFields()
    resetFormData()
    yamlContent.value = ''
    dataVisibility.value = {}
    originalBase64Data.value = {}
    dataDisplayValues.value = {}
    tlsCrtVisible.value = false
    tlsKeyVisible.value = false
    dockerPasswordVisible.value = false
    basicAuthPasswordVisible.value = false
    sshPrivateKeyVisible.value = false
  }
</script>

<style lang="scss" scoped>
  .mode-switch {
    margin-bottom: 24px;
    display: flex;
    justify-content: flex-end;

    .radio-content {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .form-content,
  .yaml-content {
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;

      &:hover {
        background: #c0c4cc;
      }
    }
  }

  .form-section {
    margin-bottom: 24px;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e4e7ed;
      font-size: 15px;
      font-weight: 600;
      color: #303133;

      .section-required {
        color: #f56c6c;
        font-size: 16px;
      }

      .section-desc {
        margin-left: auto;
        font-size: 13px;
        font-weight: 400;
        color: #909399;
      }
    }

    :deep(.el-form-item) {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    // 确保所有输入框都是 100% 宽度
    :deep(.el-input),
    :deep(.el-textarea),
    :deep(.el-select) {
      width: 100%;
    }

    :deep(.el-input__inner),
    :deep(.el-textarea__inner) {
      width: 100% !important;
    }
  }

  .key-value-list {
    .key-value-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #dcdfe6;
      transition: all 0.3s;

      &:hover {
        border-color: #67c23a;
        box-shadow: 0 2px 8px rgba(103, 194, 58, 0.1);
      }

      .key-input {
        flex: 0 0 300px;
        width: 300px;
      }

      .separator {
        flex-shrink: 0;
        color: #909399;
        font-weight: 600;
        font-size: 16px;
      }

      .value-input {
        flex: 1;
        min-width: 0;
      }

      :deep(.el-input__inner) {
        width: 100% !important;
      }
    }
  }

  .data-list {
    .data-item {
      margin-bottom: 16px;
      padding: 16px;
      background: white;
      border-radius: 6px;
      border: 1px solid #dcdfe6;
      transition: all 0.3s;

      &:hover {
        border-color: #67c23a;
        box-shadow: 0 2px 8px rgba(103, 194, 58, 0.1);
      }

      .data-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .data-key-input {
          flex: 1;
        }
      }

      .data-value-input {
        width: 100% !important;

        :deep(.el-input__inner) {
          width: 100% !important;
        }

        :deep(.el-textarea__inner) {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          width: 100% !important;
          min-height: 100px !important;
        }
      }

      .data-value-wrapper {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        width: 100%;

        .data-value-input {
          flex: 1;
          width: 100% !important;

          :deep(.el-input__inner) {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            background: #f5f7fa;
            width: 100% !important;
          }

          :deep(.el-textarea__inner) {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            background: #f5f7fa;
            width: 100% !important;
            min-height: 100px !important;
          }
        }

        .visibility-btn {
          flex-shrink: 0;
          margin-top: 0;
        }
      }
    }
  }

  .input-with-visibility {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;

    :deep(.el-input),
    :deep(.el-textarea) {
      flex: 1;
      width: 100%;
    }

    .visibility-toggle-btn {
      flex-shrink: 0;
      margin-top: 4px;
    }

    :deep(.el-textarea__inner) {
      min-height: 200px !important;
      width: 100% !important;
      resize: vertical;
    }

    :deep(.el-input__inner) {
      width: 100% !important;
    }

    // 密码模式：将文本显示为圆点
    :deep(.password-mode .el-textarea__inner) {
      -webkit-text-security: disc;
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 2px;
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
