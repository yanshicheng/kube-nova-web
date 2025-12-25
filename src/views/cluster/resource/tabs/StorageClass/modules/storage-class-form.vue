<template>
  <ElForm
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="130px"
    :disabled="disabled"
    class="storage-class-form"
  >
    <!-- 基本信息 -->
    <div class="form-section">
      <div class="section-header">
        <DatabaseIcon :size="18" />
        <span>基本信息</span>
        <ElPopover placement="top" :width="350" trigger="hover">
          <template #reference>
            <HelpCircleIcon :size="14" class="help-icon-header" />
          </template>
          <div class="help-text">
            配置 StorageClass 的基本属性，包括名称、供应商、回收策略、绑定模式等核心参数。
          </div>
        </ElPopover>
      </div>

      <ElRow :gutter="24">
        <ElCol :span="12">
          <ElFormItem label="名称" prop="name">
            <ElInput
              v-model="formData.name"
              placeholder="请输入 StorageClass 名称"
              :disabled="isEdit"
            >
              <template #prefix>
                <BoxIcon :size="16" />
              </template>
            </ElInput>
            <div class="form-item-tip">
              只能包含小写字母、数字和连字符，且必须以字母数字开头和结尾
            </div>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="供应商" prop="provisioner">
            <ElSelect
              v-model="formData.provisioner"
              placeholder="选择存储供应商"
              filterable
              :allow-create="!isEdit"
              :disabled="isEdit"
              style="width: 100%"
              @change="handleProvisionerChange"
            >
              <ElOptionGroup
                v-for="group in provisionerGroups"
                :key="group.label"
                :label="group.label"
              >
                <ElOption
                  v-for="item in group.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                  <div class="provisioner-option">
                    <span class="provisioner-dot" :style="{ backgroundColor: item.color }"></span>
                    <span class="provisioner-label">{{ item.label }}</span>
                    <span class="provisioner-value">{{ item.value }}</span>
                  </div>
                </ElOption>
              </ElOptionGroup>
            </ElSelect>
            <div v-if="isEdit" class="form-item-tip warning"> 编辑模式下不允许修改供应商 </div>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="24">
        <ElCol :span="12">
          <ElFormItem label="回收策略" prop="reclaimPolicy">
            <ElRadioGroup v-model="formData.reclaimPolicy" class="radio-group-card">
              <ElRadioButton value="Delete">
                <div class="radio-card">
                  <Trash2Icon :size="16" />
                  <span>Delete</span>
                  <small>删除卷</small>
                </div>
              </ElRadioButton>
              <ElRadioButton value="Retain">
                <div class="radio-card">
                  <SaveIcon :size="16" />
                  <span>Retain</span>
                  <small>保留卷</small>
                </div>
              </ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="绑定模式" prop="volumeBindingMode">
            <ElRadioGroup v-model="formData.volumeBindingMode" class="radio-group-card">
              <ElRadioButton value="Immediate">
                <div class="radio-card">
                  <ZapIcon :size="16" />
                  <span>Immediate</span>
                  <small>立即绑定</small>
                </div>
              </ElRadioButton>
              <ElRadioButton value="WaitForFirstConsumer">
                <div class="radio-card">
                  <ClockIcon :size="16" />
                  <span>WaitFirst</span>
                  <small>延迟绑定</small>
                </div>
              </ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="24">
        <ElCol :span="12">
          <ElFormItem label="允许扩容">
            <ElSwitch
              v-model="formData.allowVolumeExpansion"
              active-text="是"
              inactive-text="否"
              inline-prompt
            />
            <span class="switch-tip">开启后可在不重建 PVC 的情况下扩容</span>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="设为默认">
            <ElSwitch
              v-model="formData.isDefault"
              active-text="是"
              inactive-text="否"
              inline-prompt
            />
            <span class="switch-tip">未指定 StorageClass 的 PVC 将使用此存储类</span>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </div>

    <!-- 供应商特定参数 -->
    <div v-if="currentProvisionerConfig" class="form-section">
      <div class="section-header">
        <SettingsIcon :size="18" />
        <span>{{ currentProvisionerConfig.name }} 参数配置</span>
        <ElTag size="small" type="info" style="margin-left: 8px">{{
            formData.provisioner
          }}</ElTag>
        <ElPopover placement="top" :width="380" trigger="hover">
          <template #reference>
            <HelpCircleIcon :size="14" class="help-icon-header" style="margin-left: auto" />
          </template>
          <div class="help-text">
            根据所选供应商，配置特定的存储参数。不同的供应商有不同的参数要求，这些参数会直接影响存储卷的创建和行为。
          </div>
        </ElPopover>
      </div>

      <!-- NFS 参数 -->
      <template v-if="provisionerType === 'nfs'">
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="NFS 服务器">
              <ElInput
                v-model="provisionerParams.nfsServer"
                placeholder="NFS 服务器地址，如: 192.168.1.100"
              >
                <template #prefix><ServerIcon :size="16" /></template>
              </ElInput>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="共享路径">
              <ElInput
                v-model="provisionerParams.nfsPath"
                placeholder="NFS 共享路径，如: /exports/data"
              >
                <template #prefix><FolderIcon :size="16" /></template>
              </ElInput>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <!-- OpenEBS Local PV 参数 -->
      <template v-else-if="provisionerType === 'openebs-local'">
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="存储类型">
              <ElSelect v-model="provisionerParams.openebsLocalType" style="width: 100%">
                <ElOption label="HostPath (主机路径)" value="hostpath" />
                <ElOption label="Device (块设备)" value="device" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="基础路径" v-if="provisionerParams.openebsLocalType === 'hostpath'">
              <ElInput v-model="provisionerParams.basePath" placeholder="如: /var/openebs/local">
                <template #prefix><FolderIcon :size="16" /></template>
              </ElInput>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <!-- OpenEBS cStor 参数 -->
      <template v-else-if="provisionerType === 'openebs-cstor'">
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="cStor Pool 集群">
              <ElInput
                v-model="provisionerParams.cstorPoolCluster"
                placeholder="cStor Pool Cluster 名称"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="副本数">
              <ElInputNumber v-model="provisionerParams.replicaCount" :min="1" :max="5" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <!-- OpenEBS LVM 参数 -->
      <template v-else-if="provisionerType === 'openebs-lvm'">
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="卷组名称">
              <ElInput v-model="provisionerParams.volgroup" placeholder="LVM 卷组名称">
                <template #prefix><HardDriveIcon :size="16" /></template>
              </ElInput>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="文件系统类型">
              <ElSelect v-model="provisionerParams.fsType" style="width: 100%">
                <ElOption label="ext4" value="ext4" />
                <ElOption label="xfs" value="xfs" />
                <ElOption label="btrfs" value="btrfs" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <!-- OpenEBS ZFS 参数 -->
      <template v-else-if="provisionerType === 'openebs-zfs'">
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="ZFS 池名称">
              <ElInput v-model="provisionerParams.poolname" placeholder="ZFS 存储池名称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="文件系统类型">
              <ElSelect v-model="provisionerParams.fsType" style="width: 100%">
                <ElOption label="zfs" value="zfs" />
                <ElOption label="ext4" value="ext4" />
                <ElOption label="xfs" value="xfs" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="压缩">
              <ElSelect v-model="provisionerParams.compression" style="width: 100%">
                <ElOption label="关闭" value="off" />
                <ElOption label="lz4" value="lz4" />
                <ElOption label="gzip" value="gzip" />
                <ElOption label="zstd" value="zstd" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="去重">
              <ElSwitch v-model="provisionerParams.dedup" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <!-- Longhorn 参数 -->
      <template v-else-if="provisionerType === 'longhorn'">
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="副本数">
              <ElInputNumber v-model="provisionerParams.numberOfReplicas" :min="1" :max="5" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="数据本地性">
              <ElSelect v-model="provisionerParams.dataLocality" style="width: 100%">
                <ElOption label="disabled (禁用)" value="disabled" />
                <ElOption label="best-effort (尽力)" value="best-effort" />
                <ElOption label="strict-local (严格本地)" value="strict-local" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="Stale 副本超时">
              <ElInputNumber v-model="provisionerParams.staleReplicaTimeout" :min="1" />
              <span class="input-suffix">分钟</span>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="从备份恢复">
              <ElInput v-model="provisionerParams.fromBackup" placeholder="备份 URL（可选）" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <!-- Ceph RBD 参数 -->
      <template v-else-if="provisionerType === 'ceph-rbd'">
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="集群 ID">
              <ElInput v-model="provisionerParams.clusterID" placeholder="Ceph 集群 ID" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="存储池">
              <ElInput v-model="provisionerParams.pool" placeholder="RBD 存储池名称" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="镜像特性">
              <ElSelect v-model="provisionerParams.imageFeatures" style="width: 100%">
                <ElOption label="layering" value="layering" />
                <ElOption label="layering,exclusive-lock" value="layering,exclusive-lock" />
                <ElOption
                  label="layering,exclusive-lock,object-map,fast-diff"
                  value="layering,exclusive-lock,object-map,fast-diff"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="Secret 名称">
              <ElInput
                v-model="provisionerParams.csiProvisionerSecretName"
                placeholder="CSI Provisioner Secret"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <!-- AWS EBS 参数 -->
      <template v-else-if="provisionerType === 'aws-ebs'">
        <ElRow :gutter="24">
          <ElCol :span="12">
            <ElFormItem label="卷类型">
              <ElSelect v-model="provisionerParams.type" style="width: 100%">
                <ElOption label="gp3 (通用 SSD)" value="gp3" />
                <ElOption label="gp2 (通用 SSD 旧版)" value="gp2" />
                <ElOption label="io1 (预置 IOPS SSD)" value="io1" />
                <ElOption label="io2 (预置 IOPS SSD)" value="io2" />
                <ElOption label="sc1 (冷 HDD)" value="sc1" />
                <ElOption label="st1 (吞吐优化 HDD)" value="st1" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="文件系统类型">
              <ElSelect v-model="provisionerParams.fsType" style="width: 100%">
                <ElOption label="ext4" value="ext4" />
                <ElOption label="xfs" value="xfs" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="24" v-if="provisionerParams.type === 'gp3'">
          <ElCol :span="12">
            <ElFormItem label="IOPS">
              <ElInputNumber v-model="provisionerParams.iops" :min="3000" :max="16000" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="吞吐量 (MiB/s)">
              <ElInputNumber v-model="provisionerParams.throughput" :min="125" :max="1000" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="加密">
          <ElSwitch v-model="provisionerParams.encrypted" />
        </ElFormItem>
      </template>

      <!-- Local Path Provisioner 参数 -->
      <template v-else-if="provisionerType === 'local-path'">
        <ElRow :gutter="24">
          <ElCol :span="24">
            <ElFormItem label="节点路径映射">
              <div class="node-path-list">
                <div
                  v-for="(item, index) in provisionerParams.nodePaths"
                  :key="index"
                  class="node-path-item"
                >
                  <ElInput
                    v-model="item.node"
                    placeholder="节点名（留空表示所有节点）"
                    style="width: 200px"
                  />
                  <span class="separator">→</span>
                  <ElInput
                    v-model="item.path"
                    placeholder="存储路径，如: /opt/local-path"
                    style="flex: 1"
                  />
                  <ElButton
                    type="danger"
                    :icon="DeleteIcon"
                    circle
                    size="small"
                    @click="removeNodePath(index)"
                  />
                </div>
                <ElButton type="primary" :icon="PlusIcon" @click="addNodePath" plain size="small">
                  添加节点路径
                </ElButton>
              </div>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <!-- 通用/自定义参数 -->
      <template v-else>
        <ElAlert
          title="此供应商使用通用参数配置，请在下方自定义参数中添加"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />
      </template>
    </div>

    <!-- 自定义参数（所有供应商通用） -->
    <div class="form-section">
      <div class="section-header">
        <SlidersIcon :size="18" />
        <span>自定义参数</span>
        <ElPopover placement="top" :width="350" trigger="hover">
          <template #reference>
            <HelpCircleIcon :size="14" class="help-icon-header" />
          </template>
          <div class="help-text">
            添加供应商特定的额外参数和挂载选项。这些参数会传递给底层的存储驱动，用于配置高级功能。
          </div>
        </ElPopover>
      </div>

      <ElFormItem label="存储参数">
        <div class="key-value-list">
          <div v-for="(item, index) in formData.parameters" :key="index" class="key-value-item">
            <ElInput v-model="item.key" placeholder="参数名" style="width: 200px" />
            <span class="separator">=</span>
            <ElInput v-model="item.value" placeholder="参数值" style="flex: 1" />
            <ElButton
              type="danger"
              :icon="DeleteIcon"
              circle
              size="small"
              @click="removeParameter(index)"
            />
          </div>
          <ElButton type="primary" :icon="PlusIcon" @click="addParameter" plain size="small">
            添加参数
          </ElButton>
        </div>
      </ElFormItem>

      <ElFormItem label="挂载选项">
        <div class="mount-options">
          <ElTag
            v-for="(option, index) in formData.mountOptions"
            :key="index"
            closable
            @close="removeMountOption(index)"
            class="mount-option-tag"
            type="info"
          >
            {{ option }}
          </ElTag>
          <ElInput
            v-model="newMountOption"
            placeholder="输入挂载选项后按回车"
            style="width: 200px"
            @keyup.enter="addMountOption"
            size="small"
          >
            <template #append>
              <ElButton @click="addMountOption">添加</ElButton>
            </template>
          </ElInput>
        </div>
        <div class="form-item-tip">
          常用挂载选项：hard, soft, nfsvers=4, rsize=1048576, wsize=1048576
        </div>
      </ElFormItem>
    </div>

    <!-- 标签和注解 -->
    <div class="form-section">
      <div class="section-header">
        <TagIcon :size="18" />
        <span>标签和注解（可选）</span>
        <ElPopover placement="top" :width="300" trigger="hover">
          <template #reference>
            <HelpCircleIcon :size="14" class="help-icon-header" />
          </template>
          <div class="help-text">
            标签用于组织和选择资源，注解用于存储非标识性的元数据信息。
          </div>
        </ElPopover>
      </div>

      <ElFormItem label="标签 (Labels)">
        <div class="key-value-list">
          <div v-for="(item, index) in formData.labels" :key="index" class="key-value-item">
            <ElInput v-model="item.key" placeholder="标签名" style="width: 200px" />
            <span class="separator">:</span>
            <ElInput v-model="item.value" placeholder="标签值" style="flex: 1" />
            <ElButton
              type="danger"
              :icon="DeleteIcon"
              circle
              size="small"
              @click="removeLabel(index)"
            />
          </div>
          <ElButton type="primary" :icon="PlusIcon" @click="addLabel" plain size="small">
            添加标签
          </ElButton>
        </div>
      </ElFormItem>

      <ElFormItem label="注解 (Annotations)">
        <div class="key-value-list">
          <div v-for="(item, index) in formData.annotations" :key="index" class="key-value-item">
            <ElInput v-model="item.key" placeholder="注解名" style="width: 200px" />
            <span class="separator">:</span>
            <ElInput v-model="item.value" placeholder="注解值" style="flex: 1" />
            <ElButton
              type="danger"
              :icon="DeleteIcon"
              circle
              size="small"
              @click="removeAnnotation(index)"
            />
          </div>
          <ElButton type="primary" :icon="PlusIcon" @click="addAnnotation" plain size="small">
            添加注解
          </ElButton>
        </div>
      </ElFormItem>
    </div>
  </ElForm>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
  import {
    Plus as PlusIcon,
    Trash2 as DeleteIcon,
    Database as DatabaseIcon,
    Box as BoxIcon,
    Settings as SettingsIcon,
    Sliders as SlidersIcon,
    Tag as TagIcon,
    Server as ServerIcon,
    Folder as FolderIcon,
    HardDrive as HardDriveIcon,
    Trash2 as Trash2Icon,
    Save as SaveIcon,
    Zap as ZapIcon,
    Clock as ClockIcon,
    HelpCircle as HelpCircleIcon
  } from 'lucide-vue-next'
  import type { FormInstance, FormRules } from 'element-plus'
  import type { StorageClassFormData, KeyValuePair } from './type.ts'

  interface Props {
    modelValue: StorageClassFormData
    disabled?: boolean
    isEdit?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: StorageClassFormData): void
  }

  const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    isEdit: false
  })

  const emit = defineEmits<Emits>()

  // 表单引用
  const formRef = ref<FormInstance>()

  // 防止循环更新的标志
  let isInternalUpdate = false

  // 本地表单数据 - 使用 ref 而不是 reactive 来避免深度监听问题
  const formData = ref<StorageClassFormData>({
    name: '',
    provisioner: '',
    reclaimPolicy: 'Delete',
    volumeBindingMode: 'Immediate',
    allowVolumeExpansion: false,
    isDefault: false,
    parameters: [],
    mountOptions: [],
    labels: [],
    annotations: []
  })

  // 供应商特定参数 - 独立管理，不参与双向绑定
  const provisionerParams = reactive<Record<string, any>>({
    // NFS
    nfsServer: '',
    nfsPath: '',
    // OpenEBS Local
    openebsLocalType: 'hostpath',
    basePath: '/var/openebs/local',
    // OpenEBS cStor
    cstorPoolCluster: '',
    replicaCount: 3,
    // OpenEBS LVM
    volgroup: '',
    fsType: 'ext4',
    // OpenEBS ZFS
    poolname: '',
    compression: 'off',
    dedup: false,
    // Longhorn
    numberOfReplicas: 3,
    dataLocality: 'disabled',
    staleReplicaTimeout: 30,
    fromBackup: '',
    // Ceph RBD
    clusterID: '',
    pool: '',
    imageFeatures: 'layering',
    csiProvisionerSecretName: '',
    // AWS EBS
    type: 'gp3',
    iops: 3000,
    throughput: 125,
    encrypted: false,
    // Local Path
    nodePaths: [{ node: '', path: '/opt/local-path-provisioner' }]
  })

  // 新挂载选项
  const newMountOption = ref('')

  // 供应商分组配置
  const provisionerGroups = [
    {
      label: 'OpenEBS',
      options: [
        { label: 'OpenEBS Local PV', value: 'local.csi.openebs.io', color: '#F15A29' },
        { label: 'OpenEBS cStor CSI', value: 'cstor.csi.openebs.io', color: '#F15A29' },
        { label: 'OpenEBS LVM CSI', value: 'lvm.csi.openebs.io', color: '#F15A29' },
        { label: 'OpenEBS ZFS CSI', value: 'zfs.csi.openebs.io', color: '#F15A29' },
        { label: 'OpenEBS Mayastor', value: 'io.openebs.csi-mayastor', color: '#F15A29' }
      ]
    },
    {
      label: 'NFS',
      options: [
        { label: 'NFS CSI Driver', value: 'nfs.csi.k8s.io', color: '#326CE5' },
        { label: 'NFS Subdir External', value: 'nfs-subdir-external-provisioner', color: '#326CE5' }
      ]
    },
    {
      label: 'Local Storage',
      options: [
        { label: 'Local Path Provisioner', value: 'rancher.io/local-path', color: '#0075A8' },
        {
          label: 'No Provisioner (Static)',
          value: 'kubernetes.io/no-provisioner',
          color: '#909399'
        }
      ]
    },
    {
      label: 'Longhorn',
      options: [{ label: 'Longhorn', value: 'driver.longhorn.io', color: '#5F259F' }]
    },
    {
      label: 'Ceph',
      options: [
        { label: 'Ceph RBD CSI', value: 'rbd.csi.ceph.com', color: '#EF5C55' },
        { label: 'CephFS CSI', value: 'cephfs.csi.ceph.com', color: '#EF5C55' }
      ]
    },
    {
      label: 'Cloud Providers',
      options: [
        { label: 'AWS EBS CSI', value: 'ebs.csi.aws.com', color: '#FF9900' },
        { label: 'GCP PD CSI', value: 'pd.csi.storage.gke.io', color: '#4285F4' },
        { label: 'Azure Disk CSI', value: 'disk.csi.azure.com', color: '#0078D4' },
        { label: 'Azure File CSI', value: 'file.csi.azure.com', color: '#0078D4' }
      ]
    },
    {
      label: 'vSphere',
      options: [{ label: 'vSphere CSI', value: 'csi.vsphere.vmware.com', color: '#717D7E' }]
    }
  ]

  // 供应商配置映射
  const provisionerConfigMap: Record<string, { name: string; type: string }> = {
    'nfs.csi.k8s.io': { name: 'NFS CSI', type: 'nfs' },
    'nfs-subdir-external-provisioner': { name: 'NFS Subdir', type: 'nfs' },
    'local.csi.openebs.io': { name: 'OpenEBS Local PV', type: 'openebs-local' },
    'cstor.csi.openebs.io': { name: 'OpenEBS cStor', type: 'openebs-cstor' },
    'lvm.csi.openebs.io': { name: 'OpenEBS LVM', type: 'openebs-lvm' },
    'zfs.csi.openebs.io': { name: 'OpenEBS ZFS', type: 'openebs-zfs' },
    'driver.longhorn.io': { name: 'Longhorn', type: 'longhorn' },
    'rbd.csi.ceph.com': { name: 'Ceph RBD', type: 'ceph-rbd' },
    'cephfs.csi.ceph.com': { name: 'CephFS', type: 'ceph-fs' },
    'ebs.csi.aws.com': { name: 'AWS EBS', type: 'aws-ebs' },
    'rancher.io/local-path': { name: 'Local Path', type: 'local-path' }
  }

  // 供应商参数键名映射 - 定义哪些参数属于供应商特定参数
  const provisionerParamKeys: Record<string, string[]> = {
    nfs: ['server', 'share'],
    'openebs-local': ['cas.openebs.io/config', 'openebs.io/cas-type', 'basePath'],
    'openebs-cstor': ['cas.openebs.io/config', 'cstorPoolCluster', 'replicaCount'],
    'openebs-lvm': ['volgroup', 'fsType'],
    'openebs-zfs': ['poolname', 'fstype', 'compression', 'dedup'],
    longhorn: ['numberOfReplicas', 'dataLocality', 'staleReplicaTimeout', 'fromBackup'],
    'ceph-rbd': [
      'clusterID',
      'pool',
      'imageFeatures',
      'csi.storage.k8s.io/provisioner-secret-name',
      'csi.storage.k8s.io/provisioner-secret-namespace',
      'csi.storage.k8s.io/node-stage-secret-name',
      'csi.storage.k8s.io/node-stage-secret-namespace'
    ],
    'aws-ebs': ['type', 'fsType', 'iops', 'throughput', 'encrypted', 'kmsKeyId'],
    'local-path': []
  }

  // 当前供应商配置
  const currentProvisionerConfig = computed(() => {
    return provisionerConfigMap[formData.value.provisioner]
  })

  // 当前供应商类型
  const provisionerType = computed(() => {
    return currentProvisionerConfig.value?.type || 'generic'
  })

  // 表单验证规则
  const rules: FormRules = {
    name: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '名称只能包含小写字母、数字和连字符，且必须以字母数字开头和结尾',
        trigger: 'blur'
      }
    ],
    provisioner: [{ required: true, message: '请选择或输入供应商', trigger: 'change' }]
  }

  // 从 parameters 中提取供应商特定参数
  const extractProvisionerParams = () => {
    const params = formData.value.parameters.reduce(
      (acc, p) => {
        if (p.key) {
          acc[p.key] = p.value
        }
        return acc
      },
      {} as Record<string, string>
    )

    const type = provisionerType.value

    switch (type) {
      case 'nfs':
        provisionerParams.nfsServer = params.server || ''
        provisionerParams.nfsPath = params.share || ''
        break
      case 'openebs-local':
        provisionerParams.openebsLocalType = params['openebs.io/cas-type'] || 'hostpath'
        provisionerParams.basePath = params.basePath || '/var/openebs/local'
        break
      case 'openebs-cstor':
        provisionerParams.cstorPoolCluster = params.cstorPoolCluster || ''
        provisionerParams.replicaCount = parseInt(params.replicaCount) || 3
        break
      case 'openebs-lvm':
        provisionerParams.volgroup = params.volgroup || ''
        provisionerParams.fsType = params.fsType || 'ext4'
        break
      case 'openebs-zfs':
        provisionerParams.poolname = params.poolname || ''
        provisionerParams.fsType = params.fstype || 'zfs'
        provisionerParams.compression = params.compression || 'off'
        provisionerParams.dedup = params.dedup === 'on'
        break
      case 'longhorn':
        provisionerParams.numberOfReplicas = parseInt(params.numberOfReplicas) || 3
        provisionerParams.dataLocality = params.dataLocality || 'disabled'
        provisionerParams.staleReplicaTimeout = parseInt(params.staleReplicaTimeout) || 30
        provisionerParams.fromBackup = params.fromBackup || ''
        break
      case 'ceph-rbd':
        provisionerParams.clusterID = params.clusterID || ''
        provisionerParams.pool = params.pool || ''
        provisionerParams.imageFeatures = params.imageFeatures || 'layering'
        provisionerParams.csiProvisionerSecretName =
          params['csi.storage.k8s.io/provisioner-secret-name'] || ''
        break
      case 'aws-ebs':
        provisionerParams.type = params.type || 'gp3'
        provisionerParams.fsType = params.fsType || 'ext4'
        provisionerParams.iops = parseInt(params.iops) || 3000
        provisionerParams.throughput = parseInt(params.throughput) || 125
        provisionerParams.encrypted = params.encrypted === 'true'
        break
    }
  }

  // 获取供应商参数生成的 parameters
  const getProvisionerGeneratedParams = (): KeyValuePair[] => {
    const result: KeyValuePair[] = []
    const type = provisionerType.value

    switch (type) {
      case 'nfs':
        if (provisionerParams.nfsServer) {
          result.push({ key: 'server', value: provisionerParams.nfsServer })
        }
        if (provisionerParams.nfsPath) {
          result.push({ key: 'share', value: provisionerParams.nfsPath })
        }
        break
      case 'openebs-local':
        if (provisionerParams.openebsLocalType) {
          result.push({ key: 'openebs.io/cas-type', value: provisionerParams.openebsLocalType })
        }
        if (provisionerParams.basePath && provisionerParams.openebsLocalType === 'hostpath') {
          result.push({ key: 'basePath', value: provisionerParams.basePath })
        }
        break
      case 'openebs-cstor':
        if (provisionerParams.cstorPoolCluster) {
          result.push({ key: 'cstorPoolCluster', value: provisionerParams.cstorPoolCluster })
        }
        result.push({ key: 'replicaCount', value: String(provisionerParams.replicaCount || 3) })
        break
      case 'openebs-lvm':
        if (provisionerParams.volgroup) {
          result.push({ key: 'volgroup', value: provisionerParams.volgroup })
        }
        if (provisionerParams.fsType) {
          result.push({ key: 'fsType', value: provisionerParams.fsType })
        }
        break
      case 'openebs-zfs':
        if (provisionerParams.poolname) {
          result.push({ key: 'poolname', value: provisionerParams.poolname })
        }
        if (provisionerParams.fsType) {
          result.push({ key: 'fstype', value: provisionerParams.fsType })
        }
        if (provisionerParams.compression && provisionerParams.compression !== 'off') {
          result.push({ key: 'compression', value: provisionerParams.compression })
        }
        if (provisionerParams.dedup) {
          result.push({ key: 'dedup', value: 'on' })
        }
        break
      case 'longhorn':
        result.push({
          key: 'numberOfReplicas',
          value: String(provisionerParams.numberOfReplicas || 3)
        })
        if (provisionerParams.dataLocality && provisionerParams.dataLocality !== 'disabled') {
          result.push({ key: 'dataLocality', value: provisionerParams.dataLocality })
        }
        if (provisionerParams.staleReplicaTimeout) {
          result.push({
            key: 'staleReplicaTimeout',
            value: String(provisionerParams.staleReplicaTimeout)
          })
        }
        if (provisionerParams.fromBackup) {
          result.push({ key: 'fromBackup', value: provisionerParams.fromBackup })
        }
        break
      case 'ceph-rbd':
        if (provisionerParams.clusterID) {
          result.push({ key: 'clusterID', value: provisionerParams.clusterID })
        }
        if (provisionerParams.pool) {
          result.push({ key: 'pool', value: provisionerParams.pool })
        }
        if (provisionerParams.imageFeatures) {
          result.push({ key: 'imageFeatures', value: provisionerParams.imageFeatures })
        }
        if (provisionerParams.csiProvisionerSecretName) {
          result.push({
            key: 'csi.storage.k8s.io/provisioner-secret-name',
            value: provisionerParams.csiProvisionerSecretName
          })
        }
        break
      case 'aws-ebs':
        if (provisionerParams.type) {
          result.push({ key: 'type', value: provisionerParams.type })
        }
        if (provisionerParams.fsType) {
          result.push({ key: 'fsType', value: provisionerParams.fsType })
        }
        if (provisionerParams.type === 'gp3') {
          if (provisionerParams.iops) {
            result.push({ key: 'iops', value: String(provisionerParams.iops) })
          }
          if (provisionerParams.throughput) {
            result.push({ key: 'throughput', value: String(provisionerParams.throughput) })
          }
        }
        if (provisionerParams.encrypted) {
          result.push({ key: 'encrypted', value: 'true' })
        }
        break
    }

    return result
  }

  // 过滤掉供应商特定参数，只保留自定义参数
  const filterCustomParameters = (parameters: KeyValuePair[]): KeyValuePair[] => {
    const type = provisionerType.value
    const provisionerKeys = provisionerParamKeys[type] || []

    return parameters.filter((p) => {
      // 保留空键的行（用户新添加的）
      if (!p.key) return true
      // 过滤掉属于供应商特定的参数
      return !provisionerKeys.includes(p.key)
    })
  }

  // 监听外部数据变化 - 只在真正需要时更新
  watch(
    () => props.modelValue,
    (newVal) => {
      if (isInternalUpdate) {
        return
      }

      // 深拷贝避免引用问题
      formData.value = {
        name: newVal.name || '',
        provisioner: newVal.provisioner || '',
        reclaimPolicy: newVal.reclaimPolicy || 'Delete',
        volumeBindingMode: newVal.volumeBindingMode || 'Immediate',
        allowVolumeExpansion: newVal.allowVolumeExpansion || false,
        isDefault: newVal.isDefault || false,
        parameters: [...(newVal.parameters || []).map((p) => ({ ...p }))],
        mountOptions: [...(newVal.mountOptions || [])],
        labels: [...(newVal.labels || []).map((l) => ({ ...l }))],
        annotations: [...(newVal.annotations || []).map((a) => ({ ...a }))]
      }

      // 提取供应商参数
      nextTick(() => {
        extractProvisionerParams()
      })
    },
    { immediate: true, deep: true }
  )

  // 监听本地数据变化 - 使用防抖和标志位避免循环
  watch(
    formData,
    (newVal) => {
      if (isInternalUpdate) return

      isInternalUpdate = true

      // 获取供应商生成的参数
      const provisionerGeneratedParams = getProvisionerGeneratedParams()

      // 过滤自定义参数（排除供应商参数）
      const customParams = filterCustomParameters(newVal.parameters)

      // 合并参数：供应商参数 + 自定义参数
      const existingKeys = new Set(provisionerGeneratedParams.map((p) => p.key))
      const finalParams = [
        ...provisionerGeneratedParams,
        ...customParams.filter((p) => p.key && !existingKeys.has(p.key))
      ]

      const emitData: StorageClassFormData = {
        name: newVal.name,
        provisioner: newVal.provisioner,
        reclaimPolicy: newVal.reclaimPolicy,
        volumeBindingMode: newVal.volumeBindingMode,
        allowVolumeExpansion: newVal.allowVolumeExpansion,
        isDefault: newVal.isDefault,
        parameters: finalParams,
        mountOptions: [...newVal.mountOptions],
        labels: [...newVal.labels.map((l) => ({ ...l }))],
        annotations: [...newVal.annotations.map((a) => ({ ...a }))]
      }

      emit('update:modelValue', emitData)

      nextTick(() => {
        isInternalUpdate = false
      })
    },
    { deep: true }
  )

  // 监听供应商参数变化 - 触发表单更新
  watch(
    provisionerParams,
    () => {
      if (isInternalUpdate) return

      // 触发表单数据更新以重新计算 parameters
      const current = formData.value
      formData.value = { ...current }
    },
    { deep: true }
  )

  // 处理供应商变化
  const handleProvisionerChange = (newProvisioner: string) => {
    // 重置供应商特定参数为默认值
    resetProvisionerParams()

    // 清空之前供应商的参数，只保留自定义参数
    const type = provisionerConfigMap[newProvisioner]?.type || 'generic'
    const oldType = provisionerType.value

    if (oldType && oldType !== type) {
      // 清空旧的供应商参数
      const oldKeys = provisionerParamKeys[oldType] || []
      formData.value.parameters = formData.value.parameters.filter((p) => !oldKeys.includes(p.key))
    }
  }

  // 重置供应商参数
  const resetProvisionerParams = () => {
    const type = provisionerType.value

    switch (type) {
      case 'nfs':
        provisionerParams.nfsServer = ''
        provisionerParams.nfsPath = ''
        break
      case 'openebs-local':
        provisionerParams.openebsLocalType = 'hostpath'
        provisionerParams.basePath = '/var/openebs/local'
        break
      case 'openebs-cstor':
        provisionerParams.cstorPoolCluster = ''
        provisionerParams.replicaCount = 3
        break
      case 'openebs-lvm':
        provisionerParams.volgroup = ''
        provisionerParams.fsType = 'ext4'
        break
      case 'openebs-zfs':
        provisionerParams.poolname = ''
        provisionerParams.fsType = 'zfs'
        provisionerParams.compression = 'off'
        provisionerParams.dedup = false
        break
      case 'longhorn':
        provisionerParams.numberOfReplicas = 3
        provisionerParams.dataLocality = 'disabled'
        provisionerParams.staleReplicaTimeout = 30
        provisionerParams.fromBackup = ''
        break
      case 'ceph-rbd':
        provisionerParams.clusterID = ''
        provisionerParams.pool = ''
        provisionerParams.imageFeatures = 'layering'
        provisionerParams.csiProvisionerSecretName = ''
        break
      case 'aws-ebs':
        provisionerParams.type = 'gp3'
        provisionerParams.fsType = 'ext4'
        provisionerParams.iops = 3000
        provisionerParams.throughput = 125
        provisionerParams.encrypted = false
        break
      case 'local-path':
        provisionerParams.nodePaths = [{ node: '', path: '/opt/local-path-provisioner' }]
        break
    }
  }

  // 添加参数
  const addParameter = () => {
    formData.value.parameters.push({ key: '', value: '' })
  }

  // 移除参数
  const removeParameter = (index: number) => {
    formData.value.parameters.splice(index, 1)
  }

  // 添加挂载选项
  const addMountOption = () => {
    if (newMountOption.value.trim()) {
      formData.value.mountOptions.push(newMountOption.value.trim())
      newMountOption.value = ''
    }
  }

  // 移除挂载选项
  const removeMountOption = (index: number) => {
    formData.value.mountOptions.splice(index, 1)
  }

  // 添加标签
  const addLabel = () => {
    formData.value.labels.push({ key: '', value: '' })
  }

  // 移除标签
  const removeLabel = (index: number) => {
    formData.value.labels.splice(index, 1)
  }

  // 添加注解
  const addAnnotation = () => {
    formData.value.annotations.push({ key: '', value: '' })
  }

  // 移除注解
  const removeAnnotation = (index: number) => {
    formData.value.annotations.splice(index, 1)
  }

  // Local Path 节点路径操作
  const addNodePath = () => {
    if (!provisionerParams.nodePaths) {
      provisionerParams.nodePaths = []
    }
    provisionerParams.nodePaths.push({ node: '', path: '' })
  }

  const removeNodePath = (index: number) => {
    provisionerParams.nodePaths?.splice(index, 1)
  }

  // 验证表单
  const validate = () => {
    return formRef.value?.validate()
  }

  // 重置表单
  const resetFields = () => {
    formRef.value?.resetFields()
  }

  // 暴露方法
  defineExpose({
    validate,
    resetFields,
    formRef
  })
</script>

<style lang="scss" scoped>
  .storage-class-form {
    .form-section {
      margin-bottom: 24px;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #ebeef5;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e4e7ed;
        font-size: 15px;
        font-weight: 600;
        color: #303133;

        .el-tag {
          margin-left: 8px;
        }

        .help-icon-header {
          color: #909399;
          cursor: help;
          transition: color 0.3s;
          margin-left: auto;

          &:hover {
            color: #409eff;
          }
        }
      }
    }

    .form-item-tip {
      margin-top: 4px;
      font-size: 12px;
      color: #909399;
      line-height: 1.4;

      &.warning {
        color: #e6a23c;
      }
    }

    .help-text {
      font-size: 13px;
      line-height: 1.8;
      color: #606266;
    }

    .switch-tip {
      margin-left: 12px;
      font-size: 12px;
      color: #909399;
    }

    .input-suffix {
      margin-left: 8px;
      font-size: 12px;
      color: #909399;
    }

    .radio-group-card {
      display: inline-flex;
      flex-wrap: nowrap;
      gap: 12px;

      :deep(.el-radio-button) {
        margin-left: 0 !important;

        .el-radio-button__inner {
          padding: 12px 16px;
          height: auto;
          border-radius: 8px !important;
          border: 2px solid #dcdfe6 !important;
          box-shadow: none;
          transition: all 0.2s;
          background: #fff;

          &:hover {
            border-color: #409eff !important;
            background: #ecf5ff;
          }
        }

        &.is-active {
          .el-radio-button__inner {
            background: linear-gradient(135deg, #409eff 0%, #337ecc 100%) !important;
            border-color: #409eff !important;
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          }

          .radio-card {
            span {
              color: #fff !important;
            }
            small {
              color: rgba(255, 255, 255, 0.85) !important;
            }
            svg {
              color: #fff !important;
            }
          }
        }

        .el-radio-button__original-radio:checked + .el-radio-button__inner {
          background: linear-gradient(135deg, #409eff 0%, #337ecc 100%) !important;
          border-color: #409eff !important;
        }
      }

      .radio-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        min-width: 60px;

        svg {
          color: #606266;
          transition: color 0.2s;
        }

        span {
          font-weight: 600;
          font-size: 13px;
          color: #303133;
          transition: color 0.2s;
          white-space: nowrap;
        }

        small {
          font-size: 11px;
          color: #606266;
          font-weight: 500;
          transition: color 0.2s;
          white-space: nowrap;
        }
      }
    }

    .provisioner-option {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;

      .provisioner-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .provisioner-label {
        flex: 1;
        font-weight: 500;
      }

      .provisioner-value {
        font-size: 11px;
        color: #909399;
        font-family: monospace;
      }
    }

    .key-value-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;

      .key-value-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .separator {
          color: #909399;
          font-weight: 500;
        }
      }
    }

    .node-path-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;

      .node-path-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .separator {
          color: #409eff;
          font-weight: bold;
        }
      }
    }

    .mount-options {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;

      .mount-option-tag {
        height: 28px;
      }
    }
  }
</style>