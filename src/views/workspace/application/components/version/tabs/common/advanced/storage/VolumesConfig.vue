<template>
  <div class="volumes-config">
    <div class="section-header">
      <div class="header-left">
        <HardDrive :size="18" />
        <h4>存储卷配置</h4>
      </div>
      <ElButton v-if="editing" type="primary" size="small" @click="addVolume">
        <Plus :size="14" />
        添加存储卷
      </ElButton>
    </div>

    <ElAlert type="info" :closable="false" show-icon>
      <template #title>存储卷用于为 Pod 提供数据持久化或配置注入能力</template>
    </ElAlert>

    <ElEmpty v-if="volumesValue.length === 0" description="暂无存储卷配置" :image-size="80">
      <ElButton v-if="editing" type="primary" @click="addVolume"> 添加第一个存储卷 </ElButton>
    </ElEmpty>

    <div v-else class="volumes-grid">
      <div v-for="(volume, index) in volumesValue" :key="index" class="volume-card">
        <div class="volume-card-header">
          <div class="volume-info">
            <Database :size="16" />
            <span class="volume-name">{{ volume.name }}</span>
            <ElTag size="small" :type="getVolumeTypeColor(volume.type)">
              {{ getVolumeTypeLabel(volume.type) }}
            </ElTag>
          </div>
          <ElButton
            v-if="editing"
            type="danger"
            text
            circle
            size="small"
            @click="removeVolume(index)"
          >
            <Trash2 :size="16" />
          </ElButton>
        </div>

        <div class="volume-card-body">
          <!-- 卷名称 -->
          <div class="form-item">
            <label>卷名称</label>
            <ElInput v-model="volume.name" :readonly="!editing" placeholder="volume-1" />
          </div>

          <!-- 卷类型选择 -->
          <div class="form-item">
            <label>卷类型</label>
            <ElSelect
              v-model="volume.type"
              :disabled="!editing"
              @change="handleVolumeTypeChange(volume)"
            >
              <ElOption label="EmptyDir（临时存储）" value="emptyDir" />
              <ElOption label="HostPath（主机路径）" value="hostPath" />
              <ElOption label="ConfigMap（配置）" value="configMap" />
              <ElOption label="Secret（密钥）" value="secret" />
              <ElOption label="PVC（持久卷）" value="persistentVolumeClaim" />
              <ElOption label="NFS（网络文件系统）" value="nfs" />
            </ElSelect>
          </div>

          <!-- EmptyDir 配置 -->
          <template v-if="volume.type === 'emptyDir'">
            <div class="form-item">
              <label>存储介质</label>
              <ElSelect v-model="volume.emptyDir.medium" :disabled="!editing">
                <ElOption label="磁盘" value="" />
                <ElOption label="内存" value="Memory" />
              </ElSelect>
            </div>
            <div class="form-item">
              <label>大小限制</label>
              <ElInput
                v-model="volume.emptyDir.sizeLimit"
                :readonly="!editing"
                placeholder="例如：1Gi, 500Mi"
              />
            </div>
          </template>

          <!-- HostPath 配置 -->
          <template v-if="volume.type === 'hostPath'">
            <div class="form-item">
              <label>主机路径</label>
              <ElInput
                v-model="volume.hostPath.path"
                :readonly="!editing"
                placeholder="/data/app"
              />
            </div>
            <div class="form-item">
              <label>路径类型</label>
              <ElSelect v-model="volume.hostPath.type" :disabled="!editing">
                <ElOption label="默认" value="" />
                <ElOption label="Directory（目录）" value="Directory" />
                <ElOption label="File（文件）" value="File" />
                <ElOption label="DirectoryOrCreate（自动创建目录）" value="DirectoryOrCreate" />
                <ElOption label="FileOrCreate（自动创建文件）" value="FileOrCreate" />
              </ElSelect>
            </div>
          </template>

          <!-- ConfigMap 配置 -->
          <template v-if="volume.type === 'configMap'">
            <div class="form-item">
              <label>ConfigMap 名称</label>
              <ElInput
                v-model="volume.configMap.name"
                :readonly="!editing"
                placeholder="my-config"
              />
            </div>
          </template>

          <!-- Secret 配置 -->
          <template v-if="volume.type === 'secret'">
            <div class="form-item">
              <label>Secret 名称</label>
              <ElInput
                v-model="volume.secret.secretName"
                :readonly="!editing"
                placeholder="my-secret"
              />
            </div>
          </template>

          <!-- PVC 配置 -->
          <template v-if="volume.type === 'persistentVolumeClaim'">
            <div class="form-item">
              <label>PVC 名称</label>
              <ElInput
                v-model="volume.persistentVolumeClaim.claimName"
                :readonly="!editing"
                placeholder="my-pvc"
              />
            </div>
            <div class="form-item">
              <label>只读模式</label>
              <ElSwitch v-model="volume.persistentVolumeClaim.readOnly" :disabled="!editing" />
            </div>
          </template>

          <!-- NFS 配置 -->
          <template v-if="volume.type === 'nfs'">
            <div class="form-item">
              <label>NFS 服务器</label>
              <ElInput
                v-model="volume.nfs.server"
                :readonly="!editing"
                placeholder="192.168.1.100"
              />
            </div>
            <div class="form-item">
              <label>NFS 路径</label>
              <ElInput v-model="volume.nfs.path" :readonly="!editing" placeholder="/data/shared" />
            </div>
            <div class="form-item">
              <label>只读模式</label>
              <ElSwitch v-model="volume.nfs.readOnly" :disabled="!editing" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { HardDrive, Database, Plus, Trash2 } from 'lucide-vue-next'
  import type { VolumeConfig } from '@/api'

  interface Props {
    editing: boolean
  }

  const props = defineProps<Props>()

  const volumesValue = defineModel<VolumeConfig[]>('volumes', { default: [] })

  const getVolumeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      emptyDir: 'EmptyDir',
      hostPath: 'HostPath',
      configMap: 'ConfigMap',
      secret: 'Secret',
      persistentVolumeClaim: 'PVC',
      nfs: 'NFS'
    }
    return labels[type] || type
  }

  const getVolumeTypeColor = (type: string) => {
    const colors: Record<string, any> = {
      emptyDir: 'info',
      hostPath: 'warning',
      configMap: 'success',
      secret: 'danger',
      persistentVolumeClaim: 'primary',
      nfs: ''
    }
    return colors[type] || ''
  }

  const addVolume = () => {
    volumesValue.value.push({
      name: `volume-${volumesValue.value.length + 1}`,
      type: 'emptyDir',
      emptyDir: { medium: '', sizeLimit: '' }
    })
  }

  const removeVolume = (index: number) => {
    volumesValue.value.splice(index, 1)
  }

  const handleVolumeTypeChange = (volume: VolumeConfig) => {
    const typeDefaults: Record<string, any> = {
      emptyDir: { emptyDir: { medium: '', sizeLimit: '' } },
      hostPath: { hostPath: { path: '', type: '' } },
      configMap: { configMap: { name: '' } },
      secret: { secret: { secretName: '' } },
      persistentVolumeClaim: { persistentVolumeClaim: { claimName: '', readOnly: false } },
      nfs: { nfs: { server: '', path: '', readOnly: false } }
    }
    Object.assign(volume, typeDefaults[volume.type] || {})
  }
</script>

<style lang="scss" scoped>
  .volumes-config {
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

    .volumes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
      margin-top: 16px;

      .volume-card {
        background: #f9fafb;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        overflow: hidden;
        transition: all 0.2s;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
        }

        .volume-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid #ebeef5;

          .volume-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .volume-name {
              font-weight: 500;
              color: #303133;
            }
          }
        }

        .volume-card-body {
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
        }
      }
    }
  }
</style>
