<template>
  <ElDialog
    v-model="visible"
    title="📥 批量导入告警规则"
    width="70%"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="import-container">
      <div class="import-options">
        <ElForm inline>
          <ElFormItem label="覆盖模式">
            <ElSwitch v-model="overwrite" />
            <span class="option-tip">开启后将覆盖已存在的同名文件</span>
          </ElFormItem>
          <ElFormItem>
            <ElButton size="small" type="primary" text @click="loadExample">
              ✨ 加载示例 YAML
            </ElButton>
          </ElFormItem>
        </ElForm>
      </div>

      <div class="import-tips">
        <ElAlert type="info" :closable="false" show-icon>
          <template #title>
            <div class="tips-content">
              <strong>📌 导入说明：</strong>
              导入会自动创建 <code>规则文件 → 分组 → 规则</code> 完整结构。 YAML 必须是有效的
              <code>PrometheusRule</code> 资源格式， <code>metadata.name</code> 将作为文件代码，
              <code>spec.groups</code> 可以包含多个分组。
            </div>
          </template>
        </ElAlert>
      </div>

      <div class="editor-wrapper">
        <YamlEditorPro
          v-model="yamlContent"
          filename="alert-rules.yaml"
          :show-toolbar="true"
          :show-line-numbers="true"
          :show-status-bar="true"
          :enable-highlight="true"
          :validate-on-change="true"
          height="600px"
          placeholder="# 请粘贴 PrometheusRule YAML 内容"
          @change="handleYamlChange"
          @valid-change="handleValidChange"
        />
      </div>

      <div v-if="importResult" class="import-result">
        <ElAlert type="success" title="✅ 导入成功" :closable="false" show-icon>
          <div class="result-content">
            <div
              >文件 ID：<strong>{{ importResult.fileId }}</strong></div
            >
            <div
              >导入分组数：<strong>{{ importResult.groupCount }}</strong></div
            >
            <div
              >导入规则数：<strong>{{ importResult.ruleCount }}</strong></div
            >
          </div>
        </ElAlert>
      </div>
    </div>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton
        type="primary"
        :loading="loading"
        @click="handleImport"
        :disabled="!yamlContent || !isYamlValid"
      >
        导入
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'
  import { batchImportAlertRulesApi, type BatchImportAlertRulesResponse } from '@/api/manager/alert'

  interface Props {
    modelValue: boolean
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    success: []
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const loading = ref(false)
  const yamlContent = ref('')
  const overwrite = ref(false)
  const isYamlValid = ref(false)
  const importResult = ref<BatchImportAlertRulesResponse | null>(null)

  const handleYamlChange = (value: string) => {
    importResult.value = null
  }

  const handleValidChange = (valid: boolean) => {
    isYamlValid.value = valid
  }

  const handleImport = async () => {
    if (!yamlContent.value) {
      ElMessage.warning('请输入 YAML 内容')
      return
    }

    if (!isYamlValid.value) {
      ElMessage.error('YAML 语法错误，请先修正')
      return
    }

    try {
      loading.value = true
      importResult.value = null

      const res = await batchImportAlertRulesApi({
        yamlStr: yamlContent.value,
        overwrite: overwrite.value
      })

      importResult.value = res
      ElMessage.success(`导入成功！共导入 ${res.groupCount} 个分组，${res.ruleCount} 条规则`)

      setTimeout(() => {
        visible.value = false
        emit('success')
      }, 2000)
    } catch (error: any) {
      console.error('导入失败:', error)
    } finally {
      loading.value = false
    }
  }

  const loadExample = () => {
    yamlContent.value = `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: example-alert-rules
  namespace: monitoring
  labels:
    app: prometheus
    release: kube-prometheus
spec:
  groups:
    - name: node-alerts
      interval: 1m
      rules:
        - alert: NodeMemoryLow
          expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.1
          for: 5m
          labels:
            severity: warning
            category: node
          annotations:
            summary: "节点内存不足 (实例: {{ $labels.instance }})"
            description: "节点 {{ $labels.instance }} 可用内存低于 10%，当前值: {{ $value | humanizePercentage }}"

        - alert: NodeDiskSpaceLow
          expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.2
          for: 10m
          labels:
            severity: critical
            category: node
          annotations:
            summary: "节点磁盘空间不足 (实例: {{ $labels.instance }})"
            description: "节点 {{ $labels.instance }} 根分区可用空间低于 20%"

    - name: pod-alerts
      interval: 30s
      rules:
        - alert: PodCrashLooping
          expr: rate(kube_pod_container_status_restarts_total[5m]) > 0
          for: 5m
          labels:
            severity: warning
            category: pod
          annotations:
            summary: "Pod 频繁重启 ({{ $labels.namespace }}/{{ $labels.pod }})"
            description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 在过去5分钟内重启次数过多"

        - alert: PodNotReady
          expr: kube_pod_status_ready{condition="true"} == 0
          for: 5m
          labels:
            severity: warning
            category: pod
          annotations:
            summary: "Pod 未就绪 ({{ $labels.namespace }}/{{ $labels.pod }})"
            description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 已经超过5分钟未就绪"`

    ElMessage.success('已加载示例 YAML')
  }

  const handleClosed = () => {
    yamlContent.value = ''
    importResult.value = null
    overwrite.value = false
    isYamlValid.value = false
  }
</script>

<style scoped lang="scss">
  .import-container {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .import-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--el-fill-color-light);
      border-radius: 8px;

      .option-tip {
        margin-left: 8px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .import-tips {
      .tips-content {
        line-height: 1.8;

        code {
          padding: 2px 6px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
      }
    }

    .editor-wrapper {
      border-radius: 8px;
      overflow: hidden;
    }

    .import-result {
      .result-content {
        div {
          margin: 4px 0;

          strong {
            color: var(--el-color-primary);
          }
        }
      }
    }
  }
</style>
