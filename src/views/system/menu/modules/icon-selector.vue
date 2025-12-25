<!-- 图标选择器组件（完整版 - 优化版） -->
<template>
  <div class="art-icon-selector">
    <ElPopover v-model:visible="visible" placement="bottom-start" :width="720" trigger="click">
      <template #reference>
        <ElInput
          :model-value="modelValue"
          placeholder="请选择图标或输入图标名称"
          clearable
          @update:model-value="handleInputChange"
          @clear="handleClear"
        >
          <template #prefix>
            <ArtSvgIcon v-if="modelValue" :icon="modelValue" class="text-lg" />
            <ElIcon v-else :size="18">
              <Search />
            </ElIcon>
          </template>
        </ElInput>
      </template>

      <div class="icon-selector-content">
        <!-- 搜索框 -->
        <ElInput v-model="searchText" placeholder="搜索图标..." clearable class="mb-3">
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
          <template #append>
            <span class="text-xs text-gray-400">共 {{ filteredIcons.length }} 个</span>
          </template>
        </ElInput>

        <!-- 图标分类标签 -->
        <ElScrollbar max-height="80px" class="mb-3">
          <div class="icon-tabs">
            <ElTag
              v-for="tab in iconTabs"
              :key="tab.value"
              :type="activeTab === tab.value ? 'primary' : 'info'"
              :effect="activeTab === tab.value ? 'dark' : 'plain'"
              class="tab-item"
              @click="handleTabChange(tab.value)"
            >
              <template v-if="tab.icon">
                <ArtSvgIcon :icon="tab.icon" class="mr-1" />
              </template>
              {{ tab.label }}
              <span class="ml-1 text-xs opacity-70">({{ getIconCount(tab.value) }})</span>
            </ElTag>
          </div>
        </ElScrollbar>

        <!-- 图标列表 -->
        <ElScrollbar max-height="380px">
          <div v-if="filteredIcons.length > 0" class="icon-list">
            <div
              v-for="icon in filteredIcons"
              :key="icon"
              :class="['icon-item', { active: modelValue === icon }]"
              :title="icon"
              @click="handleSelect(icon)"
            >
              <ArtSvgIcon :icon="icon" class="text-2xl" />
              <span class="icon-name">{{ getIconName(icon) }}</span>
            </div>
          </div>
          <ElEmpty v-else description="未找到图标" :image-size="80" />
        </ElScrollbar>

        <!-- 底部提示 -->
        <div class="icon-footer">
          <ElText size="small" type="info">
            💡 提示：支持直接输入图标名称，如 ri:home-line 或 logos:kubernetes
          </ElText>
        </div>
      </div>
    </ElPopover>
  </div>
</template>

<script setup lang="ts">
  import { Search } from '@element-plus/icons-vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    modelValue?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void
    (e: 'change', value: string): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const visible = ref(false)
  const searchText = ref('')
  // 🔥 修复：默认展示全部图标
  const activeTab = ref('all')

  // 图标分类（新增项目和业务）
  const iconTabs = [
    { label: '全部', value: 'all', icon: 'ri:apps-line' },
    { label: '常用', value: 'common', icon: 'ri:star-line' },
    { label: '系统', value: 'system', icon: 'ri:settings-3-line' },
    { label: '项目', value: 'project', icon: 'ri:task-line' },
    { label: '业务', value: 'business', icon: 'ri:briefcase-line' },
    { label: '云原生', value: 'cloud-native', icon: 'logos:kubernetes' },
    { label: '数据库', value: 'database', icon: 'ri:database-2-line' },
    { label: '开发工具', value: 'devtools', icon: 'ri:code-box-line' },
    { label: '用户', value: 'user', icon: 'ri:user-line' },
    { label: '文件', value: 'file', icon: 'ri:folder-line' },
    { label: '编辑', value: 'edit', icon: 'ri:edit-line' },
    { label: '图表', value: 'chart', icon: 'ri:bar-chart-line' },
    { label: '网络', value: 'network', icon: 'ri:wifi-line' }
  ]

  // ==================== 常用图标 ====================
  const commonIcons = [
    'ri:home-line',
    'ri:dashboard-line',
    'ri:user-line',
    'ri:team-line',
    'ri:admin-line',
    'ri:settings-line',
    'ri:menu-line',
    'ri:file-list-line',
    'ri:folder-line',
    'ri:database-line',
    'ri:server-line',
    'ri:shield-user-line',
    'ri:lock-line',
    'ri:key-line',
    'ri:organization-chart',
    'ri:building-line',
    'ri:search-line',
    'ri:notification-line',
    'ri:mail-line',
    'ri:calendar-line',
    'ri:task-line',
    'ri:briefcase-line'
  ]

  // ==================== 系统图标 ====================
  const systemIcons = [
    'ri:dashboard-line',
    'ri:dashboard-2-line',
    'ri:dashboard-3-line',
    'ri:apps-line',
    'ri:apps-2-line',
    'ri:function-line',
    'ri:settings-line',
    'ri:settings-2-line',
    'ri:settings-3-line',
    'ri:settings-4-line',
    'ri:settings-5-line',
    'ri:settings-6-line',
    'ri:tools-line',
    'ri:tools-fill',
    'ri:shield-line',
    'ri:shield-check-line',
    'ri:shield-user-line',
    'ri:shield-star-line',
    'ri:lock-line',
    'ri:lock-unlock-line',
    'ri:lock-password-line',
    'ri:key-line',
    'ri:key-2-line',
    'ri:login-box-line',
    'ri:logout-box-line',
    'ri:login-circle-line',
    'ri:logout-circle-line',
    'ri:database-line',
    'ri:database-2-line',
    'ri:server-line',
    'ri:server-fill',
    'ri:cloud-line',
    'ri:cloud-fill',
    'ri:global-line',
    'ri:global-fill',
    'ri:wifi-line',
    'ri:wifi-fill',
    'ri:notification-line',
    'ri:notification-2-line',
    'ri:notification-3-line',
    'ri:notification-4-line',
    'ri:alert-line',
    'ri:alert-fill',
    'ri:error-warning-line',
    'ri:error-warning-fill',
    'ri:information-line',
    'ri:information-fill',
    'ri:question-line',
    'ri:question-fill',
    'ri:checkbox-circle-line',
    'ri:close-circle-line',
    'ri:indeterminate-circle-line',
    'ri:time-line',
    'ri:timer-line'
  ]

  // ==================== 项目管理图标（新增）====================
  const projectIcons = [
    // 项目管理核心
    'ri:task-line',
    'ri:task-fill',
    'ri:todo-line',
    'ri:todo-fill',
    'ri:list-check',
    'ri:list-check-2',
    'ri:list-check-3',
    'ri:survey-line',
    'ri:survey-fill',

    // 看板和任务
    'ri:dashboard-line',
    'ri:kanban-view',
    'ri:layout-grid-line',
    'ri:layout-masonry-line',
    'ri:artboard-line',
    'ri:artboard-2-line',

    // 时间管理
    'ri:calendar-line',
    'ri:calendar-2-line',
    'ri:calendar-check-line',
    'ri:calendar-event-line',
    'ri:calendar-schedule-line',
    'ri:calendar-todo-line',
    'ri:time-line',
    'ri:timer-line',
    'ri:timer-2-line',
    'ri:alarm-line',
    'ri:hourglass-line',
    'ri:hourglass-2-line',

    // 里程碑和进度
    'ri:flag-line',
    'ri:flag-2-line',
    'ri:flag-fill',
    'ri:milestone-line',
    'ri:roadmap-line',
    'ri:progress-1-line',
    'ri:progress-2-line',
    'ri:progress-3-line',
    'ri:progress-4-line',
    'ri:progress-5-line',
    'ri:progress-6-line',
    'ri:progress-7-line',
    'ri:progress-8-line',

    // 团队协作
    'ri:team-line',
    'ri:team-fill',
    'ri:group-line',
    'ri:group-2-line',
    'ri:user-shared-line',
    'ri:user-shared-2-line',
    'ri:share-line',
    'ri:share-forward-line',

    // 文档和规划
    'ri:article-line',
    'ri:article-fill',
    'ri:file-text-line',
    'ri:file-list-line',
    'ri:file-list-2-line',
    'ri:file-list-3-line',
    'ri:book-line',
    'ri:book-open-line',
    'ri:book-2-line',
    'ri:book-3-line',

    // 目标和规划
    'ri:target-line',
    'ri:focus-line',
    'ri:focus-2-line',
    'ri:focus-3-line',
    'ri:compass-line',
    'ri:compass-3-line',
    'ri:map-pin-line',
    'ri:map-pin-2-line',

    // 版本和发布
    'ri:git-branch-line',
    'ri:git-merge-line',
    'ri:git-pull-request-line',
    'ri:git-commit-line',
    'ri:code-box-line',
    'ri:terminal-box-line',

    // 敏捷开发
    'ri:sprint-line',
    'ri:flashlight-line',
    'ri:rocket-line',
    'ri:rocket-2-line',

    // 优先级
    'ri:fire-line',
    'ri:fire-fill',
    'ri:star-line',
    'ri:star-fill',
    'ri:medal-line',
    'ri:medal-2-line',
    'ri:award-line',
    'ri:trophy-line',

    // 项目状态
    'ri:checkbox-circle-line',
    'ri:checkbox-circle-fill',
    'ri:close-circle-line',
    'ri:close-circle-fill',
    'ri:error-warning-line',
    'ri:information-line',
    'ri:pause-circle-line',
    'ri:play-circle-line',

    // 项目工具
    'carbon:task',
    'carbon:task-add',
    'carbon:task-complete',
    'carbon:task-settings',
    'carbon:task-view',
    'carbon:roadmap',
    'carbon:flow',
    'carbon:flow-data',
    'carbon:workflow',
    'carbon:collaboration',
    'carbon:plan',
    'mdi:clipboard-check',
    'mdi:clipboard-list',
    'mdi:clipboard-text',
    'mdi:timeline',
    'mdi:timeline-text',
    'mdi:timeline-clock'
  ]

  // ==================== 业务相关图标（新增）====================
  const businessIcons = [
    // 商业核心
    'ri:briefcase-line',
    'ri:briefcase-2-line',
    'ri:briefcase-3-line',
    'ri:briefcase-4-line',
    'ri:briefcase-5-line',
    'ri:briefcase-fill',
    'ri:business-line',

    // 财务相关
    'ri:money-dollar-circle-line',
    'ri:money-dollar-box-line',
    'ri:money-cny-circle-line',
    'ri:money-euro-circle-line',
    'ri:money-pound-circle-line',
    'ri:coin-line',
    'ri:coins-line',
    'ri:bank-card-line',
    'ri:bank-card-2-line',
    'ri:bank-line',
    'ri:wallet-line',
    'ri:wallet-2-line',
    'ri:wallet-3-line',
    'ri:safe-line',
    'ri:safe-2-line',
    'ri:price-tag-line',
    'ri:price-tag-2-line',
    'ri:price-tag-3-line',
    'ri:coupon-line',
    'ri:coupon-2-line',
    'ri:coupon-3-line',
    'ri:refund-line',
    'ri:refund-2-line',
    'ri:exchange-line',
    'ri:exchange-dollar-line',
    'ri:exchange-cny-line',

    // 销售和订单
    'ri:shopping-cart-line',
    'ri:shopping-cart-2-line',
    'ri:shopping-cart-fill',
    'ri:shopping-bag-line',
    'ri:shopping-bag-2-line',
    'ri:shopping-bag-3-line',
    'ri:shopping-basket-line',
    'ri:shopping-basket-2-line',
    'ri:store-line',
    'ri:store-2-line',
    'ri:store-3-line',
    'ri:store-fill',
    'ri:auction-line',
    'ri:auction-fill',
    'ri:bill-line',
    'ri:bill-fill',
    'ri:receipt-line',
    'ri:receipt-fill',
    'ri:ticket-line',
    'ri:ticket-2-line',
    'ri:vip-crown-line',
    'ri:vip-crown-2-line',
    'ri:vip-diamond-line',

    // 客户管理
    'ri:customer-service-line',
    'ri:customer-service-2-line',
    'ri:customer-service-fill',
    'ri:service-line',
    'ri:service-fill',
    'ri:phone-line',
    'ri:phone-fill',
    'ri:headphone-line',
    'ri:headphone-fill',
    'ri:questionnaire-line',
    'ri:questionnaire-fill',
    'ri:feedback-line',
    'ri:feedback-fill',

    // 市场营销
    'ri:advertisement-line',
    'ri:advertisement-fill',
    'ri:megaphone-line',
    'ri:megaphone-fill',
    'ri:presentation-line',
    'ri:presentation-fill',
    'ri:slideshow-line',
    'ri:slideshow-2-line',
    'ri:slideshow-3-line',
    'ri:slideshow-4-line',
    'ri:gift-line',
    'ri:gift-2-line',
    'ri:gift-fill',
    'ri:red-packet-line',
    'ri:red-packet-fill',

    // 合同和文档
    'ri:file-text-line',
    'ri:contract-line',
    'ri:contract-fill',
    'ri:file-shield-line',
    'ri:file-shield-2-line',
    'ri:file-lock-line',
    'ri:archive-line',
    'ri:archive-drawer-line',

    // 统计分析
    'ri:bar-chart-line',
    'ri:pie-chart-line',
    'ri:line-chart-line',
    'ri:funds-line',
    'ri:stock-line',
    'ri:stock-fill',
    'ri:increase-line',
    'ri:decrease-line',

    // 企业管理
    'ri:building-line',
    'ri:building-2-line',
    'ri:building-3-line',
    'ri:building-4-line',
    'ri:building-fill',
    'ri:community-line',
    'ri:community-fill',
    'ri:government-line',
    'ri:government-fill',
    'ri:home-office-line',
    'ri:home-office-fill',

    // 供应链
    'ri:truck-line',
    'ri:truck-fill',
    'ri:ship-line',
    'ri:ship-2-line',
    'ri:plane-line',
    'ri:plane-fill',
    'ri:box-1-line',
    'ri:box-2-line',
    'ri:box-3-line',
    'ri:inbox-line',
    'ri:inbox-archive-line',

    // 质量和认证
    'ri:verified-badge-line',
    'ri:verified-badge-fill',
    'ri:shield-check-line',
    'ri:shield-check-fill',
    'ri:medal-line',
    'ri:medal-2-line',
    'ri:award-line',
    'ri:award-fill',
    'ri:trophy-line',
    'ri:trophy-fill',

    // Carbon 业务图标
    'carbon:business-processes',
    'carbon:store',
    'carbon:shopping-cart',
    'carbon:wallet',
    'carbon:purchase',
    'carbon:sales',
    'carbon:receipt',
    'carbon:invoice',
    'carbon:finance',
    'carbon:currency',
    'carbon:piggy-bank',

    // MDI 业务图标
    'mdi:briefcase',
    'mdi:briefcase-outline',
    'mdi:cash',
    'mdi:cash-register',
    'mdi:point-of-sale',
    'mdi:invoice',
    'mdi:receipt'
  ]

  // ==================== 云原生图标 ====================
  const cloudNativeIcons = [
    // Kubernetes 生态
    'logos:kubernetes',
    'devicon:kubernetes',
    'simple-icons:kubernetes',
    'mdi:kubernetes',
    'carbon:kubernetes',

    // Docker 容器
    'logos:docker-icon',
    'devicon:docker',
    'simple-icons:docker',
    'mdi:docker',
    'carbon:container-software',

    // 容器编排和管理
    'logos:rancher-icon',
    'logos:containerd',
    'logos:podman',
    'simple-icons:helm',
    'logos:openshift',

    // 云服务提供商
    'logos:aws',
    'logos:amazon-eks',
    'logos:amazon-ecs',
    'devicon:amazonwebservices',
    'simple-icons:amazonwebservices',

    'logos:azure',
    'logos:azure-icon',
    'devicon:azure',
    'simple-icons:microsoftazure',

    'logos:google-cloud',
    'logos:google-cloud-run',
    'logos:google-kubernetes-engine',
    'devicon:googlecloud',

    'logos:alibaba-cloud',
    'logos:tencentcloud',

    // CI/CD
    'logos:jenkins',
    'devicon:jenkins',
    'logos:gitlab',
    'devicon:gitlab',
    'logos:github-actions',
    'logos:circleci',
    'logos:travis-ci',
    'logos:argo',
    'logos:tekton',

    // 服务网格
    'logos:istio',
    'logos:envoy',
    'logos:linkerd',
    'simple-icons:consul',

    // 监控和可观测性
    'logos:prometheus',
    'logos:grafana',
    'devicon:grafana',
    'logos:elastic',
    'logos:elasticsearch',
    'logos:kibana',
    'logos:jaeger',
    'logos:datadog',
    'logos:new-relic',
    'simple-icons:influxdb',

    // 日志和追踪
    'logos:fluentd',
    'logos:loki',
    'simple-icons:opensearch',

    // 配置管理
    'logos:ansible',
    'devicon:ansible',
    'logos:terraform',
    'devicon:terraform',
    'logos:pulumi',
    'logos:puppet',
    'logos:chef',

    // 代码仓库
    'logos:git-icon',
    'devicon:git',
    'logos:github-icon',
    'devicon:github',
    'logos:gitlab',
    'logos:bitbucket',

    // 消息队列
    'logos:kafka',
    'devicon:apachekafka',
    'logos:rabbitmq',
    'simple-icons:rabbitmq',
    'logos:apache-pulsar',
    'simple-icons:nats',

    // 存储
    'logos:ceph',
    'logos:minio',
    'simple-icons:harbor',

    // 其他云原生工具
    'logos:etcd',
    'logos:vault',
    'simple-icons:vault',
    'logos:nginx',
    'devicon:nginx',
    'logos:traefik',
    'logos:haproxy',
    'logos:consul',
    'logos:nomad',
    'logos:packer',
    'logos:vagrant',

    // 通用云图标
    'ri:cloud-line',
    'ri:cloud-fill',
    'carbon:cloud',
    'carbon:cloud-app',
    'carbon:cloud-satellite',
    'carbon:ibm-cloud',
    'mdi:cloud',
    'mdi:cloud-outline'
  ]

  // ==================== 数据库图标 ====================
  const databaseIcons = [
    // 关系型数据库
    'logos:mysql',
    'devicon:mysql',
    'logos:postgresql',
    'devicon:postgresql',
    'logos:oracle',
    'devicon:oracle',
    'logos:microsoft-sql-server',
    'logos:mariadb',
    'simple-icons:sqlite',

    // NoSQL 数据库
    'logos:mongodb',
    'logos:mongodb-icon',
    'devicon:mongodb',
    'logos:redis',
    'devicon:redis',
    'logos:cassandra',
    'logos:couchbase',
    'logos:neo4j',
    'simple-icons:arangodb',

    // 时序数据库
    'simple-icons:influxdb',
    'simple-icons:timescale',
    'logos:clickhouse',

    // 云数据库
    'logos:amazon-dynamodb',
    'logos:google-cloud-spanner',
    'logos:azure-sql-database',

    // 数据仓库
    'simple-icons:snowflake',
    'logos:databricks',
    'logos:apache-hive',

    // 通用数据库图标
    'ri:database-line',
    'ri:database-2-line',
    'ri:database-fill',
    'carbon:data-base',
    'carbon:data-table',
    'mdi:database',
    'mdi:database-outline'
  ]

  // ==================== 开发工具图标 ====================
  const devtoolsIcons = [
    // IDE 和编辑器
    'logos:visual-studio-code',
    'devicon:vscode',
    'logos:intellij-idea',
    'logos:webstorm',
    'logos:pycharm',
    'logos:sublime-text',
    'logos:vim',
    'logos:emacs',

    // 编程语言
    'logos:javascript',
    'devicon:javascript',
    'logos:typescript-icon',
    'devicon:typescript',
    'logos:python',
    'devicon:python',
    'logos:java',
    'devicon:java',
    'logos:go',
    'devicon:go',
    'logos:rust',
    'devicon:rust',
    'logos:c',
    'logos:c-plusplus',
    'logos:csharp',
    'logos:php',
    'devicon:php',
    'logos:ruby',
    'devicon:ruby',

    // 前端框架
    'logos:vue',
    'devicon:vuejs',
    'logos:react',
    'devicon:react',
    'logos:angular-icon',
    'devicon:angular',
    'logos:svelte-icon',
    'devicon:svelte',
    'logos:nuxt-icon',
    'logos:nextjs',

    // 后端框架
    'logos:nodejs-icon',
    'devicon:nodejs',
    'logos:express',
    'logos:nestjs',
    'logos:spring',
    'devicon:spring',
    'logos:django',
    'devicon:django',
    'logos:flask',
    'devicon:flask',
    'logos:laravel',
    'devicon:laravel',

    // 构建工具
    'logos:webpack',
    'devicon:webpack',
    'logos:vitejs',
    'logos:rollup',
    'logos:gulp',
    'logos:grunt',
    'logos:babel',

    // 包管理器
    'logos:npm-icon',
    'devicon:npm',
    'logos:yarn',
    'devicon:yarn',
    'logos:pnpm',

    // 测试工具
    'logos:jest',
    'devicon:jest',
    'logos:mocha',
    'logos:cypress',
    'logos:playwright',
    'logos:selenium',

    // 版本控制
    'logos:git-icon',
    'devicon:git',
    'logos:github-icon',
    'devicon:github',
    'logos:gitlab',
    'devicon:gitlab',

    // 其他工具
    'logos:postman',
    'logos:swagger',
    'logos:graphql',
    'devicon:graphql',
    'logos:grpc',
    'logos:prettier',
    'logos:eslint',

    // 通用开发图标
    'ri:code-line',
    'ri:code-box-line',
    'ri:terminal-line',
    'ri:terminal-box-line',
    'carbon:code',
    'carbon:terminal',
    'mdi:code-tags'
  ]

  // ==================== 用户相关图标 ====================
  const userIcons = [
    'ri:user-line',
    'ri:user-2-line',
    'ri:user-3-line',
    'ri:user-4-line',
    'ri:user-5-line',
    'ri:user-6-line',
    'ri:user-add-line',
    'ri:user-follow-line',
    'ri:user-unfollow-line',
    'ri:user-settings-line',
    'ri:user-shared-line',
    'ri:user-received-line',
    'ri:admin-line',
    'ri:admin-fill',
    'ri:team-line',
    'ri:team-fill',
    'ri:group-line',
    'ri:group-2-line',
    'ri:contacts-line',
    'ri:contacts-fill',
    'ri:account-circle-line',
    'ri:account-circle-fill',
    'ri:account-box-line',
    'ri:account-box-fill',
    'ri:user-heart-line',
    'ri:user-smile-line',
    'ri:user-star-line',
    'ri:user-voice-line',
    'ri:user-search-line',
    'ri:user-location-line'
  ]

  // ==================== 文件相关图标 ====================
  const fileIcons = [
    'ri:folder-line',
    'ri:folder-2-line',
    'ri:folder-3-line',
    'ri:folder-4-line',
    'ri:folder-5-line',
    'ri:folder-open-line',
    'ri:folder-add-line',
    'ri:folder-reduce-line',
    'ri:folder-settings-line',
    'ri:folder-shared-line',
    'ri:folder-received-line',
    'ri:folder-transfer-line',
    'ri:folder-upload-line',
    'ri:folder-download-line',
    'ri:folder-lock-line',
    'ri:folder-user-line',
    'ri:folder-music-line',
    'ri:folder-video-line',
    'ri:folder-image-line',
    'ri:file-line',
    'ri:file-2-line',
    'ri:file-3-line',
    'ri:file-4-line',
    'ri:file-list-line',
    'ri:file-list-2-line',
    'ri:file-list-3-line',
    'ri:file-text-line',
    'ri:file-add-line',
    'ri:file-reduce-line',
    'ri:file-copy-line',
    'ri:file-transfer-line',
    'ri:file-upload-line',
    'ri:file-download-line',
    'ri:file-lock-line',
    'ri:file-user-line',
    'ri:file-code-line',
    'ri:file-pdf-line',
    'ri:file-excel-line',
    'ri:file-word-line',
    'ri:file-ppt-line',
    'ri:file-zip-line',
    'ri:article-line',
    'ri:article-fill',
    'ri:book-line',
    'ri:book-open-line',
    'ri:pages-line',
    'ri:clipboard-line',
    'ri:archive-line',
    'ri:archive-drawer-line'
  ]

  // ==================== 编辑操作图标 ====================
  const editIcons = [
    'ri:edit-line',
    'ri:edit-2-line',
    'ri:edit-box-line',
    'ri:edit-circle-line',
    'ri:pencil-line',
    'ri:pen-nib-line',
    'ri:ball-pen-line',
    'ri:quill-pen-line',
    'ri:add-line',
    'ri:add-circle-line',
    'ri:add-box-line',
    'ri:subtract-line',
    'ri:subtract-fill',
    'ri:close-line',
    'ri:close-circle-line',
    'ri:close-fill',
    'ri:delete-bin-line',
    'ri:delete-bin-2-line',
    'ri:delete-bin-3-line',
    'ri:delete-bin-4-line',
    'ri:delete-bin-5-line',
    'ri:delete-bin-6-line',
    'ri:delete-bin-7-line',
    'ri:delete-back-line',
    'ri:delete-back-2-line',
    'ri:save-line',
    'ri:save-2-line',
    'ri:save-3-line',
    'ri:download-line',
    'ri:download-2-line',
    'ri:download-cloud-line',
    'ri:upload-line',
    'ri:upload-2-line',
    'ri:upload-cloud-line',
    'ri:refresh-line',
    'ri:restart-line',
    'ri:loop-left-line',
    'ri:loop-right-line',
    'ri:check-line',
    'ri:check-double-line',
    'ri:checkbox-line',
    'ri:checkbox-circle-line',
    'ri:checkbox-multiple-line',
    'ri:undo-line',
    'ri:redo-line',
    'ri:repeat-line',
    'ri:repeat-2-line'
  ]

  // ==================== 图表相关图标 ====================
  const chartIcons = [
    'ri:bar-chart-line',
    'ri:bar-chart-2-line',
    'ri:bar-chart-box-line',
    'ri:bar-chart-fill',
    'ri:bar-chart-grouped-line',
    'ri:bar-chart-horizontal-line',
    'ri:pie-chart-line',
    'ri:pie-chart-2-line',
    'ri:pie-chart-box-line',
    'ri:pie-chart-fill',
    'ri:line-chart-line',
    'ri:line-chart-fill',
    'ri:donut-chart-line',
    'ri:donut-chart-fill',
    'ri:organization-chart',
    'ri:flow-chart',
    'ri:mind-map',
    'ri:node-tree',
    'ri:stock-line',
    'ri:stock-fill',
    'ri:funds-line',
    'ri:funds-box-line',
    'ri:funds-fill',
    'ri:percent-line',
    'ri:percent-fill',
    'carbon:chart-line',
    'carbon:chart-bar',
    'carbon:chart-pie',
    'carbon:chart-area',
    'carbon:chart-bubble',
    'carbon:analytics'
  ]

  // ==================== 网络相关图标 ====================
  const networkIcons = [
    'ri:wifi-line',
    'ri:wifi-fill',
    'ri:signal-wifi-line',
    'ri:signal-wifi-1-line',
    'ri:signal-wifi-2-line',
    'ri:signal-wifi-3-line',
    'ri:wifi-off-line',
    'ri:router-line',
    'ri:router-fill',
    'ri:global-line',
    'ri:global-fill',
    'ri:earth-line',
    'ri:earth-fill',
    'ri:link',
    'ri:link-m',
    'ri:link-unlink',
    'ri:link-unlink-m',
    'ri:links-line',
    'ri:links-fill',
    'ri:share-line',
    'ri:share-box-line',
    'ri:share-circle-line',
    'ri:share-forward-line',
    'ri:share-forward-2-line',
    'carbon:network-1',
    'carbon:network-2',
    'carbon:network-3',
    'carbon:network-4',
    'carbon:cloud-satellite',
    'carbon:vpn',
    'mdi:lan',
    'mdi:wan',
    'mdi:ip-network'
  ]

  // 所有图标集合
  const allIconsMap = {
    common: commonIcons,
    system: systemIcons,
    project: projectIcons,
    business: businessIcons,
    'cloud-native': cloudNativeIcons,
    database: databaseIcons,
    devtools: devtoolsIcons,
    user: userIcons,
    file: fileIcons,
    edit: editIcons,
    chart: chartIcons,
    network: networkIcons
  }

  // 全部图标（去重）
  const allIcons = computed(() => {
    const iconSet = new Set([
      ...commonIcons,
      ...systemIcons,
      ...projectIcons,
      ...businessIcons,
      ...cloudNativeIcons,
      ...databaseIcons,
      ...devtoolsIcons,
      ...userIcons,
      ...fileIcons,
      ...editIcons,
      ...chartIcons,
      ...networkIcons
    ])
    return Array.from(iconSet)
  })

  // 🔥 修复：根据分类获取图标
  const getIconsByTab = computed(() => {
    if (activeTab.value === 'all') {
      return allIcons.value
    }
    return allIconsMap[activeTab.value as keyof typeof allIconsMap] || []
  })

  // 🔥 修复：过滤逻辑 - 搜索时在所有图标中搜索
  const filteredIcons = computed(() => {
    // 如果没有搜索关键词，返回当前分类的图标
    if (!searchText.value.trim()) {
      return getIconsByTab.value
    }

    // 🔥 有搜索关键词时，始终在所有图标中搜索
    const keyword = searchText.value.toLowerCase().trim()
    return allIcons.value.filter((icon) => {
      const iconLower = icon.toLowerCase()
      // 支持多种搜索方式
      return (
        iconLower.includes(keyword) ||
        icon.split(':')[1]?.toLowerCase().includes(keyword) || // 只搜索图标名称部分
        icon.split(':')[0]?.toLowerCase().includes(keyword) // 搜索图标库前缀
      )
    })
  })

  /**
   * 获取图标数量
   */
  const getIconCount = (tab: string): number => {
    if (tab === 'all') {
      return allIcons.value.length
    }
    return allIconsMap[tab as keyof typeof allIconsMap]?.length || 0
  }

  /**
   * 获取图标显示名称
   */
  const getIconName = (icon: string): string => {
    const parts = icon.split(':')
    const name = parts[1] || parts[0]
    // 转换为更友好的显示名称
    return name.replace(/-/g, ' ').replace(/_/g, ' ')
  }

  /**
   * 处理输入变化
   */
  const handleInputChange = (value: string) => {
    emit('update:modelValue', value)
    emit('change', value)
  }

  /**
   * 处理清空
   */
  const handleClear = () => {
    emit('update:modelValue', '')
    emit('change', '')
  }

  /**
   * 🔥 修复：处理标签切换 - 切换分类时清空搜索
   */
  const handleTabChange = (tab: string) => {
    activeTab.value = tab
    searchText.value = '' // 清空搜索，显示该分类的所有图标
  }

  /**
   * 处理选择
   */
  const handleSelect = (icon: string) => {
    emit('update:modelValue', icon)
    emit('change', icon)
    visible.value = false
  }
</script>

<style scoped lang="scss">
  .art-icon-selector {
    width: 100%;
  }

  .icon-selector-content {
    padding: 12px;

    .icon-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding-bottom: 4px;

      .tab-item {
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        font-size: 13px;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }
    }

    .icon-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 10px;
      padding: 8px 4px;

      .icon-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 14px 10px;
        border: 1px solid var(--el-border-color);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--el-fill-color-blank);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, var(--el-color-primary-light-9), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        &:hover {
          border-color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

          &::before {
            opacity: 1;
          }

          .icon-name {
            color: var(--el-color-primary);
          }
        }

        &.active {
          border-color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-8);
          box-shadow: 0 0 0 3px var(--el-color-primary-light-9);

          .icon-name {
            color: var(--el-color-primary);
            font-weight: 600;
          }
        }

        .icon-name {
          margin-top: 8px;
          font-size: 11px;
          color: var(--el-text-color-secondary);
          text-align: center;
          word-break: break-word;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.3;
          max-width: 100%;
          transition: color 0.3s;
          text-transform: capitalize;
        }
      }
    }

    .icon-footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--el-border-color-lighter);
      text-align: center;
    }
  }
</style>
