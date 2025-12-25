<template>
  <div class="connection-bar">
    <div class="connection-content">
      <div class="connection-form">
        <div class="input-group">
          <label class="input-label">工作空间 ID</label>
          <div class="input-wrapper">
            <i class="mdi mdi-identifier input-icon"></i>
            <input
              :value="workspaceId"
              @input="handleWorkspaceIdInput"
              class="input-field"
              type="number"
              placeholder="输入工作空间 ID"
              :disabled="connected"
            />
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">Pod 名称</label>
          <div class="input-wrapper">
            <i class="mdi mdi-kubernetes input-icon"></i>
            <input
              :value="podName"
              @input="handlePodNameInput"
              class="input-field"
              placeholder="输入 Pod 名称"
              :disabled="connected"
              @keyup.enter="!connected && $emit('connect')"
            />
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">容器名称 (可选)</label>
          <div class="input-wrapper">
            <i class="mdi mdi-docker input-icon"></i>
            <input
              :value="container"
              @input="handleContainerInput"
              class="input-field"
              placeholder="留空自动选择第一个容器"
              :disabled="connected"
            />
          </div>
        </div>

        <button
          @click="connected ? $emit('disconnect') : $emit('connect')"
          class="btn"
          :class="connected ? 'btn-danger' : 'btn-primary'"
          :disabled="(!workspaceId || !podName) && !connected"
        >
          <i
            class="mdi"
            :class="connecting ? 'mdi-loading mdi-spin' : connected ? 'mdi-stop' : 'mdi-play'"
          ></i>
          {{ connecting ? '连接中...' : connected ? '断开连接' : '连接 Pod' }}
        </button>

        <div v-if="connected" class="connection-status connected">
          <span class="status-indicator"></span>
          <span class="status-text">已连接</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  workspaceId: number
  podName: string
  container: string
  connected: boolean
  connecting: boolean
}>()

const emit = defineEmits<{
  'update:workspaceId': [value: number]
  'update:podName': [value: string]
  'update:container': [value: string]
  connect: []
  disconnect: []
}>()

function handleWorkspaceIdInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:workspaceId', Number(target.value))
}

function handlePodNameInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:podName', target.value)
}

function handleContainerInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:container', target.value)
}
</script>

<style lang="scss" scoped>
.connection-bar {
  background: #ffffff;
  box-shadow: 0 4px 8px 0 rgba(36, 46, 66, 0.12);
  position: sticky;
  top: 0;
  z-index: 100;
}

.connection-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 24px;
}

.connection-form {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
  flex: 1;
  max-width: 300px;
}

.input-label {
  font-size: 12px;
  font-weight: 600;
  color: #79879c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #b6c2cd;
  font-size: 18px;
}

.input-field {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #d8dee5;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;

  &:focus {
    outline: none;
    border-color: #55bc8a;
    box-shadow: 0 0 0 3px rgba(85, 188, 138, 0.15);
  }

  &:disabled {
    background: #f9fbfd;
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  height: 40px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: #55bc8a;
  color: #ffffff;

  &:hover:not(:disabled) {
    background: #479e76;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px 0 rgba(36, 46, 66, 0.12);
  }
}

.btn-danger {
  background: #ca2621;
  color: #ffffff;

  &:hover:not(:disabled) {
    background: #a81f1b;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px 0 rgba(36, 46, 66, 0.12);
  }
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: #f9fbfd;
  border-radius: 20px;
  font-size: 13px;
  color: #79879c;
  height: 40px;

  &.connected {
    background: rgba(85, 188, 138, 0.1);
    color: #55bc8a;

    .status-indicator {
      background: #55bc8a;
      box-shadow: 0 0 0 3px rgba(85, 188, 138, 0.3);
      animation: pulse 2s infinite;
    }
  }
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b6c2cd;
}

.status-text {
  font-weight: 500;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(85, 188, 138, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(85, 188, 138, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(85, 188, 138, 0);
  }
}

.mdi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .connection-form {
    flex-direction: column;
    align-items: stretch;
  }

  .input-group {
    max-width: 100%;
  }
}
</style>