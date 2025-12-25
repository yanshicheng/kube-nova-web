/**
 * StorageClass 表格配置
 */

import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElTooltip } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { StorageClassListItem } from '@/api/workload/cluster-resource'

// 供应商图标和名称映射
const PROVISIONER_INFO: Record<string, { name: string; color: string }> = {
  'kubernetes.io/aws-ebs': { name: 'AWS EBS', color: '#FF9900' },
  'kubernetes.io/gce-pd': { name: 'GCE PD', color: '#4285F4' },
  'kubernetes.io/azure-disk': { name: 'Azure Disk', color: '#0078D4' },
  'kubernetes.io/azure-file': { name: 'Azure File', color: '#0078D4' },
  'kubernetes.io/cinder': { name: 'OpenStack Cinder', color: '#ED1944' },
  'kubernetes.io/vsphere-volume': { name: 'vSphere', color: '#717D7E' },
  'kubernetes.io/no-provisioner': { name: 'No Provisioner', color: '#909399' },
  'rancher.io/local-path': { name: 'Local Path', color: '#0075A8' },
  'nfs.csi.k8s.io': { name: 'NFS CSI', color: '#326CE5' },
  'csi.vsphere.vmware.com': { name: 'vSphere CSI', color: '#717D7E' },
  'ebs.csi.aws.com': { name: 'AWS EBS CSI', color: '#FF9900' },
  'pd.csi.storage.gke.io': { name: 'GKE PD CSI', color: '#4285F4' },
  'disk.csi.azure.com': { name: 'Azure Disk CSI', color: '#0078D4' },
  'file.csi.azure.com': { name: 'Azure File CSI', color: '#0078D4' },
  // OpenEBS
  'openebs.io/local': { name: 'OpenEBS Local', color: '#F15A29' },
  'openebs.io/provisioner-iscsi': { name: 'OpenEBS iSCSI', color: '#F15A29' },
  'local.csi.openebs.io': { name: 'OpenEBS Local CSI', color: '#F15A29' },
  'cstor.csi.openebs.io': { name: 'OpenEBS cStor CSI', color: '#F15A29' },
  'lvm.csi.openebs.io': { name: 'OpenEBS LVM CSI', color: '#F15A29' },
  'zfs.csi.openebs.io': { name: 'OpenEBS ZFS CSI', color: '#F15A29' },
  'mayastor.openebs.io': { name: 'OpenEBS Mayastor', color: '#F15A29' },
  // Longhorn
  'driver.longhorn.io': { name: 'Longhorn', color: '#5F259F' },
  // Ceph
  'ceph.com/rbd': { name: 'Ceph RBD', color: '#EF5C55' },
  'ceph.com/cephfs': { name: 'CephFS', color: '#EF5C55' },
  'rbd.csi.ceph.com': { name: 'Ceph RBD CSI', color: '#EF5C55' },
  'cephfs.csi.ceph.com': { name: 'CephFS CSI', color: '#EF5C55' },
  // Portworx
  'kubernetes.io/portworx-volume': { name: 'Portworx', color: '#1D4F91' },
  'pxd.portworx.com': { name: 'Portworx CSI', color: '#1D4F91' },
  // NetApp
  'csi.trident.netapp.io': { name: 'NetApp Trident', color: '#0067C5' },
  // MinIO
  'minio.io/directpv': { name: 'DirectPV', color: '#C72C48' }
}

// 获取供应商显示信息
function getProvisionerInfo(provisioner: string): { name: string; color: string } {
  if (PROVISIONER_INFO[provisioner]) {
    return PROVISIONER_INFO[provisioner]
  }
  // 尝试匹配部分供应商
  for (const key of Object.keys(PROVISIONER_INFO)) {
    if (provisioner.includes(key.split('/')[0])) {
      return PROVISIONER_INFO[key]
    }
  }
  return { name: provisioner, color: '#606266' }
}

export function useStorageClassTableConfig() {
  const loading = ref(false)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<string, boolean>>({})

  const createTableColumns = (handlers: {
    handleSetDefault: (row: StorageClassListItem) => void
    handleUnsetDefault: (row: StorageClassListItem) => void
    buttonMoreClick: (item: ButtonMoreItem, row: StorageClassListItem) => void
  }) => {
    const { handleSetDefault, handleUnsetDefault, buttonMoreClick } = handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 220,
        fixed: 'left' as const,
        visible: true,
        formatter: (row: StorageClassListItem) => {
          return h('div', { class: 'name-cell' }, [
            h('span', { class: 'resource-name' }, row.name),
            row.isDefault
              ? h(
                  ElTag,
                  {
                    type: 'primary',
                    size: 'small',
                    class: 'default-tag',
                    effect: 'dark'
                  },
                  () => '默认'
                )
              : null
          ])
        }
      },
      {
        prop: 'provisioner',
        label: '供应商',
        minWidth: 240,
        visible: true,
        formatter: (row: StorageClassListItem) => {
          const info = getProvisionerInfo(row.provisioner)
          return h('div', { class: 'provisioner-cell' }, [
            h('span', {
              class: 'provisioner-dot',
              style: {
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: info.color,
                marginRight: '8px'
              }
            }),
            h(ElTooltip, { content: row.provisioner, placement: 'top' }, () =>
              h('span', { class: 'provisioner-text' }, info.name)
            )
          ])
        }
      },
      {
        prop: 'reclaimPolicy',
        label: '回收策略',
        width: 120,
        visible: true,
        formatter: (row: StorageClassListItem) => {
          const typeMap: Record<string, { type: string; icon: string }> = {
            Delete: { type: 'danger', icon: '🗑️' },
            Retain: { type: 'success', icon: '💾' },
            Recycle: { type: 'warning', icon: '♻️' }
          }
          const info = typeMap[row.reclaimPolicy] || { type: 'info', icon: '❓' }
          return h(
            ElTag,
            { type: info.type as any, size: 'small' },
            () => `${info.icon} ${row.reclaimPolicy}`
          )
        }
      },
      {
        prop: 'volumeBindingMode',
        label: '绑定模式',
        width: 150,
        visible: true,
        formatter: (row: StorageClassListItem) => {
          const modeMap: Record<string, { label: string; type: string }> = {
            Immediate: { label: '立即绑定', type: 'primary' },
            WaitForFirstConsumer: { label: '延迟绑定', type: 'warning' }
          }
          const info = modeMap[row.volumeBindingMode] || {
            label: row.volumeBindingMode,
            type: 'info'
          }
          return h(ElTooltip, { content: row.volumeBindingMode, placement: 'top' }, () =>
            h(ElTag, { size: 'small', type: info.type as any }, () => info.label)
          )
        }
      },
      {
        prop: 'allowVolumeExpansion',
        label: '允许扩容',
        width: 100,
        visible: true,
        formatter: (row: StorageClassListItem) => {
          return h(
            ElTag,
            {
              type: row.allowVolumeExpansion ? 'success' : 'info',
              size: 'small',
              effect: row.allowVolumeExpansion ? 'dark' : 'plain'
            },
            () => (row.allowVolumeExpansion ? '✓ 是' : '✗ 否')
          )
        }
      },
      {
        prop: 'age',
        label: '创建时间',
        width: 120,
        visible: true,
        formatter: (row: StorageClassListItem) => {
          return h('span', { style: 'color: #909399; font-size: 13px' }, row.age)
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 100,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: StorageClassListItem): VNode => {
          const isDeleting = deleteLoadingMap.value[row.name] || false
          const isAnyLoading = isDeleting

          const menuItems: ButtonMoreItem[] = [
            {
              key: 'yaml',
              label: '查看 YAML',
              icon: 'lucide:file-code',
              disabled: isAnyLoading
            },
            {
              key: 'detail',
              label: '查看详情',
              icon: 'lucide:eye',
              disabled: isAnyLoading
            },
            {
              key: 'edit',
              label: '编辑',
              icon: 'lucide:edit',
              disabled: isAnyLoading
            },
            row.isDefault
              ? {
                  key: 'unsetDefault',
                  label: '取消默认',
                  icon: 'lucide:star-off',
                  disabled: isAnyLoading
                }
              : {
                  key: 'setDefault',
                  label: '设为默认',
                  icon: 'lucide:star',
                  disabled: isAnyLoading
                },
            {
              key: 'delete',
              label: isDeleting ? '删除中...' : '删除',
              icon: 'lucide:trash-2',
              color: '#f56c6c',
              disabled: isAnyLoading
            }
          ]

          return h('div', {}, [
            h(ArtButtonMore, {
              list: menuItems,
              onClick: (item: ButtonMoreItem) => {
                if (!isAnyLoading || ['yaml', 'detail'].includes(String(item.key))) {
                  if (item.key === 'setDefault') {
                    handleSetDefault(row)
                  } else if (item.key === 'unsetDefault') {
                    handleUnsetDefault(row)
                  } else {
                    buttonMoreClick(item, row)
                  }
                }
              }
            })
          ])
        }
      }
    ]

    const columnChecks = ref<Record<string, boolean>>(
      allColumns.reduce(
        (acc, col) => {
          if (col.prop) acc[col.prop] = col.visible !== false
          return acc
        },
        {} as Record<string, boolean>
      )
    )

    const columns = computed(() =>
      allColumns.filter((col) => !col.prop || columnChecks.value[col.prop] !== false)
    )

    return { columnChecks, columns }
  }

  return {
    loading,
    showSearchBar,
    deleteLoadingMap,
    createTableColumns
  }
}
