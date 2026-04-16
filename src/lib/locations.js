import raw from '../data/locations.csv?raw'

function parseLocations() {
  const lines = raw.split('\n').slice(1)
  const locations = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const cols = line.split(',')
    const id = (cols[0] || '').trim()
    const label = (cols[1] || '').trim()
    const icon = (cols[2] || '').trim()
    const buddyMin = parseInt((cols[3] || '0').trim(), 10) || 0
    const enabled = (cols[4] || '').trim().toUpperCase()

    if (!id || !label) continue
    if (enabled !== 'TRUE') continue

    locations.push({ id, label, icon, buddyMin })
  }

  return locations
}

export const LOCATIONS = parseLocations()

export function locationLabel(id) {
  return LOCATIONS.find(l => l.id === id)?.label ?? id
}

export function locationIcon(id) {
  return LOCATIONS.find(l => l.id === id)?.icon ?? '📍'
}

export function locationBuddyMin(id) {
  return LOCATIONS.find(l => l.id === id)?.buddyMin ?? 0
}
