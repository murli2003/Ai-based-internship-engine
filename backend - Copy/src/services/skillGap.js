import { normalizeSkill } from '../utils/tokenize.js';

const LEARNING_RESOURCES = {
  javascript: { name: 'JavaScript', link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  python: { name: 'Python', link: 'https://docs.python.org/3/' },
  react: { name: 'React', link: 'https://react.dev' },
  node: { name: 'Node.js', link: 'https://nodejs.org/docs' },
  sql: { name: 'SQL', link: 'https://www.w3schools.com/sql/' },
  mongodb: { name: 'MongoDB', link: 'https://www.mongodb.com/docs' },
  aws: { name: 'AWS', link: 'https://aws.amazon.com/training/' },
  data: { name: 'Data Analysis', link: 'https://www.kaggle.com/learn' },
  default: { name: 'General Skills', link: 'https://www.coursera.org' },
};

export function computeSkillGaps(studentProfile, internship) {
  const required = (internship.requiredSkills || []).map((s) => normalizeSkill(s));
  const have = (studentProfile.skills || []).map((s) => normalizeSkill(s.name || s));
  const missing = required.filter((r) => !have.some((h) => h.includes(r) || r.includes(h)));
  const suggestedLearning = missing.map((skill) => {
    const key = Object.keys(LEARNING_RESOURCES).find((k) => skill.includes(k) || k.includes(skill));
    return { skill, ...(LEARNING_RESOURCES[key] || LEARNING_RESOURCES.default) };
  });
  return { missing, suggestedLearning };
}
