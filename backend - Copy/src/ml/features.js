import { normalizeSkill } from '../utils/tokenize.js';

const DOMAINS = ['tech', 'finance', 'marketing', 'design', 'data', 'research', 'operations', 'hr', 'other'];
const MODES = ['remote', 'onsite', 'hybrid'];
const LOCATIONS = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'pune', 'kolkata', 'remote', 'other'];

function buildSkillVector(skills, allSkills) {
  const vec = new Array(allSkills.length).fill(0);
  (skills || []).forEach((s) => {
    const name = typeof s === 'string' ? s : s?.name;
    const norm = normalizeSkill(name);
    const idx = allSkills.indexOf(norm);
    if (idx >= 0) vec[idx] = 1;
  });
  return vec;
}

function domainIndex(d) {
  const norm = (d || 'other').toLowerCase();
  const idx = DOMAINS.findIndex((x) => norm.includes(x));
  return idx >= 0 ? idx : DOMAINS.length - 1;
}

function modeIndex(m) {
  const idx = MODES.indexOf((m || 'hybrid').toLowerCase());
  return idx >= 0 ? idx : 2;
}

function locationIndex(l) {
  const norm = (l || 'other').toLowerCase();
  const idx = LOCATIONS.findIndex((x) => norm.includes(x));
  return idx >= 0 ? idx : LOCATIONS.length - 1;
}

export function getAllSkillsSet(internships, studentProfiles) {
  const set = new Set();
  (internships || []).forEach((i) => (i.requiredSkills || []).forEach((s) => set.add(normalizeSkill(s))));
  (studentProfiles || []).forEach((p) => (p.skills || []).forEach((s) => set.add(normalizeSkill(s.name || s))));
  return Array.from(set);
}

export function buildStudentFeatureVector(profile, allSkills) {
  const skillVec = buildSkillVector((profile.skills || []).map((s) => s.name || s), allSkills);
  const cgpaNorm = profile.cgpa != null ? Math.min(1, profile.cgpa / 10) : 0.5;
  const domainPref = (profile.preferences?.domains || [])[0];
  const locPref = (profile.preferences?.locations || [])[0];
  const domainEnc = new Array(DOMAINS.length).fill(0);
  domainEnc[domainIndex(domainPref)] = 1;
  const locEnc = new Array(LOCATIONS.length).fill(0);
  locEnc[locationIndex(locPref)] = 1;
  const modeEnc = new Array(MODES.length).fill(0);
  modeEnc[modeIndex(profile.preferences?.mode)] = 1;
  return [...skillVec, cgpaNorm, ...domainEnc, ...locEnc, ...modeEnc];
}

export function buildInternshipFeatureVector(internship, allSkills) {
  const skillVec = buildSkillVector(internship.requiredSkills || [], allSkills);
  const minCgpaNorm = (internship.minCgpa || 0) / 10;
  const domainEnc = new Array(DOMAINS.length).fill(0);
  domainEnc[domainIndex(internship.domain)] = 1;
  const locEnc = new Array(LOCATIONS.length).fill(0);
  locEnc[locationIndex(internship.location)] = 1;
  const modeEnc = new Array(MODES.length).fill(0);
  modeEnc[modeIndex(internship.mode)] = 1;
  return [...skillVec, minCgpaNorm, ...domainEnc, ...locEnc, ...modeEnc];
}

export function getFeatureDimension(allSkills) {
  const n = allSkills.length;
  return n + 1 + DOMAINS.length + LOCATIONS.length + MODES.length;
}
