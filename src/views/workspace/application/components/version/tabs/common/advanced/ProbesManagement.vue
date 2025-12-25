<template>
  <div class="probes-management">
    <!-- 容器选择 -->
    <div class="container-selector">
      <label>选择容器：</label>
      <ElSelect
        v-model="selectedContainer"
        placeholder="请选择容器"
        style="width: 240px"
        @change="handleContainerChange"
      >
        <ElOption
          v-for="container in containers"
          :key="container.containerName"
          :label="container.containerName"
          :value="container.containerName"
        >
          <div class="container-option">
            <span>{{ container.containerName }}</span>
            <div class="probe-badges">
              <ElTag v-if="container.livenessProbe" size="small" type="danger">Liveness</ElTag>
              <ElTag v-if="container.readinessProbe" size="small" type="success">Readiness</ElTag>
              <ElTag v-if="container.startupProbe" size="small" type="warning">Startup</ElTag>
            </div>
          </div>
        </ElOption>
      </ElSelect>

      <div class="selector-actions" v-if="selectedContainer">
        <ElButton v-if="!editing" type="primary" size="small" @click="startEdit">
          <Edit :size="14" />
          编辑
        </ElButton>
        <template v-else>
          <ElButton type="primary" size="small" :loading="saving" @click="handleSave">
            <Save :size="14" />
            保存
          </ElButton>
          <ElButton size="small" @click="handleCancel">取消</ElButton>
        </template>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" v-loading="loading" class="loading-wrapper"></div>

    <!-- 主内容 -->
    <div v-else-if="selectedContainer" class="config-wrapper">
      <!-- 探针类型切换 -->
      <div class="probe-type-selector">
        <ElRadioGroup v-model="activeProbeType" class="type-radio-group">
          <ElRadioButton value="liveness">
            <div class="radio-content">
              <Activity :size="16" />
              <span>存活探针</span>
              <ElSwitch
                v-model="livenessEnabled"
                :disabled="!editing"
                @click.stop
                @change="handleLivenessToggle"
              />
            </div>
          </ElRadioButton>
          <ElRadioButton value="readiness">
            <div class="radio-content">
              <CheckCircle :size="16" />
              <span>就绪探针</span>
              <ElSwitch
                v-model="readinessEnabled"
                :disabled="!editing"
                @click.stop
                @change="handleReadinessToggle"
              />
            </div>
          </ElRadioButton>
          <ElRadioButton value="startup">
            <div class="radio-content">
              <Zap :size="16" />
              <span>启动探针</span>
              <ElSwitch
                v-model="startupEnabled"
                :disabled="!editing"
                @click.stop
                @change="handleStartupToggle"
              />
            </div>
          </ElRadioButton>
        </ElRadioGroup>
      </div>

      <!-- 配置区域 -->
      <div class="config-content">
        <!-- 存活探针 -->
        <div v-show="activeProbeType === 'liveness'" class="config-section">
          <div v-if="!livenessEnabled" class="empty-state">
            <Activity :size="48" class="empty-icon" />
            <p class="empty-text">存活探针未启用</p>
            <ElButton v-if="editing" type="primary" @click="livenessEnabled = true">
              启用存活探针
            </ElButton>
          </div>
          <div v-else class="probe-config liveness-config">
            <ProbeConfigForm
              :editing="editing"
              v-model:probe-type="livenessType"
              v-model:http-config="livenessConfig.httpGet"
              v-model:tcp-config="livenessConfig.tcpSocket"
              v-model:exec-config="livenessConfig.exec"
              v-model:params="livenessConfig.params"
              @update:probe-type="updateLivenessProbe"
            />
          </div>
        </div>

        <!-- 就绪探针 -->
        <div v-show="activeProbeType === 'readiness'" class="config-section">
          <div v-if="!readinessEnabled" class="empty-state">
            <CheckCircle :size="48" class="empty-icon" />
            <p class="empty-text">就绪探针未启用</p>
            <ElButton v-if="editing" type="primary" @click="readinessEnabled = true">
              启用就绪探针
            </ElButton>
          </div>
          <div v-else class="probe-config readiness-config">
            <ProbeConfigForm
              :editing="editing"
              v-model:probe-type="readinessType"
              v-model:http-config="readinessConfig.httpGet"
              v-model:tcp-config="readinessConfig.tcpSocket"
              v-model:exec-config="readinessConfig.exec"
              v-model:params="readinessConfig.params"
              @update:probe-type="updateReadinessProbe"
            />
          </div>
        </div>

        <!-- 启动探针 -->
        <div v-show="activeProbeType === 'startup'" class="config-section">
          <div v-if="!startupEnabled" class="empty-state">
            <Zap :size="48" class="empty-icon" />
            <p class="empty-text">启动探针未启用</p>
            <ElButton v-if="editing" type="primary" @click="startupEnabled = true">
              启用启动探针
            </ElButton>
          </div>
          <div v-else class="probe-config startup-config">
            <ProbeConfigForm
              :editing="editing"
              v-model:probe-type="startupType"
              v-model:http-config="startupConfig.httpGet"
              v-model:tcp-config="startupConfig.tcpSocket"
              v-model:exec-config="startupConfig.exec"
              v-model:params="startupConfig.params"
              @update:probe-type="updateStartupProbe"
            />
          </div>
        </div>
      </div>
    </div>

    <ElEmpty v-else description="请选择一个容器" :image-size="80" />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Activity, CheckCircle, Zap, Edit, Save } from 'lucide-vue-next'
  import {
    getProbesApi,
    updateProbesApi,
    type OnecProjectVersion,
    type ContainerProbes,
    type Probe
  } from '@/api'
  import ProbeConfigForm from './probes/ProbeConfigForm.vue'

  interface Props {
    version: OnecProjectVersion
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  const loading = ref(false)
  const saving = ref(false)
  const editing = ref(false)
  const activeProbeType = ref<'liveness' | 'readiness' | 'startup'>('liveness')

  const containers = ref<ContainerProbes[]>([])
  const selectedContainer = ref('')

  // 存活探针
  const livenessEnabled = ref(false)
  const livenessType = ref<'httpGet' | 'tcpSocket' | 'exec'>('httpGet')
  const livenessConfig = reactive({
    httpGet: { path: '/health', port: 80, scheme: 'HTTP', host: '' },
    tcpSocket: { port: 80, host: '' },
    exec: { commandStr: '' },
    params: { initialDelaySeconds: 10, periodSeconds: 10, timeoutSeconds: 1, failureThreshold: 3 }
  })

  // 就绪探针
  const readinessEnabled = ref(false)
  const readinessType = ref<'httpGet' | 'tcpSocket' | 'exec'>('httpGet')
  const readinessConfig = reactive({
    httpGet: { path: '/ready', port: 80, scheme: 'HTTP', host: '' },
    tcpSocket: { port: 80, host: '' },
    exec: { commandStr: '' },
    params: { initialDelaySeconds: 5, periodSeconds: 10, timeoutSeconds: 1, failureThreshold: 3 }
  })

  // 启动探针
  const startupEnabled = ref(false)
  const startupType = ref<'httpGet' | 'tcpSocket' | 'exec'>('httpGet')
  const startupConfig = reactive({
    httpGet: { path: '/startup', port: 80, scheme: 'HTTP', host: '' },
    tcpSocket: { port: 80, host: '' },
    exec: { commandStr: '' },
    params: { initialDelaySeconds: 0, periodSeconds: 10, timeoutSeconds: 1, failureThreshold: 30 }
  })

  const originalProbes = ref<any>(null)

  const loadProbes = async () => {
    loading.value = true
    try {
      const response = await getProbesApi(props.version.id)
      containers.value = response.containers || []
      if (containers.value.length > 0 && !selectedContainer.value) {
        selectedContainer.value = containers.value[0].containerName
        updateCurrentProbes()
      }
    } catch (error) {
      console.error('[健康检查] 加载失败:', error)
    } finally {
      loading.value = false
    }
  }

  const updateCurrentProbes = () => {
    const container = containers.value.find((c) => c.containerName === selectedContainer.value)
    if (!container) return

    // 加载存活探针
    if (container.livenessProbe) {
      livenessEnabled.value = true
      loadProbeConfig(container.livenessProbe, 'liveness')
    } else {
      livenessEnabled.value = false
    }

    // 加载就绪探针
    if (container.readinessProbe) {
      readinessEnabled.value = true
      loadProbeConfig(container.readinessProbe, 'readiness')
    } else {
      readinessEnabled.value = false
    }

    // 加载启动探针
    if (container.startupProbe) {
      startupEnabled.value = true
      loadProbeConfig(container.startupProbe, 'startup')
    } else {
      startupEnabled.value = false
    }

    originalProbes.value = {
      liveness: livenessEnabled.value ? buildProbe('liveness') : null,
      readiness: readinessEnabled.value ? buildProbe('readiness') : null,
      startup: startupEnabled.value ? buildProbe('startup') : null
    }
  }

  const loadProbeConfig = (probe: Probe, probeKind: string) => {
    const config =
      probeKind === 'liveness'
        ? livenessConfig
        : probeKind === 'readiness'
          ? readinessConfig
          : startupConfig
    const typeRef =
      probeKind === 'liveness'
        ? livenessType
        : probeKind === 'readiness'
          ? readinessType
          : startupType

    if (probe.httpGet) {
      typeRef.value = 'httpGet'
      config.httpGet = {
        path: probe.httpGet.path || '/',
        port: probe.httpGet.port || 80,
        scheme: probe.httpGet.scheme || 'HTTP',
        host: probe.httpGet.host || ''
      }
    } else if (probe.tcpSocket) {
      typeRef.value = 'tcpSocket'
      config.tcpSocket = {
        port: probe.tcpSocket.port || 80,
        host: probe.tcpSocket.host || ''
      }
    } else if (probe.exec) {
      typeRef.value = 'exec'
      config.exec.commandStr = (probe.exec.command || []).join('\n')
    }

    config.params = {
      initialDelaySeconds: probe.initialDelaySeconds || 0,
      periodSeconds: probe.periodSeconds || 10,
      timeoutSeconds: probe.timeoutSeconds || 1,
      failureThreshold: probe.failureThreshold || 3
    }
  }

  const handleContainerChange = () => {
    updateCurrentProbes()
  }

  const startEdit = () => {
    editing.value = true
  }

  const handleLivenessToggle = () => {}
  const handleReadinessToggle = () => {}
  const handleStartupToggle = () => {}

  const updateLivenessProbe = () => {}
  const updateReadinessProbe = () => {}
  const updateStartupProbe = () => {}

  const buildProbe = (probeKind: string): Probe | null => {
    const config =
      probeKind === 'liveness'
        ? livenessConfig
        : probeKind === 'readiness'
          ? readinessConfig
          : startupConfig
    const type =
      probeKind === 'liveness'
        ? livenessType.value
        : probeKind === 'readiness'
          ? readinessType.value
          : startupType.value
    const enabled =
      probeKind === 'liveness'
        ? livenessEnabled.value
        : probeKind === 'readiness'
          ? readinessEnabled.value
          : startupEnabled.value

    if (!enabled) return null

    const probe: any = { ...config.params, type }

    if (type === 'httpGet') {
      probe.httpGet = {
        path: config.httpGet.path,
        port: config.httpGet.port,
        scheme: config.httpGet.scheme
      }
      if (config.httpGet.host) probe.httpGet.host = config.httpGet.host
    } else if (type === 'tcpSocket') {
      probe.tcpSocket = { port: config.tcpSocket.port }
      if (config.tcpSocket.host) probe.tcpSocket.host = config.tcpSocket.host
    } else if (type === 'exec') {
      probe.exec = {
        command: config.exec.commandStr
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s)
      }
    }

    return probe
  }

  const handleSave = async () => {
    if (!selectedContainer.value) return

    try {
      await ElMessageBox.confirm('确定要保存健康检查配置吗？', '确认保存', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      saving.value = true
      await updateProbesApi(props.version.id, {
        containerName: selectedContainer.value,
        livenessProbe: buildProbe('liveness') || undefined,
        readinessProbe: buildProbe('readiness') || undefined,
        startupProbe: buildProbe('startup') || undefined
      })

      ElMessage.success('健康检查配置保存成功')
      editing.value = false
      await loadProbes()
      emit('success')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('[健康检查] 保存失败:', error)
      }
    } finally {
      saving.value = false
    }
  }

  const handleCancel = () => {
    editing.value = false
    if (originalProbes.value) {
      updateCurrentProbes()
    }
  }

  // watch(
  //   () => props.refreshTrigger,
  //   (newVal) => {
  //     if (newVal && newVal > 0) {
  //       loadProbes()
  //     }
  //   }
  // )
  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        editing.value = false
        loadProbes()
      }
    }
  )
  onMounted(() => {
    loadProbes()
  })
  // 暴露给父组件的方法和属性
  defineExpose({
    editing,
    hasUnsavedChanges: () => {
      if (!editing.value) return false

      // 比较当前配置和原始配置
      const current = {
        liveness: livenessEnabled.value ? buildProbe('liveness') : null,
        readiness: readinessEnabled.value ? buildProbe('readiness') : null,
        startup: startupEnabled.value ? buildProbe('startup') : null
      }

      const currentStr = JSON.stringify(current)
      const originalStr = JSON.stringify(originalProbes.value)

      return currentStr !== originalStr
    }
  })
</script>

<style lang="scss" scoped>
  .probes-management {
    height: 100%;
    display: flex;
    flex-direction: column;

    .container-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #fff;
      border-bottom: 1px solid var(--el-border-color);
      flex-shrink: 0;

      label {
        font-weight: 500;
        color: #606266;
        font-size: 14px;
        flex-shrink: 0;
      }

      .container-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        .probe-badges {
          display: flex;
          gap: 4px;
        }
      }

      .selector-actions {
        margin-left: auto;
        display: flex;
        gap: 8px;

        :deep(.el-button) {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .loading-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .config-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 20px;

      .probe-type-selector {
        margin-bottom: 16px;

        .type-radio-group {
          width: 100%;
          display: flex;
          gap: 8px;

          :deep(.el-radio-button) {
            flex: 1;

            .el-radio-button__inner {
              width: 100%;
              padding: 12px 20px;
              border-radius: 8px;
              border: 2px solid #e4e7ed;

              &:hover {
                border-color: #409eff;
                color: #409eff;
              }
            }

            &.is-active .el-radio-button__inner {
              background: #409eff;
              border-color: #409eff;
              color: white;
              font-weight: 600;
            }
          }

          .radio-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;

            > span {
              flex: 1;
              text-align: left;
            }
          }
        }
      }

      .config-content {
        .config-section {
          min-height: 300px;

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            padding: 40px;

            .empty-icon {
              color: #c0c4cc;
              margin-bottom: 16px;
            }

            .empty-text {
              font-size: 14px;
              color: #909399;
              margin-bottom: 16px;
            }
          }

          .probe-config {
            padding: 20px;
            border-radius: 8px;

            &.liveness-config {
              background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
              border: 2px solid #ef4444;
            }

            &.readiness-config {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border: 2px solid #22c55e;
            }

            &.startup-config {
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              border: 2px solid #f59e0b;
            }
          }
        }
      }
    }
  }
</style>
