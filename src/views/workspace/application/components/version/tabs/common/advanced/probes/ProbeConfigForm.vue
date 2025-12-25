<template>
  <div class="probe-config-form">
    <!-- 探针类型选择 -->
    <div class="type-selector">
      <div class="selector-label">
        <Settings :size="16" />
        <span>探针类型：</span>
      </div>
      <ElRadioGroup
        :model-value="probeType"
        :disabled="!editing"
        @update:model-value="$emit('update:probeType', $event)"
      >
        <ElRadioButton value="httpGet">
          <Globe :size="14" />
          HTTP 请求
        </ElRadioButton>
        <ElRadioButton value="tcpSocket">
          <Network :size="14" />
          TCP 端口
        </ElRadioButton>
        <ElRadioButton value="exec">
          <Terminal :size="14" />
          执行命令
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- HTTP GET -->
    <div v-if="probeType === 'httpGet'" class="probe-type-config">
      <div class="config-row">
        <div class="config-item">
          <label>请求路径</label>
          <ElInput
            :model-value="httpConfig.path"
            :readonly="!editing"
            placeholder="/health"
            @update:model-value="updateHttpConfig('path', $event)"
          />
        </div>
        <div class="config-item">
          <label>端口</label>
          <ElInputNumber
            :model-value="httpConfig.port"
            :disabled="!editing"
            :min="1"
            :max="65535"
            controls-position="right"
            @update:model-value="updateHttpConfig('port', $event)"
          />
        </div>
      </div>
      <div class="config-row">
        <div class="config-item">
          <label>协议</label>
          <ElSelect
            :model-value="httpConfig.scheme"
            :disabled="!editing"
            @update:model-value="updateHttpConfig('scheme', $event)"
          >
            <ElOption label="HTTP" value="HTTP" />
            <ElOption label="HTTPS" value="HTTPS" />
          </ElSelect>
        </div>
        <div class="config-item">
          <label>主机名（可选）</label>
          <ElInput
            :model-value="httpConfig.host"
            :readonly="!editing"
            placeholder="默认使用 Pod IP"
            @update:model-value="updateHttpConfig('host', $event)"
          />
        </div>
      </div>
    </div>

    <!-- TCP Socket -->
    <div v-if="probeType === 'tcpSocket'" class="probe-type-config">
      <div class="config-row">
        <div class="config-item">
          <label>端口</label>
          <ElInputNumber
            :model-value="tcpConfig.port"
            :disabled="!editing"
            :min="1"
            :max="65535"
            controls-position="right"
            @update:model-value="updateTcpConfig('port', $event)"
          />
        </div>
        <div class="config-item">
          <label>主机名（可选）</label>
          <ElInput
            :model-value="tcpConfig.host"
            :readonly="!editing"
            placeholder="默认使用 Pod IP"
            @update:model-value="updateTcpConfig('host', $event)"
          />
        </div>
      </div>
    </div>

    <!-- Exec -->
    <div v-if="probeType === 'exec'" class="probe-type-config">
      <div class="config-item">
        <label>执行命令</label>
        <ElInput
          :model-value="execConfig.commandStr"
          :readonly="!editing"
          type="textarea"
          :rows="4"
          placeholder="每行一个命令参数，例如：&#10;cat&#10;/tmp/healthy"
          @update:model-value="updateExecConfig('commandStr', $event)"
        />
        <div class="field-tip">
          <Info :size="14" />
          <span>每行代表一个命令参数</span>
        </div>
      </div>
    </div>

    <!-- 探针参数 -->
    <ElDivider>
      <Sliders :size="14" />
      探针参数
    </ElDivider>

    <div class="params-config">
      <div class="config-row">
        <div class="config-item">
          <label>初始延迟（秒）</label>
          <ElInputNumber
            :model-value="params.initialDelaySeconds"
            :disabled="!editing"
            :min="0"
            :max="3600"
            controls-position="right"
            @update:model-value="updateParams('initialDelaySeconds', $event)"
          />
          <div class="field-tip">
            <Info :size="14" />
            <span>容器启动后多久开始探测</span>
          </div>
        </div>
        <div class="config-item">
          <label>探测周期（秒）</label>
          <ElInputNumber
            :model-value="params.periodSeconds"
            :disabled="!editing"
            :min="1"
            :max="3600"
            controls-position="right"
            @update:model-value="updateParams('periodSeconds', $event)"
          />
          <div class="field-tip">
            <Info :size="14" />
            <span>多久探测一次</span>
          </div>
        </div>
      </div>
      <div class="config-row">
        <div class="config-item">
          <label>超时时间（秒）</label>
          <ElInputNumber
            :model-value="params.timeoutSeconds"
            :disabled="!editing"
            :min="1"
            :max="3600"
            controls-position="right"
            @update:model-value="updateParams('timeoutSeconds', $event)"
          />
          <div class="field-tip">
            <Info :size="14" />
            <span>探测超时时间</span>
          </div>
        </div>
        <div class="config-item">
          <label>失败阈值（次）</label>
          <ElInputNumber
            :model-value="params.failureThreshold"
            :disabled="!editing"
            :min="1"
            :max="100"
            controls-position="right"
            @update:model-value="updateParams('failureThreshold', $event)"
          />
          <div class="field-tip">
            <Info :size="14" />
            <span>连续失败多少次算不健康</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Settings, Globe, Network, Terminal, Info, Sliders } from 'lucide-vue-next'

  interface Props {
    editing: boolean
    probeType: 'httpGet' | 'tcpSocket' | 'exec'
    httpConfig: {
      path: string
      port: number
      scheme: string
      host: string
    }
    tcpConfig: {
      port: number
      host: string
    }
    execConfig: {
      commandStr: string
    }
    params: {
      initialDelaySeconds: number
      periodSeconds: number
      timeoutSeconds: number
      failureThreshold: number
    }
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    'update:probeType': [value: string]
    'update:httpConfig': [value: any]
    'update:tcpConfig': [value: any]
    'update:execConfig': [value: any]
    'update:params': [value: any]
  }>()

  const updateHttpConfig = (key: string, value: any) => {
    emit('update:httpConfig', { ...props.httpConfig, [key]: value })
  }

  const updateTcpConfig = (key: string, value: any) => {
    emit('update:tcpConfig', { ...props.tcpConfig, [key]: value })
  }

  const updateExecConfig = (key: string, value: any) => {
    emit('update:execConfig', { ...props.execConfig, [key]: value })
  }

  const updateParams = (key: string, value: any) => {
    emit('update:params', { ...props.params, [key]: value })
  }
</script>

<style lang="scss" scoped>
  .probe-config-form {
    .type-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border-radius: 6px;
      margin-bottom: 16px;

      .selector-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #606266;
      }

      :deep(.el-radio-group) {
        display: flex;
        gap: 8px;

        .el-radio-button__inner {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .probe-type-config,
    .params-config {
      background: white;
      padding: 16px;
      border-radius: 6px;

      .config-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .config-item {
        label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #606266;
        }

        :deep(.el-input-number) {
          width: 100%;
        }

        .field-tip {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          font-size: 12px;
          color: #909399;
        }
      }
    }

    :deep(.el-divider) {
      margin: 20px 0;

      .el-divider__text {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #606266;
      }
    }
  }
</style>
