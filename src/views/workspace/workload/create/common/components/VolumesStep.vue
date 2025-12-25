<template>
  <div class="volumes-step">
    <div class="volumes-panel">
      <div class="volumes-header">
        <ElButton type="primary" @click="showAddDialog = true">
          <Plus :size="14" />
          添加存储卷
        </ElButton>
        <ElTag type="info">
          <HardDrive :size="14" />
          已添加 {{ volumes.length }} 个存储卷
        </ElTag>
      </div>

      <div v-if="volumes.length === 0" class="empty-volumes">
        <ElEmpty description="暂无存储卷定义" :image-size="100">
          <ElButton type="primary" @click="showAddDialog = true">
            <Plus :size="14" />
            添加第一个存储卷
          </ElButton>
        </ElEmpty>
      </div>

      <div v-else class="volumes-list">
        <div v-for="(volume, index) in volumes" :key="volume.name" class="volume-item">
          <div class="volume-info">
            <div class="volume-name">{{ volume.name }}</div>
            <ElTag size="small" :type="getVolumeTagType(volume)">{{
              getVolumeTypeLabel(volume)
            }}</ElTag>
            <div class="volume-desc">{{ getVolumeShortDescription(volume) }}</div>
            <div v-if="getVolumeSize(volume)" class="volume-size"
              >大小: {{ getVolumeSize(volume) }}</div
            >
          </div>
          <div class="volume-actions">
            <!-- 只有可编辑的类型才显示编辑按钮 -->
            <ElButton v-if="isEditableVolumeType(volume)" size="small" @click="editVolume(index)">
              <Edit2 :size="14" />
              编辑
            </ElButton>
            <ElButton size="small" @click="duplicateVolume(index)">
              <Copy :size="14" />
              复制
            </ElButton>
            <ElButton size="small" type="danger" @click="removeVolume(index)">
              <Trash2 :size="14" />
              删除
            </ElButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑存储卷对话框 -->
    <ElDialog
      v-model="showAddDialog"
      :title="editingIndex === -1 ? '添加存储卷' : '编辑存储卷'"
      width="650px"
      :close-on-click-modal="false"
    >
      <ElForm label-width="100px">
        <!-- 存储类型 -->
        <ElFormItem label="存储类型" required>
          <ElSelect
            v-model="newVolume.type"
            @change="handleTypeChange"
            :disabled="editingIndex !== -1"
            style="width: 100%"
          >
            <ElOption label="EmptyDir (临时存储)" value="emptyDir" />
            <ElOption label="PVC (持久卷)" value="persistentVolumeClaim" />
            <ElOption label="HostPath (主机路径)" value="hostPath" />
            <ElOption label="NFS (网络存储)" value="nfs" />
            <ElOption label="ConfigMap (配置)" value="configMap" />
            <ElOption label="Secret (密钥)" value="secret" />
          </ElSelect>
        </ElFormItem>

        <!-- 卷名称 -->
        <ElFormItem label="卷名称" required>
          <ElInput
            v-model="newVolume.name"
            placeholder="卷名称（小写字母开头）"
            :class="{ 'is-error': volumeNameError }"
            @input="validateVolumeName"
          />
          <div v-if="volumeNameError" class="error-message">{{ volumeNameError }}</div>
        </ElFormItem>

        <!-- EmptyDir 配置 -->
        <template v-if="newVolume.type === 'emptyDir'">
          <ElFormItem label="介质">
            <ElRadioGroup v-model="newVolume.emptyDir.medium">
              <ElRadioButton value="">磁盘</ElRadioButton>
              <ElRadioButton value="Memory">内存</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem label="大小限制">
            <ElInput v-model.number="sizeValue" placeholder="留空表示无限制" type="number">
              <template #append>
                <ElSelect v-model="sizeUnit" style="width: 70px">
                  <ElOption label="Mi" value="Mi" />
                  <ElOption label="Gi" value="Gi" />
                </ElSelect>
              </template>
            </ElInput>
          </ElFormItem>
        </template>

        <!-- PVC 配置 -->
        <template v-if="newVolume.type === 'persistentVolumeClaim'">
          <ElFormItem label="PVC名称" required>
            <ElSelect
              v-model="newVolume.persistentVolumeClaim.claimName"
              filterable
              allow-create
              style="width: 100%"
              :loading="loadingPVCs"
              @focus="handlePVCSelectFocus"
              placeholder="请选择或输入PVC名称"
            >
              <ElOption
                v-for="pvc in availablePvcList"
                :key="pvc.name"
                :label="pvc.name"
                :value="pvc.name"
              >
                <span>{{ pvc.name }}</span>
                <ElTag size="small" type="info" style="margin-left: 8px">{{ pvc.capacity }}</ElTag>
              </ElOption>
              <template #empty>
                <div style="padding: 10px; text-align: center; color: #909399">
                  {{ loadingPVCs ? '加载中...' : '暂无可用的PVC（未绑定状态）' }}
                </div>
              </template>
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="只读">
            <ElSwitch v-model="newVolume.persistentVolumeClaim.readOnly" />
          </ElFormItem>
        </template>

        <!-- HostPath 配置 -->
        <template v-if="newVolume.type === 'hostPath'">
          <ElFormItem label="主机路径" required>
            <ElInput v-model="newVolume.hostPath.path" placeholder="/var/log" />
          </ElFormItem>
          <ElFormItem label="路径类型">
            <ElSelect v-model="newVolume.hostPath.type" style="width: 100%">
              <ElOption label="不检查" value="" />
              <ElOption label="DirectoryOrCreate" value="DirectoryOrCreate" />
              <ElOption label="Directory" value="Directory" />
              <ElOption label="File" value="File" />
            </ElSelect>
          </ElFormItem>
          <ElAlert type="warning" :closable="false" show-icon style="margin-top: 10px">
            HostPath 存在安全风险，请谨慎使用
          </ElAlert>
        </template>

        <!-- NFS 配置 -->
        <template v-if="newVolume.type === 'nfs'">
          <ElFormItem label="NFS服务器" required>
            <ElInput v-model="newVolume.nfs.server" placeholder="192.168.1.100" />
          </ElFormItem>
          <ElFormItem label="NFS路径" required>
            <ElInput v-model="newVolume.nfs.path" placeholder="/data/shared">
              <template #prepend>/</template>
            </ElInput>
          </ElFormItem>
          <ElFormItem label="只读">
            <ElSwitch v-model="newVolume.nfs.readOnly" />
          </ElFormItem>
        </template>

        <!-- ConfigMap 配置 -->
        <template v-if="newVolume.type === 'configMap'">
          <ElFormItem label="ConfigMap" required>
            <ElSelect
              v-model="newVolume.configMap.name"
              filterable
              allow-create
              style="width: 100%"
              :loading="loadingConfigMaps"
              @focus="handleConfigMapSelectFocus"
              placeholder="请选择或输入ConfigMap名称"
            >
              <ElOption
                v-for="cm in configMapList"
                :key="cm.name"
                :label="cm.name"
                :value="cm.name"
              >
                <span>{{ cm.name }}</span>
                <ElTag v-if="cm.dataCount" size="small" type="info" style="margin-left: 8px">
                  {{ cm.dataCount }} 项
                </ElTag>
              </ElOption>
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="默认权限">
            <ElInput v-model="newVolume.configMap.defaultMode" placeholder="0644" />
          </ElFormItem>
          <ElFormItem label="可选">
            <ElSwitch v-model="newVolume.configMap.optional" />
            <span style="margin-left: 10px; font-size: 12px; color: #909399">不存在时是否忽略</span>
          </ElFormItem>
        </template>

        <!-- Secret 配置 -->
        <template v-if="newVolume.type === 'secret'">
          <ElFormItem label="Secret" required>
            <ElSelect
              v-model="newVolume.secret.secretName"
              filterable
              allow-create
              style="width: 100%"
              :loading="loadingSecrets"
              @focus="handleSecretSelectFocus"
              placeholder="请选择或输入Secret名称"
            >
              <ElOption
                v-for="secret in secretList"
                :key="secret.name"
                :label="secret.name"
                :value="secret.name"
              >
                <span>{{ secret.name }}</span>
                <ElTag v-if="secret.type" size="small" type="warning" style="margin-left: 8px">
                  {{ secret.type }}
                </ElTag>
              </ElOption>
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="默认权限">
            <ElInput v-model="newVolume.secret.defaultMode" placeholder="0400" />
          </ElFormItem>
          <ElFormItem label="可选">
            <ElSwitch v-model="newVolume.secret.optional" />
            <span style="margin-left: 10px; font-size: 12px; color: #909399">不存在时是否忽略</span>
          </ElFormItem>
        </template>
      </ElForm>

      <template #footer>
        <ElButton @click="cancelEdit">取消</ElButton>
        <ElButton type="primary" @click="saveVolume" :loading="saving">
          {{ editingIndex === -1 ? '添加' : '保存' }}
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch, onMounted, onBeforeUnmount, inject, type Ref } from 'vue'
  import { useVolumesStore } from '@/store/workload'
  import type { V1Volume } from '@kubernetes/client-node'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { type WorkloadMode } from '../utils/modeHandler'
  import { Plus, HardDrive, Edit2, Copy, Trash2 } from 'lucide-vue-next'
  import {
    getConfigMapListApi,
    getSecretListApi,
    getPVCListApi,
    type ConfigMapListItem,
    type SecretListItem,
    type PVCListItem
  } from '@/api'

  // Props
  interface Props {
    mode: WorkloadMode
  }

  const props = defineProps<Props>()

  // Emits
  const emit = defineEmits<{
    (e: 'validate', result: { valid: boolean; errors: string[]; warnings?: string[] }): void
  }>()

  // Store
  const volumesStore = useVolumesStore()

  // ✅ 使用 inject 获取参数（注意：父组件 provide 的是 Ref 对象）
  const workspaceIdRef = inject<Ref<number>>('workspaceId')
  const clusterUuidRef = inject<Ref<string>>('clusterUuid')
  const namespaceRef = inject<Ref<string>>('namespace')

  // ✅ 使用 computed 安全地获取值
  const workspaceId = computed(() => workspaceIdRef?.value ?? 0)
  const clusterUuid = computed(() => clusterUuidRef?.value ?? '')
  const namespace = computed(() => namespaceRef?.value ?? 'default')

  // 存储卷列表
  const volumes = computed(() => volumesStore.volumes)

  // 监听 volumes 变化
  watch(
    () => volumesStore.volumes,
    () => {
      emitValidation()
    },
    { deep: true }
  )

  // UI 状态
  const showAddDialog = ref(false)
  const editingIndex = ref(-1)
  const saving = ref(false)

  // 卷名称验证错误
  const volumeNameError = ref('')

  // EmptyDir 大小配置
  const sizeValue = ref<number | undefined>(undefined)
  const sizeUnit = ref('Gi')

  // ✅ 资源列表状态
  const pvcList = ref<
    Array<{ name: string; status: string; capacity: string; storageClass?: string }>
  >([])
  const configMapList = ref<Array<{ name: string; dataCount?: number }>>([])
  const secretList = ref<Array<{ name: string; type?: string; dataCount?: number }>>([])

  // ✅ 只展示未绑定的 PVC（可用于绑定的）
  const availablePvcList = computed(() => pvcList.value.filter((pvc) => pvc.status !== 'Bound'))

  // ✅ 加载状态
  const loadingPVCs = ref(false)
  const loadingConfigMaps = ref(false)
  const loadingSecrets = ref(false)

  // ✅ 资源加载标记（避免重复加载）
  const pvcsLoaded = ref(false)
  const configMapsLoaded = ref(false)
  const secretsLoaded = ref(false)

  // ✅ AbortController 用于取消请求
  let pvcAbortController: AbortController | null = null
  let configMapAbortController: AbortController | null = null
  let secretAbortController: AbortController | null = null

  // 新存储卷对象
  const newVolume = reactive({
    type: 'emptyDir' as string,
    name: '',
    emptyDir: {
      medium: '',
      sizeLimit: undefined as string | undefined
    },
    persistentVolumeClaim: {
      claimName: '',
      readOnly: false
    },
    hostPath: {
      path: '',
      type: 'DirectoryOrCreate'
    },
    nfs: {
      server: '',
      path: '',
      readOnly: false
    },
    configMap: {
      name: '',
      defaultMode: '0644',
      optional: false
    },
    secret: {
      secretName: '',
      defaultMode: '0400',
      optional: false
    }
  })

  // ✅ 加载 PVC 列表 - 真正的懒加载
  const loadPVCList = async () => {
    if (!clusterUuid.value || !namespace.value) {
      console.warn('[VolumesStep] clusterUuid 或 namespace 无效，跳过加载 PVC 列表')
      return
    }

    // ✅ 已加载则跳过
    if (pvcsLoaded.value) {
      return
    }

    // ✅ 正在加载则跳过（防止重复请求）
    if (loadingPVCs.value) {
      return
    }

    if (pvcAbortController) {
      pvcAbortController.abort()
    }

    pvcAbortController = new AbortController()
    const signal = pvcAbortController.signal

    loadingPVCs.value = true

    try {
      const response = await getPVCListApi({
        clusterUuid: clusterUuid.value,
        namespace: namespace.value
      })

      if (signal.aborted) return

      pvcList.value = (response.items || []).map((item: PVCListItem) => ({
        name: item.name,
        status: item.status,
        capacity: item.capacity,
        storageClass: item.storageClass
      }))

      pvcsLoaded.value = true
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return
      }
      console.error('[VolumesStep] 加载 PVC 列表失败:', error)
      ElMessage.error('加载 PVC 列表失败')
    } finally {
      loadingPVCs.value = false
      pvcAbortController = null
    }
  }

  // ✅ 加载 ConfigMap 列表 - 真正的懒加载
  const loadConfigMapList = async () => {
    if (!workspaceId.value || workspaceId.value === 0) {
      console.warn('[VolumesStep] workspaceId 无效，跳过加载 ConfigMap 列表')
      return
    }

    // ✅ 已加载则跳过
    if (configMapsLoaded.value) {
      return
    }

    // ✅ 正在加载则跳过（防止重复请求）
    if (loadingConfigMaps.value) {
      return
    }

    if (configMapAbortController) {
      configMapAbortController.abort()
    }

    configMapAbortController = new AbortController()
    const signal = configMapAbortController.signal

    loadingConfigMaps.value = true

    try {
      const response = await getConfigMapListApi({ workloadId: workspaceId.value })

      if (signal.aborted) return

      configMapList.value = (response.items || []).map((item: ConfigMapListItem) => ({
        name: item.name,
        dataCount: item.dataCount
      }))

      configMapsLoaded.value = true
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return
      }
      console.error('[VolumesStep] 加载 ConfigMap 列表失败:', error)
      ElMessage.error('加载 ConfigMap 列表失败')
    } finally {
      loadingConfigMaps.value = false
      configMapAbortController = null
    }
  }

  // ✅ 加载 Secret 列表 - 真正的懒加载
  const loadSecretList = async () => {
    if (!workspaceId.value || workspaceId.value === 0) {
      console.warn('[VolumesStep] workspaceId 无效，跳过加载 Secret 列表')
      return
    }

    // ✅ 已加载则跳过
    if (secretsLoaded.value) {
      return
    }

    // ✅ 正在加载则跳过（防止重复请求）
    if (loadingSecrets.value) {
      return
    }

    if (secretAbortController) {
      secretAbortController.abort()
    }

    secretAbortController = new AbortController()
    const signal = secretAbortController.signal

    loadingSecrets.value = true

    try {
      const response = await getSecretListApi({ workloadId: workspaceId.value })

      if (signal.aborted) return

      secretList.value = (response.items || []).map((item: SecretListItem) => ({
        name: item.name,
        type: item.type,
        dataCount: item.dataCount
      }))

      secretsLoaded.value = true
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return
      }
      console.error('[VolumesStep] 加载 Secret 列表失败:', error)
      ElMessage.error('加载 Secret 列表失败')
    } finally {
      loadingSecrets.value = false
      secretAbortController = null
    }
  }

  // ✅ 下拉框获取焦点时加载资源（懒加载触发点）
  const handlePVCSelectFocus = async () => {
    if (!pvcsLoaded.value) {
      await loadPVCList()
    }
  }

  const handleConfigMapSelectFocus = async () => {
    if (!configMapsLoaded.value) {
      await loadConfigMapList()
    }
  }

  const handleSecretSelectFocus = async () => {
    if (!secretsLoaded.value) {
      await loadSecretList()
    }
  }

  // ✅ 监听参数变化，重置加载状态
  watch([workspaceId, clusterUuid, namespace], () => {
    // 重置加载状态
    pvcsLoaded.value = false
    configMapsLoaded.value = false
    secretsLoaded.value = false

    // 清空列表
    pvcList.value = []
    configMapList.value = []
    secretList.value = []
  })

  // 发送验证结果
  function emitValidation() {
    const validation = volumesStore.validate()
    emit('validate', {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    })
  }

  // ==================== 存储卷类型识别（支持 25+ 种类型） ====================

  /**
   * 获取存储卷类型
   * 支持 Kubernetes 所有标准卷类型
   */
  function getVolumeType(volume: V1Volume): string {
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
    return 'unknown'
  }

  /**
   * 获取存储卷类型标签（显示名称）
   */
  function getVolumeTypeLabel(volume: V1Volume): string {
    const type = getVolumeType(volume)
    const labels: Record<string, string> = {
      emptyDir: 'EmptyDir',
      persistentVolumeClaim: 'PVC',
      hostPath: 'HostPath',
      nfs: 'NFS',
      configMap: 'ConfigMap',
      secret: 'Secret',
      projected: 'Projected',
      downwardAPI: 'DownwardAPI',
      csi: 'CSI',
      ephemeral: 'Ephemeral',
      awsElasticBlockStore: 'AWS EBS',
      azureDisk: 'Azure Disk',
      azureFile: 'Azure File',
      gcePersistentDisk: 'GCE PD',
      cephfs: 'CephFS',
      glusterfs: 'GlusterFS',
      iscsi: 'iSCSI',
      rbd: 'RBD',
      fc: 'FC',
      flocker: 'Flocker',
      gitRepo: 'GitRepo',
      portworxVolume: 'Portworx',
      quobyte: 'Quobyte',
      scaleIO: 'ScaleIO',
      storageos: 'StorageOS',
      vsphereVolume: 'vSphere',
      cifs: 'CIFS'
    }
    return labels[type] || type
  }

  /**
   * 获取存储卷标签颜色
   */
  function getVolumeTagType(volume: V1Volume): string {
    const type = getVolumeType(volume)
    const tagTypes: Record<string, string> = {
      emptyDir: 'info',
      persistentVolumeClaim: 'success',
      hostPath: 'warning',
      nfs: 'success',
      configMap: 'primary',
      secret: 'danger',
      projected: 'primary',
      downwardAPI: 'info',
      csi: 'success',
      ephemeral: 'info'
    }
    return tagTypes[type] || 'info'
  }

  /**
   * 获取存储卷简短描述
   */
  function getVolumeShortDescription(volume: V1Volume): string {
    const type = getVolumeType(volume)
    switch (type) {
      case 'emptyDir':
        return volume.emptyDir?.medium === 'Memory' ? '内存临时存储' : '磁盘临时存储'
      case 'hostPath':
        return volume.hostPath?.path || '未配置路径'
      case 'persistentVolumeClaim':
        return volume.persistentVolumeClaim?.claimName || '未配置PVC'
      case 'configMap':
        return volume.configMap?.name || '未配置ConfigMap'
      case 'secret':
        return volume.secret?.secretName || '未配置Secret'
      case 'nfs':
        return `${volume.nfs?.server || ''}:${volume.nfs?.path || ''}`
      case 'projected': {
        // 解析 projected 类型的来源
        const sources = volume.projected?.sources || []
        const sourceTypes: string[] = []
        sources.forEach((src: any) => {
          if (src.serviceAccountToken) sourceTypes.push('ServiceAccountToken')
          if (src.configMap) sourceTypes.push(`ConfigMap:${src.configMap.name}`)
          if (src.secret) sourceTypes.push(`Secret:${src.secret.name}`)
          if (src.downwardAPI) sourceTypes.push('DownwardAPI')
        })
        return sourceTypes.length > 0 ? sourceTypes.join(', ') : '投射卷'
      }
      case 'downwardAPI':
        return 'Pod 元数据'
      case 'csi':
        return volume.csi?.driver || 'CSI 驱动'
      case 'ephemeral':
        return '临时卷'
      case 'awsElasticBlockStore':
        return (volume as any).awsElasticBlockStore?.volumeID || 'AWS EBS 卷'
      case 'azureDisk':
        return (volume as any).azureDisk?.diskName || 'Azure 磁盘'
      case 'azureFile':
        return (volume as any).azureFile?.shareName || 'Azure 文件共享'
      case 'gcePersistentDisk':
        return (volume as any).gcePersistentDisk?.pdName || 'GCE 持久磁盘'
      case 'cephfs':
        return (volume as any).cephfs?.monitors?.join(',') || 'CephFS'
      case 'glusterfs':
        return `${(volume as any).glusterfs?.endpoints || ''}:${(volume as any).glusterfs?.path || ''}`
      case 'iscsi':
        return (volume as any).iscsi?.targetPortal || 'iSCSI'
      case 'rbd':
        return (volume as any).rbd?.image || 'RBD'
      default:
        return type !== 'unknown' ? type : '未知类型'
    }
  }

  /**
   * 判断是否是可编辑的卷类型
   * 只有基础类型支持表单编辑，其他类型只能通过 YAML 编辑
   */
  function isEditableVolumeType(volume: V1Volume): boolean {
    const editableTypes = [
      'emptyDir',
      'persistentVolumeClaim',
      'hostPath',
      'nfs',
      'configMap',
      'secret'
    ]
    return editableTypes.includes(getVolumeType(volume))
  }

  // 获取存储卷大小
  function getVolumeSize(volume: V1Volume): string {
    if (volume.emptyDir?.sizeLimit) {
      return volume.emptyDir.sizeLimit
    }
    return ''
  }

  // 编辑存储卷
  function editVolume(index: number) {
    const volume = volumes.value[index]
    const type = getVolumeType(volume)

    // 检查是否支持表单编辑
    if (!isEditableVolumeType(volume)) {
      ElMessage.warning(`${getVolumeTypeLabel(volume)} 类型暂不支持表单编辑，请使用 YAML 模式`)
      return
    }

    editingIndex.value = index
    resetNewVolume()

    newVolume.type = type
    newVolume.name = volume.name

    switch (newVolume.type) {
      case 'emptyDir':
        newVolume.emptyDir = { ...volume.emptyDir }
        if (volume.emptyDir?.sizeLimit) {
          const match = volume.emptyDir.sizeLimit.match(/^(\d+)([A-Za-z]+)$/)
          if (match) {
            sizeValue.value = parseInt(match[1])
            sizeUnit.value = match[2]
          }
        }
        break
      case 'persistentVolumeClaim':
        newVolume.persistentVolumeClaim = { ...volume.persistentVolumeClaim }
        break
      case 'hostPath':
        newVolume.hostPath = { ...volume.hostPath }
        break
      case 'nfs':
        newVolume.nfs = { ...volume.nfs }
        break
      case 'configMap':
        newVolume.configMap = {
          name: volume.configMap?.name || '',
          defaultMode: volume.configMap?.defaultMode?.toString() || '0644',
          optional: volume.configMap?.optional || false
        }
        break
      case 'secret':
        newVolume.secret = {
          secretName: volume.secret?.secretName || '',
          defaultMode: volume.secret?.defaultMode?.toString() || '0400',
          optional: volume.secret?.optional || false
        }
        break
    }

    showAddDialog.value = true
  }

  // 复制存储卷
  function duplicateVolume(index: number) {
    const volume = volumes.value[index]
    const newVolumeCopy: V1Volume = JSON.parse(JSON.stringify(volume))
    newVolumeCopy.name = `${volume.name}-copy`
    volumesStore.addVolume(newVolumeCopy)
    ElMessage.success('存储卷已复制')
  }

  // 删除存储卷
  function removeVolume(index: number) {
    ElMessageBox.confirm('确定要删除此存储卷吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        volumesStore.removeVolume(index)
        ElMessage.success('已删除')
      })
      .catch(() => {})
  }

  // 处理类型改变
  function handleTypeChange(newType: string) {
    const savedName = newVolume.name
    const savedType = newType // 保存新选择的类型
    resetNewVolume()
    newVolume.type = savedType // 恢复选择的类型
    newVolume.name = savedName
    volumeNameError.value = ''
  }

  // 验证卷名称
  function validateVolumeName() {
    const name = newVolume.name.trim()

    if (!name) {
      volumeNameError.value = '卷名称不能为空'
      return false
    }

    if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(name) && !/^[a-z]$/.test(name)) {
      volumeNameError.value = '必须以小写字母开头，只能包含小写字母、数字和中划线，不能以中划线结尾'
      return false
    }

    const isDuplicate = volumes.value.some((v, i) => v.name === name && i !== editingIndex.value)
    if (isDuplicate) {
      volumeNameError.value = '卷名称已存在'
      return false
    }

    volumeNameError.value = ''
    return true
  }

  // 更新大小限制
  function updateSizeLimit() {
    if (sizeValue.value && sizeValue.value > 0) {
      newVolume.emptyDir.sizeLimit = `${sizeValue.value}${sizeUnit.value}`
    } else {
      newVolume.emptyDir.sizeLimit = undefined
    }
  }

  watch(sizeValue, () => {
    updateSizeLimit()
  })

  // 取消编辑
  function cancelEdit() {
    showAddDialog.value = false
    editingIndex.value = -1
    resetNewVolume()
    volumeNameError.value = ''
  }

  // 保存存储卷
  async function saveVolume() {
    if (!validateVolumeName()) {
      return
    }

    saving.value = true

    try {
      const volume: V1Volume = {
        name: newVolume.name
      }

      // 根据类型设置对应的属性
      switch (newVolume.type) {
        case 'emptyDir':
          volume.emptyDir = {
            medium: newVolume.emptyDir.medium || undefined,
            sizeLimit: newVolume.emptyDir.sizeLimit || undefined
          }
          break

        case 'persistentVolumeClaim':
          if (!newVolume.persistentVolumeClaim.claimName) {
            ElMessage.warning('请选择或输入 PVC 名称')
            return
          }
          volume.persistentVolumeClaim = {
            claimName: newVolume.persistentVolumeClaim.claimName,
            readOnly: newVolume.persistentVolumeClaim.readOnly
          }
          break

        case 'hostPath':
          if (!newVolume.hostPath.path) {
            ElMessage.warning('请输入主机路径')
            return
          }
          volume.hostPath = {
            path: newVolume.hostPath.path,
            type: newVolume.hostPath.type || undefined
          }
          break

        case 'nfs':
          if (!newVolume.nfs.server || !newVolume.nfs.path) {
            ElMessage.warning('请输入 NFS 服务器和路径')
            return
          }
          volume.nfs = {
            server: newVolume.nfs.server,
            path: newVolume.nfs.path,
            readOnly: newVolume.nfs.readOnly
          }
          break

        case 'configMap':
          if (!newVolume.configMap.name) {
            ElMessage.warning('请选择或输入 ConfigMap 名称')
            return
          }
          volume.configMap = {
            name: newVolume.configMap.name,
            defaultMode: parseInt(newVolume.configMap.defaultMode) || undefined,
            optional: newVolume.configMap.optional
          }
          break

        case 'secret':
          if (!newVolume.secret.secretName) {
            ElMessage.warning('请选择或输入 Secret 名称')
            return
          }
          volume.secret = {
            secretName: newVolume.secret.secretName,
            defaultMode: parseInt(newVolume.secret.defaultMode) || undefined,
            optional: newVolume.secret.optional
          }
          break
      }

      if (editingIndex.value === -1) {
        volumesStore.addVolume(volume)
        ElMessage.success('存储卷添加成功')
      } else {
        volumesStore.updateVolume(editingIndex.value, volume)
        ElMessage.success('存储卷更新成功')
      }

      cancelEdit()
    } finally {
      saving.value = false
    }
  }

  // 重置新存储卷
  function resetNewVolume() {
    newVolume.type = 'emptyDir'
    newVolume.name = ''
    newVolume.emptyDir = { medium: '', sizeLimit: undefined }
    newVolume.persistentVolumeClaim = { claimName: '', readOnly: false }
    newVolume.hostPath = { path: '', type: 'DirectoryOrCreate' }
    newVolume.nfs = { server: '', path: '', readOnly: false }
    newVolume.configMap = { name: '', defaultMode: '0644', optional: false }
    newVolume.secret = { secretName: '', defaultMode: '0400', optional: false }
    sizeValue.value = undefined
    sizeUnit.value = 'Gi'
  }

  // 表单验证
  async function validate(): Promise<boolean> {
    const validation = volumesStore.validate()
    if (!validation.valid) {
      return false
    }
    return true
  }

  // 初始化
  onMounted(() => {
    emitValidation()
    // ✅ 不再自动加载任何资源，完全懒加载
  })

  // ✅ 组件卸载时取消所有请求
  onBeforeUnmount(() => {
    if (pvcAbortController) {
      pvcAbortController.abort()
    }
    if (configMapAbortController) {
      configMapAbortController.abort()
    }
    if (secretAbortController) {
      secretAbortController.abort()
    }
  })

  // 导出
  defineExpose({
    validate
  })
</script>

<style lang="scss" scoped>
  .volumes-step {
    .volumes-panel {
      .volumes-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .empty-volumes {
        padding: 60px;
        text-align: center;
        background: #f5f7fa;
        border-radius: 8px;
      }

      .volumes-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .volume-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid #ebeef5;
          border-radius: 8px;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }

          .volume-info {
            flex: 1;

            .volume-name {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;
            }

            .volume-desc {
              font-size: 13px;
              color: #606266;
              margin-top: 6px;
            }

            .volume-size {
              font-size: 12px;
              color: #909399;
              margin-top: 4px;
            }
          }

          .volume-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    .error-message {
      color: #f56c6c;
      font-size: 12px;
      margin-top: 4px;
    }

    .is-error {
      :deep(.el-input__wrapper) {
        border-color: #f56c6c;
        box-shadow: 0 0 0 1px #f56c6c inset;
      }
    }

    // ✅ 简化后的下拉选项样式
    :deep(.el-select-dropdown__item) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      height: 34px;
      line-height: 34px;

      .el-tag {
        flex-shrink: 0;
      }
    }
  }
</style>
