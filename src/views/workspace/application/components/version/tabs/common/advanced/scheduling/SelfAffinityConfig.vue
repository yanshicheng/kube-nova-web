<template>
  <div class="self-affinity-config">
    <div class="section-header">
      <Globe :size="18" />
      <h4>服务内亲和性配置</h4>
    </div>

    <ElAlert type="info" :closable="false" show-icon>
      <template #title>配置本服务多个 Pod 之间的亲和或反亲和关系</template>
    </ElAlert>

    <!-- 显示当前服务的 Labels -->
    <ElCard class="labels-card">
      <template #header>
        <div class="card-header">
          <Tag :size="14" />
          <span>当前服务标签</span>
          <ElButton
            type="primary"
            text
            size="small"
            :loading="loadingLabels"
            @click="loadLabels"
          >
            <RefreshCw :size="12" />
            刷新
          </ElButton>
        </div>
      </template>

      <div v-if="loadingLabels" v-loading="loadingLabels" class="loading-box"></div>

      <div v-else-if="Object.keys(currentLabels).length === 0" class="empty-tip">
        当前服务暂无标签
      </div>

      <div v-else class="labels-display">
        <ElTag
          v-for="(value, key) in currentLabels"
          :key="key"
          type="primary"
          size="small"
        >
          {{ key }}={{ value }}
        </ElTag>
      </div>
    </ElCard>

    <!-- 使用 Radio 切换 -->
    <div class="affinity-type-selector">
      <ElRadioGroup v-model="affinityType" class="type-radio-group">
        <ElRadioButton value="affinity">
          <div class="radio-content">
            <Users2 :size="16" />
            <span>Pod 内亲和性</span>
            <ElBadge v-if="selfAffinityValue.length > 0" :value="selfAffinityValue.length" />
          </div>
        </ElRadioButton>
        <ElRadioButton value="antiAffinity">
          <div class="radio-content">
            <UserX2 :size="16" />
            <span>Pod 内反亲和性</span>
            <ElBadge v-if="selfAntiAffinityValue.length > 0" :value="selfAntiAffinityValue.length" />
          </div>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 亲和性 -->
    <div v-if="affinityType === 'affinity'" class="affinity-content">
      <div class="action-bar">
        <ElButton v-if="editing" type="primary" size="small" @click="addRule('affinity')">
          <Plus :size="14" />
          添加亲和规则
        </ElButton>
      </div>

      <div v-if="selfAffinityValue.length === 0" class="empty-tip">
        让本服务的 Pod 尽量部署在一起
      </div>

      <div v-else class="rules-list">
        <div v-for="(rule, index) in selfAffinityValue" :key="index" class="rule-card">
          <div class="card-header">
            <span class="rule-number">#{{ index + 1 }}</span>
            <ElTag :type="rule.type === 'required' ? 'danger' : 'warning'" size="small">
              {{ rule.type === 'required' ? '必须满足' : '优先满足' }}
            </ElTag>
            <ElButton
              v-if="editing"
              type="danger"
              text
              circle
              size="small"
              @click="removeRule('affinity', index)"
            >
              <X :size="16" />
            </ElButton>
          </div>

          <div class="card-content">
            <div class="form-row">
              <label>规则类型</label>
              <ElRadioGroup v-model="rule.type" :disabled="!editing">
                <ElRadio value="required">必须满足（Required）</ElRadio>
                <ElRadio value="preferred">优先满足（Preferred）</ElRadio>
              </ElRadioGroup>
            </div>

            <div v-if="rule.type === 'preferred'" class="form-row">
              <label>权重 (1-100)</label>
              <ElSlider
                v-model="rule.weight"
                :disabled="!editing"
                :min="1"
                :max="100"
                show-input
              />
            </div>

            <div class="form-row">
              <label>拓扑域</label>
              <ElSelect v-model="rule.topologyKey" :disabled="!editing">
                <ElOption label="节点级别（同一主机）" value="kubernetes.io/hostname" />
                <ElOption label="可用区级别" value="topology.kubernetes.io/zone" />
                <ElOption label="区域级别" value="topology.kubernetes.io/region" />
              </ElSelect>
            </div>

            <div class="form-row">
              <label>说明</label>
              <ElInput
                v-model="rule.description"
                :readonly="!editing"
                type="textarea"
                :rows="2"
                placeholder="规则说明（可选）"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 反亲和性 -->
    <div v-else class="affinity-content">
      <div class="action-bar">
        <ElButton v-if="editing" type="primary" size="small" @click="addRule('antiAffinity')">
          <Plus :size="14" />
          添加反亲和规则
        </ElButton>
      </div>

      <div v-if="selfAntiAffinityValue.length === 0" class="empty-tip">
        让本服务的 Pod 尽量分散部署（推荐用于高可用）
      </div>

      <div v-else class="rules-list">
        <div v-for="(rule, index) in selfAntiAffinityValue" :key="index" class="rule-card">
          <div class="card-header">
            <span class="rule-number">#{{ index + 1 }}</span>
            <ElTag :type="rule.type === 'required' ? 'danger' : 'warning'" size="small">
              {{ rule.type === 'required' ? '必须满足' : '优先满足' }}
            </ElTag>
            <ElButton
              v-if="editing"
              type="danger"
              text
              circle
              size="small"
              @click="removeRule('antiAffinity', index)"
            >
              <X :size="16" />
            </ElButton>
          </div>

          <div class="card-content">
            <div class="form-row">
              <label>规则类型</label>
              <ElRadioGroup v-model="rule.type" :disabled="!editing">
                <ElRadio value="required">必须满足（Required）</ElRadio>
                <ElRadio value="preferred">优先满足（Preferred）</ElRadio>
              </ElRadioGroup>
            </div>

            <div v-if="rule.type === 'preferred'" class="form-row">
              <label>权重 (1-100)</label>
              <ElSlider
                v-model="rule.weight"
                :disabled="!editing"
                :min="1"
                :max="100"
                show-input
              />
            </div>

            <div class="form-row">
              <label>拓扑域</label>
              <ElSelect v-model="rule.topologyKey" :disabled="!editing">
                <ElOption label="节点级别（同一主机）" value="kubernetes.io/hostname" />
                <ElOption label="可用区级别" value="topology.kubernetes.io/zone" />
                <ElOption label="区域级别" value="topology.kubernetes.io/region" />
              </ElSelect>
            </div>

            <div class="form-row">
              <label>说明</label>
              <ElInput
                v-model="rule.description"
                :readonly="!editing"
                type="textarea"
                :rows="2"
                placeholder="规则说明（可选）"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速配置模板 -->
    <ElCard v-if="editing" class="templates-card">
      <template #header>
        <div class="card-header">
          <Zap :size="14" />
          <span>快速配置</span>
        </div>
      </template>
      <div class="templates-grid">
        <div
          class="template-item"
          @click="applyTemplate('high-availability')"
        >
          <div class="template-icon">
            <Shield :size="20" />
          </div>
          <div class="template-info">
            <div class="template-name">高可用部署</div>
            <div class="template-desc">每台主机最多一个 Pod</div>
          </div>
        </div>
        <div
          class="template-item"
          @click="applyTemplate('zone-spread')"
        >
          <div class="template-icon">
            <Globe :size="20" />
          </div>
          <div class="template-info">
            <div class="template-name">跨可用区分散</div>
            <div class="template-desc">Pod 分散在不同可用区</div>
          </div>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Globe,
  Tag,
  RefreshCw,
  Plus,
  X,
  Users2,
  UserX2,
  Zap,
  Shield
} from 'lucide-vue-next'
import {
  getResourceLabelsApi,
  type OnecProjectVersion
} from '@/api'

interface Props {
  editing: boolean
  version: OnecProjectVersion
}

const props = defineProps<Props>()

const selfAffinityValue = defineModel<any[]>('selfAffinity', { default: [] })
const selfAntiAffinityValue = defineModel<any[]>('selfAntiAffinity', { default: [] })

const affinityType = ref<'affinity' | 'antiAffinity'>('affinity')
const loadingLabels = ref(false)
const currentLabels = ref<Record<string, string>>({})

const loadLabels = async () => {
  loadingLabels.value = true
  try {
    const response = await getResourceLabelsApi(props.version.id)
    currentLabels.value = response.labels || {}
  } catch (error) {
    console.error('获取标签失败:', error)
  } finally {
    loadingLabels.value = false
  }
}

const addRule = (type: 'affinity' | 'antiAffinity') => {
  const rule = {
    type: 'required',
    weight: 50,
    topologyKey: 'kubernetes.io/hostname',
    description: ''
  }

  if (type === 'affinity') {
    selfAffinityValue.value = [...selfAffinityValue.value, rule]
  } else {
    selfAntiAffinityValue.value = [...selfAntiAffinityValue.value, rule]
  }
}

const removeRule = (type: 'affinity' | 'antiAffinity', index: number) => {
  if (type === 'affinity') {
    selfAffinityValue.value = selfAffinityValue.value.filter((_, i) => i !== index)
  } else {
    selfAntiAffinityValue.value = selfAntiAffinityValue.value.filter((_, i) => i !== index)
  }
}

const applyTemplate = (template: string) => {
  if (template === 'high-availability') {
    selfAntiAffinityValue.value = [
      ...selfAntiAffinityValue.value,
      {
        type: 'required',
        weight: 100,
        topologyKey: 'kubernetes.io/hostname',
        description: '每台主机最多一个 Pod（高可用）'
      }
    ]
    ElMessage.success('已添加高可用配置')
  } else if (template === 'zone-spread') {
    selfAntiAffinityValue.value = [
      ...selfAntiAffinityValue.value,
      {
        type: 'preferred',
        weight: 100,
        topologyKey: 'topology.kubernetes.io/zone',
        description: 'Pod 尽量分散在不同可用区'
      }
    ]
    ElMessage.success('已添加跨可用区分散配置')
  }
}

onMounted(() => {
  loadLabels()
})
</script>

<style lang="scss" scoped>
.self-affinity-config {
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

  :deep(.el-alert) {
    margin-bottom: 16px;
  }

  .labels-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
    }

    .loading-box {
      height: 60px;
    }

    .labels-display {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .affinity-type-selector {
    margin-bottom: 20px;

    .type-radio-group {
      width: 100%;

      :deep(.el-radio-button) {
        flex: 1;

        .el-radio-button__inner {
          width: 100%;
          padding: 12px 20px;
          border-radius: 8px;

          &:hover {
            color: #409eff;
          }
        }

        &.is-active .el-radio-button__inner {
          background: #409eff;
          border-color: #409eff;
        }
      }

      .radio-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
    }
  }

  .affinity-content {
    .action-bar {
      margin-bottom: 16px;
    }

    .rules-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .rule-card {
        padding: 16px;
        background: #fafbfc;
        border: 1px solid #e4e7ed;
        border-radius: 8px;

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e4e7ed;

          .rule-number {
            font-size: 13px;
            font-weight: 600;
            color: #606266;
          }
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .form-row {
            display: flex;
            flex-direction: column;
            gap: 6px;

            label {
              font-size: 13px;
              font-weight: 500;
              color: #606266;
            }
          }
        }
      }
    }

    .empty-tip {
      padding: 40px 20px;
      text-align: center;
      font-size: 13px;
      color: #909399;
      background: #fafbfc;
      border: 1px dashed #e4e7ed;
      border-radius: 6px;
    }
  }

  .templates-card {
    margin-top: 20px;

    .card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;

      .template-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: #f5f7fa;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #409eff;
          background: #ecf5ff;
        }

        .template-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 6px;
          color: #409eff;
        }

        .template-info {
          flex: 1;

          .template-name {
            font-size: 13px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 2px;
          }

          .template-desc {
            font-size: 11px;
            color: #909399;
          }
        }
      }
    }
  }
}
</style>