<template>
  <div class="advanced-config">
    <!-- 快速配置按钮 -->
    <div class="quick-actions-bar">
      <div class="actions-title">
        <Zap :size="16" />
        <span>快速配置</span>
      </div>
      <div class="actions-buttons">
        <ElButton size="small" @click="applyTemplate('interactive')">
          <Terminal :size="14" />
          交互式容器
        </ElButton>
        <ElButton size="small" @click="applyTemplate('debug')">
          <Bug :size="14" />
          调试模式
        </ElButton>
        <ElButton v-if="containerType === 'init'" size="small" @click="applyTemplate('sidecar')">
          <RotateCw :size="14" />
          Sidecar 模式
        </ElButton>
        <ElButton size="small" @click="applyDefaultTemplate">
          <RotateCw :size="14" />
          恢复默认
        </ElButton>
      </div>
    </div>

    <!-- 容器重启策略 (Init Containers Only) -->
    <div v-if="containerType === 'init'" class="ct-section">
      <div class="ct-section-header">
        <RotateCw :size="16" />
        <span>重启策略</span>
        <ElTag type="warning" size="small">K8s 1.28+</ElTag>
      </div>

      <ElForm label-width="160px">
        <ElFormItem label="重启策略">
          <ElRadioGroup v-model="localConfig.restartPolicy" @change="emitUpdate">
            <ElRadioButton value="">
              <XCircle :size="14" style="margin-right: 4px" />
              默认
            </ElRadioButton>
            <ElRadioButton value="Always">
              <RotateCw :size="14" style="margin-right: 4px" />
              Always
            </ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>

        <ElAlert
          v-if="localConfig.restartPolicy === 'Always'"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 12px"
        >
          <template #title>
            启用 Always 策略后，此 Init Container 将表现为 sidecar
            容器，与主容器并行运行，失败后自动重启而不影响其他容器。
          </template>
        </ElAlert>
      </ElForm>
    </div>

    <!-- TTY 和标准输入配置 -->
    <div class="ct-section">
      <div class="ct-section-header">
        <Terminal :size="16" />
        <span>终端配置</span>
      </div>

      <ElForm label-width="160px">
        <ElFormItem label="分配标准输入">
          <ElSwitch v-model="localConfig.stdin" @change="emitUpdate" />
          <span class="ct-field-hint" style="margin-left: 12px">允许容器接收标准输入</span>
        </ElFormItem>

        <ElFormItem label="单次标准输入">
          <ElSwitch
            v-model="localConfig.stdinOnce"
            :disabled="!localConfig.stdin"
            @change="emitUpdate"
          />
          <span class="ct-field-hint" style="margin-left: 12px">启动后关闭stdin</span>
        </ElFormItem>

        <ElFormItem label="分配伪终端">
          <ElSwitch v-model="localConfig.tty" @change="emitUpdate" />
          <span class="ct-field-hint" style="margin-left: 12px">用于交互式shell</span>
        </ElFormItem>
      </ElForm>
    </div>

    <!-- 终止消息配置 -->
    <div class="ct-section">
      <div class="ct-section-header">
        <FileWarning :size="16" />
        <span>终止消息</span>
      </div>

      <ElForm label-width="160px">
        <ElFormItem label="消息路径">
          <ElInput
            v-model="localConfig.terminationMessagePath"
            placeholder="/dev/termination-log"
            @input="emitUpdate"
          >
            <template #prefix>
              <FileText :size="14" />
            </template>
          </ElInput>
        </ElFormItem>

        <ElFormItem label="消息策略">
          <ElRadioGroup v-model="localConfig.terminationMessagePolicy" @change="emitUpdate">
            <ElRadioButton value="File">
              <FileText :size="14" />
              文件
            </ElRadioButton>
            <ElRadioButton value="FallbackToLogsOnError">
              <ScrollText :size="14" />
              失败时使用日志
            </ElRadioButton>
          </ElRadioGroup>
          <div class="policy-desc">
            <p v-if="localConfig.terminationMessagePolicy === 'File'">从指定文件读取终止消息</p>
            <p v-else>优先从文件读取，失败则从容器日志获取最后内容</p>
          </div>
        </ElFormItem>
      </ElForm>
    </div>

    <!-- 容器大小调整策略 (K8s 1.27+) -->
    <div class="ct-section">
      <div class="ct-section-header">
        <Maximize2 :size="16" />
        <span>资源调整策略</span>
        <ElTag type="warning" size="small">K8s 1.27+</ElTag>
      </div>

      <div class="resize-policies">
        <div class="policy-header">
          <ElButton size="small" @click="addResizePolicy">
            <Plus :size="14" />
            添加策略
          </ElButton>
        </div>

        <ElTable
          :data="localConfig.resizePolicies"
          empty-text="暂无调整策略"
          class="ct-modern-table"
        >
          <ElTableColumn label="资源名称" width="150">
            <template #default="{ row }">
              <ElSelect v-model="row.resourceName" size="small" @change="emitUpdate">
                <ElOption label="CPU" value="cpu" />
                <ElOption label="内存" value="memory" />
              </ElSelect>
            </template>
          </ElTableColumn>
          <ElTableColumn label="重启策略" min-width="200">
            <template #default="{ row }">
              <ElSelect v-model="row.restartPolicy" size="small" @change="emitUpdate">
                <ElOption label="不重启" value="NotRequired" />
                <ElOption label="需要重启" value="RestartContainer" />
              </ElSelect>
            </template>
          </ElTableColumn>
          <ElTableColumn label="说明" min-width="250">
            <template #default="{ row }">
              <span class="policy-hint">
                {{ row.resourceName === 'cpu' ? 'CPU' : '内存' }}调整时{{
                  row.restartPolicy === 'NotRequired' ? '不需要' : '需要'
                }}重启容器
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="80">
            <template #default="{ $index }">
              <ElButton type="danger" text size="small" @click="removeResizePolicy($index)">
                <Trash2 :size="16" />
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Terminal,
  FileWarning,
  FileText,
  ScrollText,
  Maximize2,
  Plus,
  Trash2,
  Zap,
  Bug,
  RotateCw,
  XCircle
} from 'lucide-vue-next'
import { useContainersStore } from '@/store/workload'
import type { V1ContainerResizePolicy } from '@kubernetes/client-node'

const containersStore = useContainersStore()

// 本地配置状态
const localConfig = ref({
  restartPolicy: '',
  stdin: false,
  stdinOnce: false,
  tty: false,
  terminationMessagePath: '/dev/termination-log',
  terminationMessagePolicy: 'File',
  resizePolicies: [] as V1ContainerResizePolicy[]
})

// 容器类型
const containerType = ref<'init' | 'main'>('main')

// 监听选中容器变化
watch(
  () => containersStore.selectedContainer,
  (newContainer) => {
    if (newContainer) {
      nextTick(() => {
        // 更新容器类型
        containerType.value = newContainer.type

        // 深拷贝容器配置到本地状态
        localConfig.value = {
          restartPolicy: newContainer.restartPolicy || '',
          stdin: newContainer.stdin || false,
          stdinOnce: newContainer.stdinOnce || false,
          tty: newContainer.tty || false,
          terminationMessagePath: newContainer.terminationMessagePath || '/dev/termination-log',
          terminationMessagePolicy: newContainer.terminationMessagePolicy || 'File',
          resizePolicies: newContainer.resizePolicy
            ? JSON.parse(JSON.stringify(newContainer.resizePolicy))
            : []
        }
      })
    }
  },
  { immediate: true, deep: true }
)

// 发送更新到 store
function emitUpdate() {
  const container = containersStore.selectedContainer
  if (!container) return

  const updates: any = {
    stdin: localConfig.value.stdin || undefined,
    stdinOnce: localConfig.value.stdinOnce || undefined,
    tty: localConfig.value.tty || undefined,
    terminationMessagePath: localConfig.value.terminationMessagePath,
    terminationMessagePolicy: localConfig.value.terminationMessagePolicy,
    resizePolicy:
      localConfig.value.resizePolicies.length > 0 ? localConfig.value.resizePolicies : undefined
  }

  // Init 容器特有的重启策略
  if (containerType.value === 'init') {
    updates.restartPolicy = localConfig.value.restartPolicy || undefined
  }

  containersStore.updateContainer(container.id, updates)
}

// 添加资源调整策略
const addResizePolicy = () => {
  localConfig.value.resizePolicies.push({ resourceName: 'cpu', restartPolicy: 'NotRequired' })
  emitUpdate()
}

// 删除资源调整策略
const removeResizePolicy = (index: number) => {
  localConfig.value.resizePolicies.splice(index, 1)
  emitUpdate()
}

// 恢复默认配置
const applyDefaultTemplate = () => {
  localConfig.value.restartPolicy = ''
  localConfig.value.stdin = false
  localConfig.value.stdinOnce = false
  localConfig.value.tty = false
  localConfig.value.terminationMessagePath = '/dev/termination-log'
  localConfig.value.terminationMessagePolicy = 'File'
  localConfig.value.resizePolicies = []
  emitUpdate()
  ElMessage.success('已恢复 K8s 默认配置')
}

// 应用模板
const applyTemplate = (template: string) => {
  switch (template) {
    case 'interactive':
      localConfig.value.stdin = true
      localConfig.value.tty = true
      ElMessage.success('已应用交互式容器模板')
      break
    case 'debug':
      localConfig.value.stdin = true
      localConfig.value.tty = true
      localConfig.value.terminationMessagePolicy = 'FallbackToLogsOnError'
      ElMessage.success('已应用调试模式模板')
      break
    case 'sidecar':
      if (containerType.value === 'init') {
        localConfig.value.restartPolicy = 'Always'
        ElMessage.success('已应用 Sidecar 模式模板（Always 重启策略）')
      }
      break
  }
  emitUpdate()
}
</script>

<style lang="scss" scoped>
.advanced-config {
  padding: var(--ct-spacing-lg, 16px) 0;

  .quick-actions-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    margin-bottom: 20px;
    background: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 8px;

    .actions-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #606266;
      white-space: nowrap;

      :deep(svg) {
        color: #409eff;
      }
    }

    .actions-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .el-button {
        :deep(svg) {
          margin-right: 4px;
        }
      }
    }
  }

  .ct-section {
    margin-bottom: 24px;
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;

    .ct-section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .ct-field-hint {
    font-size: 12px;
    color: #909399;
  }

  .policy-desc {
    margin-top: 8px;
    font-size: 12px;
    color: #606266;
    line-height: 1.6;

    p {
      margin: 0;
    }
  }

  .resize-policies {
    .policy-header {
      margin-bottom: 12px;
    }

    .policy-hint {
      font-size: 12px;
      color: #606266;
    }
  }

  ::v-deep(.el-form-item) {
    margin-bottom: 16px;
  }
}
</style>