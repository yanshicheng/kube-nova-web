/**
 * 格式化时间戳
 * @param timestamp 时间戳（秒或毫秒）
 * @param format 格式化模板
 * @returns 格式化后的时间字符串
 */
export function formatTime(timestamp: number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!timestamp) return '-'

  // 判断是秒还是毫秒
  const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)

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
 * 格式化为相对时间
 * @param timestamp 时间戳
 * @returns 相对时间描述
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '-'

  const now = Date.now()
  const date = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  const diff = now - date

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  if (seconds > 0) return `${seconds}秒前`
  return '刚刚'
}
