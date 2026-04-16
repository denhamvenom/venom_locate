export function relativeTime(date) {
  if (!date) return ''
  const ms = Date.now() - date.getTime()
  if (ms < 30_000) return 'just now'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

export function toDate(firestoreTimestamp) {
  if (!firestoreTimestamp) return null
  if (firestoreTimestamp.toDate) return firestoreTimestamp.toDate()
  if (firestoreTimestamp instanceof Date) return firestoreTimestamp
  return null
}
