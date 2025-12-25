<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="720px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="channel-form-dialog"
    :destroy-on-close="true"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
      label-position="top"
      class="channel-form"
    >
      <!-- 基础信息 -->
      <div class="form-section">
        <div class="section-header">
          <el-icon class="section-icon"><Document /></el-icon>
          <span class="section-title">基础信息</span>
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="渠道名称" prop="channelName">
              <el-input
                v-model="form.channelName"
                placeholder="如：运维钉钉群"
                maxlength="50"
                show-word-limit
                clearable
              >
                <template #prefix>
                  <el-icon><Edit /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渠道类型" prop="channelType">
              <el-select
                v-model="form.channelType"
                placeholder="请选择"
                style="width: 100%"
                :disabled="!!channelId"
                @change="handleChannelTypeChange"
              >
                <el-option
                  v-for="type in availableChannelTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                >
                  <div class="select-option">
                    <div class="option-dot" :style="{ background: type.color }"></div>
                    <span>{{ type.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入渠道描述信息（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </div>

      <!-- 渠道配置 -->
      <div class="form-section" v-if="form.channelType">
        <div class="section-header">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span class="section-title">渠道配置</span>
          <el-tag size="small" :type="getChannelTagType(form.channelType)">
            {{ getChannelTypeName(form.channelType) }}
          </el-tag>
        </div>

        <!-- 钉钉配置 -->
        <template v-if="form.channelType === 'dingtalk'">
          <el-form-item label="Webhook 地址" required>
            <el-input
              v-model="configData.webhook"
              placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx"
            >
              <template #prefix>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div class="form-help"> 在钉钉群设置中添加自定义机器人获取 Webhook 地址 </div>
          </el-form-item>
          <el-form-item label="加签密钥（可选）">
            <el-input
              v-model="configData.secret"
              placeholder="SECxxx"
              type="password"
              show-password
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <div class="form-help"> 配置加签密钥可提高安全性 </div>
          </el-form-item>
        </template>

        <!-- 企业微信配置 -->
        <template v-if="form.channelType === 'wechat'">
          <el-form-item label="Webhook 地址" required>
            <el-input
              v-model="configData.webhook"
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
            >
              <template #prefix>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div class="form-help"> 在企业微信群设置中添加群机器人获取 Webhook 地址 </div>
          </el-form-item>
        </template>

        <!-- 飞书配置 -->
        <template v-if="form.channelType === 'feishu'">
          <el-form-item label="Webhook 地址" required>
            <el-input
              v-model="configData.webhook"
              placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
            >
              <template #prefix>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div class="form-help"> 在飞书群设置中添加自定义机器人获取 Webhook 地址 </div>
          </el-form-item>
          <el-form-item label="签名密钥（可选）">
            <el-input
              v-model="configData.secret"
              placeholder="签名密钥"
              type="password"
              show-password
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <div class="form-help"> 配置签名密钥可提高安全性 </div>
          </el-form-item>
        </template>

        <!-- 邮件配置 -->
        <template v-if="form.channelType === 'email'">
          <el-row :gutter="20">
            <el-col :span="16">
              <el-form-item label="SMTP 服务器" required>
                <el-input v-model="configData.smtpHost" placeholder="smtp.gmail.com">
                  <template #prefix>
                    <el-icon><Monitor /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="端口" required>
                <el-input-number
                  v-model="configData.smtpPort"
                  :min="1"
                  :max="65535"
                  placeholder="465"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <div class="form-help" style="margin-top: -12px; margin-bottom: 18px">
            常用端口：465（SSL）、587（TLS）、25（无加密）
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名" required>
                <el-input v-model="configData.username" placeholder="邮箱用户名">
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="密码/授权码" required>
                <el-input
                  v-model="configData.password"
                  placeholder="密码"
                  type="password"
                  show-password
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="form-help" style="margin-top: -12px; margin-bottom: 18px">
            Gmail 等邮箱需要使用应用专用密码
          </div>
          <el-form-item label="发件人邮箱">
            <el-input v-model="configData.fromEmail" placeholder="noreply@example.com（选填）">
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="SSL 加密">
            <el-switch v-model="configData.useSSL" active-text="启用" inactive-text="禁用" />
            <span class="form-help" style="margin-left: 12px"> 建议开启以提高安全性 </span>
          </el-form-item>
        </template>

        <!-- Webhook配置 -->
        <template v-if="form.channelType === 'webhook'">
          <el-form-item label="Webhook URL" required>
            <el-input v-model="configData.url" placeholder="https://api.example.com/webhook">
              <template #prefix>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="请求方法">
                <el-select v-model="configData.method" style="width: 100%">
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                  <el-option label="PUT" value="PUT" />
                  <el-option label="PATCH" value="PATCH" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="认证方式">
                <el-select v-model="configData.authType" style="width: 100%">
                  <el-option label="无认证" value="none" />
                  <el-option label="Basic 认证" value="basic" />
                  <el-option label="Bearer Token" value="bearer" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <template v-if="configData.authType === 'basic'">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="用户名">
                  <el-input v-model="configData.username" placeholder="用户名">
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="密码">
                  <el-input
                    v-model="configData.password"
                    placeholder="密码"
                    type="password"
                    show-password
                  >
                    <template #prefix>
                      <el-icon><Lock /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </template>
          <template v-if="configData.authType === 'bearer'">
            <el-form-item label="Token">
              <el-input
                v-model="configData.token"
                placeholder="Bearer Token"
                type="password"
                show-password
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </template>
        </template>

        <!-- 站内信配置 -->
        <template v-if="form.channelType === 'site_message'">
          <el-alert
            title="站内信为系统内置渠道"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 16px"
          >
            <template #default>
              站内信通过系统内部消息推送，无需额外配置。消息将直接发送到用户的站内消息中心。
            </template>
          </el-alert>
        </template>
      </div>

      <!-- 高级配置 -->
      <div class="form-section">
        <div class="section-header">
          <el-icon class="section-icon"><Tools /></el-icon>
          <span class="section-title">高级配置</span>
        </div>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="重试次数">
              <el-input-number
                v-model="form.retryTimes"
                :min="0"
                :max="10"
                style="width: 100%"
                controls-position="right"
              />
              <div class="form-help">发送失败时重试</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="超时时间（秒）">
              <el-input-number
                v-model="form.timeout"
                :min="1"
                :max="300"
                style="width: 100%"
                controls-position="right"
              />
              <div class="form-help">请求超时时间</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="速率限制">
              <el-input-number
                v-model="form.rateLimit"
                :min="0"
                :max="1000"
                style="width: 100%"
                controls-position="right"
              />
              <div class="form-help">次/分钟，0 无限</div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" size="large"> 取消 </el-button>
        <el-button
          type="success"
          :loading="testLoading"
          @click="handleTestConnection"
          size="large"
          :disabled="!canTest"
        >
          <el-icon v-if="!testLoading"><Connection /></el-icon>
          {{ testLoading ? '测试中...' : '测试连接' }}
        </el-button>
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
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import {
    Link,
    Key,
    User,
    Lock,
    Edit,
    Document,
    Setting,
    Tools,
    Monitor,
    Message,
    Connection,
    Check
  } from '@element-plus/icons-vue'
  import {
    getAlertChannelsByIdApi,
    addAlertChannelsApi,
    updateAlertChannelsApi,
    testLinkApi,
    type AddAlertChannelsRequest,
    type UpdateAlertChannelsRequest
  } from '@/api/portal/alert'
  import { channelTypes, getChannelTypeName, getChannelConfigTemplate } from './channel-helper'

  interface Props {
    modelValue: boolean
    channelId?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'success'])

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const title = computed(() => (props.channelId ? '编辑告警渠道' : '新增告警渠道'))

  const formRef = ref<FormInstance>()
  const submitLoading = ref(false)
  const testLoading = ref(false)

  const form = reactive<Partial<UpdateAlertChannelsRequest>>({
    channelName: '',
    channelType: '',
    description: '',
    retryTimes: 3,
    timeout: 30,
    rateLimit: 0
  })

  const formRules = reactive<FormRules>({
    channelName: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
    channelType: [{ required: true, message: '请选择渠道类型', trigger: 'change' }]
  })

  const configData = reactive<Record<string, any>>({})

  // 渠道类型选项（新增时过滤掉站内信）
  const availableChannelTypes = computed(() => {
    if (props.channelId) {
      return channelTypes
    }
    return channelTypes.filter((type) => type.value !== 'site_message')
  })

  // 判断是否可以测试连接
  const canTest = computed(() => {
    if (!form.channelType) return false

    if (form.channelType === 'site_message') return false

    if (['dingtalk', 'wechat', 'feishu'].includes(form.channelType)) {
      return !!configData.webhook && configData.webhook.trim() !== ''
    }
    if (form.channelType === 'email') {
      return !!(
        configData.smtpHost &&
        configData.smtpHost.trim() !== '' &&
        configData.smtpPort &&
        configData.username &&
        configData.username.trim() !== '' &&
        configData.password &&
        configData.password.trim() !== ''
      )
    }
    if (form.channelType === 'sms') {
      return true // 短信配置需要根据实际字段判断
    }
    if (form.channelType === 'webhook') {
      return !!(configData.url && configData.url.trim() !== '')
    }
    return false
  })

  // 获取渠道标签类型
  const getChannelTagType = (type: string) => {
    const typeMap: Record<string, any> = {
      dingtalk: 'primary',
      wechat: 'success',
      feishu: 'info',
      email: 'danger',
      sms: 'warning',
      voice_call: 'info',
      webhook: 'success',
      site_message: 'info'
    }
    return typeMap[type] || 'info'
  }

  // 加载数据
  const loadData = async () => {
    if (!props.channelId) return

    try {
      const res = await getAlertChannelsByIdApi(props.channelId)
      form.id = res.id
      form.channelName = res.channelName
      form.channelType = res.channelType
      form.description = res.description
      form.retryTimes = res.retryTimes
      form.timeout = res.timeout
      form.rateLimit = res.rateLimit

      try {
        const config = JSON.parse(res.config)
        Object.assign(configData, config)
      } catch (error) {
        console.error('解析配置失败', error)
      }
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  // 渠道类型变化
  const handleChannelTypeChange = () => {
    const template = getChannelConfigTemplate(form.channelType!)
    Object.keys(configData).forEach((key) => delete configData[key])
    Object.assign(configData, template)
  }

  // 测试连接
  const handleTestConnection = async () => {
    if (!form.channelType) {
      ElMessage.warning('请先选择渠道类型')
      return
    }

    // 判断是否需要输入接收人（邮件和短信需要）
    const needRecipients = ['email', 'sms'].includes(form.channelType)

    let toNotifys: string[] = []

    if (needRecipients) {
      try {
        const inputType = form.channelType === 'email' ? '邮箱地址' : '手机号码'
        const placeholder =
          form.channelType === 'email'
            ? '请输入邮箱地址，多个用逗号分隔'
            : '请输入手机号码，多个用逗号分隔'

        const { value } = await ElMessageBox.prompt(`请输入测试${inputType}`, '测试连接', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: placeholder,
          inputValidator: (value) => {
            if (!value || !value.trim()) {
              return `请输入${inputType}`
            }
            return true
          }
        })

        // 分割并清理空格
        toNotifys = value
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item)

        if (toNotifys.length === 0) {
          ElMessage.warning(`请输入有效的${inputType}`)
          return
        }
      } catch (error) {
        // 用户取消了输入
        return
      }
    }

    testLoading.value = true
    try {
      // 组装配置
      const config: Record<string, any> = {}
      Object.keys(configData).forEach((key) => {
        if (configData[key] !== '' && configData[key] !== null && configData[key] !== undefined) {
          config[key] = configData[key]
        }
      })

      await testLinkApi({
        channelType: form.channelType!,
        config: JSON.stringify(config),
        toNotifys: toNotifys
      })

      ElMessage.success({
        message: '✓ 连接测试成功！渠道配置正常',
        duration: 3000
      })
    } catch (error) {
      console.error('连接测试失败', error)
    } finally {
      testLoading.value = false
    }
  }

  // 关闭对话框
  const handleClose = () => {
    formRef.value?.resetFields()
    form.id = undefined
    form.channelName = ''
    form.channelType = ''
    form.description = ''
    form.retryTimes = 3
    form.timeout = 30
    form.rateLimit = 0
    Object.keys(configData).forEach((key) => delete configData[key])
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
    } catch (error) {
      return
    }

    // 额外验证配置字段
    if (
      form.channelType === 'dingtalk' ||
      form.channelType === 'wechat' ||
      form.channelType === 'feishu'
    ) {
      if (!configData.webhook || configData.webhook.trim() === '') {
        ElMessage.error('请输入Webhook地址')
        return
      }
    } else if (form.channelType === 'email') {
      if (!configData.smtpHost || configData.smtpHost.trim() === '') {
        ElMessage.error('请输入SMTP服务器地址')
        return
      }
      if (!configData.smtpPort) {
        ElMessage.error('请输入SMTP端口')
        return
      }
      if (!configData.username || configData.username.trim() === '') {
        ElMessage.error('请输入用户名')
        return
      }
      if (!configData.password || configData.password.trim() === '') {
        ElMessage.error('请输入密码')
        return
      }
    } else if (form.channelType === 'webhook') {
      if (!configData.url || configData.url.trim() === '') {
        ElMessage.error('请输入Webhook URL')
        return
      }
    }

    submitLoading.value = true
    try {
      // 组装配置
      const config: Record<string, any> = {}
      Object.keys(configData).forEach((key) => {
        if (configData[key] !== '' && configData[key] !== null && configData[key] !== undefined) {
          config[key] = configData[key]
        }
      })
      form.config = JSON.stringify(config)

      if (form.id) {
        await updateAlertChannelsApi(form as UpdateAlertChannelsRequest)
        ElMessage.success('更新成功')
      } else {
        await addAlertChannelsApi(form as AddAlertChannelsRequest)
        ElMessage.success('新增成功')
      }

      visible.value = false
      emit('success')
    } catch (error) {
      console.error(form.id ? '更新失败' : '新增失败', error)
    } finally {
      submitLoading.value = false
    }
  }

  watch(
    () => props.channelId,
    () => {
      if (visible.value && props.channelId) {
        loadData()
      }
    },
    { immediate: true }
  )

  watch(
    () => visible.value,
    (newVal) => {
      if (newVal && props.channelId) {
        loadData()
      }
    }
  )
</script>

<style scoped lang="scss">
  .channel-form-dialog {
    :deep(.el-dialog__header) {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #ebeef5;
      margin: 0;
    }

    :deep(.el-dialog__body) {
      padding: 24px;
      max-height: 65vh;
      overflow-y: auto;
    }

    :deep(.el-dialog__footer) {
      padding: 16px 24px;
      border-top: 1px solid #ebeef5;
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #606266;
      margin-bottom: 8px;
    }
  }

  .channel-form {
    .form-section {
      margin-bottom: 28px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #ebeef5;

        .section-icon {
          font-size: 18px;
          color: #409eff;
        }

        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }
      }

      .form-help {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
        line-height: 1.5;
      }
    }

    .select-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;

      .option-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
    }

    :deep(.el-input-number) {
      .el-input__inner {
        text-align: left;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
