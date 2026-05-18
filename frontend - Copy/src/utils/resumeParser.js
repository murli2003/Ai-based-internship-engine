import { ALL_SKILLS } from './skillsDictionary.js';
import { extractStructuredProfile, splitCamelCaseName, cleanInstitutionName } from './resumeParserStructured.js';

// ─── PDF Text Extraction ──────────────────────────────────────────────────────
export async function extractTextFromPDF(file) {
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

function extractEmail(text) {
  const labeled = text.match(/Email\s*:\s*([\w.+-]+@[\w-]+\.[a-zA-Z]{2,})/i);
  if (labeled) return labeled[1].toLowerCase();
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function extractPhone(text) {
  const mobileLabeled = text.match(/Mobile\s*:\s*([+\d\s\-–]+)/i);
  if (mobileLabeled) {
    return mobileLabeled[1].replace(/\s+/g, ' ').trim();
  }
  const patterns = [
    /\+91\s*[\d\s]{10,12}/,
    /(?:\+91[-\s]?|0)?[6-9]\d{9}/,
    /\+?[1-9]\d{0,2}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\d{10}/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].replace(/\s+/g, ' ').trim();
  }
  return null;
}

function extractGitHub(text) {
  const labeled = text.match(/GitHub\s*:\s*(https?:\/\/[^\s]+|[^\s]+)/i);
  if (labeled) {
    let u = labeled[1].trim();
    if (!u.startsWith('http')) u = `https://${u}`;
    return u;
  }
  const m = text.match(/github\.com\/[\w-]+(?:\/[\w-]+)*/i);
  return m ? `https://${m[0]}` : null;
}

function extractLinkedIn(text) {
  const labeled = text.match(/LinkedIn\s*:\s*(https?:\/\/[^\s]+|[^\s]+)/i);
  if (labeled) {
    let u = labeled[1].trim();
    if (!u.startsWith('http')) u = `https://${u}`;
    return u;
  }
  const m = text.match(/linkedin\.com\/in\/[\w%-]+/i);
  return m ? `https://${m[0]}` : null;
}

function extractName(text) {
  let m = text.match(/(?:Name|Full Name)\s*[:\-–]\s*([^\n]+)/i);
  if (m) return splitCamelCaseName(m[1].trim());

  const beforeEmail = text.split(/Email\s*:/i)[0].trim();
  const firstLine = beforeEmail.split(/\n/).map((l) => l.trim()).filter(Boolean)[0];
  if (firstLine && !firstLine.includes('@') && firstLine.length < 80) {
    const cleaned = firstLine.replace(/^[^\w\u00C0-\u0241]+/, '').trim();
    if (cleaned.length >= 2) return splitCamelCaseName(cleaned);
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 12)) {
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line)) {
      return line;
    }
  }
  return 'Not Found';
}

function extractSkills(text) {
  const found = [];
  for (const skill of ALL_SKILLS) {
    const escaped = skill.replace(/[+#.]/g, '\\$&');
    const pattern = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'i');
    if (pattern.test(text)) found.push(skill);
  }
  return found;
}

function extractSection(text, headings) {
  for (const heading of headings) {
    const escaped = heading.replace(/[/\\^$.*+?()[\]{}|]/g, '\\$&');
    const pattern = new RegExp(
      `${escaped}\\s*[:\\n]([\\s\\S]*?)(?=\\n(?:[A-Z][A-Z\\s]{3,}|Education|Experience|Skills|Projects|Awards|Certifications|Contact|$))`,
      'i'
    );
    const m = text.match(pattern);
    if (m) return m[1].trim().substring(0, 1200);
  }
  return null;
}

function extractProjects(text) {
  const raw = extractSection(text, ['Projects', 'Personal Projects', 'Academic Projects', 'Key Projects', 'PROJECT']);
  if (!raw) return [];

  const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 15);
  const projects = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^[\d•\-*►▪✦]+/.test(line) || (line.length < 100 && !line.endsWith(','))) {
      const desc = lines[i + 1] && lines[i + 1].length > 20 ? lines[i + 1] : '';
      projects.push({
        name: line.replace(/^[\d•\-*►▪✦.:]+\s*/, '').trim(),
        description: desc,
      });
      if (desc) i++;
    }
    if (projects.length >= 6) break;
  }

  return projects.length ? projects : [{ name: lines[0] || 'Project mentioned', description: '' }];
}

function extractLanguages(text) {
  const section = extractSection(text, ['Languages', 'Programming Languages', 'Language Skills']);
  if (!section) return [];
  const langs = section.match(/[A-Za-z#+]+/g) || [];
  return [...new Set(langs.filter((l) => l.length > 1).slice(0, 10))];
}

function extractEducation(text) {
  const edu = [];

  const cgpaGlobal = [...text.matchAll(/(?:CGPA|GPA)\s*[:\-–]?\s*(\d+\.?\d*)/gi)];
  cgpaGlobal.forEach((match, i) => {
    edu.push({ type: cgpaGlobal.length > 1 ? `CGPA (${i + 1})` : 'CGPA', value: match[1] });
  });

  if (!cgpaGlobal.length) {
    const cgpaMatch = text.match(/(?:CGPA|GPA|Cumulative GPA|Grade Point)\s*[:\-–]?\s*(\d+\.?\d*)\s*(?:\/\s*(\d+))?/i);
    if (cgpaMatch) {
      edu.push({ type: 'CGPA', value: `${cgpaMatch[1]}${cgpaMatch[2] ? ` / ${cgpaMatch[2]}` : ' / 10'}` });
    }
  }

  const tenthMatch = text.match(/(?:10th|Xth|SSC|Secondary|Class\s*10)\s*(?:Grade|Board|Percentage|Marks|Score)?\s*[:\-–]?\s*(\d+\.?\d*)\s*%?/i);
  if (tenthMatch) {
    edu.push({ type: '10th Grade', value: `${tenthMatch[1]}%` });
  }

  const twelfthMatch = text.match(/(?:12th|XIIth|Intermediate|HSC|Class\s*12|Plus Two)\s*(?:Grade|Board|Percentage|Marks|Score)?\s*[:\-–]?\s*(\d+\.?\d*)\s*%?/i);
  if (twelfthMatch) {
    edu.push({ type: '12th / Intermediate', value: `${twelfthMatch[1]}%` });
  }

  const instRegex = /([A-Z][a-zA-Z\s]+University|[A-Z][a-zA-Z\s]+College|[A-Z][a-zA-Z\s]+Institute)/g;
  const seen = new Set();
  let im;
  while ((im = instRegex.exec(text)) !== null) {
    const v = im[1].trim();
    if (v.length > 8 && v.length < 90 && !seen.has(v)) {
      seen.add(v);
      edu.push({ type: 'Institution', value: v });
      if (seen.size >= 3) break;
    }
  }

  return edu;
}

function mergeStructuredResumeProfile(resumeProfile, legacyProjects, legacyEducation) {
  const rp = { ...resumeProfile };
  if (!rp.projects?.length && legacyProjects?.length) {
    rp.projects = legacyProjects.map((p) => ({
      name: splitCamelCaseName(p.name || 'Project'),
      period: '',
      highlights: p.description ? [splitCamelCaseName(p.description)] : [],
    }));
  }
  if (!rp.education?.length && legacyEducation?.length) {
    const institutions = legacyEducation.filter((e) => e.type === 'Institution');
    const cgpaValues = legacyEducation
      .filter((e) => /^CGPA/i.test(e.type || ''))
      .map((e) => e.value);
    if (institutions.length) {
      rp.education = institutions.map((inst, i) => ({
        institution: inst.value,
        degree: '',
        grade: cgpaValues[i] ? `CGPA: ${cgpaValues[i]}` : '',
        period: '',
        location: '',
      }));
    }
  }
  return rp;
}

export async function parseResume(file, mode = 'student') {
  const text = await extractTextFromPDF(file);

  const name = extractName(text);
  const email = extractEmail(text);
  const mobile = extractPhone(text);
  const skills = extractSkills(text);
  const projects = extractProjects(text);
  const education = extractEducation(text);

  let resumeProfile = extractStructuredProfile(text);
  resumeProfile = mergeStructuredResumeProfile(resumeProfile, projects, education);

  if (mode === 'student') {
    const rawInst =
      resumeProfile.education?.[0]?.institution ||
      resumeProfile.education?.find((e) => /University|College|Institute/i.test(e.institution || ''))?.institution ||
      '';
    const uniFromStructured = cleanInstitutionName(rawInst);

    return {
      rawText: text,
      name,
      email,
      mobile,
      github: extractGitHub(text),
      linkedin: extractLinkedIn(text),
      skills,
      projects,
      education,
      resumeProfile,
      universityHint: uniFromStructured,
    };
  }

  return {
    rawText: text,
    name,
    email,
    mobile,
    skills,
    projects,
    education,
    languages: extractLanguages(text),
    resumeProfile,
  };
}
