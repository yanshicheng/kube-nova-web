<template>
  <div class="scheduling-step">
    <ElTabs v-model="activeTab" class="scheduling-tabs">
      <!-- 节点选择 -->
      <ElTabPane name="node">
        <template #label>
          <div class="tab-label">
            <Server :size="14" />
            <span>节点选择</span>
          </div>
        </template>

        <div class="tab-content">
          <ElForm label-width="120px">
            <ElFormItem label="调度方式">
              <ElRadioGroup
                v-model="schedulingStore.nodeSchedulingMode"
                @change="handleSchedulingModeChange"
              >
                <ElRadioButton value="auto">
                  <Zap :size="14" style="margin-right: 4px" />
                  自动调度
                </ElRadioButton>
                <ElRadioButton value="nodeName">
                  <Target :size="14" style="margin-right: 4px" />
                  指定节点
                </ElRadioButton>
                <ElRadioButton value="nodeSelector">
                  <Filter :size="14" style="margin-right: 4px" />
                  标签选择
                </ElRadioButton>
              </ElRadioGroup>
              <div class="mode-hint">
                <Info :size="12" />
                <span v-if="schedulingStore.nodeSchedulingMode === 'auto'"
                  >由调度器自动选择最佳节点</span
                >
                <span v-if="schedulingStore.nodeSchedulingMode === 'nodeName'"
                  >直接指定节点名称,绕过调度器</span
                >
                <span v-if="schedulingStore.nodeSchedulingMode === 'nodeSelector'"
                  >通过节点标签筛选候选节点</span
                >
              </div>
            </ElFormItem>

            <!-- 指定节点名称 -->
            <template v-if="schedulingStore.nodeSchedulingMode === 'nodeName'">
              <ElFormItem label="选择节点" required>
                <ElSelect
                  v-model="schedulingStore.nodeName"
                  placeholder="选择目标节点"
                  filterable
                  :loading="loadingNodes"
                  @focus="loadNodes"
                  @change="emitValidation"
                >
                  <ElOption
                    v-for="node in availableNodes"
                    :key="node.name"
                    :label="node.name"
                    :value="node.name"
                  >
                    <div class="node-option">
                      <div class="node-info">
                        <span class="node-name">{{ node.name }}</span>
                        <ElTag size="small" :type="node.status === 'Ready' ? 'success' : 'danger'">
                          {{ node.status }}
                        </ElTag>
                      </div>
                      <div class="node-meta">
                        <span class="node-label">{{ node.role }}</span>
                        <span class="node-resources">{{ node.cpu }} CPU / {{ node.memory }}</span>
                      </div>
                    </div>
                  </ElOption>
                  <template #empty>
                    <div style="padding: 20px; text-align: center; color: #909399">
                      <div v-if="!clusterUuidRef?.value">请先选择集群</div>
                      <div v-else-if="loadingNodes">加载中...</div>
                      <div v-else>暂无可用节点</div>
                    </div>
                  </template>
                </ElSelect>
              </ElFormItem>

              <ElAlert type="warning" :closable="false" show-icon>
                <template #title>
                  <AlertTriangle :size="14" />
                  直接指定节点会绕过调度器，如果节点不可用Pod将无法启动
                </template>
              </ElAlert>
            </template>

            <!-- 节点选择器 -->
            <template v-if="schedulingStore.nodeSchedulingMode === 'nodeSelector'">
              <ElFormItem label="节点标签">
                <div class="label-selectors">
                  <div class="selector-header">
                    <ElButton type="primary" size="small" @click="openNodeSelectorForNodeSelector">
                      <Server :size="14" />
                      从节点选择标签
                    </ElButton>
                  </div>

                  <div v-for="(selector, index) in nodeSelectors" :key="index" class="selector-row">
                    <ElSelect
                      v-model="selector.key"
                      placeholder="标签键"
                      filterable
                      allow-create
                      style="width: 200px"
                      @change="handleNodeSelectorChange"
                    >
                      <ElOption
                        v-for="label in commonNodeLabels"
                        :key="label.key"
                        :label="label.key"
                        :value="label.key"
                      >
                        <div style="display: flex; justify-content: space-between">
                          <span>{{ label.key }}</span>
                          <ElTag size="small" type="info">{{ label.description }}</ElTag>
                        </div>
                      </ElOption>
                    </ElSelect>
                    <span class="equals">=</span>
                    <ElInput
                      v-model="selector.value"
                      placeholder="标签值"
                      style="width: 200px"
                      @change="handleNodeSelectorChange"
                    />
                    <ElButton
                      type="danger"
                      :icon="Trash2"
                      circle
                      @click="removeNodeSelector(index)"
                    />
                  </div>
                  <ElButton @click="addNodeSelector" size="small">
                    <Plus :size="14" />
                    添加标签
                  </ElButton>
                </div>

                <!-- 显示验证错误 -->
                <div v-if="nodeSelectorErrors.length > 0" class="error-tips">
                  <ElAlert type="error" :closable="false">
                    <ul style="margin: 0; padding-left: 20px">
                      <li v-for="(error, idx) in nodeSelectorErrors" :key="idx">{{ error }}</li>
                    </ul>
                  </ElAlert>
                </div>
              </ElFormItem>
            </template>
          </ElForm>
        </div>
      </ElTabPane>

      <!-- 节点亲和性 -->
      <ElTabPane name="nodeAffinity">
        <template #label>
          <div class="tab-label">
            <Magnet :size="14" />
            <span>节点亲和性</span>
            <ElBadge
              v-if="getNodeAffinityCount() > 0"
              :value="getNodeAffinityCount()"
              type="primary"
            />
          </div>
        </template>

        <div class="tab-content">
          <div class="affinity-section">
            <!-- 必须满足规则 -->
            <div class="affinity-group">
              <div class="group-header">
                <h4>
                  <ShieldCheck :size="16" />
                  必须满足的条件 (Required)
                </h4>
                <ElButton type="primary" size="small" @click="addNodeAffinityRule('required')">
                  <Plus :size="14" />
                  添加规则
                </ElButton>
              </div>
              <div class="group-desc">Pod 必须调度到满足所有条件的节点上</div>

              <div v-if="nodeAffinityRequired.length === 0" class="empty-rules">
                <ElEmpty description="暂无必须满足的规则" :image-size="60" />
              </div>

              <div v-else class="rules-list">
                <div v-for="(rule, index) in nodeAffinityRequired" :key="index" class="rule-item">
                  <div class="rule-content-wrapper">
                    <!-- 第一行：快速选择 + 标签键 -->
                    <div class="rule-row">
                      <ElSelect
                        v-model="rule.key"
                        placeholder="快速选择常用标签"
                        filterable
                        clearable
                        style="flex: 1; max-width: 400px"
                        @change="updateNodeAffinity"
                      >
                        <ElOptionGroup label="常用节点标签">
                          <ElOption
                            v-for="label in commonNodeLabels"
                            :key="label.key"
                            :label="`${label.key} (${label.description})`"
                            :value="label.key"
                          />
                        </ElOptionGroup>
                        <ElOptionGroup label="从节点加载标签" v-if="selectedNodeForLabels">
                          <ElOption
                            v-for="label in nodeLabelsFromSelected"
                            :key="label.key"
                            :label="`${label.key} = ${label.value}`"
                            :value="label.key"
                          >
                            <div class="label-option">
                              <code>{{ label.key }}</code>
                              <span class="label-value">{{ label.value }}</span>
                            </div>
                          </ElOption>
                        </ElOptionGroup>
                      </ElSelect>
                      <ElButton
                        type="primary"
                        size="small"
                        @click="openNodeSelectorDialog('nodeAffinity', 'required', index)"
                      >
                        <Server :size="14" />
                        从节点选择
                      </ElButton>
                    </div>

                    <!-- 第二行：操作符 + 值 -->
                    <div class="rule-row">
                      <ElSelect
                        v-model="rule.operator"
                        style="width: 160px"
                        @change="updateNodeAffinity"
                      >
                        <ElOption label="In (包含)" value="In" />
                        <ElOption label="NotIn (不包含)" value="NotIn" />
                        <ElOption label="Exists (存在)" value="Exists" />
                        <ElOption label="DoesNotExist (不存在)" value="DoesNotExist" />
                        <ElOption label="Gt (大于)" value="Gt" />
                        <ElOption label="Lt (小于)" value="Lt" />
                      </ElSelect>
                      <ElInput
                        v-if="['In', 'NotIn', 'Gt', 'Lt'].includes(rule.operator)"
                        v-model="rule.values"
                        placeholder="值(逗号分隔)"
                        style="flex: 1"
                        @change="updateNodeAffinity"
                      />
                    </div>
                  </div>
                  <ElButton
                    type="danger"
                    :icon="Trash2"
                    circle
                    size="small"
                    @click="removeNodeAffinityRule('required', index)"
                  />
                </div>
              </div>
            </div>

            <ElDivider />

            <!-- 优先满足规则 -->
            <div class="affinity-group">
              <div class="group-header">
                <h4>
                  <Star :size="16" />
                  优先满足的条件 (Preferred)
                </h4>
                <ElButton type="success" size="small" @click="addNodeAffinityRule('preferred')">
                  <Plus :size="14" />
                  添加规则
                </ElButton>
              </div>
              <div class="group-desc">调度器会优先选择满足这些条件的节点，但不强制</div>

              <div v-if="nodeAffinityPreferred.length === 0" class="empty-rules">
                <ElEmpty description="暂无优先满足的规则" :image-size="60" />
              </div>

              <div v-else class="rules-list">
                <div v-for="(rule, index) in nodeAffinityPreferred" :key="index" class="rule-item">
                  <div class="rule-weight">
                    <label>权重:</label>
                    <ElInputNumber
                      v-model="rule.weight"
                      :min="1"
                      :max="100"
                      size="small"
                      style="width: 90px"
                      @change="updateNodeAffinity"
                    />
                  </div>
                  <div class="rule-content-wrapper">
                    <!-- 第一行：快速选择 + 标签键 -->
                    <div class="rule-row">
                      <ElSelect
                        v-model="rule.key"
                        placeholder="快速选择常用标签"
                        filterable
                        clearable
                        style="flex: 1; max-width: 380px"
                        @change="updateNodeAffinity"
                      >
                        <ElOptionGroup label="常用节点标签">
                          <ElOption
                            v-for="label in commonNodeLabels"
                            :key="label.key"
                            :label="`${label.key} (${label.description})`"
                            :value="label.key"
                          />
                        </ElOptionGroup>
                        <ElOptionGroup label="从节点加载标签" v-if="selectedNodeForLabels">
                          <ElOption
                            v-for="label in nodeLabelsFromSelected"
                            :key="label.key"
                            :label="`${label.key} = ${label.value}`"
                            :value="label.key"
                          >
                            <div class="label-option">
                              <code>{{ label.key }}</code>
                              <span class="label-value">{{ label.value }}</span>
                            </div>
                          </ElOption>
                        </ElOptionGroup>
                      </ElSelect>
                      <ElButton
                        type="primary"
                        size="small"
                        @click="openNodeSelectorDialog('nodeAffinity', 'preferred', index)"
                      >
                        <Server :size="14" />
                        从节点选择
                      </ElButton>
                    </div>

                    <!-- 第二行：操作符 + 值 -->
                    <div class="rule-row">
                      <ElSelect
                        v-model="rule.operator"
                        style="width: 160px"
                        @change="updateNodeAffinity"
                      >
                        <ElOption label="In (包含)" value="In" />
                        <ElOption label="NotIn (不包含)" value="NotIn" />
                        <ElOption label="Exists (存在)" value="Exists" />
                        <ElOption label="DoesNotExist (不存在)" value="DoesNotExist" />
                      </ElSelect>
                      <ElInput
                        v-if="['In', 'NotIn'].includes(rule.operator)"
                        v-model="rule.values"
                        placeholder="值(逗号分隔)"
                        style="flex: 1"
                        @change="updateNodeAffinity"
                      />
                    </div>
                  </div>
                  <ElButton
                    type="danger"
                    :icon="Trash2"
                    circle
                    size="small"
                    @click="removeNodeAffinityRule('preferred', index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElTabPane>

      <!-- Pod 亲和性/反亲和性 -->
      <ElTabPane name="podAffinity">
        <template #label>
          <div class="tab-label">
            <Users :size="14" />
            <span>Pod 亲和性</span>
            <ElBadge v-if="podAffinities.length > 0" :value="podAffinities.length" type="success" />
          </div>
        </template>

        <div class="tab-content">
          <!-- 自定义亲和性规则 -->
          <div class="custom-affinities">
            <div class="section-header">
              <h4>Pod 亲和性规则</h4>
              <ElButton type="primary" size="small" @click="openAddPodAffinityDialog">
                <Plus :size="14" />
                添加规则
              </ElButton>
            </div>

            <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 16px">
              <template #title>配置说明</template>
              <p style="margin: 4px 0 0; font-size: 12px">
                亲和性：Pod 优先/必须调度到符合条件的 Pod 所在节点<br />
                反亲和性：Pod 优先/必须避开符合条件的 Pod 所在节点，常用于高可用部署
              </p>
            </ElAlert>

            <div v-if="podAffinities.length === 0" class="empty-rules">
              <ElEmpty description="暂无亲和性规则" :image-size="60">
                <ElButton type="primary" @click="openAddPodAffinityDialog">
                  <Plus :size="14" />
                  添加第一个规则
                </ElButton>
              </ElEmpty>
            </div>

            <div v-else class="affinity-cards">
              <div v-for="(affinity, index) in podAffinities" :key="index" class="affinity-card">
                <div class="card-header">
                  <div class="card-tags">
                    <ElTag
                      :type="affinity.type === 'affinity' ? 'success' : 'danger'"
                      effect="dark"
                    >
                      {{ affinity.type === 'affinity' ? '亲和性' : '反亲和性' }}
                    </ElTag>
                    <ElTag :type="affinity.ruleType === 'required' ? 'warning' : 'info'">
                      {{ affinity.ruleType === 'required' ? '必须满足' : '优先满足' }}
                    </ElTag>
                  </div>
                  <div class="card-actions">
                    <ElButton
                      type="primary"
                      :icon="Edit2"
                      circle
                      size="small"
                      @click="editPodAffinity(index)"
                    />
                    <ElButton
                      type="danger"
                      :icon="Trash2"
                      circle
                      size="small"
                      @click="removePodAffinity(index)"
                    />
                  </div>
                </div>
                <div class="card-body">
                  <div class="affinity-info">
                    <div class="info-row">
                      <label>拓扑键:</label>
                      <code>{{ affinity.topologyKey }}</code>
                    </div>
                    <div class="info-row">
                      <label>标签选择:</label>
                      <div class="label-tags">
                        <ElTag
                          v-for="label in affinity.selectedLabels"
                          :key="label"
                          size="small"
                          type="primary"
                        >
                          {{ label }}
                        </ElTag>
                      </div>
                    </div>
                    <div class="info-row" v-if="affinity.ruleType === 'preferred'">
                      <label>权重:</label>
                      <ElTag size="small">{{ affinity.weight }}</ElTag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElTabPane>

      <!-- 污点容忍 -->
      <ElTabPane name="tolerations">
        <template #label>
          <div class="tab-label">
            <ShieldOff :size="14" />
            <span>污点容忍</span>
            <ElBadge
              v-if="schedulingStore.tolerations.length > 0"
              :value="schedulingStore.tolerations.length"
              type="warning"
            />
          </div>
        </template>

        <div class="tab-content">
          <!-- 预设容忍 -->
          <div class="preset-section">
            <h4>
              <Zap :size="16" />
              快速添加常用容忍
            </h4>
            <div class="preset-grid">
              <div
                v-for="preset in presetTolerations"
                :key="preset.key + preset.effect"
                class="preset-card"
                @click="addPresetToleration(preset)"
              >
                <div class="preset-icon">
                  <component :is="preset.icon" :size="20" />
                </div>
                <div class="preset-info">
                  <div class="preset-name">{{ preset.name }}</div>
                  <div class="preset-desc">{{ preset.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <ElDivider />

          <!-- 自定义容忍 -->
          <div class="custom-tolerations">
            <div class="section-header">
              <h4>自定义容忍度</h4>
              <div class="header-actions">
                <ElButton type="success" size="small" @click="openNodeTaintDialog">
                  <Server :size="14" />
                  从节点选择污点
                </ElButton>
                <ElButton type="primary" size="small" @click="addToleration">
                  <Plus :size="14" />
                  手动添加
                </ElButton>
              </div>
            </div>

            <div v-if="schedulingStore.tolerations.length === 0" class="empty-rules">
              <ElEmpty description="暂无容忍配置" :image-size="60" />
            </div>

            <div v-else class="tolerations-list">
              <div
                v-for="(toleration, index) in schedulingStore.tolerations"
                :key="index"
                class="toleration-item"
              >
                <div class="toleration-content">
                  <ElInput
                    v-model="toleration.key"
                    placeholder="污点键"
                    style="width: 200px"
                    @change="emitValidation"
                  />
                  <ElSelect
                    v-model="toleration.operator"
                    style="width: 120px"
                    @change="emitValidation"
                  >
                    <ElOption label="Equal" value="Equal" />
                    <ElOption label="Exists" value="Exists" />
                  </ElSelect>
                  <ElInput
                    v-if="toleration.operator === 'Equal'"
                    v-model="toleration.value"
                    placeholder="污点值"
                    style="width: 150px"
                    @change="emitValidation"
                  />
                  <ElSelect
                    v-model="toleration.effect"
                    placeholder="效果"
                    style="width: 180px"
                    @change="emitValidation"
                  >
                    <ElOption label="NoSchedule (禁止调度)" value="NoSchedule" />
                    <ElOption label="PreferNoSchedule (尽量不调度)" value="PreferNoSchedule" />
                    <ElOption label="NoExecute (驱逐已运行)" value="NoExecute" />
                  </ElSelect>
                  <ElInputNumber
                    v-if="toleration.effect === 'NoExecute'"
                    v-model="toleration.tolerationSeconds"
                    :min="0"
                    placeholder="容忍时长(秒)"
                    controls-position="right"
                    style="width: 150px"
                    @change="emitValidation"
                  >
                    <template #suffix>秒</template>
                  </ElInputNumber>
                </div>
                <ElButton
                  type="danger"
                  :icon="Trash2"
                  circle
                  size="small"
                  @click="removeToleration(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </ElTabPane>

      <!-- 拓扑约束 -->
      <ElTabPane name="topology">
        <template #label>
          <div class="tab-label">
            <Network :size="14" />
            <span>拓扑约束</span>
            <ElBadge
              v-if="schedulingStore.topologySpreadConstraints.length > 0"
              :value="schedulingStore.topologySpreadConstraints.length"
              type="info"
            />
          </div>
        </template>

        <div class="tab-content">
          <div class="topology-section">
            <div class="section-intro">
              <AlertCircle :size="16" />
              <p>拓扑约束用于控制Pod在不同拓扑域（如区域、节点）之间的分布，实现高可用性</p>
            </div>

            <div class="section-header">
              <h4>约束规则</h4>
              <ElButton type="primary" size="small" @click="addTopologyConstraint">
                <Plus :size="14" />
                添加约束
              </ElButton>
            </div>

            <div v-if="schedulingStore.topologySpreadConstraints.length === 0" class="empty-rules">
              <ElEmpty description="暂无拓扑约束" :image-size="60" />
            </div>

            <div v-else class="constraints-list">
              <div
                v-for="(constraint, index) in schedulingStore.topologySpreadConstraints"
                :key="index"
                class="constraint-card"
              >
                <div class="card-header">
                  <span class="constraint-index">#{{ index + 1 }}</span>
                  <ElButton
                    type="danger"
                    :icon="Trash2"
                    circle
                    size="small"
                    @click="removeTopologyConstraint(index)"
                  />
                </div>
                <div class="card-body">
                  <ElForm label-width="120px" size="small">
                    <ElFormItem label="拓扑键">
                      <ElSelect
                        v-model="constraint.topologyKey"
                        style="width: 100%"
                        @change="emitValidation"
                      >
                        <ElOption
                          label="kubernetes.io/hostname (节点)"
                          value="kubernetes.io/hostname"
                        />
                        <ElOption
                          label="topology.kubernetes.io/zone (可用区)"
                          value="topology.kubernetes.io/zone"
                        />
                        <ElOption
                          label="topology.kubernetes.io/region (地域)"
                          value="topology.kubernetes.io/region"
                        />
                      </ElSelect>
                    </ElFormItem>
                    <ElFormItem label="最大偏差">
                      <ElInputNumber
                        v-model="constraint.maxSkew"
                        :min="1"
                        style="width: 100%"
                        @change="emitValidation"
                      />
                      <div class="field-hint">允许的最大Pod数量差异</div>
                    </ElFormItem>
                    <ElFormItem label="调度策略">
                      <ElSelect
                        v-model="constraint.whenUnsatisfiable"
                        style="width: 100%"
                        @change="emitValidation"
                      >
                        <ElOption label="DoNotSchedule (不调度)" value="DoNotSchedule" />
                        <ElOption label="ScheduleAnyway (强制调度)" value="ScheduleAnyway" />
                      </ElSelect>
                    </ElFormItem>
                    <ElFormItem label="标签选择器">
                      <ElInput
                        v-model="constraint.labelSelector"
                        placeholder="app=myapp"
                        @change="emitValidation"
                      />
                      <div class="field-hint">用于匹配Pod的标签</div>
                    </ElFormItem>
                  </ElForm>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElTabPane>
    </ElTabs>

    <!-- 添加/编辑 Pod 亲和性对话框 -->
    <ElDialog
      v-model="showPodAffinityDialog"
      :title="editingPodAffinityIndex === -1 ? '添加 Pod 亲和性规则' : '编辑 Pod 亲和性规则'"
      width="650px"
    >
      <ElForm :model="currentPodAffinity" label-width="120px">
        <ElFormItem label="类型" required>
          <ElRadioGroup v-model="currentPodAffinity.type">
            <ElRadio value="affinity">
              <ThumbsUp :size="14" style="margin-right: 4px" />
              亲和性
            </ElRadio>
            <ElRadio value="antiAffinity">
              <ThumbsDown :size="14" style="margin-right: 4px" />
              反亲和性
            </ElRadio>
          </ElRadioGroup>
          <div class="form-tip">
            <span v-if="currentPodAffinity.type === 'affinity'"
              >Pod 将调度到符合条件的 Pod 所在节点</span
            >
            <span v-else>Pod 将避开符合条件的 Pod 所在节点</span>
          </div>
        </ElFormItem>

        <ElFormItem label="规则类型" required>
          <ElRadioGroup v-model="currentPodAffinity.ruleType">
            <ElRadio value="preferred">优先满足</ElRadio>
            <ElRadio value="required">必须满足</ElRadio>
          </ElRadioGroup>
          <div class="form-tip">
            <span v-if="currentPodAffinity.ruleType === 'preferred'"
              >调度器会尽量满足此规则，但不强制</span
            >
            <span v-else>必须满足此规则，否则 Pod 将无法调度</span>
          </div>
        </ElFormItem>

        <ElFormItem label="权重" v-if="currentPodAffinity.ruleType === 'preferred'">
          <ElSlider
            v-model="currentPodAffinity.weight"
            :min="1"
            :max="100"
            :show-input="true"
            style="width: 100%"
          />
          <div class="form-tip">权重越高，调度器越优先考虑此规则</div>
        </ElFormItem>

        <ElFormItem label="拓扑键" required>
          <ElSelect v-model="currentPodAffinity.topologyKey" style="width: 100%">
            <ElOption label="同节点 (kubernetes.io/hostname)" value="kubernetes.io/hostname" />
            <ElOption
              label="同可用区 (topology.kubernetes.io/zone)"
              value="topology.kubernetes.io/zone"
            />
            <ElOption
              label="同地域 (topology.kubernetes.io/region)"
              value="topology.kubernetes.io/region"
            />
          </ElSelect>
          <div class="form-tip">定义"在一起"或"分开"的范围</div>
        </ElFormItem>

        <ElFormItem label="选择标签" required>
          <ElSelect
            v-model="currentPodAffinity.selectedLabels"
            placeholder="选择或输入标签（格式: key=value）"
            multiple
            filterable
            allow-create
            style="width: 100%"
            :reserve-keyword="false"
          >
            <!-- 智能推荐标签 -->
            <ElOptionGroup label="🎯 智能推荐（基于当前配置）" v-if="recommendedLabels.length > 0">
              <ElOption
                v-for="label in recommendedLabels"
                :key="'rec-' + label"
                :label="label"
                :value="label"
              >
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span>{{ label }}</span>
                  <ElTag size="small" type="success" effect="plain">推荐</ElTag>
                </div>
              </ElOption>
            </ElOptionGroup>

            <!-- 用户配置的标签 -->
            <ElOptionGroup label="📋 当前 Pod 标签" v-if="userConfiguredLabels.length > 0">
              <ElOption
                v-for="label in userConfiguredLabels"
                :key="'user-' + label"
                :label="label"
                :value="label"
              />
            </ElOptionGroup>

            <!-- 常用标签键推荐 -->
            <ElOptionGroup label="🔑 常用标签键（需手动输入值）">
              <ElOption
                v-for="labelDef in commonPodLabels"
                :key="'common-' + labelDef.key"
                :label="`${labelDef.key}=<填写值>`"
                :value="`${labelDef.key}=`"
                :disabled="true"
              >
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span style="font-family: monospace">{{ labelDef.key }}</span>
                  <ElTag size="small" type="info">{{ labelDef.description }}</ElTag>
                </div>
              </ElOption>
            </ElOptionGroup>

            <!-- 自定义输入提示 -->
            <ElOptionGroup label="✏️ 自定义标签">
              <ElOption label="输入格式: key=value（例如: app=nginx）" value="" :disabled="true">
                <span style="color: #909399; font-size: 12px">
                  💡 提示：直接输入 key=value 格式的标签，按回车确认
                </span>
              </ElOption>
            </ElOptionGroup>
          </ElSelect>
          <div class="form-tip" style="margin-top: 8px">
            <div style="display: flex; flex-direction: column; gap: 4px">
              <div>✓ 选择推荐标签或当前配置的标签</div>
              <div>✓ 或直接输入自定义标签（格式: key=value，例如: app=nginx）</div>
              <div style="color: #e6a23c" v-if="currentPodAffinity.selectedLabels.length === 0">
                ⚠️ 至少选择一个标签
              </div>
            </div>
          </div>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="showPodAffinityDialog = false">取消</ElButton>
        <ElButton type="primary" @click="savePodAffinity">
          {{ editingPodAffinityIndex === -1 ? '添加' : '保存' }}
        </ElButton>
      </template>
    </ElDialog>

    <!-- 节点选择对话框（用于选择节点并加载其标签） -->
    <ElDialog
      v-model="showNodeSelectorDialog"
      :title="
        currentRuleContext?.type === 'nodeSelector'
          ? '从节点选择标签'
          : '从节点选择标签（节点亲和性）'
      "
      width="700px"
    >
      <div class="node-selector-dialog">
        <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 16px">
          <template #title>
            <span v-if="currentRuleContext?.type === 'nodeSelector'">
              选择节点后，将自动加载该节点的标签，点击标签即可添加到节点选择器
            </span>
            <span v-else> 选择节点后，将自动加载该节点的标签供您选择 </span>
          </template>
        </ElAlert>

        <ElForm label-width="100px">
          <ElFormItem label="选择节点">
            <ElSelect
              v-model="selectedNodeForLabels"
              placeholder="请选择节点"
              filterable
              style="width: 100%"
              :loading="loadingNodes"
              @change="handleNodeSelectedForLabels"
            >
              <ElOption
                v-for="node in availableNodes"
                :key="node.name"
                :label="node.name"
                :value="node.name"
              >
                <div class="node-option">
                  <div class="node-info">
                    <span class="node-name">{{ node.name }}</span>
                    <ElTag size="small" :type="node.status === 'Ready' ? 'success' : 'danger'">
                      {{ node.status }}
                    </ElTag>
                  </div>
                  <div class="node-meta">
                    <span>{{ node.role }}</span>
                  </div>
                </div>
              </ElOption>
              <template #empty>
                <div style="padding: 20px; text-align: center; color: #909399">
                  <div v-if="!clusterUuidRef?.value">请先选择集群</div>
                  <div v-else-if="loadingNodes">加载中...</div>
                  <div v-else>暂无可用节点</div>
                </div>
              </template>
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="节点标签" v-if="nodeLabelsFromSelected.length > 0">
            <div class="labels-list">
              <div
                v-for="label in nodeLabelsFromSelected"
                :key="label.key"
                class="label-item"
                :class="{ selected: selectedLabelFromNode?.key === label.key }"
                @click="selectLabelFromNode(label)"
              >
                <div class="label-key">{{ label.key }}</div>
                <div class="label-value">{{ label.value }}</div>
              </div>
            </div>
          </ElFormItem>

          <ElFormItem v-if="loadingNodeLabels">
            <ElSkeleton :rows="3" animated />
          </ElFormItem>

          <ElEmpty
            v-if="
              !loadingNodeLabels && selectedNodeForLabels && nodeLabelsFromSelected.length === 0
            "
            description="该节点暂无标签"
            :image-size="80"
          />
        </ElForm>
      </div>

      <template #footer>
        <ElButton @click="showNodeSelectorDialog = false">取消</ElButton>
        <ElButton type="primary" @click="applySelectedLabel" :disabled="!selectedLabelFromNode">
          应用选中的标签
        </ElButton>
      </template>
    </ElDialog>

    <!-- 节点污点选择对话框 -->
    <ElDialog v-model="showNodeTaintDialog" title="从节点选择污点" width="700px">
      <div class="node-taint-dialog">
        <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 16px">
          <template #title>选择节点后，将自动加载该节点的污点供您选择</template>
        </ElAlert>

        <ElForm label-width="100px">
          <ElFormItem label="选择节点">
            <ElSelect
              v-model="selectedNodeForTaints"
              placeholder="请选择节点"
              filterable
              style="width: 100%"
              :loading="loadingNodes"
              @change="handleNodeSelectedForTaints"
            >
              <ElOption
                v-for="node in availableNodes"
                :key="node.name"
                :label="node.name"
                :value="node.name"
              >
                <div class="node-option">
                  <div class="node-info">
                    <span class="node-name">{{ node.name }}</span>
                    <ElTag size="small" :type="node.status === 'Ready' ? 'success' : 'danger'">
                      {{ node.status }}
                    </ElTag>
                  </div>
                </div>
              </ElOption>
              <template #empty>
                <div style="padding: 20px; text-align: center; color: #909399">
                  <div v-if="!clusterUuidRef?.value">请先选择集群</div>
                  <div v-else-if="loadingNodes">加载中...</div>
                  <div v-else>暂无可用节点</div>
                </div>
              </template>
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="节点污点" v-if="nodeTaintsFromSelected.length > 0">
            <div class="taints-list">
              <div
                v-for="(taint, idx) in nodeTaintsFromSelected"
                :key="idx"
                class="taint-item"
                :class="{ selected: selectedTaintFromNode === taint }"
                @click="selectTaintFromNode(taint)"
              >
                <div class="taint-key">{{ taint.key }}</div>
                <div class="taint-info">
                  <ElTag size="small">{{ taint.effect }}</ElTag>
                  <span class="taint-value" v-if="taint.value">= {{ taint.value }}</span>
                </div>
              </div>
            </div>
          </ElFormItem>

          <ElFormItem v-if="loadingNodeTaints">
            <ElSkeleton :rows="3" animated />
          </ElFormItem>

          <ElEmpty
            v-if="
              !loadingNodeTaints && selectedNodeForTaints && nodeTaintsFromSelected.length === 0
            "
            description="该节点暂无污点"
            :image-size="80"
          />
        </ElForm>
      </div>

      <template #footer>
        <ElButton @click="showNodeTaintDialog = false">取消</ElButton>
        <ElButton type="primary" @click="applySelectedTaint" :disabled="!selectedTaintFromNode">
          应用选中的污点
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, inject, type Ref } from 'vue'
  import { useSchedulingStore, useMetadataStore } from '@/store/workload'
  import { ElMessage } from 'element-plus'
  import {
    Server,
    Zap,
    Target,
    Filter,
    Info,
    AlertTriangle,
    Plus,
    Trash2,
    Edit2,
    Magnet,
    ShieldCheck,
    Star,
    Users,
    ShieldOff,
    Network,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    AlertOctagon,
    WifiOff,
    XCircle
  } from 'lucide-vue-next'
  import {
    getNodeListApi,
    getNodeLabelsApi,
    getNodeTaintsApi,
    type NodeLabelItem,
    type NodeTaint
  } from '@/api/manager/node'

  // Props
  interface Props {
    mode?: string
    appName?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    appName: 'myapp'
  })

  // ✅ 使用 inject 获取参数（注意：父组件 provide 的是 Ref 对象）
  const clusterUuidRef = inject<Ref<string>>('clusterUuid')

  if (!clusterUuidRef) {
    console.error('❌ 未能获取 clusterUuid，请确保父组件已 provide')
  }

  // Emits
  const emit = defineEmits<{
    validate: [result: { valid: boolean; errors: string[]; warnings?: string[] }]
  }>()

  // Store
  const schedulingStore = useSchedulingStore()
  const metadataStore = useMetadataStore()

  // UI 状态
  const activeTab = ref('node')
  const loadingNodes = ref(false)

  // ⭐ 标记是否正在从本地更新 store（防止循环触发）
  const isUpdatingStore = ref(false)

  // 节点选择器临时数据
  const nodeSelectors = ref<Array<{ key: string; value: string }>>([])

  // 可用节点列表
  const availableNodes = ref<Array<any>>([])

  // 常用节点标签
  const commonNodeLabels = [
    { key: 'kubernetes.io/hostname', description: '节点名称' },
    { key: 'kubernetes.io/os', description: '操作系统' },
    { key: 'kubernetes.io/arch', description: 'CPU架构' },
    { key: 'node-role.kubernetes.io/master', description: '主节点' },
    { key: 'node-role.kubernetes.io/worker', description: '工作节点' },
    { key: 'topology.kubernetes.io/zone', description: '可用区' },
    { key: 'topology.kubernetes.io/region', description: '地域' }
  ]

  const commonPodLabels = [
    { key: 'app', description: '应用名称' },
    { key: 'version', description: '版本' }
  ]

  // 智能推荐的标签（基于当前 metadata 配置）
  const recommendedLabels = computed(() => {
    const result: string[] = []
    const nameEn = metadataStore.metadata.nameEn
    const version = metadataStore.metadata.version

    if (nameEn) {
      result.push(`app=${nameEn}`)
    }
    if (version) {
      result.push(`version=${version}`)
    }
    if (nameEn && version) {
      result.push(`app.kubernetes.io/instance=${nameEn}-${version}`)
    }

    return result
  })

  // 从 metadata store 获取用户配置的标签（格式: key=value）
  const userConfiguredLabels = computed(() => {
    const labels = metadataStore.metadata.labels || {}
    return Object.entries(labels)
      .filter(([key, value]) => key && value)
      .map(([key, value]) => `${key}=${value}`)
  })

  // 节点亲和性规则
  const nodeAffinityRequired = ref<Array<any>>([])
  const nodeAffinityPreferred = ref<Array<any>>([])

  // Pod 亲和性规则
  interface PodAffinityRule {
    type: 'affinity' | 'antiAffinity'
    ruleType: 'required' | 'preferred'
    weight: number
    topologyKey: string
    selectedLabels: string[]
  }

  const podAffinities = ref<PodAffinityRule[]>([])
  const showPodAffinityDialog = ref(false)
  const editingPodAffinityIndex = ref(-1)
  const currentPodAffinity = ref<PodAffinityRule>({
    type: 'affinity',
    ruleType: 'preferred',
    weight: 50,
    topologyKey: 'kubernetes.io/hostname',
    selectedLabels: []
  })

  // 预设容忍
  const presetTolerations = [
    {
      name: '节点未就绪',
      description: '容忍节点未就绪状态',
      key: 'node.kubernetes.io/not-ready',
      effect: 'NoExecute',
      icon: AlertOctagon
    },
    {
      name: '节点不可达',
      description: '容忍节点不可达状态',
      key: 'node.kubernetes.io/unreachable',
      effect: 'NoExecute',
      icon: WifiOff
    },
    {
      name: '节点不可调度',
      description: '容忍节点不可调度状态',
      key: 'node.kubernetes.io/unschedulable',
      effect: 'NoSchedule',
      icon: XCircle
    },
    {
      name: '内存压力',
      description: '容忍节点内存压力',
      key: 'node.kubernetes.io/memory-pressure',
      effect: 'NoSchedule',
      icon: AlertTriangle
    },
    {
      name: '磁盘压力',
      description: '容忍节点磁盘压力',
      key: 'node.kubernetes.io/disk-pressure',
      effect: 'NoSchedule',
      icon: AlertTriangle
    },
    {
      name: 'PID压力',
      description: '容忍节点PID压力',
      key: 'node.kubernetes.io/pid-pressure',
      effect: 'NoSchedule',
      icon: AlertTriangle
    }
  ]

  // ========== 节点标签选择相关 ==========
  const showNodeSelectorDialog = ref(false)
  const selectedNodeForLabels = ref<string>()
  const nodeLabelsFromSelected = ref<NodeLabelItem[]>([])
  const loadingNodeLabels = ref(false)
  const selectedLabelFromNode = ref<NodeLabelItem | null>(null)
  const currentRuleContext = ref<{
    type: 'nodeAffinity' | 'nodeSelector'
    ruleType?: 'required' | 'preferred'
    index?: number
  } | null>(null)

  // ========== 节点污点选择相关 ==========
  const showNodeTaintDialog = ref(false)
  const selectedNodeForTaints = ref<string>()
  const nodeTaintsFromSelected = ref<NodeTaint[]>([])
  const loadingNodeTaints = ref(false)
  const selectedTaintFromNode = ref<NodeTaint | null>(null)

  // 节点选择器验证错误
  const nodeSelectorErrors = computed(() => {
    if (schedulingStore.nodeSchedulingMode !== 'nodeSelector') return []
    const selector: Record<string, string> = {}
    nodeSelectors.value.forEach((s) => {
      if (s.key || s.value) selector[s.key] = s.value
    })
    return schedulingStore.validateNodeSelector(selector)
  })

  // 获取节点亲和性数量
  const getNodeAffinityCount = () =>
    nodeAffinityRequired.value.length + nodeAffinityPreferred.value.length

  // 加载节点列表
  const loadNodes = async (force = false) => {
    // 如果没有 clusterUuid，直接返回
    if (!clusterUuidRef?.value) {
      console.warn('⚠️ loadNodes: 缺少 clusterUuid，无法加载节点列表')
      return
    }

    // 如果已经在加载中，不重复加载（除非强制）
    if (loadingNodes.value && !force) {
      console.log('⏳ loadNodes: 已在加载中，跳过')
      return
    }

    // 如果已经有数据且不是强制刷新，跳过
    if (availableNodes.value.length > 0 && !force) {
      console.log('✅ loadNodes: 已有节点数据，跳过加载')
      return
    }

    console.log('🚀 loadNodes: 开始加载节点列表, clusterUuid:', clusterUuidRef.value)
    loadingNodes.value = true

    try {
      const res = await getNodeListApi({
        clusterUuid: clusterUuidRef.value,
        page: 1,
        pageSize: 200
      })

      availableNodes.value = (res.items || []).map((node) => ({
        name: node.nodeName,
        status: node.nodeStatus,
        role: node.nodeRole,
        cpu: node.cpu || 0,
        memory: node.memory || '0'
      }))

      console.log('✅ loadNodes: 加载成功，节点数量:', availableNodes.value.length)
    } catch (error) {
      console.error('❌ loadNodes: 加载节点列表失败:', error)
      ElMessage.error('加载节点列表失败')
      availableNodes.value = []
    } finally {
      loadingNodes.value = false
    }
  }

  // 从 store 加载节点选择器
  function loadNodeSelectorsFromStore() {
    if (schedulingStore.nodeSchedulingMode === 'nodeSelector') {
      nodeSelectors.value = Object.entries(schedulingStore.nodeSelector).map(([key, value]) => ({
        key,
        value
      }))
      if (nodeSelectors.value.length === 0) {
        nodeSelectors.value.push({ key: '', value: '' })
      }
    }
  }

  // 处理调度模式变化
  function handleSchedulingModeChange() {
    if (schedulingStore.nodeSchedulingMode === 'nodeSelector') {
      loadNodeSelectorsFromStore()
    }
    emitValidation()
  }

  // 添加节点选择器
  function addNodeSelector() {
    nodeSelectors.value.push({ key: '', value: '' })
  }

  // 删除节点选择器
  function removeNodeSelector(index: number) {
    nodeSelectors.value.splice(index, 1)
    handleNodeSelectorChange()
  }

  // 节点选择器变化
  function handleNodeSelectorChange() {
    const selector: Record<string, string> = {}
    nodeSelectors.value.forEach((s) => {
      if (s.key && s.key.trim() && s.value && s.value.trim()) {
        selector[s.key.trim()] = s.value.trim()
      }
    })
    schedulingStore.updateNodeSelector(selector)
    emitValidation()
  }

  // 添加节点亲和性规则
  function addNodeAffinityRule(type: 'required' | 'preferred') {
    const rule: any = { key: '', operator: 'In', values: '' }
    if (type === 'preferred') rule.weight = 50
    if (type === 'required') {
      nodeAffinityRequired.value.push(rule)
    } else {
      nodeAffinityPreferred.value.push(rule)
    }
    updateNodeAffinity()
  }

  // 删除节点亲和性规则
  function removeNodeAffinityRule(type: 'required' | 'preferred', index: number) {
    if (type === 'required') {
      nodeAffinityRequired.value.splice(index, 1)
    } else {
      nodeAffinityPreferred.value.splice(index, 1)
    }
    updateNodeAffinity()
  }

  // 打开节点标签选择对话框（用于节点亲和性）
  async function openNodeSelectorDialog(
    type: 'nodeAffinity',
    ruleType: 'required' | 'preferred',
    index: number
  ) {
    currentRuleContext.value = { type, ruleType, index }
    selectedNodeForLabels.value = undefined
    nodeLabelsFromSelected.value = []
    selectedLabelFromNode.value = null
    showNodeSelectorDialog.value = true

    // 立即加载节点列表
    if (!clusterUuidRef?.value) {
      ElMessage.warning('请先选择集群')
      showNodeSelectorDialog.value = false
      return
    }
    await loadNodes()
  }

  // 打开节点标签选择对话框（用于节点选择器）
  async function openNodeSelectorForNodeSelector() {
    currentRuleContext.value = { type: 'nodeSelector' }
    selectedNodeForLabels.value = undefined
    nodeLabelsFromSelected.value = []
    selectedLabelFromNode.value = null
    showNodeSelectorDialog.value = true

    // 立即加载节点列表
    if (!clusterUuidRef?.value) {
      ElMessage.warning('请先选择集群')
      showNodeSelectorDialog.value = false
      return
    }
    await loadNodes()
  }

  // 处理节点选择（加载标签）
  async function handleNodeSelectedForLabels(nodeName: string) {
    if (!nodeName || !clusterUuidRef?.value) return

    loadingNodeLabels.value = true
    selectedLabelFromNode.value = null
    try {
      const labels = await getNodeLabelsApi(nodeName, clusterUuidRef.value)
      nodeLabelsFromSelected.value = labels || []
    } catch (error) {
      console.error('加载节点标签失败:', error)
      ElMessage.error('加载节点标签失败')
      nodeLabelsFromSelected.value = []
    } finally {
      loadingNodeLabels.value = false
    }
  }

  // 选择标签
  function selectLabelFromNode(label: NodeLabelItem) {
    selectedLabelFromNode.value = label
  }

  // 应用选中的标签
  function applySelectedLabel() {
    if (!selectedLabelFromNode.value || !currentRuleContext.value) return

    const { type, ruleType, index } = currentRuleContext.value

    // 节点亲和性模式
    if (type === 'nodeAffinity' && ruleType && index !== undefined) {
      const targetArray =
        ruleType === 'required' ? nodeAffinityRequired.value : nodeAffinityPreferred.value

      if (targetArray[index]) {
        targetArray[index].key = selectedLabelFromNode.value.key
        // 如果有值，自动设置到 values 字段
        if (selectedLabelFromNode.value.value) {
          targetArray[index].values = selectedLabelFromNode.value.value
        }
        updateNodeAffinity()
        ElMessage.success('已应用节点标签')
      }
    }

    // 节点选择器模式
    if (type === 'nodeSelector') {
      // 检查是否已存在相同的键
      const existingIndex = nodeSelectors.value.findIndex(
        (s) => s.key === selectedLabelFromNode.value!.key
      )

      if (existingIndex !== -1) {
        // 更新现有的
        nodeSelectors.value[existingIndex].value = selectedLabelFromNode.value.value || ''
      } else {
        // 添加新的
        nodeSelectors.value.push({
          key: selectedLabelFromNode.value.key,
          value: selectedLabelFromNode.value.value || ''
        })
      }

      handleNodeSelectorChange()
      ElMessage.success('已添加节点标签')
    }

    showNodeSelectorDialog.value = false
  }

  // 更新节点亲和性到 store
  function updateNodeAffinity() {
    isUpdatingStore.value = true

    const nodeAffinity: any = {}

    if (nodeAffinityRequired.value.length > 0) {
      const terms = nodeAffinityRequired.value
        .filter((r) => r.key)
        .map((rule) => {
          const matchExpressions: any = { key: rule.key, operator: rule.operator }
          if (['In', 'NotIn', 'Gt', 'Lt'].includes(rule.operator) && rule.values) {
            matchExpressions.values = rule.values.split(',').map((v: string) => v.trim())
          }
          return { matchExpressions: [matchExpressions] }
        })
      if (terms.length > 0) {
        nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution = { nodeSelectorTerms: terms }
      }
    }

    if (nodeAffinityPreferred.value.length > 0) {
      const terms = nodeAffinityPreferred.value
        .filter((r) => r.key)
        .map((rule) => {
          const matchExpressions: any = { key: rule.key, operator: rule.operator }
          if (['In', 'NotIn'].includes(rule.operator) && rule.values) {
            matchExpressions.values = rule.values.split(',').map((v: string) => v.trim())
          }
          return { weight: rule.weight || 50, preference: { matchExpressions: [matchExpressions] } }
        })
      if (terms.length > 0) {
        nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution = terms
      }
    }

    schedulingStore.setNodeAffinity(Object.keys(nodeAffinity).length > 0 ? nodeAffinity : undefined)

    setTimeout(() => {
      isUpdatingStore.value = false
    }, 0)

    emitValidation()
  }

  /**
   * 将 selectedLabels 数组转换为 matchLabels 对象
   */
  function labelsArrayToMatchLabels(labels: string[]): Record<string, string> {
    const result: Record<string, string> = {}
    labels.forEach((label) => {
      const [key, value] = label.split('=')
      if (key && value !== undefined) {
        result[key.trim()] = value.trim()
      }
    })
    return result
  }

  // 构建完整的 Pod 亲和性配置
  function buildCompletePodAffinity() {
    isUpdatingStore.value = true

    const podAffinity: any = {}
    const podAntiAffinity: any = {}

    podAffinities.value.forEach((affinity) => {
      if (affinity.selectedLabels.length === 0) return

      const matchLabels = labelsArrayToMatchLabels(affinity.selectedLabels)
      if (Object.keys(matchLabels).length === 0) return

      const term = {
        labelSelector: { matchLabels },
        topologyKey: affinity.topologyKey
      }

      const target = affinity.type === 'affinity' ? podAffinity : podAntiAffinity

      if (affinity.ruleType === 'required') {
        if (!target.requiredDuringSchedulingIgnoredDuringExecution) {
          target.requiredDuringSchedulingIgnoredDuringExecution = []
        }
        target.requiredDuringSchedulingIgnoredDuringExecution.push(term)
      } else {
        if (!target.preferredDuringSchedulingIgnoredDuringExecution) {
          target.preferredDuringSchedulingIgnoredDuringExecution = []
        }
        target.preferredDuringSchedulingIgnoredDuringExecution.push({
          weight: affinity.weight || 50,
          podAffinityTerm: term
        })
      }
    })

    schedulingStore.setPodAffinity(Object.keys(podAffinity).length > 0 ? podAffinity : undefined)
    schedulingStore.setPodAntiAffinity(
      Object.keys(podAntiAffinity).length > 0 ? podAntiAffinity : undefined
    )

    setTimeout(() => {
      isUpdatingStore.value = false
    }, 0)

    emitValidation()
  }

  // 打开添加 Pod 亲和性对话框
  function openAddPodAffinityDialog() {
    editingPodAffinityIndex.value = -1
    const defaultLabels = recommendedLabels.value.length > 0 ? [recommendedLabels.value[0]] : []

    currentPodAffinity.value = {
      type: 'affinity',
      ruleType: 'preferred',
      weight: 50,
      topologyKey: 'kubernetes.io/hostname',
      selectedLabels: defaultLabels
    }
    showPodAffinityDialog.value = true
  }

  // 编辑 Pod 亲和性
  function editPodAffinity(index: number) {
    editingPodAffinityIndex.value = index
    const affinity = podAffinities.value[index]
    currentPodAffinity.value = {
      type: affinity.type,
      ruleType: affinity.ruleType,
      weight: affinity.weight || 50,
      topologyKey: affinity.topologyKey,
      selectedLabels: [...affinity.selectedLabels]
    }
    showPodAffinityDialog.value = true
  }

  // 保存 Pod 亲和性
  function savePodAffinity() {
    if (currentPodAffinity.value.selectedLabels.length === 0) {
      ElMessage.warning('请至少选择一个标签')
      return
    }

    const invalidLabels = currentPodAffinity.value.selectedLabels.filter(
      (label) => !label.includes('=') || label.endsWith('=')
    )
    if (invalidLabels.length > 0) {
      ElMessage.warning(`标签格式错误，请使用 key=value 格式: ${invalidLabels.join(', ')}`)
      return
    }

    if (editingPodAffinityIndex.value === -1) {
      podAffinities.value.push({ ...currentPodAffinity.value })
      ElMessage.success('亲和性规则已添加')
    } else {
      podAffinities.value[editingPodAffinityIndex.value] = { ...currentPodAffinity.value }
      ElMessage.success('亲和性规则已更新')
    }

    showPodAffinityDialog.value = false
    buildCompletePodAffinity()
  }

  // 删除 Pod 亲和性
  function removePodAffinity(index: number) {
    podAffinities.value.splice(index, 1)
    buildCompletePodAffinity()
    ElMessage.success('已删除亲和性规则')
  }

  // 添加容忍
  function addToleration() {
    schedulingStore.addToleration({ key: '', operator: 'Equal', value: '', effect: 'NoSchedule' })
    emitValidation()
  }

  // 添加预设容忍
  function addPresetToleration(preset: any) {
    const exists = schedulingStore.tolerations.some(
      (t) => t.key === preset.key && t.effect === preset.effect
    )
    if (exists) {
      ElMessage.warning('该容忍已存在')
      return
    }
    schedulingStore.addToleration({ key: preset.key, operator: 'Exists', effect: preset.effect })
    ElMessage.success(`已添加${preset.name}容忍`)
    emitValidation()
  }

  // 删除容忍
  function removeToleration(index: number) {
    schedulingStore.removeToleration(index)
    emitValidation()
  }

  // 打开节点污点选择对话框
  async function openNodeTaintDialog() {
    selectedNodeForTaints.value = undefined
    nodeTaintsFromSelected.value = []
    selectedTaintFromNode.value = null
    showNodeTaintDialog.value = true

    // 立即加载节点列表
    if (!clusterUuidRef?.value) {
      ElMessage.warning('请先选择集群')
      showNodeTaintDialog.value = false
      return
    }
    await loadNodes()
  }

  // 处理节点选择（加载污点）
  async function handleNodeSelectedForTaints(nodeName: string) {
    if (!nodeName || !clusterUuidRef?.value) return

    loadingNodeTaints.value = true
    selectedTaintFromNode.value = null
    try {
      const taints = await getNodeTaintsApi(nodeName, clusterUuidRef.value)
      nodeTaintsFromSelected.value = taints || []
    } catch (error) {
      console.error('加载节点污点失败:', error)
      ElMessage.error('加载节点污点失败')
      nodeTaintsFromSelected.value = []
    } finally {
      loadingNodeTaints.value = false
    }
  }

  // 选择污点
  function selectTaintFromNode(taint: NodeTaint) {
    selectedTaintFromNode.value = taint
  }

  // 应用选中的污点
  function applySelectedTaint() {
    if (!selectedTaintFromNode.value) return

    const taint = selectedTaintFromNode.value

    // 检查是否已存在
    const exists = schedulingStore.tolerations.some(
      (t) => t.key === taint.key && t.effect === taint.effect
    )

    if (exists) {
      ElMessage.warning('该污点容忍已存在')
      return
    }

    schedulingStore.addToleration({
      key: taint.key,
      operator: taint.value ? 'Equal' : 'Exists',
      value: taint.value,
      effect: taint.effect as any
    })

    ElMessage.success('已添加污点容忍')
    showNodeTaintDialog.value = false
    emitValidation()
  }

  // 添加拓扑约束
  function addTopologyConstraint() {
    schedulingStore.addTopologySpreadConstraint({
      topologyKey: 'kubernetes.io/hostname',
      maxSkew: 1,
      whenUnsatisfiable: 'DoNotSchedule',
      labelSelector: { matchLabels: { app: props.appName } }
    })
    emitValidation()
  }

  // 删除拓扑约束
  function removeTopologyConstraint(index: number) {
    schedulingStore.removeTopologySpreadConstraint(index)
    emitValidation()
  }

  // 发送验证结果
  function emitValidation() {
    const validation = schedulingStore.validate()
    emit('validate', validation)
  }

  // 验证
  async function validate(): Promise<boolean> {
    const validation = schedulingStore.validate()
    emitValidation()
    return validation.valid
  }

  /**
   * 从 store 解析 Pod 亲和性配置
   * 支持 matchLabels 和 matchExpressions 两种格式
   */
  function parseLabelSelectorToArray(labelSelector: any): string[] {
    if (!labelSelector) return []

    const result: string[] = []

    // 处理 matchLabels
    if (labelSelector.matchLabels) {
      Object.entries(labelSelector.matchLabels).forEach(([key, value]) => {
        result.push(`${key}=${value}`)
      })
    }

    // 处理 matchExpressions
    if (labelSelector.matchExpressions) {
      labelSelector.matchExpressions.forEach((expr: any) => {
        if (expr.operator === 'In' && expr.values && expr.values.length > 0) {
          expr.values.forEach((value: string) => {
            result.push(`${expr.key}=${value}`)
          })
        } else if (expr.operator === 'Exists') {
          result.push(`${expr.key}=*`)
        }
      })
    }

    return result
  }

  // 从 store 加载所有本地状态
  function loadAllLocalStatesFromStore() {
    loadNodeSelectorsFromStore()

    // 加载节点亲和性
    const nodeAff = schedulingStore.affinity?.nodeAffinity
    if (nodeAff) {
      const required = nodeAff.requiredDuringSchedulingIgnoredDuringExecution
      if (required && required.nodeSelectorTerms) {
        nodeAffinityRequired.value = required.nodeSelectorTerms.flatMap((term) =>
          (term.matchExpressions || []).map((expr) => ({
            key: expr.key || '',
            operator: expr.operator || 'In',
            values: (expr.values || []).join(',')
          }))
        )
      } else {
        nodeAffinityRequired.value = []
      }

      const preferred = nodeAff.preferredDuringSchedulingIgnoredDuringExecution
      if (preferred && preferred.length > 0) {
        nodeAffinityPreferred.value = preferred.flatMap((item) =>
          (item.preference?.matchExpressions || []).map((expr) => ({
            weight: item.weight || 50,
            key: expr.key || '',
            operator: expr.operator || 'In',
            values: (expr.values || []).join(',')
          }))
        )
      } else {
        nodeAffinityPreferred.value = []
      }
    } else {
      nodeAffinityRequired.value = []
      nodeAffinityPreferred.value = []
    }

    // 加载 Pod 亲和性/反亲和性
    const podAff = schedulingStore.affinity?.podAffinity
    const podAntiAff = schedulingStore.affinity?.podAntiAffinity

    podAffinities.value = []

    // 处理 Pod 反亲和性
    if (podAntiAff) {
      const required = podAntiAff.requiredDuringSchedulingIgnoredDuringExecution
      const preferred = podAntiAff.preferredDuringSchedulingIgnoredDuringExecution

      if (required) {
        required.forEach((term: any) => {
          const labels = parseLabelSelectorToArray(term.labelSelector)
          if (labels.length > 0) {
            podAffinities.value.push({
              type: 'antiAffinity',
              ruleType: 'required',
              weight: 50,
              topologyKey: term.topologyKey || 'kubernetes.io/hostname',
              selectedLabels: labels
            })
          }
        })
      }

      if (preferred) {
        preferred.forEach((item: any) => {
          const term = item.podAffinityTerm
          const labels = parseLabelSelectorToArray(term?.labelSelector)
          if (labels.length > 0) {
            podAffinities.value.push({
              type: 'antiAffinity',
              ruleType: 'preferred',
              weight: item.weight || 50,
              topologyKey: term?.topologyKey || 'kubernetes.io/hostname',
              selectedLabels: labels
            })
          }
        })
      }
    }

    // 处理 Pod 亲和性
    if (podAff) {
      const required = podAff.requiredDuringSchedulingIgnoredDuringExecution
      const preferred = podAff.preferredDuringSchedulingIgnoredDuringExecution

      if (required) {
        required.forEach((term: any) => {
          const labels = parseLabelSelectorToArray(term.labelSelector)
          if (labels.length > 0) {
            podAffinities.value.push({
              type: 'affinity',
              ruleType: 'required',
              weight: 50,
              topologyKey: term.topologyKey || 'kubernetes.io/hostname',
              selectedLabels: labels
            })
          }
        })
      }

      if (preferred) {
        preferred.forEach((item: any) => {
          const term = item.podAffinityTerm
          const labels = parseLabelSelectorToArray(term?.labelSelector)
          if (labels.length > 0) {
            podAffinities.value.push({
              type: 'affinity',
              ruleType: 'preferred',
              weight: item.weight || 50,
              topologyKey: term?.topologyKey || 'kubernetes.io/hostname',
              selectedLabels: labels
            })
          }
        })
      }
    }
  }

  // 初始化
  onMounted(() => {
    loadAllLocalStatesFromStore()
    emitValidation()

    // 延迟加载节点列表，确保父组件的 clusterUuid 已经传递
    setTimeout(() => {
      if (clusterUuidRef?.value) {
        console.log('🔧 初始化时加载节点列表, clusterUuid:', clusterUuidRef.value)
        loadNodes()
      } else {
        console.warn('⚠️ 初始化时 clusterUuid 为空，等待父组件传递')
      }
    }, 100)
  })

  // 监听 clusterUuid 变化，重新加载节点（支持响应式更新）
  watch(
    () => clusterUuidRef?.value,
    (newClusterUuid, oldClusterUuid) => {
      console.log('📡 clusterUuid 变化:', { old: oldClusterUuid, new: newClusterUuid })

      if (newClusterUuid && newClusterUuid !== oldClusterUuid) {
        availableNodes.value = [] // 清空旧数据
        loadNodes(true) // 强制刷新
      }
    },
    { immediate: false } // 不立即执行，避免与 onMounted 重复
  )

  // ⭐ 监听 store.affinity 变化 - 当 YAML 解析后 store 更新时，同步本地状态
  watch(
    () => schedulingStore.affinity,
    (newAffinity) => {
      // 如果是本地更新触发的，跳过
      if (isUpdatingStore.value) return
      loadAllLocalStatesFromStore()
      emitValidation()
    },
    { deep: true }
  )

  // 监听 nodeSchedulingMode 变化
  watch(
    () => schedulingStore.nodeSchedulingMode,
    () => {
      if (schedulingStore.nodeSchedulingMode === 'nodeSelector') {
        loadNodeSelectorsFromStore()
      }
    }
  )

  // ⭐ 监听 nodeSelector 变化
  watch(
    () => schedulingStore.nodeSelector,
    () => {
      if (isUpdatingStore.value) return
      loadNodeSelectorsFromStore()
    },
    { deep: true }
  )

  // 导出
  defineExpose({ validate })
</script>

<style lang="scss" scoped>
  .scheduling-step {
    .scheduling-tabs {
      ::v-deep(.el-tabs__header) {
        background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
        padding: 8px 12px;
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
      }

      ::v-deep(.el-tabs__item) {
        padding: 0 16px;
        height: 36px;
        line-height: 36px;
        border-radius: 6px 6px 0 0;
        transition: all 0.2s;

        &:hover:not(.is-active) {
          background: rgba(64, 158, 255, 0.08);
        }

        &.is-active {
          background: white;
          color: #409eff;
          font-weight: 500;
        }

        .tab-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
      }

      ::v-deep(.el-tabs__active-bar) {
        display: none;
      }
    }

    .tab-content {
      padding: 20px;
      min-height: 400px;
    }

    .mode-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
    }

    .node-option {
      .node-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        .node-name {
          font-weight: 500;
        }
      }
      .node-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: #909399;
      }
    }

    .label-selectors {
      .selector-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 12px;
      }

      .selector-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        .equals {
          color: #909399;
          font-weight: 500;
        }
      }
      .error-tips {
        margin-top: 12px;
      }
    }

    .affinity-section .affinity-group {
      margin-bottom: 24px;

      .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 16px;
        }
      }

      .group-desc {
        font-size: 13px;
        color: #909399;
        margin-bottom: 16px;
      }

      .rules-list .rule-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        margin-bottom: 12px;

        .rule-weight {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .rule-content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;

          .rule-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }
      }
    }

    .custom-affinities {
      .affinity-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;

        .affinity-card {
          background: white;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f5f7fa;
            border-bottom: 1px solid #e4e7ed;

            .card-tags {
              display: flex;
              gap: 8px;
            }
            .card-actions {
              display: flex;
              gap: 8px;
            }
          }

          .card-body {
            padding: 12px;

            .info-row {
              display: flex;
              align-items: flex-start;
              margin-bottom: 8px;
              font-size: 13px;

              &:last-child {
                margin-bottom: 0;
              }

              label {
                min-width: 80px;
                color: #909399;
                flex-shrink: 0;
              }

              code {
                font-family: monospace;
                background: #f4f4f5;
                padding: 2px 6px;
                border-radius: 3px;
              }

              .label-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
              }
            }
          }
        }
      }
    }

    .preset-section {
      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 16px;
      }

      .preset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;

        .preset-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f5f7fa;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background: #e6f4ff;
            border-color: #409eff;
            transform: translateY(-2px);
          }

          .preset-icon {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #409eff;
          }

          .preset-info {
            flex: 1;
            .preset-name {
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 4px;
            }
            .preset-desc {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }

    .custom-tolerations {
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h4 {
          margin: 0;
          font-size: 16px;
          color: #303133;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }
      }
    }

    .tolerations-list .toleration-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 12px;

      .toleration-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
    }

    .topology-section {
      .section-intro {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #fff7e6;
        border: 1px solid #ffd591;
        border-radius: 8px;
        margin-bottom: 20px;

        p {
          margin: 0;
          font-size: 13px;
          color: #d48806;
        }
      }

      .constraints-list .constraint-card {
        background: white;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        margin-bottom: 16px;

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f5f7fa;
          border-bottom: 1px solid #e4e7ed;

          .constraint-index {
            font-weight: 600;
            color: #409eff;
          }
        }

        .card-body {
          padding: 16px;

          .field-hint {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }

    .empty-rules {
      padding: 40px;
      background: #f5f7fa;
      border-radius: 8px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h4 {
        margin: 0;
        font-size: 16px;
        color: #303133;
      }
    }

    .form-tip {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    // 节点标签选择对话框样式
    .node-selector-dialog,
    .node-taint-dialog {
      .labels-list,
      .taints-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
      }

      .label-item,
      .taint-item {
        padding: 12px;
        background: #f5f7fa;
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #e6f4ff;
          border-color: #409eff;
        }

        &.selected {
          background: #e6f4ff;
          border-color: #409eff;
        }

        .label-key,
        .taint-key {
          font-family: monospace;
          font-size: 13px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }

        .label-value {
          font-size: 12px;
          color: #909399;
        }

        .taint-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;

          .taint-value {
            color: #909399;
          }
        }
      }
    }

    .label-option {
      display: flex;
      align-items: center;
      gap: 8px;

      code {
        font-family: monospace;
        background: #f4f4f5;
        padding: 2px 6px;
        border-radius: 3px;
      }

      .label-value {
        color: #909399;
        font-size: 12px;
      }
    }
  }
</style>
