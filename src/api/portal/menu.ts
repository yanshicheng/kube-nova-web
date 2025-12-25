import request from '@/utils/http'

// 定义基础路径
const MENU_BASE_PATH = '/portal/v1/menu'

// ========== 类型定义 ==========

/** 菜单信息 */
export interface MenuSysMenu {
  id: number // 自增主键
  parentId: number // 父菜单ID，顶级菜单为0
  menuType: number // 菜单类型（1目录 2菜单 3按钮）
  name: string // 菜单名称（路由name）
  path: string // 路由地址
  component: string // 组件路径
  redirect: string // 重定向地址
  label: string // 权限标识
  title: string // 菜单标题（meta.title）
  icon: string // 菜单图标
  sort: number // 排序
  link: string // 外部链接/内嵌地址
  isEnable: number // 是否启用（0否 1是）
  isMenu: number // 是否为菜单（0否 1是）
  keepAlive: number // 页面缓存（0否 1是）
  isHide: number // 是否隐藏（0否 1是）
  isIframe: number // 是否内嵌（0否 1是）
  isHideTab: number // 是否在标签页中隐藏（0否 1是）
  showBadge: number // 是否显示徽章（0否 1是）
  showTextBadge: string // 文本徽章内容
  isFirstLevel: number // 是否为一级菜单（0否 1是）
  fixedTab: number // 是否固定标签页（0否 1是）
  isFullPage: number // 是否为全屏页面（0否 1是）
  activePath: string // 激活菜单路径
  roles: string // 角色权限（JSON格式存储）
  authName: string // 按钮权限名称
  authLabel: string // 按钮权限标识
  authIcon: string // 按钮图标
  authSort: number // 按钮权限排序
  status: number // 状态（0停用 1启用）
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 菜单树节点 */
export interface MenuSysMenuTree extends MenuSysMenu {
  children: MenuSysMenuTree[] // 子菜单列表
}

/** 添加菜单请求 */
export interface MenuAddRequest {
  parentId?: number // 父菜单ID
  menuType: number // 菜单类型，必填
  name: string // 菜单名称，必填
  path?: string // 路由地址
  component?: string // 组件路径
  redirect?: string // 重定向地址
  label?: string // 权限标识
  title: string // 菜单标题，必填
  icon?: string // 菜单图标
  sort?: number // 排序
  link?: string // 外部链接
  isEnable?: number // 是否启用
  isMenu?: number // 是否为菜单
  keepAlive?: number // 页面缓存
  isHide?: number // 是否隐藏
  isIframe?: number // 是否内嵌
  isHideTab?: number // 标签页隐藏
  showBadge?: number // 显示徽章
  showTextBadge?: string // 徽章内容
  isFirstLevel?: number // 一级菜单
  fixedTab?: number // 固定标签
  isFullPage?: number // 全屏页面
  activePath?: string // 激活路径
  roles?: string // 角色权限
  authName?: string // 按钮名称
  authLabel?: string // 按钮标识
  authIcon?: string // 按钮图标
  authSort?: number // 按钮排序
  status?: number // 状态
}

/** 更新菜单请求 */
export interface MenuUpdateRequest {
  id: number // 菜单ID，必填
  parentId?: number // 父菜单ID
  menuType?: number // 菜单类型
  name?: string // 菜单名称
  path?: string // 路由地址
  component?: string // 组件路径
  redirect?: string // 重定向地址
  label?: string // 权限标识
  title?: string // 菜单标题
  icon?: string // 菜单图标
  sort?: number // 排序
  link?: string // 外部链接
  isEnable?: number // 是否启用
  isMenu?: number // 是否为菜单
  keepAlive?: number // 页面缓存
  isHide?: number // 是否隐藏
  isIframe?: number // 是否内嵌
  isHideTab?: number // 标签页隐藏
  showBadge?: number // 显示徽章
  showTextBadge?: string // 徽章内容
  isFirstLevel?: number // 一级菜单
  fixedTab?: number // 固定标签
  isFullPage?: number // 全屏页面
  activePath?: string // 激活路径
  roles?: string // 角色权限
  authName?: string // 按钮名称
  authLabel?: string // 按钮标识
  authIcon?: string // 按钮图标
  authSort?: number // 按钮排序
  status?: number // 状态
}

/** 搜索菜单请求（树状结构） */
export interface MenuSearchRequest {
  parentId?: number // 父菜单ID
  menuType?: number // 菜单类型
  name?: string // 菜单名称
  title?: string // 菜单标题
  label?: string // 权限标识
  status?: number // 状态
  isMenu?: number // 是否为菜单
}

/** 搜索菜单响应（树状结构） */
export interface MenuSearchResponse {
  items: MenuSysMenuTree[] // 菜单树
  total: number // 总数
}

/** 获取菜单列表请求（扁平结构） */
export interface MenuListRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderStr?: string // 排序字段
  isAsc?: boolean // 是否升序
  parentId?: number // 父菜单ID
  menuType?: number // 菜单类型
  name?: string // 菜单名称
  title?: string // 菜单标题
  label?: string // 权限标识
  status?: number // 状态
  isMenu?: number // 是否为菜单
}

/** 获取菜单列表响应（扁平结构） */
export interface MenuListResponse {
  items: MenuSysMenu[] // 菜单列表
  total: number // 总数
}

/** 获取角色菜单树请求 */
export interface MenuRolesTreeRequest {
  roleCodes: string[] // 角色编码列表
}

/** 获取角色菜单树响应 */

/** 获取所有菜单树请求 */
export interface MenuAllTreeRequest {
  status?: number // 状态过滤
}

// ========== API 接口 ==========

/**
 * 添加菜单
 * @param data 添加菜单请求参数
 * @returns 操作结果
 */
export async function addMenuApi(data: MenuAddRequest) {
  return request.post<string>({
    url: `${MENU_BASE_PATH}`,
    data
  })
}

/**
 * 更新菜单
 * @param data 更新菜单请求参数
 * @returns 操作结果
 */
export async function updateMenuApi(data: MenuUpdateRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${MENU_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 删除菜单
 * @param id 菜单ID
 * @returns 操作结果
 */
export async function deleteMenuApi(id: number) {
  return request.del<string>({
    url: `${MENU_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取菜单
 * @param id 菜单ID
 * @returns 菜单信息
 */
export async function getMenuByIdApi(id: number) {
  return request.get<MenuSysMenu>({
    url: `${MENU_BASE_PATH}/${id}`
  })
}

/**
 * 搜索菜单（树状结构）
 * @param params 搜索参数
 * @returns 菜单树
 */
export async function searchMenuTreeApi(params?: MenuSearchRequest) {
  return request.get<MenuSearchResponse>({
    url: `${MENU_BASE_PATH}/tree`,
    params
  })
}

/**
 * 获取菜单列表（扁平结构，支持分页）
 * @param params 搜索参数
 * @returns 菜单列表
 */
export async function getMenuListApi(params?: MenuListRequest) {
  return request.get<MenuListResponse>({
    url: `${MENU_BASE_PATH}/list`,
    params
  })
}

/**
 * 获取角色菜单树
 * @param data 角色编码列表
 * @returns 菜单树
 */
export async function getRolesMenuTreeApi(data: MenuRolesTreeRequest) {
  return request.post<MenuSysMenuTree[]>({
    url: `${MENU_BASE_PATH}/roles/tree`,
    data
  })
}

/**
 * 获取所有菜单树
 * @param params 请求参数
 * @returns 菜单树
 */
export async function getAllMenuTreeApi(params?: MenuAllTreeRequest) {
  return request.get<MenuSysMenuTree[]>({
    url: `${MENU_BASE_PATH}/all/tree`,
    params
  })
}

// 在原有菜单 API 文件中添加以下类型定义和接口

// ========== 新增类型定义 ==========

/** 精简菜单树节点 */
export interface MenuSysMenuSimpleTreeNode {
  id: number // 主键ID
  title: string // 菜单标题
  children: MenuSysMenuSimpleTreeNode[] // 子菜单
}

/** 获取精简菜单树请求 */
export interface MenuSimpleTreeRequest {
  status?: number // 状态过滤（0停用 1启用，-1或不传表示全部）
}

// ========== 新增API接口 ==========

/**
 * 获取精简菜单树（仅包含id和title）
 * @param params 请求参数
 * @returns 精简菜单树
 */
export async function getSysMenuSimpleTreeApi(params?: MenuSimpleTreeRequest) {
  return request.get<MenuSysMenuSimpleTreeNode[]>({
    url: `${MENU_BASE_PATH}/simple/tree`,
    params
  })
}
