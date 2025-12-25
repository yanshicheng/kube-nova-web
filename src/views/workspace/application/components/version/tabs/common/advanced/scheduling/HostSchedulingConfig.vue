<template>
  <div class="host-scheduling-config">
    <div class="section-header">
      <Server :size="18" />
      <h4>主机调度策略</h4>
    </div>

    <!-- 调度模式选择 -->
    <div class="mode-selector">
      <div
        v-for="item in modes"
        :key="item.value"
        class="mode-card"
        :class="{ active: mode === item.value, disabled: !editing }"
        @click="editing && handleModeChange(item.value)"
      >
        <component :is="item.icon" :size="20" />
        <div class="mode-info">
          <div class="mode-name">{{ item.label }}</div>
          <div class="mode-desc">{{ item.desc }}</div>
        </div>
        <Check v-if="mode === item.value" :size="18" class="check-icon" />
      </div>
    </div>

    <!-- 指定节点 -->
    <div v-if="mode === 'nodeName'" class="mode-content">
      <ElAlert type="info" :closable="false" show-icon>
        <template #title>选择具体节点运行，跳过调度器检查</template>
      </ElAlert>
      <ElSelect
        v-model="nodeNameValue"
        :disabled="!editing"
        :loading="loadingNodes"
        filterable
        placeholder="请选择节点"
        size="large"
        class="full-width"
        @focus="loadNodes"
      >
        <ElOption
          v-for="node in nodes"
          :key="node.id"
          :label="`${node.nodeName} (${node.nodeStatus} - ${node.nodeIp})`"
          :value="node.nodeName"
        >
          <div class="node-option">
            <span class="node-name">{{ node.nodeName }}</span>
            <div class="node-meta">
              <ElTag size="small" :type="node.nodeStatus === 'Ready' ? 'success' : 'danger'">
                {{ node.nodeStatus }}
              </ElTag>
              <span class="node-ip">{{ node.nodeIp }}</span>
            </div>
          </div>
        </ElOption>
      </ElSelect>
    </div>

    <!-- 节点标签选择器 -->
    <div v-if="mode === 'nodeSelector'" class="mode-content">
      <ElAlert type="info" :closable="false" show-icon>
        <template #title>通过标签匹配选择节点，经过调度器检查</template>
      </ElAlert>

      <div class="action-bar">
        <ElButton v-if="editing" type="primary" size="small" @click="addLabel">
          <Plus :size="14" />
          添加标签
        </ElButton>
      </div>

      <div v-if="Object.keys(nodeSelectorValue).length === 0" class="empty-tip">
        暂无标签配置，请添加节点标签
      </div>

      <div v-else class="labels-list">
        <div v-for="(value, key) in nodeSelectorValue" :key="key" class="label-item">
          <div class="label-key">{{ key }}</div>
          <div class="label-eq">=</div>
          <ElInput
            v-model="nodeSelectorValue[key]"
            :readonly="!editing"
            placeholder="标签值"
            size="default"
          />
          <ElButton v-if="editing" type="danger" text circle @click="removeLabel(key)">
            <Trash2 :size="16" />
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 节点亲和性 -->
    <div v-if="mode === 'nodeAffinity'" class="mode-content">
      <ElAlert type="info" :closable="false" show-icon>
        <template #title>使用节点亲和性规则，支持复杂的选择逻辑</template>
      </ElAlert>

      <ElTabs type="border-card">
        <!-- 必须满足 -->
        <ElTabPane>
          <template #label>
            <div class="tab-label">
              <ShieldCheck :size="14" />
              <span>必须满足</span>
              <ElBadge
                v-if="nodeAffinityRequiredValue.length > 0"
                :value="nodeAffinityRequiredValue.length"
              />
            </div>
          </template>

          <div class="action-bar">
            <ElButton
              v-if="editing"
              type="primary"
              size="small"
              @click="addAffinityRule('required')"
            >
              <Plus :size="14" />
              添加规则
            </ElButton>
          </div>

          <div v-if="nodeAffinityRequiredValue.length === 0" class="empty-tip">暂无规则</div>

          <div v-else class="rules-list">
            <div v-for="(rule, index) in nodeAffinityRequiredValue" :key="index" class="rule-item">
              <ElInput
                v-model="rule.key"
                :readonly="!editing"
                placeholder="标签键"
                style="width: 200px"
              />
              <ElSelect v-model="rule.operator" :disabled="!editing" style="width: 150px">
                <ElOption label="In (包含)" value="In" />
                <ElOption label="NotIn (不包含)" value="NotIn" />
                <ElOption label="Exists (存在)" value="Exists" />
                <ElOption label="DoesNotExist (不存在)" value="DoesNotExist" />
              </ElSelect>
              <ElInput
                v-if="['In', 'NotIn'].includes(rule.operator)"
                v-model="rule.values"
                :readonly="!editing"
                placeholder="值（逗号分隔）"
                style="flex: 1"
              />
              <ElButton
                v-if="editing"
                type="danger"
                text
                circle
                @click="removeAffinityRule('required', index)"
              >
                <X :size="16" />
              </ElButton>
            </div>
          </div>
        </ElTabPane>

        <!-- 优先满足 -->
        <ElTabPane>
          <template #label>
            <div class="tab-label">
              <Star :size="14" />
              <span>优先满足</span>
              <ElBadge
                v-if="nodeAffinityPreferredValue.length > 0"
                :value="nodeAffinityPreferredValue.length"
              />
            </div>
          </template>

          <div class="action-bar">
            <ElButton
              v-if="editing"
              type="success"
              size="small"
              @click="addAffinityRule('preferred')"
            >
              <Plus :size="14" />
              添加规则
            </ElButton>
          </div>

          <div v-if="nodeAffinityPreferredValue.length === 0" class="empty-tip">暂无规则</div>

          <div v-else class="rules-list">
            <div v-for="(rule, index) in nodeAffinityPreferredValue" :key="index" class="rule-item">
              <ElInputNumber
                v-model="rule.weight"
                :disabled="!editing"
                :min="1"
                :max="100"
                placeholder="权重"
                style="width: 100px"
              />
              <ElInput
                v-model="rule.key"
                :readonly="!editing"
                placeholder="标签键"
                style="width: 200px"
              />
              <ElSelect v-model="rule.operator" :disabled="!editing" style="width: 150px">
                <ElOption label="In" value="In" />
                <ElOption label="NotIn" value="NotIn" />
                <ElOption label="Exists" value="Exists" />
                <ElOption label="DoesNotExist" value="DoesNotExist" />
              </ElSelect>
              <ElInput
                v-if="['In', 'NotIn'].includes(rule.operator)"
                v-model="rule.values"
                :readonly="!editing"
                placeholder="值（逗号分隔）"
                style="flex: 1"
              />
              <ElButton
                v-if="editing"
                type="danger"
                text
                circle
                @click="removeAffinityRule('preferred', index)"
              >
                <X :size="16" />
              </ElButton>
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Server,
    Zap,
    Target,
    Filter,
    Magnet,
    Check,
    Plus,
    X,
    Trash2,
    ShieldCheck,
    Star
  } from 'lucide-vue-next'
  import {
    getNodeListApi,
    type OnecProjectVersion,
    type ProjectCluster,
    type ProjectWorkspace,
    type ClusterNodeInfo
  } from '@/api'

  interface Props {
    editing: boolean
    version: OnecProjectVersion
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()

  const mode = defineModel<'auto' | 'nodeName' | 'nodeSelector' | 'nodeAffinity'>('mode', {
    default: 'auto'
  })
  const nodeNameValue = defineModel<string>('nodeName', { default: '' })
  const nodeSelectorValue = defineModel<Record<string, string>>('nodeSelector', { default: {} })
  const nodeAffinityRequiredValue = defineModel<any[]>('nodeAffinityRequired', { default: [] })
  const nodeAffinityPreferredValue = defineModel<any[]>('nodeAffinityPreferred', { default: [] })

  const loadingNodes = ref(false)
  const nodes = ref<ClusterNodeInfo[]>([])

  const modes = [
    { value: 'auto', label: '自动调度', desc: 'Kubernetes 自动分配', icon: Zap },
    { value: 'nodeName', label: '指定节点', desc: '选择具体节点运行', icon: Target },
    { value: 'nodeSelector', label: '标签选择', desc: '通过标签筛选节点', icon: Filter },
    { value: 'nodeAffinity', label: '节点亲和性', desc: '使用复杂的亲和规则', icon: Magnet }
  ]

  const handleModeChange = (value: any) => {
    mode.value = value
    // 切换模式时清空其他模式的值
    if (value !== 'nodeName') nodeNameValue.value = ''
    if (value !== 'nodeSelector') nodeSelectorValue.value = {}
    if (value !== 'nodeAffinity') {
      nodeAffinityRequiredValue.value = []
      nodeAffinityPreferredValue.value = []
    }
  }

  const loadNodes = async () => {
    if (loadingNodes.value || nodes.value.length > 0) return


    const clusterUuid = props.cluster?.clusterUuid || props.version.clusterUuid

    if (!clusterUuid) {
      console.error('[HostScheduling] clusterUuid 为空:', {
        cluster: props.cluster,
        version: props.version
      })
      return
    }

    loadingNodes.value = true
    try {
      const response = await getNodeListApi({
        clusterUuid: clusterUuid,
        page: 1,
        pageSize: 200
      })
      nodes.value = response.items || []
    } catch (error) {
      console.error('[HostScheduling] 加载节点列表失败:', error)
    } finally {
      loadingNodes.value = false
    }
  }

  const addLabel = async () => {
    try {
      const result = await ElMessageBox.prompt('请输入标签键', '添加标签', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^[a-zA-Z0-9._/-]+$/,
        inputErrorMessage: '标签键格式不正确'
      })

      if (result.value) {
        nodeSelectorValue.value = {
          ...nodeSelectorValue.value,
          [result.value]: ''
        }
      }
    } catch {
      // 取消
    }
  }

  const removeLabel = (key: string) => {
    const newValue = { ...nodeSelectorValue.value }
    delete newValue[key]
    nodeSelectorValue.value = newValue
  }

  const addAffinityRule = (type: 'required' | 'preferred') => {
    const rule: any = { key: '', operator: 'In', values: '' }
    if (type === 'preferred') rule.weight = 50

    if (type === 'required') {
      nodeAffinityRequiredValue.value = [...nodeAffinityRequiredValue.value, rule]
    } else {
      nodeAffinityPreferredValue.value = [...nodeAffinityPreferredValue.value, rule]
    }
  }

  const removeAffinityRule = (type: 'required' | 'preferred', index: number) => {
    if (type === 'required') {
      nodeAffinityRequiredValue.value = nodeAffinityRequiredValue.value.filter(
        (_, i) => i !== index
      )
    } else {
      nodeAffinityPreferredValue.value = nodeAffinityPreferredValue.value.filter(
        (_, i) => i !== index
      )
    }
  }
</script>

<style lang="scss" scoped>
  .host-scheduling-config {
    padding: 20px;

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .mode-selector {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;

      .mode-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f9fafb;
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(.disabled) {
          border-color: #409eff;
          background: #ecf5ff;
        }

        &.active {
          border-color: #409eff;
          background: #e6f4ff;
        }

        &.disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .mode-info {
          flex: 1;

          .mode-name {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .mode-desc {
            font-size: 12px;
            color: #909399;
          }
        }

        .check-icon {
          color: #409eff;
        }
      }
    }

    .mode-content {
      padding: 16px;
      background: #fafbfc;
      border: 1px solid #e4e7ed;
      border-radius: 8px;

      :deep(.el-alert) {
        margin-bottom: 16px;
      }

      .full-width {
        width: 100%;
        margin-top: 12px;
      }

      .node-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        .node-name {
          font-weight: 600;
          color: #303133;
        }

        .node-meta {
          display: flex;
          align-items: center;
          gap: 8px;

          .node-ip {
            font-size: 12px;
            color: #909399;
            font-family: 'Monaco', monospace;
          }
        }
      }

      .action-bar {
        margin-bottom: 12px;
      }

      .labels-list,
      .rules-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .label-item,
        .rule-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: white;
          border: 1px solid #e4e7ed;
          border-radius: 6px;

          .label-key {
            min-width: 180px;
            padding: 8px 12px;
            background: #f5f7fa;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'Monaco', monospace;
          }

          .label-eq {
            color: #909399;
            font-weight: 600;
          }
        }
      }

      .tab-label {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .empty-tip {
      padding: 40px 20px;
      text-align: center;
      font-size: 13px;
      color: #909399;
      background: white;
      border: 1px dashed #e4e7ed;
      border-radius: 6px;
    }
  }
</style>
