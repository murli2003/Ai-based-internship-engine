import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";
import { filterEligibleInternships } from "./ruleBasedFilter.js";
import {
	getAllSkillsSet,
	buildStudentFeatureVector,
	buildInternshipFeatureVector,
} from "../ml/features.js";
import { cosineSimilarity } from "../ml/similarity.js";
import { applyFairnessWeights } from "./fairness.js";
import { computeSkillGaps } from "./skillGap.js";
import { buildExplanation, buildAdvancedExplanation } from "./xai.js";
import { RANKING } from "../config/constants.js";
import {
	getCollaborativeScore,
	initializeCollaborativeFiltering,
} from "../ml/collaborativeFiltering.js";
import {
	calculateComprehensiveScore,
	applyDiversityConstraints,
	topsis,
} from "../ml/mcdm.js";
import { matchJobToCandidate } from "../ml/nlp.js";

/**
 * Advanced Hybrid Recommendation Engine
 * Combines content-based filtering, collaborative filtering, NLP analysis, and MCDM
 * Implements enterprise-grade AI recommendation system for PM Internship Scheme
 */

// Global cache for collaborative filtering data
let cfDataCache = null;
let cfLastUpdate = null;
const CF_CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Initialize or refresh collaborative filtering model
 */
async function ensureCFData() {
	const now = Date.now();
	if (cfDataCache && cfLastUpdate && now - cfLastUpdate < CF_CACHE_DURATION) {
		return cfDataCache;
	}

	try {
		const [applications, students, internships] = await Promise.all([
			Application.find({
				status: {
					$in: ["accepted", "shortlisted", "completed", "rejected"],
				},
			})
				.select("studentRef internshipRef status rating")
				.lean(),
			StudentProfile.find().select("_id skills cgpa preferences").lean(),
			Internship.find({ status: "active" })
				.select("_id title requiredSkills domain")
				.lean(),
		]);

		cfDataCache = initializeCollaborativeFiltering(
			applications,
			students,
			internships,
		);
		cfLastUpdate = now;

		return cfDataCache;
	} catch (error) {
		console.error("CF initialization error:", error);
		return null;
	}
}

/**
 * Get advanced ML-powered recommendations for a student
 * @param {Object} studentProfile - Student profile object
 * @param {Object} options - Configuration options
 * @returns {Object} - Recommendations with detailed analysis
 */
export async function getRecommendations(studentProfile, options = {}) {
	const topK = options.topK ?? RANKING.TOP_K;
	const includeNLP = options.includeNLP !== false;
	const includeCollaborative = options.includeCollaborative !== false;
	const includeMCDM = options.includeMCDM !== false;

	// Fetch active internships
	const internships = await Internship.find({ status: "active" })
		.populate("providerRef")
		.lean();
	const eligible = await filterEligibleInternships(
		studentProfile,
		internships,
	);

	if (!eligible.length) {
		return {
			recommendations: [],
			metadata: {
				totalInternships: internships.length,
				eligibleInternships: 0,
				message:
					"No eligible internships found. Please complete your profile or adjust preferences.",
			},
		};
	}

	// Initialize collaborative filtering if enabled
	let cfData = null;
	if (includeCollaborative) {
		cfData = await ensureCFData();
	}

	// Build feature vectors for content-based filtering
	const allSkills = getAllSkillsSet(eligible, [studentProfile]);
	const studentVec = buildStudentFeatureVector(studentProfile, allSkills);

	// Generate student profile text for NLP matching
	const studentText = generateStudentText(studentProfile);

	const scored = [];

	for (const internship of eligible) {
		// Content-based scoring (cosine similarity)
		const internshipVec = buildInternshipFeatureVector(
			internship,
			allSkills,
		);
		const contentScore = cosineSimilarity(studentVec, internshipVec);

		// Collaborative filtering score
		let collaborativeScore = 0;
		if (cfData && includeCollaborative) {
			collaborativeScore = getCollaborativeScore(
				studentProfile._id,
				internship._id,
				cfData,
			);
		}

		// NLP-based matching score
		let nlpScore = 0;
		let nlpMatch = null;
		if (includeNLP) {
			const internshipText = generateInternshipText(internship);
			nlpMatch = matchJobToCandidate(internshipText, studentText);
			nlpScore = nlpMatch.overallMatch;
		}

		// Hybrid score calculation
		const hybridScore = calculateHybridScore({
			contentScore,
			collaborativeScore,
			nlpScore,
			weights: {
				content: 0.5,
				collaborative: 0.3,
				nlp: 0.2,
			},
		});

		// Domain and location matching
		const domainMatch = studentProfile.preferences?.domains?.length
			? studentProfile.preferences.domains.some((d) =>
					(internship.domain || "")
						.toLowerCase()
						.includes((d || "").toLowerCase()),
				)
			: false;

		const locationMatch = studentProfile.preferences?.locations?.length
			? studentProfile.preferences.locations.some((l) =>
					(internship.location || "")
						.toLowerCase()
						.includes((l || "").toLowerCase()),
				)
			: false;

		scored.push({
			internship,
			score: hybridScore,
			contentScore,
			collaborativeScore,
			nlpScore,
			nlpMatch,
			factors: {
				skillOverlap: contentScore,
				domainMatch,
				locationMatch,
				collaborativeSignal: collaborativeScore,
			},
		});
	}

	// Sort by hybrid score
	let ranked = scored.sort((a, b) => b.score - a.score);

	// Apply MCDM for comprehensive ranking
	if (includeMCDM && ranked.length > 0) {
		ranked = ranked.map((r) => ({
			...r,
			comprehensiveScore: calculateComprehensiveScore(r, studentProfile, {
				skillMatch: 0.3,
				academicFit: 0.15,
				domainPreference: 0.15,
				locationPreference: 0.1,
				modePreference: 0.05,
				collaborativeScore: 0.15,
				providerReputation: 0.05,
				learningOpportunity: 0.05,
			}),
		}));

		// Apply diversity constraints
		ranked = applyDiversityConstraints(ranked, studentProfile, {
			maxSameProvider: 3,
			maxSameDomain: 5,
			maxSameLocation: 5,
			promoteDiversity: true,
		});

		// Re-sort by comprehensive score
		ranked = ranked.sort(
			(a, b) => b.comprehensiveScore - a.comprehensiveScore,
		);
	}

	// Apply fairness adjustments
	ranked = applyFairnessWeights(ranked, studentProfile);

	// Take top K
	ranked = ranked.slice(0, topK);

	// Build final recommendations with explanations
	const recommendations = ranked.map((r, idx) => {
		const { missing, suggestedLearning } = computeSkillGaps(
			studentProfile,
			r.internship,
		);

		// Build advanced explanation
		const explanation = buildAdvancedExplanation(
			studentProfile,
			r.internship,
			{
				hybridScore: r.score,
				contentScore: r.contentScore,
				collaborativeScore: r.collaborativeScore,
				nlpScore: r.nlpScore,
				comprehensiveScore: r.comprehensiveScore,
				nlpMatch: r.nlpMatch,
			},
			idx + 1,
			r.factors,
		);

		return {
			rank: idx + 1,
			internship: r.internship,
			matchPercent: Math.round((r.comprehensiveScore || r.score) * 100),
			scores: {
				overall: Math.round((r.comprehensiveScore || r.score) * 100),
				content: Math.round(r.contentScore * 100),
				collaborative: Math.round(r.collaborativeScore * 100),
				nlp: Math.round(r.nlpScore * 100),
			},
			explanation,
			skillGaps: missing,
			suggestedLearning,
			matchedSkills: r.nlpMatch?.matchedSkills || [],
			confidence:
				r.nlpMatch?.confidence ||
				(r.score > 0.7 ? "high" : r.score > 0.4 ? "medium" : "low"),
		};
	});

	return {
		recommendations,
		metadata: {
			totalInternships: internships.length,
			eligibleInternships: eligible.length,
			recommendedInternships: recommendations.length,
			aiModelsUsed: {
				contentBased: true,
				collaborative: includeCollaborative && cfData !== null,
				nlp: includeNLP,
				mcdm: includeMCDM,
			},
			timestamp: new Date(),
		},
	};
}

/**
 * Calculate hybrid score from multiple signals
 * @param {Object} scores - Individual scores and weights
 * @returns {number} - Hybrid score
 */
function calculateHybridScore({
	contentScore,
	collaborativeScore,
	nlpScore,
	weights,
}) {
	const totalWeight = weights.content + weights.collaborative + weights.nlp;

	return (
		(contentScore * weights.content +
			collaborativeScore * weights.collaborative +
			nlpScore * weights.nlp) /
		totalWeight
	);
}

/**
 * Generate text representation of student profile for NLP
 * @param {Object} profile - Student profile
 * @returns {string} - Text representation
 */
function generateStudentText(profile) {
	const parts = [];

	if (profile.skills?.length) {
		parts.push(
			"Skills: " + profile.skills.map((s) => s.name || s).join(", "),
		);
	}

	if (profile.branch) {
		parts.push("Branch: " + profile.branch);
	}

	if (profile.interests?.length) {
		parts.push("Interests: " + profile.interests.join(", "));
	}

	if (profile.projects?.length) {
		parts.push(
			"Projects: " +
				profile.projects
					.map((p) => `${p.title}: ${p.description || ""}`)
					.join(". "),
		);
	}

	if (profile.certifications?.length) {
		parts.push(
			"Certifications: " +
				profile.certifications.map((c) => c.name).join(", "),
		);
	}

	return parts.join(". ");
}

/**
 * Generate text representation of internship for NLP
 * @param {Object} internship - Internship object
 * @returns {string} - Text representation
 */
function generateInternshipText(internship) {
	const parts = [];

	parts.push(internship.title);

	if (internship.description) {
		parts.push(internship.description);
	}

	if (internship.requiredSkills?.length) {
		parts.push("Required Skills: " + internship.requiredSkills.join(", "));
	}

	if (internship.domain) {
		parts.push("Domain: " + internship.domain);
	}

	if (internship.responsibilities?.length) {
		parts.push(
			"Responsibilities: " + internship.responsibilities.join(". "),
		);
	}

	return parts.join(". ");
}

/**
 * Force refresh of collaborative filtering model
 */
export async function refreshCollaborativeFiltering() {
	cfDataCache = null;
	cfLastUpdate = null;
	return await ensureCFData();
}

export default {
	getRecommendations,
	refreshCollaborativeFiltering,
};
