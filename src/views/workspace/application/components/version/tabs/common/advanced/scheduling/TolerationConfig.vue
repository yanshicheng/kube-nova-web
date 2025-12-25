<template>
  <div class="toleration-config">
    <div class="section-header">
      <Shield :size="18" />
      <h4>污点容忍配置</h4>
    </div>

    <ElAlert type="info" :closable="false" show-icon>
      <template #title>配置容忍规则，允许 Pod 调度到带有特定污点的节点</template>
    </ElAlert>

    <div class="action-bar">
      <ElButton v-if="editing" type="primary" size="small" @click="addToleration">
        <Plus :size="14" />
        添加容忍
      </ElButton>
    </div>

    <div v-if="tolerationsValue.length === 0" class="empty-tip">暂无容忍配置</div>

    <div v-else class="tolerations-list">
      <div v-for="(toleration, index) in tolerationsValue" :key="index" class="toleration-item">
        <div class="item-header">
          <span class="item-number">#{{ index + 1 }}</span>
          <ElButton
            v-if="editing"
            type="danger"
            text
            circle
            size="small"
            @click="removeToleration(index)"
          >
            <Trash2 :size="16" />
          </ElButton>
        </div>

        <div class="item-content">
          <div class="form-row">
            <label>污点键 (Key)</label>
            <ElInput
              v-model="toleration.key"
              :readonly="!editing"
              placeholder="例如: node.kubernetes.io/disk-pressure"
            />
          </div>

          <div class="form-row">
            <label>操作符 (Operator)</label>
            <ElSelect v-model="toleration.operator" :disabled="!editing">
              <ElOption label="Equal（等于：键和值都匹配）" value="Equal" />
              <ElOption label="Exists（存在：只匹配键）" value="Exists" />
            </ElSelect>
          </div>

          <div v-if="toleration.operator === 'Equal'" class="form-row">
            <label>污点值 (Value)</label>
            <ElInput v-model="toleration.value" :readonly="!editing" placeholder="污点值" />
          </div>

          <div class="form-row">
            <label>效果 (Effect)</label>
            <ElSelect v-model="toleration.effect" :disabled="!editing">
              <ElOption label="NoSchedule（不调度新 Pod）" value="NoSchedule" />
              <ElOption label="PreferNoSchedule（尽量不调度）" value="PreferNoSchedule" />
              <ElOption label="NoExecute（驱逐已有 Pod）" value="NoExecute" />
            </ElSelect>
          </div>

          <div v-if="toleration.effect === 'NoExecute'" class="form-row">
            <label>容忍时间 (秒)</label>
            <ElInputNumber
              v-model="toleration.tolerationSeconds"
              :disabled="!editing"
              :min="0"
              placeholder="永久容忍（留空）"
              style="width: 100%"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 常用配置模板 -->
    <ElCard v-if="editing" class="templates-card">
      <template #header>
        <div class="card-header">
          <Zap :size="14" />
          <span>常用模板</span>
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
  import { Shield, Plus, Trash2, Zap, Server, Cpu, HardDrive } from 'lucide-vue-next'

  interface Props {
    editing: boolean
  }

  const props = defineProps<Props>()

  const tolerationsValue = defineModel<any[]>('tolerations', { default: [] })

  const templates = [
    {
      name: 'Master 节点',
      desc: '允许调度到 Master 节点',
      icon: Server,
      config: {
        key: 'node-role.kubernetes.io/master',
        operator: 'Exists',
        effect: 'NoSchedule'
      }
    },
    {
      name: 'GPU 节点',
      desc: '允许调度到 GPU 节点',
      icon: Cpu,
      config: {
        key: 'nvidia.com/gpu',
        operator: 'Exists',
        effect: 'NoSchedule'
      }
    },
    {
      name: '磁盘压力',
      desc: '容忍磁盘压力污点',
      icon: HardDrive,
      config: {
        key: 'node.kubernetes.io/disk-pressure',
        operator: 'Exists',
        effect: 'NoSchedule'
      }
    }
  ]

  const addToleration = () => {
    tolerationsValue.value = [
      ...tolerationsValue.value,
      {
        key: '',
        operator: 'Equal',
        value: '',
        effect: 'NoSchedule'
      }
    ]
  }

  const removeToleration = (index: number) => {
    tolerationsValue.value = tolerationsValue.value.filter((_, i) => i !== index)
  }

  const applyTemplate = (template: any) => {
    tolerationsValue.value = [...tolerationsValue.value, { ...template.config }]
  }
</script>

<style lang="scss" scoped>
  .toleration-config {
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

    .tolerations-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;

      .toleration-item {
        padding: 16px;
        background: #fafbfc;
        border: 1px solid #e4e7ed;
        border-radius: 8px;

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e4e7ed;

          .item-number {
            font-size: 13px;
            font-weight: 600;
            color: #606266;
          }
        }

        .item-content {
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
