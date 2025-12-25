<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { ElMessage, ElTooltip, ElIcon } from 'element-plus'
  import { InfoFilled } from '@element-plus/icons-vue'
  import { Edit3, Save, X, Cloud, Globe, Server, Layers, GitBranch, Network } from 'lucide-vue-next'
  import {
    updateClusterApi,
    type ClusterDetail,
    type UpdateClusterRequest
  } from '@/api/manager/cluster'
  import { environmentOptions, clusterTypeOptions, providerOptions } from '../../constants'

  interface Props {
    clusterDetail?: ClusterDetail
    clusterId: number
    isActive?: boolean
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ refresh: [] }>()

  const isEditing = ref(false)
  const saveLoading = ref(false)
  const editLoading = ref(false)
  const cancelLoading = ref(false)
  const formRef = ref()

  const editForm = reactive<UpdateClusterRequest>({
    id: props.clusterId,
    name: '',
    description: '',
    clusterType: 'standard',
    environment: 'development',
    region: '',
    zone: '',
    datacenter: '',
    provider: 'self-hosted',
    isManaged: 0,
    nodeLb: '',
    masterLb: '',
    ingressDomain: ''
  })

  // IP/域名验证函数
  const validateAddressList = (rule: any, value: string, callback: any) => {
    if (!value || value.trim() === '') {
      callback()
      return
    }

    // IPv4 正则
    const ipv4Regex =
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

    // IPv6 正则（支持完整格式和压缩格式）
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|::)$/

    // 域名正则
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

    // 验证单个地址
    const isValidAddress = (addr: string): boolean => {
      return ipv4Regex.test(addr) || ipv6Regex.test(addr) || domainRegex.test(addr)
    }

    // 分割并验证
    const addresses = value
      .split(',')
      .map((addr) => addr.trim())
      .filter((addr) => addr)

    if (addresses.length === 0) {
      callback()
      return
    }

    const invalidAddresses = addresses.filter((addr) => !isValidAddress(addr))

    if (invalidAddresses.length > 0) {
      callback(
        new Error(
          `无效的地址格式: ${invalidAddresses.slice(0, 3).join(', ')}${invalidAddresses.length > 3 ? ' 等' : ''}`
        )
      )
    } else {
      callback()
    }
  }

  // 域名验证函数（支持通配符域名）
  const validateDomainList = (rule: any, value: string, callback: any) => {
    if (!value || value.trim() === '') {
      callback()
      return
    }

    // 普通域名正则：example.com, sub.example.com
    const normalDomainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9]{2,}$/

    // 通配符域名正则（以 . 开头）：.example.com, .ngw.ikubeops.local
    const wildcardDomainRegex =
      /^\.([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]{2,}$/

    const domains = value
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d)

    if (domains.length === 0) {
      callback()
      return
    }

    // 验证每个域名（支持普通域名和通配符域名）
    const invalidDomains = domains.filter(
      (d) => !normalDomainRegex.test(d) && !wildcardDomainRegex.test(d)
    )

    if (invalidDomains.length > 0) {
      callback(
        new Error(
          `无效的域名格式: ${invalidDomains.slice(0, 3).join(', ')}${invalidDomains.length > 3 ? ' 等' : ''}`
        )
      )
    } else {
      callback()
    }
  }

  // 表单验证规则
  const formRules = {
    name: [
      { required: true, message: '请输入集群名称', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    clusterType: [{ required: true, message: '请选择集群类型', trigger: 'change' }],
    environment: [{ required: true, message: '请选择环境类型', trigger: 'change' }],
    provider: [{ required: true, message: '请选择云服务商', trigger: 'change' }],
    nodeLb: [{ validator: validateAddressList, trigger: 'blur' }],
    masterLb: [{ validator: validateAddressList, trigger: 'blur' }],
    ingressDomain: [{ validator: validateDomainList, trigger: 'blur' }]
  }

  watch(
    () => props.clusterDetail,
    (newVal) => {
      if (newVal) {
        Object.assign(editForm, {
          id: newVal.id,
          name: newVal.name,
          description: newVal.description,
          clusterType: newVal.clusterType,
          environment: newVal.environment,
          region: newVal.region,
          zone: newVal.zone,
          datacenter: newVal.datacenter,
          provider: newVal.provider,
          isManaged: newVal.isManaged,
          nodeLb: newVal.nodeLb,
          masterLb: newVal.masterLb,
          ingressDomain: newVal.ingressDomain
        })
      }
    },
    { immediate: true, deep: true }
  )

  const startEdit = async () => {
    editLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      isEditing.value = true
    } finally {
      editLoading.value = false
    }
  }

  const cancelEdit = async () => {
    cancelLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      isEditing.value = false
      // 重置验证状态
      if (formRef.value) {
        formRef.value.clearValidate()
      }
      // 恢复原有数据
      if (props.clusterDetail) {
        Object.assign(editForm, {
          name: props.clusterDetail.name,
          description: props.clusterDetail.description,
          clusterType: props.clusterDetail.clusterType,
          environment: props.clusterDetail.environment,
          region: props.clusterDetail.region,
          zone: props.clusterDetail.zone,
          datacenter: props.clusterDetail.datacenter,
          provider: props.clusterDetail.provider,
          isManaged: props.clusterDetail.isManaged,
          nodeLb: props.clusterDetail.nodeLb,
          masterLb: props.clusterDetail.masterLb,
          ingressDomain: props.clusterDetail.ingressDomain
        })
      }
    } finally {
      cancelLoading.value = false
    }
  }

  const saveEdit = async () => {
    // 验证表单
    if (!formRef.value) {
      return
    }

    try {
      await formRef.value.validate()
    } catch (error) {
      return
    }

    saveLoading.value = true
    try {
      await updateClusterApi(editForm)
      ElMessage.success('更新成功')
      isEditing.value = false
      emit('refresh')
    } catch (error: any) {
    } finally {
      saveLoading.value = false
    }
  }

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  const getEnvironmentConfig = (value: string) => {
    return environmentOptions.find((env) => env.value === value)
  }

  const getClusterTypeConfig = (value: string) => {
    return clusterTypeOptions.find((type) => type.value === value)
  }

  const getProviderConfig = (value: string) => {
    return providerOptions.find((provider) => provider.value === value)
  }
</script>

<template>
  <div class="basic-info-panel" v-if="clusterDetail">
    <div class="panel-header">
      <div class="header-title">
        <Server />
        <span>集群基本信息</span>
      </div>
      <div class="header-actions">
        <el-button v-if="!isEditing" type="primary" @click="startEdit" :loading="editLoading">
          <Edit3 v-if="!editLoading" />
          {{ editLoading ? '加载中...' : '编辑' }}
        </el-button>
        <template v-else>
          <el-button @click="cancelEdit" :loading="cancelLoading">
            <X v-if="!cancelLoading" />
            {{ cancelLoading ? '取消中...' : '取消' }}
          </el-button>
          <el-button type="primary" @click="saveEdit" :loading="saveLoading">
            <Save v-if="!saveLoading" />
            {{ saveLoading ? '保存中...' : '保存' }}
          </el-button>
        </template>
      </div>
    </div>

    <el-form ref="formRef" :model="editForm" :rules="formRules" label-width="140px">
      <div class="info-content">
        <!-- 基础信息 -->
        <div class="info-group">
          <h3 class="group-title">
            <span
              class="title-icon"
              style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            >
              <Server />
            </span>
            基础信息
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <label>集群名称</label>
              <el-form-item prop="name" v-if="isEditing">
                <el-input v-model="editForm.name" placeholder="请输入集群名称" />
              </el-form-item>
              <span v-else class="value">{{ clusterDetail.name }}</span>
            </div>
            <div class="info-item">
              <label>集群UUID</label>
              <span class="value uuid readonly">
                {{ clusterDetail.uuid }}
                <el-tooltip content="UUID 是集群的唯一标识符，不可修改" placement="top">
                  <el-icon class="info-icon">
                    <InfoFilled />
                  </el-icon>
                </el-tooltip>
              </span>
            </div>
            <div class="info-item full-width">
              <label>描述信息</label>
              <el-form-item v-if="isEditing">
                <el-input
                  v-model="editForm.description"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入集群描述"
                />
              </el-form-item>
              <span v-else class="value">{{ clusterDetail.description || '暂无描述' }}</span>
            </div>
            <div class="info-item">
              <label>集群类型</label>
              <el-form-item prop="clusterType" v-if="isEditing">
                <el-select v-model="editForm.clusterType" style="width: 100%">
                  <el-option
                    v-for="opt in clusterTypeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
              <span v-else class="value">
                {{
                  getClusterTypeConfig(clusterDetail.clusterType)?.label ||
                  clusterDetail.clusterType
                }}
              </span>
            </div>
            <div class="info-item">
              <label>环境类型</label>
              <el-form-item prop="environment" v-if="isEditing">
                <el-select v-model="editForm.environment" style="width: 100%">
                  <el-option
                    v-for="opt in environmentOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
              <el-tag v-else :type="getEnvironmentConfig(clusterDetail.environment)?.type">
                {{
                  getEnvironmentConfig(clusterDetail.environment)?.label ||
                  clusterDetail.environment
                }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 部署信息 -->
        <div class="info-group">
          <h3 class="group-title">
            <span
              class="title-icon"
              style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            >
              <Cloud />
            </span>
            部署信息
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <label>云服务商</label>
              <el-form-item prop="provider" v-if="isEditing">
                <el-select v-model="editForm.provider" style="width: 100%">
                  <el-option
                    v-for="opt in providerOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
              <span v-else class="value">
                {{ getProviderConfig(clusterDetail.provider)?.label || clusterDetail.provider }}
              </span>
            </div>
            <div class="info-item">
              <label>托管状态</label>
              <el-switch
                v-if="isEditing"
                v-model="editForm.isManaged"
                :active-value="1"
                :inactive-value="0"
              />
              <el-tag v-else :type="clusterDetail.isManaged === 1 ? 'success' : 'info'">
                {{ clusterDetail.isManaged === 1 ? '托管集群' : '自管集群' }}
              </el-tag>
            </div>
            <div class="info-item">
              <label>地域</label>
              <el-form-item v-if="isEditing">
                <el-input v-model="editForm.region" placeholder="如：cn-beijing" />
              </el-form-item>
              <span v-else class="value">{{ clusterDetail.region || '-' }}</span>
            </div>
            <div class="info-item">
              <label>可用区</label>
              <el-form-item v-if="isEditing">
                <el-input v-model="editForm.zone" placeholder="如：zone-a" />
              </el-form-item>
              <span v-else class="value">{{ clusterDetail.zone || '-' }}</span>
            </div>
            <div class="info-item">
              <label>数据中心</label>
              <el-form-item v-if="isEditing">
                <el-input v-model="editForm.datacenter" placeholder="数据中心名称" />
              </el-form-item>
              <span v-else class="value">{{ clusterDetail.datacenter || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 负载配置 -->
        <div class="info-group">
          <h3 class="group-title">
            <span
              class="title-icon"
              style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            >
              <Network />
            </span>
            负载配置
          </h3>
          <div class="info-grid">
            <div class="info-item full-width">
              <label>Ingress 域名</label>
              <div v-if="isEditing">
                <el-form-item prop="ingressDomain">
                  <el-input
                    v-model="editForm.ingressDomain"
                    placeholder="如：.ikubeops.local, example.com（多个用逗号分隔）"
                  >
                    <template #prefix>
                      <Globe />
                    </template>
                  </el-input>
                </el-form-item>
                <span class="field-hint">
                  支持普通域名（example.com）和通配符域名（.ikubeops.local），多个用英文逗号分隔
                </span>
              </div>
              <span v-else class="value domain">{{ clusterDetail.ingressDomain || '-' }}</span>
            </div>
            <div class="info-item">
              <label>Node 负载均衡</label>
              <div v-if="isEditing">
                <el-form-item prop="nodeLb">
                  <el-input v-model="editForm.nodeLb" placeholder="IP 或域名，多个用逗号分隔" />
                </el-form-item>
                <span class="field-hint">支持 IPv4、IPv6 或域名，多个地址用逗号分隔</span>
              </div>
              <span v-else class="value ip">{{ clusterDetail.nodeLb || '-' }}</span>
            </div>
            <div class="info-item">
              <label>Master 负载均衡</label>
              <div v-if="isEditing">
                <el-form-item prop="masterLb">
                  <el-input v-model="editForm.masterLb" placeholder="IP 或域名，多个用逗号分隔" />
                </el-form-item>
                <span class="field-hint">支持 IPv4、IPv6 或域名，多个地址用逗号分隔</span>
              </div>
              <span v-else class="value ip">{{ clusterDetail.masterLb || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 系统信息（只读） -->
        <div class="info-group">
          <h3 class="group-title">
            <span
              class="title-icon"
              style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            >
              <GitBranch />
            </span>
            系统信息
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Kubernetes 版本</label>
              <span class="value version">{{ clusterDetail.version || '-' }}</span>
            </div>
            <div class="info-item">
              <label>平台</label>
              <span class="value">{{ clusterDetail.platform || '-' }}</span>
            </div>
            <div class="info-item">
              <label>Git Commit</label>
              <span class="value commit">{{ clusterDetail.gitCommit || '-' }}</span>
            </div>
            <div class="info-item">
              <label>最后同步时间</label>
              <span class="value">{{ formatDate(clusterDetail.lastSyncAt) }}</span>
            </div>
            <div class="info-item">
              <label>集群创建时间</label>
              <span class="value">{{ formatDate(clusterDetail.clusterCreatedAt) }}</span>
            </div>
            <div class="info-item">
              <label>创建人</label>
              <span class="value">{{ clusterDetail.createdBy || '-' }}</span>
            </div>
            <div class="info-item">
              <label>更新人</label>
              <span class="value">{{ clusterDetail.updatedBy || '-' }}</span>
            </div>
            <div class="info-item">
              <label>更新时间</label>
              <span class="value">{{ formatDate(clusterDetail.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
  .basic-info-panel {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f1f5f9;

      .header-title {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;

        svg {
          width: 24px;
          height: 24px;
          color: #667eea;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;

        .el-button {
          display: flex;
          align-items: center;
          gap: 6px;

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          svg {
            width: 14px;
            height: 14px;
          }
        }
      }
    }

    .info-content {
      .info-group {
        background: #f8fafc;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;

        &:last-child {
          margin-bottom: 0;
        }

        .group-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;

          .title-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;

            svg {
              width: 16px;
              height: 16px;
              color: white;
            }
          }
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 8px;

            &.full-width {
              grid-column: span 2;
            }

            label {
              font-size: 13px;
              color: #64748b;
              font-weight: 500;
            }

            // 表单验证错误样式增强
            :deep(.el-form-item) {
              margin-bottom: 0;

              &.is-error {
                .el-input__wrapper {
                  border-color: #f56c6c;
                  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.1);
                }

                .el-textarea__inner {
                  border-color: #f56c6c;
                  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.1);
                }
              }

              .el-form-item__error {
                font-size: 12px;
                line-height: 1.4;
                padding-top: 4px;
              }
            }

            .field-hint {
              display: block;
              font-size: 12px;
              color: #94a3b8;
              line-height: 1.4;
              margin-top: 6px;
            }

            .value {
              font-size: 14px;
              color: #1e293b;
              font-weight: 500;

              &.uuid {
                font-family: monospace;
                font-size: 12px;
                background: white;
                padding: 6px 10px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                word-break: break-all;
                display: flex;
                align-items: center;
                gap: 8px;

                &.readonly {
                  background: #f8fafc;
                  border-color: #e2e8f0;
                  color: #475569;
                  position: relative;

                  .info-icon {
                    width: 14px;
                    height: 14px;
                    color: #94a3b8;
                    cursor: help;
                    flex-shrink: 0;
                  }
                }
              }

              &.ip {
                font-family: monospace;
                color: #667eea;
              }

              &.domain {
                font-family: monospace;
                color: #10b981;
              }

              &.version {
                color: #10b981;
                font-weight: 600;
              }

              &.commit {
                font-family: monospace;
                font-size: 12px;
              }
            }

            :deep(.el-input) {
              .el-input__wrapper {
                border-radius: 8px;
              }
            }

            :deep(.el-select) {
              .el-select__wrapper {
                border-radius: 8px;
              }
            }

            :deep(.el-textarea) {
              .el-textarea__inner {
                border-radius: 8px;
              }
            }
          }
        }
      }
    }
  }
</style>
