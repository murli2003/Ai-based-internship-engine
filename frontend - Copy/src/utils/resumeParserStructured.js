/**
 * Structured extraction for typical Indian tech resumes
 * (contact block, Experiences, EDUCATION, SKILLS, PROJECT, etc.)
 */

/** Insert spaces in CamelCase / merged words like AdarshBhardwaj → Adarsh Bhardwaj */
export function splitCamelCaseName(str) {
  if (!str) return ''
  let s = str.trim()
  // Already has spaces
  if (/\s/.test(s)) return s.replace(/\s+/g, ' ')
  // AdarshBhardwaj → Adarsh Bhardwaj
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2')
  // LovelyProfessional → Lovely Professional
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2')
  return s.replace(/\s+/g, ' ').trim()
}

/** Fix PDF-merged tokens in bullet lines (camelCase, acronym+word, digit boundaries) */
export function softenMergedResumeWords(line) {
  if (!line || typeof line !== 'string') return ''
  let s = splitCamelCaseName(line)
  s = s.replace(/([a-z])([A-Z][a-z]+)/g, '$1 $2')
  s = s.replace(/([A-Z]{2,})([a-z][a-z]+)/g, '$1 $2')
  s = s.replace(/([a-z])(\d)/g, '$1 $2')
  s = s.replace(/(\d)([a-zA-Z%])/g, '$1 $2')
  return s.replace(/\s+/g, ' ').trim()
}

/** Raw text between a heading and the next major section (line-based headers) */
export function extractSectionRaw(text, startPattern, endPattern) {
  const re = new RegExp(
    '(?:^|[\r\n])' + startPattern.source + '\\s*[\r\n]+([\\s\\S]*?)(?=[\r\n]\\s*(?:' + endPattern.source + ')\\s*[\r\n]|$)',
    'i'
  )
  const m = text.match(re)
  return m ? m[1].trim() : ''
}

/** Slice body between two section headers (case-insensitive, line-based) */
function sliceBetweenHeaders(text, startWord, endWord) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  const reStart = new RegExp(`(^|[\\r\\n])\\s*${esc(startWord)}\\s*[\\r\\n]+`, 'i')
  let m = text.match(reStart)
  // PDFs often glue headers to content without newline after the title
  if (!m) {
    const reStartLoose = new RegExp(`(^|[\\r\\n])\\s*${esc(startWord)}\\s+(?=[•●\\-\\*]|\\w)`, 'i')
    m = text.match(reStartLoose)
  }
  if (!m) return ''
  const startIdx = m.index + m[0].length
  const tail = text.slice(startIdx)
  const reEnd = new RegExp(`[\\r\\n]\\s*${esc(endWord)}\\s*[\\r\\n]`, 'i')
  const em = tail.match(reEnd)
  if (!em) {
    const reEnd2 = new RegExp(`[\\r\\n]\\s*${esc(endWord)}\\s*$`, 'i')
    const em2 = tail.match(reEnd2)
    return em2 ? tail.slice(0, em2.index).trim() : tail.trim()
  }
  return tail.slice(0, em.index).trim()
}

/** Body after a header until the next known section (for PDFs with messy newlines) */
function extractSectionToNextHeader(text, startPattern, endPatternAlternatives) {
  const endAlt = endPatternAlternatives.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|')
  const re = new RegExp(
    `(?:^|\\n)\\s*(${startPattern.source})\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:${endAlt})\\b|$)`,
    'i'
  )
  const m = text.match(re)
  return m ? m[2].trim() : ''
}

/**
 * PDF extractors often join lines with spaces — inject newlines so section parsers work.
 */
export function preprocessResumeText(text) {
  let t = String(text || '').replace(/\r\n/g, '\n')
  t = t.replace(/[ \t]{2,}/g, ' ')
  // Break before typical section titles (case-insensitive; common in PDF resumes)
  t = t.replace(
    /\s+(?=(?:EDUCATION|SKILLS|EXPERIENCES?|CERTIFICATES?|ACHIEVEMENTS?|RESEARCH\s+PAPERS?|PROJECTS?|EXTRACURRICULAR(?:\s+ACTIVITIES)?)\b)/gi,
    '\n'
  )
  // Singular PROJECT when followed by a bullet (section header)
  t = t.replace(/\s+(?=PROJECT\b)(?=\s*[•●])/gi, '\n')
  // Bullet / sub-bullet characters glued to previous token
  t = t.replace(/([^\n])\s*([•●])/g, '$1\n$2 ')
  t = t.replace(/([^\n])\s*([○◦])/g, '$1\n$2 ')
  return t.trim()
}

export function extractStructuredProfile(text) {
  const normalized = preprocessResumeText(text.replace(/\r\n/g, '\n'))

  const certBody =
    sliceBetweenHeaders(normalized, 'certificates', 'achievements') ||
    sliceBetweenHeaders(normalized, 'certificates', 'extracurricular') ||
    extractSectionRaw(normalized, /CERTIFICATES?/i, /ACHIEVEMENTS|EXTRACURRICULAR/i) ||
    extractSectionToNextHeader(normalized, /CERTIFICATES?/i, ['ACHIEVEMENTS', 'EXTRACURRICULAR', 'EDUCATION', 'SKILLS', 'PROJECT', 'PROJECTS', 'EXPERIENCES', 'EXPERIENCE'])

  const achBody =
    sliceBetweenHeaders(normalized, 'achievements', 'extracurricular') ||
    extractSectionRaw(normalized, /ACHIEVEMENTS?/i, /EXTRACURRICULAR|CERTIFICATES?/i) ||
    extractSectionToNextHeader(normalized, /ACHIEVEMENTS?/i, ['EXTRACURRICULAR', 'CERTIFICATES', 'EDUCATION', 'SKILLS', 'PROJECT', 'PROJECTS', 'EXPERIENCES', 'EXPERIENCE'])

  return {
    experiences:       extractExperiences(normalized),
    education:           extractEducationDetailed(normalized),
    skillCategories:     extractSkillCategories(normalized),
    projects:            extractProjectsDetailed(normalized),
    researchPapers:      extractResearchPapers(normalized),
    certificates:        extractBulletsFromText(certBody),
    achievements:        extractBulletsFromText(achBody),
    extracurricular:     extractExtracurricular(normalized),
  }
}

function extractExperiences(text) {
  const section = sliceBetweenHeaders(text, 'experiences', 'education') ||
    extractSectionRaw(text, /Experiences?/i, /EDUCATION|SKILLS|PROJECT|RESEARCH|CERTIFICATES|ACHIEVEMENTS|EXTRACURRICULAR/i)
  if (!section) return []

  const lines = section.split('\n').map(l => l.trim()).filter(Boolean)
  const out = []
  let i = 0

  while (i < lines.length) {
    if (/^Mobile\s*:/i.test(lines[i])) {
      i++
      continue
    }
    // • Company
    if (/^[•\u2022\u25CF]/.test(lines[i])) {
      const company = lines[i].replace(/^[•\u2022\u25CF]\s*/, '').trim()
      const title = (lines[i + 1] || '').trim()
      const location = (lines[i + 2] || '').trim()
      const period = (lines[i + 3] || '').trim()
      const highlights = []
      let j = i + 4
      while (j < lines.length && /^[○o◦•\u2022\u25CF\u25CB\-–*]/.test(lines[j])) {
        highlights.push(softenMergedResumeWords(lines[j].replace(/^[○o◦•\u2022\u25CF\u25CB\-–*]\s*/, '').trim()))
        j++
      }
      // Heuristic: need at least company + title-ish
      if (company.length > 1) {
        out.push({
          company: splitCamelCaseName(company),
          title,
          location,
          period,
          highlights: highlights.filter(Boolean),
        })
      }
      i = j
      continue
    }
    i++
  }
  return out
}

/** Extract just the institution name from a potentially concatenated line */
export function cleanInstitutionName(raw) {
  if (!raw) return ''
  let s = splitCamelCaseName(raw.trim())

  // Remove period patterns: "Aug 2022 – May 2024", "2022–2024", "Present"
  s = s.replace(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[–\-]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|Present|\d{4})/gi, '')
  s = s.replace(/\d{4}\s*[–\-]\s*(?:\d{4}|Present)/gi, '')

  // Remove CGPA/GPA patterns
  s = s.replace(/;?\s*(?:CGPA|GPA)\s*[:\-–]?\s*[\d.]+(?:\s*\/\s*10)?/gi, '')

  // Remove degree keywords and everything after them
  const degreeRe = /\b(B\.?\s*Tech|M\.?\s*Tech|BCA\b|MCA\b|B\.?\s*Sc|M\.?\s*Sc|MBA|Ph\.?\s*D|B\.?\s*E|M\.?\s*E|Hons?\.?|Bachelor|Master|B\.?\s*Com|B\.?\s*A\b|M\.?\s*A\b)\b.*/i
  const dm = s.search(degreeRe)
  if (dm > 4) s = s.slice(0, dm)

  // Remove trailing location-like suffixes: ", Punjab, India" etc.
  s = s.replace(/,\s*(Punjab|Haryana|Delhi|Mumbai|Noida|Bangalore|Hyderabad|Chennai|Kolkata|India)\b.*/gi, '')

  return s.replace(/[;,\s]+$/, '').trim()
}

/** Extract degree from a concatenated institution/degree line */
function extractDegreeFromLine(raw) {
  if (!raw) return ''
  const m = raw.match(/\b(B\.?\s*Tech|M\.?\s*Tech|BCA\s*(?:Hons?)?|MCA\s*(?:Hons?)?|B\.?\s*Sc|M\.?\s*Sc|MBA|Ph\.?\s*D|B\.?\s*E|M\.?\s*E|B\.?\s*Com|B\.?\s*A|M\.?\s*A)[^,;]*/i)
  return m ? splitCamelCaseName(m[0].trim().replace(/;.*$/, '').trim()) : ''
}

function extractEducationDetailed(text) {
  const section =
    sliceBetweenHeaders(text, 'education', 'skills') ||
    sliceBetweenHeaders(text, 'education', 'research') ||
    extractSectionRaw(text, /EDUCATION/i, /SKILLS|PROJECT|RESEARCH|CERTIFICATES|ACHIEVEMENTS|EXTRACURRICULAR/i) ||
    extractSectionToNextHeader(text, /EDUCATION/i, ['SKILLS', 'RESEARCH', 'PROJECT', 'PROJECTS', 'CERTIFICATES', 'ACHIEVEMENTS', 'EXTRACURRICULAR', 'EXPERIENCES', 'EXPERIENCE'])
  if (!section) return []

  const entries = []
  let blocks = section.split(/(?=^[\s]*[•\u2022])/m).map(b => b.trim()).filter(Boolean)
  if (blocks.length <= 1 && /[•●]/.test(section)) {
    blocks = section.split(/[•●]/g).map(b => b.trim()).filter(b => b.length > 8)
  }

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) continue

    const rawFirst = lines[0].replace(/^[•\u2022]\s*/, '')
    const institution = cleanInstitutionName(rawFirst)

    let degree = extractDegreeFromLine(rawFirst)
    let grade = ''
    let period = ''
    let location = ''

    // Check second line for degree if not found in first
    if (!degree && lines[1]) {
      degree = lines[1].split(';')[0].trim()
      degree = splitCamelCaseName(degree.replace(/^MCAHons/i, 'MCA Hons').replace(/^BCA\s*Hons/i, 'BCA Hons'))
    }

    // Extract CGPA from anywhere in block
    const wholeBlock = block
    const cgpa = wholeBlock.match(/(?:CGPA|GPA)\s*[:\-–]?\s*([\d.]+(?:\s*\/\s*10)?)/i)
    if (cgpa) grade = `CGPA: ${cgpa[1]}`.replace(/\s+/g, ' ').trim()

    // Extract period
    const pr = block.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}\s*[–\-]\s*(?:May|Present|Mar|Jan|Feb|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{0,4}/i)
    if (pr) period = pr[0].trim()

    // Extract location
    const loc = block.match(/Punjab,\s*India|Noida(?:,\s*India)?|India|Bangalore|Hyderabad|Mumbai|Delhi/i)
    if (loc) location = loc[0]

    if (institution.length > 2) {
      entries.push({ institution, degree, grade, period, location })
    }
  }

  return entries
}

function extractSkillCategories(text) {
  const section =
    sliceBetweenHeaders(text, 'skills', 'research paper') ||
    sliceBetweenHeaders(text, 'skills', 'project') ||
    extractSectionRaw(text, /SKILLS/i, /PROJECT|RESEARCH|CERTIFICATES|ACHIEVEMENTS|EXTRACURRICULAR|EDUCATION/i)
  if (!section) return []

  const categories = []
  const lines = section.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    const m = trimmed.match(/^[●\u2022]\s*([^:]+):\s*(.+)$/i)
    if (m) {
      const rawSkills = m[2]
        .split(/[,;]/)
        .map(s => splitCamelCaseName(s.trim()))
        .filter(s => s.length > 0 && s.length < 80)
      categories.push({
        category: splitCamelCaseName(m[1].trim()),
        skills: rawSkills,
      })
    }
  }
  return categories
}

function extractProjectSection(text) {
  const endHeaders = [
    'CERTIFICATES', 'CERTIFICATE', 'ACHIEVEMENTS', 'ACHIEVEMENT',
    'EXTRACURRICULAR', 'EDUCATION', 'SKILLS', 'RESEARCH PAPER',
    'EXPERIENCES', 'EXPERIENCE',
  ]
  const attempts = [
    () => sliceBetweenHeaders(text, 'project', 'certificates'),
    () => sliceBetweenHeaders(text, 'projects', 'certificates'),
    () => sliceBetweenHeaders(text, 'project', 'certificate'),
    () => sliceBetweenHeaders(text, 'projects', 'achievements'),
    () => sliceBetweenHeaders(text, 'project', 'achievements'),
    () => extractSectionRaw(text, /PROJECTS?/i, /CERTIFICATES|ACHIEVEMENTS|EXTRACURRICULAR|RESEARCH|EDUCATION|SKILLS/i),
    () => extractSectionToNextHeader(text, /PROJECTS?/i, endHeaders),
  ]
  for (const fn of attempts) {
    const s = fn()
    if (s && s.length > 8) return s
  }
  return ''
}

function splitProjectChunks(section) {
  const s = section.replace(/^\s*PROJECTS?\s*$/gim, '').trim()
  if (!s) return []

  let chunks = s.split(/(?=^[\s]*[\u2022\u25CF\u25CB][\s]*)/m).map((c) => c.trim()).filter(Boolean)
  if (chunks.length <= 1) {
    chunks = s.split(/\n(?=\s*[\u2022\u25CF\u25CB]\s)/).map((c) => c.trim()).filter(Boolean)
  }
  if (chunks.length <= 1 && /[\u2022\u25CF\u25CB]/.test(s)) {
    chunks = s.split(/(?=[\u2022\u25CF\u25CB]\s+)/).map((c) => c.trim()).filter((c) => c.length > 4)
  }

  return chunks.filter((c) => !/^PROJECTS?$/i.test(c.trim().split('\n')[0]?.trim() || ''))
}

function cleanProjectName(raw) {
  let n = raw.replace(/^[\u2022\u25CF\u25CB•\s]+/g, '').trim()
  n = n.replace(/[:：]\s*$/, '').trim()
  n = n.replace(/\s*\(\s*['']?\d{4}['']?\s*\)?\s*$/, '').trim()
  n = n.replace(/\s*['']?\d{4}['']?\s*\)?\s*$/, '').trim()
  return splitCamelCaseName(n)
}

function extractPeriodFromChunk(chunk) {
  const flat = chunk.replace(/\s+/g, ' ')
  // (Jan 2024–Mar 2024) or Jan 2024 – Present
  let m = flat.match(
    /\(?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}\s*[–\-]\s*(?:May|Mar|Jan|Feb|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present)?\s*\d{0,4}\s*\)?/i
  )
  if (m) return m[0].replace(/[()]/g, '').trim()
  m = flat.match(/\(?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}/i)
  return m ? m[0].replace(/[()]/g, '').trim() : ''
}

function extractProjectsDetailed(text) {
  const section = extractProjectSection(text)
  if (!section) return []

  const projects = []
  const chunks = splitProjectChunks(section)

  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter((l) => {
      if (!l) return false
      if (/^['']?\d{4}\s*\)?\.?$/.test(l)) return false
      if (/^\(\s*Jan/i.test(l) && l.length < 24) return false
      return true
    })
    if (!lines.length) continue

    const nameLine = lines[0].replace(/^[\u2022\u25CF\u25CB•\s]+/, '').trim()
    if (/^PROJECTS?$/i.test(nameLine)) continue
    const name = cleanProjectName(nameLine) || 'Project'

    const highlights = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (/^[\u2022\u25CF\u25CB○o◦•\-–*]/.test(line)) {
        const h = line.replace(/^[\u2022\u25CF\u25CB○o◦•\-–*]\s*/, '').trim()
        if (h.length > 3) highlights.push(softenMergedResumeWords(h))
      }
    }

    const period = extractPeriodFromChunk(chunk)

    projects.push({
      name,
      period,
      highlights: highlights.filter(Boolean),
    })
  }

  return projects
}

function extractResearchPapers(text) {
  const section = sliceBetweenHeaders(text, 'research paper', 'project') ||
    extractSectionRaw(text, /Research\s+Papers?|Research\s+Paper/i, /PROJECT|CERTIFICATES|ACHIEVEMENTS|EXTRACURRICULAR|SKILLS/i)
  if (!section) return []

  const papers = []
  const bullet = section.match(/[●\u2022]\s*([^\n]+)/)
  if (bullet) {
    const title = splitCamelCaseName(bullet[1].trim())
    const abstract = section.replace(/^[●\u2022][^\n]+\n?/, '').trim().substring(0, 800)
    const period = section.match(/(\(?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4})/i)
    papers.push({
      title,
      period: period ? period[1] : '',
      abstract: abstract.replace(/\s+/g, ' ').trim(),
    })
  }
  return papers
}

function extractBulletsFromText(section) {
  if (!section) return []
  const items = []
  for (const line of section.split('\n')) {
    const t = line.trim()
    if (t.length < 4) continue
    let m = t.match(/^[●\u2022○o\-–*]\s*(.+)/)
    if (!m) m = t.match(/^\d+[\.)]\s+(.+)/)
    if (m && m[1].length > 3) {
      items.push(splitCamelCaseName(m[1].trim()))
    }
  }
  return items
}

function extractExtracurricular(text) {
  const m = text.match(/EXTRACURRICULAR\s+ACTIVITIES?\s*([\s\S]*)$/i)
  if (!m) return []
  return extractBulletsFromText(m[1])
}
