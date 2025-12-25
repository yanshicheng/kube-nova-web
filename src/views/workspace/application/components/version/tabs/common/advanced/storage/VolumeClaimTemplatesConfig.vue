<template>
  <div class="volume-claim-templates-config">
    <div class="section-header">
      <div class="header-left">
        <Archive :size="18" />
        <h4>持久卷声明模板</h4>
      </div>
      <ElButton v-if="editing" type="primary" size="small" @click="addTemplate">
        <Plus :size="14" />
        添加 PVC 模板
      </ElButton>
    </div>

    <ElAlert type="info" :closable="false" show-icon>
      <template #title> StatefulSet 的 PVC 模板会为每个 Pod 创建独立的持久卷声明 </template>
    </ElAlert>

    <ElEmpty
      v-if="volumeClaimTemplatesValue.length === 0"
      description="暂无 PVC 模板配置"
      :image-size="80"
    >
      <ElButton v-if="editing" type="primary" @click="addTemplate"> 添加第一个 PVC 模板 </ElButton>
    </ElEmpty>

    <div v-else class="templates-list">
      <div
        v-for="(template, index) in volumeClaimTemplatesValue"
        :key="index"
        class="template-card"
      >
        <div class="template-card-header">
          <div class="template-info">
            <Archive :size="16" />
            <span class="template-name">{{ template.name }}</span>
            <ElTag v-for="mode in template.accessModes" :key="mode" size="small" type="primary">
              {{ getAccessModeLabel(mode) }}
            </ElTag>
          </div>
          <ElButton
            v-if="editing"
            type="danger"
            text
            circle
            size="small"
            @click="removeTemplate(index)"
          >
            <Trash2 :size="16" />
          </ElButton>
        </div>

        <div class="template-card-body">
          <!-- PVC 名称 -->
          <div class="form-item">
            <label>PVC 名称</label>
            <ElInput v-model="template.name" :readonly="!editing" placeholder="data" />
          </div>

          <!-- 存储类 -->
          <div class="form-item">
            <label>存储类（StorageClass）</label>
            <ElInput
              v-model="template.storageClassName"
              :readonly="!editing"
              placeholder="例如：fast-ssd, standard"
            />
          </div>

          <!-- 访问模式 -->
          <div class="form-item">
            <label>访问模式</label>
            <ElSelect
              v-model="template.accessModes"
              :disabled="!editing"
              multiple
              placeholder="选择访问模式"
            >
              <ElOption label="ReadWriteOnce（单节点读写）" value="ReadWriteOnce" />
              <ElOption label="ReadOnlyMany（多节点只读）" value="ReadOnlyMany" />
              <ElOption label="ReadWriteMany（多节点读写）" value="ReadWriteMany" />
              <ElOption label="ReadWriteOncePod（单 Pod 读写）" value="ReadWriteOncePod" />
            </ElSelect>
          </div>

          <!-- 存储容量 -->
          <div class="form-row">
            <div class="form-item">
              <label>请求容量（Requests）</label>
              <ElInput
                v-model="template.resources.requests.storage"
                :readonly="!editing"
                placeholder="例如：10Gi"
              >
                <template #append>Gi</template>
              </ElInput>
            </div>
            <div class="form-item">
              <label>限制容量（Limits）</label>
              <ElInput
                v-model="template.resources.limits!.storage"
                :readonly="!editing"
                placeholder="例如：20Gi（可选）"
              >
                <template #append>Gi</template>
              </ElInput>
            </div>
          </div>

          <!-- 卷模式 -->
          <div class="form-item">
            <label>卷模式</label>
            <ElSelect v-model="template.volumeMode" :disabled="!editing">
              <ElOption label="Filesystem（文件系统）" value="Filesystem" />
              <ElOption label="Block（块设备）" value="Block" />
            </ElSelect>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Archive, Plus, Trash2 } from 'lucide-vue-next'
  import type { PersistentVolumeClaimConfig } from '@/api'

  interface Props {
    editing: boolean
  }

  const props = defineProps<Props>()

  const volumeClaimTemplatesValue = defineModel<PersistentVolumeClaimConfig[]>(
    'volumeClaimTemplates',
    { default: [] }
  )

  const getAccessModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      ReadWriteOnce: 'RWO',
      ReadOnlyMany: 'ROX',
      ReadWriteMany: 'RWX',
      ReadWriteOncePod: 'RWOP'
    }
    return labels[mode] || mode
  }

  const addTemplate = () => {
    volumeClaimTemplatesValue.value.push({
      name: `data-${volumeClaimTemplatesValue.value.length + 1}`,
      storageClassName: '',
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: { storage: '10Gi' },
        limits: { storage: '' }
      },
      volumeMode: 'Filesystem'
    })
  }

  const removeTemplate = (index: number) => {
    volumeClaimTemplatesValue.value.splice(index, 1)
  }
</script>

<style lang="scss" scoped>
  .volume-claim-templates-config {
    padding: 20px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    :deep(.el-alert) {
      margin-bottom: 16px;
    }

    .templates-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 16px;
      margin-top: 16px;

      .template-card {
        background: #f9fafb;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        overflow: hidden;
        transition: all 0.2s;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
        }

        .template-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid #ebeef5;

          .template-info {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;

            .template-name {
              font-weight: 500;
              color: #303133;
            }
          }
        }

        .template-card-body {
          padding: 16px;

          .form-item {
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }

            label {
              display: block;
              margin-bottom: 6px;
              font-size: 13px;
              font-weight: 500;
              color: #606266;
            }
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
        }
      }
    }
  }
</style>
