import { getApplicationDetailApi, getVersionDetailApi, getResourceYamlApi } from '@/api'
import { resetAllWorkloadStores, useMetadataStore } from '@/store/workload'

/**
 * 模式类型
 */
export type WorkloadMode = 'createApp' | 'createAppVersion' | 'editAppVersion' | 'copyAppVersion'

/**
 * 路由参数接口
 */
export interface RouteParams {
  resourceClusterId: number
  clusterUuid: string
  workspaceId: number
  appProjectId: number
  namespace: string
  mode: WorkloadMode
  applicationId?: number // 创建版本、编辑版本、复制版本需要
  applicationVersionId?: number // 编辑版本、复制版本需要
}

/**
 * 验证并解析路由参数
 */
export function validateRouteParams(query: any): RouteParams | null {
  const clusterId = Number(query.resourceClusterId) || 0
  const uuid = String(query.clusterUuid || '')
  const spaceId = Number(query.workspaceId) || 0
  const namespace = String(query.namespace || '')
  const projectId = Number(query.appProjectId) || 0
  const mode = String(query.mode || 'createApp') as WorkloadMode
  const appId = Number(query.applicationId) || 0
  const versionId = Number(query.applicationVersionId) || 0

  // 基础参数验证
  if (
    clusterId === 0 ||
    !uuid ||
    uuid === 'undefined' ||
    spaceId === 0 ||
    projectId === 0 ||
    !namespace ||
    namespace === 'undefined'
  ) {
    console.error('基础参数验证失败')
    return null
  }

  // 根据模式验证特定参数
  if (mode === 'createAppVersion' && appId === 0) {
    console.error('创建版本模式缺少 applicationId')
    return null
  }

  if (
    (mode === 'editAppVersion' || mode === 'copyAppVersion') &&
    (appId === 0 || versionId === 0)
  ) {
    console.error('编辑/复制模式缺少必要参数')
    return null
  }

  return {
    resourceClusterId: clusterId,
    clusterUuid: uuid,
    workspaceId: spaceId,
    namespace: namespace,
    appProjectId: projectId,
    mode: mode,
    applicationId: appId || undefined,
    applicationVersionId: versionId || undefined
  }
}

/**
 * 根据模式初始化工作负载数据
 */
export async function initWorkloadByMode(params: RouteParams): Promise<boolean> {
  const { mode, namespace, applicationId, applicationVersionId } = params

  // 第一步：重置所有 stores
  resetAllWorkloadStores()

  // 第二步：设置命名空间
  const metadataStore = useMetadataStore()
  metadataStore.setNamespace(namespace)

  try {
    // 创建应用模式 - 仅设置命名空间，其他保持空
    if (mode === 'createApp') {
      return true
    }

    // 创建版本模式 - 获取应用信息，填充元数据
    if (mode === 'createAppVersion' && applicationId) {
      const appDetail = await getApplicationDetailApi(applicationId)

      // 更新元数据，resourceName 会自动生成
      metadataStore.updateMetadata({
        nameCn: appDetail.nameCn,
        nameEn: appDetail.nameEn,
        version: '', // 新版本号留空，resourceName 也会自动更新
        desc: appDetail.description || ''
      })

      return true
    }

    // 编辑版本模式 - 只加载基础元数据，完整配置交给创建页面加载
    if (mode === 'editAppVersion' && applicationId && applicationVersionId) {

      const [appDetail, versionDetail] = await Promise.all([
        getApplicationDetailApi(applicationId),
        getVersionDetailApi(applicationVersionId)
      ])

      // 只设置基础元数据
      metadataStore.updateMetadata({
        nameCn: appDetail.nameCn,
        nameEn: appDetail.nameEn,
        version: versionDetail.version,
        desc: appDetail.description || ''
      })

      // 强制确保 namespace 正确
      metadataStore.setNamespace(namespace)

      // 返回 true，但标记需要加载完整配置
      return true
    }

    // 复制版本模式 - 只加载基础元数据，完整配置交给创建页面加载
    if (mode === 'copyAppVersion' && applicationId && applicationVersionId) {

      const [appDetail, versionDetail] = await Promise.all([
        getApplicationDetailApi(applicationId),
        getVersionDetailApi(applicationVersionId)
      ])

      // 更新元数据基本信息，版本号添加 -copy
      metadataStore.updateMetadata({
        nameCn: appDetail.nameCn,
        nameEn: appDetail.nameEn,
        version: `${versionDetail.version}-copy`,
        desc: appDetail.description || ''
      })

      // 强制确保 namespace 正确
      metadataStore.setNamespace(namespace)

      return true
    }

    console.warn('未知的模式或缺少必要参数')
    return false
  } catch (error) {
    console.error('初始化工作负载数据失败:', error)
    return false
  }
}

/**
 * ✅ 新增：加载完整的工作负载配置（在各个创建页面中调用）
 * 这个函数返回 YAML 字符串，由各个页面根据资源类型自行解析
 */
export async function loadWorkloadYamlForEdit(
  applicationVersionId: number
): Promise<string | null> {
  try {
    const yamlStr = await getResourceYamlApi(applicationVersionId)
    return yamlStr
  } catch (error) {
    console.error('❌ 加载 YAML 配置失败:', error)
    return null
  }
}

/**
 * 检查字段是否可编辑
 * ✅ 修复：copy 模式下 resourceName 和 version 可编辑
 */
export function isFieldEditable(
  mode: WorkloadMode,
  field: 'nameCn' | 'nameEn' | 'version' | 'resourceName' | 'desc'
): boolean {
  switch (mode) {
    case 'createApp':
      // 创建模式：所有字段可编辑
      return true

    case 'createAppVersion':
      // 创建版本模式：名称不可编辑，版本、resourceName 和描述可编辑
      if (field === 'nameCn' || field === 'nameEn') {
        return false
      }
      return field === 'version' || field === 'resourceName' || field === 'desc'

    case 'editAppVersion':
      // 编辑模式：只有描述可编辑，其他都不可编辑（避免资源冲突）
      return field === 'desc'

    case 'copyAppVersion':
      // ✅ 复制模式：名称不可编辑，版本、resourceName 和描述可编辑（允许用户修改资源名称）
      if (field === 'nameCn' || field === 'nameEn') {
        return false
      }
      return field === 'version' || field === 'resourceName' || field === 'desc'

    default:
      return false
  }
}

/**
 * 获取模式显示文本
 */
export function getModeText(mode: WorkloadMode): string {
  const modeMap: Record<WorkloadMode, string> = {
    createApp: '创建应用',
    createAppVersion: '创建版本',
    editAppVersion: '编辑版本',
    copyAppVersion: '复制版本'
  }
  return modeMap[mode] || '未知模式'
}

/**
 * 验证并修正 namespace
 * 确保在 YAML 编辑后 namespace 保持不变
 */
export function ensureNamespace(resource: any, expectedNamespace: string): any {
  if (resource.metadata) {
    resource.metadata.namespace = expectedNamespace
  }
  return resource
}

/**
 * 验证并修正必需标签
 * 确保在 YAML 编辑后必需标签保持存在
 */
export function ensureRequiredLabelsInResource(
  resource: any,
  nameEn: string,
  version: string
): any {
  // 确保顶层 metadata.labels 包含必需标签
  if (resource.metadata) {
    if (!resource.metadata.labels) {
      resource.metadata.labels = {}
    }
    resource.metadata.labels.app = nameEn
    resource.metadata.labels.version = version
  }
  return resource
}
