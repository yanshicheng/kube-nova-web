<template>
  <div class="service-affinity-config">
    <div class="section-header">
      <Users :size="18" />
      <h4>服务亲和性配置</h4>
    </div>

    <ElAlert type="info" :closable="false" show-icon>
      <template #title>配置与其他服务的亲和或反亲和关系</template>
    </ElAlert>

    <!-- 使用 Radio 切换 -->
    <div class="affinity-type-selector">
      <ElRadioGroup v-model="affinityType" class="type-radio-group">
        <ElRadioButton value="affinity">
          <div class="radio-content">
            <UserPlus :size="16" />
            <span>Pod 亲和性</span>
            <ElBadge v-if="podAffinityValue.length > 0" :value="podAffinityValue.length" />
          </div>
        </ElRadioButton>
        <ElRadioButton value="antiAffinity">
          <div class="radio-content">
            <UserMinus :size="16" />
            <span>Pod 反亲和性</span>
            <ElBadge v-if="podAntiAffinityValue.length > 0" :value="podAntiAffinityValue.length" />
          </div>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- Pod 亲和性 -->
    <div v-if="affinityType === 'affinity'" class="affinity-content">
      <div class="action-bar">
        <ElButton v-if="editing" type="primary" size="small" @click="addAffinityRule('affinity')">
          <Plus :size="14" />
          添加亲和规则
        </ElButton>
      </div>

      <div v-if="podAffinityValue.length === 0" class="empty-tip">
        让 Pod 尽量与指定服务部署在一起（降低网络延迟）
      </div>

      <div v-else class="rules-list">
        <div v-for="(rule, index) in podAffinityValue" :key="index" class="rule-card">
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
              @click="removeAffinityRule('affinity', index)"
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
              <label>目标服务</label>
              <ElSelect
                v-model="rule.applicationId"
                :disabled="!editing"
                :loading="loadingApplications"
                filterable
                placeholder="选择服务"
                @change="handleApplicationChange(rule, 'affinity')"
                @focus="loadApplications"
              >
                <ElOption
                  v-for="app in applications"
                  :key="app.id"
                  :label="app.nameCn || app.nameEn"
                  :value="app.id"
                >
                  <div class="app-option">
                    <span>{{ app.nameCn || app.nameEn }}</span>
                    <ElTag size="small" type="info">{{ app.resourceType }}</ElTag>
                  </div>
                </ElOption>
              </ElSelect>
            </div>

            <div v-if="rule.applicationId" class="form-row">
              <label>目标版本</label>
              <ElSelect
                v-model="rule.versionId"
                :disabled="!editing"
                :loading="loadingVersions[rule.applicationId]"
                filterable
                placeholder="选择版本"
                @change="handleVersionChange(rule, 'affinity')"
                @focus="loadVersions(rule.applicationId)"
              >
                <ElOption
                  v-for="version in versionsMap[rule.applicationId] || []"
                  :key="version.id"
                  :label="version.version"
                  :value="version.id"
                />
              </ElSelect>
            </div>

            <div v-if="rule.versionId && Object.keys(rule.labelSelector).length > 0" class="form-row">
              <label>标签选择器</label>
              <div class="labels-display">
                <ElTag
                  v-for="(value, key) in rule.labelSelector"
                  :key="key"
                  size="small"
                  closable
                  :disable-transitions="false"
                  @close="!editing || removeLabel(rule, key)"
                >
                  {{ key }}={{ value }}
                </ElTag>
              </div>
            </div>

            <div class="form-row">
              <label>拓扑域</label>
              <ElSelect v-model="rule.topologyKey" :disabled="!editing">
                <ElOption label="节点级别（同一主机）" value="kubernetes.io/hostname" />
                <ElOption label="可用区级别" value="topology.kubernetes.io/zone" />
                <ElOption label="区域级别" value="topology.kubernetes.io/region" />
              </ElSelect>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pod 反亲和性 -->
    <div v-else class="affinity-content">
      <div class="action-bar">
        <ElButton v-if="editing" type="primary" size="small" @click="addAffinityRule('antiAffinity')">
          <Plus :size="14" />
          添加反亲和规则
        </ElButton>
      </div>

      <div v-if="podAntiAffinityValue.length === 0" class="empty-tip">
        让 Pod 尽量与指定服务分散部署（提高可用性）
      </div>

      <div v-else class="rules-list">
        <div v-for="(rule, index) in podAntiAffinityValue" :key="index" class="rule-card">
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
              @click="removeAffinityRule('antiAffinity', index)"
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
              <label>目标服务</label>
              <ElSelect
                v-model="rule.applicationId"
                :disabled="!editing"
                :loading="loadingApplications"
                filterable
                placeholder="选择服务"
                @change="handleApplicationChange(rule, 'antiAffinity')"
                @focus="loadApplications"
              >
                <ElOption
                  v-for="app in applications"
                  :key="app.id"
                  :label="app.nameCn || app.nameEn"
                  :value="app.id"
                >
                  <div class="app-option">
                    <span>{{ app.nameCn || app.nameEn }}</span>
                    <ElTag size="small" type="info">{{ app.resourceType }}</ElTag>
                  </div>
                </ElOption>
              </ElSelect>
            </div>

            <div v-if="rule.applicationId" class="form-row">
              <label>目标版本</label>
              <ElSelect
                v-model="rule.versionId"
                :disabled="!editing"
                :loading="loadingVersions[rule.applicationId]"
                filterable
                placeholder="选择版本"
                @change="handleVersionChange(rule, 'antiAffinity')"
                @focus="loadVersions(rule.applicationId)"
              >
                <ElOption
                  v-for="version in versionsMap[rule.applicationId] || []"
                  :key="version.id"
                  :label="version.version"
                  :value="version.id"
                />
              </ElSelect>
            </div>

            <div v-if="rule.versionId && Object.keys(rule.labelSelector).length > 0" class="form-row">
              <label>标签选择器</label>
              <div class="labels-display">
                <ElTag
                  v-for="(value, key) in rule.labelSelector"
                  :key="key"
                  size="small"
                  closable
                  :disable-transitions="false"
                  @close="!editing || removeLabel(rule, key)"
                >
                  {{ key }}={{ value }}
                </ElTag>
              </div>
            </div>

            <div class="form-row">
              <label>拓扑域</label>
              <ElSelect v-model="rule.topologyKey" :disabled="!editing">
                <ElOption label="节点级别（同一主机）" value="kubernetes.io/hostname" />
                <ElOption label="可用区级别" value="topology.kubernetes.io/zone" />
                <ElOption label="区域级别" value="topology.kubernetes.io/region" />
              </ElSelect>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Users, UserPlus, UserMinus, Plus, X } from 'lucide-vue-next'
import {
  searchApplicationApi,
  searchVersionApi,
  getResourceLabelsApi,
  type OnecProjectVersion,
  type ProjectCluster,
  type ProjectWorkspace,
  type OnecProjectApplication,
  type OnecProjectVersion as VersionInfo
} from '@/api'

interface Props {
  editing: boolean
  version: OnecProjectVersion
  cluster: ProjectCluster | null
  workspace: ProjectWorkspace | null
}

const props = defineProps<Props>()

const podAffinityValue = defineModel<any[]>('podAffinity', { default: [] })
const podAntiAffinityValue = defineModel<any[]>('podAntiAffinity', { default: [] })

const affinityType = ref<'affinity' | 'antiAffinity'>('affinity')
const loadingApplications = ref(false)
const applications = ref<OnecProjectApplication[]>([])
const loadingVersions = reactive<Record<number, boolean>>({})
const versionsMap = reactive<Record<number, VersionInfo[]>>({})

const loadApplications = async () => {
  if (loadingApplications.value || applications.value.length > 0) return
  if (!props.workspace?.id) {
    return
  }

  loadingApplications.value = true
  try {
    const response = await searchApplicationApi({
      workspaceId: props.workspace.id
    })
    applications.value = (response || []).filter(app => app.id !== props.version.applicationId)
  } catch (error) {
    console.error('加载服务列表失败:', error)
  } finally {
    loadingApplications.value = false
  }
}

const loadVersions = async (applicationId: number) => {
  if (loadingVersions[applicationId] || versionsMap[applicationId]) return

  loadingVersions[applicationId] = true
  try {
    const response = await searchVersionApi({ applicationId })
    versionsMap[applicationId] = response || []
  } catch (error) {
    console.error('加载版本列表失败:', error)
  } finally {
    loadingVersions[applicationId] = false
  }
}

const handleApplicationChange = (rule: any, type: 'affinity' | 'antiAffinity') => {
  rule.versionId = null
  rule.labelSelector = {}
}

const handleVersionChange = async (rule: any, type: 'affinity' | 'antiAffinity') => {
  if (!rule.versionId) {
    rule.labelSelector = {}
    return
  }

  try {
    const response = await getResourceLabelsApi(rule.versionId)
    rule.labelSelector = response.labels || {}
  } catch (error) {
    console.error('获取标签失败:', error)
    rule.labelSelector = {}
  }
}

const addAffinityRule = (type: 'affinity' | 'antiAffinity') => {
  const rule = {
    type: 'required',
    weight: 50,
    applicationId: null,
    versionId: null,
    labelSelector: {},
    topologyKey: 'kubernetes.io/hostname',
    namespaces: []
  }

  if (type === 'affinity') {
    podAffinityValue.value = [...podAffinityValue.value, rule]
  } else {
    podAntiAffinityValue.value = [...podAntiAffinityValue.value, rule]
  }
}

const removeAffinityRule = (type: 'affinity' | 'antiAffinity', index: number) => {
  if (type === 'affinity') {
    podAffinityValue.value = podAffinityValue.value.filter((_, i) => i !== index)
  } else {
    podAntiAffinityValue.value = podAntiAffinityValue.value.filter((_, i) => i !== index)
  }
}

const removeLabel = (rule: any, key: string) => {
  const newLabels = { ...rule.labelSelector }
  delete newLabels[key]
  rule.labelSelector = newLabels
}
</script>

<style lang="scss" scoped>
.service-affinity-config {
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

          .labels-display {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 8px;
            background: white;
            border: 1px solid #e4e7ed;
            border-radius: 4px;
            min-height: 40px;
          }
        }
      }
    }

    .app-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
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
}
</style>