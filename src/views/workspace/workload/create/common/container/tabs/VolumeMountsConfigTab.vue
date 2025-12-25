<template>
  <div class="volume-mounts-config-tab">
    <div class="tab-header">
      <div class="tab-description">
        <Info :size="16" />
        <span>配置容器的存储卷挂载点，将 Pod 级别的存储卷挂载到容器内的路径</span>
      </div>
      <ElButton type="primary" size="small" @click="addVolumeMount">
        <Plus :size="14" style="margin-right: 4px" />
        添加挂载
      </ElButton>
    </div>

    <!-- 提示：没有可用的存储卷 -->
    <ElAlert
      v-if="availableVolumes.length === 0"
      type="warning"
      :closable="false"
      style="margin-bottom: 16px"
    >
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px">
          <AlertTriangle :size="16" />
          暂无可用的存储卷
        </div>
      </template>
      <p style="margin: 4px 0 0; font-size: 12px">
        请先在"存储卷配置"步骤中创建存储卷，然后再进行挂载配置
      </p>
    </ElAlert>

    <ElEmpty
      v-if="volumeMounts.length === 0 && availableVolumes.length > 0"
      description="暂无存储卷挂载配置"
      :image-size="80"
    >
      <ElButton type="primary" plain @click="addVolumeMount">
        <Plus :size="14" style="margin-right: 4px" />
        添加第一个挂载
      </ElButton>
    </ElEmpty>

    <div v-else-if="availableVolumes.length > 0" class="volume-mounts-list">
      <div v-for="(mount, index) in volumeMounts" :key="index" class="volume-mount-item">
        <div class="volume-mount-item-header">
          <div class="volume-mount-item-title">
            <FolderOpen :size="16" />
            <span>挂载 {{ index + 1 }}</span>
            <ElTag v-if="mount.name" size="small" type="success">{{ mount.name }}</ElTag>
          </div>
          <ElButton type="danger" text size="small" @click="removeVolumeMount(index)">
            <Trash2 :size="14" style="margin-right: 4px" />
            删除
          </ElButton>
        </div>

        <ElForm :model="mount" label-width="120px" size="small">
          <ElFormItem label="存储卷名称" required>
            <ElSelect
              v-model="mount.name"
              placeholder="选择存储卷"
              filterable
              @change="updateVolumeMounts"
            >
              <ElOption
                v-for="vol in availableVolumes"
                :key="vol.name"
                :label="vol.name"
                :value="vol.name"
              >
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span>{{ vol.name }}</span>
                  <ElTag size="small" type="info">{{ getVolumeType(vol) }}</ElTag>
                </div>
              </ElOption>
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="挂载路径" required>
            <ElInput
              v-model="mount.mountPath"
              placeholder="例如: /data"
              @input="updateVolumeMounts"
            >
              <template #prepend>
                <Folder :size="14" />
              </template>
            </ElInput>
          </ElFormItem>

          <ElRow :gutter="16">
            <ElCol :span="12">
              <ElFormItem label="只读">
                <ElSwitch v-model="mount.readOnly" @change="updateVolumeMounts" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="挂载传播">
                <ElSelect
                  v-model="mount.mountPropagation"
                  placeholder="选择挂载传播方式"
                  clearable
                  @change="updateVolumeMounts"
                >
                  <ElOption label="None" value="None" />
                  <ElOption label="HostToContainer" value="HostToContainer" />
                  <ElOption label="Bidirectional" value="Bidirectional" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>

          <ElFormItem label="子路径">
            <ElInput
              v-model="mount.subPath"
              placeholder="挂载存储卷的子路径"
              @input="updateVolumeMounts"
            />
          </ElFormItem>

          <ElFormItem label="子路径表达式">
            <ElInput
              v-model="mount.subPathExpr"
              placeholder="使用环境变量展开的子路径"
              @input="updateVolumeMounts"
            />
          </ElFormItem>
        </ElForm>
      </div>
    </div>

    <div v-if="volumeMounts.length > 0" class="quick-actions">
      <ElButton size="small" @click="addCommonMounts">
        <Zap :size="14" style="margin-right: 4px" />
        添加常用挂载
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useContainersStore } from '@/store/workload'
  import { useVolumesStore } from '@/store/workload'
  import { Plus, Info, FolderOpen, Trash2, Folder, Zap, AlertTriangle } from 'lucide-vue-next'
  import { ElMessage } from 'element-plus'
  import type { V1Volume } from '@kubernetes/client-node'

  const containersStore = useContainersStore()
  const volumesStore = useVolumesStore()

  // 可用的存储卷列表
  const availableVolumes = computed(() => volumesStore.volumes)

  // 存储卷挂载列表
  const volumeMounts = computed(() => {
    const container = containersStore.selectedContainer
    return container?.volumeMounts || []
  })

  // 获取存储卷类型
  function getVolumeType(volume: V1Volume): string {
    // 常用卷类型
    if (volume.emptyDir) return 'EmptyDir'
    if (volume.hostPath) return 'HostPath'
    if (volume.persistentVolumeClaim) return 'PVC'
    if (volume.configMap) return 'ConfigMap'
    if (volume.secret) return 'Secret'
    if (volume.nfs) return 'NFS'
    if (volume.csi) return 'CSI'

    // Projected 卷（包含 serviceAccountToken、configMap、secret、downwardAPI）
    if (volume.projected) return 'Projected'

    // DownwardAPI 卷
    if (volume.downwardAPI) return 'DownwardAPI'

    // 云存储卷类型
    if (volume.awsElasticBlockStore) return 'AWS EBS'
    if (volume.azureDisk) return 'Azure Disk'
    if (volume.azureFile) return 'Azure File'
    if (volume.gcePersistentDisk) return 'GCE PD'

    // 分布式存储
    if (volume.cephfs) return 'CephFS'
    if (volume.cinder) return 'Cinder'
    if (volume.fc) return 'FC'
    if (volume.flexVolume) return 'FlexVolume'
    if (volume.flocker) return 'Flocker'
    if (volume.glusterfs) return 'GlusterFS'
    if (volume.iscsi) return 'iSCSI'
    if (volume.rbd) return 'RBD'

    // 其他卷类型
    if (volume.gitRepo) return 'GitRepo'
    if (volume.photonPersistentDisk) return 'Photon PD'
    if (volume.portworxVolume) return 'Portworx'
    if (volume.quobyte) return 'Quobyte'
    if (volume.scaleIO) return 'ScaleIO'
    if (volume.storageos) return 'StorageOS'
    if (volume.vsphereVolume) return 'vSphere'

    // 临时卷（K8s 1.21+）
    if (volume.ephemeral) return 'Ephemeral'

    // 自定义类型检测（兼容非标准字段）
    if ((volume as any).cifs) return 'CIFS'

    return 'Unknown'
  }

  // 添加存储卷挂载
  function addVolumeMount() {
    if (availableVolumes.value.length === 0) {
      ElMessage.error({
        message: '请先在"存储卷配置"步骤中创建存储卷',
        duration: 3000
      })
      return
    }

    const container = containersStore.selectedContainer
    if (!container) return

    const newMounts = [
      ...(container.volumeMounts || []),
      {
        name: '',
        mountPath: '',
        readOnly: false,
        mountPropagation: undefined,
        subPath: '',
        subPathExpr: ''
      }
    ]

    containersStore.updateContainer(container.id, { volumeMounts: newMounts })
  }

  // 删除存储卷挂载
  function removeVolumeMount(index: number) {
    const container = containersStore.selectedContainer
    if (!container) return

    const newMounts = [...(container.volumeMounts || [])]
    newMounts.splice(index, 1)

    containersStore.updateContainer(container.id, { volumeMounts: newMounts })
  }

  // 更新存储卷挂载
  function updateVolumeMounts() {
    const container = containersStore.selectedContainer
    if (!container) return

    containersStore.updateContainer(container.id, { volumeMounts: volumeMounts.value })
  }

  // 添加常用挂载
  function addCommonMounts() {
    if (availableVolumes.value.length === 0) {
      return
    }

    const container = containersStore.selectedContainer
    if (!container) return

    const currentMounts = container.volumeMounts || []
    const commonPaths = [
      { path: '/data', desc: '数据目录' },
      { path: '/logs', desc: '日志目录' },
      { path: '/config', desc: '配置目录' },
      { path: '/tmp', desc: '临时目录' }
    ]

    // 为第一个可用的卷创建常用挂载
    const firstVolume = availableVolumes.value[0]
    const existingPaths = new Set(currentMounts.map((m) => m.mountPath))

    const mountsToAdd = commonPaths
      .filter((p) => !existingPaths.has(p.path))
      .map((p) => ({
        name: firstVolume.name,
        mountPath: p.path,
        readOnly: false
      }))

    if (mountsToAdd.length === 0) {
      ElMessage.info('所有常用路径已挂载')
      return
    }

    containersStore.updateContainer(container.id, {
      volumeMounts: [...currentMounts, ...mountsToAdd]
    })

    ElMessage.success(`已添加 ${mountsToAdd.length} 个挂载点`)
  }
</script>

<style lang="scss" scoped>
  .volume-mounts-config-tab {
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ebeef5;

      .tab-description {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #606266;
      }
    }

    .volume-mounts-list {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .volume-mount-item {
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        border: 1px solid #e4e7ed;
        transition: all 0.3s;

        &:hover {
          border-color: #e6a23c;
          box-shadow: 0 2px 8px rgba(230, 162, 60, 0.1);
        }

        .volume-mount-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .volume-mount-item-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #303133;
          }
        }

        ::v-deep(.el-form-item) {
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .quick-actions {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #ebeef5;
    }
  }
</style>
