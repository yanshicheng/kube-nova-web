// stores/workload/volumes.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { V1Volume } from '@kubernetes/client-node'

export const useVolumesStore = defineStore('workload-volumes', () => {
  // 卷列表
  const volumes = ref<V1Volume[]>([])

  // 添加卷
  function addVolume(volume: V1Volume) {
    // 检查名称是否重复
    const exists = volumes.value.some((v) => v.name === volume.name)
    if (exists) {
      console.error(`卷名称 "${volume.name}" 已存在`)
      return
    }
    volumes.value.push(volume)
  }

  // 更新卷
  function updateVolume(index: number, volume: V1Volume) {
    if (index >= 0 && index < volumes.value.length) {
      // 检查名称是否与其他卷重复
      const exists = volumes.value.some((v, i) => i !== index && v.name === volume.name)
      if (exists) {
        console.error(`卷名称 "${volume.name}" 已存在`)
        return
      }
      volumes.value[index] = volume
    }
  }

  // 删除卷
  function removeVolume(index: number) {
    if (index >= 0 && index < volumes.value.length) {
      volumes.value.splice(index, 1)
    }
  }

  // 按名称查找卷
  function findVolumeByName(name: string): V1Volume | undefined {
    return volumes.value.find((v) => v.name === name)
  }

  // 从 K8s 资源加载卷列表
  function loadVolumes(volumeList: V1Volume[]) {
    volumes.value = volumeList ? [...volumeList] : []
  }

  // 重置
  function reset() {
    volumes.value = []
    console.log('Volumes store 已重置')
  }

  /**
   * 检测卷类型
   * 支持 Kubernetes 所有标准卷类型
   */
  function getVolumeType(volume: V1Volume): string | null {
    // 常用类型
    if (volume.emptyDir) return 'emptyDir'
    if (volume.hostPath) return 'hostPath'
    if (volume.persistentVolumeClaim) return 'persistentVolumeClaim'
    if (volume.configMap) return 'configMap'
    if (volume.secret) return 'secret'
    if (volume.nfs) return 'nfs'
    // Projected 类型（ServiceAccount Token 自动挂载使用）
    if (volume.projected) return 'projected'
    // DownwardAPI
    if (volume.downwardAPI) return 'downwardAPI'
    // CSI
    if (volume.csi) return 'csi'
    // Ephemeral
    if (volume.ephemeral) return 'ephemeral'
    // 云存储
    if ((volume as any).awsElasticBlockStore) return 'awsElasticBlockStore'
    if ((volume as any).azureDisk) return 'azureDisk'
    if ((volume as any).azureFile) return 'azureFile'
    if ((volume as any).gcePersistentDisk) return 'gcePersistentDisk'
    // 分布式存储
    if ((volume as any).cephfs) return 'cephfs'
    if ((volume as any).glusterfs) return 'glusterfs'
    if ((volume as any).iscsi) return 'iscsi'
    if ((volume as any).rbd) return 'rbd'
    // 其他
    if ((volume as any).fc) return 'fc'
    if ((volume as any).flocker) return 'flocker'
    if ((volume as any).gitRepo) return 'gitRepo'
    if ((volume as any).portworxVolume) return 'portworxVolume'
    if ((volume as any).quobyte) return 'quobyte'
    if ((volume as any).scaleIO) return 'scaleIO'
    if ((volume as any).storageos) return 'storageos'
    if ((volume as any).vsphereVolume) return 'vsphereVolume'
    // 自定义类型（非标准）
    if ((volume as any).cifs) return 'cifs'
    // FlexVolume（已废弃但仍支持）
    if ((volume as any).flexVolume) return 'flexVolume'
    // PhotonPersistentDisk
    if ((volume as any).photonPersistentDisk) return 'photonPersistentDisk'

    return null
  }

  /**
   * 统计卷配置的类型数量
   * 用于检测是否配置了多个类型（K8s 不允许）
   */
  function countVolumeTypes(volume: V1Volume): number {
    const typeKeys = [
      'emptyDir',
      'hostPath',
      'persistentVolumeClaim',
      'configMap',
      'secret',
      'nfs',
      'projected',
      'downwardAPI',
      'csi',
      'ephemeral',
      'awsElasticBlockStore',
      'azureDisk',
      'azureFile',
      'gcePersistentDisk',
      'cephfs',
      'glusterfs',
      'iscsi',
      'rbd',
      'fc',
      'flocker',
      'gitRepo',
      'portworxVolume',
      'quobyte',
      'scaleIO',
      'storageos',
      'vsphereVolume',
      'cifs',
      'flexVolume',
      'photonPersistentDisk'
    ]

    return typeKeys.filter((key) => !!(volume as any)[key]).length
  }

  // 验证
  function validate() {
    const errors: string[] = []
    const warnings: string[] = []
    const volumeNames = new Set<string>()

    volumes.value.forEach((volume, index) => {
      // 检查名称
      if (!volume.name) {
        errors.push(`卷 ${index + 1} 缺少名称`)
      } else if (volumeNames.has(volume.name)) {
        errors.push(`卷名称 "${volume.name}" 重复`)
      } else {
        volumeNames.add(volume.name)
      }

      // 检查卷类型是否配置
      const volumeType = getVolumeType(volume)
      const typeCount = countVolumeTypes(volume)

      if (typeCount === 0) {
        errors.push(`卷 "${volume.name || index + 1}" 未配置卷类型`)
      } else if (typeCount > 1) {
        errors.push(`卷 "${volume.name || index + 1}" 配置了多个卷类型`)
      }

      // HostPath 安全警告
      if (volumeType === 'hostPath') {
        warnings.push(`卷 "${volume.name}" 使用 HostPath，存在安全风险`)
      }

      // gitRepo 已废弃警告
      if (volumeType === 'gitRepo') {
        warnings.push(
          `卷 "${volume.name}" 使用 gitRepo，该类型已废弃，建议使用 initContainer + emptyDir 替代`
        )
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  return {
    // State
    volumes,

    // Actions
    addVolume,
    updateVolume,
    removeVolume,
    findVolumeByName,
    loadVolumes,
    reset,
    validate,

    // Utils（导出供其他组件使用）
    getVolumeType,
    countVolumeTypes
  }
})
