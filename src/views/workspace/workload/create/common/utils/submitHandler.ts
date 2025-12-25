// src/views/workspace/workload/create/common/utils/submitHandler.ts
import { ElLoading, ElMessage } from 'element-plus'
import yaml from 'js-yaml'
import {
  addApplicationResourceApi,
  addVersionApi,
  updateVersionApi,
  ResourceType,
  type AddApplicationResourceRequest,
  type AddOnecProjectVersionRequest,
  type UpdateOnecProjectVersionRequest
} from '@/api/workload'

/**
 * 提交参数接口
 */
export interface SubmitParams {
  mode: 'createApp' | 'createAppVersion' | 'editAppVersion' | 'copyAppVersion'
  resourceType: ResourceType
  resourceClusterId: number
  clusterUuid: string
  workspaceId: number
  namespace: string
  nameCn: string
  resourceName: string
  nameEn: string
  version: string
  description?: string
  resourceYamlStr: string
  applicationId?: number
  applicationVersionId?: number
}

/**
 * 提交结果接口
 */
export interface SubmitResult {
  success: boolean
  message?: string
  error?: any
}

/**
 * 创建应用
 */
async function handleCreateApp(params: SubmitParams): Promise<SubmitResult> {
  try {
    const submitData: AddApplicationResourceRequest = {
      resourceClusterId: params.resourceClusterId,
      clusterUuid: params.clusterUuid,
      workspaceId: params.workspaceId,
      nameCn: params.nameCn,
      resourceName: params.resourceName,
      nameEn: params.nameEn,
      version: params.version,
      resourceType: params.resourceType,
      resourceYamlStr: params.resourceYamlStr,
      description: params.description || ''
    }

    await addApplicationResourceApi(submitData)

    return {
      success: true,
      message: '应用创建成功'
    }
  } catch (error: any) {
    console.error('创建应用失败:', error)
    return {
      success: false,
      message: error.message || '创建失败，请重试',
      error
    }
  }
}

/**
 * 创建版本
 */
async function handleCreateVersion(params: SubmitParams): Promise<SubmitResult> {
  if (!params.applicationId) {
    return {
      success: false,
      message: '缺少应用ID'
    }
  }

  try {
    const submitData: AddOnecProjectVersionRequest = {
      applicationId: params.applicationId,
      version: params.version,
      resourceName: params.resourceName,
      resourceYamlStr: params.resourceYamlStr
    }

    await addVersionApi(submitData)

    return {
      success: true,
      message: '版本创建成功'
    }
  } catch (error: any) {
    console.error('创建版本失败:', error)
    return {
      success: false,
      message: error.message || '创建失败，请重试',
      error
    }
  }
}

/**
 * 更新版本
 */
async function handleUpdateVersion(params: SubmitParams): Promise<SubmitResult> {
  if (!params.applicationVersionId) {
    return {
      success: false,
      message: '缺少版本ID'
    }
  }

  try {
    const submitData: UpdateOnecProjectVersionRequest = {
      id: params.applicationVersionId,
      resourceYamlStr: params.resourceYamlStr
    }

    await updateVersionApi(submitData)

    return {
      success: true,
      message: '版本更新成功'
    }
  } catch (error: any) {
    console.error('更新版本失败:', error)
    return {
      success: false,
      message: error.message || '更新失败，请重试',
      error
    }
  }
}

/**
 * 复制版本（实际上是创建新版本）
 */
async function handleCopyVersion(params: SubmitParams): Promise<SubmitResult> {
  if (!params.applicationId) {
    return {
      success: false,
      message: '缺少应用ID'
    }
  }

  try {
    const submitData: AddOnecProjectVersionRequest = {
      applicationId: params.applicationId,
      version: params.version,
      resourceName: params.resourceName,
      resourceYamlStr: params.resourceYamlStr
    }

    await addVersionApi(submitData)

    return {
      success: true,
      message: '版本复制成功'
    }
  } catch (error: any) {
    console.error('复制版本失败:', error)
    return {
      success: false,
      message: error.message || '复制失败，请重试',
      error
    }
  }
}

/**
 * 统一提交处理函数
 * @param params 提交参数
 * @returns 提交结果
 */
export async function submitWorkload(params: SubmitParams): Promise<SubmitResult> {
  // 创建 Loading
  const loadingTextMap = {
    createApp: '正在创建应用...',
    createAppVersion: '正在创建版本...',
    editAppVersion: '正在更新版本...',
    copyAppVersion: '正在复制版本...'
  }

  const loading = ElLoading.service({
    lock: true,
    text: loadingTextMap[params.mode],
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    let result: SubmitResult

    // 根据模式调用不同的处理函数
    switch (params.mode) {
      case 'createApp':
        result = await handleCreateApp(params)
        break
      case 'createAppVersion':
        result = await handleCreateVersion(params)
        break
      case 'editAppVersion':
        result = await handleUpdateVersion(params)
        break
      case 'copyAppVersion':
        result = await handleCopyVersion(params)
        break
      default:
        result = {
          success: false,
          message: '未知的操作模式'
        }
    }

    // 显示结果消息
    if (result.success) {
      ElMessage.success(result.message!)
    } else {
    }

    return result
  } finally {
    loading.close()
  }
}

/**
 * 从 YAML 字符串提交（YAML 模式）
 * @param params 基础参数
 * @param yamlContent YAML 字符串
 * @param metadata 元数据（用于获取元数据）
 * @returns 提交结果
 */
export async function submitWorkloadFromYaml(
  params: Omit<
    SubmitParams,
    'resourceYamlStr' | 'nameCn' | 'resourceName' | 'nameEn' | 'version' | 'description'
  >,
  yamlContent: string,
  metadata: {
    nameCn: string
    resourceName: string
    nameEn: string
    version: string
    desc?: string
  }
): Promise<SubmitResult> {
  try {
    // 解析 YAML
    const parsedResource = yaml.load(yamlContent) as any

    // 确保命名空间正确
    if (parsedResource.metadata) {
      parsedResource.metadata.namespace = params.namespace
    }

    // 重新生成 YAML（确保格式正确）
    const correctedYaml = yaml.dump(parsedResource, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    })

    // 从 YAML 中提取元数据（如果存在）
    const yamlNameCn =
      parsedResource.metadata?.annotations?.['ikubeops.com/project-name'] || metadata.nameCn
    const yamlResourceName = parsedResource.metadata?.name || metadata.resourceName
    const yamlNameEn = parsedResource.metadata?.labels?.['app'] || metadata.nameEn
    const yamlVersion = parsedResource.metadata?.labels?.['version'] || metadata.version
    const yamlDesc = parsedResource.metadata?.annotations?.['description'] || metadata.desc

    // 构建完整提交参数
    const submitParams: SubmitParams = {
      ...params,
      resourceYamlStr: correctedYaml,
      nameCn: yamlNameCn,
      resourceName: yamlResourceName,
      nameEn: yamlNameEn,
      version: yamlVersion,
      description: yamlDesc
    }

    return await submitWorkload(submitParams)
  } catch (error: any) {
    console.error('YAML 解析失败:', error)
    return {
      success: false,
      message: error.message || 'YAML 格式错误',
      error
    }
  }
}

/**
 * 获取资源类型的中文名称
 */
export function getResourceTypeName(resourceType: ResourceType): string {
  const nameMap: Record<ResourceType, string> = {
    [ResourceType.POD]: 'Pod',
    [ResourceType.DEPLOYMENT]: 'Deployment',
    [ResourceType.STATEFULSET]: 'StatefulSet',
    [ResourceType.JOB]: 'Job',
    [ResourceType.CRONJOB]: 'CronJob',
    [ResourceType.DAEMONSET]: 'DaemonSet'
  }
  return nameMap[resourceType] || resourceType
}
