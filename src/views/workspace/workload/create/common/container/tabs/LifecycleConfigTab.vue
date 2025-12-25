<template>
  <div class="lifecycle-config">
    <!-- 功能说明 -->
    <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 20px">
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px">
          <Info :size="16" />
          生命周期钩子说明
        </div>
      </template>
      <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 13px; line-height: 22px">
        <li><strong>PostStart</strong>：容器创建后立即执行，可用于初始化配置或通知</li>
        <li><strong>PreStop</strong>：容器终止前执行，可用于优雅关闭或清理资源</li>
        <li>钩子执行失败会影响容器的生命周期，请确保命令正确</li>
      </ul>
    </ElAlert>

    <!-- PostStart 钩子 -->
    <div class="lifecycle-section">
      <div class="section-header">
        <div class="header-left">
          <Play :size="20" class="section-icon" />
          <div>
            <h4>启动后钩子 (PostStart)</h4>
            <p class="section-desc">容器创建后立即执行</p>
          </div>
        </div>
        <ElSwitch v-model="postStartEnabled" @change="handlePostStartToggle" />
      </div>

      <div v-if="postStartEnabled" class="lifecycle-content">
        <div class="hook-type-selector">
          <div class="selector-label">执行方式：</div>
          <ElRadioGroup v-model="postStartType" @change="updatePostStartHook">
            <ElRadioButton value="exec">执行命令</ElRadioButton>
            <ElRadioButton value="httpGet">HTTP 请求</ElRadioButton>
            <ElRadioButton value="tcpSocket">TCP 连接</ElRadioButton>
          </ElRadioGroup>
        </div>

        <!-- 执行命令 -->
        <template v-if="postStartType === 'exec'">
          <ElForm label-width="120px" style="margin-top: 16px">
            <ElFormItem label="执行命令">
              <ElInput
                v-model="postStartConfig.exec.commandStr"
                type="textarea"
                :rows="5"
                placeholder="每行一个命令参数，例如：&#10;/bin/sh&#10;-c&#10;echo 'Container started'"
                @input="updatePostStartHook"
              />
              <div class="field-hint">每行代表一个命令参数</div>
            </ElFormItem>
          </ElForm>

          <!-- 快速模板 -->
          <div class="quick-templates">
            <div class="templates-title">快速模板：</div>
            <ElSpace wrap>
              <ElButton size="small" @click="applyPostStartTemplate('init')">
                初始化脚本
              </ElButton>
              <ElButton size="small" @click="applyPostStartTemplate('notify')">
                发送通知
              </ElButton>
            </ElSpace>
          </div>
        </template>

        <!-- HTTP 请求 -->
        <template v-if="postStartType === 'httpGet'">
          <ElForm label-width="120px" style="margin-top: 16px">
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="请求路径">
                  <ElInput
                    v-model="postStartConfig.httpGet.path"
                    placeholder="/hooks/poststart"
                    @input="updatePostStartHook"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="端口">
                  <ElInputNumber
                    v-model="postStartConfig.httpGet.port"
                    :min="1"
                    :max="65535"
                    style="width: 100%"
                    @change="updatePostStartHook"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="协议">
                  <ElSelect
                    v-model="postStartConfig.httpGet.scheme"
                    style="width: 100%"
                    @change="updatePostStartHook"
                  >
                    <ElOption label="HTTP" value="HTTP" />
                    <ElOption label="HTTPS" value="HTTPS" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="主机名(可选)">
                  <ElInput
                    v-model="postStartConfig.httpGet.host"
                    placeholder="默认使用 Pod IP"
                    @input="updatePostStartHook"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </template>

        <!-- TCP 连接 -->
        <template v-if="postStartType === 'tcpSocket'">
          <ElForm label-width="120px" style="margin-top: 16px">
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="端口">
                  <ElInputNumber
                    v-model="postStartConfig.tcpSocket.port"
                    :min="1"
                    :max="65535"
                    style="width: 100%"
                    @change="updatePostStartHook"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="主机名(可选)">
                  <ElInput
                    v-model="postStartConfig.tcpSocket.host"
                    placeholder="默认使用 Pod IP"
                    @input="updatePostStartHook"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </template>
      </div>
    </div>

    <ElDivider />

    <!-- PreStop 钩子 -->
    <div class="lifecycle-section">
      <div class="section-header">
        <div class="header-left">
          <StopCircle :size="20" class="section-icon" />
          <div>
            <h4>停止前钩子 (PreStop)</h4>
            <p class="section-desc">容器终止前执行</p>
          </div>
        </div>
        <ElSwitch v-model="preStopEnabled" @change="handlePreStopToggle" />
      </div>

      <div v-if="preStopEnabled" class="lifecycle-content">
        <div class="hook-type-selector">
          <div class="selector-label">执行方式：</div>
          <ElRadioGroup v-model="preStopType" @change="updatePreStopHook">
            <ElRadioButton value="exec">执行命令</ElRadioButton>
            <ElRadioButton value="httpGet">HTTP 请求</ElRadioButton>
            <ElRadioButton value="tcpSocket">TCP 连接</ElRadioButton>
          </ElRadioGroup>
        </div>

        <!-- 执行命令 -->
        <template v-if="preStopType === 'exec'">
          <ElForm label-width="120px" style="margin-top: 16px">
            <ElFormItem label="执行命令">
              <ElInput
                v-model="preStopConfig.exec.commandStr"
                type="textarea"
                :rows="5"
                placeholder="每行一个命令参数，例如：&#10;/bin/sh&#10;-c&#10;nginx -s quit; sleep 10"
                @input="updatePreStopHook"
              />
              <div class="field-hint">每行代表一个命令参数</div>
            </ElFormItem>
          </ElForm>

          <!-- 快速模板 -->
          <div class="quick-templates">
            <div class="templates-title">快速模板：</div>
            <ElSpace wrap>
              <ElButton size="small" @click="applyPreStopTemplate('graceful')">
                Nginx 优雅关闭
              </ElButton>
              <ElButton size="small" @click="applyPreStopTemplate('cleanup')">
                清理资源
              </ElButton>
            </ElSpace>
          </div>
        </template>

        <!-- HTTP 请求 -->
        <template v-if="preStopType === 'httpGet'">
          <ElForm label-width="120px" style="margin-top: 16px">
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="请求路径">
                  <ElInput
                    v-model="preStopConfig.httpGet.path"
                    placeholder="/hooks/prestop"
                    @input="updatePreStopHook"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="端口">
                  <ElInputNumber
                    v-model="preStopConfig.httpGet.port"
                    :min="1"
                    :max="65535"
                    style="width: 100%"
                    @change="updatePreStopHook"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="协议">
                  <ElSelect
                    v-model="preStopConfig.httpGet.scheme"
                    style="width: 100%"
                    @change="updatePreStopHook"
                  >
                    <ElOption label="HTTP" value="HTTP" />
                    <ElOption label="HTTPS" value="HTTPS" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="主机名(可选)">
                  <ElInput
                    v-model="preStopConfig.httpGet.host"
                    placeholder="默认使用 Pod IP"
                    @input="updatePreStopHook"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </template>

        <!-- TCP 连接 -->
        <template v-if="preStopType === 'tcpSocket'">
          <ElForm label-width="120px" style="margin-top: 16px">
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="端口">
                  <ElInputNumber
                    v-model="preStopConfig.tcpSocket.port"
                    :min="1"
                    :max="65535"
                    style="width: 100%"
                    @change="updatePreStopHook"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="主机名(可选)">
                  <ElInput
                    v-model="preStopConfig.tcpSocket.host"
                    placeholder="默认使用 Pod IP"
                    @input="updatePreStopHook"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useContainersStore } from '@/store/workload'
import { Play, StopCircle, Info } from 'lucide-vue-next'
import type { V1LifecycleHandler } from '@kubernetes/client-node'
import { ElMessage } from 'element-plus'

const containersStore = useContainersStore()

// 获取当前容器
const container = computed(() => containersStore.selectedContainer)

// PostStart 钩子
const postStartEnabled = ref(false)
const postStartType = ref<'exec' | 'httpGet' | 'tcpSocket'>('exec')
const postStartConfig = ref({
  exec: { commandStr: '' },
  httpGet: { path: '/hooks/poststart', port: 8080, scheme: 'HTTP', host: '' },
  tcpSocket: { port: 8080, host: '' }
})

// PreStop 钩子
const preStopEnabled = ref(false)
const preStopType = ref<'exec' | 'httpGet' | 'tcpSocket'>('exec')
const preStopConfig = ref({
  exec: { commandStr: '' },
  httpGet: { path: '/hooks/prestop', port: 8080, scheme: 'HTTP', host: '' },
  tcpSocket: { port: 8080, host: '' }
})

// 从容器加载配置
watch(
  () => container.value,
  (newContainer) => {
    if (newContainer && newContainer.lifecycle) {
      // PostStart
      if (newContainer.lifecycle.postStart) {
        postStartEnabled.value = true
        loadHookConfig(
          newContainer.lifecycle.postStart,
          postStartType,
          postStartConfig.value
        )
      }

      // PreStop
      if (newContainer.lifecycle.preStop) {
        preStopEnabled.value = true
        loadHookConfig(newContainer.lifecycle.preStop, preStopType, preStopConfig.value)
      }
    }
  },
  { immediate: true }
)

// 加载钩子配置
function loadHookConfig(hook: V1LifecycleHandler, typeRef: any, configRef: any) {
  if (hook.exec) {
    typeRef.value = 'exec'
    configRef.exec.commandStr = (hook.exec.command || []).join('\n')
  } else if (hook.httpGet) {
    typeRef.value = 'httpGet'
    configRef.httpGet = {
      path: hook.httpGet.path || '/',
      port: hook.httpGet.port || 80,
      scheme: hook.httpGet.scheme || 'HTTP',
      host: hook.httpGet.host || ''
    }
  } else if (hook.tcpSocket) {
    typeRef.value = 'tcpSocket'
    configRef.tcpSocket = {
      port: hook.tcpSocket.port || 80,
      host: hook.tcpSocket.host || ''
    }
  }
}

// 处理开关
function handlePostStartToggle() {
  updatePostStartHook()
}

function handlePreStopToggle() {
  updatePreStopHook()
}

// 更新钩子
function updatePostStartHook() {
  if (!container.value) return

  const lifecycle: any = {}

  if (postStartEnabled.value) {
    lifecycle.postStart = buildHook(postStartType.value, postStartConfig.value)
  }

  if (preStopEnabled.value && container.value.lifecycle?.preStop) {
    lifecycle.preStop = container.value.lifecycle.preStop
  }

  containersStore.updateContainer(container.value.id, {
    lifecycle: Object.keys(lifecycle).length > 0 ? lifecycle : undefined
  })
}

function updatePreStopHook() {
  if (!container.value) return

  const lifecycle: any = {}

  if (postStartEnabled.value && container.value.lifecycle?.postStart) {
    lifecycle.postStart = container.value.lifecycle.postStart
  }

  if (preStopEnabled.value) {
    lifecycle.preStop = buildHook(preStopType.value, preStopConfig.value)
  }

  containersStore.updateContainer(container.value.id, {
    lifecycle: Object.keys(lifecycle).length > 0 ? lifecycle : undefined
  })
}

// 构建钩子对象
function buildHook(type: string, config: any): V1LifecycleHandler {
  const hook: any = {}

  if (type === 'exec') {
    hook.exec = {
      command: config.exec.commandStr
        .split('\n')
        .map((s: string) => s.trim())
        .filter((s: string) => s)
    }
  } else if (type === 'httpGet') {
    hook.httpGet = {
      path: config.httpGet.path,
      port: config.httpGet.port,
      scheme: config.httpGet.scheme
    }
    if (config.httpGet.host) {
      hook.httpGet.host = config.httpGet.host
    }
  } else if (type === 'tcpSocket') {
    hook.tcpSocket = { port: config.tcpSocket.port }
    if (config.tcpSocket.host) {
      hook.tcpSocket.host = config.tcpSocket.host
    }
  }

  return hook
}

// 应用 PostStart 模板
function applyPostStartTemplate(template: string) {
  if (template === 'init') {
    postStartConfig.value.exec.commandStr = '/bin/sh\n-c\necho "Container started" && sleep 2'
  } else if (template === 'notify') {
    postStartConfig.value.exec.commandStr =
      '/bin/sh\n-c\ncurl -X POST http://notify-service/api/notify'
  }
  updatePostStartHook()
  ElMessage.success('已应用模板')
}

// 应用 PreStop 模板
function applyPreStopTemplate(template: string) {
  if (template === 'graceful') {
    preStopConfig.value.exec.commandStr = '/bin/sh\n-c\nnginx -s quit; sleep 10'
  } else if (template === 'cleanup') {
    preStopConfig.value.exec.commandStr = '/bin/sh\n-c\nrm -rf /tmp/* && echo "Cleanup done"'
  }
  updatePreStopHook()
  ElMessage.success('已应用模板')
}
</script>

<style lang="scss" scoped>
.lifecycle-config {
  .lifecycle-section {
    margin-bottom: 24px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .header-left {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        .section-icon {
          color: #409eff;
          flex-shrink: 0;
          margin-top: 2px;
        }

        h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }

        .section-desc {
          margin: 0;
          font-size: 13px;
          color: #909399;
        }
      }
    }

    .lifecycle-content {
      padding: 16px;
      background: #fafbfc;
      border-radius: 8px;
      border: 1px solid #e4e7ed;

      .hook-type-selector {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        .selector-label {
          font-size: 14px;
          font-weight: 500;
          color: #606266;
        }
      }

      .field-hint {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }

      .quick-templates {
        margin-top: 16px;
        padding: 12px;
        background: #f0f9ff;
        border-radius: 6px;

        .templates-title {
          font-size: 13px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 8px;
        }
      }
    }
  }
}
</style>