<template>
  <div class="vpa-management-container">
    <!-- 加载状态 -->
    <div v-if="initialLoading" v-loading="initialLoading" class="loading-wrapper">
      <div style="height: 400px"></div>
    </div>

    <!-- VPA 不存在 - 创建表单 -->
    <div v-else-if="!vpaDetail" class="content-layout">
      <!-- 左侧：表单配置 -->
      <div class="form-section">
        <!-- 模式切换 -->
        <div class="mode-switch">
          <ElRadioGroup v-model="editMode" size="default">
            <ElRadioButton label="form">
              <Edit :size="14" />
              表单配置
            </ElRadioButton>
            <ElRadioButton label="yaml">
              <FileText :size="14" />
              YAML 配置
            </ElRadioButton>
          </ElRadioGroup>
        </div>

        <!-- 表单模式 -->
        <div v-show="editMode === 'form'" class="form-content">
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="140px"
            label-position="left"
          >
            <!-- 基础配置 -->
            <div class="section-header">
              <Database :size="16" />
              <span>基础配置</span>
            </div>

            <ElFormItem label="VPA 名称" prop="name">
              <template #label>
                <span>VPA 名称</span>
                <ElTooltip content="VPA 资源的名称，创建后不可修改" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInput v-model="formData.name" placeholder="自动生成，可自定义" clearable />
            </ElFormItem>

            <ElFormItem label="命名空间">
              <template #label>
                <span>命名空间</span>
                <ElTooltip content="VPA 所在的命名空间，不可修改" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInput :value="workspace?.namespace" disabled />
            </ElFormItem>

            <ElFormItem label="目标资源">
              <template #label>
                <span>目标资源</span>
                <ElTooltip content="VPA 控制的工作负载资源，不可修改" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInput :value="targetResourceDisplay" disabled>
                <template #prepend>{{ formData.targetRef.kind }}</template>
              </ElInput>
            </ElFormItem>

            <ElFormItem label="更新模式" prop="updateMode" required>
              <template #label>
                <span>更新模式</span>
                <ElTooltip
                  content="控制 VPA 如何应用资源推荐值。Off: 仅推荐不更新，Initial: 仅在 Pod 创建时更新，Recreate/Auto: 自动更新并可能重启 Pod"
                  placement="top"
                >
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSelect v-model="formData.updateMode" placeholder="请选择更新模式">
                <ElOption value="Off">
                  <div class="mode-option">
                    <span class="mode-label">Off - 仅推荐</span>
                    <span class="mode-desc">仅提供推荐值，不自动更新（推荐初次使用）</span>
                  </div>
                </ElOption>
                <ElOption value="Initial">
                  <div class="mode-option">
                    <span class="mode-label">Initial - 创建时更新</span>
                    <span class="mode-desc">仅在 Pod 创建时应用推荐值</span>
                  </div>
                </ElOption>
                <ElOption value="Recreate">
                  <div class="mode-option">
                    <span class="mode-label">Recreate - 重启更新</span>
                    <span class="mode-desc">自动更新并重启 Pod（会导致服务中断）</span>
                  </div>
                </ElOption>
                <ElOption value="Auto">
                  <div class="mode-option">
                    <span class="mode-label">Auto - 自动更新</span>
                    <span class="mode-desc">自动更新，可能会驱逐 Pod（谨慎使用）</span>
                  </div>
                </ElOption>
              </ElSelect>
            </ElFormItem>

            <!-- 资源限制 -->
            <div class="section-header">
              <Settings :size="16" />
              <span>资源限制</span>
            </div>

            <ElFormItem label="CPU 最小值">
              <template #label>
                <span>CPU 最小值</span>
                <ElTooltip content="VPA 推荐的 CPU 请求值下限" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <div class="resource-input">
                <ElInputNumber
                  v-model="formData.minCpuNum"
                  :min="0"
                  placeholder="数值"
                  style="width: 120px"
                />
                <ElSelect v-model="formData.minCpuUnit" style="width: 80px">
                  <ElOption label="核" value="" />
                  <ElOption label="毫核" value="m" />
                </ElSelect>
              </div>
            </ElFormItem>

            <ElFormItem label="CPU 最大值">
              <template #label>
                <span>CPU 最大值</span>
                <ElTooltip content="VPA 推荐的 CPU 请求值上限" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <div class="resource-input">
                <ElInputNumber
                  v-model="formData.maxCpuNum"
                  :min="0"
                  placeholder="数值"
                  style="width: 120px"
                />
                <ElSelect v-model="formData.maxCpuUnit" style="width: 80px">
                  <ElOption label="核" value="" />
                  <ElOption label="毫核" value="m" />
                </ElSelect>
              </div>
            </ElFormItem>

            <ElFormItem label="内存最小值">
              <template #label>
                <span>内存最小值</span>
                <ElTooltip content="VPA 推荐的内存请求值下限" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <div class="resource-input">
                <ElInputNumber
                  v-model="formData.minMemoryNum"
                  :min="0"
                  placeholder="数值"
                  style="width: 120px"
                />
                <ElSelect v-model="formData.minMemoryUnit" style="width: 80px">
                  <ElOption label="Ki" value="Ki" />
                  <ElOption label="Mi" value="Mi" />
                  <ElOption label="Gi" value="Gi" />
                </ElSelect>
              </div>
            </ElFormItem>

            <ElFormItem label="内存最大值">
              <template #label>
                <span>内存最大值</span>
                <ElTooltip content="VPA 推荐的内存请求值上限" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <div class="resource-input">
                <ElInputNumber
                  v-model="formData.maxMemoryNum"
                  :min="0"
                  placeholder="数值"
                  style="width: 120px"
                />
                <ElSelect v-model="formData.maxMemoryUnit" style="width: 80px">
                  <ElOption label="Ki" value="Ki" />
                  <ElOption label="Mi" value="Mi" />
                  <ElOption label="Gi" value="Gi" />
                </ElSelect>
              </div>
            </ElFormItem>

            <!-- 控制策略 -->
            <div class="section-header">
              <TrendingUp :size="16" />
              <span>控制策略</span>
            </div>

            <ElFormItem label="受控资源">
              <template #label>
                <span>受控资源</span>
                <ElTooltip content="选择 VPA 应该控制哪些资源类型" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElCheckboxGroup v-model="formData.controlledResources">
                <ElCheckbox label="cpu">CPU</ElCheckbox>
                <ElCheckbox label="memory">内存</ElCheckbox>
              </ElCheckboxGroup>
            </ElFormItem>

            <ElFormItem label="受控值">
              <template #label>
                <span>受控值</span>
                <ElTooltip
                  content="RequestsAndLimits: 同时更新 requests 和 limits；RequestsOnly: 仅更新 requests"
                  placement="top"
                >
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSelect v-model="formData.controlledValues" placeholder="请选择受控值">
                <ElOption label="RequestsAndLimits - 请求和限制" value="RequestsAndLimits" />
                <ElOption label="RequestsOnly - 仅请求" value="RequestsOnly" />
              </ElSelect>
            </ElFormItem>

            <!-- 操作按钮 -->
            <ElFormItem>
              <div class="form-actions">
                <ElButton type="primary" size="large" :loading="submitting" @click="handleSubmit">
                  <Check :size="16" v-if="!submitting" />
                  {{ submitting ? '创建中...' : '创建 VPA' }}
                </ElButton>
                <ElButton size="large" @click="handleReset">
                  <RotateCcw :size="16" />
                  重置
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </div>

        <!-- YAML 模式 -->
        <div v-show="editMode === 'yaml'" class="yaml-content">
          <YamlEditorPro
            v-model="yamlContent"
            height="500px"
            :filename="`${formData.name}.yaml`"
            :readonly="false"
            :show-toolbar="true"
            :show-line-numbers="true"
            :show-status-bar="true"
            @change="handleYamlChange"
          />

          <div class="yaml-actions">
            <ElButton type="primary" size="large" :loading="submitting" @click="handleSubmit">
              <Check :size="16" v-if="!submitting" />
              {{ submitting ? '创建中...' : '创建 VPA' }}
            </ElButton>
            <ElButton size="large" @click="syncYamlToForm">
              <Upload :size="16" />
              导入到表单
            </ElButton>
          </div>
        </div>
      </div>

      <!-- 右侧：配置建议 -->
      <div class="info-section">
        <!-- 创建提示 -->
        <ElAlert type="info" :closable="false" show-icon class="create-alert">
          <template #title>
            <div class="alert-content">
              <Zap :size="16" />
              <span>暂未配置 VPA</span>
            </div>
          </template>
          <template #default>
            <p>VPA 可根据实际资源使用情况自动调整 Pod 的 CPU 和内存请求值。</p>
          </template>
        </ElAlert>

        <div class="info-card">
          <div class="info-title">
            <Info :size="16" />
            <span>配置建议</span>
          </div>
          <div class="info-content">
            <div class="info-item">
              <div class="info-item-header">
                <CheckCircle :size="14" class="icon-success" />
                <strong>前置要求</strong>
              </div>
              <ul>
                <li>确保集群已安装 <strong>VPA Controller</strong></li>
                <li>VPA Recommender、Updater、Admission Controller 都需要运行</li>
              </ul>
            </div>

            <div class="info-item">
              <div class="info-item-header">
                <CheckCircle :size="14" class="icon-success" />
                <strong>更新模式选择</strong>
              </div>
              <ul>
                <li><strong>Off</strong>: 推荐初次使用，先观察推荐值是否合理</li>
                <li><strong>Initial</strong>: 适合稳定的应用，仅在 Pod 创建时更新</li>
                <li><strong>Recreate/Auto</strong>: 会重启 Pod，请谨慎使用</li>
              </ul>
            </div>

            <div class="info-item">
              <div class="info-item-header">
                <CheckCircle :size="14" class="icon-info" />
                <strong>资源限制</strong>
              </div>
              <ul>
                <li>CPU 单位：核（如 0.5）或毫核（如 500m）</li>
                <li>内存单位：Ki、Mi、Gi（如 512Mi 或 2Gi）</li>
                <li>合理设置上下限，防止推荐值过大或过小</li>
              </ul>
            </div>

            <div class="info-item warning">
              <div class="info-item-header">
                <AlertTriangle :size="14" class="icon-warning" />
                <strong>重要提示</strong>
              </div>
              <ul>
                <li><strong>不要同时使用 VPA Auto 模式和 HPA</strong>，可能导致冲突</li>
                <li><strong>VPA 会修改 Pod 的资源请求值</strong>，可能导致 Pod 重启</li>
                <li>Recreate/Auto 模式会驱逐 Pod 并重新创建，<strong>会导致服务中断</strong></li>
                <li>建议先使用 Off 模式观察一段时间</li>
              </ul>
            </div>

            <div class="info-item">
              <div class="info-item-header">
                <Lightbulb :size="14" class="icon-info" />
                <strong>最佳实践</strong>
              </div>
              <ul>
                <li>VPA 需要至少 24 小时的历史数据才能给出准确推荐</li>
                <li>定期检查 VPA 推荐值，确保符合预期</li>
                <li>如果使用 Flagger 金丝雀发布，建议使用 HPA 而非 VPA</li>
                <li>生产环境建议使用 <strong>Initial 或 Off 模式</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VPA 已存在 - 详情和编辑 -->
    <div v-else class="content-layout">
      <!-- 左侧：详情或编辑表单 -->
      <div class="form-section">
        <!-- 状态标题栏 -->
        <div class="status-bar">
          <div class="status-left">
            <ElTag type="success" size="large" effect="dark">
              <Zap :size="14" />
              VPA 已启用
            </ElTag>
          </div>
          <div class="status-right">
            <ElButton v-if="!editing" :icon="Edit" size="default" @click="startEdit">
              编辑配置
            </ElButton>
            <ElButton :icon="FileText" size="default" @click="viewYaml"> 查看 YAML </ElButton>
            <ElButton
              type="danger"
              :icon="Trash2"
              size="default"
              :loading="deleting"
              @click="handleDelete"
            >
              删除 VPA
            </ElButton>
          </div>
        </div>

        <!-- 编辑模式 -->
        <template v-if="editing">
          <!-- 模式切换 -->
          <div class="mode-switch">
            <ElRadioGroup v-model="editMode" size="default">
              <ElRadioButton label="form">
                <Edit :size="14" />
                表单编辑
              </ElRadioButton>
              <ElRadioButton label="yaml">
                <FileText :size="14" />
                YAML 编辑
              </ElRadioButton>
            </ElRadioGroup>
          </div>

          <!-- 表单编辑 -->
          <div v-show="editMode === 'form'" class="form-content">
            <ElForm
              ref="formRef"
              :model="formData"
              :rules="formRules"
              label-width="140px"
              label-position="left"
            >
              <!-- 基础配置 -->
              <div class="section-header">
                <Database :size="16" />
                <span>基础配置</span>
              </div>

              <ElFormItem label="VPA 名称" prop="name">
                <ElInput v-model="formData.name" disabled />
              </ElFormItem>

              <ElFormItem label="命名空间">
                <ElInput :value="workspace?.namespace" disabled />
              </ElFormItem>

              <ElFormItem label="目标资源">
                <ElInput :value="targetResourceDisplay" disabled>
                  <template #prepend>{{ formData.targetRef.kind }}</template>
                </ElInput>
              </ElFormItem>

              <ElFormItem label="更新模式" prop="updateMode" required>
                <ElSelect v-model="formData.updateMode" placeholder="请选择更新模式">
                  <ElOption value="Off">
                    <div class="mode-option">
                      <span class="mode-label">Off - 仅推荐</span>
                      <span class="mode-desc">仅提供推荐值，不自动更新</span>
                    </div>
                  </ElOption>
                  <ElOption value="Initial">
                    <div class="mode-option">
                      <span class="mode-label">Initial - 创建时更新</span>
                      <span class="mode-desc">仅在 Pod 创建时应用推荐值</span>
                    </div>
                  </ElOption>
                  <ElOption value="Recreate">
                    <div class="mode-option">
                      <span class="mode-label">Recreate - 重启更新</span>
                      <span class="mode-desc">自动更新并重启 Pod</span>
                    </div>
                  </ElOption>
                  <ElOption value="Auto">
                    <div class="mode-option">
                      <span class="mode-label">Auto - 自动更新</span>
                      <span class="mode-desc">自动更新，可能会驱逐 Pod</span>
                    </div>
                  </ElOption>
                </ElSelect>
              </ElFormItem>

              <!-- 资源限制 -->
              <div class="section-header">
                <Settings :size="16" />
                <span>资源限制</span>
              </div>

              <ElFormItem label="CPU 最小值">
                <div class="resource-input">
                  <ElInputNumber
                    v-model="formData.minCpuNum"
                    :min="0"
                    placeholder="数值"
                    style="width: 120px"
                  />
                  <ElSelect v-model="formData.minCpuUnit" style="width: 80px">
                    <ElOption label="核" value="" />
                    <ElOption label="毫核" value="m" />
                  </ElSelect>
                </div>
              </ElFormItem>

              <ElFormItem label="CPU 最大值">
                <div class="resource-input">
                  <ElInputNumber
                    v-model="formData.maxCpuNum"
                    :min="0"
                    placeholder="数值"
                    style="width: 120px"
                  />
                  <ElSelect v-model="formData.maxCpuUnit" style="width: 80px">
                    <ElOption label="核" value="" />
                    <ElOption label="毫核" value="m" />
                  </ElSelect>
                </div>
              </ElFormItem>

              <ElFormItem label="内存最小值">
                <div class="resource-input">
                  <ElInputNumber
                    v-model="formData.minMemoryNum"
                    :min="0"
                    placeholder="数值"
                    style="width: 120px"
                  />
                  <ElSelect v-model="formData.minMemoryUnit" style="width: 80px">
                    <ElOption label="Ki" value="Ki" />
                    <ElOption label="Mi" value="Mi" />
                    <ElOption label="Gi" value="Gi" />
                  </ElSelect>
                </div>
              </ElFormItem>

              <ElFormItem label="内存最大值">
                <div class="resource-input">
                  <ElInputNumber
                    v-model="formData.maxMemoryNum"
                    :min="0"
                    placeholder="数值"
                    style="width: 120px"
                  />
                  <ElSelect v-model="formData.maxMemoryUnit" style="width: 80px">
                    <ElOption label="Ki" value="Ki" />
                    <ElOption label="Mi" value="Mi" />
                    <ElOption label="Gi" value="Gi" />
                  </ElSelect>
                </div>
              </ElFormItem>

              <!-- 控制策略 -->
              <div class="section-header">
                <TrendingUp :size="16" />
                <span>控制策略</span>
              </div>

              <ElFormItem label="受控资源">
                <ElCheckboxGroup v-model="formData.controlledResources">
                  <ElCheckbox label="cpu">CPU</ElCheckbox>
                  <ElCheckbox label="memory">内存</ElCheckbox>
                </ElCheckboxGroup>
              </ElFormItem>

              <ElFormItem label="受控值">
                <ElSelect v-model="formData.controlledValues" placeholder="请选择受控值">
                  <ElOption label="RequestsAndLimits - 请求和限制" value="RequestsAndLimits" />
                  <ElOption label="RequestsOnly - 仅请求" value="RequestsOnly" />
                </ElSelect>
              </ElFormItem>

              <!-- 操作按钮 -->
              <ElFormItem>
                <div class="form-actions">
                  <ElButton type="primary" size="large" :loading="submitting" @click="handleSubmit">
                    <Check :size="16" v-if="!submitting" />
                    {{ submitting ? '保存中...' : '保存更改' }}
                  </ElButton>
                  <ElButton size="large" @click="cancelEdit">
                    <X :size="16" />
                    取消
                  </ElButton>
                </div>
              </ElFormItem>
            </ElForm>
          </div>

          <!-- YAML 编辑 -->
          <div v-show="editMode === 'yaml'" class="yaml-content">
            <YamlEditorPro
              v-model="yamlContent"
              height="500px"
              :filename="`${formData.name}.yaml`"
              :readonly="false"
              :show-toolbar="true"
              :show-line-numbers="true"
              :show-status-bar="true"
              @change="handleYamlChange"
            />

            <div class="yaml-actions">
              <ElButton type="primary" size="large" :loading="submitting" @click="handleSubmit">
                <Check :size="16" v-if="!submitting" />
                {{ submitting ? '保存中...' : '保存更改' }}
              </ElButton>
              <ElButton size="large" @click="syncYamlToForm">
                <Upload :size="16" />
                导入到表单
              </ElButton>
              <ElButton size="large" @click="cancelEdit">
                <X :size="16" />
                取消
              </ElButton>
            </div>
          </div>
        </template>

        <!-- 查看模式 - 显示详情 🔥 修复：改为直接访问顶层字段 -->
        <template v-else>
          <!-- 基础信息 -->
          <div class="detail-card">
            <div class="card-header">
              <Database :size="16" />
              <span>基础信息</span>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">名称</span>
                <span class="info-value">{{ vpaDetail.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">命名空间</span>
                <span class="info-value">{{ vpaDetail.namespace }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">目标资源</span>
                <span class="info-value">
                  {{ vpaDetail.targetRef?.kind }}/{{ vpaDetail.targetRef?.name }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">更新模式</span>
                <ElTag :type="getUpdateModeTag(vpaDetail.updateMode)" size="small">
                  {{ vpaDetail.updateMode || 'Auto' }}
                </ElTag>
              </div>
            </div>
          </div>

          <!-- 资源推荐 🔥 修复：改为直接访问 recommendation 字段 -->
          <div
            v-if="
              vpaDetail.recommendation?.containerRecommendations &&
              vpaDetail.recommendation.containerRecommendations.length > 0
            "
            class="detail-card"
          >
            <div class="card-header">
              <TrendingUp :size="16" />
              <span>资源推荐</span>
            </div>
            <div class="recommendations-list">
              <div
                v-for="(rec, index) in vpaDetail.recommendation.containerRecommendations"
                :key="index"
                class="recommendation-item"
              >
                <div class="container-name">
                  <Box :size="14" />
                  <span>{{ rec.containerName }}</span>
                </div>
                <div class="recommendation-grid">
                  <div v-if="rec.target" class="rec-box target">
                    <div class="rec-label">推荐值 (Target)</div>
                    <div class="rec-values">
                      <div v-if="rec.target.cpu" class="rec-value">
                        <Cpu :size="14" />
                        <span>{{ rec.target.cpu }}</span>
                      </div>
                      <div v-if="rec.target.memory" class="rec-value">
                        <Database :size="14" />
                        <span>{{ rec.target.memory }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="rec.lowerBound" class="rec-box lower">
                    <div class="rec-label">下界 (Lower)</div>
                    <div class="rec-values">
                      <div v-if="rec.lowerBound.cpu" class="rec-value">
                        <Cpu :size="14" />
                        <span>{{ rec.lowerBound.cpu }}</span>
                      </div>
                      <div v-if="rec.lowerBound.memory" class="rec-value">
                        <Database :size="14" />
                        <span>{{ rec.lowerBound.memory }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="rec.upperBound" class="rec-box upper">
                    <div class="rec-label">上界 (Upper)</div>
                    <div class="rec-values">
                      <div v-if="rec.upperBound.cpu" class="rec-value">
                        <Cpu :size="14" />
                        <span>{{ rec.upperBound.cpu }}</span>
                      </div>
                      <div v-if="rec.upperBound.memory" class="rec-value">
                        <Database :size="14" />
                        <span>{{ rec.upperBound.memory }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 资源策略 🔥 修复：改为直接访问 resourcePolicy 字段 -->
          <div
            v-if="
              vpaDetail.resourcePolicy?.containerPolicies &&
              vpaDetail.resourcePolicy.containerPolicies.length > 0
            "
            class="detail-card"
          >
            <div class="card-header">
              <Settings :size="16" />
              <span>资源策略</span>
            </div>
            <div class="policies-list">
              <div
                v-for="(policy, index) in vpaDetail.resourcePolicy.containerPolicies"
                :key="index"
                class="policy-item"
              >
                <div class="policy-header">
                  <Box :size="14" />
                  <span>{{ policy.containerName }}</span>
                  <ElTag v-if="policy.mode" type="info" size="small">{{ policy.mode }}</ElTag>
                </div>
                <div class="policy-details">
                  <div v-if="policy.minAllowed" class="policy-row">
                    <span class="policy-label">最小限制：</span>
                    <span class="policy-value">
                      CPU: {{ policy.minAllowed.cpu || '-' }}, Memory:
                      {{ policy.minAllowed.memory || '-' }}
                    </span>
                  </div>
                  <div v-if="policy.maxAllowed" class="policy-row">
                    <span class="policy-label">最大限制：</span>
                    <span class="policy-value">
                      CPU: {{ policy.maxAllowed.cpu || '-' }}, Memory:
                      {{ policy.maxAllowed.memory || '-' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 右侧：配置建议（查看模式下也显示） -->
      <div class="info-section">
        <div class="info-card">
          <div class="info-title">
            <Info :size="16" />
            <span>{{ editing ? '配置建议' : 'VPA 说明' }}</span>
          </div>
          <div class="info-content">
            <div v-if="!editing" class="info-item">
              <div class="info-item-header">
                <Activity :size="14" class="icon-success" />
                <strong>工作原理</strong>
              </div>
              <p>
                VPA 分析 Pod 的历史资源使用情况（至少 24
                小时），计算出合理的资源请求值。根据更新模式，VPA 可以在 Pod
                创建时应用推荐值，或者通过驱逐 Pod 来更新现有 Pod 的资源配置。
              </p>
            </div>

            <div class="info-item">
              <div class="info-item-header">
                <CheckCircle :size="14" class="icon-success" />
                <strong>{{ editing ? '更新模式选择' : '推荐值说明' }}</strong>
              </div>
              <ul v-if="!editing">
                <li><strong>Target</strong>: VPA 推荐的目标资源请求值</li>
                <li><strong>Lower Bound</strong>: 推荐的最小资源请求值</li>
                <li><strong>Upper Bound</strong>: 推荐的最大资源请求值</li>
              </ul>
              <ul v-else>
                <li><strong>Off</strong>: 推荐初次使用，先观察推荐值</li>
                <li><strong>Initial</strong>: 适合稳定应用，仅在 Pod 创建时更新</li>
                <li><strong>Recreate/Auto</strong>: 会重启 Pod，谨慎使用</li>
              </ul>
            </div>

            <div class="info-item warning">
              <div class="info-item-header">
                <AlertTriangle :size="14" class="icon-warning" />
                <strong>注意事项</strong>
              </div>
              <ul>
                <li v-if="!editing">当前更新模式可能会导致 Pod 重启</li>
                <li>不要同时使用 VPA Auto 模式和 HPA</li>
                <li v-if="editing">Recreate/Auto 模式会导致服务中断</li>
                <li v-if="!editing">VPA 推荐值基于历史数据，可能不适用于突发流量</li>
              </ul>
            </div>

            <div v-if="editing" class="info-item">
              <div class="info-item-header">
                <Lightbulb :size="14" class="icon-info" />
                <strong>最佳实践</strong>
              </div>
              <ul>
                <li>VPA 需要至少 24 小时的历史数据</li>
                <li>定期检查 VPA 推荐值是否合理</li>
                <li>生产环境建议使用 Initial 或 Off 模式</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- YAML 查看弹窗 🔥 修复：文件名字段引用 -->
    <ElDialog v-model="yamlViewVisible" title="VPA YAML" width="900px">
      <YamlEditorPro
        v-model="yamlViewContent"
        height="600px"
        :filename="`${vpaDetail?.name || 'vpa'}.yaml`"
        :readonly="true"
        :show-toolbar="true"
        :show-line-numbers="true"
        :show-status-bar="true"
      />
      <template #footer>
        <ElButton @click="yamlViewVisible = false">关闭</ElButton>
        <ElButton type="primary" @click="copyYaml">
          <Copy :size="16" />
          复制 YAML
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onActivated } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    Edit,
    FileText,
    Zap,
    Database,
    Settings,
    TrendingUp,
    Info,
    CheckCircle,
    AlertTriangle,
    Check,
    RotateCcw,
    Trash2,
    Upload,
    Copy,
    X,
    Box,
    Cpu,
    HelpCircle,
    Lightbulb,
    Activity
  } from 'lucide-vue-next'
  import * as yaml from 'js-yaml'
  import {
    getVPADetailApi,
    getVPAYamlApi,
    createVPAApi,
    updateVPAApi,
    deleteVPAApi,
    type OnecProjectVersion,
    type OnecProjectApplication,
    type ProjectWorkspace
  } from '@/api'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'

  defineOptions({ name: 'VPAManagement' })

  // VPA 类型定义
  interface VPASpec {
    targetRef: {
      apiVersion: string
      kind: string
      name: string
    }
    updatePolicy?: {
      updateMode?: string
    }
    resourcePolicy?: {
      containerPolicies?: Array<{
        containerName: string
        mode?: string
        minAllowed?: {
          cpu?: string
          memory?: string
        }
        maxAllowed?: {
          cpu?: string
          memory?: string
        }
        controlledResources?: string[]
        controlledValues?: string
      }>
    }
  }

  interface VPAStatus {
    recommendation?: {
      containerRecommendations?: Array<{
        containerName: string
        target?: {
          cpu?: string
          memory?: string
        }
        lowerBound?: {
          cpu?: string
          memory?: string
        }
        upperBound?: {
          cpu?: string
          memory?: string
        }
      }>
    }
  }

  interface VPA {
    apiVersion: string
    kind: string
    metadata?: {
      name: string
      namespace: string
    }
    spec?: VPASpec
    status?: VPAStatus
  }

  interface Props {
    version: OnecProjectVersion
    application: OnecProjectApplication
    workspace: ProjectWorkspace
    resourceType: string
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  // 表单数据结构
  interface VPAFormData {
    name: string
    targetRef: {
      apiVersion: string
      kind: string
      name: string
    }
    updateMode: string
    minCpuNum: number
    minCpuUnit: string
    maxCpuNum: number
    maxCpuUnit: string
    minMemoryNum: number
    minMemoryUnit: string
    maxMemoryNum: number
    maxMemoryUnit: string
    controlledResources: string[]
    controlledValues: string
  }

  // 状态管理
  const initialLoading = ref(false)
  const deleting = ref(false)
  const submitting = ref(false)
  const editing = ref(false)
  const vpaDetail = ref<VPA | null>(null)

  const editMode = ref<'form' | 'yaml'>('form')
  const yamlContent = ref('')

  const yamlViewVisible = ref(false)
  const yamlViewContent = ref('')

  // 表单相关
  const formRef = ref<FormInstance>()
  const formData = ref<VPAFormData>({
    name: '',
    targetRef: {
      apiVersion: 'apps/v1',
      kind: '',
      name: ''
    },
    updateMode: 'Off',
    minCpuNum: 100,
    minCpuUnit: 'm',
    maxCpuNum: 2,
    maxCpuUnit: '',
    minMemoryNum: 128,
    minMemoryUnit: 'Mi',
    maxMemoryNum: 2,
    maxMemoryUnit: 'Gi',
    controlledResources: ['cpu', 'memory'],
    controlledValues: 'RequestsAndLimits'
  })

  const formRules: FormRules = {
    name: [{ required: true, message: '请输入 VPA 名称', trigger: 'blur' }],
    updateMode: [{ required: true, message: '请选择更新模式', trigger: 'change' }]
  }

  // 计算属性
  const targetResourceDisplay = computed(() => {
    return formData.value.targetRef.name || props.version?.resourceName || '未知'
  })

  // 🔥 工具函数：解析资源值（如 "500m" -> { value: 500, unit: "m" }）
  const parseResourceValue = (
    value: string | undefined,
    type: 'cpu' | 'memory'
  ): { value: number; unit: string } => {
    if (!value) {
      return {
        value: type === 'cpu' ? 100 : 128,
        unit: type === 'cpu' ? 'm' : 'Mi'
      }
    }

    const str = String(value).trim()

    if (type === 'cpu') {
      // CPU: 支持 m（毫核）或空（核）
      if (str.endsWith('m')) {
        const num = parseFloat(str.slice(0, -1))
        return { value: isNaN(num) ? 100 : num, unit: 'm' }
      } else {
        const num = parseFloat(str)
        return { value: isNaN(num) ? 0.1 : num, unit: '' }
      }
    } else {
      // 内存: 支持 Ki, Mi, Gi
      if (str.endsWith('Gi')) {
        const num = parseFloat(str.slice(0, -2))
        return { value: isNaN(num) ? 1 : num, unit: 'Gi' }
      } else if (str.endsWith('Mi')) {
        const num = parseFloat(str.slice(0, -2))
        return { value: isNaN(num) ? 128 : num, unit: 'Mi' }
      } else if (str.endsWith('Ki')) {
        const num = parseFloat(str.slice(0, -2))
        return { value: isNaN(num) ? 128 : num, unit: 'Ki' }
      } else {
        // 纯数字，默认按 Mi 处理
        const num = parseFloat(str)
        return { value: isNaN(num) ? 128 : num, unit: 'Mi' }
      }
    }
  }

  // 🔥 工具函数：拼装资源值（如 { value: 100, unit: "m" } -> "100m"）
  const formatResourceValue = (value: number, unit: string): string => {
    if (!value && value !== 0) return ''
    return `${value}${unit}`
  }

  // 初始化表单数据
  const initFormData = () => {
    const resourceKind =
      props.application?.resourceType?.charAt(0).toUpperCase() +
      props.application?.resourceType?.slice(1)

    formData.value = {
      name: `${props.version?.resourceName || 'app'}-vpa`,
      targetRef: {
        apiVersion: 'apps/v1',
        kind: resourceKind || 'Deployment',
        name: props.version?.resourceName || ''
      },
      updateMode: 'Off',
      minCpuNum: 100,
      minCpuUnit: 'm',
      maxCpuNum: 2,
      maxCpuUnit: '',
      minMemoryNum: 128,
      minMemoryUnit: 'Mi',
      maxMemoryNum: 2,
      maxMemoryUnit: 'Gi',
      controlledResources: ['cpu', 'memory'],
      controlledValues: 'RequestsAndLimits'
    }
  }

  // 表单转 VPA 对象
  const formToVPA = (): VPA => {
    return {
      apiVersion: 'autoscaling.k8s.io/v1',
      kind: 'VerticalPodAutoscaler',
      metadata: {
        name: formData.value.name,
        namespace: props.workspace?.namespace
      },
      spec: {
        targetRef: formData.value.targetRef,
        updatePolicy: {
          updateMode: formData.value.updateMode
        },
        resourcePolicy: {
          containerPolicies: [
            {
              containerName: '*',
              minAllowed: {
                // 🔥 拼装资源值
                cpu: formatResourceValue(formData.value.minCpuNum, formData.value.minCpuUnit),
                memory: formatResourceValue(
                  formData.value.minMemoryNum,
                  formData.value.minMemoryUnit
                )
              },
              maxAllowed: {
                // 🔥 拼装资源值
                cpu: formatResourceValue(formData.value.maxCpuNum, formData.value.maxCpuUnit),
                memory: formatResourceValue(
                  formData.value.maxMemoryNum,
                  formData.value.maxMemoryUnit
                )
              },
              controlledResources: formData.value.controlledResources,
              controlledValues: formData.value.controlledValues
            }
          ]
        }
      }
    }
  }

  // VPA 对象转表单
  const vpaToForm = (vpa: VPA) => {
    const policy = vpa.spec?.resourcePolicy?.containerPolicies?.[0]

    // 🔥 解析资源值
    const minCpu = parseResourceValue(policy?.minAllowed?.cpu, 'cpu')
    const maxCpu = parseResourceValue(policy?.maxAllowed?.cpu, 'cpu')
    const minMemory = parseResourceValue(policy?.minAllowed?.memory, 'memory')
    const maxMemory = parseResourceValue(policy?.maxAllowed?.memory, 'memory')

    formData.value = {
      name: vpa.metadata?.name || '',
      targetRef: {
        apiVersion: vpa.spec?.targetRef?.apiVersion || 'apps/v1',
        kind: vpa.spec?.targetRef?.kind || '',
        name: vpa.spec?.targetRef?.name || ''
      },
      updateMode: vpa.spec?.updatePolicy?.updateMode || 'Off',
      minCpuNum: minCpu.value,
      minCpuUnit: minCpu.unit,
      maxCpuNum: maxCpu.value,
      maxCpuUnit: maxCpu.unit,
      minMemoryNum: minMemory.value,
      minMemoryUnit: minMemory.unit,
      maxMemoryNum: maxMemory.value,
      maxMemoryUnit: maxMemory.unit,
      controlledResources: policy?.controlledResources || ['cpu', 'memory'],
      controlledValues: policy?.controlledValues || 'RequestsAndLimits'
    }
  }

  // 同步表单到 YAML
  const syncFormToYaml = () => {
    const vpa = formToVPA()
    yamlContent.value = yaml.dump(vpa, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    })
  }

  // 同步 YAML 到表单 - 修复 namespace 和 targetRef
  const syncYamlToForm = () => {
    try {
      let parsed = yaml.load(yamlContent.value) as VPA

      // 🔥 强制修复 namespace
      if (!parsed.metadata) {
        parsed.metadata = { name: '', namespace: '' }
      }
      parsed.metadata.namespace = props.workspace?.namespace

      // 🔥 强制修复 targetRef
      if (!parsed.spec) {
        parsed.spec = {} as VPASpec
      }
      parsed.spec.targetRef = {
        apiVersion: 'apps/v1',
        kind:
          props.application?.resourceType?.charAt(0).toUpperCase() +
          props.application?.resourceType?.slice(1),
        name: props.version?.resourceName || ''
      }

      // 更新 YAML 内容
      yamlContent.value = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      })

      vpaToForm(parsed)
      editMode.value = 'form'
      ElMessage.success('✅ 已导入到表单（namespace 和 targetRef 已自动修复）')
    } catch (error: any) {}
  }

  // 处理 YAML 变化
  const handleYamlChange = (value: string) => {
    yamlContent.value = value
  }

  // 加载 VPA 详情
  const loadVPADetail = async () => {
    if (!props.version?.id) {
      console.warn('[VPA 管理] 版本ID不存在，跳过加载')
      return
    }

    initialLoading.value = true
    try {
      const detail = await getVPADetailApi({ versionId: props.version.id })
      vpaDetail.value = detail
    } catch (error: any) {
      console.error('[VPA 管理] 加载失败:', error)
      if (error?.response?.status !== 404) {
      }
      vpaDetail.value = null
    } finally {
      initialLoading.value = false
    }
  }

  // 开始编辑
  const startEdit = async () => {
    if (!props.version?.id || !vpaDetail.value) return

    try {
      const yamlStr = await getVPAYamlApi({ versionId: props.version.id })
      const parsed = yaml.load(yamlStr) as VPA

      vpaToForm(parsed)
      syncFormToYaml()
      editing.value = true
      editMode.value = 'form'
    } catch (error) {
      console.error('[VPA 管理] 获取 YAML 失败:', error)
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    editing.value = false
    editMode.value = 'form'
    formRef.value?.resetFields()
  }

  // 查看 YAML
  const viewYaml = async () => {
    if (!props.version?.id) return

    try {
      const yamlStr = await getVPAYamlApi({ versionId: props.version.id })
      yamlViewContent.value = yamlStr
      yamlViewVisible.value = true
    } catch (error) {
      console.error('[VPA 管理] 获取 YAML 失败:', error)
    }
  }

  // 复制 YAML
  const copyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yamlViewContent.value)
      ElMessage.success('📋 已复制到剪贴板')
    } catch {}
  }

  // 重置表单
  const handleReset = () => {
    if (vpaDetail.value) {
      vpaToForm(vpaDetail.value)
      syncFormToYaml()
    } else {
      initFormData()
      syncFormToYaml()
    }
    ElMessage.info('已重置')
  }

  // 提交
  const handleSubmit = async () => {
    if (!props.version?.id) {
      return
    }

    let yamlStr = ''

    if (editMode.value === 'form') {
      if (!formRef.value) return

      try {
        await formRef.value.validate()
        syncFormToYaml()
        yamlStr = yamlContent.value
      } catch {
        return
      }
    } else {
      if (!yamlContent.value.trim()) {
        return
      }

      // 🔥 修复 YAML 中的 namespace 和 targetRef
      try {
        let parsed = yaml.load(yamlContent.value) as VPA

        if (!parsed.metadata) {
          parsed.metadata = { name: '', namespace: '' }
        }
        parsed.metadata.namespace = props.workspace?.namespace

        if (!parsed.spec) {
          parsed.spec = {} as VPASpec
        }
        parsed.spec.targetRef = {
          apiVersion: 'apps/v1',
          kind:
            props.application?.resourceType?.charAt(0).toUpperCase() +
            props.application?.resourceType?.slice(1),
          name: props.version?.resourceName || ''
        }

        yamlStr = yaml.dump(parsed, {
          indent: 2,
          lineWidth: -1,
          noRefs: true
        })
      } catch (error: any) {
        return
      }
    }

    submitting.value = true
    try {
      if (!vpaDetail.value) {
        await createVPAApi({
          versionId: props.version.id,
          vpaYamlStr: yamlStr
        })
        ElMessage.success('✅ VPA 创建成功')
      } else {
        await updateVPAApi({
          versionId: props.version.id,
          vpaYamlStr: yamlStr
        })
        ElMessage.success('✅ VPA 更新成功')
      }

      editing.value = false
      emit('success')
      await loadVPADetail()
    } catch (error) {
      console.error('[VPA 管理] 提交失败:', error)
    } finally {
      submitting.value = false
    }
  }

  // 删除
  const handleDelete = async () => {
    try {
      await ElMessageBox.confirm('确定要删除 VPA 配置吗？删除后将停止自动资源调整。', '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      })

      if (!props.version?.id) {
        return
      }

      deleting.value = true
      await deleteVPAApi({ versionId: props.version.id })
      ElMessage.success('✅ VPA 删除成功')
      vpaDetail.value = null
      emit('success')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('[VPA 管理] 删除失败:', error)
      }
    } finally {
      deleting.value = false
    }
  }

  // 获取更新模式标签
  const getUpdateModeTag = (mode?: string) => {
    const tagMap: Record<string, string> = {
      Off: 'info',
      Initial: 'success',
      Recreate: 'warning',
      Auto: 'danger'
    }
    return tagMap[mode || 'Auto'] || 'info'
  }

  // 监听编辑模式切换
  watch(editMode, (newMode) => {
    if (newMode === 'yaml') {
      syncFormToYaml()
    }
  })

  // 监听刷新触发器
  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        loadVPADetail()
      }
    }
  )

  onMounted(() => {
    initFormData()
    syncFormToYaml()
    loadVPADetail()
  })

  onActivated(() => {
    loadVPADetail()
  })

  defineExpose({
    hasData: () => vpaDetail.value !== null,
    hasUnsavedChanges: () => editing.value,
    refresh: loadVPADetail
  })
</script>

<style scoped lang="scss">
  .vpa-management-container {
    height: 100%;
    background: #fff;

    .loading-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    // 左右布局
    .content-layout {
      display: flex;
      height: 100%;
      gap: 24px;

      // 左侧表单区域
      .form-section {
        flex: 1;
        padding: 20px 24px;
        overflow-y: auto;
        min-width: 0;

        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--el-border-color-lighter);

          .status-left {
            :deep(.el-tag) {
              padding: 8px 16px;
              font-size: 14px;
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
          }

          .status-right {
            display: flex;
            gap: 8px;
          }
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 20px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:first-child {
            margin-top: 0;
          }
        }

        .mode-switch {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;

          :deep(.el-radio-button__inner) {
            display: flex;
            align-items: center;
            gap: 6px;
          }
        }

        .form-content {
          .label-help-icon {
            margin-left: 6px;
            color: var(--el-text-color-secondary);
            cursor: help;
            vertical-align: middle;

            &:hover {
              color: var(--el-color-primary);
            }
          }

          .resource-input {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .mode-option {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .mode-label {
              font-weight: 600;
              color: var(--el-text-color-primary);
            }

            .mode-desc {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }

          .form-actions {
            display: flex;
            gap: 12px;
            padding-top: 8px;

            :deep(.el-button) {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
          }
        }

        .yaml-content {
          .yaml-actions {
            display: flex;
            gap: 12px;
            margin-top: 16px;

            :deep(.el-button) {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
          }
        }

        .detail-card {
          margin-bottom: 16px;
          padding: 20px;
          background: var(--el-fill-color-lighter);
          border-radius: 8px;
          border: 1px solid var(--el-border-color);

          .card-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--el-border-color-lighter);
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;

            .info-item {
              display: flex;
              flex-direction: column;
              gap: 6px;

              .info-label {
                font-size: 12px;
                color: var(--el-text-color-secondary);
              }

              .info-value {
                font-size: 14px;
                font-weight: 500;
                color: var(--el-text-color-primary);
              }
            }
          }

          .recommendations-list,
          .policies-list {
            display: flex;
            flex-direction: column;
            gap: 16px;

            .recommendation-item,
            .policy-item {
              padding: 16px;
              background: white;
              border-radius: 6px;
              border: 1px solid var(--el-border-color-lighter);

              .container-name,
              .policy-header {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--el-border-color-lighter);
              }

              .recommendation-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 12px;

                .rec-box {
                  padding: 12px;
                  border-radius: 6px;
                  border: 2px solid;

                  &.target {
                    background: var(--el-color-primary-light-9);
                    border-color: var(--el-color-primary);
                  }

                  &.lower {
                    background: var(--el-color-success-light-9);
                    border-color: var(--el-color-success);
                  }

                  &.upper {
                    background: var(--el-color-warning-light-9);
                    border-color: var(--el-color-warning);
                  }

                  .rec-label {
                    font-size: 12px;
                    color: var(--el-text-color-secondary);
                    margin-bottom: 8px;
                    font-weight: 500;
                  }

                  .rec-values {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;

                    .rec-value {
                      display: flex;
                      align-items: center;
                      gap: 6px;
                      font-size: 13px;
                      color: var(--el-text-color-primary);
                      font-weight: 600;
                    }
                  }
                }
              }

              .policy-details {
                display: flex;
                flex-direction: column;
                gap: 8px;

                .policy-row {
                  font-size: 13px;
                  color: var(--el-text-color-regular);

                  .policy-label {
                    color: var(--el-text-color-secondary);
                    font-weight: 500;
                  }

                  .policy-value {
                    font-weight: 500;
                    color: var(--el-text-color-primary);
                  }
                }
              }
            }
          }
        }
      }

      // 右侧信息区域
      .info-section {
        width: 360px;
        padding: 20px 24px 20px 0;
        flex-shrink: 0;
        overflow-y: auto;

        .create-alert {
          margin-bottom: 20px;

          .alert-content {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
          }

          p {
            margin: 4px 0;
            line-height: 1.6;
          }
        }

        .info-card {
          background: var(--el-fill-color-lighter);
          border-radius: 8px;
          border: 1px solid var(--el-border-color);
          padding: 20px;

          .info-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--el-border-color-lighter);
          }

          .info-content {
            display: flex;
            flex-direction: column;
            gap: 16px;

            .info-item {
              padding: 12px;
              background: white;
              border-radius: 6px;
              border: 1px solid var(--el-border-color-lighter);

              &.warning {
                background: var(--el-color-warning-light-9);
                border-color: var(--el-color-warning-light-5);
              }

              .info-item-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;

                .icon-success {
                  color: var(--el-color-success);
                }

                .icon-warning {
                  color: var(--el-color-warning);
                }

                .icon-info {
                  color: var(--el-color-primary);
                }

                strong {
                  font-size: 13px;
                  color: var(--el-text-color-primary);
                }
              }

              p {
                margin: 0;
                font-size: 12px;
                line-height: 1.6;
                color: var(--el-text-color-regular);
              }

              ul {
                margin: 0;
                padding-left: 20px;
                font-size: 12px;
                line-height: 1.6;
                color: var(--el-text-color-regular);

                li {
                  margin: 4px 0;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
