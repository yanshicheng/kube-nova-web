import {
  Folder,
  File,
  FileText,
  FileCode,
  FileJson,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Database,
  Terminal,
  Lock,
  Binary,
  FileType2
} from 'lucide-vue-next'

/**
 * 根据 mimeType 获取友好的文件类型名称
 */
export function getFileTypeName(mimeType: string, isDir: boolean): string {
  if (isDir) {
    return '文件夹'
  }

  // 强类型检查：确保 mimeType 是字符串且不为空
  if (!mimeType || typeof mimeType !== 'string') {
    return '未知类型'
  }

  // MIME 类型到友好名称的映射
  const typeMap: Record<string, string> = {
    // 文本文件
    'text/plain': '文本文件',
    'text/markdown': 'Markdown 文档',

    // 数据格式
    'application/json': 'JSON 文件',
    'text/yaml': 'YAML 配置',
    'text/yml': 'YAML 配置',
    'application/xml': 'XML 文档',
    'text/toml': 'TOML 配置',
    'text/csv': 'CSV 表格',
    'text/tab-separated-values': 'TSV 表格',

    // Web 前端
    'text/html': 'HTML 网页',
    'text/css': 'CSS 样式表',
    'text/scss': 'SCSS 样式',
    'text/sass': 'SASS 样式',
    'text/less': 'LESS 样式',
    'text/javascript': 'JavaScript 脚本',
    'text/typescript': 'TypeScript 文件',
    'text/vue': 'Vue 组件',
    'text/svelte': 'Svelte 组件',

    // Shell 脚本
    'text/x-shellscript': 'Shell 脚本',

    // 编程语言
    'text/x-python': 'Python 脚本',
    'text/x-go': 'Go 源文件',
    'text/x-java': 'Java 源文件',
    'application/java-vm': 'Java 字节码',
    'application/java-archive': 'Java 归档',
    'text/x-c': 'C 源文件',
    'text/x-c++': 'C++ 源文件',
    'text/x-csharp': 'C# 源文件',
    'text/x-ruby': 'Ruby 脚本',
    'text/x-php': 'PHP 脚本',
    'text/x-perl': 'Perl 脚本',
    'text/x-swift': 'Swift 源文件',
    'text/x-kotlin': 'Kotlin 源文件',
    'text/x-scala': 'Scala 源文件',
    'text/x-rust': 'Rust 源文件',
    'text/x-lua': 'Lua 脚本',
    'text/x-r': 'R 脚本',
    'text/x-matlab': 'MATLAB 脚本',
    'text/x-sql': 'SQL 脚本',
    'text/x-groovy': 'Groovy 脚本',
    'text/x-clojure': 'Clojure 源文件',
    'text/x-erlang': 'Erlang 源文件',
    'text/x-elixir': 'Elixir 源文件',
    'text/x-haskell': 'Haskell 源文件',

    // DevOps / 配置
    'text/x-dockerfile': 'Dockerfile',
    'text/x-makefile': 'Makefile',
    'text/x-cmake': 'CMake 配置',
    'text/x-terraform': 'Terraform 配置',
    'text/x-hcl': 'HCL 配置',
    'text/x-nginx': 'Nginx 配置',
    'text/x-systemd': 'Systemd 配置',

    // 图片
    'image/png': 'PNG 图片',
    'image/jpeg': 'JPEG 图片',
    'image/gif': 'GIF 图片',
    'image/bmp': 'BMP 图片',
    'image/webp': 'WebP 图片',
    'image/svg+xml': 'SVG 图片',
    'image/x-icon': '图标文件',
    'image/tiff': 'TIFF 图片',

    // 文档
    'application/pdf': 'PDF 文档',
    'application/msword': 'Word 文档',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word 文档',
    'application/vnd.ms-excel': 'Excel 表格',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel 表格',
    'application/vnd.ms-powerpoint': 'PowerPoint 演示',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint 演示',
    'application/vnd.oasis.opendocument.text': 'ODF 文本',
    'application/vnd.oasis.opendocument.spreadsheet': 'ODF 表格',
    'application/vnd.oasis.opendocument.presentation': 'ODF 演示',
    'application/rtf': 'RTF 文档',

    // 压缩文件
    'application/zip': 'ZIP 压缩包',
    'application/x-tar': 'TAR 归档',
    'application/gzip': 'GZ 压缩包',
    'application/x-bzip2': 'BZ2 压缩包',
    'application/x-xz': 'XZ 压缩包',
    'application/x-7z-compressed': '7Z 压缩包',
    'application/x-rar-compressed': 'RAR 压缩包',
    'application/x-lzip': 'LZ 压缩包',
    'application/x-lzma': 'LZMA 压缩包',
    'application/zstd': 'ZSTD 压缩包',

    // 音视频
    'audio/mpeg': 'MP3 音频',
    'audio/wav': 'WAV 音频',
    'audio/ogg': 'OGG 音频',
    'audio/flac': 'FLAC 音频',
    'audio/aac': 'AAC 音频',
    'audio/mp4': 'M4A 音频',
    'video/mp4': 'MP4 视频',
    'video/webm': 'WebM 视频',
    'video/x-matroska': 'MKV 视频',
    'video/x-msvideo': 'AVI 视频',
    'video/quicktime': 'MOV 视频',
    'video/x-ms-wmv': 'WMV 视频',
    'video/x-flv': 'FLV 视频',

    // 字体
    'font/ttf': 'TrueType 字体',
    'font/otf': 'OpenType 字体',
    'font/woff': 'WOFF 字体',
    'font/woff2': 'WOFF2 字体',
    'application/vnd.ms-fontobject': 'EOT 字体',

    // 二进制/可执行
    'application/x-executable': '可执行文件',
    'application/x-sharedlib': '共享库',
    'application/octet-stream': '二进制文件',
    'application/x-object': '对象文件',
    'application/x-archive': '归档文件',

    // 证书/密钥
    'application/x-pem-file': 'PEM 证书',
    'application/x-x509-ca-cert': 'X509 证书',
    'application/x-pkcs12': 'PKCS12 证书',

    // 其他
    'application/wasm': 'WebAssembly 模块'
  }

  return typeMap[mimeType] || '未知类型'
}

/**
 * 根据 mimeType 获取对应的图标组件
 */
export function getFileIcon(mimeType: string, isDir: boolean) {
  if (isDir) {
    return Folder
  }

  // 强类型检查：确保 mimeType 是字符串且不为空
  if (!mimeType || typeof mimeType !== 'string') {
    return File
  }

  // 根据 mime type 主类型判断
  const [mainType, subType] = mimeType.split('/')

  // 文本/代码文件
  if (
    mimeType.startsWith('text/x-') ||
    mimeType === 'text/javascript' ||
    mimeType === 'text/typescript' ||
    mimeType === 'text/vue' ||
    mimeType === 'text/svelte'
  ) {
    return FileCode
  }

  // 配置文件
  if (
    mimeType === 'application/json' ||
    mimeType === 'text/yaml' ||
    mimeType === 'text/yml' ||
    mimeType === 'application/xml' ||
    mimeType === 'text/toml'
  ) {
    return FileJson
  }

  // 普通文本
  if (
    mimeType === 'text/plain' ||
    mimeType === 'text/markdown' ||
    mimeType === 'text/csv' ||
    mimeType === 'text/tab-separated-values'
  ) {
    return FileText
  }

  // 图片
  if (mainType === 'image') {
    return FileImage
  }

  // 视频
  if (mainType === 'video') {
    return FileVideo
  }

  // 音频
  if (mainType === 'audio') {
    return FileAudio
  }

  // 压缩文件
  if (
    mimeType.includes('zip') ||
    mimeType.includes('tar') ||
    mimeType.includes('gzip') ||
    mimeType.includes('bzip') ||
    mimeType.includes('xz') ||
    mimeType.includes('7z') ||
    mimeType.includes('rar') ||
    mimeType.includes('lz')
  ) {
    return FileArchive
  }

  // 数据库文件
  if (mimeType === 'application/x-sqlite3' || mimeType.includes('database')) {
    return Database
  }

  // Shell 脚本
  if (mimeType === 'text/x-shellscript') {
    return Terminal
  }

  // 证书/密钥
  if (
    mimeType === 'application/x-pem-file' ||
    mimeType === 'application/x-x509-ca-cert' ||
    mimeType === 'application/x-pkcs12'
  ) {
    return Lock
  }

  // 二进制/可执行
  if (
    mimeType === 'application/x-executable' ||
    mimeType === 'application/x-sharedlib' ||
    mimeType === 'application/octet-stream'
  ) {
    return Binary
  }

  // 文档
  if (mimeType === 'application/pdf' || mimeType.includes('document')) {
    return FileType2
  }

  // 默认
  return File
}

/**
 * 根据 mimeType 获取图标的 CSS 类名（用于着色）
 */
export function getFileIconClass(mimeType: string, isDir: boolean): string {
  if (isDir) {
    return 'icon-folder'
  }

  // 强类型检查：确保 mimeType 是字符串且不为空
  if (!mimeType || typeof mimeType !== 'string') {
    return 'icon-file'
  }

  const [mainType] = mimeType.split('/')

  // 代码文件 - 蓝色
  if (
    mimeType.startsWith('text/x-') ||
    mimeType === 'text/javascript' ||
    mimeType === 'text/typescript' ||
    mimeType === 'text/vue' ||
    mimeType === 'text/svelte'
  ) {
    return 'icon-code'
  }

  // 配置文件 - 紫色
  if (
    mimeType === 'application/json' ||
    mimeType === 'text/yaml' ||
    mimeType === 'text/yml' ||
    mimeType === 'application/xml' ||
    mimeType === 'text/toml'
  ) {
    return 'icon-config'
  }

  // 图片 - 粉色
  if (mainType === 'image') {
    return 'icon-image'
  }

  // 视频 - 红色
  if (mainType === 'video') {
    return 'icon-video'
  }

  // 音频 - 绿色
  if (mainType === 'audio') {
    return 'icon-audio'
  }

  // 压缩文件 - 黄色
  if (
    mimeType.includes('zip') ||
    mimeType.includes('tar') ||
    mimeType.includes('gzip') ||
    mimeType.includes('compress')
  ) {
    return 'icon-archive'
  }

  // Shell 脚本 - 深绿
  if (mimeType === 'text/x-shellscript') {
    return 'icon-shell'
  }

  // 文档 - 橙色
  if (mimeType === 'application/pdf' || mimeType.includes('document')) {
    return 'icon-document'
  }

  // 默认
  return 'icon-file'
}

/**
 * 判断文件是否可编辑
 */
export function isEditableFile(mimeType: string): boolean {
  // 强类型检查：确保 mimeType 是字符串且不为空
  if (!mimeType || typeof mimeType !== 'string') {
    return false
  }

  const editableMimeTypes = [
    'text/plain',
    'text/markdown',
    'application/json',
    'text/yaml',
    'text/yml',
    'application/xml',
    'text/toml',
    'text/csv',
    'text/html',
    'text/css',
    'text/scss',
    'text/sass',
    'text/less',
    'text/javascript',
    'text/typescript',
    'text/vue',
    'text/svelte',
    'text/x-shellscript',
    'text/x-python',
    'text/x-go',
    'text/x-java',
    'text/x-c',
    'text/x-c++',
    'text/x-csharp',
    'text/x-ruby',
    'text/x-php',
    'text/x-perl',
    'text/x-swift',
    'text/x-kotlin',
    'text/x-scala',
    'text/x-rust',
    'text/x-lua',
    'text/x-r',
    'text/x-matlab',
    'text/x-sql',
    'text/x-groovy',
    'text/x-dockerfile',
    'text/x-makefile',
    'text/x-cmake',
    'text/x-terraform',
    'text/x-hcl',
    'text/x-nginx'
  ]

  return editableMimeTypes.includes(mimeType)
}

/**
 * 判断文件是否可预览
 */
export function isPreviewableFile(mimeType: string): boolean {
  // 强类型检查：确保 mimeType 是字符串且不为空
  if (!mimeType || typeof mimeType !== 'string') {
    return false
  }

  const [mainType] = mimeType.split('/')

  // 图片可预览
  if (mainType === 'image') {
    return true
  }

  // PDF 可预览
  if (mimeType === 'application/pdf') {
    return true
  }

  // 文本文件可预览
  if (
    mimeType === 'text/plain' ||
    mimeType === 'text/markdown' ||
    mimeType === 'application/json' ||
    mimeType === 'text/yaml' ||
    mimeType === 'text/yml' ||
    mimeType === 'application/xml'
  ) {
    return true
  }

  return false
}
