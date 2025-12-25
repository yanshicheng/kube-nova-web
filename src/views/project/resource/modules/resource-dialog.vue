<template>
  <ElDialog
    :title="dialogTitle"
    :model-value="visible"
    @update:model-value="handleCancel"
    width="1000px"
    align-center
    class="resource-dialog"
    @closed="handleClosed"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="dialog-body">
      <div class="cluster-selection">
        <div class="section-header">
          <Server :size="20" class="section-icon" />
          <span class="section-title">选择集群</span>
          <ElTag v-if="isEdit" type="info" size="small">编辑模式不可更改</ElTag>
        </div>

        <ElAutocomplete
          v-model="clusterSearchQuery"
          :fetch-suggestions="queryClusterSearch"
          placeholder="请输入集群名称或UUID搜索"
          :disabled="submitLoading || isEdit"
          @select="handleClusterSelect"
          @clear="handleClusterClear"
          :clearable="!isEdit"
          size="large"
          class="cluster-autocomplete"
          :class="{ 'is-edit-mode': isEdit }"
          value-key="uuid"
          :debounce="300"
        >
          <template #default="{ item }">
            <div class="cluster-suggestion-item">
              <div class="suggestion-main">
                <Server :size="16" class="suggestion-icon" />
                <span class="suggestion-name">{{ item.name || `集群 ${item.id}` }}</span>
                <ElTag
                  v-if="isClusterAllocated(item.uuid || String(item.id))"
                  type="danger"
                  size="small"
                  effect="plain"
                >
                  已分配
                </ElTag>
              </div>
              <span class="suggestion-uuid">UUID: {{ item.uuid || item.id }}</span>
            </div>
          </template>
          <template #append v-if="!isEdit">
            <ElButton
              link
              type="primary"
              @click="showClusterDialog = true"
              :disabled="submitLoading"
            >
              <Search :size="16" style="margin-right: 4px" />
              浏览全部
            </ElButton>
          </template>
        </ElAutocomplete>

        <div class="selected-cluster" v-if="selectedCluster">
          <div class="selected-info">
            <Server :size="18" class="selected-icon" />
            <div class="selected-details">
              <span class="selected-name">{{ selectedCluster.name }}</span>
              <span class="selected-uuid">{{ selectedCluster.uuid }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="resource-overview" v-if="selectedCluster && selectedClusterResource">
        <div class="overview-header">
          <Activity :size="20" class="section-icon" />
          <span class="section-title">集群资源概览</span>
          <ElTag type="success" effect="plain">实时数据</ElTag>
        </div>

        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon cpu-icon">
              <Cpu :size="24" />
            </div>
            <div class="card-content">
              <div class="card-label">CPU 资源</div>
              <div v-if="getClusterResourceValue('cpu', 'capacity') > 0">
                <div class="card-value">
                  <span
                    :class="getAvailableResourceValue('cpu') < 0 ? 'insufficient' : 'available'"
                  >
                    {{ formatNumber(getAvailableResourceValue('cpu')) }}
                  </span>
                  <span class="separator">/</span>
                  <span class="total"
                    >{{ formatNumber(getClusterResourceValue('cpu', 'capacity')) }} 核</span
                  >
                </div>
                <div class="card-progress">
                  <ElProgress
                    :percentage="Math.min(999, getResourceUsagePercent('cpu'))"
                    :stroke-width="6"
                    :color="getProgressColor(getResourceUsagePercent('cpu'))"
                    :format="(percentage) => `${getResourceUsagePercent('cpu')}%`"
                  />
                </div>
                <div class="card-hint">
                  已分配 {{ formatNumber(getClusterResourceValue('cpu', 'allocated')) }} 核 ({{
                    getResourceUsagePercent('cpu')
                  }}%)
                </div>
                <ElAlert
                  v-if="getAvailableResourceValue('cpu') < 0"
                  type="error"
                  :closable="false"
                  show-icon
                >
                  CPU资源不足，请联系管理员！
                </ElAlert>
              </div>
              <div v-else class="no-resource">
                <ElEmpty description="集群无 CPU 资源" :image-size="40" />
              </div>
            </div>
          </div>

          <div class="overview-card">
            <div class="card-icon memory-icon">
              <HardDrive :size="24" />
            </div>
            <div class="card-content">
              <div class="card-label">内存资源</div>
              <div v-if="getClusterResourceValue('mem', 'capacity') > 0">
                <div class="card-value">
                  <span
                    :class="getAvailableResourceValue('mem') < 0 ? 'insufficient' : 'available'"
                  >
                    {{ formatNumber(getAvailableResourceValue('mem')) }}
                  </span>
                  <span class="separator">/</span>
                  <span class="total"
                    >{{ formatNumber(getClusterResourceValue('mem', 'capacity')) }} GiB</span
                  >
                </div>
                <div class="card-progress">
                  <ElProgress
                    :percentage="Math.min(999, getResourceUsagePercent('mem'))"
                    :stroke-width="6"
                    :color="getProgressColor(getResourceUsagePercent('mem'))"
                    :format="(percentage) => `${getResourceUsagePercent('mem')}%`"
                  />
                </div>
                <div class="card-hint">
                  已分配 {{ formatNumber(getClusterResourceValue('mem', 'allocated')) }} GiB ({{
                    getResourceUsagePercent('mem')
                  }}%)
                </div>
                <ElAlert
                  v-if="getAvailableResourceValue('mem') < 0"
                  type="error"
                  :closable="false"
                  show-icon
                >
                  内存资源不足，请联系管理员！
                </ElAlert>
              </div>
              <div v-else class="no-resource">
                <ElEmpty description="集群无内存资源" :image-size="40" />
              </div>
            </div>
          </div>

          <div class="overview-card">
            <div class="card-icon storage-icon">
              <Database :size="24" />
            </div>
            <div class="card-content">
              <div class="card-label">存储资源</div>
              <div v-if="getClusterResourceValue('storage', 'capacity') > 0">
                <div class="card-value">
                  <span
                    :class="getAvailableResourceValue('storage') < 0 ? 'insufficient' : 'available'"
                  >
                    {{ formatNumber(getAvailableResourceValue('storage')) }}
                  </span>
                  <span class="separator">/</span>
                  <span class="total"
                    >{{ formatNumber(getClusterResourceValue('storage', 'capacity')) }} GiB</span
                  >
                </div>
                <div class="card-progress">
                  <ElProgress
                    :percentage="Math.min(999, getResourceUsagePercent('storage'))"
                    :stroke-width="6"
                    :color="getProgressColor(getResourceUsagePercent('storage'))"
                    :format="(percentage) => `${getResourceUsagePercent('storage')}%`"
                  />
                </div>
                <div class="card-hint">
                  已分配 {{ formatNumber(getClusterResourceValue('storage', 'allocated')) }} GiB ({{
                    getResourceUsagePercent('storage')
                  }}%)
                </div>
                <ElAlert
                  v-if="getAvailableResourceValue('storage') < 0"
                  type="error"
                  :closable="false"
                  show-icon
                >
                  存储资源不足，请联系管理员！
                </ElAlert>
              </div>
              <div v-else class="no-resource">
                <ElEmpty description="集群无存储资源" :image-size="40" />
              </div>
            </div>
          </div>

          <div class="overview-card">
            <div class="card-icon gpu-icon">
              <Zap :size="24" />
            </div>
            <div class="card-content">
              <div class="card-label">GPU 资源</div>
              <div v-if="getClusterResourceValue('gpu', 'capacity') > 0">
                <div class="card-value">
                  <span
                    :class="getAvailableResourceValue('gpu') < 0 ? 'insufficient' : 'available'"
                  >
                    {{ formatNumber(getAvailableResourceValue('gpu')) }}
                  </span>
                  <span class="separator">/</span>
                  <span class="total"
                    >{{ formatNumber(getClusterResourceValue('gpu', 'capacity')) }} 个</span
                  >
                </div>
                <div class="card-progress">
                  <ElProgress
                    :percentage="Math.min(999, getResourceUsagePercent('gpu'))"
                    :stroke-width="6"
                    :color="getProgressColor(getResourceUsagePercent('gpu'))"
                    :format="(percentage) => `${getResourceUsagePercent('gpu')}%`"
                  />
                </div>
                <div class="card-hint">
                  已分配 {{ formatNumber(getClusterResourceValue('gpu', 'allocated')) }} 个 ({{
                    getResourceUsagePercent('gpu')
                  }}%)
                </div>
                <ElAlert
                  v-if="getAvailableResourceValue('gpu') < 0"
                  type="error"
                  :closable="false"
                  show-icon
                >
                  GPU资源不足，请联系管理员！
                </ElAlert>
              </div>
              <div v-else class="no-resource">
                <ElEmpty description="集群无 GPU 资源" :image-size="40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="overview-loading" v-if="selectedCluster && resourceLoading">
        <ElSkeleton :rows="3" animated />
      </div>

      <ElForm ref="formRef" :model="form" :rules="rules" label-width="0">
        <!-- CPU 配额 -->
        <div
          class="quota-section"
          v-if="!selectedClusterResource || getClusterResourceValue('cpu', 'capacity') > 0"
        >
          <div class="section-header">
            <Cpu :size="20" class="section-icon cpu-icon" />
            <span class="section-title">CPU 配额</span>
            <span
              class="resource-hint"
              v-if="selectedClusterResource && getClusterResourceValue('cpu', 'capacity') > 0"
            >
              可用: {{ formatNumber(getAvailableResourceValue('cpu')) }} 核
            </span>
            <ElTag
              v-if="selectedClusterResource && getAvailableResourceValue('cpu') < 0"
              type="danger"
              size="small"
            >
              资源不足
            </ElTag>
          </div>

          <div class="quota-grid">
            <ElFormItem prop="cpuLimit.value">
              <div class="form-item-wrapper">
                <label class="form-label">限制容量</label>
                <div class="input-with-unit">
                  <ElInputNumber
                    v-model="form.cpuLimit.value"
                    :min="0"
                    :max="9999"
                    :step="getCpuStep()"
                    :precision="getCpuPrecision()"
                    placeholder="0"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('cpu', 'capacity') === 0)
                    "
                    class="quota-input"
                    @blur="handleResourceBlur('cpu')"
                    @change="handleResourceChange('cpu')"
                  />
                  <ElSelect
                    v-model="form.cpuLimit.unit"
                    style="width: 90px"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('cpu', 'capacity') === 0)
                    "
                    @change="handleCpuUnitChange"
                  >
                    <ElOption label="核" value="core" />
                    <ElOption label="毫核" value="m" />
                  </ElSelect>
                </div>
                <ElAlert
                  v-if="resourceWarnings.cpu"
                  type="warning"
                  :closable="false"
                  class="resource-warning"
                >
                  超出可用资源，已自动调整
                </ElAlert>
              </div>
            </ElFormItem>

            <ElFormItem prop="cpuOvercommitRatio">
              <div class="form-item-wrapper">
                <label class="form-label">
                  超分比例
                  <ElTooltip content="允许分配超过物理资源的比例，提高资源利用率" placement="top">
                    <Info :size="14" class="info-icon" />
                  </ElTooltip>
                </label>
                <div class="overcommit-control">
                  <ElSlider
                    v-model="form.cpuOvercommitRatio"
                    :min="1"
                    :max="20"
                    :step="0.1"
                    :show-tooltip="false"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('cpu', 'capacity') === 0)
                    "
                    @change="calculateCapacity('cpu')"
                    class="overcommit-slider"
                  />
                  <ElInputNumber
                    v-model="form.cpuOvercommitRatio"
                    :min="1"
                    :max="20"
                    :step="0.1"
                    :precision="1"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('cpu', 'capacity') === 0)
                    "
                    @change="calculateCapacity('cpu')"
                    class="overcommit-input"
                    controls-position="right"
                  />
                  <span class="overcommit-unit">x</span>
                </div>
                <div class="overcommit-result">
                  <span class="result-label">实际容量：</span>
                  <span class="result-value">{{
                    formatResourceWithUnit(form.cpuCapacity, 'cpu')
                  }}</span>
                </div>
              </div>
            </ElFormItem>
          </div>
        </div>

        <!-- 内存配额 -->
        <div
          class="quota-section"
          v-if="!selectedClusterResource || getClusterResourceValue('mem', 'capacity') > 0"
        >
          <div class="section-header">
            <HardDrive :size="20" class="section-icon memory-icon" />
            <span class="section-title">内存配额</span>
            <span
              class="resource-hint"
              v-if="selectedClusterResource && getClusterResourceValue('mem', 'capacity') > 0"
            >
              可用: {{ formatNumber(getAvailableResourceValue('mem')) }} GiB
            </span>
            <ElTag
              v-if="selectedClusterResource && getAvailableResourceValue('mem') < 0"
              type="danger"
              size="small"
            >
              资源不足
            </ElTag>
          </div>

          <div class="quota-grid">
            <ElFormItem prop="memLimit.value">
              <div class="form-item-wrapper">
                <label class="form-label">限制容量</label>
                <div class="input-with-unit">
                  <ElInputNumber
                    v-model="form.memLimit.value"
                    :min="0"
                    :max="9999999"
                    :step="1"
                    :precision="2"
                    placeholder="0"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('mem', 'capacity') === 0)
                    "
                    class="quota-input"
                    @blur="handleResourceBlur('mem')"
                    @change="handleResourceChange('mem')"
                  />
                  <ElSelect
                    v-model="form.memLimit.unit"
                    style="width: 90px"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('mem', 'capacity') === 0)
                    "
                    @change="handleMemUnitChange"
                  >
                    <ElOption label="Gi" value="Gi" />
                    <ElOption label="Mi" value="Mi" />
                    <ElOption label="Ki" value="Ki" />
                    <ElOption label="Ti" value="Ti" />
                    <ElOption label="Pi" value="Pi" />
                  </ElSelect>
                </div>
                <ElAlert
                  v-if="resourceWarnings.mem"
                  type="warning"
                  :closable="false"
                  class="resource-warning"
                >
                  超出可用资源，已自动调整
                </ElAlert>
              </div>
            </ElFormItem>

            <ElFormItem prop="memOvercommitRatio">
              <div class="form-item-wrapper">
                <label class="form-label">
                  超分比例
                  <ElTooltip content="内存超分需谨慎，过高可能导致OOM" placement="top">
                    <Info :size="14" class="info-icon" />
                  </ElTooltip>
                </label>
                <div class="overcommit-control">
                  <ElSlider
                    v-model="form.memOvercommitRatio"
                    :min="1"
                    :max="20"
                    :step="0.1"
                    :show-tooltip="false"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('mem', 'capacity') === 0)
                    "
                    @change="calculateCapacity('mem')"
                    class="overcommit-slider"
                  />
                  <ElInputNumber
                    v-model="form.memOvercommitRatio"
                    :min="1"
                    :max="20"
                    :step="0.1"
                    :precision="1"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('mem', 'capacity') === 0)
                    "
                    @change="calculateCapacity('mem')"
                    class="overcommit-input"
                    controls-position="right"
                  />
                  <span class="overcommit-unit">x</span>
                </div>
                <div class="overcommit-result">
                  <span class="result-label">实际容量：</span>
                  <span class="result-value">{{
                    formatResourceWithUnit(form.memCapacity, 'mem')
                  }}</span>
                </div>
              </div>
            </ElFormItem>
          </div>
        </div>

        <!-- 存储配额 -->
        <div
          class="quota-section"
          v-if="!selectedClusterResource || getClusterResourceValue('storage', 'capacity') > 0"
        >
          <div class="section-header">
            <Database :size="20" class="section-icon storage-icon" />
            <span class="section-title">存储配额</span>
            <span
              class="resource-hint"
              v-if="selectedClusterResource && getClusterResourceValue('storage', 'capacity') > 0"
            >
              可用: {{ formatNumber(getAvailableResourceValue('storage')) }} GiB
            </span>
            <ElTag
              v-if="selectedClusterResource && getAvailableResourceValue('storage') < 0"
              type="danger"
              size="small"
            >
              资源不足
            </ElTag>
          </div>

          <ElFormItem prop="storageLimit.value">
            <div class="form-item-wrapper">
              <label class="form-label">存储容量限制</label>
              <div class="input-with-unit">
                <ElInputNumber
                  v-model="form.storageLimit.value"
                  :min="0"
                  :max="9999999"
                  :step="1"
                  :precision="2"
                  placeholder="0"
                  :disabled="
                    submitLoading ||
                    (selectedClusterResource &&
                      getClusterResourceValue('storage', 'capacity') === 0)
                  "
                  class="quota-input"
                  @blur="handleResourceBlur('storage')"
                  @change="handleResourceChange('storage')"
                />
                <ElSelect
                  v-model="form.storageLimit.unit"
                  style="width: 90px"
                  :disabled="
                    submitLoading ||
                    (selectedClusterResource &&
                      getClusterResourceValue('storage', 'capacity') === 0)
                  "
                  @change="handleStorageUnitChange"
                >
                  <ElOption label="Gi" value="Gi" />
                  <ElOption label="Mi" value="Mi" />
                  <ElOption label="Ki" value="Ki" />
                  <ElOption label="Ti" value="Ti" />
                  <ElOption label="Pi" value="Pi" />
                </ElSelect>
              </div>
              <ElAlert
                v-if="resourceWarnings.storage"
                type="warning"
                :closable="false"
                class="resource-warning"
              >
                超出可用资源，已自动调整
              </ElAlert>
            </div>
          </ElFormItem>
        </div>

        <!-- GPU 配额 (可选) -->
        <div class="quota-section optional">
          <div class="section-header">
            <Zap :size="20" class="section-icon gpu-icon" />
            <span class="section-title">GPU 配额</span>
            <ElTag type="info" size="small" effect="plain">可选</ElTag>
            <span
              class="resource-hint"
              v-if="selectedClusterResource && getClusterResourceValue('gpu', 'capacity') > 0"
            >
              可用: {{ formatNumber(getAvailableResourceValue('gpu')) }} 个
            </span>
            <ElTag
              v-if="selectedClusterResource && getAvailableResourceValue('gpu') < 0"
              type="danger"
              size="small"
            >
              资源不足
            </ElTag>
          </div>

          <div class="quota-grid">
            <ElFormItem prop="gpuLimit.value">
              <div class="form-item-wrapper">
                <label class="form-label">GPU 数量</label>
                <div class="input-with-unit">
                  <ElInputNumber
                    v-model="form.gpuLimit.value"
                    :min="0"
                    :max="9999"
                    :step="0.1"
                    :precision="1"
                    placeholder="0"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('gpu', 'capacity') === 0)
                    "
                    class="quota-input"
                    @blur="handleResourceBlur('gpu')"
                    @change="handleResourceChange('gpu')"
                  />
                  <span class="unit-text">个</span>
                </div>
                <ElAlert
                  v-if="resourceWarnings.gpu"
                  type="warning"
                  :closable="false"
                  class="resource-warning"
                >
                  超出可用资源，已自动调整
                </ElAlert>
              </div>
            </ElFormItem>

            <ElFormItem prop="gpuOvercommitRatio">
              <div class="form-item-wrapper">
                <label class="form-label">
                  超分比例
                  <ElTooltip content="GPU超分需根据实际工作负载谨慎配置" placement="top">
                    <Info :size="14" class="info-icon" />
                  </ElTooltip>
                </label>
                <div class="overcommit-control">
                  <ElSlider
                    v-model="form.gpuOvercommitRatio"
                    :min="1"
                    :max="20"
                    :step="0.1"
                    :show-tooltip="false"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('gpu', 'capacity') === 0)
                    "
                    @change="calculateCapacity('gpu')"
                    class="overcommit-slider"
                  />
                  <ElInputNumber
                    v-model="form.gpuOvercommitRatio"
                    :min="1"
                    :max="20"
                    :step="0.1"
                    :precision="1"
                    :disabled="
                      submitLoading ||
                      (selectedClusterResource && getClusterResourceValue('gpu', 'capacity') === 0)
                    "
                    @change="calculateCapacity('gpu')"
                    class="overcommit-input"
                    controls-position="right"
                  />
                  <span class="overcommit-unit">x</span>
                </div>
                <div class="overcommit-result">
                  <span class="result-label">实际容量：</span>
                  <span class="result-value">{{
                    formatResourceWithUnit(form.gpuCapacity, 'gpu')
                  }}</span>
                </div>
              </div>
            </ElFormItem>
          </div>
        </div>

        <!-- Pod 配额 -->
        <div class="quota-section">
          <div class="section-header">
            <Package :size="20" class="section-icon pod-icon" />
            <span class="section-title">Pod 配额</span>
          </div>

          <ElFormItem prop="podsLimit">
            <div class="form-item-wrapper">
              <label class="form-label">Pod 数量限制</label>
              <ElInputNumber
                v-model="form.podsLimit"
                :min="0"
                :max="9999"
                :step="10"
                placeholder="100"
                :disabled="submitLoading"
                class="quota-input"
              />
              <span class="unit-text">个</span>
            </div>
          </ElFormItem>
        </div>

        <!-- 高级配置 -->
        <ElCollapse v-model="activeCollapse" class="advanced-section">
          <ElCollapseItem name="advanced">
            <template #title>
              <div class="advanced-header">
                <Settings :size="18" />
                <span>高级配置</span>
                <ElTag size="small" effect="plain">Kubernetes 资源限制</ElTag>
              </div>
            </template>

            <div class="advanced-grid">
              <div class="advanced-item">
                <label>ConfigMap</label>
                <ElInputNumber v-model="form.configmapLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>Secret</label>
                <ElInputNumber v-model="form.secretLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>PVC</label>
                <ElInputNumber v-model="form.pvcLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>Service</label>
                <ElInputNumber v-model="form.serviceLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>Ingress</label>
                <ElInputNumber v-model="form.ingressesLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>Deployment</label>
                <ElInputNumber v-model="form.deploymentsLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>Job</label>
                <ElInputNumber v-model="form.jobsLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>CronJob</label>
                <ElInputNumber v-model="form.cronjobsLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>DaemonSet</label>
                <ElInputNumber v-model="form.daemonsetsLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>StatefulSet</label>
                <ElInputNumber
                  v-model="form.statefulsetsLimit"
                  :min="0"
                  :disabled="submitLoading"
                />
              </div>
              <div class="advanced-item">
                <label>LoadBalancer</label>
                <ElInputNumber
                  v-model="form.loadbalancersLimit"
                  :min="0"
                  :disabled="submitLoading"
                />
              </div>
              <div class="advanced-item">
                <label>NodePort</label>
                <ElInputNumber v-model="form.nodeportsLimit" :min="0" :disabled="submitLoading" />
              </div>
              <div class="advanced-item">
                <label>临时存储</label>
                <div class="input-with-unit">
                  <ElInputNumber
                    v-model="form.ephemeralStorageLimit.value"
                    :min="0"
                    :max="9999999"
                    :step="1"
                    :precision="2"
                    :disabled="submitLoading"
                    style="width: 150px"
                  />
                  <ElSelect
                    v-model="form.ephemeralStorageLimit.unit"
                    style="width: 80px"
                    :disabled="submitLoading"
                  >
                    <ElOption label="Gi" value="Gi" />
                    <ElOption label="Mi" value="Mi" />
                    <ElOption label="Ki" value="Ki" />
                    <ElOption label="Ti" value="Ti" />
                    <ElOption label="Pi" value="Pi" />
                  </ElSelect>
                </div>
              </div>
            </div>
          </ElCollapseItem>
        </ElCollapse>
      </ElForm>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton size="large" @click="handleCancel" :disabled="submitLoading">取消</ElButton>
        <ElButton type="primary" size="large" @click="handleSubmit" :loading="submitLoading">
          {{
            submitLoading ? (isEdit ? '更新中...' : '创建中...') : isEdit ? '更新配额' : '分配资源'
          }}
        </ElButton>
      </div>
    </template>
  </ElDialog>

  <!-- 集群选择弹窗 -->
  <ElDialog
    v-model="showClusterDialog"
    title="选择集群"
    width="800px"
    :close-on-click-modal="false"
  >
    <div class="cluster-browser">
      <ElInput
        v-model="browserSearchQuery"
        placeholder="搜索集群名称或UUID"
        clearable
        @clear="loadClusterPage"
        @keyup.enter="loadClusterPage"
        style="margin-bottom: 16px"
      >
        <template #append>
          <ElButton @click="loadClusterPage">搜索</ElButton>
        </template>
      </ElInput>

      <ElTable
        :data="clusterPageList"
        v-loading="clusterPageLoading"
        @row-click="selectClusterFromTable"
        style="width: 100%"
        height="400"
      >
        <ElTableColumn prop="name" label="集群名称" width="200">
          <template #default="{ row }">
            <span>{{ row.name || `集群 ${row.id}` }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="uuid" label="UUID" />
        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <ElTag v-if="isClusterAllocated(row.uuid || String(row.id))" type="danger" size="small">
              已分配
            </ElTag>
            <ElTag v-else type="success" size="small">可用</ElTag>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElPagination
        v-model:current-page="clusterPagination.page"
        :page-size="clusterPagination.pageSize"
        :total="clusterPagination.total"
        layout="total, prev, pager, next"
        style="margin-top: 16px; justify-content: center"
        @current-change="loadClusterPage"
      />
    </div>

    <template #footer>
      <ElButton @click="showClusterDialog = false">取消</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import {
    Cpu,
    HardDrive,
    Database,
    Package,
    Settings,
    Server,
    Activity,
    Info,
    Zap,
    Search
  } from 'lucide-vue-next'
  import type { ProjectCluster, AddProjectClusterRequest } from '@/api/manager/project'
  import { searchClusterApi, getClusterResourceInfoApi } from '@/api/manager/cluster'
  import { searchProjectClusterApi } from '@/api/manager/project'
  import { parseResourceString } from '@/api/manager/project'

  interface Props {
    visible: boolean
    projectId?: number
    editData?: ProjectCluster | null
    submitLoading?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: AddProjectClusterRequest): void
  }

  interface ResourceWithUnit {
    value: number
    unit: string
  }

  interface ClusterResourceInfo {
    id: number
    clusterUuid: string
    cpuPhysicalCapacity: string
    cpuAllocatedTotal: string
    cpuCapacityTotal: string
    memPhysicalCapacity: string
    memAllocatedTotal: string
    memCapacityTotal: string
    storagePhysicalCapacity: string
    storageAllocatedTotal: string
    gpuPhysicalCapacity: string
    gpuAllocatedTotal: string
    gpuCapacityTotal: string
    gpuUsedTotal: string
    podsPhysicalCapacity: number
    podsAllocatedTotal: number
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    projectId: 0,
    submitLoading: false
  })

  const emit = defineEmits<Emits>()

  // Refs
  const formRef = ref<FormInstance>()
  const isEdit = ref(false)
  const resourceLoading = ref(false)
  const activeCollapse = ref(['advanced'])
  const showClusterDialog = ref(false)
  const clusterPageLoading = ref(false)

  // 搜索和选择
  const clusterSearchQuery = ref('')
  const browserSearchQuery = ref('')
  const selectedCluster = ref<any>(null)

  // 资源警告提示
  const resourceWarnings = reactive({
    cpu: false,
    mem: false,
    storage: false,
    gpu: false
  })

  // 表单数据 - 使用带单位的结构
  interface FormData {
    clusterUuid: string
    projectId: number
    cpuLimit: ResourceWithUnit
    cpuOvercommitRatio: number
    cpuCapacity: string
    memLimit: ResourceWithUnit
    memOvercommitRatio: number
    memCapacity: string
    storageLimit: ResourceWithUnit
    gpuLimit: ResourceWithUnit
    gpuOvercommitRatio: number
    gpuCapacity: string
    podsLimit: number
    configmapLimit: number
    secretLimit: number
    pvcLimit: number
    ephemeralStorageLimit: ResourceWithUnit
    serviceLimit: number
    loadbalancersLimit: number
    nodeportsLimit: number
    deploymentsLimit: number
    jobsLimit: number
    cronjobsLimit: number
    daemonsetsLimit: number
    statefulsetsLimit: number
    ingressesLimit: number
  }

  const form = reactive<FormData>({
    clusterUuid: '',
    projectId: props.projectId || 0,
    cpuLimit: { value: 0, unit: 'core' },
    cpuOvercommitRatio: 1,
    cpuCapacity: '0',
    memLimit: { value: 0, unit: 'Gi' },
    memOvercommitRatio: 1,
    memCapacity: '0Gi',
    storageLimit: { value: 0, unit: 'Gi' },
    gpuLimit: { value: 0, unit: '' },
    gpuOvercommitRatio: 1,
    gpuCapacity: '0',
    podsLimit: 100,
    configmapLimit: 100,
    secretLimit: 100,
    pvcLimit: 100,
    ephemeralStorageLimit: { value: 100, unit: 'Gi' },
    serviceLimit: 100,
    loadbalancersLimit: 10,
    nodeportsLimit: 100,
    deploymentsLimit: 100,
    jobsLimit: 100,
    cronjobsLimit: 50,
    daemonsetsLimit: 10,
    statefulsetsLimit: 50,
    ingressesLimit: 50
  })

  // 集群列表和资源信息
  const clusterPageList = ref<any[]>([])
  const allocatedClusters = ref<Map<string, number>>(new Map())
  const selectedClusterResource = ref<ClusterResourceInfo | null>(null)

  // 分页配置
  const clusterPagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // ==================== 工具函数 ====================

  /**
   * 解析资源字符串，返回数值和单位
   * 如果没有单位，默认 CPU 为核，内存/存储为 Gi
   */
  const parseResource = (
    resourceStr: string | number | null | undefined,
    defaultUnit: string = 'Gi'
  ): ResourceWithUnit => {
    // 处理空值
    if (
      resourceStr === null ||
      resourceStr === undefined ||
      resourceStr === '' ||
      resourceStr === 0 ||
      resourceStr === '0'
    ) {
      // CPU 默认单位为 'core'
      const unit = defaultUnit === '' ? 'core' : defaultUnit
      return { value: 0, unit }
    }

    // 如果是数字类型，直接返回
    if (typeof resourceStr === 'number') {
      const unit = defaultUnit === '' ? 'core' : defaultUnit
      return { value: resourceStr, unit }
    }

    // 转换为字符串并处理
    const str = String(resourceStr).trim()

    if (!str || str === '0') {
      const unit = defaultUnit === '' ? 'core' : defaultUnit
      return { value: 0, unit }
    }

    // CPU 毫核
    if (str.endsWith('m')) {
      return {
        value: parseFloat(str.slice(0, -1)),
        unit: 'm'
      }
    }

    // 内存单位
    const memUnits = ['Ki', 'Mi', 'Gi', 'Ti', 'Pi']
    for (const unit of memUnits) {
      if (str.endsWith(unit)) {
        return {
          value: parseFloat(str.slice(0, -unit.length)),
          unit: unit
        }
      }
    }

    // 纯数字，CPU 使用 'core'，其他使用默认单位
    const numValue = parseFloat(str)
    if (!isNaN(numValue)) {
      const unit = defaultUnit === '' ? 'core' : defaultUnit
      return { value: numValue, unit }
    }

    const unit = defaultUnit === '' ? 'core' : defaultUnit
    return { value: 0, unit }
  }

  /**
   * 格式化资源为字符串（用于提交）
   */
  const formatResource = (resource: ResourceWithUnit): string => {
    if (!resource || resource.value === 0) {
      return '0'
    }
    // CPU 核心不需要单位
    if (resource.unit === '' || resource.unit === 'core') {
      return String(resource.value)
    }
    return `${resource.value}${resource.unit}`
  }

  /**
   * 将资源转换为 GiB 单位（用于比较）
   */
  const convertToGi = (value: number, unit: string): number => {
    const conversions: Record<string, number> = {
      Ki: value / (1024 * 1024),
      Mi: value / 1024,
      Gi: value,
      Ti: value * 1024,
      Pi: value * 1024 * 1024
    }
    return conversions[unit] || value
  }

  /**
   * 将 CPU 转换为核心单位（用于比较）
   */
  const convertToCores = (value: number, unit: string): number => {
    if (unit === 'm') {
      return value / 1000
    }
    return value
  }

  /**
   * 格式化数字显示
   */
  const formatNumber = (num: number): string => {
    if (num === 0) return '0'
    return Math.round(num * 10) / 10 + ''
  }

  /**
   * 格式化资源显示（带单位）
   */
  const formatResourceWithUnit = (resourceStr: string, type: string): string => {
    if (!resourceStr || resourceStr === '0') return '0'

    const parsed = parseResource(resourceStr, type === 'cpu' ? '' : 'Gi')
    if (type === 'cpu') {
      return parsed.unit === 'm' ? `${parsed.value}毫核` : `${parsed.value}核`
    } else if (type === 'gpu') {
      return `${parsed.value}个`
    } else {
      return `${parsed.value}${parsed.unit}`
    }
  }

  /**
   * 获取 CPU 步进值
   */
  const getCpuStep = (): number => {
    return form.cpuLimit.unit === 'm' ? 100 : 0.1
  }

  /**
   * 获取 CPU 精度
   */
  const getCpuPrecision = (): number => {
    return form.cpuLimit.unit === 'm' ? 0 : 2
  }

  // ==================== 集群资源信息获取 ====================

  /**
   * 获取集群资源值（已转换为统一单位）
   */
  const getClusterResourceValue = (type: string, valueType: 'capacity' | 'allocated'): number => {
    if (!selectedClusterResource.value) return 0

    const resource = selectedClusterResource.value
    let valueStr: string | number = ''

    try {
      switch (type) {
        case 'cpu':
          valueStr =
            valueType === 'capacity'
              ? resource.cpuPhysicalCapacity || '0'
              : resource.cpuAllocatedTotal || '0'
          const cpuStr = String(valueStr)
          return convertToCores(parseResourceString(cpuStr), '')
        case 'mem':
          valueStr =
            valueType === 'capacity'
              ? resource.memPhysicalCapacity || '0'
              : resource.memAllocatedTotal || '0'
          const memStr = String(valueStr)
          return convertToGi(parseResourceString(memStr), 'Gi')
        case 'storage':
          valueStr =
            valueType === 'capacity'
              ? resource.storagePhysicalCapacity || '0'
              : resource.storageAllocatedTotal || '0'
          const storageStr = String(valueStr)
          return convertToGi(parseResourceString(storageStr), 'Gi')
        case 'gpu':
          valueStr =
            valueType === 'capacity'
              ? resource.gpuPhysicalCapacity || '0'
              : resource.gpuAllocatedTotal || '0'
          const gpuStr = String(valueStr)
          return parseResourceString(gpuStr)
        default:
          return 0
      }
    } catch (error) {
      console.error(`获取集群资源值失败 [${type}][${valueType}]:`, error, 'valueStr:', valueStr)
      return 0
    }
  }

  /**
   * 获取可用资源（物理容量 - 已分配 + 编辑模式下原有分配）
   */
  const getAvailableResourceValue = (type: string): number => {
    if (!selectedClusterResource.value) return 0

    const capacity = getClusterResourceValue(type, 'capacity')
    const allocated = getClusterResourceValue(type, 'allocated')
    let currentUsed = 0

    // 编辑模式下，计算原有分配
    if (isEdit.value && props.editData) {
      switch (type) {
        case 'cpu':
          currentUsed = convertToCores(parseResourceString(props.editData.cpuLimit || '0'), '')
          break
        case 'mem':
          currentUsed = convertToGi(parseResourceString(props.editData.memLimit || '0'), 'Gi')
          break
        case 'storage':
          currentUsed = convertToGi(parseResourceString(props.editData.storageLimit || '0'), 'Gi')
          break
        case 'gpu':
          currentUsed = parseResourceString(props.editData.gpuLimit || '0')
          break
      }
    }

    return capacity - allocated + currentUsed
  }

  /**
   * 获取资源使用百分比
   */
  const getResourceUsagePercent = (type: string): number => {
    if (!selectedClusterResource.value) return 0

    const capacity = getClusterResourceValue(type, 'capacity')
    const allocated = getClusterResourceValue(type, 'allocated')

    if (capacity === 0) return 0
    return Math.round((allocated / capacity) * 100)
  }

  /**
   * 获取进度条颜色
   */
  const getProgressColor = (percentage: number): string => {
    if (percentage <= 60) return '#67c23a'
    if (percentage <= 80) return '#e6a23c'
    if (percentage <= 100) return '#f56c6c'
    return '#dd001b'
  }

  // ==================== 资源输入处理 ====================

  /**
   * 获取当前表单资源值（转换为统一单位）
   */
  const getCurrentFormValue = (type: string): number => {
    switch (type) {
      case 'cpu':
        return convertToCores(form.cpuLimit.value, form.cpuLimit.unit)
      case 'mem':
        return convertToGi(form.memLimit.value, form.memLimit.unit)
      case 'storage':
        return convertToGi(form.storageLimit.value, form.storageLimit.unit)
      case 'gpu':
        return form.gpuLimit.value
      default:
        return 0
    }
  }

  /**
   * 资源值变化时触发（实时检查）
   */
  const handleResourceChange = (type: string) => {
    if (!selectedClusterResource.value) return

    const available = getAvailableResourceValue(type)
    const currentValue = getCurrentFormValue(type)

    // 显示警告但不自动调整
    if (currentValue > available && available > 0) {
      resourceWarnings[type] = true
      setTimeout(() => {
        resourceWarnings[type] = false
      }, 5000)
    } else {
      resourceWarnings[type] = false
    }

    calculateCapacity(type)
  }

  /**
   * 资源输入失焦时触发（自动修正）
   */
  const handleResourceBlur = (type: string) => {
    if (!selectedClusterResource.value) return

    const available = getAvailableResourceValue(type)
    const currentValue = getCurrentFormValue(type)

    // 编辑模式下允许缩减
    if (isEdit.value && props.editData) {
      const originalValue = getOriginalResourceValue(type)
      if (currentValue <= originalValue) {
        calculateCapacity(type)
        return
      }
    }

    // 超出可用资源，自动调整
    if (currentValue > available && available >= 0) {
      switch (type) {
        case 'cpu':
          if (form.cpuLimit.unit === 'm') {
            form.cpuLimit.value = Math.floor(available * 1000)
          } else {
            form.cpuLimit.value = Math.floor(available * 10) / 10
          }
          break
        case 'mem':
        case 'storage':
          const availableInCurrentUnit = convertFromGi(
            available,
            form[type === 'mem' ? 'memLimit' : 'storageLimit'].unit
          )
          form[type === 'mem' ? 'memLimit' : 'storageLimit'].value =
            Math.floor(availableInCurrentUnit * 100) / 100
          break
        case 'gpu':
          form.gpuLimit.value = Math.floor(available * 10) / 10
          break
      }

      resourceWarnings[type] = true
      setTimeout(() => {
        resourceWarnings[type] = false
      }, 10000)
    }

    calculateCapacity(type)
  }

  /**
   * 将 GiB 转换为指定单位
   */
  const convertFromGi = (valueInGi: number, targetUnit: string): number => {
    const conversions: Record<string, number> = {
      Ki: valueInGi * 1024 * 1024,
      Mi: valueInGi * 1024,
      Gi: valueInGi,
      Ti: valueInGi / 1024,
      Pi: valueInGi / (1024 * 1024)
    }
    return conversions[targetUnit] || valueInGi
  }

  /**
   * 获取原始资源值（编辑模式）
   */
  const getOriginalResourceValue = (type: string): number => {
    if (!isEdit.value || !props.editData) return 0

    switch (type) {
      case 'cpu':
        return convertToCores(parseResourceString(props.editData.cpuLimit || '0'), '')
      case 'mem':
        return convertToGi(parseResourceString(props.editData.memLimit || '0'), 'Gi')
      case 'storage':
        return convertToGi(parseResourceString(props.editData.storageLimit || '0'), 'Gi')
      case 'gpu':
        return parseResourceString(props.editData.gpuLimit || '0')
      default:
        return 0
    }
  }

  /**
   * 计算超分后的容量
   */
  const calculateCapacity = (type: string) => {
    switch (type) {
      case 'cpu': {
        const valueInCores = getCurrentFormValue('cpu')
        const capacity = valueInCores * form.cpuOvercommitRatio
        form.cpuCapacity = capacity.toFixed(1)
        break
      }
      case 'mem': {
        const valueInGi = getCurrentFormValue('mem')
        const capacity = valueInGi * form.memOvercommitRatio
        form.memCapacity = `${capacity.toFixed(1)}Gi`
        break
      }
      case 'gpu': {
        const capacity = form.gpuLimit.value * form.gpuOvercommitRatio
        form.gpuCapacity = capacity.toFixed(1)
        break
      }
    }
  }

  /**
   * CPU 单位变化处理
   */
  const lastCpuUnit = ref<string>('core')

  const handleCpuUnitChange = (newUnit: string) => {
    const oldUnit = lastCpuUnit.value

    if (oldUnit === newUnit) return

    // 转换值
    if (oldUnit === 'core' && newUnit === 'm') {
      form.cpuLimit.value = Math.round(form.cpuLimit.value * 1000)
    } else if (oldUnit === 'm' && newUnit === 'core') {
      form.cpuLimit.value = Math.round((form.cpuLimit.value / 1000) * 100) / 100
    }

    lastCpuUnit.value = newUnit
    handleResourceChange('cpu')
  }

  /**
   * 内存单位变化处理
   */
  const handleMemUnitChange = (newUnit: string) => {
    const oldUnit = form.memLimit.unit
    if (oldUnit === newUnit) return

    const valueInGi = convertToGi(form.memLimit.value, oldUnit)
    form.memLimit.value = Math.round(convertFromGi(valueInGi, newUnit) * 100) / 100
    handleResourceChange('mem')
  }

  /**
   * 存储单位变化处理
   */
  const handleStorageUnitChange = (newUnit: string) => {
    const oldUnit = form.storageLimit.unit
    if (oldUnit === newUnit) return

    const valueInGi = convertToGi(form.storageLimit.value, oldUnit)
    form.storageLimit.value = Math.round(convertFromGi(valueInGi, newUnit) * 100) / 100
    handleResourceChange('storage')
  }

  // ==================== 集群相关 ====================

  const loadAllocatedClusters = async () => {
    if (!props.projectId || props.projectId === 0) {
      console.warn('loadAllocatedClusters: projectId 无效', props.projectId)
      return
    }

    try {
      const response = await searchProjectClusterApi({
        projectId: props.projectId
      })

      allocatedClusters.value = new Map()
      if (response) {
        response.forEach((item: ProjectCluster) => {
          if (item.clusterUuid && item.projectId === props.projectId) {
            allocatedClusters.value.set(item.clusterUuid, item.projectId)
          }
        })
      }
    } catch (error) {
      console.error('获取已分配集群失败:', error)
    }
  }

  const isClusterAllocated = (clusterUuid: string): boolean => {
    if (!clusterUuid) return false
    if (isEdit.value && props.editData?.clusterUuid === clusterUuid) {
      return false
    }
    return allocatedClusters.value.has(clusterUuid)
  }

  const queryClusterSearch = async (queryString: string, cb: any) => {
    try {
      const response = await searchClusterApi({
        page: 1,
        pageSize: 20,
        search: queryString
      })

      const results = (response.items || []).map((cluster) => {
        if (!cluster.uuid && cluster.id) {
          cluster.uuid = String(cluster.id)
        }
        return cluster
      })

      cb(results)
    } catch (error) {
      console.error('搜索集群失败:', error)
      cb([])
    }
  }

  const handleClusterSelect = async (item: any) => {
    if (isClusterAllocated(item.uuid || String(item.id))) {
      clusterSearchQuery.value = ''
      return
    }

    selectedCluster.value = item
    form.clusterUuid = item.uuid || String(item.id)
    clusterSearchQuery.value = item.name || `集群 ${item.id}`

    await loadClusterResource(form.clusterUuid)
  }

  const handleClusterClear = () => {
    selectedCluster.value = null
    form.clusterUuid = ''
    selectedClusterResource.value = null
  }

  const loadClusterPage = async () => {
    clusterPageLoading.value = true
    try {
      const response = await searchClusterApi({
        page: clusterPagination.page,
        pageSize: clusterPagination.pageSize,
        search: browserSearchQuery.value
      })

      clusterPageList.value = (response.items || []).map((cluster) => {
        if (!cluster.uuid && cluster.id) {
          cluster.uuid = String(cluster.id)
        }
        return cluster
      })

      clusterPagination.total = response.total || 0
    } catch (error) {
      console.error('获取集群列表失败:', error)
      clusterPageList.value = []
    } finally {
      clusterPageLoading.value = false
    }
  }

  const selectClusterFromTable = (row: any) => {
    if (isClusterAllocated(row.uuid || String(row.id))) {
      return
    }

    selectedCluster.value = row
    form.clusterUuid = row.uuid || String(row.id)
    clusterSearchQuery.value = row.name || `集群 ${row.id}`
    showClusterDialog.value = false

    loadClusterResource(form.clusterUuid)
  }

  const loadClusterResource = async (clusterUuid: string) => {
    if (!clusterUuid || !selectedCluster.value) {
      selectedClusterResource.value = null
      return
    }

    if (!selectedCluster.value.id || selectedCluster.value.id === 'undefined') {
      console.error('集群 ID 无效:', selectedCluster.value.id)
      return
    }

    resourceLoading.value = true
    try {
      const response = await getClusterResourceInfoApi(selectedCluster.value.id)

      selectedClusterResource.value = {
        id: response.id || 0,
        clusterUuid: response.clusterUuid || clusterUuid,
        cpuPhysicalCapacity: response.cpuPhysicalCapacity || '0',
        cpuAllocatedTotal: response.cpuAllocatedTotal || '0',
        cpuCapacityTotal: response.cpuCapacityTotal || '0',
        memPhysicalCapacity: response.memPhysicalCapacity || '0',
        memAllocatedTotal: response.memAllocatedTotal || '0',
        memCapacityTotal: response.memCapacityTotal || '0',
        storagePhysicalCapacity: response.storagePhysicalCapacity || '0',
        storageAllocatedTotal: response.storageAllocatedTotal || '0',
        gpuPhysicalCapacity: response.gpuPhysicalCapacity || '0',
        gpuAllocatedTotal: response.gpuAllocatedTotal || '0',
        gpuCapacityTotal: response.gpuCapacityTotal || '0',
        gpuUsedTotal: response.gpuUsedTotal || '0',
        podsPhysicalCapacity: response.podsPhysicalCapacity || 0,
        podsAllocatedTotal: response.podsAllocatedTotal || 0
      }
    } catch (error) {
      console.error('获取集群资源信息失败:', error)
      selectedClusterResource.value = null
    } finally {
      resourceLoading.value = false
    }
  }

  // ==================== 表单处理 ====================

  const dialogTitle = computed(() => {
    return isEdit.value ? '编辑资源配额' : '分配资源池'
  })

  const validateClusterUnique = (rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error('请选择集群'))
      return
    }

    if (isEdit.value && value === props.editData?.clusterUuid) {
      callback()
      return
    }

    if (isClusterAllocated(value)) {
      callback(new Error('该集群已分配给当前项目'))
    } else {
      callback()
    }
  }

  const rules = reactive<FormRules>({
    clusterUuid: [
      { required: true, message: '请选择集群', trigger: 'change' },
      { validator: validateClusterUnique, trigger: 'change' }
    ],
    'cpuLimit.value': [
      { required: true, message: '请输入CPU限制', trigger: 'blur' },
      { type: 'number', min: 0.1, message: 'CPU限制必须大于0', trigger: 'blur' }
    ],
    'memLimit.value': [
      { required: true, message: '请输入内存限制', trigger: 'blur' },
      { type: 'number', min: 0.1, message: '内存限制必须大于0', trigger: 'blur' }
    ],
    podsLimit: [
      { required: true, message: '请输入Pod限制', trigger: 'blur' },
      { type: 'number', min: 1, message: 'Pod限制必须大于0', trigger: 'blur' }
    ]
  })

  const resetForm = () => {
    formRef.value?.resetFields()
    Object.assign(form, {
      clusterUuid: '',
      projectId: props.projectId || 0,
      cpuLimit: { value: 0, unit: 'core' },
      cpuOvercommitRatio: 1,
      cpuCapacity: '0',
      memLimit: { value: 0, unit: 'Gi' },
      memOvercommitRatio: 1,
      memCapacity: '0Gi',
      storageLimit: { value: 0, unit: 'Gi' },
      gpuLimit: { value: 0, unit: '' },
      gpuOvercommitRatio: 1,
      gpuCapacity: '0',
      podsLimit: 100,
      configmapLimit: 100,
      secretLimit: 100,
      pvcLimit: 100,
      ephemeralStorageLimit: { value: 100, unit: 'Gi' },
      serviceLimit: 100,
      loadbalancersLimit: 10,
      nodeportsLimit: 100,
      deploymentsLimit: 100,
      jobsLimit: 100,
      cronjobsLimit: 50,
      daemonsetsLimit: 10,
      statefulsetsLimit: 50,
      ingressesLimit: 50
    })
    selectedClusterResource.value = null
    selectedCluster.value = null
    clusterSearchQuery.value = ''
    browserSearchQuery.value = ''
    activeCollapse.value = ['advanced']
    lastCpuUnit.value = 'core'
    Object.keys(resourceWarnings).forEach((key) => {
      resourceWarnings[key] = false
    })
  }

  const loadFormData = async () => {
    if (!props.editData) return

    isEdit.value = true
    const data = props.editData

    // 解析资源字符串 - CPU 默认使用 'core'
    form.cpuLimit = parseResource(data.cpuLimit || '0', '')
    // 确保 CPU 单位不为空
    if (!form.cpuLimit.unit || form.cpuLimit.unit === '') {
      form.cpuLimit.unit = 'core'
    }
    lastCpuUnit.value = form.cpuLimit.unit

    form.cpuOvercommitRatio = data.cpuOvercommitRatio || 1
    form.cpuCapacity = data.cpuCapacity || '0'

    form.memLimit = parseResource(data.memLimit || '0', 'Gi')
    form.memOvercommitRatio = data.memOvercommitRatio || 1
    form.memCapacity = data.memCapacity || '0Gi'

    form.storageLimit = parseResource(data.storageLimit || '0', 'Gi')
    form.gpuLimit = parseResource(data.gpuLimit || '0', '')
    form.gpuOvercommitRatio = data.gpuOvercommitRatio || 1
    form.gpuCapacity = data.gpuCapacity || '0'

    form.podsLimit = data.podsLimit || 100
    form.configmapLimit = data.configmapLimit || 100
    form.secretLimit = data.secretLimit || 100
    form.pvcLimit = data.pvcLimit || 100
    form.ephemeralStorageLimit = parseResource(data.ephemeralStorageLimit || '0', 'Gi')
    form.serviceLimit = data.serviceLimit || 100
    form.loadbalancersLimit = data.loadbalancersLimit || 10
    form.nodeportsLimit = data.nodeportsLimit || 100
    form.deploymentsLimit = data.deploymentsLimit || 100
    form.jobsLimit = data.jobsLimit || 100
    form.cronjobsLimit = data.cronjobsLimit || 50
    form.daemonsetsLimit = data.daemonsetsLimit || 10
    form.statefulsetsLimit = data.statefulsetsLimit || 50
    form.ingressesLimit = data.ingressesLimit || 50

    // 加载集群信息
    if (data.clusterUuid) {
      try {
        if (data.clusterId) {
          selectedCluster.value = {
            id: data.clusterId,
            uuid: data.clusterUuid,
            name: data.clusterName || data.clusterUuid
          }
          clusterSearchQuery.value = data.clusterName || data.clusterUuid
          await loadClusterResource(data.clusterUuid)
        } else {
          const response = await searchClusterApi({
            page: 1,
            pageSize: 100,
            uuid: data.clusterUuid
          })

          const cluster = response.items?.find(
            (item) => item.uuid === data.clusterUuid || String(item.id) === data.clusterUuid
          )

          if (cluster) {
            selectedCluster.value = {
              id: cluster.id,
              uuid: cluster.uuid || String(cluster.id),
              name: cluster.name || `集群 ${cluster.id}`
            }
            clusterSearchQuery.value = cluster.name || `集群 ${cluster.id}`
            await loadClusterResource(data.clusterUuid)
          }
        }
      } catch (error) {
        console.error('加载集群信息失败:', error)
      }
    }

    form.clusterUuid = data.clusterUuid || ''
  }

  const handleSubmit = async () => {
    if (!formRef.value) {
      return
    }

    if (props.submitLoading) {
      return
    }

    if (!props.projectId || props.projectId === 0) {
      return
    }

    try {
      const isValid = await formRef.value.validate()
      if (isValid) {
        const submitData: AddProjectClusterRequest = {
          clusterUuid: form.clusterUuid,
          projectId: props.projectId,
          cpuLimit: formatResource(form.cpuLimit),
          cpuOvercommitRatio: form.cpuOvercommitRatio,
          cpuCapacity: form.cpuCapacity,
          memLimit: formatResource(form.memLimit),
          memOvercommitRatio: form.memOvercommitRatio,
          memCapacity: form.memCapacity,
          storageLimit: formatResource(form.storageLimit),
          gpuLimit: formatResource(form.gpuLimit),
          gpuOvercommitRatio: form.gpuOvercommitRatio,
          gpuCapacity: form.gpuCapacity,
          podsLimit: form.podsLimit,
          configmapLimit: form.configmapLimit,
          secretLimit: form.secretLimit,
          pvcLimit: form.pvcLimit,
          ephemeralStorageLimit: formatResource(form.ephemeralStorageLimit),
          serviceLimit: form.serviceLimit,
          loadbalancersLimit: form.loadbalancersLimit,
          nodeportsLimit: form.nodeportsLimit,
          deploymentsLimit: form.deploymentsLimit,
          jobsLimit: form.jobsLimit,
          cronjobsLimit: form.cronjobsLimit,
          daemonsetsLimit: form.daemonsetsLimit,
          statefulsetsLimit: form.statefulsetsLimit,
          ingressesLimit: form.ingressesLimit
        }

        emit('submit', submitData)
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    if (props.submitLoading) {
      return
    }
    emit('update:visible', false)
  }

  const handleClosed = () => {
    if (!props.submitLoading) {
      resetForm()
      isEdit.value = false
      resourceLoading.value = false
    }
  }

  // 监听弹窗显示
  watch(
    () => props.visible,
    async (newVal) => {
      if (newVal) {
        if (!props.projectId || props.projectId === 0) {
          console.error('projectId 无效:', props.projectId)
          emit('update:visible', false)
          return
        }

        form.projectId = props.projectId

        await loadAllocatedClusters()
        await nextTick()

        if (props.editData) {
          await loadFormData()
        } else {
          isEdit.value = false
          resetForm()
        }
      }
    }
  )

  // 监听projectId变化
  watch(
    () => props.projectId,
    (newVal) => {
      if (newVal && newVal > 0) {
        form.projectId = newVal
      }
    },
    { immediate: true }
  )

  watch(showClusterDialog, (newVal) => {
    if (newVal) {
      loadClusterPage()
    }
  })
</script>

<style lang="scss" scoped>
  .resource-dialog {
    :deep(.el-dialog__body) {
      padding: 0;
    }

    .dialog-body {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;

        &:hover {
          background: #9ca3af;
        }
      }
    }

    .cluster-selection {
      margin-bottom: 24px;

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;

        .section-icon {
          color: #6366f1;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
      }

      .cluster-autocomplete {
        width: 100%;

        :deep(.el-input__inner) {
          height: 48px;
        }

        &.is-edit-mode {
          :deep(.el-input__inner) {
            background-color: #f5f7fa;
            cursor: not-allowed;
            color: #909399;
          }

          :deep(.el-input__wrapper) {
            background-color: #f5f7fa;
          }
        }
      }

      .cluster-suggestion-item {
        padding: 8px 0;

        .suggestion-main {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          .suggestion-icon {
            color: #6b7280;
          }

          .suggestion-name {
            font-weight: 500;
            flex: 1;
          }
        }

        .suggestion-uuid {
          font-size: 12px;
          color: #9ca3af;
          margin-left: 24px;
        }
      }

      .selected-cluster {
        margin-top: 12px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;

        .selected-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .selected-icon {
            color: #6366f1;
          }

          .selected-details {
            display: flex;
            flex-direction: column;

            .selected-name {
              font-weight: 600;
              color: #1f2937;
            }

            .selected-uuid {
              font-size: 12px;
              color: #6b7280;
            }
          }
        }
      }
    }

    .resource-overview {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;

      .overview-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;

        .section-icon {
          color: #fff;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          flex: 1;
        }

        .el-tag {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
      }

      .overview-cards {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        @media (min-width: 1200px) {
          grid-template-columns: repeat(4, 1fr);
        }

        .overview-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          gap: 16px;

          .card-icon {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            &.cpu-icon {
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: #fff;
            }

            &.memory-icon {
              background: linear-gradient(135deg, #f093fb, #f5576c);
              color: #fff;
            }

            &.storage-icon {
              background: linear-gradient(135deg, #4facfe, #00f2fe);
              color: #fff;
            }

            &.gpu-icon {
              background: linear-gradient(135deg, #fa709a, #fee140);
              color: #fff;
            }
          }

          .card-content {
            flex: 1;

            .card-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 4px;
            }

            .card-value {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;

              .available {
                color: #10b981;
              }

              .insufficient {
                color: #ef4444;
                font-weight: 700;
              }

              .separator {
                color: #d1d5db;
                margin: 0 4px;
              }

              .total {
                color: #6b7280;
              }
            }

            .card-progress {
              margin-bottom: 4px;

              :deep(.el-progress__text) {
                font-size: 12px !important;
              }
            }

            .card-hint {
              font-size: 11px;
              color: #9ca3af;
            }

            .no-resource {
              padding: 10px 0;

              :deep(.el-empty__description) {
                margin-top: 5px;
                font-size: 12px;
              }
            }

            :deep(.el-alert) {
              margin-top: 8px;
              padding: 4px 8px;

              .el-alert__title {
                font-size: 11px;
              }
            }
          }
        }
      }
    }

    .overview-loading {
      padding: 40px;
      text-align: center;
    }

    .quota-section {
      margin-bottom: 32px;

      &.optional {
        .section-header {
          .section-icon {
            color: #f59e0b;
          }
        }
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f3f4f6;

        .section-icon {
          &.cpu-icon {
            color: #6366f1;
          }

          &.memory-icon {
            color: #ec4899;
          }

          &.storage-icon {
            color: #06b6d4;
          }

          &.gpu-icon {
            color: #f59e0b;
          }

          &.pod-icon {
            color: #10b981;
          }
        }

        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }

        .resource-hint {
          margin-left: auto;
          font-size: 13px;
          color: #10b981;
          font-weight: 500;
        }
      }

      .quota-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        align-items: start;
      }

      .form-item-wrapper {
        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 12px;
          font-weight: 500;
          height: 22px;

          .info-icon {
            color: #9ca3af;
            cursor: help;
          }
        }

        .input-with-unit {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 32px;

          .quota-input {
            width: 160px;
          }

          .unit-text {
            color: #6b7280;
            font-size: 14px;
          }
        }

        .overcommit-control {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 32px;

          .overcommit-slider {
            flex: 1;
            min-width: 120px;
          }

          .overcommit-input {
            width: 100px;

            :deep(.el-input__inner) {
              text-align: center;
            }
          }

          .overcommit-unit {
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
          }
        }

        .resource-warning {
          margin-top: 8px;

          :deep(.el-alert__content) {
            padding: 0;
          }
        }

        .overcommit-result {
          margin-top: 12px;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;

          .result-label {
            font-size: 13px;
            color: #6b7280;
          }

          .result-value {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
          }
        }
      }
    }

    .advanced-section {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;

      :deep(.el-collapse-item__header) {
        background: #f9fafb;
        padding: 0 20px;
        height: 48px;

        .advanced-header {
          display: flex;
          align-items: center;
          gap: 8px;

          .el-tag {
            margin-left: 8px;
          }
        }
      }

      :deep(.el-collapse-item__wrap) {
        background: #fff;
      }

      .advanced-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        padding: 20px;

        .advanced-item {
          label {
            display: block;
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .el-input-number {
            width: 100%;
          }

          .input-with-unit {
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }

  .cluster-browser {
    .el-table {
      margin-bottom: 16px;

      :deep(tr) {
        cursor: pointer;

        &:hover {
          background-color: #f5f7fa;
        }
      }
    }
  }
</style>
