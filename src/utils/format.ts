/**
 * 格式化工具函数集合
 */

/**
 * 智能格式化时间戳
 * 自动识别秒级（10位）和毫秒级（13位）时间戳
 * @param timestamp 时间戳（秒或毫秒）
 * @param format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的时间字符串
 */
export const smartFormatTime = (timestamp: any, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!timestamp) return '-'

  let date: Date

  if (typeof timestamp === 'string') {
    // 如果是 ISO 字符串，直接解析
    date = new Date(timestamp)
  } else if (typeof timestamp === 'number') {
    // 🔑 关键判断！
    if (timestamp < 10000000000) {
      // 10位数 → 秒级 → 需要 ×1000
      date = new Date(timestamp * 1000)
    } else {
      // 13位数 → 毫秒级 → 直接使用
      date = new Date(timestamp)
    }
  } else {
    return '-'
  }

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '-'
  }

  // 格式化日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化时间戳（兼容旧代码）
 */
export const formatTimestamp = smartFormatTime

/**
 * 格式化日期对象为字符串
 * @param date - 日期对象
 * @param format - 格式化模板
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string | null, format: string = 'YYYY-MM-DD'): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  let result = format
  result = result.replace('YYYY', String(year))
  result = result.replace('MM', month)
  result = result.replace('DD', day)

  return result
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @param decimals - 小数位数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 格式化数字为千分位
 * @param num - 数字
 * @returns 千分位格式的字符串
 */
export function formatThousands(num: number | string): string {
  const n = Number(num)
  if (isNaN(n)) return String(num)

  return n.toLocaleString('zh-CN')
}

/**
 * 格式化手机号（隐藏中间4位）
 * @param phone - 手机号
 * @returns 格式化后的手机号
 */
export function formatPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone || '-'

  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 格式化身份证号（隐藏中间部分）
 * @param idCard - 身份证号
 * @returns 格式化后的身份证号
 */
export function formatIdCard(idCard: string): string {
  if (!idCard) return '-'

  if (idCard.length === 18) {
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  }

  return idCard
}

/**
 * 格式化银行卡号（每4位一个空格）
 * @param cardNumber - 银行卡号
 * @returns 格式化后的银行卡号
 */
export function formatBankCard(cardNumber: string): string {
  if (!cardNumber) return '-'

  // 移除所有空格
  const cleaned = cardNumber.replace(/\s/g, '')

  // 每4位添加一个空格
  return cleaned.replace(/(\d{4})/g, '$1 ').trim()
}

/**
 * 格式化百分比
 * @param value - 数值
 * @param decimals - 小数位数
 * @returns 百分比字符串
 */
export function formatPercent(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '-'

  return (value * 100).toFixed(decimals) + '%'
}

/**
 * 格式化金额
 * @param amount - 金额（分）
 * @param symbol - 货币符号
 * @returns 格式化后的金额字符串
 */
export function formatMoney(amount: number, symbol: string = '¥'): string {
  if (isNaN(amount)) return '-'

  // 将分转换为元
  const yuan = amount / 100

  // 格式化为两位小数并添加千分位
  const formatted = yuan.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return symbol + formatted
}

/**
 * 格式化字节大小
 * @param bytes 字节数
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的字符串，如 "1.50 GB"
 */
export function formatBytes(bytes?: number, decimals: number = 2): string {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 0) return 'Invalid'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))

  return `${size} ${sizes[i]}`
}

/**
 * 格式化比特率 (字节/秒 -> bit/s/Kbit/s/Mbit/s/Gbit/s)
 * @param bytesPerSec 每秒字节数
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的字符串，如 "100.50 Mbit/s"
 */
export function formatBitRate(bytesPerSec: number, decimals: number = 2): string {
  if (!bytesPerSec || bytesPerSec === 0) return '0 bit/s'
  if (bytesPerSec < 0) return 'Invalid'

  // 转换为比特 (1 byte = 8 bits)
  const bitsPerSec = bytesPerSec * 8
  const k = 1000 // 网络速率使用 1000 进制
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['bit/s', 'Kbit/s', 'Mbit/s', 'Gbit/s', 'Tbit/s']

  const i = Math.min(Math.floor(Math.log(bitsPerSec) / Math.log(k)), sizes.length - 1)
  const rate = parseFloat((bitsPerSec / Math.pow(k, i)).toFixed(dm))

  return `${rate} ${sizes[i]}`
}

/**
 * 格式化为相对时间（如：刚刚、5分钟前、2小时前）
 * @param date 日期对象或Unix时间戳（秒）
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | number): string {
  const now = new Date()
  // 如果是 Unix 时间戳（秒），转换为毫秒
  const targetDate = date instanceof Date ? date : new Date(date * 1000)
  const diffMs = now.getTime() - targetDate.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 10) return '刚刚'
  if (diffSec < 60) return `${diffSec}秒前`
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}个月前`
  return `${Math.floor(diffDay / 365)}年前`
}

/**
 * 格式化持续时间（秒）
 * @param seconds 持续秒数
 * @param format 格式类型：'full' | 'short'
 * @returns 格式化后的持续时间字符串
 */
export function formatDuration(seconds?: number, format: 'full' | 'short' = 'full'): string {
  if (!seconds || seconds === 0) return '0秒'
  if (seconds < 0) return 'Invalid'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (format === 'short') {
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`)

  return parts.join('')
}

/**
 * 格式化百分比（保留3位小数）
 * @param value 数值（0-100）
 * @param decimals 小数位数，默认3位
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(value?: number, decimals: number = 3): string {
  if (value === undefined || value === null) return '0.000%'
  return `${value.toFixed(decimals)}%`
}

/**
 * 格式化数字（添加千分位分隔符）
 * @param num 数字
 * @param decimals 小数位数
 * @returns 格式化后的数字字符串
 */
export function formatNumber(num?: number, decimals?: number): string {
  if (num === undefined || num === null) return '0'

  const value = decimals !== undefined ? num.toFixed(decimals) : num.toString()
  const parts = value.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return parts.join('.')
}

/**
 * 格式化大数字（K、M、B）
 * @param num 数字
 * @param decimals 小数位数，默认1位
 * @returns 格式化后的字符串，如 "1.5K"
 */
export function formatCompactNumber(num?: number, decimals: number = 1): string {
  if (!num || num === 0) return '0'
  if (num < 0) return 'Invalid'

  const k = 1000
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['', 'K', 'M', 'B', 'T']

  const i = Math.floor(Math.log(num) / Math.log(k))
  if (i === 0) return num.toString()

  const value = parseFloat((num / Math.pow(k, i)).toFixed(dm))
  return `${value}${sizes[i]}`
}

/**
 * 格式化CPU核心数
 * @param cores CPU核心数（可能是小数）
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的字符串，如 "1.50 cores"
 */
export function formatCores(cores?: number, decimals: number = 2): string {
  if (!cores || cores === 0) return '0 cores'
  return `${cores.toFixed(decimals)} cores`
}

/**
 * 格式化IP地址列表
 * @param ips IP地址数组或逗号分隔的字符串
 * @returns 格式化后的IP字符串
 */
export function formatIPs(ips?: string[] | string): string {
  if (!ips) return '-'
  if (typeof ips === 'string') return ips
  if (Array.isArray(ips) && ips.length > 0) {
    return ips.join(', ')
  }
  return '-'
}

/**
 * 缩短长文本
 * @param text 文本
 * @param maxLength 最大长度
 * @param suffix 后缀，默认 "..."
 * @returns 缩短后的文本
 */
export function truncateText(
  text?: string,
  maxLength: number = 50,
  suffix: string = '...'
): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}
