<template>
  <div class="env-config-tab">
    <div class="tab-header">
      <div class="tab-description">
        <Info :size="16" />
        <span>配置容器的环境变量，支持键值对、ConfigMap、Secret 和字段引用</span>
      </div>
      <ElSpace>
        <ElButton size="small" @click="showBatchImportDialog = true">
          <FileText :size="14" style="margin-right: 4px" />
          批量导入
        </ElButton>
        <ElButton size="small" @click="exportToText">
          <Download :size="14" style="margin-right: 4px" />
          导出
        </ElButton>
        <ElButton type="primary" size="small" @click="addEnv">
          <Plus :size="14" style="margin-right: 4px" />
          添加环境变量
        </ElButton>
      </ElSpace>
    </div>

    <!-- envFrom 批量导入配置 -->
    <ElCollapse v-model="activeCollapse" style="margin-bottom: 16px">
      <ElCollapseItem name="envFrom">
        <template #title>
          <div style="display: flex; align-items: center; gap: 8px">
            <Package :size="16" />
            <span style="font-weight: 600">批量环境变量来源 (envFrom)</span>
            <ElBadge
              v-if="envFromSources.length > 0"
              :value="envFromSources.length"
              type="primary"
            />
          </div>
        </template>

        <div class="envfrom-section">
          <ElButton size="small" type="primary" @click="addEnvFromSource">
            <Plus :size="14" style="margin-right: 4px" />
            添加来源
          </ElButton>

          <div v-if="envFromSources.length > 0" class="envfrom-list">
            <div v-for="(source, index) in envFromSources" :key="index" class="envfrom-item">
              <ElForm :model="source" label-width="100px" size="small">
                <ElRow :gutter="12">
                  <ElCol :span="6">
                    <ElFormItem label="来源类型">
                      <ElSelect
                        v-model="source.type"
                        @change="() => handleEnvFromTypeChange(index)"
                      >
                        <ElOption label="ConfigMap" value="configMap">
                          <span>ConfigMap</span>
                        </ElOption>
                        <ElOption label="Secret" value="secret">
                          <span>Secret</span>
                        </ElOption>
                      </ElSelect>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="6">
                    <ElFormItem :label="source.type === 'configMap' ? 'ConfigMap' : 'Secret'">
                      <ElSelect
                        v-model="source.name"
                        :loading="loadingResources"
                        filterable
                        @focus="handleResourceSelectFocus"
                        @change="updateEnvFrom"
                      >
                        <ElOption
                          v-for="item in source.type === 'configMap' ? configMapList : secretList"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        >
                          <div class="option-with-tag">
                            <span class="option-name">{{ item.label }}</span>
                            <ElTag v-if="item.dataCount || item.type" size="small" type="info">
                              {{ item.dataCount || item.type }}
                            </ElTag>
                          </div>
                        </ElOption>
                      </ElSelect>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="6">
                    <ElFormItem label="前缀(可选)">
                      <ElInput
                        v-model="source.prefix"
                        placeholder="例如: APP_"
                        @input="updateEnvFrom"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="4">
                    <ElFormItem label="可选">
                      <ElSwitch v-model="source.optional" @change="updateEnvFrom" />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="2">
                    <ElButton type="danger" text @click="removeEnvFromSource(index)">
                      <Trash2 :size="16" />
                    </ElButton>
                  </ElCol>
                </ElRow>
              </ElForm>
            </div>
          </div>

          <ElAlert type="info" :closable="false" style="margin-top: 12px">
            <template #title>
              <span style="font-size: 12px">
                💡 envFrom 会批量导入 ConfigMap/Secret
                中的所有键值对作为环境变量，可添加前缀避免冲突
              </span>
            </template>
          </ElAlert>
        </div>
      </ElCollapseItem>
    </ElCollapse>

    <!-- env 配置 -->
    <div v-if="localEnvVars.length === 0" class="empty-state">
      <ElEmpty description="暂无环境变量配置" :image-size="80">
        <ElButton type="primary" plain @click="addEnv">
          <Plus :size="14" style="margin-right: 4px" />
          添加第一个环境变量
        </ElButton>
      </ElEmpty>
    </div>

    <div v-else class="env-table">
      <ElTable :data="localEnvVars" border stripe size="small">
        <ElTableColumn label="类型" width="140" align="center">
          <template #header>
            <span class="table-header">
              类型
              <ElTooltip content="选择环境变量的值来源类型" placement="top">
                <Info :size="11" class="header-hint" />
              </ElTooltip>
            </span>
          </template>
          <template #default="{ row, $index }">
            <ElSelect v-model="row.valueType" size="small" @change="() => handleTypeChange($index)">
              <ElOption label="键值对" value="direct" />
              <ElOption label="ConfigMap" value="configMap" />
              <ElOption label="Secret" value="secret" />
              <ElOption label="字段引用" value="field" />
            </ElSelect>
          </template>
        </ElTableColumn>

        <ElTableColumn label="变量名称" width="180">
          <template #header>
            <span class="table-header">
              变量名称
              <ElTooltip content="环境变量的名称，通常使用大写和下划线" placement="top">
                <Info :size="11" class="header-hint" />
              </ElTooltip>
            </span>
          </template>
          <template #default="{ row }">
            <ElInput
              v-model="row.name"
              size="small"
              placeholder="例如: APP_ENV"
              @input="debouncedUpdate"
            >
              <template #prefix>
                <Variable :size="12" />
              </template>
            </ElInput>
          </template>
        </ElTableColumn>

        <ElTableColumn label="值 / 配置" min-width="350">
          <template #header>
            <span class="table-header">
              值 / 配置
              <ElTooltip content="根据类型配置对应的值或引用" placement="top">
                <Info :size="11" class="header-hint" />
              </ElTooltip>
            </span>
          </template>
          <template #default="{ row }">
            <!-- 键值对 -->
            <ElInput
              v-if="row.valueType === 'direct'"
              v-model="row.value"
              size="small"
              placeholder="输入变量值"
              @input="debouncedUpdate"
            />

            <!-- ConfigMap -->
            <div v-else-if="row.valueType === 'configMap'" class="ref-config">
              <ElSelect
                v-model="row.valueFrom.configMapKeyRef.name"
                size="small"
                placeholder="选择 ConfigMap"
                filterable
                style="width: 48%"
                :loading="loadingResources"
                @focus="handleResourceSelectFocus"
                @change="(val: string) => handleConfigMapSelect(row, val)"
              >
                <ElOption
                  v-for="cm in configMapList"
                  :key="cm.value"
                  :label="cm.label"
                  :value="cm.value"
                >
                  <div class="option-with-tag">
                    <span class="option-name">{{ cm.label }}</span>
                    <ElTag v-if="cm.dataCount" size="small" type="info">
                      {{ cm.dataCount }} 项
                    </ElTag>
                  </div>
                </ElOption>
              </ElSelect>
              <span class="separator">/</span>
              <ElSelect
                v-model="row.valueFrom.configMapKeyRef.key"
                size="small"
                placeholder="选择 Key"
                filterable
                allow-create
                style="width: 48%"
                :loading="isLoadingConfigMapKeys(row.valueFrom.configMapKeyRef.name)"
                :disabled="!row.valueFrom.configMapKeyRef.name"
                @focus="() => handleConfigMapKeySelectFocus(row.valueFrom.configMapKeyRef.name)"
                @change="debouncedUpdate"
              >
                <ElOption
                  v-for="key in getConfigMapKeys(row.valueFrom.configMapKeyRef.name)"
                  :key="key"
                  :label="key"
                  :value="key"
                />
              </ElSelect>
            </div>

            <!-- Secret -->
            <div v-else-if="row.valueType === 'secret'" class="ref-config">
              <ElSelect
                v-model="row.valueFrom.secretKeyRef.name"
                size="small"
                placeholder="选择 Secret"
                filterable
                style="width: 48%"
                :loading="loadingResources"
                @focus="handleResourceSelectFocus"
                @change="(val: string) => handleSecretSelect(row, val)"
              >
                <ElOption
                  v-for="secret in secretList"
                  :key="secret.value"
                  :label="secret.label"
                  :value="secret.value"
                >
                  <div class="option-with-tag">
                    <span class="option-name">{{ secret.label }}</span>
                    <ElTag v-if="secret.type" size="small" type="warning">
                      {{ secret.type }}
                    </ElTag>
                  </div>
                </ElOption>
              </ElSelect>
              <span class="separator">/</span>
              <ElSelect
                v-model="row.valueFrom.secretKeyRef.key"
                size="small"
                placeholder="选择 Key"
                filterable
                allow-create
                style="width: 48%"
                :loading="isLoadingSecretKeys(row.valueFrom.secretKeyRef.name)"
                :disabled="!row.valueFrom.secretKeyRef.name"
                @focus="() => handleSecretKeySelectFocus(row.valueFrom.secretKeyRef.name)"
                @change="debouncedUpdate"
              >
                <ElOption
                  v-for="key in getSecretKeys(row.valueFrom.secretKeyRef.name)"
                  :key="key"
                  :label="key"
                  :value="key"
                />
              </ElSelect>
            </div>

            <!-- 字段引用 -->
            <ElSelect
              v-else-if="row.valueType === 'field'"
              v-model="row.valueFrom.fieldRef.fieldPath"
              size="small"
              placeholder="选择字段"
              @change="() => handleFieldRefChange(row)"
            >
              <ElOptionGroup label="Pod 信息">
                <ElOption label="Pod 名称 (POD_NAME)" value="metadata.name" />
                <ElOption label="Pod 命名空间 (POD_NAMESPACE)" value="metadata.namespace" />
                <ElOption label="Pod UID (POD_UID)" value="metadata.uid" />
              </ElOptionGroup>
              <ElOptionGroup label="Pod 状态">
                <ElOption label="节点名称 (NODE_NAME)" value="spec.nodeName" />
                <ElOption label="服务账号 (SERVICE_ACCOUNT)" value="spec.serviceAccountName" />
                <ElOption label="主机 IP (HOST_IP)" value="status.hostIP" />
                <ElOption label="Pod IP (POD_IP)" value="status.podIP" />
              </ElOptionGroup>
            </ElSelect>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="80" align="center" fixed="right">
          <template #default="{ $index }">
            <ElButton link type="danger" size="small" @click="removeEnv($index)">
              <Trash2 :size="14" />
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElAlert type="info" :closable="false" show-icon style="margin-top: 12px">
        <template #title>
          <span style="font-size: 12px">
            💡 <strong>提示：</strong>字段引用会自动填充变量名，ConfigMap 和 Secret 的 Key
            支持下拉选择或手动输入
          </span>
        </template>
      </ElAlert>
    </div>

    <!-- 批量导入对话框 -->
    <ElDialog v-model="showBatchImportDialog" title="批量导入环境变量" width="600px">
      <ElAlert type="info" :closable="false" style="margin-bottom: 12px">
        <template #title>每行一个环境变量，格式: KEY=VALUE</template>
      </ElAlert>
      <ElInput
        v-model="importText"
        type="textarea"
        :rows="10"
        placeholder="例如:&#10;APP_ENV=production&#10;LOG_LEVEL=info&#10;PORT=8080"
      />
      <template #footer>
        <ElButton @click="showBatchImportDialog = false">取消</ElButton>
        <ElButton type="primary" @click="doImport">导入</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount, inject, type Ref } from 'vue'
  import { useContainersStore } from '@/store/workload'
  import { Plus, Info, Variable, Trash2, FileText, Download, Package } from 'lucide-vue-next'
  import { ElMessage } from 'element-plus'
  import {
    getConfigMapListApi,
    getConfigMapDataApi,
    getSecretListApi,
    getSecretDataApi,
    type ConfigMapListItem,
    type ConfigMapDataItem,
    type SecretListItem,
    type SecretDataItem
  } from '@/api'

  const containersStore = useContainersStore()

  // ✅ 使用 inject 获取 Ref 类型参数（与主页面的 provide 匹配）
  const workspaceIdRef = inject<Ref<number>>('workspaceId')
  const namespaceRef = inject<Ref<string>>('namespace')

  // ✅ 使用 computed 安全地获取值
  const workspaceId = computed(() => workspaceIdRef?.value ?? 0)
  const namespace = computed(() => namespaceRef?.value ?? 'default')

  // envFrom 配置
  const activeCollapse = ref<string[]>([])
  const envFromSources = ref<any[]>([])

  // 字段路径到变量名的映射
  const fieldPathToName: Record<string, string> = {
    'metadata.name': 'POD_NAME',
    'metadata.namespace': 'POD_NAMESPACE',
    'metadata.uid': 'POD_UID',
    'spec.nodeName': 'NODE_NAME',
    'spec.serviceAccountName': 'SERVICE_ACCOUNT',
    'status.hostIP': 'HOST_IP',
    'status.podIP': 'POD_IP'
  }

  // 本地环境变量数据
  const localEnvVars = ref<any[]>([])

  // ConfigMap 和 Secret 列表
  const configMapList = ref<Array<{ label: string; value: string; dataCount?: number }>>([])
  const secretList = ref<
    Array<{ label: string; value: string; type?: string; dataCount?: number }>
  >([])

  const loadingResources = ref(false)
  const resourcesLoaded = ref(false)

  // 缓存和加载状态
  const configMapDataCache = ref<Record<string, string[]>>({})
  const secretDataCache = ref<Record<string, string[]>>({})
  const loadingConfigMapKeysMap = ref<Record<string, boolean>>({})
  const loadingSecretKeysMap = ref<Record<string, boolean>>({})

  let resourcesAbortController: AbortController | null = null

  const showBatchImportDialog = ref(false)
  const importText = ref('')

  // 防抖更新
  let updateTimer: NodeJS.Timeout | null = null
  const debouncedUpdate = () => {
    if (updateTimer) clearTimeout(updateTimer)
    updateTimer = setTimeout(() => {
      updateEnvVars()
    }, 300)
  }

  // 检查指定 ConfigMap 的 keys 是否正在加载
  const isLoadingConfigMapKeys = (name: string): boolean => {
    return !!loadingConfigMapKeysMap.value[name]
  }

  // 检查指定 Secret 的 keys 是否正在加载
  const isLoadingSecretKeys = (name: string): boolean => {
    return !!loadingSecretKeysMap.value[name]
  }

  // 获取 ConfigMap Keys
  const getConfigMapKeys = (name: string): string[] => {
    if (!name || !configMapDataCache.value[name]) return []
    return configMapDataCache.value[name]
  }

  // 获取 Secret Keys
  const getSecretKeys = (name: string): string[] => {
    if (!name || !secretDataCache.value[name]) return []
    return secretDataCache.value[name]
  }

  // ✅ 加载资源列表（ConfigMap 和 Secret）- 真正的懒加载
  const loadResourceLists = async () => {
    if (!workspaceId.value || workspaceId.value === 0) {
      console.warn('[EnvConfigTab] workspaceId 无效，跳过加载资源列表')
      return
    }

    // ✅ 已加载则跳过
    if (resourcesLoaded.value) {
      return
    }

    // ✅ 正在加载则跳过（防止重复请求）
    if (loadingResources.value) {
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
        getConfigMapListApi({ workloadId: workspaceId.value }),
        getSecretListApi({ workloadId: workspaceId.value })
      ])

      if (signal.aborted) return

      configMapList.value = (configMapResponse.items || []).map((item: ConfigMapListItem) => ({
        label: item.name,
        value: item.name,
        dataCount: item.dataCount
      }))

      secretList.value = (secretResponse.items || []).map((item: SecretListItem) => ({
        label: item.name,
        value: item.name,
        type: item.type,
        dataCount: item.dataCount
      }))

      resourcesLoaded.value = true
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return
      }
      console.error('[EnvConfigTab] 加载资源列表失败:', error)
      ElMessage.error('加载 ConfigMap/Secret 列表失败')
    } finally {
      loadingResources.value = false
      resourcesAbortController = null
    }
  }

  // ✅ 加载指定 ConfigMap 的数据 - 懒加载
  const loadConfigMapData = async (name: string): Promise<void> => {
    if (!name || !workspaceId.value || workspaceId.value === 0) return

    // ✅ 已缓存则跳过
    if (configMapDataCache.value[name]) return

    // ✅ 正在加载则跳过
    if (loadingConfigMapKeysMap.value[name]) return

    loadingConfigMapKeysMap.value[name] = true

    try {
      const response = await getConfigMapDataApi({
        workloadId: workspaceId.value,
        name: name
      })
      configMapDataCache.value[name] = (response.data || []).map(
        (item: ConfigMapDataItem) => item.key
      )
    } catch (error) {
      console.error(`[EnvConfigTab] 加载 ConfigMap "${name}" 数据失败:`, error)
      ElMessage.error(`加载 ConfigMap "${name}" 数据失败`)
    } finally {
      loadingConfigMapKeysMap.value[name] = false
    }
  }

  // ✅ 加载指定 Secret 的数据 - 懒加载
  const loadSecretData = async (name: string): Promise<void> => {
    if (!name || !workspaceId.value || workspaceId.value === 0) return

    // ✅ 已缓存则跳过
    if (secretDataCache.value[name]) return

    // ✅ 正在加载则跳过
    if (loadingSecretKeysMap.value[name]) return

    loadingSecretKeysMap.value[name] = true

    try {
      const response = await getSecretDataApi({
        workloadId: workspaceId.value,
        name: name
      })
      secretDataCache.value[name] = (response.data || []).map((item: SecretDataItem) => item.key)
    } catch (error) {
      console.error(`[EnvConfigTab] 加载 Secret "${name}" 数据失败:`, error)
      ElMessage.error(`加载 Secret "${name}" 数据失败`)
    } finally {
      loadingSecretKeysMap.value[name] = false
    }
  }

  // 当资源选择框获得焦点时加载资源列表（懒加载触发点）
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

  // ✅ 处理 ConfigMap 选择
  const handleConfigMapSelect = async (row: any, name: string) => {
    if (row.valueFrom.configMapKeyRef) {
      row.valueFrom.configMapKeyRef.key = ''
    }

    if (!name || !workspaceId.value || workspaceId.value === 0) return

    await loadConfigMapData(name)
    debouncedUpdate()
  }

  // ✅ 处理 Secret 选择
  const handleSecretSelect = async (row: any, name: string) => {
    if (row.valueFrom.secretKeyRef) {
      row.valueFrom.secretKeyRef.key = ''
    }

    if (!name || !workspaceId.value || workspaceId.value === 0) return

    await loadSecretData(name)
    debouncedUpdate()
  }

  // ✅ 加载环境变量 - 只处理本地数据，不发起网络请求
  const loadEnvVars = () => {
    const container = containersStore.selectedContainer
    const envs = container?.env || []

    localEnvVars.value = envs.map((env) => {
      let valueType = 'direct'
      if (env.valueFrom) {
        if (env.valueFrom.configMapKeyRef) valueType = 'configMap'
        else if (env.valueFrom.secretKeyRef) valueType = 'secret'
        else if (env.valueFrom.fieldRef) valueType = 'field'
      }

      return {
        ...env,
        valueType,
        valueFrom: env.valueFrom || {
          configMapKeyRef: { name: '', key: '', optional: false },
          secretKeyRef: { name: '', key: '', optional: false },
          fieldRef: { fieldPath: '', apiVersion: 'v1' }
        }
      }
    })

    const envFrom = container?.envFrom || []
    envFromSources.value = envFrom.map((source) => {
      if (source.configMapRef) {
        return {
          type: 'configMap',
          name: source.configMapRef.name || '',
          prefix: source.prefix || '',
          optional: source.configMapRef.optional || false
        }
      } else if (source.secretRef) {
        return {
          type: 'secret',
          name: source.secretRef.name || '',
          prefix: source.prefix || '',
          optional: source.secretRef.optional || false
        }
      }
      return { type: 'configMap', name: '', prefix: '', optional: false }
    })

    // ✅ 移除：不再自动预加载资源
    // await preloadUsedResources()
  }

  // envFrom 相关方法
  function addEnvFromSource() {
    envFromSources.value.push({
      type: 'configMap',
      name: '',
      prefix: '',
      optional: false
    })
  }

  function removeEnvFromSource(index: number) {
    envFromSources.value.splice(index, 1)
    updateEnvFrom()
  }

  function handleEnvFromTypeChange(index: number) {
    envFromSources.value[index].name = ''
    updateEnvFrom()
  }

  function updateEnvFrom() {
    const container = containersStore.selectedContainer
    if (!container) return

    const envFrom = envFromSources.value.map((source) => {
      const result: any = {}
      if (source.prefix) result.prefix = source.prefix

      if (source.type === 'configMap') {
        result.configMapRef = {
          name: source.name,
          optional: source.optional || undefined
        }
      } else {
        result.secretRef = {
          name: source.name,
          optional: source.optional || undefined
        }
      }
      return result
    })

    containersStore.updateContainer(container.id, {
      envFrom: envFrom.length > 0 ? envFrom : undefined
    })
  }

  function addEnv() {
    localEnvVars.value.push({
      name: '',
      value: '',
      valueType: 'direct',
      valueFrom: {
        configMapKeyRef: { name: '', key: '', optional: false },
        secretKeyRef: { name: '', key: '', optional: false },
        fieldRef: { fieldPath: '', apiVersion: 'v1' }
      }
    })
  }

  function removeEnv(index: number) {
    localEnvVars.value.splice(index, 1)
    updateEnvVars()
  }

  function handleTypeChange(index: number) {
    const env = localEnvVars.value[index]
    env.value = ''

    env.valueFrom = {
      configMapKeyRef: { name: '', key: '', optional: false },
      secretKeyRef: { name: '', key: '', optional: false },
      fieldRef: { fieldPath: '', apiVersion: 'v1' }
    }

    if (env.valueType === 'field') {
      env.valueFrom.fieldRef.fieldPath = 'metadata.name'
      handleFieldRefChange(env)
    }

    updateEnvVars()
  }

  function handleFieldRefChange(row: any) {
    const fieldPath = row.valueFrom.fieldRef.fieldPath
    if (fieldPath && fieldPathToName[fieldPath]) {
      if (!row.name || Object.values(fieldPathToName).includes(row.name)) {
        row.name = fieldPathToName[fieldPath]
      }
    }
    debouncedUpdate()
  }

  function updateEnvVars() {
    const container = containersStore.selectedContainer
    if (!container) return

    const cleanedEnvs = localEnvVars.value.map((env) => {
      const { valueType, valueFrom, ...rest } = env

      if (valueType === 'direct') {
        return rest
      } else {
        let cleanedValueFrom: any = {}
        if (valueType === 'configMap' && valueFrom.configMapKeyRef?.name) {
          cleanedValueFrom.configMapKeyRef = {
            name: valueFrom.configMapKeyRef.name,
            key: valueFrom.configMapKeyRef.key,
            optional: valueFrom.configMapKeyRef.optional || undefined
          }
        } else if (valueType === 'secret' && valueFrom.secretKeyRef?.name) {
          cleanedValueFrom.secretKeyRef = {
            name: valueFrom.secretKeyRef.name,
            key: valueFrom.secretKeyRef.key,
            optional: valueFrom.secretKeyRef.optional || undefined
          }
        } else if (valueType === 'field' && valueFrom.fieldRef?.fieldPath) {
          cleanedValueFrom.fieldRef = {
            fieldPath: valueFrom.fieldRef.fieldPath,
            apiVersion: 'v1'
          }
        }

        return {
          ...rest,
          value: undefined,
          valueFrom: Object.keys(cleanedValueFrom).length > 0 ? cleanedValueFrom : undefined
        }
      }
    })

    containersStore.updateContainer(container.id, { env: cleanedEnvs })
  }

  function doImport() {
    const lines = importText.value.split('\n').filter((line) => line.trim() !== '')
    const newEnvs: any[] = []

    lines.forEach((line) => {
      const index = line.indexOf('=')
      if (index > 0) {
        const name = line.substring(0, index).trim()
        const value = line.substring(index + 1).trim()
        newEnvs.push({
          name,
          value,
          valueType: 'direct',
          valueFrom: {
            configMapKeyRef: { name: '', key: '', optional: false },
            secretKeyRef: { name: '', key: '', optional: false },
            fieldRef: { fieldPath: '', apiVersion: 'v1' }
          }
        })
      }
    })

    if (newEnvs.length === 0) {
      ElMessage.warning('没有找到有效的环境变量')
      return
    }

    localEnvVars.value.push(...newEnvs)
    updateEnvVars()
    ElMessage.success(`成功导入 ${newEnvs.length} 个环境变量`)
    showBatchImportDialog.value = false
    importText.value = ''
  }

  function exportToText() {
    const lines = localEnvVars.value
      .filter((env) => env.name && env.valueType === 'direct' && env.value !== undefined)
      .map((env) => `${env.name}=${env.value}`)

    const text = lines.join('\n')

    if (!text) {
      ElMessage.warning('没有可导出的键值对环境变量')
      return
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        ElMessage.success('已复制到剪贴板')
      })
      .catch(() => {
        ElMessage.error('复制失败')
      })
  }

  watch(
    () => containersStore.selectedContainerId,
    () => {
      loadEnvVars() // ✅ 同步函数，不发起网络请求
    },
    { immediate: true }
  )

  watch(
    () => workspaceId.value,
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        // ✅ 参数变化时重置状态
        resourcesLoaded.value = false
        configMapList.value = []
        secretList.value = []
        configMapDataCache.value = {}
        secretDataCache.value = {}
        loadingConfigMapKeysMap.value = {}
        loadingSecretKeysMap.value = {}
      }
    }
  )

  onMounted(() => {
    loadEnvVars() // ✅ 只加载本地数据，不发起网络请求
  })

  onBeforeUnmount(() => {
    if (resourcesAbortController) {
      resourcesAbortController.abort()
    }
    if (updateTimer) {
      clearTimeout(updateTimer)
    }
  })
</script>

<style lang="scss" scoped>
  .env-config-tab {
    padding: 8px 0;

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

    .envfrom-section {
      padding: 12px;

      .envfrom-list {
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .envfrom-item {
          padding: 12px;
          background: #fafbfc;
          border-radius: 6px;
          border: 1px solid #e4e7ed;
        }
      }
    }

    .empty-state {
      padding: 60px;
      text-align: center;
      background: #f5f7fa;
      border-radius: 8px;
    }

    .env-table {
      .table-header {
        display: inline-flex;
        align-items: center;
        gap: 4px;

        .header-hint {
          color: #909399;
          cursor: help;
          transition: color 0.2s;

          &:hover {
            color: #409eff;
          }
        }
      }

      .ref-config {
        display: flex;
        align-items: center;
        gap: 8px;

        .separator {
          color: #909399;
          font-weight: bold;
          font-size: 14px;
        }
      }
    }

    // ✅ 简化下拉选项样式
    :deep(.el-select-dropdown__item) {
      height: 36px;
      line-height: 36px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      font-size: 14px;

      // 带标签的选项布局
      .option-with-tag {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 12px;

        .option-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .el-tag {
          flex-shrink: 0;
          height: 20px;
          line-height: 18px;
          padding: 0 8px;
          font-size: 11px;
        }
      }

      // 悬停效果
      &:hover {
        background-color: #f5f7fa;
      }

      // 选中状态
      &.selected {
        color: #409eff;
        font-weight: 500;
      }
    }

    // ✅ 优化选项组样式
    :deep(.el-select-group__title) {
      padding: 8px 12px 4px;
      color: #909399;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
    }

    // ✅ 优化下拉面板整体样式
    :deep(.el-select-dropdown) {
      .el-scrollbar__view {
        .el-select-dropdown__list {
          padding: 6px 0;
        }
      }
    }

    // ✅ 优化表格内选择器的对齐
    :deep(.el-table) {
      .el-table__cell {
        // 确保单元格内容垂直居中
        .cell {
          display: flex;
          align-items: center;
          min-height: 32px;
        }
      }

      // 优化表格内的选择框
      .el-select {
        width: 100%;

        .el-input__wrapper {
          display: flex;
          align-items: center;
        }

        .el-input__inner {
          height: 28px;
          line-height: 28px;
        }

        .el-input__suffix {
          display: flex;
          align-items: center;
        }
      }

      // 优化表格内的输入框
      .el-input {
        .el-input__wrapper {
          display: flex;
          align-items: center;
        }

        .el-input__prefix {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .el-input__inner {
          height: 28px;
          line-height: 28px;
        }
      }
    }
  }
</style>
