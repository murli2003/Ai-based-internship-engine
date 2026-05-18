import { computeSkillGaps } from "./skillGap.js";

/**
 * Build human-readable explanation for a recommendation (Explainable AI).
 * Used in recommendation cards and provider candidate view.
 */
export function buildExplanation(
	studentProfile,
	internship,
	score,
	rank,
	factors = {},
) {
	const { missing } = computeSkillGaps(studentProfile, internship);
	const requiredSkills = internship.requiredSkills || [];
	const studentSkillNames = (studentProfile.skills || []).map((s) =>
		(s.name || s).toLowerCase(),
	);
	const keySkillsMatched = requiredSkills.filter((r) =>
		studentSkillNames.some(
			(s) =>
				s.includes((r || "").toLowerCase()) ||
				(r || "").toLowerCase().includes(s),
		),
	);

	let academicNote = "You meet the eligibility criteria for this role.";
	if (studentProfile.cgpa != null && internship.minCgpa > 0) {
		if (studentProfile.cgpa >= internship.minCgpa) {
			academicNote = `Your CGPA (${studentProfile.cgpa}) meets or exceeds the requirement (${internship.minCgpa}).`;
		} else {
			academicNote = `Your CGPA (${studentProfile.cgpa}) is below the minimum (${internship.minCgpa}) for this role.`;
		}
	}

	const reasons = [];
	const skillOverlap = factors.skillOverlap ?? 0;
	if (skillOverlap >= 0.7)
		reasons.push("Strong skill overlap with the role.");
	else if (skillOverlap >= 0.4)
		reasons.push(
			"Moderate skill overlap; some required skills match your profile.",
		);
	else if (requiredSkills.length)
		reasons.push(
			"Consider adding more of the required skills to improve your match.",
		);
	if (factors.domainMatch)
		reasons.push("This role is in a domain you prefer.");
	if (factors.locationMatch)
		reasons.push("Location aligns with your preference.");
	if (
		internship.mode &&
		studentProfile.preferences?.mode === internship.mode
	) {
		reasons.push(`Work mode (${internship.mode}) matches your preference.`);
	}
	if (!reasons.length)
		reasons.push(
			"This role is eligible for your profile; complete your preferences for better ranking.",
		);

	const whyThisRank =
		reasons.join(" ") || "Good overall fit for your profile.";

	return {
		keySkillsMatched,
		academicPerformance: academicNote,
		whyThisRank,
		factors: {
			skillOverlap: skillOverlap,
			domainMatch: factors.domainMatch ?? false,
			locationMatch: factors.locationMatch ?? false,
		},
		skillGaps: missing,
	};
}

/**
 * Build advanced explanation with multiple AI signal breakdown
 * @param {Object} studentProfile - Student profile
 * @param {Object} internship - Internship details
 * @param {Object} scores - All AI model scores
 * @param {number} rank - Current rank
 * @param {Object} factors - Matching factors
 * @returns {Object} - Comprehensive explanation
 */
export function buildAdvancedExplanation(
	studentProfile,
	internship,
	scores,
	rank,
	factors = {},
) {
	const { missing } = computeSkillGaps(studentProfile, internship);
	const requiredSkills = internship.requiredSkills || [];
	const studentSkillNames = (studentProfile.skills || []).map((s) =>
		(s.name || s).toLowerCase(),
	);

	// Key skills matched
	const keySkillsMatched = requiredSkills.filter((r) =>
		studentSkillNames.some(
			(s) =>
				s.includes((r || "").toLowerCase()) ||
				(r || "").toLowerCase().includes(s),
		),
	);

	// Academic performance assessment
	let academicNote = "You meet the eligibility criteria for this role.";
	let academicScore = 0.8;

	if (studentProfile.cgpa != null && internship.minCgpa > 0) {
		const cgpaDiff = studentProfile.cgpa - internship.minCgpa;
		if (cgpaDiff >= 2) {
			academicNote = `Excellent academic fit! Your CGPA (${studentProfile.cgpa}) significantly exceeds the requirement (${internship.minCgpa}).`;
			academicScore = 1.0;
		} else if (cgpaDiff >= 1) {
			academicNote = `Strong academic fit. Your CGPA (${studentProfile.cgpa}) comfortably meets the requirement (${internship.minCgpa}).`;
			academicScore = 0.9;
		} else if (cgpaDiff >= 0) {
			academicNote = `Your CGPA (${studentProfile.cgpa}) meets the minimum requirement (${internship.minCgpa}).`;
			academicScore = 0.7;
		} else {
			academicNote = `Note: Your CGPA (${studentProfile.cgpa}) is below the stated minimum (${internship.minCgpa}), but you may still be considered.`;
			academicScore = 0.4;
		}
	}

	// Build detailed reasoning
	const reasons = [];
	const reasonDetails = [];

	// Skill matching analysis
	const skillOverlap = factors.skillOverlap ?? scores.contentScore ?? 0;
	if (skillOverlap >= 0.8) {
		reasons.push("Exceptional skill match");
		reasonDetails.push({
			factor: "Skills",
			score: Math.round(skillOverlap * 100),
			description: `You possess ${keySkillsMatched.length} of ${requiredSkills.length} required skills with strong proficiency.`,
			impact: "high",
		});
	} else if (skillOverlap >= 0.6) {
		reasons.push("Strong skill alignment");
		reasonDetails.push({
			factor: "Skills",
			score: Math.round(skillOverlap * 100),
			description: `Good match with ${keySkillsMatched.length} of ${requiredSkills.length} required skills.`,
			impact: "high",
		});
	} else if (skillOverlap >= 0.4) {
		reasons.push("Moderate skill match");
		reasonDetails.push({
			factor: "Skills",
			score: Math.round(skillOverlap * 100),
			description: `You have ${keySkillsMatched.length} of ${requiredSkills.length} required skills. Consider developing missing skills.`,
			impact: "medium",
		});
	} else {
		reasons.push("Developing skills recommended");
		reasonDetails.push({
			factor: "Skills",
			score: Math.round(skillOverlap * 100),
			description: `Limited skill overlap. This could be a learning opportunity if you're willing to develop new skills.`,
			impact: "medium",
		});
	}

	// Collaborative filtering signal
	if (scores.collaborativeScore && scores.collaborativeScore > 0) {
		reasons.push("Students similar to you succeeded here");
		reasonDetails.push({
			factor: "Similar Students",
			score: Math.round(scores.collaborativeScore * 100),
			description:
				"Based on historical data, students with similar profiles have performed well in this internship.",
			impact: "medium",
		});
	}

	// NLP matching
	if (scores.nlpScore && scores.nlpScore > 0.5) {
		reasons.push("Strong semantic match");
		reasonDetails.push({
			factor: "Overall Fit",
			score: Math.round(scores.nlpScore * 100),
			description:
				"Advanced AI analysis shows strong alignment between your profile and internship requirements.",
			impact: "medium",
		});
	}

	// Preference matching
	if (factors.domainMatch) {
		reasons.push("Matches your domain preference");
		reasonDetails.push({
			factor: "Domain",
			score: 100,
			description: `This internship is in ${internship.domain}, which aligns with your interests.`,
			impact: "low",
		});
	}

	if (factors.locationMatch) {
		reasons.push("Preferred location");
		reasonDetails.push({
			factor: "Location",
			score: 100,
			description: `Located in ${internship.location}, matching your location preferences.`,
			impact: "low",
		});
	}

	if (
		internship.mode &&
		studentProfile.preferences?.mode === internship.mode
	) {
		reasons.push(`${internship.mode} work mode as preferred`);
		reasonDetails.push({
			factor: "Work Mode",
			score: 100,
			description: `Offers ${internship.mode} work arrangement as you prefer.`,
			impact: "low",
		});
	}

	// Why this rank
	let rankExplanation = "";
	if (rank === 1) {
		rankExplanation =
			"🏆 This is your top match! Exceptional alignment across all criteria.";
	} else if (rank <= 3) {
		rankExplanation = `⭐ One of your best matches. Ranked #${rank} due to strong overall fit.`;
	} else if (rank <= 5) {
		rankExplanation = `✓ Solid match ranked #${rank}. Consider applying if it interests you.`;
	} else {
		rankExplanation = `Ranked #${rank}. ${reasons[0] || "Eligible based on your profile"}.`;
	}

	// Improvement suggestions
	const suggestions = [];
	if (missing.length > 0 && missing.length <= 3) {
		suggestions.push(
			`Boost your match by learning: ${missing.slice(0, 3).join(", ")}`,
		);
	} else if (missing.length > 3) {
		const skillsList = missing.slice(0, 2).join(", ");
		const remaining = missing.length - 2;
		suggestions.push(
			`Develop skills in ${skillsList} and ${remaining} more to strengthen your profile`,
		);
	}

	if (!factors.domainMatch && studentProfile.preferences?.domains?.length) {
		suggestions.push(
			"This is outside your preferred domains but could broaden your experience",
		);
	}

	return {
		summary: reasons.slice(0, 3).join(" • "),
		rankExplanation,
		keySkillsMatched,
		academicPerformance: academicNote,
		reasonDetails,
		suggestions,
		aiScores: {
			overall: Math.round(
				(scores.comprehensiveScore || scores.hybridScore) * 100,
			),
			skillMatch: Math.round(skillOverlap * 100),
			academicFit: Math.round(academicScore * 100),
			collaborative: Math.round((scores.collaborativeScore || 0) * 100),
			semanticMatch: Math.round((scores.nlpScore || 0) * 100),
		},
		confidence:
			scores.nlpMatch?.confidence ||
			(skillOverlap > 0.7
				? "high"
				: skillOverlap > 0.4
					? "medium"
					: "low"),
		factors: {
			skillOverlap,
			domainMatch: factors.domainMatch ?? false,
			locationMatch: factors.locationMatch ?? false,
			collaborativeSignal: factors.collaborativeSignal ?? 0,
		},
		skillGaps: missing,
	};
}

export default {
	buildExplanation,
	buildAdvancedExplanation,
};
