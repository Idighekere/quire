export const COURSE_CODE_PATTERN = /^[A-Z]{3}[1-5][12][0-9]$/

export function normalizeCourseCode(value = '') {
  // Drops an optional "UUY-" school prefix: "UUY-CPE313" → "CPE313".
  return value.replace(/\s+/g, '').toUpperCase().replace(/^UUY-/, '')
}

export function courseMetadata(value) {
  const code = normalizeCourseCode(value)
  if (!COURSE_CODE_PATTERN.test(code)) return null
  return { code, level: Number(code[3]) * 100, semester: code[4] === '1' ? '1st' : '2nd' }
}

export function displayCourseCode(course) {
  const entry = Array.isArray(course) ? course[0] : course
  if (!entry) return ''
  const code = entry.courseCode || ''
  if (!code) return ''
  const prefix = entry.codePrefix ? String(entry.codePrefix).toUpperCase() : ''
  return prefix ? `${prefix}-${code}` : code
}

export function validAcademicSession(value) {
  if (!/^\d{4}\/\d{4}$/.test(value)) return false
  const [start, end] = value.split('/').map(Number)
  return end === start + 1
}

export function validDriveLink(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ['drive.google.com', 'docs.google.com'].includes(url.hostname)
      && (/\/(?:file|document|presentation|spreadsheets)\/d\/[\w-]+/.test(url.pathname) || Boolean(url.searchParams.get('id')))
  } catch {
    return false
  }
}

export function drivePreviewUrl(fileId) {
  if (!fileId) return ''
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export function driveDownloadUrl(fileId) {
  if (!fileId) return ''
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=f`
}
