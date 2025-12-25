<template>
  <div class="env-management">
    <!-- 容器选择 -->
    <div class="container-selector">
      <label>选择容器：</label>
      <ElSelect
        v-model="selectedContainer"
        placeholder="选择容器"
        style="width: 240px"
        :loading="loading"
        @change="handleContainerChange"
      >
        <ElOption
          v-for="container in containers"
          :key="container.containerName"
          :label="container.containerName"
          :value="container.containerName"
        />
      </ElSelect>

      <div class="selector-actions">
        <ElButton v-if="!editing" type="primary" size="small" @click="startEdit">
          <Edit :size="14" />
          编辑
        </ElButton>
        <template v-else>
          <ElButton type="primary" size="small" :loading="saving" @click="handleSaveAll">
            <Save :size="14" />
            保存
          </ElButton>
          <ElButton size="small" @click="cancelEdit">取消</ElButton>
        </template>
      </div>
    </div>

    <!-- 环境变量列表 -->
    <div v-if="selectedContainer" class="env-list-wrapper" v-loading="loading">
      <div class="list-header">
        <span>环境变量列表</span>
        <div class="header-actions">
          <ElDropdown @command="handleImportCommand" trigger="click">
            <ElButton size="small" :disabled="!editing">
              <Download :size="14" style="margin-right: 4px" />
              批量导入
              <ChevronDown :size="14" style="margin-left: 4px" />
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="text">
                  <FileText :size="14" style="margin-right: 6px" />
                  文本导入 (key=value)
                </ElDropdownItem>
                <ElDropdownItem command="configmap">
                  <Database :size="14" style="margin-right: 6px" />
                  从 ConfigMap 导入
                </ElDropdownItem>
                <ElDropdownItem command="secret">
                  <Key :size="14" style="margin-right: 6px" />
                  从 Secret 导入
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
          <ElButton type="primary" size="small" :disabled="!editing" @click="handleAddEnv">
            <Plus :size="14" />
            添加变量
          </ElButton>
        </div>
      </div>

      <ElTable :data="currentEnvVars" stripe class="env-table" size="default">
        <ElTableColumn prop="name" label="变量名" width="200">
          <template #default="{ row }">
            <ElInput v-model="row.name" placeholder="变量名" :disabled="!editing" size="small" />
          </template>
        </ElTableColumn>

        <ElTableColumn prop="source.type" label="来源类型" width="150">
          <template #default="{ row }">
            <ElSelect
              v-model="row.source.type"
              placeholder="来源类型"
              :disabled="!editing"
              @change="handleEnvTypeChange(row)"
              size="small"
            >
              <ElOption label="直接值" value="value" />
              <ElOption label="ConfigMap" value="configMapKeyRef" />
              <ElOption label="Secret" value="secretKeyRef" />
              <ElOption label="字段引用" value="fieldRef" />
              <ElOption label="资源引用" value="resourceFieldRef" />
            </ElSelect>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="source.value" label="值/引用" min-width="320">
          <template #default="{ row }">
            <!-- 直接值 -->
            <ElInput
              v-if="row.source.type === 'value'"
              v-model="row.source.value"
              placeholder="变量值"
              :disabled="!editing"
              size="small"
            />

            <!-- ConfigMap 引用 -->
            <div v-else-if="row.source.type === 'configMapKeyRef'" class="ref-input-group">
              <ElSelect
                v-model="row.source.configMapKeyRef.name"
                placeholder="选择 ConfigMap"
                :disabled="!editing"
                filterable
                style="width: 48%"
                :loading="loadingResources"
                @focus="handleResourceSelectFocus"
                @change="(val: string) => handleConfigMapSelect(row, val)"
                size="small"
              >
                <ElOption
                  v-for="cm in configMapList"
                  :key="cm.name"
                  :label="cm.name"
                  :value="cm.name"
                />
              </ElSelect>
              <ElSelect
                v-model="row.source.configMapKeyRef.key"
                placeholder="选择 Key"
                :disabled="!editing || !row.source.configMapKeyRef.name"
                filterable
                style="width: 48%"
                :loading="isLoadingConfigMapKeys(row.source.configMapKeyRef.name)"
                @focus="() => handleConfigMapKeySelectFocus(row.source.configMapKeyRef.name)"
                size="small"
              >
                <ElOption
                  v-for="key in getConfigMapKeys(row.source.configMapKeyRef.name)"
                  :key="key"
                  :label="key"
                  :value="key"
                />
              </ElSelect>
            </div>

            <!-- Secret 引用 -->
            <div v-else-if="row.source.type === 'secretKeyRef'" class="ref-input-group">
              <ElSelect
                v-model="row.source.secretKeyRef.name"
                placeholder="选择 Secret"
                :disabled="!editing"
                filterable
                style="width: 48%"
                :loading="loadingResources"
                @focus="handleResourceSelectFocus"
                @change="(val: string) => handleSecretSelect(row, val)"
                size="small"
              >
                <ElOption v-for="s in secretList" :key="s.name" :label="s.name" :value="s.name">
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>{{ s.name }}</span>
                    <ElTag size="small" type="info">{{ s.type }}</ElTag>
                  </div>
                </ElOption>
              </ElSelect>
              <ElSelect
                v-model="row.source.secretKeyRef.key"
                placeholder="选择 Key"
                :disabled="!editing || !row.source.secretKeyRef.name"
                filterable
                style="width: 48%"
                :loading="isLoadingSecretKeys(row.source.secretKeyRef.name)"
                @focus="() => handleSecretKeySelectFocus(row.source.secretKeyRef.name)"
                size="small"
              >
                <ElOption
                  v-for="key in getSecretKeys(row.source.secretKeyRef.name)"
                  :key="key"
                  :label="key"
                  :value="key"
                />
              </ElSelect>
            </div>

            <!-- 字段引用 -->
            <div v-else-if="row.source.type === 'fieldRef'" class="ref-input-group">
              <ElSelect
                v-model="row.source.fieldRef.fieldPath"
                placeholder="选择字段或输入自定义路径"
                :disabled="!editing"
                filterable
                allow-create
                style="width: 100%"
                @change="handleFieldRefChange(row)"
                size="small"
              >
                <ElOptionGroup label="Pod 元数据">
                  <ElOption label="Pod 名称 (metadata.name)" value="metadata.name" />
                  <ElOption label="命名空间 (metadata.namespace)" value="metadata.namespace" />
                  <ElOption label="Pod UID (metadata.uid)" value="metadata.uid" />
                  <ElOption label="Pod 标签 (metadata.labels)" value="metadata.labels" />
                  <ElOption label="Pod 注解 (metadata.annotations)" value="metadata.annotations" />
                </ElOptionGroup>
                <ElOptionGroup label="Pod 规格">
                  <ElOption label="节点名称 (spec.nodeName)" value="spec.nodeName" />
                  <ElOption
                    label="服务账号 (spec.serviceAccountName)"
                    value="spec.serviceAccountName"
                  />
                </ElOptionGroup>
                <ElOptionGroup label="Pod 状态">
                  <ElOption label="Pod IP (status.podIP)" value="status.podIP" />
                  <ElOption label="宿主机 IP (status.hostIP)" value="status.hostIP" />
                </ElOptionGroup>
              </ElSelect>
            </div>

            <!-- 资源引用 -->
            <div v-else-if="row.source.type === 'resourceFieldRef'" class="ref-input-group">
              <ElSelect
                v-model="row.source.resourceFieldRef.resource"
                placeholder="选择资源字段或输入自定义"
                :disabled="!editing"
                filterable
                allow-create
                style="width: 100%"
                @change="handleResourceFieldRefChange(row)"
                size="small"
              >
                <ElOptionGroup label="CPU 资源">
                  <ElOption label="CPU 请求量 (requests.cpu)" value="requests.cpu" />
                  <ElOption label="CPU 限制量 (limits.cpu)" value="limits.cpu" />
                </ElOptionGroup>
                <ElOptionGroup label="内存资源">
                  <ElOption label="内存请求量 (requests.memory)" value="requests.memory" />
                  <ElOption label="内存限制量 (limits.memory)" value="limits.memory" />
                </ElOptionGroup>
                <ElOptionGroup label="临时存储">
                  <ElOption
                    label="临时存储请求 (requests.ephemeral-storage)"
                    value="requests.ephemeral-storage"
                  />
                  <ElOption
                    label="临时存储限制 (limits.ephemeral-storage)"
                    value="limits.ephemeral-storage"
                  />
                </ElOptionGroup>
              </ElSelect>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="80" fixed="right" align="center">
          <template #default="{ $index }">
            <ElButton
              v-if="editing"
              size="small"
              text
              type="danger"
              @click="handleDeleteEnv($index)"
            >
              <Trash2 :size="14" />
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <ElEmpty v-else description="请选择一个容器" :image-size="120" />

    <!-- 文本批量导入对话框 -->
    <ElDialog
      v-model="textImportDialogVisible"
      title="批量导入环境变量"
      width="700px"
      @closed="handleTextImportDialogClosed"
    >
      <div class="import-dialog-content">
        <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 16px">
          <template #title>
            <div style="font-size: 13px; line-height: 1.6">
              <div><strong>支持两种格式：</strong></div>
              <div style="margin-top: 8px"><code>key1=value1</code> （每行一个键值对）</div>
              <div style="margin-top: 4px">
                <code>key2=value2</code> （等号分隔，支持带空格的值）
              </div>
            </div>
          </template>
        </ElAlert>

        <ElInput
          v-model="textImportContent"
          type="textarea"
          :rows="12"
          placeholder="请输入环境变量，每行一个，格式：KEY=VALUE&#10;例如：&#10;APP_NAME=my-app&#10;DB_HOST=localhost&#10;DB_PORT=3306"
        />

        <div class="import-preview" v-if="parsedTextImportVars.length > 0">
          <div class="preview-header">
            <span>预览（共 {{ parsedTextImportVars.length }} 个变量）</span>
          </div>
          <div class="preview-list">
            <div
              v-for="(item, index) in parsedTextImportVars"
              :key="index"
              class="preview-item"
              :class="{ error: item.error }"
            >
              <div class="item-key">{{ item.key }}</div>
              <div class="item-separator">=</div>
              <div class="item-value">{{ item.value }}</div>
              <div v-if="item.error" class="item-error">{{ item.error }}</div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <ElButton @click="textImportDialogVisible = false">取消</ElButton>
        <ElButton
          type="primary"
          :disabled="parsedTextImportVars.length === 0 || parsedTextImportVars.some((v) => v.error)"
          @click="handleTextImport"
        >
          导入（{{ parsedTextImportVars.filter((v) => !v.error).length }}）
        </ElButton>
      </template>
    </ElDialog>

    <!-- ConfigMap 导入对话框 -->
    <ElDialog
      v-model="configMapDialogVisible"
      title="从 ConfigMap 导入环境变量"
      width="600px"
      @closed="handleImportDialogClosed"
    >
      <div class="import-dialog-content">
        <ElForm label-width="100px">
          <ElFormItem label="ConfigMap">
            <ElSelect
              v-model="selectedConfigMapName"
              placeholder="选择 ConfigMap"
              filterable
              style="width: 100%"
              :loading="loadingConfigMaps"
              @change="handleConfigMapChange"
            >
              <ElOption
                v-for="cm in configMaps"
                :key="cm.name"
                :label="`${cm.name} (${cm.dataCount} 项)`"
                :value="cm.name"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="数据项" v-if="configMapData.length > 0">
            <div class="data-preview">
              <ElCheckboxGroup v-model="selectedConfigMapKeys">
                <div v-for="item in configMapData" :key="item.key" class="data-item">
                  <ElCheckbox :label="item.key">
                    <div class="checkbox-content">
                      <span class="key-label">{{ item.key }}</span>
                      <span class="value-preview">{{ item.value }}</span>
                    </div>
                  </ElCheckbox>
                </div>
              </ElCheckboxGroup>
            </div>
          </ElFormItem>
        </ElForm>
      </div>

      <template #footer>
        <ElButton @click="configMapDialogVisible = false">取消</ElButton>
        <ElButton
          type="primary"
          :disabled="selectedConfigMapKeys.length === 0"
          @click="handleImportConfigMap"
        >
          导入选中项（{{ selectedConfigMapKeys.length }}）
        </ElButton>
      </template>
    </ElDialog>

    <!-- Secret 导入对话框 -->
    <ElDialog
      v-model="secretDialogVisible"
      title="从 Secret 导入环境变量"
      width="600px"
      @closed="handleImportDialogClosed"
    >
      <div class="import-dialog-content">
        <ElForm label-width="100px">
          <ElFormItem label="Secret">
            <ElSelect
              v-model="selectedSecretName"
              placeholder="选择 Secret"
              filterable
              style="width: 100%"
              :loading="loadingSecrets"
              @change="handleSecretChange"
            >
              <ElOption
                v-for="s in secrets"
                :key="s.name"
                :label="`${s.name} (${s.dataCount} 项)`"
                :value="s.name"
              >
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span>{{ s.name }}</span>
                  <ElTag size="small" type="info">{{ s.type }}</ElTag>
                </div>
              </ElOption>
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="数据项" v-if="secretData.length > 0">
            <div class="data-preview">
              <ElCheckboxGroup v-model="selectedSecretKeys">
                <div v-for="item in secretData" :key="item.key" class="data-item">
                  <ElCheckbox :label="item.key">
                    <div class="checkbox-content">
                      <span class="key-label">{{ item.key }}</span>
                      <span class="value-preview">{{ item.value }}</span>
                    </div>
                  </ElCheckbox>
                </div>
              </ElCheckboxGroup>
            </div>
          </ElFormItem>
        </ElForm>
      </div>

      <template #footer>
        <ElButton @click="secretDialogVisible = false">取消</ElButton>
        <ElButton
          type="primary"
          :disabled="selectedSecretKeys.length === 0"
          @click="handleImportSecret"
        >
          导入选中项（{{ selectedSecretKeys.length }}）
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Plus,
    Edit,
    Trash2,
    Save,
    Download,
    ChevronDown,
    Database,
    Key,
    FileText
  } from 'lucide-vue-next'
  import {
    getEnvVarsApi,
    updateEnvVarsApi,
    getConfigMapListApi,
    getConfigMapDataApi,
    getSecretListApi,
    getSecretDataApi,
    type OnecProjectVersion,
    type ProjectWorkspace,
    type ContainerEnvVars,
    type ConfigMapListItem,
    type ConfigMapDataItem,
    type SecretListItem,
    type SecretDataItem
  } from '@/api'

  interface Props {
    version: OnecProjectVersion
    workspace: ProjectWorkspace | null
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  const loading = ref(false)
  const saving = ref(false)
  const editing = ref(false)
  const containers = ref<ContainerEnvVars[]>([])
  const selectedContainer = ref('')

  // ConfigMap 和 Secret 列表
  const configMapList = ref<ConfigMapListItem[]>([])
  const secretList = ref<SecretListItem[]>([])
  const loadingResources = ref(false)

  // 单独追踪每个 ConfigMap/Secret 的 keys 加载状态
  const loadingConfigMapKeysMap = ref<Record<string, boolean>>({})
  const loadingSecretKeysMap = ref<Record<string, boolean>>({})

  const resourcesLoaded = ref(false)
  let resourcesAbortController: AbortController | null = null

  const configMapDataCache = ref<Record<string, ConfigMapDataItem[]>>({})
  const secretDataCache = ref<Record<string, SecretDataItem[]>>({})

  const fieldRefNameMap: Record<string, string> = {
    'metadata.name': 'POD_NAME',
    'metadata.namespace': 'NAMESPACE',
    'metadata.uid': 'POD_UID',
    'metadata.labels': 'POD_LABELS',
    'metadata.annotations': 'POD_ANNOTATIONS',
    'spec.nodeName': 'NODE_NAME',
    'spec.serviceAccountName': 'SERVICE_ACCOUNT',
    'status.podIP': 'POD_IP',
    'status.hostIP': 'HOST_IP'
  }

  const resourceFieldRefNameMap: Record<string, string> = {
    'requests.cpu': 'CPU_REQUEST',
    'limits.cpu': 'CPU_LIMIT',
    'requests.memory': 'MEMORY_REQUEST',
    'limits.memory': 'MEMORY_LIMIT',
    'requests.ephemeral-storage': 'EPHEMERAL_STORAGE_REQUEST',
    'limits.ephemeral-storage': 'EPHEMERAL_STORAGE_LIMIT'
  }

  // 文本批量导入
  const textImportDialogVisible = ref(false)
  const textImportContent = ref('')

  interface ParsedVar {
    key: string
    value: string
    error?: string
  }

  const parsedTextImportVars = computed<ParsedVar[]>(() => {
    if (!textImportContent.value.trim()) return []

    const lines = textImportContent.value.split('\n')
    const vars: ParsedVar[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#')) continue

      const equalIndex = line.indexOf('=')
      if (equalIndex === -1) {
        vars.push({
          key: line,
          value: '',
          error: '格式错误：缺少等号'
        })
        continue
      }

      const key = line.substring(0, equalIndex).trim()
      const value = line.substring(equalIndex + 1).trim()

      if (!key) {
        vars.push({
          key: '',
          value: value,
          error: '格式错误：键名为空'
        })
        continue
      }

      const duplicateIndex = vars.findIndex((v) => v.key === key && !v.error)
      if (duplicateIndex !== -1) {
        vars.push({
          key: key,
          value: value,
          error: '键名重复'
        })
        continue
      }

      vars.push({ key, value })
    }

    return vars
  })

  // ConfigMap 导入相关
  const configMapDialogVisible = ref(false)
  const loadingConfigMaps = ref(false)
  const configMaps = ref<ConfigMapListItem[]>([])
  const selectedConfigMapName = ref('')
  const configMapData = ref<ConfigMapDataItem[]>([])
  const selectedConfigMapKeys = ref<string[]>([])

  // Secret 导入相关
  const secretDialogVisible = ref(false)
  const loadingSecrets = ref(false)
  const secrets = ref<SecretListItem[]>([])
  const selectedSecretName = ref('')
  const secretData = ref<SecretDataItem[]>([])
  const selectedSecretKeys = ref<string[]>([])

  // 原始数据备份
  const originalData = ref<ContainerEnvVars[]>([])

  const currentEnvVars = computed(() => {
    if (!selectedContainer.value) return []
    const container = containers.value.find((c) => c.containerName === selectedContainer.value)
    return container?.env || []
  })

  const workloadId = computed(() => {
    if (props.workspace?.id) {
      return props.workspace.id
    }
    console.error('[环境变量] workspace.id 为空，无法加载 ConfigMap/Secret 列表')
    return 0
  })

  // 检查指定 ConfigMap 的 keys 是否正在加载
  const isLoadingConfigMapKeys = (name: string): boolean => {
    return !!loadingConfigMapKeysMap.value[name]
  }

  // 检查指定 Secret 的 keys 是否正在加载
  const isLoadingSecretKeys = (name: string): boolean => {
    return !!loadingSecretKeysMap.value[name]
  }

  const getConfigMapKeys = (name: string): string[] => {
    if (!name || !configMapDataCache.value[name]) return []
    return configMapDataCache.value[name].map((item) => item.key)
  }

  const getSecretKeys = (name: string): string[] => {
    if (!name || !secretDataCache.value[name]) return []
    return secretDataCache.value[name].map((item) => item.key)
  }

  // 加载指定 ConfigMap 的数据
  const loadConfigMapData = async (name: string): Promise<void> => {
    if (!name || !workloadId.value) return
    if (configMapDataCache.value[name]) return // 已缓存

    loadingConfigMapKeysMap.value[name] = true
    try {
      const response = await getConfigMapDataApi({
        workloadId: workloadId.value,
        name: name
      })
      configMapDataCache.value[name] = response.data || []
    } catch (error) {
      console.error(`[环境变量] 加载 ConfigMap "${name}" 数据失败:`, error)
    } finally {
      loadingConfigMapKeysMap.value[name] = false
    }
  }

  // 加载指定 Secret 的数据
  const loadSecretData = async (name: string): Promise<void> => {
    if (!name || !workloadId.value) return
    if (secretDataCache.value[name]) return // 已缓存

    loadingSecretKeysMap.value[name] = true
    try {
      const response = await getSecretDataApi({
        workloadId: workloadId.value,
        name: name
      })
      secretDataCache.value[name] = response.data || []
    } catch (error) {
      console.error(`[环境变量] 加载 Secret "${name}" 数据失败:`, error)
    } finally {
      loadingSecretKeysMap.value[name] = false
    }
  }

  // 预加载已使用的 ConfigMap 和 Secret 数据
  const preloadUsedResources = async () => {
    if (!workloadId.value) return

    const usedConfigMaps = new Set<string>()
    const usedSecrets = new Set<string>()

    // 收集所有容器中使用的 ConfigMap 和 Secret 名称
    containers.value.forEach((container) => {
      container.env.forEach((envVar) => {
        if (envVar.source.type === 'configMapKeyRef' && envVar.source.configMapKeyRef?.name) {
          usedConfigMaps.add(envVar.source.configMapKeyRef.name)
        }
        if (envVar.source.type === 'secretKeyRef' && envVar.source.secretKeyRef?.name) {
          usedSecrets.add(envVar.source.secretKeyRef.name)
        }
      })
    })

    // 并行加载所有已使用的 ConfigMap 和 Secret 数据
    const loadPromises: Promise<void>[] = []

    usedConfigMaps.forEach((name) => {
      if (!configMapDataCache.value[name]) {
        loadPromises.push(loadConfigMapData(name))
      }
    })

    usedSecrets.forEach((name) => {
      if (!secretDataCache.value[name]) {
        loadPromises.push(loadSecretData(name))
      }
    })

    if (loadPromises.length > 0) {
      await Promise.all(loadPromises)
    }
  }

  const loadResourceLists = async () => {
    if (resourcesLoaded.value) {
      return
    }

    if (!workloadId.value) {
      console.warn('[环境变量] workloadId 为空，跳过加载资源列表')
      return
    }

    if (resourcesAbortController) {
      resourcesAbortController.abort()
    }

    resourcesAbortController = new AbortController()
    const signal = resourcesAbortController.signal

    loadingResources.value = true
    try {
      const [configMapResponse, secretResponse] = await Promise.all([
        getConfigMapListApi({ workloadId: workloadId.value }),
        getSecretListApi({ workloadId: workloadId.value })
      ])

      if (signal.aborted) {
        return
      }

      configMapList.value = configMapResponse.items || []
      secretList.value = secretResponse.items || []
      resourcesLoaded.value = true
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return
      }
      console.error('[环境变量] 加载资源列表失败:', error)
    } finally {
      loadingResources.value = false
      resourcesAbortController = null
    }
  }

  const handleResourceSelectFocus = async () => {
    if (!resourcesLoaded.value) {
      await loadResourceLists()
    }
  }

  // 当 ConfigMap 的 key 选择框获得焦点时，确保数据已加载
  const handleConfigMapKeySelectFocus = async (configMapName: string) => {
    if (!configMapName) return
    if (!configMapDataCache.value[configMapName]) {
      await loadConfigMapData(configMapName)
    }
  }

  // 当 Secret 的 key 选择框获得焦点时，确保数据已加载
  const handleSecretKeySelectFocus = async (secretName: string) => {
    if (!secretName) return
    if (!secretDataCache.value[secretName]) {
      await loadSecretData(secretName)
    }
  }

  const handleConfigMapSelect = async (row: any, name: string) => {
    // 清空之前选择的 key
    if (row.source.configMapKeyRef) {
      row.source.configMapKeyRef.key = ''
    }

    if (!name || !workloadId.value) return

    // 加载该 ConfigMap 的数据
    await loadConfigMapData(name)
  }

  const handleSecretSelect = async (row: any, name: string) => {
    // 清空之前选择的 key
    if (row.source.secretKeyRef) {
      row.source.secretKeyRef.key = ''
    }

    if (!name || !workloadId.value) return

    // 加载该 Secret 的数据
    await loadSecretData(name)
  }

  const loadEnvVars = async () => {
    loading.value = true
    try {
      const response = await getEnvVarsApi(props.version.id)
      containers.value = response.containers || []

      if (containers.value.length > 0 && !selectedContainer.value) {
        selectedContainer.value = containers.value[0].containerName
      }

      // 备份原始数据
      originalData.value = JSON.parse(JSON.stringify(containers.value))

      // 预加载已使用的 ConfigMap 和 Secret 数据
      await preloadUsedResources()
    } catch (error) {
      console.error('[环境变量] 加载失败:', error)
    } finally {
      loading.value = false
    }
  }

  const handleContainerChange = async () => {
    // 切换容器时，预加载该容器使用的 ConfigMap/Secret 数据
    await preloadUsedResources()
  }

  const startEdit = async () => {
    editing.value = true
    // 进入编辑模式时，确保资源列表已加载
    if (!resourcesLoaded.value) {
      await loadResourceLists()
    }
  }

  const cancelEdit = () => {
    // 恢复原始数据
    containers.value = JSON.parse(JSON.stringify(originalData.value))
    editing.value = false
    ElMessage.info('已取消编辑')
  }

  const handleAddEnv = () => {
    const container = containers.value.find((c) => c.containerName === selectedContainer.value)
    if (container) {
      container.env.push({
        name: '',
        source: {
          type: 'value',
          value: ''
        }
      } as any)
    }
  }

  const handleDeleteEnv = (index: number) => {
    const container = containers.value.find((c) => c.containerName === selectedContainer.value)
    if (container) {
      container.env.splice(index, 1)
    }
  }

  const handleEnvTypeChange = (row: any) => {
    const type = row.source.type
    row.source = { type }

    switch (type) {
      case 'value':
        row.source.value = ''
        break
      case 'configMapKeyRef':
        row.source.configMapKeyRef = { name: '', key: '', optional: false }
        break
      case 'secretKeyRef':
        row.source.secretKeyRef = { name: '', key: '', optional: false }
        break
      case 'fieldRef':
        row.source.fieldRef = { fieldPath: '' }
        break
      case 'resourceFieldRef':
        row.source.resourceFieldRef = { resource: '' }
        break
    }
  }

  const handleFieldRefChange = (row: any) => {
    const fieldPath = row.source.fieldRef.fieldPath
    if (fieldPath && fieldRefNameMap[fieldPath]) {
      if (!row.name || Object.values(fieldRefNameMap).includes(row.name)) {
        row.name = fieldRefNameMap[fieldPath]
      }
    }
  }

  const handleResourceFieldRefChange = (row: any) => {
    const resource = row.source.resourceFieldRef.resource
    if (resource && resourceFieldRefNameMap[resource]) {
      if (!row.name || Object.values(resourceFieldRefNameMap).includes(row.name)) {
        row.name = resourceFieldRefNameMap[resource]
      }
    }
  }

  const handleSaveAll = async () => {
    if (!selectedContainer.value) return

    // 验证环境变量
    const invalidVars = currentEnvVars.value.filter((env) => !env.name || !env.name.trim())
    if (invalidVars.length > 0) {
      return
    }

    try {
      await ElMessageBox.confirm('确定要保存环境变量配置吗？', '确认保存', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      saving.value = true

      const container = containers.value.find((c) => c.containerName === selectedContainer.value)
      if (container) {
        await updateEnvVarsApi(props.version.id, {
          containerName: container.containerName,
          env: container.env
        })
      }

      ElMessage.success('环境变量保存成功')
      editing.value = false
      await loadEnvVars()
      emit('success')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('[环境变量] 保存失败:', error)
      }
    } finally {
      saving.value = false
    }
  }

  const handleImportCommand = (command: string) => {
    if (command === 'text') {
      textImportDialogVisible.value = true
    } else if (command === 'configmap') {
      handleOpenConfigMapDialog()
    } else if (command === 'secret') {
      handleOpenSecretDialog()
    }
  }

  const handleTextImport = () => {
    const validVars = parsedTextImportVars.value.filter((v) => !v.error)
    if (validVars.length === 0) {
      return
    }

    const container = containers.value.find((c) => c.containerName === selectedContainer.value)
    if (!container) return

    validVars.forEach((item) => {
      container.env.push({
        name: item.key,
        source: {
          type: 'value',
          value: item.value
        }
      } as any)
    })

    ElMessage.success(`已导入 ${validVars.length} 个环境变量`)
    textImportDialogVisible.value = false
  }

  const handleTextImportDialogClosed = () => {
    textImportContent.value = ''
  }

  const handleOpenConfigMapDialog = async () => {
    if (!workloadId.value) {
      return
    }

    configMapDialogVisible.value = true

    if (!resourcesLoaded.value) {
      await loadResourceLists()
    }

    loadingConfigMaps.value = true
    try {
      const response = await getConfigMapListApi({
        workloadId: workloadId.value
      })
      configMaps.value = response.items || []
    } catch (error) {
      console.error('[ConfigMap] 加载失败:', error)
    } finally {
      loadingConfigMaps.value = false
    }
  }

  const handleConfigMapChange = async (name: string) => {
    if (!name || !workloadId.value) {
      configMapData.value = []
      selectedConfigMapKeys.value = []
      return
    }

    try {
      const response = await getConfigMapDataApi({
        workloadId: workloadId.value,
        name: name
      })
      configMapData.value = response.data || []
      selectedConfigMapKeys.value = configMapData.value.map((item) => item.key)
    } catch (error) {
      console.error('[ConfigMap] 加载数据失败:', error)
      configMapData.value = []
      selectedConfigMapKeys.value = []
    }
  }

  const handleImportConfigMap = () => {
    if (!selectedConfigMapName.value || selectedConfigMapKeys.value.length === 0) {
      return
    }

    const container = containers.value.find((c) => c.containerName === selectedContainer.value)
    if (!container) return

    const itemsToImport = configMapData.value.filter((item) =>
      selectedConfigMapKeys.value.includes(item.key)
    )

    itemsToImport.forEach((item) => {
      container.env.push({
        name: item.key,
        source: {
          type: 'configMapKeyRef',
          configMapKeyRef: {
            name: selectedConfigMapName.value,
            key: item.key,
            optional: false
          }
        }
      } as any)
    })

    ElMessage.success(`已导入 ${itemsToImport.length} 个环境变量`)
    configMapDialogVisible.value = false
  }

  const handleOpenSecretDialog = async () => {
    if (!workloadId.value) {
      return
    }

    secretDialogVisible.value = true

    if (!resourcesLoaded.value) {
      await loadResourceLists()
    }

    loadingSecrets.value = true
    try {
      const response = await getSecretListApi({
        workloadId: workloadId.value
      })
      secrets.value = response.items || []
    } catch (error) {
      console.error('[Secret] 加载失败:', error)
    } finally {
      loadingSecrets.value = false
    }
  }

  const handleSecretChange = async (name: string) => {
    if (!name || !workloadId.value) {
      secretData.value = []
      selectedSecretKeys.value = []
      return
    }

    try {
      const response = await getSecretDataApi({
        workloadId: workloadId.value,
        name: name
      })
      secretData.value = response.data || []
      selectedSecretKeys.value = secretData.value.map((item) => item.key)
    } catch (error) {
      console.error('[Secret] 加载数据失败:', error)
      secretData.value = []
      selectedSecretKeys.value = []
    }
  }

  const handleImportSecret = () => {
    if (!selectedSecretName.value || selectedSecretKeys.value.length === 0) {
      return
    }

    const container = containers.value.find((c) => c.containerName === selectedContainer.value)
    if (!container) return

    const itemsToImport = secretData.value.filter((item) =>
      selectedSecretKeys.value.includes(item.key)
    )

    itemsToImport.forEach((item) => {
      container.env.push({
        name: item.key,
        source: {
          type: 'secretKeyRef',
          secretKeyRef: {
            name: selectedSecretName.value,
            key: item.key,
            optional: false
          }
        }
      } as any)
    })

    ElMessage.success(`已导入 ${itemsToImport.length} 个环境变量`)
    secretDialogVisible.value = false
  }

  const handleImportDialogClosed = () => {
    selectedConfigMapName.value = ''
    configMapData.value = []
    selectedConfigMapKeys.value = []
    selectedSecretName.value = ''
    secretData.value = []
    selectedSecretKeys.value = []
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        editing.value = false
        // 重置缓存，强制重新加载
        configMapDataCache.value = {}
        secretDataCache.value = {}
        resourcesLoaded.value = false
        loadEnvVars()
      }
    }
  )

  onMounted(() => {
    loadEnvVars()
  })

  defineExpose({
    editing,
    hasUnsavedChanges: () => {
      if (!editing.value) return false
      // 比较当前数据和原始数据
      const current = JSON.stringify(containers.value)
      const original = JSON.stringify(originalData.value)
      return current !== original
    }
  })

  onBeforeUnmount(() => {
    if (resourcesAbortController) {
      resourcesAbortController.abort()
    }
  })
</script>

<style lang="scss" scoped>
  .env-management {
    height: 100%;
    display: flex;
    flex-direction: column;

    .container-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #fff;
      border-bottom: 1px solid var(--el-border-color);
      flex-shrink: 0;

      label {
        font-weight: 500;
        color: #606266;
        font-size: 14px;
        flex-shrink: 0;
      }

      .selector-actions {
        margin-left: auto;
        display: flex;
        gap: 8px;

        :deep(.el-button) {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .env-list-wrapper {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 0 20px 20px 20px;

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0 12px 0;

        span {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }
      }

      .env-table {
        flex: 1;

        .ref-input-group {
          display: flex;
          gap: 8px;
        }

        :deep(.el-button) {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .import-dialog-content {
      code {
        padding: 2px 6px;
        background: #f5f7fa;
        border-radius: 3px;
        font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
        color: #409eff;
        font-size: 12px;
      }

      .import-preview {
        margin-top: 16px;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        overflow: hidden;

        .preview-header {
          padding: 10px 14px;
          background: #f5f7fa;
          border-bottom: 1px solid #e4e7ed;
          font-size: 13px;
          font-weight: 500;
          color: #606266;
        }

        .preview-list {
          max-height: 300px;
          overflow-y: auto;

          .preview-item {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            gap: 10px;
            border-bottom: 1px solid #f0f0f0;
            background: #fff;
            transition: background 0.2s;

            &:hover {
              background: #f9fafb;
            }

            &:last-child {
              border-bottom: none;
            }

            &.error {
              background: #fef0f0;

              .item-key,
              .item-value {
                color: #f56c6c;
              }
            }

            .item-key {
              min-width: 120px;
              font-weight: 500;
              color: #303133;
              font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
              font-size: 13px;
            }

            .item-separator {
              color: #909399;
            }

            .item-value {
              flex: 1;
              color: #606266;
              font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
              font-size: 13px;
              word-break: break-all;
            }

            .item-error {
              color: #f56c6c;
              font-size: 12px;
            }
          }
        }
      }

      .data-preview {
        max-height: 300px;
        overflow-y: auto;
        padding: 12px;
        background: #fafafa;
        border-radius: 6px;
        border: 1px solid #e4e7ed;

        .data-item {
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .checkbox-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-left: 8px;

            .key-label {
              font-size: 13px;
              font-weight: 500;
              color: #303133;
            }

            .value-preview {
              font-size: 12px;
              color: #909399;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 400px;
            }
          }
        }
      }
    }
  }
</style>
