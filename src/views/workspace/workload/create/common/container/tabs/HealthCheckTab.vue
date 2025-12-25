<template>
  <div class="health-check-tab">
    <ElAlert type="info" :closable="false" style="margin-bottom: 16px">
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px">
          <Info :size="16" />
          健康检查说明
        </div>
      </template>
      <ul style="margin: 4px 0 0; padding-left: 20px; font-size: 12px">
        <li
          >Liveness：检测容器运行状态，失败会重启 | Readiness：检测是否可接收流量 |
          Startup：检测应用启动状态</li
        >
      </ul>
    </ElAlert>

    <!-- Tab 标签区域 -->
    <div class="probe-tabs">
      <div
        class="probe-tab-item"
        :class="{ active: activeTab === 'liveness' }"
        @click="activeTab = 'liveness'"
      >
        <div class="tab-content">
          <CheckCircle :size="20" class="tab-icon" />
          <span class="tab-label">存活探针 (Liveness)</span>
        </div>
        <ElSwitch v-model="livenessEnabled" @change="handleLivenessToggle" @click.stop />
      </div>

      <div
        class="probe-tab-item"
        :class="{ active: activeTab === 'readiness' }"
        @click="activeTab = 'readiness'"
      >
        <div class="tab-content">
          <Zap :size="20" class="tab-icon" />
          <span class="tab-label">就绪探针 (Readiness)</span>
        </div>
        <ElSwitch v-model="readinessEnabled" @change="handleReadinessToggle" @click.stop />
      </div>

      <div
        class="probe-tab-item"
        :class="{ active: activeTab === 'startup' }"
        @click="activeTab = 'startup'"
      >
        <div class="tab-content">
          <Activity :size="20" class="tab-icon" />
          <span class="tab-label">启动探针 (Startup)</span>
        </div>
        <ElSwitch v-model="startupEnabled" @change="handleStartupToggle" @click.stop />
      </div>
    </div>

    <!-- Tab 内容区域 -->
    <div class="probe-content-container">
      <!-- 存活探针 -->
      <div v-show="activeTab === 'liveness'" class="probe-panel">
        <div v-if="!livenessEnabled" class="empty-state">
          <div class="empty-icon">
            <CheckCircle :size="48" />
          </div>
          <p class="empty-text">就绪探针未启用，请点击上方开关启用</p>
        </div>
        <div v-else class="probe-config">
          <div class="probe-type-selector">
            <div class="selector-label">探针类型：</div>
            <ElRadioGroup v-model="livenessType" @change="updateLivenessProbe">
              <ElRadioButton value="httpGet">HTTP 请求</ElRadioButton>
              <ElRadioButton value="tcpSocket">TCP 端口</ElRadioButton>
              <ElRadioButton value="exec">执行命令</ElRadioButton>
            </ElRadioGroup>
          </div>

          <!-- HTTP GET -->
          <template v-if="livenessType === 'httpGet'">
            <ElForm label-width="140px" style="margin-top: 16px">
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="请求路径">
                    <ElInput
                      v-model="livenessConfig.httpGet.path"
                      placeholder="/health"
                      @input="updateLivenessProbe"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="端口">
                    <ElInputNumber
                      v-model="livenessConfig.httpGet.port"
                      :min="1"
                      :max="65535"
                      style="width: 100%"
                      @change="updateLivenessProbe"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="协议">
                    <ElSelect
                      v-model="livenessConfig.httpGet.scheme"
                      style="width: 100%"
                      @change="updateLivenessProbe"
                    >
                      <ElOption label="HTTP" value="HTTP" />
                      <ElOption label="HTTPS" value="HTTPS" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="主机名(可选)">
                    <ElInput
                      v-model="livenessConfig.httpGet.host"
                      placeholder="默认使用 Pod IP"
                      @input="updateLivenessProbe"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </template>

          <!-- TCP Socket -->
          <template v-if="livenessType === 'tcpSocket'">
            <ElForm label-width="140px" style="margin-top: 16px">
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="端口">
                    <ElInputNumber
                      v-model="livenessConfig.tcpSocket.port"
                      :min="1"
                      :max="65535"
                      style="width: 100%"
                      @change="updateLivenessProbe"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="主机名(可选)">
                    <ElInput
                      v-model="livenessConfig.tcpSocket.host"
                      placeholder="默认使用 Pod IP"
                      @input="updateLivenessProbe"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </template>

          <!-- Exec -->
          <template v-if="livenessType === 'exec'">
            <ElForm label-width="140px" style="margin-top: 16px">
              <ElFormItem label="执行命令">
                <ElInput
                  v-model="livenessConfig.exec.commandStr"
                  type="textarea"
                  :rows="3"
                  placeholder="每行一个命令参数，例如：&#10;cat&#10;/tmp/healthy"
                  @input="updateLivenessProbe"
                />
                <div class="field-hint">每行代表一个命令参数</div>
              </ElFormItem>
            </ElForm>
          </template>

          <!-- 探针参数 -->
          <ElDivider>探针参数</ElDivider>
          <ElForm label-width="140px">
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="初始延迟(秒)">
                  <ElInputNumber
                    v-model="livenessConfig.params.initialDelaySeconds"
                    :min="0"
                    :max="3600"
                    style="width: 100%"
                    @change="updateLivenessProbe"
                  />
                  <div class="field-hint">容器启动后多久开始探测</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="探测周期(秒)">
                  <ElInputNumber
                    v-model="livenessConfig.params.periodSeconds"
                    :min="1"
                    :max="3600"
                    style="width: 100%"
                    @change="updateLivenessProbe"
                  />
                  <div class="field-hint">多久探测一次</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="超时时间(秒)">
                  <ElInputNumber
                    v-model="livenessConfig.params.timeoutSeconds"
                    :min="1"
                    :max="3600"
                    style="width: 100%"
                    @change="updateLivenessProbe"
                  />
                  <div class="field-hint">探测超时时间</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="失败阈值(次)">
                  <ElInputNumber
                    v-model="livenessConfig.params.failureThreshold"
                    :min="1"
                    :max="100"
                    style="width: 100%"
                    @change="updateLivenessProbe"
                  />
                  <div class="field-hint">连续失败多少次算不健康</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </div>
      </div>

      <!-- 就绪探针 -->
      <div v-show="activeTab === 'readiness'" class="probe-panel">
        <div v-if="!readinessEnabled" class="empty-state">
          <div class="empty-icon">
            <Zap :size="48" />
          </div>
          <p class="empty-text">就绪探针未启用，请点击上方开关启用</p>
        </div>
        <div v-else class="probe-config">
          <div class="probe-type-selector">
            <div class="selector-label">探针类型：</div>
            <ElRadioGroup v-model="readinessType" @change="updateReadinessProbe">
              <ElRadioButton value="httpGet">HTTP 请求</ElRadioButton>
              <ElRadioButton value="tcpSocket">TCP 端口</ElRadioButton>
              <ElRadioButton value="exec">执行命令</ElRadioButton>
            </ElRadioGroup>
          </div>

          <!-- HTTP GET -->
          <template v-if="readinessType === 'httpGet'">
            <ElForm label-width="140px" style="margin-top: 16px">
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="请求路径">
                    <ElInput
                      v-model="readinessConfig.httpGet.path"
                      placeholder="/ready"
                      @input="updateReadinessProbe"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="端口">
                    <ElInputNumber
                      v-model="readinessConfig.httpGet.port"
                      :min="1"
                      :max="65535"
                      style="width: 100%"
                      @change="updateReadinessProbe"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="协议">
                    <ElSelect
                      v-model="readinessConfig.httpGet.scheme"
                      style="width: 100%"
                      @change="updateReadinessProbe"
                    >
                      <ElOption label="HTTP" value="HTTP" />
                      <ElOption label="HTTPS" value="HTTPS" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="主机名(可选)">
                    <ElInput
                      v-model="readinessConfig.httpGet.host"
                      placeholder="默认使用 Pod IP"
                      @input="updateReadinessProbe"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </template>

          <!-- TCP Socket -->
          <template v-if="readinessType === 'tcpSocket'">
            <ElForm label-width="140px" style="margin-top: 16px">
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="端口">
                    <ElInputNumber
                      v-model="readinessConfig.tcpSocket.port"
                      :min="1"
                      :max="65535"
                      style="width: 100%"
                      @change="updateReadinessProbe"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="主机名(可选)">
                    <ElInput
                      v-model="readinessConfig.tcpSocket.host"
                      placeholder="默认使用 Pod IP"
                      @input="updateReadinessProbe"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </template>

          <!-- Exec -->
          <template v-if="readinessType === 'exec'">
            <ElForm label-width="140px" style="margin-top: 16px">
              <ElFormItem label="执行命令">
                <ElInput
                  v-model="readinessConfig.exec.commandStr"
                  type="textarea"
                  :rows="3"
                  placeholder="每行一个命令参数，例如：&#10;cat&#10;/tmp/ready"
                  @input="updateReadinessProbe"
                />
                <div class="field-hint">每行代表一个命令参数</div>
              </ElFormItem>
            </ElForm>
          </template>

          <!-- 探针参数 -->
          <ElDivider>探针参数</ElDivider>
          <ElForm label-width="140px">
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="初始延迟(秒)">
                  <ElInputNumber
                    v-model="readinessConfig.params.initialDelaySeconds"
                    :min="0"
                    :max="3600"
                    style="width: 100%"
                    @change="updateReadinessProbe"
                  />
                  <div class="field-hint">容器启动后多久开始探测</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="探测周期(秒)">
                  <ElInputNumber
                    v-model="readinessConfig.params.periodSeconds"
                    :min="1"
                    :max="3600"
                    style="width: 100%"
                    @change="updateReadinessProbe"
                  />
                  <div class="field-hint">多久探测一次</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="超时时间(秒)">
                  <ElInputNumber
                    v-model="readinessConfig.params.timeoutSeconds"
                    :min="1"
                    :max="3600"
                    style="width: 100%"
                    @change="updateReadinessProbe"
                  />
                  <div class="field-hint">探测超时时间</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="失败阈值(次)">
                  <ElInputNumber
                    v-model="readinessConfig.params.failureThreshold"
                    :min="1"
                    :max="100"
                    style="width: 100%"
                    @change="updateReadinessProbe"
                  />
                  <div class="field-hint">连续失败多少次算不健康</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </div>
      </div>

      <!-- 启动探针 -->
      <div v-show="activeTab === 'startup'" class="probe-panel">
        <div v-if="!startupEnabled" class="empty-state">
          <div class="empty-icon">
            <Activity :size="48" />
          </div>
          <p class="empty-text">就绪探针未启用，请点击上方开关启用</p>
        </div>
        <div v-else class="probe-config">
          <div class="probe-type-selector">
            <div class="selector-label">探针类型：</div>
            <ElRadioGroup v-model="startupType" @change="updateStartupProbe">
              <ElRadioButton value="httpGet">HTTP 请求</ElRadioButton>
              <ElRadioButton value="tcpSocket">TCP 端口</ElRadioButton>
              <ElRadioButton value="exec">执行命令</ElRadioButton>
            </ElRadioGroup>
          </div>

          <!-- HTTP GET -->
          <template v-if="startupType === 'httpGet'">
            <ElForm label-width="140px" style="margin-top: 16px">
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="请求路径">
                    <ElInput
                      v-model="startupConfig.httpGet.path"
                      placeholder="/startup"
                      @input="updateStartupProbe"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="端口">
                    <ElInputNumber
                      v-model="startupConfig.httpGet.port"
                      :min="1"
                      :max="65535"
                      style="width: 100%"
                      @change="updateStartupProbe"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="协议">
                    <ElSelect
                      v-model="startupConfig.httpGet.scheme"
                      style="width: 100%"
                      @change="updateStartupProbe"
                    >
                      <ElOption label="HTTP" value="HTTP" />
                      <ElOption label="HTTPS" value="HTTPS" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="主机名(可选)">
                    <ElInput
                      v-model="startupConfig.httpGet.host"
                      placeholder="默认使用 Pod IP"
                      @input="updateStartupProbe"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </template>

          <!-- TCP Socket -->
          <template v-if="startupType === 'tcpSocket'">
            <ElForm label-width="140px" style="margin-top: 16px">
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="端口">
                    <ElInputNumber
                      v-model="startupConfig.tcpSocket.port"
                      :min="1"
                      :max="65535"
                      style="width: 100%"
                      @change="updateStartupProbe"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="主机名(可选)">
                    <ElInput
                      v-model="startupConfig.tcpSocket.host"
                      placeholder="默认使用 Pod IP"
                      @input="updateStartupProbe"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </template>

          <!-- Exec -->
          <template v-if="startupType === 'exec'">
            <ElForm label-width="140px" style="margin-top: 16px">
              <ElFormItem label="执行命令">
                <ElInput
                  v-model="startupConfig.exec.commandStr"
                  type="textarea"
                  :rows="3"
                  placeholder="每行一个命令参数，例如：&#10;cat&#10;/tmp/started"
                  @input="updateStartupProbe"
                />
                <div class="field-hint">每行代表一个命令参数</div>
              </ElFormItem>
            </ElForm>
          </template>

          <!-- 探针参数 -->
          <ElDivider>探针参数</ElDivider>
          <ElForm label-width="140px">
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="初始延迟(秒)">
                  <ElInputNumber
                    v-model="startupConfig.params.initialDelaySeconds"
                    :min="0"
                    :max="3600"
                    style="width: 100%"
                    @change="updateStartupProbe"
                  />
                  <div class="field-hint">容器启动后多久开始探测</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="探测周期(秒)">
                  <ElInputNumber
                    v-model="startupConfig.params.periodSeconds"
                    :min="1"
                    :max="3600"
                    style="width: 100%"
                    @change="updateStartupProbe"
                  />
                  <div class="field-hint">多久探测一次</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElFormItem label="超时时间(秒)">
                  <ElInputNumber
                    v-model="startupConfig.params.timeoutSeconds"
                    :min="1"
                    :max="3600"
                    style="width: 100%"
                    @change="updateStartupProbe"
                  />
                  <div class="field-hint">探测超时时间</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="失败阈值(次)">
                  <ElInputNumber
                    v-model="startupConfig.params.failureThreshold"
                    :min="1"
                    :max="100"
                    style="width: 100%"
                    @change="updateStartupProbe"
                  />
                  <div class="field-hint">连续失败多少次算不健康</div>
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useContainersStore } from '@/store/workload'
  import { Info, Activity, CheckCircle, Zap } from 'lucide-vue-next'
  import type { V1Probe } from '@kubernetes/client-node'

  const containersStore = useContainersStore()

  // 当前激活的 Tab
  const activeTab = ref<'liveness' | 'readiness' | 'startup'>('liveness')

  // 获取当前容器
  const container = computed(() => containersStore.selectedContainer)

  // 存活探针
  const livenessEnabled = ref(false)
  const livenessType = ref<'httpGet' | 'tcpSocket' | 'exec'>('httpGet')
  const livenessConfig = ref({
    httpGet: { path: '/health', port: 80, scheme: 'HTTP', host: '' },
    tcpSocket: { port: 80, host: '' },
    exec: { commandStr: '' },
    params: {
      initialDelaySeconds: 10,
      periodSeconds: 10,
      timeoutSeconds: 1,
      failureThreshold: 3
    }
  })

  // 就绪探针
  const readinessEnabled = ref(false)
  const readinessType = ref<'httpGet' | 'tcpSocket' | 'exec'>('httpGet')
  const readinessConfig = ref({
    httpGet: { path: '/ready', port: 80, scheme: 'HTTP', host: '' },
    tcpSocket: { port: 80, host: '' },
    exec: { commandStr: '' },
    params: {
      initialDelaySeconds: 5,
      periodSeconds: 10,
      timeoutSeconds: 1,
      failureThreshold: 3
    }
  })

  // 启动探针
  const startupEnabled = ref(false)
  const startupType = ref<'httpGet' | 'tcpSocket' | 'exec'>('httpGet')
  const startupConfig = ref({
    httpGet: { path: '/startup', port: 80, scheme: 'HTTP', host: '' },
    tcpSocket: { port: 80, host: '' },
    exec: { commandStr: '' },
    params: {
      initialDelaySeconds: 0,
      periodSeconds: 10,
      timeoutSeconds: 1,
      failureThreshold: 30
    }
  })

  // 从容器加载配置
  watch(
    () => container.value,
    (newContainer) => {
      if (newContainer) {
        // 存活探针
        if (newContainer.livenessProbe) {
          livenessEnabled.value = true
          loadProbeConfig(newContainer.livenessProbe, livenessType, livenessConfig.value)
        }

        // 就绪探针
        if (newContainer.readinessProbe) {
          readinessEnabled.value = true
          loadProbeConfig(newContainer.readinessProbe, readinessType, readinessConfig.value)
        }

        // 启动探针
        if (newContainer.startupProbe) {
          startupEnabled.value = true
          loadProbeConfig(newContainer.startupProbe, startupType, startupConfig.value)
        }
      }
    },
    { immediate: true }
  )

  // 加载探针配置
  function loadProbeConfig(probe: V1Probe, typeRef: any, configRef: any) {
    if (probe.httpGet) {
      typeRef.value = 'httpGet'
      configRef.httpGet = {
        path: probe.httpGet.path || '/',
        port: probe.httpGet.port || 80,
        scheme: probe.httpGet.scheme || 'HTTP',
        host: probe.httpGet.host || ''
      }
    } else if (probe.tcpSocket) {
      typeRef.value = 'tcpSocket'
      configRef.tcpSocket = {
        port: probe.tcpSocket.port || 80,
        host: probe.tcpSocket.host || ''
      }
    } else if (probe.exec) {
      typeRef.value = 'exec'
      configRef.exec.commandStr = (probe.exec.command || []).join('\n')
    }

    configRef.params = {
      initialDelaySeconds: probe.initialDelaySeconds || 0,
      periodSeconds: probe.periodSeconds || 10,
      timeoutSeconds: probe.timeoutSeconds || 1,
      failureThreshold: probe.failureThreshold || 3
    }
  }

  // 处理开关
  function handleLivenessToggle() {
    updateLivenessProbe()
  }

  function handleReadinessToggle() {
    updateReadinessProbe()
  }

  function handleStartupToggle() {
    updateStartupProbe()
  }

  // 更新探针
  function updateLivenessProbe() {
    if (!container.value) return

    const probe: any = livenessEnabled.value
      ? buildProbe(livenessType.value, livenessConfig.value)
      : undefined

    containersStore.updateContainer(container.value.id, { livenessProbe: probe })
  }

  function updateReadinessProbe() {
    if (!container.value) return

    const probe: any = readinessEnabled.value
      ? buildProbe(readinessType.value, readinessConfig.value)
      : undefined

    containersStore.updateContainer(container.value.id, { readinessProbe: probe })
  }

  function updateStartupProbe() {
    if (!container.value) return

    const probe: any = startupEnabled.value
      ? buildProbe(startupType.value, startupConfig.value)
      : undefined

    containersStore.updateContainer(container.value.id, { startupProbe: probe })
  }

  // 构建探针对象
  function buildProbe(type: string, config: any): V1Probe {
    const probe: any = { ...config.params }

    if (type === 'httpGet') {
      probe.httpGet = {
        path: config.httpGet.path,
        port: config.httpGet.port,
        scheme: config.httpGet.scheme
      }
      if (config.httpGet.host) {
        probe.httpGet.host = config.httpGet.host
      }
    } else if (type === 'tcpSocket') {
      probe.tcpSocket = { port: config.tcpSocket.port }
      if (config.tcpSocket.host) {
        probe.tcpSocket.host = config.tcpSocket.host
      }
    } else if (type === 'exec') {
      probe.exec = {
        command: config.exec.commandStr
          .split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      }
    }

    return probe
  }
</script>

<style lang="scss" scoped>
  .health-check-tab {
    // Tab 标签区域
    .probe-tabs {
      display: flex;
      gap: 1px;
      background: #e4e7ed;
      border-radius: 8px 8px 0 0;
      overflow: hidden;
      margin-bottom: 0;

      .probe-tab-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background: #f5f7fa;
        cursor: pointer;
        transition: all 0.3s;
        border-bottom: 3px solid transparent;

        &:hover {
          background: #ecf5ff;
        }

        &.active {
          background: #fff;
          border-bottom-color: #409eff;

          .tab-icon {
            color: #409eff;
          }

          .tab-label {
            color: #303133;
            font-weight: 600;
          }
        }

        .tab-content {
          display: flex;
          align-items: center;
          gap: 8px;

          .tab-icon {
            color: #909399;
            flex-shrink: 0;
            transition: color 0.3s;
          }

          .tab-label {
            font-size: 14px;
            color: #606266;
            transition: all 0.3s;
          }
        }
      }
    }

    // Tab 内容区域
    .probe-content-container {
      background: #fff;
      border: 1px solid #e4e7ed;
      border-top: none;
      border-radius: 0 0 8px 8px;
      min-height: 400px;

      .probe-panel {
        padding: 24px;

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 350px;
          color: #909399;

          .empty-icon {
            margin-bottom: 16px;
            opacity: 0.3;

            :deep(svg) {
              width: 64px;
              height: 64px;
            }
          }

          .empty-text {
            font-size: 14px;
            color: #909399;
          }
        }

        .probe-config {
          .probe-type-selector {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: #f5f7fa;
            border-radius: 6px;

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
        }
      }
    }
  }
</style>
