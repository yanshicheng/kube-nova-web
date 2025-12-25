<template>
  <div class="topology-spread-config">
    <div class="section-header">
      <Layers :size="18" />
      <h4>拓扑分布约束</h4>
    </div>

    <ElAlert type="info" :closable="false" show-icon>
      <template #title>控制 Pod 在拓扑域（节点、可用区等）中的分布均匀性</template>
    </ElAlert>

    <div class="action-bar">
      <ElButton v-if="editing" type="primary" size="small" @click="addConstraint">
        <Plus :size="14" />
        添加约束
      </ElButton>
    </div>

    <div v-if="constraintsValue.length === 0" class="empty-tip">暂无拓扑分布约束</div>

    <div v-else class="constraints-list">
      <div v-for="(constraint, index) in constraintsValue" :key="index" class="constraint-card">
        <div class="card-header">
          <div class="header-left">
            <span class="constraint-number">#{{ index + 1 }}</span>
            <ElTag size="small" :type="getConstraintTypeTag(constraint.whenUnsatisfiable)">
              {{ constraint.whenUnsatisfiable === 'DoNotSchedule' ? '硬约束' : '软约束' }}
            </ElTag>
          </div>
          <ElButton
            v-if="editing"
            type="danger"
            text
            circle
            size="small"
            @click="removeConstraint(index)"
          >
            <Trash2 :size="16" />
          </ElButton>
        </div>

        <div class="card-content">
          <div class="form-grid">
            <div class="form-row">
              <label class="required">拓扑域</label>
              <ElSelect
                v-model="constraint.topologyKey"
                :disabled="!editing"
                placeholder="选择拓扑域"
                popper-class="topology-select-dropdown"
              >
                <ElOption
                  v-for="topo in topologyOptions"
                  :key="topo.value"
                  :label="topo.label"
                  :value="topo.value"
                >
                  <span class="select-option-wrapper">
                    <component
                      :is="topo.icon"
                      :size="14"
                      style="margin-right: 8px; flex-shrink: 0"
                    />
                    <span style="flex: 1">{{ topo.label }}</span>
                  </span>
                </ElOption>
              </ElSelect>
            </div>

            <div class="form-row">
              <label class="required">最大偏差</label>
              <ElInputNumber
                v-model="constraint.maxSkew"
                :disabled="!editing"
                :min="1"
                :max="10"
                placeholder="1"
                style="width: 100%"
              />
              <div class="field-hint">拓扑域之间最多相差的 Pod 数量</div>
            </div>

            <div class="form-row">
              <label class="required">不满足时</label>
              <ElSelect v-model="constraint.whenUnsatisfiable" :disabled="!editing">
                <ElOption label="DoNotSchedule（硬约束：不满足则不调度）" value="DoNotSchedule" />
                <ElOption label="ScheduleAnyway（软约束：尽量满足）" value="ScheduleAnyway" />
              </ElSelect>
            </div>

            <div class="form-row">
              <label>最少域数</label>
              <ElInputNumber
                v-model="constraint.minDomains"
                :disabled="!editing"
                :min="1"
                :max="10"
                placeholder="可选"
                style="width: 100%"
              />
              <div class="field-hint">至少分布在多少个拓扑域（留空表示不限制）</div>
            </div>

            <div class="form-row">
              <label>节点亲和策略</label>
              <ElSelect
                v-model="constraint.nodeAffinityPolicy"
                :disabled="!editing"
                clearable
                placeholder="可选"
              >
                <ElOption label="Honor（考虑节点亲和性）" value="Honor" />
                <ElOption label="Ignore（忽略节点亲和性）" value="Ignore" />
              </ElSelect>
            </div>

            <div class="form-row">
              <label>节点污点策略</label>
              <ElSelect
                v-model="constraint.nodeTaintsPolicy"
                :disabled="!editing"
                clearable
                placeholder="可选"
              >
                <ElOption label="Honor（考虑节点污点）" value="Honor" />
                <ElOption label="Ignore（忽略节点污点）" value="Ignore" />
              </ElSelect>
            </div>
          </div>

          <!-- 预览效果 -->
          <div class="preview-box">
            <div class="preview-title">
              <Info :size="14" />
              <span>配置效果</span>
            </div>
            <div class="preview-content">
              {{ getConstraintDescription(constraint) }}
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
          <span>快速配置模板</span>
        </div>
      </template>
      <div class="templates-grid">
        <div
          v-for="template in templates"
          :key="template.name"
          class="template-item"
          @click="applyTemplate(template)"
        >
          <div class="template-icon">
            <component :is="template.icon" :size="20" />
          </div>
          <div class="template-info">
            <div class="template-name">{{ template.name }}</div>
            <div class="template-desc">{{ template.desc }}</div>
          </div>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Layers, Plus, Trash2, Zap, Info, Server, Globe, Map } from 'lucide-vue-next'

  interface Props {
    editing: boolean
  }

  const props = defineProps<Props>()

  const constraintsValue = defineModel<any[]>('constraints', { default: [] })

  const topologyOptions = [
    {
      value: 'kubernetes.io/hostname',
      label: '节点级别',
      desc: '按主机名分布',
      icon: Server
    },
    {
      value: 'topology.kubernetes.io/zone',
      label: '可用区级别',
      desc: '按可用区分布',
      icon: Globe
    },
    {
      value: 'topology.kubernetes.io/region',
      label: '区域级别',
      desc: '按区域分布',
      icon: Map
    }
  ]

  const templates = [
    {
      name: '跨主机均匀分布',
      desc: 'maxSkew=1，每台主机相差不超过1个Pod',
      icon: Server,
      config: {
        maxSkew: 1,
        topologyKey: 'kubernetes.io/hostname',
        whenUnsatisfiable: 'DoNotSchedule',
        minDomains: undefined,
        nodeAffinityPolicy: 'Honor',
        nodeTaintsPolicy: 'Honor'
      }
    },
    {
      name: '跨可用区均匀分布',
      desc: 'maxSkew=1，每个可用区相差不超过1个Pod',
      icon: Globe,
      config: {
        maxSkew: 1,
        topologyKey: 'topology.kubernetes.io/zone',
        whenUnsatisfiable: 'DoNotSchedule',
        minDomains: 3,
        nodeAffinityPolicy: 'Honor',
        nodeTaintsPolicy: 'Honor'
      }
    },
    {
      name: '尽量跨主机分布',
      desc: 'maxSkew=2，尽力而为的主机分布',
      icon: Server,
      config: {
        maxSkew: 2,
        topologyKey: 'kubernetes.io/hostname',
        whenUnsatisfiable: 'ScheduleAnyway',
        minDomains: undefined,
        nodeAffinityPolicy: 'Honor',
        nodeTaintsPolicy: 'Ignore'
      }
    }
  ]

  const getConstraintTypeTag = (whenUnsatisfiable: string) => {
    return whenUnsatisfiable === 'DoNotSchedule' ? 'danger' : 'warning'
  }

  const getConstraintDescription = (constraint: any) => {
    const topoName =
      topologyOptions.find((t) => t.value === constraint.topologyKey)?.label || '拓扑域'
    const constraintType = constraint.whenUnsatisfiable === 'DoNotSchedule' ? '必须' : '尽量'

    let desc = `${constraintType}确保 Pod 在不同${topoName}之间均匀分布，最多相差 ${constraint.maxSkew} 个 Pod。`

    if (constraint.minDomains) {
      desc += ` 至少分布在 ${constraint.minDomains} 个${topoName}。`
    }

    return desc
  }

  const addConstraint = () => {
    constraintsValue.value = [
      ...constraintsValue.value,
      {
        maxSkew: 1,
        topologyKey: 'kubernetes.io/hostname',
        whenUnsatisfiable: 'DoNotSchedule',
        minDomains: undefined,
        nodeAffinityPolicy: 'Honor',
        nodeTaintsPolicy: 'Honor',
        labelSelector: undefined
      }
    ]
  }

  const removeConstraint = (index: number) => {
    constraintsValue.value = constraintsValue.value.filter((_, i) => i !== index)
  }

  const applyTemplate = (template: any) => {
    constraintsValue.value = [...constraintsValue.value, { ...template.config }]
    ElMessage.success(`已添加"${template.name}"配置`)
  }
</script>

<style lang="scss" scoped>
  .topology-spread-config {
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

    :deep(.el-alert) {
      margin-bottom: 16px;
    }

    .action-bar {
      margin-bottom: 16px;
    }

    .constraints-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;

      .constraint-card {
        padding: 16px;
        background: #fafbfc;
        border: 1px solid #e4e7ed;
        border-radius: 8px;

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e4e7ed;

          .header-left {
            display: flex;
            align-items: center;
            gap: 8px;

            .constraint-number {
              font-size: 13px;
              font-weight: 600;
              color: #606266;
            }
          }
        }

        .card-content {
          .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 16px;

            .form-row {
              display: flex;
              flex-direction: column;
              gap: 6px;

              label {
                font-size: 13px;
                font-weight: 500;
                color: #606266;

                &.required::after {
                  content: ' *';
                  color: #f56c6c;
                }
              }

              .field-hint {
                font-size: 11px;
                color: #909399;
                margin-top: 2px;
              }
            }
          }

          .preview-box {
            padding: 12px;
            background: #ecf5ff;
            border: 1px solid #d9ecff;
            border-radius: 6px;

            .preview-title {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 8px;
              font-size: 13px;
              font-weight: 600;
              color: #409eff;
            }

            .preview-content {
              font-size: 12px;
              color: #606266;
              line-height: 1.6;
            }
          }
        }
      }
    }

    /* 修复下拉选项显示 */
    :deep(.el-select-dropdown__item) {
      height: auto;
      padding: 8px 12px;

      .topo-option-content {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;

        .topo-icon {
          flex-shrink: 0;
          color: #409eff;
        }

        .topo-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;

          .topo-name {
            font-size: 13px;
            font-weight: 500;
            color: #303133;
            line-height: 1.4;
          }

          .topo-desc {
            font-size: 11px;
            color: #909399;
            line-height: 1.3;
          }
        }
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
        grid-template-columns: repeat(3, 1fr);
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
</style>
