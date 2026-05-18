import { ELIGIBILITY } from '../config/constants.js';
import Application from '../models/Application.js';

/**
 * Rule-based filter per PM scheme: eligibility, reservation, location, max prior internships.
 */
export async function filterEligibleInternships(studentProfile, internships) {
  if (!studentProfile || !internships?.length) return [];

  const appliedCount = await Application.countDocuments({
    student: studentProfile.userId,
    status: { $in: ['pending', 'shortlisted', 'accepted'] },
  });

  const filtered = internships.filter((internship) => {
    if (internship.status !== 'active') return false;
    if (studentProfile.cgpa != null && internship.minCgpa > 0 && studentProfile.cgpa < internship.minCgpa) return false;
    if (studentProfile.backlogs > ELIGIBILITY.MAX_BACKLOGS) return false;
    if (studentProfile.yearOfStudy != null && studentProfile.yearOfStudy < ELIGIBILITY.MIN_YEAR_OF_STUDY) return false;
    if (appliedCount >= ELIGIBILITY.MAX_PRIOR_INTERNSHIPS) return false;

    if (internship.policyFlags?.regionConstraints?.length && studentProfile.institution) {
      const regionMatch = internship.policyFlags.regionConstraints.some(
        (r) => studentProfile.institution?.toLowerCase().includes(r.toLowerCase())
      );
      if (!regionMatch) return false;
    }

    return true;
  });

  return filtered;
}
