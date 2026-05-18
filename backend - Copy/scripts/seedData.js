/**
 * Seed database with sample providers, internships, students, and applications.
 * Run once: node scripts/seedData.js (from backend folder, with MONGODB_URI set)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import StudentProfile from '../src/models/StudentProfile.js';
import Provider from '../src/models/Provider.js';
import Internship from '../src/models/Internship.js';
import Application from '../src/models/Application.js';

const SALT = 10;
const PASSWORD = 'password123';

const COMPANIES = [
  { orgName: 'TechCorp India', industry: 'Technology', location: 'Bangalore' },
  { orgName: 'FinServe Solutions', industry: 'Finance', location: 'Mumbai' },
  { orgName: 'DataDriven Labs', industry: 'Data & Analytics', location: 'Hyderabad' },
  { orgName: 'CloudNine Systems', industry: 'Technology', location: 'Pune' },
  { orgName: 'EduTech Innovations', industry: 'EdTech', location: 'Delhi' },
  { orgName: 'HealthFirst Digital', industry: 'Healthcare', location: 'Chennai' },
];

const INTERNSHIPS_DATA = [
  { title: 'Full Stack Developer Intern', domain: 'tech', skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'], location: 'Bangalore', mode: 'hybrid', stipend: 25000, minCgpa: 7.5, durationWeeks: 12 },
  { title: 'Data Science Intern', domain: 'data', skills: ['Python', 'SQL', 'Machine Learning', 'Pandas'], location: 'Hyderabad', mode: 'remote', stipend: 30000, minCgpa: 8, durationWeeks: 10 },
  { title: 'Frontend Developer Intern', domain: 'tech', skills: ['React', 'TypeScript', 'CSS'], location: 'Mumbai', mode: 'onsite', stipend: 20000, minCgpa: 7, durationWeeks: 8 },
  { title: 'Backend Developer Intern', domain: 'tech', skills: ['Node.js', 'Python', 'SQL', 'AWS'], location: 'Pune', mode: 'hybrid', stipend: 28000, minCgpa: 7.5, durationWeeks: 12 },
  { title: 'Finance Analyst Intern', domain: 'finance', skills: ['Excel', 'Financial Modeling', 'SQL'], location: 'Mumbai', mode: 'onsite', stipend: 22000, minCgpa: 7.5, durationWeeks: 10 },
  { title: 'Marketing Intern', domain: 'marketing', skills: ['Digital Marketing', 'Content Writing', 'SEO'], location: 'Delhi', mode: 'remote', stipend: 15000, minCgpa: 6.5, durationWeeks: 8 },
  { title: 'DevOps Intern', domain: 'tech', skills: ['Docker', 'Kubernetes', 'AWS', 'Linux'], location: 'Bangalore', mode: 'hybrid', stipend: 26000, minCgpa: 7, durationWeeks: 12 },
  { title: 'ML Engineer Intern', domain: 'data', skills: ['Python', 'TensorFlow', 'PyTorch', 'ML'], location: 'Hyderabad', mode: 'remote', stipend: 35000, minCgpa: 8.5, durationWeeks: 14 },
  { title: 'Product Management Intern', domain: 'tech', skills: ['Product Strategy', 'Analytics', 'User Research'], location: 'Bangalore', mode: 'hybrid', stipend: 24000, minCgpa: 7, durationWeeks: 10 },
  { title: 'UI/UX Design Intern', domain: 'design', skills: ['Figma', 'Design Systems', 'User Research'], location: 'Pune', mode: 'remote', stipend: 18000, minCgpa: 6.5, durationWeeks: 8 },
  { title: 'QA Engineer Intern', domain: 'tech', skills: ['Testing', 'Selenium', 'API Testing', 'JavaScript'], location: 'Chennai', mode: 'hybrid', stipend: 20000, minCgpa: 7, durationWeeks: 10 },
  { title: 'Business Development Intern', domain: 'marketing', skills: ['Sales', 'Communication', 'Excel'], location: 'Mumbai', mode: 'onsite', stipend: 16000, minCgpa: 6.5, durationWeeks: 8 },
];

const STUDENTS_DATA = [
  { fullName: 'Rahul Verma', institution: 'IIT Bombay', course: 'B.Tech', branch: 'CSE', yearOfStudy: 3, cgpa: 8.2, skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'], domains: ['tech'], locations: ['Bangalore', 'Mumbai'], mode: 'hybrid' },
  { fullName: 'Priya Nair', institution: 'BITS Pilani', course: 'B.Tech', branch: 'CSE', yearOfStudy: 3, cgpa: 8.8, skills: ['Python', 'Machine Learning', 'SQL', 'Pandas'], domains: ['data', 'tech'], locations: ['Hyderabad', 'Bangalore'], mode: 'remote' },
  { fullName: 'Arjun Reddy', institution: 'IIIT Hyderabad', course: 'B.Tech', branch: 'CSE', yearOfStudy: 4, cgpa: 7.9, skills: ['React', 'TypeScript', 'CSS', 'Node.js'], domains: ['tech'], locations: ['Mumbai', 'Pune'], mode: 'hybrid' },
  { fullName: 'Sneha Patel', institution: 'NIT Surat', course: 'B.Tech', branch: 'ECE', yearOfStudy: 3, cgpa: 7.5, skills: ['Python', 'SQL', 'Excel', 'Financial Modeling'], domains: ['finance', 'data'], locations: ['Mumbai'], mode: 'onsite' },
  { fullName: 'Vikram Singh', institution: 'Delhi Technological University', course: 'B.Tech', branch: 'IT', yearOfStudy: 3, cgpa: 7.2, skills: ['Docker', 'AWS', 'Linux', 'Python'], domains: ['tech'], locations: ['Bangalore', 'Pune'], mode: 'hybrid' },
  { fullName: 'Ananya Krishnan', institution: 'VIT Vellore', course: 'B.Tech', branch: 'CSE', yearOfStudy: 3, cgpa: 8.5, skills: ['TensorFlow', 'PyTorch', 'Python', 'ML'], domains: ['data'], locations: ['Hyderabad'], mode: 'remote' },
  { fullName: 'Karan Mehta', institution: 'Pune University', course: 'BCA', branch: 'Computer Applications', yearOfStudy: 3, cgpa: 6.8, skills: ['Digital Marketing', 'SEO', 'Content Writing'], domains: ['marketing'], locations: ['Pune', 'Delhi'], mode: 'remote' },
  { fullName: 'Divya Sharma', institution: 'SRM University', course: 'B.Tech', branch: 'CSE', yearOfStudy: 4, cgpa: 7.6, skills: ['Figma', 'UI Design', 'User Research'], domains: ['design', 'tech'], locations: ['Pune', 'Bangalore'], mode: 'remote' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internship_platform');

  const passwordHash = await bcrypt.hash(PASSWORD, SALT);

  // ─── Providers & internships ───
  const providerUsers = [];
  const providers = [];
  const internships = [];

  for (let i = 0; i < COMPANIES.length; i++) {
    const c = COMPANIES[i];
    const email = `provider${i + 1}@company.com`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, passwordHash, role: 'provider' });
      const prov = await Provider.create({ userId: user._id, ...c });
      user.profileRef = prov._id;
      user.profileModel = 'Provider';
      await user.save();
      providerUsers.push(user);
      providers.push(prov);
    } else {
      const prov = await Provider.findOne({ userId: user._id });
      if (prov) providers.push(prov);
    }
  }

  const internshipsPerProvider = Math.ceil(INTERNSHIPS_DATA.length / providers.length);
  for (let i = 0; i < INTERNSHIPS_DATA.length; i++) {
    const prov = providers[i % providers.length];
    const d = INTERNSHIPS_DATA[i];
    const existing = await Internship.findOne({ providerRef: prov._id, title: d.title });
    if (!existing) {
      const intern = await Internship.create({
        providerRef: prov._id,
        title: d.title,
        description: `Join our ${d.domain} team as an intern. Great learning opportunity with mentorship.`,
        domain: d.domain,
        requiredSkills: d.skills,
        minCgpa: d.minCgpa,
        durationWeeks: d.durationWeeks,
        stipend: d.stipend,
        mode: d.mode,
        location: d.location,
        slots: 3,
        status: 'active',
      });
      internships.push(intern);
    }
  }

  const allInternships = await Internship.find({ status: 'active' }).lean();

  // ─── Students ───
  const students = [];
  for (let i = 0; i < STUDENTS_DATA.length; i++) {
    const s = STUDENTS_DATA[i];
    const email = `student${i + 1}@university.com`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, passwordHash, role: 'student' });
      const profile = await StudentProfile.create({
        userId: user._id,
        fullName: s.fullName,
        institution: s.institution,
        course: s.course,
        branch: s.branch,
        yearOfStudy: s.yearOfStudy,
        cgpa: s.cgpa,
        skills: (s.skills || []).map((name) => ({ name, level: 'intermediate' })),
        preferences: {
          domains: s.domains || [],
          locations: s.locations || [],
          mode: s.mode || 'hybrid',
        },
      });
      user.profileRef = profile._id;
      user.profileModel = 'StudentProfile';
      await user.save();
      students.push({ user, profile });
    }
  }

  // ─── Applications (each student applies to 2–4 random internships) ───
  const statuses = ['pending', 'pending', 'pending', 'shortlisted', 'accepted', 'rejected'];
  for (const { user, profile } of students) {
    const count = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...allInternships].sort(() => Math.random() - 0.5);
    for (let j = 0; j < Math.min(count, shuffled.length); j++) {
      const intern = shuffled[j];
      const exists = await Application.findOne({ student: user._id, internship: intern._id });
      if (!exists) {
        await Application.create({
          student: user._id,
          internship: intern._id,
          status: statuses[Math.floor(Math.random() * statuses.length)],
        });
      }
    }
  }

  console.log('Seed complete.');
  console.log('Providers:', providers.length, '| Internships:', allInternships.length, '| Students:', students.length);
  console.log('Login as student: student1@university.com /', PASSWORD);
  console.log('Login as provider: provider1@company.com /', PASSWORD);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
