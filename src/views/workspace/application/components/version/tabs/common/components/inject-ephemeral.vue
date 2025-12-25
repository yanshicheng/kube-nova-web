<template>
  <ElDialog
    v-model="visible"
    title="注入临时容器"
    width="900px"
    class="inject-ephemeral-dialog"
    @closed="handleClosed"
    :close-on-click-modal="false"
  >
    <div class="dialog-content">
      <!-- 提示信息 -->
      <ElAlert type="info" :closable="false" show-icon class="info-alert">
        <template #title>
          <div class="alert-content">
            临时容器用于调试运行中的 Pod，不会重启容器，注入后可使用终端进入调试
          </div>
        </template>
      </ElAlert>

      <!-- Pod 信息 -->
      <div class="pod-info-card">
        <div class="info-label">目标 Pod</div>
        <div class="info-value">{{ podName }}</div>
      </div>

      <!-- 表单 -->
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="140px"
        label-position="left"
        class="inject-form"
      >
        <!-- 基本配置 -->
        <div class="section-header">
          <Package :size="16" />
          <span>基本配置</span>
        </div>

        <ElFormItem label="容器名称" prop="containerName">
          <template #label>
            <span>容器名称</span>
            <ElTooltip content="留空系统将自动生成唯一名称" placement="top">
              <HelpCircle :size="14" class="label-help-icon" />
            </ElTooltip>
          </template>
          <ElInput
            v-model="formData.containerName"
            placeholder="留空自动生成（如：debugger-abc123）"
            clearable
          >
            <template #prefix>
              <Package :size="14" />
            </template>
          </ElInput>
          <div class="form-tip">建议留空，系统将自动生成唯一名称</div>
        </ElFormItem>

        <ElFormItem label="镜像地址" prop="image">
          <template #label>
            <span>镜像地址</span>
            <ElTooltip content="从下方选择常用镜像或从仓库选择自定义镜像" placement="top">
              <HelpCircle :size="14" class="label-help-icon" />
            </ElTooltip>
          </template>
          <div class="image-display-field">
            <div v-if="formData.image" class="image-value-display">
              <code>{{ formData.image }}</code>
              <ElButton text type="primary" size="small" @click="copyCurrentImage" class="copy-btn">
                <Copy :size="14" />
                复制
              </ElButton>
            </div>
            <div v-else class="image-empty-display">
              <span class="empty-text">未选择镜像</span>
            </div>
          </div>
          <div v-if="!formData.image" class="form-tip tip-warning">
            <Info :size="12" />
            <span>请选择镜像：可点击下方"常用镜像"快速选择，或使用"镜像搜索"自定义</span>
          </div>
          <div v-else class="form-tip tip-success">
            <Check :size="12" />
            <span>{{ formData.image }}</span>
          </div>
        </ElFormItem>

        <!-- 镜像搜索 -->
        <div class="section-header" style="margin-top: 28px">
          <Search :size="16" />
          <span>镜像搜索（可选：从仓库搜索自定义镜像）</span>
        </div>

        <ElFormItem label="镜像搜索">
          <template #label>
            <span>镜像搜索</span>
            <ElTooltip content="快速搜索镜像，支持模糊匹配" placement="top">
              <HelpCircle :size="14" class="label-help-icon" />
            </ElTooltip>
          </template>
          <ElInput
            v-model="imageSearch"
            placeholder="搜索镜像名称，如: netshoot, busybox..."
            clearable
          >
            <template #prefix>
              <Search :size="16" />
            </template>
            <template #append>
              <ElButton @click="handleImageSearchClick" :loading="searchingImages">
                <Search :size="14" />
                搜索
              </ElButton>
            </template>
          </ElInput>
          <div v-if="searchApplied" class="search-hint">
            <Info :size="12" />
            <span>已应用搜索过滤，找到 {{ getTotalFilteredCount() }} 个结果</span>
            <ElButton text type="primary" size="small" @click="clearSearch"> 清除过滤 </ElButton>
          </div>
        </ElFormItem>

        <!-- 镜像选择 -->
        <div class="section-header">
          <Layers :size="16" />
          <span>镜像选择（可选：从仓库选择自定义镜像）</span>
        </div>

        <ElFormItem label="镜像仓库">
          <template #label>
            <span>镜像仓库</span>
            <ElTooltip content="选择镜像所在的仓库" placement="top">
              <HelpCircle :size="14" class="label-help-icon" />
            </ElTooltip>
          </template>
          <ElSelect
            v-model="imageConfig.registryUuid"
            placeholder="选择仓库"
            filterable
            :loading="loadingRegistries"
            @change="handleRegistryChange"
          >
            <ElOption
              v-for="registry in displayRegistries"
              :key="registry.registryUuid"
              :label="registry.registryName"
              :value="registry.registryUuid"
            >
              <div class="registry-option">
                <span>{{ registry.registryName }}</span>
                <ElTag size="small" type="info">{{ registry.registryType }}</ElTag>
              </div>
            </ElOption>
            <template #footer>
              <div
                v-if="registryPagination.hasMore"
                v-loading="loadingRegistries"
                class="select-loading-more"
                @click="loadMoreRegistries"
              >
                <span v-if="!loadingRegistries">点击加载更多</span>
              </div>
            </template>
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="项目/命名空间">
          <template #label>
            <span>项目/命名空间</span>
            <ElTooltip content="镜像所属的项目或命名空间" placement="top">
              <HelpCircle :size="14" class="label-help-icon" />
            </ElTooltip>
          </template>
          <ElSelect
            v-model="imageConfig.project"
            placeholder="选择项目"
            filterable
            :loading="loadingProjects"
            :disabled="!imageConfig.registryUuid"
            @change="handleProjectChange"
          >
            <ElOption
              v-for="project in displayProjects"
              :key="project.name"
              :label="project.name"
              :value="project.name"
            />
            <template #footer>
              <div
                v-if="projectPagination.hasMore"
                v-loading="loadingProjects"
                class="select-loading-more"
                @click="loadMoreProjects"
              >
                <span v-if="!loadingProjects">点击加载更多</span>
              </div>
            </template>
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="镜像名称">
          <template #label>
            <span>镜像名称</span>
            <ElTooltip content="选择具体的镜像" placement="top">
              <HelpCircle :size="14" class="label-help-icon" />
            </ElTooltip>
          </template>
          <ElSelect
            v-model="imageConfig.image"
            placeholder="选择镜像"
            filterable
            :loading="loadingImages"
            :disabled="!imageConfig.project"
            @change="handleImageChange"
          >
            <ElOption
              v-for="img in displayImages"
              :key="img.name"
              :label="img.displayName"
              :value="img.name"
            />
            <template #footer>
              <div
                v-if="imagePagination.hasMore"
                v-loading="loadingImages"
                class="select-loading-more"
                @click="loadMoreImages"
              >
                <span v-if="!loadingImages">点击加载更多</span>
              </div>
            </template>
          </ElSelect>
          <div v-if="imageConfig.project && images.length > 0" class="form-tip">
            共 {{ imagePagination.total }} 个镜像
            <span v-if="searchApplied && displayImages.length !== images.length">
              （过滤后显示 {{ displayImages.length }} 个）
            </span>
          </div>
        </ElFormItem>

        <ElFormItem label="版本标签">
          <template #label>
            <span>版本标签</span>
            <ElTooltip content="选择镜像的版本标签" placement="top">
              <HelpCircle :size="14" class="label-help-icon" />
            </ElTooltip>
          </template>
          <ElSelect
            v-model="imageConfig.tag"
            placeholder="选择标签"
            filterable
            :loading="loadingTags"
            :disabled="!imageConfig.image"
            @change="handleTagChange"
          >
            <ElOption
              v-for="tag in displayTags"
              :key="tag.name"
              :label="tag.name"
              :value="tag.name"
            >
              <div class="tag-option">
                <span>{{ tag.name }}</span>
                <span class="tag-size">{{ tag.size }}</span>
              </div>
            </ElOption>
            <template #footer>
              <div
                v-if="tagPagination.hasMore"
                v-loading="loadingTags"
                class="select-loading-more"
                @click="loadMoreTags"
              >
                <span v-if="!loadingTags">点击加载更多</span>
              </div>
            </template>
          </ElSelect>
        </ElFormItem>

        <!-- 启动配置 -->
        <div class="section-header" style="margin-top: 24px">
          <Terminal :size="16" />
          <span>启动配置</span>
        </div>

        <ElFormItem label="启动命令" prop="command">
          <template #label>
            <span>启动命令</span>
            <ElTooltip content="留空使用镜像默认命令" placement="top">
              <HelpCircle :size="14" class="label-help-icon" />
            </ElTooltip>
          </template>
          <ElInput v-model="formData.command" placeholder="留空使用镜像默认命令" clearable>
            <template #prefix>
              <Terminal :size="14" />
            </template>
          </ElInput>
          <div class="form-tip">
            多个参数用空格分隔，例如：<code>/bin/sh</code> 或 <code>/bin/bash</code>
          </div>
        </ElFormItem>

        <ElFormItem label="命令参数" prop="args">
          <template #label>
            <span>命令参数</span>
            <ElTooltip content="留空则无额外参数" placement="top">
              <HelpCircle :size="14" class="label-help-icon" />
            </ElTooltip>
          </template>
          <ElInput
            v-model="formData.args"
            type="textarea"
            :rows="2"
            placeholder="留空则无额外参数，每行一个参数"
            clearable
          />
          <div class="form-tip">
            每行一个参数，例如：<br />
            <code>-c</code><br />
            <code>sleep 3600</code>
          </div>
        </ElFormItem>
      </ElForm>

      <!-- 常用镜像说明 -->
      <div class="image-recommendations" style="margin-top: 28px">
        <div class="recommendations-header">
          <Lightbulb :size="14" />
          <span>常用调试镜像推荐（点击快速填充）</span>
        </div>
        <div class="recommendations-list">
          <div
            class="recommendation-card"
            :class="{ selected: selectedCommonImage === img.value }"
            v-for="img in commonImages"
            :key="img.value"
            @click="handleSelectCommonImage(img)"
          >
            <div class="card-header">
              <span class="card-title">{{ img.label }}</span>
              <div class="card-tags">
                <ElTag size="small" :type="img.recommended ? 'success' : 'info'">
                  {{ img.recommended ? '推荐' : '可选' }}
                </ElTag>
                <ElTag
                  v-if="selectedCommonImage === img.value"
                  size="small"
                  type="primary"
                  effect="dark"
                >
                  已选择
                </ElTag>
              </div>
            </div>
            <div class="card-desc">{{ img.desc }}</div>
            <div class="card-tools">
              <span>工具集：</span>
              <code>{{ img.tools }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="visible = false" :disabled="submitting">取消</ElButton>
        <ElButton
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
          :disabled="!formData.image || !formData.image.trim()"
        >
          <Syringe :size="14" v-if="!submitting" />
          {{ submitting ? '注入中...' : '开始注入' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import {
    Package,
    Terminal,
    Layers,
    Syringe,
    Lightbulb,
    HelpCircle,
    Search,
    Info,
    Copy,
    Check
  } from 'lucide-vue-next'
  import {
    listClusterRegistriesApi,
    listProjectsByAppApi,
    listRepositoriesApi,
    listArtifactsApi,
    searchImagesGlobalByProjectApi,
    type OnecProjectApplication,
    type OnecProjectVersion,
    type ProjectCluster,
    type ProjectWorkspace
  } from '@/api'

  interface Props {
    modelValue: boolean
    podName: string
    submitting?: boolean
    version: OnecProjectVersion
    application: OnecProjectApplication
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
  }

  interface FormData {
    containerName: string
    image: string
    command: string
    args: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (
      e: 'submit',
      data: {
        containerName?: string
        image?: string
        command?: string[]
        args?: string[]
      }
    ): void
  }

  const props = withDefaults(defineProps<Props>(), {
    submitting: false
  })

  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const projectId = computed(() => props.cluster?.projectId)
  const clusterUuid = computed(
    () => props.cluster?.clusterUuid || props.cluster?.uuid || `cluster-${props.cluster?.id}`
  )

  const formRef = ref<FormInstance>()
  const formData = reactive<FormData>({
    containerName: '',
    image: '',
    command: '',
    args: ''
  })

  // 选中的常用镜像
  const selectedCommonImage = ref('')

  // 镜像搜索
  const imageSearch = ref('')
  const searchingImages = ref(false)
  const searchApplied = ref(false)
  const searchResults = ref<any>(null)
  const searchPagination = ref({ page: 1, pageSize: 50, total: 0, hasMore: false })

  // 镜像配置
  const imageConfig = ref({
    registryUuid: '',
    registryUrl: '',
    project: '',
    image: '',
    tag: ''
  })

  // 加载状态
  const loadingRegistries = ref(false)
  const loadingProjects = ref(false)
  const loadingImages = ref(false)
  const loadingTags = ref(false)

  // 分页状态
  const registryPagination = ref({ page: 1, pageSize: 20, total: 0, hasMore: false })
  const projectPagination = ref({ page: 1, pageSize: 20, total: 0, hasMore: false })
  const imagePagination = ref({ page: 1, pageSize: 20, total: 0, hasMore: false })
  const tagPagination = ref({ page: 1, pageSize: 20, total: 0, hasMore: false })

  // 原始数据列表
  const registries = ref<any[]>([])
  const projects = ref<any[]>([])
  const images = ref<
    Array<{
      name: string
      displayName: string
      originalName: string
      artifactCount: number
      pullCount: number
    }>
  >([])
  const tags = ref<any[]>([])

  // 常用调试镜像
  const commonImages = [
    {
      label: 'nicolaka/netshoot',
      value: 'nicolaka/netshoot:latest',
      desc: '网络调试神器，包含100+网络工具',
      tools: 'tcpdump, curl, wget, netstat, nslookup, iperf3, nmap',
      recommended: true
    },
    {
      label: 'busybox',
      value: 'busybox:latest',
      desc: '超轻量级工具集，体积小启动快',
      tools: 'sh, ls, cat, ps, top, netstat, ping',
      recommended: false
    },
    {
      label: 'alpine',
      value: 'alpine:latest',
      desc: 'Alpine Linux，可通过 apk 安装工具',
      tools: 'apk, ash, wget, nc, ping',
      recommended: false
    },
    {
      label: 'ubuntu',
      value: 'ubuntu:latest',
      desc: '完整的 Ubuntu 系统，工具最全',
      tools: 'apt, bash, vim, curl, wget, netstat',
      recommended: false
    }
  ]

  const rules: FormRules = {}

  function removeProjectPrefix(repoName: string, projectName: string): string {
    if (!repoName || !projectName) return repoName || ''
    const projectPrefix = `${projectName}/`
    if (repoName.startsWith(projectPrefix)) {
      return repoName.substring(projectPrefix.length)
    }
    return repoName
  }

  function cleanRegistryUrl(url: string): string {
    if (!url) return url
    return url.replace(/^https?:\/\//, '')
  }

  function formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const displayRegistries = computed(() => {
    if (
      !searchApplied.value ||
      !searchResults.value?.data ||
      !Array.isArray(searchResults.value.data)
    ) {
      return registries.value
    }
    const searchRegistryUuids = new Set(
      searchResults.value.data.map((r: any) => r?.registryUuid).filter(Boolean)
    )
    return registries.value.filter((r) => searchRegistryUuids.has(r.registryUuid))
  })

  const displayProjects = computed(() => {
    if (!searchApplied.value || !searchResults.value?.data || !imageConfig.value.registryUuid) {
      return projects.value
    }

    const registryResult = searchResults.value.data.find(
      (r: any) => r?.registryUuid === imageConfig.value.registryUuid
    )

    if (!registryResult?.images || !Array.isArray(registryResult.images)) {
      return []
    }

    const searchProjectNames = new Set(
      registryResult.images.map((img: any) => img?.projectName).filter(Boolean)
    )
    return projects.value.filter((p) => searchProjectNames.has(p.name))
  })

  const displayImages = computed(() => {
    if (searchApplied.value && searchResults.value?.data && imageConfig.value.project) {
      return images.value
    }
    return images.value
  })

  const displayTags = computed(() => {
    if (searchApplied.value && searchResults.value?.data && imageConfig.value.image) {
      return tags.value
    }
    return tags.value
  })

  const fullImageUrl = computed(() => {
    const { registryUrl, project, image, tag } = imageConfig.value
    if (!image) return ''

    let url = ''
    if (registryUrl && registryUrl !== 'docker.io') {
      url = registryUrl + '/'
    }
    if (project) {
      url += project + '/'
    }
    url += image
    if (tag) {
      url += ':' + tag
    }
    return url
  })

  // ==================== API 调用 ====================

  async function fetchRegistries(page: number = 1, append: boolean = false) {
    if (!clusterUuid.value) return

    loadingRegistries.value = true
    try {
      const res = await listClusterRegistriesApi({ clusterUuid: clusterUuid.value })

      if (!res?.data) {
        registries.value = []
        registryPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
        return
      }

      const newData = res.data
        .filter((item) => item?.registry?.uuid)
        .map((item) => ({
          registryId: item.registryId,
          registryUuid: item.registry.uuid,
          registryName: item.registry.name || '未命名仓库',
          registryUrl: cleanRegistryUrl(item.registry.url || ''),
          registryType: item.registry.type || 'Harbor'
        }))

      if (append) {
        registries.value = [...registries.value, ...newData]
      } else {
        registries.value = newData
      }

      registryPagination.value.page = page
      registryPagination.value.total = newData.length
      registryPagination.value.hasMore = false
    } catch (error) {
      console.error('❌ 加载镜像仓库列表失败:', error)
      registries.value = []
    } finally {
      loadingRegistries.value = false
    }
  }

  async function loadMoreRegistries() {
    if (loadingRegistries.value || !registryPagination.value.hasMore) return
    await fetchRegistries(registryPagination.value.page + 1, true)
  }

  async function fetchProjects(registryUuid: string, page: number = 1, append: boolean = false) {
    if (!projectId.value || !clusterUuid.value || !registryUuid) return

    loadingProjects.value = true
    try {
      const res = await listProjectsByAppApi({
        appProjectId: projectId.value,
        clusterUuid: clusterUuid.value,
        registryUuid: registryUuid,
        page: page,
        pageSize: projectPagination.value.pageSize
      })

      if (!res?.items) {
        projects.value = []
        projectPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
        return
      }

      const newData = res.items.map((project) => ({
        name: project.name,
        projectId: project.projectId
      }))

      if (append) {
        projects.value = [...projects.value, ...newData]
      } else {
        projects.value = newData
      }

      projectPagination.value.page = page
      projectPagination.value.total = res.total
      projectPagination.value.hasMore = projects.value.length < res.total
    } catch (error) {
      console.error('❌ 加载项目列表失败:', error)
      projects.value = []
    } finally {
      loadingProjects.value = false
    }
  }

  async function loadMoreProjects() {
    if (
      loadingProjects.value ||
      !projectPagination.value.hasMore ||
      !imageConfig.value.registryUuid
    )
      return
    await fetchProjects(imageConfig.value.registryUuid, projectPagination.value.page + 1, true)
  }

  async function fetchImages(
    registryUuid: string,
    projectName: string,
    page: number = 1,
    append: boolean = false
  ) {
    if (!registryUuid || !projectName) return

    loadingImages.value = true
    try {
      const res = await listRepositoriesApi({
        registryUuid: registryUuid,
        projectName: projectName,
        page: page,
        pageSize: imagePagination.value.pageSize,
        sortBy: 'update_time',
        sortDesc: true
      })

      if (!res?.items) {
        images.value = []
        imagePagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
        return
      }

      const newData = res.items.map((repo) => {
        const originalName = repo.name
        const cleanedName = removeProjectPrefix(repo.name, projectName)

        return {
          name: cleanedName,
          displayName: cleanedName,
          originalName: originalName,
          artifactCount: repo.artifactCount,
          pullCount: repo.pullCount
        }
      })

      if (append) {
        images.value = [...images.value, ...newData]
      } else {
        images.value = newData
      }

      imagePagination.value.page = page
      imagePagination.value.total = res.total
      imagePagination.value.hasMore = images.value.length < res.total
    } catch (error) {
      console.error('❌ 加载镜像列表失败:', error)
      images.value = []
    } finally {
      loadingImages.value = false
    }
  }

  async function loadMoreImages() {
    if (searchApplied.value) return

    if (
      loadingImages.value ||
      !imagePagination.value.hasMore ||
      !imageConfig.value.registryUuid ||
      !imageConfig.value.project
    )
      return
    await fetchImages(
      imageConfig.value.registryUuid,
      imageConfig.value.project,
      imagePagination.value.page + 1,
      true
    )
  }

  async function fetchTags(
    registryUuid: string,
    projectName: string,
    repoName: string,
    page: number = 1,
    append: boolean = false
  ) {
    if (!registryUuid || !projectName || !repoName) return

    loadingTags.value = true
    try {
      const res = await listArtifactsApi({
        registryUuid: registryUuid,
        projectName: projectName,
        repoName: repoName,
        page: page,
        pageSize: tagPagination.value.pageSize,
        sortBy: 'push_time',
        sortDesc: true
      })

      const newTags: any[] = []
      res.items.forEach((artifact) => {
        artifact.tags.forEach((tag) => {
          newTags.push({
            name: tag.name,
            size: formatSize(artifact.size),
            pushTime: tag.pushTime,
            artifactId: artifact.id,
            digest: artifact.digest
          })
        })
      })

      if (append) {
        tags.value = [...tags.value, ...newTags]
      } else {
        tags.value = newTags
      }

      tagPagination.value.page = page
      tagPagination.value.total = res.total
      tagPagination.value.hasMore = tags.value.length < res.total
    } catch (error) {
      console.error('❌ 加载标签列表失败:', error)
      tags.value = []
    } finally {
      loadingTags.value = false
    }
  }

  async function loadMoreTags() {
    if (
      loadingTags.value ||
      !tagPagination.value.hasMore ||
      !imageConfig.value.registryUuid ||
      !imageConfig.value.project ||
      !imageConfig.value.image
    )
      return

    const selectedImage = images.value.find((img) => img.name === imageConfig.value.image)
    const repoName = selectedImage?.originalName || imageConfig.value.image

    await fetchTags(
      imageConfig.value.registryUuid,
      imageConfig.value.project,
      repoName,
      tagPagination.value.page + 1,
      true
    )
  }

  // ==================== 镜像搜索 ====================

  function handleImageSearchClick() {
    handleImageSearch(1, false)
  }

  async function handleImageSearch(page: number = 1, append: boolean = false) {
    if (!imageSearch.value.trim()) {
      return
    }

    if (!projectId.value || !clusterUuid.value) {
      return
    }

    searchingImages.value = true
    try {
      const res = await searchImagesGlobalByProjectApi({
        appProjectId: projectId.value,
        clusterUuid: clusterUuid.value,
        imageName: imageSearch.value.trim(),
        page: page,
        pageSize: searchPagination.value.pageSize
      })

      if (res?.data && Array.isArray(res.data)) {
        res.data = res.data.map((registry: any) => ({
          ...registry,
          registryUrl: cleanRegistryUrl(registry?.registryUrl || '')
        }))
      }

      if (append && searchResults.value) {
        searchResults.value.data = [...searchResults.value.data, ...res.data]
      } else {
        searchResults.value = res
      }

      searchPagination.value.page = page
      searchPagination.value.total = res.total || 0
      searchPagination.value.hasMore = searchResults.value.data?.length < (res.total || 0)

      if ((!searchResults.value.data || searchResults.value.data.length === 0) && page === 1) {
        ElMessage.info('未找到匹配的镜像')
        searchApplied.value = false
        return
      }

      searchApplied.value = true

      const totalImages = searchResults.value.data.reduce((sum: number, r: any) => {
        return sum + (r?.images && Array.isArray(r.images) ? r.images.length : 0)
      }, 0)

      if (page === 1) {
        ElMessage.success(`找到 ${totalImages} 个匹配的镜像，已自动过滤下拉列表`)
        imageConfig.value.registryUuid = ''
        imageConfig.value.registryUrl = ''
        imageConfig.value.project = ''
        imageConfig.value.image = ''
        imageConfig.value.tag = ''
      }
    } catch (error) {
      console.error('❌ 搜索镜像失败:', error)
      searchApplied.value = false
    } finally {
      searchingImages.value = false
    }
  }

  function clearSearch() {
    imageSearch.value = ''
    searchResults.value = null
    searchApplied.value = false
    searchPagination.value = { page: 1, pageSize: 50, total: 0, hasMore: false }
    imageConfig.value.image = ''
    imageConfig.value.tag = ''
    // 如果是通过仓库选择的镜像，需要清空
    if (!selectedCommonImage.value) {
      formData.image = ''
    }
  }

  function getTotalFilteredCount() {
    if (!searchResults.value?.data || !Array.isArray(searchResults.value.data)) {
      return 0
    }
    return searchResults.value.data.reduce((sum: number, r: any) => {
      return sum + (r?.images && Array.isArray(r.images) ? r.images.length : 0)
    }, 0)
  }

  // ==================== 事件处理 ====================

  // 选择常用镜像
  const handleSelectCommonImage = (img: any) => {
    // 清空仓库选择（使用公共镜像）
    resetImageSelection()
    clearSearch()

    // 填充镜像地址
    formData.image = img.value
    selectedCommonImage.value = img.value

    // 根据镜像类型自动填充命令
    if (img.label === 'busybox' || img.label === 'alpine') {
      // 轻量镜像使用 sh
      formData.command = '/bin/sh'
    } else {
      // 其他镜像使用 bash
      formData.command = '/bin/bash'
    }

    // 填充参数：保持容器永久运行
    formData.args = '-c\nsleep infinity'

    ElMessage.success(`已选择镜像 ${img.label}，容器将保持运行状态`)
  }

  const resetImageSelection = () => {
    imageConfig.value = {
      registryUuid: '',
      registryUrl: '',
      project: '',
      image: '',
      tag: ''
    }
    // 如果是通过仓库选择的镜像，需要清空
    if (!selectedCommonImage.value) {
      formData.image = ''
    }
    projects.value = []
    images.value = []
    tags.value = []
    projectPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    imagePagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    tagPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
  }

  async function handleRegistryChange(registryUuid: string) {
    // 用户手动选择仓库时，清除常用镜像选择
    selectedCommonImage.value = ''
    formData.image = ''

    imageConfig.value.project = ''
    imageConfig.value.image = ''
    imageConfig.value.tag = ''
    projects.value = []
    images.value = []
    tags.value = []
    projectPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    imagePagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    tagPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }

    if (!registryUuid) return

    const selectedRegistry = registries.value.find((r) => r.registryUuid === registryUuid)

    if (selectedRegistry) {
      imageConfig.value.registryUrl = selectedRegistry.registryUrl
      await fetchProjects(selectedRegistry.registryUuid)
    }
  }

  async function handleProjectChange() {
    imageConfig.value.image = ''
    imageConfig.value.tag = ''
    formData.image = ''
    images.value = []
    tags.value = []
    imagePagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    tagPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }

    if (!imageConfig.value.project || !imageConfig.value.registryUuid) return

    if (searchApplied.value && searchResults.value?.data) {
      const registryResult = searchResults.value.data.find(
        (r: any) => r?.registryUuid === imageConfig.value.registryUuid
      )

      if (registryResult?.images && Array.isArray(registryResult.images)) {
        const projectImages = registryResult.images.filter(
          (img: any) => img?.projectName === imageConfig.value.project
        )

        images.value = projectImages.map((img: any) => {
          const originalName = img.repoName || ''
          const cleanedName = removeProjectPrefix(originalName, imageConfig.value.project)

          return {
            name: cleanedName,
            displayName: cleanedName,
            originalName: originalName,
            artifactCount: 0,
            pullCount: 0
          }
        })

        imagePagination.value.total = images.value.length
        imagePagination.value.hasMore = false

        if (images.value.length === 0) {
          ElMessage.warning({
            message: `项目 "${imageConfig.value.project}" 下没有匹配 "${imageSearch.value}" 的镜像`,
            duration: 3000
          })
        }
      }
    } else {
      await fetchImages(imageConfig.value.registryUuid, imageConfig.value.project)
    }
  }

  async function handleImageChange() {
    imageConfig.value.tag = ''
    formData.image = ''
    tags.value = []
    tagPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }

    if (!imageConfig.value.image || !imageConfig.value.registryUuid || !imageConfig.value.project)
      return

    if (searchApplied.value && searchResults.value?.data) {
      const registryResult = searchResults.value.data.find(
        (r: any) => r?.registryUuid === imageConfig.value.registryUuid
      )

      if (registryResult?.images && Array.isArray(registryResult.images)) {
        const imageResult = registryResult.images.find((img: any) => {
          if (!img?.repoName || !img?.projectName) return false
          const cleanedName = removeProjectPrefix(img.repoName, img.projectName)
          return (
            img.projectName === imageConfig.value.project && cleanedName === imageConfig.value.image
          )
        })

        if (imageResult?.tags && Array.isArray(imageResult.tags)) {
          tags.value = imageResult.tags.map((tagName: string) => ({
            name: tagName,
            size: '-',
            pushTime: 0,
            artifactId: 0,
            digest: ''
          }))

          tagPagination.value.total = tags.value.length
          tagPagination.value.hasMore = false
          return
        }
      }
    }

    const selectedImage = images.value.find((img) => img.name === imageConfig.value.image)
    const repoName = selectedImage?.originalName || imageConfig.value.image
    await fetchTags(imageConfig.value.registryUuid, imageConfig.value.project, repoName)
  }

  function handleTagChange() {
    // 标签变化后，fullImageUrl 会自动更新
    // 同时更新 formData.image 以便提交
    if (fullImageUrl.value) {
      formData.image = fullImageUrl.value
      // 清除常用镜像选择（因为用户选择了自定义镜像）
      selectedCommonImage.value = ''
    }
  }

  async function copyImageUrl() {
    try {
      await navigator.clipboard.writeText(fullImageUrl.value)
      ElMessage.success('镜像地址已复制到剪贴板')
    } catch {}
  }

  async function copyCurrentImage() {
    if (!formData.image) return
    try {
      await navigator.clipboard.writeText(formData.image)
      ElMessage.success('镜像地址已复制到剪贴板')
    } catch {}
  }

  // 将字符串转换为数组
  const parseStringToArray = (str: string): string[] => {
    if (!str || !str.trim()) {
      return []
    }

    // 如果是多行文本（args），按行分割
    if (str.includes('\n')) {
      return str
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    }

    // 如果是单行文本（command），按空格分割
    return str
      .trim()
      .split(/\s+/)
      .filter((item) => item.length > 0)
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      // 检查是否选择了镜像
      if (!formData.image || !formData.image.trim()) {
        return
      }

      // 二次确认
      await ElMessageBox.confirm(
        `确定要向 Pod "${props.podName}" 注入临时容器吗？\n\n使用镜像：${formData.image}\n\n注入后可通过终端功能进入容器进行调试。`,
        '确认注入',
        {
          confirmButtonText: '确定注入',
          cancelButtonText: '取消',
          type: 'info',
          distinguishCancelAndClose: true
        }
      )

      // 构建提交数据，所有字段都可选，只在有值时添加
      const submitData: any = {}

      // containerName 可选
      if (formData.containerName && formData.containerName.trim()) {
        submitData.containerName = formData.containerName.trim()
      }

      // image 可选（直接使用 formData.image）
      if (formData.image && formData.image.trim()) {
        submitData.image = formData.image.trim()
      }

      // command 可选
      const commandArray = parseStringToArray(formData.command)
      if (commandArray.length > 0) {
        submitData.command = commandArray
      }

      // args 可选
      const argsArray = parseStringToArray(formData.args)
      if (argsArray.length > 0) {
        submitData.args = argsArray
      }

      emit('submit', submitData)
    } catch (error: any) {
      if (error === 'cancel' || error === 'close') {
        return
      }
      console.error('表单验证失败:', error)
    }
  }

  const handleClosed = () => {
    // 重置表单
    formRef.value?.resetFields()
    formData.containerName = ''
    formData.image = ''
    formData.command = ''
    formData.args = ''
    selectedCommonImage.value = ''
    resetImageSelection()
    clearSearch()
  }

  // 监听对话框打开
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        // 对话框打开时重置表单
        handleClosed()
        // 加载镜像仓库列表
        if (clusterUuid.value) {
          fetchRegistries()
        }
      }
    }
  )
</script>

<style lang="scss" scoped>
  .inject-ephemeral-dialog {
    .dialog-content {
      .info-alert {
        margin-bottom: 20px;
        border-radius: 8px;

        .alert-content {
          font-size: 13px;
          line-height: 1.6;
        }
      }

      .pod-info-card {
        padding: 16px;
        background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 12px;

        .info-label {
          color: #606266;
          font-weight: 500;
          font-size: 14px;
        }

        .info-value {
          color: #303133;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
          font-size: 14px;
        }
      }

      .inject-form {
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 20px 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:first-of-type {
            margin-top: 0;
          }
        }

        :deep(.el-form-item) {
          margin-bottom: 22px;

          .el-form-item__label {
            font-weight: 500;
            display: flex;
            align-items: center;
          }

          .el-form-item__content {
            line-height: normal;
          }
        }

        :deep(.el-input),
        :deep(.el-select),
        :deep(.el-textarea) {
          max-width: 100%;
        }

        .image-display-field {
          width: 100%;
          min-height: 40px;

          .image-value-display {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 16px;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
            border-radius: 6px;
            border: 1px solid #d9e3f0;

            code {
              flex: 1;
              font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
              font-size: 13px;
              color: #303133;
              font-weight: 500;
              word-break: break-all;
            }

            .copy-btn {
              flex-shrink: 0;
              padding: 4px 12px;
              height: 28px;
              display: flex;
              align-items: center;
              gap: 4px;
            }
          }

          .image-empty-display {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            background: #fafafa;
            border-radius: 6px;
            border: 1px dashed #dcdfe6;
            min-height: 40px;

            .empty-text {
              color: #909399;
              font-size: 13px;
            }
          }
        }

        .label-help-icon {
          margin-left: 6px;
          color: var(--el-text-color-secondary);
          cursor: help;
          vertical-align: middle;
        }

        .form-tip {
          margin-top: 8px;
          font-size: 12px;
          color: #909399;
          line-height: 1.6;

          code {
            padding: 2px 6px;
            background: #f5f7fa;
            border-radius: 3px;
            font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
            color: #409eff;
            font-size: 11px;
          }

          &.tip-warning {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #e6a23c;
            padding: 8px 12px;
            background: #fdf6ec;
            border-left: 3px solid #e6a23c;
            border-radius: 4px;

            svg {
              flex-shrink: 0;
            }
          }

          &.tip-success {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #67c23a;
            padding: 8px 12px;
            background: #f0f9ff;
            border-left: 3px solid #67c23a;
            border-radius: 4px;

            svg {
              flex-shrink: 0;
            }
          }
        }

        .image-display-wrapper {
          :deep(.el-input) {
            .el-input__wrapper {
              background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
              box-shadow: 0 0 0 1px #d9e3f0 inset;
              cursor: not-allowed;

              .el-input__inner {
                color: #303133;
                font-weight: 500;
                font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
                font-size: 13px;
              }
            }
          }
        }

        .search-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #e6f7ff;
          border-left: 3px solid #1890ff;
          border-radius: 4px;
          font-size: 12px;
          color: var(--el-text-color-regular);

          svg {
            color: #1890ff;
            flex-shrink: 0;
          }
        }

        .registry-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .tag-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;

          .tag-size {
            font-size: 11px;
            color: var(--el-text-color-secondary);
            margin-left: 8px;
          }
        }
      }

      .image-recommendations {
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        border: 1px solid #ebeef5;

        .recommendations-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e4e7ed;
        }

        .recommendations-list {
          display: grid;
          gap: 12px;

          .recommendation-card {
            padding: 12px;
            background: #fff;
            border-radius: 6px;
            border: 1px solid #e4e7ed;
            transition: all 0.3s ease;
            cursor: pointer;

            &:hover {
              border-color: var(--el-color-primary);
              box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
              transform: translateY(-2px);
            }

            &.selected {
              border-color: var(--el-color-primary);
              background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
              box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
            }

            .card-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 6px;

              .card-title {
                font-size: 13px;
                font-weight: 600;
                color: #303133;
                font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
              }

              .card-tags {
                display: flex;
                gap: 6px;
              }
            }

            .card-desc {
              font-size: 12px;
              color: #606266;
              margin-bottom: 8px;
              line-height: 1.5;
            }

            .card-tools {
              display: flex;
              align-items: flex-start;
              gap: 6px;
              font-size: 12px;

              span {
                color: #909399;
                flex-shrink: 0;
              }

              code {
                flex: 1;
                font-size: 11px;
                color: #409eff;
                background: #f0f9ff;
                padding: 4px 8px;
                border-radius: 4px;
                line-height: 1.6;
                word-break: break-all;
              }
            }
          }
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 0 24px 24px;

      .el-button {
        min-width: 100px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
    }

    :deep(.el-dialog__body) {
      padding: 0 24px 24px;
    }

    :deep(.el-dialog__footer) {
      padding: 0;
    }
  }

  .select-loading-more {
    padding: 8px;
    text-align: center;
    color: var(--el-color-primary);
    font-size: 12px;
    cursor: pointer;
    border-top: 1px solid var(--el-border-color);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
</style>
