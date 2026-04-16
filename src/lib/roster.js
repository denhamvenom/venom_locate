import raw from '../data/students.csv?raw'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function parseRoster() {
  const lines = raw.split('\n').slice(1)
  const all = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const cols = line.split(',')
    const first = (cols[0] || '').trim()
    const last = (cols[1] || '').trim()
    const role = (cols[2] || '').trim().toLowerCase()
    const isMonitor = (cols[3] || '').trim().toUpperCase() === 'TRUE'
    const enabled = (cols[4] || '').trim().toUpperCase()

    if (!first || !last) continue
    if (role !== 'student' && role !== 'mentor') continue
    if (enabled !== 'TRUE') continue

    const display = `${first} ${last}`
    all.push({
      display,
      key: display,
      id: slugify(display),
      role,
      isMonitor: role === 'mentor' && isMonitor,
    })
  }

  all.sort((a, b) => a.display.localeCompare(b.display))
  return all
}

export const ROSTER = parseRoster()
export const STUDENTS = ROSTER.filter(p => p.role === 'student')
export const MENTORS = ROSTER.filter(p => p.role === 'mentor')
export const MONITORS = ROSTER.filter(p => p.isMonitor)

export function findById(id) {
  return ROSTER.find(p => p.id === id) ?? null
}

export function nameOf(id) {
  return findById(id)?.display ?? id
}
