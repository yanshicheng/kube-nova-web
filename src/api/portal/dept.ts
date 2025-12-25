import request from '@/utils/http'

// 定义基础路径
const DEPT_BASE_PATH = '/portal/v1/dept'

// ========== 类型定义 ==========

/** 部门信息 */
export interface DeptSysDept {
  id: number // 自增主键
  name: string // 部门名称
  parentId: number // 父部门ID, 0为顶级部门
  remark: string // 备注说明
  leader: string // 部门负责人
  phone: string // 联系电话
  email: string // 邮箱
  status: number // 状态: 0-禁用, 1-启用
  sort: number // 排序
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 部门树节点 */
export interface DeptSysDeptTree {
  id: number // 自增主键
  name: string // 部门名称
  parentId: number // 父部门ID, 0为顶级部门
  remark: string // 备注说明
  leader: string // 部门负责人
  phone: string // 联系电话
  email: string // 邮箱
  status: number // 状态: 0-禁用, 1-启用
  sort: number // 排序
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
  children: DeptSysDeptTree[] // 子部门列表
}

/** 添加部门请求 */
export interface DeptAddRequest {
  name: string // 部门名称，必填
  parentId?: number // 父部门ID
  remark?: string // 备注说明
  leader?: string // 部门负责人
  phone?: string // 联系电话
  email?: string // 邮箱
  status?: number // 状态
  sort?: number // 排序
}

/** 更新部门请求 */
export interface DeptUpdateRequest {
  id: number // 部门ID，必填
  name: string // 部门名称，必填
  parentId?: number // 父部门ID
  remark?: string // 备注说明
  leader?: string // 部门负责人
  phone?: string // 联系电话
  email?: string // 邮箱
  status?: number // 状态
  sort?: number // 排序
}

// ========== API 接口 ==========

/**
 * 添加部门
 * @param data 添加部门请求参数
 * @returns 操作结果
 */
export async function addDeptApi(data: DeptAddRequest) {
  return request.post<string>({
    url: `${DEPT_BASE_PATH}`,
    data
  })
}

/**
 * 更新部门
 * @param data 更新部门请求参数
 * @returns 操作结果
 */
export async function updateDeptApi(data: DeptUpdateRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${DEPT_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 删除部门
 * @param id 部门ID
 * @returns 操作结果
 */
export async function deleteDeptApi(id: number) {
  return request.del<string>({
    url: `${DEPT_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取部门
 * @param id 部门ID
 * @returns 部门信息
 */
export async function getDeptByIdApi(id: number) {
  return request.get<DeptSysDept>({
    url: `${DEPT_BASE_PATH}/${id}`
  })
}

/**
 * 获取部门树
 * @returns 部门树数据
 */
export async function getDeptTreeApi() {
  return request.get<DeptSysDeptTree[]>({
    url: `${DEPT_BASE_PATH}/tree`
  })
}

/**
 * 根据父ID查询下级部门
 * @param parentId 父部门ID
 * @returns 部门列表
 */
export async function getDeptChildrenApi(parentId: number) {
  return request.get<DeptSysDept[]>({
    url: `${DEPT_BASE_PATH}/children`,
    params: { parentId }
  })
}

/**
 * 获取所有父级部门
 * @returns 部门列表
 */
export async function getDeptParentsApi() {
  return request.get<DeptSysDept[]>({
    url: `${DEPT_BASE_PATH}/parents`
  })
}
