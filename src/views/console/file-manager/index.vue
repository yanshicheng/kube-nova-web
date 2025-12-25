<template>
  <div class="file-manager-light">
    <!-- 顶部连接栏 -->
    <div class="connection-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-section">
            <Folder :size="24" class="logo-icon" />
            <span class="logo-text">文件管理器</span>
          </div>
          <div class="divider" />
          <div class="pod-info">
            <Server :size="18" />
            <span class="pod-name">{{ podName }}</span>
          </div>
        </div>

        <div class="header-center">
          <div class="container-selector">
            <Package :size="18" />
            <ElSelect
              v-model="container"
              placeholder="选择容器"
              size="default"
              class="container-select"
              :loading="loadingContainers"
              @change="handleContainerChange"
            >
              <ElOption
                v-for="cont in allContainers"
                :key="cont.name"
                :label="cont.name"
                :value="cont.name"
              >
                <div class="container-option">
                  <ElTag size="small" :type="getContainerTagType(cont.type)">
                    {{ cont.type }}
                  </ElTag>
                  <span class="container-name">{{ cont.name }}</span>
                  <div class="container-state" :class="`state-${cont.state}`">
                    <div class="state-dot" />
                    <span>{{ cont.state }}</span>
                  </div>
                </div>
              </ElOption>
            </ElSelect>
          </div>

          <div class="connection-status" :class="{ connected: isConnected }">
            <div class="status-dot" />
            <span>{{ connectionStatusText }}</span>
          </div>
        </div>

        <div class="header-right">
          <ElTooltip content="重新连接" placement="bottom">
            <button
              class="action-btn"
              @click="handleConnect"
              :disabled="isConnecting || !workspaceId || !podName"
            >
              <RefreshCw :size="18" :class="{ spin: isConnecting }" />
            </button>
          </ElTooltip>

          <div class="divider" />

          <ElTooltip content="断开连接" placement="bottom">
            <button class="action-btn danger" @click="handleDisconnect" :disabled="!isConnected">
              <Power :size="18" />
            </button>
          </ElTooltip>
        </div>
      </div>
    </div>

    <!-- 主容器 -->
    <div v-if="isConnected" class="manager-container">
      <div class="content-wrapper">
        <!-- 左侧：文件浏览器 -->
        <div class="file-browser">
          <!-- 工具栏 -->
          <Toolbar
            v-model:view-mode="viewMode"
            v-model:search-query="searchQuery"
            :can-go-back="canGoBack"
            :can-go-forward="canGoForward"
            :can-go-up="currentPath !== '/'"
            :loading="loading"
            @navigate-back="navigateBack"
            @navigate-forward="navigateForward"
            @navigate-up="navigateUp"
            @refresh="refreshFiles"
            @go-home="goHome"
            @upload="showUploadModal = true"
            @create-folder="showCreateFolderModal = true"
          />

          <!-- 面包屑导航 -->
          <Breadcrumb :breadcrumbs="breadcrumbs" @navigate="navigateTo" />

          <!-- 文件列表容器 -->
          <div class="file-list-container">
            <!-- 加载状态 -->
            <LoadingState v-if="loading" />

            <!-- 空状态 -->
            <EmptyState v-else-if="displayFiles.length === 0" :has-search="!!searchQuery" />

            <!-- 文件网格视图 -->
            <FileGrid
              v-else-if="viewMode === 'grid'"
              :files="displayFiles"
              :selected-files="selectedFiles"
              @select="handleSelectFile"
              @open="handleOpenFile"
              @context-menu="handleContextMenu"
            />

            <!-- 文件列表视图 -->
            <FileList
              v-else
              :files="displayFiles"
              :selected-files="selectedFiles"
              :sort-field="sortField"
              :sort-order="sortOrder"
              @select="handleSelectFile"
              @open="handleOpenFile"
              @sort="handleSort"
              @download="handleDownload"
              @delete="handleDelete"
              @context-menu="handleContextMenu"
            />
          </div>
        </div>

        <!-- 右侧：详情面板 -->
        <div class="detail-panel" :class="{ collapsed: !showDetailPanel }">
          <!-- 面板头部 -->
          <div class="detail-header">
            <div class="detail-tabs">
              <button
                class="detail-tab"
                :class="{ active: detailPanelMode === 'info' }"
                @click="detailPanelMode = 'info'"
                :disabled="selectedFiles.length === 0"
              >
                <Info :size="16" />
                <span>文件详情</span>
                <span v-if="selectedFiles.length > 0" class="tab-badge">1</span>
              </button>
              <button
                class="detail-tab"
                :class="{ active: detailPanelMode === 'downloads' }"
                @click="detailPanelMode = 'downloads'"
              >
                <Download :size="16" />
                <span>下载管理</span>
                <span v-if="activeDownloads > 0" class="tab-badge">{{ activeDownloads }}</span>
              </button>
            </div>
            <button class="detail-close" @click="showDetailPanel = false" title="关闭面板">
              <X :size="18" />
            </button>
          </div>

          <!-- 面板内容 -->
          <div class="detail-content">
            <!-- 文件详情 -->
            <InfoPanel
              v-if="detailPanelMode === 'info' && selectedFiles.length > 0"
              :file="selectedFiles[0]"
              :workspace-id="workspaceId"
              :pod-name="podName"
              :container="container"
              @download="handleDownload"
              @rename="handleShowRename"
              @delete="handleDelete"
            />

            <!-- 无选中文件提示 -->
            <div v-else-if="detailPanelMode === 'info'" class="detail-empty">
              <FileQuestion :size="48" class="empty-icon" />
              <div class="empty-text">未选中任何文件</div>
              <div class="empty-hint">点击文件查看详情</div>
            </div>

            <!-- 下载管理器 -->
            <DownloadManager
              v-if="detailPanelMode === 'downloads'"
              ref="downloadManagerRef"
              :is-panel-mode="true"
              @active-count-change="handleActiveDownloadsChange"
            />
          </div>
        </div>

        <!-- 展开/收起详情面板按钮 -->
        <button
          v-if="!showDetailPanel"
          class="detail-toggle"
          @click="showDetailPanel = true"
          title="展开详情面板"
        >
          <PanelRightOpen :size="20" />
        </button>
      </div>
    </div>

    <!-- 连接中/未连接状态 -->
    <div v-else class="connection-overlay">
      <div v-if="isConnecting" class="connecting-content">
        <div class="loading-spinner" />
        <p class="connecting-text">正在连接...</p>
        <p class="connecting-hint">{{ podName }} / {{ container }}</p>
      </div>

      <div v-else class="disconnected-content">
        <Folder :size="80" class="disconnected-icon" />
        <p class="disconnected-text">文件管理器未连接</p>
        <p class="disconnected-hint">{{ errorMessage || '选择容器并点击连接' }}</p>
        <ElButton
          type="primary"
          size="large"
          @click="handleConnect"
          :disabled="!workspaceId || !podName || !container"
          class="reconnect-btn"
        >
          <RefreshCw :size="18" />
          连接
        </ElButton>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      v-if="contextMenu.visible"
      :file="contextMenu.file"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :has-clipboard="clipboard.files.length > 0"
      @open="handleOpenFile"
      @download="handleDownload"
      @rename="handleShowRename"
      @copy="handleCopy"
      @cut="handleCut"
      @paste="handlePaste"
      @delete="handleDelete"
      @close="hideContextMenu"
    />

    <!-- 对话框 -->
    <UploadDialog
      v-model="showUploadModal"
      :workspace-id="workspaceId"
      :pod-name="podName"
      :container="container"
      :current-path="currentPath"
      @success="handleUploadSuccess"
    />

    <CreateFolderDialog
      v-model="showCreateFolderModal"
      :workspace-id="workspaceId"
      :pod-name="podName"
      :container="container"
      :current-path="currentPath"
      @success="handleCreateFolderSuccess"
    />

    <RenameDialog
      v-model="showRenameModal"
      :workspace-id="workspaceId"
      :pod-name="podName"
      :container="container"
      :file="renameFile"
      @success="handleRenameSuccess"
    />

    <FilePreviewDialog
      v-model="showPreviewModal"
      :workspace-id="workspaceId"
      :pod-name="podName"
      :container="container"
      :file="previewFile"
    />

    <FileEditorDialog
      v-model="showEditorModal"
      :workspace-id="workspaceId"
      :pod-name="podName"
      :container="container"
      :file="editorFile"
      @saved="handleFileSaved"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Folder,
    Server,
    Package,
    RefreshCw,
    Power,
    Info,
    Download,
    X,
    FileQuestion,
    PanelRightOpen
  } from 'lucide-vue-next'
  import {
    getPodFileListApi,
    deletePodFileApi,
    movePodFileApi,
    copyPodFileApi,
    getPodFileInfoApi,
    getPodContainerListInWorkloadApi,
    type FileInfo,
    type BreadcrumbItem,
    type ContainerInfoList,
    type ContainerInfo
  } from '@/api'

  import Toolbar from './components/toolbar.vue'
  import Breadcrumb from './components/breadcrumb.vue'
  import LoadingState from './components/loading-state.vue'
  import EmptyState from './components/empty-state.vue'
  import FileGrid from './components/file-grid.vue'
  import FileList from './components/file-list.vue'
  import InfoPanel from './components/info-panel.vue'
  import ContextMenu from './components/context-menu.vue'
  import UploadDialog from './components/upload-dialog.vue'
  import CreateFolderDialog from './components/create-folder-dialog.vue'
  import RenameDialog from './components/rename-dialog.vue'
  import FilePreviewDialog from './components/file-preview-dialog.vue'
  import FileEditorDialog from './components/file-editor-dialog.vue'
  import DownloadManager from './components/download-manager.vue'
  import { isEditableFile, isPreviewableFile } from './components/file-type'

  interface Props {
    workspaceId?: number
    podName?: string
    isDialogMode?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    workspaceId: 0,
    podName: '',
    isDialogMode: false
  })

  const downloadManagerRef = ref()
  const route = useRoute()

  const workspaceId = computed(() => {
    if (props.workspaceId) {
      return props.workspaceId
    }
    return Number(route.query.workspaceId) || 0
  })

  const podName = computed(() => {
    if (props.podName) {
      return props.podName
    }
    return String(route.query.podName || '')
  })

  const container = ref(String(route.query.container || ''))

  interface ExtendedContainer extends ContainerInfo {
    type: 'init' | 'container' | 'ephemeral'
  }

  const loadingContainers = ref(false)
  const containerData = ref<ContainerInfoList | null>(null)

  const allContainers = computed<ExtendedContainer[]>(() => {
    if (!containerData.value) return []
    const containers: ExtendedContainer[] = []

    containerData.value.containers?.forEach((c) => {
      containers.push({ ...c, type: 'container' })
    })
    containerData.value.initContainers?.forEach((c) => {
      containers.push({ ...c, type: 'init' })
    })
    containerData.value.ephemeralContainers?.forEach((c) => {
      containers.push({ ...c, type: 'ephemeral' })
    })

    return containers
  })

  const isConnected = ref(false)
  const isConnecting = ref(false)
  const errorMessage = ref('')

  const connectionStatusText = computed(() => {
    if (isConnecting.value) return '连接中...'
    if (isConnected.value) return '已连接'
    return '未连接'
  })

  const currentPath = ref('/')
  const files = ref<FileInfo[]>([])
  const selectedFiles = ref<FileInfo[]>([])
  const viewMode = ref<'grid' | 'list'>('grid')
  const searchQuery = ref('')
  const loading = ref(false)

  const sortField = ref<'name' | 'size' | 'modTime'>('name')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  const history = ref<string[]>(['/'])
  const historyIndex = ref(0)

  // 详情面板状态
  const showDetailPanel = ref(true)
  const detailPanelMode = ref<'info' | 'downloads'>('info')
  const activeDownloads = ref(0)

  const canGoBack = computed(() => historyIndex.value > 0)
  const canGoForward = computed(() => historyIndex.value < history.value.length - 1)

  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const parts = currentPath.value.split('/').filter(Boolean)
    const crumbs: BreadcrumbItem[] = [{ name: '根目录', path: '/' }]
    let path = ''

    for (const part of parts) {
      path += '/' + part
      crumbs.push({ name: part, path })
    }

    return crumbs
  })

  const displayFiles = computed(() => {
    let filtered = [...files.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter((file) => file.name.toLowerCase().includes(query))
    }

    filtered.sort((a, b) => {
      if (a.isDir !== b.isDir) {
        return a.isDir ? -1 : 1
      }

      let compareValue = 0
      const field = sortField.value

      if (field === 'name') {
        compareValue = a.name.localeCompare(b.name, 'zh-CN')
      } else if (field === 'size') {
        const aSize = a.size || 0
        const bSize = b.size || 0
        compareValue = aSize - bSize
      } else if (field === 'modTime') {
        const aTime = a.modTime ? new Date(a.modTime).getTime() : 0
        const bTime = b.modTime ? new Date(b.modTime).getTime() : 0
        compareValue = aTime - bTime
      }

      return sortOrder.value === 'asc' ? compareValue : -compareValue
    })

    return filtered
  })

  const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    file: null as FileInfo | null
  })

  const clipboard = ref<{
    action: 'copy' | 'cut' | ''
    files: FileInfo[]
  }>({
    action: '',
    files: []
  })

  const showUploadModal = ref(false)
  const showCreateFolderModal = ref(false)
  const showRenameModal = ref(false)
  const showPreviewModal = ref(false)
  const showEditorModal = ref(false)

  const renameFile = ref<FileInfo | null>(null)
  const previewFile = ref<FileInfo | null>(null)
  const editorFile = ref<FileInfo | null>(null)

  function getContainerTagType(type: string) {
    const typeMap: Record<string, any> = {
      init: 'info',
      container: 'success',
      ephemeral: 'warning'
    }
    return typeMap[type] || 'default'
  }

  async function loadContainers() {
    if (!workspaceId.value || !podName.value) {
      return false
    }

    loadingContainers.value = true
    try {
      const response = await getPodContainerListInWorkloadApi(workspaceId.value, {
        podName: podName.value
      })
      containerData.value = response

      if (allContainers.value.length > 0 && !container.value) {
        container.value = allContainers.value[0].name
      }

      return true
    } catch (error) {
      console.error('加载容器列表失败:', error)
      return false
    } finally {
      loadingContainers.value = false
    }
  }

  function handleContainerChange() {
    if (isConnected.value) {
      ElMessage.info(`切换到容器: ${container.value}`)
      handleConnect()
    }
  }

  async function handleConnect() {
    if (!workspaceId.value || !podName.value) {
      return
    }

    if (!container.value) {
      return
    }

    isConnecting.value = true
    errorMessage.value = ''

    try {
      await getPodFileListApi({
        workloadId: workspaceId.value,
        podName: podName.value,
        container: container.value,
        path: '/'
      })

      isConnected.value = true
      ElMessage.success('连接成功')
      await loadFiles()
    } catch (error: any) {
      console.error('连接失败:', error)
      errorMessage.value = error.message || '连接失败，请检查参数'
    } finally {
      isConnecting.value = false
    }
  }

  function handleDisconnect() {
    isConnected.value = false
    files.value = []
    selectedFiles.value = []
    currentPath.value = '/'
    history.value = ['/']
    historyIndex.value = 0
  }

  async function loadFiles() {
    if (!isConnected.value) return

    loading.value = true
    try {
      const response = await getPodFileListApi({
        workloadId: workspaceId.value,
        podName: podName.value,
        container: container.value,
        path: currentPath.value
      })
      files.value = response.files || []
    } catch (error) {
      console.error('加载文件列表失败:', error)
      files.value = []
    } finally {
      loading.value = false
    }
  }

  function navigateTo(path: string) {
    if (path === currentPath.value) return

    currentPath.value = path
    selectedFiles.value = []
    searchQuery.value = ''

    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(path)
    historyIndex.value = history.value.length - 1

    loadFiles()
  }

  function navigateBack() {
    if (canGoBack.value) {
      historyIndex.value--
      currentPath.value = history.value[historyIndex.value]
      selectedFiles.value = []
      loadFiles()
    }
  }

  function navigateForward() {
    if (canGoForward.value) {
      historyIndex.value++
      currentPath.value = history.value[historyIndex.value]
      selectedFiles.value = []
      loadFiles()
    }
  }

  function navigateUp() {
    if (currentPath.value === '/') return

    const parts = currentPath.value.split('/').filter(Boolean)
    parts.pop()
    const parentPath = parts.length > 0 ? '/' + parts.join('/') : '/'
    navigateTo(parentPath)
  }

  function goHome() {
    navigateTo('/')
  }

  function refreshFiles() {
    loadFiles()
  }

  function handleSelectFile(file: FileInfo) {
    const index = selectedFiles.value.findIndex((f) => f.path === file.path)
    if (index > -1) {
      selectedFiles.value.splice(index, 1)
    } else {
      selectedFiles.value = [file]
      // 选中文件时自动展开详情面板并切换到文件详情
      showDetailPanel.value = true
      detailPanelMode.value = 'info'
    }
  }

  function handleOpenFile(file: FileInfo) {
    if (file.isDir) {
      navigateTo(file.path)
    } else {
      // 使用后端返回的 mimeType 判断文件是否可编辑
      const mimeType = file.mimeType || ''
      if (isEditableFile(mimeType)) {
        editorFile.value = file
        showEditorModal.value = true
      } else {
        previewFile.value = file
        showPreviewModal.value = true
      }
    }
    hideContextMenu()
  }

  function handleSort(field: 'name' | 'size' | 'modTime') {
    if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = 'asc'
    }
  }

  async function handleDownload(file: FileInfo) {
    if (!downloadManagerRef.value) {
      return
    }

    let fileSize = file.size
    if (!fileSize) {
      try {
        const stats = await getPodFileInfoApi({
          workloadId: workspaceId.value,
          podName: podName.value,
          container: container.value,
          path: file.path
        })
        fileSize = stats.size
      } catch (error) {
        console.error('获取文件信息失败:', error)
        fileSize = 0
      }
    }

    downloadManagerRef.value.startDownload({
      workloadId: workspaceId.value,
      podName: podName.value,
      container: container.value,
      path: file.path,
      fileName: file.name,
      fileSize
    })

    // 切换到下载管理器
    showDetailPanel.value = true
    detailPanelMode.value = 'downloads'

    hideContextMenu()
  }

  async function handleDelete(file: FileInfo) {
    try {
      await ElMessageBox.confirm(
        `确定要删除 "${file.name}" 吗？${file.isDir ? '此操作将删除文件夹及其所有内容。' : ''}`,
        '删除确认',
        {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }
      )

      await deletePodFileApi({
        workloadId: workspaceId.value,
        podName: podName.value,
        container: container.value,
        paths: [file.path],
        recursive: file.isDir
      })

      ElMessage.success('删除成功')
      await loadFiles()

      // 如果删除的是当前选中的文件，清空选择
      if (selectedFiles.value.some((f) => f.path === file.path)) {
        selectedFiles.value = []
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    }
    hideContextMenu()
  }

  function handleCopy(file: FileInfo) {
    clipboard.value.action = 'copy'
    clipboard.value.files = [file]
    ElMessage.success(`已复制: ${file.name}`)
    hideContextMenu()
  }

  function handleCut(file: FileInfo) {
    clipboard.value.action = 'cut'
    clipboard.value.files = [file]
    ElMessage.success(`已剪切: ${file.name}`)
    hideContextMenu()
  }

  async function handlePaste() {
    if (clipboard.value.files.length === 0) return

    try {
      const file = clipboard.value.files[0]
      const destPath =
        currentPath.value === '/' ? `/${file.name}` : `${currentPath.value}/${file.name}`

      if (clipboard.value.action === 'cut') {
        await movePodFileApi({
          workloadId: workspaceId.value,
          podName: podName.value,
          container: container.value,
          sourcePath: file.path,
          destPath
        })
        ElMessage.success('移动成功')
        clipboard.value.files = []
        clipboard.value.action = ''
      } else {
        await copyPodFileApi({
          workloadId: workspaceId.value,
          podName: podName.value,
          container: container.value,
          sourcePath: file.path,
          destPath,
          recursive: file.isDir
        })
        ElMessage.success('复制成功')
      }

      await loadFiles()
    } catch (error) {
      console.error('粘贴失败:', error)
    }
    hideContextMenu()
  }

  function handleContextMenu(event: MouseEvent, file: FileInfo) {
    event.preventDefault()

    const menuWidth = 200
    const menuHeight = 300

    let x = event.clientX
    let y = event.clientY

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }

    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }

    contextMenu.value = {
      visible: true,
      x,
      y,
      file
    }

    if (!selectedFiles.value.find((f) => f.path === file.path)) {
      handleSelectFile(file)
    }

    setTimeout(() => {
      document.addEventListener('click', hideContextMenu)
      document.addEventListener('contextmenu', hideContextMenu)
    }, 0)
  }

  function hideContextMenu() {
    contextMenu.value.visible = false
    contextMenu.value.file = null
    document.removeEventListener('click', hideContextMenu)
    document.removeEventListener('contextmenu', hideContextMenu)
  }

  function handleShowRename(file: FileInfo) {
    renameFile.value = file
    showRenameModal.value = true
    hideContextMenu()
  }

  async function handleUploadSuccess() {
    await loadFiles()
    ElMessage.success('上传成功')
  }

  async function handleCreateFolderSuccess() {
    await loadFiles()
    ElMessage.success('创建成功')
  }

  async function handleRenameSuccess() {
    await loadFiles()
    selectedFiles.value = []
    ElMessage.success('重命名成功')
  }

  async function handleFileSaved() {
    await loadFiles()
    ElMessage.success('保存成功')
  }

  function handleActiveDownloadsChange(count: number) {
    activeDownloads.value = count
  }

  function handleKeyboard(e: KeyboardEvent) {
    if (!isConnected.value) return

    if (e.target && (e.target as HTMLElement).matches('input, textarea')) {
      return
    }

    if (e.ctrlKey && e.key === 'c' && selectedFiles.value.length > 0) {
      e.preventDefault()
      handleCopy(selectedFiles.value[0])
    }

    if (e.ctrlKey && e.key === 'x' && selectedFiles.value.length > 0) {
      e.preventDefault()
      handleCut(selectedFiles.value[0])
    }

    if (e.ctrlKey && e.key === 'v' && clipboard.value.files.length > 0) {
      e.preventDefault()
      handlePaste()
    }

    if (e.key === 'Delete' && selectedFiles.value.length > 0) {
      e.preventDefault()
      handleDelete(selectedFiles.value[0])
    }

    if (e.key === 'F5') {
      e.preventDefault()
      refreshFiles()
    }

    if (e.key === 'Backspace') {
      e.preventDefault()
      navigateUp()
    }
  }

  watch(
    () => [props.workspaceId, props.podName],
    ([newWorkspaceId, newPodName], [oldWorkspaceId, oldPodName]) => {
      if (props.isDialogMode && (newWorkspaceId !== oldWorkspaceId || newPodName !== oldPodName)) {
        if (newWorkspaceId && newPodName) {
          handleDisconnect()
          loadContainers().then((success) => {
            if (success && container.value) {
              setTimeout(() => {
                handleConnect()
              }, 300)
            }
          })
        }
      }
    },
    { immediate: false }
  )

  onMounted(async () => {
    const success = await loadContainers()

    if (success && workspaceId.value && podName.value && container.value) {
      setTimeout(() => {
        handleConnect()
      }, 500)
    }

    window.addEventListener('keydown', handleKeyboard)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyboard)
    if (contextMenu.value.visible) {
      hideContextMenu()
    }
  })

  watch(searchQuery, () => {
    // 搜索时保持在当前位置
  })
</script>

<style lang="scss" scoped>
  .file-manager-light {
    min-height: 100vh;
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  .connection-header {
    background: #ffffff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }

  .header-left,
  .header-center,
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 10px;

    .logo-icon {
      color: #55bc8a;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .divider {
    width: 1px;
    height: 28px;
    background: #dcdfe6;
  }

  .pod-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(64, 169, 255, 0.1);
    border-radius: 20px;
    color: #409eff;
    font-size: 14px;
    font-weight: 500;

    .pod-name {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .container-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #606266;

    :deep(.container-select) {
      width: 240px;
    }

    .container-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 0;

      .container-name {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
      }

      .container-state {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;

        .state-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        &.state-running .state-dot {
          background: #67c23a;
          box-shadow: 0 0 6px rgba(103, 194, 58, 0.6);
        }

        &.state-waiting .state-dot {
          background: #e6a23c;
        }

        &.state-terminated .state-dot {
          background: #f56c6c;
        }
      }
    }
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    background: #f4f4f5;
    border-radius: 20px;
    font-size: 13px;
    color: #909399;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #c0c4cc;
    }

    &.connected {
      background: rgba(103, 194, 58, 0.1);
      color: #67c23a;

      .status-dot {
        background: #67c23a;
        box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.2);
        animation: pulse 2s infinite;
      }
    }
  }

  .action-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s;

    &:hover:not(:disabled) {
      background: #f5f7fa;
      border-color: #409eff;
      color: #409eff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.danger:hover:not(:disabled) {
      border-color: #f56c6c;
      color: #f56c6c;
    }

    .spin {
      animation: spin 1s linear infinite;
    }
  }

  .connection-overlay {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    background: #ffffff;
    margin: 20px;
    border-radius: 8px;

    .connecting-content,
    .disconnected-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      animation: fadeIn 0.3s ease;
    }

    .loading-spinner {
      width: 56px;
      height: 56px;
      border: 4px solid #f0f0f0;
      border-top-color: #409eff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .connecting-text,
    .disconnected-text {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }

    .connecting-hint,
    .disconnected-hint {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }

    .disconnected-icon {
      color: #c0c4cc;
      opacity: 0.5;
    }

    .reconnect-btn {
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .manager-container {
    flex: 1;
    margin: 20px;
    overflow: hidden;
  }

  .content-wrapper {
    display: flex;
    gap: 20px;
    height: calc(100vh - 180px);
    position: relative;
  }

  .file-browser {
    flex: 1;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .file-list-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    background: #ffffff;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: #f0f0f0;
    }

    &::-webkit-scrollbar-thumb {
      background: #c0c4cc;
      border-radius: 4px;

      &:hover {
        background: #909399;
      }
    }
  }

  .detail-panel {
    width: 360px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.collapsed {
      width: 0;
      opacity: 0;
      pointer-events: none;
    }
  }

  .detail-header {
    padding: 16px;
    border-bottom: 1px solid #e3e9ef;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #f9fbfd;
  }

  .detail-tabs {
    display: flex;
    gap: 8px;
    flex: 1;
  }

  .detail-tab {
    flex: 1;
    padding: 8px 12px;
    background: transparent;
    border: 1px solid #e3e9ef;
    border-radius: 6px;
    color: #606266;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    position: relative;

    &:hover:not(:disabled) {
      background: rgba(64, 169, 255, 0.05);
      border-color: #409eff;
      color: #409eff;
    }

    &.active {
      background: #409eff;
      border-color: #409eff;
      color: #ffffff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .tab-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: #f56c6c;
      color: #ffffff;
      font-size: 11px;
      font-weight: 600;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(245, 108, 108, 0.3);
    }
  }

  .detail-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid #e3e9ef;
    border-radius: 4px;
    color: #606266;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(245, 108, 108, 0.1);
      border-color: #f56c6c;
      color: #f56c6c;
    }
  }

  .detail-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f0f0f0;
    }

    &::-webkit-scrollbar-thumb {
      background: #c0c4cc;
      border-radius: 3px;

      &:hover {
        background: #909399;
      }
    }
  }

  .detail-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #c0c4cc;

    .empty-icon {
      opacity: 0.5;
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 16px;
      color: #909399;
      margin-bottom: 8px;
    }

    .empty-hint {
      font-size: 14px;
      color: #c0c4cc;
    }
  }

  .detail-toggle {
    position: absolute;
    right: -16px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 64px;
    background: #409eff;
    border: none;
    border-radius: 8px 0 0 8px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: -2px 0 8px rgba(64, 169, 255, 0.3);
    z-index: 10;

    &:hover {
      width: 36px;
      background: #66b1ff;
      box-shadow: -4px 0 12px rgba(64, 169, 255, 0.4);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 1400px) {
    .detail-panel {
      width: 320px;
    }
  }

  @media (max-width: 1200px) {
    .content-wrapper {
      flex-direction: column;
      height: auto;
    }

    .detail-panel {
      width: 100%;
      height: 400px;

      &.collapsed {
        height: 0;
      }
    }

    .detail-toggle {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .connection-header {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-left,
      .header-center,
      .header-right {
        flex-wrap: wrap;
      }
    }

    .manager-container {
      margin: 16px;
    }

    .detail-panel {
      height: 350px;
    }
  }
</style>
